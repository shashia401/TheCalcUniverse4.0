import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import EngineHPPanel from './EngineHPPanel';

const getPowerCategory = (hp: number): string => {
  if (hp >= 700) return 'Hypercar';
  if (hp >= 490) return 'Muscle Car';
  if (hp >= 350) return 'Performance';
  if (hp >= 200) return 'Mid-Range';
  if (hp >= 100) return 'Economy';
  return 'Low Output';
};

const engineHPConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'torque',
      label: 'Torque (lb-ft)',
      type: 'number',
      min: 0,
      step: 0.1,
      placeholder: 'e.g., 350',
      helpText: 'Engine torque in pound-feet',
      required: true,
    },
    {
      id: 'rpm',
      label: 'Engine Speed (RPM)',
      type: 'number',
      min: 0,
      step: 1,
      placeholder: 'e.g., 5500',
      helpText: 'Revolutions per minute',
      required: true,
    },
    {
      id: 'unitSystem',
      label: 'Units',
      type: 'select',
      options: [
        { label: 'Imperial (lb-ft, HP)', value: 'imperial' },
        { label: 'Metric (Nm, kW)', value: 'metric' },
      ],
      defaultValue: 'imperial',
    },
    {
      id: 'showExplanation',
      label: 'Show Technical Explanation',
      type: 'select',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      defaultValue: 'yes',
    },
  ],
  calculate: (values) => {
    const unitSystem = values.unitSystem || 'imperial';
    const showExplanation = values.showExplanation || 'yes';
    const torqueRaw = parseFloat(values.torque);
    const rpmRaw = parseFloat(values.rpm);

    if (isNaN(torqueRaw) || isNaN(rpmRaw)) return [];
    if (torqueRaw <= 0 || rpmRaw <= 0) return [];
    if (rpmRaw > 20000) return [];

    const fmt = (n: number, decimals = 1) => n.toFixed(decimals);

    if (unitSystem === 'metric') {
      const nm = torqueRaw;
      const rpm = rpmRaw;
      const kw = (nm * rpm) / 9549;
      const hp = kw * 1.341;
      const cat = getPowerCategory(hp);

      const results = [
        { id: 'horsepower', label: 'Horsepower', value: `${fmt(hp)} HP`, highlight: true, color: 'positive' as const },
        { id: 'powerKW', label: 'Power (kW)', value: `${fmt(kw, 2)} kW`, color: 'neutral' as const },
        { id: 'torqueValue', label: 'Torque', value: `${fmt(nm)} Nm`, color: 'neutral' as const },
        { id: 'rpmValue', label: 'at RPM', value: `${fmt(rpm, 0)} RPM`, color: 'neutral' as const },
        {
          id: 'formulaBreakdown',
          label: 'Formula',
          value: `(${fmt(nm)} × ${fmt(rpm, 0)}) / 9549 = ${fmt(kw, 2)} kW = ${fmt(hp)} HP`,
          color: 'neutral' as const,
        },
        { id: 'powerCategory', label: 'Power Category', value: cat, color: 'positive' as const },
      ];

      if (showExplanation === 'yes') {
        results.push({
          id: 'magicConstant5252',
          label: 'About the Constants',
          value: 'Metric uses 9549 (instead of 5252) because: HP (metric) = (Nm × RPM) / 9549. The constant 9549 = 60 / (2π) × 1000, converting rotational speed and torque units to power in kW.',
          color: 'neutral' as const,
        });
      }

      return results;
    }

    // Imperial
    const torque = torqueRaw;
    const rpm = rpmRaw;
    const hp = (torque * rpm) / 5252;
    const kw = hp / 1.341;
    const cat = getPowerCategory(hp);

    const results = [
      { id: 'horsepower', label: 'Horsepower', value: `${fmt(hp)} HP`, highlight: true, color: 'positive' as const },
      { id: 'powerKW', label: 'Power (kW)', value: `${fmt(kw, 2)} kW`, color: 'neutral' as const },
      { id: 'torqueValue', label: 'Torque', value: `${fmt(torque)} lb-ft`, color: 'neutral' as const },
      { id: 'rpmValue', label: 'at RPM', value: `${fmt(rpm, 0)} RPM`, color: 'neutral' as const },
      {
        id: 'formulaBreakdown',
        label: 'Formula',
        value: `(${fmt(torque)} × ${fmt(rpm, 0)}) / 5252 = ${fmt(hp)} HP`,
        color: 'neutral' as const,
      },
      { id: 'powerCategory', label: 'Power Category', value: cat, color: 'positive' as const },
    ];

    if (showExplanation === 'yes') {
      results.push({
        id: 'magicConstant5252',
        label: 'About 5252',
        value: 'The constant 5252 comes from the definition of horsepower: 1 HP = 550 ft·lb/s. When converting RPM to radians per second and torque to work, the math simplifies to HP = (Torque × RPM) / 5252. At exactly 5252 RPM, torque and horsepower are always equal — this is why the torque and HP curves cross at 5252 RPM on every dyno graph.',
        color: 'neutral' as const,
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(EngineHPPanel, { values, results });
  },
  educational: {
    formula: 'HP = (Torque × RPM) / 5252 | kW = (Nm × RPM) / 9549',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="25" y="15" width="270" height="170" fill="rgba(59,130,246,0.05)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="160" y="37" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">Torque &amp; Horsepower Curves</text><line x1="50" y1="50" x2="50" y2="165" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><line x1="50" y1="165" x2="280" y2="165" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="45" y="110" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="9" transform="rotate(-90,45,110)">Torque / HP</text><text x="280" y="182" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="9">RPM</text><path d="M 60 155 Q 100 140 140 110 Q 170 90 200 90 Q 230 95 260 105" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><text x="230" y="85" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="10">Torque</text><path d="M 60 155 Q 100 140 140 120 Q 170 100 200 80 Q 230 60 260 45" fill="none" stroke="var(--svg-ef4444)" stroke-width="2.5"/><text x="260" y="40" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10">HP</text><line x1="125" y1="165" x2="125" y2="170" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="125" y="182" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="8">5252</text></svg>',
      alt: 'Graph showing torque and horsepower curves intersecting at 5252 RPM',
      caption: 'Torque and HP curves cross at 5252 RPM — HP = (Torque x RPM) / 5252',
    },
    formulaDescription:
      'Horsepower is mathematically derived from torque and engine speed. The formula comes from James Watt\'s definition of horsepower: 1 HP = 550 foot-pounds per second. The constant 5252 is the conversion factor that makes the units work.',
    variables: [
      { symbol: 'HP', name: 'Horsepower', description: 'Standard imperial unit of engine power output.' },
      { symbol: 'Torque', name: 'Torque (lb-ft)', description: 'Rotational force produced by the engine.' },
      { symbol: 'RPM', name: 'Revolutions Per Minute', description: 'Engine crankshaft rotational speed.' },
      { symbol: 'kW', name: 'Kilowatts', description: 'Metric/SI unit of power. 1 HP = 0.7457 kW.' },
    ],
    howToUse: [
      'Enter engine torque in lb-ft (or Nm for metric mode).',
      'Enter engine speed in RPM.',
      'Select Imperial for HP/lb-ft or Metric for kW/Nm.',
      'Toggle the technical explanation for details about the 5252 constant.',
      'View breakdown showing step-by-step formula application.',
    ],
    explanation:
      'The relationship between torque and horsepower is fundamental to understanding engine performance. Torque is the rotational force the engine produces; horsepower is the rate at which work is done. An engine that makes 300 lb-ft of torque at 5,252 RPM produces exactly 300 HP. Below 5,252 RPM, torque exceeds horsepower; above 5,252 RPM, horsepower exceeds torque. This is why peak torque typically occurs at lower RPMs than peak horsepower. The shape of the torque curve determines the engine\'s character: broad, flat torque curves deliver responsive daily driving, while peaky high-RPM torque curves favor racing applications. Practical example: a modern V8 engine produces 400 lb-ft of torque at 4,000 RPM. Horsepower = (400 × 4,000) / 5,252 = 304.6 HP. The same engine produces 350 lb-ft at 6,000 RPM: HP = (350 × 6,000) / 5,252 = 399.8 HP. Although torque dropped by 12.5%, horsepower increased by 31% because RPM rose. This demonstrates why high-revving engines can produce more peak horsepower than torque suggests. In metric terms, the same engine produces 400 lb-ft = 542 Nm, giving power at 4,000 RPM = (542 × 4,000) / 9,549 = 227 kW, and at 6,000 RPM = (542 × 6,000) / 9,549 = 340.5 kW. Edge cases: for electric motors, the torque curve is fundamentally different — electric motors produce maximum torque from 0 RPM, making them feel much quicker off the line than their HP rating suggests. A Tesla Model 3 Performance making 480 HP feels faster than a 480 HP gas car because peak torque is available instantly. For turbocharged engines, the torque curve can be artificially shaped by boost control — modern turbo engines often have a flat torque plateau (e.g., 300 lb-ft from 2,500-5,000 RPM), creating a very broad powerband. For diesel engines, torque peaks at very low RPM (1,800-2,500 RPM), which is why diesel trucks can tow heavy loads without high RPM. The 5252 constant itself comes from James Watt\'s original definition: 1 HP = 33,000 ft-lb/min, and 33,000 / (2π) = 5,252.',
    faqs: [
      {
        question: 'Why do HP and torque always intersect at 5252 RPM?',
        answer: 'By definition, HP = (Torque × RPM) / 5252. When RPM = 5252, the formula becomes HP = (Torque × 5252) / 5252 = Torque. This means at 5252 RPM, the numeric values of horsepower and torque are always equal. This is a mathematical inevitability, not coincidental — it comes from James Watt\'s original definition of 1 HP = 33,000 ft·lb/min.',
      },
      {
        question: 'What is more important: torque or horsepower?',
        answer: 'It depends on the application. Torque determines how quickly a vehicle accelerates from a stop and how well it can tow or climb. Horsepower determines top speed and high-speed acceleration. For daily driving, a broad torque curve makes the vehicle feel responsive. For racing, peak horsepower is often the headline number. In general: torque gets you moving, horsepower keeps you going.',
      },
      {
        question: 'What is the difference between crank HP and wheel HP?',
        answer: 'Crank horsepower (BHP) is measured at the engine flywheel — the raw power the engine produces. Wheel horsepower (WHP) is measured at the drive wheels after accounting for drivetrain losses through the transmission, differential, and axles. WHP is typically 15-25% lower than BHP depending on the drivetrain (FWD loses least, AWD loses most).',
      },
      {
        question: 'Can I convert between kW and HP?',
        answer: 'Yes. 1 HP = 0.7457 kW. To convert HP to kW, multiply by 0.7457. To convert kW to HP, divide by 0.7457 (or multiply by 1.341). This calculator shows both values regardless of the unit system you choose.',
      },
      {
        question: 'How does forced induction (turbocharging or supercharging) affect the torque curve?',
        answer: 'Forced induction dramatically changes the torque curve by compressing intake air, allowing more fuel to be burned per cycle. A turbocharger uses exhaust gas to spin a turbine that drives a compressor, while a supercharger is mechanically driven by the engine\'s crankshaft. Turbocharged engines typically have a torque "plateau" — the engine produces near-peak torque across a wide RPM range (e.g., 300 lb-ft from 2,500 to 5,000 RPM) because the turbo spools up and maintains boost pressure. This contrasts with naturally aspirated engines where torque peaks at a specific RPM and then falls off. Superchargers provide immediate boost at low RPM but are less efficient because they consume engine power to operate. The power required to drive a supercharger can be 50-100 HP at full boost, which is why supercharged engines often have higher peak HP but lower efficiency. Modern turbocharged engines often use twin-scroll turbos or variable-geometry turbos to reduce lag and broaden the powerband. For diesel engines, torque peaks at very low RPM (1,800-2,500 RPM) because diesel combustion relies on compression ignition rather than spark timing, and the fuel-air mixture burns progressively as it is injected. This is why diesel trucks produce enormous torque for towing — a modern diesel pickup might produce 900+ lb-ft at just 1,800 RPM.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Horsepower', url: 'https://en.wikipedia.org/wiki/Horsepower' },

    ],
  },
};

export default engineHPConfig;
