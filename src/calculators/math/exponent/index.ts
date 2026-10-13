import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import ExponentPanel from './ExponentPanel';
import { analyzePower, ordinal, parseNumberStrict } from './exponentMath';

// Math.pow (IEEE 754 doubles, ~15-16 significant digits) does the arithmetic. exponentMath.ts handles the
// cases it gets wrong or hides (0^negative, negative bases with fractional exponents); integer powers beyond
// 2^53 additionally get an exact BigInt row.

const SAFE = Number.MAX_SAFE_INTEGER;

/** 12 significant digits, no binary noise; non-finite values never leak into the UI. */
const fmt = (n: number): string => {
  if (!Number.isFinite(n)) return 'too large to display';
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
  return parseFloat(n.toPrecision(12)).toString();
};

/** An operand inside an expression: negative numbers are parenthesised, (-2)^3 not -2^3. */
const operand = (n: number): string => (n < 0 ? `(${fmt(n)})` : fmt(n));

const neutral = 'neutral' as const;

const exponentConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'base',
      label: 'Base (b)',
      type: 'number',
      placeholder: '2',
      step: 0.001,
      inputMode: 'decimal',
      required: true,
      helpText: 'The base value being raised to a power — supports positive, negative, and decimal values',
    },
    {
      id: 'exponent',
      label: 'Exponent (n)',
      type: 'number',
      placeholder: '5',
      step: 0.001,
      inputMode: 'decimal',
      required: true,
      helpText: 'The power to raise the base to. Supports integers, fractions, decimals, and negative numbers.',
    },
  ],
  calculate: (values): CalculatorResult[] => {
    const base = parseNumberStrict(values.base);
    const exp = parseNumberStrict(values.exponent);
    if (Number.isNaN(base) || Number.isNaN(exp)) return [];

    const p = analyzePower(base, exp);

    if (p.kind === 'indeterminate') {
      return [
        { id: 'result', label: 'Result', value: 'Undefined', highlight: true, color: 'negative' },
        { id: 'explanation', label: 'Why Undefined', value: '0^0 is mathematically indeterminate. In analysis, it is an indeterminate form (limits can approach different values). In combinatorics, it is sometimes defined as 1 by convention, but standard real analysis treats it as undefined.', color: neutral },
        { id: 'inverse', label: 'Root b^(1/n)', value: 'Undefined', color: neutral },
        { id: 'reciprocal', label: 'Reciprocal (1/result)', value: 'Undefined', color: neutral },
      ];
    }

    if (p.kind === 'divByZero') {
      return [
        { id: 'result', label: 'Result', value: 'Undefined (division by zero)', highlight: true, color: 'negative' },
        { id: 'explanation', label: 'Why Undefined', value: `0 raised to a negative power is 1 divided by 0 raised to a positive power: 0^${fmt(exp)} = 1 / 0^${fmt(-exp)} = 1 / 0, which has no value.`, color: neutral },
      ];
    }

    if (p.kind === 'complex') {
      const { magnitude: mag = 0, re = 0, im = 0 } = p;
      const part = (n: number) => fmt(Math.abs(n) < mag * 1e-12 ? 0 : n); // cos(pi/2) is 6e-17, not 0
      const reS = part(re);
      const imS = part(Math.abs(im));
      const sign = im < 0 ? '−' : '+';
      return [
        { id: 'result', label: 'Result', value: `Complex: ${reS} ${sign} ${imS}i`, highlight: true, color: 'negative' },
        { id: 'explanation', label: 'Why Complex', value: `A negative base (${fmt(base)}) raised to a non-integer exponent (${fmt(exp)}) has no real value unless the exponent is a fraction with an odd denominator (like 1/3 or 2/5). This is the principal complex value: magnitude ${fmt(mag)} at angle π × ${fmt(exp)} radians, i.e. ${fmt(mag)} × (cos(${fmt(Math.PI * exp)}) + i·sin(${fmt(Math.PI * exp)})).`, color: neutral },
        { id: 'reciprocal', label: 'Reciprocal (1/result)', value: mag === 0 ? 'Undefined' : `Complex: ${part(re / (mag * mag))} ${im < 0 ? '+' : '−'} ${part(Math.abs(im) / (mag * mag))}i`, color: neutral },
        { id: 'squaredCheck', label: 'Base Squared (b²)', value: fmt(base * base), color: neutral },
      ];
    }

    if (p.kind === 'overflow') {
      return [
        { id: 'result', label: 'Result', value: p.negative ? 'Overflow: less than -1.8 × 10^308' : 'Overflow: more than 1.8 × 10^308', highlight: true, color: 'negative' },
        { id: 'explanation', label: 'Overflow', value: 'The result exceeds the largest floating-point number (≈ 1.8 × 10^308). Try a smaller exponent.', color: 'negative' },
        { id: 'reciprocal', label: 'Reciprocal', value: 'Effectively 0 (smaller than 5 × 10^-324)', color: neutral },
      ];
    }

    const result = p.value as number;
    const isIntExp = Number.isInteger(exp);
    const intExp = exp;

    // Expanded form: show the multiplication for small integer exponents
    let expandedForm = '';
    if (isIntExp && intExp > 0 && intExp <= 20) {
      expandedForm = `${Array(intExp).fill(operand(base)).join(' × ')} = ${fmt(result)}`;
    } else if (isIntExp && intExp < 0 && intExp >= -20) {
      expandedForm = `1 / (${Array(-intExp).fill(operand(base)).join(' × ')}) = ${fmt(result)}`;
    }

    // Fraction conversion for negative integer exponents
    let fractionForm = '';
    if (isIntExp && intExp < 0) {
      fractionForm = `${operand(base)}^${intExp} = 1 / ${fmt(Math.pow(base, -intExp))} = ${fmt(result)}`;
    }

    // Scientific notation for very large/small results
    const sciNotation = Math.abs(result) >= 1e6 || (Math.abs(result) < 0.001 && result !== 0) ? result.toExponential(6) : '';

    // Exponent identity breakdown for larger integer exponents
    let exponentIdentity = '';
    if (isIntExp && intExp > 2 && intExp <= 50) {
      const half = Math.floor(intExp / 2);
      const remainder = intExp - half - half;
      const halfPower = Math.pow(base, half);
      if (Number.isFinite(halfPower) && Math.abs(halfPower) < 1e15) {
        const halfStr = Number.isInteger(halfPower) ? halfPower.toString() : halfPower.toPrecision(6);
        const b = operand(base);
        exponentIdentity =
          remainder === 0
            ? `${b}^${intExp} = ${b}^${half} × ${b}^${half} = ${halfStr} × ${halfStr} = ${fmt(result)}`
            : `${b}^${intExp} = ${b}^${half} × ${b}^${half} × ${b}^${remainder} = ${halfStr} × ${halfStr} × ${fmt(Math.pow(base, remainder))} = ${fmt(result)}`;
      }
    }

    // Exact integer value once a double can no longer hold it (|value| >= 2^53): 2^100 = 1267650600228229401496703205376
    let exactValue = '';
    if (Number.isInteger(base) && isIntExp && intExp >= 2 && Math.abs(base) >= 2 && Math.abs(base) <= SAFE && Math.abs(result) >= SAFE) {
      if (intExp * Math.log10(Math.abs(base)) < 400) exactValue = (BigInt(base) ** BigInt(intExp)).toString();
    }

    // The b^(1/n) root: the number that, raised to n, gives b
    let rootValue = '';
    if (exp !== 0) {
      const root = analyzePower(base, 1 / exp);
      const rootName = Number.isInteger(exp) && exp >= 2 ? (exp === 2 ? 'square root' : exp === 3 ? 'cube root' : `${ordinal(exp)} root`) : '';
      const lhs = rootName ? `${rootName} of ${fmt(base)}` : `${operand(base)}^(1/${fmt(exp)})`;
      if (root.kind === 'real') rootValue = `${lhs} = ${fmt(root.value as number)}`;
      else if (root.kind === 'complex') rootValue = `${lhs} has no real value (complex)`;
      else if (root.kind === 'overflow') rootValue = `${lhs} is too large to represent`;
      else rootValue = `${lhs} has no defined value (division by zero)`;
    }

    const rows: CalculatorResult[] = [
      { id: 'result', label: 'Result', value: p.underflow ? 'Underflow: smaller than 5 × 10^-324 (shown as 0)' : fmt(result), highlight: true, color: 'positive' },
    ];
    if (expandedForm) rows.push({ id: 'expandedForm', label: 'Expanded Form', value: expandedForm, color: neutral });
    if (fractionForm) rows.push({ id: 'fractionForm', label: 'Fraction Conversion', value: fractionForm, color: neutral });
    if (sciNotation) rows.push({ id: 'sciNotation', label: 'Scientific Notation', value: sciNotation, color: neutral });
    if (exactValue) rows.push({ id: 'exactValue', label: 'Exact Integer Value', value: exactValue, color: neutral });
    if (exponentIdentity) rows.push({ id: 'exponentIdentity', label: 'Power Rule Breakdown', value: exponentIdentity, color: neutral });
    rows.push({ id: 'squaredCheck', label: 'Base Squared (b²)', value: fmt(base * base), color: neutral });
    if (rootValue) rows.push({ id: 'inverse', label: 'Root b^(1/n)', value: rootValue, color: neutral });
    rows.push({ id: 'reciprocal', label: 'Reciprocal (1/result)', value: result !== 0 ? fmt(1 / result) : 'Undefined', color: neutral });
    return rows;
  },
  extraPanel: (values, results) => {
    if (!results.length || results[0].id !== 'result') return null;
    return createElement(ExponentPanel, { values, results });
  },
  educational: {
    formula: 'bⁿ = b × b × ... × b (n times) | b⁻ⁿ = 1/bⁿ | b^(m/n) = ⁿ√(bᵐ) | b⁰ = 1 | b¹ = b',
    formulaDescription:
      'Exponentiation is repeated multiplication. A positive integer exponent n means multiply the base by itself n times. A negative exponent means take the reciprocal: b⁻ⁿ = 1/bⁿ. A fractional exponent represents a root: b^(1/n) = ⁿ√b (the nth root). A zero exponent always equals 1 for any non-zero base. The exponent can be any real number, including fractions, decimals, negatives, and irrational numbers. The three fundamental laws of exponents — product rule (bᵐ × bⁿ = bᵐ⁺ⁿ), quotient rule (bᵐ ÷ bⁿ = bᵐ⁻ⁿ), and power rule ((bᵐ)ⁿ = bᵐⁿ) — enable simplification of complex exponential expressions and underpin everything from compound interest to radioactive decay to computer science (binary powers of 2).',
    diagram: {
      svg: '<svg viewBox="0 0 440 380" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Exponentiation: Repeated Multiplication</text><text x="220" y="60" text-anchor="middle" font-size="18" font-weight="bold" fill="var(--svg-3b82f6)">2&sup5; = 2 &times; 2 &times; 2 &times; 2 &times; 2</text><rect x="60" y="90" width="40" height="40" rx="4" fill="var(--svg-3b82f6)" fill-opacity=".15" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="80" y="115" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-3b82f6)">2</text><text x="108" y="118" text-anchor="middle" font-size="18" fill="var(--svg-666666)">&times;</text><rect x="115" y="90" width="40" height="40" rx="4" fill="var(--svg-3b82f6)" fill-opacity=".15" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="135" y="115" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-3b82f6)">2</text><text x="163" y="118" text-anchor="middle" font-size="18" fill="var(--svg-666666)">&times;</text><rect x="170" y="90" width="40" height="40" rx="4" fill="var(--svg-3b82f6)" fill-opacity=".15" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="190" y="115" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-3b82f6)">2</text><text x="218" y="118" text-anchor="middle" font-size="18" fill="var(--svg-666666)">&times;</text><rect x="225" y="90" width="40" height="40" rx="4" fill="var(--svg-3b82f6)" fill-opacity=".15" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="245" y="115" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-3b82f6)">2</text><text x="273" y="118" text-anchor="middle" font-size="18" fill="var(--svg-666666)">&times;</text><rect x="280" y="90" width="40" height="40" rx="4" fill="var(--svg-ef4444)" fill-opacity=".2" stroke="var(--svg-ef4444)" stroke-width="2.5"/><text x="300" y="115" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-ef4444)">2</text><line x1="190" y1="80" x2="190" y2="72" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="190" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-3b82f6)">5 factors</text><text x="220" y="170" text-anchor="middle" font-size="14" fill="var(--svg-555555)">2&sup5; = 2 &times; 2 &times; 2 &times; 2 &times; 2 = <tspan font-weight="bold" fill="var(--svg-ef4444)">32</tspan></text><text x="220" y="210" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">Key Rules</text><text x="220" y="233" text-anchor="middle" font-size="12" fill="var(--svg-555555)">b&sup0; = 1 &nbsp;|&nbsp; b&sup1; = b &nbsp;|&nbsp; b&#8315;&#8319; = 1 / b&#8319;</text><text x="220" y="255" text-anchor="middle" font-size="12" fill="var(--svg-555555)">b&#8319; &times; b&#8319; = b&#8319;&#8314;&#8319; &nbsp;|&nbsp; b&#8319; / b&#8319; = b&#8319;&#8315;&#8319;</text><text x="220" y="277" text-anchor="middle" font-size="12" fill="var(--svg-555555)">(b&#8319;)&#8319; = b&#8319;&#8315;&#8319; &nbsp;|&nbsp; b&#8319;&#8315;&#8319; = &#8319;&radic;(b&#8319;)</text><text x="220" y="303" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Base: the number being multiplied &nbsp;|&nbsp; Exponent: how many times</text><text x="220" y="328" text-anchor="middle" font-size="11" fill="var(--svg-888888)">Negative exponent &rarr; reciprocal | Fractional exponent &rarr; root | Zero exponent &rarr; 1</text></svg>',
      alt: 'Visual showing 2 raised to the 5th power as 2 multiplied by itself 5 times, with boxes for each factor, plus key exponent rules listed below',
      caption: 'Exponentiation is repeated multiplication: the base multiplied by itself exponent times. The laws of exponents simplify complex expressions.',
    },
    variables: [
      { symbol: 'b', name: 'Base', description: 'The value being raised to a power. Can be positive, negative, or decimal. For negative bases with non-integer exponents, the result is generally a complex number.' },
      { symbol: 'n', name: 'Exponent', description: 'The power to raise the base to. Can be any real number: integer, fraction, decimal, or negative. A positive integer n means multiply b by itself n times. A negative n means take the reciprocal. A fractional n (like 1/2) means take a root.' },
      { symbol: 'bⁿ', name: 'Power (Result)', description: 'The result of raising b to the nth power. This is the fundamental operation of exponentiation. The result may be very large, very small, a decimal, or — for negative bases with non-integer exponents — a complex number.' },
    ],
    howToUse: [
      'Enter the base value (positive, negative, or decimal). For negative bases, integer exponents work normally; non-integer exponents produce complex results.',
      'Enter the exponent (integer, fractional, negative, or decimal). Use 0.5 for square roots, 0.3333333333333333 for cube roots (recognised as 1/3), and negative values like -2 for reciprocal squares.',
      'View the result, expanded form (for small integer exponents), and the fractional conversion for negative exponents.',
      'Check the "Base Squared" row to quickly verify b × b — useful as an arithmetic sanity check.',
      'The Power Rule Breakdown appears for integer exponents > 2 and demonstrates how b^(m+n) = b^m × b^n can decompose a large exponent into smaller, verifiable pieces.',
      'For very large (> 1 million) or very small (< 0.001) results, scientific notation is displayed automatically.',
      'Check the reciprocal (1/result) to understand the multiplicative inverse relationship.',
    ],
    explanation:
      'Exponents are one of the most fundamental operations in mathematics, appearing everywhere from compound interest (A = P(1+r)^n) to scientific notation (6.022 × 10^23) to geometric growth (population doubling, Moore\'s Law for transistors, viral spread). The laws of exponents — product rule (b^m × b^n = b^(m+n)), quotient rule (b^m ÷ b^n = b^(m-n)), and power rule ((b^m)^n = b^(mn)) — make it possible to simplify complex expressions and are the foundation of algebra. When the exponent is a fraction like 1/2, it represents the square root: b^(1/2) = √b. A negative exponent means reciprocal: b^(-n) = 1/b^n. For example, 2^(-3) = 1/2^3 = 1/8 = 0.125. Zero exponent: any non-zero number raised to the power of 0 equals 1 (b^0 = 1). This follows from the quotient rule: b^n / b^n = b^(n-n) = b^0 = 1. The calculator shows expanded form for small integer exponents, displaying the repeated multiplication explicitly. For very large results (like 2^100), scientific notation is used to keep the output readable. Exponentiation is not commutative: 2^3 = 8 but 3^2 = 9 — the order of base and exponent matters critically. In computer science, powers of 2 (2^8=256, 2^10=1024, 2^16=65536) define memory sizes and binary addressing. In finance, exponential growth via compound interest is why starting to invest early matters so much. In physics, exponential decay describes radioactive half-life, capacitor discharge, and atmospheric pressure with altitude.',
    commonUses: [
      'Compound interest and investment growth: A = P(1+r)^t — understanding exponential growth is essential for retirement planning and loan amortization',
      'Computer science and digital storage: powers of 2 define memory sizes (2^10 = 1 KB, 2^20 = 1 MB, 2^30 = 1 GB, 2^40 = 1 TB)',
      'Scientific notation: expressing very large (Avogadro\'s number: 6.022 × 10^23) or very small (Planck length: 1.616 × 10^(-35) m) quantities',
      'Population modeling: exponential growth models (P(t) = P₀ × e^(rt)) for bacteria colonies, viral spread, and demographic projections',
      'Physics and engineering: radioactive decay (N = N₀ × (1/2)^(t/T)), capacitor discharge (V = V₀ × e^(-t/RC)), sound intensity (decibel scale), and earthquake magnitude (Richter scale)',
      'Cryptography: RSA encryption relies on modular exponentiation with very large exponents — the difficulty of computing discrete logarithms is what keeps encrypted data secure',
      'Probability: the probability of n independent events all occurring is p^n, and the expected number of trials until first success in geometric distribution involves powers',
    ],
    workedExamples: [
      {
        scenario: 'A biologist is tracking bacterial growth in a petri dish. The colony doubles every hour. Starting with 5 bacteria, how many will there be after 8 hours? The growth follows the formula: final = initial × 2^(hours).',
        inputs: { base: '2', exponent: '8' },
        result: '2^8 = 256',
        insight: '2^8 = 256. Starting with 5 bacteria, after 8 hours there will be 5 × 256 = 1,280 bacteria. The exponent 8 tells you the bacteria doubled 8 times. The calculator shows the expanded form (2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 = 256) and the power rule breakdown (2^8 = 2^4 × 2^4 = 16 × 16 = 256), which helps verify the result. This exponential growth is why infections can spread so rapidly — ten doublings turn a single bacterium into 1,024, and thirty doublings into over a billion.',
      },
      {
        scenario: 'An investor wants to understand compound interest. If an investment grows at 7% annually, the 10-year growth multiplier is (1.07)^10. What is this multiplier?',
        inputs: { base: '1.07', exponent: '10' },
        result: '(1.07)^10 ≈ 1.9672',
        insight: '(1.07)^10 ≈ 1.9672. This means $10,000 invested today would grow to approximately $19,672 in 10 years at 7% annual compound interest — nearly doubling. The exponent 10 represents ten compounding periods. If the rate were 10% instead, (1.10)^10 ≈ 2.5937, meaning the money would more than double. This demonstrates why even small differences in interest rates compound to enormous differences over time.',
      },
      {
        scenario: 'A pharmaceutical researcher calculates the remaining amount of a drug in a patient\'s bloodstream. The drug has a half-life of 6 hours, meaning after 6 hours half remains. The fraction remaining after t hours is (1/2)^(t/6). After 18 hours (3 half-lives), what fraction remains? In other words, compute (1/2)^3.',
        inputs: { base: '0.5', exponent: '3' },
        result: '(1/2)^3 = 0.125 = 1/8',
        insight: '(1/2)^3 = 0.125 = 1/8. After 3 half-lives, only 1/8 of the original drug amount remains in the bloodstream. This is why medications have dosing schedules — to maintain therapeutic levels between doses. The fraction form (1/2)^3 = 1/8 makes it clear that each half-life halves the remaining amount. After 4 half-lives only 1/16 remains, and after 5 half-lives only 1/32 — just 3.125% of the original dose.',
      },
      {
        scenario: 'An engineer wants the side of a cube whose volume is 27 cubic metres. The side is the cube root of 27, which equals 27^(1/3).',
        inputs: { base: '27', exponent: '0.3333333333333333' },
        result: '27^(1/3) ≈ 3 (cube root of 27)',
        insight: '27^(1/3) ≈ 3. The cube root of 27 is exactly 3, because 3^3 = 27. The calculator uses the fractional exponent 1/3 (approximated as 0.3333...) to compute the cube root. This demonstrates the equivalence of roots and fractional exponents: the nth root of b equals b^(1/n). Square roots use exponent 0.5, cube roots use 0.3333333333333333 (read as 1/3), and fourth roots use 0.25.',
      },
    ],
    proTips: [
      'Use fractional exponents to compute roots: enter 0.5 for square root, 0.3333333333333333 for cube root (the calculator recognises it as 1/3), 0.25 for fourth root. With a shorter entry such as 0.3333 the result is only approximate, and a negative base is treated as complex.',
      'The Product Rule (b^m × b^n = b^(m+n)) means you can decompose a large exponent into smaller ones you already know. For example, 2^16 = 2^8 × 2^8 = 256 × 256 = 65536 — the calculator shows this breakdown when possible.',
      'For compound interest estimates, memorize that (1+r)^n ≈ e^(rn) for small r. At 7% over 10 years, e^0.7 ≈ 2.01 — very close to the actual 1.967. This "rule of 70" (doubling time ≈ 70 / rate%) is a quick mental check.',
      'When working with negative bases, always check if your exponent is an integer. Negative base ^ integer exponent is always real (alternating signs). Negative base ^ non-integer exponent is typically complex — the calculator warns you.',
      'The reciprocal of b^n is b^(-n), and vice versa. If you need 1/32, you can compute 2^(-5) = 1/32 = 0.03125. This relationship is fundamental to understanding negative exponents.',
    ],
    limitations: [
      'Results beyond roughly 1.8 × 10^308 are reported as an overflow, and non-zero results below roughly 5 × 10^(-324) as an underflow, because they cannot be stored as 64-bit floating-point numbers. Integer powers whose exact value passes 2^53 also show an exact BigInt row.',
      'For negative bases with non-integer exponents, the result is generally a complex number — the calculator attempts to detect rational exponents with odd denominators and compute the real result.',
      'Do not use for modular exponentiation (a^b mod m) used in cryptography — use a dedicated modular arithmetic tool.',
      'Do not use for symbolic manipulation of exponential expressions — use a computer algebra system.',
      'Do not use for extremely high precision beyond 15 significant digits — use an arbitrary-precision library like mpmath or Mathematica.',
      'Do not use for matrix exponentiation (computing e^A for a matrix A) — this requires linear algebra, not scalar exponentiation.',
    ],
    quickReference: [
      { label: 'b⁰ = 1', value: 'Any non-zero base to the power 0 equals 1' },
      { label: 'b¹ = b', value: 'Any base to the power 1 equals itself' },
      { label: 'b⁻ⁿ = 1/bⁿ', value: 'Negative exponent: take the reciprocal' },
      { label: 'b^(1/n) = ⁿ√b', value: 'Fractional exponent: nth root (e.g., b^0.5 = √b)' },
      { label: 'Product Rule', value: 'bᵐ × bⁿ = bᵐ⁺ⁿ' },
      { label: 'Quotient Rule', value: 'bᵐ ÷ bⁿ = bᵐ⁻ⁿ' },
      { label: 'Power Rule', value: '(bᵐ)ⁿ = bᵐⁿ' },
      { label: 'Power of Product', value: '(ab)ⁿ = aⁿ × bⁿ' },
      { label: 'Power of Quotient', value: '(a/b)ⁿ = aⁿ / bⁿ' },
      { label: '0⁰ is undefined', value: 'Indeterminate form — has no consistent value' },
    ],
    faqs: [
      {
        question: 'What does a negative exponent mean in practical terms?',
        answer: 'A negative exponent means "take the reciprocal." b^(-n) = 1/b^n. For example, 2^(-3) = 1/2^3 = 1/8 = 0.125. In physics, a negative exponent often describes decay: the intensity of light falls off as distance^(-2) (inverse square law). In chemistry, pH = -log[H+] uses a negative logarithm, which is related to negative exponents. In finance, a negative exponent in discounting tells you the present value of future money: $100 received 5 years from now at 10% is worth $100 × (1.10)^(-5) = $62.09 today.',
      },
      {
        question: 'What does a fractional exponent like 1/2 or 1/3 actually mean?',
        answer: 'A fractional exponent represents a root. b^(1/n) = ⁿ√b (the nth root of b). For example, 8^(1/3) = ³√8 = 2 because 2^3 = 8. More generally, b^(m/n) = (ⁿ√b)^m = ⁿ√(b^m). So 8^(2/3) = (³√8)^2 = 2^2 = 4. Fractional exponents unify roots and powers into a single notation, which is why mathematicians prefer them over radical signs: the laws of exponents work identically for fractional exponents, making algebraic manipulation much cleaner.',
      },
      {
        question: 'Why is any number raised to the power of zero equal to 1?',
        answer: 'This follows from the quotient rule of exponents. Consider b^n / b^n. Using the quotient rule: b^n / b^n = b^(n-n) = b^0. But we also know any non-zero number divided by itself equals 1. Therefore, b^0 must equal 1 for consistency. Another way to see it: the pattern b^3, b^2, b^1, b^0 divides by b each step. Starting from b^3, dividing by b gives b^2, dividing again gives b^1 = b, and dividing once more gives b^0 = b/b = 1. This holds for any non-zero b.',
      },
      {
        question: 'Is 0^0 equal to 0 or 1? Why is it undefined?',
        answer: '0^0 is mathematically indeterminate — different contexts give different answers. In calculus, as x → 0, the limit of x^x approaches 1, but lim(x^y) as (x,y)→(0,0) can equal any value depending on the path. In combinatorics and set theory, 0^0 is defined as 1 because there is exactly one function from the empty set to the empty set. In analysis, it is left undefined because the function f(x,y)=x^y is discontinuous at (0,0). This calculator reports "Undefined" and explains the ambiguity rather than choosing one convention.',
      },
      {
        question: 'How are exponents used in real-world computing and technology?',
        answer: 'Exponents are everywhere in computing. Memory and storage sizes use powers of 2: 1 KB = 2^10 = 1,024 bytes, 1 MB = 2^20 ≈ 1.05 million bytes, 1 GB = 2^30, 1 TB = 2^40. IP addressing: IPv4 uses 32 bits for 2^32 ≈ 4.3 billion addresses, while IPv6 uses 128 bits for 2^128 ≈ 3.4 × 10^38 addresses. Encryption key strength is measured in bits: a 256-bit key means 2^256 possible keys — a number so large that brute-forcing it would take longer than the age of the universe. RSA and Diffie-Hellman key exchange rely on modular exponentiation, which is easy to compute but hard to reverse.',
      },
      {
        question: 'What is the relationship between exponents and logarithms?',
        answer: 'Exponents and logarithms are inverse operations, just like addition/subtraction and multiplication/division. If b^n = x, then log_b(x) = n. For example, 2^5 = 32 means log_2(32) = 5. In practice, logarithms "undo" exponentiation and are essential for solving for unknown exponents. If an investment doubles every 8 years, you use logarithms to find how long until it reaches a target: t = log(goal/initial) / log(growth rate). The natural log (ln) uses base e ≈ 2.718, which appears naturally in continuous compound interest: A = P × e^(rt).',
      },
    ],
    citations: [
      { source: 'Wolfram MathWorld - Exponentiation', url: 'https://mathworld.wolfram.com/Exponentiation.html' },
      { source: 'Wikipedia - Exponentiation', url: 'https://en.wikipedia.org/wiki/Exponentiation' },
      { source: 'Khan Academy - Exponents', url: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:rational-exponents-radicals' },
    ],
  },
};

export default exponentConfig;
