from __future__ import annotations

import html
import zipfile
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal


OUT_DIR = Path(__file__).resolve().parent
PPTX_PATH = OUT_DIR / "study-synopsis-studio-logic.pptx"
PREVIEW_DIR = OUT_DIR / "study-synopsis-studio-logic-preview"

W_IN = 13.333
H_IN = 7.5
EMU = 914400
SLIDE_W = int(W_IN * EMU)
SLIDE_H = int(H_IN * EMU)

RED = "D71920"
DARK_RED = "8A1538"
SOFT_RED = "FDECEC"
PALE_RED = "FFF7F7"
BLUE = "1864AB"
SOFT_BLUE = "E7F5FF"
INK = "242424"
SLATE = "475569"
LIGHT = "F8FAFC"
GRAY = "E5E7EB"
GREEN = "DCFCE7"
AMBER = "FEF3C7"


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def emu(value: float) -> int:
    return int(value * EMU)


@dataclass
class Element:
    kind: Literal["text", "rect", "line", "pill", "rule"]
    x: float
    y: float
    w: float
    h: float
    text: str = ""
    fill: str = "FFFFFF"
    stroke: str = ""
    color: str = INK
    font_size: int = 18
    bold: bool = False
    align: Literal["l", "ctr", "r"] = "l"
    radius: bool = False
    arrow: bool = False
    weight: float = 1.2


@dataclass
class Slide:
    title: str
    subtitle: str = ""
    elements: list[Element] = field(default_factory=list)
    eyebrow: str = "STUDY SYNOPSIS STUDIO"


def text(x: float, y: float, w: float, h: float, value: str, size: int = 18, color: str = INK, bold: bool = False, align: Literal["l", "ctr", "r"] = "l") -> Element:
    return Element("text", x, y, w, h, text=value, font_size=size, color=color, bold=bold, align=align)


def rect(x: float, y: float, w: float, h: float, fill: str, stroke: str = "", radius: bool = True) -> Element:
    return Element("rect", x, y, w, h, fill=fill, stroke=stroke, radius=radius)


def pill(x: float, y: float, w: float, h: float, value: str, fill: str, color: str = INK, stroke: str = "", size: int = 13, bold: bool = True) -> Element:
    return Element("pill", x, y, w, h, text=value, fill=fill, stroke=stroke, color=color, font_size=size, bold=bold, align="ctr", radius=True)


def line(x: float, y: float, w: float, h: float, color: str = DARK_RED, arrow: bool = True, weight: float = 1.6) -> Element:
    return Element("line", x, y, w, h, stroke=color, arrow=arrow, weight=weight)


def rule(x: float, y: float, w: float, color: str = GRAY) -> Element:
    return Element("rule", x, y, w, 0, stroke=color, weight=1.0)


def shape_xml(el: Element, shape_id: int) -> str:
    x, y, w, h = map(emu, (el.x, el.y, el.w, el.h))
    if el.kind in {"rect", "pill"}:
        geom = "roundRect" if el.radius else "rect"
        stroke = f'<a:ln w="{int(el.weight * 12700)}"><a:solidFill><a:srgbClr val="{el.stroke}"/></a:solidFill></a:ln>' if el.stroke else '<a:ln><a:noFill/></a:ln>'
        body = ""
        if el.text:
            body = text_body_xml(el.text, el.font_size, el.color, el.bold, el.align)
        return f"""
        <p:sp>
          <p:nvSpPr><p:cNvPr id="{shape_id}" name="Shape {shape_id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
          <p:spPr>
            <a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>
            <a:prstGeom prst="{geom}"><a:avLst/></a:prstGeom>
            <a:solidFill><a:srgbClr val="{el.fill}"/></a:solidFill>
            {stroke}
          </p:spPr>
          {body}
        </p:sp>
        """

    if el.kind == "line":
        x2 = emu(el.x + el.w)
        y2 = emu(el.y + el.h)
        flip_h = "1" if el.w < 0 else "0"
        flip_v = "1" if el.h < 0 else "0"
        head = '<a:headEnd type="triangle"/>' if el.arrow else ""
        return f"""
        <p:cxnSp>
          <p:nvCxnSpPr><p:cNvPr id="{shape_id}" name="Connector {shape_id}"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr>
          <p:spPr>
            <a:xfrm flipH="{flip_h}" flipV="{flip_v}"><a:off x="{min(x, x2)}" y="{min(y, y2)}"/><a:ext cx="{abs(x2-x)}" cy="{abs(y2-y)}"/></a:xfrm>
            <a:prstGeom prst="line"><a:avLst/></a:prstGeom>
            <a:ln w="{int(el.weight * 12700)}"><a:solidFill><a:srgbClr val="{el.stroke}"/></a:solidFill>{head}</a:ln>
          </p:spPr>
        </p:cxnSp>
        """

    if el.kind == "rule":
        return shape_xml(Element("line", el.x, el.y, el.w, 0, stroke=el.stroke, arrow=False, weight=el.weight), shape_id)

    return f"""
    <p:sp>
      <p:nvSpPr><p:cNvPr id="{shape_id}" name="Text {shape_id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:noFill/><a:ln><a:noFill/></a:ln>
      </p:spPr>
      {text_body_xml(el.text, el.font_size, el.color, el.bold, el.align)}
    </p:sp>
    """


def text_body_xml(value: str, size: int, color: str, bold: bool, align: str) -> str:
    paras = value.split("\n")
    p_xml = []
    for para in paras:
        lines = para.split("|")
        runs = []
        for idx, run in enumerate(lines):
            is_bold = bold or idx == 0 and len(lines) > 1
            runs.append(
                f'<a:r><a:rPr lang="en-US" sz="{size * 100}" b="{1 if is_bold else 0}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill><a:latin typeface="Aptos"/></a:rPr><a:t>{esc(run)}</a:t></a:r>'
            )
        p_xml.append(f'<a:p><a:pPr algn="{align}"/>' + "".join(runs) + "</a:p>")
    return f'<p:txBody><a:bodyPr wrap="square" lIns="91440" tIns="45720" rIns="91440" bIns="45720"/><a:lstStyle/>{"".join(p_xml)}</p:txBody>'


def slide_xml(slide: Slide) -> str:
    elements = [
        rect(0, 0, W_IN, H_IN, "FFFFFF", "", False),
        rect(0, 0, 0.18, H_IN, RED, "", False),
        text(0.55, 0.32, 4.0, 0.25, slide.eyebrow, 9, RED, True),
        text(0.55, 0.68, 7.9, 0.55, slide.title, 24, INK, False),
    ]
    if slide.subtitle:
        elements.append(text(0.58, 1.23, 8.8, 0.42, slide.subtitle, 12, SLATE))
    elements += slide.elements
    body = "\n".join(shape_xml(el, idx + 2) for idx, el in enumerate(elements))
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      {body}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>"""


def slide_rel_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>"""


def build_slides() -> list[Slide]:
    slides: list[Slide] = []

    slides.append(Slide(
        "How Study Synopsis Studio turns choices into a synopsis",
        "Logic map for primary intent, protocol guardrails, AI suggestions, alternatives, and evidence-impact feedback.",
        [
            rect(0.55, 2.05, 5.4, 2.15, PALE_RED, ""),
            text(0.9, 2.38, 4.7, 0.82, "One combined first question", 30, RED, True),
            text(0.92, 3.22, 4.6, 0.55, "What is this study mainly trying to achieve?", 18, INK, True),
            line(6.15, 3.08, 1.15, 0, DARK_RED),
            text(7.55, 2.2, 4.4, 1.7, "The app translates that answer into program intent, evidence destination, protocol discipline, AI suggestion constraints, and downstream drafting behavior.", 20, INK, True),
            pill(7.55, 4.45, 1.8, 0.38, "Tab 1", SOFT_RED, RED),
            pill(9.55, 4.45, 1.8, 0.38, "AI guardrails", SOFT_BLUE, BLUE),
            pill(11.55, 4.45, 1.2, 0.38, "Export", LIGHT, INK, GRAY),
        ],
    ))

    slides.append(Slide(
        "The workflow is intentionally staged",
        "Each downstream step consumes the current Tab 1 concept and warns when older generated content is stale.",
        [
            *flow_row(0.65, 2.05, [
                ("Study design", "Intent, disease, intervention, comparator, objectives, endpoints"),
                ("Optional schema", "One-slide visual logic"),
                ("PICO & stats", "Structured PICO + assumptions"),
                ("Optional literature", "Background evidence plan"),
                ("Optional SoA", "Visit/assessment table"),
                ("Generate", "Sections + Word export"),
            ]),
            text(0.75, 5.7, 11.5, 0.55, "Principle: AI helps complete or challenge the concept, but the user selects what becomes part of the working study.", 18, DARK_RED, True, "ctr"),
        ],
    ))

    slides.append(Slide(
        "Primary intent drives the evidence destination",
        "The user answers one plain-language question; the app maps it into strategy and evidence-use logic.",
        [
            simple_table(0.65, 1.85, 12.0, 4.65, [
                ("Primary study aim", "Program goal", "Evidence destination", "Design implication"),
                ("Support label change", "Label expansion/refinement", "Label support", "Comparator and endpoint rigor must be high"),
                ("Support HTA/access", "Market access / HTA", "HTA / access", "Comparative, patient-relevant, utilization-aware"),
                ("Inform practice/guidelines", "Inform clinical practice", "Guideline / practice", "Pragmatic, clinically interpretable, not bloated"),
                ("Publication", "Publication strategy", "Scientific publication", "Focused scientific story"),
                ("Safety/risk", "Risk management", "Safety evidence", "Safety, tolerability, dose support"),
            ]),
        ],
    ))

    slides.append(Slide(
        "Guardrails are advisory profiles, not a hard gate",
        "Auto-suggest applies discipline only when the concept indicates it; users can override.",
        [
            rect(0.75, 1.85, 2.55, 0.82, SOFT_BLUE, BLUE), text(0.95, 2.08, 2.15, 0.34, "Interventional?", 16, BLUE, True, "ctr"),
            line(3.35, 2.25, 1.0, 0, BLUE),
            rect(4.45, 1.55, 2.95, 1.4, PALE_RED, RED), text(4.65, 1.78, 2.55, 0.78, "Practice / guideline intent", 17, RED, True, "ctr"),
            line(7.45, 2.25, 1.0, 0, DARK_RED),
            rect(8.55, 1.45, 3.55, 1.6, SOFT_RED, RED), text(8.82, 1.75, 3.05, 0.65, "Practice-informing PED guardrails", 17, RED, True, "ctr"), text(8.95, 2.38, 2.75, 0.32, "Confirm Phase 3 safety data", 11, SLATE, False, "ctr"),
            rect(4.45, 3.72, 2.95, 1.4, LIGHT, GRAY), text(4.65, 3.96, 2.55, 0.55, "HTA / access / publication", 17, INK, True, "ctr"),
            line(7.45, 4.42, 1.0, 0, SLATE),
            rect(8.55, 3.62, 3.55, 1.6, SOFT_BLUE, BLUE), text(8.85, 3.92, 2.95, 0.55, "Lean decision-evidence guardrails", 17, BLUE, True, "ctr"), text(8.9, 4.55, 2.85, 0.32, "Focused, proportionate evidence", 11, SLATE, False, "ctr"),
            text(0.8, 6.25, 11.6, 0.45, "Checks produce: Aligned / Needs justification / Consider simplifying. They guide iteration; they do not block the workflow.", 16, INK, True, "ctr"),
        ],
    ))

    slides.append(Slide(
        "What the guardrails actually check",
        "The modal focuses on avoidable complexity and data-collection bloat.",
        [
            *grid_cards(0.72, 1.75, [
                ("Objective count", "Usually ≤5; trim or justify extra objectives."),
                ("Endpoint focus", "1 primary + focused key secondary endpoints."),
                ("Duration", "Enrollment, treatment/observation, follow-up explicit."),
                ("Comparator", "Control or benchmark consistent across outputs."),
                ("Special assessments", "PRO, PK/PD, biomarkers, imaging, labs only if decision-critical."),
                ("Eligibility", "Inclusive, verifiable, non-duplicative criteria."),
            ]),
        ],
    ))

    slides.append(Slide(
        "Special assessments must earn their place",
        "The app now treats PRO/COA, PK/PD, biomarkers, and extra assessments as burden drivers unless justified.",
        [
            simple_table(0.75, 1.75, 11.75, 4.85, [
                ("Assessment type", "Allowed when it supports", "AI behavior"),
                ("PRO / COA", "Symptoms, functioning, QoL, tolerability, HTA or practice interpretation", "Include only if patient-relevant outcome is decision-critical"),
                ("PK / PD", "Dose, exposure-response, safety, bridging, special population", "Avoid by default in pragmatic/practice-informing studies"),
                ("Biomarkers", "Eligibility, stratification, predictive/prognostic interpretation, safety risk", "Require explicit decision or endpoint role"),
                ("Special imaging/labs/ECG/wearables", "Endpoint evaluation, essential safety, feasibility", "Flag if not clearly tied to value"),
            ]),
        ],
    ))

    slides.append(Slide(
        "AI suggestions are selectable alternatives, not auto-fill",
        "The AI proposes packages; the user chooses which parts become working study content.",
        [
            *flow_row(0.75, 1.8, [
                ("Readiness", "Needs only essential context for that field"),
                ("Generate", "3 option packages: balanced, pragmatic, assertive/request-shaped"),
                ("Pushback", "Flags conflicts with study context or guardrails"),
                ("Select", "User accepts primary objective, selected secondary objectives, design text, endpoints"),
                ("Merge", "Existing accepted content is kept unless explicitly replaced"),
            ], box_w=2.1, gap=0.28),
            text(0.95, 5.75, 11.2, 0.5, "Example: if user asks for broad biomarkers but intent is practice-informing, AI should mark the option as partially aligned or conflicting and propose a leaner alternative.", 16, DARK_RED, True, "ctr"),
        ],
    ))

    slides.append(Slide(
        "How AI is instructed behind the scenes",
        "Every AI action receives the same study context plus field-specific constraints.",
        [
            rect(0.8, 1.72, 3.1, 4.8, PALE_RED, RED),
            text(1.05, 1.98, 2.55, 0.35, "Shared context", 17, RED, True),
            text(1.05, 2.48, 2.55, 3.15, "Study type\nDevelopment stage\nPrimary intent\nEvidence use\nDisease\nIntervention\nComparator\nObjectives\nEndpoints\nGuardrail profile", 14, INK),
            line(4.1, 4.05, 0.9, 0, DARK_RED),
            rect(5.05, 1.72, 3.05, 4.8, SOFT_BLUE, BLUE),
            text(5.3, 1.98, 2.5, 0.35, "Guardrail notes", 17, BLUE, True),
            text(5.3, 2.48, 2.5, 3.4, "Limit objectives\nAvoid endpoint bloat\nMake duration explicit\nMinimize special assessments\nRequire justification for PRO, PK/PD, biomarkers\nKeep SoA proportionate", 14, INK),
            line(8.3, 4.05, 0.9, 0, DARK_RED),
            rect(9.25, 1.72, 3.1, 4.8, LIGHT, GRAY),
            text(9.5, 1.98, 2.55, 0.35, "Action prompt", 17, INK, True),
            text(9.5, 2.48, 2.55, 3.4, "Suggest objectives\nSuggest endpoints\nDraft population\nExtract PICO & stats\nGenerate schema\nGenerate SoA\nAssess impact\nDraft final synopsis", 14, INK),
        ],
    ))

    slides.append(Slide(
        "Impact assessment is early feedback for iteration",
        "It estimates likely evidence impact, then tells the user what to strengthen before moving downstream.",
        [
            rect(0.85, 1.75, 3.25, 3.95, SOFT_BLUE, BLUE),
            text(1.1, 2.0, 2.75, 0.35, "Essential inputs", 17, BLUE, True),
            text(1.1, 2.48, 2.75, 2.7, "Primary aim\nStudy type\nDisease/topic\nIntervention/exposure\nPrimary objective", 15, INK),
            line(4.35, 3.72, 0.9, 0, BLUE),
            rect(5.45, 1.75, 2.4, 3.95, PALE_RED, RED),
            text(5.68, 2.0, 1.9, 0.35, "Scored domains", 17, RED, True, "ctr"),
            text(5.68, 2.48, 1.9, 2.65, "Guideline\nLabel\nPublication\nPractice\nHTA", 17, INK, True, "ctr"),
            line(8.05, 3.72, 0.9, 0, DARK_RED),
            rect(9.15, 1.75, 3.25, 3.95, LIGHT, GRAY),
            text(9.4, 2.0, 2.75, 0.35, "Output", 17, INK, True),
            text(9.4, 2.48, 2.75, 2.75, "Impact level\nRationale\nBlockers\nStrengthen actions\nGuardrail-informed simplification prompts", 15, INK),
            text(1.15, 6.2, 11.0, 0.38, "The assessment is not a prediction. It is a design pressure-test that helps users refine intent, comparator, endpoints, and burden.", 15, DARK_RED, True, "ctr"),
        ],
    ))

    slides.append(Slide(
        "Final design principle",
        "Keep the researcher workflow simple while making the AI more disciplined.",
        [
            text(0.8, 1.95, 4.4, 2.6, "Ask fewer questions upfront.", 34, RED, True),
            text(5.55, 1.95, 6.6, 2.6, "Use the answers to constrain everything downstream.", 34, INK, True),
            rule(0.85, 4.8, 11.7, GRAY),
            text(0.95, 5.25, 11.3, 0.72, "The app should feel like a guided study-design assistant, not a protocol template form. Guardrails should appear as feedback, AI prompts, and simplification options at the moment they matter.", 18, SLATE, False, "ctr"),
        ],
    ))

    return slides


def flow_row(x: float, y: float, items: list[tuple[str, str]], box_w: float = 1.85, gap: float = 0.22) -> list[Element]:
    elements: list[Element] = []
    for i, (title, body) in enumerate(items):
        bx = x + i * (box_w + gap)
        elements.append(rect(bx, y, box_w, 2.45, SOFT_RED if i == 0 else LIGHT, RED if i == 0 else GRAY))
        elements.append(text(bx + 0.16, y + 0.25, box_w - 0.32, 0.42, title, 14, RED if i == 0 else INK, True, "ctr"))
        elements.append(text(bx + 0.16, y + 0.85, box_w - 0.32, 1.05, body, 10, SLATE, False, "ctr"))
        if i < len(items) - 1:
            elements.append(line(bx + box_w + 0.03, y + 1.22, gap - 0.04, 0, DARK_RED, True, 1.2))
    return elements


def simple_table(x: float, y: float, w: float, h: float, rows: list[tuple[str, ...]]) -> Element:
    # Store table as one multiline text element for editable simplicity; preview renderer draws it as rows.
    return Element("text", x, y, w, h, text="\n".join(" | ".join(row) for row in rows), fill="TABLE", font_size=11, color=INK)


def grid_cards(x: float, y: float, items: list[tuple[str, str]]) -> list[Element]:
    elements: list[Element] = []
    card_w, card_h = 3.55, 1.32
    for idx, (title, body) in enumerate(items):
        col = idx % 3
        row = idx // 3
        bx = x + col * 4.05
        by = y + row * 1.72
        elements.append(rect(bx, by, card_w, card_h, SOFT_RED if idx in {0, 1, 4} else LIGHT, RED if idx in {0, 1, 4} else GRAY))
        elements.append(text(bx + 0.22, by + 0.18, card_w - 0.44, 0.28, title, 14, RED if idx in {0, 1, 4} else INK, True))
        elements.append(text(bx + 0.22, by + 0.55, card_w - 0.44, 0.52, body, 10, SLATE))
    return elements


def table_to_shapes(el: Element, start_id: int) -> tuple[str, int]:
    rows = [row.split(" | ") for row in el.text.split("\n")]
    row_h = el.h / len(rows)
    col_count = max(len(row) for row in rows)
    col_w = el.w / col_count
    xml = []
    shape_id = start_id
    for r, row in enumerate(rows):
        for c in range(col_count):
            value = row[c] if c < len(row) else ""
            fill = SOFT_RED if r == 0 else ("FFFFFF" if r % 2 else "F8FAFC")
            color = RED if r == 0 else INK
            bold = r == 0 or c == 0
            xml.append(shape_xml(rect(el.x + c * col_w, el.y + r * row_h, col_w, row_h, fill, "E5E7EB", False), shape_id))
            shape_id += 1
            xml.append(shape_xml(text(el.x + c * col_w + 0.05, el.y + r * row_h + 0.04, col_w - 0.1, row_h - 0.08, value, 9 if len(value) > 58 else 10, color, bold), shape_id))
            shape_id += 1
    return "\n".join(xml), shape_id


def slide_xml_with_tables(slide: Slide) -> str:
    base_elements = [
        rect(0, 0, W_IN, H_IN, "FFFFFF", "", False),
        rect(0, 0, 0.18, H_IN, RED, "", False),
        text(0.55, 0.32, 4.0, 0.25, slide.eyebrow, 9, RED, True),
        text(0.55, 0.68, 7.9, 0.55, slide.title, 24, INK, False),
    ]
    if slide.subtitle:
        base_elements.append(text(0.58, 1.23, 8.8, 0.42, slide.subtitle, 12, SLATE))
    elements = base_elements + slide.elements
    parts = []
    shape_id = 2
    for el in elements:
        if el.kind == "text" and el.fill == "TABLE":
            table_xml, shape_id = table_to_shapes(el, shape_id)
            parts.append(table_xml)
        else:
            parts.append(shape_xml(el, shape_id))
            shape_id += 1
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    {"".join(parts)}
  </p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>"""


def write_pptx(slides: list[Slide]) -> None:
    rels = "\n".join(
        f'<Relationship Id="rId{i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i+1}.xml"/>'
        for i in range(len(slides))
    )
    slide_ids = "\n".join(f'<p:sldId id="{256+i}" r:id="rId{i+1}"/>' for i in range(len(slides)))
    layout_rel_id = len(slides) + 1
    theme_rel_id = len(slides) + 2
    content_overrides = "\n".join(
        f'<Override PartName="/ppt/slides/slide{i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        for i in range(len(slides))
    )
    with zipfile.ZipFile(PPTX_PATH, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  {content_overrides}
</Types>""")
        z.writestr("_rels/.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>""")
        now = datetime.now(timezone.utc).isoformat()
        z.writestr("docProps/core.xml", f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Study Synopsis Studio logic</dc:title><dc:creator>Codex</dc:creator><cp:lastModifiedBy>Codex</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>
</cp:coreProperties>""")
        z.writestr("docProps/app.xml", f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Codex</Application><PresentationFormat>On-screen Show (16:9)</PresentationFormat><Slides>{len(slides)}</Slides></Properties>""")
        z.writestr("ppt/presentation.xml", f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId{layout_rel_id}"/></p:sldMasterIdLst>
  <p:sldIdLst>{slide_ids}</p:sldIdLst>
  <p:sldSz cx="{SLIDE_W}" cy="{SLIDE_H}" type="wide"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>""")
        z.writestr("ppt/_rels/presentation.xml.rels", f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">{rels}<Relationship Id="rId{layout_rel_id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/><Relationship Id="rId{theme_rel_id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/></Relationships>""")
        z.writestr("ppt/slideMasters/slideMaster1.xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>""")
        z.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>""")
        z.writestr("ppt/slideLayouts/slideLayout1.xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>""")
        z.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>""")
        z.writestr("ppt/theme/theme1.xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Study Synopsis"><a:themeElements><a:clrScheme name="Custom"><a:dk1><a:srgbClr val="242424"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="475569"/></a:dk2><a:lt2><a:srgbClr val="F8FAFC"/></a:lt2><a:accent1><a:srgbClr val="D71920"/></a:accent1><a:accent2><a:srgbClr val="1864AB"/></a:accent2><a:accent3><a:srgbClr val="8A1538"/></a:accent3><a:accent4><a:srgbClr val="E5E7EB"/></a:accent4><a:accent5><a:srgbClr val="FDECEC"/></a:accent5><a:accent6><a:srgbClr val="E7F5FF"/></a:accent6><a:hlink><a:srgbClr val="1864AB"/></a:hlink><a:folHlink><a:srgbClr val="8A1538"/></a:folHlink></a:clrScheme><a:fontScheme name="Aptos"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme><a:fmtScheme name="Default"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>""")
        for idx, slide in enumerate(slides, start=1):
            z.writestr(f"ppt/slides/slide{idx}.xml", slide_xml_with_tables(slide))
            z.writestr(f"ppt/slides/_rels/slide{idx}.xml.rels", slide_rel_xml())


def write_svg_previews(slides: list[Slide]) -> None:
    PREVIEW_DIR.mkdir(exist_ok=True)
    for idx, slide in enumerate(slides, start=1):
        elements = [
            rect(0, 0, W_IN, H_IN, "FFFFFF", "", False),
            rect(0, 0, 0.18, H_IN, RED, "", False),
            text(0.55, 0.32, 4.0, 0.25, slide.eyebrow, 9, RED, True),
            text(0.55, 0.68, 7.9, 0.55, slide.title, 24, INK, False),
        ]
        if slide.subtitle:
            elements.append(text(0.58, 1.23, 8.8, 0.42, slide.subtitle, 12, SLATE))
        elements += slide.elements
        svg_parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 {W_IN} {H_IN}">']
        for el in elements:
            svg_parts.append(svg_el(el))
        svg_parts.append("</svg>")
        (PREVIEW_DIR / f"slide-{idx:02}.svg").write_text("\n".join(svg_parts), encoding="utf-8")


def svg_el(el: Element) -> str:
    if el.kind in {"rect", "pill"}:
        rx = 0.15 if el.radius else 0
        body = f'<rect x="{el.x}" y="{el.y}" width="{el.w}" height="{el.h}" rx="{rx}" fill="#{el.fill}" stroke="#{el.stroke or el.fill}" stroke-width="0.012"/>'
        if el.text:
            body += svg_text(el)
        return body
    if el.kind == "line":
        marker = ' marker-end="url(#arrow)"' if el.arrow else ""
        return f'<line x1="{el.x}" y1="{el.y}" x2="{el.x+el.w}" y2="{el.y+el.h}" stroke="#{el.stroke}" stroke-width="{el.weight/60}"{marker}/>'
    if el.kind == "rule":
        return f'<line x1="{el.x}" y1="{el.y}" x2="{el.x+el.w}" y2="{el.y}" stroke="#{el.stroke}" stroke-width="0.015"/>'
    if el.fill == "TABLE":
        return svg_table(el)
    return svg_text(el)


def svg_text(el: Element) -> str:
    anchor = {"l": "start", "ctr": "middle", "r": "end"}[el.align]
    x = el.x + (el.w / 2 if el.align == "ctr" else 0.08)
    y = el.y + 0.22
    lines = []
    for line_idx, line_value in enumerate(el.text.split("\n")):
        lines.append(
            f'<text x="{x}" y="{y + line_idx * (el.font_size / 110)}" font-family="Aptos, Arial, sans-serif" font-size="{el.font_size/95}" font-weight="{700 if el.bold else 400}" fill="#{el.color}" text-anchor="{anchor}">{esc(line_value.replace("|", ""))}</text>'
        )
    return "\n".join(lines)


def svg_table(el: Element) -> str:
    rows = [row.split(" | ") for row in el.text.split("\n")]
    row_h = el.h / len(rows)
    col_count = max(len(row) for row in rows)
    col_w = el.w / col_count
    parts = []
    for r, row in enumerate(rows):
        for c in range(col_count):
            value = row[c] if c < len(row) else ""
            fill = SOFT_RED if r == 0 else ("FFFFFF" if r % 2 else "F8FAFC")
            color = RED if r == 0 else INK
            parts.append(f'<rect x="{el.x+c*col_w}" y="{el.y+r*row_h}" width="{col_w}" height="{row_h}" fill="#{fill}" stroke="#E5E7EB" stroke-width="0.01"/>')
            parts.append(f'<text x="{el.x+c*col_w+0.07}" y="{el.y+r*row_h+0.24}" font-family="Aptos, Arial, sans-serif" font-size="0.105" font-weight="{700 if r == 0 or c == 0 else 400}" fill="#{color}">{esc(value[:58])}</text>')
    return "\n".join(parts)


def main() -> None:
    slides = build_slides()
    write_pptx(slides)
    write_svg_previews(slides)
    print(PPTX_PATH)
    print(PREVIEW_DIR)


if __name__ == "__main__":
    main()
