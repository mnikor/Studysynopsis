"use client"

import type React from "react"
import { useState } from "react"
import { ChevronLeft } from "lucide-react"
import Tooltip from "./Tooltip"

type EvidenceSynthesisFormProps = {
  selectedSubcategory: string
}

const EvidenceSynthesisForm: React.FC<EvidenceSynthesisFormProps> = ({ selectedSubcategory }) => {
  const [selectedDatabases, setSelectedDatabases] = useState<string[]>([])
  const [otherDatabases, setOtherDatabases] = useState("")
  const [yearRangeStart, setYearRangeStart] = useState("")
  const [yearRangeEnd, setYearRangeEnd] = useState("")
  const [languages, setLanguages] = useState("")
  const [studyTypes, setStudyTypes] = useState<string[]>([])
  const [otherStudyTypes, setOtherStudyTypes] = useState("")
  const [qualityAssessmentTool, setQualityAssessmentTool] = useState("")
  const [heterogeneityAssessment, setHeterogeneityAssessment] = useState("")
  const [publicationBiasAssessment, setPublicationBiasAssessment] = useState("")
  const [reportingGuidelines, setReportingGuidelines] = useState<string[]>([])
  const [otherReportingGuidelines, setOtherReportingGuidelines] = useState("")

  const renderSubcategorySpecificFields = () => {
    switch (selectedSubcategory) {
      case "systematic-review":
        return (
          <div className="space-y-4 border p-4 rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800">Systematic Review Specific Details</h4>

            <div>
              <label htmlFor="screening-process" className="block text-sm font-medium text-gray-700 mb-1">
                Screening Process
                <Tooltip content="Describe the process for screening and selecting studies, including number of reviewers and resolution of disagreements." />
              </label>
              <textarea
                id="screening-process"
                placeholder="E.g., Two independent reviewers will screen titles and abstracts, followed by full-text review of potentially eligible studies. Disagreements will be resolved by consensus or a third reviewer."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="data-extraction" className="block text-sm font-medium text-gray-700 mb-1">
                Data Extraction Method
                <Tooltip content="Describe how data will be extracted from included studies and what information will be collected." />
              </label>
              <textarea
                id="data-extraction"
                placeholder="E.g., A standardized data extraction form will be used to collect study characteristics, participant demographics, intervention details, outcomes, and results. Two reviewers will independently extract data."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="narrative-synthesis" className="block text-sm font-medium text-gray-700 mb-1">
                Narrative Synthesis Approach
                <Tooltip content="Describe how findings will be synthesized qualitatively if meta-analysis is not possible or appropriate." />
              </label>
              <textarea
                id="narrative-synthesis"
                placeholder="E.g., Results will be organized by outcome and study design. Similarities and differences across studies will be explored and possible explanations for discrepancies will be discussed."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      case "meta-analysis":
        return (
          <div className="space-y-4 border p-4 rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800">Meta-Analysis Specific Details</h4>

            <div>
              <label htmlFor="effect-measure" className="block text-sm font-medium text-gray-700 mb-1">
                Effect Measure
                <Tooltip content="Specify the effect measure that will be used for the meta-analysis." />
              </label>
              <textarea
                id="effect-measure"
                placeholder="E.g., Odds Ratio (OR) for binary outcomes, Mean Difference (MD) for continuous outcomes, or Hazard Ratio (HR) for time-to-event data"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="statistical-model" className="block text-sm font-medium text-gray-700 mb-1">
                Statistical Model
                <Tooltip content="Specify the statistical model that will be used for combining study results." />
              </label>
              <textarea
                id="statistical-model"
                placeholder="E.g., Random-effects model using DerSimonian and Laird method, Fixed-effects model using Mantel-Haenszel method, or Bayesian hierarchical model with non-informative priors"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="subgroup-analyses" className="block text-sm font-medium text-gray-700 mb-1">
                Planned Subgroup Analyses
                <Tooltip content="Describe any pre-planned subgroup analyses that will be conducted." />
              </label>
              <textarea
                id="subgroup-analyses"
                placeholder="E.g., Subgroup analyses will be conducted based on: 1) patient population characteristics (age, gender, disease severity), 2) intervention variations (dose, duration), and 3) study design features (randomization method, blinding)."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="sensitivity-analyses" className="block text-sm font-medium text-gray-700 mb-1">
                Planned Sensitivity Analyses
                <Tooltip content="Describe any sensitivity analyses that will be conducted to test the robustness of results." />
              </label>
              <textarea
                id="sensitivity-analyses"
                placeholder="E.g., Sensitivity analyses will be conducted by: 1) excluding studies with high risk of bias, 2) using different statistical models, 3) excluding outliers, and 4) using different effect measures."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      case "network-meta-analysis":
        return (
          <div className="space-y-4 border p-4 rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800">Network Meta-Analysis Specific Details</h4>

            <div>
              <label htmlFor="nma-analysis-type" className="block text-sm font-medium text-gray-700 mb-1">
                Analysis Type
                <Tooltip content="Describe the specific type of network meta-analysis you will conduct, including the statistical approach and any special considerations." />
              </label>
              <textarea
                id="nma-analysis-type"
                placeholder="E.g., We will conduct a Bayesian network meta-analysis using a random effects model. The analysis will be performed using the gemtc package in R, which implements Markov Chain Monte Carlo (MCMC) methods. We will use non-informative priors for the basic parameters. For binary outcomes, we will use a logit model, while for continuous outcomes, we will use a normal likelihood with an identity link."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="network-geometry" className="block text-sm font-medium text-gray-700 mb-1">
                Network Geometry
                <Tooltip content="Describe how the network of treatment comparisons will be constructed and visualized." />
              </label>
              <textarea
                id="network-geometry"
                placeholder="E.g., The network will be constructed using all direct and indirect comparisons between included interventions. Network geometry will be visualized using network plots generated with the 'netmeta' package in R. We will assess the network structure, including the number of studies per comparison and the presence of closed loops."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="consistency-assessment" className="block text-sm font-medium text-gray-700 mb-1">
                Consistency Assessment
                <Tooltip content="Describe how the assumption of consistency will be assessed in the network meta-analysis." />
              </label>
              <textarea
                id="consistency-assessment"
                placeholder="E.g., Consistency between direct and indirect evidence will be assessed using node-splitting models and the design-by-treatment interaction model. Local inconsistency will be evaluated by comparing direct and indirect estimates for each comparison. We will also calculate the I-squared statistic to quantify the degree of statistical heterogeneity across the network."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="ranking-method" className="block text-sm font-medium text-gray-700 mb-1">
                Treatment Ranking Method
                <Tooltip content="Describe the method(s) that will be used to rank treatments in terms of their relative efficacy or safety." />
              </label>
              <textarea
                id="ranking-method"
                placeholder="E.g., We will use multiple methods to rank treatments: 1) Surface Under the Cumulative Ranking Curve (SUCRA) to provide a single number summary of the treatment's overall ranking, 2) Probability of being the best treatment, calculated as the proportion of MCMC iterations in which each treatment ranks first, 3) Mean ranks across all MCMC iterations. Rankograms will be generated to visually represent the distribution of potential ranks for each treatment. We will also calculate the probability that each treatment is among the top three treatments for the primary outcome."
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="transitivity-assessment" className="block text-sm font-medium text-gray-700 mb-1">
                Transitivity Assessment
                <Tooltip content="Describe how the assumption of transitivity will be assessed." />
              </label>
              <textarea
                id="transitivity-assessment"
                placeholder="E.g., Transitivity will be assessed by comparing the distribution of potential effect modifiers across treatment comparisons, including patient characteristics (e.g., age, disease severity), intervention protocols (e.g., dosage, duration), and study methodologies (e.g., risk of bias, year of publication). We will create a table summarizing these characteristics for each treatment comparison and visually inspect for any systematic differences that could violate the transitivity assumption."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      case "ipd-analysis":
        return (
          <div className="space-y-4 border p-4 rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800">IPD Analysis Specific Details</h4>

            <div>
              <label htmlFor="ipd-outcome-measure" className="block text-sm font-medium text-gray-700 mb-1">
                Outcome Measure
                <Tooltip content="Specify the primary outcome measure(s) that will be analyzed in this IPD analysis." />
              </label>
              <textarea
                id="ipd-outcome-measure"
                placeholder="E.g., The primary outcome measure will be overall survival, defined as the time from randomization to death from any cause. Secondary outcomes will include progression-free survival and objective response rate."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="data-acquisition" className="block text-sm font-medium text-gray-700 mb-1">
                Individual Patient Data Acquisition
                <Tooltip content="Describe how individual patient data will be obtained from original study authors or sponsors." />
              </label>
              <textarea
                id="data-acquisition"
                placeholder="E.g., The majority of individual patient data will come from our company-sponsored clinical trials (e.g., Study XYZ, NCT12345678). In rare cases where additional data is needed, we may reach out to external investigators or sponsors. For such cases, a formal data sharing agreement will be established to ensure patient confidentiality and appropriate data use."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="data-harmonization" className="block text-sm font-medium text-gray-700 mb-1">
                Data Harmonization Process
                <Tooltip content="Describe how variables from different studies will be standardized and harmonized." />
              </label>
              <textarea
                id="data-harmonization"
                placeholder="How will you ensure that variables from different studies are comparable and can be combined for analysis? Consider aspects such as variable definitions, units of measurement, and coding of outcomes."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="analysis-approach" className="block text-sm font-medium text-gray-700 mb-1">
                Analysis Approach
                <Tooltip content="Specify whether a one-stage or two-stage approach will be used for the IPD analysis." />
              </label>
              <div className="relative">
                <select
                  id="analysis-approach"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Select approach
                  </option>
                  <option value="one-stage">One-stage (Simultaneous analysis of all data)</option>
                  <option value="two-stage">Two-stage (Separate analysis of each study, then meta-analysis)</option>
                  <option value="both">Both approaches</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="missing-data" className="block text-sm font-medium text-gray-700 mb-1">
                Missing Data Handling
                <Tooltip content="Describe how missing individual patient data will be handled in the analysis." />
              </label>
              <textarea
                id="missing-data"
                placeholder="E.g., Missing data will be examined for patterns. Multiple imputation will be used for variables with less than 20% missing values. Sensitivity analyses will be conducted to assess the impact of missing data assumptions."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="individual-covariates" className="block text-sm font-medium text-gray-700 mb-1">
                Individual-Level Covariates
                <Tooltip content="List the individual patient characteristics that will be included in the analyses." />
              </label>
              <textarea
                id="individual-covariates"
                placeholder="E.g., Age, sex, disease duration, disease severity, comorbidities, concomitant medications, baseline biomarker levels, and socioeconomic factors will be analyzed as potential effect modifiers."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="data-validation" className="block text-sm font-medium text-gray-700 mb-1">
                Data Validation Procedures
                <Tooltip content="Describe how the quality and integrity of the individual patient datasets will be validated." />
              </label>
              <textarea
                id="data-validation"
                placeholder="E.g., Datasets will be checked for internal consistency, outliers, and implausible values. Summary statistics will be calculated and compared with published results to verify data integrity. Discrepancies will be resolved through discussion with original investigators."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      case "maic":
        return (
          <div className="space-y-4 border p-4 rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800">MAIC Specific Details</h4>

            <div>
              <label htmlFor="maic-outcome-measure" className="block text-sm font-medium text-gray-700 mb-1">
                Outcome Measure
                <Tooltip content="Specify the primary outcome measure(s) that will be compared in this MAIC analysis." />
              </label>
              <textarea
                id="maic-outcome-measure"
                placeholder="E.g., The primary outcome measure will be the hazard ratio for progression-free survival. Secondary outcomes will include overall survival and objective response rate."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="indirect-comparison" className="block text-sm font-medium text-gray-700 mb-1">
                Indirect Comparison Method
                <Tooltip content="Describe the specific approach for matching-adjusted indirect comparison." />
              </label>
              <textarea
                id="indirect-comparison"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="E.g., We will use an unanchored matching-adjusted indirect comparison (MAIC) to compare Drug A from our individual patient data (IPD) trial to Drug B from a published aggregate data trial. The analysis will involve reweighting the IPD to match the baseline characteristics of the aggregate data population."
              />
            </div>

            <div>
              <label htmlFor="ipd-source" className="block text-sm font-medium text-gray-700 mb-1">
                Individual Patient Data Source
                <Tooltip content="Describe the source of individual patient data for the index treatment." />
              </label>
              <textarea
                id="ipd-source"
                placeholder="E.g., Individual patient data from the XYZ trial (NCT12345678) will be used for the index treatment. This trial included 250 patients with condition A treated with Drug B."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="comparator-source" className="block text-sm font-medium text-gray-700 mb-1">
                Comparator Data Source
                <Tooltip content="Describe the source of aggregate data for the comparator treatment." />
              </label>
              <textarea
                id="comparator-source"
                placeholder="E.g., Published aggregate data from the ABC trial (NCT87654321) will be used for the comparator treatment. This includes summary baseline characteristics, efficacy outcomes, and safety data as reported in Smith et al. (2020)."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="matching-variables" className="block text-sm font-medium text-gray-700 mb-1">
                Matching Variables
                <Tooltip content="List the baseline characteristics that will be used for matching or adjustment." />
              </label>
              <textarea
                id="matching-variables"
                placeholder="E.g., Age, sex, disease duration, disease severity (measured by XYZ scale), prior treatment exposure, and presence of specific biomarkers will be used as matching variables."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="weighting-method" className="block text-sm font-medium text-gray-700 mb-1">
                Weighting Method
                <Tooltip content="Describe the method used to determine weights for individual patients in the IPD." />
              </label>
              <textarea
                id="weighting-method"
                placeholder="E.g., Entropy balancing will be used to derive weights that exactly match the means of baseline characteristics in the IPD to those reported for the comparator trial."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      case "post-hoc-analysis":
        return (
          <div className="space-y-4 border p-4 rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800">Post-hoc Analysis Specific Details</h4>

            <div>
              <label htmlFor="original-study" className="block text-sm font-medium text-gray-700 mb-1">
                Original Study Details
                <Tooltip content="Provide information about the original study from which this post-hoc analysis is derived." />
              </label>
              <textarea
                id="original-study"
                placeholder="E.g., The original study was a randomized controlled trial comparing Drug A to placebo in patients with hypertension (NCT12345678)."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="original-study-objectives" className="block text-sm font-medium text-gray-700 mb-1">
                Original Study Objectives
                <Tooltip content="List the primary and key secondary objectives of the original study." />
              </label>
              <textarea
                id="original-study-objectives"
                placeholder="E.g., Primary: To assess the effect of Drug A on blood pressure reduction. Secondary: To evaluate the safety profile of Drug A."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="new-hypothesis" className="block text-sm font-medium text-gray-700 mb-1">
                New Hypothesis
                <Tooltip content="Describe the new hypothesis or research question being addressed in this post-hoc analysis." />
              </label>
              <textarea
                id="new-hypothesis"
                placeholder="E.g., We hypothesize that the effect of Drug A on blood pressure reduction is more pronounced in patients with diabetes compared to those without diabetes."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="rationale" className="block text-sm font-medium text-gray-700 mb-1">
                Rationale for Post-hoc Analysis
                <Tooltip content="Explain why this post-hoc analysis is being conducted and its potential significance." />
              </label>
              <textarea
                id="rationale"
                placeholder="E.g., Recent literature suggests a potential interaction between Drug A's mechanism of action and glucose metabolism. This analysis aims to explore this interaction and its clinical implications."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="subgroup-definition" className="block text-sm font-medium text-gray-700 mb-1">
                Subgroup Definition
                <Tooltip content="If applicable, define the subgroups that will be analyzed in this post-hoc analysis." />
              </label>
              <textarea
                id="subgroup-definition"
                placeholder="E.g., Patients will be stratified into two subgroups: those with a diagnosis of type 2 diabetes at baseline and those without diabetes."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="endpoints" className="block text-sm font-medium text-gray-700 mb-1">
                Endpoints for Post-hoc Analysis
                <Tooltip content="Specify the endpoints that will be evaluated in this post-hoc analysis." />
              </label>
              <textarea
                id="endpoints"
                placeholder="E.g., Primary: Change in systolic blood pressure from baseline to week 12. Secondary: Proportion of patients achieving blood pressure control (<140/90 mmHg) at week 12."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="statistical-methods" className="block text-sm font-medium text-gray-700 mb-1">
                Statistical Methods
                <Tooltip content="Describe the statistical methods that will be used for this post-hoc analysis." />
              </label>
              <textarea
                id="statistical-methods"
                placeholder="E.g., We will use a mixed-effects model with repeated measures (MMRM) to analyze the change in systolic blood pressure over time, with diabetes status as an interaction term. Subgroup analyses will be performed for diabetic and non-diabetic patients."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="multiplicity-adjustment" className="block text-sm font-medium text-gray-700 mb-1">
                Multiplicity Adjustment
                <Tooltip content="Describe how you will address multiple comparisons and control for Type I error." />
              </label>
              <textarea
                id="multiplicity-adjustment"
                placeholder="E.g., We will use the Hochberg procedure to adjust for multiple comparisons across the two subgroups. A nominal significance level of 0.05 will be used for all statistical tests."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="limitations" className="block text-sm font-medium text-gray-700 mb-1">
                Limitations and Considerations
                <Tooltip content="Describe potential limitations and considerations specific to this post-hoc analysis." />
              </label>
              <textarea
                id="limitations"
                placeholder="E.g., As this is a post-hoc analysis, results will be considered hypothesis-generating. The original study was not powered for this subgroup analysis. Findings should be interpreted with caution and validated in future prospective studies."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Evidence Synthesis Study Details</h3>

      {renderSubcategorySpecificFields()}
    </div>
  )
}

export default EvidenceSynthesisForm

