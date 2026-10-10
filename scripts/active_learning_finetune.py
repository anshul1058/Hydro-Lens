"""Phase 4 Step 3: fine-tune the production checkpoint on each acquired batch.

Identical hyperparameters for both batches; models/best.pt is only read,
never written. Output: training/active_learning_v1/runs/{uncertainty,random}.
"""
import json
import shutil
from pathlib import Path

import yaml as yamlio
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "training" / "active_learning_v1"
SRC_IMG = ROOT / "data" / "processed_multi" / "train" / "images"
SRC_LBL = ROOT / "data" / "processed_multi" / "train" / "labels"
CKPT = ROOT / "models" / "best.pt"
EPOCHS = 15


def build_dataset(method: str, names: list[str]) -> Path:
    indices = json.loads((OUT / "active_learning_indices.json").read_text())
    ds = OUT / f"data_{method}"
    (ds / "train" / "images").mkdir(parents=True, exist_ok=True)
    (ds / "train" / "labels").mkdir(parents=True, exist_ok=True)
    for name in indices[f"{method}_indices"]:
        shutil.copy2(SRC_IMG / name, ds / "train" / "images" / name)
        lbl = SRC_LBL / (Path(name).stem + ".txt")
        if lbl.exists():
            shutil.copy2(lbl, ds / "train" / "labels" / lbl.name)
    data_yaml = ds / "data.yaml"
    data_yaml.write_text(
        yamlio.safe_dump(
            {
                "train": (ds / "train").as_posix(),
                "val": (ds / "train").as_posix(),
                "names": names,
            }
        )
    )
    return data_yaml


def main():
    cfg = yamlio.safe_load((ROOT / "config.yaml").read_text(encoding="utf-8"))
    names = cfg["model"]["classes"]
    for method in ("uncertainty", "random"):
        data = build_dataset(method, names)
        print(f"=== fine-tune: {method} ===")
        YOLO(str(CKPT)).train(
            data=str(data),
            epochs=EPOCHS,
            imgsz=640,
            batch=16,
            workers=0,
            project=str(OUT / "runs"),
            name=method,
            exist_ok=True,
            plots=False,
            verbose=False,
        )
        print(f"done: {OUT / 'runs' / method / 'weights' / 'best.pt'}")


if __name__ == "__main__":
    main()
