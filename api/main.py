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

@app.get("/api/calibration")
def get_calibration():
    cal_mgr = get_cal_manager()
    record = cal_mgr.load()
    is_valid, reason, quality = cal_mgr.is_valid(record)
    return {
        "record": record,
        "is_valid": is_valid,
        "reason": reason,
        "quality": quality
    }

@app.get("/api/references")
def get_references():
    ref_dir = "data/reference"
    references = [
        {
            "id": "demo_microplastic_sample.jpg",
            "label": "Microplastic Sample",
            "url": "/api/references/file/demo_microplastic_sample.jpg"
        },
        {
            "id": "blank_filter_control.png",
            "label": "Blank Filter Control",
            "url": "/api/references/file/blank_filter_control.png"
        },
        {
            "id": "stage_micrometer_scale.png",
            "label": "Stage Micrometer Scale",
            "url": "/api/references/file/stage_micrometer_scale.png"
        }
    ]
    return references

@app.get("/api/references/file/{filename}")
def serve_reference_file(filename: str):
    ref_path = os.path.join("data/reference", filename)
    if os.path.exists(ref_path):
        return FileResponse(ref_path)
    raise HTTPException(
        status_code=404,
        detail={"error": {"code": "NOT_FOUND", "message": f"Reference file {filename} not found."}}
    )

@app.get("/api/testing/images")
def list_testing_images():
    testing_dir = "testing"
    images = []
    if os.path.exists(testing_dir):
        for f in sorted(os.listdir(testing_dir)):
            if not f.startswith(".") and f.lower().endswith((".jpg", ".jpeg", ".png", ".tif", ".tiff")):
                p = os.path.join(testing_dir, f)
                images.append({
                    "filename": f,
                    "size_bytes": os.path.getsize(p),
                    "url": f"/api/testing/download/{f}"
                })
    return images

@app.get("/api/testing/download/{filename}")
def download_testing_image(filename: str):
    file_path = os.path.join("testing", filename)
    if os.path.exists(file_path):
        return FileResponse(
            file_path,
            filename=filename,
            media_type="image/jpeg",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    raise HTTPException(
        status_code=404,
        detail={"error": {"code": "NOT_FOUND", "message": f"Testing image {filename} not found."}}
    )

@app.post("/api/analyze")
async def analyze_sample(
    file: Optional[UploadFile] = File(None),
    reference_id: Optional[str] = Form(None)
):
    start_time = time.time()
    config = get_config()
    
    # Read image source
    if file is not None and file.filename:
        # Validate max upload size and allowed extensions if file provided
        app_cfg = config.get("app", {})
        allowed_exts = app_cfg.get("allowed_extensions", [".jpg", ".jpeg", ".png", ".tif", ".tiff"])
        ext = os.path.splitext(file.filename)[1].lower()
        if ext and ext not in allowed_exts:
            raise HTTPException(
                status_code=400,
                detail={"error": {"code": "INVALID_FILE_TYPE", "message": f"Unsupported file extension '{ext}'. Allowed: {allowed_exts}"}}
            )
        contents = await file.read()
        max_bytes = app_cfg.get("max_upload_mb", 50) * 1024 * 1024
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=400,
                detail={"error": {"code": "FILE_TOO_LARGE", "message": f"File size exceeds maximum limit of {app_cfg.get('max_upload_mb', 50)} MB."}}
            )
        source = contents
    elif reference_id:
        # Lookup reference file
        target_name = reference_id
        ref_path = os.path.join("data/reference", target_name)
        if not os.path.exists(ref_path):
            for ext in [".jpg", ".png", ".jpeg"]:
                if os.path.exists(ref_path + ext):
                    ref_path = ref_path + ext
                    break
        if not os.path.exists(ref_path):
            test_path = os.path.join("testing", target_name)
            if os.path.exists(test_path):
                ref_path = test_path
            else:
                for ext in [".jpg", ".png", ".jpeg"]:
                    if os.path.exists(test_path + ext):
                        ref_path = test_path + ext
                        break
        if not os.path.exists(ref_path):
            raise HTTPException(
                status_code=400,
                detail={"error": {"code": "INVALID_REFERENCE", "message": f"Reference file '{reference_id}' not found."}}
            )
        source = ref_path
    else:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "MISSING_INPUT", "message": "Either 'file' or 'reference_id' must be provided."}}
        )

    # 1. Preprocess
    prep_res = preprocess_image(source, config)
    prep_img = prep_res["preprocessed"]

    # 2. Detector
    detector = get_detector()
    raw_detections = detector.predict(prep_img)

    # 3. Calibration check
    cal_mgr = get_cal_manager()
    cal_record = cal_mgr.load()
    is_valid, reason, quality = cal_mgr.is_valid(cal_record)
    
    um_per_px = cal_record.get("factor_um_per_px") if (cal_record and is_valid and quality > 0.0) else None

    # 4. Sizing
    sized_detections = compute_particle_sizes(
        image=prep_img,
        detections=raw_detections,
        um_per_px=um_per_px,
        config=config
    )

    # 5. Confidence scoring
    sample_conf, needs_lab_flag, final_detections, flags_list, breakdown = compute_sample_confidence(
        detections=sized_detections,
        calibration=cal_record if (cal_record and is_valid) else None,
        image_shape=prep_res["original_shape"],
        config=config
    )

    # 6. Draw annotations
    annotated_img = draw_annotations(
        prep_img,
        final_detections,
        show_sizes=(um_per_px is not None)
    )

    # 7. Size distribution (blocked if calibration quality == 0.0)
    if quality > 0.0:
        size_dist = compute_size_distribution(final_detections)
    else:
        size_dist = {}

    # 8. Report JSON
    sample_id = f"HL-{int(time.time() * 1000)}"
    timestamp_iso = prep_res.get("timestamp") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    imaged_area_mm2 = breakdown.get("imaged_area_mm2", 1.0)
    summary_dict = {
        "total_count": len(final_detections),
        "sample_confidence": sample_conf,
        "flag_lab_confirmation": needs_lab_flag,
        "size_distribution": size_dist,
        "imaged_area_mm2": imaged_area_mm2
    }
    report = generate_report_json(
        sample_id=sample_id,
        timestamp=timestamp_iso,
        calibration_info=cal_record,
        image_meta={"original_shape": prep_res["original_shape"]},
        detections=final_detections,
        summary_dict=summary_dict
    )

    latency_sec = float(round(time.time() - start_time, 3))

    return {
        "sample_id": sample_id,
        "latency_sec": latency_sec,
        "total_count": len(final_detections),
        "sample_confidence": sample_conf,
        "flag_lab_confirmation": needs_lab_flag,
        "size_distribution_um": size_dist,
        "imaged_area_mm2": imaged_area_mm2,
        "flags": flags_list,
        "breakdown": breakdown,
        "detections": final_detections,
        "report": report,
        "images": {
            "original": cv2_to_b64(prep_res["original"]),
            "preprocessed": cv2_to_b64(prep_res["preprocessed"]),
            "annotated": cv2_to_b64(annotated_img)
        },
        "detector_fallback": detector.fallback_mode,
        "detector_load_error": detector.load_error_message
    }

@app.post("/api/calibration/factor-fft")
async def compute_factor_fft_endpoint(
    file: UploadFile = File(...),
    known_spacing_um: float = Form(10.0)
):
    contents = await file.read()
    try:
        img_rgb = load_image_rgb(contents)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "IMAGE_DECODE_ERROR", "message": f"Could not decode image: {e}"}}
        )

    cal_mgr = get_cal_manager()
    try:
        factor = cal_mgr.compute_factor_fft(img_rgb, known_spacing_um=known_spacing_um)
        return {"factor_um_per_px": factor}
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "FFT_CALCULATION_ERROR", "message": f"FFT computation failed: {e}"}}
        )

@app.post("/api/calibration/factor-manual")
def compute_factor_manual_endpoint(req: FactorManualRequest):
    if req.pixel_distance <= 0:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "INVALID_INPUT", "message": "Pixel distance must be greater than 0."}}
        )
    cal_mgr = get_cal_manager()
    factor = cal_mgr.compute_factor_manual(
        pixel_distance=req.pixel_distance,
        num_divisions=req.num_divisions,
        known_spacing_um=req.known_spacing_um
    )
    return {"factor_um_per_px": factor}

@app.post("/api/calibration/save")
def save_calibration_endpoint(req: CalibrationSaveRequest):
    cal_mgr = get_cal_manager()
    val_info = cal_mgr.validate_beads(req.measured_beads)
    cal_record = cal_mgr.save(
        factor_um_per_px=req.factor_um_per_px,
        magnification=req.magnification,
        camera=req.camera,
        microscope=req.microscope,
        validation_info=val_info
    )
    is_valid, reason, quality = cal_mgr.is_valid(cal_record)
    return {
        "record": cal_record,
        "is_valid": is_valid,
        "reason": reason,
        "quality": quality
    }

@app.get("/api/diagnostics")
def get_diagnostics():
    return {
        "model_info": {
            "name": "Hydro Lens Detector",
            "version": "1.0.0",
            "architecture": "YOLOv8n (Nano)",
            "framework": "Ultralytics YOLOv8 / PyTorch",
            "parameters": "3.2 M",
            "model_size": "~6 MB (.pt)",
            "input_resolution": "640×640 RGB",
            "latency": "1.2 s (Laptop CPU)",
            "status": "Production"
        },
        "classes": [
            {"name": "fragment", "description": "Irregular sharp plastic particle", "count": 1200},
            {"name": "fiber", "description": "Elongated synthetic strand", "count": 800},
            {"name": "film", "description": "Thin translucent plastic sheet", "count": 450},
            {"name": "foam", "description": "Porous cellular structure", "count": 320},
            {"name": "pellet", "description": "Spherical pre-production bead", "count": 210}
        ],
        "limitations": [
            {
                "id": 1,
                "title": "Polymer type NOT identified — morphology only",
                "detail": "Hydro Lens does not identify polymer type (PE, PP, PET, etc.). It detects morphological candidates consistent with microplastics. Polymer ID requires FTIR/Raman spectroscopy — explicitly out of scope."
            },
            {
                "id": 2,
                "title": "< 10 µm invisible — optical resolution bound",
                "detail": "At 200× with 1920×1080 sensor: theoretical ~0.5 µm/pixel. Practical detection limit ~10 µm (SNR, diffraction, noise). Particles < 10 µm are invisible to this system."
            },
            {
                "id": 3,
                "title": "Training domain ≠ all field conditions — validate locally",
                "detail": "Datasets 1 & 2: fluorescence + sewage microscopy. Dataset 3 (test): different microscopes, lighting. Performance on your microscope may differ. Always validate with local reference samples."
            },
            {
                "id": 4,
                "title": "No concentration without calibration + sample volume",
                "detail": "Single image field of view extrapolation assumes uniform distribution. Concentration calculations strictly require valid active calibration, sample volume, and imaged filter area."
            }
        ]
    }

@app.post("/api/concentration")
def calculate_concentration_endpoint(req: ConcentrationRequest):
    cal_mgr = get_cal_manager()
    cal_record = cal_mgr.load()
    is_valid, reason, quality = cal_mgr.is_valid(cal_record)
    
    if quality == 0.0 or req.imaged_area_mm2 <= 0:
        return {
            "concentration": None,
            "blocked": True,
            "message": "Calibration required — quantitative concentration is blocked"
        }
    
    conc = calculate_concentration(
        total_count=req.total_count,
        imaged_area_mm2=req.imaged_area_mm2,
        sample_volume_ml=req.sample_volume_ml,
        dilution_factor=req.dilution_factor
    )
    return {
        "concentration": conc,
        "blocked": False,
        "message": "Calculated successfully"
    }

# Serve the built React frontend (registered last so /api routes win).
_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist")

@app.get("/{full_path:path}", include_in_schema=False)
def spa_fallback(full_path: str):
    if not os.path.isdir(_DIST):
        raise HTTPException(status_code=404, detail="Frontend not built")
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not Found")
    candidate = os.path.normpath(os.path.join(_DIST, full_path))
    if full_path and candidate.startswith(_DIST) and os.path.isfile(candidate):
        return FileResponse(candidate)
    return FileResponse(os.path.join(_DIST, "index.html"))
