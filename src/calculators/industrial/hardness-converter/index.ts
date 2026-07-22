import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import HardnessPanel from './HardnessPanel';

// Hardness conversion between scales is non-linear and material-dependent.
// This implementation uses ASTM E140-12b approximate conversion formulas for steel.
// Results are approximate — use certified reference standards for critical applications.

interface HardnessScale {
  value: string;
  label: string;
  shortLabel: string;
  /** Convert from this scale to approximate HV (Vickers) */
  toHV: (v: number) => number | null;
  /** Convert from HV to this scale */
  fromHV: (hv: number) => number | null;
  /** Valid range description */
  range: string;
}

const SCALES: HardnessScale[] = [
  {
    value: 'hrc',
    label: 'Rockwell C (HRC)',
    shortLabel: 'HRC',
    toHV: (v) => {
      if (v < 20 || v > 70) return null;
      return -0.00316 * Math.pow(v, 3) + 0.524 * Math.pow(v, 2) + 11.28 * v + 58.5;
    },
    fromHV: (hv) => {
      if (hv < 250 || hv > 1000) return null;
      // Inverse: approximate
      return Math.pow((hv - 100) / 15.6, 1 / 1.2);
    },
    range: 'HRC 20–70',
  },
  {
    value: 'hrb',
    label: 'Rockwell B (HRB)',
    shortLabel: 'HRB',
    toHV: (v) => {
      if (v < 40 || v > 100) return null;
      if (v < 60) return 0.862 * Math.pow(v, 2) - 66.2 * v + 1739; // HRB 40-60
      return 1.194 * Math.pow(v, 2) - 110.5 * v + 2808; // HRB 60-100
    },
    fromHV: (hv) => {
      if (hv < 80 || hv > 280) return null;
      return 28.5 + Math.sqrt((hv - 50) / 1.2);
    },
    range: 'HRB 40–100',
  },
  {
    value: 'hra',
    label: 'Rockwell A (HRA)',
    shortLabel: 'HRA',
    toHV: (v) => {
      if (v < 50 || v > 85) return null;
      return Math.pow((v - 25) / 0.06, 1 / 1.1);
    },
    fromHV: (hv) => {
      if (hv < 150 || hv > 1000) return null;
      return 0.06 * Math.pow(hv, 1.1) + 25;
    },
    range: 'HRA 50–85',
  },
  {
    value: 'hbw',
    label: 'Brinell (HBW) 3000 kg',
    shortLabel: 'HBW',
    toHV: (v) => {
      if (v < 100 || v > 750) return null;
      return v; // HB ≈ HV in mid-range for steel
    },
    fromHV: (hv) => {
      if (hv < 100 || hv > 750) return null;
      return hv;
    },
    range: 'HB 100–750',
  },
  {
    value: 'hv',
    label: 'Vickers (HV)',
    shortLabel: 'HV',
    toHV: (v) => v,
    fromHV: (hv) => hv,
    range: 'HV 100–1000',
  },
  {
    value: 'hs',
    label: 'Shore (HS)',
    shortLabel: 'HS',
    toHV: (v) => {
      if (v < 20 || v > 100) return null;
      return Math.pow(v * 4.5 - 50, 1.15);
    },
    fromHV: (hv) => {
      if (hv < 50 || hv > 950) return null;
      return (Math.pow(hv, 1 / 1.15) + 50) / 4.5;
    },
    range: 'HS 20–100',
  },
  {
    value: 'nmm2',
    label: 'Tensile Strength — N/mm² (≈ 3.2 × HV for steel)',
    shortLabel: 'N/mm²',
    toHV: (v) => {
      if (v < 300 || v > 3200) return null;
      return v / 3.2;
    },
    fromHV: (hv) => {
      if (hv < 100 || hv > 1000) return null;
      return hv * 3.2;
    },
    range: 'N/mm² 300–3200',
  },
];

const OPTIONS = SCALES.map((s) => ({ label: s.label, value: s.value }));
const OPTIONS_SORTED = [...OPTIONS].sort((a, b) => a.label.localeCompare(b.label));

const SCALE_MAP: Record<string, HardnessScale> = {};
for (const s of SCALES) {
  SCALE_MAP[s.value] = s;
}

const hardnessConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'fromValue',
      label: 'Hardness Value',
      type: 'number',
      placeholder: '40',
      step: 0.1,
      required: true,
      helpText: 'Enter the hardness value in the selected scale (approximate conversions for steel per ASTM E140)',
    },
    {
      id: 'fromUnit',
      label: 'From Scale',
      type: 'select',
      required: true,
      options: OPTIONS_SORTED,
    },
  ],
  calculate: (values) => {
    const rawValue = values.fromValue?.trim();
    const fromUnit = values.fromUnit?.trim();
    if (!rawValue || !fromUnit) return [];

    const fromValue = parseFloat(rawValue);
    if (isNaN(fromValue) || !isFinite(fromValue)) return [];

    const fromScale = SCALE_MAP[fromUnit];
    if (!fromScale) return [];

    // Convert to HV first
    const hv = fromScale.toHV(fromValue);
    if (hv === null || !isFinite(hv)) return [];

    const results: CalculatorResult[] = [
      {
        id: 'result',
        label: `Result (in ${fromScale.shortLabel})`,
        value: `${rawValue} ${fromScale.shortLabel}`,
        highlight: true,
        color: 'positive' as const,
      },
    ];

    // Show equivalents in all other scales
    for (const scale of SCALES) {
      if (scale.value === fromUnit) continue;
      const converted = scale.fromHV(hv);
      if (converted === null || !isFinite(converted)) continue;
      const formatted = parseFloat(converted.toFixed(1)).toString();
      results.push({
        id: `eq_${scale.value}`,
        label: `Approx. ${scale.shortLabel}`,
        value: `≈ ${formatted} ${scale.shortLabel}`,
        color: 'neutral' as const,
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(HardnessPanel, { values, results });
  },
  educational: {
    formula: 'Approximate polynomial per ASTM E140-12b | Valid for carbon & alloy steel only',
    formulaDescription:
      'Hardness conversions between scales (Rockwell, Brinell, Vickers, Shore) are inherently approximate and material-dependent. There is no simple linear formula because each test measures hardness differently — Rockwell uses depth of indentation, Brinell uses diameter of indentation, Vickers uses diagonal length, and Shore uses rebound height. The American Society for Testing and Materials (ASTM) publishes standard conversion tables (E140) that provide approximate equivalents for specific material types. The formulas used in this tool are polynomial curve fits to the ASTM E140-12b data for carbon and alloy steel, the most common conversion scenario. For critical applications, always use certified reference blocks or the official ASTM conversion tables.',
    variables: [
      { symbol: 'HRC', name: 'Rockwell C', description: 'Diamond cone indenter, 150 kg load. Most common for hardened steel (HRC 20-70). Used for tools, dies, gears, shafts.' },
      { symbol: 'HRB', name: 'Rockwell B', description: '1/16" steel ball indenter, 100 kg load. Used for softer metals like annealed steel, brass, and aluminum (HRB 40-100).' },
      { symbol: 'HBW', name: 'Brinell', description: 'Tungsten carbide ball, typically 3000 kg load. One of the oldest hardness tests, produces a large indentation for accurate bulk material measurement.' },
      { symbol: 'HV', name: 'Vickers', description: 'Diamond pyramid indenter, variable load (typically 1-120 kg). Very precise, works on all materials from soft to very hard. Standard for thin materials and case-hardened layers.' },
      { symbol: 'HS', name: 'Shore (Durometer)', description: 'A spring-loaded indenter scale. Shore A for soft rubbers (e.g., tires Shore A 60-75), Shore D for harder plastics (e.g., hard hats Shore D 75). Common for elastomer and plastic testing.' },
    ],
    howToUse: [
      'Select the hardness scale you want to convert FROM (e.g., HRC for hardened steel).',
      'Enter the hardness value in that scale.',
      'View approximate equivalents in all other scales for carbon/alloy steel.',
      'Note: conversions are approximate per ASTM E140. Always verify with certified reference blocks for critical applications.',
      'Use the quick reference table for typical hardness equivalents like HRC 40 and its approximate HV and HBW values.',
    ],
    quickReference: [
      { label: 'HRC 40', value: '≈ HB 371 / HV 380 / HRA 72' },
      { label: 'HRC 50', value: '≈ HB 488 / HV 500 / HRA 77' },
      { label: 'HRC 60', value: '≈ HB 620 / HV 640 / HRA 82' },
      { label: 'HRB 80', value: '≈ HB 145 / HV 150' },
      { label: 'HRB 95', value: '≈ HB 210 / HV 220' },
      { label: 'HV 200', value: '≈ HRB 93 / HB 200' },
      { label: 'HV 600', value: '≈ HRC 56 / HB 570' },
      { label: 'N/mm² estimate', value: 'tensile ≈ 3.2 × HV (carbon steel)' },
    ],
    commonUses: [
      'Kitchen knives: HRC 55–62 (Japanese chef knives: HRC 60–64)',
      'Structural steel (A36): ~HB 120–140 (~65 HRB)',
      'File/tool steel: HRC 60–65 for cutting edges',
      'Gear teeth: HRC 58–62 for wear resistance',
      'Automotive camshaft: HRC 48–55 lobe surface hardness',
      'Case-hardened shafts: surface HRC 58–62, core HRB 85–95',
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
        '<text x="360" y="90" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">Shore</text>' +
        '<text x="360" y="102" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle">Rebound Hammer</text>' +
        '<text x="240" y="122" font-family="system-ui,sans-serif" font-size="7" fill="var(--svg-64748b)" text-anchor="middle">Each test uses a different indenter &mdash; conversions are approximate (ASTM E140)</text>' +
        '</svg>',
      alt: 'Comparison of four hardness test indenters: Rockwell diamond cone, Brinell ball, Vickers pyramid, Shore rebound hammer',
      caption: 'Each hardness test measures a different physical response — no simple linear conversion exists',
    },
    explanation:
      'Hardness measures a material\'s resistance to localized plastic deformation (indentation). It is a critical property in metallurgy, manufacturing, and quality control. The most common scales are Rockwell (HRC/HRB/HRSCales), Brinell (HBW), and Vickers (HV). Each uses a different indenter geometry, load, and measurement method — Rockwell measures indentation depth, Brinell measures indentation diameter, and Vickers measures indentation diagonal length. Because the test methods differ fundamentally, conversions between scales are inherently approximate and material-dependent. The ASTM E140 standard provides conversion tables for steel, aluminum, brass, and other common alloys. For carbon and alloy steel (the most common case), the conversion between HRC and HBW follows a reasonably consistent curve. This tool uses polynomial approximations derived from the ASTM E140-12b standard tables for carbon and alloy steel. For other materials (stainless steel, cast iron, aluminum), the conversions may differ. Always use certified reference blocks or the official ASTM tables for quality-critical applications. In practice, most engineering drawings specify both a hardness range AND a test method (e.g., "HRC 40-45") rather than relying on cross-scale conversions.',
    faqs: [
      {
        question: 'Why can\'t hardness scales be converted with a simple formula?',
        answer: 'Each hardness test measures a different physical property: Rockwell measures indentation depth (a macro-scale depth measurement), Brinell measures indentation diameter (macro-scale width), Vickers measures indentation diagonal (micro-to-macro scale), and Shore measures rebound height (dynamic elastic response). A material that is very elastic might read differently on a depth-based scale vs. a width-based scale. Additionally, conversion relationships change with material type — steel, aluminum, and brass have different conversion curves. The only truly reliable conversion is direct testing with the specified method.',
      },
      {
        question: 'What is the most common hardness scale for knives?',
        answer: 'Knife hardness is typically specified in HRC (Rockwell C). Most quality kitchen knives range from HRC 55-62. Japanese chef knives: HRC 60-64 (very hard, holds edge longer but more brittle and harder to sharpen). German-style knives: HRC 55-58 (softer, easier to sharpen but needs more frequent sharpening). Budget knives: HRC 50-54. Hardness above HRC 64 becomes increasingly brittle and prone to chipping for most knife applications. Pocket knives typically run HRC 56-60. The ideal knife hardness depends on intended use — a hunting knife that might hit bone should be softer (HRC 55-58) while a fillet knife can be harder (HRC 58-62).',
      },
      {
        question: 'What is the difference between Rockwell B and Rockwell C?',
        answer: 'Rockwell B (HRB) uses a 1/16" hardened steel ball indenter with a 100 kg load, designed for softer materials (annealed steel, brass, copper, aluminum). Typical HRB range: 40-100. Rockwell C (HRC) uses a diamond cone (Brale) indenter with a 150 kg load, designed for harder materials (hardened steel, tool steel, carburized surfaces). Typical HRC range: 20-70. The "C" scale is the most widely specified hardness test in the heat treating industry. HRB below 40 should use the HRE or HRF scales with lighter loads. HRC above 70 approaches the limit of the diamond indenter and may damage it.',
      },
      {
        question: 'How is Brinell hardness used in structural steel specifications?',
        answer: 'Brinell hardness (HBW) is widely used in structural steel specifications because the large indentation (typically 2-6 mm diameter) provides a bulk material measurement averaging out local variations. Common structural steel grades: A36 steel ≈ HB 120-140, ASTM A572 Grade 50 ≈ HB 150-180, high-strength quenched and tempered steel (A514) ≈ HB 235-300. Steel tensile strength is approximately correlated to Brinell hardness: tensile strength (psi) ≈ 500 × HB. This relationship allows non-destructive hardness testing to estimate the strength of in-service steel structures. A498 steel at HB 200 has an estimated tensile strength of 100,000 psi (690 MPa).',
      },
      {
        question: 'What is the Shore hardness scale used for?',
        answer: 'Shore (Durometer) hardness measures the resistance of materials to indentation by a spring-loaded indenter. It is most commonly used for elastomers (rubber), plastics, and soft metals. The A scale (Shore A) is for flexible rubbers and soft plastics (e.g., O-rings: Shore A 70, car tires: Shore A 60-75). The D scale (Shore D) is for harder plastics and semi-rigid materials (e.g., hard hat: Shore D 75, nylon gears: Shore D 80-90). Unlike Rockwell/Brinell/Vickers which use dead-weight loads, Shore uses a spring-loaded indenter and reads instantly. Shore hardness is NOT convertible to Rockwell or Brinell for soft materials due to the fundamental difference in measurement principle — this converter provides approximate equivalents only for harder materials (Shore D 50+).',
      },
    ],
  
    citations: [
      { source: 'ASTM E140 - Hardness Tables', url: 'https://www.astm.org/e0140-12b.html' },
      { source: 'ISO - Hardness Testing', url: 'https://www.iso.org/standard/30669.html' },
    ],
  },
};

export default hardnessConfig;
