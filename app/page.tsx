"use client"

import { Fragment, type ReactNode, useEffect, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  FileDown,
  FlaskConical,
  GitBranch,
  Info,
  LibraryBig,
  Microscope,
  Pencil,
  Plus,
  Scale,
  Sparkles,
  Target,
  Trash2,
  Upload,
  X,
} from "lucide-react"

const TABS = [
  { id: "study", label: "Study Design", icon: Microscope },
  { id: "schema", label: "Study Schema", icon: GitBranch },
  { id: "pico", label: "PICO & Stats", icon: Target },
  { id: "literature", label: "Literature", icon: LibraryBig },
  { id: "schedule", label: "Schedule", icon: CalendarDays },
  { id: "sections", label: "Generate Tab", icon: Sparkles },
  { id: "final", label: "Study Synopsis", icon: FlaskConical },
] as const

type TabId = (typeof TABS)[number]["id"]
type AiAssistantModalKind = "objectives" | "population" | "endpoints"
type PopulationSuggestionSource = "population" | "eligibility"

const TAB_HELP_CONTENT: Record<TabId, { title: string; items: string[] }> = {
  study: {
    title: "Study design guidance",
    items: [
      "This tab is the source of truth for every downstream generation step.",
      "State the decision the synopsis should support and make the comparator explicit, even if it is historical or external.",
      "Enter objectives and outcomes in synopsis language so PICO extraction and drafting stay precise.",
    ],
  },
  schema: {
    title: "Study schema guidance",
    items: [
      "Use this optional tab to turn the current study concept into a visual schema before you move deeper into drafting.",
      "Generate first, then refine labels, colors, and layout only where the diagram needs to be clearer for reviewers.",
      "If Tab 1 changes later, refresh the schema so the visual study flow stays aligned to the actual design.",
    ],
  },
  pico: {
    title: "PICO and statistics guidance",
    items: [
      "Use this tab to refine the structured population, intervention, comparator, outcomes, and timeframe before drafting sections.",
      "Treat the statistical assumptions as a starting point for biostatistics review, not final protocol language.",
      "Edit the prompts only when you need to steer the model more tightly.",
    ],
  },
  literature: {
    title: "Literature planning guidance",
    items: [
      "Keep the research question decision-oriented so the background section supports the study rationale rather than a broad review.",
      "Use databases, inclusion logic, and search strings that can be defended later during review.",
      "Capture the themes that should appear in the synopsis background, not every possible evidence angle.",
    ],
  },
  schedule: {
    title: "Schedule guidance",
    items: [
      "Keep one source-of-truth SoA and use split view only when the visit matrix becomes hard to scan.",
      "Use the change request field to tell AI what should be different before regenerating the schedule.",
      "Run complexity and trade-off analysis after the table is close to final so the recommendations reflect the real schedule.",
    ],
  },
  sections: {
    title: "Section configuration guidance",
    items: [
      "The order in this tab is the order used in the final synopsis.",
      "Keep prompts concise so drafts remain controlled and easier to review.",
      "Remove sections here only if they should not appear in the assembled document.",
    ],
  },
  final: {
    title: "Final assembly guidance",
    items: [
      "Confirm wording with clinical, regulatory, and biostatistics stakeholders before using the synopsis operationally.",
      "For interventional studies, verify the schedule against site feasibility and visit burden before export.",
      "Replace any placeholder assumptions or generic AI language before the document is treated as final.",
    ],
  },
}

const STUDY_CATEGORIES = {
  interventional: {
    label: "Interventional",
    subcategories: [
      "Traditional RCT",
      "Pragmatic Study",
      "Adaptive Trial",
      "Basket Trial",
      "Umbrella Trial",
      "Non-Randomized Study",
    ],
  },
  "non-interventional": {
    label: "Non-Interventional",
    subcategories: ["Primary Data Collection", "Secondary Data Analysis", "Primary and Secondary"],
  },
  "non-clinical": {
    label: "Non-Clinical",
    subcategories: ["In Vitro", "In Vivo", "Ex Vivo", "In Silico"],
  },
  "evidence-synthesis": {
    label: "Evidence Synthesis",
    subcategories: [
      "Systematic Review",
      "Meta-Analysis",
      "Network Meta-Analysis",
      "MAIC",
      "IPD Analysis",
      "Post-hoc Analysis",
    ],
  },
} as const

const STRATEGIC_OBJECTIVES = [
  "Label expansion",
  "Label refinement or update",
  "Market access / HTA support",
  "Defend market share",
  "Inform clinical practice",
  "Accelerate uptake",
  "Explore dose modification",
  "Explore new population",
  "Generate real-world evidence",
  "Satisfy regulatory commitment",
  "Safety / risk management",
  "Support lifecycle management",
  "Support publication strategy",
] as const

const DEVELOPMENT_STAGES = [
  "Phase 1",
  "Phase 2",
  "Phase 3",
  "Phase 4",
  "Post-marketing / lifecycle",
  "Not phase-based",
] as const

const EVIDENCE_USE_INTENTS = [
  "Label support / change",
  "Guideline / practice informing",
  "HTA / market access",
  "Scientific publication",
  "Regulatory commitment",
  "Safety / risk management",
] as const

const PRIMARY_STUDY_AIMS = [
  {
    label: "Support label change or expansion",
    strategic: "Label expansion",
    evidence: "Label support / change",
  },
  {
    label: "Support HTA or market access decisions",
    strategic: "Market access / HTA support",
    evidence: "HTA / market access",
  },
  {
    label: "Inform guidelines or clinical practice",
    strategic: "Inform clinical practice",
    evidence: "Guideline / practice informing",
  },
  {
    label: "Support a scientific publication",
    strategic: "Support publication strategy",
    evidence: "Scientific publication",
  },
  {
    label: "Meet a regulatory commitment",
    strategic: "Satisfy regulatory commitment",
    evidence: "Regulatory commitment",
  },
  {
    label: "Strengthen safety or risk-management evidence",
    strategic: "Safety / risk management",
    evidence: "Safety / risk management",
  },
  {
    label: "Explore a new population or treatment strategy",
    strategic: "Explore new population",
    evidence: "Scientific publication",
  },
] as const

const THERAPEUTIC_LIBRARY = {
  Oncology: {
    diseases: {
      "Metastatic NSCLC": [
        "Progression-free survival",
        "Overall survival",
        "Objective response rate",
        "Duration of response",
        "Safety and tolerability",
        "Quality of life",
      ],
      "Early breast cancer": [
        "Pathologic complete response",
        "Event-free survival",
        "Disease-free survival",
        "Overall survival",
        "Safety and tolerability",
        "Patient-reported outcomes",
      ],
      "Multiple myeloma": [
        "Minimal residual disease negativity",
        "Progression-free survival",
        "Overall survival",
        "Overall response rate",
        "Duration of response",
        "Safety and tolerability",
      ],
    },
  },
  Immunology: {
    diseases: {
      "Ulcerative colitis": [
        "Clinical remission",
        "Endoscopic improvement",
        "Steroid-free remission",
        "Histologic remission",
        "Quality of life",
        "Safety and tolerability",
      ],
      "Crohn's disease": [
        "Clinical response",
        "Endoscopic response",
        "Clinical remission",
        "Biomarker normalization",
        "Quality of life",
        "Safety and tolerability",
      ],
      "Atopic dermatitis": [
        "EASI-75",
        "IGA 0/1",
        "Pruritus reduction",
        "Quality of life",
        "Flare reduction",
        "Safety and tolerability",
      ],
    },
  },
  Cardiovascular: {
    diseases: {
      HFrEF: [
        "Cardiovascular death or heart failure hospitalization",
        "KCCQ change from baseline",
        "All-cause mortality",
        "NT-proBNP change",
        "Functional capacity",
        "Safety and tolerability",
      ],
      "Atrial fibrillation": [
        "Time to first recurrence",
        "AF burden",
        "Stroke or systemic embolism",
        "Major bleeding",
        "Quality of life",
        "Safety and tolerability",
      ],
      Hypertension: [
        "Change in systolic blood pressure",
        "Change in diastolic blood pressure",
        "Blood pressure control rate",
        "Major adverse cardiovascular events",
        "Adherence",
        "Safety and tolerability",
      ],
    },
  },
  Neurology: {
    diseases: {
      "Alzheimer's disease": [
        "Cognition scale change",
        "Functional decline",
        "Global clinical status",
        "Biomarker change",
        "Caregiver burden",
        "Safety and tolerability",
      ],
      "Multiple sclerosis": [
        "Annualized relapse rate",
        "Confirmed disability progression",
        "MRI lesion activity",
        "No evidence of disease activity",
        "Quality of life",
        "Safety and tolerability",
      ],
    },
  },
  Rare: {
    diseases: {
      "Amyloidosis": [
        "Organ response",
        "Biomarker response",
        "Overall survival",
        "Hospitalization reduction",
        "Functional status",
        "Safety and tolerability",
      ],
      "Hemophilia A": [
        "Annualized bleeding rate",
        "Factor usage reduction",
        "Joint health",
        "Quality of life",
        "Inhibitor development",
        "Safety and tolerability",
      ],
    },
  },
} as const

type StudyForm = {
  studyTitle: string
  sponsor: string
  category: string
  subcategory: string
  developmentStage: string
  primaryStudyAim: string
  primaryEvidenceUseIntent: string
  secondaryEvidenceUseIntents: string[]
  primaryStrategicObjective: string
  secondaryStrategicObjectives: string[]
  customStrategicObjective: string
  therapeuticArea: string
  disease: string
  customDisease: string
  topIntervention: string
  topInterventionClass: string
  topComparator: string
  topLineOfTherapy: string
  selectedEndpoints: string[]
  customEndpoints: string
  indication: string
  primaryObjective: string
  secondaryObjectives: string
  designOverview: string
  population: string
  intervention: string
  comparator: string
  outcomes: string
  timeline: string
  geography: string
  sampleSize: string
  eligibility: string
  operationalNotes: string
}

type PicoForm = {
  population: string
  intervention: string
  comparator: string
  outcomes: string
  timeframe: string
  prompt: string
}

type StatsForm = {
  estimand: string
  endpointType: string
  hypothesis: string
  alpha: string
  power: string
  effectSize: string
  variability: string
  attrition: string
  analysisModel: string
  missingData: string
  rationale: string
  prompt: string
}

type LiteratureForm = {
  researchQuestion: string
  databases: string
  evidenceWindow: string
  inclusionCriteria: string
  exclusionCriteria: string
  keywords: string
  pubmedQuery: string
  embaseQuery: string
  greyLiteraturePlan: string
  backgroundThemes: string
  prompt: string
}

type ScheduleColumn = {
  id: string
  phase: string
  period: string
  visit: string
  footnote: string
}

type ScheduleRow = {
  id: string
  group: string
  activity: string
  cells: Record<string, string>
  notes: string
}

type ScheduleProvenance = "empty" | "ai_generated" | "local_draft" | "manual" | "hybrid"
type ScheduleTableLayout = "auto" | "single" | "split"

type ScheduleForm = {
  purpose: string
  prompt: string
  iterationPrompt: string
  tableLayout: ScheduleTableLayout
  columns: ScheduleColumn[]
  rows: ScheduleRow[]
  generatedAt: string
  provenance: ScheduleProvenance
  manualEdited: boolean
}

type AnalysisImpact = "low" | "medium" | "high"

type ComplexityLevel = "Low" | "Moderate" | "High" | "Very High"

type ScheduleComplexityDriver = {
  label: string
  impact: AnalysisImpact
  rationale: string
}

type ScheduleComplexityAssessment = {
  overallLevel: ComplexityLevel
  overallScore: number
  executiveSummary: string
  visitBurdenScore: number
  assessmentBurdenScore: number
  operationalBurdenScore: number
  drivers: ScheduleComplexityDriver[]
  mitigations: string[]
}

type ScheduleTradeoffRecommendation = {
  id: string
  target: string
  category: string
  recommendation: string
  expectedBenefit: string
  dataQualityRisk: AnalysisImpact
  endpointProtection: string
  rationale: string
}

type ScheduleTradeoffAssessment = {
  executiveSummary: string
  protectedElements: string[]
  recommendations: ScheduleTradeoffRecommendation[]
  safeguards: string[]
}

type ScheduleInsightsProvenance = "empty" | "ai_generated" | "local_draft"

type ScheduleInsights = {
  focus: string
  generatedAt: string
  provenance: ScheduleInsightsProvenance
  complexity: ScheduleComplexityAssessment
  tradeoff: ScheduleTradeoffAssessment
}

type StudySchemaOrientation = "horizontal" | "vertical"
type StudySchemaDetailLevel = "simple" | "standard" | "detailed"
type StudySchemaNodeKind =
  | "start"
  | "screening"
  | "decision"
  | "arm"
  | "cohort"
  | "database"
  | "assessment"
  | "analysis"
  | "output"
  | "milestone"

type StudySchemaLane = {
  id: string
  label: string
  description: string
}

type StudySchemaNode = {
  id: string
  laneId: string
  label: string
  subtitle: string
  kind: StudySchemaNodeKind
  column: number
  row: number
}

type StudySchemaEdge = {
  id: string
  from: string
  to: string
  label: string
  style: "solid" | "dashed"
}

type StudySchemaTheme = {
  background: string
  laneFill: string
  nodeFill: string
  accent: string
  text: string
  edge: string
}

type StudySchemaProvenance = "empty" | "ai_generated" | "local_draft" | "manual" | "hybrid"

type StudySchemaForm = {
  title: string
  schemaType: string
  orientation: StudySchemaOrientation
  detailLevel: StudySchemaDetailLevel
  iterationPrompt: string
  lanes: StudySchemaLane[]
  nodes: StudySchemaNode[]
  edges: StudySchemaEdge[]
  notes: string[]
  generatedAt: string
  provenance: StudySchemaProvenance
  manualEdited: boolean
  sourceFingerprint: string
  theme: StudySchemaTheme
}

type WorkspaceSnapshot = {
  activeTab: TabId
  study: StudyForm
  studySchema: StudySchemaForm
  pico: PicoForm
  stats: StatsForm
  sampleSizeEstimate: SampleSizeEstimate
  studyDocumentImportReport: StudyDocumentImportReport
  impactAssessment: ImpactAssessment
  literature: LiteratureForm
  schedule: ScheduleForm
  scheduleInsights: ScheduleInsights
  sections: SynopsisSection[]
  finalSections: FinalSection[]
  reviews: ReviewState
  savedAt: string
}

type WorkspaceProjectMeta = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

type WorkspaceProjectStore = {
  activeProjectId: string
  projects: WorkspaceProjectMeta[]
  snapshots: Record<string, WorkspaceSnapshot>
}

type StudyTypeReviewNotice = {
  scope: "category" | "subcategory"
  title: string
  message: string
  fields: string[]
}

type SynopsisSection = {
  id: string
  title: string
  prompt: string
  body: string
  included: boolean
  provenance: SectionProvenance
  sourceTabs: string[]
  assumptionFlags: string[]
  lastGeneratedAt: string
  promptVersion: number
  manualEdited: boolean
}

type FinalSection = {
  id: string
  title: string
  body: string
}

type ReviewStatus = "pending" | "approved" | "needs_revision"

type StageReview = {
  status: ReviewStatus
  notes: string
  reviewedAt: string
}

type ReviewState = {
  study: StageReview
  pico: StageReview
  literature: StageReview
  schedule: StageReview
}

type SampleSizeScenario = {
  label: string
  total: number
  adjustedTotal: number
}

type SampleSizeSuggestion = {
  id: string
  key: keyof StatsForm
  label: string
  value: string
  rationale: string
}

type SampleSizeEstimate = {
  status: "idle" | "needs_inputs" | "ready" | "error"
  generatedAt: string
  methodKey: "continuous" | "binary" | "time_to_event" | "generic"
  methodLabel: string
  summary: string
  missing: string[]
  assumptions: string[]
  notes: string[]
  estimatedPerArm: number
  estimatedTotal: number
  adjustedTotal: number
  attritionRate: number
  plannedTotal: number | null
  plannedGap: number | null
  plannedStatus: "under" | "aligned" | "over" | "unknown"
  sensitivity: SampleSizeScenario[]
}

type StudyDocumentImportReport = {
  sourceName: string
  importedAt: string
  summary: string
  appliedFields: string[]
  replacedFields: string[]
  remainingFields: string[]
  unresolved: string[]
  assumptions: string[]
  conflictNotes: string[]
}

type ImpactAssessmentProvenance = "empty" | "ai_generated" | "local_draft"

type ImpactAssessmentDomain = {
  id: string
  label: string
  score: number
  impact: AnalysisImpact
  rationale: string
}

type ImpactAssessment = {
  generatedAt: string
  provenance: ImpactAssessmentProvenance
  executiveSummary: string
  domains: ImpactAssessmentDomain[]
  blockers: string[]
  strengthenActions: string[]
}

type SuggestionAlignmentStatus = "aligned" | "partially_aligned" | "conflicts"

type SuggestionAlignment = {
  status: SuggestionAlignmentStatus
  summary: string
  concerns: string[]
  recommendations: string[]
}

type ObjectiveSuggestionDraft = {
  label: string
  positioning: string
  primaryObjective: string
  secondaryObjectives: string[]
  designOverview: string
  alignment: SuggestionAlignment
}

type EndpointSuggestionDraft = {
  label: string
  positioning: string
  primaryEndpoint: string
  secondaryEndpoints: string[]
  exploratoryEndpoints: string[]
  rationale: string
  alignment: SuggestionAlignment
}

type PopulationSuggestionDraft = {
  population: string
  eligibility: string
  rationale: string
}

type ObjectiveSuggestionSelection = {
  primaryObjective: boolean
  secondaryObjectives: string[]
  designOverview: boolean
}

type EndpointSuggestionSelection = {
  primaryEndpoint: boolean
  secondaryEndpoints: string[]
  exploratoryEndpoints: string[]
}

type PopulationSuggestionSelection = {
  population: boolean
  eligibility: boolean
}

type StructuredEditorItem = {
  id: string
  text: string
  active: boolean
}

type ImportedStudyDraft = Partial<StudyForm> & {
  endpointCandidates?: string[]
}

type StudyDocumentImportResult = {
  summary: string
  unresolved: string[]
  assumptions: string[]
  study: ImportedStudyDraft
}

type SectionProvenance = "template" | "ai_generated" | "hybrid" | "manual"

const initialStudyForm: StudyForm = {
  studyTitle: "",
  sponsor: "",
  category: "interventional",
  subcategory: "Traditional RCT",
  developmentStage: "",
  primaryStudyAim: "",
  primaryEvidenceUseIntent: "",
  secondaryEvidenceUseIntents: [],
  primaryStrategicObjective: "",
  secondaryStrategicObjectives: [],
  customStrategicObjective: "",
  therapeuticArea: "",
  disease: "",
  customDisease: "",
  topIntervention: "",
  topInterventionClass: "",
  topComparator: "",
  topLineOfTherapy: "",
  selectedEndpoints: [],
  customEndpoints: "",
  indication: "",
  primaryObjective: "",
  secondaryObjectives: "",
  designOverview: "",
  population: "",
  intervention: "",
  comparator: "",
  outcomes: "",
  timeline: "",
  geography: "",
  sampleSize: "",
  eligibility: "",
  operationalNotes: "",
}

const initialPicoForm: PicoForm = {
  population: "",
  intervention: "",
  comparator: "",
  outcomes: "",
  timeframe: "",
  prompt: "",
}

const initialStatsForm: StatsForm = {
  estimand: "",
  endpointType: "",
  hypothesis: "",
  alpha: "",
  power: "",
  effectSize: "",
  variability: "",
  attrition: "",
  analysisModel: "",
  missingData: "",
  rationale: "",
  prompt: "",
}

const initialLiteratureForm: LiteratureForm = {
  researchQuestion: "",
  databases: "",
  evidenceWindow: "",
  inclusionCriteria: "",
  exclusionCriteria: "",
  keywords: "",
  pubmedQuery: "",
  embaseQuery: "",
  greyLiteraturePlan: "",
  backgroundThemes: "",
  prompt: "",
}

const DEFAULT_STUDY_SCHEMA_THEME: StudySchemaTheme = {
  background: "#F8FBFF",
  laneFill: "#E7F5FF",
  nodeFill: "#FFFFFF",
  accent: "#1864AB",
  text: "#1F2937",
  edge: "#5C7CFA",
}

const initialStudySchema: StudySchemaForm = {
  title: "Study schema",
  schemaType: "",
  orientation: "horizontal",
  detailLevel: "simple",
  iterationPrompt: "",
  lanes: [],
  nodes: [],
  edges: [],
  notes: [],
  generatedAt: "",
  provenance: "empty",
  manualEdited: false,
  sourceFingerprint: "",
  theme: DEFAULT_STUDY_SCHEMA_THEME,
}

const DEFAULT_SCHEDULE_PROMPT = [
  "Create a Schedule of Activities (SoA) table with a hierarchical structure.",
  "Treat the schedule as a three-level column hierarchy: Study Phase, Period within Phase, and Visit within Period.",
  "Use grouped activity sections rather than a flat row list.",
  'Use "X" for required activities, blank for not required, and brief qualifiers such as "X (as clinically indicated)" when useful.',
  "Tailor the complexity to the study need. Pragmatic or operationally light studies can use a simpler cadence; intensive or oncology studies can use a more detailed cadence.",
  "Return a Word-friendly table structure that preserves the hierarchy instead of flattening it.",
].join("\n")

const initialScheduleForm: ScheduleForm = {
  purpose: "",
  prompt: DEFAULT_SCHEDULE_PROMPT,
  iterationPrompt: "",
  tableLayout: "auto",
  columns: [],
  rows: [],
  generatedAt: "",
  provenance: "empty",
  manualEdited: false,
}

const initialScheduleInsights: ScheduleInsights = {
  focus: "",
  generatedAt: "",
  provenance: "empty",
  complexity: {
    overallLevel: "Moderate",
    overallScore: 0,
    executiveSummary: "",
    visitBurdenScore: 0,
    assessmentBurdenScore: 0,
    operationalBurdenScore: 0,
    drivers: [],
    mitigations: [],
  },
  tradeoff: {
    executiveSummary: "",
    protectedElements: [],
    recommendations: [],
    safeguards: [],
  },
}

const STORAGE_KEY = "study-synopsis-studio:v2"
const PROJECTS_STORAGE_KEY = "study-synopsis-studio:projects:v1"

const initialReviews: ReviewState = {
  study: { status: "pending", notes: "", reviewedAt: "" },
  pico: { status: "pending", notes: "", reviewedAt: "" },
  literature: { status: "pending", notes: "", reviewedAt: "" },
  schedule: { status: "pending", notes: "", reviewedAt: "" },
}

const initialSampleSizeEstimate: SampleSizeEstimate = {
  status: "idle",
  generatedAt: "",
  methodKey: "generic",
  methodLabel: "",
  summary: "",
  missing: [],
  assumptions: [],
  notes: [],
  estimatedPerArm: 0,
  estimatedTotal: 0,
  adjustedTotal: 0,
  attritionRate: 0,
  plannedTotal: null,
  plannedGap: null,
  plannedStatus: "unknown",
  sensitivity: [],
}

const initialStudyDocumentImportReport: StudyDocumentImportReport = {
  sourceName: "",
  importedAt: "",
  summary: "",
  appliedFields: [],
  replacedFields: [],
  remainingFields: [],
  unresolved: [],
  assumptions: [],
  conflictNotes: [],
}

const initialImpactAssessment: ImpactAssessment = {
  generatedAt: "",
  provenance: "empty",
  executiveSummary: "",
  domains: [],
  blockers: [],
  strengthenActions: [],
}

function normalizeProjectName(name: string, fallback = "New synopsis") {
  return name.trim() || fallback
}

function createProjectId() {
  return `synopsis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function buildEmptyWorkspaceSnapshot(): WorkspaceSnapshot {
  return {
    activeTab: "study",
    study: normalizeStudyForm(initialStudyForm),
    studySchema: normalizeStudySchema(initialStudySchema),
    pico: { ...initialPicoForm },
    stats: { ...initialStatsForm },
    sampleSizeEstimate: { ...initialSampleSizeEstimate },
    studyDocumentImportReport: normalizeStudyDocumentImportReport(initialStudyDocumentImportReport),
    impactAssessment: normalizeImpactAssessment(initialImpactAssessment),
    literature: { ...initialLiteratureForm },
    schedule: normalizeSchedule(initialScheduleForm),
    scheduleInsights: normalizeScheduleInsights(initialScheduleInsights),
    sections: buildDefaultSections().map((section) => normalizeSection(section)),
    finalSections: [],
    reviews: {
      study: { ...initialReviews.study },
      pico: { ...initialReviews.pico },
      literature: { ...initialReviews.literature },
      schedule: { ...initialReviews.schedule },
    },
    savedAt: "",
  }
}

function normalizeWorkspaceSnapshot(snapshot?: Partial<WorkspaceSnapshot>): WorkspaceSnapshot {
  const baseline = buildEmptyWorkspaceSnapshot()

  return {
    activeTab: TABS.some((tab) => tab.id === snapshot?.activeTab) ? (snapshot?.activeTab as TabId) : baseline.activeTab,
    study: normalizeStudyForm(snapshot?.study),
    studySchema: normalizeStudySchema(snapshot?.studySchema),
    pico: { ...baseline.pico, ...(snapshot?.pico || {}) },
    stats: { ...baseline.stats, ...(snapshot?.stats || {}) },
    sampleSizeEstimate: { ...baseline.sampleSizeEstimate, ...(snapshot?.sampleSizeEstimate || {}) },
    studyDocumentImportReport: normalizeStudyDocumentImportReport(snapshot?.studyDocumentImportReport),
    impactAssessment: normalizeImpactAssessment(snapshot?.impactAssessment),
    literature: { ...baseline.literature, ...(snapshot?.literature || {}) },
    schedule: normalizeSchedule(snapshot?.schedule),
    scheduleInsights: normalizeScheduleInsights(snapshot?.scheduleInsights),
    sections: snapshot?.sections?.length ? snapshot.sections.map((section) => normalizeSection(section)) : baseline.sections,
    finalSections: Array.isArray(snapshot?.finalSections) ? snapshot.finalSections : baseline.finalSections,
    reviews: {
      study: { ...initialReviews.study, ...(snapshot?.reviews?.study || {}) },
      pico: { ...initialReviews.pico, ...(snapshot?.reviews?.pico || {}) },
      literature: { ...initialReviews.literature, ...(snapshot?.reviews?.literature || {}) },
      schedule: { ...initialReviews.schedule, ...(snapshot?.reviews?.schedule || {}) },
    },
    savedAt: snapshot?.savedAt || "",
  }
}

function createWorkspaceProjectMeta(name = "New synopsis"): WorkspaceProjectMeta {
  const timestamp = new Date().toISOString()

  return {
    id: createProjectId(),
    name: normalizeProjectName(name),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function buildNextProjectName(projects: WorkspaceProjectMeta[]) {
  const existing = new Set(projects.map((project) => project.name.trim().toLowerCase()).filter(Boolean))
  let index = 1

  while (true) {
    const candidate = index === 1 ? "New synopsis" : `New synopsis ${index}`

    if (!existing.has(candidate.toLowerCase())) {
      return candidate
    }

    index += 1
  }
}

const emptySuggestionAlignment: SuggestionAlignment = {
  status: "aligned",
  summary: "",
  concerns: [],
  recommendations: [],
}

const emptyObjectiveSuggestionDraft: ObjectiveSuggestionDraft = {
  label: "",
  positioning: "",
  primaryObjective: "",
  secondaryObjectives: [],
  designOverview: "",
  alignment: emptySuggestionAlignment,
}

const emptyEndpointSuggestionDraft: EndpointSuggestionDraft = {
  label: "",
  positioning: "",
  primaryEndpoint: "",
  secondaryEndpoints: [],
  exploratoryEndpoints: [],
  rationale: "",
  alignment: emptySuggestionAlignment,
}

const emptyPopulationSuggestionDraft: PopulationSuggestionDraft = {
  population: "",
  eligibility: "",
  rationale: "",
}

const emptyObjectiveSuggestionSelection: ObjectiveSuggestionSelection = {
  primaryObjective: false,
  secondaryObjectives: [],
  designOverview: false,
}

const emptyEndpointSuggestionSelection: EndpointSuggestionSelection = {
  primaryEndpoint: false,
  secondaryEndpoints: [],
  exploratoryEndpoints: [],
}

const emptyPopulationSuggestionSelection: PopulationSuggestionSelection = {
  population: false,
  eligibility: false,
}

function normalizeStudyForm(study?: Partial<StudyForm>): StudyForm {
  const categoryCandidates = Object.keys(STUDY_CATEGORIES)
  const normalizedCategory =
    matchControlledOption(String(study?.category || ""), categoryCandidates) ||
    (categoryCandidates.includes(String(study?.category || "")) ? String(study?.category || "") : initialStudyForm.category)
  const subcategoryOptions =
    STUDY_CATEGORIES[normalizedCategory as keyof typeof STUDY_CATEGORIES]?.subcategories ?? []
  const normalizedSubcategory =
    matchControlledOption(String(study?.subcategory || ""), subcategoryOptions) ||
    (subcategoryOptions.includes(String(study?.subcategory || "")) ? String(study?.subcategory || "") : "") ||
    subcategoryOptions[0] ||
    initialStudyForm.subcategory

  return {
    ...initialStudyForm,
    ...study,
    category: normalizedCategory,
    subcategory: normalizedSubcategory,
    secondaryEvidenceUseIntents: Array.isArray(study?.secondaryEvidenceUseIntents)
      ? study.secondaryEvidenceUseIntents
      : [],
    secondaryStrategicObjectives: Array.isArray(study?.secondaryStrategicObjectives)
      ? study.secondaryStrategicObjectives
      : [],
    selectedEndpoints: Array.isArray(study?.selectedEndpoints) ? study.selectedEndpoints : [],
  }
}

function normalizeStudySchema(schema?: Partial<StudySchemaForm>): StudySchemaForm {
  return {
    ...initialStudySchema,
    ...schema,
    orientation: schema?.orientation === "vertical" ? "vertical" : "horizontal",
    detailLevel:
      schema?.detailLevel === "simple" || schema?.detailLevel === "detailed" || schema?.detailLevel === "standard"
        ? schema.detailLevel
        : "simple",
    lanes: Array.isArray(schema?.lanes) ? schema.lanes : [],
    nodes: Array.isArray(schema?.nodes) ? schema.nodes : [],
    edges: Array.isArray(schema?.edges) ? schema.edges : [],
    notes: Array.isArray(schema?.notes) ? schema.notes : [],
    theme: {
      ...DEFAULT_STUDY_SCHEMA_THEME,
      ...schema?.theme,
    },
  }
}

function normalizeSchedule(schedule?: Partial<ScheduleForm>): ScheduleForm {
  const tableLayout: ScheduleTableLayout =
    schedule?.tableLayout === "single" || schedule?.tableLayout === "split" || schedule?.tableLayout === "auto"
      ? schedule.tableLayout
      : "auto"
  const seenColumnIds = new Set<string>()
  const columns = Array.isArray(schedule?.columns)
    ? schedule.columns.map((column, index) => {
        const preferredId = column?.id || `visit-${index + 1}`
        const id = seenColumnIds.has(preferredId) ? `${preferredId}-${index + 1}` : preferredId
        seenColumnIds.add(id)

        return {
          id,
          phase: column?.phase || "",
          period: column?.period || "",
          visit: column?.visit || "",
          footnote: column?.footnote || "",
        }
      })
    : []

  const seenRowIds = new Set<string>()

  return {
    ...initialScheduleForm,
    ...schedule,
    prompt: schedule?.prompt || DEFAULT_SCHEDULE_PROMPT,
    tableLayout,
    columns,
    rows: Array.isArray(schedule?.rows)
      ? schedule.rows.map((row, rowIndex) => {
          const baseCells = Object.fromEntries(columns.map((column) => [column.id, ""]))
          const rawCells = row?.cells && typeof row.cells === "object" ? row.cells : {}
          const preferredId = row?.id || `row-${rowIndex + 1}`
          const id = seenRowIds.has(preferredId) ? `${preferredId}-${rowIndex + 1}` : preferredId
          seenRowIds.add(id)
          return {
            id,
            group: row?.group || "Custom activities",
            activity: row?.activity || "",
            notes: row?.notes || "",
            cells: { ...baseCells, ...rawCells },
          }
        })
      : [],
  }
}

function normalizeScheduleInsights(insights?: Partial<ScheduleInsights>): ScheduleInsights {
  return {
    ...initialScheduleInsights,
    ...insights,
    complexity: {
      ...initialScheduleInsights.complexity,
      ...insights?.complexity,
      drivers: Array.isArray(insights?.complexity?.drivers) ? insights.complexity.drivers : [],
      mitigations: Array.isArray(insights?.complexity?.mitigations) ? insights.complexity.mitigations : [],
    },
    tradeoff: {
      ...initialScheduleInsights.tradeoff,
      ...insights?.tradeoff,
      protectedElements: Array.isArray(insights?.tradeoff?.protectedElements) ? insights.tradeoff.protectedElements : [],
      recommendations: Array.isArray(insights?.tradeoff?.recommendations) ? insights.tradeoff.recommendations : [],
      safeguards: Array.isArray(insights?.tradeoff?.safeguards) ? insights.tradeoff.safeguards : [],
    },
  }
}

function normalizeStudyDocumentImportReport(report?: Partial<StudyDocumentImportReport>): StudyDocumentImportReport {
  return {
    ...initialStudyDocumentImportReport,
    ...report,
    appliedFields: Array.isArray(report?.appliedFields) ? report.appliedFields : [],
    replacedFields: Array.isArray(report?.replacedFields) ? report.replacedFields : [],
    remainingFields: Array.isArray(report?.remainingFields) ? report.remainingFields : [],
    unresolved: Array.isArray(report?.unresolved) ? report.unresolved : [],
    assumptions: Array.isArray(report?.assumptions) ? report.assumptions : [],
    conflictNotes: Array.isArray(report?.conflictNotes) ? report.conflictNotes : [],
  }
}

function normalizeImpactAssessment(assessment?: Partial<ImpactAssessment>): ImpactAssessment {
  return {
    ...initialImpactAssessment,
    ...assessment,
    domains: Array.isArray(assessment?.domains) ? assessment.domains : [],
    blockers: Array.isArray(assessment?.blockers) ? assessment.blockers : [],
    strengthenActions: Array.isArray(assessment?.strengthenActions) ? assessment.strengthenActions : [],
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("Unable to read the selected file."))
    reader.readAsDataURL(file)
  })
}

function getSectionSourceTabs(title: string) {
  const value = title.toLowerCase()

  if (value.includes("background") || value.includes("literature")) {
    return ["Study Design", "PICO & Stats", "Literature"]
  }

  if (value.includes("statistical")) {
    return ["Study Design", "PICO & Stats"]
  }

  if (value.includes("objective") || value.includes("population") || value.includes("design")) {
    return ["Study Design", "PICO & Stats"]
  }

  if (value.includes("operational")) {
    return ["Study Design"]
  }

  return ["Study Design", "PICO & Stats", "Literature"]
}

function getDefaultAssumptions(title: string) {
  const value = title.toLowerCase()
  const assumptions = ["AI-generated content requires human scientific review before approval."]

  if (value.includes("statistical")) {
    assumptions.push("Biostatistics must confirm all estimand, alpha, power, and effect-size assumptions.")
  }

  if (value.includes("background") || value.includes("literature")) {
    assumptions.push("Background text is model-drafted and should be reconciled against actual cited sources.")
  }

  return assumptions
}

function formatTimestamp(value: string) {
  if (!value) {
    return "Not generated yet"
  }

  return new Date(value).toLocaleString()
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function getComplexityLevel(score: number): ComplexityLevel {
  if (score >= 76) return "Very High"
  if (score >= 56) return "High"
  if (score >= 31) return "Moderate"
  return "Low"
}

function getImpactTone(impact: AnalysisImpact) {
  if (impact === "high") return "bg-rose-100 text-rose-800 border-rose-200"
  if (impact === "medium") return "bg-sky-50 text-[#1864AB] border-sky-300"
  return "bg-emerald-100 text-emerald-800 border-emerald-200"
}

function getImpactLabel(impact: AnalysisImpact) {
  if (impact === "high") return "High"
  if (impact === "medium") return "Moderate"
  return "Low"
}

function getPhaseGroups(columns: ScheduleColumn[]) {
  return columns.reduce<Array<{ label: string; span: number; startIndex: number }>>((groups, column, index) => {
    const current = groups[groups.length - 1]

    if (current && current.label === column.phase) {
      current.span += 1
      return groups
    }

    groups.push({ label: column.phase, span: 1, startIndex: index })
    return groups
  }, [])
}

function getPeriodGroups(columns: ScheduleColumn[]) {
  return columns.reduce<Array<{ key: string; label: string; span: number; startIndex: number }>>((groups, column, index) => {
    const key = `${column.phase}::${column.period}`
    const current = groups[groups.length - 1]

    if (current && current.key === key) {
      current.span += 1
      return groups
    }

    groups.push({ key, label: column.period, span: 1, startIndex: index })
    return groups
  }, [])
}

function getScheduleRowGroups(rows: ScheduleRow[]) {
  return rows.reduce<Array<{ group: string; rows: ScheduleRow[] }>>((groups, row) => {
    const current = groups[groups.length - 1]

    if (current && current.group === row.group) {
      current.rows.push(row)
      return groups
    }

    groups.push({ group: row.group, rows: [row] })
    return groups
  }, [])
}

function isFollowUpScheduleColumn(column: ScheduleColumn) {
  return /follow-up|follow up|long-term|long term|survival/i.test(`${column.phase} ${column.period} ${column.visit}`)
}

function findBalancedScheduleSplitIndex(columns: ScheduleColumn[]) {
  if (columns.length < 4) {
    return -1
  }

  const midpoint = Math.ceil(columns.length / 2)
  const boundaryCandidates: number[] = []

  for (let index = 2; index <= columns.length - 2; index += 1) {
    const previous = columns[index - 1]
    const current = columns[index]

    if (previous.phase !== current.phase || previous.period !== current.period) {
      boundaryCandidates.push(index)
    }
  }

  if (!boundaryCandidates.length) {
    return midpoint
  }

  return boundaryCandidates.reduce((best, candidate) =>
    Math.abs(candidate - midpoint) < Math.abs(best - midpoint) ? candidate : best,
  )
}

function buildScheduleSubset(schedule: ScheduleForm, columns: ScheduleColumn[]) {
  return normalizeSchedule({
    ...schedule,
    columns,
    rows: schedule.rows.map((row) => ({
      ...row,
      cells: Object.fromEntries(columns.map((column) => [column.id, row.cells[column.id] || ""])) as Record<string, string>,
    })),
  })
}

function getScheduleTablePresentation(schedule: ScheduleForm): {
  effectiveLayout: "single" | "split"
  recommendation: string
  tables: Array<{ id: string; title: string; description: string; schedule: ScheduleForm }>
} {
  if (!schedule.columns.length || !schedule.rows.length) {
    return {
      effectiveLayout: "single",
      recommendation: "Generate a schedule first to choose between single-table and split-table views.",
      tables: [
        {
          id: "empty",
          title: "Schedule of Activities",
          description: "",
          schedule,
        },
      ],
    }
  }

  const followUpStartIndex = schedule.columns.findIndex((column, index) => index >= 2 && isFollowUpScheduleColumn(column))
  const denseGrid =
    schedule.columns.length >= 10 ||
    (schedule.columns.length >= 8 && schedule.rows.length >= 12) ||
    new Set(schedule.columns.map((column) => `${column.phase}::${column.period}`)).size >= 5

  let splitIndex = -1
  let splitReason = "The current schedule is still readable as one table."
  let splitKind: "follow_up" | "balanced" = "balanced"

  if (followUpStartIndex >= 2 && schedule.columns.length - followUpStartIndex >= 2 && (schedule.columns.length >= 8 || denseGrid)) {
    splitIndex = followUpStartIndex
    splitKind = "follow_up"
    splitReason = `${schedule.columns.length} visits with a distinct follow-up phase are easier to review as core and follow-up tables.`
  } else if (denseGrid) {
    splitIndex = findBalancedScheduleSplitIndex(schedule.columns)
    splitReason = `${schedule.columns.length} visits across ${schedule.rows.length} activities create a wide grid, so two tables improve readability.`
  }

  const requestedLayout =
    schedule.tableLayout === "auto" ? (splitIndex >= 2 ? "split" : "single") : schedule.tableLayout

  if (requestedLayout === "split" && splitIndex < 2) {
    splitIndex = findBalancedScheduleSplitIndex(schedule.columns)
    splitKind = "balanced"
  }

  if (requestedLayout !== "split" || splitIndex < 2 || schedule.columns.length - splitIndex < 2) {
    return {
      effectiveLayout: "single",
      recommendation:
        schedule.tableLayout === "auto"
          ? splitReason
          : "Single-table view selected. Use split view only when the visit grid becomes harder to scan.",
      tables: [
        {
          id: "all",
          title: "Schedule of Activities",
          description: "",
          schedule,
        },
      ],
    }
  }

  const leadingColumns = schedule.columns.slice(0, splitIndex)
  const trailingColumns = schedule.columns.slice(splitIndex)
  const leadingSchedule = buildScheduleSubset(schedule, leadingColumns)
  const trailingSchedule = buildScheduleSubset(schedule, trailingColumns)

  return {
    effectiveLayout: "split",
    recommendation:
      schedule.tableLayout === "auto"
        ? splitReason
        : splitKind === "follow_up"
          ? "Split-table view selected. The follow-up phase is separated from the core treatment schedule."
          : "Split-table view selected. Earlier and later visits are separated for easier scanning.",
    tables: [
      {
        id: "lead",
        title: splitKind === "follow_up" ? "Core schedule" : "Earlier visit schedule",
        description:
          splitKind === "follow_up"
            ? "Screening and on-treatment visits grouped together for the main operational view."
            : "Earlier visits shown separately to keep the visit matrix readable.",
        schedule: leadingSchedule,
      },
      {
        id: "trail",
        title: splitKind === "follow_up" ? "Follow-up schedule" : "Later visit schedule",
        description:
          splitKind === "follow_up"
            ? "End-of-treatment and follow-up visits separated for easier review."
            : "Later visits shown in a second table to reduce horizontal scanning.",
        schedule: trailingSchedule,
      },
    ],
  }
}

function getSelectedDiseaseLabel(study: StudyForm) {
  return (study.customDisease || "").trim() || (study.disease || "").trim()
}

function getPrimaryStudyAimDefinition(label: string) {
  return PRIMARY_STUDY_AIMS.find((option) => option.label === label) || null
}

function inferPrimaryStudyAim(study: StudyForm) {
  const explicit = (study.primaryStudyAim || "").trim()
  if (explicit) {
    return explicit
  }

  const strategicObjective = (study.primaryStrategicObjective || study.customStrategicObjective || "").trim()
  const evidenceIntent = (study.primaryEvidenceUseIntent || "").trim()

  const exact = PRIMARY_STUDY_AIMS.find(
    (option) => option.strategic === strategicObjective && option.evidence === evidenceIntent,
  )
  if (exact) {
    return exact.label
  }

  if (/label/.test(evidenceIntent.toLowerCase()) || /label expansion|label refinement/.test(strategicObjective.toLowerCase())) {
    return "Support label change or expansion"
  }
  if (/hta|market access/.test(evidenceIntent.toLowerCase()) || /hta|market access/.test(strategicObjective.toLowerCase())) {
    return "Support HTA or market access decisions"
  }
  if (/guideline|practice/.test(evidenceIntent.toLowerCase()) || /inform clinical practice|accelerate uptake|defend market share/.test(strategicObjective.toLowerCase())) {
    return "Inform guidelines or clinical practice"
  }
  if (/publication/.test(evidenceIntent.toLowerCase()) || /publication/.test(strategicObjective.toLowerCase())) {
    return "Support a scientific publication"
  }
  if (/regulatory/.test(evidenceIntent.toLowerCase()) || /regulatory commitment/.test(strategicObjective.toLowerCase())) {
    return "Meet a regulatory commitment"
  }
  if (/safety|risk/.test(evidenceIntent.toLowerCase()) || /safety|risk|dose modification/.test(strategicObjective.toLowerCase())) {
    return "Strengthen safety or risk-management evidence"
  }
  if (/new population/.test(strategicObjective.toLowerCase())) {
    return "Explore a new population or treatment strategy"
  }

  return ""
}

function hasPrimaryStudyAimSelection(study: StudyForm) {
  return Boolean(inferPrimaryStudyAim(study) || getStrategicObjectiveLabel(study) || getPrimaryEvidenceUseIntent(study))
}

function getStrategicObjectiveLabel(study: StudyForm) {
  const mapped = getPrimaryStudyAimDefinition(inferPrimaryStudyAim(study))

  return (study.primaryStrategicObjective || "").trim() || mapped?.strategic || (study.customStrategicObjective || "").trim()
}

function getPrimaryEvidenceUseIntent(study: StudyForm) {
  const mapped = getPrimaryStudyAimDefinition(inferPrimaryStudyAim(study))

  return (study.primaryEvidenceUseIntent || "").trim() || mapped?.evidence || ""
}

function getAllEvidenceUseIntents(study: StudyForm) {
  return uniqueItemsCaseInsensitive([getPrimaryEvidenceUseIntent(study), ...(study.secondaryEvidenceUseIntents || [])])
}

function getAllChosenEndpoints(study: StudyForm) {
  return [...(study.selectedEndpoints || []), ...splitStructuredEditorItems(study.customEndpoints || "")]
}

function getResolvedIndication(study: StudyForm) {
  return (study.indication || "").trim() || getSelectedDiseaseLabel(study)
}

function getResolvedOutcomes(study: StudyForm) {
  return (study.outcomes || "").trim() || getAllChosenEndpoints(study).join("\n")
}

function createObjectiveSuggestionSelection(draft: ObjectiveSuggestionDraft): ObjectiveSuggestionSelection {
  return {
    primaryObjective: Boolean(draft.primaryObjective),
    secondaryObjectives: [...draft.secondaryObjectives],
    designOverview: Boolean(draft.designOverview),
  }
}

function createEndpointSuggestionSelection(draft: EndpointSuggestionDraft): EndpointSuggestionSelection {
  return {
    primaryEndpoint: Boolean(draft.primaryEndpoint),
    secondaryEndpoints: [...draft.secondaryEndpoints],
    exploratoryEndpoints: [...draft.exploratoryEndpoints],
  }
}

function createPopulationSuggestionSelection(
  draft: PopulationSuggestionDraft,
  source: PopulationSuggestionSource = "population",
): PopulationSuggestionSelection {
  return {
    population: source === "population" ? Boolean(draft.population) : false,
    eligibility: Boolean(draft.eligibility),
  }
}

function getAiActionLabel(
  ready: boolean,
  loading: boolean,
  hasDraft: boolean,
  missing: string[],
  defaultLabel = "Suggest with AI",
  refreshLabel = "Refresh with AI",
  loadingLabel = "Drafting...",
) {
  if (loading) {
    return loadingLabel
  }

  if (ready) {
    return hasDraft ? refreshLabel : defaultLabel
  }

  if (missing.length === 1) {
    return `Add ${missing[0]}`
  }

  if (missing.length > 1) {
    return `Complete ${missing.length} inputs`
  }

  return defaultLabel
}

function uniqueItemsCaseInsensitive(items: string[]) {
  const seen = new Set<string>()

  return items.filter((item) => {
    const normalized = item.trim().toLowerCase()

    if (!normalized || seen.has(normalized)) {
      return false
    }

    seen.add(normalized)
    return true
  })
}

function getGuidedEndpointsForStudy(study: StudyForm) {
  if (!(study.therapeuticArea || "").trim() || !getSelectedDiseaseLabel(study)) {
    return []
  }

  const diseases =
    THERAPEUTIC_LIBRARY[study.therapeuticArea as keyof typeof THERAPEUTIC_LIBRARY]?.diseases ?? {}

  return diseases[getSelectedDiseaseLabel(study) as keyof typeof diseases] ?? []
}

function normalizeOptionText(value: string) {
  return value
    .toLowerCase()
    .replace(/\biii\b/g, "3")
    .replace(/\bii\b/g, "2")
    .replace(/\biv\b/g, "4")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function matchControlledOption(value: string, options: readonly string[]) {
  const normalizedValue = normalizeOptionText(value)

  if (!normalizedValue) {
    return ""
  }

  const exact = options.find((option) => normalizeOptionText(option) === normalizedValue)
  if (exact) {
    return exact
  }

  const inclusive = options.find((option) => {
    const normalizedOption = normalizeOptionText(option)
    return normalizedOption.includes(normalizedValue) || normalizedValue.includes(normalizedOption)
  })

  if (inclusive) {
    return inclusive
  }

  const valueTokens = new Set(normalizedValue.split(" ").filter(Boolean))
  let bestOption = ""
  let bestScore = 0

  options.forEach((option) => {
    const optionTokens = normalizeOptionText(option).split(" ").filter(Boolean)
    const score = optionTokens.filter((token) => valueTokens.has(token)).length

    if (score > bestScore) {
      bestScore = score
      bestOption = option
    }
  })

  return bestScore >= 2 ? bestOption : ""
}

function valuesMatch(left: string, right: string) {
  return normalizeOptionText(left) === normalizeOptionText(right)
}

function sameCaseInsensitiveItems(left: string[], right: string[]) {
  const normalizedLeft = uniqueItemsCaseInsensitive(left).map((item) => normalizeOptionText(item)).sort()
  const normalizedRight = uniqueItemsCaseInsensitive(right).map((item) => normalizeOptionText(item)).sort()

  if (normalizedLeft.length !== normalizedRight.length) {
    return false
  }

  return normalizedLeft.every((item, index) => item === normalizedRight[index])
}

function matchesGuidedEndpointValue(candidate: string, guidedEndpoint: string) {
  const normalizedCandidate = normalizeOptionText(candidate)
  const normalizedGuided = normalizeOptionText(guidedEndpoint)

  if (!normalizedCandidate || !normalizedGuided) {
    return false
  }

  return (
    normalizedCandidate === normalizedGuided ||
    normalizedCandidate.startsWith(`${normalizedGuided} `) ||
    normalizedCandidate.includes(`${normalizedGuided} `) ||
    normalizedCandidate.includes(`${normalizedGuided}:`) ||
    normalizedCandidate.includes(`(${normalizedGuided})`) ||
    normalizedCandidate.includes(normalizedGuided)
  )
}

function deriveEndpointStateFromOutcomeText(study: StudyForm, outcomesText: string) {
  const outcomeItems = splitStructuredEditorItems(outcomesText)
  const guidedEndpoints = getGuidedEndpointsForStudy(study)
  const selectedEndpoints = uniqueItemsCaseInsensitive(
    guidedEndpoints.filter((guidedEndpoint) =>
      outcomeItems.some((item) => matchesGuidedEndpointValue(item, guidedEndpoint)),
    ),
  )
  const customEndpoints = outcomeItems.filter(
    (item) => !selectedEndpoints.some((guidedEndpoint) => matchesGuidedEndpointValue(item, guidedEndpoint)),
  )

  return {
    selectedEndpoints,
    customEndpoints: customEndpoints.join("\n"),
    outcomes: outcomeItems.join("\n"),
  }
}

function summarizeImportValue(value: string) {
  const trimmed = value.trim()

  if (trimmed.length <= 80) {
    return trimmed
  }

  return `${trimmed.slice(0, 77).trimEnd()}...`
}

function buildImportedStudyPatch(current: StudyForm, imported: ImportedStudyDraft) {
  const previous = normalizeStudyForm(current)
  const next = normalizeStudyForm(current)
  const appliedFields: string[] = []
  const replacedFields: string[] = []
  const conflictNotes: string[] = []
  const endpointCandidates = uniqueItemsCaseInsensitive([
    ...(Array.isArray(imported.endpointCandidates) ? imported.endpointCandidates : []),
    ...splitStructuredEditorItems(imported.outcomes || ""),
  ])
  const previousDiseaseLabel = getSelectedDiseaseLabel(previous)
  const previousStructuredOutcomes = getAllChosenEndpoints(previous).join("\n")
  const previousStructuredOutcomeSet = getAllChosenEndpoints(previous)
  let studyTypeChanged = false
  let diseaseContextChanged = false
  let treatmentContextChanged = false

  const applyStringField = (
    key: keyof StudyForm,
    value: string | undefined,
    label: string,
    options?: {
      mode?: "fill_blank" | "prefer_source"
      canFill?: (currentValue: string) => boolean
    },
  ) => {
    const normalized = String(value || "").trim()
    const currentValue = String(next[key] || "").trim()
    const canFill = options?.canFill || ((candidate: string) => !candidate.trim())

    if (!normalized) {
      return { changed: false, replaced: false }
    }

    if ((!currentValue || canFill(currentValue)) && !valuesMatch(currentValue, normalized)) {
      next[key] = normalized as StudyForm[typeof key]
      appliedFields.push(label)
      return { changed: true, replaced: false }
    }

    if ((options?.mode || "fill_blank") === "prefer_source" && !valuesMatch(currentValue, normalized)) {
      next[key] = normalized as StudyForm[typeof key]
      replacedFields.push(label)
      conflictNotes.push(`${label} updated from "${summarizeImportValue(currentValue)}" to "${summarizeImportValue(normalized)}" to match the uploaded source.`)
      return { changed: true, replaced: true }
    }

    return { changed: false, replaced: false }
  }

  const applyArrayField = (
    key: "selectedEndpoints" | "secondaryStrategicObjectives" | "secondaryEvidenceUseIntents",
    values: string[],
    label: string,
    mode: "fill_blank" | "prefer_source" = "fill_blank",
  ) => {
    const normalizedValues = uniqueItemsCaseInsensitive(values)
    const currentValues = Array.isArray(next[key]) ? next[key] : []

    if (!normalizedValues.length) {
      return { changed: false, replaced: false }
    }

    if (!currentValues.length && !sameCaseInsensitiveItems(currentValues, normalizedValues)) {
      next[key] = normalizedValues as StudyForm[typeof key]
      appliedFields.push(label)
      return { changed: true, replaced: false }
    }

    if (mode === "prefer_source" && !sameCaseInsensitiveItems(currentValues, normalizedValues)) {
      next[key] = normalizedValues as StudyForm[typeof key]
      replacedFields.push(label)
      conflictNotes.push(`${label} updated to match the uploaded source.`)
      return { changed: true, replaced: true }
    }

    return { changed: false, replaced: false }
  }

  const replaceDiseaseSelection = (incomingLabel: string, matchedDisease: string) => {
    const currentLabel = getSelectedDiseaseLabel(next)

    if (!incomingLabel.trim()) {
      return false
    }

    if (!currentLabel.trim()) {
      if (matchedDisease) {
        next.disease = matchedDisease
        next.customDisease = ""
      } else {
        next.disease = ""
        next.customDisease = incomingLabel.trim()
      }
      appliedFields.push("Disease / indication")
      return true
    }

    if (!valuesMatch(currentLabel, incomingLabel)) {
      if (matchedDisease) {
        next.disease = matchedDisease
        next.customDisease = ""
      } else {
        next.disease = ""
        next.customDisease = incomingLabel.trim()
      }
      replacedFields.push("Disease / indication")
      conflictNotes.push(
        `Disease / indication updated from "${summarizeImportValue(currentLabel)}" to "${summarizeImportValue(incomingLabel)}" to match the uploaded source.`,
      )
      return true
    }

    return false
  }

  const categoryValue = matchControlledOption(imported.category || "", Object.keys(STUDY_CATEGORIES)) || imported.category
  const categoryResult = applyStringField("category", categoryValue, "Research category", {
    mode: "prefer_source",
    canFill: (currentValue) => !currentValue.trim() || currentValue === initialStudyForm.category,
  })
  studyTypeChanged = studyTypeChanged || categoryResult.changed

  const subcategoryOptions = STUDY_CATEGORIES[next.category as keyof typeof STUDY_CATEGORIES]?.subcategories ?? []
  const matchedSubcategory = matchControlledOption(imported.subcategory || "", subcategoryOptions)
  const importedSubcategory = matchedSubcategory || imported.subcategory || subcategoryOptions[0] || ""
  const subcategoryResult = applyStringField("subcategory", importedSubcategory, "Study subtype", {
    mode: "prefer_source",
    canFill: (currentValue) => !currentValue.trim() || currentValue === initialStudyForm.subcategory,
  })
  studyTypeChanged = studyTypeChanged || subcategoryResult.changed

  const matchedStage = matchControlledOption(imported.developmentStage || "", DEVELOPMENT_STAGES)
  const stageFallback = next.category && next.category !== "interventional" ? "Not phase-based" : ""
  const stageResult = applyStringField("developmentStage", matchedStage || imported.developmentStage || stageFallback, "Development stage", {
    mode: "prefer_source",
  })
  studyTypeChanged = studyTypeChanged || stageResult.changed
  if (
    next.category === "interventional" &&
    next.developmentStage === "Not phase-based" &&
    !(matchedStage || imported.developmentStage || "").trim()
  ) {
    next.developmentStage = ""
    replacedFields.push("Development stage")
    conflictNotes.push('Development stage was cleared because the uploaded source indicates an interventional study and "Not phase-based" no longer fits.')
    studyTypeChanged = true
  }

  applyStringField("studyTitle", imported.studyTitle, "Study title", { mode: "prefer_source" })
  applyStringField("sponsor", imported.sponsor, "Sponsor or program", { mode: "prefer_source" })

  const matchedPrimaryStrategic = matchControlledOption(imported.primaryStrategicObjective || "", STRATEGIC_OBJECTIVES)
  if (matchedPrimaryStrategic && !getStrategicObjectiveLabel(next)) {
    next.primaryStrategicObjective = matchedPrimaryStrategic
    next.customStrategicObjective = ""
    appliedFields.push("Primary strategic objective")
  } else if ((imported.customStrategicObjective || imported.primaryStrategicObjective || "").trim() && !getStrategicObjectiveLabel(next)) {
    next.customStrategicObjective = (imported.customStrategicObjective || imported.primaryStrategicObjective || "").trim()
    appliedFields.push("Primary strategic objective")
  }

  if (!next.secondaryStrategicObjectives.length && Array.isArray(imported.secondaryStrategicObjectives)) {
    const matchedSecondaryStrategic = uniqueItemsCaseInsensitive(
      imported.secondaryStrategicObjectives.map((item) => matchControlledOption(item, STRATEGIC_OBJECTIVES)).filter(Boolean),
    ).filter((item) => item !== next.primaryStrategicObjective)

    if (matchedSecondaryStrategic.length) {
      next.secondaryStrategicObjectives = matchedSecondaryStrategic
      appliedFields.push("Secondary strategic objectives")
    }
  }

  const matchedPrimaryEvidenceIntent = matchControlledOption(imported.primaryEvidenceUseIntent || "", EVIDENCE_USE_INTENTS)
  applyStringField("primaryEvidenceUseIntent", matchedPrimaryEvidenceIntent || imported.primaryEvidenceUseIntent, "Primary evidence use intent")

  if (!next.secondaryEvidenceUseIntents.length && Array.isArray(imported.secondaryEvidenceUseIntents)) {
    const matchedSecondaryEvidence = uniqueItemsCaseInsensitive(
      imported.secondaryEvidenceUseIntents.map((item) => matchControlledOption(item, EVIDENCE_USE_INTENTS)).filter(Boolean),
    ).filter((item) => item !== next.primaryEvidenceUseIntent)

    if (matchedSecondaryEvidence.length) {
      applyArrayField("secondaryEvidenceUseIntents", matchedSecondaryEvidence, "Secondary evidence use intents")
    }
  }

  const matchedTherapeuticArea = matchControlledOption(imported.therapeuticArea || "", Object.keys(THERAPEUTIC_LIBRARY))
  const therapeuticAreaResult = applyStringField("therapeuticArea", matchedTherapeuticArea || imported.therapeuticArea, "Therapeutic area", {
    mode: "prefer_source",
  })
  diseaseContextChanged = diseaseContextChanged || therapeuticAreaResult.changed

  const diseaseOptions = next.therapeuticArea
    ? Object.keys(
        (THERAPEUTIC_LIBRARY[next.therapeuticArea as keyof typeof THERAPEUTIC_LIBRARY]?.diseases ?? {}) as Record<string, readonly string[]>,
      )
    : []
  const incomingDisease = (imported.disease || imported.customDisease || "").trim()
  const matchedDisease = matchControlledOption(incomingDisease, diseaseOptions)
  if (incomingDisease) {
    diseaseContextChanged = replaceDiseaseSelection(matchedDisease || incomingDisease, matchedDisease) || diseaseContextChanged
  } else if (therapeuticAreaResult.changed && getSelectedDiseaseLabel(next)) {
    const currentDiseaseLabel = getSelectedDiseaseLabel(next)
    next.disease = ""
    next.customDisease = ""
    replacedFields.push("Disease / indication")
    conflictNotes.push(
      `Disease / indication was cleared because the therapeutic area changed from the uploaded source and the file did not provide a compatible disease value.`,
    )
    diseaseContextChanged = diseaseContextChanged || Boolean(currentDiseaseLabel)
  }

  const topInterventionResult = applyStringField("topIntervention", imported.topIntervention || imported.intervention, "Intervention / drug", {
    mode: "prefer_source",
  })
  const topInterventionClassResult = applyStringField("topInterventionClass", imported.topInterventionClass, "Intervention class", {
    mode: "prefer_source",
  })
  const comparatorResult = applyStringField("topComparator", imported.topComparator || imported.comparator, "Comparator", {
    mode: "prefer_source",
  })
  const lineOfTherapyResult = applyStringField("topLineOfTherapy", imported.topLineOfTherapy, "Line of therapy / setting", {
    mode: "prefer_source",
  })
  treatmentContextChanged =
    topInterventionResult.changed || topInterventionClassResult.changed || comparatorResult.changed || lineOfTherapyResult.changed

  const preferNarrativeSource = studyTypeChanged || diseaseContextChanged || treatmentContextChanged

  applyStringField("indication", imported.indication || imported.disease || imported.customDisease, "Indication details for this study", {
    mode: preferNarrativeSource ? "prefer_source" : "fill_blank",
  })
  applyStringField("primaryObjective", imported.primaryObjective, "Primary study objective", {
    mode: preferNarrativeSource ? "prefer_source" : "fill_blank",
  })
  applyStringField("secondaryObjectives", imported.secondaryObjectives, "Secondary objectives", {
    mode: preferNarrativeSource ? "prefer_source" : "fill_blank",
  })
  applyStringField("designOverview", imported.designOverview, "Study design overview", {
    mode: preferNarrativeSource ? "prefer_source" : "fill_blank",
  })
  applyStringField("population", imported.population, "Population", {
    mode: preferNarrativeSource ? "prefer_source" : "fill_blank",
  })
  applyStringField("eligibility", imported.eligibility, "Eligibility highlights", {
    mode: preferNarrativeSource ? "prefer_source" : "fill_blank",
  })
  applyStringField("intervention", imported.intervention || imported.topIntervention, "Intervention or exposure", {
    mode: preferNarrativeSource ? "prefer_source" : "fill_blank",
  })
  applyStringField("comparator", imported.comparator || imported.topComparator, "Comparator narrative", {
    mode: preferNarrativeSource ? "prefer_source" : "fill_blank",
  })
  applyStringField("timeline", imported.timeline, "Timeline", {
    mode: "prefer_source",
  })
  applyStringField("geography", imported.geography, "Geography", {
    mode: "prefer_source",
  })
  applyStringField("sampleSize", imported.sampleSize, "Sample size planning input", {
    mode: "prefer_source",
  })
  applyStringField("operationalNotes", imported.operationalNotes, "Operational notes")

  if ((preferNarrativeSource || !next.outcomes.trim() || !next.selectedEndpoints.length) && endpointCandidates.length) {
    const guidedEndpoints = getGuidedEndpointsForStudy(next)
    const matchedSelectedEndpoints = uniqueItemsCaseInsensitive(
      endpointCandidates.map((item) => matchControlledOption(item, guidedEndpoints)).filter(Boolean),
    )
    const unmatchedEndpoints = uniqueItemsCaseInsensitive(
      endpointCandidates.filter(
        (item) => !matchedSelectedEndpoints.some((matched) => normalizeOptionText(matched) === normalizeOptionText(item)),
      ),
    )

    if (matchedSelectedEndpoints.length) {
      const currentSelectedEndpoints = [...next.selectedEndpoints]
      if (!sameCaseInsensitiveItems(currentSelectedEndpoints, matchedSelectedEndpoints)) {
        next.selectedEndpoints = matchedSelectedEndpoints
        if (currentSelectedEndpoints.length) {
          replacedFields.push("Suggested endpoints")
          conflictNotes.push("Suggested endpoints were updated to match the uploaded source.")
        } else {
          appliedFields.push("Suggested endpoints")
        }
      }
    } else if (preferNarrativeSource && next.selectedEndpoints.length) {
      next.selectedEndpoints = []
      replacedFields.push("Suggested endpoints")
      conflictNotes.push("Suggested endpoints were cleared because the uploaded source provided a different endpoint package.")
    }

    if (preferNarrativeSource || !next.customEndpoints.trim() || unmatchedEndpoints.length) {
      const nextCustomEndpoints = unmatchedEndpoints.join("\n")
      if (nextCustomEndpoints && !valuesMatch(next.customEndpoints, nextCustomEndpoints)) {
        if (next.customEndpoints.trim()) {
          replacedFields.push("Custom endpoints")
          conflictNotes.push("Custom endpoints were updated to match the uploaded source.")
        } else {
          appliedFields.push("Custom endpoints")
        }
        next.customEndpoints = nextCustomEndpoints
      } else if (!nextCustomEndpoints && preferNarrativeSource && next.customEndpoints.trim()) {
        next.customEndpoints = ""
        replacedFields.push("Custom endpoints")
        conflictNotes.push("Custom endpoints were cleared because the uploaded source provided a different endpoint package.")
      }
    }

    if (preferNarrativeSource || !next.outcomes.trim()) {
      const nextOutcomes =
        uniqueItemsCaseInsensitive([...matchedSelectedEndpoints, ...unmatchedEndpoints]).join("\n") || (imported.outcomes || "").trim()

      if (nextOutcomes && !valuesMatch(next.outcomes, nextOutcomes)) {
        if (next.outcomes.trim()) {
          replacedFields.push("Endpoints and assessments")
          conflictNotes.push("Endpoints and assessments were updated to match the uploaded source.")
        } else {
          appliedFields.push("Endpoints and assessments")
        }
        next.outcomes = nextOutcomes
      } else if (!nextOutcomes && preferNarrativeSource && next.outcomes.trim()) {
        next.outcomes = ""
        replacedFields.push("Endpoints and assessments")
        conflictNotes.push("Endpoints and assessments were cleared because the uploaded source changed the study context without a reliable replacement endpoint description.")
      }
    }
  } else if (preferNarrativeSource && !endpointCandidates.length && (diseaseContextChanged || treatmentContextChanged)) {
    if (next.selectedEndpoints.length || next.customEndpoints.trim()) {
      next.selectedEndpoints = []
      next.customEndpoints = ""
      replacedFields.push("Endpoint selections")
      conflictNotes.push(
        "Endpoint selections were cleared because the uploaded source changed the disease or treatment context without a reliable replacement endpoint set.",
      )
    }

    if (next.outcomes.trim() && (!previous.outcomes.trim() || valuesMatch(next.outcomes, previousStructuredOutcomes))) {
      next.outcomes = ""
      replacedFields.push("Endpoints and assessments")
      conflictNotes.push(
        "Endpoints and assessments were cleared because the uploaded source changed the study context and the prior endpoint wording no longer matched.",
      )
    }
  } else {
    applyStringField("outcomes", imported.outcomes, "Endpoints and assessments", {
      mode: preferNarrativeSource ? "prefer_source" : "fill_blank",
    })
  }

  if (diseaseContextChanged && previousDiseaseLabel && !getSelectedDiseaseLabel(next) && !next.indication.trim()) {
    next.indication = ""
  }

  if (
    preferNarrativeSource &&
    previousStructuredOutcomeSet.length &&
    !endpointCandidates.length &&
    !imported.outcomes?.trim() &&
    next.outcomes.trim() &&
    valuesMatch(next.outcomes, previousStructuredOutcomes)
  ) {
    next.outcomes = ""
    replacedFields.push("Endpoints and assessments")
    conflictNotes.push(
      "Endpoints and assessments were cleared because the uploaded source changed the study context and the prior endpoint wording appeared to be carried over from the earlier selection.",
    )
  }

  return {
    next,
    appliedFields: uniqueItemsCaseInsensitive(appliedFields),
    replacedFields: uniqueItemsCaseInsensitive(replacedFields),
    conflictNotes: uniqueItemsCaseInsensitive(conflictNotes),
  }
}

function getObjectiveSuggestionMissing(study: StudyForm) {
  const missing = []

  if (!hasPrimaryStudyAimSelection(study)) missing.push("primary study aim")
  if (!(study.developmentStage || "").trim()) missing.push("development stage")
  if (!(study.therapeuticArea || "").trim()) missing.push("therapeutic area")
  if (!getSelectedDiseaseLabel(study)) missing.push("disease")
  if (!((study.topIntervention || "").trim() || (study.intervention || "").trim())) missing.push("intervention")
  if (!(study.subcategory || study.category || "").trim()) missing.push("study type")

  return missing
}

function getEndpointSuggestionMissing(study: StudyForm) {
  const missing = []

  if (!(study.primaryObjective || "").trim()) missing.push("primary objective")
  if (!(study.developmentStage || "").trim()) missing.push("development stage")
  if (!hasPrimaryStudyAimSelection(study)) missing.push("primary study aim")
  if (!(study.therapeuticArea || "").trim()) missing.push("therapeutic area")
  if (!getSelectedDiseaseLabel(study)) missing.push("disease")
  if (!((study.topIntervention || "").trim() || (study.intervention || "").trim())) missing.push("intervention")
  if (!(study.subcategory || study.category || "").trim()) missing.push("study type")

  return missing
}

function getPopulationDraftMissing(study: StudyForm) {
  const missing = []

  if (!(study.primaryObjective || "").trim()) missing.push("primary objective")
  if (!getSelectedDiseaseLabel(study)) missing.push("disease")
  if (!((study.topIntervention || "").trim() || (study.intervention || "").trim())) missing.push("intervention")
  if (!(study.subcategory || study.category || "").trim()) missing.push("study type")

  return missing
}

function getEligibilitySuggestionMissing(study: StudyForm) {
  const missing = []

  if (!(study.population || "").trim()) missing.push("population")

  return missing
}

function getStrategicIntentLane(strategicObjective: string) {
  const value = strategicObjective.toLowerCase()

  if (/label expansion|label refinement|label update/.test(value)) return "label"
  if (/market access|hta/.test(value)) return "hta"
  if (/inform clinical practice|accelerate uptake|defend market share/.test(value)) return "practice"
  if (/publication/.test(value)) return "publication"
  if (/regulatory commitment/.test(value)) return "regulatory"
  if (/dose modification/.test(value)) return "safety"
  if (/new population/.test(value)) return "label"
  if (/real-world evidence/.test(value)) return "practice"
  if (/lifecycle management/.test(value)) return "broad"

  return "broad"
}

function getEvidenceIntentLane(evidenceIntent: string) {
  const value = evidenceIntent.toLowerCase()

  if (/label/.test(value)) return "label"
  if (/guideline|practice/.test(value)) return "practice"
  if (/hta|market access/.test(value)) return "hta"
  if (/publication/.test(value)) return "publication"
  if (/regulatory/.test(value)) return "regulatory"
  if (/safety|risk/.test(value)) return "safety"

  return "broad"
}

function buildPrimaryIntentAlignment(study: StudyForm): SuggestionAlignment | null {
  const strategicObjective = getStrategicObjectiveLabel(study)
  const evidenceIntent = getPrimaryEvidenceUseIntent(study)

  if (!strategicObjective || !evidenceIntent) {
    return null
  }

  const strategicLane = getStrategicIntentLane(strategicObjective)
  const evidenceLane = getEvidenceIntentLane(evidenceIntent)
  const secondaryEvidence = (study.secondaryEvidenceUseIntents || []).map((item) => getEvidenceIntentLane(item))
  const secondaryStrategic = (study.secondaryStrategicObjectives || []).map((item) => getStrategicIntentLane(item))
  const concerns: string[] = []
  const recommendations: string[] = []

  if (strategicLane === "broad") {
    return {
      status: "aligned",
      summary: "The current strategic objective is broad enough that the selected primary evidence use intent is acceptable.",
      concerns,
      recommendations,
    }
  }

  const adjacentByStrategicLane: Record<string, string[]> = {
    label: ["regulatory", "hta", "practice"],
    hta: ["practice", "publication", "label"],
    practice: ["hta", "publication"],
    publication: ["practice", "hta"],
    regulatory: ["label", "safety"],
    safety: ["regulatory", "label", "publication"],
  }

  if (strategicLane === evidenceLane) {
    return {
      status: "aligned",
      summary: "The primary strategic objective and primary evidence use intent are directionally aligned.",
      concerns,
      recommendations,
    }
  }

  const adjacentLanes = adjacentByStrategicLane[strategicLane] || []
  const rescuedBySecondary =
    secondaryEvidence.includes(strategicLane) || secondaryStrategic.includes(evidenceLane) || adjacentLanes.includes(evidenceLane)

  if (rescuedBySecondary) {
    concerns.push(
      `The primary strategic objective points toward ${strategicLane.toUpperCase()}-type evidence, while the primary evidence use intent emphasizes ${evidenceIntent}.`,
    )
    recommendations.push(
      `If ${strategicObjective} is the main program intent, consider making the ${strategicLane === "hta" ? "HTA / market access" : strategicLane === "practice" ? "Guideline / practice informing" : strategicLane === "label" ? "Label support / change" : strategicLane === "publication" ? "Scientific publication" : strategicLane === "regulatory" ? "Regulatory commitment" : "Safety / risk management"} evidence use intent primary and keeping ${evidenceIntent} as secondary.`,
    )

    return {
      status: "partially_aligned",
      summary: "There is some tension between the primary program intent and the primary evidentiary destination, but the secondary selections partly cover it.",
      concerns,
      recommendations,
    }
  }

  concerns.push(
    `The primary strategic objective is ${strategicObjective}, but the primary evidence use intent is ${evidenceIntent}. Those two choices usually drive different design, comparator, and endpoint decisions.`,
  )
  recommendations.push(
    `Decide which should be primary: the current program intent or the current evidence destination. Then move the other one into the secondary selections if it still matters.`,
  )

  return {
    status: "conflicts",
    summary: "The selected primary strategic objective and primary evidence use intent point in different directions.",
    concerns,
    recommendations,
  }
}

function getImpactAssessmentMissing(study: StudyForm) {
  const missing = []

  if (!hasPrimaryStudyAimSelection(study)) missing.push("primary study aim")
  if (!(study.developmentStage || "").trim()) missing.push("development stage")
  if (!(study.therapeuticArea || "").trim()) missing.push("therapeutic area")
  if (!getSelectedDiseaseLabel(study)) missing.push("disease")
  if (!((study.topIntervention || "").trim() || (study.intervention || "").trim())) missing.push("intervention")
  if (!((study.topComparator || "").trim() || (study.comparator || "").trim())) missing.push("comparator")
  if (!(study.primaryObjective || "").trim()) missing.push("primary objective")
  if (!getResolvedOutcomes(study)) missing.push("endpoints")
  if (!(study.subcategory || study.category || "").trim()) missing.push("study type")

  return missing
}

function scoreToImpact(score: number): AnalysisImpact {
  if (score >= 70) return "high"
  if (score >= 40) return "medium"
  return "low"
}

function buildImpactAssessmentFromStudy(study: StudyForm): ImpactAssessment {
  const strategicObjective = getStrategicObjectiveLabel(study).toLowerCase()
  const evidenceIntent = getPrimaryEvidenceUseIntent(study).toLowerCase()
  const developmentStage = (study.developmentStage || "").toLowerCase()
  const subtype = (study.subcategory || "").toLowerCase()
  const category = (study.category || "").toLowerCase()
  const comparator = ((study.topComparator || "").trim() || study.comparator || "").toLowerCase()
  const outcomesText = getResolvedOutcomes(study).toLowerCase()
  const objectiveText = (study.primaryObjective || "").toLowerCase()
  const designText = `${study.designOverview} ${study.subcategory} ${study.category}`.toLowerCase()
  const sampleSize = parsePlannedSampleTotal(study.sampleSize)

  const isInterventional = category === "interventional"
  const isObservational = category === "non-interventional"
  const isEvidenceSynthesis = category === "evidence-synthesis"
  const isNonClinical = category === "non-clinical"
  const randomized = /rct|random/i.test(subtype) || /random/i.test(designText)
  const nonRandomized = /non-random/i.test(subtype) || /single-arm|single arm|uncontrolled/i.test(designText)
  const activeComparator = /standard of care|soc|active comparator|investigator|head-to-head|versus| vs |against /.test(comparator)
  const placeboComparator = /placebo/.test(comparator)
  const externalComparator = /historical|external|synthetic|real-world comparator|real world comparator/.test(comparator)
  const explicitComparator = Boolean(comparator.trim())
  const decisionEndpoints = /overall survival|mortality|progression|disease[- ]?free|event[- ]?free|hospitalization|response|remission|blood pressure|clinical remission|endoscopic|pasi|easi|arr|bleeding/.test(
    `${objectiveText} ${outcomesText}`,
  )
  const surrogateHeavy = /biomarker|pharmacodynamic|pk|pd|exposure-response|exposure response|surrogate/.test(
    outcomesText,
  ) && !decisionEndpoints
  const proSupport = /quality of life|patient-reported|patient reported|symptom|pro|kccq|pruritus/.test(outcomesText)
  const utilizationSupport = /resource utilization|healthcare resource|hospitalization|cost|payer|hta/.test(outcomesText)
  const labelIntent = /label|regulatory/.test(strategicObjective)
  const htaIntent = /hta|market access/.test(strategicObjective)
  const practiceIntent = /clinical practice|uptake|market share/.test(strategicObjective)
  const publicationIntent = /publication/.test(strategicObjective)
  const labelDestination = /label|regulatory/.test(evidenceIntent)
  const htaDestination = /hta|market access/.test(evidenceIntent)
  const practiceDestination = /guideline|practice/.test(evidenceIntent)
  const publicationDestination = /publication/.test(evidenceIntent)
  const phaseThreeOrFour = /phase 3|phase 4|post-marketing/.test(developmentStage)
  const sampleHint = sampleSize ?? 0
  const moderateSample = sampleHint >= 150
  const largeSample = sampleHint >= 300

  const score = (base: number, adjustments: number[]) => clampScore(base + adjustments.reduce((sum, item) => sum + item, 0))

  const guidelineScore = score(24, [
    isInterventional ? 12 : 0,
    isEvidenceSynthesis ? 18 : 0,
    randomized ? 16 : 0,
    nonRandomized ? -10 : 0,
    activeComparator ? 16 : placeboComparator ? 6 : externalComparator ? -4 : explicitComparator ? 2 : -10,
    decisionEndpoints ? 16 : 0,
    surrogateHeavy ? -16 : 0,
    moderateSample ? 8 : sampleHint > 0 ? -4 : -2,
    largeSample ? 4 : 0,
    practiceIntent || practiceDestination ? 5 : 0,
    phaseThreeOrFour && isInterventional ? 6 : 0,
  ])

  const labelScore = score(18, [
    isInterventional ? 18 : isEvidenceSynthesis || isObservational ? -12 : -18,
    randomized ? 14 : 0,
    nonRandomized ? -12 : 0,
    activeComparator ? 14 : placeboComparator ? 8 : externalComparator ? -8 : explicitComparator ? 2 : -12,
    decisionEndpoints ? 14 : 0,
    surrogateHeavy ? -18 : 0,
    labelIntent || labelDestination ? 18 : 0,
    moderateSample ? 8 : sampleHint > 0 ? -3 : -2,
    largeSample ? 4 : 0,
    phaseThreeOrFour && isInterventional ? 10 : -4,
  ])

  const publicationScore = score(52, [
    isNonClinical ? 10 : 0,
    isEvidenceSynthesis ? 12 : 0,
    randomized ? 6 : 0,
    decisionEndpoints ? 5 : 0,
    proSupport ? 4 : 0,
    publicationIntent || publicationDestination ? 10 : 0,
    sampleHint > 0 ? 4 : 0,
    surrogateHeavy ? 2 : 0,
  ])

  const practiceScore = score(28, [
    isInterventional ? 10 : isObservational ? 8 : isEvidenceSynthesis ? 8 : -6,
    randomized ? 8 : 0,
    activeComparator ? 14 : placeboComparator ? 4 : externalComparator ? 2 : explicitComparator ? 0 : -8,
    decisionEndpoints ? 10 : 0,
    proSupport ? 12 : 0,
    utilizationSupport ? 4 : 0,
    practiceIntent || practiceDestination ? 14 : 0,
    surrogateHeavy ? -8 : 0,
    /phase 4|post-marketing/.test(developmentStage) ? 6 : 0,
  ])

  const htaScore = score(20, [
    isInterventional || isObservational ? 8 : isEvidenceSynthesis ? 10 : -8,
    activeComparator ? 16 : placeboComparator ? 4 : externalComparator ? 6 : explicitComparator ? 0 : -8,
    proSupport ? 10 : 0,
    utilizationSupport ? 10 : 0,
    htaIntent || htaDestination ? 18 : 0,
    largeSample ? 6 : moderateSample ? 3 : 0,
    surrogateHeavy ? -8 : 0,
  ])

  const domains: ImpactAssessmentDomain[] = [
    {
      id: "guideline",
      label: "Guideline impact",
      score: guidelineScore,
      impact: scoreToImpact(guidelineScore),
      rationale:
        guidelineScore >= 70
          ? "The current design is comparatively strong for guideline influence because it already points to comparative, decision-relevant evidence."
          : guidelineScore >= 40
            ? "The current concept could inform guidelines, but comparator, endpoint, or design strength still needs tightening."
            : "At the current design stage, this concept looks weak for substantial guideline influence without stronger comparative and endpoint support.",
    },
    {
      id: "label",
      label: "Label relevance",
      score: labelScore,
      impact: scoreToImpact(labelScore),
      rationale:
        labelScore >= 70
          ? "The current concept has plausible label-supportive potential because the design, comparator, and endpoints are directionally aligned."
          : labelScore >= 40
            ? "The study may contribute label-relevant evidence, but the current setup is not yet strong enough to rely on for that use case."
            : "The current setup looks more supportive or exploratory than directly label-relevant.",
    },
    {
      id: "publication",
      label: "Scientific publication value",
      score: publicationScore,
      impact: scoreToImpact(publicationScore),
      rationale:
        publicationScore >= 70
          ? "Even at this early stage, the concept looks publication-worthy if execution quality and final methodology are adequate."
          : publicationScore >= 40
            ? "The study has publishable potential, but the scientific story will depend on sharpening the objective and endpoint package."
            : "Publication value is still weak because the core scientific question is not yet sufficiently differentiated or mature.",
    },
    {
      id: "practice",
      label: "Clinical practice influence",
      score: practiceScore,
      impact: scoreToImpact(practiceScore),
      rationale:
        practiceScore >= 70
          ? "The current direction is well positioned to influence routine practice if the study executes as designed."
          : practiceScore >= 40
            ? "The concept could influence clinical practice, but it needs stronger patient-relevant or comparative support."
            : "The current design is unlikely to change routine practice materially without more decision-relevant evidence.",
    },
    {
      id: "hta",
      label: "HTA / access relevance",
      score: htaScore,
      impact: scoreToImpact(htaScore),
      rationale:
        htaScore >= 70
          ? "The concept looks directionally useful for HTA or access discussions because it includes comparative and stakeholder-relevant evidence elements."
          : htaScore >= 40
            ? "The concept has some HTA or access relevance, but it is not yet carrying enough comparative, quality-of-life, or utilization support."
            : "The current design looks weak for HTA or access impact because payer-relevant evidence is still limited.",
    },
  ]

  const blockers = uniqueItemsCaseInsensitive(
    [
      !explicitComparator
        ? "Comparator strategy is still underdefined, which limits confidence in guideline, practice, and label impact."
        : activeComparator
          ? ""
          : externalComparator
            ? "The comparator relies on external or historical logic, which usually weakens direct guideline or label influence."
            : "",
      !decisionEndpoints
        ? "The endpoint package is not yet clearly framed around decision-relevant clinical outcomes."
        : surrogateHeavy
          ? "The endpoint package appears surrogate-heavy, which can weaken downstream guideline or label influence."
          : "",
      !sampleHint
        ? "Planned sample size has not been framed yet, so evidence strength and feasibility remain harder to judge."
        : sampleHint < 100
          ? "The currently entered sample size looks small for high-impact claims unless the effect is very strong."
          : "",
      (labelIntent || labelDestination) && !isInterventional
        ? "The strategic objective mentions label impact, but the current study category is not naturally aligned to direct label-supportive evidence."
        : "",
      phaseThreeOrFour && labelDestination && !randomized
        ? "A Phase 3/4 study declared for label support usually needs stronger comparative rigor than the current setup signals."
        : "",
      (practiceIntent || htaIntent || practiceDestination || htaDestination) && !proSupport && !utilizationSupport
        ? "The design does not yet show patient-centered or payer-relevant support that would strengthen practice or HTA value."
        : "",
    ].filter(Boolean),
  ).slice(0, 4)

  const strengthenActions = uniqueItemsCaseInsensitive(
    [
      !activeComparator ? "Strengthen the comparator strategy, ideally with an active or standard-of-care comparison when scientifically appropriate." : "",
      !decisionEndpoints ? "Anchor the primary endpoint to a clinically decision-relevant outcome, not only exploratory or mechanistic readouts." : "",
      surrogateHeavy ? "Move biomarker-heavy endpoints into supporting roles unless the target impact is mainly exploratory or mechanistic." : "",
      !sampleHint ? "Frame an initial sample-size range so the likely evidence strength can be judged earlier." : "",
      (labelIntent || labelDestination) && !randomized
        ? "If label relevance matters, consider whether a randomized or otherwise stronger comparative design is needed."
        : "",
      phaseThreeOrFour && practiceDestination && !proSupport
        ? "If the study is intended to inform practice or guidelines, add patient-centered outcomes that make the results easier to translate into routine care."
        : "",
      (practiceIntent || htaIntent || practiceDestination || htaDestination) && !proSupport
        ? "Add a patient-centered outcome such as quality of life or symptom burden to strengthen real-world interpretability."
        : "",
      (htaIntent || htaDestination) && !utilizationSupport
        ? "Add healthcare-resource or utilization-supportive evidence if HTA or access impact is a real objective."
        : "",
    ].filter(Boolean),
  ).slice(0, 5)

  const strongest = [...domains].sort((left, right) => right.score - left.score)[0]
  const weakest = [...domains].sort((left, right) => left.score - right.score)[0]

  return normalizeImpactAssessment({
    generatedAt: new Date().toISOString(),
    provenance: "local_draft",
    executiveSummary: `Based on the current Tab 1 inputs, this concept looks strongest for ${strongest.label.toLowerCase()} and weakest for ${weakest.label.toLowerCase()}. Treat this as an early design-stage evidence impact view, not a prediction of regulatory, guideline, or payer outcomes.`,
    domains,
    blockers,
    strengthenActions,
  })
}

function elevateAlignmentStatus(
  current: SuggestionAlignmentStatus,
  next: SuggestionAlignmentStatus,
): SuggestionAlignmentStatus {
  const priority: Record<SuggestionAlignmentStatus, number> = {
    aligned: 0,
    partially_aligned: 1,
    conflicts: 2,
  }

  return priority[next] > priority[current] ? next : current
}

function buildObjectiveAlignment(study: StudyForm, draft: ObjectiveSuggestionDraft, requestNote = ""): SuggestionAlignment {
  const text = `${draft.primaryObjective} ${draft.secondaryObjectives.join(" ")} ${draft.designOverview}`.toLowerCase()
  const request = requestNote.toLowerCase()
  const strategicObjective = getStrategicObjectiveLabel(study).toLowerCase()
  const evidenceIntent = getPrimaryEvidenceUseIntent(study).toLowerCase()
  const disease = getSelectedDiseaseLabel(study).toLowerCase()
  const intervention = ((study.topIntervention || "").trim() || study.intervention || "").toLowerCase()
  const currentComparator = ((study.topComparator || "").trim() || study.comparator || "").trim()
  const requestedComparator = extractRequestedComparator(requestNote)
  const concerns: string[] = []
  const recommendations: string[] = []
  let status: SuggestionAlignmentStatus = "aligned"

  if (disease && !text.includes(disease)) {
    status = elevateAlignmentStatus(status, "partially_aligned")
    concerns.push("The proposal does not explicitly anchor the objective to the selected disease or indication.")
    recommendations.push("Restate the selected disease or indication directly in the primary objective.")
  }

  if (intervention && !text.includes(intervention)) {
    status = elevateAlignmentStatus(status, "partially_aligned")
    concerns.push("The proposal weakens the link to the selected intervention or drug.")
    recommendations.push("Name the selected intervention explicitly so downstream endpoint and population logic stays coherent.")
  }

  if (/dose modification|dose optimization/.test(strategicObjective) && !/dose|safety|tolerability|exposure/.test(text)) {
    status = elevateAlignmentStatus(status, "partially_aligned")
    concerns.push("The strategic objective is dose-related, but the proposal does not clearly address dose, safety, or exposure.")
    recommendations.push("Include dose intensity, tolerability, exposure-response, or safety support in the objective package.")
  }

  if (/market access|hta|inform clinical practice/.test(strategicObjective) && !/comparative|quality of life|patient-reported|resource|effectiveness/.test(text)) {
    status = elevateAlignmentStatus(status, "partially_aligned")
    concerns.push("The proposal is lighter on decision-oriented or practice-relevant evidence than the stated strategic objective suggests.")
    recommendations.push("Consider adding comparative, patient-reported, or utilization-supportive secondary objectives.")
  }

  if (/label|regulatory/.test(evidenceIntent) && !/comparative|versus|against|superiority|non-inferiority|noninferiority/.test(text)) {
    status = elevateAlignmentStatus(status, "partially_aligned")
    concerns.push("The objective package does not yet read like a comparator-disciplined evidence package, which weakens fit for label-oriented use.")
    recommendations.push("Make the comparator logic and claim-supportive objective language more explicit.")
  }

  if (/guideline|practice/.test(evidenceIntent) && !/clinically|practice|patient|quality of life|comparative|meaningful/.test(text)) {
    status = elevateAlignmentStatus(status, "partially_aligned")
    concerns.push("The objective package underweights clinical-practice interpretability for a guideline or practice-informing intent.")
    recommendations.push("Add clinically meaningful and practice-relevant support to the objective package.")
  }

  if (/healthy volunteer|healthy subjects?|normal volunteers?/.test(request) && disease) {
    status = elevateAlignmentStatus(status, "conflicts")
    concerns.push("The request asks for a healthy-volunteer direction, which conflicts with the currently selected disease-specific study context.")
    recommendations.push("Switch the disease context before pursuing a healthy-volunteer objective, or keep the proposal disease-specific.")
  }

  if (/(single-arm|single arm|no comparator|without comparator)/.test(request) && study.category === "interventional") {
    const comparator = ((study.topComparator || "").trim() || study.comparator || "").trim()
    if (comparator && study.subcategory !== "Non-Randomized Study") {
      status = elevateAlignmentStatus(status, "conflicts")
      concerns.push("The request removes the comparator logic, but the current study setup still points to a comparator-based interventional design.")
      recommendations.push("Either change the study subtype to a non-randomized design or keep comparator support in the objective package.")
    }
  }

  if (/(biomarker only|surrogate only|exploratory only)/.test(request) && /label|clinical practice|market access|hta/.test(strategicObjective)) {
    status = elevateAlignmentStatus(status, "conflicts")
    concerns.push("The request narrows the objective package to exploratory evidence that is unlikely to support the current strategic objective.")
    recommendations.push("Keep at least one clinically decision-relevant objective and move biomarker emphasis into secondary or exploratory objectives.")
  }

  if (
    requestedComparator &&
    currentComparator &&
    normalizeOptionText(requestedComparator) !== normalizeOptionText(currentComparator) &&
    text.includes(requestedComparator.toLowerCase())
  ) {
    status = elevateAlignmentStatus(status, "partially_aligned")
    concerns.push(`The option reflects the requested comparator ${requestedComparator}, but the saved study comparator is still ${currentComparator}.`)
    recommendations.push("Update the Comparator field as well if you want the whole workflow to use the new comparator consistently.")
  } else if (
    requestedComparator &&
    currentComparator &&
    normalizeOptionText(requestedComparator) !== normalizeOptionText(currentComparator) &&
    !text.includes(requestedComparator.toLowerCase())
  ) {
    status = elevateAlignmentStatus(status, "partially_aligned")
    concerns.push(`The requested comparator shift to ${requestedComparator} was not carried through clearly into the regenerated objective package.`)
    recommendations.push("Regenerate again or update the Comparator field directly before asking AI to draft the objective package.")
  }

  return {
    status,
    summary:
      status === "aligned"
        ? "This option is consistent with the current study context and can be taken forward directly."
        : status === "partially_aligned"
          ? "This option is usable, but some parts should be tightened before it becomes the working objective package."
          : "This option pushes back on the requested direction because it conflicts with the current study setup.",
    concerns,
    recommendations,
  }
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

function buildObjectiveSuggestionOptionsFromStudy(
  study: StudyForm,
  requestNote = "",
): { primary: ObjectiveSuggestionDraft; alternatives: ObjectiveSuggestionDraft[]; guidance: string } {
  const strategicObjective = getStrategicObjectiveLabel(study) || "support the study program"
  const evidenceIntent = getPrimaryEvidenceUseIntent(study) || "the intended evidence destination"
  const developmentStage = (study.developmentStage || "the current development stage").trim()
  const disease = getSelectedDiseaseLabel(study) || "the target disease"
  const endpoints = getAllChosenEndpoints(study)
  const primaryEndpoint = endpoints[0] || "the primary clinical outcome"
  const intervention = (study.topIntervention || "").trim() || study.intervention || "the proposed intervention"
  const requestedComparator = extractRequestedComparator(requestNote)
  const comparator = requestedComparator || (study.topComparator || "").trim() || study.comparator || "the relevant comparator"
  const lineOfTherapy = (study.topLineOfTherapy || "").trim()
  const settingText = lineOfTherapy ? ` in the ${lineOfTherapy} setting` : ""
  const requestSentence = requestNote.trim() ? ` Requested shift: ${requestNote.trim()}.` : ""
  const htaOrAccessIntent = /market access|hta/i.test(`${strategicObjective} ${evidenceIntent}`)
  const practiceIntent = /guideline|practice|inform clinical practice/i.test(`${strategicObjective} ${evidenceIntent}`)
  const labelIntent = /label|regulatory/i.test(evidenceIntent)
  const focusedSecondaryObjectives = uniqueItemsCaseInsensitive(
    [
      `Characterize safety and tolerability of ${intervention}.`,
      htaOrAccessIntent ? "Assess health-related quality of life or symptom burden with patient-reported outcomes." : "",
      htaOrAccessIntent ? "Assess healthcare resource utilization or treatment-pattern consequences relevant to payer decisions." : "",
      practiceIntent ? "Assess clinically meaningful and patient-relevant supportive outcomes that strengthen routine-practice interpretation." : "",
      labelIntent ? `Assess key supportive outcomes that strengthen interpretability of ${primaryEndpoint.toLowerCase()}.` : "",
      /dose modification/i.test(strategicObjective)
        ? `Assess dose intensity, treatment modification, and tolerability support for ${intervention}.`
        : `Assess decision-relevant subgroup findings for ${intervention}.`,
    ].filter(Boolean),
  )

  const balanced: ObjectiveSuggestionDraft = {
    label: "Balanced evidence option",
    positioning: "Closest fit to the current study inputs and strategic objective.",
    primaryObjective: `Evaluate the comparative clinical effectiveness of ${intervention} versus ${comparator} in ${disease}${settingText} by assessing ${primaryEndpoint}.`,
    secondaryObjectives: uniqueItemsCaseInsensitive(
      endpoints.slice(1, 4).map((endpoint) => `Assess ${endpoint.toLowerCase()} as a key supporting outcome.`).concat(focusedSecondaryObjectives),
    ),
    designOverview:
      study.designOverview ||
      `Draft a ${study.subcategory || study.category || "fit-for-purpose"} comparative design in ${disease}${settingText} at ${developmentStage}, evaluating ${intervention} against ${comparator} with an assessment package suited to ${evidenceIntent.toLowerCase()}.${requestSentence}`,
    alignment: emptySuggestionAlignment,
  }

  const pragmatic: ObjectiveSuggestionDraft = {
    label: "Pragmatic feasibility option",
    positioning: "Lower-burden framing to support execution and operational realism.",
    primaryObjective: `Estimate the comparative effect of ${intervention} versus ${comparator} in ${disease}${settingText} using ${primaryEndpoint} within an operationally feasible study design.`,
    secondaryObjectives: uniqueItemsCaseInsensitive([
      `Characterize safety and tolerability of ${intervention} in the intended care setting.`,
      htaOrAccessIntent
        ? "Assess one patient-centered and one utilization-relevant supportive outcome without over-expanding the assessment burden."
        : "Assess clinically meaningful supportive outcomes without over-expanding the assessment burden.",
      "Assess treatment persistence, feasibility, and other supportive outcomes needed to interpret the primary result.",
    ]),
    designOverview: `Use a ${study.subcategory || study.category || "fit-for-purpose"} design in ${disease}${settingText} that preserves the comparator logic while keeping the assessment package realistic for execution and still useful for ${evidenceIntent.toLowerCase()} at ${developmentStage}.${requestSentence}`,
    alignment: emptySuggestionAlignment,
  }

  const assertive: ObjectiveSuggestionDraft = {
    label: requestNote.trim() ? "Requested alternative" : "Assertive differentiation option",
    positioning: requestNote.trim()
      ? `Shaped around the requested direction: ${requestNote.trim()}`
      : "More ambitious framing for differentiation, label support, or strategic visibility.",
    primaryObjective: `Demonstrate superior or differentiated clinical benefit of ${intervention} versus ${comparator} in ${disease}${settingText} through ${primaryEndpoint}.`,
    secondaryObjectives: uniqueItemsCaseInsensitive([
      `Quantify the breadth and durability of benefit beyond ${primaryEndpoint.toLowerCase()}.`,
      htaOrAccessIntent
        ? "Strengthen interpretation with patient-reported, safety, and utilization-relevant supportive outcomes."
        : `Strengthen interpretation with safety and clinically meaningful supportive outcomes for ${intervention}.`,
      /dose modification/i.test(strategicObjective)
        ? `Assess dose intensity, tolerability, and exposure-response support for ${intervention}.`
        : `Assess subgroup consistency and other supportive evidence relevant to ${intervention}.`,
    ]),
    designOverview: `Position the study as a ${study.subcategory || study.category || "fit-for-purpose"} comparative evidence package in ${disease}${settingText}, retaining coherence with the current intervention, comparator, strategic intent, and the declared evidence destination at ${developmentStage}.${requestSentence}`,
    alignment: emptySuggestionAlignment,
  }

  const options = [balanced, pragmatic, assertive].map((option) => ({
    ...option,
    alignment: buildObjectiveAlignment(study, option, requestNote),
  }))

  return {
    primary: options[0],
    alternatives: options.slice(1),
    guidance: requestNote.trim()
      ? "The request was used to shape the options, but options that conflict with the current study setup are flagged explicitly."
      : "Three objective packages were drafted: balanced, pragmatic, and more assertive, all shaped to the declared evidence destination.",
  }
}

function buildObjectiveSuggestionFromStudy(study: StudyForm, requestNote = "") {
  return buildObjectiveSuggestionOptionsFromStudy(study, requestNote).primary
}

function buildEndpointAlignment(study: StudyForm, draft: EndpointSuggestionDraft, requestNote = ""): SuggestionAlignment {
  const text = `${draft.primaryEndpoint} ${draft.secondaryEndpoints.join(" ")} ${draft.exploratoryEndpoints.join(" ")} ${
    draft.rationale
  }`.toLowerCase()
  const objective = (study.primaryObjective || "").toLowerCase()
  const strategicObjective = getStrategicObjectiveLabel(study).toLowerCase()
  const evidenceIntent = getPrimaryEvidenceUseIntent(study).toLowerCase()
  const request = requestNote.toLowerCase()
  const concerns: string[] = []
  const recommendations: string[] = []
  let status: SuggestionAlignmentStatus = "aligned"

  if (/overall survival|mortality/.test(objective) && !/survival|mortality/.test(draft.primaryEndpoint.toLowerCase())) {
    status = elevateAlignmentStatus(status, "partially_aligned")
    concerns.push("The current primary objective is survival-oriented, but the proposed primary endpoint is not clearly survival-based.")
    recommendations.push("Use a survival endpoint as primary or explain why a surrogate endpoint is acceptable for this objective.")
  }

  if (/progression|disease[- ]?free|event[- ]?free|relapse/.test(objective) && !/progression|disease[- ]?free|event[- ]?free|relapse/.test(draft.primaryEndpoint.toLowerCase())) {
    status = elevateAlignmentStatus(status, "partially_aligned")
    concerns.push("The endpoint package does not map tightly to the disease-control logic of the current primary objective.")
    recommendations.push("Bring progression, relapse, or event-based support into the primary endpoint if the objective is disease-control focused.")
  }

  if (/quality of life|symptom|patient-reported/.test(objective) && !/quality of life|patient-reported|symptom|pro/.test(text)) {
    status = elevateAlignmentStatus(status, "partially_aligned")
    concerns.push("The objective is patient-centered, but the endpoint package underweights patient-reported or symptom measures.")
    recommendations.push("Add a patient-reported or symptom-focused endpoint to keep the endpoint package coherent.")
  }

  if (/market access|hta|inform clinical practice/.test(strategicObjective) && !/quality of life|patient-reported|resource|utilization|comparative/.test(text)) {
    status = elevateAlignmentStatus(status, "partially_aligned")
    concerns.push("The endpoint package is lighter on real-world or stakeholder-relevant evidence than the strategic objective suggests.")
    recommendations.push("Consider adding quality-of-life, utilization, or comparative interpretability support.")
  }

  if (/dose modification|dose optimization/.test(strategicObjective) && !/safety|tolerability|dose|exposure/.test(text)) {
    status = elevateAlignmentStatus(status, "partially_aligned")
    concerns.push("A dose-related strategic objective usually needs safety, tolerability, or exposure-response support in the endpoint package.")
    recommendations.push("Add exposure-safety or dose-intensity support to the selected endpoint set.")
  }

  if (/label|regulatory/.test(evidenceIntent) && !/primary|survival|progression|response|remission|blood pressure|endoscopic|clinical/.test(draft.primaryEndpoint.toLowerCase())) {
    status = elevateAlignmentStatus(status, "partially_aligned")
    concerns.push("The selected primary endpoint does not yet look robust enough for a label-oriented evidence destination.")
    recommendations.push("Use a claim-relevant primary endpoint and keep exploratory readouts in supporting roles.")
  }

  if (/guideline|practice/.test(evidenceIntent) && !/quality of life|patient-reported|symptom|comparative|hospitalization|clinical/.test(text)) {
    status = elevateAlignmentStatus(status, "partially_aligned")
    concerns.push("The endpoint package is light on practice-relevant or patient-centered support for a guideline or practice-informing study.")
    recommendations.push("Add patient-centered or practice-relevant endpoints if that is the intended evidence destination.")
  }

  if (/(biomarker only|surrogate only|exploratory only)/.test(request) && /label|clinical practice|market access|hta/.test(strategicObjective)) {
    status = elevateAlignmentStatus(status, "conflicts")
    concerns.push("The requested endpoint direction is too exploratory to cleanly support the current strategic objective.")
    recommendations.push("Keep one clinically decision-relevant primary endpoint and move biomarker endpoints into secondary or exploratory roles.")
  }

  if (/(safety only|tolerability only)/.test(request) && /survival|progression|response|quality of life|symptom/.test(objective)) {
    status = elevateAlignmentStatus(status, "conflicts")
    concerns.push("The request strips out efficacy-oriented support that the current objective still depends on.")
    recommendations.push("Retain an efficacy endpoint aligned to the objective and treat safety-only requests as supporting refinements.")
  }

  return {
    status,
    summary:
      status === "aligned"
        ? "This endpoint package fits the current objective and study context."
        : status === "partially_aligned"
          ? "This endpoint package is directionally useful, but it leaves some gaps against the current objective or strategy."
          : "This endpoint package pushes back on the requested direction because it weakens support for the current study logic.",
    concerns,
    recommendations,
  }
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

  if (/dose modification|dose optimization|safety/.test(strategicObjective) && /safety|tolerability|dose|exposure/.test(text)) {
    score += 4
  }

  if (/biomarker|molecular|subgroup/.test(text)) score -= 2
  if (/experience|satisfaction/.test(text)) score -= 1

  return score
}

function prioritizeFocusedEndpoints(
  endpoints: string[],
  objective: string,
  strategicObjective: string,
  evidenceIntent: string,
  limit: number,
) {
  const uniqueEndpoints = uniqueItemsCaseInsensitive(endpoints).filter(Boolean)
  const ranked = [...uniqueEndpoints].sort((left, right) => {
    const scoreDelta =
      scoreEndpointCandidate(right, objective, strategicObjective, evidenceIntent) -
      scoreEndpointCandidate(left, objective, strategicObjective, evidenceIntent)

    if (scoreDelta !== 0) {
      return scoreDelta
    }

    return left.localeCompare(right)
  })

  return ranked.slice(0, limit)
}

function buildEndpointSuggestionOptionsFromStudy(
  study: StudyForm,
  requestNote = "",
): { primary: EndpointSuggestionDraft; alternatives: EndpointSuggestionDraft[]; guidance: string } {
  const disease = getSelectedDiseaseLabel(study) || "the target disease"
  const objective = (study.primaryObjective || "").toLowerCase()
  const strategicObjective = getStrategicObjectiveLabel(study) || "the study strategy"
  const evidenceIntent = getPrimaryEvidenceUseIntent(study) || "the intended evidence destination"
  const developmentStage = (study.developmentStage || "the current development stage").trim()
  const guidedEndpoints = getGuidedEndpointsForStudy(study)
  const defaultPool = guidedEndpoints.length
    ? guidedEndpoints
    : ["Primary efficacy outcome", "Safety and tolerability", "Quality of life", "Biomarker response"]
  const endpointContext = `${strategicObjective} ${evidenceIntent}`.toLowerCase()

  const matchFromPool = (patterns: RegExp[], fallbackIndex = 0) =>
    defaultPool.find((endpoint) => patterns.some((pattern) => pattern.test(endpoint.toLowerCase()))) || defaultPool[fallbackIndex]

  const primaryEndpoint =
    /overall survival/.test(objective)
      ? matchFromPool([/overall survival/, /all-cause mortality/])
      : /progression|disease[- ]?free|event[- ]?free|relapse/.test(objective)
        ? matchFromPool([/progression/, /disease-free/, /event-free/])
        : /response|remission|control rate|objective response/.test(objective)
          ? matchFromPool([/response/, /remission/, /control rate/])
          : /quality of life|symptom|patient-reported|questionnaire|kccq|pruritus/.test(objective)
            ? matchFromPool([/quality of life/, /patient-reported/, /symptom/, /kccq/, /pruritus/])
            : defaultPool[0]

  const focusedSupportPool = uniqueItemsCaseInsensitive(
    defaultPool.filter((endpoint) => endpoint !== primaryEndpoint).concat(
      /market access|hta/.test(endpointContext) ? ["Healthcare resource utilization"] : [],
      /guideline|practice|patient/.test(endpointContext) ? ["Quality of life or symptom burden"] : [],
      /dose modification|dose optimization|safety/.test(strategicObjective.toLowerCase())
        ? ["Safety and tolerability"]
        : [],
      /label|regulatory/.test(evidenceIntent.toLowerCase()) ? ["Durability of benefit"] : [],
    ),
  )
  const secondaryEndpoints = prioritizeFocusedEndpoints(
    focusedSupportPool,
    objective,
    strategicObjective.toLowerCase(),
    evidenceIntent.toLowerCase(),
    2,
  )

  const exploratoryCandidates = [
    /oncology|tumou?r|biomarker/.test(`${study.therapeuticArea} ${study.topInterventionClass}`.toLowerCase())
      ? "Biomarker-defined subgroup response"
      : "Decision-relevant subgroup effect",
    /safety|dose modification/.test(strategicObjective.toLowerCase()) ? "Exposure-safety relationship" : "",
    /market access|hta|guideline|practice/.test(endpointContext) ? "Supportive patient-reported experience" : "",
  ].filter(Boolean)
  const exploratoryEndpoints =
    /biomarker|subgroup|dose|exploratory|mechanistic/.test(requestNote.toLowerCase()) ||
    /oncology|tumou?r|biomarker|dose/.test(`${study.therapeuticArea} ${study.topInterventionClass} ${strategicObjective}`.toLowerCase())
      ? prioritizeFocusedEndpoints(
          exploratoryCandidates.filter((endpoint) => endpoint !== primaryEndpoint && !secondaryEndpoints.includes(endpoint)),
          objective,
          strategicObjective.toLowerCase(),
          evidenceIntent.toLowerCase(),
          1,
        )
      : []

  const balanced: EndpointSuggestionDraft = {
    label: "Balanced endpoint package",
    positioning: "Closest fit to the current objective and disease context.",
    primaryEndpoint,
    secondaryEndpoints,
    exploratoryEndpoints,
    rationale: `The endpoint set is aligned to the objective in ${disease}, the planned ${study.subcategory || study.category || "study"} design, and the evidence destination of ${evidenceIntent.toLowerCase()} at ${developmentStage}.`,
    alignment: emptySuggestionAlignment,
  }

  const pragmatic: EndpointSuggestionDraft = {
    label: "Pragmatic endpoint package",
    positioning: "Lower-burden package emphasizing interpretable core endpoints.",
    primaryEndpoint,
    secondaryEndpoints: uniqueItemsCaseInsensitive(
      secondaryEndpoints.slice(0, 1).concat(
        /quality of life|patient-reported|symptom/.test(objective) ? [] : ["Quality of life or symptom burden"],
      ),
    ).slice(0, 2),
    exploratoryEndpoints: [],
    rationale: `This package keeps the primary endpoint intact but trims supporting endpoints to the minimum needed to answer the research question in ${disease} without creating unnecessary data-collection burden for ${evidenceIntent.toLowerCase()}.`,
    alignment: emptySuggestionAlignment,
  }

  const assertivePrimary =
    defaultPool.find((endpoint) => /overall survival|progression|disease-free|event-free|response|quality of life/i.test(endpoint)) ||
    primaryEndpoint

  const assertive: EndpointSuggestionDraft = {
    label: requestNote.trim() ? "Requested alternative package" : "Assertive endpoint package",
    positioning: requestNote.trim()
      ? `Shaped around the requested direction: ${requestNote.trim()}`
      : "Broader package for a more ambitious or differentiation-oriented evidence story.",
    primaryEndpoint: assertivePrimary,
    secondaryEndpoints: uniqueItemsCaseInsensitive(
      secondaryEndpoints.concat([
        /market access|hta|inform clinical practice/i.test(strategicObjective)
          ? "Healthcare resource utilization"
          : "Durability of benefit",
      ]),
    ).slice(0, 2),
    exploratoryEndpoints: uniqueItemsCaseInsensitive(
      exploratoryEndpoints.concat([
        /oncology|tumou?r|biomarker/.test(`${study.therapeuticArea} ${study.topInterventionClass}`.toLowerCase())
          ? "Molecularly defined subgroup response"
          : "Extended subgroup consistency",
      ]),
    ).slice(0, 1),
    rationale: `This option stretches the endpoint package only where it materially strengthens the decision story for ${evidenceIntent.toLowerCase()}, while avoiding a broad laundry list that would bloat data collection in ${disease}.`,
    alignment: emptySuggestionAlignment,
  }

  const options = [balanced, pragmatic, assertive].map((option) => ({
    ...option,
    alignment: buildEndpointAlignment(study, option, requestNote),
  }))

  return {
    primary: options[0],
    alternatives: options.slice(1),
    guidance: requestNote.trim()
      ? "The request was used to shape the endpoint packages, but any misalignment with the current objective or strategy is flagged."
      : "Three focused endpoint packages were drafted: balanced, pragmatic, and more assertive. Each is intentionally lean to answer the research question without avoidable data-collection bloat.",
  }
}

function buildEndpointSuggestionFromStudy(study: StudyForm, requestNote = ""): EndpointSuggestionDraft {
  return buildEndpointSuggestionOptionsFromStudy(study, requestNote).primary
}

function buildPopulationSuggestionFromStudy(study: StudyForm): PopulationSuggestionDraft {
  const disease = getSelectedDiseaseLabel(study) || "the target disease"
  const intervention = (study.topIntervention || "").trim() || study.intervention || "the proposed intervention"
  const evidenceIntent = getPrimaryEvidenceUseIntent(study) || "the intended evidence destination"
  const lineOfTherapy = (study.topLineOfTherapy || "").trim()
  const endpointsText = getResolvedOutcomes(study).toLowerCase()
  const measurableDiseaseClause = /response|imaging|tumou?r|lesion|mri|ct|pet/.test(endpointsText)
    ? "measurable or evaluable disease per protocol-defined criteria"
    : "disease characteristics compatible with the planned endpoint package"
  const adultClause = study.category === "non-clinical" ? "Target specimens or models" : "Adults"
  const lineClause = lineOfTherapy ? ` in the ${lineOfTherapy} setting` : ""

  return {
    population: `${adultClause} with ${disease}${lineClause} for whom ${intervention} is clinically relevant, including the decision-making population needed for the study objective and the evidence destination of ${evidenceIntent.toLowerCase()}.`,
    eligibility: [
      `${disease} confirmed according to standard diagnostic criteria`,
      measurableDiseaseClause,
      "Baseline clinical status sufficient for protocol participation and endpoint evaluation",
      "Key exclusions should address major confounding comorbidities, prior therapy restrictions, and any safety-related contraindications",
    ].join("\n"),
    rationale: `The population draft is designed to support ${study.primaryObjective || "the current objective"} while remaining coherent with the declared evidence destination of ${evidenceIntent.toLowerCase()}.`,
  }
}

function extractNumberTokens(value: string) {
  return Array.from(value.matchAll(/-?\d*\.?\d+/g))
    .map((match) => Number(match[0]))
    .filter((number) => Number.isFinite(number))
}

function buildNumericRange(values: number[]) {
  if (!values.length) {
    return null
  }

  const sorted = [...values].sort((left, right) => left - right)
  const low = sorted[0]
  const high = sorted[sorted.length - 1]

  return {
    low,
    high,
    base: sorted.length === 1 ? sorted[0] : (low + high) / 2,
  }
}

function buildProbabilityRange(values: number[], strategy: "mid" | "max" | "min" = "mid") {
  const filtered = values.filter((value) => value > 0 && value < 1)

  if (!filtered.length) {
    return null
  }

  const low = Math.min(...filtered)
  const high = Math.max(...filtered)

  return {
    low,
    high,
    base: strategy === "max" ? high : strategy === "min" ? low : filtered.length === 1 ? filtered[0] : (low + high) / 2,
  }
}

function extractExplicitPercentageValues(value: string) {
  return Array.from(value.matchAll(/(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?))?\s*%/g))
    .flatMap((match) => {
      const start = Number(match[1])
      const end = match[2] ? Number(match[2]) : null
      return end !== null ? [start / 100, end / 100] : [start / 100]
    })
    .filter((number) => Number.isFinite(number) && number > 0 && number < 1)
}

function extractDecimalProbabilityValues(value: string) {
  return Array.from(value.matchAll(/\b0?\.\d+\b/g))
    .map((match) => Number(match[0]))
    .filter((number) => Number.isFinite(number) && number > 0 && number < 1)
}

function parseGenericProbabilityRange(value: string) {
  return buildProbabilityRange([...extractExplicitPercentageValues(value), ...extractDecimalProbabilityValues(value)])
}

function parseAlphaProbability(value: string) {
  const decimals = extractDecimalProbabilityValues(value).filter((number) => number <= 0.2)

  if (decimals.length) {
    return buildProbabilityRange(decimals, "min")
  }

  const percentages = extractExplicitPercentageValues(value).filter((number) => number <= 0.2)
  return buildProbabilityRange(percentages, "min")
}

function parsePowerProbability(value: string) {
  const percentBeforePower = value.match(/(\d+(?:\.\d+)?)\s*%\s*power/i)

  if (percentBeforePower) {
    return buildProbabilityRange([Number(percentBeforePower[1]) / 100], "max")
  }

  const decimalBeforePower = value.match(/(0?\.\d+)\s*power/i)

  if (decimalBeforePower) {
    return buildProbabilityRange([Number(decimalBeforePower[1])], "max")
  }

  const percentages = extractExplicitPercentageValues(value).filter((number) => number >= 0.5)

  if (percentages.length) {
    return buildProbabilityRange(percentages, "max")
  }

  const decimals = extractDecimalProbabilityValues(value).filter((number) => number >= 0.5)
  return buildProbabilityRange(decimals, "max")
}

function parseAttritionProbability(value: string) {
  const percentages = extractExplicitPercentageValues(value).filter((number) => number <= 0.8)

  if (percentages.length) {
    return buildProbabilityRange(percentages, "max")
  }

  const decimals = extractDecimalProbabilityValues(value).filter((number) => number <= 0.8)
  return buildProbabilityRange(decimals, "max")
}

function parseBinaryEffectRange(value: string) {
  const explicitDifference = value.match(/absolute difference[^0-9]*(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s*%/i)

  if (explicitDifference) {
    const start = Number(explicitDifference[1]) / 100
    const end = explicitDifference[2] ? Number(explicitDifference[2]) / 100 : start
    return buildProbabilityRange([start, end])
  }

  const vsMatch = value.match(/(\d+(?:\.\d+)?)\s*%[\s\S]*?\bvs\b[\s\S]*?(\d+(?:\.\d+)?)\s*%/i)

  if (vsMatch) {
    const left = Number(vsMatch[1]) / 100
    const right = Number(vsMatch[2]) / 100
    return buildProbabilityRange([Math.abs(left - right)])
  }

  const decimals = extractDecimalProbabilityValues(value).filter((number) => number <= 0.5)

  if (decimals.length) {
    return buildProbabilityRange(decimals)
  }

  const percentages = extractExplicitPercentageValues(value).filter((number) => number <= 0.5)

  if (percentages.length >= 2) {
    return buildProbabilityRange([Math.abs(percentages[0] - percentages[1])])
  }

  return buildProbabilityRange(percentages)
}

function parseBinaryBaselineRate(variabilityValue: string, effectSizeValue: string) {
  const variabilityPercentages = extractExplicitPercentageValues(variabilityValue).filter((number) => number >= 0.05 && number <= 0.95)

  if (variabilityPercentages.length) {
    return buildProbabilityRange(variabilityPercentages, "max")
  }

  const baselineLabelMatch = variabilityValue.match(/(?:baseline|control|comparator|placebo|soc|standard of care)[^0-9]*(\d+(?:\.\d+)?)\s*%/i)

  if (baselineLabelMatch) {
    return buildProbabilityRange([Number(baselineLabelMatch[1]) / 100], "max")
  }

  const effectVsMatch = effectSizeValue.match(/(\d+(?:\.\d+)?)\s*%[\s\S]*?\bvs\b[\s\S]*?(\d+(?:\.\d+)?)\s*%/i)

  if (effectVsMatch) {
    return buildProbabilityRange([Number(effectVsMatch[2]) / 100], "max")
  }

  const effectPercentages = extractExplicitPercentageValues(effectSizeValue).filter((number) => number >= 0.05 && number <= 0.95)

  if (effectPercentages.length >= 2) {
    const sorted = [...effectPercentages].sort((left, right) => right - left)
    return buildProbabilityRange([sorted[1]], "max")
  }

  if (effectPercentages.length === 1) {
    return buildProbabilityRange(effectPercentages, "max")
  }

  return null
}

function parseContinuousEffectRange(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const looksPercentLike = /%|percent|percentage/i.test(trimmed)
  const numbers = extractNumberTokens(trimmed).map((number) => {
    if (looksPercentLike || number > 5) {
      return number / 100
    }

    return number
  })
  const range = buildNumericRange(numbers)

  if (!range || range.base <= 0) {
    return null
  }

  return range
}

function parseHazardRatioRange(value: string) {
  const numbers = extractNumberTokens(value)
    .filter((number) => number > 0 && number < 5)
    .map((number) => (number > 1.5 && /%|percent/i.test(value) ? number / 100 : number))
  const range = buildNumericRange(numbers)

  if (!range || range.base <= 0 || Math.abs(range.base - 1) < 0.01) {
    return null
  }

  return range
}

function parseAlphaAssumption(value: string, hypothesis: string) {
  const probabilityRange = parseAlphaProbability(value)

  if (!probabilityRange) {
    return null
  }

  return {
    alpha: probabilityRange.base,
    twoSided: !/one-sided|one sided/i.test(`${value} ${hypothesis}`),
  }
}

function parsePlannedSampleTotal(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const integers = extractNumberTokens(trimmed)
    .map((number) => Math.round(number))
    .filter((number) => number > 0)

  if (!integers.length) {
    return null
  }

  if (/per arm|each arm|per group|per cohort/i.test(trimmed)) {
    return integers[0] * 2
  }

  if (/total/i.test(trimmed)) {
    return integers[0]
  }

  return Math.max(...integers)
}

function inverseStandardNormal(probability: number) {
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924]
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857]
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878]
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742]
  const pLow = 0.02425
  const pHigh = 1 - pLow

  if (probability <= 0 || probability >= 1) {
    throw new Error("Probability must be between 0 and 1.")
  }

  if (probability < pLow) {
    const q = Math.sqrt(-2 * Math.log(probability))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }

  if (probability <= pHigh) {
    const q = probability - 0.5
    const r = q * q
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  }

  const q = Math.sqrt(-2 * Math.log(1 - probability))
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
}

function getSampleSizeEstimateMissing(stats: StatsForm) {
  const missing = []
  const endpointType = (stats.endpointType || "").trim().toLowerCase()

  if (!endpointType) missing.push("endpoint type")
  if (!parseAlphaAssumption(stats.alpha, stats.hypothesis)) missing.push("alpha")
  if (!parsePowerProbability(stats.power)) missing.push("power")
  if (!stats.effectSize.trim()) missing.push("effect size")
  if (!stats.attrition.trim() || !parseAttritionProbability(stats.attrition)) missing.push("attrition / non-evaluable rate")

  if (endpointType.includes("time-to-event") || endpointType.includes("time to event")) {
    if (!parseHazardRatioRange(stats.effectSize)) missing.push("hazard ratio effect size")
    if (!stats.variability.trim() || !parseGenericProbabilityRange(stats.variability)) missing.push("event proportion assumption")
  } else if (endpointType.includes("binary")) {
    if (!parseBinaryEffectRange(stats.effectSize)) missing.push("absolute effect difference")
    if (!parseBinaryBaselineRate(stats.variability, stats.effectSize)) missing.push("baseline event rate")
  } else if (!parseContinuousEffectRange(stats.effectSize)) {
    missing.push("numeric effect size")
  }

  return [...new Set(missing)]
}

function buildSampleSizeEstimate(study: StudyForm, stats: StatsForm): SampleSizeEstimate {
  const missing = getSampleSizeEstimateMissing(stats)
  const plannedTotal = parsePlannedSampleTotal(study.sampleSize)

  if (missing.length) {
    return {
      ...initialSampleSizeEstimate,
      status: "needs_inputs",
      missing,
      plannedTotal,
      generatedAt: new Date().toISOString(),
      summary: "More statistical assumptions are needed before a sample-size estimate can be calculated.",
    }
  }

  const alphaAssumption = parseAlphaAssumption(stats.alpha, stats.hypothesis)
  const powerAssumption = parsePowerProbability(stats.power)
  const attritionAssumption = parseAttritionProbability(stats.attrition)

  if (!alphaAssumption || !powerAssumption || !attritionAssumption) {
    return {
      ...initialSampleSizeEstimate,
      status: "error",
      summary: "The statistical assumptions could not be parsed into a usable sample-size calculation.",
      plannedTotal,
      generatedAt: new Date().toISOString(),
    }
  }

  const zAlpha = inverseStandardNormal(1 - (alphaAssumption.twoSided ? alphaAssumption.alpha / 2 : alphaAssumption.alpha))
  const zPower = inverseStandardNormal(powerAssumption.base)
  const endpointType = (stats.endpointType || "").trim().toLowerCase()
  const attritionRate = attritionAssumption.base
  const assumptions = [
    `${alphaAssumption.twoSided ? "Two-sided" : "One-sided"} alpha ${alphaAssumption.alpha.toFixed(3)}`,
    `Power ${Math.round(powerAssumption.base * 100)}%`,
    `Attrition / non-evaluable rate ${Math.round(attritionRate * 100)}%`,
  ]
  const notes: string[] = []

  const calculateAdjustedTotal = (total: number) => Math.ceil(total / Math.max(0.05, 1 - attritionRate))

  let methodKey: SampleSizeEstimate["methodKey"] = "generic"
  let methodLabel = "Standardized-effect approximation"
  let estimatedPerArm = 0
  let estimatedTotal = 0
  let adjustedTotal = 0
  let sensitivity: SampleSizeScenario[] = []

  if (endpointType.includes("time-to-event") || endpointType.includes("time to event")) {
    const hazardRatioRange = parseHazardRatioRange(stats.effectSize)
    const eventProportionRange = parseGenericProbabilityRange(stats.variability)

    if (!hazardRatioRange || !eventProportionRange) {
      return {
        ...initialSampleSizeEstimate,
        status: "error",
        summary: "The time-to-event assumptions could not be parsed into a usable event-driven calculation.",
        plannedTotal,
        generatedAt: new Date().toISOString(),
      }
    }

    methodKey = "time_to_event"
    methodLabel = "Time-to-event, event-driven approximation"
    assumptions.push(`Hazard ratio ${hazardRatioRange.base.toFixed(2)}`)
    assumptions.push(`Expected event proportion ${Math.round(eventProportionRange.base * 100)}%`)

    const computeTotal = (hazardRatio: number) => {
      const requiredEvents = Math.ceil((4 * (zAlpha + zPower) ** 2) / Math.max(0.0001, Math.log(hazardRatio) ** 2))
      return Math.ceil(requiredEvents / eventProportionRange.base)
    }

    estimatedTotal = computeTotal(hazardRatioRange.base)
    estimatedPerArm = Math.ceil(estimatedTotal / 2)
    adjustedTotal = calculateAdjustedTotal(estimatedTotal)

    const lowerEffectHr = hazardRatioRange.high !== hazardRatioRange.low ? Math.max(0.05, hazardRatioRange.high) : Math.min(0.99, hazardRatioRange.base + (1 - hazardRatioRange.base) * 0.2)
    const higherEffectHr = hazardRatioRange.high !== hazardRatioRange.low ? Math.max(0.05, hazardRatioRange.low) : Math.max(0.05, hazardRatioRange.base - (1 - hazardRatioRange.base) * 0.2)
    sensitivity = [
      {
        label: "Smaller treatment effect",
        total: computeTotal(lowerEffectHr),
        adjustedTotal: calculateAdjustedTotal(computeTotal(lowerEffectHr)),
      },
      {
        label: "Larger treatment effect",
        total: computeTotal(higherEffectHr),
        adjustedTotal: calculateAdjustedTotal(computeTotal(higherEffectHr)),
      },
    ]
    notes.push("This approximation assumes equal allocation and uses the entered event proportion as the bridge from required events to total sample size.")
  } else if (endpointType.includes("binary")) {
    const effectRange = parseBinaryEffectRange(stats.effectSize)
    const baselineRateRange = parseBinaryBaselineRate(stats.variability, stats.effectSize)

    if (!effectRange || !baselineRateRange) {
      return {
        ...initialSampleSizeEstimate,
        status: "error",
        summary: "The binary-endpoint assumptions could not be parsed into a usable two-proportion calculation.",
        plannedTotal,
        generatedAt: new Date().toISOString(),
      }
    }

    methodKey = "binary"
    methodLabel = "Two-proportion comparison"
    assumptions.push(`Baseline event rate ${Math.round(baselineRateRange.base * 100)}%`)
    assumptions.push(`Absolute difference ${Math.round(effectRange.base * 1000) / 10}%`)

    const computePerArm = (absoluteDifference: number) => {
      const baselineRate = baselineRateRange.base
      const comparatorRate = Math.max(0.01, Math.min(0.99, baselineRate - absoluteDifference))
      const pooledRate = (baselineRate + comparatorRate) / 2
      return Math.ceil(
        ((zAlpha * Math.sqrt(2 * pooledRate * (1 - pooledRate)) +
          zPower * Math.sqrt(baselineRate * (1 - baselineRate) + comparatorRate * (1 - comparatorRate))) **
          2) /
          Math.max(0.0001, absoluteDifference ** 2),
      )
    }

    estimatedPerArm = computePerArm(effectRange.base)
    estimatedTotal = estimatedPerArm * 2
    adjustedTotal = calculateAdjustedTotal(estimatedTotal)

    const smallerEffect = effectRange.high !== effectRange.low ? effectRange.low : Math.max(0.01, effectRange.base * 0.85)
    const largerEffect = effectRange.high !== effectRange.low ? effectRange.high : Math.min(0.5, effectRange.base * 1.15)
    sensitivity = [
      {
        label: "Smaller absolute difference",
        total: computePerArm(smallerEffect) * 2,
        adjustedTotal: calculateAdjustedTotal(computePerArm(smallerEffect) * 2),
      },
      {
        label: "Larger absolute difference",
        total: computePerArm(largerEffect) * 2,
        adjustedTotal: calculateAdjustedTotal(computePerArm(largerEffect) * 2),
      },
    ]
    notes.push("The binary calculation assumes a two-arm comparison and interprets the entered effect size as an absolute difference between arms.")
  } else {
    const effectRange = parseContinuousEffectRange(stats.effectSize)

    if (!effectRange) {
      return {
        ...initialSampleSizeEstimate,
        status: "error",
        summary: "The entered effect size could not be parsed into a usable standardized-effect calculation.",
        plannedTotal,
        generatedAt: new Date().toISOString(),
      }
    }

    methodKey = endpointType.includes("continuous") ? "continuous" : "generic"
    methodLabel = endpointType.includes("continuous") ? "Continuous endpoint, standardized-effect approximation" : "Generic standardized-effect approximation"
    assumptions.push(`Standardized effect size ${effectRange.base.toFixed(2)}`)

    const computePerArm = (effectSize: number) =>
      Math.ceil((2 * (zAlpha + zPower) ** 2) / Math.max(0.0001, effectSize ** 2))

    estimatedPerArm = computePerArm(effectRange.base)
    estimatedTotal = estimatedPerArm * 2
    adjustedTotal = calculateAdjustedTotal(estimatedTotal)

    const smallerEffect = effectRange.high !== effectRange.low ? effectRange.low : Math.max(0.05, effectRange.base * 0.85)
    const largerEffect = effectRange.high !== effectRange.low ? effectRange.high : effectRange.base * 1.15
    sensitivity = [
      {
        label: "Smaller effect",
        total: computePerArm(smallerEffect) * 2,
        adjustedTotal: calculateAdjustedTotal(computePerArm(smallerEffect) * 2),
      },
      {
        label: "Larger effect",
        total: computePerArm(largerEffect) * 2,
        adjustedTotal: calculateAdjustedTotal(computePerArm(largerEffect) * 2),
      },
    ]

    if (!endpointType.includes("continuous")) {
      notes.push("Because the endpoint type is mixed or composite, this result is a rough standardized-effect approximation and needs formal biostatistics review.")
    }
  }

  const plannedGap = plannedTotal !== null ? plannedTotal - adjustedTotal : null
  const plannedStatus: SampleSizeEstimate["plannedStatus"] =
    plannedTotal === null
      ? "unknown"
      : plannedTotal < adjustedTotal * 0.9
        ? "under"
        : plannedTotal > adjustedTotal * 1.1
          ? "over"
          : "aligned"

  const summary = `Estimated ${estimatedTotal.toLocaleString()} participants total (${estimatedPerArm.toLocaleString()} per arm), increasing to ${adjustedTotal.toLocaleString()} after attrition, using the current ${methodLabel.toLowerCase()}.`

  if (plannedStatus === "under") {
    notes.push("The currently planned sample size appears lower than the requirement implied by the active statistical assumptions.")
  } else if (plannedStatus === "over") {
    notes.push("The currently planned sample size appears higher than the requirement implied by the active statistical assumptions.")
  } else if (plannedStatus === "aligned") {
    notes.push("The currently planned sample size is broadly consistent with the current statistical assumptions.")
  }

  return {
    status: "ready",
    generatedAt: new Date().toISOString(),
    methodKey,
    methodLabel,
    summary,
    missing: [],
    assumptions,
    notes,
    estimatedPerArm,
    estimatedTotal,
    adjustedTotal,
    attritionRate,
    plannedTotal,
    plannedGap,
    plannedStatus,
    sensitivity,
  }
}

const STATS_EDITOR_SECTIONS: Array<{ key: keyof StatsForm; label: string }> = [
  { key: "estimand", label: "Estimand" },
  { key: "endpointType", label: "Endpoint type" },
  { key: "hypothesis", label: "Hypothesis" },
  { key: "alpha", label: "Alpha" },
  { key: "power", label: "Power" },
  { key: "effectSize", label: "Effect size" },
  { key: "variability", label: "Variability / event assumptions" },
  { key: "attrition", label: "Attrition / non-evaluable rate" },
  { key: "analysisModel", label: "Primary analysis model" },
  { key: "missingData", label: "Missing data strategy" },
  { key: "rationale", label: "Assumption rationale" },
]

const STATS_EDITOR_LABEL_TO_KEY = Object.fromEntries(
  STATS_EDITOR_SECTIONS.map((section) => [section.label, section.key]),
) as Record<string, keyof StatsForm>

function buildStatsEditorText(stats: StatsForm) {
  return STATS_EDITOR_SECTIONS.map(({ key, label }) => `[${label}]\n${stats[key] || ""}`.trimEnd()).join("\n\n")
}

function parseStatsEditorText(value: string, current: StatsForm): StatsForm {
  const normalized = value.replace(/\r\n/g, "\n")
  const next = { ...current }
  const pattern = /\[([^\]]+)\]\n([\s\S]*?)(?=\n\[[^\]]+\]\n|$)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(normalized)) !== null) {
    const label = match[1].trim()
    const key = STATS_EDITOR_LABEL_TO_KEY[label]

    if (!key) {
      continue
    }

    next[key] = match[2].trim() as StatsForm[typeof key]
  }

  return next
}

function buildSampleSizeSuggestions(study: StudyForm, pico: PicoForm, stats: StatsForm): SampleSizeSuggestion[] {
  const missing = getSampleSizeEstimateMissing(stats)
  const fallbackPico = pico.population || pico.intervention || pico.outcomes ? pico : buildPicoFromStudy(study)
  const fallbackStats = buildStatsFromStudy(study, fallbackPico)
  const endpointType = (stats.endpointType || fallbackStats.endpointType || "").trim().toLowerCase()
  const outcomeText = `${pico.outcomes || study.outcomes} ${study.primaryObjective}`.toLowerCase()
  const effectPercentages = extractExplicitPercentageValues(stats.effectSize)
  const vsMatch = stats.effectSize.match(/(\d+(?:\.\d+)?)\s*%[\s\S]*?\bvs\b[\s\S]*?(\d+(?:\.\d+)?)\s*%/i)
  const derivedBaselineRate =
    (vsMatch ? Number(vsMatch[2]) / 100 : null) ||
    (effectPercentages.length >= 2 ? Math.min(...effectPercentages) : null) ||
    (/response|remission|control|clearance/.test(outcomeText) ? 0.7 : /flare|event|hospitalization|death|progression/.test(outcomeText) ? 0.35 : 0.5)
  const derivedBinaryEffect =
    (vsMatch ? Math.abs(Number(vsMatch[1]) - Number(vsMatch[2])) / 100 : null) ||
    (effectPercentages.length >= 2 ? Math.abs(effectPercentages[0] - effectPercentages[1]) : null) ||
    (/response|remission|control|clearance/.test(outcomeText) ? 0.15 : 0.1)
  const derivedEventProportion = /overall survival|mortality|death/.test(outcomeText)
    ? 0.6
    : /progression|event[- ]?free|disease[- ]?free|relapse/.test(outcomeText)
      ? 0.5
      : /hospitalization|mace|cardiovascular/.test(outcomeText)
        ? 0.35
        : 0.45
  const suggestions: SampleSizeSuggestion[] = []

  if (missing.includes("endpoint type")) {
    suggestions.push({
      id: "endpoint-type",
      key: "endpointType",
      label: "Endpoint type",
      value: fallbackStats.endpointType,
      rationale: "This is inferred from the current outcome wording and gives the estimator a concrete method family to use.",
    })
  }

  if (missing.includes("alpha")) {
    suggestions.push({
      id: "alpha",
      key: "alpha",
      label: "Alpha",
      value: fallbackStats.alpha,
      rationale: "This uses the current study design as the default testing threshold and expresses it in a parseable format.",
    })
  }

  if (missing.includes("power")) {
    suggestions.push({
      id: "power",
      key: "power",
      label: "Power",
      value: fallbackStats.power,
      rationale: "This uses the current design type to propose a standard target power in a parseable format.",
    })
  }

  if (missing.includes("attrition / non-evaluable rate")) {
    suggestions.push({
      id: "attrition",
      key: "attrition",
      label: "Attrition / non-evaluable rate",
      value: fallbackStats.attrition,
      rationale: "This provides a concrete attrition assumption so the total sample size can be inflated appropriately.",
    })
  }

  if (missing.includes("numeric effect size") || missing.includes("hazard ratio effect size")) {
    suggestions.push({
      id: "effect-size-generic",
      key: "effectSize",
      label: "Effect size",
      value: fallbackStats.effectSize,
      rationale: "This is a default effect-size draft matched to the current endpoint family and can be tightened later.",
    })
  }

  if (missing.includes("absolute effect difference")) {
    suggestions.push({
      id: "effect-size-binary",
      key: "effectSize",
      label: "Absolute effect difference",
      value: `Assume absolute difference of ${Math.round(derivedBinaryEffect * 1000) / 10}% for the primary binary endpoint.`,
      rationale: "This converts the current binary effect story into a concrete difference the estimator can use directly.",
    })
  }

  if (missing.includes("baseline event rate")) {
    suggestions.push({
      id: "baseline-event-rate",
      key: "variability",
      label: "Baseline event rate",
      value: `Assume baseline/control event rate of ${Math.round(derivedBaselineRate * 100)}% at the primary analysis timepoint; refine using historical evidence for the target population.`,
      rationale: "The estimator needs a control or baseline event rate for binary endpoints; this gives a draft value in a parseable format.",
    })
  }

  if (missing.includes("event proportion assumption")) {
    suggestions.push({
      id: "event-proportion",
      key: "variability",
      label: "Event proportion assumption",
      value: `Assume cumulative event proportion of ${Math.round(derivedEventProportion * 100)}% by the primary analysis timepoint; refine using historical evidence for the target population.`,
      rationale: "The event-driven calculation needs a concrete event proportion to translate required events into total sample size.",
    })
  }

  if (!suggestions.length && endpointType.includes("binary") && !stats.variability.trim()) {
    suggestions.push({
      id: "baseline-event-rate-fallback",
      key: "variability",
      label: "Baseline event rate",
      value: `Assume baseline/control event rate of ${Math.round(derivedBaselineRate * 100)}% at the primary analysis timepoint; refine using historical evidence for the target population.`,
      rationale: "A binary-endpoint sample-size calculation generally needs a control event rate, even when the missing-state detector is not explicit.",
    })
  }

  return suggestions
}

function validateStudy(study: StudyForm) {
  const missing = []

  if (!(study.studyTitle || "").trim()) missing.push("Study title")
  if (!(study.developmentStage || "").trim()) missing.push("Development stage")
  if (!hasPrimaryStudyAimSelection(study)) missing.push("Primary study aim")
  if (!(study.therapeuticArea || "").trim()) missing.push("Therapeutic area")
  if (!getSelectedDiseaseLabel(study)) missing.push("Disease or custom disease")
  if (!((study.topIntervention || "").trim() || (study.intervention || "").trim())) missing.push("Intervention / drug")
  if (!((study.topComparator || "").trim() || (study.comparator || "").trim())) missing.push("Comparator")
  if (!getResolvedOutcomes(study)) missing.push("Selected, typed, or described endpoints")
  if (!(study.primaryObjective || "").trim()) missing.push("Primary study objective")
  if (!(study.designOverview || "").trim()) missing.push("Study design overview")
  if (!(study.population || "").trim()) missing.push("Population")

  return missing
}

function validatePicoAndStats(pico: PicoForm, stats: StatsForm) {
  const missing = []

  if (!(pico.population || "").trim()) missing.push("PICO population")
  if (!(pico.intervention || "").trim()) missing.push("PICO intervention / exposure")
  if (!(pico.outcomes || "").trim()) missing.push("PICO outcomes")
  if (!(stats.endpointType || "").trim()) missing.push("Endpoint type")
  if (!(stats.analysisModel || "").trim()) missing.push("Primary analysis model")

  return missing
}

function validateLiterature(literature: LiteratureForm) {
  const missing = []

  if (!(literature.researchQuestion || "").trim()) missing.push("Background research question")
  if (!(literature.pubmedQuery || "").trim()) missing.push("PubMed query")
  if (!(literature.backgroundThemes || "").trim()) missing.push("Background themes")

  return missing
}

function deriveSectionAssumptions(
  section: SynopsisSection,
  study: StudyForm,
  pico: PicoForm,
  stats: StatsForm,
  literature: LiteratureForm,
) {
  const assumptions = [...getDefaultAssumptions(section.title)]
  const title = section.title.toLowerCase()

  if (!study.comparator.trim() && (title.includes("population") || title.includes("background"))) {
    assumptions.push("Comparator details were not fully specified in Study Design.")
  }

  if (!study.sampleSize.trim() && (title.includes("statistical") || title.includes("operational"))) {
    assumptions.push("Sample size planning input was not provided by the user.")
  }

  if (!literature.pubmedQuery.trim() && (title.includes("background") || title.includes("literature"))) {
    assumptions.push("Literature strategy remains incomplete and should be regenerated or completed manually.")
  }

  if (!stats.effectSize.trim() && title.includes("statistical")) {
    assumptions.push("Effect-size assumptions were not finalized in the PICO & Stats review.")
  }

  if (!pico.timeframe.trim() && (title.includes("objective") || title.includes("design"))) {
    assumptions.push("Timing assumptions were inferred because a study timeframe was not explicit.")
  }

  return assumptions
}

function makeSection(title: string, prompt: string): SynopsisSection {
  return {
    id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    prompt,
    body: "",
    included: true,
    provenance: "template",
    sourceTabs: getSectionSourceTabs(title),
    assumptionFlags: getDefaultAssumptions(title),
    lastGeneratedAt: "",
    promptVersion: 1,
    manualEdited: false,
  }
}

function normalizeSection(section: Partial<SynopsisSection> & Pick<SynopsisSection, "id" | "title" | "prompt">): SynopsisSection {
  const fallback = makeSection(section.title, section.prompt)

  return {
    ...fallback,
    ...section,
    sourceTabs: section.sourceTabs ?? getSectionSourceTabs(section.title),
    assumptionFlags: section.assumptionFlags ?? getDefaultAssumptions(section.title),
    promptVersion: section.promptVersion ?? 1,
    lastGeneratedAt: section.lastGeneratedAt ?? "",
    provenance: section.provenance ?? (section.body ? "ai_generated" : "template"),
    manualEdited: section.manualEdited ?? false,
  }
}

function buildDefaultSections() {
  return [
    makeSection(
      "Executive Summary",
      "Summarize the study concept, unmet need, design intent, and expected decision value in one concise section.",
    ),
    makeSection(
      "Background and Rationale",
      "Explain the disease area, evidence gap, and why this proposed study design is appropriate now.",
    ),
    makeSection(
      "Objectives and Endpoints",
      "Translate the study objectives into synopsis-ready objective and endpoint language.",
    ),
    makeSection(
      "Study Design",
      "Describe the study category, subcategory, key design features, and execution framework.",
    ),
    makeSection(
      "Population, Intervention, and Comparator",
      "Describe the target population, treatment/exposure, comparator, and eligibility highlights.",
    ),
    makeSection(
      "Statistical Considerations",
      "Outline the statistical assumptions, estimand, endpoint type, and missing data strategy.",
    ),
    makeSection(
      "Literature and Evidence Plan",
      "Summarize the literature search strategy, background themes, and evidence sources supporting the synopsis.",
    ),
    makeSection(
      "Operational Notes",
      "Capture geography, sample size planning, timeline expectations, and operational considerations.",
    ),
  ]
}

function splitItems(value: string) {
  return value
    .split(/\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function joinHumanList(items: string[]) {
  const filtered = items.filter(Boolean)

  if (filtered.length === 0) {
    return ""
  }

  if (filtered.length === 1) {
    return filtered[0]
  }

  if (filtered.length === 2) {
    return `${filtered[0]} and ${filtered[1]}`
  }

  return `${filtered.slice(0, -1).join(", ")}, and ${filtered[filtered.length - 1]}`
}

function createStructuredEditorItemId() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function splitStructuredEditorItems(value: string) {
  return uniqueItemsCaseInsensitive(
    value
      .split(/\n+/)
      .flatMap((line) => line.split(/;\s*/))
      .map((item) => item.trim())
      .filter(Boolean),
  )
}

function buildStructuredEditorText(items: StructuredEditorItem[]) {
  return items
    .filter((item) => item.active && item.text.trim())
    .map((item) => item.text.trim())
    .join("\n")
}

function parseStructuredEditorItems(value: string, previous: StructuredEditorItem[] = []) {
  const previousByText = new Map(
    previous
      .filter((item) => item.text.trim())
      .map((item) => [item.text.trim().toLowerCase(), item] as const),
  )

  return splitStructuredEditorItems(value).map((text) => {
    const match = previousByText.get(text.toLowerCase())

    return {
      id: match?.id || createStructuredEditorItemId(),
      text,
      active: match?.active ?? true,
    }
  })
}

function buildStudyTypeReviewNotice(
  scope: StudyTypeReviewNotice["scope"],
  category: string,
  subcategory: string,
): StudyTypeReviewNotice {
  const categoryLabel = STUDY_CATEGORIES[category as keyof typeof STUDY_CATEGORIES]?.label || category || "the selected study type"
  const reviewFields = [
    "Study design overview",
    "Primary and secondary objectives",
    "Population and eligibility",
    "Endpoints and assessments",
    "PICO & Stats",
    "Study Schema",
    ...(category === "interventional" ? ["Schedule"] : []),
  ]
  const lighterReviewFields = [
    "Study design overview",
    "Endpoints and assessments",
    "PICO & Stats",
    "Study Schema",
    ...(category === "interventional" ? ["Schedule"] : []),
  ]
  const fields = scope === "category" ? reviewFields : lighterReviewFields
  const studyTypeLabel = [categoryLabel, subcategory].filter(Boolean).join(" / ")

  return {
    scope,
    title: scope === "category" ? "Study type changed" : "Study subtype changed",
    message:
      scope === "category"
        ? `You changed the study type to ${studyTypeLabel || "the new selection"}. Existing wording was preserved rather than deleted, so it may still reflect the previous design. Review ${joinHumanList(fields)} before moving on.`
        : `You changed the study subtype to ${studyTypeLabel || "the new selection"}. Existing wording was preserved rather than deleted, so review ${joinHumanList(fields)} for stale framing.`,
    fields,
  }
}

function buildObjectiveApplySummary(selection: ObjectiveSuggestionSelection) {
  const actions: string[] = []

  if (selection.primaryObjective) {
    actions.push("replace the Primary study objective")
  }

  if (selection.secondaryObjectives.length > 0) {
    actions.push(
      `append ${selection.secondaryObjectives.length} Secondary objective${
        selection.secondaryObjectives.length === 1 ? "" : "s"
      }`,
    )
  }

  if (selection.designOverview) {
    actions.push("replace the Study design overview")
  }

  return actions.length ? `Applying this will ${joinHumanList(actions)}.` : "Select at least one objective change to apply."
}

function buildPopulationApplySummary(selection: PopulationSuggestionSelection) {
  const actions: string[] = []

  if (selection.population) {
    actions.push("replace Population")
  }

  if (selection.eligibility) {
    actions.push("replace Eligibility highlights")
  }

  return actions.length ? `Applying this will ${joinHumanList(actions)}.` : "Select at least one field to replace."
}

function buildEndpointApplySummary(selectedCount: number) {
  return selectedCount > 0
    ? `Applying this will add ${selectedCount} selected endpoint${selectedCount === 1 ? "" : "s"} to the current endpoint package. Existing endpoint wording will be kept.`
    : "Select at least one endpoint to add."
}

function buildStudySchemaFingerprint(study: StudyForm) {
  return [
    study.studyTitle,
    study.category,
    study.subcategory,
    study.developmentStage,
    getStrategicObjectiveLabel(study),
    getPrimaryEvidenceUseIntent(study),
    study.therapeuticArea,
    getSelectedDiseaseLabel(study),
    study.topIntervention || study.intervention,
    study.topComparator || study.comparator,
    study.topLineOfTherapy,
    study.primaryObjective,
    study.designOverview,
    study.population,
    getResolvedOutcomes(study),
    study.timeline,
    study.sampleSize,
  ]
    .join("|")
    .toLowerCase()
}

function getStudySchemaMissing(study: StudyForm) {
  const missing = []

  if (!(study.category || study.subcategory || "").trim()) missing.push("study type")
  if (!(getSelectedDiseaseLabel(study) || getResolvedIndication(study) || "").trim()) missing.push("disease or indication")
  if (study.category !== "evidence-synthesis" && !((study.topIntervention || "").trim() || (study.intervention || "").trim())) {
    missing.push("intervention or exposure")
  }
  if (!(study.primaryObjective || study.designOverview || "").trim()) missing.push("objective or design overview")

  return missing
}

function inferStudySchemaType(study: StudyForm) {
  const subtype = (study.subcategory || "").toLowerCase()
  const category = (study.category || "").toLowerCase()
  const strategicText = `${getStrategicObjectiveLabel(study)} ${getPrimaryEvidenceUseIntent(study)} ${study.designOverview}`.toLowerCase()

  if (category === "evidence-synthesis") {
    return "evidence_synthesis"
  }

  if (category === "non-clinical") {
    return "non_clinical"
  }

  if (
    category === "non-interventional" &&
    (/secondary/.test(subtype) || /real world|database|claims|ehr|emr|registry/.test(strategicText))
  ) {
    return "rwe_secondary_database"
  }

  if (category === "non-interventional") {
    return "observational"
  }

  if (/adaptive|basket|umbrella|non-randomized/.test(subtype)) {
    return "complex_interventional"
  }

  return "interventional"
}

function getStudySchemaLimits(detailLevel: StudySchemaDetailLevel) {
  if (detailLevel === "simple") {
    return { lanes: 4, nodes: 6, edges: 6, maxRow: 0 }
  }

  if (detailLevel === "standard") {
    return { lanes: 4, nodes: 8, edges: 8, maxRow: 1 }
  }

  return { lanes: 5, nodes: 10, edges: 12, maxRow: 2 }
}

function getStudySchemaDetailLabel(detailLevel: StudySchemaDetailLevel) {
  if (detailLevel === "simple") {
    return "High level / one slide"
  }

  if (detailLevel === "standard") {
    return "Standard"
  }

  return "Detailed"
}

function getStudySchemaFallbackProvenance(provenance: StudySchemaProvenance, preferHybrid = false) {
  if (preferHybrid || provenance === "ai_generated" || provenance === "hybrid") {
    return "hybrid"
  }

  return "local_draft"
}

function isStudySchemaOversized(schema: StudySchemaForm) {
  const limits = getStudySchemaLimits(schema.detailLevel)
  const maxRow = schema.nodes.length ? Math.max(...schema.nodes.map((node) => node.row)) : 0
  const maxColumn = schema.nodes.length ? Math.max(...schema.nodes.map((node) => node.column)) : 0

  return (
    schema.lanes.length > limits.lanes ||
    schema.nodes.length > limits.nodes ||
    schema.edges.length > limits.edges ||
    maxRow > limits.maxRow ||
    (schema.detailLevel === "simple" && maxColumn > 4)
  )
}

function shapeGeneratedStudySchema(
  study: StudyForm,
  current: StudySchemaForm,
  generated: Partial<Pick<StudySchemaForm, "title" | "schemaType" | "orientation" | "detailLevel" | "lanes" | "nodes" | "edges" | "notes">>,
) {
  const title = generated.title || current.title || `${study.studyTitle || "Study concept"} schema`
  const schemaType = generated.schemaType || inferStudySchemaType(study)
  const fingerprint = buildStudySchemaFingerprint(study)
  const fallback = buildStudySchemaFromStudy(study, {
    orientation: current.orientation,
    detailLevel: current.detailLevel,
    iterationPrompt: current.iterationPrompt,
    theme: current.theme,
  })
  const condensedNotes =
    Array.isArray(generated.notes) && generated.notes.filter((item) => item.trim()).length
      ? generated.notes.filter((item) => item.trim()).slice(0, 2)
      : fallback.notes

  if (current.detailLevel === "simple") {
    return normalizeStudySchema({
      ...fallback,
      title,
      schemaType,
      notes: condensedNotes,
      generatedAt: new Date().toISOString(),
      provenance: getStudySchemaFallbackProvenance(current.provenance, true),
      manualEdited: false,
      sourceFingerprint: fingerprint,
    })
  }

  const normalized = normalizeStudySchema({
    ...current,
    ...generated,
    title,
    schemaType,
    iterationPrompt: current.iterationPrompt,
    generatedAt: new Date().toISOString(),
    provenance: "ai_generated",
    manualEdited: false,
    sourceFingerprint: fingerprint,
  })

  if (!normalized.lanes.length || !normalized.nodes.length || isStudySchemaOversized(normalized)) {
    return normalizeStudySchema({
      ...fallback,
      title,
      schemaType,
      notes: condensedNotes,
      generatedAt: new Date().toISOString(),
      provenance: getStudySchemaFallbackProvenance(current.provenance, true),
      manualEdited: false,
      sourceFingerprint: fingerprint,
    })
  }

  return normalizeStudySchema({
    ...normalized,
    notes: normalized.notes.slice(0, 3),
  })
}

function buildSimpleStudySchemaFromStudy(
  study: StudyForm,
  schemaType: string,
  orientation: StudySchemaOrientation,
  theme: StudySchemaTheme,
  title: string,
  iterationPrompt: string,
) {
  const disease = getSelectedDiseaseLabel(study) || getResolvedIndication(study) || "Target condition"
  const intervention = study.topIntervention || study.intervention || "Study intervention"
  const comparator = study.topComparator || study.comparator || "Comparator strategy"
  const endpoint = splitItems(getResolvedOutcomes(study))[0] || "Primary endpoint package"
  const evidenceIntent = getPrimaryEvidenceUseIntent(study) || "Decision use"
  const lineOfTherapy = study.topLineOfTherapy || "Planned setting"

  const lanes: StudySchemaLane[] = []
  const nodes: StudySchemaNode[] = []
  const edges: StudySchemaEdge[] = []
  const notes: string[] = []

  const addLane = (id: string, label: string, description: string) => {
    lanes.push({ id, label, description })
  }

  const addNode = (
    id: string,
    laneId: string,
    label: string,
    subtitle: string,
    kind: StudySchemaNodeKind,
    column: number,
  ) => {
    nodes.push({ id, laneId, label, subtitle, kind, column, row: 0 })
  }

  const addEdge = (from: string, to: string, label = "", style: "solid" | "dashed" = "solid") => {
    edges.push({ id: `${from}-${to}-${edges.length + 1}`, from, to, label, style })
  }

  if (schemaType === "interventional") {
    addLane("setup", "Study setup", "Population, entry criteria, and allocation logic.")
    addLane("execution", "Study comparison", "Treatment comparison and key evidence capture.")
    addLane("readout", "Readout", "Analysis and intended decision use.")

    addNode("concept", "setup", "Study concept", `${disease} · ${study.developmentStage || "planned stage"}`, "start", 0)
    addNode("entry", "setup", "Population and allocation", study.population || lineOfTherapy, "screening", 1)
    addNode("comparison", "execution", "Treatment comparison", `${intervention} vs ${comparator}`, "arm", 2)
    addNode("assessment", "execution", "Key assessments", endpoint, "assessment", 3)
    addNode("readout", "readout", "Readout and decision use", evidenceIntent, "output", 4)

    addEdge("concept", "entry")
    addEdge("entry", "comparison")
    addEdge("comparison", "assessment")
    addEdge("assessment", "readout")

    notes.push(
      `This is a high-level interventional schema showing who enters, what is compared, and how the study reads out for ${evidenceIntent.toLowerCase()}.`,
      "Use a higher detail setting only if you need explicit arm branching, follow-up, or interim decision points.",
    )
  } else if (schemaType === "complex_interventional") {
    addLane("setup", "Study setup", "Eligibility and assignment into the design.")
    addLane("execution", "Cohorts and evidence", "Main cohorts, treatment logic, and core evidence capture.")
    addLane("readout", "Readout", "Integrated analysis and intended decision use.")

    addNode("concept", "setup", "Complex study concept", `${study.subcategory || "Adaptive / multi-cohort design"} in ${disease}`, "start", 0)
    addNode("assignment", "setup", "Cohort logic", study.designOverview || "Biomarker, regimen, or cohort rule set", "decision", 1)
    addNode("cohorts", "execution", "Active cohorts or arms", `${intervention} and comparator strategy`, "cohort", 2)
    addNode("assessment", "execution", "Key evidence package", endpoint, "assessment", 3)
    addNode("readout", "readout", "Integrated readout", evidenceIntent, "output", 4)

    addEdge("concept", "assignment")
    addEdge("assignment", "cohorts")
    addEdge("cohorts", "assessment")
    addEdge("assessment", "readout")

    notes.push(
      "This is a compressed view of a complex interventional design. Branching is summarized rather than fully expanded.",
      "If you need named cohorts, biomarker pathways, or adaptive decision nodes, switch to a higher detail level.",
    )
  } else if (schemaType === "rwe_secondary_database") {
    addLane("source", "Data source", "The secondary data asset and feasibility logic.")
    addLane("design", "Cohort design", "Cohort construction and comparative analytic framework.")
    addLane("readout", "Readout", "Outcome readout and decision use.")

    addNode("question", "source", "RWE question", `${disease} · ${evidenceIntent}`, "start", 0)
    addNode("database", "source", "Secondary database", study.sponsor || "Claims / EHR / registry source", "database", 1)
    addNode("cohorts", "design", "Cohort construction", `${intervention} vs ${comparator}`, "cohort", 2)
    addNode("analysis", "design", "Comparative analysis", endpoint, "analysis", 3)
    addNode("readout", "readout", "RWE readout", evidenceIntent, "output", 4)

    addEdge("question", "database")
    addEdge("database", "cohorts")
    addEdge("cohorts", "analysis")
    addEdge("analysis", "readout")

    notes.push(
      "This high-level RWE schema emphasizes database fit, cohort construction, and comparative analysis rather than site execution.",
      "Use a higher detail setting only if you need explicit matching, weighting, sensitivity, or subgroup branches.",
    )
  } else if (schemaType === "observational") {
    addLane("setup", "Study setup", "Entry into the observational design.")
    addLane("execution", "Observed comparison", "Exposure groups and follow-up.")
    addLane("readout", "Readout", "Analysis and intended decision use.")

    addNode("question", "setup", "Observational question", `${disease} · ${study.subcategory || "observational design"}`, "start", 0)
    addNode("entry", "setup", "Cohort entry", study.population || lineOfTherapy, "screening", 1)
    addNode("comparison", "execution", "Observed comparison", `${intervention} vs ${comparator}`, "cohort", 2)
    addNode("follow-up", "execution", "Follow-up and outcomes", endpoint, "assessment", 3)
    addNode("readout", "readout", "Decision use", evidenceIntent, "output", 4)

    addEdge("question", "entry")
    addEdge("entry", "comparison")
    addEdge("comparison", "follow-up")
    addEdge("follow-up", "readout")

    notes.push(
      "This is a synopsis-level observational schema, focused on cohort entry, comparison, follow-up, and readout.",
      "Use a higher detail setting only if you need explicit subgroup, matching, or repeated follow-up structure.",
    )
  } else if (schemaType === "evidence_synthesis") {
    addLane("question", "Question and search", "Evidence gap and search strategy.")
    addLane("selection", "Selection and synthesis", "Study inclusion and evidence integration.")
    addLane("readout", "Readout", "Decision-oriented evidence output.")

    addNode("question", "question", "Evidence question", `${disease} · ${study.primaryObjective || "Evidence objective"}`, "start", 0)
    addNode("search", "question", "Search strategy", study.designOverview || "Database and grey literature retrieval", "database", 1)
    addNode("selection", "selection", "Study selection", "Eligibility and evidence extraction", "screening", 2)
    addNode("synthesis", "selection", "Evidence synthesis", study.subcategory || "Synthesis method", "analysis", 3)
    addNode("readout", "readout", "Decision use", evidenceIntent, "output", 4)

    addEdge("question", "search")
    addEdge("search", "selection")
    addEdge("selection", "synthesis")
    addEdge("synthesis", "readout")

    notes.push(
      "This is a high-level evidence-generation schema rather than a participant-level study diagram.",
      "Use a higher detail setting only if you need explicit evidence streams such as network meta-analysis or MAIC branches.",
    )
  } else {
    addLane("setup", "Study setup", "Model or system selection.")
    addLane("execution", "Execution", "Intervention conditions and key readouts.")
    addLane("readout", "Readout", "Interpretation and next-step decision.")

    addNode("concept", "setup", "Non-clinical concept", `${disease} · ${study.primaryObjective || "Study objective"}`, "start", 0)
    addNode("model", "setup", "Model or system", study.population || "Specimen, assay, or model platform", "screening", 1)
    addNode("intervention", "execution", "Intervention conditions", intervention, "arm", 2)
    addNode("readouts", "execution", "Key readouts", endpoint, "assessment", 3)
    addNode("decision", "readout", "Decision use", evidenceIntent, "output", 4)

    addEdge("concept", "model")
    addEdge("model", "intervention")
    addEdge("intervention", "readouts")
    addEdge("readouts", "decision")

    notes.push(
      "This is a compressed non-clinical schema that focuses on the hypothesis, model, readouts, and decision package.",
      "Use a higher detail setting only if you need explicit assay or condition branching.",
    )
  }

  return normalizeStudySchema({
    title,
    schemaType,
    orientation,
    detailLevel: "simple",
    iterationPrompt,
    lanes,
    nodes,
    edges,
    notes,
    generatedAt: new Date().toISOString(),
    provenance: "local_draft",
    manualEdited: false,
    sourceFingerprint: buildStudySchemaFingerprint(study),
    theme,
  })
}

function buildStudySchemaFromStudy(
  study: StudyForm,
  overrides?: Partial<Pick<StudySchemaForm, "orientation" | "detailLevel" | "iterationPrompt" | "theme">>,
): StudySchemaForm {
  const schemaType = inferStudySchemaType(study)
  const orientation = overrides?.orientation || "horizontal"
  const detailLevel = overrides?.detailLevel || "simple"
  const theme = {
    ...DEFAULT_STUDY_SCHEMA_THEME,
    ...(overrides?.theme || {}),
  }
  const disease = getSelectedDiseaseLabel(study) || getResolvedIndication(study) || "Target condition"
  const intervention = study.topIntervention || study.intervention || "Study intervention"
  const comparator = study.topComparator || study.comparator || "Comparator strategy"
  const endpoint = splitItems(getResolvedOutcomes(study))[0] || "Primary endpoint package"
  const objective = study.primaryObjective || "Key research objective"
  const evidenceIntent = getPrimaryEvidenceUseIntent(study) || "Decision use"
  const lineOfTherapy = study.topLineOfTherapy || "Planned setting"
  const title = `${study.studyTitle || "Study concept"} schema`

  if (detailLevel === "simple") {
    return buildSimpleStudySchemaFromStudy(study, schemaType, orientation, theme, title, overrides?.iterationPrompt || "")
  }

  const lanes: StudySchemaLane[] = []
  const nodes: StudySchemaNode[] = []
  const edges: StudySchemaEdge[] = []
  const notes: string[] = []

  const addLane = (id: string, label: string, description: string) => {
    lanes.push({ id, label, description })
  }

  const addNode = (
    id: string,
    laneId: string,
    label: string,
    subtitle: string,
    kind: StudySchemaNodeKind,
    column: number,
    row = 0,
  ) => {
    nodes.push({ id, laneId, label, subtitle, kind, column, row })
  }

  const addEdge = (from: string, to: string, label = "", style: "solid" | "dashed" = "solid") => {
    edges.push({ id: `${from}-${to}-${edges.length + 1}`, from, to, label, style })
  }

  if (schemaType === "interventional") {
    addLane("entry", "Entry and allocation", "Target population, eligibility, and assignment into the study.")
    addLane("arms", "Study arms", "Intervention and comparator experience through treatment.")
    addLane("assessment", "Assessments and follow-up", "Endpoint-supporting visits, readouts, and follow-up.")
    addLane("readout", "Analysis and use", "How the study reads out and what decision it is meant to inform.")

    addNode("concept", "entry", "Study concept", `${disease} · ${study.developmentStage || "planned"} ${study.subcategory || "study"}`, "start", 0)
    addNode("screening", "entry", "Screening and eligibility", study.population || disease, "screening", 1)
    addNode("allocation", "entry", "Randomization / allocation", lineOfTherapy, "decision", 2)
    addNode("intervention-arm", "arms", intervention, "Experimental arm", "arm", 3, 0)
    addNode("comparator-arm", "arms", comparator, "Reference arm", "arm", 3, 1)
    addNode("treatment", "arms", "On-treatment period", study.timeline || "Protocol-defined treatment duration", "milestone", 4)
    addNode("endpoint-assessment", "assessment", endpoint, objective, "assessment", 5, 0)

    if (detailLevel !== "simple") {
      addNode("follow-up", "assessment", "Safety and follow-up", "Durability, adverse events, and longer-term outcomes", "milestone", 6, 0)
    }

    addNode(
      "analysis",
      "readout",
      "Primary analysis",
      `${evidenceIntent} · ${study.sampleSize || "sample size pending"}`,
      "analysis",
      detailLevel === "simple" ? 6 : 7,
      0,
    )
    addNode("decision-use", "readout", "Decision use", evidenceIntent, "output", detailLevel === "simple" ? 7 : 8, 0)

    addEdge("concept", "screening")
    addEdge("screening", "allocation")
    addEdge("allocation", "intervention-arm", "Arm A")
    addEdge("allocation", "comparator-arm", "Arm B")
    addEdge("intervention-arm", "treatment")
    addEdge("comparator-arm", "treatment")
    addEdge("treatment", "endpoint-assessment")
    if (detailLevel !== "simple") {
      addEdge("endpoint-assessment", "follow-up")
      addEdge("follow-up", "analysis")
    } else {
      addEdge("endpoint-assessment", "analysis")
    }
    addEdge("analysis", "decision-use")

    notes.push(
      `This schema reflects a standard interventional ${study.subcategory || "study"} with explicit intervention and comparator paths.`,
      `The decision destination is ${evidenceIntent.toLowerCase()}, so endpoint and readout nodes are framed around that use case.`,
      "If the arm structure or follow-up package needs more detail, regenerate with a request for more cohorts, visits, or milestone nodes.",
    )
  } else if (schemaType === "complex_interventional") {
    addLane("entry", "Entry and assignment", "Eligibility, biomarker or cohort logic, and allocation into the design.")
    addLane("cohorts", "Cohorts or arms", "Parallel cohorts, regimen paths, or adaptive branches.")
    addLane("assessment", "Assessments and adaptations", "Outcome capture, interim review, and confirmation logic.")
    addLane("readout", "Integrated readout", "Analysis package and evidentiary destination.")

    addNode("concept", "entry", "Complex study concept", `${study.subcategory || "Adaptive / multi-cohort design"} in ${disease}`, "start", 0)
    addNode("entry", "entry", "Eligibility and cohort logic", study.population || lineOfTherapy, "screening", 1)
    addNode("assignment", "entry", "Allocation / cohort assignment", study.designOverview || "Biomarker, regimen, or cohort rule set", "decision", 2)
    addNode("cohort-a", "cohorts", intervention, "Primary experimental cohort", "cohort", 3, 0)
    addNode("cohort-b", "cohorts", comparator, "Reference or alternate cohort", "cohort", 3, 1)
    if (detailLevel !== "simple") {
      addNode("cohort-c", "cohorts", "Expansion or adaptive cohort", "Optional cohort branch", "cohort", 3, 2)
    }
    addNode("assessment", "assessment", endpoint, "Primary efficacy and core safety capture", "assessment", 4, 0)
    addNode("interim", "assessment", "Interim adaptation review", "Expansion, graduation, or drop logic", "decision", 5, detailLevel === "detailed" ? 1 : 0)
    addNode("analysis", "readout", "Integrated analysis", `${evidenceIntent} at ${study.developmentStage || "planned stage"}`, "analysis", 6, 0)
    addNode("decision-use", "readout", "Decision use", evidenceIntent, "output", 7, 0)

    addEdge("concept", "entry")
    addEdge("entry", "assignment")
    addEdge("assignment", "cohort-a", "Cohort A")
    addEdge("assignment", "cohort-b", "Cohort B")
    if (detailLevel !== "simple") {
      addEdge("assignment", "cohort-c", "Adaptive cohort", "dashed")
      addEdge("cohort-c", "assessment", "", "dashed")
    }
    addEdge("cohort-a", "assessment")
    addEdge("cohort-b", "assessment")
    addEdge("assessment", "interim")
    addEdge("interim", "analysis")
    addEdge("analysis", "decision-use")

    notes.push(
      "This schema treats the design as a branching, multi-cohort or adaptive interventional study rather than a simple two-arm flow.",
      "Use regeneration instructions if you need named cohorts, biomarker branches, or explicit seamless phase transitions.",
      `The readout is positioned for ${evidenceIntent.toLowerCase()}, so complexity should be justified by the intended decision.`,
    )
  } else if (schemaType === "rwe_secondary_database") {
    addLane("data", "Data source and fit", "Database selection, data provenance, and study feasibility.")
    addLane("cohort", "Cohort construction", "Eligibility, index date, exposure and comparator definitions.")
    addLane("analysis", "Comparative analysis", "Confounding control, follow-up, outcomes, and sensitivity checks.")
    addLane("output", "Evidence package", "Outputs the study is expected to support.")

    addNode("question", "data", "RWE question", `${disease} · ${evidenceIntent}`, "start", 0)
    addNode("database", "data", "Secondary data source", study.sponsor || "Claims / EHR / registry data asset", "database", 1)
    addNode("eligibility", "cohort", "Eligibility and index date", study.population || lineOfTherapy, "screening", 2)
    addNode("treated", "cohort", "Exposure cohort", intervention, "cohort", 3, 0)
    addNode("comparison", "cohort", "Comparator cohort", comparator, "cohort", 3, 1)
    addNode("adjustment", "analysis", "Confounding control", "Matching, weighting, or adjustment strategy", "analysis", 4, 0)
    addNode("outcomes", "analysis", "Outcome ascertainment", endpoint, "assessment", 5, 0)
    if (detailLevel !== "simple") {
      addNode("sensitivity", "analysis", "Sensitivity analyses", "Alternative definitions and robustness checks", "milestone", 6, 1)
    }
    addNode("readout", "output", "RWE readout", `${evidenceIntent} and stakeholder interpretation`, "output", detailLevel === "simple" ? 6 : 7, 0)

    addEdge("question", "database")
    addEdge("database", "eligibility")
    addEdge("eligibility", "treated")
    addEdge("eligibility", "comparison")
    addEdge("treated", "adjustment")
    addEdge("comparison", "adjustment")
    addEdge("adjustment", "outcomes")
    if (detailLevel !== "simple") {
      addEdge("outcomes", "sensitivity", "", "dashed")
      addEdge("sensitivity", "readout")
    } else {
      addEdge("outcomes", "readout")
    }

    notes.push(
      "This schema is framed for secondary database RWE rather than a site-executed study.",
      "Cohort construction and confounding control are shown as central design steps because they determine evidence credibility.",
      "If needed, regenerate with explicit database names, propensity methods, or subgroup branches.",
    )
  } else if (schemaType === "observational") {
    addLane("entry", "Enrollment and entry", "Who enters the observational study and under what criteria.")
    addLane("groups", "Exposure groups", "Observed exposure, care pathways, or comparison groups.")
    addLane("followup", "Follow-up and outcomes", "Outcome capture over time.")
    addLane("analysis", "Analysis and interpretation", "Comparative or descriptive readout and use.")

    addNode("question", "entry", "Observational question", `${disease} · ${study.subcategory || "prospective / retrospective design"}`, "start", 0)
    addNode("enrollment", "entry", "Enrollment / cohort entry", study.population || lineOfTherapy, "screening", 1)
    addNode("exposed", "groups", "Observed exposure group", intervention, "cohort", 2, 0)
    addNode("comparison", "groups", "Comparison group", comparator, "cohort", 2, 1)
    addNode("follow-up", "followup", "Follow-up and outcomes", endpoint, "assessment", 3, 0)
    addNode("analysis", "analysis", "Observational analysis", study.designOverview || evidenceIntent, "analysis", 4, 0)
    addNode("readout", "analysis", "Decision use", evidenceIntent, "output", 5, 0)

    addEdge("question", "enrollment")
    addEdge("enrollment", "exposed")
    addEdge("enrollment", "comparison")
    addEdge("exposed", "follow-up")
    addEdge("comparison", "follow-up")
    addEdge("follow-up", "analysis")
    addEdge("analysis", "readout")

    notes.push(
      "This schema emphasizes cohort entry, observed comparison groups, and follow-up rather than treatment assignment.",
      "If the design is pragmatic but interventional, regenerate from an interventional category to show arm assignment explicitly.",
      `The expected evidence destination is ${evidenceIntent.toLowerCase()}, so the final readout is framed around that use.`,
    )
  } else if (schemaType === "evidence_synthesis") {
    addLane("question", "Question framing", "What evidence gap the synthesis is meant to answer.")
    addLane("identification", "Evidence identification", "Searches, retrieval, and evidence capture.")
    addLane("selection", "Selection and extraction", "Study inclusion logic and data extraction.")
    addLane("synthesis", "Synthesis and outputs", "Evidence integration and decision-oriented outputs.")

    addNode("question", "question", "Evidence question", `${disease} · ${objective}`, "start", 0)
    addNode("search", "identification", "Search and retrieval", study.designOverview || "Database and grey literature strategy", "database", 1)
    addNode("screening", "selection", "Screening and eligibility", "Inclusion / exclusion logic", "screening", 2)
    addNode("evidence-pool", "selection", "Evidence pool", study.population || "Included studies and extracted evidence", "cohort", 3)
    addNode("synthesis", "synthesis", "Evidence synthesis", study.subcategory || "Comparative synthesis method", "analysis", 4)
    addNode("output", "synthesis", "Output package", evidenceIntent, "output", 5)

    addEdge("question", "search")
    addEdge("search", "screening")
    addEdge("screening", "evidence-pool")
    addEdge("evidence-pool", "synthesis")
    addEdge("synthesis", "output")

    notes.push(
      "This schema treats the study as an evidence-generation workflow rather than a participant-based study.",
      "Use regeneration instructions if you need explicit MAIC, network meta-analysis, or post-hoc evidence branches.",
      `The final output is framed for ${evidenceIntent.toLowerCase()}.`,
    )
  } else {
    addLane("hypothesis", "Hypothesis and model", "Scientific framing, model selection, and entry criteria.")
    addLane("intervention", "Intervention or manipulation", "How the test article or perturbation is applied.")
    addLane("readouts", "Readouts", "Primary measurements and supporting assessments.")
    addLane("decision", "Decision package", "Interpretation and next-step decision.")

    addNode("concept", "hypothesis", "Non-clinical concept", `${disease} · ${objective}`, "start", 0)
    addNode("model", "hypothesis", "Model / system selection", study.population || "Specimen, model, or assay platform", "screening", 1)
    addNode("intervention", "intervention", intervention, study.designOverview || "Treatment or perturbation conditions", "arm", 2)
    addNode("readout", "readouts", "Primary readouts", endpoint, "assessment", 3)
    addNode("analysis", "decision", "Interpretation", evidenceIntent, "analysis", 4)
    addNode("output", "decision", "Output package", "Go / no-go or evidence transition", "output", 5)

    addEdge("concept", "model")
    addEdge("model", "intervention")
    addEdge("intervention", "readout")
    addEdge("readout", "analysis")
    addEdge("analysis", "output")

    notes.push(
      "This schema is framed as a non-clinical study flow rather than a participant or cohort-based design.",
      "Use regeneration instructions if you need multiple experimental conditions or assay branches.",
      `The output is positioned for ${evidenceIntent.toLowerCase()}.`,
    )
  }

  return normalizeStudySchema({
    title,
    schemaType,
    orientation,
    detailLevel,
    iterationPrompt: overrides?.iterationPrompt || "",
    lanes,
    nodes,
    edges,
    notes,
    generatedAt: new Date().toISOString(),
    provenance: "local_draft",
    manualEdited: false,
    sourceFingerprint: buildStudySchemaFingerprint(study),
    theme,
  })
}

function wrapSvgText(text: string, maxChars: number) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  })

  if (current) {
    lines.push(current)
  }

  return lines.slice(0, 3)
}

function getStudySchemaNodeStyle(kind: StudySchemaNodeKind, theme: StudySchemaTheme) {
  if (kind === "start" || kind === "output") {
    return { fill: theme.accent, stroke: theme.accent, textFill: "#FFFFFF", strokeDasharray: "" }
  }

  if (kind === "decision") {
    return { fill: "#FFFFFF", stroke: theme.accent, textFill: theme.text, strokeDasharray: "6 4" }
  }

  if (kind === "analysis") {
    return { fill: theme.laneFill, stroke: theme.accent, textFill: theme.text, strokeDasharray: "" }
  }

  if (kind === "database" || kind === "cohort") {
    return { fill: "#FFFFFF", stroke: theme.edge, textFill: theme.text, strokeDasharray: "" }
  }

  return { fill: theme.nodeFill, stroke: theme.accent, textFill: theme.text, strokeDasharray: "" }
}

function buildStudySchemaSvgMarkup(schema: StudySchemaForm, study?: StudyForm) {
  if (!study) {
    return ""
  }

  const schemaType = schema.schemaType || inferStudySchemaType(study)
  const detailLevel = schema.detailLevel || "simple"
  const disease = getSelectedDiseaseLabel(study) || getResolvedIndication(study) || "Target condition"
  const intervention = study.topIntervention || study.intervention || "Study intervention"
  const comparator = study.topComparator || study.comparator || ""
  const primaryObjective = study.primaryObjective || "Primary objective to be confirmed"
  const primaryEndpoint = splitItems(getResolvedOutcomes(study))[0] || "Primary endpoint to be confirmed"
  const evidenceIntent = getPrimaryEvidenceUseIntent(study) || "Decision use to be confirmed"
  const strategicObjective = getStrategicObjectiveLabel(study) || "Program intent to be confirmed"
  const width = 1180
  const background = schema.theme.background || "#F8FBFF"
  const markerId = `schema-arrow-${slugify(`${schema.title}-${schemaType}-${detailLevel}`)}`

  const hexToRgba = (hex: string, alpha: number) => {
    const normalized = hex.replace("#", "").trim()
    const expanded =
      normalized.length === 3 ? normalized.split("").map((character) => `${character}${character}`).join("") : normalized
    const numeric = Number.parseInt(expanded, 16)

    if (Number.isNaN(numeric)) {
      return `rgba(24, 100, 171, ${alpha})`
    }

    const red = (numeric >> 16) & 255
    const green = (numeric >> 8) & 255
    const blue = numeric & 255

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`
  }

  const renderTextLines = (
    lines: string[],
    x: number,
    y: number,
    fontSize: number,
    lineHeight: number,
    fill: string,
    fontWeight = 500,
    opacity = 1,
  ) =>
    lines
      .filter(Boolean)
      .map(
        (line, index) =>
          `<text x="${x}" y="${y + index * lineHeight}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" opacity="${opacity}">${escapeHtml(
            line,
          )}</text>`,
      )
      .join("")

  const getConfig = () => {
    if (schemaType === "rwe_secondary_database") {
      return {
        step1Label: "Data source",
        step2Label: "Cohort selection",
        groupLabel: "Cohort",
        analysisLabel: "Comparative analysis",
      }
    }

    if (schemaType === "observational") {
      return {
        step1Label: "Study setup",
        step2Label: "Observed comparison",
        groupLabel: "Group",
        analysisLabel: "Outcome readout",
      }
    }

    if (schemaType === "evidence_synthesis") {
      return {
        step1Label: "Evidence question",
        step2Label: "Search and screening",
        groupLabel: "Evidence stream",
        analysisLabel: "Synthesis",
      }
    }

    if (schemaType === "non_clinical") {
      return {
        step1Label: "Study setup",
        step2Label: "Model logic",
        groupLabel: "Condition",
        analysisLabel: "Readouts",
      }
    }

    if (schemaType === "complex_interventional") {
      return {
        step1Label: "Study setup",
        step2Label: "Cohort logic",
        groupLabel: "Cohort",
        analysisLabel: "Integrated readout",
      }
    }

    return {
      step1Label: "Study setup",
      step2Label: "Allocation",
      groupLabel: "Arm",
      analysisLabel: "Readout",
    }
  }

  const config = getConfig()
  const palette = [schema.theme.accent, schema.theme.edge, "#64748B"]
  const makeGroup = (header: string, title: string, body: string, color: string) => ({
    header,
    title: title.trim() || "TBD",
    body: body.trim() || "Details to be confirmed",
    color,
  })

  const groups = (() => {
    if (schemaType === "evidence_synthesis") {
      return [
        makeGroup(
          "Evidence base",
          study.designOverview || "Search, screening, and included studies",
          study.population || disease,
          palette[0],
        ),
      ]
    }

    if (schemaType === "rwe_secondary_database") {
      const cards = [makeGroup("Exposure cohort", intervention, study.population || "Database-defined treatment cohort", palette[0])]
      if (comparator.trim()) {
        cards.push(
          makeGroup(
            "Comparator cohort",
            comparator,
            study.designOverview || "Matched, weighted, or adjusted reference cohort",
            palette[1],
          ),
        )
      }
      return cards
    }

    if (schemaType === "observational") {
      const cards = [makeGroup("Observed group", intervention, study.population || disease, palette[0])]
      if (comparator.trim()) {
        cards.push(makeGroup("Comparison group", comparator, study.designOverview || "Reference care pathway", palette[1]))
      }
      return cards
    }

    if (schemaType === "non_clinical") {
      const cards = [makeGroup("Primary condition", intervention, study.designOverview || "Experimental condition", palette[0])]
      if (comparator.trim()) {
        cards.push(makeGroup("Reference condition", comparator, study.population || "Reference condition or control", palette[1]))
      }
      return cards
    }

    if (schemaType === "complex_interventional") {
      const cards = [makeGroup("Experimental cohort", intervention, study.topLineOfTherapy || disease, palette[0])]
      if (comparator.trim()) {
        cards.push(makeGroup("Reference cohort", comparator, study.designOverview || "Comparator or anchor cohort", palette[1]))
      }
      if (detailLevel !== "simple") {
        cards.push(
          makeGroup(
            "Adaptive cohort logic",
            study.subcategory || "Expansion or biomarker-defined cohorts",
            study.designOverview || "Adaptive or staged expansion path",
            palette[2],
          ),
        )
      }
      return cards
    }

    const cards = [makeGroup("Experimental arm", intervention, study.topLineOfTherapy || disease, palette[0])]
    if (comparator.trim()) {
      cards.push(makeGroup("Comparator arm", comparator, study.designOverview || "Reference treatment strategy", palette[1]))
    }
    return cards
  })().slice(0, 3)

  const showExtendedDetail = detailLevel !== "simple"
  const diagramTop = 84
  const leftCardWidth = 246
  const leftCardHeight = 148
  const stepCardWidth = 138
  const stepCardHeight = 94
  const groupWidth = 260
  const groupHeight = showExtendedDetail ? 122 : 110
  const groupGap = 20
  const analysisWidth = 252
  const analysisHeight = 150
  const groupStackHeight = groups.length * groupHeight + Math.max(0, groups.length - 1) * groupGap
  const diagramHeight = Math.max(252, groupStackHeight + 48)
  const leftCardX = 42
  const leftCardY = diagramTop + (diagramHeight - leftCardHeight) / 2
  const stepCardX = 336
  const stepCardY = diagramTop + (diagramHeight - stepCardHeight) / 2
  const groupX = 520
  const groupStartY = diagramTop + (diagramHeight - groupStackHeight) / 2
  const analysisX = 886
  const analysisY = diagramTop + (diagramHeight - analysisHeight) / 2
  const bottomTop = diagramTop + diagramHeight + 48
  const panelHeight = showExtendedDetail ? 148 : 126
  const panelWidth = 348
  const panelGap = 18
  const height = bottomTop + panelHeight + 42

  const step1Title = disease
  const step1Details = uniqueItemsCaseInsensitive([
    study.population || getResolvedIndication(study),
    study.sampleSize ? `Planned size: ${study.sampleSize}` : "",
    study.developmentStage || "",
  ]).slice(0, 2)

  const step2Title =
    schemaType === "interventional"
      ? study.subcategory || "Randomized comparison"
      : schemaType === "rwe_secondary_database"
        ? study.designOverview || "Cohort definition and confounding control"
        : schemaType === "evidence_synthesis"
          ? study.designOverview || "Structured search and selection logic"
          : study.designOverview || study.subcategory || "Methodology"
  const step2Details = uniqueItemsCaseInsensitive([
    study.timeline || "",
    comparator ? `Against ${comparator}` : "",
  ]).slice(0, 2)

  const detailPanels = [
    {
      title: "Primary objective",
      lines: wrapSvgText(primaryObjective, 46),
      accent: schema.theme.accent,
      fill: "#FFFFFF",
      border: hexToRgba(schema.theme.accent, 0.24),
    },
    {
      title: config.analysisLabel,
      lines: wrapSvgText(primaryEndpoint, 46).concat(
        showExtendedDetail && splitStructuredEditorItems(study.secondaryObjectives || "")[0]
          ? wrapSvgText(splitStructuredEditorItems(study.secondaryObjectives || "")[0], 46)
          : [],
      ),
      accent: schema.theme.edge,
      fill: "#FFFFFF",
      border: hexToRgba(schema.theme.edge, 0.2),
    },
    {
      title: "Decision use",
      lines: uniqueItemsCaseInsensitive([
        evidenceIntent,
        strategicObjective ? `Program intent: ${strategicObjective}` : "",
        study.timeline || "",
      ]).flatMap((item) => wrapSvgText(item, 44)).slice(0, showExtendedDetail ? 5 : 4),
      accent: schema.theme.text,
      fill: "#FFFFFF",
      border: "rgba(148, 163, 184, 0.35)",
    },
  ]

  const connectionColor = hexToRgba(schema.theme.edge, 0.72)
  const groupJoinX = analysisX - 34
  const trunkX = groupX - 24
  const groupCenters = groups.map((_, index) => groupStartY + index * (groupHeight + groupGap) + groupHeight / 2)
  const step2CenterY = stepCardY + stepCardHeight / 2
  const analysisCenterY = analysisY + analysisHeight / 2
  const groupMidY = groupCenters.length
    ? groupCenters.reduce((sum, value) => sum + value, 0) / groupCenters.length
    : step2CenterY

  const lineMarkup = [
    `<path d="M ${leftCardX + leftCardWidth} ${leftCardY + leftCardHeight / 2} H ${stepCardX - 20}" fill="none" stroke="${connectionColor}" stroke-width="3" stroke-linecap="round" marker-end="url(#${markerId})" />`,
    `<path d="M ${stepCardX + stepCardWidth} ${step2CenterY} H ${trunkX}" fill="none" stroke="${connectionColor}" stroke-width="3" stroke-linecap="round" />`,
  ]

  if (groupCenters.length > 1) {
    lineMarkup.push(
      `<path d="M ${trunkX} ${groupCenters[0]} V ${groupCenters[groupCenters.length - 1]}" fill="none" stroke="${connectionColor}" stroke-width="3" stroke-linecap="round" />`,
      `<path d="M ${groupJoinX} ${groupCenters[0]} V ${groupCenters[groupCenters.length - 1]}" fill="none" stroke="${connectionColor}" stroke-width="3" stroke-linecap="round" />`,
    )
  }

  groupCenters.forEach((centerY) => {
    lineMarkup.push(
      `<path d="M ${trunkX} ${centerY} H ${groupX - 14}" fill="none" stroke="${connectionColor}" stroke-width="3" stroke-linecap="round" marker-end="url(#${markerId})" />`,
      `<path d="M ${groupX + groupWidth} ${centerY} H ${groupJoinX}" fill="none" stroke="${connectionColor}" stroke-width="3" stroke-linecap="round" />`,
    )
  })

  lineMarkup.push(
    `<path d="M ${groupJoinX} ${groupMidY} H ${analysisX - 16}" fill="none" stroke="${connectionColor}" stroke-width="3" stroke-linecap="round" marker-end="url(#${markerId})" />`,
  )

  const groupMarkup = groups
    .map((group, index) => {
      const groupY = groupStartY + index * (groupHeight + groupGap)
      const headerFill = hexToRgba(group.color, 0.14)
      const borderColor = hexToRgba(group.color, 0.48)
      const titleLines = wrapSvgText(group.title, 28).slice(0, 2)
      const bodyLines = wrapSvgText(group.body, 34).slice(0, showExtendedDetail ? 3 : 2)

      return `
        <g>
          <rect x="${groupX}" y="${groupY}" width="${groupWidth}" height="${groupHeight}" rx="24" fill="${schema.theme.nodeFill}" stroke="${borderColor}" stroke-width="2" />
          <rect x="${groupX}" y="${groupY}" width="${groupWidth}" height="40" rx="24" fill="${headerFill}" />
          <text x="${groupX + 18}" y="${groupY + 25}" font-size="11" font-weight="700" letter-spacing="1.1" fill="${group.color}">${escapeHtml(group.header.toUpperCase())}</text>
          ${renderTextLines(titleLines, groupX + 18, groupY + 62, 18, 20, schema.theme.text, 700)}
          ${renderTextLines(bodyLines, groupX + 18, groupY + 92, 12, 16, schema.theme.text, 500, 0.82)}
        </g>
      `
    })
    .join("")

  const panelMarkup = detailPanels
    .map((panel, index) => {
      const panelX = 42 + index * (panelWidth + panelGap)
      return `
        <g>
          <rect x="${panelX}" y="${bottomTop}" width="${panelWidth}" height="${panelHeight}" rx="24" fill="${panel.fill}" stroke="${panel.border}" stroke-width="1.8" />
          <text x="${panelX + 18}" y="${bottomTop + 26}" font-size="11" font-weight="700" letter-spacing="1.2" fill="${panel.accent}">${escapeHtml(panel.title.toUpperCase())}</text>
          ${renderTextLines(panel.lines.slice(0, showExtendedDetail ? 5 : 4), panelX + 18, bottomTop + 56, 13, 18, schema.theme.text, 600, 0.92)}
        </g>
      `
    })
    .join("")

  const notesBanner =
    schema.notes.length > 0
      ? `
        <rect x="42" y="34" width="1096" height="30" rx="15" fill="${hexToRgba(schema.theme.accent, 0.08)}" />
        <text x="58" y="53" font-size="11" font-weight="700" letter-spacing="1.1" fill="${schema.theme.accent}">${escapeHtml(
          wrapSvgText(schema.notes[0], 120)[0] || "",
        )}</text>
      `
      : ""

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMinYMin meet" style="display:block;width:100%;height:auto;" role="img" aria-label="${escapeHtml(schema.title || "Study schema")}">
      <defs>
        <marker id="${markerId}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="${connectionColor}" />
        </marker>
      </defs>
      <rect width="${width}" height="${height}" rx="32" fill="${background}" />
      ${notesBanner}
      <text x="42" y="26" font-size="11" font-weight="700" letter-spacing="1.2" fill="${schema.theme.accent}">ONE-SLIDE STUDY SCHEMA</text>

      <g>
        <rect x="${leftCardX}" y="${leftCardY}" width="${leftCardWidth}" height="${leftCardHeight}" rx="28" fill="${schema.theme.accent}" />
        <text x="${leftCardX + 20}" y="${leftCardY + 28}" font-size="11" font-weight="700" letter-spacing="1.2" fill="#FFFFFF" opacity="0.82">STEP 1 · ${escapeHtml(config.step1Label.toUpperCase())}</text>
        ${renderTextLines(wrapSvgText(step1Title, 26).slice(0, 2), leftCardX + 20, leftCardY + 64, 20, 22, "#FFFFFF", 700)}
        ${renderTextLines(step1Details.flatMap((item) => wrapSvgText(item, 28)).slice(0, 3), leftCardX + 20, leftCardY + 102, 12, 16, "#FFFFFF", 500, 0.9)}
      </g>

      <g>
        <rect x="${stepCardX}" y="${stepCardY}" width="${stepCardWidth}" height="${stepCardHeight}" rx="28" fill="${schema.theme.laneFill}" stroke="${hexToRgba(schema.theme.accent, 0.42)}" stroke-width="2.4" />
        <text x="${stepCardX + 18}" y="${stepCardY + 24}" font-size="11" font-weight="700" letter-spacing="1.1" fill="${schema.theme.accent}">STEP 2</text>
        ${renderTextLines(wrapSvgText(step2Title, 17).slice(0, 2), stepCardX + 18, stepCardY + 50, 15, 18, schema.theme.text, 700)}
        ${renderTextLines(step2Details.flatMap((item) => wrapSvgText(item, 18)).slice(0, 2), stepCardX + 18, stepCardY + 76, 11, 14, schema.theme.text, 500, 0.75)}
      </g>

      ${lineMarkup.join("")}
      ${groupMarkup}

      <g>
        <rect x="${analysisX}" y="${analysisY}" width="${analysisWidth}" height="${analysisHeight}" rx="28" fill="${schema.theme.nodeFill}" stroke="${hexToRgba(schema.theme.edge, 0.44)}" stroke-width="2.2" />
        <text x="${analysisX + 20}" y="${analysisY + 28}" font-size="11" font-weight="700" letter-spacing="1.2" fill="${schema.theme.edge}">STEP 3 · ${escapeHtml(config.analysisLabel.toUpperCase())}</text>
        ${renderTextLines(wrapSvgText(primaryEndpoint, 28).slice(0, 3), analysisX + 20, analysisY + 60, 16, 19, schema.theme.text, 700)}
        ${renderTextLines(
          uniqueItemsCaseInsensitive([
            evidenceIntent,
            study.timeline ? `Timeline: ${study.timeline}` : "",
          ])
            .flatMap((item) => wrapSvgText(item, 30))
            .slice(0, 3),
          analysisX + 20,
          analysisY + 112,
          12,
          15,
          schema.theme.text,
          500,
          0.78,
        )}
      </g>

      ${panelMarkup}
    </svg>
  `
}

function inferEndpointType(outcomes: string) {
  const text = outcomes.toLowerCase()

  if (text.includes("survival") || text.includes("progression") || text.includes("time-to")) {
    return "Time-to-event"
  }

  if (text.includes("rate") || text.includes("response") || text.includes("incidence") || text.includes("proportion")) {
    return "Binary"
  }

  if (text.includes("score") || text.includes("change") || text.includes("mean") || text.includes("scale")) {
    return "Continuous"
  }

  return "Mixed or composite"
}

function inferAnalysisModel(category: string, endpointType: string) {
  if (category === "evidence-synthesis") {
    return "Random-effects evidence synthesis model with prespecified heterogeneity assessment"
  }

  if (endpointType === "Time-to-event") {
    return "Stratified Cox proportional hazards model and Kaplan-Meier summaries"
  }

  if (endpointType === "Binary") {
    return "Logistic regression or Cochran-Mantel-Haenszel analysis, adjusted for key baseline factors"
  }

  if (endpointType === "Continuous") {
    return "ANCOVA or mixed model for repeated measures with baseline adjustment"
  }

  return "Generalized linear modeling framework aligned to the primary endpoint distribution"
}

function buildPicoFromStudy(study: StudyForm): PicoForm {
  const normalizedStudy = normalizeStudyForm(study)
  const chosenEndpoints = getAllChosenEndpoints(normalizedStudy)
  const endpointText = getResolvedOutcomes(normalizedStudy)
  const evidenceIntent = getPrimaryEvidenceUseIntent(normalizedStudy)
  const interventionFallback =
    normalizedStudy.category === "evidence-synthesis"
      ? "Systematic identification and synthesis of relevant published and unpublished evidence"
      : "Intervention or exposure to be finalized"

  const comparatorFallback =
    normalizedStudy.category === "interventional"
      ? "Placebo, standard of care, or active comparator as applicable"
      : "Relevant external, internal, or historical comparator"

  const prompt = [
    "Extract publication-ready PICO elements from the following study design details.",
    `Study title: ${normalizedStudy.studyTitle || "Untitled study"}`,
    `Development stage: ${normalizedStudy.developmentStage || "Not selected"}`,
    `Strategic objective: ${getStrategicObjectiveLabel(normalizedStudy) || "Not selected"}`,
    `Primary evidence use intent: ${evidenceIntent || "Not selected"}`,
    `Secondary evidence use intents: ${normalizedStudy.secondaryEvidenceUseIntents.join(", ") || "None selected"}`,
    `Therapeutic area: ${normalizedStudy.therapeuticArea || "Not selected"}`,
    `Disease: ${getSelectedDiseaseLabel(normalizedStudy) || "Not selected"}`,
    `Intervention / drug: ${normalizedStudy.topIntervention || normalizedStudy.intervention || "Not provided"}`,
    `Intervention class: ${normalizedStudy.topInterventionClass || "Not provided"}`,
    `Comparator: ${normalizedStudy.topComparator || normalizedStudy.comparator || "Not provided"}`,
    `Line of therapy / setting: ${normalizedStudy.topLineOfTherapy || "Not provided"}`,
    `Category: ${normalizedStudy.category || "Not selected"}`,
    `Subcategory: ${normalizedStudy.subcategory || "Not selected"}`,
    `Primary objective: ${normalizedStudy.primaryObjective || "Not provided"}`,
    `Population notes: ${normalizedStudy.population || normalizedStudy.eligibility || getResolvedIndication(normalizedStudy) || "Not provided"}`,
    `Intervention/exposure: ${normalizedStudy.intervention || "Not provided"}`,
    `Comparator: ${normalizedStudy.comparator || "Not provided"}`,
    `Endpoints: ${endpointText || "Not provided"}`,
    `Timing: ${normalizedStudy.timeline || "Not provided"}`,
    "Return concise PICO statements and highlight any assumptions that need biostatistics review.",
    "Keep the PICO framing compatible with the declared evidence destination.",
  ].join("\n")

  return {
    population:
      normalizedStudy.population || normalizedStudy.eligibility || getResolvedIndication(normalizedStudy) || "Target population to be confirmed",
    intervention: normalizedStudy.topIntervention || normalizedStudy.intervention || interventionFallback,
    comparator: normalizedStudy.topComparator || normalizedStudy.comparator || comparatorFallback,
    outcomes: endpointText || normalizedStudy.primaryObjective || "Primary and secondary outcomes to be confirmed",
    timeframe: normalizedStudy.timeline || "Assessment period to be confirmed",
    prompt,
  }
}

function buildStatsFromStudy(study: StudyForm, pico: PicoForm): StatsForm {
  const endpointType = inferEndpointType(pico.outcomes || study.outcomes)
  const evidenceIntent = getPrimaryEvidenceUseIntent(study).toLowerCase()
  const developmentStage = (study.developmentStage || "").toLowerCase()
  const confirmatoryStudy =
    study.category === "interventional" &&
    study.subcategory !== "Pragmatic Study" &&
    (/phase 3|phase 4|post-marketing/.test(developmentStage) || /label|hta|regulatory/.test(evidenceIntent))
  const alpha =
    /publication/.test(evidenceIntent) && !confirmatoryStudy ? "Two-sided 0.05, refine if exploratory" : "Two-sided 0.05"
  const power = /label|hta|regulatory/.test(evidenceIntent) || /phase 3|phase 4/.test(developmentStage) ? "90%" : confirmatoryStudy ? "90%" : "80%"
  const effectSize =
    endpointType === "Time-to-event"
      ? "Hazard ratio target of approximately 0.75, or clinically meaningful alternative"
      : endpointType === "Binary"
        ? "Absolute difference of 10-15 percentage points, or clinically meaningful alternative"
        : endpointType === "Continuous"
          ? "Standardized mean difference of 0.35-0.50, or clinically meaningful alternative"
          : "Effect size to be aligned to the composite endpoint definition"

  const variability =
    endpointType === "Binary"
      ? "Event rate assumptions should be calibrated from historical or literature data"
      : endpointType === "Time-to-event"
        ? "Assume median event timing based on current standard-of-care evidence"
        : "Standard deviation or variance estimate should be validated from pilot or literature evidence"

  const rationale = [
    `Drafted for a ${study.developmentStage || "planned"} ${study.subcategory || study.category || "study"} focused on ${getResolvedIndication(study) || "the target condition"}.`,
    `The evidence destination is ${getPrimaryEvidenceUseIntent(study) || "not yet specified"}, which should influence confirmatory rigor, comparator discipline, and endpoint hierarchy.`,
    `Primary endpoint currently behaves as ${endpointType.toLowerCase()}.`,
    "These assumptions are intended as GenAI-assisted starting points and require formal biostatistics confirmation before use.",
  ].join(" ")

  const prompt = [
    "Act as a senior biostatistician and refine the synopsis assumptions below.",
    `Study title: ${study.studyTitle || "Untitled study"}`,
    `Development stage: ${study.developmentStage || "Not provided"}`,
    `Primary evidence use intent: ${getPrimaryEvidenceUseIntent(study) || "Not provided"}`,
    `Design overview: ${study.designOverview || "Not provided"}`,
    `Primary objective: ${study.primaryObjective || "Not provided"}`,
    `PICO population: ${pico.population || "Not provided"}`,
    `PICO intervention: ${pico.intervention || "Not provided"}`,
    `PICO comparator: ${pico.comparator || "Not provided"}`,
    `PICO outcomes: ${pico.outcomes || "Not provided"}`,
    `Suggested endpoint type: ${endpointType}`,
    `Draft effect size: ${effectSize}`,
    "Return synopsis-ready assumptions for estimand, hypothesis, alpha, power, missing data, and primary model.",
    "Make the assumptions proportionate to the declared evidence destination and development stage.",
  ].join("\n")

  return {
    estimand:
      study.category === "evidence-synthesis"
        ? "Population-average comparative treatment effect across eligible evidence sources"
        : "Treatment or exposure effect in the target study population under the primary intercurrent event strategy",
    endpointType,
    hypothesis:
      study.category === "evidence-synthesis"
        ? "Evidence synthesis will test whether the totality of evidence supports a clinically meaningful comparative effect"
        : "Superiority hypothesis unless protocol-specific justification indicates otherwise",
    alpha,
    power,
    effectSize,
    variability,
    attrition:
      study.category === "non-clinical"
        ? "Contingency for assay failure, non-evaluable samples, or model attrition should be prespecified"
        : "Assume 10-15% non-evaluable, discontinuation, or dropout rate unless historical evidence suggests otherwise",
    analysisModel: inferAnalysisModel(study.category, endpointType),
    missingData:
      endpointType === "Time-to-event"
        ? "Censor according to prespecified rules and evaluate sensitivity analyses for informative censoring"
        : "Use prespecified imputation or model-based handling with sensitivity analyses for missing-not-at-random risk",
    rationale,
    prompt,
  }
}

function buildBooleanClause(items: string[]) {
  if (!items.length) {
    return ""
  }

  return `(${items.map((item) => `"${item}"`).join(" OR ")})`
}

function buildLiteratureFromState(study: StudyForm, pico: PicoForm): LiteratureForm {
  const diseaseTerms = splitItems(getResolvedIndication(study) || pico.population)
  const interventionTerms = splitItems(pico.intervention)
  const comparatorTerms = splitItems(pico.comparator)
  const outcomeTerms = splitItems(pico.outcomes || getAllChosenEndpoints(study).join("\n"))

  const pubmedParts = [
    buildBooleanClause(diseaseTerms),
    buildBooleanClause(interventionTerms),
    comparatorTerms.length ? buildBooleanClause(comparatorTerms) : "",
    outcomeTerms.length ? buildBooleanClause(outcomeTerms) : "",
  ].filter(Boolean)

  const pubmedQuery = pubmedParts.join(" AND ")
  const embaseQuery = `${pubmedQuery || `"${study.studyTitle || "study synopsis"}"`} AND ('clinical study'/exp OR 'observational study'/exp)`

  const themes = [
    `Burden of disease and current standard of care for ${study.indication || "the target condition"}`,
    `Evidence gap supporting a ${study.subcategory || study.category || "planned"} design`,
    `Evidence expectations for ${getPrimaryEvidenceUseIntent(study) || "the intended evidence destination"}`,
    `Clinical or methodological context for ${pico.intervention || "the proposed intervention/exposure"}`,
    `Outcome relevance for ${pico.outcomes || "the primary endpoint set"}`,
  ]

  const prompt = [
    "Develop a literature search and background synthesis plan for a study synopsis.",
    `Clinical question: ${study.primaryObjective || "Not provided"}`,
    `Development stage: ${study.developmentStage || "Not provided"}`,
    `Primary evidence use intent: ${getPrimaryEvidenceUseIntent(study) || "Not provided"}`,
    `Population: ${pico.population || "Not provided"}`,
    `Intervention/exposure: ${pico.intervention || "Not provided"}`,
    `Comparator: ${pico.comparator || "Not provided"}`,
    `Outcomes: ${pico.outcomes || "Not provided"}`,
    `Preferred databases: PubMed, Embase, Cochrane Library, ClinicalTrials.gov, congress abstracts`,
    "Return background themes, inclusion/exclusion criteria, and search strings optimized for synopsis drafting.",
    "Emphasize the evidence context needed for the declared evidence destination.",
  ].join("\n")

  return {
    researchQuestion:
      study.primaryObjective || `What evidence best supports the rationale and design choices for ${study.studyTitle || "this study"}?`,
    databases: "PubMed\nEmbase\nCochrane Library\nClinicalTrials.gov\nConference proceedings / grey literature",
    evidenceWindow: "Prioritize the last 10 years, then extend backward for seminal trials and guideline-defining studies",
    inclusionCriteria:
      `Human studies or relevant evidence aligned to ${pico.population || "the target population"}, ${pico.intervention || "the intervention/exposure"}, and meaningful outcomes`,
    exclusionCriteria:
      "Narrative opinion pieces without methods, duplicate publications, superseded interim analyses, and clearly non-relevant populations",
    keywords: [...diseaseTerms, ...interventionTerms, ...outcomeTerms].filter(Boolean).join("\n"),
    pubmedQuery,
    embaseQuery,
    greyLiteraturePlan:
      "Screen ClinicalTrials.gov, regulatory documents, major congress abstracts, and reference lists from pivotal reviews and guidelines.",
    backgroundThemes: themes.join("\n"),
    prompt,
  }
}

function buildSchedulePromptFromState(
  study: StudyForm,
  pico: PicoForm,
  stats: StatsForm,
  literature: LiteratureForm,
  schedule?: Partial<ScheduleForm>,
) {
  return [
    (schedule?.prompt || DEFAULT_SCHEDULE_PROMPT).trim(),
    "",
    "Study context:",
    `Study title: ${study.studyTitle || "Untitled study"}`,
    `Development stage: ${study.developmentStage || "Not selected"}`,
    `Primary evidence use intent: ${getPrimaryEvidenceUseIntent(study) || "Not selected"}`,
    `Therapeutic area: ${study.therapeuticArea || "Not selected"}`,
    `Disease / indication: ${getResolvedIndication(study) || pico.population || "Not provided"}`,
    `Study subtype: ${study.subcategory || study.category || "Interventional study"}`,
    `Primary objective: ${study.primaryObjective || "Not provided"}`,
    `Intervention: ${study.topIntervention || pico.intervention || study.intervention || "Not provided"}`,
    `Comparator: ${study.topComparator || pico.comparator || study.comparator || "Not provided"}`,
    `Endpoints: ${pico.outcomes || getResolvedOutcomes(study) || "Not provided"}`,
    `Statistical context: ${stats.endpointType || "Not provided"} endpoint using ${stats.analysisModel || "analysis model pending"}`,
    `Operational notes: ${study.operationalNotes || study.timeline || "Not provided"}`,
    `Literature themes: ${literature.backgroundThemes || "Not provided"}`,
    schedule?.iterationPrompt?.trim()
      ? `Iteration instruction: ${schedule.iterationPrompt.trim()}`
      : "Iteration instruction: Generate the best-fit first draft based on the study context.",
  ].join("\n")
}

function inferScheduleComplexity(study: StudyForm, schedule?: Partial<ScheduleForm>) {
  const text = `${schedule?.iterationPrompt || ""} ${study.operationalNotes || ""} ${study.timeline || ""} ${getPrimaryEvidenceUseIntent(study)}`.toLowerCase()

  if (/(simple|simplify|minimal|lean|high[- ]level)/.test(text) || study.subcategory === "Pragmatic Study") {
    return "simple"
  }

  if (
    /(detailed|detail|complex|intensive|dense|frequent|rich)/.test(text) ||
    study.therapeuticArea === "Oncology" ||
    study.subcategory === "Adaptive Trial"
  ) {
    return "detailed"
  }

  return "standard"
}

function createScheduleColumns(
  layout: Array<{ phase: string; period: string; visit: string; footnote?: string }>,
): ScheduleColumn[] {
  return layout.map((column, index) => ({
    id: `visit-${index + 1}`,
    phase: column.phase,
    period: column.period,
    visit: column.visit,
    footnote: column.footnote || "",
  }))
}

function buildScheduleCells(
  columns: ScheduleColumn[],
  rules: Array<{ when: (column: ScheduleColumn, index: number) => boolean; value: string }>,
) {
  const cells = Object.fromEntries(columns.map((column) => [column.id, ""])) as Record<string, string>

  columns.forEach((column, index) => {
    const rule = rules.find((candidate) => candidate.when(column, index))
    if (rule) {
      cells[column.id] = rule.value
    }
  })

  return cells
}

function buildScheduleFromState(
  study: StudyForm,
  pico: PicoForm,
  stats: StatsForm,
  literature: LiteratureForm,
  schedule?: Partial<ScheduleForm>,
): ScheduleForm {
  const complexity = inferScheduleComplexity(study, schedule)
  const oncologyStudy = study.therapeuticArea === "Oncology"
  const interventionName = (study.topIntervention || pico.intervention || study.intervention || "Investigational product").trim()
  const comparatorName = (study.topComparator || pico.comparator || study.comparator || "").trim()
  const endpointText = (pico.outcomes || getResolvedOutcomes(study) || "").toLowerCase()
  const strategicText = getStrategicObjectiveLabel(study).toLowerCase()
  const evidenceIntentText = getPrimaryEvidenceUseIntent(study).toLowerCase()
  const includeComparatorAdministration = Boolean(comparatorName) && !/(none|no comparator|n\/a)/i.test(comparatorName)
  const includePRO = /(quality of life|patient-reported|patient reported|symptom|score|questionnaire|pro)/i.test(
    endpointText,
  )
  const includeImaging = oncologyStudy || /(response|survival|imaging|radiographic|tumou?r)/i.test(endpointText)
  const includeResourceUse = /(market access|hta|real-world|real world|defend market share)/i.test(
    `${strategicText} ${evidenceIntentText}`,
  )

  const columns =
    complexity === "simple"
      ? createScheduleColumns([
          { phase: "Screening", period: "≤28 days", visit: "Screening" },
          { phase: "Treatment Phase", period: "Cycle 1", visit: "Day 1" },
          { phase: "Treatment Phase", period: "Cycle 1", visit: "Day 15" },
          { phase: "Treatment Phase", period: "Repeating Cycles", visit: "Day 1" },
          { phase: "Follow-up Phase", period: "End of Treatment", visit: "EOT" },
          { phase: "Follow-up Phase", period: "Safety Follow-up", visit: "30 days" },
        ])
      : complexity === "detailed"
        ? createScheduleColumns([
            { phase: "Screening", period: "≤28 days", visit: "Screening" },
            { phase: "Treatment Phase", period: "Cycle 1 (4 weeks)", visit: "Day 1" },
            { phase: "Treatment Phase", period: "Cycle 1 (4 weeks)", visit: "Day 8" },
            { phase: "Treatment Phase", period: "Cycle 1 (4 weeks)", visit: "Day 15" },
            { phase: "Treatment Phase", period: "Cycle 1 (4 weeks)", visit: "Day 22" },
            { phase: "Treatment Phase", period: "Cycle 2-4 (4 weeks/cycle)", visit: "Day 1" },
            { phase: "Treatment Phase", period: "Cycle 2-4 (4 weeks/cycle)", visit: "Day 15" },
            { phase: "Treatment Phase", period: "Cycle 5+ (6 weeks/cycle)", visit: "Day 1" },
            { phase: "Treatment Phase", period: "Cycle 5+ (6 weeks/cycle)", visit: "Day 22" },
            { phase: "Follow-up Phase", period: "End of Treatment", visit: "EOT" },
            { phase: "Follow-up Phase", period: "Safety Follow-up", visit: "30 days" },
            {
              phase: "Follow-up Phase",
              period: oncologyStudy ? "Survival Follow-up" : "Long-term Follow-up",
              visit: oncologyStudy ? "Q12W" : "Q8-12W",
            },
          ])
        : createScheduleColumns([
            { phase: "Screening", period: "≤28 days", visit: "Screening" },
            { phase: "Treatment Phase", period: "Cycle 1", visit: "Day 1" },
            { phase: "Treatment Phase", period: "Cycle 1", visit: "Day 8" },
            { phase: "Treatment Phase", period: "Cycle 1", visit: "Day 15" },
            { phase: "Treatment Phase", period: "Repeating Cycles", visit: "Day 1" },
            { phase: "Treatment Phase", period: "Repeating Cycles", visit: "Day 22" },
            { phase: "Follow-up Phase", period: "End of Treatment", visit: "EOT" },
            { phase: "Follow-up Phase", period: "Safety Follow-up", visit: "30 days" },
            ...(oncologyStudy
              ? [{ phase: "Follow-up Phase", period: "Survival Follow-up", visit: "Q12W" }]
              : []),
          ])

  const isScreening = (column: ScheduleColumn) => column.phase === "Screening"
  const isTreatment = (column: ScheduleColumn) => column.phase === "Treatment Phase"
  const isCycleOne = (column: ScheduleColumn) => column.period.toLowerCase().includes("cycle 1")
  const isDayOne = (column: ScheduleColumn) => column.visit.toLowerCase() === "day 1"
  const isTreatmentDayOne = (column: ScheduleColumn) => isTreatment(column) && isDayOne(column)
  const isEndOfTreatment = (column: ScheduleColumn) => column.period.toLowerCase().includes("end of treatment")
  const isSafetyFollowUp = (column: ScheduleColumn) => column.period.toLowerCase().includes("safety")
  const isLongFollowUp = (column: ScheduleColumn) =>
    column.phase === "Follow-up Phase" && !isEndOfTreatment(column) && !isSafetyFollowUp(column)

  const rowDefinitions = [
    {
      group: "Screening / Administrative",
      activity: "Informed consent",
      notes: "",
      rules: [{ when: (column: ScheduleColumn) => isScreening(column), value: "X" }],
    },
    {
      group: "Screening / Administrative",
      activity: "Demographics and medical history",
      notes: "",
      rules: [{ when: (column: ScheduleColumn) => isScreening(column), value: "X" }],
    },
    {
      group: "Screening / Administrative",
      activity: "Inclusion / exclusion criteria",
      notes: "Reconfirm before first dose if needed.",
      rules: [
        { when: (column: ScheduleColumn) => isScreening(column), value: "X" },
        { when: (column: ScheduleColumn) => isTreatmentDayOne(column), value: "X" },
      ],
    },
    {
      group: "Study Treatment Administration",
      activity: `${interventionName} administration`,
      notes: "Only on dosing visits.",
      rules: [{ when: (column: ScheduleColumn) => isTreatment(column), value: "X" }],
    },
    ...(includeComparatorAdministration
      ? [
          {
            group: "Study Treatment Administration",
            activity: `${comparatorName} administration / management`,
            notes: "Apply if the comparator arm or background standard of care is relevant.",
            rules: [{ when: (column: ScheduleColumn) => isTreatment(column), value: "X" }],
          },
        ]
      : []),
    {
      group: "Efficacy Assessments",
      activity: includeImaging ? "Imaging or key disease status assessment" : "Primary efficacy assessment",
      notes: includeImaging ? "Collect standard-of-care results if performed." : "",
      rules: [
        { when: (column: ScheduleColumn) => isScreening(column), value: "X" },
        { when: (column: ScheduleColumn) => isTreatmentDayOne(column), value: "X" },
        { when: (column: ScheduleColumn) => isEndOfTreatment(column), value: "X" },
        { when: (column: ScheduleColumn) => isLongFollowUp(column), value: "X" },
      ],
    },
    {
      group: "Efficacy Assessments",
      activity: "Endpoint-specific efficacy collection",
      notes: getResolvedOutcomes(study) || "Align this row to the selected endpoint package.",
      rules: [
        { when: (column: ScheduleColumn) => isCycleOne(column) && isDayOne(column), value: "X" },
        { when: (column: ScheduleColumn) => isTreatmentDayOne(column), value: "X" },
        { when: (column: ScheduleColumn) => isEndOfTreatment(column), value: "X" },
      ],
    },
    ...(includePRO
      ? [
          {
            group: "Efficacy Assessments",
            activity: "Patient-reported outcomes",
            notes: "Collect before treatment administration when possible.",
            rules: [
              { when: (column: ScheduleColumn) => isScreening(column), value: "X" },
              { when: (column: ScheduleColumn) => isTreatmentDayOne(column), value: "X" },
              { when: (column: ScheduleColumn) => isEndOfTreatment(column), value: "X" },
              { when: (column: ScheduleColumn) => isLongFollowUp(column), value: "X" },
            ],
          },
        ]
      : []),
    {
      group: "Safety Assessments",
      activity: "Physical examination",
      notes: "Focused examination acceptable at interim visits if prespecified.",
      rules: [
        { when: (column: ScheduleColumn) => isScreening(column), value: "X" },
        { when: (column: ScheduleColumn) => isTreatmentDayOne(column), value: "X" },
        { when: (column: ScheduleColumn) => isEndOfTreatment(column), value: "X" },
        { when: (column: ScheduleColumn) => isSafetyFollowUp(column), value: "X" },
      ],
    },
    {
      group: "Safety Assessments",
      activity: "Vital signs",
      notes: "",
      rules: [
        { when: (column: ScheduleColumn) => isScreening(column), value: "X" },
        { when: (column: ScheduleColumn) => isTreatment(column), value: "X" },
        { when: (column: ScheduleColumn) => isEndOfTreatment(column), value: "X" },
      ],
    },
    {
      group: "Safety Assessments",
      activity: "ECG / targeted safety assessments",
      notes: "Use X (as clinically indicated) if the safety monitoring burden is lighter.",
      rules: [
        { when: (column: ScheduleColumn) => isScreening(column), value: "X" },
        { when: (column: ScheduleColumn) => isCycleOne(column) && isDayOne(column), value: "X" },
        { when: (column: ScheduleColumn) => isEndOfTreatment(column), value: "X" },
      ],
    },
    {
      group: "Clinical Laboratory Tests",
      activity: "Hematology / chemistry / liver function tests",
      notes: "",
      rules: [
        { when: (column: ScheduleColumn) => isScreening(column), value: "X" },
        { when: (column: ScheduleColumn) => isTreatmentDayOne(column), value: "X" },
        { when: (column: ScheduleColumn) => isEndOfTreatment(column), value: "X" },
        { when: (column: ScheduleColumn) => isSafetyFollowUp(column), value: "X" },
      ],
    },
    {
      group: "Clinical Laboratory Tests",
      activity: "Disease-specific biomarkers",
      notes: "Tailor to disease-specific biomarkers or pharmacodynamic markers.",
      rules: [
        { when: (column: ScheduleColumn) => isScreening(column), value: "X" },
        { when: (column: ScheduleColumn) => isTreatmentDayOne(column), value: "X" },
        { when: (column: ScheduleColumn) => isEndOfTreatment(column), value: "X" },
      ],
    },
    {
      group: "Ongoing Participant Review",
      activity: "Adverse events and concomitant therapy review",
      notes: "",
      rules: [
        { when: (column: ScheduleColumn) => isTreatment(column), value: "X" },
        { when: (column: ScheduleColumn) => isEndOfTreatment(column), value: "X" },
        { when: (column: ScheduleColumn) => isSafetyFollowUp(column), value: "X" },
        { when: (column: ScheduleColumn) => isLongFollowUp(column), value: "X (if ongoing)" },
      ],
    },
    ...(includeResourceUse
      ? [
          {
            group: "Healthcare Resource Utilization",
            activity: "Healthcare resource utilization",
            notes: "Useful when the strategic objective includes market access or HTA support.",
            rules: [
              { when: (column: ScheduleColumn) => isTreatmentDayOne(column), value: "X" },
              { when: (column: ScheduleColumn) => isEndOfTreatment(column), value: "X" },
              { when: (column: ScheduleColumn) => isLongFollowUp(column), value: "X" },
            ],
          },
        ]
      : []),
  ]

  return normalizeSchedule({
    purpose:
      schedule?.purpose ||
      [
        `Schedule of Activities for ${study.studyTitle || "the planned interventional study"}.`,
        'Rows represent assessments and procedural activities. Columns represent visits grouped by phase and period. "X" indicates required activity; blank indicates not required.',
      ].join(" "),
    prompt: schedule?.prompt || DEFAULT_SCHEDULE_PROMPT,
    iterationPrompt: schedule?.iterationPrompt || "",
    tableLayout: schedule?.tableLayout || "auto",
    columns,
    rows: rowDefinitions.map((row, index) => ({
      id: `${slugify(row.group)}-${slugify(row.activity)}-${index + 1}`,
      group: row.group,
      activity: row.activity,
      notes: row.notes,
      cells: buildScheduleCells(columns, row.rules),
    })),
    generatedAt: new Date().toISOString(),
    provenance: "local_draft",
    manualEdited: false,
  })
}

function buildScheduleAnalysisFocus(study: StudyForm, schedule: ScheduleForm) {
  return [
    `Study objective: ${study.primaryObjective || "Not provided"}`,
    `Key endpoints: ${getResolvedOutcomes(study) || "Not provided"}`,
    `Iteration or analysis focus: ${schedule.iterationPrompt || "Default complexity and trade-off assessment."}`,
  ].join(" | ")
}

function buildScheduleInsightsFromState(
  study: StudyForm,
  pico: PicoForm,
  stats: StatsForm,
  schedule: ScheduleForm,
  focus?: string,
): ScheduleInsights {
  const columns = schedule.columns
  const rows = schedule.rows
  const visitCount = columns.length
  const assessmentCount = rows.length
  const nonEmptyCells = rows.reduce(
    (count, row) => count + Object.values(row.cells).filter((value) => value.trim()).length,
    0,
  )
  const uniquePeriods = new Set(columns.map((column) => `${column.phase}:${column.period}`)).size
  const earlyCycleVisits = columns.filter((column) => /cycle 1/i.test(column.period)).length
  const followUpVisits = columns.filter((column) => /follow-up|follow up|survival/i.test(`${column.phase} ${column.period}`)).length
  const dosingRows = rows.filter((row) => /administration|dosing|infusion/i.test(row.activity)).length
  const safetyRows = rows.filter((row) => /safety|exam|vital|ecg|lab|adverse event/i.test(row.activity)).length
  const efficacyRows = rows.filter((row) => /efficacy|imaging|response|outcome|patient-reported|biomarker/i.test(row.activity)).length
  const geographyCount = splitItems(study.geography || "").length || 1
  const visitBurdenScore = clampScore(visitCount * 8 + earlyCycleVisits * 4 + followUpVisits * 6)
  const assessmentBurdenScore = clampScore(assessmentCount * 5 + efficacyRows * 3 + safetyRows * 2)
  const operationalBurdenScore = clampScore(uniquePeriods * 8 + geographyCount * 5 + dosingRows * 4 + (study.sampleSize ? 10 : 0))
  const overallScore = clampScore(visitBurdenScore * 0.38 + assessmentBurdenScore * 0.34 + operationalBurdenScore * 0.28)
  const overallLevel = getComplexityLevel(overallScore)
  const outcomesText = `${pico.outcomes || getResolvedOutcomes(study)}`.toLowerCase()

  const drivers: ScheduleComplexityDriver[] = []

  if (visitCount >= 8) {
    drivers.push({
      label: "Dense visit cadence",
      impact: visitCount >= 10 ? "high" : "medium",
      rationale: `The current schedule uses ${visitCount} planned visits, which increases site and participant burden.`,
    })
  }

  if (assessmentCount >= 10) {
    drivers.push({
      label: "Broad assessment package",
      impact: assessmentCount >= 12 ? "high" : "medium",
      rationale: `The table includes ${assessmentCount} named activity rows across efficacy, safety, and operational domains.`,
    })
  }

  if (earlyCycleVisits >= 3) {
    drivers.push({
      label: "Front-loaded monitoring",
      impact: "medium",
      rationale: `Cycle 1 includes ${earlyCycleVisits} scheduled visits, concentrating screening and early-treatment effort.`,
    })
  }

  if (followUpVisits >= 2) {
    drivers.push({
      label: "Extended follow-up",
      impact: "medium",
      rationale: "The schedule extends beyond treatment completion, which adds longitudinal tracking and retention effort.",
    })
  }

  if (/imaging|response|survival|mri|ct|pet/.test(outcomesText) || rows.some((row) => /imaging|pet|mri|ct/i.test(row.activity))) {
    drivers.push({
      label: "Endpoint-critical efficacy assessments",
      impact: "high",
      rationale: "Key endpoints appear to depend on imaging or outcome-driving assessments that cannot be reduced casually.",
    })
  }

  const mitigations = [
    "Concentrate full physical examinations and high-touch safety procedures around first-dose, key milestone, and end-of-treatment visits.",
    "Bundle laboratory, biomarker, and patient-reported assessments onto already-required efficacy visits where scientifically acceptable.",
    "Lock the primary endpoint and first-dose safety assessments as protected elements before negotiating visit reductions.",
  ].slice(0, overallLevel === "Low" ? 2 : 3)

  const protectedElements = [
    "Informed consent and eligibility confirmation",
    "First-dose treatment administration and early safety checks",
    `Primary endpoint-supporting assessments for ${study.primaryObjective || "the main study objective"}`,
    "Adverse event and concomitant therapy review",
  ]

  const makeTradeoff = (
    id: string,
    target: string,
    category: string,
    recommendation: string,
    expectedBenefit: string,
    dataQualityRisk: AnalysisImpact,
    endpointProtection: string,
    rationale: string,
  ): ScheduleTradeoffRecommendation => ({
    id,
    target,
    category,
    recommendation,
    expectedBenefit,
    dataQualityRisk,
    endpointProtection,
    rationale,
  })

  const recommendations: ScheduleTradeoffRecommendation[] = []

  if (rows.some((row) => /physical examination/i.test(row.activity)) && visitCount >= 7) {
    recommendations.push(
      makeTradeoff(
        "physical-exam-cadence",
        "Physical examination cadence",
        "Assessment frequency",
        "Convert interim full physical examinations after stabilization into focused symptom-directed examinations, while preserving baseline, first key on-treatment visit, end-of-treatment, and clinically triggered reviews.",
        "Reduces site time and participant burden on repeated treatment visits.",
        "low",
        "Maintain full examinations at baseline, key decision visits, and end-of-treatment.",
        "Physical examination is rarely the direct efficacy driver unless the endpoint package is safety-centric.",
      ),
    )
  }

  if (rows.some((row) => /ecg/i.test(row.activity))) {
    recommendations.push(
      makeTradeoff(
        "ecg-rationalization",
        "ECG collection",
        "Procedure intensity",
        "Keep ECG at screening, first-dose/early risk visits, and end-of-treatment, then switch to event-driven ECG collection if no cardiac signal is expected or observed.",
        "Cuts specialized procedure burden and reduces operational friction at routine visits.",
        /qt|cardiac|safety|arrhythmia/.test(outcomesText) ? "medium" : "low",
        "Retain ECG at visits needed to characterize first-dose safety or known class risk.",
        "ECG is typically supportive unless the intervention class or endpoint strategy makes cardiac monitoring central.",
      ),
    )
  }

  if (rows.some((row) => /patient-reported|questionnaire|quality of life|pro/i.test(row.activity))) {
    recommendations.push(
      makeTradeoff(
        "pro-consolidation",
        "Patient-reported outcome schedule",
        "Visit cadence",
        "Align PRO collection to baseline, major efficacy decision visits, end-of-treatment, and clinically meaningful follow-up visits instead of every operationally convenient visit.",
        "Improves completion quality and reduces respondent fatigue.",
        /quality of life|patient-reported|pro/.test(outcomesText) ? "medium" : "low",
        "Do not reduce PRO timepoints if a PRO endpoint is primary or key secondary.",
        "PRO data quality often improves when collection is concentrated on interpretable timepoints.",
      ),
    )
  }

  if (rows.some((row) => /biomarker|hematology|chemistry|laboratory|liver function/i.test(row.activity)) && visitCount >= 7) {
    recommendations.push(
      makeTradeoff(
        "lab-bundling",
        "Laboratory and biomarker package",
        "Assessment bundling",
        "Bundle non-critical laboratory panels and exploratory biomarkers onto the same visits as primary efficacy or mandatory safety reviews instead of maintaining separate cadence logic.",
        "Reduces procedural sprawl and simplifies site execution.",
        /biomarker|pk|pharmacodynamic/.test(outcomesText) ? "medium" : "low",
        "Keep labs needed for dose decisions, eligibility, and primary endpoint interpretation unchanged.",
        "Bundling is lower risk when assays are supportive rather than direct decision drivers.",
      ),
    )
  }

  if (followUpVisits >= 2) {
    recommendations.push(
      makeTradeoff(
        "follow-up-spacing",
        "Long-term follow-up cadence",
        "Visit cadence",
        "After safety follow-up is complete, space long-term follow-up visits around objective-relevant milestones rather than continuing high-frequency generic follow-up.",
        "Reduces retention burden and downstream coordination load.",
        /survival|time-to-event|progression/.test(outcomesText) ? "medium" : "low",
        "Protect time-to-event capture windows and any required survival status collection.",
        "Long-term follow-up can often be simplified if the endpoint strategy only requires milestone-based status collection.",
      ),
    )
  }

  const safeguards = [
    "Confirm that any removed or reduced visit does not affect primary endpoint timing, dose decision rules, or first-dose safety characterization.",
    "Maintain all assessments required for eligibility, investigational product administration, and adverse event surveillance.",
    "Validate every reduction against protocol intent, data management needs, and expected regulatory review sensitivity.",
  ]

  return normalizeScheduleInsights({
    focus: focus || buildScheduleAnalysisFocus(study, schedule),
    generatedAt: new Date().toISOString(),
    provenance: "local_draft",
    complexity: {
      overallLevel,
      overallScore,
      executiveSummary: `The current schedule is assessed as ${overallLevel.toLowerCase()} complexity, driven primarily by ${visitCount} planned visits, ${assessmentCount} activity rows, and ${uniquePeriods} operational periods.`,
      visitBurdenScore,
      assessmentBurdenScore,
      operationalBurdenScore,
      drivers: drivers.slice(0, 5),
      mitigations,
    },
    tradeoff: {
      executiveSummary:
        recommendations.length > 0
          ? "Several visit and assessment elements can likely be rationalized without materially weakening objective or endpoint support, provided protected elements remain fixed."
          : "The current schedule is already relatively lean, so only limited low-risk rationalization is apparent from the table structure.",
      protectedElements,
      recommendations: recommendations.slice(0, 5),
      safeguards,
    },
  })
}

function validateSchedule(schedule: ScheduleForm) {
  const missing = []

  if (!schedule.columns.length) missing.push("Schedule visit columns")
  if (!schedule.rows.length) missing.push("Schedule activity rows")
  if (schedule.rows.length && !schedule.rows.some((row) => row.activity.trim())) missing.push("Named schedule activities")

  return missing
}

function generateSectionBody(
  section: SynopsisSection,
  study: StudyForm,
  pico: PicoForm,
  stats: StatsForm,
  literature: LiteratureForm,
  schedule?: ScheduleForm,
) {
  const title = section.title.toLowerCase()

  if (title.includes("executive")) {
    return [
      `${study.studyTitle || "This planned study"} is a ${study.subcategory || study.category || "proposed"} synopsis focused on ${study.indication || "a defined research question"}.`,
      `The declared evidence destination is ${getPrimaryEvidenceUseIntent(study) || "not yet specified"} at ${study.developmentStage || "the current development stage"}.`,
      `The primary objective is to ${study.primaryObjective || "clarify the main research objective"}, using ${study.designOverview || "a fit-for-purpose design framework"} in ${study.geography || "the intended geography"}.`,
      `The synopsis is supported by structured PICO extraction, draft statistical assumptions, and a literature plan intended to accelerate cross-functional review.`,
    ].join("\n\n")
  }

  if (title.includes("background")) {
    return [
      `The planned study addresses an evidence need in ${study.indication || "the target disease area"}.`,
      `Current rationale themes include:\n${literature.backgroundThemes || "Define disease burden, current evidence, and remaining design uncertainties."}`,
      `This synopsis should connect the unmet need to the proposed ${study.subcategory || study.category || "study"} design and explain why the planned evidence package is decision-relevant for ${getPrimaryEvidenceUseIntent(study) || "the intended evidence destination"}.`,
    ].join("\n\n")
  }

  if (title.includes("objective")) {
    return [
      `Primary objective: ${study.primaryObjective || "To be defined."}`,
      `Secondary objectives: ${study.secondaryObjectives || "No secondary objectives entered yet."}`,
      `Key outcomes: ${pico.outcomes || study.outcomes || "Outcomes to be confirmed."}`,
    ].join("\n\n")
  }

  if (title.includes("study design")) {
    return [
      `Study category: ${study.category || "Not selected"}.`,
      `Study subtype: ${study.subcategory || "Not selected"}.`,
      `Development stage and evidence destination: ${study.developmentStage || "Not selected"}; ${getPrimaryEvidenceUseIntent(study) || "Not selected"}.`,
      `Design overview: ${study.designOverview || "Provide a synopsis-level description of the study framework, execution setting, visit structure, and assessment flow."}`,
      schedule?.columns.length
        ? `Schedule of activities: ${schedule.columns.length} planned visits across ${getPhaseGroups(schedule.columns)
            .map((group) => group.label)
            .join(", ")}.`
        : "Schedule of activities: visit cadence to be finalized.",
      `Timing and scope: ${study.timeline || "Timing to be confirmed"} across ${study.geography || "the intended operational footprint"}.`,
    ].join("\n\n")
  }

  if (title.includes("population")) {
    return [
      `Population: ${pico.population || study.population || "Target population to be defined."}`,
      `Intervention or exposure: ${pico.intervention || study.intervention || "To be defined."}`,
      `Comparator: ${pico.comparator || study.comparator || "Comparator framework to be defined."}`,
      `Eligibility highlights: ${study.eligibility || "Eligibility criteria not entered yet."}`,
    ].join("\n\n")
  }

  if (title.includes("statistical")) {
    return [
      `Estimand: ${stats.estimand || "To be defined."}`,
      `Primary endpoint type: ${stats.endpointType || "To be defined"} with ${stats.analysisModel || "analysis model pending"}.`,
      `Hypothesis and assumptions: ${stats.hypothesis || "To be defined"}, alpha ${stats.alpha || "pending"}, power ${stats.power || "pending"}, and effect size ${stats.effectSize || "pending"}.`,
      `Missing data and attrition: ${stats.missingData || "Strategy to be confirmed"}; ${stats.attrition || "Attrition assumptions pending"}.`,
    ].join("\n\n")
  }

  if (title.includes("literature")) {
    return [
      `Research question: ${literature.researchQuestion || "To be defined."}`,
      `Databases and sources:\n${literature.databases || "Select databases and grey literature sources."}`,
      `Illustrative PubMed query: ${literature.pubmedQuery || "Generate from PICO elements."}`,
      `Grey literature plan: ${literature.greyLiteraturePlan || "Not defined yet."}`,
    ].join("\n\n")
  }

  if (title.includes("operational")) {
    return [
      `Sample size planning input: ${study.sampleSize || "Not entered yet."}`,
      `Geographic scope: ${study.geography || "Not entered yet."}`,
      `Operational notes: ${study.operationalNotes || "No operational notes entered yet."}`,
      schedule?.rows.length
        ? `Schedule oversight: current SoA covers ${schedule.rows.length} activities and should be aligned with site burden and feasibility.`
        : "Schedule oversight: no detailed schedule of activities has been finalized yet.",
      `Expected timeline: ${study.timeline || "Not entered yet."}`,
    ].join("\n\n")
  }

  return [
    `Section intent: ${section.prompt}`,
    `Study context: ${study.studyTitle || "Untitled study"} in ${study.indication || "the target disease area"} using a ${study.subcategory || study.category || "planned"} design.`,
    `Synopsis drafting note: tailor this section using the stored prompt and the upstream PICO, statistical, and literature data.`,
  ].join("\n\n")
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function bodyToHtml(body: string) {
  return body
    .split("\n\n")
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`)
    .join("")
}

function renderScheduleTableHtml(schedule: ScheduleForm) {
  const phaseGroups = getPhaseGroups(schedule.columns)
  const periodGroups = getPeriodGroups(schedule.columns)
  const rowGroups = getScheduleRowGroups(schedule.rows)

  return `
    <table class="soa-table">
      <thead>
        <tr>
          <th rowspan="3">Section</th>
          <th rowspan="3">Activity</th>
          ${phaseGroups.map((group) => `<th colspan="${group.span}">${escapeHtml(group.label)}</th>`).join("")}
          <th rowspan="3">Notes</th>
        </tr>
        <tr>
          ${periodGroups.map((group) => `<th colspan="${group.span}">${escapeHtml(group.label)}</th>`).join("")}
        </tr>
        <tr>
          ${schedule.columns
            .map(
              (column) =>
                `<th>${escapeHtml(column.visit)}${column.footnote ? `<br /><span class="soa-footnote">${escapeHtml(column.footnote)}</span>` : ""}</th>`,
            )
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${rowGroups
          .map(
            (group) => `
              <tr class="soa-group"><td colspan="${schedule.columns.length + 3}">${escapeHtml(group.group)}</td></tr>
              ${group.rows
                .map(
                  (row) => `
                    <tr>
                      <td></td>
                      <td>${escapeHtml(row.activity)}</td>
                      ${schedule.columns.map((column) => `<td>${escapeHtml(row.cells[column.id] || "")}</td>`).join("")}
                      <td>${escapeHtml(row.notes || "")}</td>
                    </tr>
                  `,
                )
                .join("")}
            `,
          )
          .join("")}
      </tbody>
    </table>
  `
}

function scheduleToHtml(schedule: ScheduleForm) {
  if (!schedule.columns.length || !schedule.rows.length) {
    return ""
  }

  const presentation = getScheduleTablePresentation(schedule)

  return `
    <div class="soa-block">
      <p class="soa-purpose">${escapeHtml(schedule.purpose || "Schedule of Activities")}</p>
      ${presentation.tables
        .map(
          (table, index) => `
            <div class="soa-table-block">
              ${
                presentation.tables.length > 1
                  ? `<p class="soa-table-kicker">Table ${index + 1}</p>
                     <p class="soa-table-title">${escapeHtml(table.title)}</p>
                     <p class="soa-table-description">${escapeHtml(table.description)}</p>`
                  : ""
              }
              ${renderScheduleTableHtml(table.schedule)}
            </div>
          `,
        )
        .join("")}
    </div>
  `
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "study-synopsis"
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  description,
  actions,
  footer,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  description?: string
  actions?: ReactNode
  footer?: ReactNode
}) {
  const safeValue = value ?? ""

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {description ? <p className="text-xs leading-6 text-slate-500">{description}</p> : null}
      <input
        value={safeValue}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/60 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
      />
      {footer}
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  description,
  actions,
  footer,
  collapsibleInput = false,
  collapsibleInputLabel = "Edit as text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  description?: string
  actions?: ReactNode
  footer?: ReactNode
  collapsibleInput?: boolean
  collapsibleInputLabel?: string
}) {
  const safeValue = value ?? ""
  const [showInput, setShowInput] = useState(!collapsibleInput)

  useEffect(() => {
    if (!collapsibleInput) {
      setShowInput(true)
    }
  }, [collapsibleInput])

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {description ? <p className="text-xs leading-6 text-slate-500">{description}</p> : null}
      {collapsibleInput ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Raw text editor</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Use this only when you want to paste or edit the full field as plain text. Structured items remain the primary view.
            </p>
          </div>
          <button
            onClick={() => setShowInput((current) => !current)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
          >
            {showInput ? "Hide text editor" : collapsibleInputLabel}
          </button>
        </div>
      ) : null}
      {(!collapsibleInput || showInput) && (
        <textarea
          value={safeValue}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full rounded-2xl border border-white/60 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
        />
      )}
      {footer}
    </div>
  )
}

function StructuredItemEditor({
  title,
  description,
  items,
  emptyText,
  draftValue,
  onDraftChange,
  onAdd,
  onToggle,
  onItemChange,
  onDelete,
  addPlaceholder,
}: {
  title: string
  description: string
  items: StructuredEditorItem[]
  emptyText: string
  draftValue: string
  onDraftChange: (value: string) => void
  onAdd: () => void
  onToggle: (id: string) => void
  onItemChange: (id: string, value: string) => void
  onDelete: (id: string) => void
  addPlaceholder: string
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
          {items.filter((item) => item.active).length} active
        </span>
      </div>
      {items.length > 0 ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-2xl border px-3 py-3 ${
                item.active ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-100/80"
              }`}
            >
              <input
                type="checkbox"
                checked={item.active}
                onChange={() => onToggle(item.id)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
              />
              <input
                value={item.text}
                onChange={(event) => onItemChange(item.id, event.target.value)}
                className={`min-w-0 flex-1 border-none bg-transparent p-0 text-sm leading-6 outline-none ${
                  item.active ? "text-slate-800" : "text-slate-500 line-through"
                }`}
              />
              <button
                onClick={() => onDelete(item.id)}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                title="Delete item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">{emptyText}</p>
      )}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={draftValue}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              onAdd()
            }
          }}
          placeholder={addPlaceholder}
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
        <button
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
        >
          <Plus className="h-4 w-4" />
          Add item
        </button>
      </div>
    </div>
  )
}

function OverlayModal({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_120px_rgba(15,23,42,0.24)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1864AB]">AI proposal</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h3>
            {description ? <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{description}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            aria-label="Close AI proposal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

function AiProgressPanel({
  title,
  summary,
  steps,
}: {
  title: string
  summary: string
  steps: string[]
}) {
  return (
    <div className="rounded-[24px] border border-sky-200 bg-[linear-gradient(180deg,rgba(231,245,255,0.85),rgba(248,251,255,0.98))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1864AB]">AI in progress</p>
          <h4 className="mt-2 text-lg font-semibold text-slate-950">{title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">{summary}</p>
        </div>
        <div className="rounded-full border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-[#1864AB]">
          Working now
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-full bg-white">
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-[linear-gradient(90deg,#1864AB,#4D8FD1,#9BC2EA)]" />
      </div>

      <div className="mt-5 grid gap-3">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`flex items-center gap-3 rounded-[18px] border px-4 py-3 ${
              index === steps.length - 1 ? "border-sky-300 bg-white" : "border-slate-200 bg-white/70"
            }`}
          >
            <div
              className={`h-3 w-3 rounded-full ${
                index === steps.length - 1 ? "animate-pulse bg-[#1864AB]" : "bg-emerald-500"
              }`}
            />
            <p className={`text-sm ${index === steps.length - 1 ? "font-semibold text-slate-900" : "text-slate-600"}`}>
              {step}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReviewCard({
  title,
  review,
  missing,
  onApprove,
  onNeedsRevision,
  onNotesChange,
}: {
  title: string
  review: StageReview
  missing: string[]
  onApprove: () => void
  onNeedsRevision: () => void
  onNotesChange: (value: string) => void
}) {
  const tone =
    review.status === "approved"
      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
      : review.status === "needs_revision"
        ? "bg-rose-50 border-rose-200 text-rose-900"
        : "bg-amber-50 border-amber-200 text-amber-950"

  return (
    <div className={`rounded-[24px] border p-5 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em]">Review Gate</p>
          <h3 className="mt-2 text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm">
            Status: <span className="font-semibold">{review.status.replace("_", " ")}</span>
            {review.reviewedAt ? ` · ${formatTimestamp(review.reviewedAt)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onApprove}
            disabled={missing.length > 0}
            className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={onNeedsRevision}
            className="rounded-full border border-current px-4 py-2 text-xs font-semibold"
          >
            Needs revision
          </button>
        </div>
      </div>

      <textarea
        value={review.notes}
        onChange={(event) => onNotesChange(event.target.value)}
        rows={3}
        placeholder="Reviewer notes, open questions, or follow-up actions."
        className="mt-4 w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
      />

      {missing.length > 0 && (
        <div className="mt-4 rounded-2xl border border-white/70 bg-white/70 p-4 text-sm">
          <p className="font-semibold">Complete before approval</p>
          <p className="mt-2">{missing.join(", ")}</p>
        </div>
      )}
    </div>
  )
}

function SectionAudit({ section }: { section: SynopsisSection }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">
          Provenance: {section.provenance.replace("_", " ")}
        </span>
        <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">
          Prompt v{section.promptVersion}
        </span>
        <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">
          Last generated: {formatTimestamp(section.lastGeneratedAt)}
        </span>
      </div>
      <p className="mt-3">
        Source tabs: <span className="font-semibold">{section.sourceTabs.join(", ")}</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {section.assumptionFlags.map((flag) => (
          <span key={flag} className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
            {flag}
          </span>
        ))}
      </div>
    </div>
  )
}

function TabHelpButton({
  tabId,
  open,
  onToggle,
}: {
  tabId: TabId
  open: boolean
  onToggle: (tabId: TabId) => void
}) {
  return (
    <button
      onClick={() => onToggle(tabId)}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
        open ? "border-[#74C0FC] bg-[#E7F5FF] text-[#1864AB]" : "border-slate-200 bg-white text-slate-500 hover:bg-[#E7F5FF] hover:text-[#1864AB]"
      }`}
      aria-label="Open tab guidance"
      title="Open tab guidance"
    >
      <Info className="h-4 w-4" />
    </button>
  )
}

function TabHelpPanel({ tabId }: { tabId: TabId }) {
  const help = TAB_HELP_CONTENT[tabId]

  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{help.title}</p>
      <ul className="mt-3 space-y-2 leading-7">
        {help.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function StudySchemaPreview({
  schema,
  study,
  stale,
}: {
  schema: StudySchemaForm
  study: StudyForm
  stale: boolean
}) {
  if (!schema.lanes.length || !schema.nodes.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        Generate a study schema to render an editable visual flow of the current study design.
      </div>
    )
  }

  const markup = buildStudySchemaSvgMarkup(schema, study)

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Presentation schema</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">{schema.title || "Study schema"}</h3>
          <p className="mt-2 text-sm text-slate-600">
            {schema.schemaType.replaceAll("_", " ")} · {getStudySchemaDetailLabel(schema.detailLevel)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700">
            {schema.provenance.replace("_", " ")}
          </span>
          {schema.generatedAt ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700">
              {formatTimestamp(schema.generatedAt)}
            </span>
          ) : null}
          {stale ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 font-semibold text-amber-800">
              Needs refresh
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 overflow-auto rounded-[24px] border border-slate-200 bg-slate-50 p-3">
        <div
          className="w-full"
          dangerouslySetInnerHTML={{
            __html: markup,
          }}
        />
      </div>

      {schema.notes.length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {schema.notes.map((item) => (
            <div key={item} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ScheduleTable({
  schedule,
  editable = false,
  onRowChange,
  onCellChange,
  onRemoveRow,
  onColumnChange,
  onPhaseGroupChange,
  onPeriodGroupChange,
  onRemoveColumn,
}: {
  schedule: ScheduleForm
  editable?: boolean
  onRowChange?: (rowId: string, updates: Partial<ScheduleRow>) => void
  onCellChange?: (rowId: string, columnId: string, value: string) => void
  onRemoveRow?: (rowId: string) => void
  onColumnChange?: (columnId: string, updates: Partial<ScheduleColumn>) => void
  onPhaseGroupChange?: (columnIds: string[], value: string) => void
  onPeriodGroupChange?: (columnIds: string[], value: string) => void
  onRemoveColumn?: (columnId: string) => void
}) {
  if (!schedule.columns.length || !schedule.rows.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
        Generate the schedule to render a hierarchical visit table.
      </div>
    )
  }

  const phaseGroups = getPhaseGroups(schedule.columns)
  const periodGroups = getPeriodGroups(schedule.columns)
  const rowGroups = getScheduleRowGroups(schedule.rows)

  return (
    <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-white">
      <table className="min-w-max border-collapse text-sm">
        <thead className="bg-slate-50 text-slate-900">
          <tr>
            <th
              rowSpan={3}
              className="sticky left-0 z-30 min-w-[180px] border border-slate-200 bg-slate-50 px-3 py-3 text-left font-semibold shadow-[2px_0_0_rgba(226,232,240,0.95)]"
            >
              Section
            </th>
            <th
              rowSpan={3}
              className="sticky left-[180px] z-30 min-w-[260px] border border-slate-200 bg-slate-50 px-3 py-3 text-left font-semibold shadow-[2px_0_0_rgba(226,232,240,0.95)]"
            >
              Activity
            </th>
            {phaseGroups.map((group) => (
              <th
                key={`phase-${group.startIndex}-${group.label}`}
                colSpan={group.span}
                className="border border-slate-200 bg-slate-50 px-3 py-3 text-center font-semibold"
              >
                {editable ? (
                  <input
                    value={group.label}
                    onChange={(event) =>
                      onPhaseGroupChange?.(
                        schedule.columns.slice(group.startIndex, group.startIndex + group.span).map((column) => column.id),
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                  />
                ) : (
                  group.label
                )}
              </th>
            ))}
            <th rowSpan={3} className="min-w-[220px] border border-slate-200 bg-slate-50 px-3 py-3 text-left font-semibold">
              Notes
            </th>
            {editable && (
              <th rowSpan={3} className="min-w-[70px] border border-slate-200 bg-slate-50 px-3 py-3 text-center font-semibold">
                Row
              </th>
            )}
          </tr>
          <tr>
            {periodGroups.map((group) => (
              <th
                key={`period-${group.key}-${group.startIndex}`}
                colSpan={group.span}
                className="border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-700"
              >
                {editable ? (
                  <input
                    value={group.label}
                    onChange={(event) =>
                      onPeriodGroupChange?.(
                        schedule.columns.slice(group.startIndex, group.startIndex + group.span).map((column) => column.id),
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                  />
                ) : (
                  group.label
                )}
              </th>
            ))}
          </tr>
          <tr>
            {schedule.columns.map((column) => (
              <th key={column.id} className="min-w-[120px] border border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-700">
                {editable ? (
                  <div className="space-y-2">
                    <input
                      value={column.visit}
                      onChange={(event) => onColumnChange?.(column.id, { visit: event.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-xs font-semibold text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                    />
                    <input
                      value={column.footnote}
                      onChange={(event) => onColumnChange?.(column.id, { footnote: event.target.value })}
                      placeholder="Footnote"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-[10px] text-slate-600 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                    />
                    {schedule.columns.length > 1 && (
                      <button
                        onClick={() => onRemoveColumn?.(column.id)}
                        className="inline-flex items-center justify-center rounded-full border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                        aria-label="Remove visit column"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div>{column.visit}</div>
                    {column.footnote && <div className="mt-1 text-[10px] text-slate-500">{column.footnote}</div>}
                  </>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowGroups.map((group, groupIndex) => (
            <Fragment key={`${group.group}-${groupIndex}`}>
              <tr className="bg-amber-50 text-amber-950">
                <td
                  colSpan={schedule.columns.length + (editable ? 4 : 3)}
                  className="border border-amber-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]"
                >
                  {group.group}
                </td>
              </tr>
              {group.rows.map((row, rowIndex) => {
                const stickyCellBg = rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/50"

                return (
                  <tr key={row.id} className="align-top odd:bg-white even:bg-slate-50/50">
                    <td
                      className={`sticky left-0 z-20 border border-slate-200 px-2 py-2 shadow-[2px_0_0_rgba(226,232,240,0.95)] ${stickyCellBg}`}
                    >
                      {editable ? (
                        <input
                          value={row.group}
                          onChange={(event) => onRowChange?.(row.id, { group: event.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                        />
                      ) : (
                        <div className="px-1 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{group.group}</div>
                      )}
                    </td>
                    <td
                      className={`sticky left-[180px] z-20 border border-slate-200 px-2 py-2 shadow-[2px_0_0_rgba(226,232,240,0.95)] ${stickyCellBg}`}
                    >
                      {editable ? (
                        <input
                          value={row.activity}
                          onChange={(event) => onRowChange?.(row.id, { activity: event.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                        />
                      ) : (
                        <div className="min-w-[240px] px-1 py-1 text-sm text-slate-700">{row.activity}</div>
                      )}
                    </td>
                    {schedule.columns.map((column) => (
                      <td key={`${row.id}-${column.id}`} className="border border-slate-200 px-2 py-2">
                        {editable ? (
                          <input
                            value={row.cells[column.id] || ""}
                            onChange={(event) => onCellChange?.(row.id, column.id, event.target.value)}
                            className="w-full min-w-[90px] rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                          />
                        ) : (
                          <div className="min-w-[90px] px-1 py-1 text-center text-sm text-slate-700">{row.cells[column.id] || ""}</div>
                        )}
                      </td>
                    ))}
                    <td className="border border-slate-200 px-2 py-2">
                      {editable ? (
                        <textarea
                          value={row.notes}
                          onChange={(event) => onRowChange?.(row.id, { notes: event.target.value })}
                          rows={2}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                        />
                      ) : (
                        <div className="min-w-[200px] px-1 py-1 text-sm text-slate-600">{row.notes || ""}</div>
                      )}
                    </td>
                    {editable && (
                      <td className="border border-slate-200 px-2 py-2 text-center">
                        <button
                          onClick={() => onRemoveRow?.(row.id)}
                          className="rounded-full border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
                          aria-label="Remove schedule row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        <span>{label}</span>
        <span>{score}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${
            score >= 76 ? "bg-rose-500" : score >= 56 ? "bg-amber-500" : score >= 31 ? "bg-sky-500" : "bg-emerald-500"
          }`}
          style={{ width: `${Math.max(8, score)}%` }}
        />
      </div>
    </div>
  )
}

function ImpactAssessmentPanel({ assessment }: { assessment: ImpactAssessment }) {
  const hasAssessment = Boolean(assessment.generatedAt && assessment.domains.length)

  if (!hasAssessment) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        Run the evidence impact assessment to estimate whether the current study concept is more likely to drive publication, practice, HTA, guideline, or label-relevant impact.
      </div>
    )
  }

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Evidence impact view</p>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-700">{assessment.executiveSummary}</p>
        </div>
        <p className="text-xs text-slate-500">{formatTimestamp(assessment.generatedAt)}</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {assessment.domains.map((domain) => (
          <div key={domain.id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold leading-5 text-slate-900">{domain.label}</p>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getImpactTone(domain.impact)}`}>
                {getImpactLabel(domain.impact)}
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Score {domain.score}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{domain.rationale}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-800">Current limits</p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-rose-950">
            {assessment.blockers.length ? assessment.blockers.map((item) => <p key={item}>{item}</p>) : <p>No major blockers flagged from the current Tab 1 inputs.</p>}
          </div>
        </div>
        <div className="rounded-[22px] border border-sky-200 bg-sky-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-900">What would strengthen impact</p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-sky-950">
            {assessment.strengthenActions.length ? (
              assessment.strengthenActions.map((item) => <p key={item}>{item}</p>)
            ) : (
              <p>The current concept already covers the main strengthening levers visible from Tab 1.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ScheduleInsightsPanel({ insights }: { insights: ScheduleInsights }) {
  const hasInsights =
    insights.generatedAt && (insights.complexity.drivers.length > 0 || insights.tradeoff.recommendations.length > 0)

  if (!hasInsights) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        Run the SoA analysis to score trial complexity and identify lower-risk visit or assessment reductions.
      </div>
    )
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Clinical Trial Complexity</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">{insights.complexity.overallLevel}</h3>
          </div>
          <div className="rounded-[20px] bg-slate-950 px-4 py-3 text-center text-white">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Score</p>
            <p className="mt-1 text-2xl font-semibold">{insights.complexity.overallScore}</p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-600">{insights.complexity.executiveSummary}</p>

        <div className="mt-5 space-y-4">
          <ScoreBar label="Visit burden" score={insights.complexity.visitBurdenScore} />
          <ScoreBar label="Assessment burden" score={insights.complexity.assessmentBurdenScore} />
          <ScoreBar label="Operational burden" score={insights.complexity.operationalBurdenScore} />
        </div>

        <div className="mt-5 space-y-3">
          {insights.complexity.drivers.map((driver) => (
            <div key={driver.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">{driver.label}</p>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getImpactTone(driver.impact)}`}>
                  {driver.impact} impact
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{driver.rationale}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Mitigation focus</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-950">
            {insights.complexity.mitigations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Trade-off Analysis</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">Reduction opportunities</h3>
          </div>
          <div className="rounded-[20px] bg-emerald-50 px-4 py-3 text-center text-emerald-900">
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Recommendations</p>
            <p className="mt-1 text-2xl font-semibold">{insights.tradeoff.recommendations.length}</p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-600">{insights.tradeoff.executiveSummary}</p>

        <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Protected elements</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {insights.tradeoff.protectedElements.map((item) => (
              <span key={item} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {insights.tradeoff.recommendations.map((item) => (
            <div key={item.id} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.target}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.category}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getImpactTone(item.dataQualityRisk)}`}>
                  {item.dataQualityRisk} data-quality risk
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{item.recommendation}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900">
                  <p className="font-semibold">Expected benefit</p>
                  <p className="mt-1 leading-6">{item.expectedBenefit}</p>
                </div>
                <div className="rounded-2xl bg-sky-50 p-3 text-sm text-sky-900">
                  <p className="font-semibold">Endpoint protection</p>
                  <p className="mt-1 leading-6">{item.endpointProtection}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.rationale}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Governance safeguards</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-950">
            {insights.tradeoff.safeguards.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

export default function StudySynopsisStudio() {
  const [projectMetas, setProjectMetas] = useState<WorkspaceProjectMeta[]>([])
  const [currentProjectId, setCurrentProjectId] = useState("")
  const [projectNameDraft, setProjectNameDraft] = useState("")
  const [isEditingProjectName, setIsEditingProjectName] = useState(false)
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("study")
  const [study, setStudy] = useState<StudyForm>(initialStudyForm)
  const [outcomeEditorItems, setOutcomeEditorItems] = useState<StructuredEditorItem[]>([])
  const [secondaryObjectiveItems, setSecondaryObjectiveItems] = useState<StructuredEditorItem[]>([])
  const [eligibilityEditorItems, setEligibilityEditorItems] = useState<StructuredEditorItem[]>([])
  const [operationalNoteItems, setOperationalNoteItems] = useState<StructuredEditorItem[]>([])
  const [studySchema, setStudySchema] = useState<StudySchemaForm>(initialStudySchema)
  const [pico, setPico] = useState<PicoForm>(initialPicoForm)
  const [stats, setStats] = useState<StatsForm>(initialStatsForm)
  const [sampleSizeEstimate, setSampleSizeEstimate] = useState<SampleSizeEstimate>(initialSampleSizeEstimate)
  const [studyDocumentImportReport, setStudyDocumentImportReport] = useState<StudyDocumentImportReport>(initialStudyDocumentImportReport)
  const [impactAssessment, setImpactAssessment] = useState<ImpactAssessment>(initialImpactAssessment)
  const [literature, setLiterature] = useState<LiteratureForm>(initialLiteratureForm)
  const [schedule, setSchedule] = useState<ScheduleForm>(initialScheduleForm)
  const [scheduleInsights, setScheduleInsights] = useState<ScheduleInsights>(initialScheduleInsights)
  const [sections, setSections] = useState<SynopsisSection[]>(buildDefaultSections)
  const [finalSections, setFinalSections] = useState<FinalSection[]>([])
  const [reviews, setReviews] = useState<ReviewState>(initialReviews)
  const [objectiveSuggestionDraft, setObjectiveSuggestionDraft] = useState<ObjectiveSuggestionDraft>(emptyObjectiveSuggestionDraft)
  const [objectiveSuggestionAlternatives, setObjectiveSuggestionAlternatives] = useState<ObjectiveSuggestionDraft[]>([])
  const [objectiveSuggestionSelection, setObjectiveSuggestionSelection] = useState<ObjectiveSuggestionSelection>(
    emptyObjectiveSuggestionSelection,
  )
  const [objectiveSuggestionGuidance, setObjectiveSuggestionGuidance] = useState("")
  const [objectiveSuggestionRequest, setObjectiveSuggestionRequest] = useState("")
  const [endpointSuggestionDraft, setEndpointSuggestionDraft] = useState<EndpointSuggestionDraft>(emptyEndpointSuggestionDraft)
  const [endpointSuggestionAlternatives, setEndpointSuggestionAlternatives] = useState<EndpointSuggestionDraft[]>([])
  const [endpointSuggestionSelection, setEndpointSuggestionSelection] = useState<EndpointSuggestionSelection>(
    emptyEndpointSuggestionSelection,
  )
  const [endpointSuggestionGuidance, setEndpointSuggestionGuidance] = useState("")
  const [endpointSuggestionRequest, setEndpointSuggestionRequest] = useState("")
  const [populationSuggestionDraft, setPopulationSuggestionDraft] = useState<PopulationSuggestionDraft>(emptyPopulationSuggestionDraft)
  const [populationSuggestionSelection, setPopulationSuggestionSelection] = useState<PopulationSuggestionSelection>(
    emptyPopulationSuggestionSelection,
  )
  const [loadingAction, setLoadingAction] = useState<
    null | "import" | "schema" | "extract" | "objectives" | "endpoints" | "population" | "impact" | "literature" | "schedule" | "schedule_analysis" | "sections" | "final"
  >(null)
  const [apiError, setApiError] = useState("")
  const [apiNotice, setApiNotice] = useState("")
  const [savedAt, setSavedAt] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [studyDocumentFile, setStudyDocumentFile] = useState<File | null>(null)
  const [outcomeItemDraft, setOutcomeItemDraft] = useState("")
  const [secondaryObjectiveItemDraft, setSecondaryObjectiveItemDraft] = useState("")
  const [eligibilityItemDraft, setEligibilityItemDraft] = useState("")
  const [operationalNoteItemDraft, setOperationalNoteItemDraft] = useState("")
  const [isCustomStrategicObjective, setIsCustomStrategicObjective] = useState(false)
  const [isCustomDisease, setIsCustomDisease] = useState(false)
  const [openHelpTab, setOpenHelpTab] = useState<TabId | null>(null)
  const [openAiAssistantModal, setOpenAiAssistantModal] = useState<AiAssistantModalKind | null>(null)
  const [populationSuggestionSource, setPopulationSuggestionSource] = useState<PopulationSuggestionSource>("population")
  const [studyTypeReviewNotice, setStudyTypeReviewNotice] = useState<StudyTypeReviewNotice | null>(null)

  const clearScheduleInsights = () => {
    setScheduleInsights(initialScheduleInsights)
  }

  const clearSampleSizeEstimate = () => {
    setSampleSizeEstimate(initialSampleSizeEstimate)
  }

  const clearStudyDocumentImportReport = () => {
    setStudyDocumentImportReport(initialStudyDocumentImportReport)
  }

  const clearImpactAssessment = () => {
    setImpactAssessment(initialImpactAssessment)
  }

  const clearAiProposalDrafts = () => {
    setObjectiveSuggestionDraft(emptyObjectiveSuggestionDraft)
    setObjectiveSuggestionAlternatives([])
    setObjectiveSuggestionSelection(emptyObjectiveSuggestionSelection)
    setObjectiveSuggestionGuidance("")
    setEndpointSuggestionDraft(emptyEndpointSuggestionDraft)
    setEndpointSuggestionAlternatives([])
    setEndpointSuggestionSelection(emptyEndpointSuggestionSelection)
    setEndpointSuggestionGuidance("")
    setPopulationSuggestionDraft(emptyPopulationSuggestionDraft)
    setPopulationSuggestionSelection(emptyPopulationSuggestionSelection)
    setPopulationSuggestionSource("population")
  }

  const applyWorkspaceSnapshot = (snapshot: WorkspaceSnapshot) => {
    const normalized = normalizeWorkspaceSnapshot(snapshot)
    setActiveTab(normalized.activeTab)
    setStudy(normalized.study)
    setOutcomeEditorItems(parseStructuredEditorItems(normalized.study.outcomes || ""))
    setSecondaryObjectiveItems(parseStructuredEditorItems(normalized.study.secondaryObjectives || ""))
    setEligibilityEditorItems(parseStructuredEditorItems(normalized.study.eligibility || ""))
    setOperationalNoteItems(parseStructuredEditorItems(normalized.study.operationalNotes || ""))
    setStudySchema(normalized.studySchema)
    setPico(normalized.pico)
    setStats(normalized.stats)
    setSampleSizeEstimate(normalized.sampleSizeEstimate)
    setStudyDocumentImportReport(normalized.studyDocumentImportReport)
    setImpactAssessment(normalized.impactAssessment)
    setLiterature(normalized.literature)
    setSchedule(normalized.schedule)
    setScheduleInsights(normalized.scheduleInsights)
    setSections(normalized.sections)
    setFinalSections(normalized.finalSections)
    setReviews(normalized.reviews)
    setSavedAt(normalized.savedAt)
    setStudyDocumentFile(null)
    setOutcomeItemDraft("")
    setSecondaryObjectiveItemDraft("")
    setEligibilityItemDraft("")
    setOperationalNoteItemDraft("")
    setIsCustomStrategicObjective(Boolean(normalized.study.customStrategicObjective.trim()))
    setIsCustomDisease(Boolean(normalized.study.customDisease.trim()))
    setStudyTypeReviewNotice(null)
    setOpenHelpTab(null)
    setOpenAiAssistantModal(null)
    setPopulationSuggestionSource("population")
    setApiError("")
    setApiNotice("")
    clearAiProposalDrafts()
  }

  useEffect(() => {
    const nextText = buildStructuredEditorText(outcomeEditorItems).trim()
    const currentText = (study.outcomes || "").trim()

    if (currentText === nextText) {
      return
    }

    setOutcomeEditorItems((current) => parseStructuredEditorItems(study.outcomes || "", current))
  }, [study.outcomes])

  useEffect(() => {
    const nextText = buildStructuredEditorText(secondaryObjectiveItems).trim()
    const currentText = (study.secondaryObjectives || "").trim()

    if (currentText === nextText) {
      return
    }

    setSecondaryObjectiveItems((current) => parseStructuredEditorItems(study.secondaryObjectives || "", current))
  }, [study.secondaryObjectives])

  useEffect(() => {
    const nextText = buildStructuredEditorText(eligibilityEditorItems).trim()
    const currentText = (study.eligibility || "").trim()

    if (currentText === nextText) {
      return
    }

    setEligibilityEditorItems((current) => parseStructuredEditorItems(study.eligibility || "", current))
  }, [study.eligibility])

  useEffect(() => {
    const nextText = buildStructuredEditorText(operationalNoteItems).trim()
    const currentText = (study.operationalNotes || "").trim()

    if (currentText === nextText) {
      return
    }

    setOperationalNoteItems((current) => parseStructuredEditorItems(study.operationalNotes || "", current))
  }, [study.operationalNotes])

  const buildCurrentWorkspaceSnapshot = (savedAtOverride = savedAt || ""): WorkspaceSnapshot => ({
    activeTab,
    study: normalizeStudyForm(study),
    studySchema: normalizeStudySchema(studySchema),
    pico: { ...pico },
    stats: { ...stats },
    sampleSizeEstimate: { ...sampleSizeEstimate },
    studyDocumentImportReport: normalizeStudyDocumentImportReport(studyDocumentImportReport),
    impactAssessment: normalizeImpactAssessment(impactAssessment),
    literature: { ...literature },
    schedule: normalizeSchedule(schedule),
    scheduleInsights: normalizeScheduleInsights(scheduleInsights),
    sections: sections.map((section) => normalizeSection(section)),
    finalSections: [...finalSections],
    reviews: {
      study: { ...reviews.study },
      pico: { ...reviews.pico },
      literature: { ...reviews.literature },
      schedule: { ...reviews.schedule },
    },
    savedAt: savedAtOverride,
  })

  const readStoredProjectStore = (): WorkspaceProjectStore | null => {
    if (typeof window === "undefined") {
      return null
    }

    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY)

    if (!raw) {
      return null
    }

    try {
      const parsed = JSON.parse(raw) as Partial<WorkspaceProjectStore>
      const projects = Array.isArray(parsed.projects)
        ? parsed.projects.map((project) => ({
            id: String(project.id || createProjectId()),
            name: normalizeProjectName(String(project.name || "")),
            createdAt: String(project.createdAt || new Date().toISOString()),
            updatedAt: String(project.updatedAt || project.createdAt || new Date().toISOString()),
          }))
        : []
      const snapshots =
        parsed.snapshots && typeof parsed.snapshots === "object"
          ? Object.fromEntries(
              Object.entries(parsed.snapshots).map(([projectId, snapshot]) => [
                projectId,
                normalizeWorkspaceSnapshot(snapshot as Partial<WorkspaceSnapshot>),
              ]),
            )
          : {}

      return {
        activeProjectId: String(parsed.activeProjectId || ""),
        projects,
        snapshots,
      }
    } catch {
      return null
    }
  }

  const persistProjectStore = (
    projects: WorkspaceProjectMeta[],
    activeProjectId: string,
    snapshotOverrides: Record<string, WorkspaceSnapshot | undefined> = {},
  ) => {
    if (typeof window === "undefined") {
      return
    }

    const existingStore = readStoredProjectStore()
    const mergedSnapshots = { ...(existingStore?.snapshots || {}), ...snapshotOverrides }
    const snapshots = Object.fromEntries(
      projects.map((project) => [project.id, normalizeWorkspaceSnapshot(mergedSnapshots[project.id] || buildEmptyWorkspaceSnapshot())]),
    )

    window.localStorage.setItem(
      PROJECTS_STORAGE_KEY,
      JSON.stringify({
        activeProjectId,
        projects,
        snapshots,
      } satisfies WorkspaceProjectStore),
    )
  }

  const handleProjectSwitch = (nextProjectId: string) => {
    if (!nextProjectId || nextProjectId === currentProjectId) {
      return
    }

    const switchTimestamp = new Date().toISOString()
    const nextProjects = projectMetas.map((project) =>
      project.id === currentProjectId ? { ...project, updatedAt: switchTimestamp } : project,
    )
    const currentSnapshot = buildCurrentWorkspaceSnapshot(switchTimestamp)
    const storedProjects = readStoredProjectStore()
    const targetProject = nextProjects.find((project) => project.id === nextProjectId)
    const targetSnapshot = storedProjects?.snapshots[nextProjectId] || buildEmptyWorkspaceSnapshot()

    persistProjectStore(nextProjects, nextProjectId, {
      [currentProjectId]: currentSnapshot,
    })

    setProjectMetas(nextProjects)
    setCurrentProjectId(nextProjectId)
    setProjectNameDraft(targetProject?.name || "New synopsis")
    setIsEditingProjectName(false)
    applyWorkspaceSnapshot(targetSnapshot)
  }

  const handleCreateProject = () => {
    const createTimestamp = new Date().toISOString()
    const currentSnapshot = currentProjectId ? buildCurrentWorkspaceSnapshot(createTimestamp) : buildEmptyWorkspaceSnapshot()
    const currentProjects = currentProjectId
      ? projectMetas.map((project) => (project.id === currentProjectId ? { ...project, updatedAt: createTimestamp } : project))
      : projectMetas
    const nextProject = createWorkspaceProjectMeta(buildNextProjectName(currentProjects))
    const nextSnapshot = buildEmptyWorkspaceSnapshot()
    const nextProjects = [...currentProjects, nextProject]

    persistProjectStore(nextProjects, nextProject.id, {
      ...(currentProjectId ? { [currentProjectId]: currentSnapshot } : {}),
      [nextProject.id]: nextSnapshot,
    })

    setProjectMetas(nextProjects)
    setCurrentProjectId(nextProject.id)
    setProjectNameDraft(nextProject.name)
    setIsEditingProjectName(true)
    applyWorkspaceSnapshot(nextSnapshot)
  }

  const handleSaveProjectName = () => {
    if (!currentProjectId) {
      return
    }

    const renameTimestamp = new Date().toISOString()
    const nextName = normalizeProjectName(projectNameDraft, study.studyTitle || "New synopsis")
    const nextProjects = projectMetas.map((project) =>
      project.id === currentProjectId ? { ...project, name: nextName, updatedAt: renameTimestamp } : project,
    )
    const currentSnapshot = buildCurrentWorkspaceSnapshot(renameTimestamp)

    persistProjectStore(nextProjects, currentProjectId, {
      [currentProjectId]: currentSnapshot,
    })

    setProjectMetas(nextProjects)
    setProjectNameDraft(nextName)
    setSavedAt(renameTimestamp)
    setIsEditingProjectName(false)
  }

  const handleDeleteCurrentProject = () => {
    if (!currentProjectId) {
      return
    }

    const projectToDelete = projectMetas.find((project) => project.id === currentProjectId)

    if (!window.confirm(`Delete "${projectToDelete?.name || "this synopsis"}"? This removes it from local storage.`)) {
      return
    }

    if (projectMetas.length <= 1) {
      const replacementProject = createWorkspaceProjectMeta("New synopsis")
      const replacementSnapshot = buildEmptyWorkspaceSnapshot()
      persistProjectStore([replacementProject], replacementProject.id, {
        [replacementProject.id]: replacementSnapshot,
      })
      setProjectMetas([replacementProject])
      setCurrentProjectId(replacementProject.id)
      setProjectNameDraft(replacementProject.name)
      setIsEditingProjectName(true)
      applyWorkspaceSnapshot(replacementSnapshot)
      return
    }

    const remainingProjects = projectMetas.filter((project) => project.id !== currentProjectId)
    const nextProject = remainingProjects[0]
    const storedProjects = readStoredProjectStore()
    const nextSnapshot = storedProjects?.snapshots[nextProject.id] || buildEmptyWorkspaceSnapshot()

    persistProjectStore(remainingProjects, nextProject.id)

    setProjectMetas(remainingProjects)
    setCurrentProjectId(nextProject.id)
    setProjectNameDraft(nextProject.name)
    setIsEditingProjectName(false)
    applyWorkspaceSnapshot(nextSnapshot)
  }

  const currentSubcategories =
    STUDY_CATEGORIES[study.category as keyof typeof STUDY_CATEGORIES]?.subcategories ?? []

  const studyMissing = validateStudy(study)
  const studySchemaMissing = getStudySchemaMissing(study)
  const objectiveSuggestionMissing = getObjectiveSuggestionMissing(study)
  const endpointSuggestionMissing = getEndpointSuggestionMissing(study)
  const populationDraftMissing = getPopulationDraftMissing(study)
  const eligibilitySuggestionMissing = getEligibilitySuggestionMissing(study)
  const impactAssessmentMissing = getImpactAssessmentMissing(study)
  const picoMissing = validatePicoAndStats(pico, stats)
  const sampleSizeEstimateMissing = getSampleSizeEstimateMissing(stats)
  const sampleSizeSuggestions = buildSampleSizeSuggestions(study, pico, stats)
  const literatureMissing = validateLiterature(literature)
  const scheduleMissing = validateSchedule(schedule)
  const studyReady = studyMissing.length === 0
  const studySchemaReady = studySchemaMissing.length === 0
  const picoReady = Boolean(pico.population && pico.intervention && pico.outcomes && stats.endpointType)
  const literatureReady = Boolean(literature.pubmedQuery && literature.backgroundThemes)
  const scheduleReady = Boolean(schedule.columns.length && schedule.rows.length)
  const scheduleInsightsReady = Boolean(
    scheduleInsights.generatedAt &&
      (scheduleInsights.complexity.drivers.length > 0 || scheduleInsights.tradeoff.recommendations.length > 0),
  )
  const showReviewGates = false
  const includedSections = sections.filter((section) => section.included)
  const showScheduleTab = study.category === "interventional"
  const isEvidenceSynthesisStudy = study.category === "evidence-synthesis"
  const visibleTabs = TABS.filter((tab) => tab.id !== "schedule" || showScheduleTab)
  const tabIndexById = Object.fromEntries(visibleTabs.map((tab, index) => [tab.id, index + 1])) as Record<
    (typeof TABS)[number]["id"],
    number
  >
  const scheduleTablePresentation = getScheduleTablePresentation(schedule)
  const canSplitScheduleTable = schedule.columns.length >= 4
  const studySchemaFingerprint = buildStudySchemaFingerprint(study)
  const studySchemaGenerated = Boolean(studySchema.generatedAt && studySchema.lanes.length && studySchema.nodes.length)
  const studySchemaStale = Boolean(
    studySchemaGenerated && studySchema.sourceFingerprint && studySchema.sourceFingerprint !== studySchemaFingerprint,
  )
  const currentProjectMeta = projectMetas.find((project) => project.id === currentProjectId) || null
  const currentProjectName = currentProjectMeta?.name || normalizeProjectName(projectNameDraft, "New synopsis")
  const selectedEvidenceUseIntents = Array.isArray(study.secondaryEvidenceUseIntents) ? study.secondaryEvidenceUseIntents : []
  const selectedStrategicObjectives = Array.isArray(study.secondaryStrategicObjectives) ? study.secondaryStrategicObjectives : []
  const primaryIntentAlignment = buildPrimaryIntentAlignment(study)
  const objectiveSuggestionReady = objectiveSuggestionMissing.length === 0
  const endpointSuggestionReady = endpointSuggestionMissing.length === 0
  const populationDraftReady = populationDraftMissing.length === 0
  const eligibilitySuggestionReady = eligibilitySuggestionMissing.length === 0
  const impactAssessmentReady = impactAssessmentMissing.length === 0
  const sampleSizeEstimateReady = sampleSizeEstimateMissing.length === 0
  const hasObjectiveSuggestionDraft = Boolean(
    objectiveSuggestionDraft.primaryObjective ||
      objectiveSuggestionDraft.secondaryObjectives.length ||
      objectiveSuggestionDraft.designOverview,
  )
  const hasEndpointSuggestionDraft = Boolean(
    endpointSuggestionDraft.primaryEndpoint ||
      endpointSuggestionDraft.secondaryEndpoints.length ||
      endpointSuggestionDraft.exploratoryEndpoints.length,
  )
  const hasPopulationSuggestionDraft = Boolean(populationSuggestionDraft.population || populationSuggestionDraft.eligibility)
  const selectedObjectiveSuggestionCount =
    (objectiveSuggestionSelection.primaryObjective ? 1 : 0) +
    objectiveSuggestionSelection.secondaryObjectives.length +
    (objectiveSuggestionSelection.designOverview ? 1 : 0)
  const selectedEndpointSuggestionCount =
    (endpointSuggestionSelection.primaryEndpoint ? 1 : 0) +
    endpointSuggestionSelection.secondaryEndpoints.length +
    endpointSuggestionSelection.exploratoryEndpoints.length
  const selectedPopulationSuggestionCount =
    (populationSuggestionSelection.population ? 1 : 0) + (populationSuggestionSelection.eligibility ? 1 : 0)
  const objectiveSuggestionButtonLabel = getAiActionLabel(
    objectiveSuggestionReady,
    loadingAction === "objectives",
    hasObjectiveSuggestionDraft,
    objectiveSuggestionMissing,
  )
  const endpointSuggestionButtonLabel = getAiActionLabel(
    endpointSuggestionReady,
    loadingAction === "endpoints",
    hasEndpointSuggestionDraft,
    endpointSuggestionMissing,
  )
  const populationDraftButtonLabel = getAiActionLabel(
    populationDraftReady,
    loadingAction === "population" && populationSuggestionSource === "population",
    hasPopulationSuggestionDraft,
    populationDraftMissing,
  )
  const eligibilitySuggestionButtonLabel = getAiActionLabel(
    eligibilitySuggestionReady,
    loadingAction === "population" && populationSuggestionSource === "eligibility",
    hasPopulationSuggestionDraft,
    eligibilitySuggestionMissing,
  )
  const populationAssistantTitle =
    populationSuggestionSource === "eligibility" ? "Eligibility proposal" : "Population proposal"
  const populationAssistantDescription =
    populationSuggestionSource === "eligibility"
      ? "Review and selectively apply AI-drafted eligibility highlights. Population wording is also available if you want to replace it."
      : "Review and selectively apply AI-drafted population wording. Eligibility highlights are included as an optional add-on."
  const populationAssistantLoadingTitle =
    populationSuggestionSource === "eligibility" ? "Drafting eligibility highlights" : "Drafting target population"
  const populationAssistantLoadingSummary =
    populationSuggestionSource === "eligibility"
      ? "AI is using the completed Population field and the study context to tighten eligibility wording."
      : "AI is using the study objective, disease, intervention, and study type to draft a target population."
  const populationAssistantSteps =
    populationSuggestionSource === "eligibility"
      ? ["Population reviewed", "Eligibility logic checked", "Drafting wording now"]
      : ["Study context gathered", "Population fit checked", "Drafting wording now"]
  const objectiveApplySummary = buildObjectiveApplySummary(objectiveSuggestionSelection)
  const populationApplySummary = buildPopulationApplySummary(populationSuggestionSelection)
  const endpointApplySummary = buildEndpointApplySummary(selectedEndpointSuggestionCount)
  const gates = {
    pico: studyReady,
    literature: studyReady && picoReady,
    schedule: showScheduleTab && studyReady && picoReady && literatureReady,
    sections: studyReady && picoReady && literatureReady && (!showScheduleTab || scheduleReady),
    final: studyReady && picoReady && literatureReady && (!showScheduleTab || scheduleReady),
  }

  useEffect(() => {
    const storedProjects = readStoredProjectStore()

    if (storedProjects?.projects.length) {
      const activeProject =
        storedProjects.projects.find((project) => project.id === storedProjects.activeProjectId) || storedProjects.projects[0]
      const snapshot = storedProjects.snapshots[activeProject.id] || buildEmptyWorkspaceSnapshot()
      setProjectMetas(storedProjects.projects)
      setCurrentProjectId(activeProject.id)
      setProjectNameDraft(activeProject.name)
      applyWorkspaceSnapshot(snapshot)
      setHydrated(true)
      return
    }

    const legacyRaw = window.localStorage.getItem(STORAGE_KEY)
    let initialSnapshot = buildEmptyWorkspaceSnapshot()
    let initialName = "New synopsis"

    if (legacyRaw) {
      try {
        const parsed = JSON.parse(legacyRaw) as Partial<WorkspaceSnapshot>
        initialSnapshot = normalizeWorkspaceSnapshot(parsed)
        initialName = normalizeProjectName(parsed.study?.studyTitle || "", "New synopsis")
      } catch {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }

    const firstProject = createWorkspaceProjectMeta(initialName)
    setProjectMetas([firstProject])
    setCurrentProjectId(firstProject.id)
    setProjectNameDraft(firstProject.name)
    applyWorkspaceSnapshot(initialSnapshot)
    persistProjectStore([firstProject], firstProject.id, { [firstProject.id]: initialSnapshot })
    setHydrated(true)
  }, [])

  useEffect(() => {
    if ((study.customStrategicObjective || "").trim()) {
      setIsCustomStrategicObjective(true)
    }
  }, [study.customStrategicObjective])

  useEffect(() => {
    if ((study.customDisease || "").trim()) {
      setIsCustomDisease(true)
    }
  }, [study.customDisease])

  useEffect(() => {
    if (!showScheduleTab && activeTab === "schedule") {
      setActiveTab("study")
    }
  }, [activeTab, showScheduleTab])

  useEffect(() => {
    if (!hydrated || !studySchema.generatedAt || studySchema.manualEdited) {
      return
    }

    const shouldCompactStudySchema =
      isStudySchemaOversized(studySchema) || (studySchema.detailLevel === "simple" && studySchema.provenance === "ai_generated")

    if (!shouldCompactStudySchema) {
      return
    }

    setStudySchema((current) => {
      const shouldCompactCurrent =
        isStudySchemaOversized(current) || (current.detailLevel === "simple" && current.provenance === "ai_generated")

      if (!current.generatedAt || current.manualEdited || !shouldCompactCurrent) {
        return current
      }

      const compacted = buildStudySchemaFromStudy(study, {
        orientation: current.orientation,
        detailLevel: current.detailLevel,
        iterationPrompt: current.iterationPrompt,
        theme: current.theme,
      })

      return normalizeStudySchema({
        ...compacted,
        title: current.title || compacted.title,
        notes: current.notes.length ? current.notes.slice(0, 2) : compacted.notes,
        generatedAt: current.generatedAt,
        provenance: current.provenance === "ai_generated" ? "hybrid" : current.provenance,
        manualEdited: false,
        sourceFingerprint: current.sourceFingerprint || studySchemaFingerprint,
      })
    })
  }, [hydrated, study, studySchema, studySchemaFingerprint])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    const nextSavedAt = new Date().toISOString()
    setSavedAt(nextSavedAt)
    if (!currentProjectId || !projectMetas.length) {
      return
    }

    const serializedProjects = projectMetas.map((project) =>
      project.id === currentProjectId ? { ...project, updatedAt: nextSavedAt } : project,
    )

    persistProjectStore(serializedProjects, currentProjectId, {
      [currentProjectId]: buildCurrentWorkspaceSnapshot(nextSavedAt),
    })
  }, [
    activeTab,
    currentProjectId,
    finalSections,
    hydrated,
    impactAssessment,
    literature,
    pico,
    projectMetas,
    reviews,
    sampleSizeEstimate,
    schedule,
    scheduleInsights,
    sections,
    stats,
    study,
    studyDocumentImportReport,
    studySchema,
  ])

  const updateStudy = <K extends keyof StudyForm>(key: K, value: StudyForm[K]) => {
    setStudy((current) => {
      const next = { ...current, [key]: value }

      if (key === "customDisease") {
        next.indication =
          !(current.indication || "").trim() || current.indication === getSelectedDiseaseLabel(current)
            ? String(value || "")
            : current.indication
      }

      if (key === "customEndpoints") {
        const previousStructuredOutcomes = getAllChosenEndpoints(current).join("\n")
        const nextStructuredOutcomes = [...(current.selectedEndpoints || []), ...splitItems(String(value || ""))].join("\n")
        next.outcomes =
          !(current.outcomes || "").trim() || current.outcomes === previousStructuredOutcomes
            ? nextStructuredOutcomes
            : current.outcomes
      }

      if (key === "outcomes") {
        const derivedEndpointState = deriveEndpointStateFromOutcomeText(next, String(value || ""))
        next.selectedEndpoints = derivedEndpointState.selectedEndpoints
        next.customEndpoints = derivedEndpointState.customEndpoints
        next.outcomes = derivedEndpointState.outcomes
      }

      return next
    })
    clearAiProposalDrafts()
    clearSampleSizeEstimate()
    clearImpactAssessment()
    setFinalSections([])
    clearScheduleInsights()
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      study: { ...current.study, status: "pending", reviewedAt: "" },
      pico: { ...current.pico, status: "pending", reviewedAt: "" },
      literature: { ...current.literature, status: "pending", reviewedAt: "" },
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const updatePico = <K extends keyof PicoForm>(key: K, value: PicoForm[K]) => {
    setPico((current) => ({ ...current, [key]: value }))
    clearSampleSizeEstimate()
    setFinalSections([])
    clearScheduleInsights()
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      pico: { ...current.pico, status: "pending", reviewedAt: "" },
      literature: { ...current.literature, status: "pending", reviewedAt: "" },
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const updateStats = <K extends keyof StatsForm>(key: K, value: StatsForm[K]) => {
    setStats((current) => ({ ...current, [key]: value }))
    clearSampleSizeEstimate()
    setFinalSections([])
    clearScheduleInsights()
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      pico: { ...current.pico, status: "pending", reviewedAt: "" },
      literature: { ...current.literature, status: "pending", reviewedAt: "" },
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const handleStatsEditorChange = (value: string) => {
    setStats((current) => parseStatsEditorText(value, current))
    clearSampleSizeEstimate()
    setFinalSections([])
    clearScheduleInsights()
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      pico: { ...current.pico, status: "pending", reviewedAt: "" },
      literature: { ...current.literature, status: "pending", reviewedAt: "" },
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const applySampleSizeSuggestions = (suggestions: SampleSizeSuggestion[]) => {
    if (!suggestions.length) {
      return
    }

    setStats((current) => {
      const next = { ...current }

      suggestions.forEach((suggestion) => {
        next[suggestion.key] = suggestion.value as StatsForm[typeof suggestion.key]
      })

      return next
    })
    clearSampleSizeEstimate()
    setFinalSections([])
    clearScheduleInsights()
    setApiNotice("Draft statistical assumptions were applied. Review the unified assumptions box, adjust if needed, then rerun the estimate.")
    setReviews((current) => ({
      ...current,
      pico: { ...current.pico, status: "pending", reviewedAt: "" },
      literature: { ...current.literature, status: "pending", reviewedAt: "" },
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const updateLiterature = <K extends keyof LiteratureForm>(key: K, value: LiteratureForm[K]) => {
    setLiterature((current) => ({ ...current, [key]: value }))
    setFinalSections([])
    clearScheduleInsights()
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      literature: { ...current.literature, status: "pending", reviewedAt: "" },
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const updateStudySchemaMeta = <K extends keyof StudySchemaForm>(key: K, value: StudySchemaForm[K]) => {
    setStudySchema((current) =>
      normalizeStudySchema({
        ...current,
        [key]: value,
        provenance: key === "iterationPrompt" ? current.provenance : current.generatedAt ? "hybrid" : "manual",
        manualEdited: key === "iterationPrompt" ? current.manualEdited : true,
      }),
    )
    setApiNotice("")
  }

  const updateStudySchemaTheme = (key: keyof StudySchemaTheme, value: string) => {
    setStudySchema((current) =>
      normalizeStudySchema({
        ...current,
        theme: { ...current.theme, [key]: value },
        provenance: current.generatedAt ? "hybrid" : "manual",
        manualEdited: true,
      }),
    )
    setApiNotice("")
  }

  const updateStudySchemaLane = (laneId: string, updates: Partial<StudySchemaLane>) => {
    setStudySchema((current) =>
      normalizeStudySchema({
        ...current,
        lanes: current.lanes.map((lane) => (lane.id === laneId ? { ...lane, ...updates } : lane)),
        provenance: current.generatedAt ? "hybrid" : "manual",
        manualEdited: true,
      }),
    )
    setApiNotice("")
  }

  const updateStudySchemaNode = (nodeId: string, updates: Partial<StudySchemaNode>) => {
    setStudySchema((current) =>
      normalizeStudySchema({
        ...current,
        nodes: current.nodes.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)),
        provenance: current.generatedAt ? "hybrid" : "manual",
        manualEdited: true,
      }),
    )
    setApiNotice("")
  }

  const updateScheduleMeta = <K extends keyof ScheduleForm>(key: K, value: ScheduleForm[K]) => {
    setSchedule((current) => {
      const editingContent = key !== "iterationPrompt"
      return {
        ...current,
        [key]: value,
        provenance: editingContent
          ? current.generatedAt
            ? "hybrid"
            : "manual"
          : current.provenance,
        manualEdited: editingContent ? true : current.manualEdited,
      }
    })
    setFinalSections([])
    clearScheduleInsights()
    setApiNotice("")
    if (key !== "iterationPrompt") {
      setReviews((current) => ({
        ...current,
        schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
      }))
    }
  }

  const updateScheduleRow = (rowId: string, updates: Partial<ScheduleRow>) => {
    setSchedule((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.id === rowId ? { ...row, ...updates } : row)),
      provenance: current.generatedAt ? "hybrid" : "manual",
      manualEdited: true,
    }))
    setFinalSections([])
    clearScheduleInsights()
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const updateScheduleCell = (rowId: string, columnId: string, value: string) => {
    setSchedule((current) => ({
      ...current,
      rows: current.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              cells: { ...row.cells, [columnId]: value },
            }
          : row,
      ),
      provenance: current.generatedAt ? "hybrid" : "manual",
      manualEdited: true,
    }))
    setFinalSections([])
    clearScheduleInsights()
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const updateScheduleColumn = (columnId: string, updates: Partial<ScheduleColumn>) => {
    setSchedule((current) => ({
      ...current,
      columns: current.columns.map((column) => (column.id === columnId ? { ...column, ...updates } : column)),
      provenance: current.generatedAt ? "hybrid" : "manual",
      manualEdited: true,
    }))
    setFinalSections([])
    clearScheduleInsights()
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const updateScheduleColumnGroup = (level: "phase" | "period", columnIds: string[], value: string) => {
    setSchedule((current) => ({
      ...current,
      columns: current.columns.map((column) => (columnIds.includes(column.id) ? { ...column, [level]: value } : column)),
      provenance: current.generatedAt ? "hybrid" : "manual",
      manualEdited: true,
    }))
    setFinalSections([])
    clearScheduleInsights()
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const handleAddScheduleColumn = () => {
    setSchedule((current) => {
      const lastColumn = current.columns[current.columns.length - 1]
      const nextColumn: ScheduleColumn = {
        id: `visit-${current.columns.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
        phase: lastColumn?.phase || "Treatment Phase",
        period: lastColumn?.period || "New period",
        visit: "New visit",
        footnote: "",
      }

      return {
        ...current,
        columns: [...current.columns, nextColumn],
        rows: current.rows.map((row) => ({
          ...row,
          cells: { ...row.cells, [nextColumn.id]: "" },
        })),
        provenance: current.generatedAt ? "hybrid" : "manual",
        manualEdited: true,
      }
    })
    setFinalSections([])
    clearScheduleInsights()
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const handleRemoveScheduleColumn = (columnId: string) => {
    setSchedule((current) => ({
      ...current,
      columns: current.columns.filter((column) => column.id !== columnId),
      rows: current.rows.map((row) => {
        const nextCells = { ...row.cells }
        delete nextCells[columnId]
        return { ...row, cells: nextCells }
      }),
      provenance: current.generatedAt ? "hybrid" : "manual",
      manualEdited: true,
    }))
    setFinalSections([])
    clearScheduleInsights()
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const handleAddScheduleRow = () => {
    setSchedule((current) => ({
      ...current,
      rows: [
        ...current.rows,
        {
          id: `custom-row-${current.rows.length + 1}`,
          group: current.rows[current.rows.length - 1]?.group || "Custom activities",
          activity: "New activity",
          notes: "",
          cells: Object.fromEntries(current.columns.map((column) => [column.id, ""])) as Record<string, string>,
        },
      ],
      provenance: current.generatedAt ? "hybrid" : "manual",
      manualEdited: true,
    }))
    setFinalSections([])
    clearScheduleInsights()
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const handleRemoveScheduleRow = (rowId: string) => {
    setSchedule((current) => ({
      ...current,
      rows: current.rows.filter((row) => row.id !== rowId),
      provenance: current.generatedAt ? "hybrid" : "manual",
      manualEdited: true,
    }))
    setFinalSections([])
    clearScheduleInsights()
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const updateSection = (id: string, updates: Partial<SynopsisSection>) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== id) {
          return section
        }

        const promptChanged = updates.prompt !== undefined && updates.prompt !== section.prompt
        const bodyChanged = updates.body !== undefined && updates.body !== section.body
        const titleChanged = updates.title !== undefined && updates.title !== section.title

        return {
          ...section,
          ...updates,
          promptVersion: promptChanged ? section.promptVersion + 1 : section.promptVersion,
          provenance:
            bodyChanged || titleChanged || promptChanged
              ? section.lastGeneratedAt
                ? "hybrid"
                : "manual"
              : section.provenance,
          manualEdited: section.manualEdited || bodyChanged || titleChanged || promptChanged,
          sourceTabs: updates.title ? getSectionSourceTabs(updates.title) : section.sourceTabs,
          assumptionFlags: updates.title ? getDefaultAssumptions(updates.title) : section.assumptionFlags,
        }
      }),
    )
    setFinalSections([])
    setApiNotice("")
  }

  const updateReview = (stage: keyof ReviewState, updates: Partial<StageReview>) => {
    setReviews((current) => ({
      ...current,
      [stage]: {
        ...current[stage],
        ...updates,
      },
    }))
  }

  const callOpenAI = async <T,>(payload: unknown) => {
    setApiError("")
    setApiNotice("")

    const response = await fetch("/api/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "OpenAI request failed.")
    }

    return data as T
  }

  const handleGenerateStudySchema = async () => {
    if (studySchemaMissing.length) {
      setApiError(`Add ${studySchemaMissing.join(", ")} before generating the study schema.`)
      return
    }

    setLoadingAction("schema")

    try {
      const result = await callOpenAI<Pick<StudySchemaForm, "title" | "schemaType" | "orientation" | "detailLevel" | "lanes" | "nodes" | "edges" | "notes">>({
        action: "generate_study_schema",
        study,
        requestNote: studySchema.iterationPrompt,
        orientation: "horizontal",
        detailLevel: studySchema.detailLevel,
      })

      setStudySchema(shapeGeneratedStudySchema(study, studySchema, result))
      setActiveTab("schema")
    } catch (error) {
      setStudySchema(
        buildStudySchemaFromStudy(study, {
          orientation: "horizontal",
          detailLevel: studySchema.detailLevel,
          iterationPrompt: studySchema.iterationPrompt,
          theme: studySchema.theme,
        }),
      )
      setApiNotice(
        `OpenAI study-schema generation failed, so the app used a local schema draft instead. ${
          error instanceof Error ? error.message : "Unable to generate the study schema."
        }`,
      )
      setActiveTab("schema")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleExportStudySchema = async (format: "svg" | "png") => {
    if (!studySchema.lanes.length || !studySchema.nodes.length) {
      setApiError("Generate the study schema before exporting it.")
      return
    }

    const svgMarkup = buildStudySchemaSvgMarkup(studySchema, study)
    const baseName = slugify(`${study.studyTitle || "study"}-schema`)

    if (format === "svg") {
      const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${baseName}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      return
    }

    const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" })
    const svgUrl = window.URL.createObjectURL(svgBlob)
    const image = new Image()

    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext("2d")

      if (!context) {
        setApiError("PNG export could not start because the browser canvas context was unavailable.")
        window.URL.revokeObjectURL(svgUrl)
        return
      }

      context.fillStyle = studySchema.theme.background
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0)
      canvas.toBlob((blob) => {
        if (!blob) {
          setApiError("PNG export failed while rasterizing the schema.")
          window.URL.revokeObjectURL(svgUrl)
          return
        }

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${baseName}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        window.URL.revokeObjectURL(svgUrl)
      }, "image/png")
    }

    image.onerror = () => {
      setApiError("PNG export failed while loading the generated study schema image.")
      window.URL.revokeObjectURL(svgUrl)
    }

    image.src = svgUrl
  }

  const handleImportStudyDocument = async () => {
    if (!studyDocumentFile) {
      setApiError("Choose a PDF, Word, or PowerPoint study description before importing.")
      return
    }

    const supportedMimeTypes = new Set([
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ])
    const hasSupportedExtension = /\.(pdf|docx|pptx)$/i.test(studyDocumentFile.name)

    if (!supportedMimeTypes.has(studyDocumentFile.type) && !hasSupportedExtension) {
      setApiError("Upload a PDF, DOCX, or PPTX file.")
      return
    }

    if (studyDocumentFile.size > 12 * 1024 * 1024) {
      setApiError("The selected file is too large. Keep study-description uploads below 12 MB.")
      return
    }

    setLoadingAction("import")

    try {
      const fileData = await readFileAsDataUrl(studyDocumentFile)
      const result = await callOpenAI<StudyDocumentImportResult>({
        action: "import_study_document",
        fileName: studyDocumentFile.name,
        mimeType: studyDocumentFile.type || "application/octet-stream",
        fileData,
        referenceData: {
          categories: Object.keys(STUDY_CATEGORIES),
          subcategories: Object.fromEntries(
            Object.entries(STUDY_CATEGORIES).map(([key, value]) => [key, value.subcategories]),
          ),
          developmentStages: [...DEVELOPMENT_STAGES],
          strategicObjectives: [...STRATEGIC_OBJECTIVES],
          evidenceUseIntents: [...EVIDENCE_USE_INTENTS],
          therapeuticAreas: Object.fromEntries(
            Object.entries(THERAPEUTIC_LIBRARY).map(([area, config]) => [area, Object.keys(config.diseases)]),
          ),
        },
      })

      const { next, appliedFields, replacedFields, conflictNotes } = buildImportedStudyPatch(study, result.study || {})
      const remainingFields = validateStudy(next)

      setStudy(next)
      clearAiProposalDrafts()
      clearSampleSizeEstimate()
      clearImpactAssessment()
      clearScheduleInsights()
      setFinalSections([])
      setStudyDocumentImportReport(
        normalizeStudyDocumentImportReport({
          sourceName: studyDocumentFile.name,
          importedAt: new Date().toISOString(),
          summary: result.summary || "Study-description import completed.",
          appliedFields,
          replacedFields,
          remainingFields,
          unresolved: result.unresolved || [],
          assumptions: result.assumptions || [],
          conflictNotes,
        }),
      )
      setReviews((current) => ({
        ...current,
        study: { ...current.study, status: "pending", reviewedAt: "" },
        pico: { ...current.pico, status: "pending", reviewedAt: "" },
        literature: { ...current.literature, status: "pending", reviewedAt: "" },
        schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
      }))

      setApiNotice(
        appliedFields.length || replacedFields.length
          ? [
              appliedFields.length
                ? `Imported ${appliedFields.length} new field${appliedFields.length === 1 ? "" : "s"}`
                : "",
              replacedFields.length
                ? `updated ${replacedFields.length} conflicting field${replacedFields.length === 1 ? "" : "s"}`
                : "",
              `from ${studyDocumentFile.name}.`,
            ]
              .filter(Boolean)
              .join(" ")
          : `The document was reviewed, but no fields changed because the source did not add anything clearer than the current form.`,
      )
    } catch (error) {
      setApiError(
        error instanceof Error
          ? `Study-description import failed. ${error.message}`
          : "Study-description import failed.",
      )
    } finally {
      setLoadingAction(null)
    }
  }

  const moveSection = (id: string, direction: "up" | "down") => {
    setSections((current) => {
      const index = current.findIndex((section) => section.id === id)
      if (index === -1) {
        return current
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current
      }

      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(targetIndex, 0, item)
      return next
    })
  }

  const toggleSelectionItem = (items: string[], value: string) =>
    items.includes(value) ? items.filter((item) => item !== value) : [...items, value]

  const openAiProposalModal = (kind: AiAssistantModalKind) => {
    setOpenAiAssistantModal(kind)
    setApiError("")
  }

  const dismissObjectiveSuggestion = () => {
    setObjectiveSuggestionDraft(emptyObjectiveSuggestionDraft)
    setObjectiveSuggestionAlternatives([])
    setObjectiveSuggestionSelection(emptyObjectiveSuggestionSelection)
    setObjectiveSuggestionGuidance("")
    setOpenAiAssistantModal((current) => (current === "objectives" ? null : current))
  }

  const dismissEndpointSuggestion = () => {
    setEndpointSuggestionDraft(emptyEndpointSuggestionDraft)
    setEndpointSuggestionAlternatives([])
    setEndpointSuggestionSelection(emptyEndpointSuggestionSelection)
    setEndpointSuggestionGuidance("")
    setOpenAiAssistantModal((current) => (current === "endpoints" ? null : current))
  }

  const dismissPopulationSuggestion = () => {
    setPopulationSuggestionDraft(emptyPopulationSuggestionDraft)
    setPopulationSuggestionSelection(emptyPopulationSuggestionSelection)
    setPopulationSuggestionSource("population")
    setOpenAiAssistantModal((current) => (current === "population" ? null : current))
  }

  const useObjectiveAlternative = (option: ObjectiveSuggestionDraft) => {
    setObjectiveSuggestionAlternatives((current) => [objectiveSuggestionDraft, ...current].filter((item) => item !== option))
    setObjectiveSuggestionDraft(option)
    setObjectiveSuggestionSelection(createObjectiveSuggestionSelection(option))
  }

  const useEndpointAlternative = (option: EndpointSuggestionDraft) => {
    setEndpointSuggestionAlternatives((current) => [endpointSuggestionDraft, ...current].filter((item) => item !== option))
    setEndpointSuggestionDraft(option)
    setEndpointSuggestionSelection(createEndpointSuggestionSelection(option))
  }

  const toggleStudyArrayField = (
    key: "secondaryStrategicObjectives" | "secondaryEvidenceUseIntents" | "selectedEndpoints",
    value: string,
  ) => {
    setStudy((current) => {
      const existing = Array.isArray(current[key]) ? current[key] : []
      const nextValues = existing.includes(value) ? existing.filter((item) => item !== value) : [...existing, value]
      const previousStructuredOutcomes = getAllChosenEndpoints(current).join("\n")
      const nextStructuredOutcomes =
        key === "selectedEndpoints"
          ? [...nextValues, ...splitStructuredEditorItems(current.customEndpoints || "")].join("\n")
          : previousStructuredOutcomes

      return {
        ...current,
        [key]: nextValues,
        outcomes:
          key === "selectedEndpoints" && (!(current.outcomes || "").trim() || current.outcomes === previousStructuredOutcomes)
            ? nextStructuredOutcomes
            : current.outcomes,
      }
    })
    clearAiProposalDrafts()
    clearSampleSizeEstimate()
    clearImpactAssessment()
    setFinalSections([])
    setApiNotice("")
    setOpenAiAssistantModal(null)
    setReviews((current) => ({
      ...current,
      study: { ...current.study, status: "pending", reviewedAt: "" },
      pico: { ...current.pico, status: "pending", reviewedAt: "" },
      literature: { ...current.literature, status: "pending", reviewedAt: "" },
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const handlePrimaryEvidenceUseIntentChange = (value: string) => {
    setStudy((current) => ({
      ...current,
      primaryStudyAim: "",
      primaryEvidenceUseIntent: value,
      secondaryEvidenceUseIntents: (current.secondaryEvidenceUseIntents || []).filter((item) => item !== value),
    }))
    clearAiProposalDrafts()
    clearSampleSizeEstimate()
    clearImpactAssessment()
    setFinalSections([])
    setApiNotice("")
    setOpenAiAssistantModal(null)
    setReviews((current) => ({
      ...current,
      study: { ...current.study, status: "pending", reviewedAt: "" },
      pico: { ...current.pico, status: "pending", reviewedAt: "" },
      literature: { ...current.literature, status: "pending", reviewedAt: "" },
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const handleCategoryChange = (category: string) => {
    const firstSubcategory = STUDY_CATEGORIES[category as keyof typeof STUDY_CATEGORIES]?.subcategories?.[0] ?? ""
    setStudy((current) => ({
      ...current,
      category,
      subcategory: firstSubcategory,
      developmentStage:
        category === "interventional"
          ? current.developmentStage === "Not phase-based"
            ? ""
            : current.developmentStage
          : "Not phase-based",
    }))
    setStudyTypeReviewNotice(buildStudyTypeReviewNotice("category", category, firstSubcategory))
    clearAiProposalDrafts()
    clearSampleSizeEstimate()
    clearImpactAssessment()
    setFinalSections([])
    setApiNotice("")
    setOpenAiAssistantModal(null)
    setReviews((current) => ({
      ...current,
      study: { ...current.study, status: "pending", reviewedAt: "" },
      pico: { ...current.pico, status: "pending", reviewedAt: "" },
      literature: { ...current.literature, status: "pending", reviewedAt: "" },
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const handleSubcategoryChange = (subcategory: string) => {
    updateStudy("subcategory", subcategory)
    setStudyTypeReviewNotice(buildStudyTypeReviewNotice("subcategory", study.category, subcategory))
  }

  const handleTherapeuticAreaChange = (therapeuticArea: string) => {
    setStudy((current) => ({
      ...current,
      therapeuticArea,
      disease: "",
      customDisease: "",
      selectedEndpoints: [],
      indication: getSelectedDiseaseLabel(current) && current.indication === getSelectedDiseaseLabel(current) ? "" : current.indication,
      outcomes:
        current.outcomes === getAllChosenEndpoints(current).join("\n")
          ? ""
          : current.outcomes,
    }))
    clearAiProposalDrafts()
    clearSampleSizeEstimate()
    clearImpactAssessment()
    setFinalSections([])
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      study: { ...current.study, status: "pending", reviewedAt: "" },
      pico: { ...current.pico, status: "pending", reviewedAt: "" },
      literature: { ...current.literature, status: "pending", reviewedAt: "" },
    }))
  }

  const handleStrategicObjectiveSelection = (value: string) => {
    if (value === "__custom__") {
      setIsCustomStrategicObjective(true)
      setStudy((current) => ({
        ...current,
        primaryStudyAim: "",
        primaryStrategicObjective: "",
      }))
      clearAiProposalDrafts()
      clearSampleSizeEstimate()
      clearImpactAssessment()
      setFinalSections([])
      setApiNotice("")
      setReviews((current) => ({
        ...current,
        study: { ...current.study, status: "pending", reviewedAt: "" },
        pico: { ...current.pico, status: "pending", reviewedAt: "" },
        literature: { ...current.literature, status: "pending", reviewedAt: "" },
        schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
      }))
      return
    }

    setIsCustomStrategicObjective(false)
    setStudy((current) => ({
      ...current,
      primaryStudyAim: "",
      primaryStrategicObjective: value,
      customStrategicObjective: "",
    }))
    clearAiProposalDrafts()
    clearSampleSizeEstimate()
    clearImpactAssessment()
    setFinalSections([])
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      study: { ...current.study, status: "pending", reviewedAt: "" },
      pico: { ...current.pico, status: "pending", reviewedAt: "" },
      literature: { ...current.literature, status: "pending", reviewedAt: "" },
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const handlePrimaryStudyAimChange = (value: string) => {
    const mapped = getPrimaryStudyAimDefinition(value)

    setStudy((current) => ({
      ...current,
      primaryStudyAim: value,
      primaryStrategicObjective: mapped?.strategic || current.primaryStrategicObjective,
      primaryEvidenceUseIntent: mapped?.evidence || current.primaryEvidenceUseIntent,
      secondaryStrategicObjectives: (current.secondaryStrategicObjectives || []).filter((item) => item !== mapped?.strategic),
      secondaryEvidenceUseIntents: (current.secondaryEvidenceUseIntents || []).filter((item) => item !== mapped?.evidence),
      customStrategicObjective:
        mapped && current.customStrategicObjective === current.primaryStrategicObjective ? "" : current.customStrategicObjective,
    }))
    clearAiProposalDrafts()
    clearSampleSizeEstimate()
    clearImpactAssessment()
    setFinalSections([])
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      study: { ...current.study, status: "pending", reviewedAt: "" },
      pico: { ...current.pico, status: "pending", reviewedAt: "" },
      literature: { ...current.literature, status: "pending", reviewedAt: "" },
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const handleDiseaseSelection = (value: string) => {
    if (value === "__custom__") {
      setIsCustomDisease(true)
      setStudy((current) => ({
        ...current,
        disease: "",
        customDisease: current.customDisease,
      }))
      clearAiProposalDrafts()
      clearSampleSizeEstimate()
      clearImpactAssessment()
      setFinalSections([])
      setApiNotice("")
      setReviews((current) => ({
        ...current,
        study: { ...current.study, status: "pending", reviewedAt: "" },
        pico: { ...current.pico, status: "pending", reviewedAt: "" },
        literature: { ...current.literature, status: "pending", reviewedAt: "" },
        schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
      }))
      return
    }

    setIsCustomDisease(false)
    handleDiseaseChange(value)
  }

  const handleDiseaseChange = (disease: string) => {
    setStudy((current) => ({
      ...current,
      disease,
      customDisease: "",
      selectedEndpoints: [],
      indication:
        !(current.indication || "").trim() || current.indication === getSelectedDiseaseLabel(current)
          ? disease
          : current.indication,
      outcomes:
        current.outcomes === getAllChosenEndpoints(current).join("\n")
          ? ""
          : current.outcomes,
    }))
    clearAiProposalDrafts()
    clearSampleSizeEstimate()
    clearImpactAssessment()
    setFinalSections([])
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      study: { ...current.study, status: "pending", reviewedAt: "" },
      pico: { ...current.pico, status: "pending", reviewedAt: "" },
      literature: { ...current.literature, status: "pending", reviewedAt: "" },
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const commitStructuredStudyField = (
    key: "outcomes" | "secondaryObjectives" | "eligibility" | "operationalNotes",
    nextItems: StructuredEditorItem[],
    setItems: (items: StructuredEditorItem[]) => void,
  ) => {
    const nextText = buildStructuredEditorText(nextItems).trim()
    setItems(nextItems)

    if (nextText === String(study[key] || "").trim()) {
      return
    }

    updateStudy(key, nextText)
  }

  const toggleStructuredStudyFieldItem = (
    key: "outcomes" | "secondaryObjectives" | "eligibility" | "operationalNotes",
    items: StructuredEditorItem[],
    id: string,
    setItems: (items: StructuredEditorItem[]) => void,
  ) => {
    const nextItems = items.map((item) => (item.id === id ? { ...item, active: !item.active } : item))
    commitStructuredStudyField(key, nextItems, setItems)
  }

  const updateStructuredStudyFieldItemText = (
    key: "outcomes" | "secondaryObjectives" | "eligibility" | "operationalNotes",
    items: StructuredEditorItem[],
    id: string,
    text: string,
    setItems: (items: StructuredEditorItem[]) => void,
  ) => {
    const nextItems = items.map((item) => (item.id === id ? { ...item, text } : item))
    commitStructuredStudyField(key, nextItems, setItems)
  }

  const deleteStructuredStudyFieldItem = (
    key: "outcomes" | "secondaryObjectives" | "eligibility" | "operationalNotes",
    items: StructuredEditorItem[],
    id: string,
    setItems: (items: StructuredEditorItem[]) => void,
  ) => {
    const nextItems = items.filter((item) => item.id !== id)
    commitStructuredStudyField(key, nextItems, setItems)
  }

  const addStructuredStudyFieldItem = (
    key: "outcomes" | "secondaryObjectives" | "eligibility" | "operationalNotes",
    items: StructuredEditorItem[],
    value: string,
    setItems: (items: StructuredEditorItem[]) => void,
    clearDraft: () => void,
  ) => {
    const nextValue = value.trim()

    if (!nextValue) {
      return
    }

    const duplicate = items.some((item) => item.text.trim().toLowerCase() === nextValue.toLowerCase())

    if (duplicate) {
      clearDraft()
      return
    }

    const nextItems = [...items, { id: createStructuredEditorItemId(), text: nextValue, active: true }]
    commitStructuredStudyField(key, nextItems, setItems)
    clearDraft()
  }

  const handleSuggestObjectives = async () => {
    if (objectiveSuggestionMissing.length) {
      setApiError(`Add ${objectiveSuggestionMissing.join(", ")} before asking AI to suggest research objectives.`)
      return
    }

    setOpenAiAssistantModal("objectives")
    setLoadingAction("objectives")

    try {
      const result = await callOpenAI<{
        guidance: string
        options: ObjectiveSuggestionDraft[]
      }>({
        action: "suggest_objectives",
        study,
        requestNote: objectiveSuggestionRequest,
      })

      const [primaryOption, ...alternativeOptions] = result.options
      const nextDraft = primaryOption || emptyObjectiveSuggestionDraft
      setObjectiveSuggestionDraft(nextDraft)
      setObjectiveSuggestionAlternatives(alternativeOptions)
      setObjectiveSuggestionSelection(createObjectiveSuggestionSelection(nextDraft))
      setObjectiveSuggestionGuidance(result.guidance || "")
    } catch (error) {
      const fallback = buildObjectiveSuggestionOptionsFromStudy(study, objectiveSuggestionRequest)
      setObjectiveSuggestionDraft(fallback.primary)
      setObjectiveSuggestionAlternatives(fallback.alternatives)
      setObjectiveSuggestionSelection(createObjectiveSuggestionSelection(fallback.primary))
      setObjectiveSuggestionGuidance(fallback.guidance)
      setApiNotice(
        `OpenAI objective suggestion failed, so the app used a local draft instead. ${
          error instanceof Error ? error.message : "Unable to suggest study objectives."
        }`,
      )
    } finally {
      setLoadingAction(null)
    }
  }

  const handleSuggestEndpoints = async () => {
    if (endpointSuggestionMissing.length) {
      setApiError(`Add ${endpointSuggestionMissing.join(", ")} before asking AI to suggest endpoints.`)
      return
    }

    setOpenAiAssistantModal("endpoints")
    setLoadingAction("endpoints")

    try {
      const result = await callOpenAI<{
        guidance: string
        options: EndpointSuggestionDraft[]
      }>({
        action: "suggest_endpoints",
        study,
        requestNote: endpointSuggestionRequest,
      })

      const [primaryOption, ...alternativeOptions] = result.options
      const nextDraft = primaryOption || emptyEndpointSuggestionDraft
      setEndpointSuggestionDraft(nextDraft)
      setEndpointSuggestionAlternatives(alternativeOptions)
      setEndpointSuggestionSelection(createEndpointSuggestionSelection(nextDraft))
      setEndpointSuggestionGuidance(result.guidance || "")
    } catch (error) {
      const fallback = buildEndpointSuggestionOptionsFromStudy(study, endpointSuggestionRequest)
      setEndpointSuggestionDraft(fallback.primary)
      setEndpointSuggestionAlternatives(fallback.alternatives)
      setEndpointSuggestionSelection(createEndpointSuggestionSelection(fallback.primary))
      setEndpointSuggestionGuidance(fallback.guidance)
      setApiNotice(
        `OpenAI endpoint suggestion failed, so the app used a local draft instead. ${
          error instanceof Error ? error.message : "Unable to suggest endpoints."
        }`,
      )
    } finally {
      setLoadingAction(null)
    }
  }

  const handleSuggestPopulation = async (source: PopulationSuggestionSource) => {
    const missing = source === "population" ? populationDraftMissing : eligibilitySuggestionMissing

    if (missing.length) {
      setApiError(
        source === "population"
          ? `Add ${missing.join(", ")} before asking AI to draft a target population.`
          : `Complete ${missing.join(", ")} before asking AI to draft eligibility wording.`,
      )
      return
    }

    setPopulationSuggestionSource(source)
    setOpenAiAssistantModal("population")
    setLoadingAction("population")

    try {
      const result = await callOpenAI<PopulationSuggestionDraft>({
        action: "suggest_population",
        study,
      })

      setPopulationSuggestionDraft(result)
      setPopulationSuggestionSelection(createPopulationSuggestionSelection(result, source))
    } catch (error) {
      const fallback = buildPopulationSuggestionFromStudy(study)
      setPopulationSuggestionDraft(fallback)
      setPopulationSuggestionSelection(createPopulationSuggestionSelection(fallback, source))
      setApiNotice(
        `OpenAI ${source === "population" ? "population" : "eligibility"} suggestion failed, so the app used a local draft instead. ${
          error instanceof Error ? error.message : "Unable to suggest the patient population."
        }`,
      )
    } finally {
      setLoadingAction(null)
    }
  }

  const handleEstimateSampleSize = () => {
    setApiError("")
    const estimate = buildSampleSizeEstimate(study, stats)
    setSampleSizeEstimate(estimate)

    if (estimate.status === "needs_inputs") {
      setApiError(`Add ${estimate.missing.join(", ")} before calculating sample size.`)
      return
    }

    if (estimate.status === "error") {
      setApiError(estimate.summary || "Sample-size estimation failed with the current assumptions.")
      return
    }

    setApiNotice("")
  }

  const handleAssessImpact = async () => {
    if (impactAssessmentMissing.length) {
      setApiError(`Add ${impactAssessmentMissing.join(", ")} before asking AI to assess likely study impact.`)
      return
    }

    setLoadingAction("impact")

    try {
      const result = await callOpenAI<ImpactAssessment>({
        action: "assess_impact",
        study,
      })

      setImpactAssessment(normalizeImpactAssessment({ ...result, generatedAt: result.generatedAt || new Date().toISOString() }))
    } catch (error) {
      setImpactAssessment(buildImpactAssessmentFromStudy(study))
      setApiNotice(
        `OpenAI impact assessment failed, so the app used a local evidence-impact view instead. ${
          error instanceof Error ? error.message : "Unable to assess current study impact."
        }`,
      )
    } finally {
      setLoadingAction(null)
    }
  }

  const applyObjectiveSuggestion = () => {
    if (!hasObjectiveSuggestionDraft || selectedObjectiveSuggestionCount === 0) {
      return
    }

    setStudy((current) => ({
      ...current,
      primaryObjective:
        objectiveSuggestionSelection.primaryObjective && objectiveSuggestionDraft.primaryObjective
          ? objectiveSuggestionDraft.primaryObjective
          : current.primaryObjective,
      secondaryObjectives:
        objectiveSuggestionSelection.secondaryObjectives.length > 0
          ? uniqueItemsCaseInsensitive([
              ...splitStructuredEditorItems(current.secondaryObjectives || ""),
              ...objectiveSuggestionSelection.secondaryObjectives,
            ]).join("\n")
          : current.secondaryObjectives,
      designOverview:
        objectiveSuggestionSelection.designOverview && objectiveSuggestionDraft.designOverview
          ? objectiveSuggestionDraft.designOverview
          : current.designOverview,
    }))
    clearAiProposalDrafts()
    clearSampleSizeEstimate()
    clearImpactAssessment()
    setFinalSections([])
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      study: { ...current.study, status: "pending", reviewedAt: "" },
      pico: { ...current.pico, status: "pending", reviewedAt: "" },
      literature: { ...current.literature, status: "pending", reviewedAt: "" },
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const applyEndpointSuggestion = () => {
    const selectedSuggestedEndpoints = uniqueItemsCaseInsensitive([
      endpointSuggestionSelection.primaryEndpoint ? endpointSuggestionDraft.primaryEndpoint : "",
      ...endpointSuggestionSelection.secondaryEndpoints,
      ...endpointSuggestionSelection.exploratoryEndpoints,
    ])

    if (!selectedSuggestedEndpoints.length) {
      return
    }

    setStudy((current) => ({
      ...(() => {
        const currentOutcomeItems = splitStructuredEditorItems(current.outcomes || "")
        const mergedOutcomeItems = uniqueItemsCaseInsensitive([...currentOutcomeItems, ...selectedSuggestedEndpoints])
        const nextStructuredOutcomes = mergedOutcomeItems.join("\n")
        const derivedEndpointState = deriveEndpointStateFromOutcomeText(current, nextStructuredOutcomes)

        return {
          selectedEndpoints: derivedEndpointState.selectedEndpoints,
          customEndpoints: derivedEndpointState.customEndpoints,
          outcomes: nextStructuredOutcomes,
        }
      })(),
    }))
    clearAiProposalDrafts()
    clearSampleSizeEstimate()
    clearImpactAssessment()
    setFinalSections([])
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      study: { ...current.study, status: "pending", reviewedAt: "" },
      pico: { ...current.pico, status: "pending", reviewedAt: "" },
      literature: { ...current.literature, status: "pending", reviewedAt: "" },
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const applyPopulationSuggestion = () => {
    if (!hasPopulationSuggestionDraft || selectedPopulationSuggestionCount === 0) {
      return
    }

    setStudy((current) => ({
      ...current,
      population:
        populationSuggestionSelection.population && populationSuggestionDraft.population
          ? populationSuggestionDraft.population
          : current.population,
      eligibility:
        populationSuggestionSelection.eligibility && populationSuggestionDraft.eligibility
          ? populationSuggestionDraft.eligibility
          : current.eligibility,
    }))
    clearAiProposalDrafts()
    clearSampleSizeEstimate()
    clearImpactAssessment()
    setFinalSections([])
    setApiNotice("")
    setReviews((current) => ({
      ...current,
      study: { ...current.study, status: "pending", reviewedAt: "" },
      pico: { ...current.pico, status: "pending", reviewedAt: "" },
      literature: { ...current.literature, status: "pending", reviewedAt: "" },
      schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
    }))
  }

  const handleTabChange = (tab: (typeof TABS)[number]["id"]) => {
    if (tab === "pico" && !gates.pico) {
      setApiError(`Complete the Study Design tab first: ${studyMissing.join(", ")}.`)
      return
    }

    if (tab === "literature" && !gates.literature) {
      setApiError(
        studyMissing.length
          ? `Complete the Study Design tab first: ${studyMissing.join(", ")}.`
          : `Complete PICO & Stats first: ${picoMissing.join(", ")}.`,
      )
      return
    }

    if (tab === "schedule") {
      if (!showScheduleTab) {
        setApiError("The Schedule of Activities tab is available only for interventional studies.")
        return
      }

      if (!gates.schedule) {
        setApiError(
          studyMissing.length
            ? `Complete the Study Design tab first: ${studyMissing.join(", ")}.`
            : picoMissing.length
              ? `Complete PICO & Stats first: ${picoMissing.join(", ")}.`
              : `Complete Literature first: ${literatureMissing.join(", ")}.`,
        )
        return
      }
    }

    if ((tab === "sections" || tab === "final") && !gates.sections) {
      setApiError(
        studyMissing.length
          ? `Complete the Study Design tab first: ${studyMissing.join(", ")}.`
          : picoMissing.length
            ? `Complete PICO & Stats first: ${picoMissing.join(", ")}.`
            : literatureMissing.length
              ? `Complete Literature first: ${literatureMissing.join(", ")}.`
              : showScheduleTab
                ? `Complete Schedule of Activities first: ${scheduleMissing.join(", ")}.`
                : "Complete the prior tabs first before generating sections or the final synopsis.",
      )
      return
    }

    setApiError("")
    setApiNotice("")
    setActiveTab(tab)
  }

  const handleExtractPico = async () => {
    if (studyMissing.length) {
      setApiError(`Complete the Study Design tab first: ${studyMissing.join(", ")}.`)
      return
    }

    setLoadingAction("extract")

    try {
      const result = await callOpenAI<{ pico: PicoForm; stats: StatsForm }>({
        action: "extract_pico_stats",
        study,
      })

      setPico(result.pico)
      setStats(result.stats)
      clearSampleSizeEstimate()
      clearScheduleInsights()
      setReviews((current) => ({
        ...current,
        pico: { ...current.pico, status: "pending", reviewedAt: "" },
        literature: { ...current.literature, status: "pending", reviewedAt: "" },
        schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
      }))
      setActiveTab("pico")
    } catch (error) {
      const nextPico = buildPicoFromStudy(study)
      const nextStats = buildStatsFromStudy(study, nextPico)
      setPico(nextPico)
      setStats(nextStats)
      clearSampleSizeEstimate()
      clearScheduleInsights()
      setReviews((current) => ({
        ...current,
        pico: { ...current.pico, status: "pending", reviewedAt: "" },
        literature: { ...current.literature, status: "pending", reviewedAt: "" },
        schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
      }))
      setApiNotice(
        `OpenAI PICO/statistics extraction failed, so the app used a local draft instead. ${
          error instanceof Error ? error.message : "Unable to extract PICO and statistics."
        }`,
      )
      setActiveTab("pico")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleBuildLiterature = async () => {
    if (!gates.literature) {
      setApiError(
        studyMissing.length
          ? `Complete the Study Design tab first: ${studyMissing.join(", ")}.`
          : `Complete PICO & Stats first: ${picoMissing.join(", ")}.`,
      )
      return
    }

    if (picoMissing.length) {
      setApiError(`Complete PICO & Stats first: ${picoMissing.join(", ")}.`)
      return
    }

    setLoadingAction("literature")
    const fallbackPico = pico.population || pico.intervention || pico.outcomes ? pico : buildPicoFromStudy(study)

    try {
      if (!pico.population && !pico.intervention && !pico.outcomes) {
        setPico(fallbackPico)
        setStats(buildStatsFromStudy(study, fallbackPico))
      }

      const result = await callOpenAI<{ literature: LiteratureForm }>({
        action: "build_literature",
        study,
        pico: fallbackPico,
      })

      setLiterature(result.literature)
      clearScheduleInsights()
      setReviews((current) => ({
        ...current,
        literature: { ...current.literature, status: "pending", reviewedAt: "" },
        schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
      }))
      setActiveTab("literature")
    } catch (error) {
      setLiterature(buildLiteratureFromState(study, fallbackPico))
      clearScheduleInsights()
      setReviews((current) => ({
        ...current,
        literature: { ...current.literature, status: "pending", reviewedAt: "" },
        schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
      }))
      setApiNotice(
        `OpenAI literature planning failed, so the app used a local draft instead. ${
          error instanceof Error ? error.message : "Unable to generate the literature plan."
        }`,
      )
      setActiveTab("literature")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleGenerateSchedule = async () => {
    if (!showScheduleTab) {
      setApiError("The Schedule of Activities tab is only relevant for interventional studies.")
      return
    }

    if (!gates.schedule) {
      setApiError(
        studyMissing.length
          ? `Complete the Study Design tab first: ${studyMissing.join(", ")}.`
          : picoMissing.length
            ? `Complete PICO & Stats first: ${picoMissing.join(", ")}.`
            : `Complete Literature first: ${literatureMissing.join(", ")}.`,
      )
      return
    }

    const derivedPico = pico.population || pico.intervention || pico.outcomes ? pico : buildPicoFromStudy(study)
    const derivedStats = stats.endpointType ? stats : buildStatsFromStudy(study, derivedPico)
    const derivedLiterature = literature.pubmedQuery ? literature : buildLiteratureFromState(study, derivedPico)
    const compiledPrompt = buildSchedulePromptFromState(study, derivedPico, derivedStats, derivedLiterature, schedule)

    setLoadingAction("schedule")

    try {
      const result = await callOpenAI<{
        purpose: string
        prompt: string
        columns: ScheduleColumn[]
        rows: ScheduleRow[]
      }>({
        action: "generate_schedule",
        study,
        pico: derivedPico,
        stats: derivedStats,
        literature: derivedLiterature,
        schedulePrompt: compiledPrompt,
        iterationPrompt: schedule.iterationPrompt,
        schedule,
      })

      setPico(derivedPico)
      setStats(derivedStats)
      setLiterature(derivedLiterature)
      setSchedule(
        normalizeSchedule({
          ...result,
          prompt: schedule.prompt || DEFAULT_SCHEDULE_PROMPT,
          iterationPrompt: schedule.iterationPrompt,
          tableLayout: schedule.tableLayout,
          generatedAt: new Date().toISOString(),
          provenance: "ai_generated",
          manualEdited: false,
        }),
      )
      clearScheduleInsights()
      setReviews((current) => ({
        ...current,
        schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
      }))
      setActiveTab("schedule")
    } catch (error) {
      setPico(derivedPico)
      setStats(derivedStats)
      setLiterature(derivedLiterature)
      setSchedule(
        buildScheduleFromState(study, derivedPico, derivedStats, derivedLiterature, {
          prompt: schedule.prompt || DEFAULT_SCHEDULE_PROMPT,
          iterationPrompt: schedule.iterationPrompt,
          tableLayout: schedule.tableLayout,
        }),
      )
      clearScheduleInsights()
      setReviews((current) => ({
        ...current,
        schedule: { ...current.schedule, status: "pending", reviewedAt: "" },
      }))
      setApiNotice(
        `OpenAI schedule generation failed, so the app used a local schedule draft instead. ${
          error instanceof Error ? error.message : "Unable to generate the schedule of activities."
        }`,
      )
      setActiveTab("schedule")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleAnalyzeScheduleInsights = async (focus: "complexity" | "tradeoff") => {
    if (!showScheduleTab) {
      setApiError("Schedule analysis is available only for interventional studies.")
      return
    }

    if (!scheduleReady) {
      setApiError(`Complete Schedule of Activities first: ${scheduleMissing.join(", ")}.`)
      return
    }

    const derivedPico = pico.population || pico.intervention || pico.outcomes ? pico : buildPicoFromStudy(study)
    const derivedStats = stats.endpointType ? stats : buildStatsFromStudy(study, derivedPico)
    const focusText =
      focus === "complexity"
        ? "Prioritize clinical trial complexity scoring, key complexity drivers, and practical mitigation focus."
        : "Prioritize visit and assessment trade-off analysis, highlighting what can be reduced with the lowest data-quality risk."

    setLoadingAction("schedule_analysis")

    try {
      const result = await callOpenAI<Pick<ScheduleInsights, "complexity" | "tradeoff">>({
        action: "analyze_schedule",
        study,
        pico: derivedPico,
        stats: derivedStats,
        schedule,
        focus: focusText,
      })

      setPico(derivedPico)
      setStats(derivedStats)
      setScheduleInsights(
        normalizeScheduleInsights({
          focus: focusText,
          generatedAt: new Date().toISOString(),
          provenance: "ai_generated",
          complexity: result.complexity,
          tradeoff: result.tradeoff,
        }),
      )
    } catch (error) {
      setPico(derivedPico)
      setStats(derivedStats)
      setScheduleInsights(buildScheduleInsightsFromState(study, derivedPico, derivedStats, schedule, focusText))
      setApiNotice(
        `OpenAI SoA analysis failed, so the app used a local complexity and trade-off assessment instead. ${
          error instanceof Error ? error.message : "Unable to analyze the schedule of activities."
        }`,
      )
    } finally {
      setLoadingAction(null)
    }
  }

  const handleRefreshSections = async () => {
    if (!gates.sections) {
      setApiError(
        studyMissing.length
          ? `Complete the Study Design tab first: ${studyMissing.join(", ")}.`
          : picoMissing.length
            ? `Complete PICO & Stats first: ${picoMissing.join(", ")}.`
            : literatureMissing.length
              ? `Complete Literature first: ${literatureMissing.join(", ")}.`
              : showScheduleTab
                ? `Complete Schedule of Activities first: ${scheduleMissing.join(", ")}.`
                : "Complete the prior tabs first before drafting sections.",
      )
      return
    }

    if (literatureMissing.length) {
      setApiError(`Complete Literature first: ${literatureMissing.join(", ")}.`)
      return
    }

    if (showScheduleTab && scheduleMissing.length) {
      setApiError(`Complete Schedule of Activities first: ${scheduleMissing.join(", ")}.`)
      return
    }

    const derivedPico = pico.population || pico.intervention || pico.outcomes ? pico : buildPicoFromStudy(study)
    const derivedStats = stats.endpointType ? stats : buildStatsFromStudy(study, derivedPico)
    const derivedLiterature = literature.pubmedQuery ? literature : buildLiteratureFromState(study, derivedPico)
    const derivedSchedule =
      showScheduleTab && schedule.columns.length && schedule.rows.length
        ? schedule
        : showScheduleTab
          ? buildScheduleFromState(study, derivedPico, derivedStats, derivedLiterature, schedule)
          : undefined

    setLoadingAction("sections")

    try {
      const result = await callOpenAI<{ sections: Array<{ id: string; title: string; body: string }> }>({
        action: "draft_sections",
        study,
        pico: derivedPico,
        stats: derivedStats,
        literature: derivedLiterature,
        schedule: derivedSchedule,
        sections,
      })

      const draftedBodyMap = new Map(result.sections.map((section) => [section.id, section]))

      setPico(derivedPico)
      setStats(derivedStats)
      setLiterature(derivedLiterature)
      if (derivedSchedule) setSchedule(derivedSchedule)
      setSections((current) =>
        current.map((section) => {
          const drafted = draftedBodyMap.get(section.id)

          return drafted
            ? {
                ...section,
                title: drafted.title || section.title,
                body: drafted.body,
                provenance: "ai_generated",
                manualEdited: false,
                lastGeneratedAt: new Date().toISOString(),
                sourceTabs: getSectionSourceTabs(drafted.title || section.title),
                assumptionFlags: deriveSectionAssumptions(
                  { ...section, title: drafted.title || section.title },
                  study,
                  derivedPico,
                  derivedStats,
                  derivedLiterature,
                ),
              }
            : section
        }),
      )
      setActiveTab("sections")
    } catch (error) {
      setPico(derivedPico)
      setStats(derivedStats)
      setLiterature(derivedLiterature)
      if (derivedSchedule) setSchedule(derivedSchedule)
      setSections((current) =>
        current.map((section) => ({
          ...section,
          body: generateSectionBody(section, study, derivedPico, derivedStats, derivedLiterature, derivedSchedule),
          provenance: "ai_generated",
          manualEdited: false,
          lastGeneratedAt: new Date().toISOString(),
          sourceTabs: getSectionSourceTabs(section.title),
          assumptionFlags: deriveSectionAssumptions(section, study, derivedPico, derivedStats, derivedLiterature),
        })),
      )
      setApiNotice(
        `OpenAI section drafting failed, so the app used local section drafts instead. ${
          error instanceof Error ? error.message : "Unable to draft the synopsis sections."
        }`,
      )
      setActiveTab("sections")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleGenerateSynopsis = async () => {
    if (!gates.final) {
      setApiError(
        studyMissing.length
          ? `Complete the Study Design tab first: ${studyMissing.join(", ")}.`
          : picoMissing.length
            ? `Complete PICO & Stats first: ${picoMissing.join(", ")}.`
            : literatureMissing.length
              ? `Complete Literature first: ${literatureMissing.join(", ")}.`
              : showScheduleTab
                ? `Complete Schedule of Activities first: ${scheduleMissing.join(", ")}.`
                : "Complete the prior tabs first before generating the final synopsis.",
      )
      return
    }

    if (literatureMissing.length) {
      setApiError(`Complete Literature first: ${literatureMissing.join(", ")}.`)
      return
    }

    if (showScheduleTab && scheduleMissing.length) {
      setApiError(`Complete Schedule of Activities first: ${scheduleMissing.join(", ")}.`)
      return
    }

    const derivedPico = pico.population || pico.intervention || pico.outcomes ? pico : buildPicoFromStudy(study)
    const derivedStats = stats.endpointType ? stats : buildStatsFromStudy(study, derivedPico)
    const derivedLiterature = literature.pubmedQuery ? literature : buildLiteratureFromState(study, derivedPico)
    const derivedSchedule =
      showScheduleTab && schedule.columns.length && schedule.rows.length
        ? schedule
        : showScheduleTab
          ? buildScheduleFromState(study, derivedPico, derivedStats, derivedLiterature, schedule)
          : undefined

    setLoadingAction("final")

    try {
      const result = await callOpenAI<{ sections: FinalSection[] }>({
        action: "generate_synopsis",
        study,
        pico: derivedPico,
        stats: derivedStats,
        literature: derivedLiterature,
        schedule: derivedSchedule,
        sections,
      })

      const finalBodyMap = new Map(result.sections.map((section) => [section.id, section]))

      setPico(derivedPico)
      setStats(derivedStats)
      setLiterature(derivedLiterature)
      if (derivedSchedule) setSchedule(derivedSchedule)
      setSections((current) =>
        current.map((section) => {
          const drafted = finalBodyMap.get(section.id)

          return drafted
            ? {
                ...section,
                title: drafted.title || section.title,
                body: drafted.body,
                provenance: "ai_generated",
                manualEdited: false,
                lastGeneratedAt: new Date().toISOString(),
                sourceTabs: getSectionSourceTabs(drafted.title || section.title),
                assumptionFlags: deriveSectionAssumptions(
                  { ...section, title: drafted.title || section.title },
                  study,
                  derivedPico,
                  derivedStats,
                  derivedLiterature,
                ),
              }
            : section
        }),
      )
      setFinalSections(result.sections)
      setActiveTab("final")
    } catch (error) {
      const renderedSections = sections
        .filter((section) => section.included)
        .map((section) => ({
          id: section.id,
          title: section.title,
          body: section.body || generateSectionBody(section, study, derivedPico, derivedStats, derivedLiterature, derivedSchedule),
        }))

      setPico(derivedPico)
      setStats(derivedStats)
      setLiterature(derivedLiterature)
      if (derivedSchedule) setSchedule(derivedSchedule)
      setSections((current) =>
        current.map((section) => ({
          ...section,
          body: section.body || generateSectionBody(section, study, derivedPico, derivedStats, derivedLiterature, derivedSchedule),
          provenance: section.body ? section.provenance : "ai_generated",
          lastGeneratedAt: section.lastGeneratedAt || new Date().toISOString(),
          sourceTabs: getSectionSourceTabs(section.title),
          assumptionFlags: deriveSectionAssumptions(section, study, derivedPico, derivedStats, derivedLiterature),
        })),
      )
      setFinalSections(renderedSections)
      setApiNotice(
        `OpenAI final synopsis generation failed, so the app used local section drafts instead. ${
          error instanceof Error ? error.message : "Unable to generate the final synopsis."
        }`,
      )
      setActiveTab("final")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleAddSection = () => {
    setSections((current) => [
      ...current,
      makeSection("Custom Section", "Describe the purpose of this added synopsis section and how it should be drafted."),
    ])
  }

  const handleExportWord = () => {
    const content = finalSections.length
      ? finalSections
      : includedSections.map((section) => ({
          id: section.id,
          title: section.title,
          body: section.body,
        }))

    if (!content.length) {
      return
    }

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(study.studyTitle || "Study Synopsis")}</title>
    <style>
      body { font-family: Georgia, serif; color: #2c2e33; margin: 36px; line-height: 1.55; }
      h1 { color: #1864ab; margin-bottom: 10px; }
      h2 { color: #2c2e33; margin-top: 28px; margin-bottom: 10px; }
      p { margin: 0 0 12px 0; }
      .meta { color: #475569; margin-bottom: 18px; }
      .soa-block { margin-top: 28px; }
      .soa-purpose { margin-bottom: 12px; }
      .soa-table-block { margin-top: 14px; }
      .soa-table-kicker { margin: 0 0 4px 0; color: #64748b; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; }
      .soa-table-title { margin: 0 0 4px 0; color: #0f172a; font-weight: 700; }
      .soa-table-description { margin: 0 0 10px 0; color: #475569; font-size: 11px; }
      .soa-table { width: 100%; border-collapse: collapse; font-size: 11px; }
      .soa-table th, .soa-table td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
      .soa-table thead th { background: #f8fafc; color: #0f172a; font-weight: 700; }
      .soa-group td { background: #e7f5ff; color: #1864ab; font-weight: bold; }
      .soa-footnote { color: #64748b; font-size: 10px; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(study.studyTitle || "Study Synopsis")}</h1>
    <div class="meta">
      <p><strong>Sponsor:</strong> ${escapeHtml(study.sponsor || "Not provided")}</p>
      <p><strong>Study type:</strong> ${escapeHtml(`${study.category || "Not selected"} / ${study.subcategory || "Not selected"}`)}</p>
      <p><strong>Indication:</strong> ${escapeHtml(study.indication || "Not provided")}</p>
    </div>
    ${content.map((section) => `<h2>${escapeHtml(section.title)}</h2>${bodyToHtml(section.body)}`).join("")}
    ${
      showScheduleTab && schedule.columns.length && schedule.rows.length
        ? `<h2>Schedule of Activities</h2>${scheduleToHtml(schedule)}`
        : ""
    }
  </body>
</html>`

    const blob = new Blob(["\ufeff", html], { type: "application/msword" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${slugify(study.studyTitle || "study-synopsis")}.doc`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const diseaseOptions = study.therapeuticArea
    ? Object.keys(
        (THERAPEUTIC_LIBRARY[study.therapeuticArea as keyof typeof THERAPEUTIC_LIBRARY]?.diseases ??
          {}) as Record<string, readonly string[]>,
      )
    : []

  const suggestedEndpoints =
    study.therapeuticArea && study.disease
      ? (
          THERAPEUTIC_LIBRARY[study.therapeuticArea as keyof typeof THERAPEUTIC_LIBRARY]?.diseases as Record<
            string,
            readonly string[]
          >
        )?.[study.disease] ?? []
      : []

  const primaryStudyAimSelection = inferPrimaryStudyAim(study)
  const diseaseSelection = isCustomDisease ? "__custom__" : study.disease
  const studyCategoryLabel =
    STUDY_CATEGORIES[study.category as keyof typeof STUDY_CATEGORIES]?.label || study.category || "Study"

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(231,245,255,0.96),_rgba(248,249,250,0.94)_40%,_rgba(255,255,255,0.98)_78%)] px-4 py-6 text-[#2C2E33] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[24px] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.05)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-[Iowan_Old_Style,Palatino_Linotype,Book_Antiqua,serif] text-3xl text-slate-950">
                Study Synopsis Workspace
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {currentProjectName}
                {study.studyTitle && currentProjectName !== study.studyTitle ? ` · ${study.studyTitle}` : ""}
                {study.indication ? ` · ${study.indication}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700">
                {studyCategoryLabel}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700">
                {study.subcategory || "Subtype pending"}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700">
                Saved {savedAt ? formatTimestamp(savedAt) : "not yet"}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-[260px] flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Project</p>
                {isEditingProjectName ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      value={projectNameDraft}
                      onChange={(event) => setProjectNameDraft(event.target.value)}
                      placeholder="New synopsis"
                      className="min-w-[240px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#74C0FC] focus:ring-2 focus:ring-[#A5D8FF]"
                    />
                    <button
                      onClick={handleSaveProjectName}
                      className="rounded-full bg-[#1864AB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#155799]"
                    >
                      Save name
                    </button>
                    <button
                      onClick={() => {
                        setProjectNameDraft(currentProjectName)
                        setIsEditingProjectName(false)
                      }}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <select
                      value={currentProjectId}
                      onChange={(event) => handleProjectSwitch(event.target.value)}
                      className="min-w-[280px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#74C0FC] focus:ring-2 focus:ring-[#A5D8FF]"
                    >
                      {projectMetas.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleCreateProject}
                      className="inline-flex items-center gap-2 rounded-full bg-[#1864AB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#155799]"
                    >
                      <Plus className="h-4 w-4" />
                      New synopsis
                    </button>
                    <button
                      onClick={() => {
                        setProjectNameDraft(currentProjectName)
                        setIsEditingProjectName(true)
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#74C0FC] hover:bg-[#E7F5FF]"
                    >
                      <Pencil className="h-4 w-4" />
                      Rename
                    </button>
                    <button
                      onClick={handleDeleteCurrentProject}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-[18px] border border-white/70 bg-white px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{projectMetas.length} saved project{projectMetas.length === 1 ? "" : "s"}</p>
                <p className="mt-1">Create separate synopsis workspaces instead of overwriting one saved draft.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/60 bg-white/70 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex flex-wrap gap-2">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              const locked =
                (tab.id === "pico" && !gates.pico) ||
                (tab.id === "literature" && !gates.literature) ||
                (tab.id === "schedule" && !gates.schedule) ||
                ((tab.id === "sections" || tab.id === "final") && !gates.sections)

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "border border-[#A5D8FF] bg-[#E7F5FF] text-[#1864AB] shadow-[0_10px_24px_rgba(24,100,171,0.12)]"
                      : locked
                        ? "bg-[#F1F3F5] text-[#ADB5BD]"
                        : "bg-white/80 text-[#495057] hover:bg-[#E7F5FF] hover:text-[#1864AB]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </section>

        {(apiError || apiNotice || loadingAction) && (
          <div
            className={`px-1 text-xs ${
              apiError ? "text-rose-700" : apiNotice ? "text-amber-700" : "text-slate-500"
            }`}
          >
            {apiError
              ? `Action needed: ${apiError}`
              : apiNotice
                ? apiNotice
                : `Generating ${loadingAction}...`}
          </div>
        )}

        {activeTab === "study" && (
          <section className="space-y-6">
            <div className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Tab {tabIndexById.study}</p>
                  <h2 className="mt-2 font-[Iowan_Old_Style,Palatino_Linotype,Book_Antiqua,serif] text-3xl text-slate-950">
                    Define the study design
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    Capture the core study design inputs the downstream tabs depend on: objectives, disease context,
                    population, intervention or exposure, comparator, endpoints, timing, and operational constraints.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <TabHelpButton
                    tabId="study"
                    open={openHelpTab === "study"}
                    onToggle={(tabId) => setOpenHelpTab((current) => (current === tabId ? null : tabId))}
                  />
                  {studyReady && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" />
                      Ready for extraction
                    </div>
                  )}
                </div>
              </div>

              {openHelpTab === "study" && (
                <div className="mb-6">
                  <TabHelpPanel tabId="study" />
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Field
                  label="Study title"
                  value={study.studyTitle}
                  onChange={(value) => updateStudy("studyTitle", value)}
                  placeholder="Phase III Synopsis for XYZ in metastatic NSCLC"
                />

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Research category</span>
                  <select
                    value={study.category}
                    onChange={(event) => handleCategoryChange(event.target.value)}
                    className="w-full rounded-2xl border border-white/60 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                  >
                    {Object.entries(STUDY_CATEGORIES).map(([value, option]) => (
                      <option key={value} value={value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Study subtype</span>
                  <select
                    value={study.subcategory}
                    onChange={(event) => handleSubcategoryChange(event.target.value)}
                    className="w-full rounded-2xl border border-white/60 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                  >
                    {currentSubcategories.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Development stage</span>
                  <select
                    value={study.developmentStage}
                    onChange={(event) => updateStudy("developmentStage", event.target.value)}
                    className="w-full rounded-2xl border border-white/60 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1864AB] focus:ring-2 focus:ring-sky-200"
                  >
                    <option value="">Select development stage</option>
                    {DEVELOPMENT_STAGES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {studyTypeReviewNotice && (
                <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                      <div>
                        <p className="text-sm font-semibold text-amber-950">{studyTypeReviewNotice.title}</p>
                        <p className="mt-1 text-sm leading-6 text-amber-950">{studyTypeReviewNotice.message}</p>
                        <p className="mt-2 text-xs font-medium text-amber-900">
                          Review focus: {joinHumanList(studyTypeReviewNotice.fields)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setStudyTypeReviewNotice(null)}
                      className="rounded-full border border-amber-300 bg-white p-2 text-amber-900 transition hover:bg-amber-100"
                      aria-label="Dismiss study type review notice"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 rounded-[24px] border border-sky-200 bg-sky-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-900">Study description import</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">Upload PDF, Word, or PowerPoint and prefill Tab 1</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-700">
                      AI can extract key study details from an existing description deck or document, prepopulate fields, and show what still needs manual input. If the uploaded source clearly conflicts with core study-definition fields already selected in Tab 1, the source now replaces those values and the import report calls it out.
                    </p>
                  </div>

                  <button
                    onClick={handleImportStudyDocument}
                    disabled={loadingAction !== null || !studyDocumentFile}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1864AB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#155799] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Upload className="h-4 w-4" />
                    {loadingAction === "import" ? "Importing..." : "Extract and prefill"}
                  </button>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Source file</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      onChange={(event) => setStudyDocumentFile(event.target.files?.[0] || null)}
                      className="block w-full rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm file:mr-4 file:rounded-full file:border-0 file:bg-sky-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#1864AB]"
                    />
                    <p className="text-xs leading-6 text-slate-500">Supported: `.pdf`, `.docx`, `.pptx`. Keep files below 12 MB.</p>
                  </label>

                  <div className="rounded-[20px] border border-white/70 bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Current selection</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{studyDocumentFile?.name || "No file selected"}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Best for: study synopsis drafts, protocol summary decks, clinical study concept notes, or executive-stage study descriptions.
                    </p>
                  </div>
                </div>

                {studyDocumentImportReport.importedAt ? (
                  <div className="mt-5 rounded-[20px] border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Last import</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {studyDocumentImportReport.sourceName} · {formatTimestamp(studyDocumentImportReport.importedAt)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{studyDocumentImportReport.summary}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Prefilled fields</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {studyDocumentImportReport.appliedFields.length ? (
                            studyDocumentImportReport.appliedFields.map((item) => (
                              <span key={item} className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                                {item}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">No new fields were prefilled.</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Updated from source</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {studyDocumentImportReport.replacedFields.length ? (
                            studyDocumentImportReport.replacedFields.map((item) => (
                              <span key={item} className="rounded-full bg-sky-100 px-3 py-2 text-xs font-semibold text-[#1864AB]">
                                {item}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">No conflicting fields needed to be replaced.</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Still needs user input</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {studyDocumentImportReport.remainingFields.length ? (
                            studyDocumentImportReport.remainingFields.map((item) => (
                              <span key={item} className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                                {item}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">No major required gaps remain from the current Tab 1 fields.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {(studyDocumentImportReport.conflictNotes.length > 0 ||
                      studyDocumentImportReport.unresolved.length > 0 ||
                      studyDocumentImportReport.assumptions.length > 0) && (
                      <div className="mt-4 grid gap-4 lg:grid-cols-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Resolved conflicts</p>
                          <div className="mt-2 space-y-2">
                            {studyDocumentImportReport.conflictNotes.length ? (
                              studyDocumentImportReport.conflictNotes.map((item) => (
                                <p key={item} className="text-sm leading-6 text-slate-700">
                                  {item}
                                </p>
                              ))
                            ) : (
                              <p className="text-sm text-slate-500">No conflicting values needed source-driven correction.</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Unresolved from source</p>
                          <div className="mt-2 space-y-2">
                            {studyDocumentImportReport.unresolved.length ? (
                              studyDocumentImportReport.unresolved.map((item) => (
                                <p key={item} className="text-sm leading-6 text-slate-700">
                                  {item}
                                </p>
                              ))
                            ) : (
                              <p className="text-sm text-slate-500">No major unresolved points were flagged.</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">AI assumptions</p>
                          <div className="mt-2 space-y-2">
                            {studyDocumentImportReport.assumptions.length ? (
                              studyDocumentImportReport.assumptions.map((item) => (
                                <p key={item} className="text-sm leading-6 text-slate-700">
                                  {item}
                                </p>
                              ))
                            ) : (
                              <p className="text-sm text-slate-500">No material assumptions were called out.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 rounded-[26px] border border-amber-200 bg-amber-50 p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">Strategic framing</p>
                    <h3 className="mt-2 text-xl font-semibold text-amber-950">Primary study aim, therapeutic area, disease, and endpoints</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-amber-950">
                      Start with one high-level answer to what this study is mainly trying to achieve, then narrow to therapeutic area and disease. The disease drives a suggested endpoint list, but users can still add custom disease labels and custom endpoints.
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">What is this study mainly trying to achieve?</span>
                    <select
                      value={primaryStudyAimSelection}
                      onChange={(event) => handlePrimaryStudyAimChange(event.target.value)}
                      className="w-full rounded-2xl border border-white/60 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                    >
                      <option value="">Select primary study aim</option>
                      {PRIMARY_STUDY_AIMS.map((option) => (
                        <option key={option.label} value={option.label}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {(getStrategicObjectiveLabel(study) || getPrimaryEvidenceUseIntent(study)) && (
                  <div className="mt-5 rounded-[24px] border border-slate-200 bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">How the app interprets this choice</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {getStrategicObjectiveLabel(study) ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                          Program goal: {getStrategicObjectiveLabel(study)}
                        </span>
                      ) : null}
                      {getPrimaryEvidenceUseIntent(study) ? (
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-900">
                          Intended evidence use: {getPrimaryEvidenceUseIntent(study)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}

                <details className="mt-5 rounded-[24px] border border-slate-200 bg-white/70 p-5">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-900">Optional refinements</summary>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    Use this only if the study has meaningful secondary goals or additional evidence destinations beyond the primary aim.
                  </p>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-700">Secondary program goals</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {STRATEGIC_OBJECTIVES.filter((option) => option !== getStrategicObjectiveLabel(study)).map((option) => (
                        <label
                          key={option}
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${
                            selectedStrategicObjectives.includes(option)
                              ? "border-amber-300 bg-white text-amber-950"
                              : "border-amber-200 bg-amber-100/70 text-amber-900"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedStrategicObjectives.includes(option)}
                            onChange={() => toggleStudyArrayField("secondaryStrategicObjectives", option)}
                            className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-medium text-slate-700">Secondary evidence uses</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {EVIDENCE_USE_INTENTS.filter((option) => option !== getPrimaryEvidenceUseIntent(study)).map((option) => (
                        <label
                          key={option}
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${
                            selectedEvidenceUseIntents.includes(option)
                              ? "border-sky-300 bg-white text-[#12436B]"
                              : "border-sky-200 bg-sky-100/60 text-[#12436B]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedEvidenceUseIntents.includes(option)}
                            onChange={() => toggleStudyArrayField("secondaryEvidenceUseIntents", option)}
                            className="h-4 w-4 rounded border-sky-300 text-[#1864AB] focus:ring-sky-500"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                </details>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Therapeutic area</span>
                    <select
                      value={study.therapeuticArea}
                      onChange={(event) => handleTherapeuticAreaChange(event.target.value)}
                      className="w-full rounded-2xl border border-white/60 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                    >
                      <option value="">Select therapeutic area</option>
                      {Object.keys(THERAPEUTIC_LIBRARY).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Controlled disease selector</span>
                    {isCustomDisease ? (
                      <div className="space-y-2">
                        <input
                          value={study.customDisease}
                          onChange={(event) => updateStudy("customDisease", event.target.value)}
                          placeholder="Type a custom disease or indication bucket"
                          className="w-full rounded-2xl border border-white/60 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                        />
                        <button
                          onClick={() => {
                            setIsCustomDisease(false)
                            updateStudy("customDisease", "")
                          }}
                          className="text-xs font-semibold text-amber-900 underline underline-offset-4"
                        >
                          Back to guided disease list
                        </button>
                      </div>
                    ) : (
                      <>
                        <select
                          value={diseaseSelection}
                          onChange={(event) => handleDiseaseSelection(event.target.value)}
                          disabled={!study.therapeuticArea}
                          className="w-full rounded-2xl border border-white/60 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                          <option value="">Select disease</option>
                          {diseaseOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                          <option value="__custom__">Custom...</option>
                        </select>
                        <p className="text-xs leading-6 text-slate-500">This guided list helps tailor downstream AI suggestions and synopsis wording.</p>
                      </>
                    )}
                  </label>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <Field
                    label="Intervention / drug"
                    value={study.topIntervention}
                    onChange={(value) => updateStudy("topIntervention", value)}
                    placeholder="Drug X, combination Y, device Z, exposure of interest"
                  />
                  <Field
                    label="Intervention class"
                    value={study.topInterventionClass}
                    onChange={(value) => updateStudy("topInterventionClass", value)}
                    placeholder="PD-1 inhibitor, gene therapy, retrospective exposure cohort"
                  />
                  <Field
                    label="Comparator"
                    value={study.topComparator}
                    onChange={(value) => updateStudy("topComparator", value)}
                    placeholder="Standard of care, placebo, historical control, active comparator"
                  />
                  <Field
                    label="Line of therapy / setting"
                    value={study.topLineOfTherapy}
                    onChange={(value) => updateStudy("topLineOfTherapy", value)}
                    placeholder="First-line, post-platinum, maintenance, adjuvant"
                  />
                </div>

              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Research objective</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">What the study will actually test</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                    This is where the program and evidence intent turn into the actual scientific question, design framing, and endpoint-facing study narrative. Use the AI actions directly on the fields that need help rather than working through a separate proposal block.
                  </p>
                </div>

                <div className="grid gap-5">
                  <Field
                    label="Indication details for this study"
                    value={study.indication}
                    onChange={(value) => updateStudy("indication", value)}
                    placeholder="Adults with metastatic non-small cell lung cancer after platinum failure, EGFR wild-type, post-platinum progression"
                  />
                  <TextAreaField
                    label="Primary study objective"
                    value={study.primaryObjective}
                    onChange={(value) => updateStudy("primaryObjective", value)}
                    placeholder="Evaluate whether XYZ improves progression-free survival versus standard of care."
                    rows={4}
                    description={
                      objectiveSuggestionReady
                        ? "AI can draft the primary objective, secondary objectives, and design overview from the current study framing."
                        : `To enable AI here, add: ${objectiveSuggestionMissing.join(", ")}.`
                    }
                    actions={
                      <button
                        onClick={handleSuggestObjectives}
                        disabled={loadingAction !== null || !objectiveSuggestionReady}
                        title={!objectiveSuggestionReady ? `Add ${objectiveSuggestionMissing.join(", ")}` : undefined}
                        className="inline-flex items-center gap-2 rounded-full bg-[#1864AB] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#155799] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-700 disabled:opacity-100"
                      >
                        <Sparkles className="h-4 w-4" />
                        {objectiveSuggestionButtonLabel}
                      </button>
                    }
                  />
                  <TextAreaField
                    label="Secondary objectives"
                    value={study.secondaryObjectives}
                    onChange={(value) => updateStudy("secondaryObjectives", value)}
                    placeholder="Characterize overall survival, objective response rate, safety, and patient-reported outcomes."
                    collapsibleInput
                    collapsibleInputLabel="Edit objectives as text"
                    description={
                      objectiveSuggestionReady
                        ? "Uses the same AI draft as the primary objective field and can propose secondary objectives alongside it."
                        : `To enable AI here, add: ${objectiveSuggestionMissing.join(", ")}.`
                    }
                    actions={
                      <button
                        onClick={handleSuggestObjectives}
                        disabled={loadingAction !== null || !objectiveSuggestionReady}
                        title={!objectiveSuggestionReady ? `Add ${objectiveSuggestionMissing.join(", ")}` : undefined}
                        className="inline-flex items-center gap-2 rounded-full bg-[#1864AB] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#155799] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-700 disabled:opacity-100"
                      >
                        <Sparkles className="h-4 w-4" />
                        {objectiveSuggestionButtonLabel}
                      </button>
                    }
                    footer={
                      <StructuredItemEditor
                        title="Structured secondary objectives"
                        description="Break secondary objectives into distinct items so you can remove, edit, or de-prioritize them without rewriting the full block."
                        items={secondaryObjectiveItems}
                        emptyText="Add secondary objective wording above, or add a structured item here to build the supporting objective set."
                        draftValue={secondaryObjectiveItemDraft}
                        onDraftChange={setSecondaryObjectiveItemDraft}
                        onAdd={() =>
                          addStructuredStudyFieldItem(
                            "secondaryObjectives",
                            secondaryObjectiveItems,
                            secondaryObjectiveItemDraft,
                            setSecondaryObjectiveItems,
                            () => setSecondaryObjectiveItemDraft(""),
                          )
                        }
                        onToggle={(id) =>
                          toggleStructuredStudyFieldItem("secondaryObjectives", secondaryObjectiveItems, id, setSecondaryObjectiveItems)
                        }
                        onItemChange={(id, value) =>
                          updateStructuredStudyFieldItemText(
                            "secondaryObjectives",
                            secondaryObjectiveItems,
                            id,
                            value,
                            setSecondaryObjectiveItems,
                          )
                        }
                        onDelete={(id) =>
                          deleteStructuredStudyFieldItem("secondaryObjectives", secondaryObjectiveItems, id, setSecondaryObjectiveItems)
                        }
                        addPlaceholder="Add another secondary objective"
                      />
                    }
                  />
                  <TextAreaField
                    label="Study design overview"
                    value={study.designOverview}
                    onChange={(value) => updateStudy("designOverview", value)}
                    placeholder="Multicenter, randomized, open-label phase III trial with 1:1 allocation and stratified randomization."
                  />
                </div>

              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <TextAreaField
                  label="Population"
                  value={study.population}
                  onChange={(value) => updateStudy("population", value)}
                  placeholder="Adults aged 18+ with histologically confirmed metastatic NSCLC, ECOG 0-1."
                  description={
                    populationDraftReady
                      ? "Use AI to draft a first-pass target population from the study objective, disease, intervention, and study type."
                      : `To enable AI here, add: ${populationDraftMissing.join(", ")}.`
                  }
                  actions={
                    <button
                      onClick={() => handleSuggestPopulation("population")}
                      disabled={loadingAction !== null || !populationDraftReady}
                      title={!populationDraftReady ? `Add ${populationDraftMissing.join(", ")}` : undefined}
                      className="inline-flex items-center gap-2 rounded-full bg-[#1864AB] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#155799] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-700 disabled:opacity-100"
                    >
                      <Sparkles className="h-4 w-4" />
                      {populationDraftButtonLabel}
                    </button>
                  }
                />
                <TextAreaField
                  label="Eligibility highlights"
                  value={study.eligibility}
                  onChange={(value) => updateStudy("eligibility", value)}
                  placeholder="Key inclusion and exclusion criteria, biomarker requirements, washout rules."
                  collapsibleInput
                  collapsibleInputLabel="Edit eligibility as text"
                  description={
                    eligibilitySuggestionReady
                      ? "Use AI to draft eligibility highlights from the completed Population field and the rest of the study context."
                      : "To enable AI here, complete the Population field first."
                  }
                  actions={
                    <button
                      onClick={() => handleSuggestPopulation("eligibility")}
                      disabled={loadingAction !== null || !eligibilitySuggestionReady}
                      title={!eligibilitySuggestionReady ? `Add ${eligibilitySuggestionMissing.join(", ")}` : undefined}
                      className="inline-flex items-center gap-2 rounded-full bg-[#1864AB] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#155799] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-700 disabled:opacity-100"
                    >
                      <Sparkles className="h-4 w-4" />
                      {eligibilitySuggestionButtonLabel}
                    </button>
                  }
                  footer={
                    <StructuredItemEditor
                      title="Structured eligibility items"
                      description="Treat key inclusion and exclusion criteria as distinct items so they can be reviewed and trimmed without rewriting the full field."
                      items={eligibilityEditorItems}
                      emptyText="Complete eligibility wording above, or add a structured item here to start building the eligibility set."
                      draftValue={eligibilityItemDraft}
                      onDraftChange={setEligibilityItemDraft}
                      onAdd={() =>
                        addStructuredStudyFieldItem(
                          "eligibility",
                          eligibilityEditorItems,
                          eligibilityItemDraft,
                          setEligibilityEditorItems,
                          () => setEligibilityItemDraft(""),
                        )
                      }
                      onToggle={(id) =>
                        toggleStructuredStudyFieldItem("eligibility", eligibilityEditorItems, id, setEligibilityEditorItems)
                      }
                      onItemChange={(id, value) =>
                        updateStructuredStudyFieldItemText(
                          "eligibility",
                          eligibilityEditorItems,
                          id,
                          value,
                          setEligibilityEditorItems,
                        )
                      }
                      onDelete={(id) =>
                        deleteStructuredStudyFieldItem("eligibility", eligibilityEditorItems, id, setEligibilityEditorItems)
                      }
                      addPlaceholder="Add another eligibility highlight"
                    />
                  }
                />
                <TextAreaField
                  label="Intervention or exposure"
                  value={study.intervention || study.topIntervention}
                  onChange={(value) => updateStudy("intervention", value)}
                  placeholder="XYZ 200 mg IV every 3 weeks until progression or unacceptable toxicity."
                />
                <TextAreaField
                  label="Comparator"
                  value={study.comparator || study.topComparator}
                  onChange={(value) => updateStudy("comparator", value)}
                  placeholder="Investigator's choice of docetaxel or pemetrexed standard of care."
                />
                <TextAreaField
                  label="Endpoints and assessments"
                  value={study.outcomes}
                  onChange={(value) => updateStudy("outcomes", value)}
                  placeholder="Progression-free survival, overall survival, ORR, safety, and quality of life."
                  collapsibleInput
                  collapsibleInputLabel="Edit endpoints as text"
                  description={
                    endpointSuggestionReady
                      ? "AI can propose focused primary, secondary, and exploratory endpoint packages from the current objective."
                      : `To enable AI here, add: ${endpointSuggestionMissing.join(", ")}.`
                  }
                  actions={
                    <button
                      onClick={handleSuggestEndpoints}
                      disabled={loadingAction !== null || !endpointSuggestionReady}
                      title={!endpointSuggestionReady ? `Add ${endpointSuggestionMissing.join(", ")}` : undefined}
                      className="inline-flex items-center gap-2 rounded-full bg-[#1864AB] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#155799] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-700 disabled:opacity-100"
                    >
                      <Sparkles className="h-4 w-4" />
                      {endpointSuggestionButtonLabel}
                    </button>
                  }
                  footer={
                    <StructuredItemEditor
                      title="Structured endpoint items"
                      description="Review the endpoint package as distinct items. Uncheck to drop an item from the study wording, edit any text inline, or delete it entirely."
                      items={outcomeEditorItems}
                      emptyText="Add endpoint wording above, or add a structured item here to start building the endpoint package."
                      draftValue={outcomeItemDraft}
                      onDraftChange={setOutcomeItemDraft}
                      onAdd={() =>
                        addStructuredStudyFieldItem("outcomes", outcomeEditorItems, outcomeItemDraft, setOutcomeEditorItems, () =>
                          setOutcomeItemDraft(""),
                        )
                      }
                      onToggle={(id) => toggleStructuredStudyFieldItem("outcomes", outcomeEditorItems, id, setOutcomeEditorItems)}
                      onItemChange={(id, value) =>
                        updateStructuredStudyFieldItemText("outcomes", outcomeEditorItems, id, value, setOutcomeEditorItems)
                      }
                      onDelete={(id) => deleteStructuredStudyFieldItem("outcomes", outcomeEditorItems, id, setOutcomeEditorItems)}
                      addPlaceholder="Add another endpoint or assessment item"
                    />
                  }
                />
                <TextAreaField
                  label="Operational notes"
                  value={study.operationalNotes}
                  onChange={(value) => updateStudy("operationalNotes", value)}
                  placeholder="Country mix, site activation constraints, biospecimen collection, external vendors."
                  collapsibleInput
                  collapsibleInputLabel="Edit notes as text"
                  footer={
                    <StructuredItemEditor
                      title="Structured operational items"
                      description="Keep operational constraints as distinct notes so teams can trim, reorder, or clarify execution-critical items one by one."
                      items={operationalNoteItems}
                      emptyText="Add operational notes above, or add a structured item here to capture a specific execution constraint."
                      draftValue={operationalNoteItemDraft}
                      onDraftChange={setOperationalNoteItemDraft}
                      onAdd={() =>
                        addStructuredStudyFieldItem(
                          "operationalNotes",
                          operationalNoteItems,
                          operationalNoteItemDraft,
                          setOperationalNoteItems,
                          () => setOperationalNoteItemDraft(""),
                        )
                      }
                      onToggle={(id) =>
                        toggleStructuredStudyFieldItem("operationalNotes", operationalNoteItems, id, setOperationalNoteItems)
                      }
                      onItemChange={(id, value) =>
                        updateStructuredStudyFieldItemText(
                          "operationalNotes",
                          operationalNoteItems,
                          id,
                          value,
                          setOperationalNoteItems,
                        )
                      }
                      onDelete={(id) =>
                        deleteStructuredStudyFieldItem("operationalNotes", operationalNoteItems, id, setOperationalNoteItems)
                      }
                      addPlaceholder="Add another operational note"
                    />
                  }
                />
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-3">
                <Field
                  label={isEvidenceSynthesisStudy ? "Evidence window / timeframe" : "Timeline"}
                  value={study.timeline}
                  onChange={(value) => updateStudy("timeline", value)}
                  placeholder={
                    isEvidenceSynthesisStudy
                      ? "Search years, evidence window, or review completion timing"
                      : "24-month enrollment, 12-month follow-up"
                  }
                />
                <Field
                  label={isEvidenceSynthesisStudy ? "Evidence geography / market scope" : "Geography"}
                  value={study.geography}
                  onChange={(value) => updateStudy("geography", value)}
                  placeholder={isEvidenceSynthesisStudy ? "Global, EU5, US, or target decision geography" : "US, EU5, Japan"}
                />
                {isEvidenceSynthesisStudy ? (
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-medium text-slate-700">Sample size planning input</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Not typically applicable for evidence synthesis. Use Literature planning to define evidence scope, inclusion criteria, and expected body of evidence instead.
                    </p>
                  </div>
                ) : (
                  <Field
                    label="Sample size planning input"
                    value={study.sampleSize}
                    onChange={(value) => updateStudy("sampleSize", value)}
                    placeholder="Approx. 540 randomized patients"
                  />
                )}
              </div>

              <div className="mt-6 rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">AI evidence impact</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">Early view of likely study impact</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                      Use this at the end of Tab 1 to pressure-test the current concept before you move on. The assessment estimates whether the study is currently stronger for publication, practice, HTA, guideline, or label-relevant impact.
                    </p>
                  </div>

                  <button
                    onClick={handleAssessImpact}
                    disabled={loadingAction !== null || !impactAssessmentReady}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1864AB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#155799] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {loadingAction === "impact" ? "Assessing..." : impactAssessment.generatedAt ? "Refresh impact view" : "Assess study impact"}
                  </button>
                </div>

                <p className={`mt-3 text-xs ${impactAssessmentReady ? "text-emerald-700" : "text-slate-500"}`}>
                  {impactAssessmentReady ? "Ready to assess." : `Needs: ${impactAssessmentMissing.join(", ")}.`}
                </p>

                <div className="mt-5">
                  <ImpactAssessmentPanel assessment={impactAssessment} />
                </div>
              </div>

              {showReviewGates && (
                <div className="mt-6">
                  <ReviewCard
                    title="Approve study design inputs"
                    review={reviews.study}
                    missing={studyMissing}
                    onApprove={() =>
                      updateReview("study", {
                        status: "approved",
                        reviewedAt: new Date().toISOString(),
                      })
                    }
                    onNeedsRevision={() =>
                      updateReview("study", {
                        status: "needs_revision",
                        reviewedAt: new Date().toISOString(),
                      })
                    }
                    onNotesChange={(value) => updateReview("study", { notes: value })}
                  />
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={handleExtractPico}
                  disabled={loadingAction !== null || !studyReady}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" />
                  {loadingAction === "extract" ? "Generating PICO and stats..." : "Extract PICO and stats"}
                </button>
                <button
                  onClick={handleBuildLiterature}
                  disabled={loadingAction !== null || !gates.literature}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LibraryBig className="h-4 w-4" />
                  {loadingAction === "literature" ? "Generating literature plan..." : "Build literature plan"}
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === "schema" && (
          <section className="space-y-6">
            <div className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Tab {tabIndexById.schema}</p>
                  <h2 className="mt-2 font-[Iowan_Old_Style,Palatino_Linotype,Book_Antiqua,serif] text-3xl text-slate-950">
                    Build an optional study schema
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                    Turn the current study concept into an editable visual schema. This tab is optional and does not block the workflow, but it is useful for pressure-testing whether the design reads clearly before moving into PICO, literature, and drafting.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <TabHelpButton
                    tabId="schema"
                    open={openHelpTab === "schema"}
                    onToggle={(tabId) => setOpenHelpTab((current) => (current === tabId ? null : tabId))}
                  />
                  {studySchemaGenerated && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-2 text-xs font-semibold text-[#1864AB]">
                      <CheckCircle2 className="h-4 w-4" />
                      {studySchemaStale ? "Schema needs refresh" : "Schema ready"}
                    </div>
                  )}
                </div>
              </div>

              {openHelpTab === "schema" && (
                <div className="mb-6">
                  <TabHelpPanel tabId="schema" />
                </div>
              )}

              {studySchemaStale && (
                <div className="mb-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                  Tab 1 has changed since this schema was generated. Refresh the schema so the visual study flow stays aligned to the current design.
                </div>
              )}

              <div className="grid gap-5 lg:grid-cols-[0.7fr_0.3fr]">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Schema title"
                      value={studySchema.title}
                      onChange={(value) => updateStudySchemaMeta("title", value)}
                      placeholder="Study visual schema"
                    />

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Detail level</span>
                      <select
                        value={studySchema.detailLevel}
                        onChange={(event) => updateStudySchemaMeta("detailLevel", event.target.value as StudySchemaDetailLevel)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#74C0FC] focus:ring-2 focus:ring-[#A5D8FF]"
                      >
                        <option value="simple">High level / one slide</option>
                        <option value="standard">Standard</option>
                        <option value="detailed">Detailed</option>
                      </select>
                    </label>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    The presentation schema is fixed to a horizontal one-slide layout so it stays readable in PowerPoint-style outputs.
                  </p>

                  <div className="mt-5">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Regeneration instruction</span>
                      <textarea
                        value={studySchema.iterationPrompt}
                        onChange={(event) => updateStudySchemaMeta("iterationPrompt", event.target.value)}
                        rows={4}
                        placeholder="Example: show separate biomarker-based cohorts, make the RWE confounding-control step more explicit, or simplify the visual flow for an executive audience."
                        className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition focus:border-[#74C0FC] focus:ring-2 focus:ring-[#A5D8FF]"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={handleGenerateStudySchema}
                      disabled={loadingAction !== null || !studySchemaReady}
                      className="inline-flex items-center gap-2 rounded-full bg-[#1864AB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#155799] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <GitBranch className="h-4 w-4" />
                      {loadingAction === "schema"
                        ? "Generating schema..."
                        : studySchemaGenerated
                          ? "Regenerate study schema"
                          : "Generate study schema"}
                    </button>
                    <button
                      onClick={() => handleExportStudySchema("svg")}
                      disabled={!studySchemaGenerated}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#74C0FC] hover:bg-[#E7F5FF] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FileDown className="h-4 w-4" />
                      Export SVG
                    </button>
                    <button
                      onClick={() => handleExportStudySchema("png")}
                      disabled={!studySchemaGenerated}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#74C0FC] hover:bg-[#E7F5FF] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FileDown className="h-4 w-4" />
                      Export PNG
                    </button>
                  </div>

                  <p className={`mt-3 text-xs ${studySchemaReady ? "text-emerald-700" : "text-slate-500"}`}>
                    {studySchemaReady ? "Ready to generate." : `Needs: ${studySchemaMissing.join(", ")}.`}
                  </p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Schema inputs</p>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                    <p>Study type: <span className="font-semibold text-slate-950">{study.subcategory || study.category || "Not set"}</span></p>
                    <p>Disease: <span className="font-semibold text-slate-950">{getSelectedDiseaseLabel(study) || getResolvedIndication(study) || "Not set"}</span></p>
                    <p>Intervention: <span className="font-semibold text-slate-950">{study.topIntervention || study.intervention || "Not set"}</span></p>
                    <p>Comparator: <span className="font-semibold text-slate-950">{study.topComparator || study.comparator || "Not set"}</span></p>
                    <p>Decision destination: <span className="font-semibold text-slate-950">{getPrimaryEvidenceUseIntent(study) || "Not set"}</span></p>
                    <p>Objective: <span className="font-semibold text-slate-950">{study.primaryObjective || "Not set"}</span></p>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-500">
                    This view now uses a fixed presentation template so the schema stays readable on one page or one slide. Change the study content in Tab 1 to change the schema wording.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <StudySchemaPreview schema={studySchema} study={study} stale={studySchemaStale} />
              </div>

              <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Appearance</p>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      This schema now uses a fixed visual template instead of free node placement. You can still adjust the palette, but the content structure stays slide-friendly by design.
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    Edit study wording in Tab 1 to change step titles, arms, cohorts, objectives, and endpoints.
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {([
                    ["background", "Background"],
                    ["laneFill", "Soft fill"],
                    ["nodeFill", "Card fill"],
                    ["accent", "Accent"],
                    ["text", "Text"],
                    ["edge", "Connector"],
                  ] as Array<[keyof StudySchemaTheme, string]>).map(([key, label]) => (
                    <label key={key} className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">{label}</span>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                        <input
                          type="color"
                          value={studySchema.theme[key]}
                          onChange={(event) => updateStudySchemaTheme(key, event.target.value)}
                          className="h-9 w-10 rounded-lg border-0 bg-transparent p-0"
                        />
                        <span className="text-sm font-semibold text-slate-700">{studySchema.theme[key]}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={handleExtractPico}
                  disabled={loadingAction !== null || !studyReady}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" />
                  {loadingAction === "extract" ? "Generating PICO and stats..." : "Continue to PICO and stats"}
                </button>
                <button
                  onClick={() => handleTabChange("pico")}
                  disabled={!gates.pico}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#74C0FC] hover:bg-[#E7F5FF] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Skip and open PICO
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === "pico" && (
          <section className="space-y-6">
            <div className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Tab {tabIndexById.pico}</p>
                  <h2 className="mt-2 font-[Iowan_Old_Style,Palatino_Linotype,Book_Antiqua,serif] text-3xl text-slate-950">
                    Extract PICO and draft statistical assumptions
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    This tab pulls structured PICO content from Tab 1 and frames the first-pass statistical assumptions
                    needed for synopsis drafting. The prompts below are ready to hand to a GenAI model for refinement.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <TabHelpButton
                    tabId="pico"
                    open={openHelpTab === "pico"}
                    onToggle={(tabId) => setOpenHelpTab((current) => (current === tabId ? null : tabId))}
                  />
                  <button
                    onClick={handleExtractPico}
                    disabled={loadingAction !== null || !studyReady}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Sparkles className="h-4 w-4" />
                    {loadingAction === "extract" ? "Refreshing..." : "Refresh from tab 1"}
                  </button>
                </div>
              </div>

              {openHelpTab === "pico" && (
                <div className="mb-6">
                  <TabHelpPanel tabId="pico" />
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <TextAreaField
                  label="Population"
                  value={pico.population}
                  onChange={(value) => updatePico("population", value)}
                  placeholder="Structured target population extracted from study design."
                />
                <TextAreaField
                  label="Intervention / Exposure"
                  value={pico.intervention}
                  onChange={(value) => updatePico("intervention", value)}
                  placeholder="Intervention, exposure, or evidence package."
                />
                <TextAreaField
                  label="Comparator"
                  value={pico.comparator}
                  onChange={(value) => updatePico("comparator", value)}
                  placeholder="Comparator, external control, or historical benchmark."
                />
                <TextAreaField
                  label="Outcomes"
                  value={pico.outcomes}
                  onChange={(value) => updatePico("outcomes", value)}
                  placeholder="Primary and supporting outcomes."
                />
              </div>

              <div className="mt-5">
                <Field
                  label="Timeframe"
                  value={pico.timeframe}
                  onChange={(value) => updatePico("timeframe", value)}
                  placeholder="Enrollment and follow-up or evidence horizon."
                />
              </div>

              <div className="mt-6 rounded-[24px] border border-[#D0EBFF] bg-[#E7F5FF] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1864AB]">GenAI prompt for PICO extraction</p>
                <textarea
                  value={pico.prompt}
                  onChange={(event) => updatePico("prompt", event.target.value)}
                  rows={10}
                  className="mt-3 w-full rounded-2xl border border-[#D0EBFF] bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#74C0FC] focus:ring-2 focus:ring-[#A5D8FF]"
                />
              </div>

              {showReviewGates && (
                <div className="mt-6">
                  <ReviewCard
                    title="Approve PICO and statistical assumptions"
                    review={reviews.pico}
                    missing={picoMissing}
                    onApprove={() =>
                      updateReview("pico", {
                        status: "approved",
                        reviewedAt: new Date().toISOString(),
                      })
                    }
                    onNeedsRevision={() =>
                      updateReview("pico", {
                        status: "needs_revision",
                        reviewedAt: new Date().toISOString(),
                      })
                    }
                    onNotesChange={(value) => updateReview("pico", { notes: value })}
                  />
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-[#D0EBFF] bg-[#F8FBFF] p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1864AB]">Biostatistics starter</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">Draft assumptions</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                    {isEvidenceSynthesisStudy
                      ? "Use this area only if the evidence synthesis needs explicit analytic assumptions. Patient sample-size estimation does not apply here."
                      : "Edit the current statistical assumptions in one structured field. Keep the bracket headings in place so the estimator can continue using the right inputs."}
                  </p>
                </div>
                {picoReady && (
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Drafted
                  </div>
                )}
              </div>

              <div className="mt-5">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Statistical assumptions</span>
                  <textarea
                    value={buildStatsEditorText(stats)}
                    onChange={(event) => handleStatsEditorChange(event.target.value)}
                    rows={22}
                    className="w-full rounded-[22px] border border-[#D0EBFF] bg-white px-4 py-4 text-sm leading-7 text-slate-800 outline-none transition focus:border-[#74C0FC] focus:ring-2 focus:ring-[#A5D8FF]"
                  />
                  <p className="text-xs leading-6 text-slate-500">
                    {isEvidenceSynthesisStudy
                      ? "Use the bracket headings as section labels. Keep only the analytic assumptions that are relevant for the synthesis."
                      : "Use the bracket headings as section labels. The sample-size estimator reads the values from this editor."}
                  </p>
                </label>
              </div>

              {!isEvidenceSynthesisStudy ? (
                <div className="mt-6 rounded-[24px] border border-[#D0EBFF] bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1864AB]">AI-assisted sample size estimate</p>
                      <h4 className="mt-2 text-lg font-semibold text-slate-950">Estimate required sample size from the current assumptions</h4>
                      <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                        This uses deterministic formulas under the current statistical assumptions. If a planned sample size was entered in Study Design, the estimate compares against it.
                      </p>
                    </div>

                    <button
                      onClick={handleEstimateSampleSize}
                      className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      {sampleSizeEstimate.status === "ready" ? "Refresh estimate" : "Estimate sample size"}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                    <span className={`${sampleSizeEstimateReady ? "text-emerald-700" : "text-amber-700"}`}>
                      {sampleSizeEstimateReady ? "Ready to estimate." : `Needs: ${sampleSizeEstimateMissing.join(", ")}.`}
                    </span>
                    <span className="text-slate-500">
                      Planned sample size input: {study.sampleSize.trim() ? study.sampleSize : "Not entered yet"}
                    </span>
                  </div>

                  {sampleSizeEstimate.status !== "idle" && (
                    <div
                      className={`mt-5 rounded-[20px] border p-4 ${
                        sampleSizeEstimate.status === "ready"
                          ? "border-emerald-200 bg-emerald-50"
                          : sampleSizeEstimate.status === "needs_inputs"
                            ? "border-amber-200 bg-amber-50"
                            : "border-rose-200 bg-rose-50"
                      }`}
                    >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {sampleSizeEstimate.methodLabel || "Sample-size estimation"}
                        </p>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">{sampleSizeEstimate.summary}</p>
                      </div>
                      {sampleSizeEstimate.generatedAt ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {formatTimestamp(sampleSizeEstimate.generatedAt)}
                        </span>
                      ) : null}
                    </div>

                    {sampleSizeEstimate.status === "ready" && (
                      <>
                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                          <div className="rounded-[18px] bg-[#F1F8FF] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Per arm</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">{sampleSizeEstimate.estimatedPerArm.toLocaleString()}</p>
                          </div>
                          <div className="rounded-[18px] bg-[#F1F8FF] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">{sampleSizeEstimate.estimatedTotal.toLocaleString()}</p>
                          </div>
                          <div className="rounded-[18px] bg-[#F1F8FF] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Adjusted total</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">{sampleSizeEstimate.adjustedTotal.toLocaleString()}</p>
                            <p className="mt-1 text-xs text-slate-500">Includes {Math.round(sampleSizeEstimate.attritionRate * 100)}% attrition</p>
                          </div>
                          <div
                            className={`rounded-[18px] p-4 ${
                              sampleSizeEstimate.plannedStatus === "under"
                                ? "bg-rose-50"
                                : sampleSizeEstimate.plannedStatus === "over"
                                  ? "bg-sky-50"
                                  : sampleSizeEstimate.plannedStatus === "aligned"
                                    ? "bg-emerald-50"
                                    : "bg-[#F1F8FF]"
                            }`}
                          >
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Planned vs estimated</p>
                            <p className="mt-2 text-lg font-semibold text-slate-950">
                              {sampleSizeEstimate.plannedTotal !== null
                                ? `${sampleSizeEstimate.plannedTotal.toLocaleString()} planned`
                                : "No planned size"}
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                              {sampleSizeEstimate.plannedStatus === "under"
                                ? `${Math.abs(sampleSizeEstimate.plannedGap || 0).toLocaleString()} below adjusted need`
                                : sampleSizeEstimate.plannedStatus === "over"
                                  ? `${Math.abs(sampleSizeEstimate.plannedGap || 0).toLocaleString()} above adjusted need`
                                  : sampleSizeEstimate.plannedStatus === "aligned"
                                    ? "Broadly aligned with current assumptions"
                                    : "Enter a planned size in Study Design to compare."}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                          <div className="rounded-[18px] bg-[#F1F8FF] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Assumptions used</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {sampleSizeEstimate.assumptions.map((item) => (
                                <span key={item} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                                  {item}
                                </span>
                              ))}
                            </div>
                            {sampleSizeEstimate.notes.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {sampleSizeEstimate.notes.map((note) => (
                                  <p key={note} className="text-sm leading-6 text-slate-600">
                                    {note}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="rounded-[18px] bg-[#F1F8FF] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sensitivity range</p>
                            <div className="mt-3 space-y-3">
                              {sampleSizeEstimate.sensitivity.map((scenario) => (
                                <div key={scenario.label} className="rounded-2xl bg-white p-3 shadow-sm">
                                  <p className="text-sm font-semibold text-slate-900">{scenario.label}</p>
                                  <p className="mt-1 text-sm text-slate-600">
                                    {scenario.total.toLocaleString()} total, or {scenario.adjustedTotal.toLocaleString()} after attrition
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {sampleSizeEstimate.status === "needs_inputs" && sampleSizeEstimate.missing.length > 0 && (
                      <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                          {sampleSizeEstimate.missing.map((item) => (
                            <p key={item} className="text-sm leading-6 text-amber-800">
                              Add {item} before estimating sample size.
                            </p>
                          ))}
                        </div>

                        {sampleSizeSuggestions.length > 0 && (
                          <div className="rounded-[18px] border border-[#D0EBFF] bg-white p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1864AB]">Draft fill-ins for missing assumptions</p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  Use these drafts to unblock the estimator, then adjust them in the statistical assumptions editor if needed.
                                </p>
                              </div>
                              {sampleSizeSuggestions.length > 1 && (
                                <button
                                  onClick={() => applySampleSizeSuggestions(sampleSizeSuggestions)}
                                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#A5D8FF] hover:bg-[#E7F5FF]"
                                >
                                  Apply all missing assumptions
                                </button>
                              )}
                            </div>

                            <div className="mt-4 space-y-3">
                              {sampleSizeSuggestions.map((suggestion) => (
                                <div key={suggestion.id} className="rounded-[18px] border border-slate-200 bg-[#F8FBFF] p-4">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">{suggestion.label}</p>
                                      <p className="mt-2 text-sm leading-6 text-slate-700">{suggestion.value}</p>
                                      <p className="mt-2 text-sm leading-6 text-slate-500">{suggestion.rationale}</p>
                                    </div>
                                    <button
                                      onClick={() => applySampleSizeSuggestions([suggestion])}
                                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                    >
                                      Use this draft
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-6 rounded-[24px] border border-[#D0EBFF] bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1864AB]">Evidence synthesis note</p>
                  <h4 className="mt-2 text-lg font-semibold text-slate-950">Sample-size estimation is not used here</h4>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                    For evidence synthesis, focus on evidence scope, inclusion logic, comparability, and analytic method. Patient sample-size planning does not usually apply in this workflow.
                  </p>
                </div>
              )}

            </div>
          </section>
        )}

        {activeTab === "literature" && (
          <section className="grid gap-6 lg:grid-cols-[1.3fr_0.95fr]">
            <div className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Tab {tabIndexById.literature}</p>
                  <h2 className="mt-2 font-[Iowan_Old_Style,Palatino_Linotype,Book_Antiqua,serif] text-3xl text-slate-950">
                    Conduct the literature planning step
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    Use structured PICO inputs to define search sources, inclusion logic, search strings, and the
                    background themes that should inform the synopsis rationale section.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <TabHelpButton
                    tabId="literature"
                    open={openHelpTab === "literature"}
                    onToggle={(tabId) => setOpenHelpTab((current) => (current === tabId ? null : tabId))}
                  />
                  <button
                    onClick={handleBuildLiterature}
                    disabled={loadingAction !== null || !gates.literature}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LibraryBig className="h-4 w-4" />
                    {loadingAction === "literature" ? "Generating search plan..." : "Generate search plan"}
                  </button>
                </div>
              </div>

              {openHelpTab === "literature" && (
                <div className="mb-6">
                  <TabHelpPanel tabId="literature" />
                </div>
              )}

              <div className="grid gap-5">
                <TextAreaField
                  label="Background research question"
                  value={literature.researchQuestion}
                  onChange={(value) => updateLiterature("researchQuestion", value)}
                  placeholder="What literature is needed to support the synopsis background and design rationale?"
                  rows={4}
                />
                <div className="grid gap-5 md:grid-cols-2">
                  <TextAreaField
                    label="Databases and sources"
                    value={literature.databases}
                    onChange={(value) => updateLiterature("databases", value)}
                    rows={5}
                  />
                  <TextAreaField
                    label="Evidence window"
                    value={literature.evidenceWindow}
                    onChange={(value) => updateLiterature("evidenceWindow", value)}
                    rows={5}
                  />
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <TextAreaField
                    label="Inclusion criteria"
                    value={literature.inclusionCriteria}
                    onChange={(value) => updateLiterature("inclusionCriteria", value)}
                    rows={5}
                  />
                  <TextAreaField
                    label="Exclusion criteria"
                    value={literature.exclusionCriteria}
                    onChange={(value) => updateLiterature("exclusionCriteria", value)}
                    rows={5}
                  />
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <TextAreaField
                    label="Keywords and concepts"
                    value={literature.keywords}
                    onChange={(value) => updateLiterature("keywords", value)}
                    rows={6}
                  />
                  <TextAreaField
                    label="Background themes to inform the synopsis"
                    value={literature.backgroundThemes}
                    onChange={(value) => updateLiterature("backgroundThemes", value)}
                    rows={6}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-white/60 bg-slate-950 p-6 text-white shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">Search strings</p>
                <TextAreaField
                  label="PubMed query"
                  value={literature.pubmedQuery}
                  onChange={(value) => updateLiterature("pubmedQuery", value)}
                  rows={6}
                />
                <div className="mt-4" />
                <TextAreaField
                  label="Embase query"
                  value={literature.embaseQuery}
                  onChange={(value) => updateLiterature("embaseQuery", value)}
                  rows={6}
                />
                <div className="mt-4" />
                <TextAreaField
                  label="Grey literature plan"
                  value={literature.greyLiteraturePlan}
                  onChange={(value) => updateLiterature("greyLiteraturePlan", value)}
                  rows={5}
                />
              </div>

              <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">GenAI prompt for background synthesis</p>
                <textarea
                  value={literature.prompt}
                  onChange={(event) => updateLiterature("prompt", event.target.value)}
                  rows={12}
                  className="mt-3 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                />
              </div>

              {showReviewGates && (
                <div className="mt-6">
                  <ReviewCard
                    title="Approve literature plan and rationale framing"
                    review={reviews.literature}
                    missing={literatureMissing}
                    onApprove={() =>
                      updateReview("literature", {
                        status: "approved",
                        reviewedAt: new Date().toISOString(),
                      })
                    }
                    onNeedsRevision={() =>
                      updateReview("literature", {
                        status: "needs_revision",
                        reviewedAt: new Date().toISOString(),
                      })
                    }
                    onNotesChange={(value) => updateReview("literature", { notes: value })}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "schedule" && showScheduleTab && (
          <section className="space-y-6">
            <div className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Tab {tabIndexById.schedule}</p>
                  <h2 className="mt-2 font-[Iowan_Old_Style,Palatino_Linotype,Book_Antiqua,serif] text-3xl text-slate-950">
                    Draft the schedule of activities
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    For interventional studies, this tab generates a hierarchical schedule-of-activities table with
                    three header tiers: study phase, period, and visit. You can edit cells directly, regroup rows,
                    and ask AI to regenerate against a more specific instruction.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <TabHelpButton
                    tabId="schedule"
                    open={openHelpTab === "schedule"}
                    onToggle={(tabId) => setOpenHelpTab((current) => (current === tabId ? null : tabId))}
                  />
                  <button
                    onClick={handleAddScheduleRow}
                    disabled={!schedule.columns.length}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    Add activity row
                  </button>
                  <button
                    onClick={handleAddScheduleColumn}
                    disabled={!schedule.columns.length}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    Add visit column
                  </button>
                  <button
                    onClick={handleGenerateSchedule}
                    disabled={loadingAction !== null || !gates.schedule}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Sparkles className="h-4 w-4" />
                    {loadingAction === "schedule"
                      ? "Generating schedule..."
                      : schedule.rows.length
                        ? "Regenerate with change request"
                        : "Generate schedule"}
                  </button>
                  <button
                    onClick={() => handleAnalyzeScheduleInsights("complexity")}
                    disabled={loadingAction !== null || !scheduleReady}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {loadingAction === "schedule_analysis" ? "Analyzing..." : "Assess complexity"}
                  </button>
                  <button
                    onClick={() => handleAnalyzeScheduleInsights("tradeoff")}
                    disabled={loadingAction !== null || !scheduleReady}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Scale className="h-4 w-4" />
                    {loadingAction === "schedule_analysis" ? "Analyzing..." : "Check trade-off analysis"}
                  </button>
                </div>
              </div>

              {openHelpTab === "schedule" && (
                <div className="mb-6">
                  <TabHelpPanel tabId="schedule" />
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-[0.95fr_1.05fr]">
                <TextAreaField
                  label="Schedule purpose and legend"
                  value={schedule.purpose}
                  onChange={(value) => updateScheduleMeta("purpose", value)}
                  placeholder='Explain the schedule intent and legend, for example: "X = required, blank = not required."'
                  rows={4}
                />
                <TextAreaField
                  label={schedule.rows.length ? "What should be different in the regenerated schedule?" : "Optional instruction for the first draft"}
                  value={schedule.iterationPrompt}
                  onChange={(value) => updateScheduleMeta("iterationPrompt", value)}
                  placeholder={
                    schedule.rows.length
                      ? "Example: make Cycle 1 more intensive, add ophthalmology monitoring, or simplify follow-up."
                      : "Example: keep the table simple, add a survival follow-up period, or include PK sampling."
                  }
                  rows={4}
                />
              </div>

              <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {schedule.rows.length
                  ? "Type what should change, then use “Regenerate with change request”."
                  : "You can tell AI how the first schedule should differ before generating it."}
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Table layout</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">Single table by default, split only when it helps readability</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{scheduleTablePresentation.recommendation}</p>
                  </div>

                  <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
                    {[
                      { value: "auto", label: "Auto" },
                      { value: "single", label: "Single table" },
                      { value: "split", label: "Split into 2" },
                    ].map((option) => {
                      const selected = schedule.tableLayout === option.value
                      const disabled = option.value === "split" && !canSplitScheduleTable

                      return (
                        <button
                          key={option.value}
                          onClick={() => updateScheduleMeta("tableLayout", option.value as ScheduleTableLayout)}
                          disabled={disabled}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            selected
                              ? "bg-slate-950 text-white"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          } disabled:cursor-not-allowed disabled:opacity-40`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  {schedule.tableLayout === "auto"
                    ? `Auto is currently using ${scheduleTablePresentation.effectiveLayout === "split" ? "split-table" : "single-table"} view.`
                    : `Manual layout override: ${schedule.tableLayout === "split" ? "split-table" : "single-table"} view.`}
                </div>
              </div>

              <div className="mt-5 space-y-5">
                {scheduleTablePresentation.tables.map((table, index) => (
                  <div key={table.id} className="space-y-3">
                    {scheduleTablePresentation.tables.length > 1 && (
                      <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Table {index + 1}</p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-950">{table.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{table.description}</p>
                      </div>
                    )}

                    <ScheduleTable
                      schedule={table.schedule}
                      editable
                      onRowChange={updateScheduleRow}
                      onCellChange={updateScheduleCell}
                      onRemoveRow={handleRemoveScheduleRow}
                      onColumnChange={updateScheduleColumn}
                      onPhaseGroupChange={(columnIds, value) => updateScheduleColumnGroup("phase", columnIds, value)}
                      onPeriodGroupChange={(columnIds, value) => updateScheduleColumnGroup("period", columnIds, value)}
                      onRemoveColumn={handleRemoveScheduleColumn}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Operational diagnostics</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-950">Complexity and reduction analysis</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                      Assess study burden and identify which visits or assessments may be simplified without weakening the objective,
                      endpoint package, or required safety capture.
                    </p>
                  </div>

                  {scheduleInsightsReady && (
                    <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-right text-xs text-slate-500">
                      <p className="font-semibold text-slate-700">
                        {scheduleInsights.provenance === "ai_generated" ? "AI analysis" : "Local fallback analysis"}
                      </p>
                      <p className="mt-1">Updated {formatTimestamp(scheduleInsights.generatedAt)}</p>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <ScheduleInsightsPanel insights={scheduleInsights} />
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "sections" && (
          <section className="space-y-6">
            <div className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Tab {tabIndexById.sections}</p>
                  <h2 className="mt-2 font-[Iowan_Old_Style,Palatino_Linotype,Book_Antiqua,serif] text-3xl text-slate-950">
                    Configure the section list and prompts
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    This tab gives you the generated section backbone: reorder sections, remove sections, add new
                    sections, and tailor the prompt behind each generated narrative block before final assembly.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <TabHelpButton
                    tabId="sections"
                    open={openHelpTab === "sections"}
                    onToggle={(tabId) => setOpenHelpTab((current) => (current === tabId ? null : tabId))}
                  />
                  <button
                    onClick={handleAddSection}
                    disabled={loadingAction !== null}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    Add section
                  </button>
                  <button
                    onClick={handleRefreshSections}
                    disabled={loadingAction !== null || !gates.sections}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Sparkles className="h-4 w-4" />
                    {loadingAction === "sections" ? "Refreshing drafts..." : "Refresh drafts"}
                  </button>
                </div>
              </div>

              {openHelpTab === "sections" && (
                <div className="mb-6">
                  <TabHelpPanel tabId="sections" />
                </div>
              )}

              <div className="space-y-4">
                {sections.map((section, index) => (
                  <article
                    key={section.id}
                    className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-900">
                          {index + 1}
                        </span>
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={section.included}
                            onChange={(event) => updateSection(section.id, { included: event.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                          Include in synopsis
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveSection(section.id, "up")}
                          className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-amber-300 hover:bg-amber-50"
                          aria-label="Move section up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveSection(section.id, "down")}
                          className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-amber-300 hover:bg-amber-50"
                          aria-label="Move section down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setSections((current) => current.filter((item) => item.id !== section.id))}
                          className="rounded-full border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
                          aria-label="Remove section"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4">
                      <Field label="Section title" value={section.title} onChange={(value) => updateSection(section.id, { title: value })} />
                      <TextAreaField
                        label="Section prompt"
                        value={section.prompt}
                        onChange={(value) => updateSection(section.id, { prompt: value })}
                        rows={3}
                      />
                      <TextAreaField
                        label="Generated section draft"
                        value={section.body}
                        onChange={(value) => updateSection(section.id, { body: value })}
                        placeholder="Refresh drafts to populate this section from the previous tabs."
                        rows={8}
                      />
                      <SectionAudit section={section} />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "final" && (
          <section className="space-y-6">
            <div className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Tab {tabIndexById.final}</p>
                  <h2 className="mt-2 font-[Iowan_Old_Style,Palatino_Linotype,Book_Antiqua,serif] text-3xl text-slate-950">
                    Generate and export the study synopsis
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    Final assembly combines your configured sections with all prior study, PICO, statistical, and
                    literature inputs. For interventional studies, the current schedule of activities is appended to
                    the Word export.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <TabHelpButton
                    tabId="final"
                    open={openHelpTab === "final"}
                    onToggle={(tabId) => setOpenHelpTab((current) => (current === tabId ? null : tabId))}
                  />
                  <button
                    onClick={handleGenerateSynopsis}
                    disabled={loadingAction !== null || !gates.final}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Sparkles className="h-4 w-4" />
                    {loadingAction === "final" ? "Generating synopsis..." : "Regenerate synopsis"}
                  </button>
                  <button
                    onClick={handleExportWord}
                    disabled={loadingAction !== null}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FileDown className="h-4 w-4" />
                    Export to Word
                  </button>
                </div>
              </div>

              {openHelpTab === "final" && (
                <div className="mb-6">
                  <TabHelpPanel tabId="final" />
                </div>
              )}

              <div className="mt-6 space-y-5">
                {(finalSections.length ? finalSections : includedSections).map((section) => {
                  const auditSection = sections.find((candidate) => candidate.id === section.id)

                  return (
                    <article key={section.id} className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="font-[Iowan_Old_Style,Palatino_Linotype,Book_Antiqua,serif] text-2xl text-slate-950">
                        {section.title}
                      </h3>
                      {auditSection && <div className="mt-4"><SectionAudit section={auditSection} /></div>}
                      <div className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
                        {section.body || "Generate the synopsis to populate this section."}
                      </div>
                    </article>
                  )
                })}

                {showScheduleTab && schedule.columns.length > 0 && schedule.rows.length > 0 && (
                  <article className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="font-[Iowan_Old_Style,Palatino_Linotype,Book_Antiqua,serif] text-2xl text-slate-950">
                      Schedule of Activities
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{schedule.purpose}</p>
                    <div className="mt-4">
                      <ScheduleTable schedule={schedule} />
                    </div>
                  </article>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      <OverlayModal
        open={openAiAssistantModal === "objectives"}
        title="Objective proposal"
        description="Review, refine, and selectively apply AI-drafted primary objective, secondary objectives, and design overview."
        onClose={() => setOpenAiAssistantModal(null)}
      >
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          What should be different in the next objective options?
        </label>
        <textarea
          value={objectiveSuggestionRequest}
          onChange={(event) => setObjectiveSuggestionRequest(event.target.value)}
          placeholder="Example: make one option more pragmatic, one more label-supportive, or challenge the comparator strategy if needed."
          className="mt-2 min-h-[88px] w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">Use this box to steer the next AI draft, then regenerate the objective options.</p>
          <button
            onClick={handleSuggestObjectives}
            disabled={loadingAction !== null || !objectiveSuggestionReady}
            className="inline-flex items-center gap-2 rounded-full bg-[#1864AB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#155799] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-700"
          >
            <Sparkles className="h-4 w-4" />
            {loadingAction === "objectives" ? "Regenerating..." : "Regenerate objective options"}
          </button>
        </div>

        {loadingAction === "objectives" && (
          <div className="mt-4">
            <AiProgressPanel
              title="Building objective options"
              summary="AI is reviewing your study framing, checking alignment with the declared intent, and drafting alternative objective packages."
              steps={[
                "Study context gathered",
                "Alignment and decision fit checked",
                "Drafting objective options now",
              ]}
            />
          </div>
        )}

        {hasObjectiveSuggestionDraft && (
          <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Active objective option</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {objectiveSuggestionDraft.label}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      objectiveSuggestionDraft.alignment.status === "aligned"
                        ? "bg-emerald-100 text-emerald-800"
                        : objectiveSuggestionDraft.alignment.status === "partially_aligned"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {objectiveSuggestionDraft.alignment.status === "aligned"
                      ? "Aligned"
                      : objectiveSuggestionDraft.alignment.status === "partially_aligned"
                        ? "Partially aligned"
                        : "Conflicts"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{objectiveSuggestionDraft.positioning}</p>
              </div>
              {objectiveSuggestionGuidance ? (
                <p className="max-w-md text-sm leading-6 text-slate-600">{objectiveSuggestionGuidance}</p>
              ) : null}
            </div>

            {objectiveSuggestionDraft.alignment.summary ? (
              <div
                className={`mt-4 rounded-[18px] border px-4 py-3 ${
                  objectiveSuggestionDraft.alignment.status === "aligned"
                    ? "border-emerald-200 bg-emerald-50"
                    : objectiveSuggestionDraft.alignment.status === "partially_aligned"
                      ? "border-amber-200 bg-amber-50"
                      : "border-rose-200 bg-rose-50"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{objectiveSuggestionDraft.alignment.summary}</p>
                {objectiveSuggestionDraft.alignment.concerns.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {objectiveSuggestionDraft.alignment.concerns.map((concern) => (
                      <p key={concern} className="text-sm leading-6 text-slate-700">
                        {concern}
                      </p>
                    ))}
                  </div>
                )}
                {objectiveSuggestionDraft.alignment.recommendations.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {objectiveSuggestionDraft.alignment.recommendations.map((recommendation) => (
                      <p key={recommendation} className="text-sm leading-6 text-slate-700">
                        {recommendation}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <p className="mt-2 text-xs text-slate-500">Select only the parts you want to apply.</p>
            <div className="mt-3 grid gap-3">
              <div>
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <input
                    type="checkbox"
                    checked={objectiveSuggestionSelection.primaryObjective}
                    onChange={() =>
                      setObjectiveSuggestionSelection((current) => ({
                        ...current,
                        primaryObjective: !current.primaryObjective,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Primary objective</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{objectiveSuggestionDraft.primaryObjective}</p>
                  </div>
                </label>
              </div>
              {objectiveSuggestionDraft.secondaryObjectives.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Secondary objectives</p>
                  <div className="mt-2 space-y-2">
                    {objectiveSuggestionDraft.secondaryObjectives.map((objective) => (
                      <label key={objective} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                        <input
                          type="checkbox"
                          checked={objectiveSuggestionSelection.secondaryObjectives.includes(objective)}
                          onChange={() =>
                            setObjectiveSuggestionSelection((current) => ({
                              ...current,
                              secondaryObjectives: toggleSelectionItem(current.secondaryObjectives, objective),
                            }))
                          }
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                        />
                        <span className="text-sm leading-6 text-slate-700">{objective}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <input
                    type="checkbox"
                    checked={objectiveSuggestionSelection.designOverview}
                    onChange={() =>
                      setObjectiveSuggestionSelection((current) => ({
                        ...current,
                        designOverview: !current.designOverview,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Design overview</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{objectiveSuggestionDraft.designOverview}</p>
                  </div>
                </label>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <p className="text-xs text-slate-500">{selectedObjectiveSuggestionCount} selected</p>
              <p className="text-xs text-slate-500">{objectiveApplySummary}</p>
              <button
                onClick={applyObjectiveSuggestion}
                disabled={selectedObjectiveSuggestionCount === 0}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {objectiveSuggestionDraft.alignment.status === "conflicts"
                  ? "Apply objective changes despite conflict"
                  : "Apply objective changes"}
              </button>
              <button
                onClick={dismissObjectiveSuggestion}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Dismiss
              </button>
            </div>

            {objectiveSuggestionAlternatives.length > 0 && (
              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Alternative objective options</p>
                <div className="mt-3 grid gap-3">
                  {objectiveSuggestionAlternatives.map((option) => (
                    <div key={`${option.label}-${option.positioning}`} className="rounded-[18px] border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                option.alignment.status === "aligned"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : option.alignment.status === "partially_aligned"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {option.alignment.status === "aligned"
                                ? "Aligned"
                                : option.alignment.status === "partially_aligned"
                                  ? "Partially aligned"
                                  : "Conflicts"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{option.positioning}</p>
                        </div>
                        <button
                          onClick={() => useObjectiveAlternative(option)}
                          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                          Use this option
                        </button>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-700">{option.primaryObjective}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{option.alignment.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </OverlayModal>

      <OverlayModal
        open={openAiAssistantModal === "population"}
        title={populationAssistantTitle}
        description={populationAssistantDescription}
        onClose={() => setOpenAiAssistantModal(null)}
      >
        {loadingAction === "population" && (
          <AiProgressPanel
            title={populationAssistantLoadingTitle}
            summary={populationAssistantLoadingSummary}
            steps={populationAssistantSteps}
          />
        )}

        {hasPopulationSuggestionDraft && (
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Draft proposal</p>
            <p className="mt-2 text-xs text-slate-500">Select the fields you want to apply.</p>
            <div className="mt-3 space-y-3">
              <div>
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <input
                    type="checkbox"
                    checked={populationSuggestionSelection.population}
                    onChange={() =>
                      setPopulationSuggestionSelection((current) => ({
                        ...current,
                        population: !current.population,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Population</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{populationSuggestionDraft.population}</p>
                  </div>
                </label>
              </div>
              <div>
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <input
                    type="checkbox"
                    checked={populationSuggestionSelection.eligibility}
                    onChange={() =>
                      setPopulationSuggestionSelection((current) => ({
                        ...current,
                        eligibility: !current.eligibility,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Eligibility highlights</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{populationSuggestionDraft.eligibility}</p>
                  </div>
                </label>
              </div>
              <p className="text-sm leading-6 text-slate-600">{populationSuggestionDraft.rationale}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <p className="text-xs text-slate-500">{selectedPopulationSuggestionCount} selected</p>
              <p className="text-xs text-slate-500">{populationApplySummary}</p>
              <button
                onClick={applyPopulationSuggestion}
                disabled={selectedPopulationSuggestionCount === 0}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Replace checked fields
              </button>
              <button
                onClick={dismissPopulationSuggestion}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </OverlayModal>

      <OverlayModal
        open={openAiAssistantModal === "endpoints"}
        title="Endpoint proposal"
        description="Review, refine, and selectively apply AI-drafted endpoint packages that stay focused on the research question and avoid avoidable data-collection bloat."
        onClose={() => setOpenAiAssistantModal(null)}
      >
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          What should be different in the next endpoint options?
        </label>
        <textarea
          value={endpointSuggestionRequest}
          onChange={(event) => setEndpointSuggestionRequest(event.target.value)}
          placeholder="Example: propose a lower-burden package, a more HTA-supportive package, or challenge an endpoint choice if it weakens the objective."
          className="mt-2 min-h-[88px] w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">Use this box to steer the next AI draft, then regenerate the endpoint packages.</p>
          <button
            onClick={handleSuggestEndpoints}
            disabled={loadingAction !== null || !endpointSuggestionReady}
            className="inline-flex items-center gap-2 rounded-full bg-[#1864AB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#155799] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-700"
          >
            <Sparkles className="h-4 w-4" />
            {loadingAction === "endpoints" ? "Regenerating..." : "Regenerate endpoint options"}
          </button>
        </div>

        {loadingAction === "endpoints" && (
          <div className="mt-4">
            <AiProgressPanel
              title="Building endpoint packages"
              summary="AI is reviewing the objective, checking endpoint fit and burden, and generating focused endpoint packages rather than a long endpoint list."
              steps={[
                "Objective and endpoint context gathered",
                "Clinical and strategic fit checked",
                "Drafting endpoint options now",
              ]}
            />
          </div>
        )}

        {hasEndpointSuggestionDraft && (
          <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Active endpoint package</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {endpointSuggestionDraft.label}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      endpointSuggestionDraft.alignment.status === "aligned"
                        ? "bg-emerald-100 text-emerald-800"
                        : endpointSuggestionDraft.alignment.status === "partially_aligned"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {endpointSuggestionDraft.alignment.status === "aligned"
                      ? "Aligned"
                      : endpointSuggestionDraft.alignment.status === "partially_aligned"
                        ? "Partially aligned"
                        : "Conflicts"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{endpointSuggestionDraft.positioning}</p>
              </div>
              {endpointSuggestionGuidance ? (
                <p className="max-w-md text-sm leading-6 text-slate-600">{endpointSuggestionGuidance}</p>
              ) : null}
            </div>

            {endpointSuggestionDraft.alignment.summary ? (
              <div
                className={`mt-4 rounded-[18px] border px-4 py-3 ${
                  endpointSuggestionDraft.alignment.status === "aligned"
                    ? "border-emerald-200 bg-emerald-50"
                    : endpointSuggestionDraft.alignment.status === "partially_aligned"
                      ? "border-amber-200 bg-amber-50"
                      : "border-rose-200 bg-rose-50"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{endpointSuggestionDraft.alignment.summary}</p>
                {endpointSuggestionDraft.alignment.concerns.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {endpointSuggestionDraft.alignment.concerns.map((concern) => (
                      <p key={concern} className="text-sm leading-6 text-slate-700">
                        {concern}
                      </p>
                    ))}
                  </div>
                )}
                {endpointSuggestionDraft.alignment.recommendations.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {endpointSuggestionDraft.alignment.recommendations.map((recommendation) => (
                      <p key={recommendation} className="text-sm leading-6 text-slate-700">
                        {recommendation}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <p className="mt-2 text-xs text-slate-500">Select only the endpoints you want to keep.</p>
            <div className="mt-3 space-y-3">
              <div>
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <input
                    type="checkbox"
                    checked={endpointSuggestionSelection.primaryEndpoint}
                    onChange={() =>
                      setEndpointSuggestionSelection((current) => ({
                        ...current,
                        primaryEndpoint: !current.primaryEndpoint,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Primary endpoint</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{endpointSuggestionDraft.primaryEndpoint}</p>
                  </div>
                </label>
              </div>
              {endpointSuggestionDraft.secondaryEndpoints.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Secondary endpoints</p>
                  <div className="mt-2 space-y-2">
                    {endpointSuggestionDraft.secondaryEndpoints.map((endpoint) => (
                      <label key={endpoint} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                        <input
                          type="checkbox"
                          checked={endpointSuggestionSelection.secondaryEndpoints.includes(endpoint)}
                          onChange={() =>
                            setEndpointSuggestionSelection((current) => ({
                              ...current,
                              secondaryEndpoints: toggleSelectionItem(current.secondaryEndpoints, endpoint),
                            }))
                          }
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                        />
                        <span className="text-sm leading-6 text-slate-700">{endpoint}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {endpointSuggestionDraft.exploratoryEndpoints.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Exploratory endpoints</p>
                  <div className="mt-2 space-y-2">
                    {endpointSuggestionDraft.exploratoryEndpoints.map((endpoint) => (
                      <label key={endpoint} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                        <input
                          type="checkbox"
                          checked={endpointSuggestionSelection.exploratoryEndpoints.includes(endpoint)}
                          onChange={() =>
                            setEndpointSuggestionSelection((current) => ({
                              ...current,
                              exploratoryEndpoints: toggleSelectionItem(current.exploratoryEndpoints, endpoint),
                            }))
                          }
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                        />
                        <span className="text-sm leading-6 text-slate-700">{endpoint}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm leading-6 text-slate-600">{endpointSuggestionDraft.rationale}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <p className="text-xs text-slate-500">{selectedEndpointSuggestionCount} selected</p>
              <p className="text-xs text-slate-500">{endpointApplySummary}</p>
              <button
                onClick={applyEndpointSuggestion}
                disabled={selectedEndpointSuggestionCount === 0}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {endpointSuggestionDraft.alignment.status === "conflicts"
                  ? "Add selected endpoints despite conflict"
                  : "Add selected endpoints"}
              </button>
              <button
                onClick={dismissEndpointSuggestion}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Dismiss
              </button>
            </div>

            {endpointSuggestionAlternatives.length > 0 && (
              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Alternative endpoint packages</p>
                <div className="mt-3 grid gap-3">
                  {endpointSuggestionAlternatives.map((option) => (
                    <div key={`${option.label}-${option.positioning}`} className="rounded-[18px] border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                option.alignment.status === "aligned"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : option.alignment.status === "partially_aligned"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {option.alignment.status === "aligned"
                                ? "Aligned"
                                : option.alignment.status === "partially_aligned"
                                  ? "Partially aligned"
                                  : "Conflicts"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{option.positioning}</p>
                        </div>
                        <button
                          onClick={() => useEndpointAlternative(option)}
                          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                          Use this option
                        </button>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-700">{option.primaryEndpoint}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{option.alignment.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </OverlayModal>
    </main>
  )
}
