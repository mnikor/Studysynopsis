"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Tooltip from "./Tooltip"

type NonClinicalFormProps = {
  selectedSubcategory: string
}

const NonClinicalForm: React.FC<NonClinicalFormProps> = ({ selectedSubcategory }) => {
  const [experimentalSystemPlaceholder, setExperimentalSystemPlaceholder] = useState("")
  const [experimentalDetailsPlaceholder, setExperimentalDetailsPlaceholder] = useState("")

  useEffect(() => {
    // Update placeholders based on selected subcategory
    switch (selectedSubcategory) {
      case "in-vitro":
        setExperimentalSystemPlaceholder("E.g., Human hepatocyte cell line HepG2, primary human T cells, etc.")
        setExperimentalDetailsPlaceholder("E.g., Cell culture conditions, treatment protocols, incubation times, etc.")
        break
      case "in-vivo":
        setExperimentalSystemPlaceholder("E.g., C57BL/6 mice, Sprague-Dawley rats, non-human primates, etc.")
        setExperimentalDetailsPlaceholder(
          "E.g., Animal housing conditions, dosing regimens, sample collection schedules, etc.",
        )
        break
      case "ex-vivo":
        setExperimentalSystemPlaceholder("E.g., Human tissue samples from surgical resection, blood samples, etc.")
        setExperimentalDetailsPlaceholder(
          "E.g., Tissue processing methods, culture conditions, treatment protocols, etc.",
        )
        break
      case "in-silico":
        setExperimentalSystemPlaceholder("E.g., Molecular docking simulations, PBPK modeling, etc.")
        setExperimentalDetailsPlaceholder("E.g., Software versions, parameter settings, simulation conditions, etc.")
        break
      default:
        setExperimentalSystemPlaceholder("E.g., Describe the biological system or model used in this study")
        setExperimentalDetailsPlaceholder(
          "E.g., Describe the key experimental procedures and methods used in this non-clinical study",
        )
    }
  }, [selectedSubcategory])

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Non-Clinical Study Details</h3>

      <div>
        <label htmlFor="experimental-system" className="block text-sm font-medium text-gray-700 mb-1">
          Experimental System/Model
          <Tooltip content="Describe the biological system, model organism, or computational approach used in this study." />
        </label>
        <textarea
          id="experimental-system"
          placeholder={experimentalSystemPlaceholder}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="experimental-details" className="block text-sm font-medium text-gray-700 mb-1">
          Experimental Details
          <Tooltip content="Describe the key experimental procedures and methods used in this non-clinical study." />
        </label>
        <textarea
          id="experimental-details"
          placeholder={experimentalDetailsPlaceholder}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {selectedSubcategory === "in-vitro" && (
        <div>
          <label htmlFor="cell-culture-conditions" className="block text-sm font-medium text-gray-700 mb-1">
            Cell Culture Conditions
            <Tooltip content="Describe the specific conditions used for cell culture, including media, supplements, and growth conditions." />
          </label>
          <textarea
            id="cell-culture-conditions"
            placeholder="E.g., Cells were cultured in DMEM supplemented with 10% FBS, 1% penicillin/streptomycin at 37°C with 5% CO2."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {selectedSubcategory === "in-vivo" && (
        <>
          <div>
            <label htmlFor="animal-ethics" className="block text-sm font-medium text-gray-700 mb-1">
              Ethical Considerations
              <Tooltip content="Describe the animal welfare considerations, ethical approval, and compliance with guidelines for animal research." />
            </label>
            <textarea
              id="animal-ethics"
              placeholder="E.g., All procedures were approved by the Institutional Animal Care and Use Committee (IACUC) and comply with local and national guidelines for animal welfare."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="sample-size" className="block text-sm font-medium text-gray-700 mb-1">
              Sample Size Justification
              <Tooltip content="Explain how the sample size was determined and why it is sufficient for the study objectives." />
            </label>
            <textarea
              id="sample-size"
              placeholder="E.g., Sample size was calculated based on previous studies with similar endpoints, aiming for 80% power to detect a 20% difference between groups at a significance level of 0.05."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {selectedSubcategory === "ex-vivo" && (
        <div>
          <label htmlFor="tissue-processing" className="block text-sm font-medium text-gray-700 mb-1">
            Tissue Processing Methods
            <Tooltip content="Describe the methods used to process and maintain the ex vivo tissue samples." />
          </label>
          <textarea
            id="tissue-processing"
            placeholder="E.g., Tissue samples were processed within 2 hours of collection. Samples were sliced into 300μm sections using a vibratome and maintained in oxygenated artificial cerebrospinal fluid."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {selectedSubcategory === "in-silico" && (
        <div>
          <label htmlFor="computational-methods" className="block text-sm font-medium text-gray-700 mb-1">
            Computational Methods
            <Tooltip content="Describe the algorithms, software packages, and computational resources used in this study." />
          </label>
          <textarea
            id="computational-methods"
            placeholder="E.g., Molecular docking was performed using AutoDock Vina v1.2.0. Molecular dynamics simulations were conducted using GROMACS 2021.1 with the CHARMM36 force field."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div>
        <label htmlFor="endpoint-measurements" className="block text-sm font-medium text-gray-700 mb-1">
          Endpoint Measurements
          <Tooltip content="Describe the specific measurements, assays, or analytical methods used to assess outcomes in this study." />
        </label>
        <textarea
          id="endpoint-measurements"
          placeholder="E.g., Cell viability was assessed using MTT assay. Gene expression was quantified by qRT-PCR. Protein levels were measured by western blot."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="statistical-analysis" className="block text-sm font-medium text-gray-700 mb-1">
          Statistical Analysis Plan
          <Tooltip content="Describe the statistical methods that will be used to analyze the data from this study." />
        </label>
        <textarea
          id="statistical-analysis"
          placeholder="E.g., Data will be analyzed using GraphPad Prism 9.0. Differences between groups will be assessed using one-way ANOVA followed by Tukey's post-hoc test. P values < 0.05 will be considered statistically significant."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="quality-control" className="block text-sm font-medium text-gray-700 mb-1">
          Quality Control Measures
          <Tooltip content="Describe the measures taken to ensure the quality and reproducibility of the study results." />
        </label>
        <textarea
          id="quality-control"
          placeholder="E.g., All experiments were performed in triplicate. Positive and negative controls were included in each assay. Blinding was used during data analysis to minimize bias."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}

export default NonClinicalForm

