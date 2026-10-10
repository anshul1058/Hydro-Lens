"""
Addition 1 evidence demo: nominal vs degraded capture conditions.

Runs the real detection pipeline on the demo reference image under documented
transformations and writes before/after results to evidence/addition1/.

Usage (from repo root):  python scripts/demo_capture_conditions.py
"""
import os
import sys
import json
import time
import numpy as np
import cv2

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import yaml
from src.preprocess import load_image_rgb
from src.quality import assess_capture_quality
from src.detect import Detector
from src.size import compute_particle_sizes
from src.calibrate import CalibrationManager
from src.confidence import compute_sample_confidence

REF = "data/reference/demo_microplastic_sample.jpg"
BLANK = "data/reference/blank_filter_control.png"
OUT_DIR = os.path.join("evidence", "addition1")


def load_config():
    with open("config.yaml") as f:
        return yaml.safe_load(f)


def analyze(img, detector, cal_record, cal_quality, cfg, cal_override=None):
    t0 = time.time()
    cal = cal_override if cal_override is not None else cal_record
    report = assess_capture_quality(img, cal, cal_quality, cfg)
    raw = detector.predict(img)
    um_per_px = cal.get("factor_um_per_px") if (cal and cal_quality > 0.0) else None
    sized = compute_particle_sizes(img, raw, um_per_px=um_per_px, config=cfg)
    conf, needs_lab, final_dets, flags, breakdown = compute_sample_confidence(
        detections=sized,
        calibration=cal_record if (cal_record and cal_quality > 0.0) else None,
        image_shape=img.shape[:2],
        config=cfg,
    )
    quantitative = cal_quality == 1.0 and report["status"] != "REJECTED" and um_per_px is not None
    ecds = [d["size_um"]["ecd"] for d in final_dets if d.get("size_um", {}).get("ecd") is not None]
    return {
        "measurement_status": report["status"],
        "failed_gates": [g for g in report["gates"] if not g["passed"]],
        "quality_metrics": report["metrics"],
        "particle_count": len(final_dets),
        "mean_ecd_um": round(float(np.mean(ecds)), 2) if (ecds and quantitative) else None,
        "size_distribution_reported": quantitative,
        "concentration": None,  # always null: concentration requires documented ref process
        "needs_lab_confirmation": needs_lab,
        "latency_sec": round(time.time() - t0, 3),
    }


def main():
    cfg = load_config()
    weights = cfg.get("model", {}).get("weights_path", "models/best.pt")
    detector = Detector(weights_path=weights, config=cfg)

    cal_mgr = CalibrationManager(
        cal_file=cfg.get("paths", {}).get("calibration_file", "data/calibration/calibration.json"),
        config=cfg,
    )
    cal_record = cal_mgr.load()
    _, _, cal_quality = cal_mgr.is_valid(cal_record)

    base = load_image_rgb(REF)

    # Documented transformations simulating capture-condition changes
    variants = {
        "nominal": base,
        "defocus_blur": cv2.GaussianBlur(base, (31, 31), 12),
        "underexposed": (base.astype(np.float32) * 0.2).clip(0, 255).astype(np.uint8),
        "overexposed_washout": (base.astype(np.float32) * 1.8).clip(0, 255).astype(np.uint8),
        "flat_field_low_contrast": (
            base.astype(np.float32) * 0.08 + 120
        ).clip(0, 255).astype(np.uint8),
        # zoom x2 without recalibration: pixels are 2x finer than the calibrated factor
        "scale_mismatch_2x_zoom": cv2.resize(base, None, fx=2.0, fy=2.0),
    }

    results = {}
    os.makedirs(OUT_DIR, exist_ok=True)

    print(f"Model: {weights} (fallback={detector.fallback_mode})")
    print(f"Calibration quality: {cal_quality} (factor={cal_record.get('factor_um_per_px') if cal_record else None} um/px)\n")

    for name, img in variants.items():
        res = analyze(img, detector, cal_record, cal_quality, cfg)
        results[name] = res
        cv2.imwrite(
            os.path.join(OUT_DIR, f"{name}.jpg"),
            cv2.cvtColor(img, cv2.COLOR_RGB2BGR),
        )
        gates = ", ".join(g["name"] for g in res["failed_gates"]) or "none"
        print(
            f"{name:28s} status={res['measurement_status']:8s} "
            f"count={res['particle_count']:3d} mean_ecd_um={res['mean_ecd_um']} "
            f"failed_gates=[{gates}]"
        )

    # Scale gate: calibration factor outside supported range (e.g. wrong magnification set)
    if cal_record:
        bad_cal = dict(cal_record, factor_um_per_px=5.0)
        res = analyze(base, detector, bad_cal, cal_quality, cfg, cal_override=bad_cal)
        results["scale_factor_out_of_range"] = res
        gates = ", ".join(g["name"] for g in res["failed_gates"]) or "none"
        print(
            f"{'scale_factor_out_of_range':28s} status={res['measurement_status']:8s} "
            f"count={res['particle_count']:3d} mean_ecd_um={res['mean_ecd_um']} "
            f"failed_gates=[{gates}]"
        )

    # Negative control: blank filter
    if os.path.exists(BLANK):
        blank = load_image_rgb(BLANK)
        res = analyze(blank, detector, cal_record, cal_quality, cfg)
        results["blank_filter_control"] = res
        cv2.imwrite(os.path.join(OUT_DIR, "blank_filter_control.jpg"), cv2.cvtColor(blank, cv2.COLOR_RGB2BGR))
        print(f"{'blank_filter_control':28s} status={res['measurement_status']:8s} count={res['particle_count']:3d}")

    with open(os.path.join(OUT_DIR, "results.json"), "w") as f:
        json.dump(
            {
                "model_weights": weights,
                "calibration_quality": cal_quality,
                "calibration_factor_um_per_px": cal_record.get("factor_um_per_px") if cal_record else None,
                "conditions": results,
            },
            f,
            indent=2,
        )

    # Markdown summary table
    lines = [
        "# Addition 1 — Capture-condition behavior (before vs after)",
        "",
        f"- Model: `{weights}`",
        f"- Calibration quality: `{cal_quality}` (factor {cal_record.get('factor_um_per_px') if cal_record else None} µm/px)",
        "- Concentration: never reported by this demo; it requires the documented reference/calibration process.",
        "",
        "| Condition | Status | Count | Mean ECD (µm) | Quantitative | Failed gates |",
        "|---|---|---|---|---|---|",
    ]
    for name, r in results.items():
        gates = ", ".join(g["name"] for g in r["failed_gates"]) or "—"
        lines.append(
            f"| {name} | {r['measurement_status']} | {r['particle_count']} "
            f"| {r['mean_ecd_um'] if r['mean_ecd_um'] is not None else '—'} "
            f"| {'yes' if r['size_distribution_reported'] else 'NO'} | {gates} |"
        )
    with open(os.path.join(OUT_DIR, "summary.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"\nEvidence written to {OUT_DIR}/")


if __name__ == "__main__":
    main()
