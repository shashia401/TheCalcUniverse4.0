import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ResistorPanel from './ResistorPanel';
import Decimal from 'decimal.js';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { hasAnswer, resultValue } from '../../../utils/explainResults';

// ─── Color-band lookup tables ─────────────────────────────────────────────────

const DIGIT_COLORS: Record<string, number> = {
  Black: 0, Brown: 1, Red: 2, Orange: 3, Yellow: 4,
  Green: 5, Blue: 6, Violet: 7, Gray: 8, White: 9,
};

const COLOR_DIGITS: Record<number, string> = {
  0: 'Black', 1: 'Brown', 2: 'Red', 3: 'Orange', 4: 'Yellow',
  5: 'Green', 6: 'Blue', 7: 'Violet', 8: 'Gray', 9: 'White',
};

/** Multiplier band colour -> power of ten. */
const MULTIPLIER_COLORS: Record<string, number> = {
  Black: 0, Brown: 1, Red: 2, Orange: 3, Yellow: 4,
  Green: 5, Blue: 6, Violet: 7, Gray: 8, White: 9, Gold: -1, Silver: -2,
};

const MULTIPLIER_EXP: Record<number, string> = {
  [-2]: 'Silver', [-1]: 'Gold', 0: 'Black', 1: 'Brown', 2: 'Red',
  3: 'Orange', 4: 'Yellow', 5: 'Green', 6: 'Blue', 7: 'Violet', 8: 'Gray', 9: 'White',
};

const TOLERANCE_COLORS: Record<string, number> = {
  'Gray (±0.05%)': 0.05, 'Violet (±0.1%)': 0.1, 'Blue (±0.25%)': 0.25, 'Green (±0.5%)': 0.5,
  'Brown (±1%)': 1, 'Red (±2%)': 2, 'Gold (±5%)': 5,
  'Silver (±10%)': 10, 'None (±20%)': 20,
};

const TEMP_CO_COLORS: Record<string, number> = {
  'Black (250)': 250, 'Brown (100)': 100, 'Red (50)': 50, 'Orange (15)': 15,
  'Yellow (25)': 25, 'Green (20)': 20, 'Blue (10)': 10,
  'Violet (5)': 5, 'Gray (1)': 1,
};

// ─── E-series values (1-10 range) ──────────────────────────────────────────────

const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
const E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
             3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];

// ─── Format helpers ────────────────────────────────────────────────────────────

// Round half up on the decimal digits. toFixed rounds the binary float, so 4.465 came out as "4.46".
const fixed2 = (x: number): string => Number(`${Math.round(Number(`${x}e2`))}e-2`).toFixed(2);

function formatResistance(ohms: number): string {
  if (ohms >= 1_000_000) return `${fixed2(ohms / 1_000_000)} MΩ`;
  if (ohms >= 1_000) return `${fixed2(ohms / 1_000)} kΩ`;
  if (ohms >= 1) return `${fixed2(ohms)} Ω`;
  return `${fixed2(ohms * 1000)} mΩ`;
}

function formatOhms(ohms: Decimal): string {
  return `${ohms.toFixed()} Ω`;
}

// ─── Forward: colors -> resistance ────────────────────────────────────────────

function forwardCalculate(values: Record<string, string>) {
  const bands = values.bands || '4';

  // 4-band: band1, band2, multiplier, tolerance
  // 5-band: band1, band2, band3, multiplier, tolerance
  // 6-band: band1, band2, band3, multiplier, tolerance, tempCo

  const b1 = values.band1;
  const b2 = values.band2;
  const b3 = values.band3;
  const mult = values.multiplier;
  const tol = values.tolerance;

  if (!b1 || !b2 || !mult || !tol) return [];

  const d1 = DIGIT_COLORS[b1];
  const d2 = DIGIT_COLORS[b2];
  const m = MULTIPLIER_COLORS[mult];
  const tPct = TOLERANCE_COLORS[tol];

  if (d1 === undefined || d2 === undefined || m === undefined || tPct === undefined) return [];

  let sigFigs: number;
  let bandColors: string[];

  if (bands === '4') {
    sigFigs = d1 * 10 + d2;
    bandColors = [b1, b2, mult, tol.replace(/\s\(.*\)/, '')];
  } else {
    // 5-band or 6-band
    if (!b3) return [];
    const d3 = DIGIT_COLORS[b3];
    if (d3 === undefined) return [];
    sigFigs = d1 * 100 + d2 * 10 + d3;
    bandColors = [b1, b2, b3, mult, tol.replace(/\s\(.*\)/, '')];
    if (bands === '6') {
      const tc = values.tempCo;
      if (!tc) return [];
      const tcVal = TEMP_CO_COLORS[tc];
      if (tcVal === undefined) return [];
      const tcColor = tc.replace(/\s\(.*\)/, '');
      bandColors.push(tcColor);
    }
  }

  const exact = new Decimal(sigFigs).times(new Decimal(10).pow(m));
  const resistance = exact.toNumber();
  const minRes = exact.times(new Decimal(100).minus(tPct)).div(100).toNumber();
  const maxRes = exact.times(new Decimal(100).plus(tPct)).div(100).toNumber();
  const tolLabel = `±${tPct}%`;

  const results = [
    {
      id: 'resistance',
      label: 'Resistance',
      value: formatResistance(resistance),
      highlight: true,
      color: 'positive' as const,
    },
    {
      id: 'tolerance',
      label: 'Tolerance',
      value: tolLabel,
    },
    {
      id: 'minResistance',
      label: 'Min Value',
      value: formatResistance(minRes),
    },
    {
      id: 'maxResistance',
      label: 'Max Value',
      value: formatResistance(maxRes),
    },
    {
      id: '_colorSequence',
      label: 'Color Bands',
      value: JSON.stringify(bandColors),
    },
    {
      id: 'ohmicValue',
      label: 'Numeric Value',
      value: formatOhms(exact),
    },
  ];

  // Add temp coefficient for 6-band
  if (bands === '6') {
    const tc = values.tempCo;
    const tcVal = TEMP_CO_COLORS[tc || ''];
    if (tcVal !== undefined) {
      results.push({
        id: 'tempCoef',
        label: 'Temp. Coefficient',
        value: `${tcVal} ppm/K`,
      });
    }
  }

  return results;
}

// ─── Reverse: resistance -> colors ────────────────────────────────────────────

function reverseCalculate(values: Record<string, string>) {
  const ohmsStr = values.targetOhms;
  const bandCount = values.reverseBands || '4';

  if (!ohmsStr || ohmsStr.trim() === '') return [];
  const ohms = parseNumberStrict(ohmsStr);
  if (isNaN(ohms) || ohms <= 0) return [];

  const is4Band = bandCount === '4';
  const series = is4Band ? E12 : E24;
  const sigDigits = is4Band ? 2 : 3;
  // The multiplier band runs from Silver (10^-2) to White (10^9), so the smallest and largest readable values are
  // (series start) x 10^(sigDigits-1-2) and (series end) x 10^(9+sigDigits-1).
  const minExp = sigDigits - 1 - 2;
  const maxExp = 9 + sigDigits - 1;
  const lowest = Math.pow(10, minExp);
  const highest = series[series.length - 1] * Math.pow(10, maxExp);
  if (ohms < lowest * 0.95 || ohms > highest * 1.05) {
    return [
      {
        id: 'error',
        label: 'Out of range',
        value: `A ${bandCount}-band resistor covers about ${formatResistance(lowest)} to ${formatResistance(highest)}.`,
        color: 'negative' as const,
      },
    ];
  }

  // Nearest standard value by ratio (the series is geometric, so distance is measured as a ratio, not in ohms).
  let closestVal = 0;
  let closestRatio = Infinity;
  let closestBase = 0;
  let closestExp = 0;

  for (let exp = minExp; exp <= maxExp; exp++) {
    const mult = Math.pow(10, exp);
    for (const base of series) {
      const candidate = base * mult;
      const ratio = Math.abs(Math.log(ohms / candidate));
      if (ratio < closestRatio) {
        closestRatio = ratio;
        closestVal = candidate;
        closestBase = base;
        closestExp = exp;
      }
    }
  }

  // Extract digits and multiplier from the closest standard value
  const sigFigs = Math.round(closestBase * Math.pow(10, sigDigits - 1));
  const digits = String(sigFigs).split('').map(Number);
  const multExp = closestExp - (sigDigits - 1);

  const bandColors: string[] = digits.map((d) => COLOR_DIGITS[d] || '');
  bandColors.push(MULTIPLIER_EXP[multExp] || '');

  // E12 parts are normally +/-10 % (Silver), E24 parts +/-5 % (Gold); the old output had no tolerance band for 4-band.
  const tolerancePct = is4Band ? 10 : 5;
  bandColors.push(is4Band ? 'Silver' : 'Gold');

  const eSeriesLabel = is4Band ? 'E12' : 'E24';
  const offPct = (Math.abs(closestVal - ohms) / ohms) * 100;

  const results = [
    {
      id: 'resistorValue',
      label: 'Target Value',
      value: formatResistance(ohms),
      highlight: true,
      color: 'positive' as const,
    },
    {
      id: '_colorBands',
      label: 'Color Bands',
      value: JSON.stringify(bandColors),
    },
    {
      id: 'bandCount',
      label: 'Band Configuration',
      value: `${bandCount}-Band`,
    },
    {
      id: 'closestStandard',
      label: 'E-series Match',
      value: `${eSeriesLabel} series: ${sigFigs} (${formatResistance(closestVal)})`,
    },
    {
      id: 'tolerance',
      label: 'Tolerance',
      value: `±${tolerancePct}%`,
    },
  ];
  if (offPct > 0.05) {
    results.push({
      id: 'standardOffset',
      label: 'Difference from Target',
      value: `${formatResistance(closestVal)} is ${offPct.toFixed(1)}% ${closestVal > ohms ? 'above' : 'below'} your value`,
    });
  }
  return results;
}

// ─── Config ────────────────────────────────────────────────────────────────────

const band1Options = [
  { label: 'Brown', value: 'Brown' },
  { label: 'Red', value: 'Red' },
  { label: 'Orange', value: 'Orange' },
  { label: 'Yellow', value: 'Yellow' },
  { label: 'Green', value: 'Green' },
  { label: 'Blue', value: 'Blue' },
  { label: 'Violet', value: 'Violet' },
  { label: 'Gray', value: 'Gray' },
  { label: 'White', value: 'White' },
];

const band23Options = [
  { label: 'Black', value: 'Black' },
  { label: 'Brown', value: 'Brown' },
  { label: 'Red', value: 'Red' },
  { label: 'Orange', value: 'Orange' },
  { label: 'Yellow', value: 'Yellow' },
  { label: 'Green', value: 'Green' },
  { label: 'Blue', value: 'Blue' },
  { label: 'Violet', value: 'Violet' },
  { label: 'Gray', value: 'Gray' },
  { label: 'White', value: 'White' },
];

const multiplierOptions = [
  { label: 'Black (x1)', value: 'Black' },
  { label: 'Brown (x10)', value: 'Brown' },
  { label: 'Red (x100)', value: 'Red' },
  { label: 'Orange (x1k)', value: 'Orange' },
  { label: 'Yellow (x10k)', value: 'Yellow' },
  { label: 'Green (x100k)', value: 'Green' },
  { label: 'Blue (x1M)', value: 'Blue' },
  { label: 'Violet (x10M)', value: 'Violet' },
  { label: 'Gray (x100M)', value: 'Gray' },
  { label: 'White (x1G)', value: 'White' },
  { label: 'Gold (x0.1)', value: 'Gold' },
  { label: 'Silver (x0.01)', value: 'Silver' },
];

const toleranceOptions = [
  { label: 'Gray (±0.05%)', value: 'Gray (±0.05%)' },
  { label: 'Violet (±0.1%)', value: 'Violet (±0.1%)' },
  { label: 'Blue (±0.25%)', value: 'Blue (±0.25%)' },
  { label: 'Green (±0.5%)', value: 'Green (±0.5%)' },
  { label: 'Brown (±1%)', value: 'Brown (±1%)' },
  { label: 'Red (±2%)', value: 'Red (±2%)' },
  { label: 'Gold (±5%)', value: 'Gold (±5%)' },
  { label: 'Silver (±10%)', value: 'Silver (±10%)' },
  { label: 'None (±20%)', value: 'None (±20%)' },
];

const tempCoOptions = [
  { label: 'Black (250)', value: 'Black (250)' },
  { label: 'Brown (100)', value: 'Brown (100)' },
  { label: 'Red (50)', value: 'Red (50)' },
  { label: 'Orange (15)', value: 'Orange (15)' },
  { label: 'Yellow (25)', value: 'Yellow (25)' },
  { label: 'Green (20)', value: 'Green (20)' },
  { label: 'Blue (10)', value: 'Blue (10)' },
  { label: 'Violet (5)', value: 'Violet (5)' },
  { label: 'Gray (1)', value: 'Gray (1)' },
];

const resistorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      options: [
        { label: 'Forward: Colors → Ohms', value: 'forward' },
        { label: 'Reverse: Ohms → Colors', value: 'reverse' },
      ],
      defaultValue: 'forward',
      helpText: 'Choose forward (colors to ohms) or reverse (ohms to colors)',
    },
    {
      id: 'bands',
      label: 'Number of Bands',
      type: 'select',
      options: [
        { label: '4-Band', value: '4' },
        { label: '5-Band', value: '5' },
        { label: '6-Band', value: '6' },
      ],
      defaultValue: '4',
      showWhen: (v) => v.mode !== 'reverse',
      helpText: 'Select the number of color bands on the resistor',
    },
    // Forward mode inputs
    {
      id: 'band1',
      label: 'Band 1 (First Significant Figure)',
      type: 'select',
      options: band1Options,
      showWhen: (v) => v.mode === 'forward',
      helpText: 'Select the color of the first significant figure band',
    },
    {
      id: 'band2',
      label: 'Band 2 (Second Significant Figure)',
      type: 'select',
      options: band23Options,
      showWhen: (v) => v.mode === 'forward',
      helpText: 'Select the color of the second significant figure band',
    },
    {
      id: 'band3',
      label: 'Band 3 (Third Significant Figure)',
      type: 'select',
      options: band23Options,
      showWhen: (v) => v.mode === 'forward' && (v.bands === '5' || v.bands === '6'),
      helpText: 'Select the color of the third significant figure band',
    },
    {
      id: 'multiplier',
      label: 'Multiplier',
      type: 'select',
      options: multiplierOptions,
      showWhen: (v) => v.mode === 'forward',
      helpText: 'Select the color of the multiplier band',
    },
    {
      id: 'tolerance',
      label: 'Tolerance',
      type: 'select',
      options: toleranceOptions,
      showWhen: (v) => v.mode === 'forward',
      helpText: 'Select the color of the tolerance band',
    },
    {
      id: 'tempCo',
      label: 'Temp. Coefficient',
      type: 'select',
      options: tempCoOptions,
      showWhen: (v) => v.mode === 'forward' && v.bands === '6',
      helpText: 'Select the temperature coefficient color band',
    },
    // Reverse mode inputs
    {
      id: 'targetOhms',
      label: 'Resistance (Ohms)',
      type: 'number',
      inputMode: 'decimal',
      min: 0,
      step: 1,
      placeholder: 'e.g., 4700',
      helpText: 'Enter the resistance value',
      showWhen: (v) => v.mode === 'reverse',
    },
    {
      id: 'reverseBands',
      label: 'Bands',
      type: 'select',
      options: [
        { label: '4-Band', value: '4' },
        { label: '5-Band', value: '5' },
      ],
      defaultValue: '4',
      showWhen: (v) => v.mode === 'reverse',
      helpText: 'Select 4 or 5 bands for the reverse calculation',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'forward';
    if (mode === 'reverse') {
      return reverseCalculate(values);
    }
    return forwardCalculate(values);
  },
  explainSteps: (values) => {
    const rows = resistorConfig.calculate(values);
    if (!hasAnswer(rows)) return [];
    const g = (id: string) => resultValue(rows, id) ?? '';
    if ((values.mode || 'forward') === 'reverse') {
      let bands: string[];
      try {
        bands = JSON.parse(g('_colorBands')) as string[];
      } catch {
        return [];
      }
      const off = g('standardOffset');
      return [
        { label: 'Pick the nearest standard value', expr: `${g('resistorValue')} → ${g('closestStandard')}`, ...(off ? { note: off } : {}) },
        { label: 'Write the digits, the multiplier and the tolerance as colours', expr: bands.join(' – '), note: `The last band is the tolerance, ${g('tolerance')}.` },
      ];
    }
    const colors = (values.bands || '4') === '4' ? [values.band1, values.band2] : [values.band1, values.band2, values.band3];
    const digits = colors.map((c) => DIGIT_COLORS[c]);
    const sig = Number(digits.join(''));
    const temp = g('tempCoef');
    return [
      { label: 'Read the digit bands', expr: `${colors.map((c, i) => `${c} = ${digits[i]}`).join(',  ')}  →  ${sig}` },
      { label: 'Apply the multiplier band', expr: `${sig} × 10^${MULTIPLIER_COLORS[values.multiplier]} (${values.multiplier}) = ${g('ohmicValue')}` },
      { label: 'Apply the tolerance band', expr: `${g('tolerance')}  →  ${g('minResistance')} to ${g('maxResistance')}` },
      ...(temp ? [{ label: 'Temperature coefficient (sixth band)', expr: temp }] : []),
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ResistorPanel, { values, results });
  },
  educational: {
    formula:
      'R = (digit1 x 10 + digit2) x multiplier (4-band) | R = (digit1 x 100 + digit2 x 10 + digit3) x multiplier (5/6-band)',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="25" y="15" width="270" height="170" fill="rgba(59,130,246,0.05)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="6"/><text x="160" y="37" text-anchor="middle" fill="var(--svg-3b82f6)" font-family="Arial,sans-serif" font-size="12" font-weight="bold">4-Band Resistor Color Code</text><!-- Resistor body --><rect x="70" y="60" width="180" height="55" fill="rgba(239,68,68,0.25)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="27"/><rect x="120" y="55" width="20" height="65" fill="var(--svg-ef4444)" rx="2"/><rect x="145" y="55" width="20" height="65" fill="var(--svg-000000)" rx="2"/><rect x="170" y="55" width="20" height="65" fill="var(--svg-ef4444)" rx="2"/><rect x="195" y="55" width="15" height="65" fill="var(--svg-fbbf24)" rx="2"/><!-- Wire leads --><line x1="40" y1="87" x2="70" y2="87" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="250" y1="87" x2="280" y2="87" stroke="var(--svg-3b82f6)" stroke-width="2"/><!-- Labels --><text x="130" y="135" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="9" font-weight="bold">1st</text><text x="155" y="135" text-anchor="middle" fill="var(--svg-000000)" font-family="Arial,sans-serif" font-size="9" font-weight="bold">2nd</text><text x="180" y="135" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="9" font-weight="bold">Mult</text><text x="202" y="135" text-anchor="middle" fill="var(--svg-fbbf24)" font-family="Arial,sans-serif" font-size="8" font-weight="bold">Tol</text><text x="160" y="160" text-anchor="middle" fill="var(--svg-ef4444)" font-family="Arial,sans-serif" font-size="10" font-weight="bold">R = (digit1 x 10 + digit2) x multiplier</text><text x="160" y="180" text-anchor="middle" fill="var(--svg-9ca3af)" font-family="Arial,sans-serif" font-size="9">Ex: Red-Red-Brown-Gold = 220 Ohm at 5%</text></svg>',
      alt: 'Resistor diagram showing color bands: 1st digit, 2nd digit, multiplier, and tolerance',
      caption: '4-band resistor color code: first two bands are digits, third is multiplier, fourth is tolerance',
    },
    formulaDescription:
      'Resistor color codes use bands to encode the resistance value, multiplier, and tolerance. The first bands are significant figures, followed by a multiplier band and a tolerance band.',
    variables: [
      {
        symbol: 'R',
        name: 'Resistance',
        description: 'The nominal resistance value in ohms.',
      },
      {
        symbol: 'Digits',
        name: 'Significant Figures',
        description: 'The first 2 or 3 bands represent the significant digits of the resistance value.',
      },
      {
        symbol: 'Mult & Tol',
        name: 'Multiplier & Tolerance',
        description: 'The multiplier band determines the order of magnitude (power of 10). The tolerance band indicates precision: Gold = ±5%, Silver = ±10%, Brown = ±1%.',
      },
    ],
    howToUse: [
      'Select Forward mode to decode resistor color bands into a resistance value.',
      'Select Reverse mode to find the color code for a desired resistance value.',
      'Choose the number of bands (4, 5, or 6) matching your resistor.',
      'For forward mode, pick the color of each band from the dropdown menus.',
      'For reverse mode, enter the desired resistance value.',
    ],
    explanation:
      'Resistor color codes are a standardized system for marking resistance values on through-hole resistors. The first bands represent significant digits, the next band is the decimal multiplier, and the last band(s) indicate tolerance and temperature coefficient. For 4-band resistors, the first two bands are digits, the third is the multiplier, and the fourth is the tolerance. Practical example: a resistor with Brown-Black-Red-Gold bands. Brown = 1, Black = 0, so the significant digits are 10. Red multiplier = 100, so the resistance is 10 × 100 = 1,000 ohms (1 kΩ). Gold tolerance = ±5%, so the actual value is between 950 Ω and 1,050 Ω. Another example: Yellow-Violet-Orange-Silver = 47 × 1,000 = 47 kΩ at ±10% (range: 42.3 kΩ to 51.7 kΩ). Edge cases: for surface-mount resistors (SMD), color codes are not used — instead, a three- or four-digit numbering system is used. A marking of "472" means 47 × 10² = 4,700 Ω. The letter "R" indicates a decimal point, so "4R7" = 4.7 Ω. For zero-ohm jumpers (used as wire bridges on PCBs), a single black band or a "0" marking is used. When reading vintage resistors, the body-end-dot system (used before the band system was standardized in the 1950s) may be encountered: the body color is the first digit, the end color is the second digit, and the dot color is the multiplier.',
    quickReference: [
      { label: 'Brown-Black-Red-Gold', value: '1 kΩ ±5% (4-band)' },
      { label: 'Red-Red-Brown-Gold', value: '220 Ω ±5% (4-band)' },
      { label: 'Yellow-Violet-Orange-Gold', value: '47 kΩ ±5% (4-band)' },
      { label: 'Brown-Black-Black-Red-Brown', value: '10 kΩ ±1% (5-band)' },
      { label: 'Blue-Gray-Black-Orange-Brown', value: '680 kΩ ±1% (5-band)' },
      { label: 'Brown-Black-Black-Gold', value: '10 Ω ±5% (4-band)' },
      { label: 'Green-Blue-Gold-Silver', value: '5.6 Ω ±10% (4-band)' },
      { label: 'SMD marking "103"', value: '10 kΩ (10 × 10³)' },
      { label: 'SMD marking "4R7"', value: '4.7 Ω (R = decimal point)' },
      { label: 'Zero-ohm jumper', value: 'Single black band ≈ 0 Ω' },
    ],
    commonUses: [
      'Electronics prototyping — quickly verify resistor values pulled from a parts bin using color code decoding rather than measuring each one with a multimeter',
      'PCB assembly and rework — confirm correct resistors are placed in automated assembly or hand-soldered boards by cross-referencing color codes with BOM values',
      'Repair and restoration — identify resistor values on vintage equipment where markings may be faded but color bands are still visible, or where schematic diagrams are unavailable',
      'Education and training — teach electronics students the color code system as a fundamental skill for reading component values without tools',
      'Reverse engineering — analyze competitor or legacy circuit boards where schematics are unavailable by decoding resistor color bands to reconstruct the circuit design',
    ],
    workedExamples: [
      {
        scenario: 'David is repairing a 1980s stereo amplifier and finds a resistor with bands Yellow-Violet-Red-Gold. The schematic is unavailable and he needs to know if this is a standard value before ordering a replacement.',
        inputs: { mode: 'forward', bands: '4', band1: 'Yellow', band2: 'Violet', multiplier: 'Red', tolerance: 'Gold (±5%)' },
        result: '4.7 kΩ ±5% (range: 4,465 Ω to 4,935 Ω)',
        insight: 'Yellow=4, Violet=7 gives significant figures 47. Red multiplier = 100, so 47 × 100 = 4,700 Ω = 4.7 kΩ. Gold tolerance means the actual value is between 4,465 Ω and 4,935 Ω. This is a standard E12 series value (4.7 kΩ), so David can easily order a replacement. If the measured value is outside the tolerance band, the resistor has drifted and needs replacement. A common failure mode in vintage amplifiers is carbon composition resistors absorbing moisture and increasing in value by 20-50% over decades.',
      },
      {
        scenario: 'Maria is designing a precision voltage divider for a sensor circuit that requires exactly 6.8 kΩ. She wants to know the 5-band color code to order the correct precision resistor.',
        inputs: { mode: 'reverse', reverseBands: '5', targetOhms: '6800' },
        result: 'Blue-Gray-Black-Brown-Gold — 6.80 kΩ ±5% (E24 series)',
        insight: 'For 6,800 Ω with 5-band precision: Blue=6, Gray=8, Black=0 gives significant figures 680. Multiplier exponent is 1 (Brown = ×10), so 680 × 10 = 6,800 Ω. For true 1% tolerance applications, Maria should look for a resistor with the Brown tolerance band instead of Gold, since 1% tolerance is standard for 5-band precision resistors. The E96 series offers even finer granularity (6.81 kΩ or 6.65 kΩ) if the application requires tighter matching.',
      },
      {
        scenario: 'James salvages a 6-band resistor from a telecommunications board. The bands are Brown-Black-Black-Brown-Brown-Red. He needs to decode this high-precision resistor and understand the temperature coefficient.',
        inputs: { mode: 'forward', bands: '6', band1: 'Brown', band2: 'Black', band3: 'Black', multiplier: 'Brown', tolerance: 'Brown (±1%)', tempCo: 'Red (50)' },
        result: '1 kΩ ±1%, 50 ppm/K temperature coefficient',
        insight: 'This is a precision 1 kΩ resistor. The 50 ppm/K tempco means for every 10°C temperature rise, the resistance changes by only 0.05% (0.5 Ω). This is excellent for precision analog circuits and telecommunications equipment where value stability across temperature is critical. A resistor with 100 ppm/K would drift twice as much. At 85°C operating temperature (60°C above room temp), this resistor would only shift by 3 Ω — negligible for most applications. For ultra-precision applications like medical instruments or calibration equipment, look for 15 ppm/K (Orange) or 5 ppm/K (Violet) tempco.',
      },
    ],
    proTips: [
      'Remember the mnemonic "Better Be Right Or Your Great Big Venture Goes West" for the digit colors (Black=0 through White=9). The multiplier colors use the same sequence (Black=×1, Brown=×10, etc.) with Gold (×0.1) and Silver (×0.01) added at the end for sub-1Ω values.',
      'When reading a resistor in-circuit, first identify the tolerance band. On 4-band resistors, the tolerance band is usually Gold (5%) or Silver (10%) and is physically separated from the other three bands by a wider gap. On 5-band resistors, the tolerance band is Brown (1%) or Red (2%) and the gap is between the multiplier and tolerance bands. If you are unsure, measure with a multimeter to confirm.',
      'Surface-mount (SMD) resistors don\'t use color codes — they use a 3-digit or 4-digit numbering system. "472" = 47 × 10² = 4,700 Ω, "1001" = 100 × 10¹ = 1,000 Ω. The letter "R" represents a decimal point: "4R7" = 4.7 Ω, "R10" = 0.1 Ω. For EIA-96 marking (used on 1% SMD resistors), a two-digit code plus letter multiplier is used: "68C" = 499 × 100 = 49.9 kΩ.',
      'Old or damaged resistors may have discolored bands due to overheating. Red can look like Orange after years of heat exposure, and Brown can fade to look like Yellow. When in doubt, use the reverse mode: measure the resistance with a multimeter, then check if the color bands match the measured value. If the measured value is within tolerance of a standard E-series value that matches the band colors, the resistor is likely good. If not, one or more bands have faded and the resistor should be replaced.',
    ],
    limitations: [
      'When not to use: This calculator is for axial-lead through-hole resistors with standard color bands only. It does not apply to surface-mount (SMD) resistors which use numeric codes, wire-wound power resistors (often have printed values), or variable resistors/potentiometers. For resistors with non-standard band configurations (e.g., military-spec with reliability bands), use manufacturer datasheets.',
      'Color perception varies between individuals and lighting conditions. Brown/Red/Orange and Blue/Violet/Gray are particularly easy to confuse under fluorescent or LED lighting. Always verify decoded values with a multimeter for critical applications — a misread band can create a 10x or 100x error.',
      'The calculator uses the E12 and E24 standard value series for reverse lookup. Many precision resistors use E48, E96, or E192 series with finer granularity. The reverse mode may suggest the closest E12/E24 value, which could be several percent off from an E96 target value. For precision applications, cross-reference with the full E96 table.',
      'Resistor color bands do not indicate power rating (1/4W, 1/2W, 1W, etc.), voltage rating, or physical size. A 1 kΩ resistor can come in any power rating — the color code tells you resistance only, not whether it can safely dissipate the heat in your circuit. Always size resistors by power dissipation (P = I²R) and select a power rating with at least 2x safety margin.',
    ],
    faqs: [
      {
        question: 'Why is Black not allowed for the first band?',
        answer: 'Black represents zero, which would make the first significant digit zero and reduce the effective number of significant figures. A leading zero would be ambiguous — a resistor with Black-Brown-Red-Gold bands would mathematically be 01 × 100 = 100 Ω, which is identical to Brown-Black-Brown-Gold (10 × 10 = 100 Ω). The standard requires the first band to be non-zero to maintain a canonical representation.',
      },
      {
        question: 'What is the difference between 4-band and 5-band resistors?',
        answer: '4-band resistors have 2 significant digits (E12/E24 series) and are common for standard tolerance values of ±5%, ±10%, and ±20%. 5-band resistors have 3 significant digits (E48/E96 series) and are used for higher precision resistors with ±1% or ±2% tolerance. A 4-band 47 kΩ resistor reads Yellow-Violet-Orange-Gold, while a 5-band 47.5 kΩ precision resistor reads Yellow-Violet-Green-Red-Brown. The extra digit allows for intermediate values not available in the coarser E24 series.',
      },
      {
        question: 'What does the temperature coefficient mean?',
        answer: 'The temperature coefficient (ppm/K) tells you how much the resistance changes per degree Celsius. For example, 100 ppm/K means the resistance changes by 0.01% for every 1 degree C change. A 10 kΩ resistor with 100 ppm/K tempco shifts by 1 Ω per degree C. Over a 50°C temperature swing (from 25°C room temp to 75°C inside a chassis), that is a 50 Ω change — 0.5% drift, which is significant for precision circuits. For critical applications like instrumentation amplifiers, voltage references, and analog-to-digital converter front-ends, use resistors with 15-25 ppm/K tempco or lower.',
      },
      {
        question: 'How do I identify which band is the tolerance band when reading a resistor?',
        answer: 'On 4-band resistors, the tolerance band (Gold or Silver) is at the right end and is separated by a slightly wider gap from the multiplier band. Gold and Silver never appear as the first band. On 5-band resistors, the tolerance band is typically Brown (±1%) or Red (±2%). The wider gap is between the multiplier and tolerance bands. If you cannot identify the gap, hold the resistor so that the grouped bands are on the left side — the rightmost band is the tolerance. A good habit: always verify with a multimeter.',
      },
      {
        question: 'Are resistor color codes the same worldwide?',
        answer: 'Yes, the resistor color code is an international standard defined by IEC 60062. The same colors and values are used globally. However, some military-spec (MIL) resistors use a fifth reliability band (typically on the far left or far right) to indicate failure rate per 1,000 hours of operation. These are rare outside of aerospace and defense applications. Vintage equipment may use the older body-end-dot (BED) system where the body color is the first digit, end color is second digit, and dot color is the multiplier — common on resistors manufactured before 1960.',
      },
      {
        question: 'Why would a resistor value change over time or with heat?',
        answer: 'Resistor drift is caused by several mechanisms: carbon composition resistors absorb moisture and oxidize, causing values to increase by 20-50% over decades. Metal film resistors are much more stable, typically drifting less than 0.5% over their lifetime. Operating a resistor near its maximum power rating causes internal heating that accelerates chemical changes in the resistive element — this is why the 2x power derating rule exists. Thermal cycling (repeated heating and cooling) can also cause micro-cracks in the resistive film, leading to intermittent or permanent value changes. If you measure a resistor and it is outside its tolerance band, replace it — continued drift is likely.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'Resistor', url: 'https://en.wikipedia.org/wiki/Resistor' },

    ],
  },
};

export default resistorConfig;
