import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import IdealWeightPanel from './IdealWeightPanel';

const idealWeightConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'unit',
      label: 'Unit System',
      type: 'select',
      required: true,
      helpText: 'Choose Imperial (lbs, ft/in) or Metric (kg, cm)',
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
      helpText: 'All four ideal weight formulas use different constants for males and females',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
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
      required: true,
      helpText: 'Imperial only — feet portion of your height',
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
      required: true,
      helpText: 'Imperial only — remaining inches (0–11)',
      showWhen: (v) => v.unit === 'imperial',
    },
    {
      id: 'heightCm',
      label: 'Height — Centimeters',
      type: 'number',
      placeholder: '178',
      unit: 'cm',
      min: 0,
      step: 0.1,
      helpText: 'Metric only — total height in centimeters',
      showWhen: (v) => v.unit === 'metric',
    },
    {
      id: 'weight',
      label: 'Current Weight (Optional)',
      type: 'number',
      placeholder: '170',
      min: 0,
      step: 0.1,
      helpText: 'For comparison with ideal weight targets. Not required.',
    },
  ],
  calculate: (values) => {
    const unit = values.unit || 'imperial';
    const sex = values.sex || 'male';
    const currentWeight = parseFloat(values.weight);

    let totalInches: number;
    let heightCm: number;

    if (unit === 'imperial') {
      const ft = parseFloat(values.heightFt) || 0;
      const inches = parseFloat(values.heightIn) || 0;
      totalInches = ft * 12 + inches;
      heightCm = totalInches * 2.54;
    } else {
      heightCm = parseFloat(values.heightCm) || 0;
      totalInches = heightCm / 2.54;
    }

    if (totalInches <= 0 || heightCm <= 0) return [];

    const inchesOver5ft = Math.max(0, totalInches - 60);

    // --- Four Ideal Weight Formulas ---

    // Devine (1974) — in kg
    const devineKg = sex === 'male'
      ? 50 + 2.3 * inchesOver5ft
      : 45.5 + 2.3 * inchesOver5ft;

    // Robinson (1983) — in kg
    const robinsonKg = sex === 'male'
      ? 52 + 1.9 * inchesOver5ft
      : 49 + 1.7 * inchesOver5ft;

    // Miller (1983) — in kg
    const millerKg = sex === 'male'
      ? 56.2 + 1.41 * inchesOver5ft
      : 53.1 + 1.36 * inchesOver5ft;

    // Hamwi (1964) — in lbs then convert
    const hamwiLbs = sex === 'male'
      ? 106 + 6 * inchesOver5ft
      : 100 + 5 * inchesOver5ft;
    const hamwiKg = hamwiLbs * 0.45359237;

    // Healthy BMI range (18.5–24.9) in kg
    const heightM = heightCm / 100;
    const healthyLowKg = 18.5 * heightM * heightM;
    const healthyHighKg = 24.9 * heightM * heightM;

    const allKg = [devineKg, robinsonKg, millerKg, hamwiKg];
    const minIdeal = Math.min(...allKg);
    const maxIdeal = Math.max(...allKg);
    const avgIdeal = allKg.reduce((a, b) => a + b, 0) / allKg.length;

    const fmtKg = (n: number) => `${n.toFixed(1)} kg`;
    const fmtLbs = (n: number) => `${(n / 0.45359237).toFixed(0)} lbs`;
    const displayKg = (n: number) => unit === 'imperial' ? fmtLbs(n) : fmtKg(n);

    const results: Array<{ id: string; label: string; value: string; highlight?: boolean; color: 'positive' | 'negative' | 'neutral'; interpretation?: string }> = [
      {
        id: 'avgIdeal',
        label: 'Average Ideal Weight (4 formulas)',
        value: displayKg(avgIdeal),
        highlight: true,
        color: 'positive',
        interpretation: `This averages four classic formulas (Devine, Robinson, Miller, Hamwi), which is why the range below spans several pounds rather than one exact number. They use height and sex only — not muscle or frame — so a lean, muscular person can sit above "ideal" and still be healthy. Treat it as a rough anchor.`,
      },
      {
        id: 'rangeIdeal',
        label: 'Ideal Weight Range',
        value: `${displayKg(minIdeal)} – ${displayKg(maxIdeal)}`,
        color: 'neutral',
      },
      {
        id: 'devine',
        label: 'Devine Formula (1974)',
        value: displayKg(devineKg),
        color: 'neutral',
      },
      {
        id: 'robinson',
        label: 'Robinson Formula (1983)',
        value: displayKg(robinsonKg),
        color: 'neutral',
      },
      {
        id: 'miller',
        label: 'Miller Formula (1983)',
        value: displayKg(millerKg),
        color: 'neutral',
      },
      {
        id: 'hamwi',
        label: 'Hamwi Formula (1964)',
        value: displayKg(hamwiKg),
        color: 'neutral',
      },
      {
        id: 'bmiRange',
        label: 'Healthy BMI Range (18.5–24.9)',
        value: `${displayKg(healthyLowKg)} – ${displayKg(healthyHighKg)}`,
        color: 'positive',
      },
    ];

    if (!isNaN(currentWeight) && currentWeight > 0) {
      const currentKg = unit === 'imperial' ? currentWeight * 0.45359237 : currentWeight;
      const diff = currentKg - avgIdeal;
      const diffDisplay = unit === 'imperial'
        ? `${Math.abs(diff / 0.45359237).toFixed(1)} lbs`
        : `${Math.abs(diff).toFixed(1)} kg`;

      results.push({
        id: 'weightDiff',
        label: diff > 0.5
          ? 'Your Weight vs Average Ideal'
          : diff < -0.5
          ? 'Your Weight vs Average Ideal'
          : 'Your Weight vs Average Ideal',
        value: Math.abs(diff) < 0.5
          ? 'At average ideal weight'
          : `${diff > 0 ? '+' : '-'}${diffDisplay}`,
        color: Math.abs(diff) < 5 ? 'positive' : Math.abs(diff) < 10 ? 'neutral' : 'negative',
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(IdealWeightPanel, { values, results });
  },
  educational: {
    formula: 'Devine: 50 + 2.3(in >5ft) ♂ · 45.5 + 2.3(in >5ft) ♀ | 4 formulas use different constants',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Ideal Weight Formulas (5&apos;10&quot; male)</text><rect x="30" y="60" width="380" height="30" rx="4" fill="var(--svg-eeeeee)"/><rect x="30" y="60" width="296" height="30" rx="4" fill="var(--svg-3b82f6)" opacity=".3"/><text x="220" y="80" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Healthy BMI Range: 129-174 lbs</text><circle cx="175" cy="130" r="6" fill="var(--svg-3b82f6)"/><text x="175" y="153" text-anchor="middle" font-size="10" fill="var(--svg-3b82f6)">Miller 155</text><circle cx="200" cy="130" r="6" fill="var(--svg-22c55e)"/><text x="200" y="153" text-anchor="middle" font-size="10" fill="var(--svg-22c55e)">Robinson 157</text><circle cx="230" cy="130" r="6" fill="var(--svg-f59e0b)"/><text x="230" y="153" text-anchor="middle" font-size="10" fill="var(--svg-f59e0b)">Devine 161</text><circle cx="256" cy="130" r="6" fill="var(--svg-ef4444)"/><text x="256" y="153" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)">Hamwi 166</text><line x1="175" y1="130" x2="256" y2="130" stroke="var(--svg-8b5cf6)" stroke-width="2"/><text x="220" y="190" text-anchor="middle" font-size="12" fill="var(--svg-8b5cf6)" font-weight="bold">Avg ~160 lbs (range 155-166)</text><text x="220" y="220" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Formulas developed for drug dosing, not weight goals</text></svg>',
      alt: 'Ideal weight chart comparing four formulas (Devine, Robinson, Miller, Hamwi) with average marker',
      caption: 'Ideal weight formulas give different results; use the average and healthy BMI range as references',
    },
    formulaDescription:
      'Ideal body weight formulas were originally developed for clinical drug dosing, not personal weight targets. Each formula uses a different base weight and adjustment factor for height over 5 feet. The average across all four provides a more reliable reference than any single formula.',
    variables: [
      { symbol: 'Devine', name: 'Devine Formula', description: 'Developed for gentamicin dosing. 50 kg (♂) / 45.5 kg (♀) + 2.3 kg per inch over 5 ft. Tends to be higher for tall people.' },
      { symbol: 'Robinson', name: 'Robinson Formula', description: '52 kg (♂) / 49 kg (♀) + 1.9 kg (♂) / 1.7 kg (♀) per inch over 5 ft.' },
      { symbol: 'Miller', name: 'Miller Formula', description: '56.2 kg (♂) / 53.1 kg (♀) + 1.41 kg (♂) / 1.36 kg (♀) per inch over 5 ft. Most conservative for tall individuals.' },
      { symbol: 'Hamwi', name: 'Hamwi Formula', description: '106 lbs (♂) / 100 lbs (♀) for first 5 ft + 6 lbs (♂) / 5 lbs (♀) per additional inch. The only formula originally in pounds.' },
      { symbol: 'BMI Range', name: 'Healthy BMI Weight Range', description: 'The weight range corresponding to BMI 18.5–24.9 for your height. Considered a more evidence-based target than any single ideal weight formula.' },
    ],
    howToUse: [
      'Select your unit system (Imperial or Metric).',
      'Select your biological sex.',
      'Enter your height.',
      'Optionally enter your current weight to see how it compares to ideal ranges.',
      'Review all four formulas plus the average — use the range, not a single number.',
    ],
    explanation:
      'Ideal body weight is a clinical concept originally designed for medical dosing, not a strict health target. The four formulas (Devine, Robinson, Miller, Hamwi) give different results because they were developed on different populations at different times. For example, the Devine formula tends to give higher values for tall people, while Miller is more conservative. The "ideal" is better understood as a range (the spread between the lowest and highest formula results) rather than a single number. Factors like frame size, muscle mass, age, and ethnicity all affect what weight is healthy for you. The healthy BMI range provides an additional reference independent of formula selection. A practical example: a 5\'10" male might get ideal weights ranging from 160 lbs (Miller) to 178 lbs (Devine) depending on which formula is used. Neither is "right" or "wrong" — they simply use different assumptions. The average of all four (~169 lbs) is a reasonable reference, but an athlete with high muscle mass might be perfectly healthy at 185 lbs, while someone with a small frame might be healthier at 155 lbs. Rather than fixating on a single "ideal" number, use the BMI healthy weight range (18.5–24.9 for your height) as a science-backed target, and assess your body composition, energy levels, and metabolic health markers as more meaningful indicators of health than the number on the scale.',
    faqs: [
      {
        question: 'Why do the four formulas give different results?',
        answer: 'Each formula was developed on a different population sample. Devine uses the steepest adjustment (2.3 kg per inch), so it gives higher weights for tall people. Miller uses the most conservative adjustment, giving lower weights for tall individuals.',
      },
      {
        question: 'Should I use ideal weight as my weight loss goal?',
        answer: 'Not necessarily. The BMI healthy weight range (18.5–24.9) is a better target for most people. "Ideal weight" formulas often produce unrealistically low targets for people with larger frames or higher muscle mass. Focus on body composition, not just scale weight.',
      },
      {
        question: 'What about frame size?',
        answer: 'These formulas do not account for frame size, which significantly affects ideal weight. A person with a large frame may be healthy at the upper end of the range, while someone with a small frame may be healthy at the lower end. Wrist circumference is a crude proxy for frame size.',
      },
    ],
    commonUses: [
      'Clinical reference — healthcare professionals use the Devine formula for drug dosing calculations (e.g., gentamicin, theophylline) where weight-based dosing is insufficient',
      'Weight loss goal setting — use the average of all four formulas plus the healthy BMI range as an evidence-based reference range rather than fixating on a single number',
      'Medical nutrition assessment — dietitians reference ideal weight formulas when estimating nutritional needs for patients who cannot be weighed or have significant fluid shifts',
      'Fitness consultation — compare your current weight against multiple ideal weight formulas to understand the range of clinically normal weights for your height'
    ],
  
    citations: [
      { source: 'CDC - Body Weight Standards', url: 'https://www.cdc.gov/healthyweight/' },
      { source: 'NIH - Ideal Body Weight Reference', url: 'https://pubmed.ncbi.nlm.nih.gov/' },
    ],
  },
};

export default idealWeightConfig;
