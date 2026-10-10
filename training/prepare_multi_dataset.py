"""
Phase 2 — Roboflow ingestion & cleanup (R2, R4, R5).

- R2 (r2_all_plastic): standard YOLO HBB, classes [dirt, fiber, fragment, pellet]
- R4 (r4_microplastic_final): YOLOv8-OBB (9 cols) -> axis-aligned HBB, classes [fiber, film, fragment, pellet]
- R5 (r5_microplastic_annotations): 11 typo classes -> canonical 5 (unused_ambiguous_198/ excluded: no data.yaml)

Canonical classes (matches config.yaml):
  0 fragment, 1 fiber, 2 film, 3 foam, 4 pellet   (dirt dropped)

Leakage prevention: augmented derivatives of one original image share a
Roboflow stem ('<name>_jpg.rf.<hash>'); all derivatives of a stem (plus any
byte-identical files across sources) form one group, and whole groups are
assigned to exactly one split (85/10/5 train/val/test).

Output: data/processed_multi/{train,val,test}/{images,labels} + data.yaml
        + data/processed_multi/manifest.json

Usage (repo root):  python training/prepare_multi_dataset.py
"""
import os
import json
import shutil
import hashlib
import numpy as np
from collections import defaultdict

RAW = "data/raw/roboflow"
OUT = "data/processed_multi"

CANON_NAMES = ["fragment", "fiber", "film", "foam", "pellet"]

# R2: [dirt, fiber, fragment, pellet] -> canonical (dirt dropped)
R2_MAP = {1: 1, 2: 0, 3: 4}  # fiber->fiber, fragment->fragment, pellet->pellet; 0 dirt dropped
# R4 OBB: [fiber, film, fragment, pellet] -> canonical
R4_MAP = {0: 1, 1: 2, 2: 0, 3: 4}
# R5: 11-class name order from its data.yaml
R5_NAMES = ["Fiber", "Film", "Foam", "Fragment", "Fragmnet", "Pellet",
            "fiber", "filber", "film", "foam", "pellet"]
R5_NAME_TO_CANON = {
    "fiber": 1, "filber": 1, "Fiber": 1,
    "fragment": 0, "Fragmnet": 0, "Fragment": 0,
    "film": 2, "Film": 2,
    "foam": 3, "Foam": 3,
    "pellet": 4, "Pellet": 4,
}
R5_MAP = {i: R5_NAME_TO_CANON[n] for i, n in enumerate(R5_NAMES) if n in R5_NAME_TO_CANON}

SPLIT_RATIOS = (0.85, 0.10, 0.05)  # train, val, test


def norm_stem(filename):
    """Roboflow augmented derivatives: '<stem>_jpg.rf.<hash>.jpg' -> '<stem>'.
    Groups every augmented/re-encoded version of one original image."""
    stem = os.path.splitext(filename)[0]
    if ".rf." in stem:
        stem = stem.split(".rf.")[0]
    for suf in ("_jpg", "_png", "_jpeg", "_webp", "_tif", "_tiff", "_bmp"):
        if stem.endswith(suf):
            stem = stem[: -len(suf)]
            break
    return stem


def read_yolo_label(path):
    rows = []
    if not os.path.exists(path):
        return rows
    with open(path) as f:
        for line in f:
            parts = line.strip().split()
            if parts:
                rows.append(parts)
    return rows


def convert_obb_to_hbb(parts):
    """9 cols: cls x1 y1 x2 y2 x3 y3 x4 y4 (normalized) -> cls xc yc w h"""
    cls = parts[0]
    coords = list(map(float, parts[1:9]))
    xs = coords[0::2]
    ys = coords[1::2]
    x1, x2 = min(xs), max(xs)
    y1, y2 = min(ys), max(ys)
    xc, yc = (x1 + x2) / 2, (y1 + y2) / 2
    return [cls, f"{xc:.6f}", f"{yc:.6f}", f"{x2 - x1:.6f}", f"{y2 - y1:.6f}"]


def collect_sources():
    """Yield (source, split, image_path, label_path, class_map, is_obb)."""
    specs = [
        ("r2_all_plastic", ["train", "valid", "test"], R2_MAP, False),
        ("r4_microplastic_final", ["train", "valid", "test"], R4_MAP, True),
        ("r5_microplastic_annotations", ["train"], R5_MAP, False),
    ]
    for ds, splits, cmap, obb in specs:
        for sp in splits:
            img_dir = os.path.join(RAW, ds, sp, "images")
            lbl_dir = os.path.join(RAW, ds, sp, "labels")
            if not os.path.isdir(img_dir):
                continue
            for fn in sorted(os.listdir(img_dir)):
                if fn.lower().endswith((".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff")):
                    yield ds, sp, os.path.join(img_dir, fn), os.path.join(lbl_dir, os.path.splitext(fn)[0] + ".txt"), cmap, obb


def main():
    print("Collecting images; grouping augmented derivatives of one original image...")
    items = []  # dicts
    for i, (ds, sp, ipath, lpath, cmap, obb) in enumerate(collect_sources()):
        # Skip full image decode; hashes only needed as exact-duplicate safety net
        items.append({
            "source": ds, "src_split": sp, "img": ipath, "lbl": lpath,
            "map": cmap, "obb": obb,
            "group_key": f"{ds}::{norm_stem(os.path.basename(ipath))}",
        })

    # Group 1: same source + normalized stem (catches .rf. augmentations)
    groups = defaultdict(list)
    for i, it in enumerate(items):
        groups[it["group_key"]].append(i)

    # Group 2 (safety net): merge groups whose images are byte-identical
    by_digest = defaultdict(list)
    for i, it in enumerate(items):
        with open(it["img"], "rb") as f:
            digest = hashlib.sha1(f.read(65536)).hexdigest()  # 64KB head: fast, near-exact
        by_digest[digest].append(i)
    parent = {k: k for k in groups}

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    for digest, idxs in by_digest.items():
        keys = {items[i]["group_key"] for i in idxs}
        keys = list(keys)
        for k in keys[1:]:
            union(keys[0], k)

    merged = defaultdict(list)
    for i, it in enumerate(items):
        merged[find(it["group_key"])].append(i)
    print(f"{len(items)} images -> {len(merged)} original-image groups")

    # Assign whole groups to splits by cumulative size
    group_list = sorted(merged.values(), key=lambda g: -len(g))
    rng = np.random.default_rng(42)
    rng.shuffle(group_list)
    targets = [r * len(items) for r in SPLIT_RATIOS]
    counts = [0, 0, 0]
    for g in group_list:
        k = int(np.argmin([counts[t] / max(targets[t], 1) for t in range(3)]))
        for i in g:
            items[i]["split"] = ("train", "val", "test")[k]
            counts[k] += 1
    print(f"split sizes (train/val/test): {counts}")

    # Write output
    for sp in ("train", "val", "test"):
        os.makedirs(os.path.join(OUT, sp, "images"), exist_ok=True)
        os.makedirs(os.path.join(OUT, sp, "labels"), exist_ok=True)

    manifest = []
    skipped_boxes = 0
    kept_boxes = 0
    for i, it in enumerate(items):
        split = it["split"]
        base = f"{it['source']}__{os.path.splitext(os.path.basename(it['img']))[0]}"
        ext = os.path.splitext(it["img"])[1]
        dst_img = os.path.join(OUT, split, "images", base + ext)
        shutil.copy2(it["img"], dst_img)

        rows = read_yolo_label(it["lbl"])
        out_rows = []
        for parts in rows:
            if it["obb"]:
                parts = convert_obb_to_hbb(parts)
            try:
                old_cls = int(parts[0])
            except ValueError:
                skipped_boxes += 1
                continue
            if old_cls not in it["map"]:
                skipped_boxes += 1  # dirt / unknown dropped
                continue
            new_cls = it["map"][old_cls]
            out_rows.append(f"{new_cls} " + " ".join(parts[1:5]))
            kept_boxes += 1

        dst_lbl = os.path.join(OUT, split, "labels", base + ".txt")
        with open(dst_lbl, "w") as f:
            f.write("\n".join(out_rows) + ("\n" if out_rows else ""))

        manifest.append({
            "image": os.path.relpath(dst_img, OUT),
            "source": it["source"],
            "source_split": it["src_split"],
            "group_id": find(it["group_key"]),
            "split": split,
            "n_boxes": len(out_rows),
        })

    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump({
            "canonical_names": CANON_NAMES,
            "split_ratios": {"train": SPLIT_RATIOS[0], "val": SPLIT_RATIOS[1], "test": SPLIT_RATIOS[2]},
            "grouping": {"method": "Roboflow .rf. stem grouping + 64KB head digest merge"},
            "sources": ["r2_all_plastic", "r4_microplastic_final (OBB->HBB)", "r5_microplastic_annotations (11->5 classes)"],
            "excluded": ["r5_microplastic_annotations/unused_ambiguous_198 (no data.yaml, unknown class scheme)"],
            "boxes_kept": kept_boxes,
            "boxes_dropped": skipped_boxes,
            "images": manifest,
        }, f, indent=2)

    with open(os.path.join(OUT, "data.yaml"), "w") as f:
        f.write(f"path: {os.path.abspath(OUT)}\n")
        f.write("train: train/images\nval: val/images\ntest: test/images\n")
        f.write(f"nc: {len(CANON_NAMES)}\n")
        f.write("names:\n")
        for i, n in enumerate(CANON_NAMES):
            f.write(f"  {i}: {n}\n")

    per_source = defaultdict(int)
    for m in manifest:
        per_source[m["source"]] += 1
    print(f"boxes kept={kept_boxes} dropped(dirt/invalid)={skipped_boxes}")
    print("per source:", dict(per_source))
    print(f"Wrote {OUT}/ with data.yaml + manifest.json")


if __name__ == "__main__":
    main()
