import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ScientificNotationPanel from './ScientificNotationPanel';

function decimalToScientific(n: number): { coefficient: string; exponent: number; moves: number; direction: 'left' | 'right' } {
  if (n === 0) return { coefficient: '0', exponent: 0, moves: 0, direction: 'left' };

  const abs = Math.abs(n);
  const exp = Math.floor(Math.log10(abs));
  const coeff = abs / Math.pow(10, exp);
  const moves = Math.abs(exp);

  return {
    coefficient: (n < 0 ? -coeff : coeff).toFixed(6).replace(/\.?0+$/, ''),
    exponent: exp,
    moves,
    direction: exp >= 0 ? 'left' : 'right',
  };
}

const scientificNotationConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Conversion Direction',
      type: 'select',
      required: true,
      options: [
        { label: 'Decimal → Scientific Notation', value: 'toScientific' },
        { label: 'Scientific Notation → Decimal', value: 'toDecimal' },
      ],
    },
    {
      id: 'decimal',
      label: 'Decimal Number',
      type: 'text',
      placeholder: '0.0045',
      helpText: 'Enter a decimal number to convert to scientific notation',
    },
    {
      id: 'coefficient',
      label: 'Coefficient (a)',
      type: 'text',
      placeholder: '4.5',
      helpText: 'The coefficient in a × 10ⁿ',
    },
    {
      id: 'exponent',
      label: 'Exponent (n)',
      type: 'number',
      placeholder: '-3',
      helpText: 'The power of 10 exponent',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'toScientific';

    if (mode === 'toScientific') {
      const raw = values.decimal?.trim();
      if (!raw) return [];
      const num = parseFloat(raw.replace(/,/g, ''));
      if (isNaN(num)) return [];

      const { coefficient, exponent, moves, direction } = decimalToScientific(num);
      const sciStr = `${coefficient} × 10^${exponent}`;
      const eStr = `${coefficient}e${exponent}`;

      return [
        { id: 'scientific', label: 'Scientific Notation', value: sciStr, highlight: true, color: 'positive' },
        { id: 'eNotation', label: 'E Notation', value: eStr },
        { id: 'coefficient', label: 'Coefficient', value: coefficient },
        { id: 'exponent', label: 'Exponent', value: exponent.toString() },
        { id: 'moves', label: 'Decimal Moves', value: moves.toString() },
        { id: 'direction', label: 'Decimal Direction', value: direction === 'left' ? 'Moved left (large number)' : 'Moved right (small number)' },
        { id: '_animationData', label: 'Animation Data', value: JSON.stringify({ coefficient, exponent, moves, direction, original: raw, isNegative: num < 0 }) },
      ];
    }

    // toDecimal mode
    const coeff = values.coefficient?.trim();
    const exp = values.exponent?.trim();
    if (!coeff || !exp) return [];

    const c = parseFloat(coeff);
    const e = parseInt(exp);
    if (isNaN(c) || isNaN(e)) return [];

    const decimal = c * Math.pow(10, e);
    const fmt = Math.abs(decimal) > 1e15 || (Math.abs(decimal) < 1e-10 && decimal !== 0)
      ? decimal.toExponential(10)
      : parseFloat(decimal.toFixed(12)).toString();

    return [
      { id: 'decimal', label: 'Decimal Form', value: fmt, highlight: true, color: 'positive' },
      { id: 'scientific', label: 'Scientific Notation', value: `${coeff} × 10^${exp}` },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ScientificNotationPanel, { values, results });
  },
  educational: {
    formula: 'a × 10ⁿ  where 1 ≤ |a| < 10',
    formulaDescription:
      'Scientific notation expresses numbers as a coefficient between 1 and 10 multiplied by a power of 10. It is used to represent very large or very small numbers compactly. The exponent tells you how many places the decimal point moves: positive exponents for large numbers, negative exponents for small numbers.',
    variables: [
      { symbol: 'a', name: 'Coefficient', description: 'A number between 1 and 10 (or between -1 and -10 for negative numbers). Also called the significand or mantissa.' },
      { symbol: 'n', name: 'Exponent', description: 'The power of 10. Positive for large numbers (decimal moves left), negative for small numbers (decimal moves right).' },
      { symbol: '× 10ⁿ', name: 'Power of 10', description: 'Indicates the scale factor. Each increment of n multiplies the coefficient by 10.' },
    ],
    howToUse: [
      'Choose your conversion direction: decimal to scientific or scientific to decimal.',
      'For decimal to scientific: enter any number and view it in scientific notation, E notation, and with an animated decimal point movement.',
      'For scientific to decimal: enter the coefficient and exponent separately and view the standard decimal form.',
      'The "Decimal Moves" counter tells you exactly how many places the decimal point moved and in which direction.',
    ],
    explanation:
      'Scientific notation is a compact way to write very large or very small numbers. Instead of writing 6,022,140,760,000,000,000,000,000 (Avogadro\'s number), you write 6.022 × 10²³. The decimal point "jumps" left for large numbers (positive exponent) and right for small numbers (negative exponent). The coefficient is always between 1 and 10 (exclusive of 10). For example, 4,500 becomes 4.5 × 10³ — the decimal moved 3 places left. And 0.0045 becomes 4.5 × 10⁻³ — the decimal moved 3 places right. Zero is a special case expressed as 0 × 10⁰. E notation is a computer-friendly variant: 4.5e3 means 4.5 × 10³. Scientific notation is essential in physics (speed of light = 3 × 10⁸ m/s), chemistry (Avogadro\'s number = 6.022 × 10²³), astronomy (distance to Andromeda = 2.5 × 10⁶ light-years), and computer science (data sizes in bytes).',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="25" text-anchor="middle" fill="var(--svg-374151)" font-size="11" font-weight="bold">Large Number: 4,500</text><text x="110" y="50" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="13">4</text><text x="130" y="50" text-anchor="middle" fill="var(--svg-ef4444)" font-size="13">5</text><text x="150" y="50" text-anchor="middle" fill="var(--svg-ef4444)" font-size="13">0</text><text x="170" y="50" text-anchor="middle" fill="var(--svg-ef4444)" font-size="13">0</text><line x1="105" y1="55" x2="175" y2="55" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><line x1="120" y1="58" x2="120" y2="68" stroke="var(--svg-ef4444)" stroke-width="1"/><line x1="140" y1="58" x2="140" y2="68" stroke="var(--svg-ef4444)" stroke-width="1"/><line x1="160" y1="58" x2="160" y2="68" stroke="var(--svg-ef4444)" stroke-width="1"/><text x="160" y="82" text-anchor="middle" fill="var(--svg-059669)" font-size="13" font-weight="bold">4.5 &amp;times; 10&amp;sup3;</text><text x="160" y="97" text-anchor="middle" fill="var(--svg-6b7280)" font-size="10">Decimal moved 3 places left</text><line x1="30" y1="105" x2="290" y2="105" stroke="var(--svg-d1d5db)" stroke-width="1"/><text x="160" y="125" text-anchor="middle" fill="var(--svg-374151)" font-size="11" font-weight="bold">Small Number: 0.0045</text><text x="80" y="148" text-anchor="middle" fill="var(--svg-ef4444)" font-size="13">0</text><text x="98" y="148" text-anchor="middle" fill="var(--svg-ef4444)" font-size="13">.</text><text x="116" y="148" text-anchor="middle" fill="var(--svg-ef4444)" font-size="13">0</text><text x="134" y="148" text-anchor="middle" fill="var(--svg-ef4444)" font-size="13">0</text><text x="152" y="148" text-anchor="middle" fill="var(--svg-ef4444)" font-size="13">4</text><text x="170" y="148" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="13">5</text><line x1="74" y1="153" x2="176" y2="153" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><line x1="108" y1="156" x2="108" y2="166" stroke="var(--svg-ef4444)" stroke-width="1"/><line x1="126" y1="156" x2="126" y2="166" stroke="var(--svg-ef4444)" stroke-width="1"/><line x1="144" y1="156" x2="144" y2="166" stroke="var(--svg-ef4444)" stroke-width="1"/><text x="160" y="180" text-anchor="middle" fill="var(--svg-059669)" font-size="13" font-weight="bold">4.5 &amp;times; 10&amp;minus;&amp;sup3;</text><text x="160" y="195" text-anchor="middle" fill="var(--svg-6b7280)" font-size="10">Decimal moved 3 places right</text></svg>',
      alt: 'Scientific notation showing decimal point movement for large number 4,500 and small number 0.0045',
      caption: 'Scientific notation expresses numbers as a coefficient times a power of 10. The exponent shows how many places the decimal moves.',
    },
    faqs: [
      {
        question: 'How do I convert a decimal to scientific notation?',
        answer: 'Move the decimal point so there is exactly one non-zero digit to its left. Count how many places you moved it. If you moved left, the exponent is positive. If right, the exponent is negative. Example: 0.0045 → move decimal 3 places right → 4.5 × 10⁻³. The calculator shows this step with an animation.',
      },
      {
        question: 'How do I convert scientific notation to decimal?',
        answer: 'A positive exponent means move the decimal point right (making a larger number). A negative exponent means move it left (making a smaller number). Example: 4.5 × 10⁻³ → move decimal 3 places left → 0.0045. The number of places matches the absolute value of the exponent.',
      },
      {
        question: 'What is the difference between scientific notation and E notation?',
        answer: 'They are equivalent. E notation replaces "× 10ⁿ" with "e±n" for compact display, especially in calculators and programming. For example, 4.5 × 10⁻³ = 4.5e-3. Both mean 4.5 × 10⁻³ = 0.0045. The "e" stands for "exponent" and is not related to Euler\'s number.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Scientific Notation', url: 'https://en.wikipedia.org/wiki/Scientific_notation' },
      { source: 'NIST - Metric (SI) Prefixes', url: 'https://www.nist.gov/pml/owm/metric-si-prefixes' },
    ],
  },
};

export default scientificNotationConfig;
