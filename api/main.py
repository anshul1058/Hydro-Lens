import os
import io
import time
import base64
import yaml
import numpy as np
import cv2
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

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

app = FastAPI(title="Hydro Lens API", version="1.0.0")

# CORS setup for Vite frontend on port 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers for uniform error shape: {error: {code, message, detail}}
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and "error" in detail:
        return JSONResponse(status_code=exc.status_code, content=detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": f"HTTP_{exc.status_code}", "message": str(detail), "detail": None}}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": str(exc), "detail": None}}
    )

# Cached singletons
detector_instance: Optional[Detector] = None
cal_manager_instance: Optional[CalibrationManager] = None

def get_config() -> Dict[str, Any]:
    cfg_path = "config.yaml"
    if os.path.exists(cfg_path):
        with open(cfg_path, "r") as f:
            return yaml.safe_load(f)
    return {}

def get_detector() -> Detector:
    global detector_instance
    if detector_instance is None:
        cfg = get_config()
        weights_path = cfg.get("model", {}).get("weights_path", "models/best.pt")
        detector_instance = Detector(weights_path=weights_path, config=cfg)
    return detector_instance

def get_cal_manager() -> CalibrationManager:
    global cal_manager_instance
    if cal_manager_instance is None:
        cfg = get_config()
        cal_file = cfg.get("paths", {}).get("calibration_file", "data/calibration/calibration.json")
        cal_manager_instance = CalibrationManager(cal_file=cal_file, config=cfg)
    return cal_manager_instance

def cv2_to_b64(img_rgb: np.ndarray, format: str = ".jpg") -> str:
    img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
    success, buffer = cv2.imencode(format, img_bgr)
    if not success:
        return ""
    b64_str = base64.b64encode(buffer).decode("utf-8")
    mime = "image/jpeg" if format.lower() in [".jpg", ".jpeg"] else "image/png"
    return f"data:{mime};base64,{b64_str}"

# --- Request Models ---
class FactorManualRequest(BaseModel):
    pixel_distance: float
    num_divisions: int = 1
    known_spacing_um: float = 10.0

class CalibrationSaveRequest(BaseModel):
    factor_um_per_px: float
    magnification: str = "200x"
    camera: str = "1920x1080"
    microscope: str = "USB Microscope"
    measured_beads: List[float] = [10.0, 50.0, 100.0]

class ConcentrationRequest(BaseModel):
    total_count: int
    imaged_area_mm2: float
    sample_volume_ml: float
    dilution_factor: float = 1.0

# --- API Endpoints ---

@app.get("/api/health")
def health_check():
    return {"status": "ok"}