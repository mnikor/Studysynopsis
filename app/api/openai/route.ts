import JSZip from "jszip"
import OpenAI from "openai"
import { zodTextFormat } from "openai/helpers/zod"
import { z } from "zod"

export const runtime = "nodejs"

const model = process.env.OPENAI_MODEL || "gpt-5"

const stringField = z.string().optional().default("")
const stringArrayField = z.array(z.string()).optional().default([])
const requiredStringField = z.string()
const requiredStringArrayField = z.array(z.string())

const studySchema = z.object({
  studyTitle: stringField,
  sponsor: stringField,
  category: stringField,
  subcategory: stringField,
  developmentStage: stringField,
  protocolGuardrailProfile: stringField,
  phase3SafetyDataAvailable: stringField,
  protocolGuardrailNotes: stringField,
  primaryEvidenceUseIntent: stringField,
  secondaryEvidenceUseIntents: stringArrayField,
  primaryStrategicObjective: stringField,
  secondaryStrategicObjectives: stringArrayField,
  customStrategicObjective: stringField,
  therapeuticArea: stringField,
  disease: stringField,
  customDisease: stringField,
  topIntervention: stringField,
  topInterventionClass: stringField,
  topComparator: stringField,
  topLineOfTherapy: stringField,
  selectedEndpoints: stringArrayField,
  customEndpoints: stringField,
  indication: stringField,
  primaryObjective: stringField,
  secondaryObjectives: stringField,
  designOverview: stringField,
  population: stringField,
  intervention: stringField,
  comparator: stringField,
  outcomes: stringField,
  timeline: stringField,
  geography: stringField,
  sampleSize: stringField,
  eligibility: stringField,
  operationalNotes: stringField,
})

const importedStudySchema = z.object({
  studyTitle: requiredStringField,
  sponsor: requiredStringField,
  category: requiredStringField,
  subcategory: requiredStringField,
  developmentStage: requiredStringField,
  protocolGuardrailProfile: requiredStringField,
  phase3SafetyDataAvailable: requiredStringField,
  protocolGuardrailNotes: requiredStringField,
  primaryEvidenceUseIntent: requiredStringField,
  secondaryEvidenceUseIntents: requiredStringArrayField,
  primaryStrategicObjective: requiredStringField,
  secondaryStrategicObjectives: requiredStringArrayField,
  customStrategicObjective: requiredStringField,
  therapeuticArea: requiredStringField,
  disease: requiredStringField,
  customDisease: requiredStringField,
  topIntervention: requiredStringField,
  topInterventionClass: requiredStringField,
  topComparator: requiredStringField,
  topLineOfTherapy: requiredStringField,
  selectedEndpoints: requiredStringArrayField,
  customEndpoints: requiredStringField,
  indication: requiredStringField,
  primaryObjective: requiredStringField,
  secondaryObjectives: requiredStringField,
  designOverview: requiredStringField,
  population: requiredStringField,
  intervention: requiredStringField,
  comparator: requiredStringField,
  outcomes: requiredStringField,
  timeline: requiredStringField,
  geography: requiredStringField,
  sampleSize: requiredStringField,
  eligibility: requiredStringField,
  operationalNotes: requiredStringField,
})

const picoSchema = z.object({
  population: z.string(),
  intervention: z.string(),
  comparator: z.string(),
  outcomes: z.string(),
  timeframe: z.string(),
  prompt: z.string(),
})

const statsSchema = z.object({
  estimand: z.string(),
  endpointType: z.string(),
  hypothesis: z.string(),
  alpha: z.string(),
  power: z.string(),
  effectSize: z.string(),
  variability: z.string(),
  attrition: z.string(),
  analysisModel: z.string(),
  missingData: z.string(),
  rationale: z.string(),
  prompt: z.string(),
})

const literatureSchema = z.object({
  researchQuestion: z.string(),
  databases: z.string(),
  evidenceWindow: z.string(),
  inclusionCriteria: z.string(),
  exclusionCriteria: z.string(),
  keywords: z.string(),
  pubmedQuery: z.string(),
  embaseQuery: z.string(),
  greyLiteraturePlan: z.string(),
  backgroundThemes: z.string(),
  prompt: z.string(),
})

const studyVisualizationLaneSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
})

const studyVisualizationNodeSchema = z.object({
  id: z.string(),
  laneId: z.string(),
  label: z.string(),
  subtitle: z.string(),
  kind: z.enum(["start", "screening", "decision", "arm", "cohort", "database", "assessment", "analysis", "output", "milestone"]),
  column: z.number().int().min(0).max(12),
  row: z.number().int().min(0).max(6),
})

const studyVisualizationEdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  label: z.string(),
  style: z.enum(["solid", "dashed"]),
})

const studyVisualizationResultSchema = z.object({
  title: z.string(),
  schemaType: z.string(),
  orientation: z.enum(["horizontal", "vertical"]),
  detailLevel: z.enum(["simple", "standard", "detailed"]),
  lanes: z.array(studyVisualizationLaneSchema),
  nodes: z.array(studyVisualizationNodeSchema),
  edges: z.array(studyVisualizationEdgeSchema),
  notes: z.array(z.string()),
})

const scheduleColumnSchema = z.object({
  id: z.string(),
  phase: z.string(),
  period: z.string(),
  visit: z.string(),
  footnote: z.string().optional().default(""),
})

const scheduleRowInputSchema = z.object({
  id: z.string(),
  group: z.string(),
  activity: z.string(),
  cells: z.record(z.string()),
  notes: z.string().optional().default(""),
})

const scheduleCellResultSchema = z.object({
  columnId: z.string(),
  value: z.string(),
})

const scheduleRowResultSchema = z.object({
  id: z.string(),
  group: z.string(),
  activity: z.string(),
  cells: z.array(scheduleCellResultSchema),
  notes: z.string(),
})

const scheduleColumnResultSchema = z.object({
  id: z.string(),
  phase: z.string(),
  period: z.string(),
  visit: z.string(),
  footnote: z.string(),
})

const scheduleSchema = z.object({
  purpose: z.string().optional().default(""),
  prompt: z.string().optional().default(""),
  iterationPrompt: z.string().optional().default(""),
  columns: z.array(scheduleColumnSchema).optional().default([]),
  rows: z.array(scheduleRowInputSchema).optional().default([]),
  generatedAt: z.string().optional().default(""),
  provenance: z.string().optional().default(""),
  manualEdited: z.boolean().optional().default(false),
})

const sectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  prompt: z.string(),
  body: z.string().optional().default(""),
  included: z.boolean().optional().default(true),
})

const finalSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
})

const importReferenceDataSchema = z.object({
  categories: z.array(z.string()).default([]),
  subcategories: z.record(z.array(z.string())).default({}),
  developmentStages: z.array(z.string()).default([]),
  strategicObjectives: z.array(z.string()).default([]),
  evidenceUseIntents: z.array(z.string()).default([]),
  therapeuticAreas: z.record(z.array(z.string())).default({}),
})

const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("import_study_document"),
    fileName: z.string(),
    mimeType: z.string(),
    fileData: z.string(),
    referenceData: importReferenceDataSchema,
  }),
  z.object({
    action: z.literal("suggest_objectives"),
    study: studySchema,
    requestNote: stringField,
  }),
  z.object({
    action: z.literal("suggest_endpoints"),
    study: studySchema,
    requestNote: stringField,
  }),
  z.object({
    action: z.literal("suggest_population"),
    study: studySchema,
  }),
  z.object({
    action: z.literal("assess_impact"),
    study: studySchema,
  }),
  z.object({
    action: z.literal("generate_study_schema"),
    study: studySchema,
    requestNote: stringField,
    designPattern: stringField,
    orientation: z.enum(["horizontal", "vertical"]),
    detailLevel: z.enum(["simple", "standard", "detailed"]),
  }),
  z.object({
    action: z.literal("extract_pico_stats"),
    study: studySchema,
  }),
  z.object({
    action: z.literal("build_literature"),
    study: studySchema,
    pico: picoSchema.partial().optional(),
  }),
  z.object({
    action: z.literal("generate_schedule"),
    study: studySchema,
    pico: picoSchema.partial().optional(),
    stats: statsSchema.partial().optional(),
    literature: literatureSchema.partial().optional(),
    schedulePrompt: stringField,
    iterationPrompt: stringField,
    schedule: scheduleSchema.partial().optional(),
  }),
  z.object({
    action: z.literal("analyze_schedule"),
    study: studySchema,
    pico: picoSchema.partial().optional(),
    stats: statsSchema.partial().optional(),
    schedule: scheduleSchema,
    focus: stringField,
  }),
  z.object({
    action: z.literal("recommend_schedule_layout"),
    study: studySchema,
    schedule: scheduleSchema,
  }),
  z.object({
    action: z.literal("draft_sections"),
    study: studySchema,
    pico: picoSchema.partial().optional(),
    stats: statsSchema.partial().optional(),
    literature: literatureSchema.partial().optional(),
    schedule: scheduleSchema.partial().optional(),
    sections: z.array(sectionSchema),
  }),
  z.object({
    action: z.literal("generate_synopsis"),
    study: studySchema,
    pico: picoSchema.partial().optional(),
    stats: statsSchema.partial().optional(),
    literature: literatureSchema.partial().optional(),
    schedule: scheduleSchema.partial().optional(),
    sections: z.array(sectionSchema),
  }),
])

const picoStatsResultSchema = z.object({
  pico: picoSchema,
  stats: statsSchema,
})

const literatureResultSchema = z.object({
  literature: literatureSchema,
})

const scheduleResultSchema = z.object({
  purpose: z.string(),
  prompt: z.string(),
  columns: z.array(scheduleColumnResultSchema),
  rows: z.array(scheduleRowResultSchema),
})

const scheduleComplexityDriverSchema = z.object({
  label: z.string(),
  impact: z.enum(["low", "medium", "high"]),
  rationale: z.string(),
})

const scheduleComplexitySchema = z.object({
  overallLevel: z.enum(["Low", "Moderate", "High", "Very High"]),
  overallScore: z.number().min(0).max(100),
  executiveSummary: z.string(),
  visitBurdenScore: z.number().min(0).max(100),
  assessmentBurdenScore: z.number().min(0).max(100),
  operationalBurdenScore: z.number().min(0).max(100),
  drivers: z.array(scheduleComplexityDriverSchema),
  mitigations: z.array(z.string()),
})

const scheduleTradeoffRecommendationSchema = z.object({
  id: z.string(),
  target: z.string(),
  category: z.string(),
  recommendation: z.string(),
  expectedBenefit: z.string(),
  dataQualityRisk: z.enum(["low", "medium", "high"]),
  endpointProtection: z.string(),
  rationale: z.string(),
})

const scheduleTradeoffSchema = z.object({
  executiveSummary: z.string(),
  protectedElements: z.array(z.string()),
  recommendations: z.array(scheduleTradeoffRecommendationSchema),
  safeguards: z.array(z.string()),
})

const scheduleInsightsResultSchema = z.object({
  complexity: scheduleComplexitySchema,
  tradeoff: scheduleTradeoffSchema,
})

const scheduleLayoutRecommendationResultSchema = z.object({
  recommendedLayout: z.enum(["auto", "single", "split"]),
  splitStrategy: z.enum(["single", "core_follow_up", "balanced", "manual_review"]),
  splitPoint: z.string(),
  summary: z.string(),
  rationale: z.string(),
  benefits: z.array(z.string()),
  cautions: z.array(z.string()),
})

const draftSectionsResultSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      body: z.string(),
    }),
  ),
})

const finalSynopsisResultSchema = z.object({
  sections: z.array(finalSectionSchema),
})

const suggestionAlignmentSchema = z.object({
  status: z.enum(["aligned", "partially_aligned", "conflicts"]),
  summary: z.string(),
  concerns: z.array(z.string()),
  recommendations: z.array(z.string()),
})

const objectiveSuggestionOptionSchema = z.object({
  label: z.string(),
  positioning: z.string(),
  primaryObjective: z.string(),
  secondaryObjectives: z.array(z.string()),
  designOverview: z.string(),
  alignment: suggestionAlignmentSchema,
})

const objectiveSuggestionResultSchema = z.object({
  guidance: z.string(),
  options: z.array(objectiveSuggestionOptionSchema).min(3).max(3),
})

const endpointSuggestionOptionSchema = z.object({
  label: z.string(),
  positioning: z.string(),
  primaryEndpoint: z.string(),
  secondaryEndpoints: z.array(z.string()),
  exploratoryEndpoints: z.array(z.string()),
  rationale: z.string(),
  alignment: suggestionAlignmentSchema,
})

const endpointSuggestionResultSchema = z.object({
  guidance: z.string(),
  options: z.array(endpointSuggestionOptionSchema).min(3).max(3),
})

const populationSuggestionResultSchema = z.object({
  population: z.string(),
  eligibility: z.string(),
  rationale: z.string(),
})

const importedStudyDraftSchema = importedStudySchema.extend({
  endpointCandidates: requiredStringArrayField,
})

const studyDocumentImportResultSchema = z.object({
  summary: z.string(),
  unresolved: z.array(z.string()),
  assumptions: z.array(z.string()),
  study: importedStudyDraftSchema,
})

const impactAssessmentDomainSchema = z.object({
  id: z.string(),
  label: z.string(),
  score: z.number().min(0).max(100),
  impact: z.enum(["low", "medium", "high"]),
  rationale: z.string(),
})

const impactAssessmentResultSchema = z.object({
  executiveSummary: z.string(),
  domains: z.array(impactAssessmentDomainSchema).min(5).max(5),
  blockers: z.array(z.string()),
  strengthenActions: z.array(z.string()),
})

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.")
  }

  return new OpenAI({ apiKey })
}

function stringifyPayload(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)

  if (!match) {
    throw new Error("The uploaded file could not be decoded.")
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  }
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#xA;/g, "\n")
}

function extractTextFromOfficeXml(xml: string, textTagPattern: RegExp, paragraphClosePattern: RegExp) {
  const withParagraphBreaks = xml.replace(paragraphClosePattern, "\n")
  const text = Array.from(withParagraphBreaks.matchAll(textTagPattern))
    .map((match) => decodeXmlEntities(match[1] || ""))
    .join(" ")

  return text.replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim()
}

async function extractTextFromDocx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer)
  const files = ["word/document.xml", ...Object.keys(zip.files).filter((name) => /^word\/header\d+\.xml$|^word\/footer\d+\.xml$/.test(name))]
  const chunks: string[] = []

  for (const name of files) {
    const file = zip.file(name)
    if (!file) continue
    const xml = await file.async("text")
    const text = extractTextFromOfficeXml(xml, /<w:t[^>]*>([\s\S]*?)<\/w:t>/g, /<\/w:p>/g)
    if (text) {
      chunks.push(text)
    }
  }

  return chunks.join("\n\n").trim()
}

async function extractTextFromPptx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer)
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((left, right) => Number(left.match(/slide(\d+)\.xml$/)?.[1] || 0) - Number(right.match(/slide(\d+)\.xml$/)?.[1] || 0))
  const chunks: string[] = []

  for (const name of slideNames) {
    const file = zip.file(name)
    if (!file) continue
    const xml = await file.async("text")
    const text = extractTextFromOfficeXml(xml, /<a:t>([\s\S]*?)<\/a:t>/g, /<\/a:p>/g)
    if (text) {
      const slideNumber = name.match(/slide(\d+)\.xml$/)?.[1] || "?"
      chunks.push(`Slide ${slideNumber}\n${text}`)
    }
  }

  return chunks.join("\n\n").trim()
}

async function parseStructuredInput<T extends z.ZodTypeAny>({
  schema,
  schemaName,
  systemPrompt,
  userInput,
  effort = "medium",
  maxOutputTokens = 2500,
}: {
  schema: T
  schemaName: string
  systemPrompt: string
  userInput: Array<{ role: "user"; content: string | Array<{ type: string; text?: string; filename?: string; file_data?: string }> }>
  effort?: "low" | "medium" | "high"
  maxOutputTokens?: number
}): Promise<z.infer<T>> {
  const client = getClient()
  const buildRequest = (requestedEffort: "low" | "medium" | "high", requestedTokens: number) => ({
    model,
    reasoning: { effort: requestedEffort },
    max_output_tokens: requestedTokens,
    input: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...userInput,
    ],
    text: {
      format: zodTextFormat(schema, schemaName),
    },
  })

  let response = await client.responses.parse(buildRequest(effort, maxOutputTokens) as never)

  if (response.status === "incomplete" && response.incomplete_details?.reason === "max_output_tokens") {
    const retryEffort = effort === "high" ? "medium" : "low"
    const retryTokens = Math.max(maxOutputTokens * 4, 12000)
    response = await client.responses.parse(buildRequest(retryEffort, retryTokens) as never)
  }

  if (!response.output_parsed) {
    const rawText = response.output_text?.trim()

    if (rawText) {
      try {
        return schema.parse(JSON.parse(rawText))
      } catch {
        throw new Error(`The model returned unparseable structured text: ${rawText.slice(0, 300)}`)
      }
    }

    const refusal = (response.output as Array<{ content?: Array<{ type?: string; refusal?: string }> }>)
      .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
      .find((content) => content.type === "refusal")

    if (refusal && "refusal" in refusal) {
      throw new Error(`The model refused the request: ${refusal.refusal}`)
    }

    if (response.incomplete_details) {
      throw new Error(`The model response was incomplete: ${JSON.stringify(response.incomplete_details)}`)
    }

    throw new Error(`The model did not return a structured response. Status: ${response.status}`)
  }

  return response.output_parsed
}

async function parseStructuredOutput<T extends z.ZodTypeAny>({
  schema,
  schemaName,
  systemPrompt,
  payload,
  effort = "medium",
  maxOutputTokens = 2500,
}: {
  schema: T
  schemaName: string
  systemPrompt: string
  payload: unknown
  effort?: "low" | "medium" | "high"
  maxOutputTokens?: number
}): Promise<z.infer<T>> {
  return parseStructuredInput({
    schema,
    schemaName,
    systemPrompt,
    userInput: [
      {
        role: "user",
        content: stringifyPayload(payload),
      },
    ],
    effort,
    maxOutputTokens,
  })
}

function extractPicoStatsPrompt() {
  return [
    "You are a senior clinical development strategist and biostatistician drafting a study synopsis.",
    "Use the provided study design data to produce clean, publication-ready PICO elements and draft statistical assumptions.",
    "Pay close attention to development stage, strategic objective, evidence use intent, therapeutic area, disease, and user-selected endpoints.",
    "If protocolGuardrailNotes is provided, apply it when deciding objective, endpoint, estimand, sample-size, and data-collection discipline.",
    "Do not add PRO/COA, PK/PD, biomarkers, biospecimens, special imaging, ECG, extra labs, wearables, or remote assessments unless they are tied to objectives, endpoint interpretation, safety, dose, population definition, feasibility, or the declared decision use.",
    "Keep outputs concise but specific. Do not use placeholders like TBD unless the input is truly missing.",
    "Return text that is suitable for direct editing in a synopsis workflow.",
    "The prompt field in both pico and stats should be a practical follow-up prompt for a future OpenAI refinement call.",
  ].join("\n")
}

function objectiveSuggestionPrompt() {
  return [
    "You are a senior clinical strategist and medical writer.",
    "Use the study's development stage, strategic objective, evidence use intent, therapeutic area, disease, intervention, comparator, line of therapy or setting, suggested endpoints, study type, and optional requestNote to propose synopsis-ready research objectives.",
    "Research objectives must remain scientific and testable. Do not write objectives as 'support HTA', 'support market access', 'support label change', or any other strategic-program phrasing.",
    "Use strategic objective and evidence use intent to shape comparator rigor, patient-centered support, utilization support, and design framing, not to replace the scientific question being tested.",
    "If protocolGuardrailNotes is provided, follow it. Practice-informing PED guardrails mean focused objectives, typically no more than 5 objectives, no strategic-program phrasing as the scientific objective, simple design, explicit duration, and no extra data collection unless decision-critical.",
    "Do not add PRO/COA, PK/PD, biomarkers, biospecimens, or special assessment objectives by default. Add them only when their decision-critical role is explicit.",
    "Return exactly 3 differentiated option packages: one balanced, one pragmatic or feasibility-oriented, and one assertive or request-shaped alternative.",
    "Each option must include label, positioning, one strong primary objective, a concise array of 2 to 4 secondary objectives, a draft design overview, and an alignment assessment.",
    "If requestNote conflicts with the current study context, do not comply blindly. Mark the option as partially_aligned or conflicts, explain the issue clearly, and suggest safer alternatives.",
    "Make the objective package proportionate to the declared evidence destination. Label or HTA intent usually requires stricter comparator and endpoint discipline than practice-informing or publication-only intent.",
    "For HTA or market-access intent, keep the primary objective focused on comparative clinical or patient-relevant effectiveness. Put quality-of-life, utilization, and stakeholder-relevant support into the secondary objectives and design overview when justified.",
    "Ensure at least one option remains aligned to the current study context when feasible.",
    "Keep the text operationally useful and scientifically credible.",
  ].join("\n")
}

function deriveObjectivePrimaryEndpoint(study: z.infer<typeof studySchema>) {
  const customEndpoints = study.customEndpoints
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean)
  const outcomeLines = study.outcomes
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean)

  return uniqueNonEmptyItems([...study.selectedEndpoints, ...customEndpoints, ...outcomeLines])[0] || "the primary clinical outcome"
}

function extractRequestedComparator(requestNote: string) {
  const note = requestNote.trim()

  if (!note) {
    return ""
  }

  const patterns = [
    /(?:make|use|set|change)\s+(?:it|the comparator|comparator)?\s*(?:to|as)?\s*([a-z0-9][a-z0-9\s+\/(),.-]{2,})\s+as comparator/i,
    /(?:use|set|switch to|change to)\s+([a-z0-9][a-z0-9\s+\/(),.-]{2,})\s+(?:as|for the)\s+comparator/i,
    /comparator\s*(?:should be|to|as|=)\s*([a-z0-9][a-z0-9\s+\/(),.-]{2,})/i,
    /(?:versus|vs\.?|against)\s+([a-z0-9][a-z0-9\s+\/(),.-]{2,})/i,
  ]

  for (const pattern of patterns) {
    const match = note.match(pattern)
    if (match?.[1]) {
      return match[1].trim().replace(/[.,;:]$/, "")
    }
  }

  return ""
}

function buildScientificObjectivePrimary(
  study: z.infer<typeof studySchema>,
  option: z.infer<typeof objectiveSuggestionOptionSchema>,
  requestNote = "",
) {
  const intervention = study.topIntervention.trim() || study.intervention.trim() || "the proposed intervention"
  const comparator = extractRequestedComparator(requestNote) || study.topComparator.trim() || study.comparator.trim() || "the relevant comparator"
  const disease = (study.customDisease || study.disease || "the target disease").trim()
  const setting = study.topLineOfTherapy.trim() ? ` in the ${study.topLineOfTherapy.trim()} setting` : ""
  const primaryEndpoint = deriveObjectivePrimaryEndpoint(study)
  const evidenceIntent = study.primaryEvidenceUseIntent.toLowerCase()
  const objectiveText = option.primaryObjective.toLowerCase()

  if (/quality of life|patient-reported|symptom/.test(objectiveText)) {
    return `Evaluate whether ${intervention} improves patient-reported or symptom outcomes versus ${comparator} in ${disease}${setting}.`
  }

  if (/response|remission|control rate|objective response/.test(objectiveText)) {
    return `Evaluate whether ${intervention} improves response-based disease control versus ${comparator} in ${disease}${setting} by assessing ${primaryEndpoint}.`
  }

  if (/survival|mortality/.test(objectiveText)) {
    return `Evaluate whether ${intervention} improves survival outcomes versus ${comparator} in ${disease}${setting} by assessing ${primaryEndpoint}.`
  }

  if (/progression|event[- ]?free|disease[- ]?free|relapse/.test(objectiveText) || /hta|market access/.test(evidenceIntent)) {
    return `Evaluate the comparative clinical effectiveness of ${intervention} versus ${comparator} in ${disease}${setting} by assessing ${primaryEndpoint}.`
  }

  return `Evaluate the clinical effect of ${intervention} versus ${comparator} in ${disease}${setting} by assessing ${primaryEndpoint}.`
}

function buildScientificObjectiveSecondarys(study: z.infer<typeof studySchema>) {
  const intervention = study.topIntervention.trim() || study.intervention.trim() || "the intervention"
  const strategicObjective = `${study.primaryStrategicObjective} ${study.customStrategicObjective}`.toLowerCase()
  const evidenceIntent = `${study.primaryEvidenceUseIntent} ${study.secondaryEvidenceUseIntents.join(" ")}`.toLowerCase()
  const secondarys = [`Characterize safety and tolerability of ${intervention}.`]

  if (/hta|market access/.test(evidenceIntent)) {
    secondarys.push("Assess health-related quality of life or symptom burden with patient-reported outcomes.")
    secondarys.push("Assess healthcare resource utilization or treatment-pattern consequences that could inform payer decisions.")
  } else if (/guideline|practice/.test(evidenceIntent)) {
    secondarys.push("Assess clinically interpretable and patient-relevant supportive outcomes.")
    secondarys.push("Assess durability of benefit in a way that supports routine-practice interpretation.")
  } else if (/label|regulatory/.test(evidenceIntent)) {
    secondarys.push("Assess key supportive endpoints that strengthen interpretability of the primary result.")
    secondarys.push("Assess durability of benefit and other claim-relevant supportive outcomes.")
  } else {
    secondarys.push("Assess clinically meaningful supportive outcomes that strengthen interpretation of the primary result.")
  }

  if (/dose modification|dose optimization/.test(strategicObjective)) {
    secondarys.push(`Assess dose intensity, treatment modifications, and tolerability support for ${intervention}.`)
  }

  return uniqueNonEmptyItems(secondarys).slice(0, 4)
}

function focusObjectiveOptionPackage(
  option: z.infer<typeof objectiveSuggestionOptionSchema>,
  study: z.infer<typeof studySchema>,
  requestNote = "",
) {
  const requestedComparator = extractRequestedComparator(requestNote)
  const primaryNeedsRewrite = /market access|hta|label|guideline|practice informing|evidence package|evidence destination|positioned to|support .*decision|credible for/i.test(
    option.primaryObjective,
  )
  const filteredSecondarys = uniqueNonEmptyItems(
    option.secondaryObjectives.filter(
      (item) =>
        !/preserve objective framing|keep the objective package aligned|support downstream differentiation|support stakeholder relevance|credible for .*hta|credible for .*label|evidence destination|positioned to/i.test(
          item,
        ),
    ),
  )
  const mergedSecondarys = uniqueNonEmptyItems([...filteredSecondarys, ...buildScientificObjectiveSecondarys(study)]).slice(0, 4)

  return {
    ...option,
    primaryObjective:
      primaryNeedsRewrite || Boolean(requestedComparator)
        ? buildScientificObjectivePrimary(study, option, requestNote)
        : option.primaryObjective.trim(),
    secondaryObjectives: mergedSecondarys,
  }
}

function endpointSuggestionPrompt() {
  return [
    "You are a senior clinical strategist and endpoint specialist drafting a study synopsis.",
    "Use the study objective, development stage, evidence use intent, disease, intervention, strategic intent, study type, and optional requestNote to propose endpoint packages.",
    "If protocolGuardrailNotes is provided, follow it. Default to a lean, decision-critical endpoint set and avoid exploratory endpoints unless individually justified.",
    "Treat PRO/COA, PK/PD, biomarkers, biospecimens, subgroup analyses, special imaging, ECG, extra labs, wearables, and remote assessments as special assessments. Include them only when each one materially supports the objective, primary/key secondary endpoint, safety, dose, population definition, feasibility, or declared decision use.",
    "If a special assessment is included, state its rationale briefly in the option rationale or alignment assessment; otherwise omit it.",
    "Return exactly 3 differentiated option packages: one balanced, one pragmatic or lower-burden, and one assertive or request-shaped alternative.",
    "Each option must include label, positioning, one primary endpoint, focused secondary and exploratory endpoint lists, a short rationale, and an alignment assessment.",
    "Default to a lean endpoint package. In most cases, return 1 primary endpoint, 1 to 2 key secondary endpoints, and no more than 1 exploratory endpoint only when it is clearly justified.",
    "Avoid endpoint laundry lists, omnibus data capture, and convenience endpoints that do not materially help answer the research question or support the intended evidence use.",
    "Make every endpoint earn its place. If a supporting endpoint does not materially change interpretation, omit it.",
    "If requestNote conflicts with the current objective or strategic direction, do not comply blindly. Mark the option as partially_aligned or conflicts, explain why, and propose safer alternatives.",
    "For label or HTA-oriented use intents, prefer stronger claim-relevant and comparative endpoint framing. For guideline or practice intent, preserve clinically meaningful and patient-relevant interpretability.",
    "Ensure at least one option remains aligned to the current study context when feasible.",
    "Keep endpoints scientifically credible, decision-oriented, and suitable for direct editing in a study synopsis.",
  ].join("\n")
}

function uniqueNonEmptyItems(values: string[]) {
  const seen = new Set<string>()

  return values.filter((value) => {
    const normalized = value.trim().toLowerCase()

    if (!normalized || seen.has(normalized)) {
      return false
    }

    seen.add(normalized)
    return true
  })
}

function scoreEndpointCandidate(
  endpoint: string,
  objective: string,
  strategicObjective: string,
  evidenceIntent: string,
) {
  const text = endpoint.toLowerCase()
  let score = 0

  if (/overall survival|mortality/.test(objective) && /overall survival|mortality/.test(text)) score += 7
  if (/progression|disease[- ]?free|event[- ]?free|relapse/.test(objective) && /progression|disease[- ]?free|event[- ]?free|relapse/.test(text))
    score += 7
  if (/response|remission|control rate|objective response/.test(objective) && /response|remission|control rate/.test(text)) score += 7
  if (/quality of life|symptom|patient-reported|questionnaire|kccq|pruritus/.test(objective) && /quality of life|patient-reported|symptom|pro|kccq|pruritus/.test(text))
    score += 7

  if (/hta|market access|guideline|practice|inform clinical practice/.test(`${strategicObjective} ${evidenceIntent}`)) {
    if (/quality of life|patient-reported|symptom|resource|utilization/.test(text)) score += 4
    if (/durability|overall survival|progression/.test(text)) score += 2
  }

  if (/dose modification|dose optimization|safety/.test(strategicObjective) && /safety|tolerability|dose|exposure/.test(text)) score += 4

  if (/biomarker|molecular|subgroup/.test(text)) score -= 2
  if (/experience|satisfaction/.test(text)) score -= 1

  return score
}

function focusEndpointOptionPackage(
  option: z.infer<typeof endpointSuggestionOptionSchema>,
  study: z.infer<typeof studySchema>,
) {
  const objective = `${study.primaryObjective || ""} ${study.secondaryObjectives || ""}`.toLowerCase()
  const strategicObjective = `${study.primaryStrategicObjective || ""} ${study.customStrategicObjective || ""}`.toLowerCase()
  const evidenceIntent = `${study.primaryEvidenceUseIntent || ""} ${(study.secondaryEvidenceUseIntents || []).join(" ")}`.toLowerCase()
  const primaryEndpoint = option.primaryEndpoint.trim()
  const rank = (values: string[], limit: number) =>
    uniqueNonEmptyItems(values)
      .filter((value) => value.trim().toLowerCase() !== primaryEndpoint.toLowerCase())
      .sort((left, right) => {
        const scoreDelta =
          scoreEndpointCandidate(right, objective, strategicObjective, evidenceIntent) -
          scoreEndpointCandidate(left, objective, strategicObjective, evidenceIntent)

        if (scoreDelta !== 0) {
          return scoreDelta
        }

        return left.localeCompare(right)
      })
      .slice(0, limit)

  const focusedSecondaryEndpoints = rank(option.secondaryEndpoints, 2)
  const exploratoryLimit =
    /biomarker|subgroup|dose|exposure|mechanistic/.test(
      `${option.rationale} ${option.positioning} ${study.therapeuticArea} ${study.topInterventionClass}`.toLowerCase(),
    )
      ? 1
      : 0

  return {
    ...option,
    secondaryEndpoints: focusedSecondaryEndpoints,
    exploratoryEndpoints: rank(option.exploratoryEndpoints, exploratoryLimit),
  }
}

function populationSuggestionPrompt() {
  return [
    "You are a clinical development physician and protocol writer drafting a target population statement.",
    "Use the disease, intervention, development stage, evidence use intent, study objective, endpoint package, and line of therapy or setting to draft synopsis-ready population wording and eligibility highlights.",
    "If protocolGuardrailNotes is provided, keep eligibility inclusive, verifiable, and limited to safety, interpretability, and feasibility-critical criteria.",
    "Do not add biomarker, biospecimen, PK/PD, imaging, or PRO eligibility requirements unless needed for population definition, endpoint interpretation, safety, dose, or feasibility.",
    "Return one concise population paragraph, one concise block of eligibility highlights, and a brief rationale.",
    "Tighten or broaden the population in a way that fits the declared evidence destination.",
    "Do not invent highly specific criteria unless the input supports them.",
  ].join("\n")
}

function studyDocumentImportPrompt() {
  return [
    "You are a senior clinical strategist extracting structured study-design information from an uploaded study description.",
    "Extract only what is reasonably supported by the source. Leave fields blank if the source does not justify them.",
    "Return every schema field. Use an empty string for unavailable text fields and [] for unavailable list fields.",
    "Use the provided controlled lists when possible for category, subcategory, development stage, strategic objective, evidence use intent, and therapeutic area.",
    "If a disease or endpoint does not clearly match a controlled option, return the plain-text value instead of forcing a weak match.",
    "Keep outputs short, direct, and ready to prefill a study-design form.",
    "Also return a concise summary, unresolved items that still need user confirmation, and any material assumptions the extraction had to make.",
  ].join("\n")
}

function impactAssessmentPrompt() {
  return [
    "You are a senior clinical development strategist assessing the likely evidence impact of an early study concept.",
    "Use only the current Tab 1 style inputs: development stage, strategic objective, evidence use intent, disease, intervention, comparator, study type, objectives, endpoints, timing, geography, and sample size planning input.",
    "This is not a prediction. It is an early design-stage impact view.",
    "Return exactly 5 domains in this order: guideline, label, publication, practice, hta.",
    "For each domain, provide id, label, score from 0 to 100, impact as low medium or high, and one concise rationale.",
    "Be conservative. Do not overstate label or guideline potential if comparator strength, endpoint relevance, or design strength is weak.",
    "If protocolGuardrailNotes is provided, use it to identify avoidable complexity, excessive endpoints, missing duration, or data-collection bloat as blockers.",
    "Use corporate clinical-development language: direct, concise, and decision-oriented.",
    "Also return a short executive summary, a short list of current blockers, and a short list of strengthenActions.",
  ].join("\n")
}

function studySchemaPrompt() {
  return [
    "You are a senior clinical strategist designing a study schema diagram for a study synopsis workspace.",
    "Return structured diagram data, not SVG, not prose, and not layout instructions tied to pixels.",
    "The schema must fit the study category and subtype. Handle classic interventional studies, complex multi-cohort or adaptive interventional designs, observational studies, evidence synthesis, non-clinical work, and RWE secondary database research.",
    "Use designPattern as the governing visual pattern when provided. Supported patterns include parallel_group, single_arm, cohort_rwe, platform_master_protocol, adaptive, crossover, substudy_enabled, evidence_synthesis, and non_clinical.",
    "For platform_master_protocol, show master protocol entry, shared infrastructure/control if relevant, active arms/cohorts, arm entry/exit or graduation logic, and integrated readout. Do not draw every arm if it would crowd the slide.",
    "For adaptive, show the interim adaptation checkpoint and the adaptation decision type at high level, such as futility, enrichment, dose/arm selection, or sample-size re-estimation.",
    "For crossover, show sequence assignment, treatment period 1, washout or transition, treatment period 2, and within-participant readout at a high level.",
    "For substudy_enabled, separate the main study flow from optional substudy modules such as biomarker, PK/PD, imaging, PRO, or regional substudy only when they are decision-critical.",
    "The diagram must feel like a single-slide executive schema, not a full process map.",
    "If protocolGuardrailNotes is provided, keep the schema lean and avoid showing protocol-template detail, SoA detail, or excessive assessment detail.",
    "Use lanes to group related parts of the design. Use nodes to represent only the major stages, cohorts, arms, assessments, decision points, analyses, and outputs that matter at synopsis level.",
    "Summarize repeated assessments into one high-level node such as Key assessments or Outcome capture. Summarize multiple analyses or interims into one high-level readout node unless the requested detail level explicitly justifies more.",
    "Use edges to show the main study flow and logical dependencies. Use dashed edges only for optional, supportive, or inferential relationships.",
    "Prefer one main path. Avoid fan-out unless the design truly depends on distinct arms or cohorts.",
    "Keep labels concise and decision-oriented. Use subtitles only when they add essential specificity.",
    "Include notes highlighting what the viewer should understand from the diagram.",
    "The app renders the schema in a J&J-style palette: red emphasis, white cards, soft red panels, neutral gray text. Keep labels concise enough for that executive-slide visual style.",
    "If detailLevel is simple, return at most 6 nodes, at most 4 lanes, and at most 6 edges.",
    "If detailLevel is standard, return at most 8 nodes, at most 4 lanes, and at most 8 edges.",
    "If detailLevel is detailed, return at most 10 nodes, at most 5 lanes, and at most 12 edges.",
    "The output must still fit on one page or one slide without looking crowded.",
    "Respect the requested orientation and detail level.",
  ].join("\n")
}

function literaturePrompt() {
  return [
    "You are an evidence synthesis and medical writing expert preparing a synopsis literature plan.",
    "Use the study and PICO data to define a pragmatic background search strategy that supports the synopsis rationale section.",
    "The literature framing should reflect the declared evidence destination and development stage, not just the disease area.",
    "If protocolGuardrailNotes is provided, keep the literature plan focused on evidence gaps that justify the study decision, not broad background collection.",
    "Prefer multiline plain text for lists. Keep search strings usable and specific.",
    "The prompt field should be a reusable GenAI prompt for deeper literature synthesis.",
  ].join("\n")
}

function draftSectionsPrompt() {
  return [
    "You are a clinical protocol writer drafting section-level synopsis text.",
    "For each included section, preserve the provided id and title, follow the section prompt, and produce concise but useful draft prose.",
    "Use the study, PICO, statistical, literature, and schedule context together, including development stage and evidence use intent. Do not invent operational facts beyond reasonable drafting assumptions.",
    "If protocolGuardrailNotes is provided, keep section drafts proportionate to that profile and avoid expanding objectives, endpoints, eligibility, or data collection beyond what was selected.",
    "Return one body per section.",
  ].join("\n")
}

function finalSynopsisPrompt() {
  return [
    "You are a senior medical writer generating the final draft of a study synopsis.",
    "Use the provided study, PICO, statistical, literature, schedule, and section configuration data to write polished section bodies.",
    "Keep the final synopsis coherent with the declared development stage and evidence use intent.",
    "If protocolGuardrailNotes is provided, preserve its discipline in the final synopsis: focused objectives, lean endpoints, explicit duration, and streamlined data collection.",
    "Preserve the provided id and title for each included section.",
    "Write with a professional synopsis tone suitable for cross-functional review. Avoid bullet-heavy output unless the section clearly needs it.",
  ].join("\n")
}

function schedulePrompt() {
  return [
    "You are a clinical operations strategist and protocol writer generating a Schedule of Activities (SoA) table.",
    "Represent the schedule as structured data, not prose and not visual merge instructions.",
    "Columns must preserve a three-level hierarchy: study phase, period within phase, and visit within period.",
    "Rows must preserve grouped sections with child activity rows.",
    "If the user-provided schedulePrompt contains an SoA structure mode, follow it. Support one common SoA, common SoA with conditional rows, separate arm/cohort logic, or separate dosing rows plus common assessment rows.",
    "For studies with multiple drugs, arms, cohorts, regions, substudies, or dosing schedules, do not hide differences in ambiguous prose. Use concise conditional row notes or separate treatment-administration groupings so the reader can see which activities apply to which arm or cohort.",
    'Use "X" for required visits, blank for not required, and short qualifiers such as "X (as clinically indicated)" only when needed.',
    "For each row, return cells as an array of objects with { columnId, value }. Use the column ids defined in the output columns.",
    "Tailor the complexity to the study context, declared evidence destination, and any iteration instruction. Do not flatten the hierarchy.",
    "If protocolGuardrailNotes is provided, use it to keep the SoA limited to assessments that directly support objectives, endpoints, estimands, safety, or feasibility.",
    "PRO/COA, PK/PD, biomarkers, biospecimens, special imaging, ECG, extra labs, wearables, and remote assessments require explicit objective, endpoint, safety, dose, population-definition, feasibility, or decision-use justification. Do not add them as routine extras.",
    "Return a Word-friendly table structure suitable for rendering in a browser and export to a document.",
  ].join("\n")
}

function scheduleInsightsPrompt() {
  return [
    "You are a senior clinical operations strategist reviewing a Schedule of Activities for protocol feasibility and data-value trade-offs.",
    "Assess overall study complexity, identify the main complexity drivers, and score visit, assessment, and operational burden from 0 to 100.",
    "Then identify lower-risk opportunities to reduce or consolidate visits or assessments without materially weakening the study objective, primary endpoint support, or essential safety capture.",
    "Use the declared evidence destination to judge how much rigor and visit intensity is justified.",
    "If protocolGuardrailNotes is provided, use it to judge whether the SoA is proportionate. Practice-informing PED guardrails favor one time base, minimized visits, and only assessments that directly support objectives, endpoints, estimands, safety, or feasibility.",
    "Specifically flag PRO/COA, PK/PD, biomarkers, biospecimens, special imaging, ECG, extra labs, wearables, and remote assessments when they do not clearly support the objective, endpoint package, safety, dose, population definition, feasibility, or decision use.",
    "Be conservative: protected elements must remain protected, and every recommendation must explain how data quality is preserved.",
    "Write with corporate clinical-development language: direct, concise, and decision-oriented.",
  ].join("\n")
}

function scheduleLayoutPrompt() {
  return [
    "You are a clinical operations and protocol-design reviewer recommending how to display an existing Schedule of Activities table.",
    "Do not rewrite the SoA and do not add or remove visits, rows, activities, assessments, or cells.",
    "Recommend only the display layout: single table, split into two tables, or auto.",
    "Prefer a single table when the visit grid is still readable.",
    "Recommend split when horizontal scanning is likely to impair review, especially when there is a distinct follow-up phase or many visit columns.",
    "If splitting, identify whether the best split is core schedule vs follow-up, or a balanced earlier/later visit split.",
    "Explain the split point in practical language. Mention that this is display-only and does not create separate protocol SoAs.",
    "Be concise and decision-oriented.",
  ].join("\n")
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json())

    if (body.action === "import_study_document") {
      const lowerName = body.fileName.toLowerCase()
      const isPdf = body.mimeType === "application/pdf" || lowerName.endsWith(".pdf")
      const isDocx =
        body.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || lowerName.endsWith(".docx")
      const isPptx =
        body.mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" || lowerName.endsWith(".pptx")

      if (!isPdf && !isDocx && !isPptx) {
        throw new Error("Unsupported upload type. Use PDF, DOCX, or PPTX.")
      }

      const referenceContext = [
        `Allowed categories: ${body.referenceData.categories.join(", ") || "None provided"}`,
        `Allowed subcategories by category: ${JSON.stringify(body.referenceData.subcategories)}`,
        `Allowed development stages: ${body.referenceData.developmentStages.join(", ") || "None provided"}`,
        `Allowed strategic objectives: ${body.referenceData.strategicObjectives.join(", ") || "None provided"}`,
        `Allowed evidence use intents: ${body.referenceData.evidenceUseIntents.join(", ") || "None provided"}`,
        `Therapeutic areas and diseases: ${JSON.stringify(body.referenceData.therapeuticAreas)}`,
      ].join("\n")

      let userInput: Array<{
        role: "user"
        content: string | Array<{ type: string; text?: string; filename?: string; file_data?: string }>
      }>

      if (isPdf) {
        userInput = [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Source file: ${body.fileName}\nExtract structured study information from the attached study description.\n${referenceContext}`,
              },
              {
                type: "input_file",
                filename: body.fileName,
                file_data: body.fileData,
              },
            ],
          },
        ]
      } else {
        const { buffer } = decodeDataUrl(body.fileData)
        const extractedText = isDocx ? await extractTextFromDocx(buffer) : await extractTextFromPptx(buffer)

        if (!extractedText.trim()) {
          throw new Error("The uploaded file did not contain extractable text.")
        }

        userInput = [
          {
            role: "user",
            content: `Source file: ${body.fileName}\n${referenceContext}\n\nExtracted document text:\n${extractedText.slice(0, 120000)}`,
          },
        ]
      }

      const result = await parseStructuredInput({
        schema: studyDocumentImportResultSchema,
        schemaName: "study_document_import",
        systemPrompt: studyDocumentImportPrompt(),
        userInput,
        effort: "low",
        maxOutputTokens: 9000,
      })

      return Response.json(result)
    }

    if (body.action === "suggest_objectives") {
      const result = await parseStructuredOutput({
        schema: objectiveSuggestionResultSchema,
        schemaName: "suggested_study_objectives",
        systemPrompt: objectiveSuggestionPrompt(),
        payload: body,
        effort: "low",
        maxOutputTokens: 9000,
      })

      return Response.json({
        ...result,
        options: result.options.map((option) => focusObjectiveOptionPackage(option, body.study, body.requestNote || "")),
      })
    }

    if (body.action === "suggest_endpoints") {
      const result = await parseStructuredOutput({
        schema: endpointSuggestionResultSchema,
        schemaName: "suggested_study_endpoints",
        systemPrompt: endpointSuggestionPrompt(),
        payload: body,
        effort: "low",
        maxOutputTokens: 8000,
      })

      return Response.json({
        ...result,
        options: result.options.map((option) => focusEndpointOptionPackage(option, body.study)),
      })
    }

    if (body.action === "suggest_population") {
      const result = await parseStructuredOutput({
        schema: populationSuggestionResultSchema,
        schemaName: "suggested_study_population",
        systemPrompt: populationSuggestionPrompt(),
        payload: body,
        effort: "low",
        maxOutputTokens: 5000,
      })

      return Response.json(result)
    }

    if (body.action === "assess_impact") {
      const result = await parseStructuredOutput({
        schema: impactAssessmentResultSchema,
        schemaName: "study_evidence_impact_assessment",
        systemPrompt: impactAssessmentPrompt(),
        payload: body,
        effort: "low",
        maxOutputTokens: 7000,
      })

      return Response.json({
        ...result,
        generatedAt: new Date().toISOString(),
        provenance: "ai_generated",
      })
    }

    if (body.action === "generate_study_schema") {
      const result = await parseStructuredOutput({
        schema: studyVisualizationResultSchema,
        schemaName: "study_visual_schema",
        systemPrompt: studySchemaPrompt(),
        payload: body,
        effort: "low",
        maxOutputTokens: 9000,
      })

      return Response.json(result)
    }

    if (body.action === "extract_pico_stats") {
      const result = await parseStructuredOutput({
        schema: picoStatsResultSchema,
        schemaName: "study_pico_and_stats",
        systemPrompt: extractPicoStatsPrompt(),
        payload: body,
        effort: "low",
        maxOutputTokens: 7000,
      })

      return Response.json(result)
    }

    if (body.action === "build_literature") {
      const result = await parseStructuredOutput({
        schema: literatureResultSchema,
        schemaName: "study_literature_plan",
        systemPrompt: literaturePrompt(),
        payload: body,
        effort: "low",
        maxOutputTokens: 7000,
      })

      return Response.json(result)
    }

    if (body.action === "generate_schedule") {
      const result = await parseStructuredOutput({
        schema: scheduleResultSchema,
        schemaName: "study_schedule_of_activities",
        systemPrompt: schedulePrompt(),
        payload: body,
        effort: "medium",
        maxOutputTokens: 12000,
      })

      return Response.json({
        purpose: result.purpose,
        prompt: result.prompt,
        columns: result.columns,
        rows: result.rows.map((row) => ({
          id: row.id,
          group: row.group,
          activity: row.activity,
          notes: row.notes,
          cells: Object.fromEntries(row.cells.map((cell) => [cell.columnId, cell.value])),
        })),
      })
    }

    if (body.action === "analyze_schedule") {
      const result = await parseStructuredOutput({
        schema: scheduleInsightsResultSchema,
        schemaName: "schedule_complexity_and_tradeoff_analysis",
        systemPrompt: scheduleInsightsPrompt(),
        payload: body,
        effort: "medium",
        maxOutputTokens: 9000,
      })

      return Response.json(result)
    }

    if (body.action === "recommend_schedule_layout") {
      const result = await parseStructuredOutput({
        schema: scheduleLayoutRecommendationResultSchema,
        schemaName: "schedule_layout_recommendation",
        systemPrompt: scheduleLayoutPrompt(),
        payload: body,
        effort: "low",
        maxOutputTokens: 3000,
      })

      return Response.json(result)
    }

    if (body.action === "draft_sections") {
      const result = await parseStructuredOutput({
        schema: draftSectionsResultSchema,
        schemaName: "synopsis_section_drafts",
        systemPrompt: draftSectionsPrompt(),
        payload: {
          ...body,
          sections: body.sections.filter((section) => section.included),
        },
        effort: "medium",
        maxOutputTokens: 12000,
      })

      return Response.json(result)
    }

    const result = await parseStructuredOutput({
      schema: finalSynopsisResultSchema,
      schemaName: "final_study_synopsis",
      systemPrompt: finalSynopsisPrompt(),
      payload: {
        ...body,
        sections: body.sections.filter((section) => section.included),
      },
      effort: "high",
      maxOutputTokens: 18000,
    })

    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected OpenAI integration error."

    return Response.json(
      {
        error: message,
      },
      { status: 500 },
    )
  }
}
