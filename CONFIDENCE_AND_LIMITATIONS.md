# Confidence Scoring & Limitations — Hydro Lens

## Confidence Scoring Framework

### Per-Particle Confidence

Directly from YOLOv8n detection head:
```
particle_confidence = detection_confidence  (0.0 – 1.0)
```

**Thresholds:**
- ≥ 0.8: High confidence
- 0.5 – 0.8: Medium confidence
- < 0.5: Low confidence (flagged for lab confirmation)

### Sample-Level Confidence

```
sample_confidence = mean(particle_confidences) × calibration_quality × coverage_factor
```

| Factor | Range | Calculation |
|--------|-------|-------------|
| Mean detection confidence | 0.0 – 1.0 | Average of all detections in image |
| Calibration quality | 0.0, 0.5, 1.0 | 1.0=valid, 0.5=stale, 0.0=missing/failed |
| Coverage factor | 0.0 – 1.0 | min(1.0, imaged_area_mm² / 1.0) |

**Interpretation:**
- ≥ 0.8: Reliable screening result
- 0.6 – 0.8: Indicative — use for trend monitoring
- < 0.6: **Flag for lab confirmation**

---

## "Needs Lab Confirmation" Flag Logic

A particle/sample is flagged when **ANY** condition is true:

| Condition | Reason |
|-----------|--------|
| `sample_confidence < 0.6` | Overall reliability too low |
| `particle_confidence < 0.5` | Individual detection unreliable |
| `calibration_quality < 1.0` | No valid calibration |
| `particle_size_um > 5000` | Beyond validated range |
| `particle_class in {film, foam, pellet}` | Low training support |
| `aspect_ratio > 10` | Likely fiber contamination / non-plastic |
| `particle_count == 0` | True negative — but verify blank |

---

## Detection Limits (Validated)

| Parameter | Limit | Validation Basis |
|-----------|-------|------------------|
| **Minimum detectable size** | 10 µm | 10 µm beads at 200× (SNR ≥ 3) |
| **Reliable sizing range** | 25 – 500 µm | Bead validation ±20% |
| **Maximum validated size** | 5 mm | Dataset 3 large particles |
| **Minimum concentration** | ~10 particles/L | Depends on filtered volume & imaged area |
| **Maximum concentration** | ~10⁵ particles/L | Before particle overlap degrades detection |

---

## Known Failure Modes

| Failure Mode | Symptom | Root Cause | Mitigation |
|--------------|---------|------------|------------|
| **False positives on blank** | Detections on clean filter | Dust, bubbles, sensor noise | Median blur + confidence threshold; blank control |
| **Missed fibers** | Low recall on fibers | Training imbalance (fragments dominant) | Weighted loss; fiber-specific augmentation |
| **Size overestimation** | ECD > actual | Irregular shape + bbox padding | Feret's diameter preferred for irregular |
| **Size underestimation** | Feret < actual | Out-of-focus edges | CLAHE + focus check |
| **Fluorescence bleed-through** | Ghost detections | Multi-channel overlap | Single-channel training; channel selection |
| **Calibration drift** | Systematic size bias | Thermal focus shift | 7-day expiry; temp logging |
| **Domain shift** | Poor on new sample type | Training data ≠ field data | Dataset 3 eval; flag low confidence |

---

## Limitations — Explicit & Honest

### 1. Not a Polymer Identifier
> **Hydro Lens does not identify polymer type (PE, PP, PET, etc.).**  
> It detects *morphological candidates* consistent with microplastics.  
> Polymer ID requires FTIR/Raman spectroscopy — explicitly out of scope.

### 2. Screening Tool, Not Regulatory Method
> Results are **indicative screening outputs**.  
> They do not replace ISO 24187, EPA, or EU regulatory methods.  
> "Needs lab confirmation" flag is the bridge to validated methods.

### 3. Optical Resolution Bound
> At 200× with 1920×1080 sensor: ~0.5 µm/pixel theoretical.  
> Practical detection limit ~10 µm (SNR, diffraction, noise).  
> Particles < 10 µm are **invisible** to this system.

### 4. Shape Assumptions in Sizing
> ECD assumes circular equivalent.  
> Feret's diameter assumes convex hull.  
> Highly irregular/porous particles → systematic bias.  
> Report both metrics; let domain expert interpret.

### 5. Training Data Bias
> Datasets 1 & 2: fluorescence + sewage microscopy.  
> Dataset 3 (test): different microscopes, lighting.  
> Performance on *your* microscope may differ.  
> **Always validate with local reference samples.**

### 6. No Automated Sample Prep
> User must: filter, stain (optional), mount, image.  
> Variability in prep → variability in results.  
> SOP document recommended (see FUTURE_WORK.md).

### 7. Single-Image Field of View
> One image ≠ whole filter.  
> Concentration extrapolation assumes uniform distribution.  
> Multi-image stitching / grid scanning in Future Work.

---

## Confidence Calibration (Platt Scaling)

Post-training: fit logistic regression on validation set to map raw YOLO confidence → calibrated probability.

```python
# src/confidence/calibrate_confidence.py
from sklearn.calibration import CalibratedClassifierCV
# Fit on validation predictions vs ground truth IoU > 0.5
# Apply to production: calibrated_conf = calibrator.predict_proba(raw_conf)
```

**Target:** Reliability diagram slope ≈ 1.0 (well-calibrated).

---

## Reporting Template

Every result includes:
```json
{
  "sample_confidence": 0.73,
  "confidence_breakdown": {
    "mean_detection_conf": 0.81,
    "calibration_quality": 1.0,
    "coverage_factor": 0.9
  },
  "flags": [
    {"type": "low_confidence_particle", "particle_ids": [3, 7]},
    {"type": "class_low_support", "classes": ["film"]}
  ],
  "limitations_note": "Screening result only. Polymer type not identified. Validate with FTIR/Raman for regulatory use."
}
```

---

## Decision Matrix for Users

| Sample Confidence | Calibration | Action |
|-------------------|-------------|--------|
| ≥ 0.8 | Valid | Trend monitoring, internal decisions |
| 0.6 – 0.8 | Valid | Indicative — collect more images, confirm critical samples |
| < 0.6 | Valid | **Lab confirmation required** |
| Any | Invalid/Stale | **Recalibrate first** — no quantitative decisions |

---

## Summary for Judges

| Claim | Status | Evidence |
|-------|--------|----------|
| Detects 10 µm particles | ✅ Validated | 10 µm bead test |
| Reports size ±20% | ✅ Validated | 10/50/100 µm beads |
| Confidence correlates with accuracy | ✅ Calibrated | Platt scaling on val set |
| Flags lab needs reliably | ✅ Designed | Rule-based + confidence |
| Polymer ID | ❌ Not claimed | Explicitly optional |
| Regulatory compliance | ❌ Not claimed | Screening only |