## Primary Categories and Subcategories

The form has four primary research categories:

1. Interventional
2. Non-Interventional
3. Non-clinical
4. Evidence Synthesis

Each category has its own set of subcategories and specific fields. Let's break them down:

### 1. Interventional

Subcategories:

- Traditional RCT
- Pragmatic Study
- Adaptive Trial
- Basket Trial
- Umbrella Trial
- Non-Randomized Study

### 2. Non-Interventional

Subcategories:

- Primary Data Collection
- Secondary Data Analysis
- Primary and Secondary

### 3. Non-clinical

Subcategories:

- In Vitro
- In Vivo
- Ex Vivo
- In Silico

### 4. Evidence Synthesis

Subcategories:

- Systematic Review
- Meta-Analysis
- Network Meta-Analysis
- MAIC
- IPD Analysis
- Post-hoc Analysis

## Field Structure

Here's a table showing the fields that appear for each category and subcategory:

| Category | Subcategory | Fields |
| --- | --- | --- |
| All | N/A | - Study name`<br>`- Research category`<br>`- Primary Research Objective`<br>`- Secondary Research Objectives (optional)`<br>`- Exploratory Objectives (optional) |
| Interventional | All | - Study Phase`<br>`- Post-marketing regulatory commitment study (for Phase IV)`<br>`- Trial Type`<br>`- Intervention Details`<br>`- Treatment Duration`<br>`- Follow-up Duration`<br>`- Primary Endpoint`<br>`- Secondary Endpoints`<br>`- Blinding/Masking`<br>`- Control Type |
| Interventional | Traditional RCT, Adaptive Trial, Basket Trial, Umbrella Trial | - Randomization Method`<br>`- Randomization Ratio |
| Interventional | Adaptive Trial | - Adaptive Features`<br>`- Interim Analysis Plan`<br>`- Type I Error Control`<br>`- Stopping Rules`<br>`- Adaptation Committee |
| Interventional | Basket Trial | - Basket Overview`<br>`- Biomarker Details`<br>`- Cohort Management`<br>`- Statistical Borrowing Approach`<br>`- Criteria for Adding New Baskets |
| Interventional | Umbrella Trial | - Umbrella Overview`<br>`- Molecular Screening Protocol`<br>`- Handling Multiple Alterations`<br>`- Control Arm Details`<br>`- Arm Addition/Removal Criteria`<br>`- Multiple Testing Considerations |
| Interventional | Pragmatic Study | - Pragmatic Study Features`<br>`- Real-World Setting`<br>`- Data Collection Methods |
| Interventional | Non-Randomized | - Allocation Method`<br>`- Bias Mitigation Strategies |
| Non-Interventional | All | - Post-marketing regulatory commitment study |
| Non-Interventional | Primary Data Collection | - Temporal Design`<br>`- Study Design`<br>`- Data Collection Method`<br>`- Center Type`<br>`- Geographic Scope |
| Non-Interventional | Secondary Data Analysis | - Secondary Data Subtype (Database Research or Patient Chart Review)`<br>`- Study Design`<br>`- Database Scope (for Database Research)`<br>`- Database Sources (for Database Research)`<br>`- Study Timeframe`<br>`- Study Population`<br>`- Key Variables`<br>`- Primary Analysis Approach |
| Non-Interventional | Primary and Secondary | - Mixed Data Approach`<br>`- Center Type |
| Non-clinical | All | - Experimental System/Model`<br>`- Experimental Details`<br>`- Endpoint Measurements`<br>`- Statistical Analysis Plan`<br>`- Quality Control Measures |
| Non-clinical | In Vitro | - Cell Culture Conditions |
| Non-clinical | In Vivo | - Ethical Considerations`<br>`- Sample Size Justification |
| Non-clinical | Ex Vivo | - Tissue Processing Methods |
| Non-clinical | In Silico | - Computational Methods |
| Evidence Synthesis | All | - Outcome Measure |
| Evidence Synthesis | Systematic Review | - Screening Process`<br>`- Data Extraction Method`<br>`- Narrative Synthesis Approach |
| Evidence Synthesis | Meta-Analysis | - Effect Measure`<br>`- Statistical Model`<br>`- Planned Subgroup Analyses`<br>`- Planned Sensitivity Analyses |
| Evidence Synthesis | Network Meta-Analysis | - Analysis Type`<br>`- Network Geometry`<br>`- Consistency Assessment`<br>`- Treatment Ranking Method`<br>`- Transitivity Assessment |
| Evidence Synthesis | MAIC | - Indirect Comparison Method`<br>`- Individual Patient Data Source`<br>`- Comparator Data Source`<br>`- Matching Variables`<br>`- Weighting Method |
| Evidence Synthesis | IPD Analysis | - Individual Patient Data Acquisition`<br>`- Data Harmonization Process`<br>`- Analysis Approach`<br>`- Missing Data Handling`<br>`- Individual-Level Covariates`<br>`- Data Validation Procedures |
| Evidence Synthesis | Post-hoc Analysis | - Original Study Details`<br>`- Original Study Objectives`<br>`- New Hypothesis`<br>`- Rationale for Post-hoc Analysis`<br>`- Subgroup Definition`<br>`- Endpoints for Post-hoc Analysis`<br>`- Statistical Methods`<br>`- Multiplicity Adjustment`<br>`- Limitations and Considerations |

## Conditional Rendering Logic

The form uses conditional rendering based on the selected category and subcategory. This is primarily handled in the `renderCategoryForm` function, which returns the appropriate form component based on the `selectedCategory`:

- Interventional: `InterventionalForm`
- Non-Interventional: `NonInterventionalForm`
- Non-clinical: `NonClinicalForm`
- Evidence Synthesis: `EvidenceSynthesisForm`

Each of these form components further conditionally renders fields based on the `selectedSubcategory`.

## Special Components and Features

1. **Tooltip**: A custom `Tooltip` component is used throughout the form to provide additional information for each field.
2. **Advanced Details**: An expandable section for optional advanced details, toggled by the `showAdvancedDetails` state.
3. **Study Arms / Cohorts**: For Interventional studies, users can add multiple study arms. For Non-Interventional studies with primary data collection, users can add multiple cohorts.
4. **Dynamic Placeholders**: The placeholders for research objectives change based on the selected category and subcategory, providing relevant examples to the user.

## Form Validation

Basic form validation is implemented in the `validateForm` function. Currently, it checks if the primary research objective is filled and if a secondary data subtype is selected for non-interventional secondary data analysis studies.
