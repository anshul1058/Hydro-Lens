import os
import json
import pytest
import numpy as np
import cv2

from src.preprocess import preprocess_image, load_image_rgb
from src.detect import Detector
from src.size import compute_particle_sizes
from src.calibrate import CalibrationManager
from src.confidence import compute_sample_confidence
from src.utils import (
    draw_annotations,
    compute_size_distribution,
    calculate_concentration,
    generate_report_json
)

def test_preprocessing():
    # Test on synthetic image
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    res = preprocess_image(img)
    assert res["preprocessed"].shape == (640, 640, 3)
    assert res["original_shape"] == (480, 640)

def test_detector_fallback():
    # Detector without weights file should use heuristic fallback without crashing
    det = Detector(weights_path="models/non_existent.pt")
    assert det.fallback_mode is True
    
    img = np.zeros((640, 640, 3), dtype=np.uint8)
    # Add fake particle candidate
    cv2.rectangle(img, (100, 100), (200, 200), (200, 200, 200), -1)
    
    predictions = det.predict(img)
    assert isinstance(predictions, list)
    assert len(predictions) > 0

def test_sizing():
    img = np.zeros((640, 640, 3), dtype=np.uint8)
    cv2.circle(img, (300, 300), 50, (255, 255, 255), -1)
    
    detections = [{
        "id": 0,
        "bbox_px": [300, 300, 100, 100],
        "bbox_xyxy": [250, 250, 350, 350],
        "confidence": 0.95,
        "class_id": 0,
        "class_name": "fragment"
    }]
    
    sized = compute_particle_sizes(img, detections, um_per_px=0.5)
    assert len(sized) == 1
    sz_um = sized[0]["size_um"]
    assert sz_um["feret_max"] > 0
    assert sz_um["ecd"] > 0

def test_calibration_manager():
    mgr = CalibrationManager(cal_file="data/calibration/calibration.json")
    cal = mgr.load()
    assert cal is not None
    is_valid, reason, quality = mgr.is_valid(cal)
    assert is_valid is True
    assert quality == 1.0

def test_confidence_scoring():
    cal = {
        "valid": True,
        "factor_um_per_px": 0.5,
        "quality_score": 1.0
    }
    detections = [{
        "id": 0,
        "confidence": 0.90,
        "class_name": "fragment",
        "size_um": {"feret_max": 50.0, "aspect_ratio": 1.5}
    }]
    # 2000x2000 px at 0.5 um/px = 1mm x 1mm = 1.0 mm^2 imaged area
    sample_conf, needs_lab, enriched_dets, flags, breakdown = compute_sample_confidence(
        detections=detections,
        calibration=cal,
        image_shape=(2000, 2000)
    )
    assert sample_conf >= 0.8
    assert needs_lab is False

def test_concentration():
    conc = calculate_concentration(total_count=10, imaged_area_mm2=1.0, sample_volume_ml=1000.0)
    assert conc == 10.0

if __name__ == "__main__":
    test_preprocessing()
    test_detector_fallback()
    test_sizing()
    test_calibration_manager()
    test_confidence_scoring()
    test_concentration()
    print("All backend unit tests passed successfully!")
