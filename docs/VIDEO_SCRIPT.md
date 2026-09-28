# Demo Video Script — Hydro Lens

**Total runtime:** 3:00 (trim to 2:00 if the limit is tight — cut sections marked ⭑)
**Format:** Screen recording + voiceover, 1920×1080, no music under VO (soft BGM at -25 dB ok)
**Tone:** Fast, factual, no hype words. Let the screen do the proving.

---

## Timeline

| # | Section | Time | Cumulative |
|---|---------|------|-----------|
| 0 | Hook | 0:00–0:10 | 10s |
| 1 | Problem statement | 0:10–0:35 | 35s |
| 2 | Solution | 0:35–0:50 | 50s |
| 3 | ⭑ AI pipeline | 0:50–1:30 | 1:30 |
| 4 | Uniqueness | 1:30–1:55 | 1:55 |
| 5 | Live demo | 1:55–2:30 | 2:30 |
| 6 | Results | 2:30–2:42 | 2:42 |
| 7 | ⭑ Future scope | 2:42–2:55 | 2:55 |
| 8 | Close | 2:55–3:00 | 3:00 |

---

## 0. Hook (10s)

**Screen:** Black → microscope image with green boxes popping on one by one (0.5s each).

> "Eighty-three percent of tap water has microplastics in it. Testing one sample costs five hundred dollars and takes a week. This does it in three seconds, on a laptop."

**Cut to:** Hydro Lens logo + tagline *"Screen more. Know sooner. Trust the numbers."*

---

## 1. Problem Statement (25s)

**Screen:** Static slide or B-roll — filtration setup, river water, lab FTIR shot.

> "Microplastics are in rivers, taps, and soil — but we barely measure them, because lab methods like FTIR and Raman are expensive, slow, and lab-bound.
>
> Result: monitoring is sparse. Utilities sample a hundred times a year instead of a hundred times a day. We only find out when it's already in the food chain.
>
> The gap isn't identification — it's **screening**. Cheap, portable, frequent, so labs only analyze what actually matters."

**On-screen text (lower third):**
- $500–$5,000/sample · days–weeks · lab-bound
- 83% of tap water contains microplastics (Orb Media)

---

## 2. Solution (15s)

**Screen:** Hydro Lens home page → slow scroll to the hero.

> "Hydro Lens is an AI optical screening system. Filter the water, image it under a microscope, upload — and you get particle count, size in microns, a confidence score, and a flag telling you whether to send it to a lab. All offline, all on-device."

**On-screen text:** Count · Size (µm) · Confidence · Lab flag — < 3s, offline

---

## 3. AI Pipeline (40s) — ⭑ must keep

**Screen:** Animated flow diagram, one stage lighting up per line of VO. Steal the flowchart from `docs/ARCHITECTURE.md` or rebuild in Figma.

> "Here's the pipeline.
>
> **One — preprocessing.** Median blur to kill sensor noise, CLAHE to even out illumination, then resize to 640 by 640.
>
> **Two — detection.** A fine-tuned YOLOv8n — 3.2 million parameters, 6 megabytes — draws a bounding box on every particle with a confidence per box. We trained it on two public microplastic datasets: fluorescence imagery and wastewater-treatment fragments — 3,700 training images, 558 validation, and a 301-image test set the model never saw during training.
>
> **Three — sizing.** The box goes into OpenCV, which measures Feret's diameter and equivalent circular diameter in pixels — then converts to microns using the calibration factor.
>
> **Four — calibration gate.** A stage micrometer image gives microns-per-pixel; 10, 50 and 100 micron reference beads validate it to within twenty percent. Calibration expires after seven days. No valid calibration, no size numbers — the system refuses rather than guess.
>
> **Five — confidence and flags.** Sample confidence equals mean detection confidence, times calibration quality, times image coverage. Below 0.6, or a fiber, a 5-millimeter chunk, a stale calibration — it flags the sample for lab confirmation.
>
> **Six — report.** JSON and a dashboard, in under two seconds on a CPU."

**On-screen text (build in as spoken):**
```
Preprocess → YOLOv8n detect → OpenCV sizing → Calibration gate → Confidence/flags → Report
Median blur + CLAHE    6 MB, 3.2M params    Feret + ECD       µm/px + bead check   = mean_conf × qual × coverage
```

**Cut to:** Training curves screenshot (`runs/train/*/results.csv` → plot) for 2s while saying "fine-tuned".

---

## 4. Uniqueness (25s)

**Screen:** Three-column comparison slide, or the confidence gauge animating from 0.9 → 0.4 and the flag firing.

> "Three things nobody else in this space does.
>
> **One — honest confidence.** Every result ships with a score you can act on. Above 0.8, trust it. Below 0.6, we tell you to go to a lab. Most tools give you a number and no idea whether to believe it.
>
> **Two — a calibration gate that can say no.** If calibration is missing or stale, quantitative output is blocked. That's not a bug — it's the feature that makes the rest trustworthy.
>
> **Three — screening, not fake identification.** We never claim polymer ID or regulatory compliance. We detect candidates, size them, and flag what needs FTIR. The limitations are in the product, not buried in a footnote."

**On-screen text:**
- Honest confidence scoring
- No calibration → no numbers
- Screening, honestly scoped

---

## 5. Live Demo (35s)

**Screen:** Real app, fast cuts. Speed up dead time 2× if needed.

1. **Calibration** (8s) → open Calibration page, show green "valid" banner, micrometer image.
   > "Calibration: stage micrometer, validated with reference beads."
2. **Negative control** (7s) → upload blank filter, run, 0 detections.
   > "Blank filter — zero detections. We don't hallucinate."
3. **Real sample** (12s) → upload `demo_microplastic_sample.jpg`, annotated boxes appear, size histogram, confidence gauge, particle table.
   > "Real sample: particles found, sized in microns, confidence 0.7-something, flagged where it should be."
4. **Export** (5s) → download JSON, open it.
   > "One click, JSON out — feeds a database, a LIMS, a trend dashboard."

---

## 6. Results (12s)

**Screen:** Metrics slide (from `docs/MODEL_CARD.md` measured values).

> "Measured, not projected: on a held-out test set of 301 images and 852 particles the model never trained on — precision 0.77, recall 0.78, mAP at IoU 0.5 of 0.85. Sizing error on 50-micron reference beads is 3 percent. Full pipeline under 3 seconds on a laptop CPU, 6 megabyte model — it runs on a Raspberry Pi."

**On-screen text:**
| Metric | Value |
|---|---|
| Test mAP@0.5 | 0.846 (301 img / 852 inst) |
| Precision / Recall | 0.773 / 0.776 |
| Sizing error (50 µm beads) | ±3% |
| Model size | 6 MB |
| Inference | < 3 s CPU |

---

## 7. Future Scope (13s) — ⭑ must keep

**Screen:** Roadmap slide, four boxes lighting left to right (from `docs/FUTURE_WORK.md`).

> "Next: **v1.1** multi-image grid scan and batch processing, so a whole filter is covered, not one frame. **v1.2** shape features and hard-negative mining to push false positives under two percent. **v2.0** a low-cost NIR add-on for polymer *hints* — PE and PP versus PET and PVC — to cut lab referrals. **v2.1** filtered-volume input, so counts become concentration with real error bars. **v3.0** a networked fleet of these feeding one dashboard, for utilities screening daily instead of yearly."

**On-screen text:**
```
v1.1 Grid scan + batch  →  v1.2 Shape features + FP reduction
        ↓
v2.0 NIR polymer hints  →  v2.1 Concentration + uncertainty  →  v3.0 Sensor network
```

---

## 8. Close (5s)

**Screen:** Logo, repo URL, live demo URL.

> "Hydro Lens — a blood-pressure cuff for water. Screen more, know sooner, trust the numbers. Code and live demo below."

**End card:** GitHub link · `hydro-lens-production.up.railway.app` · Team Nishtha, PCCOE Pune

---

## Must-Have Checklist (what the video needs)

**Assets — all exist in repo:**
- [ ] `frontend/public/assets/hero_lab_microscope.jpg` — hook / B-roll
- [ ] `frontend/public/assets/water_filtration_lab.jpg` — problem section
- [ ] `frontend/public/assets/microscope_tech.jpg` — pipeline backdrop
- [ ] `frontend/public/assets/morphology_*.jpg` — 5 class cards, pipeline section
- [ ] `frontend/public/assets/calibration_metrology.jpg` — calibration shot
- [ ] `frontend/public/assets/system_diagnostics_hw.jpg` — hardware / Pi shot
- [ ] `frontend/public/demo/demo_microplastic_sample.jpg` — main demo input
- [ ] `frontend/public/demo/blank_filter_control.png` — negative control
- [ ] `frontend/public/api/references/file/stage_micrometer_scale.png` — calibration
- [ ] Training curves from `runs/train/*/results.csv`

**Screen recordings (record once, cut later):**
- [ ] Home / hero scroll
- [ ] Calibration page with valid banner
- [ ] Analyze: blank filter → 0 detections
- [ ] Analyze: real sample → boxes + histogram + confidence gauge + table
- [ ] JSON export opened in an editor

**Slides to make (5 max):** pipeline diagram · uniqueness 3-column · results metrics · roadmap · end card

**Rules:**
- Numbers on screen must match `docs/MODEL_CARD.md` measured values — no targets, no "up to".
- Never say "detects polymer type", "regulatory", or "accurate to" without the qualifier.
- Show the confidence flag firing at least once — it's the pitch.
- No cursor sitting still; speed up any dead air over 1.5s.

**Optional if time allows:** 3s shot of the $200 hardware kit (USB microscope + Pi 4 + micrometer) right before the close — it lands the portability claim.
