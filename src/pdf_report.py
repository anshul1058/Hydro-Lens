"""Hydro-Lens PDF screening report generator (ReportLab).

Implements the fixed 12-section PDF report structure:

  1.  Header / Metadata
  2.  Calibration Details
  3.  Image Comparison (Before / After)
  4.  Quality & Reliability Check
  5.  Summary Statistics
  6.  Particle Parameter Table
  7.  Size Distribution (VerticalBarChart)
  8.  Confidence Assessment
  9.  Active Learning / Adaptation Evidence (ENR 03) - optional
  10. Limitations & Notes
  11. System Information
  12. Footer on every page (page X of Y, report ID, disclaimer, contact)

Styling: A4, Helvetica family, light-blue table headers (200,220,255),
1pt black grid, green/orange/red verdict colour coding.
"""

import io
import base64
import math
from datetime import datetime
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union
from xml.sax.saxutils import escape as _xml_escape

from PIL import Image as PILImage

from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.shapes import Drawing, String
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.platypus import (
    Flowable,
    HRFlowable,
    Image,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# --------------------------------------------------------------------------
# Palette
# --------------------------------------------------------------------------
GREEN = colors.HexColor("#008000")     # PASS / High / Not required
ORANGE = colors.HexColor("#FFA500")    # MEDIUM / Recommended
RED = colors.HexColor("#C80000")       # FAIL / Low / Required
HEADER_BG = colors.HexColor("#C8DCFF")  # RGB (200, 220, 255)
DARK_TEXT = colors.HexColor("#14252F")
BODY_COLOR = colors.HexColor("#222222")
LABEL_TEXT = colors.HexColor("#123A4C")

_PAGE_W, _PAGE_H = A4
_MARGIN = 15 * mm
_USABLE = _PAGE_W - 2 * _MARGIN

Cell = Union[str, Flowable]

_STYLES: Optional[Dict[str, ParagraphStyle]] = None


def _styles() -> Dict[str, ParagraphStyle]:
    global _STYLES
    if _STYLES is None:
        _STYLES = {
            "title": ParagraphStyle(
                "RTitle", fontName="Helvetica-Bold", fontSize=18, leading=22,
                alignment=TA_CENTER, textColor=DARK_TEXT, spaceAfter=2,
            ),
            "kicker": ParagraphStyle(
                "RKicker", fontName="Helvetica", fontSize=9, leading=12,
                alignment=TA_CENTER, textColor=colors.HexColor("#5A7684"),
                spaceAfter=4,
            ),
            "section": ParagraphStyle(
                "RSection", fontName="Helvetica-Bold", fontSize=14, leading=17,
                textColor=DARK_TEXT, spaceBefore=4, spaceAfter=1,
            ),
            "body": ParagraphStyle(
                "RBody", fontName="Helvetica", fontSize=10, leading=13,
                textColor=BODY_COLOR, spaceAfter=6,
            ),
            "bullet": ParagraphStyle(
                "RBullet", fontName="Helvetica", fontSize=10, leading=13,
                textColor=BODY_COLOR, leftIndent=12, bulletIndent=2,
                spaceAfter=3,
            ),
            "caption": ParagraphStyle(
                "RCaption", fontName="Helvetica-Oblique", fontSize=8.5,
                leading=11, alignment=TA_CENTER,
                textColor=colors.HexColor("#4F6570"), spaceBefore=2,
                spaceAfter=4,
            ),
            "th": ParagraphStyle(
                "RTh", fontName="Helvetica-Bold", fontSize=10, leading=12,
                alignment=TA_CENTER, textColor=DARK_TEXT,
            ),
            "lbl": ParagraphStyle(
                "RLbl", fontName="Helvetica-Bold", fontSize=10, leading=12,
                alignment=TA_LEFT, textColor=LABEL_TEXT,
            ),
            "cell_c": ParagraphStyle(
                "RCellC", fontName="Helvetica", fontSize=9, leading=11,
                alignment=TA_CENTER, textColor=BODY_COLOR,
            ),
            "cell_l": ParagraphStyle(
                "RCellL", fontName="Helvetica", fontSize=9, leading=11,
                alignment=TA_LEFT, textColor=BODY_COLOR,
            ),
        }
    return _STYLES


def _p(text: str, style_name: str = "body") -> Paragraph:
    return Paragraph(text, _styles()[style_name])


def _cell(value: Cell, style_name: str = "cell_c") -> Flowable:
    if isinstance(value, Flowable):
        return value
    return Paragraph(_xml_escape(str(value)), _styles()[style_name])


def _verdict_cell(label: str, color: colors.Color) -> Flowable:
    style = _styles()["cell_c"]
    return Paragraph(
        f'<font color="{color.hexval()}"><b>{_xml_escape(label)}</b></font>',
        style,
    )


def _section_heading(title: str) -> KeepTogether:
    return KeepTogether([
        _p(_xml_escape(title), "section"),
        HRFlowable(width="100%", thickness=1, color=colors.black,
                   spaceBefore=1, spaceAfter=6, lineCap="butt"),
    ])


def _grid_style(header: bool = True, label_col: bool = False) -> List[Tuple]:
    style: List[Tuple] = [
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        style.append(("BACKGROUND", (0, 0), (-1, 0), HEADER_BG))
    if label_col:
        style.append(("BACKGROUND", (0, 0), (0, -1), HEADER_BG))
    return style


def _kv_table(rows: Sequence[Tuple[str, Cell]],
              label_frac: float = 0.34) -> Table:
    """Two-column parameter / value table (label column styled as header)."""
    st = _styles()
    data = [
        [_cell(k, "lbl"), _cell(v, "cell_l")]
        for k, v in rows
    ]
    table = Table(
        data,
        colWidths=[_USABLE * label_frac, _USABLE * (1 - label_frac)],
        hAlign="LEFT",
    )
    table.setStyle(TableStyle(_grid_style(header=False, label_col=True)))
    return table


def _data_table(headers: Sequence[str],
                rows: Sequence[Sequence[Cell]],
                col_widths: Optional[Sequence[float]] = None) -> Table:
    """Data table with light-blue header row and 1pt black grid."""
    st = _styles()
    data: List[List[Flowable]] = [
        [_cell(h, "th") for h in headers]
    ]
    for row in rows:
        data.append([_cell(c, "cell_c") for c in row])
    if col_widths is None:
        col_widths = [_USABLE / len(headers)] * len(headers)
    table = Table(data, colWidths=list(col_widths), repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle(_grid_style(header=True)))
    return table


# --------------------------------------------------------------------------
# Footer canvas (section 12) - page X of Y on every page
# --------------------------------------------------------------------------
class _FooterCanvas(rl_canvas.Canvas):
    """Canvas that stamps the fixed footer on every page once totals known."""

    def __init__(self, *args: Any, footer_ctx: Optional[Dict[str, str]] = None,
                 **kwargs: Any):
        super().__init__(*args, **kwargs)
        self._page_states: List[dict] = []
        self._footer_ctx = footer_ctx or {}

    def showPage(self) -> None:  # noqa: A003
        self._page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self) -> None:
        total = len(self._page_states)
        for index, state in enumerate(self._page_states, start=1):
            self.__dict__.update(state)
            self._draw_footer(index, total)
            rl_canvas.Canvas.showPage(self)
        rl_canvas.Canvas.save(self)

    def _draw_footer(self, page_num: int, total: int) -> None:
        ctx = self._footer_ctx
        left = _MARGIN
        right = _PAGE_W - _MARGIN
        self.saveState()
        self.setStrokeColor(colors.HexColor("#8FA9B5"))
        self.setLineWidth(0.5)
        self.line(left, 14 * mm, right, 14 * mm)

        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#444444"))
        self.drawString(left, 10.8 * mm, f"Report ID: {ctx.get('report_id', '-')}")
        self.drawCentredString(
            _PAGE_W / 2, 10.8 * mm,
            ctx.get("disclaimer", "Screening result only. "
                     "Not a substitute for laboratory analysis."),
        )
        self.drawString(left, 7.4 * mm, ctx.get("contact", ""))
        self.drawRightString(right, 7.4 * mm, f"Page {page_num} of {total}")
        self.restoreState()


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------
def _b64_to_pil(b64_str: str) -> Optional[PILImage.Image]:
    if not b64_str:
        return None
    try:
        if "," in b64_str and b64_str.lstrip().lower().startswith("data:"):
            b64_str = b64_str.split(",", 1)[1]
        raw = base64.b64decode(b64_str)
        return PILImage.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        return None


def _image_flowable(b64_str: str, max_w: float, max_h: float,
                    placeholder: str = "Image unavailable") -> Flowable:
    pil = _b64_to_pil(b64_str or "")
    if pil is None:
        return _p(_xml_escape(placeholder), "caption")
    ratio = min(max_w / pil.size[0], max_h / pil.size[1])
    buf = io.BytesIO()
    pil.save(buf, format="PNG")
    buf.seek(0)
    return Image(buf, width=pil.size[0] * ratio, height=pil.size[1] * ratio)


class _RejectionBanner(Flowable):
    """Large red warning banner shown when a quality check FAILED."""

    def __init__(self, reason: str, width: float = _USABLE, height: float = 42):
        super().__init__()
        self.reason = reason
        self.width = width
        self.height = height

    def wrap(self, availWidth: float, availHeight: float) -> Tuple[float, float]:
        self.width = availWidth
        return availWidth, self.height

    def draw(self) -> None:
        c = self.canv
        w, h = self.width, self.height
        c.setFillColor(RED)
        c.roundRect(0, 0, w, h, 5, fill=1, stroke=0)

        # Vector warning triangle (Helvetica cannot render emoji glyphs).
        cx, base_y, tw = 20.0, h / 2 - 2, 15.0
        c.setFillColor(colors.white)
        pth = c.beginPath()
        pth.moveTo(cx, base_y + tw * 0.62)
        pth.lineTo(cx - tw * 0.58, base_y - tw * 0.42)
        pth.lineTo(cx + tw * 0.58, base_y - tw * 0.42)
        pth.close()
        c.drawPath(pth, fill=1, stroke=0)
        c.setFillColor(RED)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(cx, base_y - tw * 0.28, "!")
        c.setStrokeColor(RED)
        c.setLineWidth(1.4)
        c.line(cx, base_y + tw * 0.05, cx, base_y + tw * 0.3)

        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(40, h - 17, "MEASUREMENT REJECTED")
        c.setFont("Helvetica", 8.5)
        reason = self.reason if len(self.reason) < 170 else self.reason[:167] + "..."
        c.drawString(40, h - 31, reason)


def _fmt(value: Optional[float], digits: int = 2,
         suffix: str = "") -> str:
    if value is None:
        return "-"
    return f"{value:.{digits}f}{suffix}"


def _verdict_color(word: str) -> colors.Color:
    upper = word.upper()
    if upper.startswith("PASS") or "HIGH" in upper or "NOT REQUIRED" in upper:
        return GREEN
    if upper.startswith("MEDIUM") or "RECOMMENDED" in upper or "STALE" in upper:
        return ORANGE
    return RED


def _confidence_tier(avg_conf: float) -> Tuple[str, colors.Color]:
    if avg_conf >= 0.8:
        return "High", GREEN
    if avg_conf >= 0.6:
        return "Medium", ORANGE
    return "Low", RED


def _size_distribution(result: Dict[str, Any]) -> Dict[str, int]:
    dist = result.get("size_distribution_um") or {}
    if dist:
        return dict(dist)
    bins = {"10-25": 0, "25-50": 0, "50-100": 0, "100+": 0}
    for det in result.get("detections", []):
        ecd = (det.get("size_um") or {}).get("ecd")
        if ecd is None:
            continue
        if ecd < 25:
            bins["10-25"] += 1
        elif ecd < 50:
            bins["25-50"] += 1
        elif ecd < 100:
            bins["50-100"] += 1
        else:
            bins["100+"] += 1
    return bins


def _size_chart(bins: Dict[str, int]) -> Flowable:
    st = _styles()
    drawing = Drawing(_USABLE, 195)
    counts = [int(v) for v in bins.values()]
    max_count = max(counts) if counts else 0
    top = max(max_count + 1, 1)
    step = max(1, math.ceil(top / 5))
    axis_max = step * math.ceil(top / step)

    chart = VerticalBarChart()
    chart.x = 52
    chart.y = 38
    chart.width = _USABLE - 72
    chart.height = 122
    chart.data = [counts]
    chart.categoryAxis.categoryNames = list(bins.keys())
    chart.categoryAxis.labels.fontName = "Helvetica"
    chart.categoryAxis.labels.fontSize = 8
    chart.categoryAxis.labels.angle = 0
    chart.categoryAxis.strokeColor = colors.HexColor("#555555")
    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = axis_max
    chart.valueAxis.valueStep = step
    chart.valueAxis.labels.fontName = "Helvetica"
    chart.valueAxis.labels.fontSize = 8
    chart.valueAxis.strokeColor = colors.HexColor("#555555")
    chart.valueAxis.gridStrokeColor = colors.HexColor("#DDDDDD")
    chart.valueAxis.gridStrokeWidth = 0.5
    chart.valueAxis.visibleGrid = 1
    chart.bars[0].fillColor = colors.HexColor("#397C91")
    chart.bars[0].strokeColor = colors.HexColor("#1F5C6E")
    try:
        chart.barLabelFormat = "%d"
        chart.barLabels.fontName = "Helvetica-Bold"
        chart.barLabels.fontSize = 8
        chart.barLabels.dy = 4
    except Exception:
        pass
    drawing.add(chart)

    drawing.add(String(_USABLE / 2, 12, "Size bin (µm)",
                       fontName="Helvetica", fontSize=9,
                       textAnchor="middle",
                       fillColor=colors.HexColor("#333333")))
    drawing.add(String(52, 174, "Particle count",
                       fontName="Helvetica", fontSize=9,
                       fillColor=colors.HexColor("#333333")))

    return KeepTogether([drawing, _p("Figure 1: Particle size distribution "
                                     "by calibrated ECD bin.", "caption")])


# --------------------------------------------------------------------------
# Section builders
# --------------------------------------------------------------------------
def _sec1_header(meta: Dict[str, Cell]) -> List[Flowable]:
    st = _styles()
    story: List[Flowable] = [
        _p("Microplastics Screening Report", "title"),
        _p("Hydro Lens &mdash; Automated Optical Screening System", "kicker"),
        HRFlowable(width="100%", thickness=1.4, color=colors.HexColor("#397C91"),
                   spaceBefore=2, spaceAfter=8),
    ]
    pairs = [
        ("Report ID", meta.get("report_id", "-")),
        ("Sample ID", meta.get("sample_id", "-")),
        ("Generated", meta.get("generated", "-")),
        ("Operator", meta.get("operator", "-")),
        ("Software version", meta.get("software_version", "-")),
        ("Model version", meta.get("model_version", "-")),
    ]
    data = [
        [_cell(pairs[0][0], "lbl"), _cell(pairs[0][1], "cell_l"),
         _cell(pairs[1][0], "lbl"), _cell(pairs[1][1], "cell_l")],
        [_cell(pairs[2][0], "lbl"), _cell(pairs[2][1], "cell_l"),
         _cell(pairs[3][0], "lbl"), _cell(pairs[3][1], "cell_l")],
        [_cell(pairs[4][0], "lbl"), _cell(pairs[4][1], "cell_l"),
         _cell(pairs[5][0], "lbl"), _cell(pairs[5][1], "cell_l")],
    ]
    table = Table(data, colWidths=[_USABLE * 0.18, _USABLE * 0.32,
                                   _USABLE * 0.18, _USABLE * 0.32])
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 0), (0, -1), HEADER_BG),
        ("BACKGROUND", (2, 0), (2, -1), HEADER_BG),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(table)
    story.append(Spacer(1, 12))
    return story


def _sec2_calibration(cal: Optional[Dict[str, Any]],
                      cal_quality: float,
                      cfg: Dict[str, Any]) -> List[Flowable]:
    story = [_section_heading("2. Calibration Details")]
    report_cfg = cfg.get("report", {})
    cal_cfg = cfg.get("calibration", {})
    spacing = cal_cfg.get("micrometer_spacing_um", 10)
    validity = cal_cfg.get("validity_days", 7)

    if not cal or not cal.get("factor_um_per_px"):
        recovery = report_cfg.get("recovery_rate")
        recovery_str = f"{recovery}%" if recovery not in (None, "") else "Not measured"
        story.append(_kv_table([
            ("Scale", "Not calibrated"),
            ("Reference object", "None - calibration record missing"),
            ("Calibration date", "-"),
            ("Valid conditions", "-"),
            ("Recovery rate", recovery_str),
            ("Recovery method", str(report_cfg.get("recovery_method", "-"))),
        ]))
        story.append(Spacer(1, 6))
        story.append(Paragraph(
            '<font color="#C80000"><b>No valid calibration: physical sizing, '
            'concentration and recovery metrics are disabled.</b></font>',
            _styles()["body"]))
        story.append(Spacer(1, 12))
        return story

    factor = float(cal.get("factor_um_per_px") or 0.0)
    mag = str(cal.get("magnification", "200x"))
    measured_px = (spacing / factor) if factor > 0 else None
    recovery = report_cfg.get("recovery_rate")
    recovery_str = f"{recovery}%" if recovery not in (None, "") else "Not measured"

    story.append(_kv_table([
        ("Scale", f"{mag} optical magnification"),
        ("Reference object", f"Stage micrometer, {spacing} um divisions"),
        ("Measured pixels", f"{measured_px:.1f} px per {spacing} um division"
         if measured_px else "-"),
        ("Calibration date", str(cal.get("timestamp", "-"))),
        ("Valid conditions", f"<= {validity} days old, {mag}, ambient lab "
                             "(15-30 C), dry filter membrane"),
        ("Recovery rate", recovery_str),
        ("Recovery method", str(report_cfg.get(
            "recovery_method", "Not performed"))),
    ]))
    story.append(Spacer(1, 12))
    return story


def _sec3_images(result: Dict[str, Any]) -> List[Flowable]:
    story = [_section_heading("3. Image Comparison (Before / After)")]
    images = result.get("images") or {}
    before = images.get("original") or images.get("preprocessed") or ""
    after = images.get("annotated") or ""
    max_w = (_USABLE - 12) / 2
    max_h = 75 * mm

    grid = Table(
        [[_image_flowable(before, max_w, max_h, "Original image unavailable"),
          _image_flowable(after, max_w, max_h, "Annotated image unavailable")],
         [_cell("Before Detection", "cell_c"),
          _cell("After Detection (YOLOv8n)", "cell_c")]],
        colWidths=[max_w + 6, max_w + 6],
    )
    grid.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, 0), 4),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 4),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#B9DFEA")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#B9DFEA")),
        ("FONT", (0, 1), (-1, 1), "Helvetica", 9),
    ]))
    story.append(grid)
    story.append(Spacer(1, 12))
    return story


def _sec4_quality(result: Dict[str, Any],
                  cal_quality: float,
                  cal_valid: bool,
                  cfg: Dict[str, Any]) -> List[Flowable]:
    story = [_section_heading("4. Quality & Reliability Check")]
    conf_cfg = cfg.get("confidence", {})
    sample_thresh = float(conf_cfg.get("sample_low_threshold", 0.6))
    det_thresh = float(conf_cfg.get("low_threshold", 0.5))

    sample_conf = float(result.get("sample_confidence") or 0.0)
    breakdown = result.get("breakdown") or {}
    total = int(result.get("total_count") or 0)

    if cal_quality >= 1.0:
        cal_verdict = "PASS"
    elif cal_quality >= 0.5:
        cal_verdict = "MEDIUM (stale)"
    else:
        cal_verdict = "FAIL"
    cal_thresh = "1.00"

    sample_verdict = "PASS" if sample_conf >= sample_thresh else "FAIL"
    mean_conf = float(breakdown.get("mean_detection_confidence") or 0.0)
    mean_verdict = "PASS" if mean_conf >= det_thresh else "FAIL"
    coverage = float(breakdown.get("coverage_factor") or 0.0)
    if coverage >= 0.5:
        cover_verdict = "PASS"
    elif coverage > 0:
        cover_verdict = "MEDIUM"
    else:
        cover_verdict = "FAIL"
    count_verdict = "PASS" if total >= 1 else "FAIL"

    rows: List[List[Cell]] = [
        ["Calibration quality", _fmt(cal_quality), cal_thresh,
         _verdict_cell(cal_verdict, _verdict_color(cal_verdict))],
        ["Sample confidence", _fmt(sample_conf), _fmt(sample_thresh),
         _verdict_cell(sample_verdict, _verdict_color(sample_verdict))],
        ["Mean detection confidence", _fmt(mean_conf), _fmt(det_thresh),
         _verdict_cell(mean_verdict, _verdict_color(mean_verdict))],
        ["Coverage factor", _fmt(coverage), "0.50",
         _verdict_cell(cover_verdict, _verdict_color(cover_verdict))],
        ["Particle count", str(total), ">= 1",
         _verdict_cell(count_verdict, _verdict_color(count_verdict))],
    ]
    story.append(_data_table(
        ["Check", "Score", "Threshold", "Verdict"], rows,
        col_widths=[_USABLE * 0.40, _USABLE * 0.18,
                    _USABLE * 0.17, _USABLE * 0.25],
    ))
    story.append(Spacer(1, 8))

    reasons: List[str] = []
    if not cal_valid or cal_quality <= 0.0:
        reasons.append("Calibration missing or invalid - physical measurement "
                       "cannot be trusted.")
    if cal_quality == 0.5:
        reasons.append("Calibration stale (> 7 days) - recalibration required.")
    if sample_conf < sample_thresh:
        reasons.append(f"Sample confidence {sample_conf:.2f} is below the "
                       f"{sample_thresh:.2f} threshold.")
    if total == 0:
        reasons.append("No particles detected - verify blank filter control.")

    failed = any(v.startswith("FAIL") for v in
                 (cal_verdict, sample_verdict, mean_verdict, count_verdict))
    if failed:
        story.append(_RejectionBanner(" ".join(reasons) or "Quality gate failed."))
        story.append(Spacer(1, 12))
    else:
        story.append(Spacer(1, 4))
    return story


def _sec5_summary(result: Dict[str, Any],
                  cal_quality: float,
                  sample_volume_ml: Optional[float],
                  dilution_factor: float,
                  concentration: Optional[float]) -> List[Flowable]:
    story = [_section_heading("5. Summary Statistics")]
    detections = result.get("detections") or []
    total = int(result.get("total_count") or len(detections))

    type_counts: Dict[str, int] = {}
    for det in detections:
        name = str(det.get("class_name", "unknown")).title()
        type_counts[name] = type_counts.get(name, 0) + 1
    by_type = " · ".join(f"{k}: {v}" for k, v in sorted(type_counts.items())) \
        or "No particles"

    confs = [float(d.get("confidence") or 0.0) for d in detections]
    ecds = [float(d["size_um"]["ecd"]) for d in detections
            if (d.get("size_um") or {}).get("ecd") is not None]

    if ecds:
        avg_size = sum(ecds) / len(ecds)
        med_size = sorted(ecds)[len(ecds) // 2] if len(ecds) % 2 else \
            (sorted(ecds)[len(ecds) // 2 - 1] + sorted(ecds)[len(ecds) // 2]) / 2
        size_range = f"{min(ecds):.1f} - {max(ecds):.1f} µm"
        avg_size_str = f"{avg_size:.1f} µm"
        med_size_str = f"{med_size:.1f} µm"
    else:
        avg_size_str = med_size_str = "Calibration required"
        size_range = "-"

    if sample_volume_ml and concentration is not None:
        vol_str = f"{sample_volume_ml:g} mL (dilution x{dilution_factor:g})"
        conc_str = f"{concentration:.2f} particles / L"
    elif sample_volume_ml:
        vol_str = f"{sample_volume_ml:g} mL"
        conc_str = "Blocked - valid calibration required"
    else:
        vol_str = "Not provided"
        conc_str = "Requires sample volume + calibration"

    story.append(_kv_table([
        ("Total particles", str(total)),
        ("Count by type", by_type),
        ("Average confidence", _fmt(sum(confs) / len(confs)) if confs else "-"),
        ("Minimum confidence", _fmt(min(confs)) if confs else "-"),
        ("Maximum confidence", _fmt(max(confs)) if confs else "-"),
        ("Average size (ECD)", avg_size_str),
        ("Median size (ECD)", med_size_str),
        ("Size range", size_range),
        ("Sample volume", vol_str),
        ("Estimated concentration", conc_str),
    ]))
    story.append(Spacer(1, 12))
    return story


def _sec6_particles(detections: List[Dict[str, Any]]) -> List[Flowable]:
    story = [_section_heading("6. Particle Parameter Table")]
    headers = ["Particle #", "Type", "Size (µm)", "Size (px)",
               "Confidence (%)", "Aspect Ratio", "Circularity"]
    widths = [_USABLE * f for f in
              (0.10, 0.17, 0.14, 0.13, 0.16, 0.15, 0.15)]

    rows: List[List[Cell]] = []
    for det in detections:
        size_um = det.get("size_um") or {}
        size_px = det.get("size_px") or {}
        ecd_um = size_um.get("ecd")
        ecd_px = size_px.get("ecd")
        aspect = size_um.get("aspect_ratio", size_px.get("aspect_ratio"))
        circularity = size_px.get("circularity")
        if circularity is None and aspect:
            circularity = min(1.0, 1.0 / float(aspect))
        rows.append([
            str(det.get("id", 0)),
            str(det.get("class_name", "-")),
            f"{ecd_um:.1f}" if ecd_um is not None else "-",
            f"{ecd_px:.1f}" if ecd_px is not None else "-",
            f"{float(det.get('confidence') or 0.0) * 100:.1f}",
            f"{float(aspect):.2f}" if aspect else "-",
            f"{float(circularity):.2f}" if circularity is not None else "-",
        ])

    if not rows:
        rows = [["-", "No particles detected", "-", "-", "-", "-", "-"]]

    story.append(_data_table(headers, rows, col_widths=widths))
    story.append(Spacer(1, 12))
    return story


def _sec7_distribution(result: Dict[str, Any],
                       cal_quality: float) -> List[Flowable]:
    bins = _size_distribution(result)
    if cal_quality <= 0.0 or not any(bins.values()):
        return [
            _section_heading("7. Size Distribution"),
            _p("Size distribution unavailable - requires a valid "
               "calibration factor and at least one sized particle."),
            Spacer(1, 12),
        ]
    return [
        KeepTogether([_section_heading("7. Size Distribution"),
                      _size_chart(bins)]),
        Spacer(1, 12),
    ]


def _sec8_confidence(result: Dict[str, Any], cfg: Dict[str, Any]) -> List[Flowable]:
    story = [_section_heading("8. Confidence Assessment")]
    conf_cfg = cfg.get("confidence", {})
    sample_thresh = float(conf_cfg.get("sample_low_threshold", 0.6))
    avg_conf = float(result.get("sample_confidence") or 0.0)
    tier, tier_color = _confidence_tier(avg_conf)
    needs_lab = bool(result.get("flag_lab_confirmation"))

    if tier == "High":
        verdict = ("Sample confidence is high - screening result is reliable "
                   "within calibrated limits.")
        recommendation = ("Proceed with screening output; confirm only "
                          "explicitly flagged particles.")
    elif tier == "Medium":
        verdict = ("Sample confidence is moderate - usable for screening, "
                   "quantitative claims kept provisional.")
        recommendation = ("Review flagged particles and recalibrate if the "
                          "calibration is stale.")
    else:
        verdict = ("Sample confidence is low - quantitative interpretation "
                   "withheld.")
        recommendation = ("Recalibrate and re-run the analysis before relying "
                          "on counts or sizes.")

    if needs_lab and avg_conf >= sample_thresh:
        lab_text, lab_color = "RECOMMENDED", ORANGE
    elif needs_lab:
        lab_text, lab_color = "REQUIRED", RED
    else:
        lab_text, lab_color = "NOT REQUIRED", GREEN

    story.append(_kv_table([
        ("Average confidence", f"{avg_conf:.3f} ({avg_conf * 100:.1f}%)"),
        ("Confidence tier", _verdict_cell(tier.upper(), tier_color)),
        ("Verdict", verdict),
        ("Recommendation", recommendation),
        ("Lab confirmation", _verdict_cell(lab_text, lab_color)),
    ]))
    story.append(Spacer(1, 12))
    return story


def _sec9_active_learning(cfg: Dict[str, Any]) -> List[Flowable]:
    al_cfg = cfg.get("active_learning") or {}
    if not al_cfg.get("enabled"):
        return []

    story = [_section_heading("9. Active Learning / Adaptation Evidence (ENR 03)")]
    rows = [
        ("Budget", al_cfg.get("budget", "-")),
        ("Selection method", al_cfg.get("selection_method", "-")),
        ("Selected indices", al_cfg.get("selected_indices", "-")),
        ("Random indices", al_cfg.get("random_indices", "-")),
        ("Condition A before", al_cfg.get("condition_a_before", "-")),
        ("Condition A after", al_cfg.get("condition_a_after", "-")),
        ("Condition B before", al_cfg.get("condition_b_before", "-")),
        ("Condition B after", al_cfg.get("condition_b_after", "-")),
        ("Active vs random", al_cfg.get("active_vs_random", "-")),
        ("Improvement", al_cfg.get("improvement", "-")),
        ("Original image groups", str(al_cfg.get("original_image_groups", "-"))),
    ]
    story.append(_kv_table(rows))
    story.append(Spacer(1, 6))
    story.append(_p(
        "<b>Partition rule:</b> " + str(al_cfg.get(
            "partition_rule",
            "Group-wise train/validation/test split by source image to "
            "prevent leakage."))))
    story.append(Spacer(1, 12))
    return story


def _sec10_limitations(cal_quality: float,
                       cfg: Dict[str, Any]) -> List[Flowable]:
    story = [_section_heading("10. Limitations & Notes")]
    report_cfg = cfg.get("report", {})
    cal_cfg = cfg.get("calibration", {})
    validity = cal_cfg.get("validity_days", 7)
    recovery = report_cfg.get("recovery_rate")
    recovery_str = f"{recovery}%" if recovery not in (None, "") else "Not measured"

    items = [
        ("Detection range", "10 µm - 5000 µm (validated at 200x)."),
        ("Lower limit reason", "Optical resolution / SNR bound: ~0.5 µm per "
                               "pixel theoretical at 200x, practical detection "
                               "limit ~10 µm. Particles below 10 µm are not "
                               "visible to this system."),
        ("Polymer ID claim", "OPTIONAL and NOT performed - morphology only. "
                             "Polymer identification (PE/PP/PET/...) requires "
                             "FTIR/Raman spectroscopy."),
        ("Screening disclaimer", "Screening result only. Not a substitute for "
                                 "laboratory analysis and not a replacement "
                                 "for ISO 24187, EPA or EU regulatory methods."),
        ("Recovery rate applied", recovery_str),
        ("Valid conditions", f"Calibration <= {validity} days old, 200x, "
                             "ambient lab (15-30 C), dry filter membrane."),
        ("False positive sources", str(report_cfg.get(
            "false_positive_sources",
            "Air bubbles, dye/stain crystals, mineral grains, natural "
            "cellulose fibres, overlapping debris."))),
        ("Recommended action", str(report_cfg.get(
            "recommended_action",
            "Confirm flagged particles in an accredited laboratory "
            "(FTIR/Raman) before reporting."))),
    ]
    for label, text in items:
        story.append(Paragraph(
            f"<b>{_xml_escape(label)}:</b> {_xml_escape(text)}",
            _styles()["bullet"], bulletText="-"))
    story.append(Spacer(1, 6))
    story.append(Spacer(1, 6))
    return story


def _sec11_system(result: Dict[str, Any],
                  cfg: Dict[str, Any]) -> List[Flowable]:
    story = [_section_heading("11. System Information")]
    report_cfg = cfg.get("report", {})
    model_cfg = cfg.get("model", {})
    prep_cfg = cfg.get("preprocessing", {})
    latency = float(result.get("latency_sec") or 0.0)

    story.append(_kv_table([
        ("AI model", "YOLOv8n (Ultralytics), fine-tuned"),
        ("Model parameters", str(report_cfg.get("model_parameters", "3.2 M"))),
        ("Model file", str(model_cfg.get("weights_path", "models/best.pt"))),
        ("Preprocessing", f"Median blur {prep_cfg.get('median_blur_kernel', 3)}"
                          f"x{prep_cfg.get('median_blur_kernel', 3)} -> CLAHE "
                          f"(clip {prep_cfg.get('clahe_clip_limit', 2.0)}) -> "
                          "Letterbox 640x640"),
        ("Detection pipeline", "Preprocess -> YOLOv8n inference -> contour "
                               "sizing -> confidence scoring"),
        ("Sizing method", "OpenCV minAreaRect Feret max/min + contour ECD; "
                          "circularity = 4*pi*A / P^2"),
        ("Hardware", str(report_cfg.get("hardware", "CPU (host machine)"))),
        ("Inference time", f"{latency:.2f} s (this run)"),
        ("Training data", str(report_cfg.get(
            "training_data",
            "2,980 annotated particles across 5 morphological classes"))),
    ]))
    story.append(Spacer(1, 12))
    return story


# --------------------------------------------------------------------------
# Public API
# --------------------------------------------------------------------------
def generate_pdf_report(
    result: Dict[str, Any],
    config: Optional[Dict[str, Any]] = None,
    calibration: Optional[Dict[str, Any]] = None,
    cal_quality: float = 0.0,
    cal_valid: bool = False,
    sample_volume_ml: Optional[float] = None,
    dilution_factor: float = 1.0,
    report_id: Optional[str] = None,
) -> bytes:
    """Build the 12-section PDF and return raw bytes."""
    cfg = config or {}
    report_cfg = cfg.get("report", {})
    sample_id = str(result.get("sample_id", "unknown"))
    rid = report_id or f"RPT-{sample_id}"
    generated = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    detections = result.get("detections") or []
    total = int(result.get("total_count") or len(detections))
    imaged_area = float(result.get("imaged_area_mm2") or 0.0)
    cal_quality = float(cal_quality or 0.0)

    concentration: Optional[float] = None
    if sample_volume_ml and sample_volume_ml > 0 and imaged_area > 0 \
            and cal_quality > 0.0:
        concentration = round(
            (total / imaged_area) * (1000.0 / sample_volume_ml)
            * float(dilution_factor or 1.0), 2)

    meta = {
        "report_id": rid,
        "sample_id": sample_id,
        "generated": generated,
        "operator": report_cfg.get("operator", "Hydro Lens Lab Operator"),
        "software_version": report_cfg.get("software_version",
                                           "HydroLens v1.0.0"),
        "model_version": report_cfg.get("model_version",
                                        "YOLOv8n (fine-tuned) v1.0"),
    }

    story: List[Flowable] = []
    story += _sec1_header(meta)
    story += _sec2_calibration(calibration, cal_quality, cfg)
    story += _sec3_images(result)
    story += _sec4_quality(result, cal_quality, cal_valid, cfg)
    story += _sec5_summary(result, cal_quality, sample_volume_ml,
                           dilution_factor, concentration)
    story += _sec6_particles(detections)
    story += _sec7_distribution(result, cal_quality)
    story += _sec8_confidence(result, cfg)
    story += _sec9_active_learning(cfg)
    story += _sec10_limitations(cal_quality, cfg)
    story += _sec11_system(result, cfg)

    buffer = io.BytesIO()
    footer_ctx = {
        "report_id": rid,
        "disclaimer": "Screening result only. Not a substitute for "
                      "laboratory analysis.",
        "contact": "PCCOE, Pune \u00b7 HACKMATRIX 5.0",
    }

    def _canvas_maker(*args: Any, **kwargs: Any) -> _FooterCanvas:
        return _FooterCanvas(*args, footer_ctx=footer_ctx, **kwargs)

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=_MARGIN,
        rightMargin=_MARGIN,
        topMargin=14 * mm,
        bottomMargin=18 * mm,
        title=f"Microplastics Screening Report - {sample_id}",
        author="Hydro Lens",
        subject="Microplastics screening report",
    )
    doc.build(story, canvasmaker=_canvas_maker)
    return buffer.getvalue()


def save_pdf_report(output_path: str, **kwargs: Any) -> str:
    """Generate the report and write it to ``output_path``."""
    pdf_bytes = generate_pdf_report(**kwargs)
    with open(output_path, "wb") as fh:
        fh.write(pdf_bytes)
    return output_path
