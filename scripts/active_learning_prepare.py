"""Phase 4 Step 1: synthetic turbidity test set + active-learning candidate pool.

Turbidity = blur + Gaussian noise + brightness/contrast drop. Geometry is
unchanged, so original YOLO labels stay valid. Original test/ is untouched
and remains the retention set.
"""
import json
import random
import shutil
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data" / "processed_multi" / "test"
DST = ROOT / "data" / "processed_multi" / "test_turbid"
TRAIN_IMG = ROOT / "data" / "processed_multi" / "train" / "images"
OUT = ROOT / "training" / "active_learning_v1"

POOL_SIZE = 1000
SEED = 42


def turbid(img: np.ndarray, rng: random.Random) -> np.ndarray:
    k = rng.choice([5, 7])
    img = cv2.GaussianBlur(img, (k, k), 0)
    noise = np.random.default_rng(rng.randrange(1 << 30)).normal(
        0, rng.uniform(10, 25), img.shape
    )
    img = np.clip(img.astype(np.int16) + noise.astype(np.int16), 0, 255).astype(np.uint8)
    alpha = rng.uniform(0.6, 0.85)  # contrast
    beta = rng.uniform(-25, -10)  # brightness
    return np.clip(img.astype(np.float32) * alpha + beta, 0, 255).astype(np.uint8)


def main():
    rng = random.Random(SEED)
    if DST.exists():
        shutil.rmtree(DST)
    (DST / "images").mkdir(parents=True)
    (DST / "labels").mkdir(parents=True)

    images = sorted((SRC / "images").glob("*"))
    for p in images:
        img = cv2.imread(str(p))
        assert img is not None, p
        cv2.imwrite(str(DST / "images" / p.name), turbid(img, rng))
        lbl = SRC / "labels" / (p.stem + ".txt")
        if lbl.exists():
            shutil.copy2(lbl, DST / "labels" / lbl.name)
    print(f"test_turbid: {len(images)} images")

    pool = [p.name for p in sorted(TRAIN_IMG.glob("*"))]
    rng.shuffle(pool)
    pool = pool[:POOL_SIZE]
    (OUT / "pool.json").write_text(json.dumps(pool, indent=2))
    print(f"candidate pool: {len(pool)} -> {OUT / 'pool.json'}")


if __name__ == "__main__":
    main()
