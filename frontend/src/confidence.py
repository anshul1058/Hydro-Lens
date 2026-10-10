from typing import List, Dict, Any, Tuple, Optional
import numpy as np

def compute_sample_confidence(
    detections: List[Dict[str, Any]],
    calibration: Optional[Dict[str, Any]],
    image_shape: Tuple[int, int],
    config: Optional[Dict[str, Any]] = None
) -> Tuple[float, bool, List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
    """
    Computes sample-level confidence and evaluates 'needs_lab_confirmation' flags
    according to system specification and CONFIDENCE_AND_LIMITATIONS.md.

    Formula:
      sample_confidence = mean(detection_confidences) * calibration_quality * coverage_factor

    Returns:
      - sample_confidence: float (0.0 to 1.0)
      - flag_lab_confirmation: bool (true if any lab confirmation rule triggers)
      - enriched_detections: List of detections with per-particle needs_lab_confirmation flag
      - flags_list: List of active flag reasons
      - breakdown: Dict detailing mean_det_conf, calibration_quality, coverage_factor
    """
    if config is None:
        config = {
            "confidence": {
                "low_threshold": 0.5,
                "sample_low_threshold": 0.6,
                "min_coverage_mm2": 1.0
            },
            "sizing": {
                "flag_size_um": 5000,
                "flag_aspect_ratio": 10,
                "flag_classes": ["film", "foam", "pellet"]
            }
        }

    conf_cfg = config.get("confidence", {})
    sizing_cfg = config.get("sizing", {})

    low_det_thresh = conf_cfg.get("low_threshold", 0.5)
    sample_low_thresh = conf_cfg.get("sample_low_threshold", 0.6)
    min_coverage_mm2 = conf_cfg.get("min_coverage_mm2", 1.0)

    flag_size_um = sizing_cfg.get("flag_size_um", 5000)
    flag_aspect_ratio = sizing_cfg.get("flag_aspect_ratio", 10)
    flag_classes = set(sizing_cfg.get("flag_classes", ["film", "foam", "pellet"]))

    # 1. Calibration Quality
    if calibration is None:
        cal_quality = 0.0
        cal_valid = False
        um_per_px = None
    else:
        cal_valid = calibration.get("valid", False)
        # Check staleness or validity
        if not cal_valid:
            cal_quality = 0.0
        else:
            quality = calibration.get("quality_score", 1.0)
            cal_quality = quality
        um_per_px = calibration.get("factor_um_per_px")

    # 2. Coverage Factor
    img_h, img_w = image_shape[:2]
    if um_per_px and um_per_px > 0:
        width_mm = (img_w * um_per_px) / 1000.0
        height_mm = (img_h * um_per_px) / 1000.0
        imaged_area_mm2 = width_mm * height_mm
    else:
        imaged_area_mm2 = 1.0  # default assumption if missing calibration

    coverage_factor = float(min(1.0, max(0.0, imaged_area_mm2 / min_coverage_mm2)))

    # 3. Mean Detection Confidence
    if detections:
        det_confs = [float(d.get("confidence", 0.0)) for d in detections]
        mean_det_conf = float(np.mean(det_confs))
    else:
        mean_det_conf = 1.0  # True negative blank filter

    # 4. Sample Confidence Score
    sample_confidence = float(round(mean_det_conf * cal_quality * coverage_factor, 4))

    # 5. Evaluate flags
    flags_list = []
    enriched_detections = []
    sample_needs_lab = False

    if not cal_valid:
        flags_list.append({
            "type": "missing_or_invalid_calibration",
            "message": "Calibration is missing or invalid. Quantitative results disabled."
        })
        sample_needs_lab = True

    if cal_quality == 0.5:
        flags_list.append({
            "type": "stale_calibration",
            "message": "Calibration is stale (> 7 days old). Recalibration recommended."
        })
        sample_needs_lab = True

    if sample_confidence < sample_low_thresh:
        flags_list.append({
            "type": "low_sample_confidence",
            "message": f"Sample confidence ({sample_confidence:.2f}) is below threshold ({sample_low_thresh})."
        })
        sample_needs_lab = True

    if len(detections) == 0:
        flags_list.append({
            "type": "zero_detections",
            "message": "No particles detected (verify blank filter control)."
        })
        # Note: 0 detections is a true negative candidate but flagged to verify blank control

    # Per particle flagging
    low_conf_ids = []
    large_size_ids = []
    low_support_class_ids = []
    high_aspect_ids = []

    for det in detections:
        d_copy = det.copy()
        particle_needs_lab = False
        reasons = []

        det_conf = float(d_copy.get("confidence", 0.0))
        if det_conf < low_det_thresh:
            particle_needs_lab = True
            reasons.append(f"confidence < {low_det_thresh}")
            low_conf_ids.append(d_copy["id"])

        cname = d_copy.get("class_name", "")
        if cname in flag_classes:
            particle_needs_lab = True
            reasons.append(f"low training support class '{cname}'")
            low_support_class_ids.append(d_copy["id"])

        size_um = d_copy.get("size_um", {})
        feret_max_um = size_um.get("feret_max") if size_um else None
        aspect_ratio = size_um.get("aspect_ratio", 1.0) if size_um else 1.0

        if feret_max_um is not None and feret_max_um > flag_size_um:
            particle_needs_lab = True
            reasons.append(f"size > {flag_size_um}µm ({feret_max_um}µm)")
            large_size_ids.append(d_copy["id"])

        if aspect_ratio > flag_aspect_ratio:
            particle_needs_lab = True
            reasons.append(f"aspect ratio > {flag_aspect_ratio} ({aspect_ratio})")
            high_aspect_ids.append(d_copy["id"])

        if cal_quality < 1.0:
            particle_needs_lab = True
            reasons.append("calibration not optimal")

        d_copy["needs_lab_confirmation"] = particle_needs_lab
        d_copy["lab_confirmation_reasons"] = reasons

        if particle_needs_lab:
            sample_needs_lab = True

        enriched_detections.append(d_copy)

    # Collect grouped flag summaries
    if low_conf_ids:
        flags_list.append({
            "type": "low_confidence_particle",
            "particle_ids": low_conf_ids,
            "message": f"{len(low_conf_ids)} particles have detection confidence < {low_det_thresh}"
        })

    if large_size_ids:
        flags_list.append({
            "type": "oversized_particle",
            "particle_ids": large_size_ids,
            "message": f"{len(large_size_ids)} particles exceed 5 mm validated upper limit"
        })

    if low_support_class_ids:
        flags_list.append({
            "type": "low_support_class",
            "particle_ids": low_support_class_ids,
            "message": f"{len(low_support_class_ids)} particles belong to classes with limited training support ({', '.join(flag_classes)})"
        })

    if high_aspect_ids:
        flags_list.append({
            "type": "high_aspect_ratio",
            "particle_ids": high_aspect_ids,
            "message": f"{len(high_aspect_ids)} particles have aspect ratio > {flag_aspect_ratio} (potential non-plastic fiber)"
        })

    breakdown = {
        "mean_detection_confidence": round(mean_det_conf, 4),
        "calibration_quality": cal_quality,
        "coverage_factor": round(coverage_factor, 4),
        "imaged_area_mm2": round(imaged_area_mm2, 4)
    }

    return sample_confidence, sample_needs_lab, enriched_detections, flags_list, breakdown
