import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import NthRootPanel from './NthRootPanel';

const nthRootConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'index',
      label: 'Root Index (n)',
      type: 'number',
      placeholder: '3',
      min: 1,
      step: 1,
      helpText: 'The degree of the root (2 for square root, 3 for cube root, etc.)',
    },
    {
      id: 'radicand',
      label: 'Radicand (x)',
      type: 'number',
      placeholder: '27',
      helpText: 'The number under the radical sign',
    },
  ],
  calculate: (values) => {
    const n = parseInt(values.index);
    const x = parseFloat(values.radicand);

    if (isNaN(n) || isNaN(x) || n < 1) return [];
    if (n === 1) return [{ id: 'result', label: 'Result', value: x.toString() }];
    if (n % 2 === 0 && x < 0) return [];

    const isInt = x === Math.floor(x) && Number.isFinite(x);
    const result = Math.sign(x) * Math.pow(Math.abs(x), 1 / n);
    if (!isFinite(result)) return [];

    const fmt = (v: number) => parseFloat(v.toFixed(10)).toString();

    // Build exponential form string
    const exponentForm = `${fmt(x)}^(${fmt(1)}/${n})`;

    // Simplified radical for integers
    let simplifiedRadical = '';
    if (isInt && Math.abs(x) <= 10000 && x > 0) {
      // Find perfect nth powers that divide x
      const absX = Math.abs(x);
      let perfectPower = 1;
      let remainder = absX;
      for (let i = Math.floor(Math.pow(absX, 1 / n)); i >= 2; i--) {
        const p = Math.pow(i, n);
        if (absX % p === 0) {
          perfectPower = i;
          remainder = absX / p;
          break;
        }
      }
      if (perfectPower > 1) {
        const coeff = n === 2 ? `√${remainder}` : `∛${remainder}`;
        simplifiedRadical = `${perfectPower}${coeff}`;
      } else {
        const intRoot = Math.round(result);
        if (Math.abs(intRoot - result) < 1e-10) {
          simplifiedRadical = intRoot.toString();
        }
      }
    }

    return [
      { id: 'result', label: 'Result', value: fmt(result), highlight: true, color: 'positive' },
      { id: 'decimal', label: 'Decimal Form', value: fmt(result) },
      { id: 'radicalForm', label: 'Radical Expression', value: n === 2 ? `√(${fmt(x)})` : `∛(${fmt(x)})` },
      { id: 'exponentForm', label: 'Fractional Exponent', value: exponentForm },
      ...(simplifiedRadical ? [{ id: 'simplifiedRadical' as const, label: 'Simplified Radical', value: simplifiedRadical, color: 'positive' as const }] : []),
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(NthRootPanel, { values, results });
  },
  educational: {
    formula: 'ⁿ√x = x^(1/n)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Nth Roots</text><text x="220" y="60" text-anchor="middle" font-size="15" fill="var(--svg-666666)">The nth root answers: what number raised to n equals x?</text><text x="220" y="100" text-anchor="middle" font-size="24" fill="var(--svg-3b82f6)">&#8319;&radic;&#120802;</text><text x="195" y="80" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-ef4444)">n</text><text x="268" y="100" text-anchor="middle" font-size="14" fill="var(--svg-666666)">Index (n)</text><text x="195" y="115" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-ef4444)">Radical</text><text x="244" y="132" text-anchor="middle" font-size="18" font-weight="bold" fill="var(--svg-3b82f6)">x</text><text x="268" y="140" text-anchor="middle" font-size="14" fill="var(--svg-666666)">Radicand (x)</text><line x1="164" y1="145" x2="270" y2="145" stroke="var(--svg-999999)" stroke-width="1"/><text x="220" y="175" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">&#8319;&radic;x = x^(1/n)</text><text x="220" y="200" text-anchor="middle" font-size="14" fill="var(--svg-555555)">The index n indicates which root</text><text x="220" y="235" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">Examples</text><text x="220" y="258" text-anchor="middle" font-size="13" fill="var(--svg-555555)">&sup2;&radic;25 = 5 &nbsp;|&nbsp; &sup3;&radic;27 = 3 &nbsp;|&nbsp; &sup4;&radic;16 = 2</text><text x="220" y="280" text-anchor="middle" font-size="13" fill="var(--svg-555555)">Square root (n=2): &sup2;&radic;x = &radic;x</text><text x="220" y="302" text-anchor="middle" font-size="13" fill="var(--svg-555555)">Cube root (n=3): &sup3;&radic;x &nbsp;|&nbsp; For odd n, negatives have real roots</text></svg>',
      alt: 'Diagram of the nth root radical symbol with labeled index (n) and radicand (x), showing examples of square, cube, and fourth roots',
      caption: 'The nth root of x answers: what number raised to the nth power equals x?',
    },
    formulaDescription:
      'The nth root of x is the number that, when multiplied by itself n times, equals x. It is equivalent to raising x to the power of 1/n. For example, the cube root of 27 is 3 because 3 × 3 × 3 = 27. The square root (n = 2) is the most common, but any positive integer root can be computed.',
    variables: [
      { symbol: 'n', name: 'Root Index', description: 'The degree of the root (2 = square root, 3 = cube root, 4 = fourth root, etc.). Must be a positive integer. Even-indexed roots of negative numbers are not real.' },
      { symbol: 'x', name: 'Radicand', description: 'The number under the radical sign. For even-indexed roots, x must be non-negative. For odd-indexed roots, x can be negative.' },
      { symbol: 'ⁿ√x', name: 'Nth Root', description: 'The radical expression. The small number n is the index; x is the radicand. For square roots, the index 2 is usually omitted.' },
    ],
    howToUse: [
      'Enter the root index (n) — use 2 for square root, 3 for cube root, 4 for fourth root, etc.',
      'Enter the radicand (x) — the number under the radical sign.',
      'View the result as both a decimal value and a fractional exponent (x^(1/n)).',
      'For integers, the calculator may show a simplified radical form when the radicand has a perfect nth power factor.',
    ],
    explanation:
      'The nth root of a number x is written as ⁿ√x. It is the inverse operation of exponentiation: if y = ⁿ√x, then yⁿ = x. The nth root can also be expressed as a fractional exponent: x^(1/n). For example, 27^(1/3) = ³√27 = 3 because 3³ = 27. For even indices (n = 2, 4, 6...), the radicand must be non-negative because no real number multiplied by itself an even number of times produces a negative result. For odd indices (n = 3, 5, 7...), negative radicands are allowed: ³√(-8) = -2 because (-2)³ = -8. The calculator attempts to simplify radicals by factoring out perfect nth powers. For example, √12 = 2√3 because 12 = 4 × 3 and √4 = 2. This simplified radical form is often preferred in mathematics because it is exact, unlike the decimal approximation. Roots appear throughout geometry (side lengths, diagonal calculations), physics (wave functions, inverse-square laws), and finance (calculating interest rates from growth factors).',
    faqs: [
      {
        question: 'What is the difference between square root and nth root?',
        answer: 'The square root (n = 2) finds a number that, when multiplied by itself once (two factors), equals x. The cube root (n = 3) finds a number that, when multiplied by itself twice (three factors total), equals x. The nth root extends this concept to any positive integer n. As n increases, the nth root of a number approaches 1 (for numbers greater than 1) or the number itself (for numbers between 0 and 1).',
      },
      {
        question: 'Can I take the nth root of a negative number?',
        answer: 'Yes, when the index n is odd. For example, ³√(-8) = -2 because (-2)³ = -8. But when n is even, the result is not a real number — there is no real number that, when multiplied by itself an even number of times, gives a negative product. The calculator will return empty for even-indexed roots of negative numbers.',
      },
      {
        question: 'What does x^(1/n) mean?',
        answer: 'x^(1/n) is the fractional exponent form of the nth root. Raising x to the power of 1/n is mathematically equivalent to taking the nth root of x. For example, 27^(1/3) = ³√27 = 3. More generally, x^(m/n) = (ⁿ√x)ᵐ = ⁿ√(xᵐ). This fractional exponent notation is often more convenient for algebraic manipulation.',
      },
    ],
    citations: [
      { source: 'Wolfram MathWorld - nth Root', url: 'https://mathworld.wolfram.com/nthRoot.html' },
      { source: 'Wikipedia - nth Root', url: 'https://en.wikipedia.org/wiki/Nth_root' },
    ],
  },
};

export default nthRootConfig;
