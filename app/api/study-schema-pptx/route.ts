import { NextResponse } from "next/server"
import PptxGenJS from "pptxgenjs"

export const runtime = "nodejs"

type StudySchemaPptxPayload = {
  fileName?: string
  title?: string
  schemaType?: string
  designPattern?: string
  hasTimeline?: boolean
  colors?: {
    accent?: string
    edge?: string
    text?: string
    background?: string
    softFill?: string
    cardFill?: string
  }
  banner?: string
  disease?: string
  studySetupDetails?: string
  designSummary?: string
  step2Details?: string
  intervention?: string
  interventionSubtitle?: string
  comparator?: string
  primaryEndpoint?: string
  evidenceIntent?: string
  timeline?: string
  panels?: Array<{ title?: string; body?: string; border?: string }>
}

function cleanText(value: unknown, fallback = "") {
  return String(value || fallback)
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim()
}

function cleanColor(value: unknown, fallback: string) {
  const normalized = String(value || "").replace("#", "").trim()

  return /^[0-9a-f]{6}$/i.test(normalized) ? normalized.toUpperCase() : fallback
}

function safeFileName(value: unknown) {
  const normalized = String(value || "study-schema.pptx")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  return normalized.endsWith(".pptx") ? normalized : `${normalized || "study-schema"}.pptx`
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as StudySchemaPptxPayload
    const colors = {
      accent: cleanColor(payload.colors?.accent, "D71920"),
      edge: cleanColor(payload.colors?.edge, "8A1538"),
      text: cleanColor(payload.colors?.text, "242424"),
      background: cleanColor(payload.colors?.background, "FFF7F7"),
      softFill: cleanColor(payload.colors?.softFill, "FDECEC"),
      cardFill: cleanColor(payload.colors?.cardFill, "FFFFFF"),
    }
    const comparator = cleanText(payload.comparator)
    const designPattern = cleanText(payload.designPattern)
    const pptx = new PptxGenJS()
    pptx.layout = "LAYOUT_WIDE"
    pptx.author = "Study Synopsis Studio"
    pptx.company = "Study Synopsis Studio"
    pptx.subject = "Editable study schema"
    pptx.title = cleanText(payload.title, "Study schema")
    pptx.theme = {
      headFontFace: "Helvetica",
      bodyFontFace: "Helvetica",
    }

    const slide = pptx.addSlide()
    slide.background = { color: colors.background }

    const addText = (
      value: string,
      x: number,
      y: number,
      w: number,
      h: number,
      options: Record<string, unknown> = {},
    ) => {
      slide.addText(value, {
        x,
        y,
        w,
        h,
        margin: 0.04,
        color: colors.text,
        fontFace: "Helvetica",
        fit: "shrink",
        breakLine: false,
        ...options,
      })
    }

    const addCard = (x: number, y: number, w: number, h: number, fill: string, border: string) => {
      slide.addShape("roundRect", {
        x,
        y,
        w,
        h,
        fill: { color: fill },
        line: { color: border, width: 1.4 },
      })
    }

    const addArrow = (x: number, y: number, w: number, h = 0) => {
      slide.addShape("line", {
        x,
        y,
        w,
        h,
        line: { color: colors.edge, width: 2.2, endArrowType: "triangle" },
      })
    }

    const addLine = (x: number, y: number, w: number, h = 0) => {
      slide.addShape("line", {
        x,
        y,
        w,
        h,
        line: { color: colors.edge, width: 2.2 },
      })
    }

    const addPanel = (title: string, body: string, x: number, y: number, w: number, h: number, border = "F2B8BC") => {
      addCard(x, y, w, h, colors.cardFill, border)
      addText(title.toUpperCase(), x + 0.16, y + 0.12, w - 0.32, 0.24, {
        fontSize: 9,
        bold: true,
        color: title.toLowerCase() === "decision use" ? colors.text : colors.accent,
        charSpace: 1.2,
      })
      addText(body, x + 0.16, y + 0.48, w - 0.32, h - 0.58, {
        fontSize: 9.4,
        bold: true,
        color: colors.text,
        valign: "top",
      })
    }

    addText("ONE-SLIDE STUDY SCHEMA", 0.45, 0.18, 3.4, 0.22, {
      fontSize: 9,
      bold: true,
      color: colors.accent,
      charSpace: 1.3,
    })
    addCard(0.45, 0.42, 12.35, 0.28, colors.softFill, colors.softFill)
    addText(cleanText(payload.banner, cleanText(payload.designSummary, "Study design summary")), 0.62, 0.46, 11.95, 0.18, {
      fontSize: 8.5,
      bold: true,
      color: colors.accent,
      charSpace: 0.8,
    })

    addCard(0.45, 1.45, 2.35, 1.35, colors.accent, colors.accent)
    addText("STEP 1 · STUDY SETUP", 0.64, 1.64, 1.95, 0.18, {
      fontSize: 8,
      bold: true,
      color: "FFFFFF",
      charSpace: 1.1,
    })
    addText(cleanText(payload.disease, "Target condition"), 0.64, 1.94, 1.95, 0.3, {
      fontSize: 16,
      bold: true,
      color: "FFFFFF",
    })
    addText(cleanText(payload.studySetupDetails), 0.64, 2.28, 1.95, 0.42, {
      fontSize: 8.2,
      color: "FFFFFF",
      fit: "shrink",
    })

    addArrow(2.85, 2.13, 0.45)
    addCard(3.32, 1.56, 1.65, 1.2, colors.softFill, "F2B8BC")
    addText("STEP 2", 3.48, 1.8, 0.7, 0.16, {
      fontSize: 8,
      bold: true,
      color: colors.accent,
      charSpace: 1,
    })
    addText(cleanText(payload.designSummary, "Study design"), 3.48, 2.01, 1.28, 0.46, {
      fontSize: 10.4,
      bold: true,
      color: colors.text,
      fit: "shrink",
    })
    addText(cleanText(payload.step2Details), 3.48, 2.5, 1.28, 0.16, {
      fontSize: 7.4,
      color: colors.text,
      fit: "shrink",
    })

    addArrow(5.0, 2.13, 0.45)
    addCard(5.5, 1.6, 2.35, 1.15, colors.accent, colors.accent)
    addCard(5.5, 1.6, 2.35, 0.34, "E5484D", "E5484D")
    const experimentalHeader = designPattern === "crossover" ? "SEQUENCE A" : designPattern === "platform_master_protocol" ? "PLATFORM ARM" : payload.schemaType?.includes("observational") ? "EXPOSURE GROUP" : "EXPERIMENTAL ARM"
    const comparatorHeader = designPattern === "crossover" ? "SEQUENCE B" : designPattern === "platform_master_protocol" ? "SHARED / REFERENCE ARM" : payload.schemaType?.includes("observational") ? "COMPARISON GROUP" : "COMPARATOR ARM"

    addText(experimentalHeader, 5.66, 1.74, 1.8, 0.16, {
      fontSize: 8,
      bold: true,
      color: "FFFFFF",
      charSpace: 1,
    })
    addText(cleanText(payload.intervention, "Study intervention"), 5.66, 2.03, 1.9, 0.25, {
      fontSize: 15,
      bold: true,
      color: "FFFFFF",
      fit: "shrink",
    })
    addText(cleanText(payload.interventionSubtitle), 5.66, 2.38, 1.9, 0.2, {
      fontSize: 8.5,
      color: "FFFFFF",
      fit: "shrink",
    })

    if (comparator) {
      addCard(5.5, 2.92, 2.35, 1.08, "F4F4F5", "D4D4D8")
      addCard(5.5, 2.92, 2.35, 0.34, "E5E7EB", "E5E7EB")
      addText(comparatorHeader, 5.66, 3.06, 1.8, 0.16, {
        fontSize: 8,
        bold: true,
        color: "52525B",
        charSpace: 1,
      })
      addText(comparator, 5.66, 3.35, 1.9, 0.25, {
        fontSize: 14,
        bold: true,
        color: colors.text,
        fit: "shrink",
      })
      addText("Reference treatment strategy", 5.66, 3.68, 1.9, 0.2, {
        fontSize: 8,
        color: colors.text,
        fit: "shrink",
      })
      addLine(7.85, 2.18, 0.36)
      addLine(7.85, 3.46, 0.36)
      addLine(8.21, 2.18, 0, 1.28)
      addArrow(8.21, 2.82, 0.34)
    } else {
      addArrow(7.9, 2.15, 0.55)
    }

    addCard(8.55, 1.6, 2.55, 1.35, colors.cardFill, "D6B0BB")
    addText("STEP 3 · READOUT", 8.75, 1.78, 1.65, 0.18, {
      fontSize: 8,
      bold: true,
      color: colors.edge,
      charSpace: 1,
    })
    addText(cleanText(payload.primaryEndpoint, "Primary endpoint"), 8.75, 2.1, 2.05, 0.46, {
      fontSize: 13,
      bold: true,
      color: colors.text,
      fit: "shrink",
    })
    addText(cleanText(payload.evidenceIntent, "Decision use"), 8.75, 2.62, 2.05, 0.18, {
      fontSize: 8.5,
      color: colors.text,
      fit: "shrink",
    })

    if (payload.hasTimeline) {
      addText("STUDY TIMELINE", 0.45, 4.25, 1.2, 0.18, {
        fontSize: 7.5,
        bold: true,
        color: colors.text,
        charSpace: 1.1,
      })
      slide.addShape("chevron", { x: 0.45, y: 4.48, w: 5.0, h: 0.48, fill: { color: colors.accent }, line: { color: colors.accent } })
      addText(`Enrollment\n${cleanText(payload.timeline, "Timeline to be confirmed")}`, 0.62, 4.55, 4.4, 0.3, {
        fontSize: 8.5,
        bold: true,
        color: "FFFFFF",
        fit: "shrink",
      })
      slide.addShape("chevron", { x: 5.62, y: 4.48, w: 5.0, h: 0.48, fill: { color: "6B7280" }, line: { color: "6B7280" } })
      addText("Follow-up / readout", 5.8, 4.62, 4.25, 0.16, {
        fontSize: 8.5,
        bold: true,
        color: "FFFFFF",
      })
    }

    const panelTop = payload.hasTimeline ? 5.15 : 4.35
    const panelW = 3.45
    const panelH = payload.hasTimeline ? 0.88 : 1.12
    const panelGap = 0.25

    ;(payload.panels || []).slice(0, 6).forEach((panel, index) => {
      const row = Math.floor(index / 3)
      const col = index % 3
      addPanel(
        cleanText(panel.title, "Panel"),
        cleanText(panel.body, "To be confirmed"),
        0.45 + col * (panelW + panelGap),
        panelTop + row * (panelH + 0.25),
        panelW,
        panelH,
        cleanColor(panel.border, "F2B8BC"),
      )
    })

    addText("Editable PPT export: all boxes, arrows, text, and colors are native PowerPoint objects.", 0.45, 7.22, 12.4, 0.14, {
      fontSize: 6.5,
      color: "6B7280",
    })

    const content = await pptx.write({ outputType: "nodebuffer" })
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content as Uint8Array)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${safeFileName(payload.fileName)}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return new NextResponse(error instanceof Error ? error.message : "Unable to generate the PPTX file.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
}
