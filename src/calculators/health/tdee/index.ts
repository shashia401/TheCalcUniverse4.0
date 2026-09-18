import { createElement, Fragment } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import CalorieMatrixPanel from './CalorieMatrixPanel';
import TDEComparisonPanel from './TDEComparisonPanel';

const tdeeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'unit',
      label: 'Unit System',
      type: 'select',
      required: true,
      helpText: 'Choose your preferred unit system. Imperial: pounds, feet, and inches. Metric: kilograms and centimeters.',
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
      helpText: 'Biological sex affects the BMR equation. Males and females have different resting metabolic rate formulas.',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      defaultValue: '30',
      placeholder: '30',
      unit: 'years',
      inputMode: 'decimal',
      min: 15,
      max: 100,
      step: 1,
      required: true,
      helpText: 'Used in Mifflin-St Jeor BMR equation — BMR declines with age',
    },
    {
      id: 'weight',
      label: 'Weight',
      type: 'number',
      defaultValue: '170',
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
      defaultValue: '5',
      placeholder: '5',
      unit: 'ft',
      inputMode: 'decimal',
      min: 0,
      max: 9,
      step: 1,
      helpText: 'Your height in feet (imperial only). For 5 ft 10 in, enter 5 here and 10 in the inches field.',
      showWhen: (v) => v.unit === 'imperial',
    },
    {
      id: 'heightIn',
      label: 'Height — Inches',
      type: 'number',
      defaultValue: '10',
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
      placeholder: '178',
      unit: 'cm',
      inputMode: 'decimal',
      min: 0,
      step: 0.1,
      helpText: 'Metric only',
      showWhen: (v) => v.unit === 'metric',
    },
    {
      id: 'activityLevel',
      label: 'Activity Level',
      type: 'select',
      required: true,
      helpText: 'How physically active you are on a typical week. Most people overestimate their activity level - when in doubt, choose the lower option.',
      options: [
        { label: 'Sedentary (desk job, little/no exercise)', value: '1.2' },
        { label: 'Light Exercise (1–2 days/week)', value: '1.375' },
        { label: 'Moderate Exercise (3–5 days/week)', value: '1.55' },
        { label: 'Heavy Exercise (6–7 days/week)', value: '1.725' },
        { label: 'Athlete / Physical Job (2× per day)', value: '1.9' },
      ],
    },
    {
      id: 'bodyFatPct',
      label: 'Body Fat % (Optional)',
      type: 'number',
      placeholder: '20',
      unit: '%',
      inputMode: 'decimal',
      min: 2,
      max: 70,
      step: 0.5,
      required: false,
      helpText: 'If entered, switches to the more accurate Katch-McArdle formula',
    },
  ],
  explainSteps: (values) => {
    const unit = values.unit || 'imperial';
    const sex = values.sex || 'male';
    const age = parseFloat(values.age);
    const activityFactor = parseFloat(values.activityLevel || '1.55');
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

    if ([weightKg, heightCm, age, activityFactor].some(isNaN) || weightKg <= 0 || heightCm <= 0) return [];

    const fmt = (n: number) => Math.round(n).toLocaleString(undefined);
    const usingKatch = !isNaN(bodyFatPct) && bodyFatPct > 0 && values.bodyFatPct !== '';
    const steps: { label: string; expr: string; note?: string }[] = [];

    if (unit === 'imperial') {
      steps.push({
        label: 'Convert weight and height to metric',
        expr: `${values.weight} lb × 0.453592 = ${weightKg.toFixed(1)} kg · height = ${heightCm.toFixed(1)} cm`,
        note: 'The BMR equations are defined in kilograms and centimeters.',
      });
    }

    let bmr: number;
    if (usingKatch) {
      const leanMass = weightKg * (1 - bodyFatPct / 100);
      bmr = 370 + 21.6 * leanMass;
      steps.push({
        label: 'Find lean body mass (body fat % was given)',
        expr: `${weightKg.toFixed(1)} kg × (1 − ${bodyFatPct}/100) = ${leanMass.toFixed(1)} kg`,
      });
      steps.push({
        label: 'Katch-McArdle BMR',
        expr: `370 + 21.6 × ${leanMass.toFixed(1)} = ${fmt(bmr)} kcal/day`,
        note: 'With body fat known, this formula is more accurate than Mifflin-St Jeor.',
      });
    } else {
      bmr = sex === 'male'
        ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
      steps.push({
        label: `Mifflin-St Jeor BMR (${sex})`,
        expr: `10×${weightKg.toFixed(1)} + 6.25×${heightCm.toFixed(1)} − 5×${age} ${sex === 'male' ? '+ 5' : '− 161'} = ${fmt(bmr)} kcal/day`,
        note: 'BMR is the energy your body burns at complete rest.',
      });
    }

    const tdee = bmr * activityFactor;
    steps.push({
      label: 'Multiply BMR by your activity factor',
      expr: `TDEE = ${bmr.toFixed(1)} × ${activityFactor} = ${fmt(tdee)} kcal/day`,
      note: 'Maintenance calories — eat this to hold your weight steady.',
    });

    return steps;
  },
  calculate: (values) => {
    const unit = values.unit || 'imperial';
    const sex = values.sex || 'male';
    const age = parseFloat(values.age);
    const activityFactor = parseFloat(values.activityLevel || '1.55');
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

    if ([weightKg, heightCm, age, activityFactor].some(isNaN) || weightKg <= 0 || heightCm <= 0) return [];

    // Always compute all BMR formulas for comparison
    let mifflinBMR: number, harrisBMR: number, katchBMR: number | null = null;

    if (sex === 'male') {
      mifflinBMR = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
      harrisBMR = 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;
    } else {
      mifflinBMR = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
      harrisBMR = 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.330 * age;
    }

    if (!isNaN(bodyFatPct) && bodyFatPct > 0 && values.bodyFatPct !== '') {
      const leanMass = weightKg * (1 - bodyFatPct / 100);
      katchBMR = 370 + 21.6 * leanMass;
    }

    // Pick the actual BMR used for TDEE
    let bmr: number;
    let formulaUsed: string;

    if (katchBMR !== null) {
      bmr = katchBMR;
      formulaUsed = 'Katch-McArdle';
    } else {
      bmr = mifflinBMR;
      formulaUsed = 'Mifflin-St Jeor';
    }

    const tdee = bmr * activityFactor;
    const cutting500 = tdee - 500;
    const bulking500 = tdee + 500;

    const safeMin = sex === 'female' ? 1200 : 1500;

    const proteinG = Math.round(weightKg * 2.2);
    const fatG = Math.round((tdee * 0.25) / 9);
    const carbG = Math.round((tdee - proteinG * 4 - fatG * 9) / 4);

    // TDEE breakdown: BMR + TEF + EAT + NEAT
    // TEF (Thermic Effect of Food) ≈ 10% of TDEE
    const tef = Math.round(tdee * 0.10);
    // EAT (Exercise Activity Thermogenesis) varies by activity level
    const activityMultiplier = parseFloat(values.activityLevel || '1.55');
    const eatPctMap: Record<number, number> = { 1.2: 0.02, 1.375: 0.05, 1.55: 0.10, 1.725: 0.15, 1.9: 0.20 };
    const eatPct = eatPctMap[activityMultiplier] ?? 0.10;
    const eat = Math.round(tdee * eatPct);
    // NEAT (Non-Exercise Activity Thermogenesis) = TDEE - BMR - TEF - EAT
    const neat = Math.round(tdee) - Math.round(bmr) - tef - eat;

    const fmt = (n: number) => Math.round(n).toLocaleString(undefined);

    const results: Array<{ id: string; label: string; value: string; highlight?: boolean; color: 'positive' | 'negative' | 'neutral'; interpretation?: string }> = [
      {
        id: 'formulaLabel',
        label: 'Formula Used',
        value: formulaUsed,
        color: 'neutral',
      },
      {
        id: 'tdee',
        label: `Maintenance Calories — TDEE (${formulaUsed})`,
        value: `${fmt(tdee)} kcal/day`,
        highlight: true,
        color: 'neutral',
        interpretation: `Eating ${fmt(tdee)} kcal/day keeps your weight stable. Your body burns ${fmt(bmr)} kcal (${Math.round((bmr / tdee) * 100)}%) just existing — activity adds the remaining ${fmt(tdee - bmr)} kcal. To lose ~1 lb/week eat ${fmt(cutting500)} kcal/day; to gain, eat ${fmt(bulking500)}. Treat this as a starting estimate (real-world error is ±10%, or ${fmt(tdee * 0.1)} kcal): track your weight for 2–3 weeks and adjust by 100–200 kcal if it isn't moving as expected.`,
      },
      {
        id: 'bmrBreakdown',
        label: 'BMR & TDEE Breakdown',
        value: `BMR: ${fmt(bmr)} · TEF: ${fmt(tef)} · EAT: ${fmt(eat)} · NEAT: ${fmt(Math.max(neat, 0))} kcal/day`,
        color: 'neutral',
      },
      {
        id: 'calorieTargets',
        label: 'Calorie Targets',
        value: `Maintain: ${fmt(tdee)} · Cut (-500 deficit, ~1 lb/wk): ${fmt(cutting500)} · Bulk (+500 surplus, ~1 lb/wk): ${fmt(bulking500)} kcal/day`,
        color: 'neutral',
      },
      {
        id: 'safeMinWarning',
        label: `Safe Minimum (${sex === 'female' ? 'Women' : 'Men'})`,
        value: `Never go below ${fmt(safeMin)} kcal/day`,
        color: 'negative',
      },
      {
        id: 'macrosCombined',
        label: 'Recommended Daily Macros',
        value: `Protein: ${proteinG}g · Fat: ${fatG}g · Carbs: ${Math.max(carbG, 0)}g`,
        color: 'neutral',
      },
      {
        id: 'mifflinBMR',
        label: 'Mifflin-St Jeor BMR',
        value: `${fmt(mifflinBMR)} kcal/day`,
        color: 'neutral',
      },
      {
        id: 'harrisBMR',
        label: 'Harris-Benedict BMR',
        value: `${fmt(harrisBMR)} kcal/day`,
        color: 'neutral',
      },
    ];

    if (katchBMR !== null) {
      results.push({
        id: 'katchBMR',
        label: 'Katch-McArdle BMR',
        value: `${fmt(katchBMR)} kcal/day`,
        color: 'neutral',
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(Fragment, null,
      createElement(CalorieMatrixPanel, { values, results }),
      createElement('div', { className: 'mt-5' },
        createElement(TDEComparisonPanel, { values, results })
      )
    );
  },
  educational: {
    formula: 'TDEE = BMR × Activity Factor | BMR (Mifflin): 10W + 6.25H − 5A + S',
    formulaDescription:
      'Total Daily Energy Expenditure multiplies your Basal Metabolic Rate (calories at rest) by an activity factor (1.2–1.9). If body fat % is known, Katch-McArdle is used instead for greater accuracy.',
    diagram: {
      svg: '<svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<!-- BMR slice (62.5% = 225deg) -->' +
        '<path d="M110,110 L110,20 A90,90 0 0,1 182.7,25.2 Z" fill="var(--svg-3b82f6)"/>' +
        '<!-- NEAT slice (18.1% = 65deg) -->' +
        '<path d="M110,110 L182.7,25.2 A90,90 0 0,1 197.4,34.7 Z" fill="var(--svg-22c55e)"/>' +
        '<!-- EAT slice (12.5% = 45deg) -->' +
        '<path d="M110,110 L197.4,34.7 A90,90 0 0,1 173.7,17.5 Z" fill="var(--svg-a855f7)"/>' +
        '<!-- TEF slice (6.9% = 25deg) -->' +
        '<path d="M110,110 L173.7,17.5 A90,90 0 0,1 110,20 Z" fill="var(--svg-f59e0b)"/>' +
        '<circle cx="110" cy="110" r="45" fill="var(--svg-ffffff)"/>' +
        '<text x="110" y="106" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="700">TDEE</text>' +
        '<text x="110" y="122" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">100%</text>' +
        '<rect x="230" y="20" width="12" height="12" rx="3" fill="var(--svg-3b82f6)"/>' +
        '<text x="248" y="31" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)">BMR (60-75%)</text>' +
        '<rect x="230" y="45" width="12" height="12" rx="3" fill="var(--svg-22c55e)"/>' +
        '<text x="248" y="56" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)">NEAT (10-15%)</text>' +
        '<rect x="230" y="70" width="12" height="12" rx="3" fill="var(--svg-a855f7)"/>' +
        '<text x="248" y="81" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)">EAT (5-10%)</text>' +
        '<rect x="230" y="95" width="12" height="12" rx="3" fill="var(--svg-f59e0b)"/>' +
        '<text x="248" y="106" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)">TEF (~10%)</text>' +
        '</svg>',
      alt: 'TDEE breakdown donut chart showing BMR, NEAT, EAT, and TEF proportions',
      caption: 'Total Daily Energy Expenditure (TDEE) is the sum of BMR, NEAT, EAT, and TEF',
    },
    variables: [
      { symbol: 'BMR', name: 'Basal Metabolic Rate', description: 'Calories burned at complete rest — your body\'s minimum energy requirement.' },
      { symbol: 'Activity Factor', name: 'Physical Activity Multiplier', description: '1.2 (sedentary) to 1.9 (athlete). Accounts for all movement and exercise on top of BMR.' },
      { symbol: 'TDEE', name: 'Total Daily Energy Expenditure', description: 'Total calories burned per day including all activity. This is your maintenance calorie target.' },
      { symbol: 'TEF', name: 'Thermic Effect of Food', description: '~10% of TDEE. Energy used to digest, absorb, and metabolize food. Protein has the highest thermic effect.' },
      { symbol: 'EAT', name: 'Exercise Activity Thermogenesis', description: 'Calories burned through deliberate exercise. Varies from 2% (sedentary) to 20% (athlete) of TDEE.' },
      { symbol: 'NEAT', name: 'Non-Exercise Activity Thermogenesis', description: 'All calories burned from non-exercise movement: walking to your car, fidgeting, standing, household chores. Highly variable between individuals.' },
      { symbol: 'Katch-McArdle', name: 'Lean Mass Formula', description: 'BMR = 370 + 21.6 × Lean Body Mass (kg). More accurate than Mifflin for lean athletes.' },
    ],
    howToUse: [
      'Select your unit system (Imperial or Metric).',
      'Enter your sex, age, weight, and height.',
      'Select the activity level that best describes your typical week.',
      'Optionally enter body fat % to switch to the more accurate Katch-McArdle formula.',
      'Use the goal matrix table to find your personalized calorie targets for any fitness goal.',
    ],
    explanation: 'TDEE is the total calories your body burns each day, combining your resting metabolism with all physical activity. The TDEE pie breaks into four components: BMR (60–75% — the largest chunk by far), TEF (~10% — energy to digest, absorb, and metabolize food, with protein having the highest thermic effect at 20–30%), EAT (exercise calories — highly variable from 0% for sedentary people to 20%+ for athletes), and NEAT (non-exercise movement — the most variable component, ranging from 200 to 900+ calories per day between a desk worker and someone with an active job). NEAT is the component you can most easily increase without formal exercise: standing instead of sitting, taking the stairs, fidgeting, and walking while on the phone can add 200–500 calories of daily burn. Eating at TDEE = maintain weight. Eating 500 kcal below = lose ~1 lb/week. Eating 500 kcal above = gain ~1 lb/week. However, these are approximations — the actual weight change per 500 kcal varies by individual due to metabolic adaptation, body composition, and the fact that not all calories are absorbed equally. The macro split uses a standard high-protein approach: ~1g protein per pound of bodyweight, 25% of calories from fat, and the remainder from carbohydrates. Adjust macros based on your specific training goals and dietary preferences. A 180 lb moderately active person has a TDEE of roughly 2,600 calories — a comfortable maintenance level that allows for flexible dieting while supporting their training.',
    faqs: [
      {
        question: 'What is the difference between BMR and TDEE?',
        answer: 'BMR is the calories burned doing absolutely nothing — just existing. TDEE adds all physical activity. TDEE is the number that matters for nutrition planning; BMR is only a component of it.',
      },
      {
        question: 'Is it safe to eat below 1,200 or 1,500 calories?',
        answer: 'For most people, eating below 1,200 calories (women) or 1,500 calories (men) is considered a Very Low Calorie Diet (VLCD) and should only be done under medical supervision. Such low intakes risk nutrient deficiencies, muscle loss, gallstones, and metabolic adaptation. The calculator flags this in red.',
      },
      {
        question: 'When should I use the Katch-McArdle formula?',
        answer: 'Activity level is the biggest variable. Most people underestimate their TDEE by selecting too low an activity level, or overestimate by selecting "very active" when they exercise 3 days a week. Be honest about your actual weekly movement.',
      },
      {
        question: 'How do I know which activity level to choose?',
        answer: 'Be honest rather than aspirational. Sedentary = desk job, no exercise. Light = 1-2 intentional workouts. Moderate = 3-5 workouts where you actually sweat. Heavy = daily intense training. Athlete = twice-daily training or physically demanding job. Most people overestimate their activity level by one category, which can inflate their TDEE by 200-400 calories. When in doubt, choose the lower option.',
      },
      {
        question: 'What happens to my TDEE as I lose weight?',
        answer: 'TDEE decreases as you lose weight because a smaller body requires less energy to maintain. This is called metabolic adaptation. A person who loses 30 lbs may need 150-250 fewer calories per day to maintain their new weight than someone who has always been at that weight. This is why weight loss plateaus are normal — you need to periodically recalculate your TDEE as your weight changes. The calculator makes this easy by giving you updated numbers any time you change your inputs.',
      },
      {
        question: 'How much does NEAT vary between individuals?',
        answer: 'NEAT (Non-Exercise Activity Thermogenesis) is the most variable component of TDEE, ranging from 200 to 900+ calories per day. A fidgety person who stands at their desk, takes stairs, and walks while on the phone can burn 500+ more calories through NEAT than someone who sits still all day. This is why two people with identical stats and exercise routines can have very different TDEEs — the difference is almost entirely NEAT. Increasing NEAT (standing desk, walking meetings, taking stairs) is one of the easiest ways to increase calorie burn without formal exercise.',
      },
      {
        question: 'Which BMR formula is most accurate for TDEE?',
        answer: 'Mifflin-St Jeor is the most validated BMR formula for the general population and is used by default in this calculator. Harris-Benedict (revised 1984) tends to overestimate BMR by ~5% on average. Katch-McArdle is more accurate for lean athletes who know their body fat percentage because it uses lean body mass instead of total weight. The BMR Formula Comparison panel below the results shows all three formulas side-by-side so you can see the difference for your stats. The gap between Mifflin and Harris-Benedict is typically 50-150 calories, while Katch-McArdle can differ by 200+ calories depending on your body composition.',
      },
    ],
    quickReference: [
      { label: 'Sedentary (desk job)', value: 'TDEE × 1.2' },
      { label: 'Light Exercise (1-2 days/wk)', value: 'TDEE × 1.375' },
      { label: 'Moderate Exercise (3-5 days/wk)', value: 'TDEE × 1.55' },
      { label: 'Heavy Exercise (6-7 days/wk)', value: 'TDEE × 1.725' },
      { label: 'Athlete (2x/day)', value: 'TDEE × 1.9' },
      { label: 'BMR as % of TDEE', value: '60-75% of total daily burn' },
      { label: 'Protein Recommendation', value: '~1 g per lb of body weight' },
      { label: 'Safe Minimum (Women)', value: '1,200 kcal/day' },
      { label: 'Safe Minimum (Men)', value: '1,500 kcal/day' },
      { label: 'Weight Change Rate', value: '~500 kcal deficit/surplus = ~1 lb per week' },
    ],
    commonUses: [
      'Weight loss planning — set a calorie deficit based on accurate TDEE to lose 0.5-2 lbs per week while preserving muscle mass',
      'Muscle building — calculate the surplus needed for lean gains (typically +250-500 kcal above TDEE) with adequate protein for hypertrophy',
      'Diet design — determine base maintenance calories, then create tailored meal plans for cutting, bulking, or recomposition phases',
      'Fitness competition prep — bodybuilders and fitness athletes use TDEE to precisely time calorie manipulation for peak week and stage-ready condition',
      'Metabolic health management — track how your TDEE changes with weight loss, aging, or changes in physical activity to adjust nutrition accordingly',
    ],
    
    workedExamples: [
      {
        scenario: 'Sarah (BMR ≈ 1,370 kcal/day) does moderate exercise 3–5 days a week and wants her maintenance calories, then a target to lose about 1 lb per week.',
        inputs: {
          BMR: '1,370 kcal/day',
          'Activity level': 'Moderate (×1.55)',
        },
        result: 'TDEE = 1,370 × 1.55 ≈ 2,124 kcal/day maintenance. For ~1 lb/week loss, subtract a 500 kcal/day deficit → about 1,624 kcal/day.',
        insight: 'TDEE is the calories Sarah burns on a typical day. Eating at 2,124 holds her weight; a 500-calorie daily deficit (~3,500 calories ≈ 1 lb of fat per week) sets up steady loss without crashing below her BMR.',
      },
      {
        scenario: 'Mark (BMR = 1,730 kcal/day) has a desk job and trains 1–2 days a week (light activity).',
        inputs: {
          BMR: '1,730 kcal/day',
          'Activity level': 'Light (×1.375)',
        },
        result: 'TDEE = 1,730 × 1.375 ≈ 2,379 kcal/day maintenance.',
        insight: 'Choosing the right multiplier matters more than the BMR itself: if Mark over-rated himself as "moderate" (×1.55) he\'d estimate ~2,682 — a 300-calorie overshoot that would quietly stall fat loss.',
      },
    ],

    proTips: [
      'TDEE is your maintenance level. Eat below it to lose weight, above it to gain — there is no other lever.',
      'A 500 kcal/day deficit is roughly 1 lb of fat loss per week (about 3,500 calories per pound).',
      'Most people overestimate their activity. When unsure between two levels, pick the lower multiplier and adjust up from real results.',
      'Treat the number as a starting estimate: track weight for 2–3 weeks and adjust intake based on what actually happens on the scale.',
    ],

    limitations: [
      'Activity multipliers are broad buckets; real expenditure varies with non-exercise movement (NEAT), workout type, and intensity.',
      'The "3,500 calories per pound" rule is a simplification — metabolic adaptation slows weight loss over time, so deficits often need revisiting.',
      'Estimates don\'t account for individual metabolic differences, medical conditions, or medications; use them as a guide, not a prescription.',
    ],
citations: [
      { source: 'NIH - Body Weight Planner', url: 'https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner' },
      { source: 'National Academies - Dietary Reference Intakes', url: 'https://nap.nationalacademies.org/catalog/10490/dietary-reference-intakes-for-energy-carbohydrate-fiber-fat-fatty-acids-cholesterol-protein-and-amino-acids' },
    ],
  },
};

export default tdeeConfig;
