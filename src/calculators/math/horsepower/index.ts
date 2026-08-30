import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import HorsepowerPanel from './HorsepowerPanel';

const DRIVETRAIN_LOSS: Record<string, number> = {
  fwd: 15,
  rwd: 18,
  awd: 25,
};

const powerCategory = (hp: number, weight: number): string => {
  const ratio = weight / hp;
  if (ratio < 6) return 'Supercar';
  if (ratio < 8) return 'Sports Car';
  if (ratio < 10) return 'Performance';
  if (ratio < 12.5) return 'Average';
  if (ratio < 15) return 'Underpowered';
  return 'Economy';
};

const horsepowerConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Input Mode',
      type: 'select',
      options: [
        { label: 'Quarter-Mile ET', value: 'et' },
        { label: 'Trap Speed', value: 'speed' },
        { label: 'Both (most accurate)', value: 'both' },
      ],
      defaultValue: 'both',
    },
    {
      id: 'vehicleWeight',
      label: 'Vehicle Weight (lbs)',
      type: 'number',
      min: 0,
      step: 1,
      placeholder: 'e.g., 3500',
      helpText: 'Includes driver and fuel',
      required: true,
    },
    {
      id: 'quarterMileET',
      label: 'Quarter-Mile ET (seconds)',
      type: 'number',
      min: 0,
      step: 0.01,
      placeholder: 'e.g., 12.5',
      showWhen: (v) => v.mode === 'et' || v.mode === 'both',
    },
    {
      id: 'trapSpeed',
      label: 'Trap Speed (MPH)',
      type: 'number',
      min: 0,
      step: 0.1,
      placeholder: 'e.g., 110',
      showWhen: (v) => v.mode === 'speed' || v.mode === 'both',
    },
    {
      id: 'drivetrain',
      label: 'Drivetrain',
      type: 'select',
      options: [
        { label: 'FWD (15% loss)', value: 'fwd' },
        { label: 'RWD (18% loss)', value: 'rwd' },
        { label: 'AWD (25% loss)', value: 'awd' },
      ],
      defaultValue: 'rwd',
      helpText: 'Estimates crank horsepower from wheel horsepower',
    },
  ],
  calculate: (values) => {
    const weight = parseFloat(values.vehicleWeight);
    const mode = values.mode || 'both';
    const drivetrain = values.drivetrain || 'rwd';
    const et = parseFloat(values.quarterMileET);
    const speed = parseFloat(values.trapSpeed);

    if (isNaN(weight) || weight <= 0) return [];

    const lossPct = DRIVETRAIN_LOSS[drivetrain] ?? 18;
    const lossFactor = 1 - lossPct / 100;

    const fmtHP = (n: number) => `${n.toFixed(1)} HP`;

    // Calculate based on mode
    if (mode === 'et') {
      if (isNaN(et) || et <= 0) return [];

      const hpFromET = weight / Math.pow(et / 5.825, 3);
      const estimatedHP = hpFromET;
      const whp = estimatedHP * lossFactor;
      const ptW = weight / estimatedHP;
      const cat = powerCategory(estimatedHP, weight);

      return [
        { id: 'estimatedHP', label: 'Estimated Horsepower', value: fmtHP(estimatedHP), highlight: true, color: 'positive' as const },
        { id: 'crankHP', label: 'Crank (BHP)', value: fmtHP(estimatedHP), color: 'neutral' as const },
        { id: 'wheelHP', label: 'Wheel HP (WHP)', value: fmtHP(whp), color: 'neutral' as const },
        { id: 'powerToWeight', label: 'Power-to-Weight', value: `${ptW.toFixed(1)} lbs/hp`, color: 'neutral' as const },
        { id: 'method', label: 'Method', value: 'ET-based', color: 'neutral' as const },
        { id: 'powerCategory', label: 'Performance Tier', value: cat, color: 'positive' as const },
      ];
    }

    if (mode === 'speed') {
      if (isNaN(speed) || speed <= 0) return [];

      const hpFromSpeed = weight * Math.pow(speed / 234, 3);
      const estimatedHP = hpFromSpeed;
      const whp = estimatedHP * lossFactor;
      const ptW = weight / estimatedHP;
      const cat = powerCategory(estimatedHP, weight);

      return [
        { id: 'estimatedHP', label: 'Estimated Horsepower', value: fmtHP(estimatedHP), highlight: true, color: 'positive' as const },
        { id: 'crankHP', label: 'Crank (BHP)', value: fmtHP(estimatedHP), color: 'neutral' as const },
        { id: 'wheelHP', label: 'Wheel HP (WHP)', value: fmtHP(whp), color: 'neutral' as const },
        { id: 'powerToWeight', label: 'Power-to-Weight', value: `${ptW.toFixed(1)} lbs/hp`, color: 'neutral' as const },
        { id: 'method', label: 'Method', value: 'Speed-based', color: 'neutral' as const },
        { id: 'powerCategory', label: 'Performance Tier', value: cat, color: 'positive' as const },
      ];
    }

    // Both mode
    if (isNaN(et) || et <= 0 || isNaN(speed) || speed <= 0) return [];

    const hpFromET = weight / Math.pow(et / 5.825, 3);
    const hpFromSpeed = weight * Math.pow(speed / 234, 3);
    const estimatedHP = (hpFromET + hpFromSpeed) / 2;
    const whp = estimatedHP * lossFactor;
    const ptW = weight / estimatedHP;
    const cat = powerCategory(estimatedHP, weight);

    return [
      { id: 'estimatedHP', label: 'Estimated Horsepower', value: fmtHP(estimatedHP), highlight: true, color: 'positive' as const },
      { id: 'crankHP', label: 'Crank (BHP)', value: fmtHP(estimatedHP), color: 'neutral' as const },
      { id: 'wheelHP', label: 'Wheel HP (WHP)', value: fmtHP(whp), color: 'neutral' as const },
      { id: 'powerToWeight', label: 'Power-to-Weight', value: `${ptW.toFixed(1)} lbs/hp`, color: 'neutral' as const },
      { id: 'method', label: 'Method', value: 'Average of both', color: 'neutral' as const },
      { id: 'hpFromET', label: 'HP from ET', value: fmtHP(hpFromET), color: 'neutral' as const },
      { id: 'hpFromSpeed', label: 'HP from Speed', value: fmtHP(hpFromSpeed), color: 'neutral' as const },
      { id: 'powerCategory', label: 'Performance Tier', value: cat, color: 'positive' as const },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(HorsepowerPanel, { values, results });
  },
  educational: {
    formula: 'HP = weight / (ET / 5.825)³ | HP = weight × (speed / 234)³',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="25" y="20" width="270" height="160" fill="rgba(59,130,246,0.05)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="160" y="42" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">Drag Strip — Quarter Mile</text><line x1="50" y1="60" x2="270" y2="60" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="50" y1="60" x2="50" y2="65" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><line x1="270" y1="60" x2="270" y2="65" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="50" y="55" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="9">Start</text><text x="270" y="55" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="9">Finish</text><text x="160" y="55" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">1,320 ft</text><rect x="55" y="75" width="40" height="25" fill="var(--svg-3b82f6)" rx="4"/><text x="75" y="91" text-anchor="middle" fill="var(--svg-ffffff)" font-family="Arial,sans-serif" font-size="9">Car</text><text x="75" y="118" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="11" font-weight="bold">ET</text><text x="75" y="132" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">elapsed time</text><text x="240" y="118" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="11" font-weight="bold">Trap Speed</text><text x="240" y="132" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">at finish line</text><line x1="75" y1="100" x2="75" y2="108" stroke="var(--svg-9ca3af)" stroke-width="1"/><line x1="240" y1="100" x2="240" y2="108" stroke="var(--svg-9ca3af)" stroke-width="1"/><text x="160" y="165" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">HP = f(weight, ET, trap speed)</text></svg>',
      alt: 'Drag strip diagram showing quarter mile with car, elapsed time (ET), and trap speed',
      caption: 'Horsepower estimated from quarter-mile ET and trap speed using the Hale formula',
    },
    formulaDescription:
      'The Hale (Patrick Hale) formula estimates engine horsepower from quarter-mile drag strip performance. Using both ET and trap speed gives the most accurate estimate by averaging the two independent calculations.',
    variables: [
      { symbol: 'HP', name: 'Horsepower', description: 'Estimated engine power output.' },
      { symbol: 'weight', name: 'Vehicle Weight (lbs)', description: 'Total weight including driver and fuel.' },
      { symbol: 'ET', name: 'Elapsed Time (seconds)', description: 'Quarter-mile elapsed time from the drag strip.' },
      { symbol: 'speed', name: 'Trap Speed (MPH)', description: 'Quarter-mile trap speed at the finish line.' },
    ],
    howToUse: [
      'Select your input mode: ET only, trap speed only, or both (most accurate).',
      'Enter vehicle weight including driver and fuel.',
      'Enter the quarter-mile ET and/or trap speed from your timeslip.',
      'Select drivetrain type to estimate wheel horsepower.',
      'Review estimated crank and wheel horsepower, power-to-weight ratio, and performance tier.',
    ],
    explanation:
      'The Hale formula correlates drag strip performance with engine power. ET-based calculation uses the time to complete 1,320 feet; speed-based uses the vehicle velocity at the finish line. The 5.825 constant in the ET formula represents the cubic root relationship between time and power, while 234 in the speed formula accounts for aerodynamic and rolling resistance at high speed. Averaging both methods cancels out individual errors: ET can be affected by traction off the line, while speed is affected by aerodynamic drag and gearing. Practical example: a 3,500 lb car runs a 13.0-second quarter-mile at 108 mph. Using both modes: HP from ET = 3,500 / (13.0 / 5.825)³ = 3,500 / (2.232)³ = 3,500 / 11.12 = 314.7 HP. HP from speed = 3,500 × (108 / 234)³ = 3,500 × (0.462)³ = 3,500 × 0.0984 = 344.4 HP. Average = (314.7 + 344.4) / 2 = 329.6 HP at the crank. With an RWD drivetrain (18% loss), wheel HP = 329.6 × 0.82 = 270.3 WHP. Power-to-weight = 3,500 / 329.6 = 10.6 lbs/HP (Performance category). Edge cases: for high-horsepower cars running on drag radials with excellent traction, the ET method can overestimate power because the car hooks up better than the formula assumes — the Hale formula was calibrated for street tires. For AWD cars, the ET method is more accurate than speed because AWD launches are more consistent, but the speed method may under-read because AWD drivetrain losses are higher (25%). For very high altitudes (e.g., Denver at 5,280 ft), air density is about 17% lower than sea level, which reduces naturally aspirated engine power by about 3-4% per 1,000 ft. The Hale formula does not correct for altitude. For turbocharged cars, altitude has minimal effect on power since the turbo compresses air to a set boost level regardless of ambient density. For electric vehicles, the Hale formula does not apply because EVs have a fundamentally different power delivery (constant torque, no shifting, no clutch dump launches). Hybrid powertrains with instant torque fill also deviate from the formula assumptions.',
    faqs: [
      {
        question: 'Which is more accurate: ET-based or speed-based?',
        answer: 'Speed-based is generally more consistent because trap speed is less affected by traction and launch technique. However, averaging both methods gives the most accurate overall estimate, as it balances the variables that affect each measurement differently.',
      },
      {
        question: 'What is power-to-weight ratio?',
        answer: 'Power-to-weight ratio (lbs/hp) measures how much weight each horsepower must move. Lower numbers mean better performance. A ratio under 10 lbs/hp is considered performance-oriented, while under 8 is sports car territory and under 6 is supercar territory.',
      },
      {
        question: 'How accurate is the Hale formula?',
        answer: 'The Hale formula is accurate to within approximately 5-10% for naturally aspirated vehicles with manual transmissions in good weather conditions. Factors like altitude, temperature, drivetrain losses, and vehicle aerodynamics can affect accuracy. It is calibrated for typical street cars on drag radials or street tires.',
      },
      {
        question: 'Why do I need drivetrain selection?',
        answer: 'Horsepower measured at the wheels (WHP) is always lower than at the crank due to drivetrain losses. FWD typically loses about 15%, RWD about 18%, and AWD about 25%. The calculator estimates both crank and wheel horsepower so you can compare with dyno results.',
      },
      {
        question: 'How does temperature and altitude affect quarter-mile ET and trap speed?',
        answer: 'Environmental conditions significantly affect drag strip performance. Density altitude (a combination of air temperature, pressure, and humidity) dictates how much oxygen is available for combustion. At sea level on a 60°F day, a naturally aspirated car might run a 13.0 at 108 mph. At a track in Denver (5,280 ft elevation) on a 90°F day, the density altitude could be 8,500+ feet, and the same car might run 14.0 at 100 mph — losing over a second and nearly 10 mph because the thin air contains about 20% less oxygen. The correction factor for altitude is roughly 3-4% power loss per 1,000 feet for naturally aspirated engines. For every 10°F increase in air temperature, power drops by about 1% due to lower air density. Humidity also plays a role: high humidity displaces oxygen molecules in the air, reducing power. For this calculator, results should be considered estimates — the Hale formula was calibrated for near-sea-level conditions at moderate temperatures. Turbocharged cars are less affected by altitude because the turbo compresses the thinner air to the same boost pressure, but the turbo must spin faster to maintain boost at altitude, which can push it beyond its efficiency range and heat the intake air. The best conditions for drag racing are cool, dry days at sea level.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Horsepower', url: 'https://en.wikipedia.org/wiki/Horsepower' },

    ],
  },
};

export default horsepowerConfig;
