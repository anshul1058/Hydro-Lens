import cv2
import numpy as np
from typing import Any, Dict, List, Optional

DEFAULT_QUALITY_CFG = {
    "min_laplacian_var": 100.0,
    "min_luma": 40,
    "max_luma": 240,
    "max_clipped_pct": 2.0,
    "min_rms_contrast": 0.08,
    "min_um_per_px": 0.2,
    "max_um_per_px": 2.5,
    "min_ecd_um": 10.0,
    "max_ecd_um": 5000.0,
}


def assess_capture_quality(
    orig_rgb: np.ndarray,
    calibration: Optional[Dict[str, Any]],
    cal_quality: float,
    config: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Evaluates capture-condition reliability on the ORIGINAL (pre-CLAHE) image.

    status:
      OK        - all gates passed, quantitative results valid
      DEFERRED  - image is fine but calibration is stale/missing; counts OK,
                  quantitative sizes/concentration deferred
      REJECTED  - capture conditions outside supported range; sizing and
                  concentration unreliable

    Returns: {"status", "metrics", "gates"} where each gate is
      {"name", "passed", "severity": "reject"|"defer", "value", "limit", "message"}
    """
    qcfg = {**DEFAULT_QUALITY_CFG, **(config or {}).get("quality", {})}

    gray = cv2.cvtColor(orig_rgb, cv2.COLOR_RGB2GRAY) if orig_rgb.ndim == 3 else orig_rgb

    # --- Metrics (computed on raw capture, before CLAHE) ---
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    luma_mean = float(np.mean(gray))
    clipped_pct = float(np.mean((gray < 15) | (gray > 245)) * 100.0)
    # RMS contrast over "signal" pixels (below near-white) so brightfield
    # backgrounds don't mask flat-field captures
    signal = gray[gray < 235]
    if signal.size >= 0.01 * gray.size:
        rms_contrast = float(np.std(signal)) / 255.0
    else:
        rms_contrast = 0.0  # fully washed image: no signal region at all

    factor = None
    if calibration and cal_quality > 0.0:
        factor = calibration.get("factor_um_per_px")

    metrics = {
        "sharpness_laplacian_var": round(laplacian_var, 2),
        "luma_mean": round(luma_mean, 2),
        "clipped_pct": round(clipped_pct, 3),
        "rms_contrast": round(rms_contrast, 4),
        "factor_um_per_px": factor,
    }

    gates: List[Dict[str, Any]] = []

    def add_gate(name, passed, severity, value, limit, fail_msg=""):
        gates.append({
            "name": name,
            "passed": passed,
            "severity": severity,
            "value": value,
            "limit": limit,
            "message": "OK" if passed else fail_msg,
        })

    # --- Image capture gates (severity: reject) ---
    add_gate(
        "sharpness",
        laplacian_var >= qcfg["min_laplacian_var"],
        "reject",
        metrics["sharpness_laplacian_var"],
        f">= {qcfg['min_laplacian_var']}",
        f"Severe optical blur detected (Laplacian variance {metrics['sharpness_laplacian_var']:.1f} "
        f"< {qcfg['min_laplacian_var']}). Particle perimeter extraction and sizing are unreliable. Please refocus.",
    )
    add_gate(
        "exposure",
        qcfg["min_luma"] <= luma_mean <= qcfg["max_luma"] and clipped_pct <= qcfg["max_clipped_pct"],
        "reject",
        metrics["luma_mean"],
        f"{qcfg['min_luma']}..{qcfg['max_luma']} luma, <= {qcfg['max_clipped_pct']}% clipped",
        f"Lighting outside supported range (mean luminance {metrics['luma_mean']:.1f}, "
        f"clipped {metrics['clipped_pct']:.1f}%). Faint particles are lost or washed out. Adjust illumination.",
    )
    add_gate(
        "contrast",
        rms_contrast >= qcfg["min_rms_contrast"],
        "reject",
        metrics["rms_contrast"],
        f">= {qcfg['min_rms_contrast']}",
        f"Flat-field image (RMS contrast {metrics['rms_contrast']:.3f} < {qcfg['min_rms_contrast']}). "
        "Particle boundaries cannot be distinguished from background.",
    )

    # --- Scale gate (severity: reject) ---
    if factor is not None:
        scale_ok = qcfg["min_um_per_px"] <= factor <= qcfg["max_um_per_px"]
        add_gate(
            "scale_factor",
            scale_ok,
            "reject",
            factor,
            f"{qcfg['min_um_per_px']}..{qcfg['max_um_per_px']} um/px",
            f"Calibration factor {factor} um/px is outside the supported optical range "
            f"({qcfg['min_um_per_px']}-{qcfg['max_um_per_px']} um/px). Zoom/magnification likely changed "
            "since calibration. Recalibrate with a stage micrometer.",
        )

    # --- Calibration freshness gates (severity: defer) ---
    if cal_quality == 0.0:
        add_gate(
            "calibration_freshness", False, "defer", 0.0, "quality > 0",
            "Calibration missing or invalid. Counts are reported; micrometre sizes and "
            "concentration are deferred until the documented calibration process is completed.",
        )
    elif cal_quality < 1.0:
        add_gate(
            "calibration_freshness", False, "defer", cal_quality, "1.0 (active, <= 7 days)",
            "Calibration is stale (> 7 days old). Counts are reported; micrometre sizes and "
            "concentration are deferred. Recalibrate with a stage micrometer.",
        )
    else:
        add_gate("calibration_freshness", True, "defer", 1.0, "1.0 (active, <= 7 days)")

    # --- Status rollup ---
    if any(not g["passed"] and g["severity"] == "reject" for g in gates):
        status = "REJECTED"
    elif any(not g["passed"] for g in gates):
        status = "DEFERRED"
    else:
        status = "OK"

    return {"status": status, "metrics": metrics, "gates": gates}


def failed_gate_messages(quality_report: Dict[str, Any]) -> List[str]:
    return [g["message"] for g in quality_report["gates"] if not g["passed"]]
