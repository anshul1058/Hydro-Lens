import math
import cv2
import numpy as np
from typing import List, Dict, Any, Optional

def compute_particle_sizes(
    image: np.ndarray,
    detections: List[Dict[str, Any]],
    um_per_px: Optional[float] = None,
    config: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Computes precise physical particle dimensions using OpenCV contours & minAreaRect.
    
    Metrics:
    - Feret max diameter: longest dimension (cv2.minAreaRect)
    - Feret min diameter: shortest dimension
    - ECD (Equivalent Circular Diameter): 2 * sqrt(contour_area / pi)
    - Aspect Ratio: Feret max / Feret min
    
    If um_per_px is provided (>0), values are scaled to micrometers (µm).
    Otherwise, size_um will be populated with None / raw estimates and flagged.
    """
    img_h, img_w = image.shape[:2]
    enriched_detections = []

    for det in detections:
        det_copy = det.copy()
        bbox_xyxy = det.get("bbox_xyxy")
        
        if not bbox_xyxy:
            xc, yc, w, h = det["bbox_px"]
            x1 = max(0, int(xc - w / 2))
            y1 = max(0, int(yc - h / 2))
            x2 = min(img_w, int(xc + w / 2))
            y2 = min(img_h, int(yc + h / 2))
        else:
            x1 = max(0, int(bbox_xyxy[0]))
            y1 = max(0, int(bbox_xyxy[1]))
            x2 = min(img_w, int(bbox_xyxy[2]))
            y2 = min(img_h, int(bbox_xyxy[3]))

        roi_w = max(1, x2 - x1)
        roi_h = max(1, y2 - y1)

        # Extract ROI
        roi = image[y1:y2, x1:x2]

        feret_max_px = float(max(roi_w, roi_h))
        feret_min_px = float(min(roi_w, roi_h))
        area_px = float(roi_w * roi_h)

        if roi.size > 0 and roi_w > 2 and roi_h > 2:
            try:
                gray_roi = cv2.cvtColor(roi, cv2.COLOR_RGB2GRAY) if roi.ndim == 3 else roi
                # Denoise ROI
                blurred_roi = cv2.GaussianBlur(gray_roi, (3, 3), 0)
                # Otsu thresholding
                _, thresh_roi = cv2.threshold(blurred_roi, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
                
                # Check threshold invert if background is dark
                if np.mean(thresh_roi) > 127:
                    thresh_roi = cv2.bitwise_not(thresh_roi)

                contours, _ = cv2.findContours(thresh_roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                if contours:
                    largest_contour = max(contours, key=cv2.contourArea)
                    c_area = cv2.contourArea(largest_contour)
                    if c_area > 4:
                        area_px = float(c_area)
                        rect = cv2.minAreaRect(largest_contour)
                        rect_w, rect_h = rect[1]
                        if rect_w > 0 and rect_h > 0:
                            feret_max_px = float(max(rect_w, rect_h))
                            feret_min_px = float(min(rect_w, rect_h))
            except Exception:
                pass  # fallback to bbox estimates

        ecd_px = 2.0 * math.sqrt(area_px / math.pi)
        aspect_ratio = feret_max_px / max(feret_min_px, 1e-5)

        det_copy["size_px"] = {
            "feret_max": round(feret_max_px, 2),
            "feret_min": round(feret_min_px, 2),
            "ecd": round(ecd_px, 2),
            "area": round(area_px, 2),
            "aspect_ratio": round(aspect_ratio, 2)
        }

        if um_per_px is not None and um_per_px > 0:
            feret_max_um = feret_max_px * um_per_px
            feret_min_um = feret_min_px * um_per_px
            ecd_um = ecd_px * um_per_px

            det_copy["size_um"] = {
                "feret_max": round(feret_max_um, 2),
                "feret_min": round(feret_min_um, 2),
                "ecd": round(ecd_um, 2),
                "aspect_ratio": round(aspect_ratio, 2)
            }
        else:
            det_copy["size_um"] = {
                "feret_max": None,
                "feret_min": None,
                "ecd": None,
                "aspect_ratio": round(aspect_ratio, 2)
            }

        enriched_detections.append(det_copy)

    return enriched_detections
