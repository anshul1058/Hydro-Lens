"""Phase 2: build binary (single-class) YOLO dataset from D1 + D4.

D1 (fluorescence, polymer labels) and D4 (WWTP, fragment labels) are both
collapsed to class 0 = "particle". D2/D3 are skipped (wrong format / no boxes).

Usage:  python -m src.data.prepare
Output: data/processed/{train,val,test}/{images,labels} + data/processed/data.yaml
"""

import io
import random
import zipfile
from pathlib import Path

import pandas as pd
import yaml
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed"

D1 = RAW / "d1_microplastic" / "dataset_microplastic-main"
D4 = RAW / "d4_wwpt"

CLASS_NAMES = ["particle"]
SEED = 42
random.seed(SEED)


def _write(name: str, img_bytes: bytes, lines: list[str], split: str):
    (OUT / split / "images").mkdir(parents=True, exist_ok=True)
    (OUT / split / "labels").mkdir(parents=True, exist_ok=True)
    (OUT / split / "images" / f"{name}.jpg").write_bytes(img_bytes)
    (OUT / split / "labels" / f"{name}.txt").write_text("\n".join(lines) + ("\n" if lines else ""))


def _binary_lines(yolo_rows: list[str]) -> list[str]:
    """Keep only geometry, force class id to 0."""
    out = []
    for row in yolo_rows:
        parts = row.split()
        if len(parts) != 5:
            continue
        _, xc, yc, w, h = parts
        try:
            vals = [float(v) for v in (xc, yc, w, h)]
        except ValueError:
            continue
        if not all(0 <= v <= 1 for v in vals) or vals[2] <= 0 or vals[3] <= 0:
            continue
        out.append(f"0 {xc} {yc} {w} {h}")
    return out


def prep_d1() -> tuple[int, int]:
    """Extract images + labels from D1 zips. Returns (train, val) counts."""
    ann_zip = D1 / "Alldataset_annotation.zip"
    labels: dict[str, list[str]] = {}
    with zipfile.ZipFile(ann_zip) as zf:
        for info in zf.infolist():
            if info.filename.endswith(".txt"):
                stem = Path(info.filename).stem
                text = zf.read(info).decode("utf-8", errors="ignore")
                labels[stem] = [ln for ln in text.splitlines() if ln.strip()]

    pairs = []  # (stem, img_bytes, lines)
    for zp in sorted(D1.glob("*.zip")):
        if zp.name == "Alldataset_annotation.zip":
            continue
        with zipfile.ZipFile(zp) as zf:
            for info in zf.infolist():
                if not info.filename.lower().endswith((".jpg", ".jpeg", ".png")):
                    continue
                stem = Path(info.filename).stem
                if stem not in labels:
                    continue
                lines = _binary_lines(labels[stem])
                if not lines:
                    continue
                pairs.append((stem, zf.read(info), lines))

    random.shuffle(pairs)
    n_val = max(1, int(len(pairs) * 0.1))
    val, train = pairs[:n_val], pairs[n_val:]
    for stem, img, lines in train:
        _write(f"d1_{stem.replace(' ', '_')}", img, lines, "train")
    for stem, img, lines in val:
        _write(f"d1_{stem.replace(' ', '_')}", img, lines, "val")
    return len(train), len(val)


def prep_d4() -> dict[str, int]:
    """Decode D4 parquet splits -> YOLO. D4's own test split stays held out."""
    counts = {}
    split_map = {
        "train": "train",
        "validation": "val",
        "test": "test",
    }
    for src, dst in split_map.items():
        n = 0
        for pf in sorted(D4.glob(f"{src}-*.parquet")):
            df = pd.read_parquet(pf)
            for i, row in df.iterrows():
                objs = row["objects"]
                lines = []
                img_w = img_h = None
                raw = row["image"]["bytes"]
                with Image.open(io.BytesIO(raw)) as im:
                    img_w, img_h = im.size
                    if im.mode != "RGB":
                        im = im.convert("RGB")
                    buf = io.BytesIO()
                    im.save(buf, format="JPEG")
                    raw = buf.getvalue()
                norm = []
                for bbox in objs["bbox"]:
                    x, y, w, h = [float(v) for v in bbox]  # absolute xywh
                    if w <= 0 or h <= 0 or img_w <= 0 or img_h <= 0:
                        continue
                    xc_n = (x + w / 2) / img_w
                    yc_n = (y + h / 2) / img_h
                    w_n = w / img_w
                    h_n = h / img_h
                    if not (0 <= xc_n <= 1 and 0 <= yc_n <= 1 and 0 < w_n <= 1 and 0 < h_n <= 1):
                        continue
                    norm.append(f"0 {xc_n:.6f} {yc_n:.6f} {w_n:.6f} {h_n:.6f}")
                if not norm:
                    continue
                name = f"d4_{Path(row['image'].get('path') or f'{src}_{i}').stem}_{i}"
                _write(name, raw, norm, dst)
                n += 1
        counts[dst] = counts.get(dst, 0) + n
    return counts


def main():
    print("D1 (fluorescence) ...")
    tr, va = prep_d1()
    print(f"  train={tr} val={va}")
    print("D4 (WWTP) ...")
    c = prep_d4()
    print(f"  {c}")

    data_yaml = {
        "path": str(OUT),
        "train": "train/images",
        "val": "val/images",
        "test": "test/images",
        "nc": 1,
        "names": {0: "particle"},
    }
    (OUT / "data.yaml").write_text(yaml.safe_dump(data_yaml, sort_keys=False))
    print(f"Wrote {OUT / 'data.yaml'}")


if __name__ == "__main__":
    main()
