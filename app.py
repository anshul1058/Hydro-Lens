import os
import io
import json
import time
import yaml
from datetime import datetime, timezone
import numpy as np
import cv2
import PIL.Image
import streamlit as st
import matplotlib.pyplot as plt

from src.preprocess import preprocess_image
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

# ---------------------------------------------------------
# Page Config & Custom Aesthetic Styling
# ---------------------------------------------------------
st.set_page_config(
    page_title="Hydro Lens — Microplastics Screening Backend",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="expanded"
)

CUSTOM_CSS = """
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    
    .main {
        background-color: #0b0f19;
        color: #f1f5f9;
    }
    
    .stApp {
        background: linear-gradient(135deg, #0b0f19 0%, #111827 100%);
    }
    
    .metric-card {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        backdrop-filter: blur(10px);
    }
    
    .metric-value {
        font-size: 28px;
        font-weight: 700;
        color: #38bdf8;
    }
    
    .metric-label {
        font-size: 13px;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .banner-valid {
        background: rgba(16, 185, 129, 0.15);
        border-left: 4px solid #10b981;
        padding: 12px 18px;
        border-radius: 6px;
        color: #6ee7b7;
        margin-bottom: 20px;
    }

    .banner-stale {
        background: rgba(245, 158, 11, 0.15);
        border-left: 4px solid #f59e0b;
        padding: 12px 18px;
        border-radius: 6px;
        color: #fcd34d;
        margin-bottom: 20px;
    }

    .banner-missing {
        background: rgba(239, 68, 68, 0.15);
        border-left: 4px solid #ef4444;
        padding: 12px 18px;
        border-radius: 6px;
        color: #fca5a5;
        margin-bottom: 20px;
    }
    
    .badge-pass {
        background-color: #065f46;
        color: #34d399;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
    }
    
    .badge-flag {
        background-color: #7f1d1d;
        color: #fca5a5;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
    }
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

# ---------------------------------------------------------
# Load Configuration & Cached Singletons
# ---------------------------------------------------------
@st.cache_data
def load_config():
    cfg_path = "config.yaml"
    if os.path.exists(cfg_path):
        with open(cfg_path, "r") as f:
            return yaml.safe_load(f)
    return {}

CFG = load_config()

@st.cache_resource
def get_detector():
    weights_path = CFG.get("model", {}).get("weights_path", "models/best.pt")
    return Detector(weights_path=weights_path, config=CFG)

@st.cache_resource
def get_cal_manager():
    cal_file = CFG.get("paths", {}).get("calibration_file", "data/calibration/calibration.json")
    return CalibrationManager(cal_file=cal_file, config=CFG)

# Initialize Session State
if "sample_id_counter" not in st.session_state:
    st.session_state["sample_id_counter"] = 1

# ---------------------------------------------------------
# Sidebar Navigation
# ---------------------------------------------------------
with st.sidebar:
    st.image("https://raw.githubusercontent.com/feathericons/feather/master/icons/disc.svg", width=40)
    st.title("Hydro Lens 🔬")
    st.caption("Portable Optical Microplastic Screening")
    st.divider()

    nav_choice = st.radio(
        "Navigation",
        ["🔍 Analyze Sample", "📐 Calibration Portal", "📜 System Diagnostics & Docs"],
        index=0
    )
    
    st.divider()
    
    # Calibration Quick Status in Sidebar
    cal_mgr = get_cal_manager()
    cal_data = cal_mgr.load()
    is_valid_cal, cal_reason, cal_quality = cal_mgr.is_valid(cal_data)

    st.markdown("### 📊 Calibration Status")
    if not is_valid_cal or cal_quality == 0.0:
        st.markdown("<span class='badge-flag'>🚫 MISSING / INVALID</span>", unsafe_allow_html=True)
        st.caption("Quantitative size & concentration disabled.")
    elif cal_quality == 0.5:
        st.markdown("<span class='badge-flag'>⚠️ STALE (> 7 Days)</span>", unsafe_allow_html=True)
        st.caption(f"Factor: `{cal_data.get('factor_um_per_px', 0)} µm/px`")
    else:
        st.markdown("<span class='badge-pass'>✅ VALID & ACTIVE</span>", unsafe_allow_html=True)
        st.caption(f"Factor: `{cal_data.get('factor_um_per_px', 0)} µm/px` ({cal_data.get('magnification', '200x')})")

    st.divider()
    st.caption("Hydro Lens v1.0 • HackMatrix 5.0 • Team Nishtha")


# ---------------------------------------------------------
# PAGE 1: ANALYZE SAMPLE
# ---------------------------------------------------------
def page_analyze():
    st.title("🔬 Sample Analysis & Screening")
    st.caption("Upload optical microscope image for automated microplastic candidate detection and sizing.")

    cal_mgr = get_cal_manager()
    cal_data = cal_mgr.load()
    is_valid_cal, cal_reason, cal_quality = cal_mgr.is_valid(cal_data)
    um_per_px = cal_data.get("factor_um_per_px") if (cal_data and is_valid_cal and cal_quality > 0) else None

    # Calibration Banner
    if cal_quality == 0.0:
        st.markdown(
            "<div class='banner-missing'><strong>⚠️ CALIBRATION REQUIRED:</strong> No valid calibration found. "
            "Detection is active, but <strong>quantitative sizing and particle count distributions are blocked</strong>. "
            "Go to the <em>Calibration Portal</em> to set scale factor.</div>",
            unsafe_allow_html=True
        )
    elif cal_quality == 0.5:
        st.markdown(
            f"<div class='banner-stale'><strong>⚠️ CALIBRATION STALE:</strong> Calibration is over 7 days old. "
            f"Current factor: <code>{um_per_px} µm/px</code>. Results will be marked with a 0.5 quality factor.</div>",
            unsafe_allow_html=True
        )
    else:
        st.markdown(
            f"<div class='banner-valid'><strong>✅ CALIBRATION ACTIVE:</strong> Factor: <code>{um_per_px} µm/px</code> "
            f"| Mag: <code>{cal_data.get('magnification', '200x')}</code> | Valid until: <code>{cal_data.get('expires', '')[:10]}</code></div>",
            unsafe_allow_html=True
        )

    # Input Method Selection
    input_type = st.radio("Select Image Input Source:", ["Upload Local Image", "Use Demo Reference Images"], horizontal=True)

    image_source = None
    sample_filename = f"sample_{st.session_state['sample_id_counter']:03d}.jpg"

    if input_type == "Upload Local Image":
        uploaded_file = st.file_uploader(
            "Choose a microscope image (JPG, PNG, TIFF):",
            type=["jpg", "jpeg", "png", "tif", "tiff"]
        )
        if uploaded_file is not None:
            image_source = uploaded_file.getvalue()
            sample_filename = uploaded_file.name
    else:
        demo_choice = st.selectbox(
            "Select Demo Reference Image:",
            ["Demo Microplastics Sample (Mixed Candidates)", "Blank Filter Control (Clean Reference)", "Stage Micrometer Scale"]
        )
        demo_map = {
            "Demo Microplastics Sample (Mixed Candidates)": "data/reference/demo_microplastic_sample.jpg",
            "Blank Filter Control (Clean Reference)": "data/reference/blank_filter_control.png",
            "Stage Micrometer Scale": "data/reference/stage_micrometer_scale.png"
        }
        ref_path = demo_map[demo_choice]
        if os.path.exists(ref_path):
            image_source = ref_path
            sample_filename = os.path.basename(ref_path)

    if image_source is None:
        st.info("👆 Please upload an image or select a demo sample above to begin analysis.")
        return

    # Trigger Analysis Button
    col_btn, _ = st.columns([1, 4])
    with col_btn:
        run_analysis = st.button("🚀 Run Screening Pipeline", type="primary", use_container_width=True)

    if run_analysis or "last_analysis" in st.session_state:
        # Save last analysis if button clicked
        if run_analysis:
            start_time = time.time()
            with st.spinner("Processing pipeline: Preprocessing → YOLOv8n Inference → OpenCV Sizing → Confidence Scoring..."):
                # 1. Preprocessing (Median blur + CLAHE)
                prep_result = preprocess_image(image_source, config=CFG)
                prep_img = prep_result["preprocessed"]
                orig_img = prep_result["original"]
                orig_shape = prep_result["original_shape"]

                # 2. YOLO Detection
                detector = get_detector()
                detections = detector.predict(prep_img)

                # 3. OpenCV Particle Sizing
                sized_detections = compute_particle_sizes(
                    image=prep_img,
                    detections=detections,
                    um_per_px=um_per_px,
                    config=CFG
                )

                # 4. Confidence Scoring & Flag Evaluation
                sample_conf, needs_lab_flag, final_detections, flags_list, breakdown = compute_sample_confidence(
                    detections=sized_detections,
                    calibration=cal_data if is_valid_cal else None,
                    image_shape=orig_shape,
                    config=CFG
                )

                # 5. Render Annotations
                annotated_img = draw_annotations(prep_img, final_detections, show_sizes=(um_per_px is not None))

                # 6. Size Bins & Summary
                size_bins = compute_size_distribution(final_detections)
                latency_sec = round(time.time() - start_time, 3)

                sample_id = f"SL-{datetime.now().strftime('%Y%m%d')}-{st.session_state['sample_id_counter']:03d}"

                summary_dict = {
                    "total_count": len(final_detections),
                    "size_distribution_um": size_bins if um_per_px else "BLOCKED (Missing Calibration)",
                    "sample_confidence": sample_conf,
                    "flag_lab_confirmation": needs_lab_flag,
                    "latency_sec": latency_sec
                }

                report_json = generate_report_json(
                    sample_id=sample_id,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    calibration_info=cal_data if is_valid_cal else None,
                    image_meta={"width_px": orig_shape[1], "height_px": orig_shape[0], "filename": sample_filename},
                    detections=final_detections,
                    summary_dict=summary_dict
                )

                st.session_state["last_analysis"] = {
                    "sample_id": sample_id,
                    "orig_img": orig_img,
                    "prep_img": prep_img,
                    "annotated_img": annotated_img,
                    "detections": final_detections,
                    "sample_conf": sample_conf,
                    "needs_lab_flag": needs_lab_flag,
                    "flags_list": flags_list,
                    "breakdown": breakdown,
                    "size_bins": size_bins,
                    "summary": summary_dict,
                    "report_json": report_json,
                    "latency_sec": latency_sec,
                    "detector_fallback": detector.fallback_mode,
                    "load_error": detector.load_error_message
                }

        # Retrieve analysis results from session state
        res = st.session_state["last_analysis"]

        if res.get("detector_fallback") and res.get("load_error"):
            st.warning(f"ℹ️ {res['load_error']}")

        st.divider()

        # Key Metric Cards Header
        m1, m2, m3, m4, m5 = st.columns(5)
        with m1:
            st.markdown(
                f"<div class='metric-card'><div class='metric-label'>Particle Count</div>"
                f"<div class='metric-value'>{res['summary']['total_count']}</div></div>",
                unsafe_allow_html=True
            )
        with m2:
            conf_color = "#34d399" if res['sample_conf'] >= 0.8 else ("#fcd34d" if res['sample_conf'] >= 0.6 else "#fca5a5")
            st.markdown(
                f"<div class='metric-card'><div class='metric-label'>Sample Confidence</div>"
                f"<div class='metric-value' style='color:{conf_color}'>{res['sample_conf']:.2f}</div></div>",
                unsafe_allow_html=True
            )
        with m3:
            lab_badge = "<span style='color:#fca5a5; font-weight:700'>REQUIRED ⚠️</span>" if res['needs_lab_flag'] else "<span style='color:#34d399; font-weight:700'>NO</span>"
            st.markdown(
                f"<div class='metric-card'><div class='metric-label'>Lab Confirm Flag</div>"
                f"<div class='metric-value' style='font-size:22px'>{lab_badge}</div></div>",
                unsafe_allow_html=True
            )
        with m4:
            area_val = f"{res['breakdown']['imaged_area_mm2']} mm²" if um_per_px else "N/A"
            st.markdown(
                f"<div class='metric-card'><div class='metric-label'>Imaged Area</div>"
                f"<div class='metric-value' style='font-size:22px'>{area_val}</div></div>",
                unsafe_allow_html=True
            )
        with m5:
            st.markdown(
                f"<div class='metric-card'><div class='metric-label'>Inference Time</div>"
                f"<div class='metric-value' style='font-size:22px'>{res['latency_sec']} s</div></div>",
                unsafe_allow_html=True
            )

        st.markdown("<br>", unsafe_allow_html=True)

        # Active Flags & Warnings
        if res["flags_list"]:
            with st.expander("🚩 Active Screening Flags & System Notes", expanded=res["needs_lab_flag"]):
                for flag in res["flags_list"]:
                    st.markdown(f"- **[{flag['type'].upper()}]**: {flag['message']}")

        # Results Tabs
        t1, t2, t3, t4, t5 = st.tabs([
            "🖼️ Visual Detection",
            "📊 Size Distribution & Bins",
            "📋 Particle Inspection Table",
            "🧮 Concentration Calculator",
            "💾 JSON Export & Download"
        ])

        # TAB 1: Visual Detection
        with t1:
            col_a, col_b = st.columns(2)
            with col_a:
                st.subheader("Annotated Candidate Particles")
                st.image(res["annotated_img"], caption="Green=High Conf | Orange=Med Conf | Red=Needs Lab Flag", use_column_width=True)
            with col_b:
                st.subheader("Preprocessed Input (Median Blur + CLAHE)")
                st.image(res["prep_img"], caption="640x640 RGB Letterbox", use_column_width=True)

        # TAB 2: Size Distribution & Bins
        with t2:
            if not is_valid_cal or cal_quality == 0.0:
                st.error("🚫 Quantitative size distribution is blocked because calibration is missing or invalid.")
            else:
                st.subheader("Microplastic Particle Size Distribution (µm)")
                sb = res["size_bins"]
                
                fig, ax = plt.subplots(figsize=(8, 4))
                fig.patch.set_facecolor('#0b0f19')
                ax.set_facecolor('#1e293b')
                
                categories = list(sb.keys())
                counts = list(sb.values())
                
                bars = ax.bar(categories, counts, color='#38bdf8', edgecolor='#0284c7', width=0.5)
                ax.set_xlabel("Size Bin (Equivalent Circular Diameter µm)", color='#94a3b8', fontsize=11)
                ax.set_ylabel("Particle Count", color='#94a3b8', fontsize=11)
                ax.tick_params(colors='#cbd5e1')
                ax.spines['bottom'].set_color('#475569')
                ax.spines['left'].set_color('#475569')
                ax.spines['top'].set_visible(False)
                ax.spines['right'].set_visible(False)
                
                for bar in bars:
                    height = bar.get_height()
                    if height > 0:
                        ax.annotate(f'{height}',
                                    xy=(bar.get_x() + bar.get_width() / 2, height),
                                    xytext=(0, 3),  # 3 points vertical offset
                                    textcoords="offset points",
                                    ha='center', va='bottom', color='#f1f5f9', fontweight='bold')
                
                st.pyplot(fig)

        # TAB 3: Particle Inspection Table
        with t3:
            st.subheader("Individual Candidate Particle Records")
            dets = res["detections"]
            if not dets:
                st.info("No candidate particles detected in this sample.")
            else:
                table_data = []
                for d in dets:
                    sz = d.get("size_um", {})
                    table_data.append({
                        "ID": d["id"],
                        "Class": d["class_name"],
                        "Confidence": d["confidence"],
                        "Feret Max (µm)": sz.get("feret_max", "N/A"),
                        "Feret Min (µm)": sz.get("feret_min", "N/A"),
                        "ECD (µm)": sz.get("ecd", "N/A"),
                        "Aspect Ratio": sz.get("aspect_ratio", "N/A"),
                        "Needs Lab Flag": "⚠️ YES" if d.get("needs_lab_confirmation") else "✅ NO",
                        "Reasons": ", ".join(d.get("lab_confirmation_reasons", [])) or "None"
                    })
                st.dataframe(table_data, use_container_width=True)

        # TAB 4: Concentration Calculator
        with t4:
            st.subheader("Water Concentration Estimation (Particles / Liter)")
            if not is_valid_cal or cal_quality == 0.0:
                st.error("🚫 Concentration calculation requires valid calibration factor.")
            else:
                c1, c2 = st.columns(2)
                with c1:
                    vol_ml = st.number_input("Filtered Sample Water Volume (mL):", min_value=1.0, value=1000.0, step=50.0)
                    dilution = st.number_input("Sample Dilution Factor:", min_value=1.0, value=1.0, step=0.1)
                
                with c2:
                    imaged_area = res["breakdown"]["imaged_area_mm2"]
                    conc = calculate_concentration(
                        total_count=len(res["detections"]),
                        imaged_area_mm2=imaged_area,
                        sample_volume_ml=vol_ml,
                        dilution_factor=dilution
                    )
                    st.markdown("<br>", unsafe_allow_html=True)
                    if conc is not None:
                        st.markdown(
                            f"<div class='metric-card'><div class='metric-label'>Estimated Concentration</div>"
                            f"<div class='metric-value' style='color:#34d399'>{conc:,} particles/L</div></div>",
                            unsafe_allow_html=True
                        )
                        st.caption(f"Based on {len(res['detections'])} particles detected over {imaged_area} mm² imaged filter area.")

        # TAB 5: JSON Export
        with t5:
            st.subheader("Machine-Readable JSON Report")
            json_str = json.dumps(res["report_json"], indent=2)
            st.code(json_str, language="json")
            
            st.download_button(
                label="📥 Download JSON Report",
                data=json_str,
                file_name=f"{res['sample_id']}_hydro_lens_report.json",
                mime="application/json"
            )


# ---------------------------------------------------------
# PAGE 2: CALIBRATION PORTAL
# ---------------------------------------------------------
def page_calibration():
    st.title("📐 Calibration Portal")
    st.caption("Manage optical scale factor (µm/pixel) and validate against reference polymer beads.")

    cal_mgr = get_cal_manager()
    cal_data = cal_mgr.load()
    is_valid_cal, cal_reason, cal_quality = cal_mgr.is_valid(cal_data)

    st.subheader("Current Active Calibration Record")
    if cal_data:
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Scale Factor", f"{cal_data.get('factor_um_per_px', 'N/A')} µm/px")
        c2.metric("Magnification", cal_data.get("magnification", "200x"))
        c3.metric("Status", "VALID" if cal_quality == 1.0 else ("STALE" if cal_quality == 0.5 else "INVALID"))
        c4.metric("Expires", cal_data.get("expires", "N/A")[:10])

        with st.expander("🔍 View Raw Calibration JSON", expanded=False):
            st.json(cal_data)
    else:
        st.warning("No calibration file found on system.")

    st.divider()
    st.subheader("🛠️ Run Calibration Wizard")

    wiz_tab1, wiz_tab2 = st.tabs(["Step 1: Compute µm/px Factor", "Step 2: Validate Reference Beads & Save"])

    with wiz_tab1:
        st.markdown("#### Method A: Automated Stage Micrometer FFT Line Detection")
        mic_file = st.file_uploader("Upload Stage Micrometer Image:", type=["png", "jpg", "jpeg"], key="cal_mic")
        use_preset = st.checkbox("Or use preset stage micrometer reference image", value=True)

        if use_preset or mic_file is not None:
            if mic_file is not None:
                img_bytes = mic_file.getvalue()
                nparr = np.frombuffer(img_bytes, np.uint8)
                mic_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            else:
                mic_img = cv2.imread("data/reference/stage_micrometer_scale.png")

            st.image(mic_img, caption="Stage Micrometer Scale Image", width=500)
            
            spacing_um = st.number_input("Known Micrometer Line Spacing (µm):", min_value=1.0, value=10.0)

            if st.button("Calculate Scale Factor via FFT / Line Profile"):
                try:
                    factor = cal_mgr.compute_factor_fft(mic_img, known_spacing_um=spacing_um)
                    st.session_state["wiz_computed_factor"] = factor
                    st.success(f"Calculated Scale Factor: **{factor} µm/pixel**")
                except Exception as e:
                    st.error(f"FFT auto-detection failed: {e}. Try manual calculation below.")

        st.markdown("---")
        st.markdown("#### Method B: Manual Line Distance Input")
        col_m1, col_m2 = st.columns(2)
        with col_m1:
            px_dist = st.number_input("Measured Distance in Pixels:", min_value=1.0, value=24.0, step=1.0)
        with col_m2:
            num_divs = st.number_input("Number of Scale Divisions (10µm each):", min_value=1, value=1, step=1)
        
        if st.button("Set Factor Manually"):
            factor = cal_mgr.compute_factor_manual(pixel_distance=px_dist, num_divisions=num_divs, known_spacing_um=10.0)
            st.session_state["wiz_computed_factor"] = factor
            st.success(f"Manually set scale factor to: **{factor} µm/pixel**")

    with wiz_tab2:
        curr_factor = st.session_state.get("wiz_computed_factor", cal_data.get("factor_um_per_px") if cal_data else 0.417)
        st.info(f"Target Scale Factor for Validation: **{curr_factor} µm/pixel**")

        mag_str = st.text_input("Optical Magnification Setting:", value="200x")
        cam_str = st.text_input("Camera Sensor Metadata:", value="1920x1080 USB3")

        st.markdown("#### Reference Polymer Bead Sizing Validation")
        st.caption("Simulate or validate against NIST-traceable reference beads (10µm, 50µm, 100µm).")

        b1, b2, b3 = st.columns(3)
        meas_10 = b1.number_input("Measured 10µm Bead (µm):", value=11.2)
        meas_50 = b2.number_input("Measured 50µm Bead (µm):", value=48.5)
        meas_100 = b3.number_input("Measured 100µm Bead (µm):", value=97.1)

        if st.button("Save & Activate Calibration", type="primary"):
            val_res = cal_mgr.validate_beads([meas_10, meas_50, meas_100])
            saved_record = cal_mgr.save(
                factor_um_per_px=curr_factor,
                magnification=mag_str,
                camera=cam_str,
                validation_info=val_res
            )
            st.success("✅ Calibration saved and activated successfully!")
            st.json(saved_record)


# ---------------------------------------------------------
# PAGE 3: SYSTEM DIAGNOSTICS & DOCS
# ---------------------------------------------------------
def page_docs():
    st.title("📜 System Diagnostics & Documentation")
    st.caption("System specification, model metadata, confidence framework, and known limitations.")

    d1, d2 = st.tabs(["🤖 Model Card & Specifications", "⚠️ Limitations & Compliance Note"])

    with d1:
        st.markdown("""
        ### YOLOv8n Detection Model Metadata
        - **Architecture:** Ultralytics YOLOv8 Nano (3.2M Parameters)
        - **Model Size:** ~6.2 MB
        - **Input Resolution:** 640×640 RGB (Letterbox)
        - **Target Latency:** < 3.0s per image on Raspberry Pi 4 CPU / < 1.0s on Laptop
        - **Classes (5):** `fragment`, `fiber`, `film`, `foam`, `pellet`
        - **Preprocessing:** Median Blur (3×3) + CLAHE (clipLimit=2.0)
        - **Sizing Engine:** OpenCV `minAreaRect` + Contour Area for Feret's Max/Min and ECD
        """)

    with d2:
        st.markdown("""
        ### Explicit System Limitations (CONFIDENCE_AND_LIMITATIONS.md)
        1. **Not a Polymer Identifier:** Hydro Lens detects *candidate microplastic particles* optically. It **does not identify polymer type** (PE, PP, PET, etc.), which requires FTIR/Raman spectroscopy.
        2. **Screening Tool Only:** Results are indicative screening outputs intended for field monitoring and quick lab triage.
        3. **Mandatory Calibration Gate:** Quantitative size distributions and concentration counts are blocked if calibration is missing or expired (> 7 days).
        4. **Optical Resolution Limit:** Practical detection limit is ~10 µm at 200× magnification.
        """)


# ---------------------------------------------------------
# Page Router
# ---------------------------------------------------------
if nav_choice == "🔍 Analyze Sample":
    page_analyze()
elif nav_choice == "📐 Calibration Portal":
    page_calibration()
else:
    page_docs()
