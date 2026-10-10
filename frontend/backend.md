# Backend Development Guide — Hydro Lens

> For: Backend Developer  
> Scope: Streamlit app, inference pipeline, calibration management, data persistence

---

## 1. Project Structure (Backend-Relevant)

```
hydro-lens/
├── app.py                 # Streamlit entry point (YOU OWN THIS)
├── models/
│   └── best.pt            # Model weights (read-only)
├── src/
│   ├── __init__.py
│   ├── detect.py          # YOLO inference wrapper
│   ├── size.py            # OpenCV sizing (Feret, ECD)
│   ├── preprocess.py      # Median blur + CLAHE
│   ├── calibrate.py       # Calibration manager
│   ├── confidence.py      # Confidence scoring
│   └── utils.py           # Shared helpers
├── data/
│   ├── calibration/
│   │   └── calibration.json   # Current calibration (R/W)
│   ├── reference/             # Calibration reference images
│   └── uploads/               # User uploads (temp)
├── requirements.txt
└── config.yaml              # App configuration
```

---

## 2. Configuration (`config.yaml`)

```yaml
# config.yaml
app:
  title: "Hydro Lens"
  max_upload_mb: 50
  allowed_extensions: [".jpg", ".jpeg", ".png", ".tif", ".tiff"]

model:
  weights_path: "models/best.pt"
  input_size: 640
  conf_threshold: 0.25
  iou_threshold: 0.45
  max_det: 300
  classes: ["fragment", "fiber", "film", "foam", "pellet"]

preprocessing:
  median_blur_kernel: 3
  clahe_clip_limit: 2.0
  clahe_tile_grid: [8, 8]

calibration:
  validity_days: 7
  bead_nominal_um: [10, 50, 100]
  bead_tolerance_pct: 20
  micrometer_spacing_um: 10

confidence:
  low_threshold: 0.5
  sample_low_threshold: 0.6
  calibration_quality:
    valid: 1.0
    stale: 0.5
    missing: 0.0
  min_coverage_mm2: 1.0

sizing:
  size_bins_um: [10, 25, 50, 100, 1000, 5000]
  flag_size_um: 5000
  flag_aspect_ratio: 10
  flag_classes: ["film", "foam", "pellet"]

paths:
  calibration_file: "data/calibration/calibration.json"
  upload_dir: "data/uploads"
  reference_dir: "data/reference"
```

---

## 3. Core Modules — API Contracts

### `src/preprocess.py`
```python
def preprocess_image(image_path: str, config: dict) -> np.ndarray:
    """
    Input: path to uploaded image
    Output: 640x640x3 uint8 RGB (letterboxed, CLAHE'd)
    Side effect: saves preprocessed preview to uploads/pre_{name}.jpg
    """
    # 1. Load with cv2.imread (BGR) -> convert to RGB
    # 2. Median blur (kernel=config['preprocessing']['median_blur_kernel'])
    # 3. CLAHE on L channel (Lab space) -> back to RGB
    # 4. Letterbox resize to 640x640, pad=114
    # 5. Return uint8 RGB array
```

### `src/detect.py`
```python
class Detector:
    def __init__(self, weights_path: str, config: dict):
        # Load YOLOv8n model (ultralytics.YOLO)
        # Warm-up with dummy input
    
    def predict(self, image: np.ndarray) -> list[dict]:
        """
        Input: 640x640x3 uint8 RGB
        Output: List of detections, each:
            {
                "bbox_px": [x_center, y_center, width, height],  # normalized 0-1
                "confidence": float,
                "class_id": int,
                "class_name": str
            }
        """
        # Run model.predict() with config thresholds
        # Apply NMS (handled by YOLO)
        # Convert xywh normalized -> list of dicts
```

### `src/size.py`
```python
def compute_particle_sizes(
    image: np.ndarray,
    detections: list[dict],
    um_per_px: float
) -> list[dict]:
    """
    Input: preprocessed image (640x640), detections from detector, calibration factor
    Output: Detections enriched with size_um dict:
        {
            "feret_max_um": float,
            "feret_min_um": float,
            "ecd_um": float,
            "aspect_ratio": float
        }
    """
    # For each detection:
    # 1. Convert normalized bbox -> pixel coords on 640x640
    # 2. Extract ROI, threshold (Otsu or adaptive) to get mask
    # 3. Find contours, take largest
    # 4. cv2.minAreaRect -> Feret max/min
    # 5. contourArea -> ECD = 2*sqrt(area/pi)
    # 6. Multiply all by um_per_px
```

### `src/calibrate.py`
```python
class CalibrationManager:
    def __init__(self, cal_file: str, config: dict):
        self.cal_file = cal_file
        self.config = config
    
    def load(self) -> dict | None:
        """Return calibration dict or None if missing/expired"""
    
    def is_valid(self, cal: dict) -> bool:
        """Check expiry, validation passed"""
    
    def compute_factor(self, micrometer_image_path: str) -> float:
        """FFT-based line spacing detection -> µm/px"""
    
    def validate_beads(self, bead_image_path: str, factor: float) -> dict:
        """Run detection+sizing on beads, compare to nominal"""
    
    def save(self, factor: float, validation: dict) -> dict:
        """Write calibration.json with timestamp, expiry"""
```

### `src/confidence.py`
```python
def compute_sample_confidence(
    detections: list[dict],
    calibration: dict,
    image_area_mm2: float,
    config: dict
) -> tuple[float, list[dict]]:
    """
    Returns: (sample_confidence, flags_list)
    flags_list: [{"type": "low_confidence_particle", "particle_ids": [...]}, ...]
    """
    # mean_det_conf = mean(d.confidence for d in detections) or 1.0
    # cal_quality = calibration_quality(calibration)
    # coverage = min(1.0, image_area_mm2 / config['confidence']['min_coverage_mm2'])
    # sample_conf = mean_det_conf * cal_quality * coverage
    # Build flags per CONFIDENCE_AND_LIMITATIONS.md rules
```

---

## 4. Streamlit App — `app.py` Structure

```python
# app.py
import streamlit as st
from src.detect import Detector
from src.size import compute_particle_sizes
from src.calibrate import CalibrationManager
from src.confidence import compute_sample_confidence
from src.preprocess import preprocess_image
import yaml, json, cv2, numpy as np

# ---- Config ----
with open("config.yaml") as f:
    CFG = yaml.safe_load(f)

# ---- Init (cached) ----
@st.cache_resource
def get_detector():
    return Detector(CFG['model']['weights_path'], CFG)

@st.cache_resource
def get_cal_manager():
    return CalibrationManager(CFG['paths']['calibration_file'], CFG)

# ---- Pages ----
def page_home():
    st.title("Hydro Lens")
    # Upload widget -> st.session_state['uploaded_file']
    # "Analyze" button -> switch to results page

def page_calibration():
    # Show current calibration status (banner)
    # Wizard: upload micrometer -> compute -> upload beads -> validate -> save

def page_results():
    # Load image, preprocess, detect, size, confidence, render
    # Tabs: Annotated Image | Histogram | Table | JSON Export

# ---- Routing ----
page = st.sidebar.radio("Navigate", ["Analyze", "Calibration", "About"])
{"Analyze": page_home, "Calibration": page_calibration, "About": page_about}[page]()
```

---

## 5. Data Persistence

| Data | Location | Format | Retention |
|------|----------|--------|-----------|
| Calibration | `data/calibration/calibration.json` | JSON | Permanent |
| Uploaded images | `data/uploads/` | JPG/PNG | Session (cleanup on restart) |
| Results | `data/results/` | JSON (per sample) | Optional, configurable |
| Logs | `logs/app.log` | Text | Rotating (7 days) |

**Calibration JSON Schema:**
```json
{
  "version": "1.0",
  "timestamp": "2026-09-25T14:30:00Z",
  "factor_um_per_px": 0.417,
  "magnification": "200x",
  "camera": "1920x1080",
  "validation": {
    "bead_10um": {"nominal": 10, "measured": 11.2, "error_pct": 12},
    "bead_50um": {"nominal": 50, "measured": 48.5, "error_pct": -3},
    "bead_100um": {"nominal": 100, "measured": 97.1, "error_pct": -2.9}
  },
  "valid": true,
  "expires": "2026-10-02T14:30:00Z"
}
```

---

## 6. Error Handling Patterns

```python
# Wrap all pipeline steps
try:
    preprocessed = preprocess_image(upload_path, CFG)
except cv2.error as e:
    st.error(f"Image preprocessing failed: {e}")
    return

# Calibration gate
cal = cal_manager.load()
if not cal or not cal_manager.is_valid(cal):
    st.warning("⚠️ No valid calibration. Quantitative results disabled.")
    cal_quality = 0.0
else:
    cal_quality = 1.0
```

---

## 7. Performance Targets

| Operation | Target (Pi 4) | Target (Laptop) |
|-----------|---------------|-----------------|
| Preprocess | < 200 ms | < 50 ms |
| YOLO inference | < 2.0 s | < 0.8 s |
| Sizing (30 particles) | < 300 ms | < 100 ms |
| Total pipeline | < 3.0 s | < 1.5 s |

**Optimization knobs:**
- `torch.set_num_threads(4)` for Pi
- Half-precision (FP16) if GPU available
- Batch size = 1 (streaming)

---

## 8. Testing Checklist

- [ ] Blank filter → 0 detections, confidence 1.0
- [ ] 10 µm beads → detected, size ~11 µm, flag low confidence
- [ ] Mixed beads → 3 histogram peaks, errors < 20%
- [ ] No calibration → quantitative output blocked, warning shown
- [ ] Stale calibration → quality=0.5, all particles flagged
- [ ] Large particle (>5mm) → flagged for lab
- [ ] Film/foam/pellet class → flagged low support
- [ ] Export JSON → valid schema, all fields present

---

## 9. Dependencies (`requirements.txt`)

```txt
streamlit==1.30.0
ultralytics==8.2.0
opencv-python==4.8.1
numpy==1.24.3
pyyaml==6.0.1
pillow==10.0.0
```

---

## 10. Deployment Notes

- **No database needed** — file-based calibration + session uploads
- **Offline-first** — no external API calls
- **Single process** — Streamlit handles concurrency via sessions
- **Docker:** `Dockerfile` uses `python:3.10-slim`, copy src/, models/, config.yaml
- **Pi 4:** `pip install -r requirements.txt` → `streamlit run app.py --server.port 8501`

---

## 11. Handoff Checklist (AI/ML → Backend)

- [ ] `models/best.pt` placed in repo
- [ ] `config.yaml` matches training config (class names, thresholds)
- [ ] Calibration validation logic matches `CALIBRATION.md`
- [ ] Confidence formulas match `CONFIDENCE_AND_LIMITATIONS.md`
- [ ] Output JSON schema matches `system.md` Section 10

---

*Backend owns: Streamlit UI, pipeline orchestration, calibration persistence, config, error handling, performance.*  
*AI/ML owns: model weights, training pipeline, dataset prep, evaluation metrics.*