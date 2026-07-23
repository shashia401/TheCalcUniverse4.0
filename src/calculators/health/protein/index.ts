import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ProteinPanel from './ProteinPanel';

const GOAL_RANGES: Record<string, { label: string; minG: number; maxG: number }> = {
  maintain: { label: 'Maintain (1.2–1.6 g/kg)', minG: 1.2, maxG: 1.6 },
  cut: { label: 'Fat Loss / Cut (1.6–2.2 g/kg)', minG: 1.6, maxG: 2.2 },
  bulk: { label: 'Muscle Gain / Bulk (1.6–2.2 g/kg)', minG: 1.6, maxG: 2.2 },
  athlete: { label: 'Endurance Athlete (1.4–1.8 g/kg)', minG: 1.4, maxG: 1.8 },
};

const proteinConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'unit',
      label: 'Weight Unit',
      type: 'select',
      required: true,
      helpText: 'Choose pounds (lbs) or kilograms (kg) for your body weight',
      options: [
        { label: 'Pounds (lbs)', value: 'imperial' },
        { label: 'Kilograms (kg)', value: 'metric' },
      ],
    },
    {
      id: 'weight',
      label: 'Body Weight',
      type: 'number',
      placeholder: '170',
      min: 0,
      step: 0.5,
      required: true,
      helpText: 'Used to calculate daily protein target in grams per kilogram',
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      placeholder: '30',
      unit: 'years',
      min: 15,
      max: 100,
      step: 1,
      required: true,
      helpText: 'Used for BMI calculation and general health context',
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
      min: 0,
      step: 0.1,
      helpText: 'Metric only',
      showWhen: (v) => v.unit === 'metric',
    },
    {
      id: 'goal',
      label: 'Goal & Activity Level',
      type: 'select',
      required: true,
      helpText: 'Your fitness goal determines the protein range — higher for muscle gain or fat loss',
      options: [
        { label: 'Maintain (sedentary to light activity) — 1.2–1.6 g/kg', value: 'maintain' },
        { label: 'Fat Loss / Cut (calorie deficit, resistance training) — 1.6–2.2 g/kg', value: 'cut' },
        { label: 'Muscle Gain / Bulk (calorie surplus, resistance training) — 1.6–2.2 g/kg', value: 'bulk' },
        { label: 'Endurance Athlete (run/cycle/swim 6+ hrs/week) — 1.4–1.8 g/kg', value: 'athlete' },
      ],
    },
    {
      id: 'trainingFrequency',
      label: 'Resistance Training Frequency',
      type: 'select',
      options: [
        { label: 'None or minimal', value: 'none' },
        { label: '1–2 days per week', value: 'light' },
        { label: '3–4 days per week (Recommended)', value: 'moderate' },
        { label: '5–6 days per week', value: 'heavy' },
      ],
      helpText: 'Used to fine-tune your target within the evidence-based range.',
    },
  ],
  calculate: (values) => {
    const unit = values.unit || 'imperial';
    const weight = parseFloat(values.weight);
    const goal = values.goal || 'maintain';
    const training = values.trainingFrequency || 'moderate';

    let weightKg: number;

    if (unit === 'imperial') {
      weightKg = weight * 0.45359237;
    } else {
      weightKg = weight;
    }

    if (isNaN(weightKg) || weightKg <= 0) return [];

    const ranges = GOAL_RANGES[goal] ?? GOAL_RANGES.maintain;

    // Training adjustment within the range
    const trainingAdjust: Record<string, number> = { none: 0, light: 0.1, moderate: 0.3, heavy: 0.5 };
    const adjust = trainingAdjust[training] ?? 0.3;
    const adjustedMin = ranges.minG;
    const adjustedMax = ranges.maxG;
    const targetGPerKg = adjustedMin + (adjustedMax - adjustedMin) * (0.3 + adjust * 0.4);

    const dailyMin = Math.round(weightKg * adjustedMin);
    const dailyMax = Math.round(weightKg * adjustedMax);
    const dailyTarget = Math.round(weightKg * Math.min(Math.max(targetGPerKg, adjustedMin), adjustedMax));
    const calFromProtein = dailyTarget * 4;

    // Per-meal breakdown (spread across 3–5 meals)
    const meals3 = Math.round(dailyTarget / 3);
    const meals4 = Math.round(dailyTarget / 4);
    const meals5 = Math.round(dailyTarget / 5);

    // Food equivalents
    const chickenBreastG = dailyTarget / 31; // 3 oz = ~26g protein
    const eggsCount = dailyTarget / 6; // 1 large egg = ~6g
    const wheyScoops = dailyTarget / 25; // 1 scoop = ~25g
    const greekYogurtCups = dailyTarget / 17; // 3/4 cup = ~17g
    const salmonG = dailyTarget / 22; // 3 oz = ~22g

    // Max per meal for optimal MPS (muscle protein synthesis)
    const maxPerMeal = Math.round(0.4 * weightKg);
    const mealsOptimal = Math.ceil(dailyTarget / maxPerMeal);

    const fmt = (n: number) => n.toLocaleString(undefined);

    return [
      {
        id: 'dailyProteinRange',
        label: `Daily Protein (${ranges.label})`,
        value: `${fmt(dailyMin)}–${fmt(dailyMax)} g/day · ${fmt(calFromProtein)} kcal`,
        highlight: true,
        color: 'positive',
        interpretation: `The low end maintains muscle; the high end supports building it. Your body uses only about ${maxPerMeal}g per meal for muscle synthesis, so spreading intake across ~${mealsOptimal} meals beats one large dose. Protein also blunts hunger, which helps most on a calorie deficit.`,
      },
      {
        id: 'dailyTarget',
        label: 'Target (adjusted for training frequency)',
        value: `${fmt(dailyTarget)} g/day · ${fmt(dailyTarget * 4)} kcal · ${targetGPerKg.toFixed(2)} g/kg`,
        color: 'neutral',
      },
      {
        id: 'perMeal',
        label: 'Per Meal Breakdown',
        value: `${fmt(meals5)} g × 5 meals · ${fmt(meals4)} g × 4 meals · ${fmt(meals3)} g × 3 meals`,
        color: 'neutral',
      },
      {
        id: 'mpsOptimal',
        label: 'Optimal Meal Schedule for Muscle Protein Synthesis',
        value: `${fmt(mealsOptimal)} meals/day at ~${fmt(maxPerMeal)} g per meal (max 0.4 g/kg/meal)`,
        color: 'positive',
      },
      {
        id: 'foodEquivalents',
        label: 'Daily Food Equivalents',
        value: `~${chickenBreastG.toFixed(0)} chicken breasts · ${eggsCount.toFixed(0)} eggs · ${wheyScoops.toFixed(0)} whey scoops · ${greekYogurtCups.toFixed(0)} cups Greek yogurt · ${salmonG.toFixed(0)} oz salmon`,
        color: 'neutral',
      },
      {
        id: 'weightPct',
        label: 'Protein as % of Daily Calories (at 2,000 kcal baseline)',
        value: `${Math.round(calFromProtein / 2000 * 100)}% of 2,000 kcal diet (adjust for your actual calorie intake)`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ProteinPanel, { values, results });
  },
  educational: {
    formula: 'Protein (g) = Weight (kg) × g/kg factor | 1 g protein = 4 kcal | Max MPS per meal ≈ 0.4 g/kg',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Protein Sources Comparison</text><text x="50" y="70" font-size="12" fill="var(--svg-333333)">Chicken (3 oz)</text><rect x="180" y="58" width="120" height="16" rx="3" fill="var(--svg-3b82f6)"><title>Chicken (3 oz): 26g protein</title></rect><text x="310" y="72" font-size="11" fill="var(--svg-333333)">26g protein</text><text x="50" y="110" font-size="12" fill="var(--svg-333333)">Salmon (3 oz)</text><rect x="180" y="98" width="100" height="16" rx="3" fill="var(--svg-22c55e)"><title>Salmon (3 oz): 22g protein</title></rect><text x="290" y="112" font-size="11" fill="var(--svg-333333)">22g protein</text><text x="50" y="150" font-size="12" fill="var(--svg-333333)">Whey (1 scoop)</text><rect x="180" y="138" width="115" height="16" rx="3" fill="var(--svg-8b5cf6)"><title>Whey (1 scoop): 25g protein</title></rect><text x="305" y="152" font-size="11" fill="var(--svg-333333)">25g protein</text><text x="50" y="190" font-size="12" fill="var(--svg-333333)">Eggs (1 large)</text><rect x="180" y="178" width="28" height="16" rx="3" fill="var(--svg-f59e0b)"><title>Eggs (1 large): 6g protein</title></rect><text x="218" y="192" font-size="11" fill="var(--svg-333333)">6g protein</text><text x="220" y="245" text-anchor="middle" font-size="12" fill="var(--svg-8b5cf6)" font-weight="bold">Target: 1.6-2.2 g/kg body weight per day</text></svg>',
      alt: 'Bar chart comparing protein content of chicken (26g), salmon (22g), whey (25g), and eggs (6g)',
      caption: 'Protein needs are 1.6-2.2 g/kg per day for active individuals; spread across 3-5 meals',
    },
    formulaDescription:
      'The evidence-based range of 1.6–2.2 g/kg per day comes from the ISSN, ACSM, and international sports nutrition consensus statements. Higher intakes within the range support muscle gain and preservation during calorie deficits. The body has a per-meal ceiling for muscle protein synthesis (MPS) of approximately 0.4 g/kg.',
    variables: [
      { symbol: 'MPS', name: 'Muscle Protein Synthesis', description: 'The biological process of building new muscle tissue. Stimulated by resistance training and dietary protein. Has a per-meal ceiling of ~0.4 g/kg.' },
      { symbol: 'Leucine', name: 'Leucine Threshold', description: 'The amino acid trigger for MPS. A meal needs ~2–3g of leucine (found in ~25–30g of quality protein) to maximally stimulate MPS.' },
      { symbol: 'g/kg', name: 'Grams Per Kilogram', description: 'The standard unit for protein recommendations. 1.6–2.2 g/kg is the evidence-based range for active individuals. "Grams per pound" (0.73–1.0 g/lb) is the imperial equivalent.' },
    ],
    howToUse: [
      'Enter your weight and unit system.',
      'Select your goal — from maintenance to muscle gain.',
      'Select your resistance training frequency to fine-tune the target within the evidence-based range.',
      'Review your daily target, per-meal breakdown, and food equivalents for practical planning.',
      'Use the per-meal breakdown to plan your protein distribution across 3–5 meals for optimal muscle protein synthesis.',
    ],
    explanation:
      'The "1 gram per pound of body weight" rule that dominates gym culture is a simplification that overestimates need for most people. The actual evidence-based range is 1.6–2.2 g per kg of body weight (0.73–1.0 g per lb) for most active individuals. Higher intake (up to 2.2 g/kg) is beneficial during calorie restriction (cutting) where protein\'s thermic effect and satiety are advantageous. The key to muscle growth is not just total daily protein but also its distribution: 3–5 meals with ~0.4 g/kg each maximally stimulate muscle protein synthesis throughout the day. Consuming more than ~0.4 g/kg in a single meal provides no additional MPS benefit — the excess is oxidized for energy. Leucine, a branched-chain amino acid, is the primary trigger for MPS. A meal needs ~2–3g of leucine (found in ~25–30g of quality protein) to maximally stimulate synthesis. A post-workout meal with 30–40g of protein is the most important feeding window.',
    faqs: [
      {
        question: 'Can I eat too much protein?',
        answer: 'For healthy individuals, high protein intake (up to 3.3 g/kg) is safe and does not damage kidneys or liver. However, intakes above 2.2 g/kg provide no additional muscle-building benefit and may displace other nutrients. Individuals with pre-existing kidney disease should consult their doctor.',
      },
      {
        question: 'When should I have protein post-workout?',
        answer: 'The "anabolic window" is wider than commonly thought — you have 4–6 hours post-workout, not 30 minutes. However, consuming 30–40g of protein within 2 hours of training is optimal timing. The most important factor is total daily intake, not precise timing.',
      },
      {
        question: 'Is plant protein as effective as animal protein?',
        answer: 'Plant protein can be effective but requires more attention to amino acid profiles. Animal proteins (whey, egg, meat) are "complete" — they contain all essential amino acids in ratios that strongly stimulate MPS. Most plant proteins are lower in leucine (the key MPS trigger), lysine, and methionine. To match animal protein effectiveness, combine complementary plant proteins (e.g., rice + pea, soy + wheat) and aim for ~35–40g of plant protein per meal vs. ~25–30g of animal protein. Soy and pea protein isolate score well among plant options, while single sources like wheat or rice protein are less effective for MPS. Overall, a varied plant-based diet with adequate total protein (2.0–2.2 g/kg) supports muscle growth similarly to animal protein.',
      },
    ],
    commonUses: [
      'Muscle building nutrition — use the 1.6-2.2 g/kg range with per-meal distribution (~0.4 g/kg per meal) to maximize muscle protein synthesis throughout the day',
      'Fat loss protein planning — set protein targets at the upper end of the range (2.2 g/kg) during calorie restriction to preserve lean mass and increase satiety',
      'Post-workout nutrition timing — plan 30-40g protein meals within 2 hours of training, taking advantage of the 4-6 hour anabolic window for optimal recovery',
      'Vegetarian and vegan diet planning — ensure adequate plant protein intake with complementary amino acid profiles and higher per-meal targets (~35-40g vs 25-30g animal)'
    ],
  
    citations: [
      { source: 'NIH - Dietary Protein', url: 'https://ods.od.nih.gov/factsheets/Protein-HealthProfessional/' },
      { source: 'WHO/FAO - Protein Requirements', url: 'https://www.who.int/publications/i/item/9789241209352' },
    ],
  },
};

export default proteinConfig;
