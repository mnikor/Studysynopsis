"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { ChevronLeft } from "lucide-react"
import Tooltip from "./Tooltip"

type NonInterventionalFormProps = {
  selectedSubcategory: string
  isPostMarketingCommitment: boolean | null
  setIsPostMarketingCommitment: (value: boolean) => void
  onSubcategoryChange: (subcategory: string) => void
}

const NonInterventionalForm: React.FC<NonInterventionalFormProps> = ({
  selectedSubcategory,
  isPostMarketingCommitment,
  setIsPostMarketingCommitment,
  onSubcategoryChange,
}) => {
  const [selectedSecondaryType, setSelectedSecondaryType] = useState("")
  const [primaryDataStudyDesign, setPrimaryDataStudyDesign] = useState("")
  const [secondaryDataStudyDesign, setSecondaryDataStudyDesign] = useState("")
  const [dataCollectionMethodPlaceholder, setDataCollectionMethodPlaceholder] = useState("")
  const [temporalDesign, setTemporalDesign] = useState("")
  const [chartReviewStudyDesign, setChartReviewStudyDesign] = useState("")
  const [chartReviewDataSource, setChartReviewDataSource] = useState("")
  const [chartReviewTimeframe, setChartReviewTimeframe] = useState("")
  const [chartReviewSampleSize, setChartReviewSampleSize] = useState("")

  // Get description for data collection type
  const getDataCollectionTypeDescription = (type: string) => {
    switch (type) {
      case "primary-data":
        return "Data collected directly for the purpose of the study through mechanisms like surveys, interviews, or direct measurements from patients or populations."
      case "secondary-data":
        return "Use of pre-existing datasets collected for other purposes but repurposed for the current research objectives (e.g., electronic health records, claims databases, registries)."
      case "primary-and-secondary":
        return "A combination of newly collected data and analysis of existing datasets to address the research objectives."
      default:
        return ""
    }
  }

  const updateDataCollectionMethodPlaceholder = useCallback(() => {
    // Existing placeholder update logic...
    if (selectedSubcategory === "primary-data") {
      switch (primaryDataStudyDesign) {
        case "cohort":
          setDataCollectionMethodPlaceholder(
            "E.g., Prospective data collection through standardized questionnaires and medical examinations at baseline and follow-up visits every 6 months for 5 years.",
          )
          break
        case "case-control":
          setDataCollectionMethodPlaceholder(
            "E.g., Retrospective data collection through structured interviews and medical record reviews for cases and matched controls.",
          )
          break
        case "cross-sectional":
          setDataCollectionMethodPlaceholder(
            "E.g., One-time data collection using online surveys and optional health screenings for a representative sample of the target population.",
          )
          break
        default:
          setDataCollectionMethodPlaceholder(
            "E.g., Describe the specific techniques or processes you will use to gather data from study participants.",
          )
      }
    } else if (selectedSubcategory === "secondary-data") {
      switch (secondaryDataStudyDesign) {
        case "database":
          setDataCollectionMethodPlaceholder(
            "E.g., Extraction of relevant patient data from the National Health Insurance Claims Database for the period 2010-2020, including diagnoses, treatments, and outcomes.",
          )
          break
        case "chart":
          setDataCollectionMethodPlaceholder(
            "E.g., Systematic review of electronic health records from three major hospitals, focusing on patients diagnosed with Condition X between 2015-2019.",
          )
          break
        default:
          setDataCollectionMethodPlaceholder(
            "E.g., Describe the sources of secondary data and the methods for accessing and processing this data.",
          )
      }
    } else {
      setDataCollectionMethodPlaceholder(
        "E.g., Combination of prospective data collection through patient diaries and retrospective analysis of existing electronic health records.",
      )
    }
  }, [selectedSubcategory, primaryDataStudyDesign, secondaryDataStudyDesign])

  useEffect(() => {
    updateDataCollectionMethodPlaceholder()
  }, [updateDataCollectionMethodPlaceholder])

  const getStudyDesignDescription = (design: string) => {
    switch (design) {
      case "cohort":
        return "A study that follows a group of people over time to determine the incidence of an outcome. It can be prospective (following participants into the future) or retrospective (looking back at historical data)."
      case "case-control":
        return "A study that compares people with a specific outcome (cases) to people without that outcome (controls), often looking backwards in time to identify potential causes."
      case "case-series":
        return "A descriptive study that follows a group of patients with a similar diagnosis or treatment, without a comparison group."
      case "cross-sectional":
        return "A study that analyzes data from a population at a specific point in time, providing a 'snapshot' of the prevalence of a condition or characteristic."
      default:
        return ""
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Non-Interventional Study Details</h3>

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

      {selectedSubcategory === "primary-data" && (
        <div className="space-y-4">
          <div>
            <label htmlFor="temporal-design" className="block text-sm font-medium text-gray-700 mb-1">
              Temporal Design
              <Tooltip content="Indicates whether the study collects data looking forward in time, backward in time, or both." />
            </label>
            <div className="relative">
              <select
                id="temporal-design"
                className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={temporalDesign}
                onChange={(e) => setTemporalDesign(e.target.value)}
              >
                <option value="" disabled>
                  Select temporal design
                </option>
                <option value="prospective">Prospective</option>
                <option value="retrospective">Retrospective</option>
                <option value="prospective-and-retrospective">Prospective and Retrospective</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
              </div>
            </div>
            {temporalDesign && (
              <p className="mt-2 text-sm text-gray-600">
                {temporalDesign === "prospective" &&
                  "Data will be collected going forward from a specific point in time."}
                {temporalDesign === "retrospective" && "Data that has already been collected will be analyzed."}
                {temporalDesign === "prospective-and-retrospective" &&
                  "Both existing data and newly collected data will be used in the study."}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="primary-study-design" className="block text-sm font-medium text-gray-700 mb-1">
              Study Design
              <Tooltip content="The overall strategy chosen to integrate different components of the study in a coherent and logical way." />
            </label>
            <div className="relative">
              <select
                id="primary-study-design"
                className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={primaryDataStudyDesign}
                onChange={(e) => setPrimaryDataStudyDesign(e.target.value)}
              >
                <option value="" disabled>
                  Select study design
                </option>
                <option value="cohort">Cohort Study</option>
                <option value="case-control">Case-Control Study</option>
                <option value="cross-sectional">Cross-Sectional Study</option>
                <option value="case-series">Case Series</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
              </div>
            </div>
            {primaryDataStudyDesign && (
              <p className="mt-2 text-sm text-gray-600">{getStudyDesignDescription(primaryDataStudyDesign)}</p>
            )}
          </div>

          <div>
            <label htmlFor="data-collection-method" className="block text-sm font-medium text-gray-700 mb-1">
              Data Collection Method
              <Tooltip content="The specific technique or process used to gather data from study participants." />
            </label>
            <textarea
              id="data-collection-method"
              placeholder={dataCollectionMethodPlaceholder}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="centerType" className="block text-sm font-medium text-gray-700 mb-1">
              Center Type
              <Tooltip content="Indicates whether the study will be conducted at a single site or across multiple sites." />
            </label>
            <div className="relative">
              <select
                id="centerType"
                className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  Select center type
                </option>
                <option value="single-center">Single Center</option>
                <option value="multi-center">Multi-Center</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="geographicScope" className="block text-sm font-medium text-gray-700 mb-1">
              Geographic Scope
              <Tooltip content="Indicates whether the study will be conducted in a single country or across multiple countries." />
            </label>
            <div className="relative">
              <select
                id="geographicScope"
                className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  Select geographic scope
                </option>
                <option value="single-country">Single Country</option>
                <option value="multi-country">Multi-Country</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedSubcategory === "secondary-data" && (
        <div className="space-y-4">
          <div>
            <label htmlFor="secondary-subtype" className="block text-sm font-medium text-gray-700 mb-1">
              Secondary Data Subtype
              <Tooltip content="The specific type of secondary data analysis being conducted in this study." />
            </label>
            <div className="relative">
              <select
                id="secondary-subtype"
                className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedSecondaryType}
                onChange={(e) => setSelectedSecondaryType(e.target.value)}
              >
                <option value="" disabled>
                  Select subtype
                </option>
                <option value="database">Database Research</option>
                <option value="chart">Patient Chart Review</option>
                {/* Post-hoc analysis option has been removed */}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
              </div>
            </div>
          </div>

          {selectedSecondaryType === "database" && (
            <div className="space-y-4">
              <div>
                <label htmlFor="database-study-design" className="block text-sm font-medium text-gray-700 mb-1">
                  Study Design
                  <Tooltip content="Select the overall design for your database research study." />
                </label>
                <div className="relative">
                  <select
                    id="database-study-design"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={secondaryDataStudyDesign}
                    onChange={(e) => setSecondaryDataStudyDesign(e.target.value)}
                  >
                    <option value="" disabled>
                      Select study design
                    </option>
                    <option value="cohort">Cohort Study</option>
                    <option value="case-control">Case-Control Study</option>
                    <option value="cross-sectional">Cross-Sectional Study</option>
                    <option value="nested-case-control">Nested Case-Control Study</option>
                    <option value="case-crossover">Case-Crossover Study</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="databaseScope" className="block text-sm font-medium text-gray-700 mb-1">
                  Database Scope
                  <Tooltip content="Indicates whether the study will use a single database or multiple databases." />
                </label>
                <div className="relative">
                  <select
                    id="databaseScope"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      Select database scope
                    </option>
                    <option value="single-database">Single Database</option>
                    <option value="multiple-databases">Multiple Databases</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="database-sources" className="block text-sm font-medium text-gray-700 mb-1">
                  Database Sources
                  <Tooltip content="The specific databases or data sources that will be used in this study." />
                </label>
                <textarea
                  id="database-sources"
                  placeholder="E.g., IBM MarketScan Commercial Claims, Optum's de-identified Clinformatics® Data Mart, Medicare claims data"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="database-timeframe" className="block text-sm font-medium text-gray-700 mb-1">
                  Study Timeframe
                  <Tooltip content="Specify the time period covered by the database analysis." />
                </label>
                <input
                  type="text"
                  id="database-timeframe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="E.g., January 2015 to December 2020"
                />
              </div>

              <div>
                <label htmlFor="database-population" className="block text-sm font-medium text-gray-700 mb-1">
                  Study Population
                  <Tooltip content="Describe the key characteristics of the population included in the database study." />
                </label>
                <textarea
                  id="database-population"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="E.g., Adults aged 18-65 with a diagnosis of type 2 diabetes, excluding those with a history of cardiovascular disease"
                />
              </div>

              <div>
                <label htmlFor="database-variables" className="block text-sm font-medium text-gray-700 mb-1">
                  Key Variables
                  <Tooltip content="List the main variables or data elements that will be extracted from the database(s)." />
                </label>
                <textarea
                  id="database-variables"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="E.g., Demographics (age, sex, race), diagnoses (ICD-10 codes), medications (NDC codes), procedures (CPT codes), laboratory results"
                />
              </div>

              <div>
                <label htmlFor="database-analysis" className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Analysis Approach
                  <Tooltip content="Briefly describe the main statistical or analytical approach for the database study." />
                </label>
                <textarea
                  id="database-analysis"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="E.g., Multivariable Cox proportional hazards regression to assess the association between exposure and outcome, adjusting for potential confounders"
                />
              </div>
            </div>
          )}

          {selectedSecondaryType === "chart" && (
            <div className="space-y-4">
              <div>
                <label htmlFor="chart-review-study-design" className="block text-sm font-medium text-gray-700 mb-1">
                  Study Design
                  <Tooltip content="Select the overall design for your chart review study." />
                </label>
                <div className="relative">
                  <select
                    id="chart-review-study-design"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={chartReviewStudyDesign}
                    onChange={(e) => setChartReviewStudyDesign(e.target.value)}
                  >
                    <option value="" disabled>
                      Select study design
                    </option>
                    <option value="cohort">Cohort Study</option>
                    <option value="case-control">Case-Control Study</option>
                    <option value="cross-sectional">Cross-Sectional Study</option>
                    <option value="case-series">Case Series</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="chart-review-data-source" className="block text-sm font-medium text-gray-700 mb-1">
                  Data Source
                  <Tooltip content="Specify the source of the patient charts or medical records." />
                </label>
                <input
                  type="text"
                  id="chart-review-data-source"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={chartReviewDataSource}
                  onChange={(e) => setChartReviewDataSource(e.target.value)}
                  placeholder="E.g., Electronic Health Records from Hospital X"
                />
              </div>

              <div>
                <label htmlFor="chart-review-timeframe" className="block text-sm font-medium text-gray-700 mb-1">
                  Study Timeframe
                  <Tooltip content="Specify the time period covered by the chart review." />
                </label>
                <input
                  type="text"
                  id="chart-review-timeframe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={chartReviewTimeframe}
                  onChange={(e) => setChartReviewTimeframe(e.target.value)}
                  placeholder="E.g., January 2015 to December 2020"
                />
              </div>

              <div>
                <label htmlFor="chart-review-sample-size" className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Sample Size
                  <Tooltip content="Provide an estimate of the number of patient charts to be reviewed." />
                </label>
                <input
                  type="number"
                  id="chart-review-sample-size"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={chartReviewSampleSize}
                  onChange={(e) => setChartReviewSampleSize(e.target.value)}
                  placeholder="E.g., 500"
                />
              </div>

              <div>
                <label htmlFor="chart-review-data-collection" className="block text-sm font-medium text-gray-700 mb-1">
                  Data Collection Method
                  <Tooltip content="Describe how data will be extracted from the patient charts." />
                </label>
                <textarea
                  id="chart-review-data-collection"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="E.g., Two trained researchers will independently extract data using a standardized form. Discrepancies will be resolved by consensus or a third reviewer."
                />
              </div>
            </div>
          )}
        </div>
      )}

      {selectedSubcategory === "primary-and-secondary" && (
        <div className="space-y-4">
          <div>
            <label htmlFor="mixed-data-approach" className="block text-sm font-medium text-gray-700 mb-1">
              Mixed Data Approach
              <Tooltip content="Describe how primary and secondary data collection methods will be combined in this study." />
            </label>
            <textarea
              id="mixed-data-approach"
              placeholder={dataCollectionMethodPlaceholder}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="centerType" className="block text-sm font-medium text-gray-700 mb-1">
              Center Type
              <Tooltip content="Indicates whether the study will be conducted at a single site or across multiple sites." />
            </label>
            <div className="relative">
              <select
                id="centerType"
                className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  Select center type
                </option>
                <option value="single-center">Single Center</option>
                <option value="multi-center">Multi-Center</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NonInterventionalForm

