import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import LeanBodyMassPanel from './LeanBodyMassPanel';

const leanBodyMassConfig: CalculatorConfig = {
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
      id: 'sex',
      label: 'Biological Sex',
      type: 'select',
      required: true,
      helpText: 'LBM formulas use different coefficients for males and females',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
    },
    {
      id: 'weight',
      label: 'Weight',
      type: 'number',
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
      placeholder: '5',
      unit: 'ft',
      min: 0,
      max: 9,
      step: 1,
      helpText: 'Imperial only',
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
      helpText: 'Imperial only — remaining inches (0–11)',
    },
    {
      id: 'heightCm',
      label: 'Height — Centimeters',
      type: 'number',
      placeholder: '178',
      unit: 'cm',
      min: 0,
      step: 0.1,
      helpText: 'Metric only',
    },
  ],
  calculate: (values) => {
    const unit = values.unit || 'imperial';
    const sex = values.sex || 'male';

    let weightKg: number;
    let heightCm: number;

    if (unit === 'imperial') {
      weightKg = parseFloat(values.weight) * 0.45359237;
      const ft = parseFloat(values.heightFt) || 0;
      const inches = parseFloat(values.heightIn) || 0;
      heightCm = (ft * 12 + inches) * 2.54;
    } else {
      weightKg = parseFloat(values.weight);
      heightCm = parseFloat(values.heightCm) || 0;
    }

    if ([weightKg, heightCm].some(isNaN) || weightKg <= 0 || heightCm <= 0) return [];

    // Boer Formula (1984)
    const boerKg = sex === 'male'
      ? 0.407 * weightKg + 0.267 * heightCm - 19.2
      : 0.252 * weightKg + 0.473 * heightCm - 48.3;

    // James Formula (1976)
    const jamesKg = sex === 'male'
      ? 1.1 * weightKg - 128 * (weightKg / heightCm) ** 2
      : 1.07 * weightKg - 148 * (weightKg / heightCm) ** 2;

    // Hume Formula (1966)
    const humeKg = sex === 'male'
      ? 0.32810 * weightKg + 0.33929 * heightCm - 29.5336
      : 0.29569 * weightKg + 0.41813 * heightCm - 43.2933;

    const allLbm = [boerKg, jamesKg, humeKg];
    const avgLbm = allLbm.reduce((a, b) => a + b, 0) / allLbm.length;

    // Fat mass = weight - LBM
    const fatMassKg = weightKg - avgLbm;
    const bodyFatPct = (fatMassKg / weightKg) * 100;

    const fmtKg = (n: number) => `${n.toFixed(1)} kg`;
    const fmtLbs = (n: number) => `${(n / 0.45359237).toFixed(1)} lbs`;
    const display = (n: number) => unit === 'imperial' ? fmtLbs(n) : fmtKg(n);

    return [
      {
        id: 'avgLBM',
        label: 'Average Lean Body Mass (3 formulas)',
        value: display(avgLbm),
        highlight: true,
        color: 'positive',
        interpretation: `This is the weight of everything that isn't fat — muscle, bone, organs, water — averaged across three formulas, which puts your body fat near ${bodyFatPct.toFixed(0)}%. LBM is what you want to preserve while losing weight; a deficit paired with protein and resistance training keeps the loss coming from fat, not muscle.`,
      },
      {
        id: 'boer',
        label: 'Boer Formula (1984)',
        value: display(boerKg),
        color: 'neutral',
      },
      {
        id: 'james',
        label: 'James Formula (1976)',
        value: display(jamesKg),
        color: 'neutral',
      },
      {
        id: 'hume',
        label: 'Hume Formula (1966)',
        value: display(humeKg),
        color: 'neutral',
      },
      {
        id: 'totalWeight',
        label: 'Total Body Weight',
        value: display(weightKg),
        color: 'neutral',
      },
      {
        id: 'estimatedFatMass',
        label: 'Estimated Fat Mass (using average LBM)',
        value: `${display(fatMassKg)} (${bodyFatPct.toFixed(1)}%)`,
        color: 'neutral',
      },
      {
        id: 'lbmPct',
        label: 'Lean Mass Percentage',
        value: `${(avgLbm / weightKg * 100).toFixed(1)}%`,
        color: 'positive',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(LeanBodyMassPanel, { values, results });
  },
  educational: {
    formula: 'Boer: (0.407 × W) + (0.267 × H) − 19.2 ♂ / (0.252 × W) + (0.473 × H) − 48.3 ♀',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Body Composition: Lean vs Fat Mass</text><rect x="30" y="60" width="380" height="50" fill="var(--svg-eeeeee)"/><rect x="30" y="60" width="304" height="50" fill="var(--svg-22c55e)"/><rect x="334" y="60" width="76" height="50" fill="var(--svg-ef4444)"/><text x="182" y="90" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-ffffff)">Lean Mass ~80%</text><text x="372" y="90" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-ffffff)">Fat ~20%</text><circle cx="50" cy="150" r="6" fill="var(--svg-22c55e)"/><text x="65" y="154" font-size="12" fill="var(--svg-333333)">Lean Mass: muscle, bone, organs, water</text><circle cx="50" cy="175" r="6" fill="var(--svg-ef4444)"/><text x="65" y="179" font-size="12" fill="var(--svg-333333)">Fat Mass: stored body fat</text><text x="220" y="220" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Three validated estimation formulas:</text><text x="220" y="240" text-anchor="middle" font-size="12" fill="var(--svg-3b82f6)">Boer (1984) &middot; James (1976) &middot; Hume (1966)</text></svg>',
      alt: 'Body composition bar chart showing lean mass vs fat mass with approximate 80/20 split',
      caption: 'Lean body mass comprises muscle, bone, organs and water; formulas estimate LBM from height and weight',
    },
    formulaDescription:
      'Lean Body Mass (LBM) is total body weight minus fat mass. Fat-Free Mass (FFM) is slightly different — it includes essential lipids in cell membranes, bone marrow, and organs. LBM and FFM are often used interchangeably but FFM is technically ~2–3% lower. These formulas estimate LBM from height and weight without requiring body fat measurements.',
    variables: [
      { symbol: 'Boer', name: 'Boer Formula (1984)', description: 'Developed on a Dutch population. Widely used in clinical settings for drug dosing and basal metabolic rate estimation.' },
      { symbol: 'James', name: 'James Formula (1976)', description: 'Part of the Schofield equations for BMR. Uses a squared weight-to-height ratio term.' },
      { symbol: 'Hume', name: 'Hume Formula (1966)', description: 'The oldest formula, developed on a US population. Tends to give slightly lower estimates for muscular individuals.' },
    ],
    howToUse: [
      'Select your unit system and biological sex.',
      'Enter your weight and height.',
      'Review all three LBM formula results plus the average.',
      'The estimated fat mass and lean mass percentage provide a body composition snapshot without tape measurements.',
      'Compare the formula results — the spread between Boer, James, and Hume shows you the range of possible estimates for your body type.',
    ],
    explanation:
      'Lean Body Mass (LBM) is everything in your body that is not fat — muscle, bone, organs, connective tissue, and water. It is metabolically active tissue: the more LBM you carry, the higher your resting metabolic rate. These three formulas (Boer, James, Hume) estimate LBM from just height and weight, making them useful when body fat measurements are not available. They are generally accurate to within ±3–4% for the general population but can be inaccurate for very muscular individuals or the elderly. The average of all three is more reliable than any single formula. For clinical precision, DEXA, Bod Pod, or hydrostatic weighing are superior. LBM is distinct from Fat-Free Mass (FFM), which excludes all lipids, including essential fats in cell membranes and the nervous system — FFM is typically 2–3% lower than LBM. A practical example: a 180 lb male at 15% body fat has 27 lbs of fat mass and 153 lbs of lean body mass. If he gains 10 lbs of muscle (becoming 190 lbs at ~13% body fat), his BMR increases by roughly 60–70 calories per day — demonstrating how increasing LBM creates a subtle but real metabolic advantage over time. Conversely, a sedentary person losing 10 lbs of muscle during a crash diet effectively lowers their BMR, making it harder to maintain weight loss (a phenomenon called metabolic adaptation). LBM also plays a critical role in longevity: higher muscle mass is associated with better glucose metabolism, higher bone density, and reduced fall risk in older adults.',
    faqs: [
      {
        question: 'What is the difference between LBM and FFM?',
        answer: 'Lean Body Mass includes everything except stored fat. Fat-Free Mass also excludes essential lipids (in cell membranes, bone marrow, nervous system). FFM is typically 2–3% lower than LBM. The terms are often used interchangeably but are technically different.',
      },
      {
        question: 'Which LBM formula is most accurate?',
        answer: 'Boer (1984) is generally considered the most accurate for the general population and is widely used in clinical research. James is preferred for metabolic rate calculations. Hume tends to give lower values for muscular individuals. The average of all three is recommended for general use.',
      },
      {
        question: 'Can I gain LBM while losing fat?',
        answer: 'LBM is the primary determinant of BMR. Muscle tissue burns ~13 kcal/kg/day at rest, while fat tissue burns only ~4.5 kcal/kg/day. Each pound of muscle gained increases daily resting energy expenditure by approximately 6–7 calories. This is why building muscle supports long-term weight management.',
      },
    ],
    commonUses: [
      'BMR and TDEE calculation — knowing your LBM enables the Katch-McArdle BMR formula, which is more accurate than weight-based formulas for lean and athletic individuals',
      'Body composition tracking — estimate fat mass and lean mass without calipers or specialized equipment by using validated height-and-weight formulas',
      'Drug dosing reference — several medications (e.g., chemotherapy agents, anesthetics) use lean body mass for dosing adjustments rather than total body weight',
      'Muscle gain measurement — track changes in estimated LBM over time to evaluate the effectiveness of resistance training and protein intake programs'
    ],
  
    citations: [
      { source: 'NIH - Body Composition Research', url: 'https://www.niddk.nih.gov/health-information/weight-management' },
      { source: 'National Academies - Dietary Reference Intakes', url: 'https://nap.nationalacademies.org/catalog/10490/dietary-reference-intakes-for-energy-carbohydrate-fiber-fat-fatty-acids-cholesterol-protein-and-amino-acids' },
    ],
  },
};

export default leanBodyMassConfig;
