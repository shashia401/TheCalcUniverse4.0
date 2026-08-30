import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import OhmsLawPanel from './OhmsLawPanel';

// ─── Types ───────────────────────────────────────────────────────────────────

type VarName = 'V' | 'I' | 'R' | 'P';
type KnownPair = [VarName, VarName];

const ALL_VARS: VarName[] = ['V', 'I', 'R', 'P'];

// ─── Metric Prefix Helpers ───────────────────────────────────────────────────

interface Scaled {
  value: number;
  prefix: string;
  unit: string;
}

function autoScale(v: number, baseUnit: string): Scaled {
  const abs = Math.abs(v);
  if (abs === 0) return { value: 0, prefix: '', unit: baseUnit };
  if (abs < 0.001) return { value: v * 1_000_000, prefix: 'µ', unit: baseUnit };
  if (abs < 1) return { value: v * 1_000, prefix: 'm', unit: baseUnit };
  if (abs < 1_000) return { value: v, prefix: '', unit: baseUnit };
  if (abs < 1_000_000) return { value: v / 1_000, prefix: 'k', unit: baseUnit };
  return { value: v / 1_000_000, prefix: 'M', unit: baseUnit };
}

function fmtScaled(v: number, baseUnit: string, mode: string): string {
  if (mode === 'raw') {
    return `${parseFloat(v.toFixed(6))} ${baseUnit}`;
  }
  const s = autoScale(v, baseUnit);
  const n = parseFloat(s.value.toFixed(4));
  return `${n} ${s.prefix}${s.unit}`;
}

// ─── Solve Logic ─────────────────────────────────────────────────────────────

interface Solved {
  V: number;
  I: number;
  R: number;
  P: number;
}

function solve(a: VarName, va: number, b: VarName, vb: number): Solved | null {
  // Defense-in-depth: guard against NaN / non-positive values even if caller validates.
  if (isNaN(va) || isNaN(vb) || va <= 0 || vb <= 0) return null;
  // V = I * R
  // P = V * I = I^2 * R = V^2 / R
  if (a === 'V' && b === 'I') return { V: va, I: vb, R: va / vb, P: va * vb };
  if (a === 'V' && b === 'R') return { V: va, I: va / vb, R: vb, P: (va * va) / vb };
  if (a === 'V' && b === 'P') return { V: va, I: vb / va, R: (va * va) / vb, P: vb };
  if (a === 'I' && b === 'V') return { V: vb, I: va, R: vb / va, P: vb * va };
  if (a === 'I' && b === 'R') return { V: va * vb, I: va, R: vb, P: va * va * vb };
  if (a === 'I' && b === 'P') return { V: vb / va, I: va, R: vb / (va * va), P: vb };
  if (a === 'R' && b === 'V') return { V: vb, I: vb / va, R: va, P: (vb * vb) / va };
  if (a === 'R' && b === 'I') return { V: va * vb, I: vb, R: va, P: va * vb * vb };
  if (a === 'R' && b === 'P') {
    const V = Math.sqrt(vb * va);
    const I = Math.sqrt(vb / va);
    return { V, I, R: va, P: vb };
  }
  if (a === 'P' && b === 'V') return { V: vb, I: va / vb, R: (vb * vb) / va, P: va };
  if (a === 'P' && b === 'I') return { V: va / vb, I: vb, R: va / (vb * vb), P: va };
  if (a === 'P' && b === 'R') {
    const V = Math.sqrt(va * vb);
    const I = Math.sqrt(va / vb);
    return { V, I, R: vb, P: va };
  }
  return null;
}

function formulaString(a: VarName, b: VarName): string[] {
  // Return the formulas used based on known pair (ordered)
  if ((a === 'V' && b === 'I') || (a === 'I' && b === 'V')) return ['R = V / I', 'P = V × I'];
  if ((a === 'V' && b === 'R') || (a === 'R' && b === 'V')) return ['I = V / R', 'P = V² / R'];
  if ((a === 'V' && b === 'P') || (a === 'P' && b === 'V')) return ['I = P / V', 'R = V² / P'];
  if ((a === 'I' && b === 'R') || (a === 'R' && b === 'I')) return ['V = I × R', 'P = I² × R'];
  if ((a === 'I' && b === 'P') || (a === 'P' && b === 'I')) return ['V = P / I', 'R = P / I²'];
  if ((a === 'R' && b === 'P') || (a === 'P' && b === 'R')) return ['V = √(P × R)', 'I = √(P / R)'];
  return [];
}

// ─── Known Variable Names for Pie Data ───────────────────────────────────────

function pieKnownVars(a: VarName, b: VarName): string {
  return JSON.stringify([a, b]);
}

function computedVars(a: VarName, b: VarName): VarName[] {
  return ALL_VARS.filter((v) => v !== a && v !== b);
}

// ─── Config ──────────────────────────────────────────────────────────────────

const SELECT_OPTIONS = [
  { label: 'Voltage (V)', value: 'V' },
  { label: 'Current (I)', value: 'I' },
  { label: 'Resistance (R)', value: 'R' },
  { label: 'Power (P)', value: 'P' },
];

const PREFIX_OPTIONS = [
  { label: 'Auto (m, k, M)', value: 'auto' },
  { label: 'Raw (V, A, Ω, W)', value: 'raw' },
];

const ohmsLawConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'value1',
      label: 'Known Value 1',
      type: 'select',
      options: SELECT_OPTIONS,
      defaultValue: 'V',
      helpText: 'Select the first known electrical parameter',
    },
    {
      id: 'num1',
      label: 'Value 1',
      type: 'number',
      min: 0,
      step: 0.001,
      placeholder: 'e.g., 12',
      helpText: 'Enter the numeric value of the first parameter',
    },
    {
      id: 'value2',
      label: 'Known Value 2',
      type: 'select',
      options: SELECT_OPTIONS,
      defaultValue: 'I',
      helpText: 'Select the second known electrical parameter',
    },
    {
      id: 'num2',
      label: 'Value 2',
      type: 'number',
      min: 0,
      step: 0.001,
      placeholder: 'e.g., 2',
      helpText: 'Enter the numeric value of the second parameter',
    },
    {
      id: 'powerOfTen',
      label: 'Show Prefixes',
      type: 'select',
      options: PREFIX_OPTIONS,
      defaultValue: 'auto',
      helpText: 'Choose auto-scaling prefixes or raw display',
    },
  ],
  calculate: (values): CalculatorResult[] => {
    const v1 = values.value1 as VarName;
    const v2 = values.value2 as VarName;
    const n1 = parseFloat(values.num1);
    const n2 = parseFloat(values.num2);
    const prefixMode = values.powerOfTen || 'auto';

    // Validate: both numbers must be provided and > 0
    if (isNaN(n1) || isNaN(n2) || n1 <= 0 || n2 <= 0) return [];
    // Validate: must be different variables
    if (v1 === v2) return [];
    // Validate: must be valid variable names
    if (!ALL_VARS.includes(v1) || !ALL_VARS.includes(v2)) return [];

    const solved = solve(v1, n1, v2, n2);
    if (!solved) return [];

    const computed = computedVars(v1, v2);
    const formulas = formulaString(v1, v2);

    const results: CalculatorResult[] = [];

    // Always show all 4 values with proper highlighting
    results.push({
      id: 'voltage',
      label: 'Voltage (V)',
      value: fmtScaled(solved.V, 'V', prefixMode),
      highlight: computed.includes('V'),
    });
    results.push({
      id: 'current',
      label: 'Current (I)',
      value: fmtScaled(solved.I, 'A', prefixMode),
      highlight: computed.includes('I'),
    });
    results.push({
      id: 'resistance',
      label: 'Resistance (R)',
      value: fmtScaled(solved.R, 'Ω', prefixMode),
      highlight: computed.includes('R'),
    });
    results.push({
      id: 'power',
      label: 'Power (P)',
      value: fmtScaled(solved.P, 'W', prefixMode),
      highlight: computed.includes('P'),
    });
    results.push({
      id: 'usedFormulas',
      label: 'Formulas Used',
      value: formulas.join(', '),
    });
    results.push({
      id: 'pieData',
      label: 'Pie Chart Data',
      value: pieKnownVars(v1, v2),
    });

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(OhmsLawPanel, { values, results });
  },
  educational: {
    formula: 'V = I × R  |  P = V × I  |  P = I² × R  |  P = V² / R',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><polygon points="160,25 55,175 265,175" fill="rgba(59,130,246,0.08)" stroke="var(--svg-3b82f6)" stroke-width="2.5" stroke-linejoin="round"/><line x1="160" y1="25" x2="160" y2="175" stroke="var(--svg-3b82f6)" stroke-width="1.5" stroke-dasharray="5,3"/><line x1="55" y1="175" x2="265" y2="175" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="160" y="75" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="30" font-weight="bold">V</text><text x="108" y="145" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="24" font-weight="bold">I</text><text x="212" y="145" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="24" font-weight="bold">R</text><text x="160" y="195" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="10">Cover the unknown to get the formula</text></svg>',
      alt: 'Ohms Law triangle showing V at top, I and R at bottom',
      caption: 'Ohms Law formula triangle: V = I x R',
    },
    formulaDescription:
      "Ohm's Law Wheel defines the relationships between Voltage (V), Current (I), Resistance (R), and Power (P) in an electrical circuit. Given any two values, the remaining two can be calculated.",
    variables: [
      { symbol: 'V', name: 'Voltage', description: 'Electrical potential difference measured in Volts (V). The force that pushes electrons through a conductor.' },
      { symbol: 'I', name: 'Current', description: 'Flow rate of electric charge measured in Amperes (A).' },
      { symbol: 'R', name: 'Resistance', description: 'Opposition to current flow measured in Ohms (Ω).' },
      { symbol: 'P', name: 'Power', description: 'Rate of energy transfer or consumption measured in Watts (W).' },
    ],
    howToUse: [
      'Select any two known electrical values from Voltage (V), Current (I), Resistance (R), or Power (P).',
      'Enter the numeric values for the two selected parameters.',
      'The calculator will compute the remaining two values using Ohm\'s Law and the Power formulas.',
      'Toggle between Auto prefixes (mV, kA, MΩ, etc.) and raw values using the Show Prefixes dropdown.',
    ],
    explanation:
      "Ohm's Law (V = IR) is the fundamental relationship in electronics. The Ohm's Law Wheel extends this with power formulas (P = VI, P = I²R, P = V²/R), giving you a complete set of equations to analyze any DC circuit. This calculator uses the wheel approach: pick any two known values, and it solves for all remaining parameters automatically. Practical example: you have a 12V power supply and a 24Ω resistor. Using V = IR, the current is I = 12 / 24 = 0.5 A (500 mA). The power dissipated is P = VI = 12 × 0.5 = 6 W, or alternatively P = I²R = 0.5² × 24 = 6 W. You would need a resistor rated for at least 6 W (standard ratings are 1/4 W, 1/2 W, 1 W, 5 W, 10 W, etc., so choose a 10 W resistor for safety margin). Edge cases: for light bulbs, resistance changes dramatically with temperature — a 100 W incandescent bulb has about 144 Ω when hot (R = V²/P = 120²/100) but only about 10-15 Ω when cold, which is why bulbs often blow when turned on (the cold inrush current is 10× higher). For LEDs, Ohm's Law does not apply linearly because LEDs have a forward voltage drop that must be subtracted: the current-limiting resistor formula is R = (Vsupply - Vforward) / I. For AC circuits containing capacitors or inductors, impedance (Z) replaces resistance (R), and the phase angle between voltage and current must be considered.",
    faqs: [
      {
        question: "What is Ohm's Law?",
        answer: "Ohm's Law states that the current through a conductor between two points is directly proportional to the voltage across the two points and inversely proportional to the resistance. It is expressed as V = IR.",
      },
      {
        question: 'What is the Ohm\'s Law Wheel?',
        answer: 'The Ohm\'s Law Wheel combines Ohm\'s Law (V = IR) with power formulas (P = VI, P = I²R, P = V²/R) in a single reference. Given any two of the four quantities (V, I, R, P), you can calculate the other two.',
      },
      {
        question: 'Can I use this for AC circuits?',
        answer: 'This calculator is designed for DC circuits. For AC circuits, resistance (R) becomes impedance (Z), and power factor must be considered. However, for purely resistive AC loads, the DC formulas apply.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: "Ohm's Law", url: 'https://en.wikipedia.org/wiki/Ohm%27s_law' },

    ],
  },
};

export default ohmsLawConfig;
