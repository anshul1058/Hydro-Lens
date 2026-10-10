import os
import logging
import numpy as np
import cv2
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Default class mapping
DEFAULT_CLASSES = ["fragment", "fiber", "film", "foam", "pellet"]

class Detector:
    def __init__(self, weights_path: str = "models/best.pt", config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.weights_path = weights_path
        self.model_cfg = self.config.get("model", {})
        self.conf_thresh = self.model_cfg.get("conf_threshold", 0.25)
        self.iou_thresh = self.model_cfg.get("iou_threshold", 0.45)
        self.max_det = self.model_cfg.get("max_det", 300)
        self.classes = self.model_cfg.get("classes", DEFAULT_CLASSES)
        self.model = None
        self.fallback_mode = False
        self.load_error_message = None

        self._load_model()

    def _load_model(self):
        """Load YOLO model or set up fallback demo detector if model file missing or fails."""
        if not os.path.exists(self.weights_path):
            self.fallback_mode = True
            self.load_error_message = f"Model weights file not found at '{self.weights_path}'. Operating in Demo/Heuristic mode."
            logger.warning(self.load_error_message)
            return

        try:
            from ultralytics import YOLO
            self.model = YOLO(self.weights_path)
            # Warm-up model with dummy array
            dummy = np.zeros((640, 640, 3), dtype=np.uint8)
            self.model.predict(dummy, conf=self.conf_thresh, iou=self.iou_thresh, verbose=False)
            logger.info(f"Loaded YOLO model successfully from {self.weights_path}")
        except Exception as e:
            self.fallback_mode = True
            self.load_error_message = f"Failed to load YOLO model: {e}. Operating in Demo/Heuristic mode."
            logger.error(self.load_error_message)

    def predict(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Input: 640x640x3 uint8 RGB array (or raw image)
        Returns: List of detection dictionaries:
        [
            {
                "id": 0,
                "bbox_px": [x, y, w, h],  # absolute pixel values
                "bbox_xyxy": [x1, y1, x2, y2],
                "confidence": float,
                "class_id": int,
                "class_name": str
            }, ...
        ]
        """
        if self.fallback_mode or self.model is None:
            return self._heuristic_predict(image)

        try:
            # Predict using YOLO
            results = self.model.predict(
                image,
                conf=self.conf_thresh,
                iou=self.iou_thresh,
                max_det=self.max_det,
                verbose=False
            )

            detections = []
            det_idx = 0
            for res in results:
                if res.boxes is None or len(res.boxes) == 0:
                    continue

                boxes = res.boxes.xyxy.cpu().numpy()
                confs = res.boxes.conf.cpu().numpy()
                cls_ids = res.boxes.cls.cpu().numpy().astype(int)

                for box, conf, cid in zip(boxes, confs, cls_ids):
                    x1, y1, x2, y2 = float(box[0]), float(box[1]), float(box[2]), float(box[3])
                    w = max(1.0, x2 - x1)
                    h = max(1.0, y2 - y1)
                    xc = x1 + w / 2.0
                    yc = y1 + h / 2.0

                    cname = self.classes[cid] if 0 <= cid < len(self.classes) else f"class_{cid}"

                    detections.append({
                        "id": det_idx,
                        "bbox_px": [round(xc, 2), round(yc, 2), round(w, 2), round(h, 2)],
                        "bbox_xyxy": [round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)],
                        "confidence": float(round(conf, 4)),
                        "class_id": int(cid),
                        "class_name": str(cname)
                    })
                    det_idx += 1

            return detections

        except Exception as e:
            logger.error(f"Inference error: {e}. Falling back to heuristic detector.")
            return self._heuristic_predict(image)

    def _heuristic_predict(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Heuristic candidate particle detection for demo mode or missing weights.
        Uses adaptive color thresholding + contour filtering to spot microplastic candidates.
        """
        h_img, w_img = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Blur and adaptive threshold
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 15, 3
        )

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        detections = []
        det_id = 0
        min_area = 15  # filter sensor noise
        max_area = (h_img * w_img) * 0.4

        for c in contours:
            area = cv2.contourArea(c)
            if min_area <= area <= max_area:
                x, y, w, h = cv2.boundingRect(c)
                x1, y1, x2, y2 = float(x), float(y), float(x + w), float(y + h)
                xc, yc = x1 + w / 2.0, y1 + h / 2.0
                
                # Heuristic confidence based on contrast & shape
                aspect = max(w, h) / max(min(w, h), 1e-5)
                conf = min(0.92, max(0.55, 0.70 + (area / 5000.0)))
                
                # Simple morphology classification heuristic
                if aspect > 5.0:
                    cname = "fiber"
                    cid = 1
                elif area > 1200:
                    cname = "fragment"
                    cid = 0
                else:
                    cname = "fragment"
                    cid = 0

                detections.append({
                    "id": det_id,
                    "bbox_px": [round(xc, 2), round(yc, 2), round(float(w), 2), round(float(h), 2)],
                    "bbox_xyxy": [round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)],
                    "confidence": round(float(conf), 4),
                    "class_id": cid,
                    "class_name": cname
                })
                det_id += 1
                if det_id >= self.max_det:
                    break

        return detections
