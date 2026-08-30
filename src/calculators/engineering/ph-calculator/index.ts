import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import PHPanel from './PHPanel';

function formatConcentration(value: number): string {
  if (value === 0) return '0 M';
  const exp = value.toExponential(2);
  const parts = exp.split('e');
  const coefficient = parts[0];
  const exponent = parseInt(parts[1], 10);

  if (exponent === 0) return `${coefficient} M`;

  const superscripts: Record<string, string> = {
    '-': '⁻',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };

  const expStr = String(exponent);
  let expFormatted = '';
  for (const ch of expStr) {
    expFormatted += superscripts[ch] || ch;
  }

  return `${coefficient} × 10${expFormatted} M`;
}

function classifyPh(ph: number): string {
  if (ph === 7) return 'Neutral';
  if (ph < 3) return 'Acidic (Strong Acid)';
  if (ph < 7) return 'Acidic (Weak Acid)';
  if (ph <= 11) return 'Basic/Alkaline (Weak Base)';
  return 'Basic/Alkaline (Strong Base)';
}

const phCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Calculation Mode',
      type: 'select',
      required: true,
      helpText: 'Choose whether to convert pH to concentrations, or enter H+ or OH- concentration',
      options: [
        { label: 'pH → Concentrations', value: 'ph-to-conc' },
        { label: '[H⁺] → pH', value: 'h-to-ph' },
        { label: '[OH⁻] → pOH', value: 'oh-to-poh' },
      ],
    },
    {
      id: 'ph',
      label: 'pH Value',
      type: 'number',
      placeholder: 'e.g., 7.0',
      min: 0,
      max: 14,
      step: 0.01,
      helpText: 'Enter a pH value between 0 and 14.',
      showWhen: (values) => values.mode === 'ph-to-conc',
    },
    {
      id: 'hConcentration',
      label: 'H⁺ Concentration (M)',
      type: 'text',
      placeholder: 'e.g., 0.001 or 1e-5',
      min: 0,
      helpText: 'Enter the concentration of hydrogen ions in mol/L.',
      showWhen: (values) => values.mode === 'h-to-ph',
    },
    {
      id: 'ohConcentration',
      label: 'OH⁻ Concentration (M)',
      type: 'text',
      placeholder: 'e.g., 0.001 or 1e-5',
      min: 0,
      helpText: 'Enter the concentration of hydroxide ions in mol/L.',
      showWhen: (values) => values.mode === 'oh-to-poh',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'ph-to-conc';

    if (mode === 'ph-to-conc') {
      const ph = parseFloat(values.ph);
      if (isNaN(ph)) return [];
      if (ph < 0 || ph > 14) return [];

      const hConcentration = Math.pow(10, -ph);
      const poh = 14 - ph;
      const ohConcentration = Math.pow(10, -poh);

      return [
        { id: 'ph', label: 'pH', value: ph.toFixed(2), highlight: true, color: 'positive' },
        { id: 'poh', label: 'pOH', value: poh.toFixed(2) },
        { id: 'hConcentration', label: '[H⁺]', value: formatConcentration(hConcentration) },
        { id: 'ohConcentration', label: '[OH⁻]', value: formatConcentration(ohConcentration) },
        { id: 'classification', label: 'Classification', value: classifyPh(ph) },
        {
          id: 'temperatureNote',
          label: 'Note',
          value: 'Values at 25°C. pH + pOH = 14.00 at this temperature.',
        },
      ];
    }

    if (mode === 'h-to-ph') {
      const h = parseFloat(values.hConcentration);
      if (isNaN(h)) return [];
      if (h <= 0) return [];

      const ph = -Math.log10(h);
      const poh = 14 - ph;
      const ohConcentration = Math.pow(10, -poh);

      return [
        { id: 'ph', label: 'pH', value: ph.toFixed(2), highlight: true, color: 'positive' },
        { id: 'poh', label: 'pOH', value: poh.toFixed(2) },
        { id: 'hConcentration', label: '[H⁺]', value: formatConcentration(h) },
        { id: 'ohConcentration', label: '[OH⁻]', value: formatConcentration(ohConcentration) },
        { id: 'classification', label: 'Classification', value: classifyPh(ph) },
        {
          id: 'temperatureNote',
          label: 'Note',
          value: 'Values at 25°C. pH + pOH = 14.00 at this temperature.',
        },
      ];
    }

    if (mode === 'oh-to-poh') {
      const oh = parseFloat(values.ohConcentration);
      if (isNaN(oh)) return [];
      if (oh <= 0) return [];

      const poh = -Math.log10(oh);
      const ph = 14 - poh;
      const hConcentration = Math.pow(10, -ph);

      return [
        { id: 'poh', label: 'pOH', value: poh.toFixed(2), highlight: true, color: 'positive' },
        { id: 'ph', label: 'pH', value: ph.toFixed(2) },
        { id: 'ohConcentration', label: '[OH⁻]', value: formatConcentration(oh) },
        { id: 'hConcentration', label: '[H⁺]', value: formatConcentration(hConcentration) },
        { id: 'classification', label: 'Classification', value: classifyPh(ph) },
        {
          id: 'temperatureNote',
          label: 'Note',
          value: 'Values at 25°C. pH + pOH = 14.00 at this temperature.',
        },
      ];
    }

    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PHPanel, { values, results });
  },
  educational: {
    formula: 'pH = -log₁₀[H⁺], pOH = -log₁₀[OH⁻], pH + pOH = 14',
    formulaDescription:
      'The pH scale measures the acidity or basicity of an aqueous solution. pH is defined as the negative base-10 logarithm of the hydrogen ion concentration (in moles per liter). Similarly, pOH is the negative base-10 logarithm of the hydroxide ion concentration. At 25°C, the product of [H⁺] and [OH⁻] equals the ion product of water (K_w = 1.0 × 10⁻¹⁴), and pH + pOH = 14. This relationship allows you to calculate any one value if another is known, making it possible to fully characterize the acid-base status of a solution from a single measurement.',
    diagram: {
      svg: '<svg viewBox="0 0 600 100" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;font-family:Arial,sans-serif">\n  <defs>\n    <linearGradient id="phGrad" x1="0" y1="0" x2="1" y2="0">\n      <stop offset="0%" stop-color="#dc2626"/>\n      <stop offset="14%" stop-color="#f97316"/>\n      <stop offset="28%" stop-color="#eab308"/>\n      <stop offset="42%" stop-color="#84cc16"/>\n      <stop offset="50%" stop-color="#22c55e"/>\n      <stop offset="57%" stop-color="#22c55e"/>\n      <stop offset="71%" stop-color="#14b8a6"/>\n      <stop offset="85%" stop-color="#3b82f6"/>\n      <stop offset="100%" stop-color="#6366f1"/>\n    </linearGradient>\n  </defs>\n  <text x="300" y="15" text-anchor="middle" font-size="12" fill="var(--svg-444444)" font-weight="bold">pH SCALE</text>\n  <rect x="30" y="22" width="540" height="16" rx="8" ry="8" fill="url(#phGrad)"/>\n  <line x1="30" y1="38" x2="30" y2="48" stroke="var(--svg-333333)" stroke-width="1.5"/>\n  <text x="30" y="57" text-anchor="middle" font-size="10" fill="var(--svg-333333)" font-weight="bold">0</text>\n  <line x1="146" y1="38" x2="146" y2="45" stroke="var(--svg-666666)" stroke-width="1"/>\n  <text x="146" y="54" text-anchor="middle" font-size="8" fill="var(--svg-555555)">3</text>\n  <line x1="300" y1="38" x2="300" y2="48" stroke="var(--svg-333333)" stroke-width="1.5"/>\n  <text x="300" y="57" text-anchor="middle" font-size="10" fill="var(--svg-22c55e)" font-weight="bold">7</text>\n  <line x1="454" y1="38" x2="454" y2="45" stroke="var(--svg-666666)" stroke-width="1"/>\n  <text x="454" y="54" text-anchor="middle" font-size="8" fill="var(--svg-555555)">11</text>\n  <line x1="570" y1="38" x2="570" y2="48" stroke="var(--svg-333333)" stroke-width="1.5"/>\n  <text x="570" y="57" text-anchor="middle" font-size="10" fill="var(--svg-333333)" font-weight="bold">14</text>\n  <text x="55" y="19" text-anchor="middle" font-size="7" fill="var(--svg-dc2626)">Battery Acid</text>\n  <text x="120" y="19" text-anchor="middle" font-size="7" fill="var(--svg-ea580c)">Lemon Juice</text>\n  <text x="155" y="19" text-anchor="middle" font-size="7" fill="var(--svg-ca8a04)">Vinegar</text>\n  <text x="220" y="19" text-anchor="middle" font-size="7" fill="var(--svg-65a30d)">Coffee</text>\n  <text x="260" y="19" text-anchor="middle" font-size="7" fill="var(--svg-4d7c0f)">Milk</text>\n  <text x="300" y="73" text-anchor="middle" font-size="8" fill="var(--svg-22c55e)" font-weight="bold">Pure Water</text>\n  <text x="350" y="73" text-anchor="middle" font-size="7" fill="var(--svg-0d9488)">Baking Soda</text>\n  <text x="450" y="73" text-anchor="middle" font-size="7" fill="var(--svg-2563eb)">Ammonia</text>\n  <text x="515" y="73" text-anchor="middle" font-size="7" fill="var(--svg-7c3aed)">Bleach</text>\n  <text x="100" y="88" text-anchor="middle" font-size="9" fill="var(--svg-dc2626)" font-weight="bold">ACIDIC</text>\n  <text x="300" y="88" text-anchor="middle" font-size="9" fill="var(--svg-22c55e)" font-weight="bold">NEUTRAL</text>\n  <text x="500" y="88" text-anchor="middle" font-size="9" fill="var(--svg-6366f1)" font-weight="bold">BASIC</text>\n</svg>',
      alt: 'pH scale from 0 to 14 with a horizontal color gradient bar from red (acidic) through green (neutral at 7) to purple (basic), showing the positions of common substances',
      caption:
        'The pH scale from 0 (strong acid) to 14 (strong base), with 7 being neutral at 25°C. Common substances are shown at their approximate pH values: battery acid (0–1), lemon juice (2), vinegar (2.5), coffee (5), milk (6.5), pure water (7), baking soda (8.5), ammonia (11), and bleach (12.5).',
    },
    variables: [
      {
        symbol: 'pH',
        name: 'pH',
        description:
          'Negative base-10 logarithm of the hydrogen ion concentration. Ranges from 0 to 14 for most aqueous solutions. pH < 7 is acidic, pH = 7 is neutral, pH > 7 is basic.',
      },
      {
        symbol: 'pOH',
        name: 'pOH',
        description:
          'Negative base-10 logarithm of the hydroxide ion concentration. Related to pH by pH + pOH = 14 at 25°C. pOH < 7 indicates basicity, pOH > 7 indicates acidity.',
      },
      {
        symbol: '[H⁺]',
        name: 'Hydrogen Ion Concentration',
        description:
          'Concentration of hydrogen ions (hydronium ions) in moles per liter (M). Determines the acidity of a solution. Higher [H⁺] produces lower pH.',
      },
      {
        symbol: '[OH⁻]',
        name: 'Hydroxide Ion Concentration',
        description:
          'Concentration of hydroxide ions in moles per liter (M). Determines the basicity of a solution. Higher [OH⁻] produces lower pOH and higher pH.',
      },
      {
        symbol: 'K_w',
        name: 'Ion Product of Water',
        description:
          'The equilibrium constant for water autoionization (2H₂O ⇌ H₃O⁺ + OH⁻). K_w = [H⁺][OH⁻] = 1.0 × 10⁻¹⁴ at 25°C. This constant gives rise to the relationship pH + pOH = 14.',
      },
    ],
    howToUse: [
      'Select your calculation mode: convert pH to concentrations, or enter [H⁺] or [OH⁻] to find pH and pOH.',
      'Enter the known value — pH (0–14), hydrogen ion concentration [H⁺], or hydroxide ion concentration [OH⁻] — in the appropriate field.',
      'The calculator instantly computes all four values: pH, pOH, [H⁺], and [OH⁻], along with the acid-base classification.',
      'Read the classification result to understand whether the solution is acidic (strong or weak), neutral, or basic/alkaline (weak or strong).',
      'Note that all calculations assume a temperature of 25°C, where K_w = 1.0 × 10⁻¹⁴ and pH + pOH = 14.00.',
    ],
    explanation:
      'The pH scale is a logarithmic measure of hydrogen ion concentration in aqueous solutions, ranging from 0 to 14 for most practical purposes. A pH of 7 is neutral at 25°C, representing pure water where [H⁺] = [OH⁻] = 1.0 × 10⁻⁷ M. Values below 7 indicate acidic solutions with higher [H⁺] than [OH⁻], while values above 7 indicate basic (alkaline) solutions with higher [OH⁻] than [H⁺]. Because the pH scale is logarithmic, each whole pH unit represents a tenfold change in hydrogen ion concentration. For example, a solution with pH 3 has ten times the [H⁺] of a solution with pH 4, and one hundred times the [H⁺] of pH 5. The relationship between pH and pOH is governed by the ion product of water (K_w = [H⁺][OH⁻] = 1.0 × 10⁻¹⁴ at 25°C), which gives pH + pOH = 14. Understanding pH is essential in chemistry, biology, environmental science, and medicine — from monitoring blood pH (7.35–7.45) to controlling soil pH for agriculture and managing industrial wastewater treatment. The concept was introduced by Danish chemist Søren Peder Lauritz Sørensen in 1909 while studying enzyme activity at the Carlsberg Laboratory.',
    commonUses: [
      'Preparing buffer solutions and adjusting pH in chemistry labs, biology research, and pharmaceutical manufacturing',
      'Testing and adjusting soil pH for agriculture, gardening, and hydroponics to optimize plant nutrient uptake',
      'Monitoring water quality in aquariums, swimming pools, and aquaponics systems to maintain healthy conditions for aquatic life',
      'Verifying product pH in cosmetics, food production, and cleaning products to meet safety and quality standards',
    ],
    faqs: [
      {
        question: 'What is the range of the pH scale?',
        answer: 'The standard pH scale ranges from 0 to 14 at 25°C, though values outside this range are possible with highly concentrated solutions. A pH of 0 corresponds to [H⁺] = 1 M, while pH 14 corresponds to [OH⁻] = 1 M. Strong acids like concentrated HCl can produce negative pH values at concentrations above 1 M, and strong bases like concentrated NaOH can produce pH values above 14. The scale is open-ended but most practical measurements fall within 0–14.',
      },
      {
        question: 'Why is pH 7 considered neutral?',
        answer: 'pH 7 is neutral because at 25°C, pure water has equal concentrations of hydrogen and hydroxide ions: [H⁺] = [OH⁻] = 1.0 × 10⁻⁷ M. This balance arises from the autoionization of water (2H₂O ⇌ H₃O⁺ + OH⁻), where the equilibrium constant K_w = [H⁺][OH⁻] = 1.0 × 10⁻¹⁴ at 25°C. It is important to note that the neutral pH changes with temperature — at 100°C, neutral pH is about 6.14 because K_w increases as temperature rises.',
      },
      {
        question: 'Can pH be negative?',
        answer: 'Yes, pH can be negative for highly concentrated strong acid solutions. For example, a 2 M HCl solution has a theoretical pH of approximately −0.30 (since −log₁₀(2) ≈ −0.30). However, at such high concentrations, the assumptions of ideal dilute solutions break down and activity coefficients deviate from unity. The actual measured pH may therefore differ from the simple calculated value. Most everyday acidic solutions comfortably fall within the 0–14 range.',
      },
      {
        question: 'What are buffer solutions and how do they work?',
        answer: 'Buffer solutions resist significant changes in pH when small amounts of acid or base are added. They typically consist of a weak acid and its conjugate base (or a weak base and its conjugate acid) in comparable concentrations. Common examples include the bicarbonate buffer system in human blood (maintaining pH 7.35–7.45), acetate buffers (CH₃COOH/CH₃COO⁻) in biochemical laboratories, and phosphate buffers in biological research. The Henderson-Hasselbalch equation (pH = pKₐ + log([base]/[acid])) describes buffer behavior and is used to formulate buffer solutions at a target pH.',
      },
      {
        question: 'How does temperature affect pH measurements?',
        answer: 'Temperature significantly affects pH because the ion product of water (K_w) changes with temperature. As temperature increases, K_w increases, shifting the neutral pH point. At 0°C, neutral pH is approximately 7.47; at 25°C, it is exactly 7.00; and at 100°C, it drops to approximately 6.14. The actual hydrogen ion concentration may remain constant, but the neutral reference point shifts. Modern pH meters include automatic temperature compensation (ATC) to provide accurate readings across different temperatures. Always note the temperature when reporting pH values for scientific work.',
      },
    ],
    citations: [
      { source: 'Wikipedia', title: 'pH', url: 'https://en.wikipedia.org/wiki/PH' },

    ],
  },
};

export default phCalculatorConfig;
