import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import BMRComparisonPanel from './BMRComparisonPanel';

const bmrConfig: CalculatorConfig = {
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
      id: 'formula',
      label: 'BMR Formula',
      type: 'select',
      required: true,
      helpText: 'Mifflin-St Jeor is recommended for most people. Katch-McArdle requires body fat %.',
      options: [
        { label: 'Mifflin-St Jeor (Recommended)', value: 'mifflin' },
        { label: 'Harris-Benedict (Revised 1984)', value: 'harris' },
        { label: 'Katch-McArdle (Requires body fat %)', value: 'katch' },
      ],
    },
    {
      id: 'sex',
      label: 'Biological Sex',
      type: 'select',
      required: true,
      helpText: 'Used in BMR formulas — male and female equations use different constants',
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
      min: 15,
      max: 100,
      step: 1,
      required: true,
      helpText: 'Age in years — BMR decreases ~2% per decade after age 20',
    },
    {
      id: 'weight',
      label: 'Weight',
      type: 'number',
      placeholder: '170',
      inputMode: 'decimal',
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
      inputMode: 'decimal',
      min: 0,
      max: 9,
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
      inputMode: 'decimal',
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
      placeholder: '175',
      unit: 'cm',
      inputMode: 'decimal',
      min: 0,
      step: 0.1,
      helpText: 'Metric only',
      showWhen: (v) => v.unit === 'metric',
    },
    {
      id: 'bodyFatPct',
      label: 'Body Fat %',
      type: 'number',
      placeholder: '20',
      unit: '%',
      inputMode: 'decimal',
      min: 2,
      max: 70,
      step: 0.1,
      helpText: 'Required for Katch-McArdle. Optional for comparison.',
    },
  ],
  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const unit = values.unit || 'imperial';
    const formula = values.formula || 'mifflin';
    const sex = values.sex || 'male';
    const age = parseFloat(values.age);
    const bodyFatPct = parseFloat(values.bodyFatPct);

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

    if ([age, weightKg, heightCm].some(isNaN) || weightKg <= 0 || heightCm <= 0) return [];

    let mifflin: number;
    let harris: number;
    let katch: number | null = null;

    if (sex === 'male') {
      mifflin = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
      harris = 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;
    } else {
      mifflin = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
      harris = 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.330 * age;
    }

    if (!isNaN(bodyFatPct) && bodyFatPct > 0 && values.bodyFatPct !== '') {
      const leanMass = weightKg * (1 - bodyFatPct / 100);
      katch = 370 + 21.6 * leanMass;
    }

    const primaryBMR = formula === 'katch' && katch !== null
      ? katch
      : formula === 'harris'
      ? harris
      : mifflin;

    const formulaLabel = formula === 'mifflin'
      ? 'Mifflin-St Jeor'
      : formula === 'harris'
      ? 'Harris-Benedict'
      : 'Katch-McArdle';

    const fmt = (n: number) => Math.round(n).toLocaleString(undefined);

    const results: CalculatorResult[] = [
      {
        id: 'primaryBMR',
        label: `BMR — ${formulaLabel}`,
        value: `${fmt(primaryBMR)} kcal/day`,
        highlight: true,
        color: 'neutral' as const,
        interpretation: `Your body burns ${fmt(primaryBMR)} kcal/day (${(primaryBMR / 24).toFixed(0)}/hour) at complete rest — before any movement or digestion. The ${formulaLabel} equation${formula === 'mifflin' ? ` (the ${sex === 'female' ? '−161' : '+5'} term is the ${sex}-specific constant)` : ''} estimates within ±10% for most people; ${Math.abs(mifflin - harris) > primaryBMR * 0.05 ? `note your Mifflin-St Jeor (${fmt(mifflin)}) and Harris-Benedict (${fmt(harris)}) estimates differ by ${fmt(Math.abs(mifflin - harris))} kcal — Mifflin-St Jeor is the more accurate modern standard` : 'your two formula estimates agree closely, which increases confidence in the number'}. Remember BMR is not a calorie target — multiply by your activity factor (TDEE) before planning a diet.`,
      },
      {
        id: 'hourlyBurn',
        label: 'Calories Burned Per Hour at Rest',
        value: `${(primaryBMR / 24).toFixed(1)} kcal/hour`,
        color: 'neutral' as const,
      },
      {
        id: 'formulaLine',
        label: `Formula Used (${formulaLabel})`,
        value: formula === 'mifflin'
          ? `10 × ${weightKg.toFixed(1)}kg + 6.25 × ${heightCm.toFixed(0)}cm − 5 × ${age} + ${sex === 'male' ? '5' : '(−161)'} = ${fmt(primaryBMR)}`
          : formula === 'harris'
          ? sex === 'male'
            ? `88.362 + 13.397 × ${weightKg.toFixed(1)} + 4.799 × ${heightCm.toFixed(0)} − 5.677 × ${age} = ${fmt(harris)}`
            : `447.593 + 9.247 × ${weightKg.toFixed(1)} + 3.098 × ${heightCm.toFixed(0)} − 4.330 × ${age} = ${fmt(harris)}`
          : katch !== null
          ? `370 + 21.6 × ${(weightKg * (1 - bodyFatPct / 100)).toFixed(1)}kg lean mass = ${fmt(katch)}`
          : 'Body fat % required for Katch-McArdle',
        color: 'neutral' as const,
      },
      {
        id: 'mifflinLine',
        label: 'Mifflin-St Jeor BMR',
        value: `${fmt(mifflin)} kcal/day`,
        color: 'neutral' as const,
      },
      {
        id: 'harrisLine',
        label: 'Harris-Benedict BMR',
        value: `${fmt(harris)} kcal/day`,
        color: 'neutral' as const,
      },
    ];

    if (katch !== null) {
      results.push({
        id: 'katchLine',
        label: 'Katch-McArdle BMR',
        value: `${fmt(katch)} kcal/day`,
        color: 'neutral' as const,
      });
    }

    results.push({
      id: 'safeMinimum',
      label: 'Safe Minimum Calorie Intake (BMR)',
      value: `Never eat below ${fmt(primaryBMR)} kcal/day`,
      color: 'negative' as const,
    });

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BMRComparisonPanel, { values, results });
  },
  educational: {
    formula: 'Mifflin-St Jeor: BMR = 10W + 6.25H − 5A + S | Katch-McArdle: BMR = 370 + 21.6 × LBM',
    formulaDescription:
      'BMR is the number of calories your body burns at complete rest to sustain basic physiological functions. It is the floor of your caloric needs — you should never eat below this number.',
    diagram: {
      svg: '<svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="210" y="24" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">What Burns Your Daily Calories?</text>' +
        '<!-- BMR bar --><rect x="30" y="45" width="280" height="36" rx="6" fill="var(--svg-3b82f6)"/>' +
        '<text x="310" y="69" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)">BMR (60-75%)</text>' +
        '<text x="170" y="69" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Basal Metabolism</text>' +
        '<!-- NEAT bar --><rect x="30" y="90" width="70" height="36" rx="6" fill="var(--svg-22c55e)"/>' +
        '<text x="310" y="114" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)">NEAT (10-15%)</text>' +
        '<text x="65" y="114" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Daily Movement</text>' +
        '<!-- TEF bar --><rect x="30" y="135" width="50" height="36" rx="6" fill="var(--svg-f59e0b)"/>' +
        '<text x="310" y="159" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)">TEF (~10%)</text>' +
        '<text x="55" y="159" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Digesting Food</text>' +
        '<text x="210" y="195" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">BMR is by far the largest piece of your daily calorie burn — even at rest</text>' +
        '</svg>',
      alt: 'Horizontal bar chart comparing BMR, NEAT, and TEF as components of daily calorie expenditure',
      caption: 'Basal Metabolic Rate (BMR) accounts for 60-75% of total daily calorie burn, far more than physical activity',
    },
    variables: [
      { symbol: 'W', name: 'Weight (kg)', description: 'Total body weight in kilograms.' },
      { symbol: 'H', name: 'Height (cm)', description: 'Height in centimeters.' },
      { symbol: 'A', name: 'Age', description: 'Age in years — BMR decreases ~2% per decade after age 20.' },
      { symbol: 'S', name: 'Sex Constant', description: '+5 for males, −161 for females (Mifflin-St Jeor).' },
      { symbol: 'LBM', name: 'Lean Body Mass', description: 'Total weight minus fat mass. Used by Katch-McArdle for more precision.' },
    ],
    howToUse: [
      'Select your unit system (Imperial or Metric).',
      'Select the BMR formula — Mifflin-St Jeor is recommended for most people.',
      'Enter your sex, age, weight, and height.',
      'Optionally enter body fat % for Katch-McArdle or cross-formula comparison.',
      'The formula line shows the exact math so you can verify the calculation.',
    ],
    explanation:
      'BMR is your body\'s idle fuel consumption — the calories burned for breathing, circulation, cell repair, and temperature regulation while completely at rest. It represents the minimum caloric intake necessary to survive. The safe minimum calorie intake shown is your BMR: eating below this number causes your body to break down muscle and organ tissue for fuel. To calculate how many calories you actually need including activity, multiply BMR by an activity factor to get TDEE. Mifflin-St Jeor (1990) is the most validated for the general population, developed using a sample of 498 healthy adults. Harris-Benedict (1919, revised 1984) tends to overestimate BMR by 5% or more on average. Katch-McArdle is most accurate for lean athletes with known body fat % because it uses lean body mass rather than total weight — this eliminates the error from estimating BMR for overweight individuals where fat mass inflates the weight-based formulas. BMR naturally declines with age by approximately 2% per decade after age 20, primarily due to sarcopenia (age-related muscle loss). However, this decline can be significantly slowed with consistent resistance training. Body composition changes explain most of the age-related BMR decrease, not aging itself. Women typically have a 5–10% lower BMR than men of the same age and weight because they carry proportionally more body fat and less muscle mass. The thermic effect of food adds roughly 10% on top of BMR, and physical activity accounts for the rest of total daily energy expenditure.',
    faqs: [
      {
        question: 'What is the most accurate BMR formula?',
        answer: 'Mifflin-St Jeor is most accurate for the general population. Katch-McArdle is more accurate for lean athletes if you know your body fat percentage. Harris-Benedict often overestimates by 5%.',
      },
      {
        question: 'Can I eat at my BMR to lose weight?',
        answer: 'Technically yes, but it is not recommended. Eating at BMR is considered a very low calorie diet (VLCD) and may cause muscle loss, nutrient deficiencies, and metabolic adaptation. A safer deficit is TDEE minus 250–500 calories.',
      },
      {
        question: 'Does BMR decrease with age?',
        answer: 'Yes. BMR drops approximately 2% per decade after age 20, primarily due to loss of muscle mass (sarcopenia). Resistance training is the most effective way to preserve metabolic rate as you age.',
      },
      {
        question: 'Does the time of day affect my BMR measurement?',
        answer: 'Yes. BMR is lowest during sleep and early morning hours (circadian nadir around 4 AM), and peaks in the late afternoon/early evening. Clinical BMR measurements are typically taken first thing in the morning after an 8-hour fast and 30 minutes of complete rest to standardize conditions. For practical purposes, your TDEE calculation already accounts for daily variations.',
      },
      {
        question: 'How does body composition affect BMR accuracy?',
        answer: 'Body composition is the single biggest factor affecting BMR accuracy. Two people of the same age, sex, weight, and height can have BMRs differing by 500+ kcal/day if one is muscular and the other has high body fat. Muscle tissue burns ~6 kcal/lb/day at rest, while fat tissue burns only ~2 kcal/lb/day. This is why Katch-McArdle (which uses lean body mass) is more accurate for individuals who know their body fat percentage.',
      },
    ],
    commonUses: [
      'Weight management planning — use BMR as the baseline for calculating TDEE and setting calorie targets for weight loss, gain, or maintenance with an appropriate deficit or surplus',
      'Nutrition program design — bodybuilders, athletes, and dietitians use BMR to establish the minimum safe caloric intake before adding activity and thermic effect adjustments',
      'Metabolic health assessment — compare BMR formula results to identify metabolic adaptations from prolonged dieting or to assess how body composition changes affect resting energy expenditure',
      'Clinical nutrition — healthcare providers use BMR equations for parenteral nutrition dosing, metabolic monitoring, and estimating energy needs in hospitalized patients'
    ],
  
    
    workedExamples: [
      {
        scenario: 'Sarah is a 30-year-old woman, 165 cm tall, weighing 65 kg. She wants her resting calorie burn using the recommended Mifflin-St Jeor equation.',
        inputs: {
          Sex: 'Female',
          Age: '30',
          Height: '165 cm',
          Weight: '65 kg',
          Formula: 'Mifflin-St Jeor',
        },
        result: 'BMR = 10 × 65 + 6.25 × 165 − 5 × 30 − 161 = 650 + 1,031 − 150 − 161 ≈ 1,370 kcal/day.',
        insight: 'Sarah burns about 1,370 calories a day at complete rest. That is her floor, not a diet target — eating below it for long stretches risks muscle loss. To get the calories she actually needs, she multiplies this by an activity factor (her TDEE).',
      },
      {
        scenario: 'Mark is a 40-year-old man, 180 cm tall, weighing 80 kg, using the same Mifflin-St Jeor equation.',
        inputs: {
          Sex: 'Male',
          Age: '40',
          Height: '180 cm',
          Weight: '80 kg',
          Formula: 'Mifflin-St Jeor',
        },
        result: 'BMR = 10 × 80 + 6.25 × 180 − 5 × 40 + 5 = 800 + 1,125 − 200 + 5 = 1,730 kcal/day.',
        insight: 'The only structural difference from Sarah\'s calculation is the sex constant (+5 for men instead of −161 for women). That single term is why men of similar size have a higher BMR — it stands in for their typically higher lean mass.',
      },
    ],

    proTips: [
      'BMR is calories burned at complete rest. Multiply it by an activity factor (1.2 sedentary up to 1.9 athlete) to get your TDEE — the number you actually plan meals around.',
      'Mifflin-St Jeor is the most accurate equation for the general population. Harris-Benedict tends to read about 5% high; only use Katch-McArdle if you know your body-fat percentage.',
      'Don\'t eat below your BMR for extended periods — it drives muscle loss and metabolic slowdown rather than sustainable fat loss.',
      'Recalculate after every ~10 lb (4–5 kg) of weight change; your BMR falls as you get lighter.',
    ],

    quickReference: [
      { label: 'Mifflin-St Jeor (men)', value: '10W + 6.25H − 5A + 5' },
      { label: 'Mifflin-St Jeor (women)', value: '10W + 6.25H − 5A − 161' },
      { label: 'BMR share of TDEE', value: '~60–75% for most people' },
    ],

    limitations: [
      'The equations estimate population averages — an individual\'s true BMR can vary by roughly ±10% due to genetics, hormones, and body composition.',
      'Weight-based formulas don\'t see muscle mass directly, so two people of identical weight and height can have meaningfully different real BMRs.',
      'Estimates are not validated for the severely obese, very lean athletes, children, or pregnant or breastfeeding people — use Katch-McArdle or clinical measurement instead.',
    ],
citations: [
      { source: 'NIH - Weight Management', url: 'https://www.niddk.nih.gov/health-information/weight-management' },
      { source: 'National Academies - Dietary Reference Intakes', url: 'https://nap.nationalacademies.org/catalog/10490/dietary-reference-intakes-for-energy-carbohydrate-fiber-fat-fatty-acids-cholesterol-protein-and-amino-acids' },
    ],
  },
};

export default bmrConfig;
