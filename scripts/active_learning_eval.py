"""Phase 4 Step 4-5: evaluate original vs fine-tuned checkpoints.

Conditions: test_turbid (new condition) and original test (retention).
Writes comparison.json and before/after confusion matrices to figures/.
"""
import json
import shutil
from pathlib import Path

import yaml as yamlio
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "training" / "active_learning_v1"
FIG = OUT / "figures"
FIG.mkdir(exist_ok=True)

CHECKPOINTS = {
    "original": ROOT / "models" / "best.pt",
    "uncertainty": OUT / "runs" / "uncertainty" / "weights" / "best.pt",
    "random": OUT / "runs" / "random" / "weights" / "best.pt",
}
TESTSETS = {
    "turbid": ROOT / "data" / "processed_multi" / "test_turbid",
    "clean": ROOT / "data" / "processed_multi" / "test",
}


def val_yaml(test_dir: Path, names: list[str]) -> Path:
    p = OUT / f"_val_{test_dir.name}.yaml"
    p.write_text(
        yamlio.safe_dump(
            {"train": test_dir.as_posix(), "val": test_dir.as_posix(), "names": names}
        )
    )
    return p


def main():
    cfg = yamlio.safe_load((ROOT / "config.yaml").read_text(encoding="utf-8"))
    names = cfg["model"]["classes"]
    yamls = {k: val_yaml(v, names) for k, v in TESTSETS.items()}

    results = {}
    for method, ckpt in CHECKPOINTS.items():
        model = YOLO(str(ckpt))
        results[method] = {}
        for cond, data in yamls.items():
            m = model.val(
                data=str(data),
                imgsz=640,
                plots=True,
                project=str(OUT / "figures"),
                name=f"{method}_{cond}",
                exist_ok=True,
                verbose=False,
            )
            per_class = {
                names[int(c)]: round(float(a), 4)
                for c, a in zip(m.box.ap_class_index, m.box.ap50)
            }
            results[method][cond] = {
                "precision": round(float(m.box.mp), 4),
                "recall": round(float(m.box.mr), 4),
                "mAP50": round(float(m.box.map50), 4),
                "mAP50-95": round(float(m.box.map), 4),
                "per_class_mAP50": per_class,
            }
            src = OUT / "figures" / f"{method}_{cond}" / "confusion_matrix_normalized.png"
            if src.exists():
                shutil.copy2(src, FIG / f"cm_{method}_{cond}.png")
            print(f"{method:12s} {cond:7s} mAP50={results[method][cond]['mAP50']}")

    comparison = {
        "results": results,
        "delta_mAP50_turbid": {
            k: round(results[k]["turbid"]["mAP50"] - results["original"]["turbid"]["mAP50"], 4)
            for k in ("uncertainty", "random")
        },
        "retention_delta_mAP50_clean": {
            k: round(results[k]["clean"]["mAP50"] - results["original"]["clean"]["mAP50"], 4)
            for k in ("uncertainty", "random")
        },
    }
    (OUT / "comparison.json").write_text(json.dumps(comparison, indent=2))
    print(json.dumps(comparison["delta_mAP50_turbid"], indent=2))
    print(json.dumps(comparison["retention_delta_mAP50_clean"], indent=2))
    print(f"wrote {OUT / 'comparison.json'}")


if __name__ == "__main__":
    main()
