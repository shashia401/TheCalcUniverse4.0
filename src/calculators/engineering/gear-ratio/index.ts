import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { createElement } from 'react';
import GearRatioPanel from './GearRatioPanel';
import { roundStr4 as fmt } from '../../../lib/format';
import { finiteSteps } from '../../../utils/explainGuard';
import type { ExplainStep } from '../../../types/calculator';

const gearRatioConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Calculate',
      type: 'select',
      required: true,
      helpText: 'Choose whether to find output speed, gear ratio, or required input RPM',
      options: [
        { label: 'Output Speed & Torque — given input and ratio', value: 'output' },
        { label: 'Gear Ratio — given input RPM and output RPM', value: 'ratio' },
        { label: 'Required Input RPM — given ratio and output RPM', value: 'input_rpm' },
      ],
    },
    {
      id: 'inputRPM',
      label: 'Input RPM',
      type: 'number',
      placeholder: '1800',
      unit: 'RPM',
      inputMode: 'decimal',
      min: 0,
      step: 1,
      helpText: 'Rotational speed of the input (motor) shaft',
    },
    {
      id: 'outputRPM',
      label: 'Output RPM (known)',
      type: 'number',
      placeholder: '600',
      unit: 'RPM',
      inputMode: 'decimal',
      min: 0,
      step: 1,
      helpText: 'Known rotational speed of the output (load) shaft',
    },
    {
      id: 'gearRatio',
      label: 'Gear Ratio',
      type: 'number',
      placeholder: '3',
      inputMode: 'decimal',
      min: 0.01,
      step: 0.01,
      helpText: 'Ratio > 1 = speed reduction. Ratio < 1 = speed increase.',
    },
    {
      id: 'inputTorque',
      label: 'Input Torque (optional)',
      type: 'number',
      placeholder: '100',
      unit: 'N·m',
      inputMode: 'decimal',
      min: 0,
      step: 0.1,
      helpText: 'Used to calculate output torque (output and ratio modes)',
      showWhen: (v) => v.mode !== 'input_rpm',
    },
    {
      id: 'efficiency',
      label: 'Gear Train Efficiency (optional)',
      type: 'number',
      placeholder: '95',
      unit: '%',
      inputMode: 'decimal',
      min: 1,
      max: 100,
      step: 0.5,
      helpText: 'Fraction of torque that survives friction losses. Blank = 95%, a typical assumption for a spur/helical stage; worm gears can be far lower (50-70%) and planetary stages higher (about 97%).',
      showWhen: (v) => v.mode !== 'input_rpm',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'output';
    const inputRPM = parseFloat(values.inputRPM);
    const outputRPM = parseFloat(values.outputRPM);
    const gearRatio = parseFloat(values.gearRatio);
    const inputTorque = parseFloat(values.inputTorque);
    const effPct = values.efficiency !== undefined && values.efficiency !== '' ? parseFloat(values.efficiency) : 95;
    const efficiency = effPct / 100;
    if (!Number.isFinite(effPct) || effPct <= 0 || effPct > 100) return [];
    const effLabel = `${fmt(effPct)}% efficiency`;

    if (mode === 'output') {
      if (!Number.isFinite(inputRPM) || !Number.isFinite(gearRatio) || gearRatio <= 0 || inputRPM < 0) return [];
      const calcOutputRPM = inputRPM / gearRatio;
      const results: CalculatorResult[] = [
        { id: 'outputRPM', label: 'Output Speed', value: `${fmt(calcOutputRPM)} RPM`, highlight: true, color: 'positive' as const },
        { id: 'ratio', label: 'Gear Ratio', value: `${fmt(gearRatio)}:1`, color: 'neutral' as const },
        { id: 'type', label: 'Type', value: gearRatio > 1 ? 'Speed Reduction / Torque Multiplication' : 'Speed Increase / Torque Reduction', color: 'neutral' as const },
      ];
      if (!isNaN(inputTorque) && inputTorque > 0) {
        const outputTorque = inputTorque * gearRatio * efficiency;
        results.push({ id: 'outputTorque', label: `Output Torque (${effLabel})`, value: `${fmt(outputTorque)} N·m`, color: 'positive' as const });
      }
      return results;
    }

    if (mode === 'ratio') {
      if (!Number.isFinite(inputRPM) || !Number.isFinite(outputRPM) || outputRPM <= 0 || inputRPM <= 0) return [];
      const ratio = inputRPM / outputRPM;
      const out: CalculatorResult[] = [
        { id: 'ratio', label: 'Gear Ratio', value: `${fmt(ratio)}:1`, highlight: true, color: 'positive' as const },
        { id: 'type', label: 'Type', value: ratio > 1 ? 'Reduction (output slower)' : ratio < 1 ? 'Overdrive (output faster)' : '1:1 Direct Drive', color: 'neutral' as const },
      ];
      if (Number.isFinite(inputTorque) && inputTorque > 0) {
        out.push({ id: 'outputTorque', label: `Output Torque (${effLabel})`, value: `${fmt(inputTorque * ratio * efficiency)} N·m`, color: 'positive' as const });
      }
      return out;
    }

    if (mode === 'input_rpm') {
      if (!Number.isFinite(outputRPM) || !Number.isFinite(gearRatio) || gearRatio <= 0 || outputRPM < 0) return [];
      const calcInputRPM = outputRPM * gearRatio;
      return [
        { id: 'inputRPM', label: 'Required Input RPM', value: `${fmt(calcInputRPM)} RPM`, highlight: true, color: 'positive' as const },
      ];
    }

    return [];
  },
  explainSteps: (values) => {
    const mode = values.mode || 'output';
    const inputRPM = parseFloat(values.inputRPM);
    const outputRPM = parseFloat(values.outputRPM);
    const gearRatio = parseFloat(values.gearRatio);
    const inputTorque = parseFloat(values.inputTorque);
    const effPct = values.efficiency !== undefined && values.efficiency !== '' ? parseFloat(values.efficiency) : 95;
    if (!Number.isFinite(effPct) || effPct <= 0 || effPct > 100) return [];
    const efficiency = effPct / 100;
    const torqueStep = (ratio: number): ExplainStep[] =>
      Number.isFinite(inputTorque) && inputTorque > 0
        ? [{ label: 'Output torque', expr: `T_out = ${fmt(inputTorque)} N·m × ${fmt(ratio)} × ${fmt(effPct)}% = ${fmt(inputTorque * ratio * efficiency)} N·m`, note: 'Torque scales up by the ratio; friction losses take off the efficiency.' }]
        : [];
    if (mode === 'output') {
      if (!Number.isFinite(inputRPM) || !Number.isFinite(gearRatio) || gearRatio <= 0 || inputRPM < 0) return [];
      return finiteSteps([
        { label: 'Output speed = input speed ÷ ratio', expr: `${fmt(inputRPM)} RPM ÷ ${fmt(gearRatio)} = ${fmt(inputRPM / gearRatio)} RPM` },
        ...torqueStep(gearRatio),
      ]);
    }
    if (mode === 'ratio') {
      if (!Number.isFinite(inputRPM) || !Number.isFinite(outputRPM) || outputRPM <= 0 || inputRPM <= 0) return [];
      const ratio = inputRPM / outputRPM;
      return finiteSteps([
        { label: 'Gear ratio = input speed ÷ output speed', expr: `${fmt(inputRPM)} ÷ ${fmt(outputRPM)} = ${fmt(ratio)}:1`, note: 'Above 1:1 the output turns slower and with more torque.' },
        ...torqueStep(ratio),
      ]);
    }
    if (mode === 'input_rpm') {
      if (!Number.isFinite(outputRPM) || !Number.isFinite(gearRatio) || gearRatio <= 0 || outputRPM < 0) return [];
      return finiteSteps([{ label: 'Input speed = output speed × ratio', expr: `${fmt(outputRPM)} RPM × ${fmt(gearRatio)} = ${fmt(outputRPM * gearRatio)} RPM` }]);
    }
    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(GearRatioPanel, { values, results });
  },
  educational: {
    formula: 'Output RPM = Input RPM ÷ Gear Ratio | Output Torque = Input Torque × Gear Ratio × Efficiency',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><circle cx="150" cy="170" r="60" fill="var(--svg-e0e7ff)" stroke="var(--svg-3b82f6)" stroke-width="3"/><circle cx="150" cy="170" r="10" fill="var(--svg-3b82f6)"/><circle cx="310" cy="170" r="100" fill="var(--svg-ede9fe)" stroke="var(--svg-8b5cf6)" stroke-width="3"/><circle cx="310" cy="170" r="15" fill="var(--svg-8b5cf6)"/><text x="150" y="260" text-anchor="middle" font-size="13" fill="var(--svg-3b82f6)">Input: 20T</text><text x="310" y="285" text-anchor="middle" font-size="13" fill="var(--svg-8b5cf6)">Output: 60T</text><text x="230" y="30" text-anchor="middle" font-size="14" fill="var(--svg-333333)">Gear Ratio = 3:1</text></svg>',
      alt: 'Two gears of different sizes showing a 3:1 gear ratio',
      caption: 'Gear ratio — larger driven gear turns slower but with more torque',
    },
    formulaDescription:
      'Gear ratios trade speed for torque (or vice versa). A ratio greater than 1 reduces speed and multiplies torque; a ratio less than 1 increases speed and reduces torque. Output Torque = Input Torque × Gear Ratio × Efficiency (95% unless you enter another value).',
    variables: [
      { symbol: 'Gear Ratio', name: 'Gear Ratio (N₁:N₂)', description: 'The ratio of teeth on the driving gear to teeth on the driven gear. Determines speed and torque relationship. A 3:1 reduction means the output shaft turns once for every 3 turns of the input.' },
      { symbol: 'Efficiency', name: 'Mechanical Efficiency', description: 'Real gear systems lose some torque to friction and heat. This calculator assumes 95% unless you enter a value. Worm gears can be far less efficient (about 50-70%).' },
      { symbol: 'RPM', name: 'Revolutions Per Minute', description: 'Rotational speed. Motors typically run at 1,200-3,600 RPM; gearboxes reduce this to useful speeds like 30-500 RPM for industrial applications.' },
    ],
    howToUse: [
      'Select the calculation mode: output RPM, gear ratio, or required input RPM.',
      'Enter the known values (input RPM, output RPM, or gear ratio).',
      'Optionally enter input torque to calculate output torque.',
      'View output speed, torque, and gear type classification.',
      'Use the result to select an appropriate gearbox for your application.',
    ],
    explanation:
      'Gear systems are mechanical force multipliers — they trade speed for torque or torque for speed. A 3:1 reduction gear reduces output speed by 3x but multiplies torque by approximately 3x (minus losses). This is why gearboxes are used on electric motors to match high motor speeds to low-speed, high-torque applications like conveyors, winches, and vehicle drivetrains. Compound gear trains (multiple gear stages) multiply the ratios of each stage. Real-world example: an electric motor running at 1,800 RPM driving a conveyor that needs to operate at 60 RPM. The required gear ratio is 1,800 ÷ 60 = 30:1. A single-stage gearbox is usually limited to about 10:1, so this would need a two-stage gearbox (for example, 6:1 first stage times 5:1 second stage = 30:1). If the motor delivers 50 N·m of torque, the output torque is 50 times 30 times 0.95 = 1,425 N·m — enough to move the conveyor belt with heavy loads. In a vehicle transmission, the gearbox provides multiple ratios for different driving conditions. First gear might be 3.5:1 for maximum torque during acceleration, while fifth gear might be 0.75:1 overdrive for fuel-efficient highway cruising. A differential adds a final reduction of typically about 3:1 to 4:1, so the overall ratio from engine to wheels in first gear would be roughly 10.5:1 to 14:1 for those example values.',
    quickReference: [
      { label: '1,750 RPM → 175 RPM', value: '10:1 reduction (conveyor drive)' },
      { label: '3,600 RPM → 600 RPM', value: '6:1 reduction (pump drive)' },
      { label: '1,800 RPM → 60 RPM', value: '30:1 reduction (mixer/agitator)' },
      { label: '100 N·m × 3:1', value: '285 N·m output (95% eff.)' },
      { label: 'Car 1st gear (typical)', value: 'about 3:1 – 4.5:1' },
      { label: 'Car overdrive (typical)', value: 'below 1:1' },
      { label: 'Compound train', value: 'multiply the stage ratios' },
      { label: 'Torque out', value: 'Torque in × ratio × efficiency' },
      { label: 'Worm gear single stage', value: 'roughly 5:1 – 100:1, lower efficiency' },
    ],
    commonUses: [
      'Designing mechanical systems like conveyor drives, winches, or mixers by calculating the gear reduction needed to match motor speed to load requirements',
      'Determining output torque and speed for automotive transmissions, differentials, or industrial gearboxes',
      'Selecting the appropriate gearbox stage count (single vs multi-stage) for applications requiring specific speed reduction ratios',
      'Sizing electric motor and gearbox combinations for robotics, CNC machines, and automated manufacturing equipment',
      'Bicycle gearing analysis — calculate cadence, speed, and torque multiplication for chainring and cassette combinations',
    ],
    workedExamples: [
      {
        scenario: 'Carlos is designing a conveyor belt system for a packaging facility. He has a 1,750 RPM electric motor that produces 45 N·m of torque, and the conveyor drive roller needs to turn at 70 RPM to move packages at the correct speed. What gear ratio does he need, and what output torque can he expect?',
        inputs: { mode: 'ratio', inputRPM: '1750', outputRPM: '70', inputTorque: '45' },
        result: '25:1 gear ratio, 1,068.75 N·m output torque at 95% efficiency (45 × 25 × 0.95)',
        insight: 'The required ratio is 1,750 ÷ 70 = 25:1. This is beyond what a single-stage gearbox can provide (typically max 10:1), so Carlos needs a two-stage gearbox — for example, a 5:1 first stage driving a 5:1 second stage (5 × 5 = 25:1). The output torque of 1,069 N·m is enough to move heavy pallets on the conveyor. Carlos should specify a gearbox rated for at least 1,200 N·m output torque with a service factor of 1.25 for continuous duty (1,069 × 1.25 = 1,336 N·m minimum rating). The motor shaft power is 45 N·m × 1,750 RPM ÷ 9,549 ≈ 8.25 kW (about 11 hp), so size the motor and drive from that.',
      },
      {
        scenario: 'Aisha is building an electric go-kart for a college engineering competition. The DC motor produces 12 N·m at 3,000 RPM. The rear wheels are 11 inches in diameter and she wants a top speed of 25 mph. What gear ratio and sprocket combination should she use?',
        inputs: { mode: 'output', inputRPM: '3000', gearRatio: '4', inputTorque: '12' },
        result: 'Output 750 RPM and 45.6 N·m at the wheels with a 4:1 sprocket pair (12T motor, 48T axle); the exact ratio for 25 mph is 3.93:1',
        insight: 'At 25 mph, an 11-inch diameter wheel covers π × 11 = 34.56 inches per revolution. 25 mph = 26,400 inches/min, so the wheel needs 26,400 ÷ 34.56 ≈ 764 RPM. The gear ratio needed is 3,000 ÷ 764 = 3.93:1. The nearest practical sprocket combination is 12 teeth on the motor and 48 teeth on the axle (4:1 ratio), giving a top speed of ~24.5 mph. Output torque at 4:1 with 95% chain efficiency = 12 × 4 × 0.95 = 45.6 N·m at the wheels. This provides strong acceleration for a 150 lb kart with a 160 lb driver — the thrust force is approximately 45.6 N·m ÷ 0.14 m wheel radius = 326 N (73 lbf) at peak torque.',
      },
      {
        scenario: 'Raj is spec\'ing a planetary gearbox for a solar tracker that adjusts panel angle throughout the day. The panels weigh 800 kg and need to rotate at approximately 0.1 RPM with high torque. He has a 24V DC motor that runs at 3,000 RPM no-load and produces 0.5 N·m stall torque. What overall ratio does he need?',
        inputs: { mode: 'ratio', inputRPM: '3000', outputRPM: '0.1', inputTorque: '0.5' },
        result: '30,000:1 overall ratio, ~14,250 N·m theoretical output torque',
        insight: 'A 30,000:1 ratio is far beyond any single gear stage. Raj would need several stages in series (for example planetary stages followed by a worm stage) whose ratios multiply to 30,000. With a worm stage the overall efficiency may be only ~60%, so the actual output torque drops to 0.5 × 30,000 × 0.6 = 9,000 N·m (enter 60 in the efficiency field to see this). The solar tracker requires roughly 800 kg × 9.81 m/s² × 1.5 m (lever arm) = 11,772 N·m max torque at horizontal position. The system would be marginal — Raj should consider a higher-torque motor (2-3 N·m) or use a harmonic drive (strain wave gear) which can achieve 160:1 in a single stage with zero backlash, making it ideal for precision solar tracking applications.',
      },
    ],
    proTips: [
      'When designing a multi-stage gearbox, keep individual stage ratios below 10:1 for spur/helical gears to avoid excessive tooth wear and noise. A 50:1 reduction is better achieved with a 7:1 first stage and 7:1 second stage (49:1) rather than a single 50:1 stage, which would require an impractically large driven gear or very small drive gear with undercut teeth.',
      'Include a service factor when specifying gearboxes: a common rule of thumb is about 1.0 for smooth loads (fans, centrifugal pumps), 1.25 for moderate shock (conveyors, mixers), 1.5 for heavy shock, and higher for extreme shock. Multiply your calculated torque by the factor your gearbox manufacturer or AGMA guidance recommends before choosing a catalog size.',
      'For reversing applications or frequent start/stop the gearbox sees torque reversals, so backlash matters. Planetary and harmonic-drive gearboxes have inherently low backlash. Backlash at an early stage is reduced at the output by the ratios that follow it, so the last stage (nearest the load) dominates output backlash.',
      'Bicycle gearing tip: cadence (pedal RPM) × (chainring teeth ÷ cog teeth) = wheel RPM, an overdrive (output faster than input). At 90 RPM cadence with a 48T chainring and 16T cog (3:1 step-up), the wheel spins at 270 RPM. With a 700c wheel (circumference about 2.1 m), speed = 270 × 2.1 × 60 ÷ 1000 ≈ 34 km/h. Many cyclists favour a cadence of roughly 80-100 RPM.',
    ],
    limitations: [
      'When not to use: efficiency defaults to 95%, a typical assumption for a spur/helical stage, and applies to torque only. Real efficiency varies significantly by gear type and load — worm gears can be far lower, planetary stages higher per stage. Use manufacturer efficiency data for production designs.',
      'The calculator does not model dynamic effects: inertia matching (motor inertia vs. reflected load inertia), torsional stiffness, backlash accumulation across stages, or thermal effects at high speeds. These are critical for servo systems, robotics, and high-speed applications.',
      'Gear ratio alone does not determine whether a gear pair will work — tooth strength, surface durability (pitting resistance), and lubrication requirements are separate design constraints governed by AGMA standards.',
      'For automotive and vehicle applications, the total gear ratio from engine to wheels includes the transmission ratio × differential ratio × tire diameter. This calculator does not account for tire slip, aerodynamic drag, or rolling resistance.',
    ],
    faqs: [
      {
        question: 'What is an overdrive gear?',
        answer: 'An overdrive gear has a ratio less than 1:1 — the output shaft rotates faster than the input. Used in vehicle transmissions for highway cruising to reduce engine RPM and improve fuel economy. A 0.75:1 overdrive means the engine turns at 2,250 RPM while the driveshaft turns at 3,000 RPM. Overdrive reduces engine wear and fuel consumption on highways but provides less torque, which is why you downshift for passing or climbing hills.',
      },
      {
        question: 'How do I calculate a compound gear train?',
        answer: 'Multiply the individual gear ratios of each stage. A 3:1 first stage and 2:1 second stage gives an overall ratio of 6:1. For a 4-stage gearbox with ratios of 4, 3, 2.5, and 2, the overall reduction is 4 × 3 × 2.5 × 2 = 60:1. The total number of teeth is independent — a compound train uses intermediate shafts where each shaft carries two gears (a driven gear from the previous stage and a drive gear for the next stage). The direction of rotation reverses at each mesh, so an odd number of stages reverses output direction relative to input.',
      },
      {
        question: 'What type of gearbox should I use for my application?',
        answer: 'Spur gears: most common, cheapest, handle moderate loads but are noisy above 1,000 ft/min pitch line velocity. Helical gears: quieter, handle higher loads due to gradual tooth engagement, but generate axial thrust that requires thrust bearings. Planetary gearboxes: highest power density, co-axial input/output, 97%+ efficiency per stage, ideal for servomotors and robotics. Worm gears: high ratios (5:1 to 100:1) in a single stage, but 50-70% efficient and generate significant heat — use for intermittent duty or low-speed applications where self-locking is desired. Harmonic (strain wave) drives: 30:1 to 160:1 in a single stage, zero backlash, used in robot joints and aerospace.',
      },
      {
        question: 'How does gear ratio affect motor current draw?',
        answer: 'A lower reduction ratio (less torque multiplication) forces the motor to supply more torque, and so more current, for the same load. The load torque seen by the motor falls in proportion to the ratio, and the reflected load inertia falls with the square of the ratio — a 10:1 reducer makes the load inertia look 100× smaller to the motor. A conveyor that stalls the motor through a 5:1 gearbox may run comfortably through a 10:1 one, because the motor sees half the torque. The trade-off is speed: higher reduction means lower output RPM, so choose the ratio that keeps the motor within its rated speed range.',
      },
      {
        question: 'What is the difference between gear ratio calculated by teeth vs. by diameter?',
        answer: 'Gear ratio is most accurately calculated by tooth count: Ratio = Teeth(driven) ÷ Teeth(driving). Using pitch diameters gives the same result since the pitch diameters are proportional to tooth count for meshing gears: Ratio = Diameter(driven) ÷ Diameter(driving). However, outside diameters are NOT proportional to tooth count — a 20-tooth gear has an OD of (20+2)/DP, while a 60-tooth gear has an OD of (60+2)/DP (where DP is diametral pitch). The 2-tooth addendum difference means OD ratio is not equal to the actual gear ratio. Always count teeth, not measure diameters.',
      },
      {
        question: 'Can gear ratio affect the direction of rotation?',
        answer: 'Yes. Each external gear mesh reverses rotation direction. A 2-stage gearbox reverses direction twice, so output rotates the same direction as input. An odd number of stages reverses direction. Planetary gearboxes can achieve co-axial output with no direction change. For applications where output direction matters, count your stages — a 3-stage gearbox reverses output direction. Worm gears also change the axis of rotation by 90 degrees in addition to providing reduction. Internal (ring) gears rotate in the same direction as the driving pinion, which is how planetary gearboxes maintain co-axial input/output rotation.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Gear Ratio', url: 'https://en.wikipedia.org/wiki/Gear_ratio' },

    ],
  },
};

export default gearRatioConfig;
