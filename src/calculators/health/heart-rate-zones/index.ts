import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import HRZonesPanel from './HRZonesPanel';

const ZONES = [
  {
    num: 1,
    name: 'Zone 1 — Warm Up / Recovery',
    low: 0.5,
    high: 0.6,
    purpose: 'Light activity, active recovery, promotes blood flow without fatigue',
    color: 'neutral' as const,
  },
  {
    num: 2,
    name: 'Zone 2 — Fat Burn / Aerobic Base',
    low: 0.6,
    high: 0.7,
    purpose: 'Optimal fat oxidation, endurance base building, easy conversational pace',
    color: 'positive' as const,
  },
  {
    num: 3,
    name: 'Zone 3 — Aerobic / Cardio',
    low: 0.7,
    high: 0.8,
    purpose: 'Improved cardiovascular efficiency, lactate threshold training',
    color: 'positive' as const,
  },
  {
    num: 4,
    name: 'Zone 4 — Anaerobic / Threshold',
    low: 0.8,
    high: 0.9,
    purpose: 'Speed and power development, pushes lactate threshold higher',
    color: 'neutral' as const,
  },
  {
    num: 5,
    name: 'Zone 5 — VO2 Max / All-Out',
    low: 0.9,
    high: 1.0,
    purpose: 'Maximum oxygen uptake, speed intervals, short bursts only (30–60 sec)',
    color: 'negative' as const,
  },
];

const heartRateZonesConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      placeholder: '35',
      unit: 'years',
      inputMode: 'decimal',
      min: 10,
      max: 100,
      step: 1,
      required: true,
      helpText: 'Used to estimate max heart rate via 220 − age formula',
    },
    {
      id: 'restingHR',
      label: 'Resting Heart Rate (Optional)',
      type: 'number',
      placeholder: '65',
      unit: 'bpm',
      inputMode: 'decimal',
      min: 30,
      max: 120,
      step: 1,
      helpText: 'Measure first thing in the morning before getting up. Enables the more accurate Karvonen formula.',
    },
    {
      id: 'method',
      label: 'Calculation Method',
      type: 'select',
      required: true,
      helpText: 'Karvonen (Heart Rate Reserve) is more accurate when resting HR is known',
      options: [
        { label: 'Karvonen / Heart Rate Reserve (Most Accurate)', value: 'karvonen' },
        { label: '% of Max Heart Rate (Simple)', value: 'maxpct' },
      ],
    },
  ],
  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const age = parseFloat(values.age);
    const rhrInput = parseFloat(values.restingHR);
    const method = values.method || 'karvonen';

    if (isNaN(age) || age <= 0) return [];

    const maxHR = 220 - age;
    const hasRHR = !isNaN(rhrInput) && rhrInput > 0 && values.restingHR !== '';
    const rhr = hasRHR ? rhrInput : 60;
    const hrr = maxHR - rhr;

    const fmt = (n: number) => Math.round(n);

    const zoneResults = ZONES.map((zone) => {
      let low: number;
      let high: number;

      if (method === 'karvonen') {
        low = Math.min(fmt(zone.low * hrr + rhr), maxHR);
        high = Math.min(fmt(zone.high * hrr + rhr), maxHR);
      } else {
        low = Math.min(fmt(zone.low * maxHR), maxHR);
        high = Math.min(fmt(zone.high * maxHR), maxHR);
      }

      return {
        id: `zone${zone.num}`,
        label: `${zone.name} (${(zone.low * 100).toFixed(0)}–${(zone.high * 100).toFixed(0)}% ${method === 'karvonen' ? 'HRR' : 'Max HR'})`,
        value: `${low}–${high} bpm · ${zone.purpose}`,
        color: zone.color,
      };
    });

    const results: CalculatorResult[] = [
      {
        id: 'maxHR',
        label: 'Estimated Maximum Heart Rate (220 − Age)',
        value: `${maxHR} bpm`,
        highlight: true,
        color: 'neutral' as const,
        interpretation: `The 220 − age rule is a population average — your true max can run 10-15 bpm either way, so treat the zones below as guides, not hard limits. ${hasRHR ? 'Since you entered a resting rate, the zones use the Karvonen (heart-rate-reserve) method, which personalizes them to your fitness.' : 'Add your resting heart rate for zones tailored to your fitness via the Karvonen method.'}`,
      },
    ];

    if (hasRHR) {
      results.push({
        id: 'rhr',
        label: 'Resting Heart Rate',
        value: `${rhrInput} bpm`,
        color: 'positive' as const,
      });
      results.push({
        id: 'hrr',
        label: 'Heart Rate Reserve (HRR = Max − Resting)',
        value: `${hrr} bpm`,
        color: 'neutral' as const,
      });
    }

    results.push({
      id: 'methodUsed',
      label: 'Formula',
      value: method === 'karvonen'
        ? `Karvonen: Target HR = (Max HR − RHR) × Intensity + RHR`
        : `% Max HR: Target HR = Max HR × Intensity`,
      color: 'neutral' as const,
    });

    results.push(...zoneResults);

    results.push({
      id: 'eightTwenty',
      label: '80/20 Rule — Recommended Training Distribution',
      value: `80% in Zone 1–2 (${fmt(ZONES[0].low * (method === 'karvonen' ? hrr : maxHR) + (method === 'karvonen' ? rhr : 0))}–${fmt(ZONES[1].high * (method === 'karvonen' ? hrr : maxHR) + (method === 'karvonen' ? rhr : 0))} bpm) | 20% in Zone 4–5`,
      color: 'positive' as const,
    });

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(HRZonesPanel, { values, results });
  },
  educational: {
    formula: 'Max HR = 220 − Age | Karvonen: Target = (Max − RHR) × Intensity% + RHR',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-333333)">Heart Rate Training Zones</text><rect x="10" y="60" width="84" height="55" rx="4" fill="var(--svg-3b82f6)"><title>Zone 1: 50-60% of max HR — Recovery. Light activity, warm-up, cool-down.</title></rect><text x="52" y="83" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Zone 1</text><text x="52" y="98" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">50-60%</text><rect x="94" y="60" width="84" height="55" rx="4" fill="var(--svg-22c55e)"><title>Zone 2: 60-70% of max HR — Fat Burn. Endurance training, steady state.</title></rect><text x="136" y="83" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Zone 2</text><text x="136" y="98" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">60-70%</text><rect x="178" y="60" width="84" height="55" rx="4" fill="var(--svg-f59e0b)"><title>Zone 3: 70-80% of max HR — Aerobic. Improving cardio efficiency.</title></rect><text x="220" y="83" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Zone 3</text><text x="220" y="98" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">70-80%</text><rect x="262" y="60" width="84" height="55" rx="4" fill="var(--svg-8b5cf6)"><title>Zone 4: 80-90% of max HR — Threshold. High-intensity, lactate buildup.</title></rect><text x="304" y="83" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Zone 4</text><text x="304" y="98" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">80-90%</text><rect x="346" y="60" width="84" height="55" rx="4" fill="var(--svg-ef4444)"><title>Zone 5: 90-100% of max HR — Max Effort. Sprints, max output.</title></rect><text x="388" y="83" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Zone 5</text><text x="388" y="98" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">90-100%</text><text x="220" y="155" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Zone 1: Recovery &middot; Zone 2: Fat Burn &middot; Zone 3: Aerobic</text><text x="220" y="175" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Zone 4: Threshold &middot; Zone 5: Max Effort</text></svg>',
      alt: 'Five colored heart rate training zones from Zone 1 (50-60%) to Zone 5 (90-100%)',
      caption: 'Heart rate zones range from recovery (50-60%) to max effort (90-100%); 80% of training in Zones 1-2',
    },
    formulaDescription:
      'Heart rate training zones use either a simple percentage of max HR or the Karvonen Heart Rate Reserve method, which factors in resting HR for significantly more personalized zones.',
    variables: [
      { symbol: 'Max HR', name: 'Maximum Heart Rate', description: 'Estimated as 220 minus age. The highest your heart can safely beat. Varies ±10–12 bpm between individuals.' },
      { symbol: 'RHR', name: 'Resting Heart Rate', description: 'Your heart rate at complete rest. Measure it first thing in the morning before getting out of bed.' },
      { symbol: 'HRR', name: 'Heart Rate Reserve', description: 'Max HR minus RHR. The Karvonen method applies intensity percentages to this reserve, making zones personal to your fitness level.' },
    ],
    howToUse: [
      'Enter your age to get your estimated max heart rate.',
      'Enter your resting heart rate for the more accurate Karvonen formula (measure it first thing in the morning).',
      'Select your calculation method — Karvonen is recommended when resting HR is available.',
      'Review all five training zones with their BPM ranges and training purposes.',
      'Use the 80/20 rule to structure your weekly training volume across zones.',
    ],
    explanation:
      'Training in specific heart rate zones triggers different physiological adaptations. Zone 2 (fat burn / aerobic base) is the most underrated — training here builds aerobic capacity and fat-burning efficiency with minimal recovery cost. Zone 4–5 drives speed and VO2 Max improvements but requires more recovery time. Most recreational athletes spend too much time in Zone 3 — the "grey zone" — which is neither easy enough for optimal aerobic adaptation nor hard enough for performance gains. Elite endurance athletes follow the 80/20 rule: 80% of training in Zones 1–2 and only 20% in high-intensity Zones 4–5. This polarised training approach has been validated in studies of Olympic-level rowers, cyclists, and runners. A common practical application: for a runner doing 5 hours of weekly training, 4 hours should be easy (Zone 1–2, conversational pace) and 1 hour should be hard intervals (Zone 4–5). The 220 minus age formula for max heart rate has a standard deviation of ±10–12 bpm, meaning half the population\'s true max HR differs by more than 10 beats. The Karvonen method reduces this error by incorporating your resting heart rate, which adjusts for individual fitness level — a well-trained athlete might have a resting HR of 40 bpm while a sedentary person might have 75 bpm, leading to very different Heart Rate Reserve values and thus different training zones even at the same age.',
    faqs: [
      {
        question: 'Is the 220-age max HR formula accurate?',
        answer: 'It is a population average that can vary by ±10–12 bpm for individuals. A graded exercise stress test provides a true measured max HR. The Karvonen method reduces error by accounting for resting HR.',
      },
      {
        question: 'What zone burns the most fat?',
        answer: 'Zone 2 burns the highest percentage of calories from fat. However, higher zones burn more total calories and more absolute grams of fat per hour even though fat represents a smaller percentage. Both are valuable for fat loss.',
      },
      {
        question: 'Why is Zone 3 called the "grey zone"?',
        answer: 'Zone 3 (70–80% max HR) is neither easy enough for optimal recovery and aerobic base building (Zone 1–2) nor hard enough for meaningful anaerobic adaptation (Zone 4–5). Many recreational runners spend most of their time here by accident.',
      },
      {
        question: 'How do I measure resting heart rate accurately?',
        answer: 'Measure it first thing in the morning before getting out of bed. Use a heart rate monitor or count your pulse for 60 seconds. Measure on multiple mornings and average them. A well-trained athlete may have a RHR of 40–50 bpm.',
      },
      {
        question: 'How long should I train in each heart rate zone?',
        answer: 'For balanced cardiovascular fitness: 80% of weekly training time should be in Zones 1-2 (easy aerobic), 10% in Zone 3 (tempo/threshold), and 10% in Zones 4-5 (high intensity). This "80/10/10" split, also known as polarized training, is backed by research on elite endurance athletes and is effective for recreational runners too. Beginners benefit most from spending more time in Zone 2 building aerobic base.',
      },
      {
        question: 'Can medications affect my heart rate zones?',
        answer: 'Yes, significantly. Beta blockers (e.g., metoprolol, atenolol) lower both resting and maximum heart rate by 20-40 bpm, making formula-based zones unreliable. Calcium channel blockers, thyroid medications, and stimulants (ADHD medications, caffeine, decongestants) also alter heart rate. If you take heart-rate-altering medications, do not use formula-derived zones — instead, use perceived exertion (RPE/talk test) or consult your cardiologist for medication-adjusted targets.',
      },
      {
        question: 'Why does my heart rate spike in hot weather even at the same pace?',
        answer: 'Cardiovascular drift — your heart rate increases 5-20 bpm in hot conditions because your body diverts blood to the skin for cooling, reducing venous return and stroke volume. To maintain the same cardiac output, heart rate must rise. On a 90°F day, a pace that normally produces 140 bpm might yield 155-165 bpm. Train by perceived exertion in hot conditions rather than rigidly adhering to heart rate zones, and expect pace to be 10-30 seconds per mile slower for the same perceived effort.',
      },
    ],
    commonUses: [
      'Endurance training optimization — use Zone 2 (fat burn / aerobic base) to build aerobic capacity with minimal recovery cost, following the 80/20 polarized training approach',
      'Race pace strategy — determine the heart rate range for your goal race pace (e.g., marathon at Zone 2-3 boundary) to avoid starting too fast and fading late',
      'Fitness level assessment — track how your Karvonen heart rate reserve changes over time as your resting heart rate drops with improved cardiovascular fitness',
      'Interval training prescription — set target heart rates for Zone 4-5 high-intensity intervals and Zone 1 active recovery periods for structured speed work sessions'
    ],
  
    
    workedExamples: [
      {
        scenario: 'James, 35, is training for his first marathon. His resting HR measured over 5 mornings averages 62 bpm. He wants to use the Karvonen method to determine his Zone 2 training range for building aerobic base on his long runs. His watch currently alerts him at 145 bpm, which feels too hard for easy runs.',
        inputs: { Age: '35', 'Resting HR': '62 bpm', Method: 'Karvonen' },
        result: 'Max HR (220-35): 185 bpm. HRR (185-62): 123 bpm. Zone 2 (Karvonen, 60-70% HRR): 136-148 bpm. His current alert of 145 bpm is at the top of Zone 2 — reasonable for an easy run ceiling, but ideally his easy runs should average 136-142 bpm (the middle of Zone 2).',
        insight: 'James\'s watch alert at 145 bpm is technically in Zone 2 but at its upper boundary. Most of his long, slow distance runs should fall in the 136-142 bpm range (the lower 2/3 of Zone 2) to maximize aerobic adaptation without accumulating unnecessary fatigue. If he runs at 145 bpm consistently, he drifts into Zone 3 territory, which provides diminishing aerobic returns at higher recovery cost. The practical adjustment: lower his watch alert to 142 bpm and aim to keep his conversational pace (able to speak in full sentences) throughout long runs. Over a 16-week marathon build, spending 80% of training time in Zone 2 (136-148 bpm) and 20% in Zone 4-5 will produce better race results than 50% in Zone 3 with less recovery capacity.',
      },
      {
        scenario: 'Maria, 42, is a fit triathlete with a resting HR of 48 bpm from years of endurance training. She is comparing her zones calculated via % Max HR vs. Karvonen to understand why her coach uses Karvonen zones. Her %MaxHR Zone 2 puts her at 107-125 bpm, but this feels trivially easy given her fitness.',
        inputs: { Age: '42', 'Resting HR': '48 bpm', Method: 'Karvonen vs %Max HR' },
        result: '%Max HR method: Max HR 178 bpm. Zone 2 (60-70%): 107-125 bpm. Karvonen method: HRR 130 bpm. Zone 2 (60-70% HRR + RHR): 126-139 bpm. The difference is 19 bpm at the bottom and 14 bpm at the top — roughly a full zone shift.',
        insight: 'The Karvonen method is dramatically more appropriate for Maria because her low resting HR (48 bpm) creates a large Heart Rate Reserve (130 bpm). The %Max HR method ignores her fitness level entirely — it would prescribe the same Zone 2 to a sedentary 42-year-old with a resting HR of 75 bpm, which is physiologically nonsensical. The Karvonen method correctly "rewards" her fitness by lifting her zones to match her actual cardiovascular capacity. At 126-139 bpm, her Zone 2 feels like a true aerobic effort — sustainable for hours with nasal breathing — rather than a trivial walk pace. For any athlete with a resting HR below 60 bpm, Karvonen is the only sensible method. The %Max HR method is adequate for beginners and general population use where precision matters less.',
      },
      {
        scenario: 'Tom, 28, is a recreational runner stuck at a 25-minute 5K for over a year. He runs 4 times per week, always at the same "comfortably hard" pace (HR ~155-160 bpm). Using the calculator, he discovers he has been training almost exclusively in Zone 3 — the grey zone — and missing both Zone 2 aerobic development and Zone 4-5 speed work.',
        inputs: { Age: '28', 'Resting HR': '65 bpm', Method: 'Karvonen' },
        result: 'Max HR: 192 bpm. HRR: 127 bpm. Zone 2 (aerobic base): 141-154 bpm. Zone 3 (grey zone): 154-167 bpm. Zone 4 (threshold): 167-179 bpm. Zone 5 (VO2 Max): 179-192 bpm. Tom\'s typical HR of 155-160 bpm falls squarely in Zone 3.',
        insight: 'Tom has been training in the "grey zone" — too hard for aerobic base building, not hard enough for meaningful anaerobic or VO2 max adaptation. This explains his 12-month plateau perfectly. The fix: restructure his 4 weekly runs as follows: Run 1 (Zone 2, 141-154 bpm, 60 min easy), Run 2 (Zone 4 intervals, 167-179 bpm, e.g., 5 x 3 min hard with 2 min recovery), Run 3 (Zone 2, 141-154 bpm, 45 min easy), Run 4 (Zone 5, 179-192 bpm, e.g., 6 x 30 sec all-out with 90 sec recovery). This gives him ~65% Zone 2 and ~35% Zone 4-5 — close to the 80/20 ideal. After 8-12 weeks of this polarized approach, he should expect significant improvements in his 5K time as his aerobic base expands AND his top-end speed increases.',
      },
    ],

    proTips: [
      'Measure your true resting HR correctly: wear a chest strap monitor to bed and check the lowest reading in the first 30 seconds after waking, before sitting up. Average over 5-7 mornings for a reliable baseline. A single morning reading can vary by 5-8 bpm due to sleep quality, hydration, alcohol, stress, or illness.',
      'The "talk test" is a free, zero-equipment way to verify you are in Zone 2. If you can speak in full sentences without gasping, you are likely in Zone 2. If you can only manage 3-5 words between breaths, you are in Zone 3-4. If you cannot speak at all, you are in Zone 5. Trust this over gadgets — it has been validated against lactate testing.',
      'Zone 2 requires patience — improvements take 8-12 weeks minimum. Many athletes abandon Zone 2 training after 3-4 weeks because they feel "too slow" or "not working hard enough." Resist this urge. The adaptations (mitochondrial biogenesis, capillary density, fat oxidation enzymes) are slow but profound and permanent. Elite marathoners spend 75-80% of their training volume in Zone 2 for a reason.',
      'Do not ignore cardiac drift. On long runs over 60 minutes, your heart rate will drift upward 5-10 bpm even at the same pace due to dehydration, heat, and fatigue. If your Zone 2 run starts at 138 bpm and drifts to 148 bpm by minute 75, you are still training aerobically — do not slow down to force the original number. Conversely, if you slow down but HR stays elevated, your fatigue is accumulating and you should cut the session short.',
      'Use perceived exertion as a cross-check for HR zones. The Borg Scale (6-20): Zone 1 = 6-9 (very light), Zone 2 = 10-12 (light to somewhat hard), Zone 3 = 13-14 (hard), Zone 4 = 15-17 (very hard), Zone 5 = 18-20 (maximal). If your HR monitor says Zone 2 but you feel RPE 15 (very hard), trust your perception — the monitor may be reading cadence lock or electrical interference rather than heart rate.',
    ],

    quickReference: [
      { label: 'Zone 1 (50-60%)', value: 'Recovery — light activity, warm-up, cool-down, active rest days' },
      { label: 'Zone 2 (60-70%)', value: 'Aerobic base — fat-burning, endurance building, conversational pace' },
      { label: 'Zone 3 (70-80%)', value: 'Aerobic/cardio — grey zone, tempo runs, improving cardiovascular efficiency' },
      { label: 'Zone 4 (80-90%)', value: 'Threshold — lactate threshold, speed work, hard intervals (2-10 min)' },
      { label: 'Zone 5 (90-100%)', value: 'VO2 Max — all-out sprints, max oxygen uptake, short bursts (30-60 sec)' },
      { label: '80/20 Rule', value: '80% training in Zones 1-2, 20% in Zones 4-5 for optimal adaptation' },
      { label: 'Max HR Formula', value: '220 - age (population average, ±10-12 bpm individual variation)' },
      { label: 'Karvonen Formula', value: 'Target HR = (Max HR - Resting HR) × Intensity% + Resting HR' },
    ],

    limitations: [
      'The 220-minus-age formula for max heart rate has a standard deviation of ±10-12 bpm, meaning half the population has a true max HR more than 10 bpm different from the estimate. For individuals over 40, the formula becomes increasingly inaccurate. A graded exercise stress test provides the only truly accurate max HR measurement.',
      'Heart rate zones based on max HR alone ignore individual fitness level. Two 30-year-olds with the same estimated max HR of 190 bpm can have resting HRs of 45 bpm (highly fit) and 80 bpm (deconditioned), resulting in very different Heart Rate Reserve values and training zones. Always use the Karvonen method with your measured resting HR for personalized accuracy.',
      'This calculator provides educational estimates and is not a substitute for clinical exercise testing or medical advice. If you have a heart condition, are on heart-rate-altering medications (beta blockers, calcium channel blockers), or have been sedentary for an extended period, consult a physician before starting an exercise program based on heart rate zones. Beta blockers, in particular, lower both resting and max HR, rendering formula-based zones unreliable.',
      'Cardiac drift, dehydration, caffeine, stress, sleep deprivation, altitude, and ambient temperature all affect heart rate independently of exercise intensity. Do not treat zone boundaries as rigid walls — a 2-4 bpm deviation is normal and expected. Use heart rate zones as training guides, not as rigid prescriptions.',
      'Heart rate zones do not directly measure lactate threshold or VO2 max, which are superior metrics for performance prescription. Zones 2-3 based solely on HR can overlap with different metabolic states depending on the individual. For serious athletes, lactate threshold testing (via blood lactate sampling) or VO2 max testing (via metabolic cart) provides more precise training zones than HR formulas.',
    ],
citations: [
      { source: 'AHA - Target Heart Rates', url: 'https://www.heart.org/en/healthy-living/fitness/fitness-basics/target-heart-rates' },
      { source: 'ACSM - Exercise Testing', url: 'https://www.acsm.org/education-resources/books/guidelines-exercise-testing-prescription' },
    ],
  },
};

export default heartRateZonesConfig;
