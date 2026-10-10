import json
from datetime import datetime, timezone
import numpy as np
import cv2
from typing import List, Dict, Any, Optional

def draw_annotations(
    image_rgb: np.ndarray,
    detections: List[Dict[str, Any]],
    show_sizes: bool = True,
    line_thickness: int = 2
) -> np.ndarray:
    """
    Draws annotated bounding boxes, class names, confidences, and size measurements.
    Color coding:
    - Green: High confidence (>= 0.8) and not flagged
    - Orange: Medium confidence (0.5 - 0.8)
    - Red: Low confidence (< 0.5) or needs lab confirmation
    """
    annotated = image_rgb.copy()
    img_h, img_w = annotated.shape[:2]

    for det in detections:
        bbox_xyxy = det.get("bbox_xyxy")
        if bbox_xyxy:
            x1, y1, x2, y2 = [int(v) for v in bbox_xyxy]
        else:
            xc, yc, w, h = det["bbox_px"]
            x1 = int(xc - w / 2)
            y1 = int(yc - h / 2)
            x2 = int(xc + w / 2)
            y2 = int(yc + h / 2)

        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(img_w - 1, x2), min(img_h - 1, y2)

        conf = det.get("confidence", 0.0)
        cname = det.get("class_name", "particle")
        needs_lab = det.get("needs_lab_confirmation", False)

        # Color selection (RGB format)
        if needs_lab or conf < 0.5:
            color = (239, 68, 68)   # Red (lab flag / low conf)
        elif conf >= 0.8:
            color = (34, 197, 94)   # Green (high conf)
        else:
            color = (245, 158, 11)  # Orange (medium conf)

        # Draw Bounding Box
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, line_thickness)

        # Format Label Text
        label_parts = [f"#{det.get('id', 0)} {cname} {conf:.2f}"]
        size_um = det.get("size_um", {})
        if show_sizes and size_um and size_um.get("ecd") is not None:
            label_parts.append(f"{size_um['ecd']}µm")

        label_str = " | ".join(label_parts)

        # Text background box
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.45
        thickness = 1
        (txt_w, txt_h), baseline = cv2.getTextSize(label_str, font, font_scale, thickness)

        lbl_y1 = max(0, y1 - txt_h - 6)
        lbl_y2 = y1
        cv2.rectangle(annotated, (x1, lbl_y1), (x1 + txt_w + 6, lbl_y2), color, -1)

        # Text inside box
        cv2.putText(
            annotated,
            label_str,
            (x1 + 3, max(txt_h + 2, y1 - 3)),
            font,
            font_scale,
            (255, 255, 255),
            thickness,
            cv2.LINE_AA
        )

    return annotated


def compute_size_distribution(detections: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Aggregates particle count into standardized size distribution bins (µm):
    - 10-25 µm
    - 25-50 µm
    - 50-100 µm
    - 100+ µm
    """
    bins = {
        "10-25": 0,
        "25-50": 0,
        "50-100": 0,
        "100+": 0
    }

    for det in detections:
        size_um = det.get("size_um", {})
        if not size_um or size_um.get("ecd") is None:
            continue

        ecd = size_um["ecd"]
        if ecd < 25.0:
            bins["10-25"] += 1
        elif ecd < 50.0:
            bins["25-50"] += 1
        elif ecd < 100.0:
            bins["50-100"] += 1
        else:
            bins["100+"] += 1

    return bins


def calculate_concentration(
    total_count: int,
    imaged_area_mm2: float,
    sample_volume_ml: float,
    dilution_factor: float = 1.0
) -> Optional[float]:
    """
    Calculates particle concentration in particles/L.
    Formula: (total_count / imaged_area_mm2) * (1000.0 / sample_volume_ml) * dilution_factor
    """
    if imaged_area_mm2 <= 0 or sample_volume_ml <= 0:
        return None
    conc = (total_count / imaged_area_mm2) * (1000.0 / sample_volume_ml) * dilution_factor
    return float(round(conc, 2))


def generate_report_json(
    sample_id: str,
    timestamp: str,
    calibration_info: Optional[Dict[str, Any]],
    image_meta: Dict[str, Any],
    detections: List[Dict[str, Any]],
    summary_dict: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generates standardized Hydro-Lens machine-readable JSON output
    conforming strictly to system.md Section 10 schema.
    """
    formatted_detections = []
    for d in detections:
        formatted_detections.append({
            "id": d.get("id"),
            "class": d.get("class_name"),
            "confidence": d.get("confidence"),
            "bbox_px": d.get("bbox_px"),
            "size_um": d.get("size_um"),
            "needs_lab_confirmation": d.get("needs_lab_confirmation", False)
        })

    cal_schema = {
        "factor_um_per_px": calibration_info.get("factor_um_per_px") if calibration_info else None,
        "valid": calibration_info.get("valid", False) if calibration_info else False,
        "date": calibration_info.get("timestamp", "") if calibration_info else ""
    }

    report = {
        "schema_version": "1.0",
        "sample_id": sample_id,
        "timestamp": timestamp or datetime.now(timezone.utc).isoformat(),
        "calibration": cal_schema,
        "image_meta": image_meta,
        "detections": formatted_detections,
        "summary": summary_dict
    }

    return report
