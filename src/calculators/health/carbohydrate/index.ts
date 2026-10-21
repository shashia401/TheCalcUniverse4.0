import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import CarbohydratePanel from './CarbohydratePanel';
import { finiteSteps } from '../../../utils/explainGuard';
import { hasAnswer, resultValue } from '../../../utils/explainResults';
import { plainLocale as fmt } from '../../../lib/format';

const GOAL_RANGES: Record<string, { label: string; minG: number; maxG: number }> = {
  endurance: { label: 'Endurance Training (high volume)', minG: 7, maxG: 12 },
  moderate: { label: 'Moderate Exercise (3–5 hrs/week)', minG: 5, maxG: 7 },
  muscle: { label: 'Muscle Gain / Strength Training', minG: 4, maxG: 6 },
  fatLoss: { label: 'Fat Loss / Cutting', minG: 2, maxG: 4 },
  ketosis: { label: 'Ketosis / Very Low Carb', minG: 0.5, maxG: 1 },
};

/** The calculator's own arithmetic (weight in kg, mass the g/kg range applies to, daily grams), shared with explainSteps. */
function carbPlan(values: Record<string, string>) {
  const unit = values.unit || 'imperial';
  const weight = parseFloat(values.weight);
  const bodyFatPct = parseFloat(values.bodyFatPct);
  const ranges = GOAL_RANGES[values.goal || 'moderate'] ?? GOAL_RANGES.moderate;

  const weightKg = unit === 'imperial' ? weight * 0.45359237 : weight;
  if (isNaN(weightKg) || weightKg <= 0) return null;

  // Calculate from body weight or lean mass
  const useLean = !isNaN(bodyFatPct) && bodyFatPct > 0 && values.bodyFatPct !== '';
  const massForCalculation = useLean ? weightKg * (1 - bodyFatPct / 100) : weightKg;
  const massLabel = useLean ? 'per kg lean mass' : 'per kg body weight';

  const dailyMin = Math.round(massForCalculation * ranges.minG);
  const dailyMax = Math.round(massForCalculation * ranges.maxG);
  const dailyAvg = Math.round((dailyMin + dailyMax) / 2);
  return { unit, weight, bodyFatPct, useLean, weightKg, massForCalculation, ranges, massLabel, dailyMin, dailyMax, dailyAvg, calMin: dailyMin * 4, calMax: dailyMax * 4 };
}

/** Glycogen-loading grams per day: the calculator's fixed 8 g/kg target on total body weight. */
const LOAD_G_PER_KG = 8;

const carbohydrateConfig: CalculatorConfig = {
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
      min: 20,
      max: 1500,
      step: 0.5,
      required: true,
      helpText: 'Used to calculate carb target in grams per kilogram of body weight',
    },
    {
      id: 'bodyFatPct',
      label: 'Body Fat % (Optional)',
      type: 'number',
      placeholder: '15',
      unit: '%',
      min: 3,
      max: 70,
      step: 0.5,
      helpText: 'Optional. If entered, the g/kg range is applied to lean mass instead of total weight, which gives a lower target. Published sports-nutrition ranges are per kg of total body weight, so leave blank to follow them directly.',
    },
    {
      id: 'goal',
      label: 'Goal',
      type: 'select',
      required: true,
      helpText: 'Your activity level and fitness goal determine the carb range per kg of body weight',
      options: [
        { label: 'Endurance Training (7–12 g/kg) — Marathon, triathlon, long distance', value: 'endurance' },
        { label: 'Moderate Exercise (5–7 g/kg) — 3–5 hrs/week', value: 'moderate' },
        { label: 'Muscle Gain / Strength (4–6 g/kg)', value: 'muscle' },
        { label: 'Fat Loss / Cutting (2–4 g/kg)', value: 'fatLoss' },
        { label: 'Ketosis / Very Low Carb (0.5–1 g/kg)', value: 'ketosis' },
      ],
    },
    {
      id: 'eventDate',
      label: 'Event Date (for glycogen loading)',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
      helpText: 'For race/carb-loading timeline. Optional.',
    },
  ],
  explainSteps: (values) => {
    const rows = carbohydrateConfig.calculate(values);
    const plan = carbPlan(values);
    if (!hasAnswer(rows) || !plan) return [];
    const { unit, weight, bodyFatPct, useLean, weightKg, massForCalculation, ranges, dailyMin, dailyMax, dailyAvg } = plan;
    const kg = weightKg.toFixed(2);
    const steps = [
      {
        label: 'Convert your weight to kilograms',
        expr: unit === 'imperial' ? `${weight} lb × 0.45359237 = ${kg} kg` : `${weight} kg`,
      },
      ...(useLean
        ? [{
            label: 'Apply the range to lean mass (body fat % was entered)',
            expr: `${kg} kg × (1 − ${bodyFatPct}/100) = ${massForCalculation.toFixed(2)} kg`,
            note: 'Leave body fat blank to apply the range to total body weight instead.',
          }]
        : []),
      {
        label: `Daily carbohydrate range for ${ranges.label}`,
        expr: `${massForCalculation.toFixed(2)} kg × ${ranges.minG} = ${fmt(dailyMin)} g · ${massForCalculation.toFixed(2)} kg × ${ranges.maxG} = ${fmt(dailyMax)} g`,
      },
      {
        label: 'Average daily target',
        expr: `(${fmt(dailyMin)} + ${fmt(dailyMax)}) ÷ 2 = ${fmt(dailyAvg)} g/day`,
      },
      {
        label: 'Calories from that carbohydrate',
        expr: `${fmt(dailyAvg)} g × 4 kcal/g = ${fmt(dailyAvg * 4)} kcal`,
        note: 'Carbohydrate provides 4 kcal per gram.',
      },
    ];
    if (resultValue(rows, 'glycogenLoading')) {
      const loadG = Math.round(weightKg * LOAD_G_PER_KG);
      steps.push({
        label: 'Glycogen loading amount (event date entered)',
        expr: `${kg} kg × ${LOAD_G_PER_KG} g/kg = ${fmt(loadG)} g/day · ${fmt(loadG)} g × 4 = ${fmt(loadG * 4)} kcal`,
        note: 'The calculator applies a fixed 8 g/kg to total body weight for the 3 days before the event.',
      });
    }
    return finiteSteps(steps);
  },
  calculate: (values) => {
    const plan = carbPlan(values);
    if (!plan) return [];
    const { weightKg, ranges, massLabel, dailyMin, dailyMax, dailyAvg, calMin, calMax } = plan;
    const eventDateStr = values.eventDate?.trim();

    // Glycogen loading timeline (if event date provided)
    const glycogenLoadDate = eventDateStr && /^\d{4}-\d{2}-\d{2}$/.test(eventDateStr)
      ? (() => {
          const [yy, mm, dd] = eventDateStr.split('-').map(Number);
          const eventDate = new Date(yy, mm - 1, dd);
          if (eventDate.getFullYear() !== yy || eventDate.getMonth() !== mm - 1 || eventDate.getDate() !== dd) return null;
          const loadStart = new Date(eventDate);
          loadStart.setDate(loadStart.getDate() - 3);
          return { loadStart, eventDate, loadDays: '3 days before event' };
        })()
      : null;

    const results: Array<{ id: string; label: string; value: string; highlight?: boolean; color: 'positive' | 'negative' | 'neutral' }> = [
      {
        id: 'dailyCarbRange',
        label: `Daily Carbohydrate (${ranges.minG}–${ranges.maxG} g ${massLabel})`,
        value: `${fmt(dailyMin)}–${fmt(dailyMax)} g/day (${fmt(calMin)}–${fmt(calMax)} kcal)`,
        highlight: true,
        color: 'neutral',
      },
      {
        id: 'dailyAvg',
        label: 'Average Daily Target',
        value: `${fmt(dailyAvg)} g/day · ${fmt(dailyAvg * 4)} kcal`,
        color: 'positive',
      },
      {
        id: 'goalLabel',
        label: 'Goal',
        value: ranges.label,
        color: 'neutral',
      },
    ];

    if (glycogenLoadDate) {
      const loadG = Math.round(weightKg * LOAD_G_PER_KG); // moderate loading target (sports-nutrition guidance spans 8–12 g/kg/day)
      results.push({
        id: 'glycogenLoading',
        label: 'Glycogen Loading Protocol',
        value: `Begin ${glycogenLoadDate.loadStart.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Consume ${fmt(loadG)} g/day (${fmt(loadG * 4)} kcal) for 3 days before your event`,
        color: 'positive',
      });
    }

    // Food equivalents
    const avgG = dailyAvg;
    const cupsRice = Math.round(avgG / 45); // 1 cup white rice ≈ 45g carbs
    const slicesBread = Math.round(avgG / 15); // 1 slice ≈ 15g
    const bananas = Math.round(avgG / 27); // 1 medium ≈ 27g
    const cupsPasta = Math.round(avgG / 43); // 1 cup cooked ≈ 43g

    results.push({
      id: 'foodEquivalents',
      label: 'Approximate Food Equivalents',
      value: `${cupsRice} cups rice · ${slicesBread} slices bread · ${bananas} bananas · ${cupsPasta} cups pasta`,
      color: 'neutral',
    });

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CarbohydratePanel, { values, results });
  },
  educational: {
    formula: 'Carb target = Body Weight (kg) × g/kg range | 1 g carb = 4 kcal',
    formulaSource: 'The g/kg goal ranges (7–12, 5–7, 4–6, 2–4 and 0.5–1) are conventional planning ranges chosen for this calculator; they are not quotations from one published table, and the ketosis range is not a guideline value. For training-volume-based targets see Thomas DT, Erdman KA, Burke LM, "Position of the Academy of Nutrition and Dietetics, Dietitians of Canada, and the American College of Sports Medicine: Nutrition and Athletic Performance", Med Sci Sports Exerc 2016;48:543–568, which sets carbohydrate targets by training volume. 4 kcal per gram of carbohydrate is the standard Atwater factor.',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Carb Types: Simple vs Complex</text><text x="50" y="70" font-size="13" fill="var(--svg-f59e0b)" font-weight="bold">Simple Carbs</text><rect x="50" y="85" width="160" height="30" rx="4" fill="var(--svg-f59e0b)" opacity=".3"/><text x="130" y="104" text-anchor="middle" font-size="11" fill="var(--svg-f59e0b)">Sugar, honey, fruit, sports drinks</text><text x="50" y="140" font-size="11" fill="var(--svg-666666)">Rapid absorption &mdash; quick energy source</text><text x="50" y="180" font-size="13" fill="var(--svg-22c55e)" font-weight="bold">Complex Carbs</text><rect x="50" y="195" width="320" height="30" rx="4" fill="var(--svg-22c55e)" opacity=".3"/><text x="210" y="214" text-anchor="middle" font-size="11" fill="var(--svg-22c55e)">Whole grains, legumes, vegetables, oats</text><text x="50" y="250" font-size="11" fill="var(--svg-666666)">Slow absorption &mdash; sustained energy + fiber</text><text x="220" y="295" text-anchor="middle" font-size="12" fill="var(--svg-8b5cf6)" font-weight="bold">Endurance: 7-12 g/kg &middot; Keto: 0.5-1 g/kg</text></svg>',
      alt: 'Two sections showing simple carbs (sugar, fruit, sports drinks) and complex carbs (whole grains, legumes, vegetables)',
      caption: 'Simple carbs provide rapid energy; complex carbs provide sustained energy with fiber and nutrients',
    },
    formulaDescription:
      'Carbohydrate needs are calculated per kilogram of body weight (or lean mass), with the range determined by your training goal. Endurance athletes need the highest intake for glycogen storage, while ketogenic diets require minimal carbohydrates.',
    variables: [
      { symbol: 'g/kg', name: 'Grams Per Kilogram', description: 'The density of carbohydrate intake per unit of body mass. Ranges from 0.5 g/kg (keto) to 12 g/kg (endurance).' },
      { symbol: 'Glycogen', name: 'Muscle Glycogen', description: 'The storage form of carbohydrates in muscle and liver. Depleted by exercise, replenished by dietary carbs.' },
      { symbol: 'Loading', name: 'Glycogen Loading', description: 'A protocol of increased carb intake before an endurance event (longer than about 90 minutes) to maximize muscle glycogen stores. This calculator uses 8 g/kg per day for the 3 days before the event; loading targets in the sports-nutrition literature are higher than everyday goals, and 8 g/kg is a moderate choice rather than a published standard.' },
    ],
    howToUse: [
      'Enter your body weight (and optionally body fat % for lean mass calculation).',
      'Select your goal — from endurance training to ketosis.',
      'Optionally enter an event date for glycogen loading timeline.',
      'Review your daily carb range, food equivalents, and loading protocol if applicable.',
      'Adjust the carb slider to see how varying intake within the recommended range affects total daily grams and food equivalents.',
    ],
    explanation:
      'Carbohydrate needs are highly individual and goal-dependent. Endurance athletes training many hours a week are commonly given the highest carbohydrate targets; this calculator uses 7–12 g/kg for them, 4–6 g/kg for strength training and 2–4 g/kg for fat loss. These are planning ranges, not published guideline values, and individual needs vary. Ketogenic diets (0.5–1 g/kg) shift the body to fat adaptation — effective for some but not optimal for high-intensity performance. Glycogen loading 3 days before a marathon or endurance event can increase performance by 2–3% by supercompensating muscle glycogen stores. The brain alone requires ~130g of glucose per day, so extremely low carb intakes should be medically supervised. A practical example: a 154 lb (70 kg) runner training for a marathon should aim for 490–840g of carbs per day (the 7–12 g/kg planning range), which translates to roughly 11–20 cups of cooked pasta, 18–31 bananas, or 33–56 slices of bread. This seems like a lot, which is why endurance athletes need to deliberately prioritize carb intake during heavy training blocks. The type of carbohydrate also matters: during exercise, simple carbs (sports drinks, gels, white bread) are preferred for rapid absorption. For everyday meals, complex carbs (whole grains, legumes, vegetables) provide sustained energy, fiber, and micronutrient density.',
    faqs: [
      {
        question: 'Is low-carb or keto bad for running performance?',
        answer: 'For low-to-moderate intensity training, a fat-adapted athlete can perform well on low carb. For high-intensity work (intervals, racing, sprints), carbohydrates are the preferred fuel source and low carb will likely impair performance. Elite endurance athletes typically train and race with high carb availability.',
      },
      {
        question: 'Should I eat the same carbs every day?',
        answer: 'No. On days with 2+ hours of intense training, aim for the upper end of your range. On rest days, drop to the lower end. This is called "fueling for the work required" and is the modern evidence-based approach to periodized carbohydrate intake. Carb loading itself (higher intake in the final 1–3 days) only makes sense before events lasting longer than about 90 minutes.',
      },
      {
        question: 'How do I time carbs around workouts?',
        answer: 'For workouts under 60 minutes, pre-workout carbs are optional. For sessions over 90 minutes, consume 30–60g of carbs per hour during exercise. Post-workout, carbs help replenish glycogen and shuttle amino acids into muscle — aim for 0.5–1 g/kg within 2 hours of training.',
      },
    ],
    commonUses: [
      'Endurance sports nutrition — marathoners, triathletes, and cyclists use carb targets (7-12 g/kg) to maintain glycogen stores for training and competition',
      'Muscle gain meal planning — strength athletes use 4-6 g/kg to support training recovery and glycogen replenishment between sessions',
      'Fat loss diet design — set carbohydrate intake at 2-4 g/kg to maintain workout energy while creating a calorie deficit',
      'Glycogen loading for race day — plan a 3-day carb-loading protocol before endurance events to maximize muscle glycogen stores and improve performance'
    ],
  
    citations: [
      { source: 'NIH - Carbohydrates', url: 'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/' },

    ],
  },
};

export default carbohydrateConfig;
