import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import OHMPanel from './OHMPanel';

const ohmsLawConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'solveFor',
      label: 'Solve For',
      type: 'select',
      required: true,
      helpText: 'Choose the value you want to calculate — enter the other two',
      options: [
        { label: 'Voltage (V) — given R and I', value: 'voltage' },
        { label: 'Current (I) — given V and R', value: 'current' },
        { label: 'Resistance (R) — given V and I', value: 'resistance' },
        { label: 'Power (P) — given V and I', value: 'power' },
      ],
    },
    {
      id: 'voltage',
      label: 'Voltage (V)',
      type: 'number',
      placeholder: '120',
      unit: 'V',
      inputMode: 'decimal',
      min: 0,
      step: 0.001,
      helpText: 'Electrical potential difference in Volts',
    },
    {
      id: 'current',
      label: 'Current (I)',
      type: 'number',
      placeholder: '2',
      unit: 'A',
      inputMode: 'decimal',
      min: 0,
      step: 0.001,
      helpText: 'Electric current in Amperes',
    },
    {
      id: 'resistance',
      label: 'Resistance (R)',
      type: 'number',
      placeholder: '60',
      unit: 'Ω',
      inputMode: 'decimal',
      min: 0,
      step: 0.001,
      helpText: 'Electrical resistance in Ohms',
    },
  ],
  calculate: (values) => {
    const solveFor = values.solveFor || 'voltage';
    const V = parseFloat(values.voltage);
    const I = parseFloat(values.current);
    const R = parseFloat(values.resistance);

    const fmt = (n: number, unit: string) => `${parseFloat(n.toFixed(6))} ${unit}`;

    if (solveFor === 'voltage') {
      if (isNaN(R) || isNaN(I) || R < 0 || I < 0) return [];
      const voltage = I * R;
      const power = voltage * I;
      return [
        { id: 'voltage', label: 'Voltage', value: fmt(voltage, 'V'), highlight: true, color: 'positive' },
        { id: 'power', label: 'Power', value: fmt(power, 'W'), color: 'neutral' },
        { id: 'formula', label: 'Formula Used', value: 'V = I × R', color: 'neutral' },
      ];
    }

    if (solveFor === 'current') {
      if (isNaN(V) || isNaN(R) || R === 0) return [];
      const current = V / R;
      const power = V * current;
      return [
        { id: 'current', label: 'Current', value: fmt(current, 'A'), highlight: true, color: 'positive' },
        { id: 'power', label: 'Power', value: fmt(power, 'W'), color: 'neutral' },
        { id: 'formula', label: 'Formula Used', value: 'I = V ÷ R', color: 'neutral' },
      ];
    }

    if (solveFor === 'resistance') {
      if (isNaN(V) || isNaN(I) || I === 0) return [];
      const resistance = V / I;
      const power = V * I;
      return [
        { id: 'resistance', label: 'Resistance', value: fmt(resistance, 'Ω'), highlight: true, color: 'positive' },
        { id: 'power', label: 'Power', value: fmt(power, 'W'), color: 'neutral' },
        { id: 'formula', label: 'Formula Used', value: 'R = V ÷ I', color: 'neutral' },
      ];
    }

    if (solveFor === 'power') {
      if (isNaN(V) || isNaN(I)) return [];
      const power = V * I;
      const resistance = I > 0 ? V / I : 0;
      return [
        { id: 'power', label: 'Power', value: fmt(power, 'W'), highlight: true, color: 'positive' },
        { id: 'resistance', label: 'Resistance', value: I > 0 ? fmt(resistance, 'Ω') : 'N/A', color: 'neutral' },
        { id: 'formula', label: 'Formula Used', value: 'P = V × I', color: 'neutral' },
      ];
    }

    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(OHMPanel, { values, results });
  },
  educational: {
    formula: "V = I × R | I = V ÷ R | R = V ÷ I | P = V × I",
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><polygon points="220,60 380,260 60,260" fill="var(--svg-f8fafc)" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="220" y1="60" x2="220" y2="260" stroke="var(--svg-3b82f6)" stroke-width="1"/><line x1="60" y1="260" x2="380" y2="260" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="220" y="110" text-anchor="middle" font-size="22" fill="var(--svg-ef4444)" font-weight="bold">V</text><text x="120" y="200" text-anchor="middle" font-size="18" fill="var(--svg-3b82f6)" font-weight="bold">I</text><text x="320" y="200" text-anchor="middle" font-size="18" fill="var(--svg-22c55e)" font-weight="bold">R</text><text x="220" y="310" text-anchor="middle" font-size="14" fill="var(--svg-333333)">V = I x R</text></svg>',
      alt: 'Ohm\'s law triangle showing V at the top, I and R at the bottom',
      caption: 'Ohm\'s Law triangle — Voltage = Current x Resistance',
    },
    formulaDescription: "Ohm's Law defines the fundamental relationship between voltage (V), current (I), and resistance (R) in an electrical circuit. The power formula P = VI tells you how much energy a component dissipates.",
    variables: [
      { symbol: 'V', name: 'Voltage', description: 'Electrical potential difference measured in Volts (V). Drives current through the circuit. Think of it as electrical "pressure".' },
      { symbol: 'I', name: 'Current', description: 'Flow of electric charge measured in Amperes (A). The rate at which electrons flow past a point.' },
      { symbol: 'R', name: 'Resistance', description: 'Opposition to current flow measured in Ohms (Ω). Higher resistance = less current for the same voltage.' },
      { symbol: 'P', name: 'Power', description: 'Rate of energy transfer measured in Watts (W) = V × I. Determines heat generation and component sizing.' },
    ],
    howToUse: [
      'Select what you want to solve for: voltage, current, resistance, or power.',
      'Enter the two known values.',
      'View the calculated value plus power dissipation.',
      'Use the power result to check if a component is within its rated power tolerance.',
    ],
    explanation:
      "Ohm's Law (V = IR) is the foundational relationship in electronics and electrical engineering. It describes how voltage, current, and resistance interact in a linear resistive circuit. Understanding this relationship is essential for circuit design, troubleshooting, and safety. Power (P = VI) tells you how much energy a component consumes or dissipates as heat — critical for selecting appropriate wire gauges, fuses, and components. Real-world example: a 120V circuit powering a 60W light bulb draws I = P ÷ V = 60 ÷ 120 = 0.5A. The filament resistance is R = V ÷ I = 120 ÷ 0.5 = 240 Ω. If you replace the bulb with a 100W bulb, the current jumps to 0.83A and the resistance drops to 144 Ω. This is why using a higher-wattage bulb than the fixture is rated for creates a fire risk — the wire and socket may not handle the increased current. Another example: a 12V automotive circuit with a 3A fuse can safely power devices up to 36W (12V × 3A). Exceeding this causes the fuse to blow, which is designed to protect the wiring from overheating. In audio systems, speakers have impedance ratings (typically 4Ω or 8Ω). An amplifier rated for 100W into 8Ω delivers 200W into 4Ω, which can overheat the amplifier if it is not designed for 4Ω loads. The relationship V = IR explains why brownouts (reduced supply voltage) cause motors to draw higher current — the motor tries to maintain power output, and lower voltage forces higher current draw through the same winding resistance, potentially causing overheating.",
    faqs: [
      {
        question: "When does Ohm's Law not apply?",
        answer: "Ohm's Law applies to linear, resistive elements. It does not directly apply to non-linear components like diodes, transistors, or any component whose resistance changes with voltage or temperature. LEDs, for example, have a non-linear voltage-current relationship — they need a current-limiting resistor.",
      },
      {
        question: 'What is the difference between AC and DC Ohm\'s Law?',
        answer: "In DC circuits, V = IR is straightforward. In AC circuits, resistance becomes impedance (Z) which includes reactance from capacitors and inductors: V = IZ. Impedance is frequency-dependent, which is why AC circuit analysis is more complex. For purely resistive AC loads like heaters and incandescent bulbs, Ohm's Law applies the same way as DC.",
      },
      {
        question: 'How do I calculate power if I only know voltage and resistance?',
        answer: 'Use the combined formula: P = V² ÷ R. For example, a 10 Ω resistor across 12V dissipates P = 144 ÷ 10 = 14.4W. You would need at least a 20W-rated resistor to safely handle this without overheating. Alternatively, if you know current and resistance, use P = I² × R.',
      },
      {
        question: 'How does wire length affect resistance in a circuit?',
        answer: 'Resistance is proportional to wire length and inversely proportional to cross-sectional area (R = ρL/A). Doubling the wire length doubles the resistance, which reduces current for the same voltage. This is why long extension cords cause voltage drop — a 100-foot 14 AWG extension cord carrying 10A drops about 3 volts, potentially causing motors to run hot or lights to dim. For long runs, use a thicker gauge wire (lower AWG number) to minimize resistance.',
      },
      {
        question: 'Why is power dissipation important in circuit design?',
        answer: 'Every component has a maximum power rating. Exceeding it causes overheating and failure. A resistor rated for 1/4W that needs to dissipate 1W will burn out. Power dissipation follows P = I²R, which means doubling the current quadruples the heat. This is why high-power applications (like amplifiers, power supplies, and motor drivers) require heat sinks, larger components, or active cooling. Always check the power rating against the calculated dissipation with a safety margin of at least 20%.',
      },
      {
        question: 'What does it mean when a circuit breaker trips?',
        answer: 'A tripped circuit breaker means current exceeded the rated limit, usually from too many devices on one circuit or a short circuit. A 15A breaker on a 120V circuit can handle up to 1,800W (P = 120V × 15A). When loads exceed this, the breaker trips to prevent wire overheating. This is Ohm\'s Law in action: more devices = lower total resistance = higher current. The breaker acts as a safety device sized to protect the wire gauge, not the devices.',
      },
    ],
    quickReference: [
      { label: '120V × 10A', value: '1,200 W (typical hair dryer)' },
      { label: '12V × 3A', value: '36 W (auto fuse limit)' },
      { label: '120V ÷ 60W bulb', value: '0.5 A current draw' },
      { label: '12V ÷ 4Ω speaker', value: '3 A, 36 W' },
      { label: '120V, 15A circuit max', value: '1,800 W total' },
      { label: '240V, 30A dryer circuit', value: '7,200 W capacity' },
      { label: 'Resistor color: Red-Red-Brown', value: '220 Ω ±1%' },
      { label: 'AWG 12 wire resistance', value: '~0.0016 Ω/ft' },
    ],
    commonUses: [
      'Electrical troubleshooting — verify that components are operating within their rated voltage, current, and power specifications to diagnose failures',
      'Circuit design — calculate the correct resistor value for LED current limiting, voltage dividers, and sensor biasing networks',
      'Home electrical planning — determine whether a circuit can safely handle additional loads before installing new outlets, lights, or appliances',
      'Audio system setup — match amplifier output to speaker impedance (4Ω, 8Ω) to avoid overloading the amp or underpowering speakers',
      'Automotive electrical work — calculate fuse sizes, wire gauges, and load capacities for aftermarket accessories like lights, amplifiers, and winches',
    ],
    workedExamples: [
      {
        scenario: 'Sarah is building an LED indicator circuit for her Arduino project. She has a 5V power supply, an LED that draws 20mA (0.02A), and needs to calculate the correct current-limiting resistor.',
        inputs: { solveFor: 'resistance', voltage: '5', current: '0.02' },
        result: '250 Ω resistance, 0.1 W power dissipation',
        insight: 'Sarah needs a 250 Ω resistor. A standard 270 Ω resistor (next E12 value up) will limit the current to 0.0185A, still bright. The power dissipation is only 0.1W, so a standard 1/4W resistor is more than adequate with a 2.5x safety margin. If she used a 100 Ω resistor instead, the current would jump to 50mA — well above the LED\'s 20mA rating, causing it to burn out within seconds.',
      },
      {
        scenario: 'Mike owns a food truck and wants to add a 1500W electric griddle to his existing circuit. His truck has a 120V system with a 20A circuit breaker currently running a 1000W refrigerator, an 800W fryer, and three 60W lights. Can the circuit handle the new griddle?',
        inputs: { solveFor: 'current', voltage: '120', resistance: '4.14' },
        result: 'Total power = 3,480 W, Total current = 29 A — exceeding the 20A breaker',
        insight: 'The combined load of 3,480W at 120V draws 29A — nearly 50% above the 20A breaker rating. Even without the griddle, the existing load draws 16.5A (1,980W), which is already 82.5% of the breaker capacity. Mike needs either a dedicated 20A circuit for the griddle alone (1500W ÷ 120V = 12.5A) or a single 30A circuit with appropriate #10 AWG wiring to handle the full combined load. Running everything on the existing circuit will trip the breaker within minutes during peak usage.',
      },
      {
        scenario: 'Priya is designing a 12V solar-powered off-grid shed. She needs to run a 12V LED light strip (24W), a small 12V water pump (60W), and charge a laptop via a 12V-to-19V boost converter (45W input). She wants to know the total current draw to size her battery and solar panel.',
        inputs: { solveFor: 'power', voltage: '12', current: '10.75' },
        result: 'Total power = 129 W, Total current = 10.75 A at 12V',
        insight: 'At 10.75A continuous draw, a 100Ah deep-cycle lead-acid battery (50Ah usable at 50% depth of discharge) would last about 4.6 hours. Priya should size her system for at least 150W of solar panels (accounting for 77% real-world efficiency) to generate ~11.6A of charging current during peak sun hours, giving her approximately 5-6 hours of usable runtime per day with a full charge cycle. Upgrading to a 200Ah lithium battery would double runtime to over 18 hours.',
      },
    ],
    proTips: [
      'When sizing resistors, always check power dissipation (P = I²R or P = V²/R). A common beginner mistake is choosing the right resistance but wrong power rating — using a 1/4W resistor where 2W is needed leads to smoke and burnt PCB traces.',
      'The "water analogy" is useful for troubleshooting: voltage is water pressure, current is flow rate, resistance is pipe restriction. A kink in a garden hose (high resistance) reduces flow (current). A bigger pump (higher voltage) pushes more water through the same restriction. This mental model helps debug why a circuit section runs hot or a motor runs slow.',
      'For home circuits, follow the 80% rule: a 15A breaker should only carry 12A continuous load. Calculate your total wattage and divide by voltage (120V in US) to get amps. If you are above 80%, split loads across multiple circuits rather than relying on the breaker to trip — breakers can fail, and nuisance tripping means you are already overloading.',
      'Use the measured voltage, not the nominal voltage, for critical calculations. A "12V" car battery actually sits at 12.6V fully charged and drops to 11.8V under load. A "120V" wall outlet can range from 110V to 125V depending on utility load and distance from the transformer. These differences matter when sizing fuses and wire for sensitive electronics.',
    ],
    limitations: [
      'When not to use: This calculator applies Ohm\'s Law for DC and purely resistive AC circuits only. Do NOT use for circuits containing inductors (motors, transformers, solenoids), capacitors, semiconductors (diodes, transistors), or any component with non-linear voltage-current characteristics.',
      'The calculator assumes steady-state DC conditions. It does not account for inrush current (motors draw 3-7x rated current at startup), temperature-dependent resistance, or voltage sag under load.',
      'Results are for educational and planning purposes. For electrical installations subject to building codes (NEC in the US, IEC internationally), consult a licensed electrician.',
    ],
    citations: [
      { source: 'Wikipedia', title: "Ohm's Law", url: 'https://en.wikipedia.org/wiki/Ohm%27s_law' },

    ],
  },
};

export default ohmsLawConfig;
