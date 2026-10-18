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
      min: 20,
      max: 1500,
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
      min: 3,
      max: 8,
      step: 1,
      helpText: 'Imperial only',
      showWhen: (v) => v.unit === 'imperial',
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
      showWhen: (v) => v.unit === 'imperial',
    },
    {
      id: 'heightCm',
      label: 'Height — Centimeters',
      type: 'number',
      placeholder: '178',
      unit: 'cm',
      min: 90,
      max: 275,
      step: 0.1,
      helpText: 'Metric only',
      showWhen: (v) => v.unit === 'metric',
    },
  ],
  explainSteps: (values) => {
    // Guard: a runaway input (e.g. 1e999) must never print NaN/Infinity in a worked solution.
    const steps = (() => {
        const results = leanBodyMassConfig.calculate(values);
        if (!results.length) return [];
        const unit = values.unit || 'imperial';
        const male = (values.sex || 'male') === 'male';
        const val = (id: string) => results.find((r) => r.id === id)!.value;
        const n1 = (n: number) => n.toFixed(1);
        const input = parseFloat(values.weight);

        let weightKg: number;
        let heightCm: number;
        let convert: string;
        if (unit === 'imperial') {
          const ft = parseFloat(values.heightFt) || 0;
          const inches = parseFloat(values.heightIn) || 0;
          weightKg = input * 0.45359237;
          heightCm = (ft * 12 + inches) * 2.54;
          convert = `${input} lb × 0.45359237 = ${n1(weightKg)} kg · (${ft} ft × 12 + ${inches} in) × 2.54 = ${n1(heightCm)} cm`;
        } else {
          weightKg = input;
          heightCm = parseFloat(values.heightCm) || 0;
          convert = `${n1(weightKg)} kg · ${n1(heightCm)} cm`;
        }
        const W = n1(weightKg);
        const H = n1(heightCm);

        const boer = male ? 0.407 * weightKg + 0.267 * heightCm - 19.2 : 0.252 * weightKg + 0.473 * heightCm - 48.3;
        const james = male
          ? 1.1 * weightKg - 128 * (weightKg / heightCm) ** 2
          : 1.07 * weightKg - 148 * (weightKg / heightCm) ** 2;
        const hume = male
          ? 0.3281 * weightKg + 0.33929 * heightCm - 29.5336
          : 0.29569 * weightKg + 0.41813 * heightCm - 43.2933;
        const clamp = (n: number) => Math.min(Math.max(n, 0), weightKg);
        const [b, j, h] = [boer, james, hume].map(clamp);
        const avg = (b + j + h) / 3;
        // Imperial results are in lbs, so show the kg working and then the displayed figure.
        const tail = (kg: number, id: string) => (unit === 'imperial' ? `${n1(kg)} kg = ${val(id)}` : val(id));
        const clampNote = (raw: number, v: number) => (raw !== v ? ` (limited to ${n1(v)} kg)` : '');
        const ratio = (weightKg / heightCm).toFixed(4);

        return [
          { label: 'Convert to kilograms and centimeters', expr: convert },
          {
            label: 'Boer (1984)',
            expr: `${male ? '0.407' : '0.252'} × ${W} + ${male ? '0.267' : '0.473'} × ${H} − ${male ? '19.2' : '48.3'} = ${tail(b, 'boer')}${clampNote(boer, b)}`,
          },
          {
            label: 'James (1976)',
            expr: `${male ? '1.1' : '1.07'} × ${W} − ${male ? 128 : 148} × (${W} ÷ ${H})² = ${male ? '1.1' : '1.07'} × ${W} − ${male ? 128 : 148} × ${ratio}² = ${tail(j, 'james')}${clampNote(james, j)}`,
            note: weightKg / (heightCm / 100) ** 2 >= 35 ? 'At a BMI this high the James formula is unreliable (its squared term makes it fall as weight rises), so lean on Boer and Hume.' : undefined,
          },
          {
            label: 'Hume (1966)',
            expr: `${male ? '0.32810' : '0.29569'} × ${W} + ${male ? '0.33929' : '0.41813'} × ${H} − ${male ? '29.5336' : '43.2933'} = ${tail(h, 'hume')}${clampNote(hume, h)}`,
          },
          {
            label: 'Average the three formulas',
            expr: `(${n1(b)} + ${n1(j)} + ${n1(h)}) ÷ 3 = ${tail(avg, 'avgLBM')}`,
            note: 'Lean body mass is everything that is not fat: muscle, bone, organs and water.',
          },
        ];
    })();
    return steps.some((s) => /NaN|Infinity/.test(s.expr)) ? [] : steps;
  },
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

    // James Formula (1976). The quadratic term makes it peak and then FALL as weight rises,
    // so at very high BMI it can go negative; clamp every formula to [0, body weight].
    const jamesKg = sex === 'male'
      ? 1.1 * weightKg - 128 * (weightKg / heightCm) ** 2
      : 1.07 * weightKg - 148 * (weightKg / heightCm) ** 2;

    // Hume Formula (1966)
    const humeKg = sex === 'male'
      ? 0.32810 * weightKg + 0.33929 * heightCm - 29.5336
      : 0.29569 * weightKg + 0.41813 * heightCm - 43.2933;

    const clampLbm = (n: number) => Math.min(Math.max(n, 0), weightKg);
    const allLbm = [boerKg, jamesKg, humeKg].map(clampLbm);
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
        interpretation: `This is the weight of everything that isn't fat — muscle, bone, organs, water — averaged across three formulas, which puts your body fat near ${bodyFatPct.toFixed(0)}%. LBM is what you want to preserve while losing weight; a deficit paired with protein and resistance training keeps the loss coming from fat, not muscle.${weightKg / (heightCm / 100) ** 2 >= 35 ? ' At a BMI this high the James formula is unreliable (its squared term makes it fall as weight rises), so lean on Boer and Hume.' : ''}`,
      },
      {
        id: 'boer',
        label: 'Boer Formula (1984)',
        value: display(allLbm[0]),
        color: 'neutral',
      },
      {
        id: 'james',
        label: 'James Formula (1976)',
        value: display(allLbm[1]),
        color: 'neutral',
      },
      {
        id: 'hume',
        label: 'Hume Formula (1966)',
        value: display(allLbm[2]),
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
      'Lean Body Mass (LBM) is total body weight minus fat mass. Fat-Free Mass (FFM) is slightly different — LBM includes the essential lipids in cell membranes, bone marrow, and organs, while FFM excludes all lipid. LBM and FFM are often used interchangeably, but FFM is technically lower by the amount of essential fat (roughly 3% of body weight in men, more in women). These formulas estimate LBM from height and weight without requiring body fat measurements.',
    variables: [
      { symbol: 'Boer', name: 'Boer Formula (1984)', description: 'Published in 1984 (Boer, Amsterdam). Widely used in clinical settings for drug dosing and for normalizing body-fluid volumes.' },
      { symbol: 'James', name: 'James Formula (1976)', description: 'Uses a squared weight-to-height ratio term, so it peaks and then falls as weight rises; unreliable at very high BMI.' },
      { symbol: 'Hume', name: 'Hume Formula (1966)', description: 'The oldest of the three (1966); linear in weight and height like Boer.' },
    ],
    howToUse: [
      'Select your unit system and biological sex.',
      'Enter your weight and height.',
      'Review all three LBM formula results plus the average.',
      'The estimated fat mass and lean mass percentage provide a body composition snapshot without tape measurements.',
      'Compare the formula results — the spread between Boer, James, and Hume shows you the range of possible estimates for your body type.',
    ],
    explanation:
      'Lean Body Mass (LBM) is everything in your body that is not fat — muscle, bone, organs, connective tissue, and water. It is metabolically active tissue: the more LBM you carry, the higher your resting metabolic rate. These three formulas (Boer, James, Hume) estimate LBM from just height and weight, making them useful when body fat measurements are not available. They are estimates: individual error can be several kilograms, and they can be inaccurate for very muscular individuals or the elderly. The average of all three is more reliable than any single formula. For clinical precision, DEXA, Bod Pod, or hydrostatic weighing are superior. LBM is distinct from Fat-Free Mass (FFM), which excludes all lipids, including essential fats in cell membranes and the nervous system — so FFM is lower than LBM by that essential fat. A practical example: a 180 lb male at 15% body fat has 27 lbs of fat mass and 153 lbs of lean body mass. If he gains 10 lbs of muscle (becoming 190 lbs at ~14% body fat, since the same 27 lbs of fat is now 14.2% of 190), his BMR increases by roughly 60 calories per day (4.5 kg × ~13 kcal/kg) — demonstrating how increasing LBM creates a subtle but real metabolic advantage over time. Conversely, a sedentary person losing 10 lbs of muscle during a crash diet effectively lowers their BMR, making it harder to maintain weight loss (a phenomenon called metabolic adaptation). LBM also plays a critical role in longevity: higher muscle mass is associated with better glucose metabolism, higher bone density, and reduced fall risk in older adults.',
    faqs: [
      {
        question: 'What is the difference between LBM and FFM?',
        answer: 'Lean Body Mass includes everything except stored fat. Fat-Free Mass also excludes essential lipids (in cell membranes, bone marrow, nervous system), so FFM is slightly lower than LBM. The terms are often used interchangeably but are technically different.',
      },
      {
        question: 'Which LBM formula is most accurate?',
        answer: 'No single formula is best for everyone. Boer and Hume are linear in weight and height; James has a squared term and becomes unreliable at high BMI. Averaging the three smooths out the quirks of any one equation, which is why this calculator reports the average.',
      },
      {
        question: 'Can I gain LBM while losing fat?',
        answer: 'LBM is the primary determinant of BMR. Muscle tissue burns ~13 kcal/kg/day at rest, while fat tissue burns only ~4.5 kcal/kg/day. Each pound of muscle gained increases daily resting energy expenditure by approximately 6 calories (13 kcal/kg ÷ 2.2). This is why building muscle supports long-term weight management.',
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
