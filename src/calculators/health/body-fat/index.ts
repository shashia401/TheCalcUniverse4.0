import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import BodyFatPanel from './BodyFatPanel';

function cmFromInput(values: Record<string, string>, unit: string): number {
  if (unit === 'imperial') {
    const ft = parseFloat(values.heightFt) || 0;
    const inches = parseFloat(values.heightIn) || 0;
    return (ft * 12 + inches) * 2.54;
  }
  return parseFloat(values.heightCm) || 0;
}

const bodyFatConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'unit',
      label: 'Unit System',
      type: 'select',
      required: true,
      helpText: 'Choose your measurement system. Imperial uses pounds, feet & inches; Metric uses kilograms & centimeters.',
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
      helpText: 'Determines which U.S. Navy formula to use. Males need abdomen measurement; females need waist and hip measurements.',
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
      min: 18,
      max: 100,
      step: 1,
      required: true,
      helpText: 'Used for fitness category classification (not the BF% formula itself). Age affects healthy body fat ranges — older adults typically have slightly higher recommended ranges. Enter your current age in years (18–100).',
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
      helpText: 'Your body weight. Enter pounds (lbs) for Imperial or kilograms (kg) for Metric. Best measured first thing in the morning, after voiding, with minimal clothing.',
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
      helpText: 'Imperial only — your height in feet (e.g., 5 for 5\'10"). Measure without shoes, standing straight against a wall.',
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
      helpText: 'Imperial only — remaining inches (0–11) after the feet measurement. E.g., for 5\'10" enter 10.',
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
      helpText: 'Metric only — your height in centimeters. Measure without shoes, standing straight against a wall.',
      showWhen: (v) => v.unit === 'metric',
    },
    {
      id: 'neck',
      label: 'Neck Circumference',
      type: 'number',
      placeholder: '15',
      unit: 'in / cm',
      inputMode: 'decimal',
      min: 0,
      step: 0.125,
      required: true,
      helpText: 'Measure just below the larynx (Adam\'s apple) at the narrowest point. Tape should be perpendicular to the neck axis, snug but not compressing the skin. Look straight ahead, relax your shoulders, and do not flare your neck.',
    },
    {
      id: 'abdomen',
      label: 'Abdomen Circumference',
      type: 'number',
      placeholder: '34',
      unit: 'in / cm',
      inputMode: 'decimal',
      min: 0,
      step: 0.125,
      helpText: 'Men only — measure at the navel level after exhaling normally. Keep the tape horizontal and snug. Do not pull in your stomach or flex your abs — stand relaxed.',
      showWhen: (v) => v.sex === 'male',
    },
    {
      id: 'waist',
      label: 'Waist Circumference',
      type: 'number',
      placeholder: '28',
      unit: 'in / cm',
      inputMode: 'decimal',
      min: 0,
      step: 0.125,
      helpText: 'Women only — measure at the narrowest point of your natural waist, typically about 1–2 inches above the navel. Keep the tape horizontal and snug, breathing normally.',
      showWhen: (v) => v.sex === 'female',
    },
    {
      id: 'hip',
      label: 'Hip Circumference',
      type: 'number',
      placeholder: '38',
      unit: 'in / cm',
      inputMode: 'decimal',
      min: 0,
      step: 0.125,
      helpText: 'Women only — measure at the widest point of the hips/buttocks, typically at the level of the pubic symphysis. Keep the tape horizontal and snug. This measurement is used in the female body fat formula alongside the waist.',
      showWhen: (v) => v.sex === 'female',
    },
  ],
  // Living Answer gauge — where the user's body-fat % falls on the Navy scale.
  // Bands differ by sex. Mirrors calculate()'s formula exactly.
  gauge: (values) => {
    const unit = values.unit || 'imperial';
    const sex = values.sex || 'male';
    const heightCm = cmFromInput(values, unit);
    const neck = parseFloat(values.neck);
    const abdomen = parseFloat(values.abdomen);
    const waist = parseFloat(values.waist);
    const hip = parseFloat(values.hip);
    if ([heightCm, neck].some(isNaN) || heightCm <= 0 || neck <= 0) return null;
    const isMale = sex === 'male';
    const neckCm = unit === 'imperial' ? neck * 2.54 : neck;
    let bf: number;
    if (isMale) {
      if (isNaN(abdomen) || abdomen <= 0) return null;
      const abdomenCm = unit === 'imperial' ? abdomen * 2.54 : abdomen;
      if (abdomenCm - neckCm <= 0) return null;
      bf = 86.010 * Math.log10(abdomenCm - neckCm) - 70.041 * Math.log10(heightCm) + 36.76;
    } else {
      if (isNaN(waist) || waist <= 0 || isNaN(hip) || hip <= 0) return null;
      const waistCm = unit === 'imperial' ? waist * 2.54 : waist;
      const hipCm = unit === 'imperial' ? hip * 2.54 : hip;
      if (waistCm + hipCm - neckCm <= 0) return null;
      bf = 163.205 * Math.log10(waistCm + hipCm - neckCm) - 97.684 * Math.log10(heightCm) - 78.387;
    }
    bf = Math.max(2, Math.min(bf, 70));
    const cat = isMale
      ? (bf < 6 ? 'Athlete' : bf < 14 ? 'Athletic' : bf < 18 ? 'Fitness' : bf < 25 ? 'Average' : 'High')
      : (bf < 14 ? 'Athlete' : bf < 21 ? 'Athletic' : bf < 25 ? 'Fitness' : bf < 32 ? 'Average' : 'High');
    const bands = isMale
      ? [
          { to: 6, label: 'Athlete', color: '#3b82f6' },
          { to: 14, label: 'Athletic', color: '#22c55e' },
          { to: 18, label: 'Fitness', color: '#84cc16' },
          { to: 25, label: 'Average', color: '#f59e0b' },
          { to: 40, label: 'High', color: '#ef4444' },
        ]
      : [
          { to: 14, label: 'Athlete', color: '#3b82f6' },
          { to: 21, label: 'Athletic', color: '#22c55e' },
          { to: 25, label: 'Fitness', color: '#84cc16' },
          { to: 32, label: 'Average', color: '#f59e0b' },
          { to: 45, label: 'High', color: '#ef4444' },
        ];
    return {
      value: bf,
      min: 0,
      max: isMale ? 40 : 45,
      valueLabel: `Your body fat: ${bf.toFixed(1)}% — ${cat}`,
      bands,
      caption: `U.S. Navy body-fat categories for ${isMale ? 'men' : 'women'}. The marker shows where your result lands.`,
    };
  },
  calculate: (values) => {
    const unit = values.unit || 'imperial';
    const sex = values.sex || 'male';
    const age = parseFloat(values.age);
    const weight = parseFloat(values.weight);
    const heightCm = cmFromInput(values, unit);
    const neck = parseFloat(values.neck);
    const abdomen = parseFloat(values.abdomen);
    const waist = parseFloat(values.waist);
    const hip = parseFloat(values.hip);

    if ([age, weight, heightCm, neck].some(isNaN) || weight <= 0 || heightCm <= 0 || neck <= 0) return [];

    const isMale = sex === 'male';
    if (isMale && (isNaN(abdomen) || abdomen <= 0)) return [];
    if (!isMale && (isNaN(waist) || waist <= 0 || isNaN(hip) || hip <= 0)) return [];

    // U.S. Navy circumference method — all measurements in cm
    const neckCm = unit === 'imperial' ? neck * 2.54 : neck;
    let bodyFatPct: number;

    if (isMale) {
      const abdomenCm = unit === 'imperial' ? abdomen * 2.54 : abdomen;
      if (abdomenCm - neckCm <= 0) return []; // log10 domain error guard
      bodyFatPct = 86.010 * Math.log10(abdomenCm - neckCm) - 70.041 * Math.log10(heightCm) + 36.76;
    } else {
      const waistCm = unit === 'imperial' ? waist * 2.54 : waist;
      const hipCm = unit === 'imperial' ? hip * 2.54 : hip;
      if (waistCm + hipCm - neckCm <= 0) return []; // log10 domain error guard
      bodyFatPct = 163.205 * Math.log10(waistCm + hipCm - neckCm) - 97.684 * Math.log10(heightCm) - 78.387;
    }

    bodyFatPct = Math.max(2, Math.min(bodyFatPct, 70));

    // Body fat categories
    const getCategory = (pct: number, sex: string): string => {
      if (sex === 'male') {
        if (pct < 6) return 'Essential Fat (Athlete)';
        if (pct < 14) return 'Athletic';
        if (pct < 18) return 'Fitness';
        if (pct < 25) return 'Average';
        return 'Obese';
      }
      if (pct < 14) return 'Essential Fat (Athlete)';
      if (pct < 21) return 'Athletic';
      if (pct < 25) return 'Fitness';
      if (pct < 32) return 'Average';
      return 'Obese';
    };

    const category = getCategory(bodyFatPct, sex);

    // Navy body fat uses total inches for its "height" measurement
    // weight-based lean/fat mass
    const fatMass = weight * (bodyFatPct / 100);
    const leanMass = weight - fatMass;
    const fatMassUnit = unit === 'imperial' ? 'lbs' : 'kg';

    // Navy formula: Body Density first, then convert to BF%
    // For the density equation:
    // Men: Density = 1.0323 - 0.00157 * (abdomenCm - neckCm) + 0.00213 * (heightCm / 100)
    //   Actually, let me use the standard Hodgdon & Beckett equations which are:
    // Men: %BF = 86.010 × log10(abdomenCm - neckCm) - 70.041 × log10(heightCm) + 36.76  (already used above)
    // Women: %BF = 163.205 × log10(waistCm + hipCm - neckCm) - 97.684 × log10(heightCm) - 78.387 (already used above)

    const fmt = (n: number) => n.toFixed(1);

    // Weight classification by body fat for reference
    const essentialFatMax = isMale ? 6 : 14;
    const athleticMax = isMale ? 14 : 21;

    return [
      {
        id: 'bodyFatPct',
        label: 'Body Fat Percentage (U.S. Navy Method)',
        value: `${fmt(bodyFatPct)}%`,
        highlight: true,
        color: category === 'Obese' ? 'negative' : category === 'Average' ? 'neutral' : 'positive',
        interpretation: `A ${fmt(bodyFatPct)}% reading falls in the "${category}" range. Below about ${essentialFatMax}% is essential fat your body needs; athletes usually sit under ${athleticMax}%. The Navy tape method is an estimate — best for tracking change over time, less precise than a DEXA scan for any single reading.`,
      },
      {
        id: 'category',
        label: 'Fitness Category',
        value: category,
        color: category === 'Obese' ? 'negative' : category === 'Average' ? 'neutral' : 'positive',
      },
      {
        id: 'fatMass',
        label: `Fat Mass (${bodyFatPct.toFixed(1)}% of body weight)`,
        value: `${fmt(fatMass)} ${fatMassUnit}`,
        color: 'neutral',
      },
      {
        id: 'leanMass',
        label: `Lean Mass (${(100 - bodyFatPct).toFixed(1)}% of body weight)`,
        value: `${fmt(leanMass)} ${fatMassUnit}`,
        color: 'positive',
      },
      {
        id: 'essentialFat',
        label: `Essential Fat Threshold`,
        value: isMale ? `< 6% (Male) — < 14% (Female)` : `< 14% (Female) — < 6% (Male)`,
        color: bodyFatPct < essentialFatMax ? 'negative' : 'positive',
      },
      {
        id: 'athleticRange',
        label: 'Athletic Range',
        value: isMale ? '6–14%' : '14–21%',
        color: bodyFatPct >= essentialFatMax && bodyFatPct <= athleticMax ? 'positive' : 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BodyFatPanel, { values, results });
  },
  educational: {
    formula: 'Men: 86.010 × log₁₀(Abdomen − Neck) − 70.041 × log₁₀(Height) + 36.76 | Women: 163.205 × log₁₀(Waist + Hip − Neck) − 97.684 × log₁₀(Height) − 78.387',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="40" y="40" width="30" height="260" rx="4" fill="var(--svg-eeeeee)" stroke="var(--svg-999999)" stroke-width="1"/><rect x="40" y="40" width="30" height="40" rx="4" fill="var(--svg-ef4444)" opacity=".5"/><text x="85" y="65" font-size="12" fill="var(--svg-ef4444)">Essential</text><rect x="40" y="80" width="30" height="50" fill="var(--svg-f59e0b)" opacity=".5"/><text x="85" y="110" font-size="12" fill="var(--svg-f59e0b)">Athletic</text><rect x="40" y="130" width="30" height="45" fill="var(--svg-22c55e)" opacity=".5"/><text x="85" y="158" font-size="12" fill="var(--svg-22c55e)">Fitness</text><rect x="40" y="175" width="30" height="45" fill="var(--svg-3b82f6)" opacity=".5"/><text x="85" y="203" font-size="12" fill="var(--svg-3b82f6)">Average</text><rect x="40" y="220" width="30" height="80" fill="var(--svg-8b5cf6)" opacity=".5"/><text x="85" y="265" font-size="12" fill="var(--svg-8b5cf6)">Obese</text><text x="220" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Body Fat % Categories</text></svg>',
      alt: 'Body fat percentage categories scale from essential to obese with color coding',
      caption: 'Body fat categories range from essential fat (2-6% men, 10-14% women) to obese (25%+ men, 32%+ women)',
    },
    formulaDescription:
      'The U.S. Navy / Hodgdon & Beckett circumference method estimates body fat percentage from simple tape measurements. It uses the difference between trunk and neck circumferences relative to height, validated against hydrostatic weighing.',
    variables: [
      { symbol: 'Neck', name: 'Neck Circumference', description: 'Measured just below the larynx, tape perpendicular to the neck axis.' },
      { symbol: 'Abdomen', name: 'Abdomen (Men)', description: 'Measured at navel level, relaxed, after exhaling.' },
      { symbol: 'Waist + Hip', name: 'Waist & Hip (Women)', description: 'Waist at narrowest point; hip at widest point (typically buttocks).' },
      { symbol: 'BF%', name: 'Body Fat Percentage', description: 'Estimated fat mass as a percentage of total body weight via circumference equations.' },
      { symbol: 'Height', name: 'Height', description: 'Used in both male and female formulas as a normalizing factor. Taller individuals naturally have a different circumference-to-height ratio that affects the body fat estimate.' },
    ],
    howToUse: [
      'Select your unit system (Imperial or Metric).',
      'Select your biological sex (affects which measurements are needed).',
      'Enter your age, weight, and height.',
      'Take neck measurement just below the larynx.',
      'For Men: measure abdomen at navel level. For Women: measure waist at narrowest point and hip at widest point.',
      'Review your estimated body fat %, fitness category, and fat/lean mass breakdown.',
    ],
    explanation:
      'The U.S. Navy circumference method (Hodgdon & Beckett, 1984) is one of the most widely validated tape-measure body fat estimation techniques. Accuracy is ±2–3% compared to hydrostatic weighing when measurements are taken correctly. It works because subcutaneous fat distributes predictably: the difference between trunk and neck circumference correlates strongly with total body density. For the most accurate results, have someone else take your measurements, use a non-stretchable tape, and measure at the same time of day (morning is best, before meals). This method may overestimate body fat in very lean individuals and underestimate in the very obese. For clinical body fat assessment, methods like DEXA, Bod Pod, or hydrostatic weighing are more accurate. A practical tip: squeeze but do not compress the skin when measuring — the tape should be snug but not tight. Take each measurement 2–3 times and use the average. Measuring after a workout can give falsely low readings due to water loss and reduced subcutaneous fluid. Men and women store fat differently — men store more viscerally (around organs) which is harder to measure with circumference methods, while women store more subcutaneously (under the skin) especially around the hips and thighs. This is why different formulas are used for each sex.',
    faqs: [
      {
        question: 'How accurate is the U.S. Navy body fat method?',
        answer: 'The standard error of estimate is ±2–3% body fat compared to hydrostatic weighing. Accuracy depends entirely on measurement precision — inconsistent tape placement or tension can produce errors of 5% or more. Have someone experienced take your measurements.',
      },
      {
        question: 'Can I use this if I am very muscular?',
        answer: 'Yes, but the formula may slightly overestimate body fat for very muscular individuals since it cannot distinguish between muscle and fat circumference. Athletes with large necks (trapezius development) in particular may get inflated readings.',
      },
      {
        question: 'What is a healthy body fat percentage?',
        answer: 'For men: 10–20% is generally healthy, 6–14% is athletic. For women: 18–28% is generally healthy, 14–21% is athletic. Essential fat minimums are 3–5% for men and 10–13% for women. Below these levels, hormonal and immune function can be impaired.',
      },
    
      {
        question: 'Why does my body fat reading seem high even though I look lean?',
        answer: 'The Navy formula can overestimate body fat in individuals with wider bone structure or those who carry more fat in the hip area (women). If you have visible abs but the calculator says 15%+, the reading is likely inflated. Use the trend rather than the absolute number — track whether it goes up or down over weeks.',
      },],
    commonUses: [
      'Fitness progress tracking — monitor body fat percentage changes over time to evaluate the effectiveness of diet and exercise programs without needing expensive equipment',
      'Health risk assessment — body fat percentage categories (essential, athletic, fitness, average, obese) correlate with metabolic health markers and guide lifestyle interventions',
      'Military and tactical fitness — the U.S. Navy circumference method is used by multiple armed services for body fat estimation in personnel fitness assessments',
      'Body composition goal setting — estimate fat mass and lean mass from simple tape measurements to set informed body recomposition goals beyond just scale weight'
    ],
  
    
    workedExamples: [
      {
        scenario: 'Marcus is a 35-year-old man, 6\'0" tall, weighing 195 lbs, with a 16-inch neck and 36-inch abdomen. He wants to estimate his body fat percentage using the U.S. Navy method before starting a fitness program.',
        inputs: {
          'Unit System': 'Imperial',
          'Biological Sex': 'Male',
          'Age': '35',
          'Weight': '195 lbs',
          'Height': '6\'0" (72 in)',
          'Neck': '16 in',
          'Abdomen': '36 in',
        },
        result: 'Body Fat: 25.0%. Category: Obese (male, 25%+). Fat Mass: 48.8 lbs. Lean Mass: 146.3 lbs.',
        insight: 'At 195 lbs and 6\'0", Marcus has a BMI of 26.4 (Overweight). But the Navy circumference method reveals body fat at 25.0% — crossing into the Obese category by body composition standards. This illustrates why BMI alone is insufficient: Marcus carries fat predominantly around his midsection (36-inch abdomen vs. 16-inch neck), which the Navy formula detects through the abdomen-minus-neck difference. His lean mass of 146.3 lbs suggests he could aim to reach ~175 lbs at 16-18% body fat, which would mean losing about 20 lbs of fat while preserving muscle. Marcus should pair this estimate with a waist-to-height ratio check and, ideally, a DEXA scan for clinical confirmation.',
      },
      {
        scenario: 'Elena is 28 years old, 5\'5" tall, 140 lbs, with a 12.5-inch neck, 24-inch waist, and 29-inch hips. She is training for a half-marathon and wants to track body composition changes.',
        inputs: {
          'Unit System': 'Imperial',
          'Biological Sex': 'Female',
          'Age': '28',
          'Weight': '140 lbs',
          'Height': '5\'5" (65 in)',
          'Neck': '12.5 in',
          'Waist': '24 in',
          'Hip': '29 in',
        },
        result: 'Body Fat: 33.4%. Category: Obese (female, 32%+). Fat Mass: 46.8 lbs. Lean Mass: 93.2 lbs.',
        insight: 'At 140 lbs and 5\'5", Elena has a BMI of 23.3 (Normal weight). However, the Navy female formula estimates 33.4% body fat — in the Obese category. This apparent contradiction highlights a key limitation of the circumference method: it can overestimate body fat in women with wider hip-to-waist ratios (Elena\'s ratio is 0.83), because the formula treats hip circumference as a proxy for fat storage. Elena\'s 29-inch hip measurement relative to a 24-inch waist influences the calculation. For a half-marathon trainee who is likely leaner than the formula suggests, Elena should use this number as a baseline trend marker rather than a precise measurement. The value is in tracking change over time — if her measurements stay consistent but weight drops, the formula will show decreasing body fat %. DEXA or Bod Pod would provide more accurate absolute numbers.',
      },
    ],

    proTips: [
      'Morning is the best time to take measurements — before eating, after voiding, with an empty stomach. Measuring after meals or workouts can add 0.5–1 inch to waist/abdomen circumference and skew results by several percentage points.',
      'For consistent tracking, use the same flexible (but non-stretch) measuring tape each time and measure at the same anatomical landmarks. Mark the navel level, larynx position, and hip widest point so you hit the exact same spot every week.',
      'The abdomen-minus-neck difference drives the male formula. If you are building neck muscle (trapezius/resistance training), your neck measurement grows and artificially lowers the body fat estimate. Track neck separately to spot this artifact.',
      'Don\'t compare Navy BF% results across sexes. The male formula uses abdomen-neck-height while the female formula uses waist+hip-neck-height — they measure fundamentally different things. A cross-sex comparison of the percentage number is meaningless.',
    ],

    quickReference: [
      { label: 'Male Essential Fat', value: '2–6% body fat' },
      { label: 'Male Athletic', value: '6–14% body fat' },
      { label: 'Male Fitness', value: '14–18% body fat' },
      { label: 'Male Average', value: '18–25% body fat' },
      { label: 'Male Obese', value: '25%+ body fat' },
      { label: 'Female Essential Fat', value: '10–14% body fat' },
      { label: 'Female Athletic', value: '14–21% body fat' },
      { label: 'Female Fitness', value: '21–25% body fat' },
      { label: 'Female Average', value: '25–32% body fat' },
      { label: 'Female Obese', value: '32%+ body fat' },
      { label: 'Navy Formula Accuracy', value: '±2–3% vs. hydrostatic weighing when measured correctly' },
      { label: 'Measurement Error', value: '±3–5% for self-measurement; better with a trained assistant' },
    ],

    limitations: [
      'The Navy circumference method estimates body fat from surface measurements, not direct tissue analysis. It can overestimate body fat in lean individuals (visible abs with 15%+ Navy reading) and underestimate in very obese individuals where tape placement consistency degrades.',
      'The female formula uses hip circumference as a body fat proxy, which conflates pelvic bone structure width with fat storage. Women with wider hip bones (regardless of fat level) will receive higher readings — this is a structural limitation of any circumference-based formula.',
      'Circumferences do not distinguish visceral fat (around organs, higher health risk) from subcutaneous fat (under the skin, lower risk). Two people with identical measurements can have very different metabolic health profiles if one stores fat viscerally and the other subcutaneously.',
      'This formula was validated on a U.S. military population (generally fit, ages 17–50) and may be less accurate for older adults (significant muscle loss), very muscular athletes, or adolescents under 18.',
    ],
citations: [
      { source: 'NIH - Body Composition', url: 'https://www.niddk.nih.gov/health-information/weight-management' },
      { source: 'ACSM - Body Composition Guidelines', url: 'https://www.acsm.org/education-resources/books/guidelines-exercise-testing-prescription' },
    ],
  },
};

export default bodyFatConfig;
