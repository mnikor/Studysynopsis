"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ChevronLeft } from "lucide-react"
import Tooltip from "./Tooltip"

type InterventionalFormProps = {
  selectedSubcategory: string
  studyPhase: string
  setStudyPhase: (phase: string) => void
  isPostMarketingCommitment: boolean | null
  setIsPostMarketingCommitment: (value: boolean) => void
}

const InterventionalForm: React.FC<InterventionalFormProps> = ({
  selectedSubcategory,
  studyPhase,
  setStudyPhase,
  isPostMarketingCommitment,
  setIsPostMarketingCommitment,
}) => {
  const [blindingType, setBlindingType] = useState("")
  const [controlType, setControlType] = useState("")
  const [randomizationRatio, setRandomizationRatio] = useState("")
  const [randomizationMethod, setRandomizationMethod] = useState("")
  const [treatmentDuration, setTreatmentDuration] = useState("")
  const [followUpDuration, setFollowUpDuration] = useState("")
  const [primaryEndpoint, setPrimaryEndpoint] = useState("")
  const [secondaryEndpoints, setSecondaryEndpoints] = useState("")

  useEffect(() => {
    // Reset certain fields when subcategory changes
    setRandomizationMethod("")
    setRandomizationRatio("")
    if (selectedSubcategory === "non-randomized") {
      setBlindingType("open-label")
    }
  }, [selectedSubcategory])

  const renderCommonFields = () => (
    <>
      <div>
        <label htmlFor="intervention-details" className="block text-sm font-medium text-gray-700 mb-1">
          Intervention Details
          <Tooltip content="Describe the specific intervention(s) being tested in this study, including dosage, frequency, and duration if applicable." />
        </label>
        <textarea
          id="intervention-details"
          placeholder="E.g., Drug X, 10mg oral tablet, administered once daily for 12 weeks"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="treatment-duration" className="block text-sm font-medium text-gray-700 mb-1">
          Treatment Duration
          <Tooltip content="The planned duration of the intervention administration." />
        </label>
        <input
          type="text"
          id="treatment-duration"
          value={treatmentDuration}
          onChange={(e) => setTreatmentDuration(e.target.value)}
          placeholder="E.g., 12 weeks, 6 months, until disease progression"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="follow-up-duration" className="block text-sm font-medium text-gray-700 mb-1">
          Follow-up Duration
          <Tooltip content="The planned duration of participant follow-up after completion of the intervention." />
        </label>
        <input
          type="text"
          id="follow-up-duration"
          value={followUpDuration}
          onChange={(e) => setFollowUpDuration(e.target.value)}
          placeholder="E.g., 30 days, 6 months, 2 years"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="primary-endpoint" className="block text-sm font-medium text-gray-700 mb-1">
          Primary Endpoint
          <Tooltip content="The main outcome measure that will be used to determine the efficacy of the intervention." />
        </label>
        <textarea
          id="primary-endpoint"
          value={primaryEndpoint}
          onChange={(e) => setPrimaryEndpoint(e.target.value)}
          placeholder="E.g., Change in tumor size as measured by CT scan at 6 months"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="secondary-endpoints" className="block text-sm font-medium text-gray-700 mb-1">
          Secondary Endpoints
          <Tooltip content="Additional outcome measures that will be used to evaluate the intervention's effects." />
        </label>
        <textarea
          id="secondary-endpoints"
          value={secondaryEndpoints}
          onChange={(e) => setSecondaryEndpoints(e.target.value)}
          placeholder="E.g., Overall survival, quality of life scores, adverse event rates"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {selectedSubcategory !== "non-randomized" && (
        <>
          <div>
            <label htmlFor="randomization-method" className="block text-sm font-medium text-gray-700 mb-1">
              Randomization Method
              <Tooltip content="The method used to assign participants to treatment arms." />
            </label>
            <div className="relative">
              <select
                id="randomization-method"
                className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={randomizationMethod}
                onChange={(e) => setRandomizationMethod(e.target.value)}
              >
                <option value="" disabled>
                  Select randomization method
                </option>
                <option value="simple">Simple Randomization</option>
                <option value="block">Block Randomization</option>
                <option value="stratified">Stratified Randomization</option>
                <option value="adaptive">Adaptive Randomization</option>
                <option value="cluster">Cluster Randomization</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="randomization-ratio" className="block text-sm font-medium text-gray-700 mb-1">
              Randomization Ratio
              <Tooltip content="The proportion of participants assigned to each treatment arm." />
            </label>
            <input
              type="text"
              id="randomization-ratio"
              value={randomizationRatio}
              onChange={(e) => setRandomizationRatio(e.target.value)}
              placeholder="E.g., 1:1, 2:1, 1:1:1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor="blinding-type" className="block text-sm font-medium text-gray-700 mb-1">
          Blinding/Masking
          <Tooltip content="The extent to which participants, investigators, and/or outcome assessors are unaware of treatment assignment." />
        </label>
        <div className="relative">
          <select
            id="blinding-type"
            className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={blindingType}
            onChange={(e) => setBlindingType(e.target.value)}
          >
            <option value="" disabled>
              Select blinding type
            </option>
            <option value="open-label">Open Label (No Blinding)</option>
            <option value="single-blind">Single Blind</option>
            <option value="double-blind">Double Blind</option>
            <option value="triple-blind">Triple Blind</option>
            <option value="quadruple-blind">Quadruple Blind</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="control-type" className="block text-sm font-medium text-gray-700 mb-1">
          Control Type
          <Tooltip content="The type of control or comparison group used in the study." />
        </label>
        <div className="relative">
          <select
            id="control-type"
            className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={controlType}
            onChange={(e) => setControlType(e.target.value)}
          >
            <option value="" disabled>
              Select control type
            </option>
            <option value="placebo">Placebo Control</option>
            <option value="active">Active Comparator</option>
            <option value="standard">Standard of Care</option>
            <option value="dose-comparison">Dose Comparison</option>
            <option value="historical">Historical Control</option>
            <option value="no-control">No Control Group</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
          </div>
        </div>
      </div>
    </>
  )

  const renderSubcategorySpecificFields = () => {
    switch (selectedSubcategory) {
      case "traditional-rct":
        return (
          <div className="space-y-4 border p-4 rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800">Traditional RCT Details</h4>
            {renderCommonFields()}
          </div>
        )
      case "adaptive-trial":
        return (
          <div className="space-y-4 border p-4 rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800">Adaptive Trial Details</h4>
            {renderCommonFields()}

            <div>
              <label htmlFor="adaptive-features" className="block text-sm font-medium text-gray-700 mb-1">
                Adaptive Features
                <Tooltip content="Describe the specific adaptive design elements that will be used in this study." />
              </label>
              <textarea
                id="adaptive-features"
                placeholder="E.g., Interim analysis for sample size re-estimation at 50% enrollment, adaptive dose selection based on early efficacy data"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="interim-analysis" className="block text-sm font-medium text-gray-700 mb-1">
                Interim Analysis Plan
                <Tooltip content="Describe when interim analyses will be conducted and what decisions may be made based on results." />
              </label>
              <textarea
                id="interim-analysis"
                placeholder="E.g., Interim analyses planned after 30%, 50%, and 70% of participants complete the primary endpoint assessment. The DSMB will review results and make recommendations according to pre-specified decision rules."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="type1-error" className="block text-sm font-medium text-gray-700 mb-1">
                Type I Error Control
                <Tooltip content="Describe the statistical methods used to control the Type I error rate in the context of multiple analyses." />
              </label>
              <textarea
                id="type1-error"
                placeholder="E.g., The O'Brien-Fleming alpha spending function will be used to control the overall Type I error rate at 0.05 across all interim analyses."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="stopping-rules" className="block text-sm font-medium text-gray-700 mb-1">
                Stopping Rules
                <Tooltip content="Criteria for early termination of the study or treatment arms." />
              </label>
              <textarea
                id="stopping-rules"
                placeholder="E.g., The trial will be stopped for efficacy if p < 0.001 at the first interim analysis or p < 0.015 at the second interim analysis. The trial will be stopped for futility if the conditional power is less than 20%."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="adaptation-committee" className="block text-sm font-medium text-gray-700 mb-1">
                Adaptation Committee
                <Tooltip content="Describe the composition and role of the committee responsible for implementing adaptations." />
              </label>
              <textarea
                id="adaptation-committee"
                placeholder="E.g., An independent Data Safety Monitoring Board (DSMB) will review interim analysis results and make recommendations on trial adaptations. The committee includes experts in biostatistics, clinical trial methodology, and the therapeutic area."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      case "basket-trial":
        return (
          <div className="space-y-4 border p-4 rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800">Basket Trial Details</h4>
            {renderCommonFields()}

            <div>
              <label htmlFor="basket-details" className="block text-sm font-medium text-gray-700 mb-1">
                Basket Overview
                <Tooltip content="Describe the different tumor types or patient subgroups being evaluated with the same targeted therapy." />
              </label>
              <textarea
                id="basket-details"
                placeholder="E.g., The study will evaluate Drug X in patients with different tumor types that share the same molecular alteration (e.g., BRAF V600E mutation in melanoma, colorectal cancer, and non-small cell lung cancer)."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="biomarker-details" className="block text-sm font-medium text-gray-700 mb-1">
                Biomarker Details
                <Tooltip content="Describe the biomarker(s) used for patient selection, testing methods, and threshold for positivity." />
              </label>
              <textarea
                id="biomarker-details"
                placeholder="E.g., BRAF V600E mutation will be assessed using PCR-based testing of tumor tissue. A validated companion diagnostic (Brand X) will be used with a threshold of 5% tumor cells showing the mutation to determine positivity."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="cohort-management" className="block text-sm font-medium text-gray-700 mb-1">
                Cohort Management
                <Tooltip content="Describe how individual cohorts (baskets) will be managed in terms of enrollment, analysis, and decision-making." />
              </label>
              <textarea
                id="cohort-management"
                placeholder="E.g., Each tumor type will initially enroll 10 patients. Cohorts showing a response rate ≥30% will expand to 20 patients. Cohorts with 0 responses in the first 10 patients will be closed. A minimum of 5 evaluable patients is required for a cohort to be included in the final analysis."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="statistical-borrowing" className="block text-sm font-medium text-gray-700 mb-1">
                Statistical Borrowing Approach
                <Tooltip content="Describe any statistical methods used to borrow information across cohorts." />
              </label>
              <textarea
                id="statistical-borrowing"
                placeholder="E.g., A Bayesian hierarchical model will be used to borrow information across cohorts. Prior distributions for treatment effects will be centered at 0 with variance determined by similarity between tumor types based on pre-clinical data."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="adding-baskets" className="block text-sm font-medium text-gray-700 mb-1">
                Criteria for Adding New Baskets
                <Tooltip content="Describe the process and criteria for adding new tumor types or patient subgroups during the study." />
              </label>
              <textarea
                id="adding-baskets"
                placeholder="E.g., New tumor types with the target biomarker may be added via protocol amendment based on emerging preclinical or clinical data. Adding a new basket requires approval by the steering committee and relevant regulatory authorities."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      case "umbrella-trial":
        return (
          <div className="space-y-4 border p-4 rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800">Umbrella Trial Details</h4>
            {renderCommonFields()}

            <div>
              <label htmlFor="umbrella-details" className="block text-sm font-medium text-gray-700 mb-1">
                Umbrella Overview
                <Tooltip content="Describe the different targeted therapies being evaluated for different molecular subgroups within the same tumor type." />
              </label>
              <textarea
                id="umbrella-details"
                placeholder="E.g., The study will evaluate multiple targeted therapies in patients with non-small cell lung cancer: Drug A for EGFR mutations, Drug B for ALK rearrangements, and Drug C for ROS1 fusions."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="molecular-screening" className="block text-sm font-medium text-gray-700 mb-1">
                Molecular Screening Protocol
                <Tooltip content="Describe how patients will be screened for molecular alterations to determine eligibility for specific treatment arms." />
              </label>
              <textarea
                id="molecular-screening"
                placeholder="E.g., All patients will undergo next-generation sequencing (NGS) of tumor tissue using the XYZ panel that covers all genes of interest. Results are expected within 14 days of sample submission. Patients with actionable alterations will be assigned to the corresponding treatment arm."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="multiple-alterations" className="block text-sm font-medium text-gray-700 mb-1">
                Handling Multiple Alterations
                <Tooltip content="Describe how patients with multiple molecular alterations will be managed." />
              </label>
              <textarea
                id="multiple-alterations"
                placeholder="E.g., Patients with multiple actionable molecular alterations will be assigned to treatment arms based on a pre-specified hierarchy: 1) alterations with highest level of evidence for targetability, 2) alterations with available targeted therapies in the study, 3) investigator discretion based on the patient's prior treatment history."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="control-arm" className="block text-sm font-medium text-gray-700 mb-1">
                Control Arm Details
                <Tooltip content="Describe the control arm, if applicable, and how it will be used across different treatment arms." />
              </label>
              <textarea
                id="control-arm"
                placeholder="E.g., A common control arm of standard of care chemotherapy (platinum doublet) will serve as the comparator for all experimental arms. Randomization ratio will be 2:1 (experimental:control) for each treatment arm."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="arm-management" className="block text-sm font-medium text-gray-700 mb-1">
                Arm Addition/Removal Criteria
                <Tooltip content="Describe the criteria and process for adding or removing treatment arms during the study." />
              </label>
              <textarea
                id="arm-management"
                placeholder="E.g., Treatment arms may be added for newly identified molecular targets via protocol amendment. Arms will be closed if: 1) safety signals exceed pre-specified thresholds, 2) interim analysis shows futility (response rate <10% after 15 patients), or 3) a superior treatment becomes standard of care for the specific molecular subgroup."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="multiple-testing" className="block text-sm font-medium text-gray-700 mb-1">
                Multiple Testing Considerations
                <Tooltip content="Describe how the statistical analysis will account for multiple treatment arms and comparisons." />
              </label>
              <textarea
                id="multiple-testing"
                placeholder="E.g., Each treatment arm will be analyzed independently with its own type I error rate of 0.05. No adjustment for multiple testing will be made across arms since each represents a distinct treatment hypothesis in a different patient population."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      case "pragmatic-study":
        return (
          <div className="space-y-4 border p-4 rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800">Pragmatic Study Details</h4>
            {renderCommonFields()}

            <div>
              <label htmlFor="pragmatic-features" className="block text-sm font-medium text-gray-700 mb-1">
                Pragmatic Study Features
                <Tooltip content="Describe the aspects of the study design that make it more reflective of real-world clinical practice." />
              </label>
              <textarea
                id="pragmatic-features"
                placeholder="E.g., Broad inclusion criteria, minimal study-specific procedures, outcomes assessed through routine clinical care and electronic health records"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="real-world-setting" className="block text-sm font-medium text-gray-700 mb-1">
                Real-World Setting
                <Tooltip content="Describe how the study will be conducted in a setting that closely resembles routine clinical practice." />
              </label>
              <textarea
                id="real-world-setting"
                placeholder="E.g., The study will be conducted in community clinics and hospitals, using existing healthcare infrastructure and personnel. Treatment decisions will be made by patients and their healthcare providers as per usual care."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="data-collection" className="block text-sm font-medium text-gray-700 mb-1">
                Data Collection Methods
                <Tooltip content="Describe how data will be collected with minimal disruption to routine clinical care." />
              </label>
              <textarea
                id="data-collection"
                placeholder="E.g., Primary data collection will leverage existing electronic health records and claims databases. Patient-reported outcomes will be collected via a mobile app integrated with routine care visits."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      case "non-randomized":
        return (
          <div className="space-y-4 border p-4 rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800">Non-Randomized Study Details</h4>
            {renderCommonFields()}

            <div>
              <label htmlFor="allocation-method" className="block text-sm font-medium text-gray-700 mb-1">
                Allocation Method
                <Tooltip content="Describe how participants will be assigned to study groups without randomization." />
              </label>
              <textarea
                id="allocation-method"
                placeholder="E.g., Participants will be allocated to treatment groups based on clinician's choice, taking into account patient characteristics and preferences."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="bias-mitigation" className="block text-sm font-medium text-gray-700 mb-1">
                Bias Mitigation Strategies
                <Tooltip content="Describe methods to reduce potential biases inherent in non-randomized designs." />
              </label>
              <textarea
                id="bias-mitigation"
                placeholder="E.g., Propensity score matching will be used to balance baseline characteristics between groups. Outcome assessors will be blinded to treatment allocation where possible."
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
      <h3 className="text-lg font-medium text-gray-900">Interventional Study Details</h3>

      <div>
        <label htmlFor="study-phase" className="block text-sm font-medium text-gray-700 mb-1">
          Study Phase
          <Tooltip content="The phase of clinical research for this study, indicating its stage in the drug development process." />
        </label>
        <div className="relative">
          <select
            id="study-phase"
            className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={studyPhase}
            onChange={(e) => setStudyPhase(e.target.value)}
          >
            <option value="" disabled>
              Select study phase
            </option>
            <option value="phase-i">Phase I</option>
            <option value="phase-ii">Phase II</option>
            <option value="phase-iii">Phase III</option>
            <option value="phase-iv">Phase IV</option>
            <option value="phase-i-ii">Phase I/II</option>
            <option value="phase-ii-iii">Phase II/III</option>
            <option value="early-phase-i">Early Phase I</option>
            <option value="not-applicable">Not Applicable</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
          </div>
        </div>
      </div>

      {studyPhase === "phase-iv" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Is this a post-marketing regulatory commitment study?
            <Tooltip content="Indicates whether this study is being conducted to fulfill a regulatory requirement after the drug has been approved for marketing." />
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="post_marketing_commitment"
                value="yes"
                checked={isPostMarketingCommitment === true}
                onChange={() => setIsPostMarketingCommitment(true)}
                className="mr-2"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="post_marketing_commitment"
                value="no"
                checked={isPostMarketingCommitment === false}
                onChange={() => setIsPostMarketingCommitment(false)}
                className="mr-2"
              />
              <span>No</span>
            </label>
          </div>
        </div>
      )}

      {renderSubcategorySpecificFields()}
    </div>
  )
}

export default InterventionalForm

