import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import BSAPanel from './BSAPanel';
import { fixed2 as fmt } from '../../../lib/format';

const bsaConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'unit',
      label: 'Unit System',
      type: 'select',
      required: true,
      helpText: 'Choose Imperial (lbs, ft/in) or Metric (kg, cm) for your measurements',
      options: [
        { label: 'Imperial (lbs, ft & in)', value: 'imperial' },
        { label: 'Metric (kg, cm)', value: 'metric' },
      ],
    },
    {
      id: 'weight',
      label: 'Weight',
      type: 'number',
      placeholder: '170',
      min: 2,
      max: 1500,
      step: 0.1,
      required: true,
      inputMode: 'decimal',
      helpText: 'Pounds (lbs) for Imperial or Kilograms (kg) for Metric',
    },
    {
      id: 'heightFt',
      label: 'Height — Feet',
      type: 'number',
      placeholder: '5',
      unit: 'ft',
      min: 1,
      max: 8,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Imperial only — feet portion',
    },
    {
      id: 'heightIn',
      label: 'Height — Inches',
      type: 'number',
      placeholder: '10',
      unit: 'in',
      min: 0,
      max: 11,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Imperial only — remaining inches (0–11)',
    },
    {
      id: 'heightCm',
      label: 'Height — Centimeters',
      type: 'number',
      placeholder: '178',
      unit: 'cm',
      min: 40,
      max: 275,
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'Metric only',
    },
  ],
  explainSteps: (values) => {
    // Guard: a runaway input (e.g. 1e999) must never print NaN/Infinity in a worked solution.
    const steps = (() => {
        const results = bsaConfig.calculate(values);
        if (!results.length) return [];
        const unit = values.unit || 'imperial';
        const val = (id: string) => results.find((r) => r.id === id)!.value;
        const input = parseFloat(values.weight);

        let weightKg: number;
        let heightCm: number;
        let convert: string;
        if (unit === 'imperial') {
          const ft = parseFloat(values.heightFt) || 0;
          const inches = parseFloat(values.heightIn) || 0;
          weightKg = input * 0.45359237;
          heightCm = (ft * 12 + inches) * 2.54;
          convert = `${input} lb × 0.45359237 = ${weightKg.toFixed(2)} kg · (${ft} ft × 12 + ${inches} in) × 2.54 = ${heightCm.toFixed(1)} cm`;
        } else {
          weightKg = input;
          heightCm = parseFloat(values.heightCm) || 0;
          convert = `${weightKg.toFixed(2)} kg · ${heightCm.toFixed(1)} cm`;
        }
        const W = weightKg.toFixed(2);
        const H = heightCm.toFixed(1);

        const mosteller = Math.sqrt((heightCm * weightKg) / 3600);
        const dubois = 0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725);
        const haycock = 0.024265 * Math.pow(weightKg, 0.5378) * Math.pow(heightCm, 0.3964);

        return [
          { label: 'Convert to kilograms and centimeters', expr: convert },
          {
            label: 'Mosteller',
            expr: `√(${H} × ${W} ÷ 3600) = √${((heightCm * weightKg) / 3600).toFixed(4)} = ${val('bsaMosteller')}`,
          },
          {
            label: 'Du Bois',
            expr: `0.007184 × ${W}^0.425 × ${H}^0.725 = 0.007184 × ${Math.pow(weightKg, 0.425).toFixed(3)} × ${Math.pow(heightCm, 0.725).toFixed(3)} = ${val('bsaDubois')}`,
          },
          {
            label: 'Haycock',
            expr: `0.024265 × ${W}^0.5378 × ${H}^0.3964 = 0.024265 × ${Math.pow(weightKg, 0.5378).toFixed(3)} × ${Math.pow(heightCm, 0.3964).toFixed(3)} = ${val('bsaHaycock')}`,
          },
          {
            label: 'Average the three formulas',
            expr: `(${mosteller.toFixed(4)} + ${dubois.toFixed(4)} + ${haycock.toFixed(4)}) ÷ 3 = ${val('avgBsa')}`,
            note: 'Educational reference only. Medication doses must come from a clinician using verified measurements.',
          },
        ];
    })();
    return steps.some((s) => /NaN|Infinity/.test(s.expr)) ? [] : steps;
  },
  calculate: (values) => {
    const unit = values.unit || 'imperial';

    let weightKg: number;
    let heightCm: number;

    if (unit === 'imperial') {
      weightKg = parseFloat(values.weight) * 0.45359237;
      const ft = parseFloat(values.heightFt) || 0;
      const inches = parseFloat(values.heightIn) || 0;
      const totalInches = ft * 12 + inches;
      if (totalInches <= 0) return [];
      heightCm = totalInches * 2.54;
    } else {
      weightKg = parseFloat(values.weight);
      heightCm = parseFloat(values.heightCm) || 0;
    }

    if ([weightKg, heightCm].some(isNaN) || weightKg <= 0 || heightCm <= 0) return [];

    // Mosteller formula: BSA (m²) = √(height(cm) × weight(kg) / 3600)
    const bsaMosteller = Math.sqrt((heightCm * weightKg) / 3600);

    // Du Bois formula: BSA = 0.007184 × W^0.425 × H^0.725
    const bsaDubois = 0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725);

    // Haycock formula: BSA = 0.024265 × W^0.5378 × H^0.3964
    const bsaHaycock = 0.024265 * Math.pow(weightKg, 0.5378) * Math.pow(heightCm, 0.3964);

    return [
      {
        id: 'bsaMosteller',
        label: 'BSA (Mosteller) — Clinical Standard',
        value: `${fmt(bsaMosteller)} m²`,
        highlight: true,
        color: 'positive',
        interpretation: `Body surface area is used clinically to dose chemotherapy and some other medications more precisely than weight-based dosing alone, since it better tracks metabolic rate. This is a reference figure only — actual medical dosing must come from a clinician using verified measurements, not a web calculator.`,
      },
      {
        id: 'bsaDubois',
        label: 'BSA (Du Bois)',
        value: `${fmt(bsaDubois)} m²`,
        color: 'neutral',
      },
      {
        id: 'bsaHaycock',
        label: 'BSA (Haycock)',
        value: `${fmt(bsaHaycock)} m²`,
        color: 'neutral',
      },
      {
        id: 'avgBsa',
        label: 'Average BSA (All Formulas)',
        value: `${fmt((bsaMosteller + bsaDubois + bsaHaycock) / 3)} m²`,
        color: 'neutral',
      },
      {
        id: 'clinicalDisclaimer',
        label: '⚠ Clinical Usage Warning',
        value: 'Educational reference only. All medication dosages must be verified by a licensed pharmacist or physician.',
        color: 'negative',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BSAPanel, { values, results });
  },
  educational: {
    formula: 'Mosteller: BSA = √(Height(cm) × Weight(kg) ÷ 3600) | Du Bois: BSA = 0.007184 × W^0.425 × H^0.725',
    formulaSource: 'Mosteller RD, "Simplified calculation of body-surface area", N Engl J Med 1987;317:1098. Du Bois D & Du Bois EF, Arch Intern Med 1916;17:863–871 (0.007184 × W^0.425 × H^0.725). Haycock GB, Schwartz GJ, Wisotsky DH, J Pediatr 1978;93:62–66 (0.024265 × W^0.5378 × H^0.3964). Weight in kg, height in cm.',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Body Surface Area (BSA)</text><circle cx="220" cy="50" r="16" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2"/><path d="M204,66 L198,85 L190,110 L186,155 L190,200 L198,240 L208,270 L232,270 L242,240 L250,200 L254,155 L250,110 L242,85 L236,66" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="160" y1="50" x2="160" y2="270" stroke="var(--svg-ef4444)" stroke-width="1.5" stroke-dasharray="3,2"/><line x1="155" y1="50" x2="165" y2="50" stroke="var(--svg-ef4444)" stroke-width="1.5"/><line x1="155" y1="270" x2="165" y2="270" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="155" y="165" text-anchor="end" font-size="11" fill="var(--svg-ef4444)" transform="rotate(-90,155,165)">Height</text><line x1="150" y1="110" x2="290" y2="110" stroke="var(--svg-22c55e)" stroke-width="1.5"/><line x1="150" y1="105" x2="150" y2="115" stroke="var(--svg-22c55e)" stroke-width="1.5"/><line x1="290" y1="105" x2="290" y2="115" stroke="var(--svg-22c55e)" stroke-width="1.5"/><text x="220" y="105" text-anchor="middle" font-size="11" fill="var(--svg-22c55e)">Body Width</text><text x="220" y="320" text-anchor="middle" font-size="12" fill="var(--svg-8b5cf6)" font-weight="bold">BSA = &radic;(H &times; W &divide; 3600) m&sup2;</text></svg>',
      alt: 'Person outline with height and width measurement annotations for body surface area calculation',
      caption: 'BSA estimates total body surface area using height and weight; the Mosteller formula is the clinical standard',
    },
    formulaDescription:
      'Body Surface Area estimates the total external surface area of the human body. The Mosteller formula is the most widely used clinically because of its simplicity. BSA is used for chemotherapy dosing, burn severity assessment (rule of nines), and certain medication calculations where weight-based dosing is insufficient. The average adult BSA is 1.7 m².',
    variables: [
      { symbol: 'BSA', name: 'Body Surface Area', description: 'Total surface area of the body in square meters. Used clinically for medication dosing and burn assessment.' },
      { symbol: 'Mosteller', name: 'Mosteller Formula', description: 'BSA = √(Height × Weight ÷ 3600). The most commonly used formula — simple, accurate, and widely used in clinical practice.' },
      { symbol: 'Du Bois', name: 'Du Bois Formula', description: 'BSA = 0.007184 × W^0.425 × H^0.725. The original BSA formula developed in 1916 from direct measurement of 9 subjects.' },
    ],
    quickReference: [
      { label: 'Average adult BSA', value: '~1.7 m² (range: 1.5–2.0 m² for most adults)' },
      { label: 'Average adult male BSA', value: '~1.9 m²' },
      { label: 'Average adult female BSA', value: '~1.6 m²' },
      { label: 'Newborn BSA', value: '~0.25 m²' },
      { label: 'Child (5 years) BSA', value: '~0.7–0.8 m²' },
      { label: 'Child (10 years) BSA', value: '~1.0–1.2 m²' },
      { label: 'Mosteller formula', value: 'BSA = √(Height(cm) × Weight(kg) ÷ 3600) — widely used in clinical practice' },
      { label: 'Du Bois formula', value: 'BSA = 0.007184 × W^0.425 × H^0.725 — original 1916 formula from 9 subjects' },
      { label: 'Haycock formula', value: 'BSA = 0.024265 × W^0.5378 × H^0.3964 — preferred for infants/children' },
      { label: 'eGFR normalization', value: 'Standardized to 1.73 m² — the "textbook" reference BSA for renal function' },
      { label: 'Cardiac index formula', value: 'CI = Cardiac Output (L/min) ÷ BSA (m²). Normal: 2.5–4.0 L/min/m²' },
      { label: 'Carboplatin dosing', value: 'Calvert formula: dose (mg) = target AUC × (GFR + 25) — based on kidney function, not BSA. NEVER self-calculate — requires an oncologist.' },
    ],
    howToUse: [
      'Select your unit system (Imperial or Metric).',
      'Enter your weight and height.',
      'Review your BSA from all three formulas — Mosteller is the clinical standard.',
      'Note the average BSA across all formulas for comparison.',
      'Read the clinical warning: this is for educational purposes, not medical decision-making.',
    ],
    explanation:
      "Body Surface Area (BSA) is a clinical measurement used primarily for chemotherapy dosing, determining burn severity, and adjusting certain medication doses that cannot be based on weight alone. BSA is preferred over weight for chemotherapy because drug distribution correlates better with surface area than mass. The Mosteller formula (√(H×W/3600)) is the most widely used because it requires only a simple calculator. The average adult BSA is approximately 1.7 m². BSA increases with both height and weight but not linearly — two people of the same weight but different heights will have different BSAs. For example, a tall thin person and a short heavy person might have the same weight but very different BSAs due to the height factor. BSA is also used in the 'rule of nines' for assessing burn surface area, in cardiac output indexing (cardiac index = cardiac output / BSA), and in renal function assessment (eGFR is normalized to 1.73 m²). The Du Bois formula was developed in 1916 from direct measurements of only 9 subjects — remarkably, it has proven quite accurate despite the tiny sample. The Haycock formula is preferred for infants and children because it was validated on a population that included pediatric subjects. BSA is also relevant in sports physiology: the 'body surface area rule' influences heat dissipation capacity, which is why smaller athletes (lower BSA-to-mass ratio) may be more prone to heat stress in endurance events.",
    faqs: [
      {
        question: 'Why is BSA used for chemotherapy dosing?',
        answer: 'Chemotherapy drugs have a narrow therapeutic index — too little is ineffective, too much is toxic. BSA has traditionally been used because it correlates better with metabolic rate and drug distribution than body weight alone, and many cytotoxic drugs (for example doxorubicin and cyclophosphamide) are labeled and prescribed in mg/m² doses. Carboplatin is different: the Calvert formula (dose in mg = target AUC × (GFR + 25)) is based on kidney function rather than BSA. Note that BSA-based dosing is a convention rather than a precise science — the ASCO guideline (2012, updated 2021) recommends full weight-based dosing using actual body weight for obese adults rather than capping BSA. Accurate measurement matters in both directions: under-dosing risks treatment failure and over-dosing risks life-threatening toxicity.',
      },
      {
        question: 'What is a normal BSA?',
        answer: 'The average adult BSA is ~1.7 m² (ranging from ~1.5–2.0 m² for most adults). Children have lower BSA. There is no "normal" BSA per se — it is simply a measured value used for clinical calculations, not a health marker like BMI. A 6\'5" athlete and a 5\'2" person will have different BSAs simply due to their different heights, which is expected and not meaningful as a standalone number. BSA becomes relevant only when used as a denominator for clinical calculations (e.g., cardiac index = cardiac output / BSA, or eGFR normalized to 1.73 m²).',
      },
      {
        question: 'Which BSA formula should I use?',
        answer: 'Mosteller is the most widely used formula in clinical practice. It gives nearly identical results to Du Bois (within about 3% for typical adults) but is much simpler to calculate — it requires only multiplication, division, and a square root. Haycock is more accurate for infants and children because it was validated on a population that included pediatric subjects. Du Bois, despite being the oldest formula (1916) and based on only 9 subjects, has proven remarkably accurate across diverse populations over the past century. For practical purposes, any of the three formulas is acceptable — they differ by less than 3% for typical adult measurements.',
      },
      {
        question: 'Why does BSA matter for burn assessment?',
        answer: 'Burn severity and fluid resuscitation are calculated as a percentage of total BSA affected. The "Rule of Nines" divides the body into regions each representing ~9% of total BSA: head and neck (9%), each arm (9%), anterior trunk (18%), posterior trunk (18%), each leg (18%), and perineum (1%). The percentage of BSA burned determines the fluid resuscitation volume using the Parkland formula: 4 mL × weight(kg) × %BSA burned of lactated Ringer\'s solution, with half given in the first 8 hours. For example, a 70 kg patient with 30% BSA burns needs 4 × 70 × 30 = 8,400 mL in the first 24 hours, with 4,200 mL in the first 8 hours. Accurate BSA estimation is literally life-saving in burn care — underestimating burn size leads to inadequate fluid resuscitation and organ failure.',
      },
      {
        question: 'How does BSA relate to kidney function (eGFR)?',
        answer: 'Estimated glomerular filtration rate (eGFR) is normalized to a standard BSA of 1.73 m² — this was the average BSA of the 25-year-old men in the original kidney function studies. This normalization allows comparison of kidney function between people of different sizes. A very large person (BSA 2.2 m²) naturally has a higher absolute GFR because they have more kidney tissue and more blood to filter — but their eGFR per 1.73 m² should be similar to a smaller person\'s if kidney health is comparable. The raw (unadjusted) GFR is calculated first, then multiplied by (1.73 / patient\'s BSA) to normalize. This means that if your BSA is larger than 1.73 m², your raw GFR is divided by a number greater than 1, and your reported eGFR is lower than your raw GFR — which can sometimes make large muscular individuals appear to have lower kidney function when their kidneys are actually healthy.',
      },
      {
        question: 'What is the relationship between BSA and cardiac output?',
        answer: 'Cardiac output (the volume of blood the heart pumps per minute) varies with body size — larger people need more blood flow. To compare cardiac function across different-sized patients, cardiac output is divided by BSA to produce the cardiac index (CI). Normal CI is 2.5–4.0 L/min/m². A cardiac output of 5.0 L/min might be normal for a large person (BSA 2.0 m² → CI = 2.5) but could indicate low output for a small person (BSA 1.4 m² → CI = 3.6). This BSA-indexed approach is also used for other cardiovascular measurements including stroke volume index, systemic vascular resistance index, and aortic valve area index.',
      },
      {
        question: 'Why do BSA formulas give slightly different results?',
        answer: 'Each formula was derived from different study populations and uses different mathematical models. Du Bois (1916) measured only 9 subjects using paper molds and planimetry — a labor-intensive process involving tracing body outlines. The formula fits a power-law model (BSA ∝ W^0.425 × H^0.725) because surface area scales with the 2/3 power of mass in geometrically similar objects. Mosteller (1987) simplified this to a single square root for ease of bedside calculation. Haycock (1978) used 81 subjects including infants and found slightly different exponents (W^0.5378, H^0.3964) that better fit the pediatric population. The differences between formulas are typically less than 0.05 m² (about 3% of total BSA) for adults — clinically negligible for most purposes. The largest discrepancies appear at the extremes: very tall/short or very heavy/light individuals where the formulas diverge by up to 5–8%.',
      },
    ],
    workedExamples: [
      {
        scenario: 'An oncologist needs to calculate the BSA for a 70 kg, 175 cm patient starting a new chemotherapy regimen. The clinic uses the Mosteller formula.',
        inputs: { unit: 'metric', weight: '70', heightCm: '175' },
        result: 'Mosteller: 1.84 m². Du Bois: 1.85 m². Haycock: 1.85 m². Average: 1.85 m².',
        insight: 'All three formulas agree within 0.01 m² for this patient — this is typical for average-sized adults. The oncologist would use 1.84 m² to calculate the chemotherapy dose. For example, if the protocol calls for doxorubicin 60 mg/m², the dose would be 60 × 1.84 = 110.4 mg (rounded to 110 mg). This patient\'s BSA is slightly above the 1.73 m² reference, meaning they will receive a slightly higher absolute dose than the "textbook" patient — but this is appropriate because their larger body volume distributes the drug more widely. Using weight-only dosing would be incorrect here; BSA-based dosing accounts for both height and weight.',
      },
      {
        scenario: 'A pediatrician needs BSA for a 15 kg, 100 cm child to calculate a medication dose. Haycock is preferred for pediatric patients.',
        inputs: { unit: 'metric', weight: '15', heightCm: '100' },
        result: 'Mosteller: 0.65 m². Du Bois: 0.64 m². Haycock: 0.65 m². Average: 0.64 m².',
        insight: 'The child\'s BSA is about 0.65 m² — significantly lower than the adult average of 1.7 m² because BSA does not scale linearly with size. This is why pediatric medication dosing must be BSA-based: a 15 kg child is roughly 21% of a 70 kg adult\'s weight, but their BSA is about 38% of an adult\'s BSA. Weight-based dosing would give this child only one-fifth of the adult dose, which could be subtherapeutic. BSA-based dosing would give approximately 38% of the adult dose — a significantly higher and more appropriate amount. This discrepancy between weight and BSA scaling is largest in infants and narrows as children grow toward adult size. The Haycock formula was specifically validated on children and is the preferred choice here, though Mosteller\'s result (0.65 m²) is close enough for clinical use.',
      },
      {
        scenario: 'A burn unit resident assesses a 90 kg, 183 cm patient with burns covering the entire anterior torso and both arms. They need total BSA and the percentage of body surface burned to calculate fluid resuscitation per the Parkland formula.',
        inputs: { unit: 'metric', weight: '90', heightCm: '183' },
        result: 'Mosteller: 2.14 m². Rule of Nines: anterior torso (18%) + both arms (9% × 2 = 18%) = 36% of total BSA burned. Parkland formula: 4 × 90 × 36 = 12,960 mL in first 24 hours, with 6,480 mL in first 8 hours.',
        insight: 'This patient has a larger-than-average BSA (2.14 m²) due to his height and weight. The absolute burned surface area is 2.14 × 0.36 = 0.77 m². Fluid resuscitation is calculated per the Parkland formula using weight and burn percentage — BSA factors indirectly through the percentage estimation. The resident must also monitor urine output (goal: 0.5 mL/kg/hr = 45 mL/hr for this patient) and adjust fluids accordingly — the Parkland formula is a starting point, not a fixed prescription. Over-resuscitation (too much fluid) is as dangerous as under-resuscitation, causing compartment syndrome and pulmonary edema. The BSA calculation here is used for documentation and for monitoring the healing progress of the burn wounds over time — wound healing rates and grafting decisions reference the absolute BSA involved.',
      },
    ],
    proTips: [
      'For clinical calculations (chemotherapy dosing, burn assessment, cardiac index), Mosteller is the usual choice — it is the most widely used and simplest. Save the formula in your phone: sqrt(height_cm × weight_kg / 3600). You can calculate it with any basic calculator that has a square root button. The other formulas provide cross-validation — if Mosteller and Du Bois differ by more than 5%, double-check your height and weight inputs, as this usually indicates a measurement error rather than a real divergence between the formulas.',
      'BSA is not a health metric like BMI or body fat percentage. A larger BSA does not mean you are unhealthy, and a smaller BSA does not mean you are healthier. BSA is simply a physical measurement used to scale clinical calculations. Do not track your BSA over time as a health goal — it will change if your weight changes, which is already tracked more meaningfully through BMI, waist circumference, or body fat percentage. BSA is a tool for clinicians, not a personal health target.',
      'In obese patients the question of how to dose chemotherapy is settled differently from the old habit of capping BSA: the ASCO guideline (2012, updated 2021) recommends full weight-based dosing of cytotoxic chemotherapy using actual body weight, because capping BSA (for example at 2.0 m²) or using ideal weight has been associated with under-treatment without a toxicity benefit. If you are calculating BSA for personal education about a medication you are receiving, always follow your doctor\'s prescribed dose — never adjust your own medication based on BSA calculations.',
      'BSA formulas assume a typical body shape and proportion. For people with amputations, severe scoliosis, dwarfism, or other conditions that significantly alter body proportions, BSA formulas may be inaccurate. In burn care, the Rule of Nines is adjusted for children (the head represents a larger percentage in infants: 18% vs. 9% in adults) and for obesity. For these special populations, direct measurement methods (3D body scanning) or condition-specific adjustment factors are used in clinical settings.',
      'If you are using BSA for fitness or sports physiology purposes (e.g., calculating heat dissipation capacity or VO2max normalization), note that BSA-to-mass ratio matters more than absolute BSA. A smaller athlete (e.g., a marathon runner at 55 kg, 170 cm) has a higher BSA-to-mass ratio than a larger athlete (e.g., a rugby player at 110 kg, 185 cm). Higher BSA-to-mass ratio = more surface area per unit of body mass = better heat dissipation capacity. This is one reason smaller athletes tend to perform better in hot-weather endurance events. The calculation: BSA (m²) / weight (kg). By the Mosteller formula, the marathoner has 1.61 m² / 55 kg = 0.029 m²/kg, while the rugby player has 2.38 m² / 110 kg = 0.022 m²/kg — the marathoner has roughly 35% more surface area per kilogram for cooling.',
    ],
    commonUses: [
      'Chemotherapy dosing — oncologists use BSA to calculate chemotherapy drug doses, as drug distribution correlates better with surface area than body weight',
      'Burn severity assessment — the "rule of nines" estimates burn surface area as a percentage of total BSA, guiding fluid resuscitation and treatment decisions',
      'Clinical medication dosing — certain medications (e.g., immunosuppressants, some anesthetics) use BSA-based dosing where weight-based dosing is insufficient',
      'Cardiac output indexing — cardiac index (cardiac output divided by BSA) normalizes heart function measurements across patients of different sizes'
    ],
    limitations: [
      'Body composition and proportion assumptions — BSA formulas assume average body proportions. Individuals with significantly different muscle mass, body fat, or conditions like amputations, severe scoliosis, kyphosis, dwarfism, or gigantism may have actual BSA that differs from formula estimates.',
      'Clinical factors not modeled — edema or ascites (fluid retention) can add kilograms to weight without increasing surface area. In obese patients, current ASCO guidance is to use full weight-based chemotherapy doses rather than capped BSA, so a formula-derived BSA is not the only input to a dosing decision.',
      'Formula derivation limitations — these formulas were derived primarily from Caucasian populations with small sample sizes (Du Bois: 9 subjects; Mosteller: derived mathematically; Haycock: 81 subjects). Ethnic body proportion differences may introduce systematic biases.',
      'For clinical medication dosing, carboplatin and chemotherapeutic agents should ONLY be dosed by a licensed physician — never self-calculate or self-adjust doses. The Rule of Nines is taught for concept understanding only; actual burn assessment must be performed by trained medical personnel.',
    ],
    citations: [
      { source: 'NIH - Mosteller BSA Formula', url: 'https://pubmed.ncbi.nlm.nih.gov/3558715/' },
      { source: 'Wikipedia - Body Surface Area', url: 'https://en.wikipedia.org/wiki/Body_surface_area' },
    ],

  },
};

export default bsaConfig;
