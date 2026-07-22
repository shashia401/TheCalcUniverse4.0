import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import OneRepMaxPanel from './OneRepMaxPanel';

const oneRepMaxConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'weight',
      label: 'Weight Lifted',
      type: 'number',
      placeholder: '225',
      unit: 'lbs',
      inputMode: 'decimal',
      min: 1,
      max: 2000,
      step: 0.5,
      required: true,
      helpText: 'The weight you lifted for the set — in pounds or kilograms',
    },
    {
      id: 'reps',
      label: 'Repetitions Completed',
      type: 'number',
      placeholder: '5',
      unit: 'reps',
      inputMode: 'decimal',
      min: 1,
      max: 15,
      step: 1,
      required: true,
      helpText: 'How many reps you completed with that weight (1–15). Lower reps give better estimates.',
    },
    {
      id: 'formula',
      label: '1RM Formula',
      type: 'select',
      required: true,
      helpText: 'Epley is most common. Brzycki is conservative. Lombardi is liberal for high reps.',
      options: [
        { label: 'Epley (Most Common)', value: 'epley' },
        { label: 'Brzycki (Conservative)', value: 'brzycki' },
        { label: 'Lombardi (Liberal — higher for high reps)', value: 'lombardi' },
      ],
    },
  ],
  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const weight = parseFloat(values.weight);
    const reps = parseFloat(values.reps);
    const formula = values.formula || 'epley';

    if ([weight, reps].some(isNaN) || weight <= 0 || reps <= 0) return [];

    const cappedReps = Math.min(reps, 15);

    // Estimate 1RM using the three formulas
    // Epley: weight × (1 + reps / 30)
    const epley = Math.round(weight * (1 + cappedReps / 30));

    // Brzycki: weight × 36 / (37 - reps)
    const brzycki = reps < 37 ? Math.round(weight * 36 / (37 - cappedReps)) : weight;

    // Lombardi: weight × reps ^ 0.10
    const lombardi = Math.round(weight * Math.pow(cappedReps, 0.10));

    let primary: number;
    let formulaLabel: string;
    if (formula === 'brzycki') {
      primary = brzycki;
      formulaLabel = 'Brzycki';
    } else if (formula === 'lombardi') {
      primary = lombardi;
      formulaLabel = 'Lombardi';
    } else {
      primary = epley;
      formulaLabel = 'Epley';
    }

    // Generate percentage breakdown
    const pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];
    const breakdown = pcts.map(pct => ({
      pct,
      weight: Math.round(primary * pct / 100),
    }));

    // Rep max estimates (how many reps at certain %)
    const fmt = (n: number) => n.toLocaleString(undefined);

    return [
      {
        id: 'oneRepMax',
        label: `Estimated 1 Rep Max (${formulaLabel})`,
        value: `${fmt(primary)} lbs`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'maxBasedOn',
        label: 'Calculated From',
        value: `${fmt(weight)} lbs × ${cappedReps.toFixed(0)} reps`,
        color: 'neutral',
      },
      {
        id: 'epleyLine',
        label: 'Epley Formula',
        value: `${fmt(epley)} lbs`,
        color: formula === 'epley' ? 'positive' : 'neutral',
      },
      {
        id: 'brzyckiLine',
        label: 'Brzycki Formula',
        value: `${fmt(brzycki)} lbs`,
        color: formula === 'brzycki' ? 'positive' : 'neutral',
      },
      {
        id: 'lombardiLine',
        label: 'Lombardi Formula',
        value: `${fmt(lombardi)} lbs`,
        color: formula === 'lombardi' ? 'positive' : 'neutral',
      },
      {
        id: 'breakdownCount',
        label: 'Percentage Breakdown Available',
        value: `${breakdown.length} loading percentages (100% down to 50%)`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(OneRepMaxPanel, { values, results });
  },
  educational: {
    formula: 'Epley: 1RM = W × (1 + R/30) | Brzycki: 1RM = W × 36 / (37 − R) | Lombardi: 1RM = W × R^0.10',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Reps vs % of 1 Rep Max</text><text x="70" y="65" font-size="11" fill="var(--svg-333333)" font-weight="bold">Reps</text><text x="250" y="65" font-size="11" fill="var(--svg-333333)" font-weight="bold">% 1RM</text><text x="70" y="90" font-size="11" fill="var(--svg-333333)">1</text><rect x="120" y="78" width="160" height="16" rx="3" fill="var(--svg-3b82f6)"/><text x="290" y="90" font-size="11" fill="var(--svg-333333)">100%</text><text x="70" y="115" font-size="11" fill="var(--svg-333333)">2</text><rect x="120" y="103" width="152" height="16" rx="3" fill="var(--svg-22c55e)"/><text x="282" y="115" font-size="11" fill="var(--svg-333333)">95%</text><text x="70" y="140" font-size="11" fill="var(--svg-333333)">5</text><rect x="120" y="128" width="136" height="16" rx="3" fill="var(--svg-f59e0b)"/><text x="266" y="140" font-size="11" fill="var(--svg-333333)">85%</text><text x="70" y="165" font-size="11" fill="var(--svg-333333)">8</text><rect x="120" y="153" width="125" height="16" rx="3" fill="var(--svg-8b5cf6)"/><text x="255" y="165" font-size="11" fill="var(--svg-333333)">78%</text><text x="70" y="190" font-size="11" fill="var(--svg-333333)">12</text><rect x="120" y="178" width="112" height="16" rx="3" fill="var(--svg-ef4444)"/><text x="242" y="190" font-size="11" fill="var(--svg-333333)">70%</text></svg>',
      alt: 'Horizontal bar chart showing decreasing percentage of 1RM as reps increase from 1 to 12',
      caption: 'As reps increase, the percentage of your 1RM decreases: 1 rep = 100%, 12 reps = 70%',
    },
    formulaDescription:
      'The One Rep Max (1RM) is the maximum weight you can lift for a single repetition. It is estimated from sub-maximal lifts because testing a true 1RM carries injury risk. Each formula was developed on different populations and gives slightly different results.',
    variables: [
      { symbol: 'Epley', name: 'Epley Formula', description: '1RM = W × (1 + R/30). Developed on college athletes. Most commonly used in strength training programming. Tends to give moderate estimates.' },
      { symbol: 'Brzycki', name: 'Brzycki Formula', description: '1RM = W × 36 / (37 − R). Developed on college students. The most conservative formula — gives the lowest 1RM estimate and safest training weights.' },
      { symbol: 'Lombardi', name: 'Lombardi Formula', description: '1RM = W × R^0.10. Tends to give higher estimates, especially for rep counts above 8. Less commonly used but preferred by some for higher-rep sets.' },
    ],
    howToUse: [
      'Enter the weight you lifted (in lbs or kg — output matches input unit).',
      'Enter the number of reps you completed with that weight (capped at 15 for accuracy).',
      'Select your preferred formula — Epley is the most common.',
      'Use the percentage breakdown table to plan your training loads.',
      'Click through different formulas to see how much estimates vary — this helps you choose the right formula for your training style.',
    ],
    explanation:
      'Estimated 1RM formulas allow you to calculate your max strength from sub-maximal sets, reducing injury risk. Accuracy decreases as rep count increases — sets of 3–8 reps give the best estimates. Above 10 reps, all formulas become less reliable because neuromuscular fatigue and technique breakdown affect performance more than raw strength. The percentage breakdown table (50–100%) lets you plug the numbers directly into popular programs like 5/3/1 (Jim Wendler), Starting Strength (Mark Rippetoe), Smolov, or periodized block programming. Most programs prescribe sets at 65–85% of 1RM for volume work (hypertrophy and muscular endurance), 85–93% for pure strength work, and 93%+ for peaking. A practical example: if your estimated bench press 1RM is 225 lbs, then 75% = 169 lbs (hypertrophy sets of 8–12 reps), 85% = 191 lbs (strength sets of 5–8 reps), and 90% = 203 lbs (peak strength sets of 3–5 reps). The Brzycki formula gives the most conservative (safest) estimates and is recommended for beginners to avoid overestimating and attempting weights beyond their actual capability. Epley is the standard for intermediate and advanced lifters. For older adults or those rehabbing from injury, Brzycki is preferred because it provides a margin of safety. For powerlifters testing peaking cycles, Lombardi or Epley are more commonly used. Regardless of formula, the standard error of estimate is approximately ±3–5%, so always add a safety margin when attempting heavy weights. Never attempt a true 1RM for an exercise you have not been training with proper form for at least 6 weeks.',
    faqs: [
      {
        question: 'Which 1RM formula is most accurate?',
        answer: 'Epley is the most validated and commonly used. Brzycki is slightly more conservative and safer for beginners. Lombardi can overestimate for high-rep sets. All formulas have a standard error of ±3–5% compared to actual 1RM testing.',
      },
      {
        question: 'Can I test my actual 1RM safely?',
        answer: 'Different exercises use different muscle groups and movement patterns. Your squat 1RM will be very different from your bench press 1RM. Relative strength ratios: squat ≈ 1.3× bench, deadlift ≈ 1.5× bench, overhead press ≈ 0.6× bench for most trained lifters.',
      },
      {
        question: 'How much should I train at each percentage?',
        answer: 'Power: 55–65% (3–5 reps, explosive). Hypertrophy: 65–75% (8–12 reps). Strength: 75–85% (5–8 reps). Peaking: 85–95% (3–5 reps). Max effort: 93%+ (1–3 reps). The percentage table lets you dial in any of these zones instantly.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
    commonUses: [
      'Strength training program design — calculate training loads at specific percentages of 1RM (65-85% for hypertrophy, 85-93% for strength) for programs like 5/3/1 or Starting Strength',
      'Progress tracking — estimate 1RM from sub-maximal sets over time to measure strength gains without repeatedly testing maximal lifts and risking injury',
      'Plateau breaking — use multiple formulas (Epley, Brzycki, Lombardi) to identify the most accurate estimate for your rep range and adjust training loads accordingly',
      'Injury-safe strength assessment — estimate max strength from sets of 3-8 reps rather than attempting a true 1RM, which carries higher injury risk without a spotter'
    ],
  
    
    workedExamples: [
      {
        scenario: 'Marcus, a 32-year-old intermediate lifter in Austin, TX, bench pressed 185 lbs for 8 reps and wants to estimate his 1RM for his next 5/3/1 training cycle using the Epley formula.',
        inputs: { weight: '185', reps: '8', formula: 'epley' },
        result: 'Estimated 1 Rep Max (Epley): 234 lbs. Epley: 234 lbs (185 × (1 + 8/30) = 185 × 1.267 = 234.3 → 234 lbs). Brzycki: 230 lbs (conservative). Lombardi: 228 lbs (liberal for this rep range).',
        insight: 'Marcus can use 234 lbs as his training max for program calculations. For 5/3/1 programming, his working sets would be calculated from 90% of 1RM (211 lbs training max), giving him week-1 sets of 65% (137 lbs), 75% (158 lbs), and 85% (179 lbs). The three formulas converge within a 7-lb range at 8 reps, indicating a reliable estimate.',
      },
      {
        scenario: 'Priya, a 26-year-old competitive powerlifter in Chicago, deadlifted 315 lbs for 3 reps and wants a conservative 1RM estimate using Brzycki to safely plan her competition attempts.',
        inputs: { weight: '315', reps: '3', formula: 'brzycki' },
        result: 'Estimated 1 Rep Max (Brzycki): 334 lbs. Epley: 347 lbs (315 × (1 + 3/30) = 315 × 1.10 = 346.5 → 347 lbs). Brzycki: 334 lbs (315 × 36/(37−3) = 315 × 36/34 = 315 × 1.059 = 333.5 → 334 lbs). Lombardi: 352 lbs (315 × 3^0.10 = 315 × 1.116 = 351.5 → 352 lbs).',
        insight: 'At just 3 reps, all three formulas give estimates within 7% of each other — the ideal rep range for 1RM estimation. Priya chooses Brzycki (334 lbs) as her conservative training max. Her competition opener should be ~90% of her estimated 1RM (~301 lbs), her second attempt around 95-97% (~318-324 lbs), and her third attempt at 100%+ (334+ lbs). The conservative estimate provides a safety margin for competition day.',
      },
    ],

    proTips: [
      'Use 3–8 rep sets for the most accurate estimates — accuracy degrades significantly above 10 reps because fatigue and technique breakdown mask true strength.',
      'Choose Brzycki if you are a beginner, returning from injury, or setting safety-first training loads — it consistently gives the lowest (most conservative) estimate across all rep ranges.',
      'Keep the unit consistent — if you enter weight in pounds, the 1RM and all percentage breakdowns will be in pounds. The calculator is unit-agnostic.',
      'For program design, use 90% of the estimated 1RM as your "training max" — this is the standard approach in 5/3/1 (Jim Wendler), Juggernaut Method, and most percentage-based programs.',
    ],

    quickReference: [
      { label: 'Epley Formula', value: '1RM = W × (1 + R/30) — Most common, moderate estimates' },
      { label: 'Brzycki Formula', value: '1RM = W × 36/(37−R) — Most conservative, safest' },
      { label: 'Lombardi Formula', value: '1RM = W × R^0.10 — Liberal for higher reps' },
      { label: 'Standard Error', value: '±3–5% for all formulas at 3–8 reps; ±8–12% at 10+ reps' },
      { label: 'Hypertrophy Zone', value: '65–75% of 1RM for 8–12 reps per set' },
      { label: 'Strength Zone', value: '75–85% of 1RM for 5–8 reps per set' },
      { label: 'Peaking Zone', value: '85–95% of 1RM for 1–5 reps per set' },
      { label: 'Training Max', value: '90% of estimated 1RM — standard for program calculations' },
    ],

    limitations: [
      'Accuracy drops sharply above 10 reps — the formulas were developed on sets of 2–10 reps and extrapolate poorly beyond that range (standard error increases to ±12% at 15 reps).',
      'Exercise-specific differences are not modeled — the relationship between reps and 1RM differs slightly between compound lifts (squat, deadlift) and isolation exercises (bicep curls, leg extensions).',
      'Individual variation in neuromuscular efficiency, fiber-type composition, and training age can produce estimates that differ by ±5% or more from a true tested 1RM.',
      'For competitive powerlifting, use this as a training guide only — meet attempts should be based on actual heavy singles performed in training, not formula estimates.',
    ],
citations: [
      { source: 'NSCA - Strength Training', url: 'https://www.nsca.com/education/publications/essentials-of-strength-training-and-conditioning/' },
      { source: 'ACSM - Resistance Training', url: 'https://www.acsm.org/education-resources/books/guidelines-exercise-testing-prescription' },
    ],
  },
};

export default oneRepMaxConfig;
