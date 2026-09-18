import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import PhPanel from './PhPanel';

function getClassification(pH: number): string {
  if (pH < 0 || pH > 14) return 'Invalid';
  if (pH < 3) return 'Strong acid';
  if (pH < 7) return 'Weak acid';
  if (pH === 7) return 'Neutral';
  if (pH < 11) return 'Weak base';
  return 'Strong base';
}

// Boundaries mirror getClassification() exactly — using a different
// operator (<=) here previously put pH 3.00 in "Weak acid" (Strong acid
// uses < 3) but colored it Red (the strong-acid color), and pH 11.00 in
// "Strong base" but colored it Blue (the weak-base color).
function getIndicatorColor(pH: number): string {
  if (pH < 0 || pH > 14) return 'Invalid';
  if (pH < 3) return 'Red';
  if (pH < 7) return 'Orange/Yellow';
  if (pH === 7) return 'Green';
  if (pH < 11) return 'Blue';
  return 'Purple';
}

function formatScientificNotation(n: number): string {
  if (n === 0) return '0';
  if (n >= 0.001 && n <= 999999) {
    // Use standard decimal format for moderate numbers
    return n.toLocaleString(undefined, { maximumSignificantDigits: 4 });
  }
  return n.toExponential(4);
}

const config: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Conversion Mode',
      type: 'select',
      options: [
        { label: '[H⁺] → pH', value: 'h-to-ph' },
        { label: 'pH → [H⁺]', value: 'ph-to-h' },
        { label: 'pOH → pH', value: 'poh-to-ph' },
        { label: 'pH → pOH', value: 'ph-to-poh' },
      ],
      helpText: 'Select the conversion direction for the calculation',
    },
    {
      id: 'hconcentration',
      label: 'Hydrogen Ion Concentration [H⁺] (mol/L)',
      type: 'number',
      placeholder: 'e.g. 0.0001 or 1e-7',
      showWhen: (v) => v.mode === 'h-to-ph',
      helpText: 'Enter the hydrogen ion concentration in mol/L',
    },
    {
      id: 'phInput',
      label: 'pH Value',
      type: 'number',
      placeholder: '0–14',
      step: 0.01,
      showWhen: (v) => v.mode === 'ph-to-h' || v.mode === 'ph-to-poh',
      helpText: 'Enter a pH value between 0 and 14',
    },
    {
      id: 'pohInput',
      label: 'pOH Value',
      type: 'number',
      placeholder: '0–14',
      step: 0.01,
      showWhen: (v) => v.mode === 'poh-to-ph',
      helpText: 'Enter a pOH value between 0 and 14',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'h-to-ph';

    let pH: number;
    let pOH: number;
    let hConcentration: number;

    if (mode === 'h-to-ph') {
      const hConc = parseFloat(values.hconcentration);
      if (isNaN(hConc)) return [];
      if (hConc <= 0) return [];

      pH = -Math.log10(hConc);
      pOH = 14 - pH;
      hConcentration = hConc;
    } else if (mode === 'ph-to-h') {
      const phVal = parseFloat(values.phInput);
      if (isNaN(phVal)) return [];
      if (phVal < 0 || phVal > 14) return [];

      pH = phVal;
      pOH = 14 - pH;
      hConcentration = Math.pow(10, -pH);
    } else if (mode === 'poh-to-ph') {
      const pohVal = parseFloat(values.pohInput);
      if (isNaN(pohVal)) return [];
      if (pohVal < 0 || pohVal > 14) return [];

      pOH = pohVal;
      pH = 14 - pOH;
      hConcentration = Math.pow(10, -pH);
    } else if (mode === 'ph-to-poh') {
      const phVal = parseFloat(values.phInput);
      if (isNaN(phVal)) return [];
      if (phVal < 0 || phVal > 14) return [];

      pH = phVal;
      pOH = 14 - pH;
      hConcentration = Math.pow(10, -pH);
    } else {
      return [];
    }

    const classification = getClassification(pH);
    const hColor = getIndicatorColor(pH);

    return [
      {
        id: 'phValue',
        label: 'pH',
        value: pH.toFixed(2),
        highlight: true,
        color: pH < 7 ? 'negative' : pH === 7 ? 'neutral' : 'positive',
      },
      {
        id: 'pohValue',
        label: 'pOH',
        value: pOH.toFixed(2),
      },
      {
        id: 'hConcentration',
        label: '[H⁺] Concentration (mol/L)',
        value: formatScientificNotation(hConcentration),
      },
      {
        id: 'classification',
        label: 'Classification',
        value: classification,
      },
      {
        id: 'hColor',
        label: 'Universal Indicator Color',
        value: hColor,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PhPanel, { values, results });
  },
  educational: {
    formula:
      'pH = −log₁₀[H⁺] | [H⁺] = 10^(−pH) | pOH = 14 − pH | Kw = [H⁺][OH⁻] = 1 × 10^(−14) at 25°C',
    formulaDescription:
      'The pH scale is a logarithmic measure of hydrogen ion concentration in aqueous solutions. Because the scale is logarithmic, each whole pH value represents a tenfold difference in H⁺ concentration. The relationship pH + pOH = 14 (at 25°C) arises from the autoionization of water, where the ion product Kw = [H⁺][OH⁻] equals 1.0 × 10⁻¹⁴. Understanding these relationships allows chemists and students to interconvert between pH, pOH, and hydrogen ion concentration for any aqueous solution at standard temperature.',
    variables: [
      {
        symbol: 'pH',
        name: 'Potential of Hydrogen',
        description:
          'A logarithmic scale from 0 to 14 measuring the acidity or basicity of an aqueous solution. pH < 7 is acidic, pH = 7 is neutral at 25°C, and pH > 7 is basic (alkaline).',
      },
      {
        symbol: 'pOH',
        name: 'Potential of Hydroxide',
        description:
          'The negative logarithm of the hydroxide ion concentration. At 25°C, pOH = 14 − pH. A lower pOH means a more basic (alkaline) solution.',
      },
      {
        symbol: '[H⁺]',
        name: 'Hydrogen Ion Concentration',
        description:
          'The molar concentration of hydrogen ions in solution, measured in moles per liter (mol/L or M). For pure water at 25°C, [H⁺] = 1.0 × 10⁻⁷ M. Concentrations span many orders of magnitude across the pH scale.',
      },
      {
        symbol: 'Kw',
        name: 'Ion Product of Water',
        description:
          'The equilibrium constant for the autoionization of water: H₂O ⇌ H⁺ + OH⁻. At 25°C, Kw = 1.0 × 10⁻¹⁴ [mol²/L²]. This value is temperature-dependent and increases at higher temperatures.',
      },
      {
        symbol: 'Indicator',
        name: 'Universal Indicator',
        description:
          'A mixture of pH-sensitive dyes that changes color across the pH spectrum. Universal indicator transitions from red (strong acid) through orange, yellow, green, blue, to purple (strong base), providing a visual estimate of solution pH.',
      },
    ],
    howToUse: [
      'Select the conversion mode from the dropdown: convert [H⁺] to pH, pH to [H⁺], pOH to pH, or pH to pOH.',
      'Enter the known value in the appropriate field. For hydrogen ion concentration, use decimal notation (e.g., 0.0001) or scientific notation (e.g., 1e-7). For pH and pOH, enter values between 0 and 14.',
      'The calculator displays the corresponding pH, pOH, hydrogen ion concentration, solution classification (strong acid through strong base), and the universal indicator color.',
      'Use this tool for chemistry homework, lab work, or any application requiring pH calculations. Note that the pH + pOH = 14 relationship is valid at 25°C and varies at other temperatures.',
    ],
    quickReference: [
      { label: 'Stomach acid', value: 'pH 1.5–3.5 / Strong acid / Red' },
      { label: 'Lemon juice', value: 'pH ~2.2 / Strong acid' },
      { label: 'Pure water (25°C)', value: 'pH 7.0 / Neutral / Green' },
      { label: 'Blood', value: 'pH 7.35–7.45 / Weak base' },
      { label: 'Seawater', value: 'pH ~8.1 / Weak base / Blue' },
      { label: 'Bleach', value: 'pH ~12.5 / Strong base / Purple' },
    ],
    commonUses: [
      'Chemistry education: understanding the logarithmic nature of the pH scale and practicing interconversion between pH, pOH, and hydrogen ion concentration',
      'Laboratory analysis: calculating solution pH from measured H⁺ concentrations in titrations, buffer preparation, and quality control',
      'Environmental monitoring: assessing water quality in lakes, rivers, and aquariums where pH affects aquatic life health',
      'Agriculture: testing soil pH to determine optimal crop conditions and calculating the amount of lime or sulfur needed for pH adjustment',
      'Biology and medicine: understanding blood pH regulation (acid-base homeostasis) and preparing buffer solutions for cell culture and biochemical assays',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 560 360" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="280" y="22" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">The pH Scale — Acidic, Neutral, and Basic</text>' +
        '<text x="280" y="40" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Logarithmic scale showing pH values, indicator colors, and example substances</text>' +
        '<rect x="20" y="55" width="520" height="280" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1"/>' +
        '<!-- pH scale bar gradient segments -->' +
        '<rect x="40" y="80" width="38" height="30" rx="3" fill="var(--svg-ef4444)"/><text x="59" y="98" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">0</text>' +
        '<rect x="78" y="80" width="38" height="30" rx="3" fill="var(--svg-ef4444)" opacity="0.8"/><text x="97" y="98" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">1</text>' +
        '<rect x="116" y="80" width="38" height="30" rx="3" fill="var(--svg-ef4444)" opacity="0.6"/><text x="135" y="98" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">2</text>' +
        '<rect x="154" y="80" width="38" height="30" rx="3" fill="var(--svg-f97316)"/><text x="173" y="98" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">3</text>' +
        '<rect x="192" y="80" width="38" height="30" rx="3" fill="var(--svg-eab308)"/><text x="211" y="98" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">4</text>' +
        '<rect x="230" y="80" width="38" height="30" rx="3" fill="var(--svg-eab308)" opacity="0.7"/><text x="249" y="98" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">5</text>' +
        '<rect x="268" y="80" width="38" height="30" rx="3" fill="var(--svg-84cc16)"/><text x="287" y="98" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">6</text>' +
        '<rect x="306" y="80" width="38" height="30" rx="3" fill="var(--svg-22c55e)"/><text x="325" y="98" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">7</text>' +
        '<rect x="344" y="80" width="38" height="30" rx="3" fill="var(--svg-3b82f6)"/><text x="363" y="98" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">8</text>' +
        '<rect x="382" y="80" width="38" height="30" rx="3" fill="var(--svg-2563eb)"/><text x="401" y="98" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">9</text>' +
        '<rect x="420" y="80" width="38" height="30" rx="3" fill="var(--svg-2563eb)" opacity="0.8"/><text x="439" y="98" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">10</text>' +
        '<rect x="458" y="80" width="38" height="30" rx="3" fill="var(--svg-8b5cf6)"/><text x="477" y="98" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">11</text>' +
        '<rect x="40" y="110" width="38" height="30" rx="3" fill="var(--svg-8b5cf6)" opacity="0.8"/><text x="59" y="128" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">12</text>' +
        '<rect x="78" y="110" width="38" height="30" rx="3" fill="var(--svg-a855f7)"/><text x="97" y="128" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">13</text>' +
        '<rect x="116" y="110" width="38" height="30" rx="3" fill="var(--svg-a855f7)" opacity="0.8"/><text x="135" y="128" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-ffffff)" font-weight="700" text-anchor="middle">14</text>' +
        '<!-- Classification labels -->' +
        '<text x="130" y="165" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-ef4444)" font-weight="700" text-anchor="middle">Strong Acid</text>' +
        '<text x="230" y="165" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-eab308)" font-weight="700" text-anchor="middle">Weak Acid</text>' +
        '<text x="325" y="165" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-22c55e)" font-weight="700" text-anchor="middle">Neutral</text>' +
        '<text x="410" y="165" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-3b82f6)" font-weight="700" text-anchor="middle">Weak Base</text>' +
        '<text x="490" y="165" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-8b5cf6)" font-weight="700" text-anchor="middle">Strong Base</text>' +
        '<!-- Brackets -->' +
        '<line x1="50" y1="175" x2="210" y2="175" stroke="var(--svg-ef4444)" stroke-width="2"/><line x1="50" y1="155" x2="50" y2="175" stroke="var(--svg-ef4444)" stroke-width="2"/><line x1="210" y1="155" x2="210" y2="175" stroke="var(--svg-ef4444)" stroke-width="2"/>' +
        '<line x1="210" y1="175" x2="320" y2="175" stroke="var(--svg-eab308)" stroke-width="2"/><line x1="210" y1="155" x2="210" y2="175" stroke="var(--svg-eab308)" stroke-width="2"/><line x1="320" y1="155" x2="320" y2="175" stroke="var(--svg-eab308)" stroke-width="2"/>' +
        '<line x1="320" y1="175" x2="390" y2="175" stroke="var(--svg-22c55e)" stroke-width="2"/><line x1="320" y1="155" x2="320" y2="175" stroke="var(--svg-22c55e)" stroke-width="2"/><line x1="390" y1="155" x2="390" y2="175" stroke="var(--svg-22c55e)" stroke-width="2"/>' +
        '<line x1="390" y1="175" x2="500" y2="175" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="390" y1="155" x2="390" y2="175" stroke="var(--svg-3b82f6)" stroke-width="2"/><line x1="500" y1="155" x2="500" y2="175" stroke="var(--svg-3b82f6)" stroke-width="2"/>' +
        '<!-- Example substances -->' +
        '<text x="80" y="210" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Battery acid</text>' +
        '<text x="140" y="225" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Lemon juice</text>' +
        '<text x="210" y="240" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Vinegar</text>' +
        '<text x="260" y="255" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Coffee</text>' +
        '<text x="325" y="270" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Pure water</text>' +
        '<text x="390" y="255" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Baking soda</text>' +
        '<text x="450" y="240" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Ammonia</text>' +
        '<text x="500" y="225" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Bleach</text>' +
        '<!-- Arrows from examples to scale -->' +
        '<line x1="80" y1="212" x2="65" y2="140" stroke="var(--svg-94a3b8)" stroke-width="0.5" stroke-dasharray="2,1"/>' +
        '<line x1="140" y1="227" x2="120" y2="140" stroke="var(--svg-94a3b8)" stroke-width="0.5" stroke-dasharray="2,1"/>' +
        '<line x1="210" y1="242" x2="210" y2="140" stroke="var(--svg-94a3b8)" stroke-width="0.5" stroke-dasharray="2,1"/>' +
        '<line x1="260" y1="257" x2="268" y2="140" stroke="var(--svg-94a3b8)" stroke-width="0.5" stroke-dasharray="2,1"/>' +
        '<line x1="325" y1="272" x2="325" y2="140" stroke="var(--svg-94a3b8)" stroke-width="0.5" stroke-dasharray="2,1"/>' +
        '<line x1="390" y1="257" x2="383" y2="140" stroke="var(--svg-94a3b8)" stroke-width="0.5" stroke-dasharray="2,1"/>' +
        '<line x1="450" y1="242" x2="468" y2="140" stroke="var(--svg-94a3b8)" stroke-width="0.5" stroke-dasharray="2,1"/>' +
        '<line x1="500" y1="227" x2="515" y2="140" stroke="var(--svg-94a3b8)" stroke-width="0.5" stroke-dasharray="2,1"/>' +
        '<!-- Kw note -->' +
        '<text x="280" y="310" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">Kw = [H⁺][OH⁻] = 1.0 × 10⁻¹⁴ at 25°C  |  pH + pOH = 14</text>' +
        '</svg>',
      alt: 'The pH scale from 0 to 14 showing color gradient from red to purple with example substances and classification labels for strong acid, weak acid, neutral, weak base, and strong base',
      caption:
        'The pH scale is logarithmic — each unit represents a tenfold change in hydrogen ion concentration. Universal indicator colors change progressively across the scale.',
    },
    explanation:
      'The pH scale is one of the most important concepts in chemistry, providing a quantitative measure of the acidity or basicity of an aqueous solution. The term pH stands for "potential of hydrogen" and is defined as the negative base-10 logarithm of the hydrogen ion concentration: pH = -log₁₀[H⁺]. This means that a solution with pH 3 has a hydrogen ion concentration 10 times greater than a solution with pH 4, and 100 times greater than pH 5. The logarithmic nature of the scale is essential because hydrogen ion concentrations in real solutions span over 14 orders of magnitude — from about 1 M (mol/L) for a strong acid to about 10⁻¹⁴ M for a strong base. The pH scale typically runs from 0 to 14, though it is possible to have pH values outside this range for extremely concentrated acids or bases. The scale is centered at pH 7, which is neutral — the pH of pure water at 25°C. This neutrality arises from the autoionization of water: H₂O ⇌ H⁺ + OH⁻. The equilibrium constant for this reaction, Kw = [H⁺][OH⁻] = 1.0 × 10⁻¹⁴ at 25°C, means that in pure water, [H⁺] = [OH⁻] = 1.0 × 10⁻⁷ M, giving pH = pOH = 7. This relationship also leads to the useful identity pH + pOH = 14 at standard temperature. It is important to note that Kw is temperature-dependent — at 100°C, Kw is about 5.5 × 10⁻¹³, making neutral pH approximately 6.14. In biological systems, pH is tightly regulated; human blood maintains a pH between 7.35 and 7.45, and deviations beyond 6.8 or 7.8 are typically fatal. Universal indicator solutions or pH paper provide a visual estimation by changing color based on the pH, transitioning from red (pH 0-3, strong acid) through orange and yellow (pH 3-6, weak acid), green (pH 7, neutral), blue (pH 8-11, weak base), to purple (pH 11-14, strong base). Understanding pH is fundamental to fields ranging from medicine and biology to environmental science, agriculture, and industrial chemistry.',
    faqs: [
      {
        question: 'Why is the pH scale logarithmic rather than linear?',
        answer:
          'The pH scale is logarithmic because hydrogen ion concentrations in aqueous solutions span an enormous range of about 14 orders of magnitude (from ~1 M to ~10⁻¹⁴ M). A linear scale would be impractical — the differences between most everyday solutions would be invisible. By taking the negative logarithm, the scale compresses this wide range into convenient numbers from 0 to 14. Each pH unit represents a tenfold change in [H⁺], so a solution at pH 3 is 1,000 times more acidic than a solution at pH 6. This logarithmic approach is also used in other scientific scales such as the Richter scale for earthquakes and the decibel scale for sound intensity.',
      },
      {
        question: 'Does temperature affect pH measurements?',
        answer:
          'Yes, temperature significantly affects pH measurements because the autoionization constant of water (Kw) changes with temperature. At 25°C, Kw = 1.0 × 10⁻¹⁴ and neutral pH is 7.00. At 0°C, Kw ≈ 1.14 × 10⁻¹⁵, making neutral pH ≈ 7.47. At 100°C, Kw ≈ 5.5 × 10⁻¹³, making neutral pH ≈ 6.14. This means a solution that is perfectly neutral can have a different pH value at a different temperature. pH meters automatically compensate for this effect when they include temperature sensing. When performing pH calculations at non-standard temperatures, the relationship pH + pOH = pKw (where pKw = -log₁₀(Kw)) should be used instead of the 14 constant.',
      },
      {
        question: 'What is the difference between a strong acid and a weak acid?',
        answer:
          'A strong acid (such as hydrochloric acid HCl or sulfuric acid H₂SO₄) dissociates completely in water, meaning every acid molecule donates its proton to form H⁺ ions. A weak acid (such as acetic acid CH₃COOH or carbonic acid H₂CO₃) only partially dissociates, establishing an equilibrium between the undissociated acid and its ions. The strength of an acid is measured by its acid dissociation constant Ka — a larger Ka means stronger acid. Importantly, acid strength is different from acidity (pH). A weak acid can have a low pH if it is very concentrated, and a strong acid can have a near-neutral pH if it is extremely dilute.',
      },
      {
        question: 'What does universal indicator measure and how does it work?',
        answer:
          'Universal indicator is a mixture of several pH-sensitive dye compounds (typically including thymol blue, methyl red, bromothymol blue, and phenolphthalein) that produce a continuous color change across the pH range. Each dye changes color at a different pH transition point, and the combination produces a spectrum from red (pH 0-3) through orange, yellow, green, blue, and finally purple (pH 11-14). Universal indicator is commonly used in chemistry education and environmental testing to quickly estimate the pH of a solution without electronic equipment. For precise measurements, a pH meter or narrower-range indicator is preferred.',
      },
      {
        question: 'Can pH be less than 0 or greater than 14?',
        answer:
          'Yes, pH can be less than 0 or greater than 14 in extreme cases, although the standard 0-14 scale covers most practical scenarios. A pH below 0 occurs for very concentrated strong acid solutions (e.g., 2 M HCl has pH ≈ -0.3). Similarly, highly concentrated strong base solutions can exceed pH 14 (e.g., 2 M NaOH has pH ≈ 14.3). However, such extreme concentrations are rare in everyday contexts and typically only appear in industrial chemistry or specialized laboratory settings. The pH scale is theoretically unbounded, but the 0-14 range covers over 99% of common solutions.',
      },
    ],
    citations: [
      {
        source: 'Wikipedia - pH',
        url: 'https://en.wikipedia.org/wiki/PH',
      },
      {
        source: 'Khan Academy - pH, pOH, and the pH scale',
        url: 'https://www.khanacademy.org/science/chemistry/acids-and-bases-topic/acids-and-bases/a/ph-poh-and-the-ph-scale',
      },
    ],
  },
};

export default config;
