import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import FatIntakePanel from './FatIntakePanel';

const fatIntakeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'unit',
      label: 'Unit System',
      type: 'select',
      required: true,
      helpText: 'Choose Imperial (lbs) or Metric (kg) for your body weight',
      options: [
        { label: 'Imperial (lbs)', value: 'imperial' },
        { label: 'Metric (kg)', value: 'metric' },
      ],
    },
    {
      id: 'weight',
      label: 'Body Weight',
      type: 'number',
      placeholder: '170',
      min: 0,
      step: 0.1,
      required: true,
      helpText: 'Pounds (lbs) for Imperial — Kilograms (kg) for Metric',
    },
    {
      id: 'goal',
      label: 'Dietary Goal',
      type: 'select',
      required: true,
      helpText: 'Your goal determines the recommended fat percentage range',
      options: [
        { label: 'Weight Loss (20–25% calories from fat)', value: 'loss' },
        { label: 'Maintenance / General Health (25–35%)', value: 'maintain' },
        { label: 'Ketogenic / Low-Carb (65–80%)', value: 'keto' },
        { label: 'Heart Health (25–30%, emphasis on unsaturated)', value: 'heart' },
      ],
    },
    {
      id: 'calories',
      label: 'Daily Calorie Target',
      type: 'number',
      placeholder: '2200',
      min: 0,
      step: 10,
      required: true,
      helpText: 'Your TDEE or target daily calorie intake',
    },
  ],
  calculate: (values) => {
    const weight = parseFloat(values.weight);
    const calories = parseFloat(values.calories);
    const goal = values.goal || 'maintain';

    if ([weight, calories].some(isNaN) || weight <= 0 || calories <= 0) return [];

    // Fat percentage ranges by goal
    const fatPctRange: Record<string, { low: number; high: number }> = {
      loss: { low: 0.20, high: 0.25 },
      maintain: { low: 0.25, high: 0.35 },
      keto: { low: 0.65, high: 0.80 },
      heart: { low: 0.25, high: 0.30 },
    };

    const range = fatPctRange[goal] || fatPctRange.maintain;
    const midPct = (range.low + range.high) / 2;

    // Total fat in grams (fat = 9 kcal/g)
    const totalLowG = Math.round((calories * range.low) / 9);
    const totalHighG = Math.round((calories * range.high) / 9);
    const midG = Math.round((calories * midPct) / 9);

    // AHA: saturated fat ≤ 5-6% of daily calories
    const satPctAHA = 0.06; // upper limit per AHA
    const satG = Math.round((calories * satPctAHA) / 9);

    // Monounsaturated: 10-15% of calories (AHA guidance)
    const monoLowG = Math.round((calories * 0.10) / 9);
    const monoHighG = Math.round((calories * 0.15) / 9);

    // Polyunsaturated: 5-10% of calories
    const polyLowG = Math.round((calories * 0.05) / 9);
    const polyHighG = Math.round((calories * 0.10) / 9);

    // Omega-3 specific: 0.6-1.2% of calories
    const omega3LowG = Math.round((calories * 0.006) / 9);
    const omega3HighG = Math.round((calories * 0.012) / 9);

    const fmt = (n: number) => n.toLocaleString(undefined);

    return [
      {
        id: 'totalFatRange',
        label: 'Total Fat (per day)',
        value: `${fmt(totalLowG)} – ${fmt(totalHighG)} g/day (${Math.round(range.low * 100)}–${Math.round(range.high * 100)}% of calories)`,
        highlight: true,
        color: 'neutral',
      },
      {
        id: 'totalFatTarget',
        label: 'Recommended Fat Target',
        value: `${fmt(midG)} g/day`,
        color: 'neutral',
      },
      {
        id: 'saturatedFat',
        label: 'Saturated Fat (AHA: ≤ 6% of calories)',
        value: `≤ ${fmt(satG)} g/day`,
        color: 'negative',
      },
      {
        id: 'monounsaturatedFat',
        label: 'Monounsaturated Fat (10–15% of calories)',
        value: `${fmt(monoLowG)} – ${fmt(monoHighG)} g/day`,
        color: 'positive',
      },
      {
        id: 'polyunsaturatedFat',
        label: 'Polyunsaturated Fat (5–10% of calories)',
        value: `${fmt(polyLowG)} – ${fmt(polyHighG)} g/day`,
        color: 'positive',
      },
      {
        id: 'omega3',
        label: 'Omega-3 Fatty Acids (0.6–1.2% of calories)',
        value: `${fmt(omega3LowG)} – ${fmt(omega3HighG)} g/day`,
        color: 'positive',
      },
      {
        id: 'fatCalories',
        label: 'Calories from Fat',
        value: `${fmt(midG * 9)} kcal/day (${Math.round(midPct * 100)}% of ${fmt(calories)} kcal)`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(FatIntakePanel, { values, results });
  },
  educational: {
    formula: 'Total Fat (g) = (Calories × Fat%) ÷ 9 | Saturated ≤ 6% of calories | 1 g fat = 9 kcal',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Dietary Fat Types Breakdown</text><rect x="80" y="60" width="50" height="30" rx="4" fill="var(--svg-ef4444)" opacity=".6"/><rect x="140" y="60" width="170" height="30" rx="4" fill="var(--svg-22c55e)" opacity=".6"/><rect x="320" y="60" width="100" height="30" rx="4" fill="var(--svg-3b82f6)" opacity=".6"/><text x="105" y="79" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)" font-weight="bold">Sat</text><text x="225" y="79" text-anchor="middle" font-size="10" fill="var(--svg-22c55e)" font-weight="bold">Mono</text><text x="370" y="79" text-anchor="middle" font-size="10" fill="var(--svg-3b82f6)" font-weight="bold">Poly</text><text x="220" y="110" text-anchor="middle" font-size="10" fill="var(--svg-666666)">&le; 6% &middot; 10-15% &middot; 5-10%</text><text x="220" y="140" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Saturated &mdash; limit (animal fats)</text><text x="220" y="160" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Unsaturated &mdash; prioritize (plant oils, fish)</text><text x="220" y="200" text-anchor="middle" font-size="12" fill="var(--svg-8b5cf6)">Total fat: 20-35% of daily calories</text></svg>',
      alt: 'Stacked bar chart showing saturated, monounsaturated, and polyunsaturated fat recommended proportions',
      caption: 'Saturated fat limited to 6% of calories; unsaturated fats (MUFA 10-15%, PUFA 5-10%) prioritized',
    },
    formulaDescription:
      'Dietary fat provides 9 calories per gram. The American Heart Association recommends total fat intake of 20–35% of daily calories, with saturated fat limited to 5–6% of calories. Replacing saturated fat with unsaturated fats supports cardiovascular health.',
    variables: [
      { symbol: 'Total Fat', name: 'Total Daily Fat', description: 'Sum of all dietary fat types. Provides essential fatty acids and enables absorption of fat-soluble vitamins A, D, E, K.' },
      { symbol: 'Saturated Fat', name: 'Saturated Fat Limit', description: 'Found in animal products, coconut oil, palm oil. AHA recommends ≤ 5–6% of daily calories for heart health.' },
      { symbol: 'Monounsaturated Fat', name: 'Monounsaturated Fat (MUFA)', description: 'Found in olive oil, avocados, nuts. Linked to reduced cardiovascular risk. 10–15% of daily calories.' },
      { symbol: 'Polyunsaturated Fat', name: 'Polyunsaturated Fat (PUFA)', description: 'Includes omega-3 and omega-6 essential fatty acids. Found in fish, flaxseed, walnuts. 5–10% of daily calories.' },
      { symbol: 'Omega-3', name: 'Omega-3 Fatty Acids', description: 'Essential fats with anti-inflammatory properties. EPA and DHA from fish are most beneficial. ALA from plant sources requires conversion. Target 0.6–1.2% of daily calories.' },
    ],
    howToUse: [
      'Enter your body weight and daily calorie target (use a TDEE calculator to find maintenance calories).',
      'Select your dietary goal — the fat percentage range adjusts accordingly.',
      'Review the total fat range and the saturated/mono/poly breakdown.',
      'Use the saturated fat limit as a daily ceiling, not a target.',
      'Try to meet the omega-3 recommendation through fatty fish (salmon, mackerel, sardines) or supplementation.',
    ],
    explanation:
      'Dietary fat is an essential macronutrient providing energy, supporting cell function, and enabling absorption of fat-soluble vitamins (A, D, E, K). The type of fat matters more than the total amount. The AHA recommends replacing saturated fats (animal fats, tropical oils) with unsaturated fats (olive oil, nuts, avocados) rather than reducing total fat intake. For heart health, keeping saturated fat to 5–6% of calories is a stronger predictor of cardiovascular outcomes than total fat reduction. A practical example: swapping just one tablespoon of butter (7g saturated fat) for olive oil (2g saturated fat) per day saves about 5g of saturated fat, which over a week adds up to 35g — making a meaningful dent in your saturated fat budget. The ketogenic diet is an exception: 65–80% of calories from fat induces nutritional ketosis, but should be undertaken with understanding of the long-term health implications and ideally under medical supervision, especially for individuals with lipid disorders or diabetes. Omega-3 fatty acids from fish (EPA and DHA) are particularly important for reducing inflammation and supporting brain health. The American Heart Association recommends eating at least two servings of fatty fish (salmon, mackerel, sardines, herring) per week to meet omega-3 needs. Plant-based omega-3s (ALA from flaxseed, chia, walnuts) are less efficiently converted to the active forms EPA and DHA, so vegetarians may benefit from algae-based DHA supplements.',
    faqs: [
      {
        question: 'How do I calculate my daily calorie target for this calculator?',
        answer: 'Use a TDEE calculator to find your maintenance calories, then adjust based on your goal: subtract 300–500 for weight loss, add 250–500 for muscle gain. Enter that adjusted number here.',
      },
      {
        question: 'What foods contain healthy unsaturated fats?',
        answer: 'Monounsaturated: olive oil, avocados, almonds, cashews, peanuts. Polyunsaturated (omega-3): salmon, mackerel, sardines, flaxseed, chia seeds, walnuts. Polyunsaturated (omega-6): sunflower oil, corn oil, soybean oil, walnuts.',
      },
      {
        question: 'Is saturated fat really that bad?',
        answer: 'The evidence shows that replacing saturated fat with polyunsaturated fat reduces cardiovascular risk by ~30%. Replacing saturated fat with refined carbohydrates does not reduce risk. The AHA recommends limiting saturated fat to 5–6% of calories, but the type of replacement matters as much as the reduction.',
      },
    ],
    commonUses: [
      'Heart-healthy meal planning — use the AHA-recommended saturated fat limit (≤6% of calories) to design meals that support cardiovascular health',
      'Ketogenic diet formulation — calculate the high fat intake (65-80% of calories) needed to achieve and maintain nutritional ketosis',
      'Weight loss fat budgeting — plan fat intake within 20-25% of calories to create a sustainable calorie deficit while maintaining essential fatty acid intake',
      'Omega-3 optimization — track EPA/DHA intake targets (0.6-1.2% of calories) to support anti-inflammatory and brain health goals through fatty fish or supplementation'
    ],
  
    citations: [
      { source: 'NIH - Dietary Fats', url: 'https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/' },
      { source: 'WHO - Dietary Fat Guidelines', url: 'https://www.who.int/publications/i/item/9789241547344' },
    ],
  },
};

export default fatIntakeConfig;
