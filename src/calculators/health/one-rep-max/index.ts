import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import OneRepMaxPanel from './OneRepMaxPanel';
import { plainLocale as fmt } from '../../../lib/format';

const oneRepMaxConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'unit',
      label: 'Weight Unit',
      type: 'select',
      required: true,
      helpText: 'Results are shown in the same unit as the weight you enter',
      options: [
        { label: 'Pounds (lbs)', value: 'lbs' },
        { label: 'Kilograms (kg)', value: 'kg' },
      ],
    },
    {
      id: 'weight',
      label: 'Weight Lifted',
      type: 'number',
      placeholder: '225',
      unit: 'lbs / kg',
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
      helpText: 'Epley is the most common. For sets of 7 reps or fewer Brzycki gives the lowest estimate; from 8 reps up Lombardi does.',
      options: [
        { label: 'Epley (Most Common)', value: 'epley' },
        { label: 'Brzycki (lowest estimate up to 7 reps)', value: 'brzycki' },
        { label: 'Lombardi (lowest estimate from 8 reps)', value: 'lombardi' },
      ],
    },
  ],
  calculate: (values) => {
    const weight = parseFloat(values.weight);
    const reps = Math.round(parseFloat(values.reps)); // reps are whole numbers
    const formula = values.formula || 'epley';
    const u = values.unit === 'kg' ? 'kg' : 'lbs';

    if ([weight, reps].some(isNaN) || weight <= 0 || reps <= 0) return [];

    const cappedReps = Math.min(reps, 15);

    // A 1-rep set IS the 1RM, so every formula returns the weight lifted
    // (Epley's raw 1 + 1/30 would otherwise read 3.3% above a lift that was actually made).
    // Epley: weight × (1 + reps / 30)
    const epley = Math.round(cappedReps === 1 ? weight : weight * (1 + cappedReps / 30));

    // Brzycki: weight × 36 / (37 - reps); valid for reps < 37 (we cap at 15)
    const brzycki = Math.round(weight * 36 / (37 - cappedReps));

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

    return [
      {
        id: 'oneRepMax',
        label: `Estimated 1 Rep Max (${formulaLabel})`,
        value: `${fmt(primary)} ${u}`,
        highlight: true,
        color: 'positive',
        interpretation: `${cappedReps === 1 ? 'A 1-rep set is your 1RM, so no estimate is needed. ' : ''}Estimated from your ${cappedReps}-rep set — these formulas are most accurate at 5 reps or fewer and become less reliable as reps climb. Use the percentage table below to set training loads, and never attempt a true max without a spotter and a full warm-up.`,
      },
      {
        id: 'maxBasedOn',
        label: 'Calculated From',
        value: `${fmt(weight)} ${u} × ${cappedReps} reps`,
        color: 'neutral',
      },
      {
        id: 'epleyLine',
        label: 'Epley Formula',
        value: `${fmt(epley)} ${u}`,
        color: formula === 'epley' ? 'positive' : 'neutral',
      },
      {
        id: 'brzyckiLine',
        label: 'Brzycki Formula',
        value: `${fmt(brzycki)} ${u}`,
        color: formula === 'brzycki' ? 'positive' : 'neutral',
      },
      {
        id: 'lombardiLine',
        label: 'Lombardi Formula',
        value: `${fmt(lombardi)} ${u}`,
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
      caption: 'As reps increase, the percentage of your 1RM decreases: 1 rep = 100%, 12 reps = roughly 70% (approximate values)',
    },
    formulaDescription:
      'The One Rep Max (1RM) is the maximum weight you can lift for a single repetition. It is estimated from sub-maximal lifts because testing a true 1RM carries injury risk. The three formulas are simple curve fits, so they agree closely at low reps and drift apart as reps increase.',
    variables: [
      { symbol: 'Epley', name: 'Epley Formula', description: '1RM = W × (1 + R/30). The most commonly used in strength training programming. It gives the highest estimate for sets of 6 to 9 reps and falls between the other two at 5 reps or fewer and above 10. A 1-rep set returns the weight lifted.' },
      { symbol: 'Brzycki', name: 'Brzycki Formula', description: '1RM = W × 36 / (37 − R). Gives the lowest estimate for sets of 7 reps or fewer, but rises steeply above 10 reps (at 15 reps it gives the highest of the three).' },
      { symbol: 'Lombardi', name: 'Lombardi Formula', description: '1RM = W × R^0.10. Gives the highest estimate for sets of 5 reps or fewer and the lowest from 8 reps up, because it flattens out as reps climb.' },
    ],
    howToUse: [
      'Enter the weight you lifted (in lbs or kg — output matches input unit).',
      'Enter the number of reps you completed with that weight (capped at 15 for accuracy).',
      'Select your preferred formula — Epley is the most common.',
      'Use the percentage breakdown table to plan your training loads.',
      'Click through different formulas to see how much estimates vary — this helps you choose the right formula for your training style.',
    ],
    explanation:
      'Estimated 1RM formulas allow you to calculate your max strength from sub-maximal sets, reducing injury risk. Accuracy decreases as rep count increases — sets of 3–8 reps give the best estimates. Above 10 reps, all formulas become less reliable because neuromuscular fatigue and technique breakdown affect performance more than raw strength. The percentage breakdown table (50–100%) lets you plug the numbers directly into popular programs like 5/3/1 (Jim Wendler), Starting Strength (Mark Rippetoe), Smolov, or periodized block programming. Most programs prescribe sets at 65–85% of 1RM for volume work (hypertrophy and muscular endurance), 85–93% for pure strength work, and 93%+ for peaking. A practical example: if your estimated bench press 1RM is 225 lbs, then 75% = 169 lbs (hypertrophy sets of 8–12 reps), 85% = 191 lbs (strength sets of about 5–6 reps), and 90% = 203 lbs (heavy sets of 3–4 reps). The formulas agree closely at 2–5 reps and drift apart as reps climb: from a set of 185 lbs for 12 reps they give 259 (Epley), 266 (Brzycki) and 237 (Lombardi), a 29-lb spread, versus 6 lbs at 8 reps. That is why a heavy set of 3–5 reps is the better basis for a max estimate; Brzycki gives the lowest figure there, which makes it the cautious choice for heavy singles. Regardless of formula the estimate carries real error, so always add a safety margin when attempting heavy weights. Never attempt a true 1RM for an exercise you have not been training with proper form for at least 6 weeks.',
    faqs: [
      {
        question: 'Which 1RM formula is most accurate?',
        answer: 'No formula is best for every lift and every lifter. Epley is the most widely used. Below about 7 reps Brzycki gives the lowest figure, so it is the cautious pick for heavy sets; above 10 reps Brzycki climbs fastest and Lombardi stays lowest. All three lose reliability as reps increase, so base the estimate on a heavy set of 3–5 reps.',
      },
      {
        question: 'Can I test my actual 1RM safely?',
        answer: 'Only with preparation: a full warm-up, a spotter or safety pins, and several weeks of training on the lift with good form. For most people an estimate from a heavy set of 3–5 reps is safer and almost as useful. Each exercise has its own 1RM, so estimate your squat, bench press and deadlift separately.',
      },
      {
        question: 'How much should I train at each percentage?',
        answer: 'Max effort: 93%+ (1–3 reps). Strength: 85–93% (3–6 reps). Hypertrophy: 65–85% (6–12 reps). Light work, speed work and warm-ups: below 65%. These are the same zones used to colour the percentage table, and they are guidelines rather than rules.',
      },
    
      {
        question: 'Why do the three formulas give different answers?',
        answer: 'They are different curve fits to the same idea. At 3 reps with 315 lbs they give 347 (Epley), 334 (Brzycki) and 352 (Lombardi); at 8 reps with 185 lbs they give 234, 230 and 228. The gap widens as reps increase, so a lower-rep set gives a more trustworthy estimate.',
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
        insight: 'Marcus can use 234 lbs as his training max for program calculations. For 5/3/1 programming, his working sets would be calculated from 90% of 1RM (211 lbs training max), giving him week-1 sets of 65% (137 lbs), 75% (158 lbs), and 85% (179 lbs). The three formulas land within a 6-lb range (228–234 lbs) at 8 reps, so the choice of formula matters little here.',
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
      'Choose Brzycki if you are setting safety-first loads from heavy sets of 7 reps or fewer — it gives the lowest estimate in that range. Above 8 reps Lombardi is the lowest, and Brzycki the highest above 10.',
      'Pick the weight unit (lbs or kg) that matches the number you enter — the 1RM and all percentage breakdowns are shown in that unit.',
      'For program design, use 90% of the estimated 1RM as your "training max" — this is the standard approach in 5/3/1 (Jim Wendler), Juggernaut Method, and most percentage-based programs.',
    ],

    quickReference: [
      { label: 'Epley Formula', value: '1RM = W × (1 + R/30) — Most common' },
      { label: 'Brzycki Formula', value: '1RM = W × 36/(37−R) — Lowest estimate up to 7 reps' },
      { label: 'Lombardi Formula', value: '1RM = W × R^0.10 — Lowest estimate from 8 reps up' },
      { label: 'Reliability', value: 'Best from heavy sets of 3–5 reps; error grows as reps increase' },
      { label: 'Hypertrophy Zone', value: '65–85% of 1RM for 6–12 reps per set' },
      { label: 'Strength Zone', value: '85–93% of 1RM for 3–6 reps per set' },
      { label: 'Max Effort Zone', value: '93%+ of 1RM for 1–3 reps per set' },
      { label: 'Training Max', value: '90% of estimated 1RM — standard for program calculations' },
    ],

    limitations: [
      'Accuracy drops sharply above 10 reps — the formulas are best suited to sets of roughly 2–10 reps and extrapolate poorly beyond that range (this calculator caps the rep count at 15).',
      'Exercise-specific differences are not modeled — the relationship between reps and 1RM differs slightly between compound lifts (squat, deadlift) and isolation exercises (bicep curls, leg extensions).',
      'Individual variation in neuromuscular efficiency, fiber-type composition, and training age can produce estimates that differ by ±5% or more from a true tested 1RM.',
      'For competitive powerlifting, use this as a training guide only — meet attempts should be based on actual heavy singles performed in training, not formula estimates.',
    ],
citations: [

      { source: 'ACSM - Resistance Training', url: 'https://www.acsm.org/education-resources/books/guidelines-exercise-testing-prescription' },
    ],
  },
};

export default oneRepMaxConfig;
