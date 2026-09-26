# System Flowchart — Hydro Lens

```mermaid
flowchart TD
    %% Styles
    classDef process fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef decision fill:#fff3e0,stroke:#f57c00,stroke-width:2px;
    classDef io fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;
    classDef warning fill:#ffebee,stroke:#c62828,stroke-width:2px;
    classDef startend fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    %% Nodes
    START([User Starts App]):::startend
    UPLOAD[Upload Microscope Image<br/>JPG/PNG/TIFF]:::io
    VALIDATE{Valid Image?}:::decision
    PREPROCESS[Preprocessing<br/>• Median Blur 3×3<br/>• CLAHE clipLimit=2.0<br/>• Letterbox 640×640]:::process
    CAL_CHECK{"Valid Calibration<br/>< 7 days old?"}:::decision
    CAL_WARN[⚠️ Calibration Missing/Stale<br/>Quantitative Output Blocked]:::warning
    CAL_OK[Load µm/px Factor<br/>Validation Beads ±20%]:::process
    INFERENCE[YOLOv8n Inference<br/>conf_thresh=0.25<br/>NMS iou=0.45]:::process
    DETECTIONS{Detections<br/>Found?}:::decision
    NO_DETS[Zero Particles<br/>Confidence=1.0]:::io
    SIZING[OpenCV Sizing per Box<br/>• Feret Max/Min<br/>• ECD<br/>• Aspect Ratio]:::process
    APPLY_CAL[Apply Calibration<br/>px → µm]:::process
    CONFIDENCE[Confidence Scoring<br/>• Mean Detection Conf<br/>• Calibration Quality<br/>• Coverage Factor]:::process
    FLAG_LOGIC{"Flag Conditions?<br/>• conf < 0.6<br/>• cal invalid<br/>• size > 5mm<br/>• class ∈ film/foam/pellet<br/>• aspect_ratio > 10"}:::decision
    FLAG_ON[🚩 Needs Lab Confirmation]:::warning
    FLAG_OFF[✅ Screening Reliable]:::process
    REPORT[Generate Report<br/>• Annotated Image<br/>• Size Histogram<br/>• Count + Distribution<br/>• Sample Confidence<br/>• Flags + Limitations Note]:::process
    EXPORT[Export JSON / CSV<br/>Download / API]:::io
    END([Done]):::startend

    %% Edges
    START --> UPLOAD
    UPLOAD --> VALIDATE
    VALIDATE -- No --> UPLOAD
    VALIDATE -- Yes --> PREPROCESS
    PREPROCESS --> CAL_CHECK
    CAL_CHECK -- No --> CAL_WARN
    CAL_WARN --> INFERENCE
    CAL_CHECK -- Yes --> CAL_OK
    CAL_OK --> INFERENCE
    INFERENCE --> DETECTIONS
    DETECTIONS -- No --> NO_DETS
    NO_DETS --> REPORT
    DETECTIONS -- Yes --> SIZING
    SIZING --> APPLY_CAL
    APPLY_CAL --> CONFIDENCE
    CONFIDENCE --> FLAG_LOGIC
    FLAG_LOGIC -- Yes --> FLAG_ON
    FLAG_LOGIC -- No --> FLAG_OFF
    FLAG_ON --> REPORT
    FLAG_OFF --> REPORT
    REPORT --> EXPORT
    EXPORT --> END

    %% Subgraphs
    subgraph CALIBRATION ["Calibration Subsystem (Offline)"]
        MICROMETER[Stage Micrometer<br/>10 µm divisions]:::io
        BEADS[Polymer Beads<br/>10/50/100 µm]:::io
        COMPUTE[Compute µm/px Factor<br/>FFT or Manual Click]:::process
        VALIDATE_BEADS{Beads within<br/>±20%?}:::decision
        SAVE_CAL[Save calibration.json<br/>with timestamp + expiry]:::io
        MICROMETER --> COMPUTE
        BEADS --> VALIDATE_BEADS
        COMPUTE --> VALIDATE_BEADS
        VALIDATE_BEADS -- Yes --> SAVE_CAL
        VALIDATE_BEADS -- No --> MICROMETER
    end

    CAL_OK -.-> CALIBRATION
    CAL_WARN -.-> CALIBRATION
```

---

## Detailed Pipeline Flow

```mermaid
flowchart LR
    subgraph INPUT ["Image Input"]
        CAM[USB Microscope<br/>200×]:::io
        FILE[Pre-captured<br/>Images]:::io
    end

    subgraph PREPROC ["Preprocessing (OpenCV)"]
        BLUR[Median Blur<br/>3×3 kernel]:::process
        CLAHE[CLAHE<br/>clipLimit=2.0<br/>tileGrid=8×8]:::process
        RESIZE[Letterbox Resize<br/>640×640<br/>pad=114]:::process
    end

    subgraph DETECT ["Detection (YOLOv8n)"]
        MODEL[YOLOv8n<br/>3.2M params<br/>6 MB]:::process
        POST[Post-process<br/>NMS + Conf Filter]:::process
    end

    subgraph SIZING ["Sizing (OpenCV)"]
        CONTOUR[Find Contours<br/>in BBox ROI]:::process
        FERET[Feret Diameter<br/>Max + Min]:::process
        ECD[Equivalent<br/>Circular Diameter]:::process
        ASPECT[Aspect Ratio<br/>Feret_max/min]:::process
    end

    subgraph CALIB ["Calibration"]
        FACTOR[µm/px Factor]:::io
        APPLY[Multiply All<br/>Size Metrics]:::process
    end

    subgraph CONF ["Confidence"]
        DET_CONF[Mean Detection<br/>Confidence]:::process
        CAL_QUAL[Calibration<br/>Quality 0/0.5/1]:::process
        COVERAGE[Coverage<br/>Factor 0–1]:::process
        AGG[Aggregate<br/>Sample Confidence]:::process
    end

    subgraph OUTPUT ["Outputs"]
        JSON[JSON Report]:::io
        UI[Streamlit<br/>Dashboard]:::io
        FLAG[Lab Flag<br/>Per Particle]:::warning
    end

    CAM --> BLUR
    FILE --> BLUR
    BLUR --> CLAHE
    CLAHE --> RESIZE
    RESIZE --> MODEL
    MODEL --> POST
    POST --> CONTOUR
    CONTOUR --> FERET
    CONTOUR --> ECD
    CONTOUR --> ASPECT
    FERET --> APPLY
    ECD --> APPLY
    ASPECT --> APPLY
    FACTOR --> APPLY
    POST --> DET_CONF
    APPLY --> DET_CONF
    CAL_QUAL --> AGG
    COVERAGE --> AGG
    DET_CONF --> AGG
    AGG --> FLAG
    APPLY --> JSON
    AGG --> JSON
    FLAG --> JSON
    JSON --> UI
```

---

## Calibration Flow (Standalone)

```mermaid
flowchart TD
    START_CAL([Start Calibration]):::startend
    WARMUP[Warm-up Microscope<br/>10 minutes]:::process
    SET_MAG[Set Working<br/>Magnification]:::process
    CAP_MICRO[Capture Micrometer<br/>Image]:::io
    COMPUTE[Auto-compute<br/>µm/px Factor]:::process
    CAP_BEADS[Capture Bead Slide<br/>10/50/100 µm]:::io
    RUN_SIZING[Run Detection +<br/>Sizing on Beads]:::process
    CHECK{All Beads<br/>±20%?}:::decision
    FAIL[❌ Recalibrate<br/>Check Focus/Illumination]:::warning
    SAVE[Save calibration.json<br/>Timestamp + Expiry]:::io
    END_CAL([Calibration Ready]):::startend

    START_CAL --> WARMUP
    WARMUP --> SET_MAG
    SET_MAG --> CAP_MICRO
    CAP_MICRO --> COMPUTE
    COMPUTE --> CAP_BEADS
    CAP_BEADS --> RUN_SIZING
    RUN_SIZING --> CHECK
    CHECK -- No --> FAIL
    FAIL --> SET_MAG
    CHECK -- Yes --> SAVE
    SAVE --> END_CAL
```

---

## Decision Logic: "Needs Lab Confirmation"

```mermaid
flowchart TD
    START_FLAG([Evaluate Particle]):::startend
    C1{"Particle Conf<br/>< 0.5?"}:::decision
    C2{"Sample Conf<br/>< 0.6?"}:::decision
    C3{Calibration<br/>Invalid?}:::decision
    C4{"Size > 5000 µm?"}:::decision
    C5{"Class ∈<br/>film / foam / pellet?"}:::decision
    C6{"Aspect Ratio<br/>> 10?"}:::decision
    FLAG_TRUE[🚩 NEEDS LAB<br/>CONFIRMATION]:::warning
    FLAG_FALSE[✅ Screening<br/>Reliable]:::process

    START_FLAG --> C1
    C1 -- Yes --> FLAG_TRUE
    C1 -- No --> C2
    C2 -- Yes --> FLAG_TRUE
    C2 -- No --> C3
    C3 -- Yes --> FLAG_TRUE
    C3 -- No --> C4
    C4 -- Yes --> FLAG_TRUE
    C4 -- No --> C5
    C5 -- Yes --> FLAG_TRUE
    C5 -- No --> C6
    C6 -- Yes --> FLAG_TRUE
    C6 -- No --> FLAG_FALSE
```

---

## Data Flow: Image → JSON

```mermaid
sequenceDiagram
    participant User
    participant UI as Streamlit UI
    participant Pre as Preprocessing
    participant YOLO as YOLOv8n
    participant CV as OpenCV Sizing
    participant Cal as Calibration Store
    participant Conf as Confidence Engine
    participant Report as Report Generator

    User->>UI: Upload image
    UI->>Pre: Raw image (RGB)
    Pre->>Pre: Median blur + CLAHE + resize
    Pre->>YOLO: 640×640 tensor
    YOLO->>YOLO: Forward pass
    YOLO->>CV: Bounding boxes + confidences
    UI->>Cal: Load calibration.json
    Cal-->>UI: factor_um_per_px, valid, expiry
    CV->>CV: Contours → Feret, ECD
    CV->>CV: Apply factor_um_per_px
    CV->>Conf: Per-particle sizes + det conf
    Conf->>Conf: Aggregate sample confidence
    Conf->>Conf: Check flag conditions
    Conf->>Report: All metrics + flags
    Report->>UI: Annotated image + histogram + JSON
    UI->>User: Dashboard + Download
```

---

## Deployment Topology

```mermaid
graph TB
    subgraph FIELD ["Field / Lab"]
        MICRO[USB Microscope]
        PI[Raspberry Pi 4<br/>or Laptop]
        MICRO --> PI
    end

    subgraph EDGE ["Edge Processing (Offline)"]
        APP[Streamlit App<br/>Port 8501]
        MODEL[best.pt<br/>6 MB]
        CALIB[calibration.json]
        DATA[demo_images/]
        APP --> MODEL
        APP --> CALIB
        APP --> DATA
    end

    subgraph OUTPUTS ["Outputs"]
        JSON[results.json]
        CSV[trends.csv]
        IMG[annotated.png]
    end

    PI --> APP
    APP --> JSON
    APP --> CSV
    APP --> IMG

    subgraph OPTIONAL ["Optional (Future)"]
        CLOUD[(Cloud DB)]
        DASH[Grafana Dashboard]
        ALERT[Alert Webhook]
        JSON -.-> CLOUD
        CLOUD -.-> DASH
        CLOUD -.-> ALERT
    end
```

---

## Mermaid Rendering Notes

- Paste into any Markdown viewer with Mermaid support (GitHub, GitLab, Notion, Obsidian, VS Code with extension)
- For live demo: `markmap` or `mermaid-cli` can render to SVG/PNG
- Colors chosen for accessibility (colorblind-safe palette)

---

*Generated for HackMatrix 5.0 — Team Nishtha*