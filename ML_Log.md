# ML Development Log — Hydro Lens

Chronological log of ML work. Newest entries last.

---

## 2026-09-26 — Phase 2: Dataset Reality Check

Claims in `docs/` were verified against the actual datasets (4 downloaded by user into `data/raw/`):

| ID | Dataset | Verdict | Reason |
|----|---------|---------|--------|
| D1 | `sombsuk/dataset_microplastic` (fluorescence) | **Used** | YOLO boxes exist; classes are polymer types (ABS/Nylon/PE/PET/PS/PVC), license CC BY-NC-ND 4.0 |
| D2 | Sewage TFRecords | Skipped | Grid-format TFRecords, only fragment/fiber, no standard boxes |
| D3 | HMPD | Skipped | Classification patches, no bounding boxes |
| D4 | `andreusv/Microplastic-Fragments-WWTP-Dataset` | **Used** | Parquet, absolute xywh boxes, single class (category_id=1) |

**Decision:** train a **binary 1-class detector** (`particle`) first; collapse all boxes from D1+D4 to class 0. Post-hackathon: retrain 5-class morphology model with Roboflow datasets (see "After Hackathon" below).

## 2026-09-26 — Phase 2: Dataset Prep

- Created `.venv`, installed `requirements.txt`
- Fixed `.gitignore` (was garbled UTF-16) — added `__pycache__/`, `*.pyc`, `.venv/`
- Wrote `src/data/prepare.py`:
  - D1: extracts images from per-polymer zips + labels from `Alldataset_annotation.zip`, forces class id 0
  - D4: decodes parquet (train/validation/test), converts absolute xywh → normalized YOLO
  - D4's own `test` split held out as the test set; D1 split 90/10 train/val (seed 42)
- Output `data/processed/`: **3,709 train / 558 val / 301 test**, `data.yaml` with `nc: 1, names: {0: particle}`

## 2026-09-27 — Training (Mac, Apple M5 / MPS)

- First started 100 epochs, then switched to **40 epochs** (hackathon-speed decision)
- Command: `yolo detect train model=yolov8n.pt data=data/processed/data.yaml epochs=40 patience=10 batch=16 imgsz=640 device=mps seed=42`
- Finished all 40 epochs, ~3 min/epoch (~2 hrs total)
- Final train/val metrics (epoch 40): **P 0.88 · R 0.87 · mAP50 0.94 · mAP50-95 0.69**
- Weights: `runs/detect/runs/train/hydro_lens_v1/weights/best.pt` (5.9 MB)

## 2026-09-27 — Evaluation + Integration

- **Held-out test eval** (301 images, 852 instances):
  - **P 0.773 · R 0.776 · mAP50 0.846 · mAP50-95 0.676**
- Copied `best.pt` → `models/best.pt`; backend (`Detector`) now loads real weights (heuristic fallback no longer used)
- Sanity: real detections on test images (confidences 0.27–0.88), Streamlit boots HTTP 200, `pytest` **6/6 passed**
- `docs/MODEL_CARD.md` updated: placeholder metrics replaced with measured ones; unmeasured sections (size-stratified recall, calibration, sizing, hardware latency) explicitly marked PLACEHOLDER

## 2026-09-27 — Kaggle (parallel 100-epoch run)

- Uploaded `data/processed` as Kaggle dataset `anshuldod/hydro-lens-binary` (1.95 GB)
- Kaggle kernels have **no usable internet** — pip/GitHub downloads fail; fixed by bundling ultralytics wheels + `yolov8n.pt` as a second dataset (`anshuldod/hydro-lens-wheels`) and installing with `--no-index`
- Kernel `anshuldod/hydro-lens-yolo-offline` v6 running: 100 epochs, batch 16, T4 GPU, fully offline
- Purpose: free bonus — if its test mAP beats the Mac 40-epoch model, swap it into `models/`

---

## Decisions (locked)

### Decision 1 — Class name mismatch
- `config.yaml` has `classes: ["fragment","fiber","film","foam","pellet"]` but the binary model only outputs class 0, so detections are labeled "fragment" first; the aspect-ratio heuristic in `src/detect.py` then re-splits morphology downstream.
- **Resolution: leave as-is for the hackathon.** Output looks right to judges, heuristic corrects it anyway.
- **Must change to match the 5-class `data.yaml` exactly (name AND order) at the 5-class retrain** — wrong order = every detection gets the wrong morphology label.

### Decision 2 — Kaggle run
- Redundant to the finished Mac run, but free.
- **Resolution: leave it running.** Laptop lid can be closed — training happens on Google's servers; only new runs need the laptop awake. Download + compare when done; swap weights only if measurably better.

---

## After Hackathon (the rest of the roadmap)

1. **5-class retrain** — 5 Roboflow datasets **decided**: `newmp` (5k, all 5 classes), `all plastic` (7k), `mp-segmentation-jp` (1.5k), `microplastic-final` (398, CC BY), `Microplastic Annotations` (226, CC BY). Full table + class-merge map: `docs/DATASET.md` → "Post-Hackathon 5-Class Retrain". Update `config.yaml` classes to match new `data.yaml` (Decision 1 above)
2. Confidence calibrator (Platt scaling → `calibrator.pkl`)
3. Size-stratified recall eval (fill the PLACEHOLDER table in MODEL_CARD)
4. ONNX export for Raspberry Pi / edge deployment
5. Verify sizing accuracy with calibration beads (fill PLACEHOLDER table)

---

## 2026-09-27 — 5-Class Retrain: Roboflow dataset links

Full table + class-merge map: `docs/DATASET.md` → "Post-Hackathon 5-Class Retrain".

| # | Dataset | Images | Link |
|---|---------|--------|------|
| R1 | newmp (Univ. of Alabama) | 5,000 | search: https://universe.roboflow.com/search?q=newmp |
| R2 | all plastic | 7,050 | search: https://universe.roboflow.com/search?q=all+plastic |
| R3 | mp-segmentation-jp (Johann Catalla) | 1,540 | search: https://universe.roboflow.com/search?q=mp-segmentation-jp |
| R4 | microplastic-final (CC BY 4.0) | 398 | https://universe.roboflow.com/project-aunby/microplastic-final-kpdl3 |
| R5 | Microplastic Annotations (CC BY 4.0) | 226 | https://universe.roboflow.com/microplastic-annotations/microplastic-annotations-n1y9l |

- **R1–R3 are search links, not direct** — Roboflow returns 503 to non-browser fetchers, so project slugs were not verified. Open each search link, copy the real URL, replace the link above.
- Verified alternative for the Alabama set (MIT, 1,711 img, dirt/fiber/fragment/pellet): https://universe.roboflow.com/university-of-alabama-zwtwm/microplastic-detection
- Licenses for R1–R3 still *verify at download*; R4/R5 confirmed CC BY 4.0.
