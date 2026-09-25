# Hydro Lens — Portable Microplastics Screening System

**HackMatrix 5.0 | PCCOE, Pune**  
**Team Nishtha:** Anshul · Prithviraj · Ishwari · Janhavi

---

## Problem

Microplastic screening today is slow, lab-bound, and expensive — limiting how often and how widely water can be tested. Communities, researchers, and regulators need a **fast, affordable, field-deployable** way to screen water samples and flag when lab confirmation is needed.

---

## Solution

**Hydro Lens** is a portable, AI-powered optical screening system that:
- Detects candidate microplastic particles from microscope images in seconds
- Estimates particle count and size distribution (10 µm – 5 mm range)
- Reports a confidence score with every result
- Includes a documented calibration step before any concentration number is reported
- Treats polymer-type identification as an **explicitly optional extension**, not a core claim

---

## Quick Start

```bash
# Clone and setup
git clone <repo-url>
cd hydro-lens

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download model weights (auto-downloads on first run, or place best.pt in models/)
# Run the Streamlit app
streamlit run app.py
```

**Requirements:** Python 3.10+, 4 GB RAM, webcam or microscope camera (or use pre-captured images).

---

## System at a Glance

| Component | Technology | Purpose |
|-----------|------------|---------|
| Detection | YOLOv8n (fine-tuned) | Bounding-box object detection |
| Sizing | OpenCV (Feret's diameter, ECD) | Physical size estimation |
| Preprocessing | Median blur + CLAHE | Denoising + contrast enhancement |
| UI | Streamlit | Image upload → results dashboard |
| Calibration | Stage micrometer + reference beads | Pixel-to-µm mapping |

---

## Key Results (Target)

- **Detection range:** 10 µm – 5 mm (validated via calibration)
- **Inference time:** < 2 sec/image on CPU (Raspberry Pi 4 / laptop)
- **Model size:** ~6 MB (YOLOv8n)
- **Confidence reporting:** Per-particle + aggregate sample confidence
- **Calibration requirement:** Mandatory before quantitative reporting

---

## Repository Structure

```
hydro-lens/
├── app.py                 # Streamlit entry point
├── models/
│   └── best.pt            # Fine-tuned YOLOv8n weights
├── src/
│   ├── detect.py          # YOLO inference wrapper
│   ├── size.py            # OpenCV sizing (Feret, ECD)
│   ├── preprocess.py      # Median blur + CLAHE
│   ├── calibrate.py       # Calibration manager
│   └── confidence.py      # Confidence scoring
├── data/
│   └── reference/         # Calibration images
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATASET.md
│   ├── CALIBRATION.md
│   ├── CONFIDENCE_AND_LIMITATIONS.md
│   ├── MODEL_CARD.md
│   ├── PITCH.md
│   ├── DEMO_SCRIPT.md
│   ├── FUTURE_WORK.md
│   └── flowchart.md
├── requirements.txt
└── system.md
```

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| [system.md](system.md) | Complete system specification |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Pipeline architecture & data flow |
| [DATASET.md](DATASET.md) | Datasets, splits, licensing |
| [CALIBRATION.md](CALIBRATION.md) | Calibration procedure & reference samples |
| [CONFIDENCE_AND_LIMITATIONS.md](CONFIDENCE_AND_LIMITATIONS.md) | Confidence scoring, detection limits, failure modes |
| [MODEL_CARD.md](MODEL_CARD.md) | Model card (per ML best practices) |
| [PITCH.md](PITCH.md) | Hackathon pitch deck |
| [DEMO_SCRIPT.md](DEMO_SCRIPT.md) | Live demo walkthrough |
| [FUTURE_WORK.md](FUTURE_WORK.md) | Roadmap & extensions |
| [flowchart.md](flowchart.md) | Mermaid system flowchart |

---

## License

MIT License — see [LICENSE](LICENSE).

---

## Acknowledgments

- Ultralytics YOLOv8: https://github.com/ultralytics/yolov8
- Dataset contributors (see [DATASET.md](DATASET.md))
- HackMatrix 5.0 organizers, PCCOE Pune