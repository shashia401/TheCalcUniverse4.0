import { createElement } from 'react';
import type { CalculatorConfig, CalculatorResult, ExplainStep } from '../../../types/calculator';
import { formatQty, parseQty } from '../../../utils/unitConvert';
import HardnessPanel from './HardnessPanel';
import { TENSILE_PER_HV, fromHV, scaleRange, toHV, type HardnessScaleId } from './hardnessTable';

// Hardness conversion is empirical and material dependent. This tool interpolates ASTM E140-12b Table 1
// (non-austenitic steels) linearly between printed rows and never extrapolates outside the table.

interface HardnessScale {
  value: HardnessScaleId;
  label: string;
  shortLabel: string;
  /** Decimal places shown (E140 prints Rockwell numbers to 0.1 and the rest as whole numbers). */
  decimals: number;
}

export const SCALES: HardnessScale[] = [
  { value: 'hrc', label: 'Rockwell C (HRC)', shortLabel: 'HRC', decimals: 1 },
  { value: 'hrb', label: 'Rockwell B (HRB)', shortLabel: 'HRB', decimals: 1 },
  { value: 'hra', label: 'Rockwell A (HRA)', shortLabel: 'HRA', decimals: 1 },
  { value: 'hbw', label: 'Brinell (HBW), 10 mm ball, 3000 kgf', shortLabel: 'HBW', decimals: 0 },
  { value: 'hv', label: 'Vickers (HV)', shortLabel: 'HV', decimals: 0 },
  { value: 'hs', label: 'Shore scleroscope (HS)', shortLabel: 'HS', decimals: 0 },
  { value: 'nmm2', label: 'Tensile strength estimate (N/mm², about 3.2 × HV)', shortLabel: 'N/mm²', decimals: 0 },
];

const SCALE_MAP: Record<string, HardnessScale> = Object.fromEntries(SCALES.map((s) => [s.value, s]));
const OPTIONS = SCALES.map((s) => ({ label: s.label, value: s.value }));

export const rangeText = (scale: HardnessScale): string => {
  const [lo, hi] = scaleRange(scale.value);
  return `${scale.shortLabel} ${formatQty(lo)}–${formatQty(hi)}`;
};

const round = (v: number, d: number) => Number(v.toFixed(d));

export interface HardnessConversion {
  value: number;
  from: HardnessScale;
  /** Vickers pivot, null when the input is outside the table for its scale */
  hv: number | null;
  equivalents: { scale: HardnessScale; value: number }[];
}

/** Pure conversion used by calculate() and the panel: HV pivot, every other scale that has a table entry. */
export function convertHardness(raw: string | undefined, fromId: string | undefined): HardnessConversion | null {
  const value = parseQty(raw);
  const from = fromId ? SCALE_MAP[fromId] : undefined;
  if (value === null || !from) return null;
  const hv = toHV(from.value, value);
  if (hv === null) return { value, from, hv: null, equivalents: [] };
  const equivalents = SCALES.filter((s) => s.value !== from.value)
    .map((scale) => ({ scale, raw: fromHV(scale.value, hv) }))
    .filter((e): e is { scale: HardnessScale; raw: number } => e.raw !== null)
    .map((e) => ({ scale: e.scale, value: round(e.raw, e.scale.decimals) }));
  return { value, from, hv, equivalents };
}

const hardnessConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'fromValue',
      label: 'Hardness Value',
      type: 'number',
      placeholder: '40',
      defaultValue: '40',
      step: 0.1,
      required: true,
      helpText: 'Enter the hardness number in the selected scale. Approximate conversions for non-austenitic steel (ASTM E140-12b).',
    },
    {
      id: 'fromUnit',
      label: 'From Scale',
      type: 'select',
      required: true,
      defaultValue: 'hrc',
      options: OPTIONS,
    },
  ],
  calculate: (values) => {
    const c = convertHardness(values.fromValue, values.fromUnit?.trim());
    if (!c) return [];
    if (c.hv === null) {
      return [
        {
          id: 'error',
          label: 'Outside the conversion table',
          value: `${formatQty(c.value)} ${c.from.shortLabel} is outside the ASTM E140 table for this scale (valid range ${rangeText(c.from)}). Values are not extrapolated.`,
          highlight: true,
          color: 'negative',
        },
      ];
    }
    const results: CalculatorResult[] = [
      {
        id: 'result',
        label: `Input (${c.from.shortLabel})`,
        value: `${formatQty(c.value)} ${c.from.shortLabel}`,
        highlight: true,
        color: 'positive',
        interpretation:
          'Approximate equivalents for carbon, alloy and tool steel only (ASTM E140-12b Table 1, linear interpolation between printed rows). They do not apply to austenitic stainless steel, aluminium, brass, copper or cast iron. Use them for estimates, not for acceptance: test in the specified scale.',
      },
    ];
    for (const e of c.equivalents) {
      results.push({
        id: `eq_${e.scale.value}`,
        label: `Approx. ${e.scale.shortLabel}`,
        value: `≈ ${formatQty(e.value)} ${e.scale.shortLabel}`,
        color: 'neutral',
      });
    }
    return results;
  },
  explainSteps: (values) => {
    const c = convertHardness(values.fromValue, values.fromUnit?.trim());
    if (!c || c.hv === null) return [];
    const q = formatQty;
    const pivot: ExplainStep =
      c.from.value === 'hv'
        ? { label: 'Vickers (HV) is the pivot scale', expr: `HV ${q(c.value)} needs no lookup`, note: 'Hardness scales have no exact formula, so every conversion goes through HV.' }
        : c.from.value === 'nmm2'
          ? { label: 'Estimate HV from tensile strength', expr: `HV = ${q(c.value)} N/mm² ÷ ${TENSILE_PER_HV} = ${q(c.hv)}`, note: 'Rule of thumb for steel (Rm ≈ 3.2 × HV), not part of ASTM E140.' }
          : {
              label: `Look up ${c.from.shortLabel} ${q(c.value)} in the table to get HV`,
              expr: `${c.from.shortLabel} ${q(c.value)} → HV ${q(c.hv)}`,
              note: 'Approximate, not an exact formula: linear interpolation between neighbouring rows of ASTM E140-12b Table 1 (non-austenitic steel); rows sharing the same value have their HV averaged.',
            };
    return [
      pivot,
      {
        label: `Read the other scales at HV ${q(c.hv)}`,
        expr: `${q(c.value)} ${c.from.shortLabel} ` + c.equivalents.map((e) => `≈ ${q(e.value)} ${e.scale.shortLabel}`).join(' · '),
        note: 'Same table, same interpolation, rounded to the decimals shown (0.1 for Rockwell, whole numbers otherwise). Valid for carbon, alloy and tool steel only.',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.some((r) => r.id === 'result')) return null;
    return createElement(HardnessPanel, { values, results });
  },
  educational: {
    formula: 'Piecewise-linear lookup in ASTM E140-12b Table 1 (HV is the pivot scale): X → HV → Y',
    formulaDescription:
      'Hardness scales measure different things (Rockwell: indentation depth under a major load; Brinell: diameter of a ball impression; Vickers: diagonal of a pyramid impression; scleroscope: rebound height), so no formula converts one to another. ASTM E140 publishes empirical tables for groups of materials. This tool uses Table 1 (non-austenitic steels: carbon, alloy and tool steel) and interpolates linearly between the printed rows with Vickers as the pivot. Each scale is accepted only inside the range the table covers (HRC 20–68, HRB 81–100, HV 160–940, HBW 153–739) and nothing is extrapolated. Treat every result as approximate; for critical work test in the scale the drawing specifies.',
    formulaSource:
      'ASTM E140-12b, Standard Hardness Conversion Tables for Metals (Table 1, non-austenitic steels). The tensile figure is the common rule of thumb Rm ≈ 3.2 × HV (MPa) for steels, shown only up to HV 650; it is not part of E140 (see ISO 18265 for tabulated values).',
    variables: [
      { symbol: 'HRC', name: 'Rockwell C', description: 'Diamond cone, 150 kgf major load. Hardened steel, valid roughly HRC 20–70. Tools, dies, gears, shafts.' },
      { symbol: 'HRB', name: 'Rockwell B', description: '1/16 in steel ball, 100 kgf. Softer metals such as annealed steel, brass and aluminium. This tool covers HRB 81–100, where E140 Table 1 lists Vickers values.' },
      { symbol: 'HRA', name: 'Rockwell A', description: 'Diamond cone, 60 kgf. Very hard materials, thin or case-hardened sections, carbides.' },
      { symbol: 'HBW', name: 'Brinell', description: '10 mm tungsten-carbide ball, 3000 kgf. Large impression that averages coarse structures; for hardened steel it reads lower than Vickers (HRC 40: HBW 371 vs HV 392).' },
      { symbol: 'HV', name: 'Vickers', description: 'Diamond pyramid, any load from gram-force to 100 kgf. Works across soft to very hard materials and thin layers; the pivot scale here.' },
      { symbol: 'HS', name: 'Shore scleroscope', description: 'Height a diamond-tipped hammer rebounds from the surface. This is not the Shore A/D durometer used for rubber and plastics, which cannot be converted with this table.' },
    ],
    howToUse: [
      'Select the scale your reading is in (for example HRC) and enter the number.',
      'The approximate equivalents in every other scale that has a table entry at that hardness appear below it.',
      'If the value is outside the table (for example HRC 15) the tool says so instead of extrapolating.',
      'Use the results for estimates only, and only for carbon, alloy and tool steel.',
    ],
    quickReference: [
      { label: 'HRC 40', value: '≈ HV 392 / HBW 371 / HRA 70.4 / HS 54' },
      { label: 'HRC 45', value: '≈ HV 446 / HBW 421 / HRA 73.1 / HS 60' },
      { label: 'HRC 50', value: '≈ HV 513 / HBW 475 / HRA 75.9 / HS 67' },
      { label: 'HRC 60', value: '≈ HV 697 / HBW 654 / HRA 81.2 / HS 81' },
      { label: 'HRB 90', value: '≈ HV 192 / HBW 185 / HRA 55.5' },
      { label: 'HRB 100', value: '≈ HV 254 / HBW 240 (about HRC 23)' },
      { label: 'HV 600', value: '≈ HRC 55.3 / HBW 565' },
      { label: 'Tensile estimate', value: 'Rm [MPa] ≈ 3.2 × HV (steel, up to HV 650)' },
    ],
    commonUses: [
      'Kitchen knives: typically HRC 55–62 (some Japanese knives 60–64)',
      'Gear teeth and bearing races: surface about HRC 58–62',
      'Quick shop-floor estimate of Brinell or Vickers from a Rockwell reading on a steel part',
      'Estimating tensile strength of steel from a non-destructive hardness reading',
      'Comparing a supplier certificate in HBW with a drawing that calls out HRC',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 480 130" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="240" y="18" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Hardness Test Methods &mdash; Indenter Comparison</text>' +
        '<rect x="20" y="45" width="80" height="55" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/>' +
        '<polygon points="60,45 55,55 65,55" fill="var(--svg-64748b)"/>' +
        '<rect x="57" y="55" width="6" height="25" rx="1" fill="var(--svg-64748b)"/>' +
        '<text x="60" y="90" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">Rockwell C</text>' +
        '<text x="60" y="102" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle">Diamond Cone</text>' +
        '<rect x="120" y="45" width="80" height="55" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/>' +
        '<circle cx="160" cy="55" r="8" fill="var(--svg-64748b)"/>' +
        '<rect x="157" y="63" width="6" height="17" rx="1" fill="var(--svg-64748b)"/>' +
        '<text x="160" y="90" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">Brinell</text>' +
        '<text x="160" y="102" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle">Tungsten Ball</text>' +
        '<rect x="220" y="45" width="80" height="55" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/>' +
        '<polygon points="260,45 252,60 268,60" fill="var(--svg-64748b)"/>' +
        '<rect x="257" y="60" width="6" height="20" rx="1" fill="var(--svg-64748b)"/>' +
        '<text x="260" y="90" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">Vickers</text>' +
        '<text x="260" y="102" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle">Diamond Pyramid</text>' +
        '<rect x="320" y="45" width="80" height="55" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/>' +
        '<rect x="355" y="65" width="10" height="15" rx="1" fill="var(--svg-64748b)"/>' +
        '<line x1="360" y1="45" x2="360" y2="65" stroke="var(--svg-64748b)" stroke-width="1.5"/>' +
        '<circle cx="360" cy="50" r="3" fill="var(--svg-64748b)"/>' +
        '<text x="360" y="90" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">Scleroscope</text>' +
        '<text x="360" y="102" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle">Rebound Height</text>' +
        '<text x="240" y="122" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle">Each test measures something different &mdash; conversions are approximate (ASTM E140)</text>' +
        '</svg>',
      alt: 'Comparison of four hardness test indenters: Rockwell diamond cone, Brinell ball, Vickers pyramid, Shore rebound hammer',
      caption: 'Each hardness test measures a different physical response — no simple linear conversion exists',
    },
    explanation:
      'Hardness is resistance to localized plastic deformation. Rockwell is fast and reads a dial, Brinell averages over a large impression, and Vickers works from soft metals to hard coatings. Because the physics of each test differs, conversions are empirical and depend on the material family: the same HRC maps to a different HV on austenitic stainless steel than on tool steel. ASTM E140 Table 1 covers non-austenitic steels, and this tool is built on exactly that table, so use it only for those steels. Outside the table the tool declines to answer rather than guess. Engineering drawings normally specify a hardness range together with the test method (for example "HRC 58–62") instead of relying on cross-scale conversion.',
    faqs: [
      {
        question: 'Is this the ASTM E140 hardness conversion chart?',
        answer: 'It is an interactive version of E140-12b Table 1 (non-austenitic steels). Enter a number in any supported scale and the equivalents in the others are interpolated between the printed rows. Values outside the printed range are refused. The standard itself calls the numbers approximate.',
      },
      {
        question: 'How do I convert HRC to Brinell (HBW)?',
        answer: 'Select Rockwell C, enter the value, and read the Brinell line. For steel per E140: HRC 40 is about HBW 371, HRC 50 about 475 and HRC 60 about 654. Brinell reads lower than Vickers on hard steel (HRC 40 is HV 392), so do not assume HB equals HV. The table prints no Brinell number above HRC 65.',
      },
      {
        question: 'How do I convert HRB to HRC?',
        answer: 'The two scales barely overlap. E140 pairs HRB 100 with about HRC 23 (HV 254); below HRC 20 the C scale is outside its valid range and above HRB 100 the B scale is. Values near the overlap are the least reliable, so use Vickers or Brinell as the common scale instead.',
      },
      {
        question: 'How do I convert Rockwell to Vickers?',
        answer: 'Enter the HRC or HRB value. For steel, HRC 40 is about HV 392, HRC 50 about HV 513 and HRC 60 about HV 697. Vickers is the pivot scale of this tool.',
      },
      {
        question: "Why can't hardness scales be converted with an exact formula?",
        answer: 'Each test measures a different response (depth, impression diameter, impression diagonal, rebound height) under a different load, and the relationships depend on work-hardening and elastic behaviour of the material. That is why E140 gives separate empirical tables per material group and flags every value as approximate.',
      },
      {
        question: 'Can I use this for rubber or plastic (Shore A / Shore D)?',
        answer: 'No. Shore A and D durometers measure elastomers and plastics and have no conversion to Rockwell, Brinell or Vickers. The "HS" scale here is the Shore scleroscope (rebound) scale used on metals.',
      },
      {
        question: 'How good is the tensile strength estimate?',
        answer: 'The rule Rm ≈ 3.2 × HV (MPa) is a rough guide for steels (HV 400 gives about 1,280 MPa). It degrades for very hard or work-hardened material and is not part of E140, so the tool limits it to HV 650 and you should use ISO 18265 or mill certificates for specification work.',
      },
    ],
    citations: [
      { source: 'ASTM E140-12b - Standard Hardness Conversion Tables for Metals', url: 'https://www.astm.org/e0140-12b.html' },
      { source: 'ISO 18265 - Metallic materials, conversion of hardness values', url: 'https://www.iso.org/standard/36485.html' },
    ],
    limitations: [
      'Only for non-austenitic steels (carbon, alloy, tool) that are homogeneous. Austenitic stainless, nickel alloys, aluminium, brass, copper and cast iron have their own tables.',
      'Linear interpolation between printed rows; E140 itself states the numbers are approximate and warns against using conversions for acceptance testing.',
      'Brinell is not listed above HRC 65 and Rockwell B is covered only for HRB 81–100 (the range where E140 Table 1 prints Vickers values).',
    ],
  },
};

export default hardnessConfig;
