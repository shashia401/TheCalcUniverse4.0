import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import FractionToDecimalPanel from './FractionToDecimalPanel';
import { computeF2d, describeDecimal, nearestSimpleFraction, percentOf } from './f2dMath';
import { subFrac } from '../../../utils/rational';

// Exact BigInt rational arithmetic (src/utils/rational.ts): the decimal typed in "Decimal -> Fraction" is
// read digit-for-digit (0.1 is exactly 1/10), and a fraction's decimal is produced by long division so the
// repeating block and its period are exact.

const fractionToDecimalConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Convert',
      type: 'select',
      required: true,
      options: [
        { label: 'Fraction → Decimal', value: 'ftod' },
        { label: 'Decimal → Fraction', value: 'dtof' },
        { label: 'Mixed Number → Decimal', value: 'mixed' },
      ],
    },
    {
      id: 'wholeNumber',
      label: 'Whole Number (mixed numbers only)',
      type: 'number',
      placeholder: '3',
      step: 1,
      inputMode: 'numeric',
      helpText: 'The integer part of a mixed number (e.g., the 3 in 3½). Put the minus sign here: −2 3/4 means −(2 + 3/4).',
      showWhen: (v) => v.mode === 'mixed',
    },
    {
      id: 'numerator',
      label: 'Numerator',
      type: 'number',
      placeholder: '3',
      step: 1,
      helpText: 'The top number of the fraction',
      showWhen: (v) => v.mode !== 'dtof',
    },
    {
      id: 'denominator',
      label: 'Denominator',
      type: 'number',
      placeholder: '4',
      step: 1,
      min: 1,
      helpText: 'The bottom number of the fraction',
      showWhen: (v) => v.mode !== 'dtof',
    },
    {
      id: 'decimal',
      label: 'Decimal',
      type: 'number',
      placeholder: '0.75',
      step: 0.0001,
      inputMode: 'decimal',
      helpText: 'For decimal → fraction conversion. Read exactly as typed (0.333333 is 333333/1000000).',
      showWhen: (v) => v.mode === 'dtof',
    },
  ],
  calculate: (values): CalculatorResult[] => {
    const out = computeF2d(values);
    if (out.kind === 'incomplete') return [];
    if (out.kind === 'invalid') return [{ id: 'error', label: 'Error', value: out.message, color: 'negative' }];
    const { mode, frac, improper } = out.comp;
    const dec = describeDecimal(frac);
    const rows: CalculatorResult[] = [];

    if (mode === 'dtof') {
      rows.push({ id: 'fraction', label: 'Fraction', value: `${frac.n}/${frac.d}`, highlight: true, color: 'positive' });
      if (frac.d > 1000n) {
        const near = nearestSimpleFraction(frac, 1000n);
        // only suggest it when it is a genuinely close match (relative error below 1e-5): 0.333333 -> 1/3, but never 0.000125 -> 0
        const diff = subFrac(near, frac);
        const close = near.n !== 0n && (diff.n < 0n ? -diff.n : diff.n) * 100000n * frac.d < (frac.n < 0n ? -frac.n : frac.n) * diff.d;
        if (close && (near.n !== frac.n || near.d !== frac.d)) {
          rows.push({
            id: 'nearestFraction',
            label: 'Nearest simple fraction (denominator up to 1000)',
            value: `${near.n}/${near.d}`,
            color: 'neutral',
          });
        }
      }
      if (frac.d !== 1n && (frac.n < 0n ? -frac.n : frac.n) > frac.d) {
        const abs = frac.n < 0n ? -frac.n : frac.n;
        rows.push({ id: 'mixedNumber', label: 'As a Mixed Number', value: `${frac.n < 0n ? '-' : ''}${abs / frac.d} ${abs % frac.d}/${frac.d}`, color: 'neutral' });
      }
      rows.push({ id: 'percentage', label: 'As Percentage', value: percentOf(frac), color: 'neutral' });
      return rows;
    }

    rows.push({ id: 'decimal', label: 'Decimal', value: dec.rounded, highlight: true, color: 'positive' });
    if (dec.exact !== dec.rounded) {
      rows.push({
        id: 'exactDecimal',
        label: dec.terminating ? 'Exact decimal' : 'Exact decimal (repeating digits in brackets)',
        value: dec.exact,
        color: 'neutral',
      });
    }
    rows.push({
      id: 'decimalType',
      label: 'Decimal type',
      value: dec.terminating
        ? 'Terminating'
        : dec.truncated
          ? 'Repeating (period longer than 2000 digits)'
          : `Repeating, period ${dec.period}`,
      color: 'neutral',
    });
    rows.push({ id: 'percentage', label: 'As Percentage', value: percentOf(frac), color: 'neutral' });
    if (mode === 'mixed' && improper) {
      rows.push({ id: 'improper', label: 'Improper Fraction', value: `${improper.n}/${improper.d}`, color: 'neutral' });
    }
    rows.push({ id: 'simplified', label: 'Simplified Fraction', value: `${frac.n}/${frac.d}`, color: 'neutral' });
    return rows;
  },

  extraPanel: (values, results) => {
    if (!results.length || results[0].id === 'error') return null;
    return createElement(FractionToDecimalPanel, { values, results });
  },

  educational: {
    formula: 'Fraction → Decimal: Numerator ÷ Denominator | Decimal → Fraction: multiply by 10^n / 10^n, simplify',
    formulaDescription:
      'Converting between fractions and decimals uses basic division and the greatest common divisor (GCD) for simplification. The process is reversible: every fraction corresponds to exactly one decimal value, and every terminating decimal corresponds to a unique simplified fraction. The key insight is that fractions are division problems waiting to be solved, and decimals are fractions written in base-10 positional notation.',
    variables: [
      { symbol: 'GCD', name: 'Greatest Common Divisor', description: 'The largest number that divides both the numerator and denominator evenly, used to simplify fractions. For example, GCD(12, 16) = 4, so 12/16 = 3/4.' },
      { symbol: 'Numerator', name: 'Numerator', description: 'The top number in a fraction. Represents how many parts of the whole you have.' },
      { symbol: 'Denominator', name: 'Denominator', description: 'The bottom number in a fraction. Represents how many equal parts the whole is divided into. Must be non-zero.' },
    ],
    howToUse: [
      'Select the conversion direction from the dropdown: Fraction to Decimal, Decimal to Fraction, or Mixed Number to Decimal.',
      'For fraction-to-decimal: enter the numerator (top) and denominator (bottom). The result is simply numerator divided by denominator.',
      'For decimal-to-fraction: enter the decimal value. The calculator multiplies by a power of 10 to clear decimal places, then simplifies using the GCD.',
      'For mixed numbers: enter the whole number along with the fractional part. The calculator converts to an improper fraction first, then to a decimal.',
      'Check the "As Percentage" column to see the decimal expressed as a percentage (multiplied by 100).',
    ],
    explanation:
      'Fraction-to-decimal conversion is one of the most fundamental operations in mathematics. Any fraction can be converted to a decimal by dividing the numerator by the denominator. Some fractions produce terminating decimals (1/4 = 0.25) because their denominator has only prime factors of 2 and 5. Others produce repeating decimals (1/3 = 0.333...) when the denominator has other prime factors. Converting decimals back to fractions requires multiplying by a power of 10 to clear the decimal, then simplifying using the GCD. For example, 0.75 = 75/100 = 3/4 after simplification. A practical tip: common fractions like 1/2 = 0.5, 1/4 = 0.25, and 3/4 = 0.75 appear so frequently in daily life that memorizing them saves time. In carpentry, measurements are given in fractional inches (1/16, 1/8, 1/4) but digital tools often require decimal input, making this conversion essential on job sites. Similarly, in cooking, recipes use fractional cups but nutritional calculations use decimal values.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect x="30" y="20" width="260" height="35" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="4"/><text x="160" y="37" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="11" font-weight="bold">Fraction Bars</text><text x="160" y="50" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="9">(shaded = numerator)</text><rect x="30" y="65" width="200" height="20" fill="var(--svg-e5e7eb)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="3"/><rect x="30" y="65" width="100" height="20" fill="var(--svg-3b82f6)" rx="3"/><text x="245" y="80" text-anchor="start" fill="var(--svg-1e3a5f)" font-size="11">1/2 = 0.5</text><rect x="30" y="90" width="200" height="20" fill="var(--svg-e5e7eb)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="3"/><rect x="30" y="90" width="50" height="20" fill="var(--svg-3b82f6)" rx="3"/><text x="245" y="105" text-anchor="start" fill="var(--svg-1e3a5f)" font-size="11">1/4 = 0.25</text><rect x="30" y="115" width="200" height="20" fill="var(--svg-e5e7eb)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="3"/><rect x="30" y="115" width="150" height="20" fill="var(--svg-3b82f6)" rx="3"/><text x="245" y="130" text-anchor="start" fill="var(--svg-1e3a5f)" font-size="11">3/4 = 0.75</text><rect x="30" y="140" width="200" height="20" fill="var(--svg-e5e7eb)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="3"/><rect x="30" y="140" width="67" height="20" fill="var(--svg-ef4444)" rx="3"/><text x="245" y="155" text-anchor="start" fill="var(--svg-991b1b)" font-size="11">1/3 = 0.333...</text><text x="160" y="183" text-anchor="middle" fill="var(--svg-6b7280)" font-size="10">Decimal = Numerator &amp;divide; Denominator</text><text x="160" y="197" text-anchor="middle" fill="var(--svg-9ca3af)" font-size="9">Reverse: multiply by 10&amp;circ;n, then simplify by GCD</text></svg>',
      alt: 'Fraction bars showing 1/2, 1/4, 3/4, and 1/3 with their decimal equivalents',
      caption: 'Fractions represent parts of a whole; dividing numerator by denominator gives the decimal equivalent.',
    },
    faqs: [
      {
        question: 'What is a repeating decimal?',
        answer: 'A decimal that repeats a pattern infinitely, like 0.333... (1/3) or 0.142857142857... (1/7). These fractions have denominators with prime factors other than 2 or 5. The repeating pattern is called the repetend and is often written with a vinculum (bar) over the repeating digits, or in bracket notation as this calculator does: 0.(3) for 1/3 and 0.(142857) for 1/7. Every rational number (fraction of integers) either terminates or repeats — there is no third possibility.',
      },
      {
        question: 'How do I simplify a fraction?',
        answer: 'Find the greatest common divisor (GCD) of the numerator and denominator, then divide both by the GCD. For example, 12/16: the GCD is 4, so simplified is (12/4)/(16/4) = 3/4. Simplification makes fractions easier to compare and work with in further calculations.',
      },
      {
        question: 'Why do some decimals terminate while others repeat?',
        answer: 'A decimal terminates when the denominator\'s only prime factors are 2 and 5 — the prime factors of 10 (our base-10 number system). For example, 1/8 = 0.125 because 8 = 2³. If the denominator has any other prime factor (like 3, 7, 11), the decimal repeats. This is a fundamental property of our base-10 number system.',
      },
      {
        question: 'How do I convert a mixed number like 2 3/4 to a decimal?',
        answer: 'Convert the fraction part (3/4 = 0.75) and add it to the whole number: 2 + 0.75 = 2.75. Alternatively, convert to an improper fraction first: (2 × 4 + 3)/4 = 11/4, then divide 11 ÷ 4 = 2.75. Both methods give the same result.',
      },
      {
        question: 'What is the difference between a terminating and a repeating decimal?',
        answer: 'A terminating decimal has a finite number of digits (e.g., 0.5, 0.125, 0.375). A repeating decimal has a pattern that repeats forever (e.g., 0.333..., 0.142857142857...). All fractions of integers produce either terminating or repeating decimals — there is no third category. A fraction produces a terminating decimal only when its denominator (in simplest form) has only 2 and 5 as prime factors.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Decimal', url: 'https://en.wikipedia.org/wiki/Decimal' },
      { source: 'Wolfram MathWorld - Decimal', url: 'https://mathworld.wolfram.com/Decimal.html' },
    ],
  },
};

export default fractionToDecimalConfig;
