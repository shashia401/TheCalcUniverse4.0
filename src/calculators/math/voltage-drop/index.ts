import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import VoltageDropPanel from './VoltageDropPanel';
import { AMPACITY, AWG_SIZES, OHMS_PER_KFT, SMALL_CONDUCTOR_MAX_OCPD, voltageDropVolts, type Material } from '../../engineering/wire-gauge/awgData';

interface WireEntry {
  awg: string;
  resistance: number;
  ampacity: number;
}

/**
 * Candidate wires for a material, smallest first. Resistance (NEC Chapter 9 Table 8, stranded, 75 °C) and ampacity
 * (NEC 310.16, 75 °C column, capped by the NEC 240.4(D) small-conductor limits) come from the shared AWG data used by
 * the engineering voltage-drop and wire-gauge calculators, so all three agree.
 */
function wireTable(material: Material): WireEntry[] {
  const amp = AMPACITY[material === 'aluminum' ? 'aluminum75' : 'copper75'];
  const small = SMALL_CONDUCTOR_MAX_OCPD[material];
  return AWG_SIZES.filter((a) => OHMS_PER_KFT[material][a] !== undefined && amp[a] !== undefined).map((a) => ({
    awg: `${a} AWG`,
    resistance: OHMS_PER_KFT[material][a]!,
    ampacity: Math.min(amp[a]!, small[a] ?? Infinity),
  }));
}

const voltageDropConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'voltage',
      label: 'System Voltage (V)',
      type: 'number',
      min: 0,
      step: 1,
      placeholder: 'e.g., 120',
      helpText:
        '120V for standard, 240V for large appliances, 277V for commercial lighting, 480V for industrial',
    },
    {
      id: 'phase',
      label: 'Phase',
      type: 'select',
      options: [
        { label: 'Single-Phase', value: 'single' },
        { label: 'Three-Phase', value: 'three' },
      ],
    },
    {
      id: 'wireMaterial',
      label: 'Wire Material',
      type: 'select',
      options: [
        { label: 'Copper', value: 'cu' },
        { label: 'Aluminum', value: 'al' },
      ],
    },
    {
      id: 'loadCurrent',
      label: 'Load Current (Amps)',
      type: 'number',
      min: 0,
      step: 0.1,
      placeholder: 'e.g., 20',
    },
    {
      id: 'oneWayLength',
      label: 'One-Way Length (ft)',
      type: 'number',
      min: 0,
      step: 1,
      placeholder: 'e.g., 100',
    },
    {
      id: 'acceptableDrop',
      label: 'Acceptable Drop',
      type: 'select',
      options: [
        { label: '3% (recommended for branch circuits)', value: '3' },
        { label: '5% (recommended for feeders)', value: '5' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    {
      id: 'customDropPercent',
      label: 'Custom Drop %',
      type: 'number',
      min: 0.1,
      max: 10,
      step: 0.1,
      placeholder: 'e.g., 2',
      showWhen: (v) => v.acceptableDrop === 'custom',
    },
  ],
  calculate: (values) => {
    const voltage = parseFloat(values.voltage);
    const phase = values.phase || 'single';
    const wireMaterial = values.wireMaterial || 'cu';
    const loadCurrent = parseFloat(values.loadCurrent);
    const oneWayLength = parseFloat(values.oneWayLength);
    const acceptableDrop = values.acceptableDrop || '3';
    const customDropPercent = parseFloat(values.customDropPercent);

    if (isNaN(voltage) || voltage <= 0) return [];
    if (isNaN(loadCurrent) || loadCurrent <= 0) return [];
    if (isNaN(oneWayLength) || oneWayLength <= 0) return [];

    const maxDropPct =
      acceptableDrop === 'custom'
        ? customDropPercent
        : parseFloat(acceptableDrop);
    if (isNaN(maxDropPct) || maxDropPct <= 0) return [];

    const wireData = wireTable(wireMaterial === 'al' ? 'aluminum' : 'copper');
    const ph: 'single' | 'three' = phase === 'three' ? 'three' : 'single';

    // Find smallest wire that passes both VD and ampacity requirements
    let bestIdx = -1;
    for (let i = 0; i < wireData.length; i++) {
      const w = wireData[i];
      if (w.ampacity < loadCurrent) continue;
      const vdVolts = voltageDropVolts(loadCurrent, oneWayLength, w.resistance, ph);
      const vdPct = Math.round(((vdVolts / voltage) * 100) * 100) / 100; // compare the displayed percentage
      if (vdPct <= maxDropPct) {
        bestIdx = i;
        break;
      }
    }

    // Fallback to largest when none satisfies both criteria
    if (bestIdx === -1) bestIdx = wireData.length - 1;

    const best = wireData[bestIdx];
    const r = best.resistance;
    const actualVD = voltageDropVolts(loadCurrent, oneWayLength, r, ph);
    const actualVDPct = Math.round(((actualVD / voltage) * 100) * 100) / 100;
    const passes = actualVDPct <= maxDropPct && best.ampacity >= loadCurrent;

    const fmtVD = (n: number) => `${n.toFixed(2)} V`;
    const fmtPct = (n: number) => `${n.toFixed(2)}%`;
    const fmtR = (n: number) => `${n.toFixed(3)} Ω/1000ft`;

    let statusStr: string;
    if (!passes) {
      if (best.ampacity < loadCurrent) {
        statusStr =
          'Warning: Load exceeds ampacity of largest available conductor';
      } else {
        statusStr = `Does not meet ${maxDropPct}% recommendation — consider larger conductor or parallel runs`;
      }
    } else {
      statusStr = `✔ Passes ${maxDropPct}% recommendation (NEC informational guideline)`;
    }

    return [
      {
        id: 'recommendedWire',
        label: 'Recommended Wire Size',
        value: best.awg,
        highlight: true,
        color: passes ? 'positive' : 'negative',
      },
      {
        id: 'voltageDrop',
        label: 'Voltage Drop',
        value: fmtVD(actualVD),
      },
      {
        id: 'voltageDropPercent',
        label: 'Voltage Drop',
        value: fmtPct(actualVDPct),
      },
      {
        id: 'status',
        label: 'Status',
        value: statusStr,
        color: passes ? 'positive' : 'negative',
      },
      {
        id: 'wireResistance',
        label: 'Wire Resistance',
        value: fmtR(r),
      },
      {
        id: 'conductorSize',
        label: 'Neutral Conductor',
        value: `${best.awg} (same as phase conductor)`,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(VoltageDropPanel, { values, results });
  },
  educational: {
    formula:
      'VD = 2 × L × I × R ÷ 1000 (single phase) | VD = √3 × L × I × R ÷ 1000 (three phase)',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="25" y="82" width="36" height="36" fill="var(--svg-3b82f6)" rx="4"/><text x="43" y="103" text-anchor="middle" fill="var(--svg-ffffff)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">V</text><rect x="255" y="82" width="40" height="36" fill="var(--svg-ef4444)" rx="4"/><text x="275" y="103" text-anchor="middle" fill="var(--svg-ffffff)" font-family="Arial,sans-serif" font-size="9">Load</text><line x1="61" y1="100" x2="255" y2="100" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><line x1="25" y1="100" x2="10" y2="100" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><line x1="10" y1="100" x2="10" y2="165" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><line x1="10" y1="165" x2="310" y2="165" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><line x1="310" y1="165" x2="310" y2="100" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><line x1="310" y1="100" x2="295" y2="100" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><text x="158" y="92" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="11" font-weight="bold">VD = I x R (forward)</text><text x="158" y="185" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="11" font-weight="bold">VD = I x R (return)</text><text x="43" y="68" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="9">Source V</text></svg>',
      alt: 'Circuit diagram showing source voltage, wires with resistance labeled as voltage drop, and load',
      caption: 'Voltage drop occurs in both forward and return conductors',
    },
    formulaDescription:
      'Voltage drop calculated using the NEC standard formula. Resistance values from NEC Chapter 9, Table 8 for 75°C copper conductors. Ampacity per NEC Table 310.15(B)(16).',
    variables: [
      {
        symbol: 'L',
        name: 'One-Way Length',
        description: 'Distance from source to load in feet.',
      },
      {
        symbol: 'I',
        name: 'Load Current',
        description: 'Current flowing through the conductor in amperes.',
      },
      {
        symbol: 'R',
        name: 'Resistance',
        description:
          'Conductor resistance per 1000 ft from NEC Chapter 9 Table 8.',
      },
    ],
    howToUse: [
      'Enter the system voltage (120V, 240V, 277V, or 480V).',
      'Select single-phase or three-phase.',
      'Choose copper or aluminum wire.',
      'Enter the load current in amperes.',
      'Enter the one-way length in feet.',
      'Select the acceptable voltage drop percentage.',
      'Review the recommended wire size and voltage drop results.',
    ],
    explanation:
      'Voltage drop is the reduction in voltage along a conductor caused by its resistance. Excessive drop leads to equipment malfunction, dim lights, and energy waste. The NEC recommends a maximum of 3% for branch circuits and 5% for feeders. This calculator uses copper resistance values at 75°C (NEC Chapter 9, Table 8) and applies a 1.6 multiplier for aluminum. For three-phase, the √3 factor accounts for the phase-to-phase relationship. Practical example: a 120V branch circuit running 100 feet with a 20A load using 12 AWG copper wire. Single-phase voltage drop = (2 × 100 × 20 × 1.93) / 1000 = 7.72V. Percentage drop = 7.72/120 × 100 = 6.4%, which exceeds the 3% NEC recommendation. You would need to upgrade to 10 AWG wire: (2 × 100 × 20 × 1.21) / 1000 = 4.84V, or 4.0% — still too high. With 8 AWG: (2 × 100 × 20 × 0.764) / 1000 = 3.06V, or 2.55%, which passes the 3% threshold. Edge cases: for long rural runs over 500 feet, voltage drop can be severe — a 240V pump at 400 feet with 10 AWG might only receive 215V at the load, causing motor overheating and premature failure. In these cases, consider higher voltage distribution with a step-down transformer at the load. For aluminum wire, multiply all resistance values by 1.6 — a 120V, 20A, 100 ft run with 10 AWG aluminum gives (2 × 100 × 20 × 1.21 × 1.6)/1000 = 7.74V, or 6.5%, which fails the 3% recommendation handily. For DC solar panel wiring, the same formulas apply but there is no power factor consideration, and voltage drop is especially critical because maximum power point tracking (MPPT) charge controllers require a minimum voltage to operate.',
    faqs: [
      {
        question: 'What are the NEC recommended maximum voltage drops?',
        answer: 'The NEC recommends 3% maximum for branch circuits and 5% maximum for feeders (combined total from service to load should not exceed 5%). These are recommendations for good practice, though some jurisdictions adopt them as code requirements.',
      },
      {
        question: 'Why use copper instead of aluminum?',
        answer: 'Copper has approximately 61% lower resistance than aluminum for the same wire size, resulting in lower voltage drop. However, aluminum is lighter and less expensive, making it popular for large feeders and service entrance conductors.',
      },
      {
        question: 'How does three-phase differ from single-phase?',
        answer: 'In a three-phase system, the formula uses √3 (approximately 1.732) instead of 2 because current flows through three phase conductors with a 120-degree offset, reducing the effective voltage drop compared to single-phase.',
      },
      {
        question: 'What wire temperature rating is used?',
        answer: 'This calculator uses resistance values for 75°C rated conductors, which is the standard rating for most power distribution applications per NEC Table 310.15(B)(16).',
      },
      {
        question: 'Can I use parallel conductors to reduce voltage drop on long runs?',
        answer: 'Yes, running parallel conductors effectively halves the resistance and thus the voltage drop for a given load. For example, instead of running one 500 kcmil copper conductor for a 400A feeder, you can run two 250 kcmil conductors in parallel, which is often easier to install and terminate. Each parallel conductor carries half the current, reducing the effective resistance. When using parallel conductors, all conductors must be the same length, material, insulation type, and size to ensure equal current sharing. They must also be terminated in the same lugs or bus bars. For three-phase systems, parallel sets must include all phase conductors plus the neutral if required. A common application is long-distance solar farm interconnections where parallel 500 kcmil aluminum conductors are run in separate conduits to minimize voltage drop over 1,000+ foot runs while keeping wire pulling manageable. For residential applications, parallel conductors are rarely necessary — upgrading one wire size is usually sufficient and simpler to install.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Voltage Drop', url: 'https://en.wikipedia.org/wiki/Voltage_drop' },

    ],
  },
};

export default voltageDropConfig;
