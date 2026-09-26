# Pitch Deck — Hydro Lens

**HackMatrix 5.0 | PCCOE, Pune**  
**Team Nishtha** — Anshul, Prithviraj, Ishwari, Janhavi

---

## Slide 1: Title

# Hydro Lens
### Portable Microplastics Screening in Seconds, Not Days
**HackMatrix 5.0 | Team Nishtha | PCCOE Pune**

---

## Slide 2: The Problem

### Microplastics Are Everywhere — But We Can't See Them

- **83% of tap water** contains microplastics (Orb Media)
- **Current methods:** Lab-only, $500–$5,000/sample, days to weeks
- **Result:** Sparse monitoring → blind spots in rivers, taps, oceans
- **Need:** Affordable, portable, frequent screening → *early warning*

> "We manage what we measure. Today, we barely measure microplastics."

---

## Slide 3: Our Solution

### Hydro Lens — AI-Powered Optical Screening

| | **Before** | **Hydro Lens** |
|---|---|---|
| **Time/sample** | Days | **< 3 seconds** |
| **Cost/sample** | $500+ | **<$0.01** (after hardware) |
| **Expertise** | PhD + lab | **Citizen scientist** |
| **Output** | Count + polymer ID | **Count + size + confidence + lab flag** |
| **Portability** | Lab-bound | **Backpack-ready** |

**Core insight:** *Screening ≠ Identification.* We detect *candidates*, estimate *count/size*, and *flag for lab* — honestly, transparently.

---

## Slide 4: How It Works

```
Microscope Image → AI Detection (YOLOv8n) → CV Sizing (OpenCV) → Calibrated Report
        │                  │                      │                    │
      200×              3.2M params            Feret + ECD         JSON + Dashboard
      RGB               6 MB                  µm/pixel            Confidence + Flags
```

**Pipeline:** Preprocess → Detect → Size → Calibrate → Report — all offline, on-device.

---

## Slide 5: Key Innovation — Honest Confidence

### Every Result Comes With a Confidence Score

```
Sample Confidence = Mean Detection Conf × Calibration Quality × Coverage
```

| Confidence | Meaning | Action |
|------------|---------|--------|
| **≥ 0.8** | Reliable | Trend monitoring |
| **0.6–0.8** | Indicative | Collect more data |
| **< 0.6** | **Flag for lab** | Send to FTIR/Raman |

**No false precision.** If calibration missing → quantitative output **blocked**.

---

## Slide 6: Calibration — The Gatekeeper

### No Calibration = No Numbers

- Stage micrometer (10 µm divisions) → µm/pixel factor
- Polymer reference beads (10/50/100 µm) → validation ±20%
- Auto-expires in 7 days or on magnification change
- **System refuses concentration output without valid calibration**

> This is not a bug. It's the feature that makes us trustworthy.

---

## Slide 7: Results — Real Performance

| Metric | Value | Validation |
|--------|-------|------------|
| **mAP@0.5 (HMPD test)** | **0.63** | Independent dataset, never trained on |
| **Recall 25–500 µm fragments** | **> 70%** | Size-stratified |
| **Sizing error (50 µm beads)** | **±3%** | NIST-traceable beads |
| **Inference (Pi 4, CPU)** | **2.8 sec** | Full pipeline |
| **Model size** | **6 MB** | Runs on $50 hardware |

---

## Slide 8: Demo — Live in 30 Seconds

1. **Calibrate** — micrometer → beads → saved
2. **Upload** — microscope image of filtered water
3. **See** — annotated image, size histogram, confidence gauge
4. **Export** — JSON for records, CSV for trends

*Works on laptop, Pi, phone (via Streamlit). No cloud needed.*

---

## Slide 9: Hardware — $200 Field Kit

| Component | Cost | Notes |
|-----------|------|-------|
| USB Microscope (200×) | $80 | AmScope / generic |
| Raspberry Pi 4 (4 GB) | $55 | Or use laptop |
| Stage micrometer | $30 | 10 µm divisions |
| PS beads (10/50/100 µm) | $25 | Thermo Scientific |
| Filtration kit | $15 | 47 mm, 10 µm pore |
| **Total** | **~$205** | **One-time** |

**Per-sample cost:** Filter + electricity ≈ $0.01

---

## Slide 10: Impact & Scale

### From 100 Samples/Year → 100 Samples/Day

- **Water utilities:** Daily intake screening
- **Researchers:** Spatial/temporal gradients in rivers
- **Citizen science:** School/NGO monitoring networks
- **Emergency response:** Spill screening in hours, not weeks

**Open source + open hardware = global deployment potential.**

---

## Slide 11: What We're NOT Claiming

| ❌ Not This | ✅ This Instead |
|------------|----------------|
| Polymer identification | Morphological screening |
| Regulatory compliance | Lab-confirmation flag |
| Absolute quantification | Calibrated relative estimates |
| Magic box | Transparent confidence + limitations |

**Honesty is our competitive advantage.**

---

## Slide 12: Roadmap

| Phase | Timeline | Milestone |
|-------|----------|-----------|
| **v1.0** | Now | Screening system (this demo) |
| **v1.1** | 1 month | Multi-image stitching, auto-grid scan |
| **v2.0** | 3 months | Spectral add-on (low-cost NIR) for polymer hints |
| **v3.0** | 6 months | Cloud aggregation + alerting for sensor networks |

---

## Slide 13: Team Nishtha

| Member | Role | Superpower |
|--------|------|------------|
| **Anshul** | ML/Backend | YOLO fine-tuning, optimization |
| **Prithviraj** | CV/Hardware | OpenCV sizing, calibration, Pi deployment |
| **Ishwari** | Data/UI | Dataset curation, Streamlit UX |
| **Janhavi** | Docs/QA | Model card, calibration SOP, testing |

**PCCOE, Pune** — Computer Engineering, Final Year

---

## Slide 14: Ask & Close

### We're Building the "Blood Pressure Cuff" for Water

> Cheap, fast, honest screening — so labs only analyze what matters.

**Resources needed:**
- Mentorship: Environmental engineering / regulatory pathway
- Partnerships: Water utilities for field pilots
- Compute: Jetson Orin for edge optimization

**Repo:** `github.com/team-nishtha/hydro-lens`  
**Demo:** Running live on this laptop

---

## Appendix: Technical Deep Dive (Judges' Q&A)

### Q: Why YOLOv8n, not segmentation?
**A:** Bounding boxes sufficient for count/size. 10× faster, 1/10 model size. Segmentation adds < 5% sizing accuracy for 100× compute.

### Q: How do you handle fluorescent vs bright-field?
**A:** Mixed training data (Dataset 1 = fluorescence, Dataset 2 = bright-field). Test on HMPD (mixed). Domain gap acknowledged in limitations.

### Q: What about false positives from sand/organics?
**A:** Confidence scoring + "needs lab confirmation" flag. Shape features (aspect ratio, circularity) in Future Work for better discrimination.

### Q: Concentration accuracy?
**A:** Depends on filtration volume, imaged area, calibration. We provide the formula + uncertainty — not a single number.

### Q: Regulatory path?
**A:** Screening tool → ISO 24187 complement. Not a replacement. Working with [local water board] for pilot validation.

---

**Thank You. Questions?**

*Team Nishtha — Hydro Lens — HackMatrix 5.0*