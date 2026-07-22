import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import GFRPanel from './GFRPanel';

const gfrConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'sex',
      label: 'Sex',
      type: 'select',
      required: true,
      helpText: 'The 2021 CKD-EPI equation uses different coefficients for males and females',
      options: [
        { label: 'Female', value: 'female' },
        { label: 'Male', value: 'male' },
      ],
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      placeholder: '50',
      unit: 'years',
      min: 18,
      max: 120,
      step: 1,
      required: true,
      helpText: 'eGFR naturally declines with age — the equation factors this in',
    },
    {
      id: 'creatinine',
      label: 'Serum Creatinine',
      type: 'number',
      placeholder: '1.0',
      min: 0.1,
      max: 20,
      step: 0.01,
      required: true,
      helpText: 'In mg/dL — check your lab results for SCr value',
    },
    {
      id: 'creatinineUnit',
      label: 'Creatinine Unit',
      type: 'select',
      options: [
        { label: 'mg/dL (standard US)', value: 'mgdl' },
        { label: 'μmol/L (standard SI)', value: 'umol' },
      ],
      required: true,
      helpText: 'Most US labs report in mg/dL. SI units use μmol/L.',
    },
  ],
  calculate: (values) => {
    const sex = values.sex || 'male';
    const age = parseFloat(values.age);
    const creatinineUnit = values.creatinineUnit || 'mgdl';

    let scr = parseFloat(values.creatinine);
    if (isNaN(scr) || scr <= 0 || isNaN(age) || age < 18) return [];

    // Convert μmol/L to mg/dL if needed (1 mg/dL = 88.42 μmol/L)
    if (creatinineUnit === 'umol') {
      scr = scr / 88.42;
    }

    // 2021 CKD-EPI equation (race-free)
    const kappa = sex === 'female' ? 0.7 : 0.9;
    const alpha = sex === 'female' ? -0.241 : -0.302;
    const sexFactor = sex === 'female' ? 1.012 : 1;

    const scrRatio = scr / kappa;
    const minVal = Math.min(scrRatio, 1);
    const maxVal = Math.max(scrRatio, 1);

    const egfr = 142 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.200) * Math.pow(0.9938, age) * sexFactor;

    // CKD staging
    const getStage = (e: number): { stage: string; label: string; color: 'positive' | 'neutral' | 'negative' } => {
      if (e >= 90) return { stage: 'Stage 1', label: 'Normal or high kidney function', color: 'positive' };
      if (e >= 60) return { stage: 'Stage 2', label: 'Mildly decreased kidney function', color: 'positive' };
      if (e >= 45) return { stage: 'Stage 3a', label: 'Mildly to moderately decreased', color: 'neutral' };
      if (e >= 30) return { stage: 'Stage 3b', label: 'Moderately to severely decreased', color: 'neutral' };
      if (e >= 15) return { stage: 'Stage 4', label: 'Severely decreased kidney function', color: 'negative' };
      return { stage: 'Stage 5', label: 'Kidney failure', color: 'negative' };
    };

    const stage = getStage(egfr);
    const fmtEgfr = egfr.toFixed(1);

    return [
      {
        id: 'egfr',
        label: 'eGFR (2021 CKD-EPI)',
        value: `${fmtEgfr} mL/min/1.73m²`,
        highlight: true,
        color: stage.color,
        interpretation: egfr >= 90
          ? `An eGFR of ${fmtEgfr} falls in the normal range (90+). Kidney function naturally declines roughly 1 mL/min per year after age 40, so a value like this at age ${Math.round(age)} suggests healthy filtration. A single reading is not a diagnosis — CKD staging also requires urine albumin and at least 3 months of consistent results.`
          : egfr >= 60
          ? `An eGFR of ${fmtEgfr} (60–89) is common ${age >= 60 ? 'at your age and often reflects normal age-related decline rather than disease' : 'and only indicates kidney disease if accompanied by other markers like protein in the urine'}. Doctors look for a confirmed trend over 3+ months, not one value.`
          : egfr >= 30
          ? `An eGFR of ${fmtEgfr} indicates moderately reduced filtration (Stage ${egfr >= 45 ? '3a' : '3b'}). At this level, guidelines recommend discussing the result with a doctor — typical follow-ups include a urine albumin test, blood pressure review, and medication dose checks, since many drugs need adjustment below 60.`
          : `An eGFR of ${fmtEgfr} indicates severely reduced kidney function. This range warrants prompt medical attention — a nephrologist can confirm with additional testing and discuss treatment options. Lab error and temporary factors (dehydration, recent intense exercise, certain medications) can lower a single reading.`,
      },
      {
        id: 'ckdStage',
        label: 'CKD Stage',
        value: `${stage.stage} — ${stage.label}`,
        color: stage.color,
      },
      {
        id: 'kidneyFunction',
        label: 'Kidney Function Level',
        value: egfr >= 90 ? 'Normal function' : egfr >= 60 ? 'Mildly reduced' : egfr >= 30 ? 'Moderately reduced' : 'Severely reduced',
        color: stage.color,
      },
      {
        id: 'formulaUsed',
        label: 'Formula',
        value: '2021 CKD-EPI Creatinine Equation (race-free)',
        color: 'neutral',
      },
      {
        id: 'medicalDisclaimer',
        label: 'Important Medical Notice',
        value: 'This eGFR is an estimate. Clinical decisions should consider the full clinical context including trends over time, other lab values, and patient history. Confirm with a healthcare provider.',
        color: 'negative',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(GFRPanel, { values, results });
  },
  educational: {
    formula: 'eGFR = 142 × min(SCr/κ, 1)^α × max(SCr/κ, 1)^(-1.200) × 0.9938^Age × (1.012 if female)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">CKD Stages by eGFR</text><rect x="30" y="60" width="380" height="50" rx="4" fill="var(--svg-eeeeee)"/><rect x="30" y="60" width="114" height="50" rx="4" fill="var(--svg-22c55e)" opacity=".4"/><text x="87" y="90" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-22c55e)">S1</text><rect x="144" y="60" width="76" height="50" fill="var(--svg-22c55e)" opacity=".3"/><text x="182" y="90" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-22c55e)">S2</text><rect x="220" y="60" width="76" height="50" fill="var(--svg-f59e0b)" opacity=".4"/><text x="258" y="90" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-f59e0b)">S3a/3b</text><rect x="296" y="60" width="57" height="50" fill="var(--svg-ef4444)" opacity=".4"/><text x="324" y="90" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ef4444)">S4</text><rect x="353" y="60" width="57" height="50" rx="4" fill="var(--svg-ef4444)" opacity=".6"/><text x="381" y="90" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ef4444)">S5</text><text x="87" y="130" text-anchor="middle" font-size="9" fill="var(--svg-666666)">&ge;90</text><text x="182" y="130" text-anchor="middle" font-size="9" fill="var(--svg-666666)">60-89</text><text x="258" y="130" text-anchor="middle" font-size="9" fill="var(--svg-666666)">30-59</text><text x="324" y="130" text-anchor="middle" font-size="9" fill="var(--svg-666666)">15-29</text><text x="381" y="130" text-anchor="middle" font-size="9" fill="var(--svg-666666)">&lt;15</text></svg>',
      alt: 'Five-stage CKD progression bar from Stage 1 (eGFR >=90) through Stage 5 (eGFR <15) with color gradient from green to red',
      caption: 'CKD-EPI 2021 equation estimates eGFR from serum creatinine, age, and sex without race coefficient',
    },
    formulaDescription:
      'The 2021 CKD-EPI equation estimates glomerular filtration rate from serum creatinine without a race coefficient. The original 2009 and 2012 equations included a race factor that was removed in 2021 when evidence showed it systematically overestimated kidney function in Black patients, potentially delaying care.',
    formulaSource: '2021 CKD-EPI Creatinine Equation — developed by the Chronic Kidney Disease Epidemiology Collaboration, published in the New England Journal of Medicine (Inker et al., 2021), and recommended as the clinical standard by the National Kidney Foundation and the American Society of Nephrology.',
    quickReference: [
      { label: 'eGFR ≥ 90', value: 'Stage 1 — normal or high' },
      { label: 'eGFR 60–89', value: 'Stage 2 — mildly decreased' },
      { label: 'eGFR 45–59', value: 'Stage 3a — mild to moderate' },
      { label: 'eGFR 30–44', value: 'Stage 3b — moderate to severe' },
      { label: 'eGFR 15–29', value: 'Stage 4 — severely decreased' },
      { label: 'eGFR < 15', value: 'Stage 5 — kidney failure' },
      { label: 'CKD diagnosis', value: 'eGFR < 60 for 3+ months' },
    ],
    workedExamples: [
      {
        scenario: 'A 45-year-old woman with serum creatinine of 0.8 mg/dL',
        inputs: { creatinine: '0.8', age: '45', sex: 'female', creatinineUnit: 'mgdl' },
        result: 'eGFR ≈ 102 mL/min/1.73m² — Stage 1',
        insight: 'Creatinine of 0.8 is comfortably within the normal female range (0.6–1.1 mg/dL), and at 45 the age penalty (0.9938^45 ≈ 0.76 of the base value) still leaves filtration in the normal band.',
      },
      {
        scenario: 'A 70-year-old man with serum creatinine of 1.3 mg/dL',
        inputs: { creatinine: '1.3', age: '70', sex: 'male', creatinineUnit: 'mgdl' },
        result: 'eGFR ≈ 57 mL/min/1.73m² — Stage 3a',
        insight: 'The same creatinine in a 40-year-old would produce an eGFR near 69. Age drives much of the difference, which is why doctors interpret borderline values like this in context — and confirm with a repeat test and urine albumin before diagnosing CKD.',
      },
      {
        scenario: 'A 30-year-old male bodybuilder with creatinine of 1.4 mg/dL',
        inputs: { creatinine: '1.4', age: '30', sex: 'male', creatinineUnit: 'mgdl' },
        result: 'eGFR ≈ 66 mL/min/1.73m² — appears Stage 2',
        insight: 'High muscle mass produces more creatinine, deflating the eGFR estimate without any kidney problem. This is a textbook case for a confirmatory cystatin C test, which is independent of muscle mass.',
      },
    ],
    proTips: [
      'Hydrate normally before your blood draw — dehydration concentrates creatinine and can knock 5–10 points off your eGFR.',
      'Avoid intense exercise for 48 hours and large protein/creatine doses for 24 hours before testing; both temporarily raise creatinine.',
      'Track your trend, not single values. Print or save this result and compare against your next lab — a stable 75 matters less than a 90→75→62 decline.',
      'If you take NSAIDs (ibuprofen, naproxen) regularly, mention it when discussing your eGFR — they reduce kidney blood flow and lower the reading.',
      'Ask your lab for a urine albumin-to-creatinine ratio (uACR) alongside eGFR — CKD staging requires both, and uACR often catches damage before eGFR drops.',
    ],
    limitations: [
      'This calculator uses the creatinine-only 2021 CKD-EPI equation. It is less accurate at extremes of muscle mass (bodybuilders, amputees, frail elderly, paralysis) — a cystatin C-based estimate is preferred in those cases.',
      'eGFR is normalized to a standard 1.73m² body surface area; for drug dosing at very high or low body sizes, clinicians may de-normalize the value.',
      'The equation is validated for adults 18+ only. Pediatric GFR uses the separate Bedside Schwartz equation.',
      'A single eGFR cannot diagnose CKD — diagnosis requires reduced eGFR or kidney damage markers persisting for at least 3 months.',
      'Results are unreliable during acute kidney injury, pregnancy, or rapidly changing creatinine — the equation assumes steady-state kidney function.',
    ],
    variables: [
      { symbol: 'SCr', name: 'Serum Creatinine', description: 'A waste product from muscle metabolism. Elevated levels indicate reduced kidney filtration.' },
      { symbol: 'κ (kappa)', name: 'Sex-specific coefficient', description: '0.7 for females, 0.9 for males. Adjusts the creatinine ratio by sex.' },
      { symbol: 'eGFR', name: 'Estimated Glomerular Filtration Rate', description: 'Volume of blood filtered per minute, normalized to 1.73m² body surface area. The standard measure of kidney function.' },
      { symbol: 'CKD Stage', name: 'Chronic Kidney Disease Stage', description: 'Stage 1 (≥90) through Stage 5 (<15). Lower eGFR = more advanced disease.' },
      { symbol: 'Age', name: 'Age (years)', description: 'eGFR naturally declines with age. The formula applies a 0.9938^Age factor, meaning eGFR decreases ~0.6% per year even without kidney disease.' },
    ],
    howToUse: [
      'Enter your serum creatinine value from a recent lab test.',
      'Select the correct unit (mg/dL is standard in the US, μmol/L in most other countries).',
      'Enter your age and sex.',
      'Review your eGFR and CKD stage.',
      'Discuss results with your healthcare provider — this is a screening estimate, not a diagnosis.',
    ],
    explanation:
      'The Glomerular Filtration Rate (GFR) is the best overall measure of kidney function. The 2021 CKD-EPI equation is the current clinical standard recommended by the National Kidney Foundation and the American Society of Nephrology. It replaced older equations that included race coefficients, which were found to overestimate GFR in Black individuals and contribute to disparities in kidney disease diagnosis and treatment. eGFR below 60 mL/min/1.73m² for 3+ months indicates chronic kidney disease. An eGFR of 15 or lower indicates kidney failure, requiring dialysis or transplant consideration. eGFR is affected by age (declines naturally after ~40), hydration status, muscle mass, certain medications, and acute illness — a single abnormal result should be confirmed with repeat testing. For example, a 65-year-old with an eGFR of 68 might be experiencing normal age-related decline rather than kidney disease, while a 30-year-old with the same eGFR would likely need further investigation. Serum creatinine, the lab value used in the equation, is itself affected by muscle mass: a bodybuilder may have elevated creatinine (and thus appear to have lower eGFR) simply because they have more muscle mass producing more creatinine as a metabolic waste product. This is why cystatin C-based GFR estimates are sometimes used as a confirmatory test in people with very high or very low muscle mass. Other factors that can temporarily lower eGFR include dehydration, high-protein meals before blood draws, recent strenuous exercise, and certain medications like NSAIDs (ibuprofen, naproxen) and ACE inhibitors.',
    faqs: [
      {
        question: 'Why was the race coefficient removed from GFR equations?',
        answer: 'The race coefficient was removed in 2021 after studies showed it systematically overestimated GFR in Black patients, leading to delayed diagnosis of chronic kidney disease, lower transplant referral rates, and worse outcomes. The 2021 CKD-EPI equation is race-free and provides more equitable care.',
      },
      {
        question: 'What is a normal eGFR?',
        answer: 'An eGFR of 90 mL/min/1.73m² or above is considered normal. However, eGFR naturally declines with age — a value of 75 in a 70-year-old may be normal aging rather than disease. A single eGFR reading should be interpreted in context of your age, trends over time, and other health factors.',
      },
      {
        question: 'What happens at each CKD stage?',
        answer: 'Stage 1–2: Often asymptomatic, managed with monitoring and lifestyle. Stage 3: Begin seeing a nephrologist, manage blood pressure and protein intake. Stage 4: Prepare for renal replacement therapy (dialysis or transplant). Stage 5: Kidney failure — dialysis or transplant is needed. Early detection significantly improves outcomes.',
      },
    ],
    commonUses: [
      'Kidney disease screening — use eGFR from the 2021 CKD-EPI race-free equation to assess kidney function and detect early-stage chronic kidney disease',
      'CKD staging and monitoring — track eGFR trends over time to determine CKD stage and guide treatment planning with a nephrologist',
      'Medication safety review — healthcare providers check eGFR before prescribing renally cleared medications (e.g., metformin, some antibiotics) to adjust dosing appropriately',
      'Pre-operative assessment — eGFR is routinely checked before surgery to assess kidney function and anesthetic risk, especially in patients with diabetes or hypertension'
    ],
  
    citations: [
      { source: 'National Kidney Foundation - eGFR', url: 'https://www.kidney.org/professionals/kdoqi/gfr_calculator' },
      { source: 'NIH - NIDDK Kidney Disease', url: 'https://www.niddk.nih.gov/health-information/kidney-disease' },
    ],
  },
};

export default gfrConfig;
