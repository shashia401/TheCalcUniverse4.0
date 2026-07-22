import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import BMIPanel from './BMIPanel';

const bmiConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'unit',
      label: 'Unit System',
      type: 'select',
      defaultValue: 'imperial',
      required: true,
      helpText: 'Choose Imperial (lbs, ft/in) or Metric (kg, cm) for your measurements',
      options: [
        { label: 'Imperial (lbs, ft & in)', value: 'imperial' },
        { label: 'Metric (kg, cm)', value: 'metric' },
      ],
    },
    {
      id: 'sex',
      label: 'Sex',
      type: 'select',
      defaultValue: 'male',
      required: true,
      helpText: 'Used for the Devine Ideal Body Weight formula — male and female use different constants',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      placeholder: '30',
      unit: 'years',
      inputMode: 'decimal',
      min: 2,
      max: 120,
      step: 1,
      required: false,
      helpText: 'Optional — adult BMI applies to ages 18+',
    },
    {
      id: 'weight',
      label: 'Weight',
      type: 'number',
      defaultValue: '170',
      placeholder: '170',
      min: 0,
      step: 0.1,
      required: true,
      helpText: 'Pounds (lbs) for Imperial · Kilograms (kg) for Metric',
    },
    {
      id: 'heightFt',
      label: 'Height — Feet',
      type: 'number',
      defaultValue: '5',
      placeholder: '5',
      unit: 'ft',
      min: 0,
      max: 9,
      step: 1,
      helpText: 'Imperial only — feet portion of your height',
      showWhen: (v) => v.unit === 'imperial',
    },
    {
      id: 'heightIn',
      label: 'Height — Inches',
      type: 'number',
      defaultValue: '10',
      placeholder: '10',
      unit: 'in',
      min: 0,
      max: 11,
      step: 1,
      helpText: 'Imperial only — remaining inches (0–11)',
      showWhen: (v) => v.unit === 'imperial',
    },
    {
      id: 'heightCm',
      label: 'Height — Centimeters',
      type: 'number',
      placeholder: '178',
      unit: 'cm',
      inputMode: 'decimal',
      min: 0,
      step: 0.1,
      helpText: 'Metric only — total height in centimeters',
      showWhen: (v) => v.unit === 'metric',
    },
  ],
  explainSteps: (values) => {
    const unit = values.unit || 'imperial';
    const weight = parseFloat(values.weight);
    let heightM: number;
    let weightKg: number;
    const steps: { label: string; expr: string; note?: string }[] = [];

    if (unit === 'imperial') {
      const ft = parseFloat(values.heightFt) || 0;
      const inches = parseFloat(values.heightIn) || 0;
      const totalInches = ft * 12 + inches;
      if (totalInches <= 0) return [];
      heightM = totalInches * 0.0254;
      weightKg = weight * 0.45359237;
      if (isNaN(weight) || weightKg <= 0) return [];
      steps.push({
        label: 'Convert your height to meters',
        expr: `${ft} ft ${inches} in = ${totalInches} in × 0.0254 = ${heightM.toFixed(3)} m`,
        note: 'BMI is defined in metric units, so height becomes meters.',
      });
      steps.push({
        label: 'Convert your weight to kilograms',
        expr: `${weight} lb × 0.453592 = ${weightKg.toFixed(2)} kg`,
      });
    } else {
      const cm = parseFloat(values.heightCm) || 0;
      if (cm <= 0) return [];
      heightM = cm / 100;
      weightKg = weight;
      if (isNaN(weight) || weightKg <= 0) return [];
      steps.push({
        label: 'Convert your height to meters',
        expr: `${cm} cm ÷ 100 = ${heightM.toFixed(3)} m`,
      });
    }

    const heightSq = heightM * heightM;
    const bmi = weightKg / heightSq;
    const category =
      bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal weight' : bmi < 30 ? 'Overweight' : 'Obese';
    const band =
      bmi < 18.5 ? 'below 18.5' : bmi < 25 ? '18.5–24.9' : bmi < 30 ? '25.0–29.9' : '30 and above';

    steps.push({
      label: 'Square your height',
      expr: `${heightM.toFixed(3)} m × ${heightM.toFixed(3)} m = ${heightSq.toFixed(4)} m²`,
    });
    steps.push({
      label: 'Divide weight by height squared',
      expr: `BMI = ${weightKg.toFixed(2)} kg ÷ ${heightSq.toFixed(4)} m² = ${bmi.toFixed(1)}`,
      note: 'This single number is your Body Mass Index.',
    });
    steps.push({
      label: 'Read the WHO category',
      expr: `${bmi.toFixed(1)} falls in ${band} → ${category}`,
    });

    return steps;
  },
  // Living Answer gauge — the user's BMI on the WHO scale, with a live marker.
  gauge: (values) => {
    const unit = values.unit || 'imperial';
    const weight = parseFloat(values.weight);
    let heightM: number;
    let weightKg: number;
    if (unit === 'imperial') {
      const totalInches = (parseFloat(values.heightFt) || 0) * 12 + (parseFloat(values.heightIn) || 0);
      if (totalInches <= 0) return null;
      heightM = totalInches * 0.0254;
      weightKg = weight * 0.45359237;
    } else {
      const cm = parseFloat(values.heightCm) || 0;
      if (cm <= 0) return null;
      heightM = cm / 100;
      weightKg = weight;
    }
    if (isNaN(weight) || weightKg <= 0) return null;

    const bmi = weightKg / (heightM * heightM);
    const category = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
    return {
      value: bmi,
      min: 15,
      max: 40,
      valueLabel: `Your BMI: ${bmi.toFixed(1)} — ${category}`,
      bands: [
        { to: 18.5, label: 'Underweight', color: '#f59e0b' },
        { to: 25, label: 'Normal', color: '#22c55e' },
        { to: 30, label: 'Overweight', color: '#f97316' },
        { to: 40, label: 'Obese', color: '#ef4444' },
      ],
      caption: 'World Health Organization BMI categories. The marker shows where your result lands.',
    };
  },
  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const unit = values.unit || 'imperial';
    const weight = parseFloat(values.weight);
    const sex = values.sex || 'male';

    let heightM: number;
    let weightKg: number;

    if (unit === 'imperial') {
      const ft = parseFloat(values.heightFt) || 0;
      const inches = parseFloat(values.heightIn) || 0;
      const totalInches = ft * 12 + inches;
      if (totalInches <= 0) return [];
      heightM = totalInches * 0.0254;
      weightKg = weight * 0.45359237;
    } else {
      const cm = parseFloat(values.heightCm) || 0;
      if (cm <= 0) return [];
      heightM = cm / 100;
      weightKg = weight;
    }

    if (isNaN(weight) || weightKg <= 0) return [];

    const bmi = weightKg / (heightM * heightM);
    const totalInchesForFormula = heightM / 0.0254;

    // Uses WHO international cutoffs (18.5 / 25 / 30). For Asian populations the WHO
    // recommends lower cutoffs (overweight ≥ 23, obese ≥ 27.5) because metabolic
    // complications appear at lower BMI in those populations. This calculator does NOT
    // auto-adjust for ethnicity — the educational section explains the difference.
    const getCategory = (b: number): { label: string; color: 'positive' | 'negative' | 'neutral' } => {
      if (b < 18.5) return { label: 'Underweight', color: 'negative' };
      if (b < 25) return { label: 'Normal weight', color: 'positive' };
      if (b < 30) return { label: 'Overweight', color: 'neutral' };
      return { label: 'Obese', color: 'negative' };
    };

    const category = getCategory(bmi);

    // Devine formula: base weight at exactly 5 ft (60 in) plus 2.3 kg per inch above.
    // LIMITATION: for heights under 5 ft the (inches − 60) term goes negative, producing
    // ideal weights below the base (e.g., a 4'10" male → ~27 kg). The Devine formula was
    // derived from actuarial data on adult populations of average stature and should not be
    // used for individuals significantly shorter than 5 ft. We still compute the value but
    // flag it below when the user is under 5 ft.
    const idealWeightKg = sex === 'male'
      ? 50 + 2.3 * (totalInchesForFormula - 60)
      : 45.5 + 2.3 * (totalInchesForFormula - 60);
    const isUnderFiveFeet = totalInchesForFormula < 60;
    const idealWeightLbs = idealWeightKg / 0.45359237;

    const normalLowKg = 18.5 * heightM * heightM;
    const normalHighKg = 24.9 * heightM * heightM;
    const normalLowLbs = normalLowKg / 0.45359237;
    const normalHighLbs = normalHighKg / 0.45359237;

    const currentWeightDisplay = unit === 'imperial' ? weight : weightKg;
    const idealWeightDisplay = unit === 'imperial' ? idealWeightLbs : idealWeightKg;
    const toWeightDiff = currentWeightDisplay - idealWeightDisplay;
    const diffUnit = unit === 'imperial' ? 'lbs' : 'kg';

    const bmiPrime = (bmi / 25.0).toFixed(2);
    const fmt1 = (n: number) => n.toFixed(1);

    // Personalized, actionable interpretation (calculator.net's best idea) — always
    // computed from the user's own numbers, never generic boilerplate.
    const healthyLowDisp = unit === 'imperial' ? normalLowLbs : normalLowKg;
    const healthyHighDisp = unit === 'imperial' ? normalHighLbs : normalHighKg;
    const interpretation =
      category.label === 'Normal weight'
        ? `You're in the healthy weight range for your height (${healthyLowDisp.toFixed(0)}–${healthyHighDisp.toFixed(0)} ${diffUnit}). Maintaining is the goal.`
        : bmi < 18.5
        ? `You're below the healthy range. Reaching about ${healthyLowDisp.toFixed(0)} ${diffUnit} (BMI 18.5) would bring you into it.`
        : `You're above the healthy range. About ${healthyHighDisp.toFixed(0)} ${diffUnit} (BMI 25.0) is the top of the healthy band for your height.`;

    return [
      { id: 'bmiPrime', label: 'BMI Prime', value: bmiPrime, color: 'neutral' },
      {
        id: 'bmiScore',
        label: `BMI Score — ${category.label}`,
        value: bmi.toFixed(1),
        highlight: true,
        color: category.color,
        interpretation,
      },
      {
        id: 'normalRange',
        label: `Healthy Weight Range for Your Height`,
        value: unit === 'imperial'
          ? `${normalLowLbs.toFixed(0)} – ${normalHighLbs.toFixed(0)} lbs`
          : `${fmt1(normalLowKg)} – ${fmt1(normalHighKg)} kg`,
        color: 'positive',
      },
      {
        id: 'idealWeight',
        label: isUnderFiveFeet
          ? 'Devine Ideal Body Weight (caution: formula not validated under 5 ft)'
          : 'Devine Ideal Body Weight',
        value: unit === 'imperial'
          ? `${idealWeightLbs.toFixed(0)} lbs`
          : `${fmt1(idealWeightKg)} kg`,
        color: 'neutral',
      },
      {
        id: 'weightDiff',
        label: toWeightDiff > 0.5
          ? 'Above Ideal Weight By'
          : toWeightDiff < -0.5
          ? 'Below Ideal Weight By'
          : 'Weight vs Ideal',
        value: Math.abs(toWeightDiff) < 0.5
          ? 'At ideal weight'
          : `${Math.abs(toWeightDiff).toFixed(1)} ${diffUnit}`,
        color: Math.abs(toWeightDiff) < 10 ? 'positive' : 'neutral',
      },
      {
        id: 'classification',
        label: 'WHO Classification',
        value: category.label,
        color: category.color,
      },
      {
        id: 'underweightThreshold',
        label: 'Underweight below',
        value: unit === 'imperial'
          ? `${(18.5 * heightM * heightM / 0.45359237).toFixed(0)} lbs (BMI 18.5)`
          : `${fmt1(18.5 * heightM * heightM)} kg (BMI 18.5)`,
        color: 'neutral',
      },
      {
        id: 'overweightThreshold',
        label: 'Overweight at or above',
        value: unit === 'imperial'
          ? `${(25 * heightM * heightM / 0.45359237).toFixed(0)} lbs (BMI 25.0)`
          : `${fmt1(25 * heightM * heightM)} kg (BMI 25.0)`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BMIPanel, { values, results });
  },
  educational: {
    formula: 'BMI = Weight (kg) ÷ Height² (m²)',
    formulaDescription:
      "BMI is a screening index computed from weight and height to categorize adults into Underweight, Normal, Overweight, or Obese. It does not measure body fat directly.",
    diagram: {
      svg: '<svg viewBox="0 0 500 90" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<rect x="0" y="10" width="185" height="40" rx="6" fill="var(--svg-f59e0b)" opacity="0.85"><title>Underweight: BMI less than 18.5</title></rect>' +
        '<rect x="185" y="10" width="64" height="40" rx="0" fill="var(--svg-22c55e)" opacity="0.85"><title>Normal: BMI 18.5 to 24.9</title></rect>' +
        '<rect x="249" y="10" width="49" height="40" rx="0" fill="var(--svg-f97316)" opacity="0.85"><title>Overweight: BMI 25 to 29.9</title></rect>' +
        '<rect x="298" y="10" width="202" height="40" rx="6" fill="var(--svg-ef4444)" opacity="0.85"><title>Obese: BMI 30 and above</title></rect>' +
        '<text x="92" y="66" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">Underweight</text>' +
        '<text x="217" y="66" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">Normal</text>' +
        '<text x="273" y="66" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">Overweight</text>' +
        '<text x="399" y="66" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">Obese</text>' +
        '<text x="0" y="86" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)">0</text>' +
        '<text x="185" y="86" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">18.5</text>' +
        '<text x="249" y="86" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">25</text>' +
        '<text x="298" y="86" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">30</text>' +
        '<text x="500" y="86" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="end">50</text>' +
        '</svg>',
      alt: 'BMI classification scale showing Underweight, Normal, Overweight, and Obese ranges',
      caption: 'World Health Organization BMI classification categories',
    },
    variables: [
      { symbol: 'BMI', name: 'Body Mass Index', description: 'A ratio of weight to height squared. A rough proxy for body fatness — accurate at the population level, imperfect for individuals.' },
      { symbol: 'Normal Range', name: 'Healthy Weight Range', description: 'The weight range corresponding to BMI 18.5–24.9 for your specific height.' },
      { symbol: 'Ideal Weight', name: 'Devine Formula', description: 'Male: 50 kg + 2.3 kg per inch over 5 ft. Female: 45.5 kg + 2.3 kg per inch over 5 ft. A clinical reference point, not a rigid target.' },
    ],
    howToUse: [
      'Select Imperial (lbs, ft/in) or Metric (kg, cm).',
      'Select your sex for ideal body weight calculation.',
      'Enter your age (optional).',
      'Enter your weight and height.',
      'Review your BMI score, the visual WHO scale gauge, and your healthy weight range.',
    ],
    explanation:
      "BMI correlates with body fat at the population level and is widely used because it requires only weight and height. However, it cannot distinguish muscle from fat, does not account for fat distribution, and varies in accuracy across ethnicities. Athletes often register as overweight despite low body fat. Use it as a starting screening tool alongside other assessments. For example, a 5'10\" athlete weighing 190 lbs with 12% body fat would have a BMI of 27.3 (overweight category) despite excellent body composition. Conversely, a sedentary person at the same height and weight with 30% body fat would have the same BMI but significantly higher health risk. This is why waist-to-height ratio and body fat percentage provide more individualized assessments. BMI also does not account for age-related muscle loss — an older adult may have a normal BMI but low muscle mass and high body fat (sarcopenic obesity). For Asian populations, the WHO recommends lower BMI cutoffs (overweight at 23 instead of 25) because they tend to develop metabolic complications at lower BMI levels due to differences in body fat distribution.",
    faqs: [
      {
        question: 'What are the four BMI categories?',
        answer: 'Underweight: below 18.5. Normal Weight: 18.5–24.9. Overweight: 25.0–29.9. Obese: 30.0 and above. The CDC further splits obesity into Class I (30–34.9), Class II (35–39.9), and Class III (40+).',
      },
      {
        question: 'Is BMI accurate for athletes or muscular people?',
        answer: 'No. Muscle is denser than fat. Athletes often register as overweight or obese by BMI despite very low body fat. DEXA scans or hydrostatic weighing are more accurate for athletes. See the panel below for a detailed disclaimer.',
      },
      {
        question: 'What is the Devine Ideal Body Weight formula?',
        answer: 'For males: 50 kg + 2.3 kg per inch over 5 ft. For females: 45.5 kg + 2.3 kg per inch over 5 ft. Originally used for clinical drug dosing — a reference point, not a personal target.',
      },
      {
        question: 'Does BMI differ by ethnicity or race?',
        answer: 'Yes. People of Asian descent tend to have higher body fat percentages at the same BMI as Caucasians, so the WHO recommends lower cutoffs (overweight at BMI 23) for Asian populations. Conversely, people of Pacific Islander descent may have lower health risks at higher BMIs. This is because BMI does not account for differences in body composition, bone density, and fat distribution across ethnic groups, which is why waist circumference is often used as a supplementary measurement.',
      },
      {
        question: 'How accurate is BMI for children and teenagers?',
        answer: 'For children and teens aged 2–19, BMI is interpreted using percentile charts relative to age and sex, not fixed cutoffs. A BMI at the 85th percentile is considered overweight, and at or above the 95th percentile is obese. Pediatric BMI is always assessed in context of growth patterns, family history, and physical development. The calculator uses adult BMI formulas (ages 18+) and is not calibrated for children.',
      },
      {
        question: 'What are the limitations of using BMI alone?',
        answer: 'BMI does not measure body fat directly, so it cannot distinguish between fat and muscle mass. It does not account for fat distribution (visceral vs. subcutaneous fat), age-related muscle loss, bone density, or pregnancy. A waist-to-height ratio (WHtR) below 0.5 is often considered a more accurate health risk predictor. Use BMI as a screening tool, not a diagnostic one, and combine it with other health metrics for a complete picture.',
      },
    ],
  
    quickReference: [
      { label: 'Underweight', value: 'BMI below 18.5' },
      { label: 'Normal Weight', value: 'BMI 18.5 – 24.9' },
      { label: 'Overweight', value: 'BMI 25.0 – 29.9' },
      { label: 'Obese (Class I)', value: 'BMI 30.0 – 34.9' },
      { label: 'Obese (Class II)', value: 'BMI 35.0 – 39.9' },
      { label: 'Obese (Class III)', value: 'BMI 40.0 and above' },
      { label: '5\'10" at 170 lbs', value: 'BMI ~24.4 (Normal)' },
      { label: '5\'5" at 150 lbs', value: 'BMI ~25.0 (Overweight threshold)' },
    ],
    commonUses: [
      'Health screening — primary care visits use BMI as an initial metabolic health indicator alongside blood pressure and cholesterol panels',
      'Insurance underwriting — life and health insurance premiums use BMI categories as one factor in risk assessment and pricing',
      'Clinical weight management — track BMI changes over time to measure progress in weight loss or gain programs',
      'Population health studies — public health agencies use BMI distributions to track obesity rates and target interventions across demographics',
      'Fitness goal setting — establish a baseline BMI and monitor changes as body composition shifts through diet and exercise programs',
    ],
    
    workedExamples: [
      {
        scenario: 'Maria is 35, stands 5\'5" (165 cm), and weighs 150 lbs (68 kg). She wants to know which BMI category she falls into using the imperial formula.',
        inputs: {
          Height: '65 in (5\'5")',
          Weight: '150 lbs',
        },
        result: 'BMI = 703 × 150 ÷ 65² = 703 × 150 ÷ 4,225 = 24.96 — just inside the Normal range (18.5–24.9).',
        insight: 'Maria sits right at the top edge of the Normal band. A 3 lb gain would push her to ~25.5 (Overweight), so for screening purposes she is best treated as borderline — a good prompt to track the trend rather than the single reading.',
      },
      {
        scenario: 'David is a competitive rower: 6\'1" (185 cm), 210 lbs (95 kg), with roughly 12% body fat. He is surprised his BMI flags him as Overweight.',
        inputs: {
          Height: '1.85 m',
          Weight: '95 kg',
        },
        result: 'BMI = 95 ÷ 1.85² = 95 ÷ 3.4225 = 27.76 — Overweight (25.0–29.9).',
        insight: 'BMI cannot tell muscle from fat. At 12% body fat David is lean, but his high muscle mass inflates his weight-to-height ratio. This is the classic case where BMI overestimates health risk and a body-fat measurement is the better tool.',
      },
    ],

    proTips: [
      'BMI is a screening tool, not a diagnosis. Pair it with waist circumference (or waist-to-height ratio) for a far better read on metabolic risk than weight alone.',
      'If you are of South/East Asian descent, the WHO suggests a lower overweight threshold (BMI ≥ 23) because health risks appear at a lower BMI than in the standard chart.',
      'Watch the trend, not the single number. A steady BMI moving from 27 toward 25 over months matters more than any one reading.',
      'For very muscular or very lean athletes, prefer a body-fat percentage measurement — BMI will frequently misclassify them.',
    ],

    limitations: [
      'BMI does not distinguish muscle from fat. Muscular individuals are often labeled Overweight or Obese despite low body fat.',
      'It ignores fat distribution. Visceral (abdominal) fat carries more health risk than the same weight stored elsewhere, and BMI cannot see the difference.',
      'It is less reliable for older adults (who lose muscle), pregnant people, and anyone under 20. Children and teens should use age- and sex-specific BMI-for-age percentile charts instead.',
      'The standard cut-offs were derived largely from white European populations and do not capture differing risk thresholds across all ethnicities.',
    ],
citations: [
      { source: 'CDC - Adult BMI', url: 'https://www.cdc.gov/bmi/' },
      { source: 'WHO - BMI Classification', url: 'https://www.who.int/data/gho/data/themes/topics/topic-details/GHO/body-mass-index' },
    ],
  },
};

export default bmiConfig;
