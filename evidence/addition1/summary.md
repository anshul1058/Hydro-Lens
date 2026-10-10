# Addition 1 — Capture-condition behavior (before vs after)

- Model: `models/best.pt`
- Calibration quality: `0.5` (factor 0.417 µm/px)
- Concentration: never reported by this demo; it requires the documented reference/calibration process.

| Condition | Status | Count | Mean ECD (µm) | Quantitative | Failed gates |
|---|---|---|---|---|---|
| nominal | DEFERRED | 3 | — | NO | calibration_freshness |
| defocus_blur | REJECTED | 4 | — | NO | sharpness, contrast, calibration_freshness |
| underexposed | REJECTED | 3 | — | NO | sharpness, contrast, calibration_freshness |
| overexposed_washout | REJECTED | 3 | — | NO | exposure, calibration_freshness |
| flat_field_low_contrast | REJECTED | 2 | — | NO | sharpness, contrast, calibration_freshness |
| scale_mismatch_2x_zoom | REJECTED | 3 | — | NO | sharpness, calibration_freshness |
| scale_factor_out_of_range | REJECTED | 3 | — | NO | scale_factor, calibration_freshness |
| blank_filter_control | REJECTED | 0 | — | NO | contrast, calibration_freshness |
