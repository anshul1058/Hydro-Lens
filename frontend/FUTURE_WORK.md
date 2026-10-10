# Future Work — Hydro Lens

## v1.1 — Usability & Robustness (1 Month)

| Task | Description | Effort | Impact |
|------|-------------|--------|--------|
| Multi-image grid scan | Auto-capture 3×3 grid on filter, stitch results | Medium | Whole-filter coverage |
| Auto-focus check | Laplacian variance → warn if blurry | Low | Reduce bad images |
| Batch processing | Folder of images → single CSV report | Low | Lab workflow |
| Calibration wizard UI | Step-by-step with live preview | Medium | Field usability |
| Export formats | CSV, Excel, COCO JSON, Label Studio | Low | Interop |
| Dark mode UI | Streamlit theme toggle | Trivial | Demo polish |

---

## v1.2 — Detection Quality (2 Months)

| Task | Description | Effort | Impact |
|------|-------------|--------|--------|
| Fiber-specific head | Add keypoint regression for fiber endpoints | Medium | Better fiber length |
| Shape features | Circularity, solidity, aspect ratio per particle | Low | Better discrimination |
| Test-time augmentation | TTA (flip, rotate) → ensemble | Low | +2–3% mAP |
| Hard negative mining | Curate false positives from blanks → retrain | Medium | Lower FP rate |
| Size-stratified loss | Weight loss by particle size (inverse freq) | Medium | Better small-particle recall |

---

## v2.0 — Polymer Hints (3–4 Months)

> **Still not polymer ID — but spectral hints to prioritize lab work**

| Task | Description | Effort | Impact |
|------|-------------|--------|--------|
| Low-cost NIR add-on | 900–1700 nm LED + InGaAs sensor (~$150) | High | Polymer class hints (PE/PP vs PET/PVC) |
| Spectral library matching | Match absorbance peaks to reference spectra | Medium | Triage for FTIR |
| Multi-modal fusion | Combine morphology + spectral → confidence | High | Reduce lab confirmations |
| Plastic vs non-plastic classifier | Binary head trained on sand/organics | Medium | Lower false positives |

---

## v2.1 — Concentration & Quantitation (4 Months)

| Task | Description | Effort | Impact |
|------|-------------|--------|--------|
| Volume-aware concentration | Input filtered volume → particles/L with uncertainty | Low | Regulatory-ready numbers |
| Uncertainty propagation | Monte Carlo on count + sizing + volume → CI | Medium | Honest error bars |
| Blank subtraction | Run procedural blank → auto-subtract | Low | Real-world accuracy |
| Limit of quantification (LOQ) | Compute per-sample LOQ from blank stats | Medium | Detection limit reporting |

---

## v3.0 — Network & Scale (6+ Months)

| Task | Description | Effort | Impact |
|------|-------------|--------|--------|
| Edge fleet management | Balena/Watchtower for Pi fleet updates | Medium | Deploy at scale |
| Central dashboard | Grafana + TimescaleDB for multi-site trends | High | Utility/municipal use |
| Alerting | Threshold breach → email/Telegram/webhook | Medium | Early warning |
| Citizen science app | Phone app: capture → upload → see map | High | Community monitoring |
| Data sharing standard | Adopt Microplastics Data Schema (if exists) | Low | Interop with global databases |

---

## Research Collaborations

| Partner | Focus | Status |
|---------|-------|--------|
| PCCOE Env. Eng. | Field validation on Mula river | Planned |
| NCL Pune | FTIR correlation study | Discussion |
| CPCB / MPCB | Regulatory alignment | Exploratory |
| IIT Bombay | Microfluidic sample prep integration | Idea stage |

---

## Hardware Evolution

| Version | Concept | Est. Cost | Target |
|---------|---------|-----------|--------|
| v1 (current) | USB microscope + Pi 4 | $200 | Hackathon |
| v2 | Custom PCB: IMX477 + motorized focus + ring LED | $120 | Pilot |
| v3 | Integrated: pump + filter + microscope + Pi CM4 | $350 | Product |
| v4 | Spectral: + NIR LED array + InGaAs | $500 | v2.0+ |

---

## Software Architecture Improvements

- [ ] **Plugin system** for custom detectors (YOLO, RT-DETR, custom)
- [ ] **Async pipeline** for video-rate processing (future camera)
- [ ] **ONNX export** for TensorRT / NCNN on edge accelerators
- [ ] **Model registry** with versioning, auto-rollback
- [ ] **Telemetry** (opt-in): inference time, confidence dist, error rates

---

## Documentation & Community

- [ ] **SOP PDF** for sample prep + calibration (printable field guide)
- [ ] **Video tutorials** (YouTube): calibration, sampling, interpretation
- [ ] **Contributor guide** for model retraining on new data
- [ ] **Benchmark suite** for comparing models on HMPD
- [ ] **Docker image** for one-command deploy

---

## Stretch / Moonshot

| Idea | Why | Feasibility |
|------|-----|-------------|
| **Drone water sampling** | Autonomous river monitoring | Low (regulatory) |
| **Microfluidic concentrator** | 100× concentration on-chip | Medium (fab access) |
| **Raman-on-chip** | True polymer ID in field | Low ($$$) |
| **Global microplastics map** | Crowdsourced data layer | High (if community adopts) |

---

## Prioritization Framework

```
Score = (Impact × Confidence) / Effort
```

| Priority | Criteria |
|----------|----------|
| **P0 (Must)** | Blocks v1.0 demo, safety, honesty |
| **P1 (Should)** | Significant UX/accuracy gain, < 2 weeks |
| **P2 (Nice)** | Differentiator, 2–4 weeks |
| **P3 (Later)** | Research, > 1 month, needs partners |

---

## Current Sprint (Hackathon → Pilot)

| Week | Focus | Deliverable |
|------|-------|-------------|
| 0 (now) | Demo polish, docs, backup video | HackMatrix submission |
| 1 | Calibration wizard, blank subtraction | Usable by non-team |
| 2 | Multi-image grid, batch CSV | Lab workflow |
| 3 | FTIR correlation study (with NCL) | Validation data |
| 4 | Pilot with Pune water utility | Real deployment |

---

## Success Metrics (Post-Hackathon)

| Metric | Target (3 mo) | Target (12 mo) |
|--------|---------------|----------------|
| Field deployments | 3 | 20 |
| Samples screened | 500 | 10,000 |
| Lab confirmations triggered | 50 | 500 |
| False positive rate | < 5% | < 2% |
| Community contributors | 5 | 50 |
| Citations / references | 1 | 10 |

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Model fails on new water type | High | Continuous eval on local data; retrain pipeline |
| Calibration drift in field | Medium | Temp sensor + auto-recal prompt |
| Regulatory rejection | Medium | Position as screening; publish validation data |
| Hardware supply chain | Low | Design for generic components |
| Team bandwidth (graduation) | High | Open source + documentation for handoff |

---

## Contributing

See `CONTRIBUTING.md` (to be created) for:
- Code style (black, ruff, mypy)
- PR template with checklist
- Model retraining workflow
- Dataset contribution process

---

*Last updated: 2026-09-25 | Team Nishtha | HackMatrix 5.0*