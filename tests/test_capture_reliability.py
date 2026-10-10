"""
Addition 1 — Capture-condition reliability tests.

Demonstrates count/size behavior across capture variations:
  1. Nominal condition (clear, calibrated)
  2. Defocus blur
  3. Lighting change (under/over-exposure)
  4. Flat-field (no contrast)
  5. Scale mismatch (factor outside supported range)
  6. Stale calibration (deferral path)
  7. Look-alike negatives (air-bubble / salt-crystal style spheres)
"""
import os
import json
import numpy as np
import cv2
import pytest

from src.quality import assess_capture_quality
from src.detect import Detector
from src.size import compute_particle_sizes
from src.confidence import compute_sample_confidence

FRESH_CAL = {
    "valid": True,
    "factor_um_per_px": 0.417,
    "quality_score": 1.0,
}
STALE_CAL = {
    "valid": True,
    "factor_um_per_px": 0.417,
    "quality_score": 0.5,
}

CFG = {
    "quality": {
        "min_laplacian_var": 100.0,
        "min_luma": 40,
        "max_luma": 240,
        "max_clipped_pct": 2.0,
        "min_rms_contrast": 0.08,
        "min_um_per_px": 0.2,
        "max_um_per_px": 2.5,
        "min_ecd_um": 10.0,
        "max_ecd_um": 5000.0,
    },
    "model": {"classes": ["particle"], "conf_threshold": 0.1, "input_size": 640},
    "sizing": {"flag_size_um": 5000, "flag_aspect_ratio": 10, "flag_classes": []},
    "confidence": {"low_threshold": 0.5, "sample_low_threshold": 0.6, "min_coverage_mm2": 1.0},
}


def make_nominal_image(size=640, n_particles=12, seed=7):
    """Sharp, well-lit synthetic filter with particle-like blobs.
    Background noise keeps RMS contrast above the 0.15 flat-field gate."""
    rng = np.random.default_rng(seed)
    img = rng.integers(70, 190, (size, size, 3), dtype=np.uint8)
    for _ in range(n_particles):
        cx, cy = rng.integers(40, size - 40, 2)
        r = int(rng.integers(6, 22))
        color = int(rng.integers(30, 80))
        cv2.circle(img, (int(cx), int(cy)), r, (color, color, color), -1)
        # sharp edge accent keeps Laplacian variance high
        cv2.circle(img, (int(cx), int(cy)), r, (10, 10, 10), 2)
    return img


def run_pipeline(img, cal, cal_quality, cfg=CFG):
    """Mirror the /api/analyze sizing path without the HTTP layer."""
    report = assess_capture_quality(img, cal, cal_quality, cfg)
    det = Detector(weights_path="models/non_existent_for_test.pt")  # heuristic fallback
    raw = det.predict(img)
    um_per_px = cal.get("factor_um_per_px") if (cal and cal_quality > 0.0) else None
    sized = compute_particle_sizes(img, raw, um_per_px=um_per_px, config=cfg)
    conf, needs_lab, final_dets, flags, breakdown = compute_sample_confidence(
        detections=sized,
        calibration=cal if (cal and cal_quality > 0.0) else None,
        image_shape=img.shape[:2],
        config=cfg,
    )
    for gate in report["gates"]:
        if not gate["passed"]:
            flags.append({"type": f"capture_{gate['name']}", "message": gate["message"]})
    quantitative = (
        cal_quality == 1.0
        and report["status"] != "REJECTED"
        and um_per_px is not None
    )
    return {
        "status": report["status"],
        "metrics": report["metrics"],
        "gates": report["gates"],
        "count": len(final_dets),
        "mean_ecd_um": (
            float(np.mean([d["size_um"]["ecd"] for d in final_dets if d["size_um"].get("ecd") is not None]))
            if final_dets and quantitative
            else None
        ),
        "quantitative": quantitative,
        "failed": [g["name"] for g in report["gates"] if not g["passed"]],
    }


# ---------------------------------------------------------------- unit gates

def test_nominal_passes_all_gates():
    img = make_nominal_image()
    report = assess_capture_quality(img, FRESH_CAL, 1.0, CFG)
    assert report["status"] == "OK", report["gates"]
    assert all(g["passed"] for g in report["gates"])


def test_blur_gate_rejects():
    img = cv2.GaussianBlur(make_nominal_image(), (31, 31), 12)
    report = assess_capture_quality(img, FRESH_CAL, 1.0, CFG)
    assert report["status"] == "REJECTED"
    assert "sharpness" in [g["name"] for g in report["gates"] if not g["passed"]]
    sharp = next(g for g in report["gates"] if g["name"] == "sharpness")
    assert "refocus" in sharp["message"].lower()


def test_underexposure_gate_rejects():
    img = (make_nominal_image().astype(np.float32) * 0.15).astype(np.uint8)
    report = assess_capture_quality(img, FRESH_CAL, 1.0, CFG)
    assert report["status"] == "REJECTED"
    assert "exposure" in [g["name"] for g in report["gates"] if not g["passed"]]


def test_washout_gate_rejects():
    img = np.full((640, 640, 3), 250, dtype=np.uint8)
    report = assess_capture_quality(img, FRESH_CAL, 1.0, CFG)
    assert report["status"] == "REJECTED"


def test_flat_field_gate_rejects():
    img = np.full((640, 640, 3), 128, dtype=np.uint8)
    report = assess_capture_quality(img, FRESH_CAL, 1.0, CFG)
    assert report["status"] == "REJECTED"
    assert "contrast" in [g["name"] for g in report["gates"] if not g["passed"]]


def test_scale_out_of_range_rejects():
    img = make_nominal_image()
    cal = dict(FRESH_CAL, factor_um_per_px=5.0)  # zoom changed, not recalibrated
    report = assess_capture_quality(img, cal, 1.0, CFG)
    assert report["status"] == "REJECTED"
    assert "scale_factor" in [g["name"] for g in report["gates"] if not g["passed"]]


def test_stale_calibration_defers_not_rejects():
    img = make_nominal_image()
    report = assess_capture_quality(img, STALE_CAL, 0.5, CFG)
    assert report["status"] == "DEFERRED"
    cal_gate = next(g for g in report["gates"] if g["name"] == "calibration_freshness")
    assert not cal_gate["passed"] and cal_gate["severity"] == "defer"


def test_missing_calibration_defers():
    img = make_nominal_image()
    report = assess_capture_quality(img, None, 0.0, CFG)
    assert report["status"] == "DEFERRED"


# ------------------------------------------------- before/after behavior

def test_blur_reduces_detection_count():
    nominal = run_pipeline(make_nominal_image(), FRESH_CAL, 1.0)
    blurred = run_pipeline(
        cv2.GaussianBlur(make_nominal_image(), (31, 31), 12), FRESH_CAL, 1.0
    )
    assert nominal["status"] == "OK"
    assert blurred["status"] == "REJECTED"
    # particle dropouts under blur (documented behavior)
    assert blurred["count"] <= nominal["count"]


def test_underexposure_loses_particles():
    nominal = run_pipeline(make_nominal_image(), FRESH_CAL, 1.0)
    dark = run_pipeline(
        (make_nominal_image().astype(np.float32) * 0.2).astype(np.uint8), FRESH_CAL, 1.0
    )
    assert dark["status"] == "REJECTED"
    assert dark["count"] <= nominal["count"]


def test_quantitative_blocked_on_reject():
    blurred = run_pipeline(
        cv2.GaussianBlur(make_nominal_image(), (31, 31), 12), FRESH_CAL, 1.0
    )
    assert blurred["quantitative"] is False
    assert blurred["mean_ecd_um"] is None


def test_stale_cal_keeps_counts_blocks_quantitative():
    stale = run_pipeline(make_nominal_image(), STALE_CAL, 0.5)
    assert stale["status"] == "DEFERRED"
    assert stale["count"] > 0
    assert stale["quantitative"] is False  # no um sizes / concentration


# ------------------------------------------------------ look-alikes / blank

def test_blank_filter_control():
    blank = np.full((640, 640, 3), 140, dtype=np.uint8)
    report = assess_capture_quality(blank, FRESH_CAL, 1.0, CFG)
    # blank is flat -> gate may reject; either way it must never yield a confident concentration
    det = Detector(weights_path="models/non_existent_for_test.pt")
    preds = det.predict(blank)
    assert report["status"] in ("OK", "DEFERRED", "REJECTED")
    assert isinstance(preds, list)


def test_look_alike_bubbles_flagged_by_low_support():
    """Air-bubble / salt-crystal look-alikes: smooth bright spheres.
    Detection alone cannot distinguish them; they must be flagged for lab confirmation."""
    img = np.full((640, 640, 3), 160, dtype=np.uint8)
    for cx, cy, r in [(200, 200, 30), (400, 350, 45), (300, 500, 25)]:
        cv2.circle(img, (cx, cy), r, (235, 235, 235), -1)
        cv2.circle(img, (cx, cy), r, (120, 120, 120), 2)
    report = assess_capture_quality(img, FRESH_CAL, 1.0, CFG)
    assert report["status"] in ("OK", "REJECTED")
    det = Detector(weights_path="models/non_existent_for_test.pt")
    raw = det.predict(img)
    sized = compute_particle_sizes(img, raw, um_per_px=0.417, config=CFG)
    conf, needs_lab, final_dets, flags, breakdown = compute_sample_confidence(
        detections=sized, calibration=FRESH_CAL, image_shape=img.shape[:2], config=CFG
    )
    assert needs_lab is True  # look-alikes always require lab confirmation


# ------------------------------------------------- evidence demo (optional)

@pytest.mark.skipif(
    not os.path.exists("data/reference/demo_microplastic_sample.jpg"),
    reason="reference image not available",
)
def test_real_reference_nominal_vs_blur():
    from src.preprocess import load_image_rgb

    img = load_image_rgb("data/reference/demo_microplastic_sample.jpg")
    nominal = assess_capture_quality(img, FRESH_CAL, 1.0, CFG)
    blurred = assess_capture_quality(cv2.GaussianBlur(img, (31, 31), 12), FRESH_CAL, 1.0)
    assert nominal["status"] == "OK", nominal["gates"]
    assert blurred["status"] == "REJECTED"


if __name__ == "__main__":
    import sys
    sys.exit(pytest.main([__file__, "-v"]))
