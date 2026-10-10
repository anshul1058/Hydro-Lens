"""Phase 4 Step 2: acquisition — uncertainty (margin) vs random baseline.

Margin per image = top1 - top2 detection confidence at conf=0.001;
no detections -> margin 0 (max uncertainty). Uncertainty batch = B
smallest margins; random batch = seeded B from the same pool.
"""
import json
import random
from pathlib import Path

from ultralytics import YOLO

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "training" / "active_learning_v1"
CKPT = ROOT / "models" / "best.pt"
BUDGET = 50
SEED = 43
CONF = 0.001


def main():
    pool = json.loads((OUT / "pool.json").read_text())
    model = YOLO(str(CKPT))

    margins = {}
    for i, name in enumerate(pool):
        img = ROOT / "data" / "processed_multi" / "train" / "images" / name
        r = model.predict(str(img), conf=CONF, verbose=False)[0]
        confs = sorted((float(c) for c in r.boxes.conf), reverse=True)
        if not confs:
            margin = 0.0
        elif len(confs) == 1:
            margin = confs[0]
        else:
            margin = confs[0] - confs[1]
        margins[name] = round(margin, 6)
        if (i + 1) % 200 == 0:
            print(f"scored {i + 1}/{len(pool)}")

    uncertainty = sorted(margins, key=margins.get)[:BUDGET]
    rng = random.Random(SEED)
    random_batch = rng.sample(pool, BUDGET)

    result = {
        "budget": BUDGET,
        "pool_size": len(pool),
        "acquisition": "margin (top1 - top2 detection conf, conf=0.001; none -> 0)",
        "seed": SEED,
        "uncertainty_indices": uncertainty,
        "random_indices": random_batch,
        "margins": margins,
    }
    (OUT / "active_learning_indices.json").write_text(json.dumps(result, indent=2))
    print(f"wrote {OUT / 'active_learning_indices.json'}")
    print(f"uncertainty batch: {len(uncertainty)}, random batch: {len(random_batch)}")


if __name__ == "__main__":
    main()
