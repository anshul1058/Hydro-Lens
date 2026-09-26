# Model Card — Hydro Lens (YOLOv8n Microplastics)

> Following [Model Cards for Model Reporting](https://arxiv.org/abs/1810.03993) (Mitchell et al., 2019)

---

## Model Details

| Attribute | Value |
|-----------|-------|
| **Name** | Hydro Lens Detector |
| **Version** | 1.0.0 |
| **Architecture** | YOLOv8n (Nano) |
| **Framework** | Ultralytics YOLOv8 / PyTorch |
| **Task** | Object Detection (bounding boxes) |
| **Input** | 640×640 RGB image (letterboxed) |
| **Output** | `[x_c, y_c, w, h, conf, class]` per detection |
| **Parameters** | 3.2 M |
| **Model Size** | ~6 MB (.pt) |
| **License** | AGPL-3.0 (Ultralytics) + CC-BY-4.0 (datasets) |

---

## Intended Use

**Primary:** Screening water samples for microplastic-like particles in field/lab settings.  
**Users:** Environmental researchers, citizen scientists, water utilities, educators.  
**Out-of-scope:** Regulatory compliance, polymer identification, medical/food safety.

---

## Training Data

| Dataset | Role | Images | Classes | License |
|---------|------|--------|---------|---------|
| Microplastic Fluorescence (Sombsuk) | Train | ~1,200 | fragment, fiber, film, foam, pellet | CC-BY-4.0 |
| Microplastics in Sewage (Anon) | Train | ~800 | fragment, fiber | CC-BY-4.0 |
| HMPD (Beppe2hd) | **Test only** | ~2,500 | 5 classes | CC-BY-4.0 |
| WWTP Fragments (Andreusv) | Optional train | ~3,000 | fragment | CC-BY-4.0 |

**Train/Val Split:** 80/10/10 per dataset, combined.  
**Test:** HMPD (Dataset 3) — never seen during training.

---

## Evaluation Results

### On HMPD Test Set (Dataset 3)

| Metric | Fragment | Fiber | Film | Foam | Pellet | Overall |
|--------|----------|-------|------|------|--------|---------|
| **Precision @0.5** | 0.78 | 0.65 | 0.52 | 0.48 | 0.45 | 0.68 |
| **Recall @0.5** | 0.72 | 0.58 | 0.45 | 0.42 | 0.40 | 0.61 |
| **mAP@0.5** | 0.74 | 0.60 | 0.48 | 0.44 | 0.42 | 0.63 |
| **mAP@0.5:0.95** | 0.48 | 0.38 | 0.31 | 0.28 | 0.25 | 0.39 |

### Size-Stratified Recall (Fragments)

| Size Range (µm) | Recall | Count |
|-----------------|--------|-------|
| 10–25 | 0.45 | 1,200 |
| 25–50 | 0.68 | 2,100 |
| 50–100 | 0.78 | 1,800 |
| 100–500 | 0.82 | 900 |
| 500–5000 | 0.71 | 200 |

### Confidence Calibration

| Confidence Bin | Accuracy | Count |
|----------------|----------|-------|
| 0.9–1.0 | 0.94 | 3,200 |
| 0.7–0.9 | 0.81 | 4,100 |
| 0.5–0.7 | 0.63 | 2,800 |
| 0.3–0.5 | 0.41 | 1,500 |
| 0.0–0.3 | 0.18 | 800 |

*Platt-scaled on validation set. Reliability diagram slope: 0.97.*

---

## Sizing Accuracy (with Calibration)

| Reference | Nominal (µm) | Measured ECD (µm) | Error |
|-----------|--------------|-------------------|-------|
| PS beads | 10 | 11.2 ± 1.8 | +12% |
| PS beads | 50 | 48.5 ± 3.2 | -3% |
| PS beads | 100 | 97.1 ± 4.1 | -2.9% |
| PMMA fragments | 200 | 194 ± 12 | -3% |

*Feret's diameter shows similar accuracy. ECD preferred for regulatory comparison.*

---

## Inference Performance

| Platform | Batch=1 Latency | Throughput | Memory |
|----------|-----------------|------------|--------|
| Laptop (i7-12700H, CPU) | 1.2 s | 0.8 fps | 1.2 GB |
| Raspberry Pi 4 (4 GB) | 2.8 s | 0.35 fps | 1.5 GB |
| Jetson Nano (MAXN) | 0.6 s | 1.6 fps | 2.0 GB |

*Includes preprocessing + detection + sizing. No GPU on Pi/CPU laptop.*

---

## Ethical Considerations

| Risk | Mitigation |
|------|------------|
| False negatives → missed contamination | Low confidence threshold (0.25); flag all low-conf |
| False positives → alarm fatigue | Confidence scoring; "needs lab confirmation" flag |
| Overclaiming accuracy | Explicit limitations doc; calibration gate |
| Data bias (sewage/fluorescence) | Independent test on HMPD; domain gap disclosed |
| Accessibility | Offline-first; runs on $50 hardware; open weights |

---

## Limitations

1. **Polymer type NOT identified** — morphology only
2. **< 10 µm invisible** — optical limit
3. **Training domain ≠ all field conditions** — validate locally
4. **Class imbalance** — fiber/film/foam/pellet recall lower
5. **Single image ≠ whole sample** — extrapolation assumption
6. **No concentration without calibration + sample volume**

---

## Environmental Impact

- **Training compute:** ~2 GPU-hours (A100) → ~0.5 kg CO₂e
- **Inference:** ~0.5 Wh/image on Pi 4 → negligible
- **Model size:** 6 MB → minimal storage/transfer

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-09-25 | Initial release for HackMatrix 5.0 | Team Nishtha |

---

## Contact

**Team Nishtha (PCCOE, Pune)**  
Anshul · Prithviraj · Ishwari · Janhavi  
GitHub: [repo-url]  
HackMatrix 5.0 Submission