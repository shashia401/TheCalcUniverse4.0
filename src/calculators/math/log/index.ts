import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import LogPanel from './LogPanel';

// Decimal.js provides high-precision logarithm results for arbitrary bases.
// While Math.log is adequate for most cases, Decimal.js ensures consistent
// precision in the change-of-base computation (log_c(x) / log_c(b)) where
// numerator and denominator are each computed at 20-digit precision before
// division, preventing cancellation errors when the result is very close to
// an integer or when x and b are extremely large/small.
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const logConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'base',
      label: 'Base (b)',
      type: 'number',
      placeholder: '2',
      step: 0.1,
      required: true,
      inputMode: 'decimal',
      helpText: 'The base of the logarithm (must be > 0, not equal to 1)',
    },
    {
      id: 'value',
      label: 'Number (x)',
      type: 'number',
      placeholder: '8',
      step: 0.1,
      required: true,
      inputMode: 'decimal',
      helpText: 'The value to take the log of (must be > 0)',
    },
  ],
  calculate: (values) => {
    const baseStr = values.base;
    const xStr = values.value;

    if (!baseStr || !xStr) return [];

    let base: Decimal;
    let x: Decimal;
    try {
      base = new Decimal(baseStr);
      x = new Decimal(xStr);
    } catch {
      return [];
    }

    if (!base.isFinite() || !x.isFinite()) return [];
    if (base.isNegative() || base.isZero() || base.equals(1)) return [];
    if (x.isNegative() || x.isZero()) return [];

    // Compute log_b(x) = ln(x) / ln(b) using Decimal.js
    const lnx = x.ln();
    const lnb = base.ln();
    const result = lnx.div(lnb);

    // Standard logs
    const log10 = x.log();
    const ln = x.ln();
    const log2 = x.log(2);

    const fmt = (n: Decimal) => {
      if (n.isInteger() && n.abs().lessThan(1e15)) return n.toFixed(0);
      return parseFloat(n.toPrecision(10)).toString();
    };

    // Check if result is an exact integer
    const rounded = result.toDecimalPlaces(10);
    const isExact = base.isInteger() && x.isInteger() &&
      rounded.minus(rounded.round()).abs().lessThan(new Decimal(1).div(1e10));

    const exponentForm = isExact
      ? `${fmt(base)}^${fmt(rounded.round())} = ${fmt(x)}`
      : '';

    return [
      {
        id: 'result',
        label: `log_${fmt(base)}(${fmt(x)})`,
        value: fmt(result),
        highlight: true,
        color: 'positive',
      },
      ...(isExact ? [{
        id: 'exponentForm' as const,
        label: 'Exponential Form',
        value: exponentForm,
        color: 'neutral' as const,
      }] : []),
      {
        id: 'log10',
        label: 'log₁₀(x)',
        value: fmt(log10),
        color: 'neutral' as const,
      },
      {
        id: 'naturalLog',
        label: 'ln(x)',
        value: fmt(ln),
        color: 'neutral' as const,
      },
      {
        id: 'log2',
        label: 'log₂(x)',
        value: fmt(log2),
        color: 'neutral' as const,
      },
      {
        id: 'changeOfBase',
        label: 'Change of Base',
        value: `log_${fmt(base)}(${fmt(x)}) = log₁₀(${fmt(x)}) / log₁₀(${fmt(base)}) = ${fmt(log10)} / ${fmt(base.log())} = ${fmt(result)}`,
        color: 'neutral' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(LogPanel, { values, results });
  },
  educational: {
    formula: 'log_b(x) = y ↔ b^y = x | log_b(x) = log₁₀(x) / log₁₀(b)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Logarithmic Function</text><line x1="40" y1="300" x2="400" y2="300" stroke="var(--svg-999999)" stroke-width="1.5"/><text x="410" y="304" font-size="12" fill="var(--svg-666666)">x</text><line x1="60" y1="300" x2="60" y2="30" stroke="var(--svg-999999)" stroke-width="1.5"/><text x="66" y="28" font-size="12" fill="var(--svg-666666)">y</text><path d="M80,300 C120,300 160,280 190,250 C220,220 250,180 280,140 C310,100 340,70 380,50" fill="none" stroke="var(--svg-3b82f6)" stroke-width="3" stroke-linecap="round"/><circle cx="120" cy="280" r="4" fill="var(--svg-ef4444)"/><text x="108" y="272" text-anchor="end" font-size="12" font-weight="bold" fill="var(--svg-ef4444)">(1, 0)</text><circle cx="200" cy="228" r="4" fill="var(--svg-ef4444)"/><text x="188" y="218" text-anchor="end" font-size="12" font-weight="bold" fill="var(--svg-ef4444)">(b, 1)</text><circle cx="280" cy="165" r="4" fill="var(--svg-ef4444)"/><text x="268" y="155" text-anchor="end" font-size="12" font-weight="bold" fill="var(--svg-ef4444)">(b², 2)</text><text x="220" y="248" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">Key Relationship</text><text x="220" y="271" text-anchor="middle" font-size="13" fill="var(--svg-555555)">log_base_b(x) = y means b^y = x</text><text x="220" y="293" text-anchor="middle" font-size="13" fill="var(--svg-555555)">Change of base: log_b(x) = log(x) / log(b)</text><text x="220" y="315" text-anchor="middle" font-size="13" fill="var(--svg-555555)">ln(x) = log_e(x) | log(x) = log_10(x)</text></svg>',
      alt: 'Graph of a logarithmic curve on a coordinate plane, increasing rapidly at first then leveling off, with labeled points',
      caption: 'Logarithms are the inverse of exponentiation: log_b(x) asks what power of b equals x',
    },
    formulaDescription:
      'A logarithm answers the question: "to what exponent must the base be raised to produce this number?" The change of base formula allows calculating logarithms in any base using the log10 or ln buttons found on standard calculators.',
    variables: [
      { symbol: 'b', name: 'Base', description: 'The base of the logarithm. Must be positive and not equal to 1. Common bases: 10 (common log), e (natural log), 2 (binary log).' },
      { symbol: 'x', name: 'Argument', description: 'The number whose logarithm is being taken. Must be positive. The log of a number between 0 and 1 is negative.' },
      { symbol: 'y', name: 'Result', description: 'The exponent such that b^y = x. For example, log2(8) = 3 because 2^3 = 8.' },
    ],
    howToUse: [
      'Enter the base of the logarithm (must be > 0, and cannot be 1).',
      'Enter the number to take the log of (must be > 0).',
      'View the logarithm result for your custom base.',
      'The calculator also shows common (log10), natural (ln), and binary (log2) logs of the same number for comparison.',
      'The change of base formula shows step-by-step how the result was computed using base-10 logs.',
    ],
    explanation:
      'Logarithms are the inverse of exponentiation. Just as division undoes multiplication, logarithms undo exponentiation. The fundamental relationship is: log_b(x) = y means b^y = x. For example, log2(8) = 3 because 2^3 = 8. Logarithms are essential in chemistry (pH = -log10[H+], where each unit represents a 10x change in acidity), physics (decibel and Richter scales are logarithmic), biology (population growth models), computer science (binary search, algorithm complexity analysis where log2 n appears constantly), and finance (logarithmic returns for compound interest). The change of base formula, log_b(x) = log_c(x) / log_c(b), is crucial because most calculators only provide log10 (common log) and ln (natural log) buttons. For example, to compute log2(100) on a standard calculator: log10(100) / log10(2) = 2 / 0.3010 = 6.644. The calculator shows this step-by-step. A key property: logarithms turn multiplication into addition (log(xy) = log(x) + log(y)), which is how slide rules worked before electronic calculators.',
    commonUses: [
      'Chemistry: calculating pH from hydrogen ion concentration -- pH = -log10[H+], where each unit represents a 10x change in acidity',
      'Seismology: comparing earthquake magnitudes on the Richter scale -- a magnitude 7 earthquake is 10x stronger than magnitude 6',
      'Computer Science: analyzing algorithm efficiency -- binary search takes O(log2 n) comparisons, making it exponentially faster than linear search',
      'Finance: computing compound annual growth rate (CAGR) and logarithmic returns for portfolio analysis',
      'Acoustics: calculating sound intensity in decibels -- a 10 dB increase represents a 10x increase in sound intensity',
    ],
    workedExamples: [
      {
        scenario: 'Dr. Okonkwo, an environmental chemist, measures the hydrogen ion concentration of a lake water sample as [H+] = 3.16 x 10^-7 mol/L. She needs to calculate the pH to determine if the lake is acidic or basic.',
        inputs: { base: '10', value: '0.000000316' },
        result: 'log10(0.000000316) ≈ -6.5, so pH = 6.5',
        insight: 'pH = -log10(3.16 x 10^-7) = 6.5. A pH of 6.5 is slightly acidic (neutral is 7.0). This reading is within the normal range for natural freshwater (6.5-8.5), but Dr. Okonkwo should monitor for acid rain effects which could push the pH below 6.0 and harm aquatic life.',
      },
      {
        scenario: 'Maya, a software engineer, is analyzing a binary search algorithm that searches a sorted database of 1,000,000 records. She wants to know the maximum number of comparisons needed to find any record. The theoretical maximum is log2(n).',
        inputs: { base: '2', value: '1000000' },
        result: 'log2(1,000,000) ≈ 19.93, meaning at most 20 comparisons',
        insight: 'log2(1,000,000) = 19.93, so at most 20 comparisons are needed. Compare this to linear search which would need up to 1,000,000 comparisons in the worst case. Binary search is 50,000x more efficient. This is why large databases use indexed and tree-based structures (B-trees, binary search trees) -- logarithmic access time is critical for performance.',
      },
      {
        scenario: 'Alex, an audio engineer, is setting up a sound system. A speaker at 1 meter produces 90 dB. He needs to know the sound level at 32 meters (outdoor concert distance). Sound decreases with the square of distance: dB reduction = 20 x log10(distance/reference_distance).',
        inputs: { base: '10', value: '32' },
        result: 'log10(32) ≈ 1.505, so sound reduction = 20 × 1.505 ≈ 30.1 dB',
        insight: 'log10(32) = 1.505. Sound reduction = 20 x 1.505 = 30.1 dB. The sound level at 32 meters will be approximately 90 - 30 = 60 dB, about the level of normal conversation. Alex needs additional speakers or delay towers to provide adequate coverage for the entire audience area.',
      },
    ],
    proTips: [
      'Use the change of base formula when your calculator lacks a custom base button. Any logarithm can be computed as log10(x) / log10(b) or ln(x) / ln(b). The result is the same regardless of which base you use for the conversion.',
      'Logarithms turn multiplication problems into addition problems. Before electronic calculators, scientists multiplied large numbers by looking up their logarithms in tables, adding them, and finding the antilog. Understanding this property helps explain why log scales are so useful.',
      'The natural log (ln, base e) appears everywhere in calculus because d/dx[ln(x)] = 1/x. If you are doing any calculus work involving logs, default to natural log rather than common log -- the derivative of log10(x) has an extra constant factor.',
      'When the argument (x) is between 0 and 1, the logarithm is negative. For example, log10(0.01) = -2 because 10^-2 = 0.01. This trips up many students -- a negative log result is correct and expected when working with small numbers.',
      'In computer science, log2(n) rounded up to the next integer tells you how many bits are needed to represent n distinct values. For example, log2(256) = 8, meaning 8 bits can represent 256 values (0-255).',
    ],
    limitations: [
      'Do not use this calculator with base 1 — log1(x) is undefined because 1 raised to any power is always 1, so there is no unique inverse. This calculator rejects base 1 inputs.',
      'Zero or negative bases and zero or negative arguments (x ≤ 0) require complex number arithmetic beyond the scope of this real-valued logarithm calculator. The limit of log_b(0) is negative infinity.',
      'Do not use logarithms on count data where zero values exist without adding a small constant first. Also avoid log transformation when the underlying relationship is known to be linear rather than multiplicative.',
      'This calculator handles real-valued logarithms only. For complex logarithms (e.g., log10(-1) = iπ/ln(10)), modular logarithms, or discrete logarithms used in cryptography, use a dedicated tool.',
    ],
    quickReference: [
      { label: 'log10(1)', value: '0 (10^0 = 1)' },
      { label: 'log10(10)', value: '1 (10^1 = 10)' },
      { label: 'log10(100)', value: '2 (10^2 = 100)' },
      { label: 'ln(1)', value: '0 (e^0 = 1)' },
      { label: 'ln(e)', value: '1 (e^1 = e)' },
      { label: 'log2(1)', value: '0 (2^0 = 1)' },
      { label: 'log2(1024)', value: '10 (2^10 = 1024)' },
      { label: 'log of 0 < x < 1', value: 'Negative result' },
    ],
    faqs: [
      {
        question: 'Why can\'t the base be 1 or negative?',
        answer: 'Logarithms with base 1 are undefined because 1 raised to any power is always 1. There is no unique exponent y such that 1^y = x (unless x=1, in which case every y works). Negative bases would produce complex numbers for non-integer exponents, which is outside standard real-valued logarithms. For example, log_-2(8) would require finding y such that (-2)^y = 8, which has no real solution.',
      },
      {
        question: 'What is the change of base formula?',
        answer: 'The change of base formula is log_b(x) = log_c(x) / log_c(b) for any valid base c. Most commonly: log_b(x) = log10(x) / log10(b) or log_b(x) = ln(x) / ln(b). This lets you compute any logarithm using just the log10 or ln button on a standard calculator. It works because logarithms in different bases are proportional to each other.',
      },
      {
        question: 'What is the difference between log and ln?',
        answer: 'log (common logarithm) has base 10. ln (natural logarithm) has base e (approximately 2.71828). Natural logarithms are used in calculus (the derivative of ln(x) is 1/x), exponential growth/decay models, and any context involving continuous compounding. Common logs are used in pH, Richter scale, and decibel measurements because these are defined with base 10. In higher mathematics and computer science, "log" without a specified base often means natural log or log base 2, depending on the field.',
      },
      {
        question: 'What is the antilog (inverse log)?',
        answer: 'The antilogarithm is the inverse operation: if y = log_b(x), then the antilog is x = b^y. For common logs (base 10), antilog10(y) = 10^y. For natural logs, antiln(y) = e^y. Practical example: if pH = -log10[H+] = 5, then [H+] = 10^-5 = 0.00001 mol/L. Most scientific calculators have a 10^x or e^x button for computing antilogs.',
      },
      {
        question: 'Why do we use log scales in science?',
        answer: 'Log scales compress vast ranges into manageable numbers. The Richter scale (earthquake magnitude) is logarithmic: a magnitude 8 releases about 31.6x more energy than a magnitude 7, not just 14% more. pH is logarithmic: lemon juice (pH 2) is 100,000x more acidic than water (pH 7). Decibels are logarithmic: a 20 dB increase means 100x more sound intensity. Without log scales, we would work with incomprehensible numbers like 10^-14 for [H+] or 10^12 for sound pressure.',
      },
      {
        question: 'What is the relationship between exponents and logarithms?',
        answer: 'Logarithms and exponents are inverse operations, like addition/subtraction and multiplication/division. If b^y = x, then log_b(x) = y. You can think of it as: the exponent asks "b raised to what power gives x?" and the logarithm answers "y." Properties mirror each other: log_b(xy) = log_b(x) + log_b(y) mirrors b^(m+n) = b^m * b^n. log_b(x^p) = p * log_b(x) mirrors (b^m)^p = b^(mp).',
      },
      {
        question: 'How are logarithms used in algorithm analysis?',
        answer: 'In computer science, log2(n) appears in the time complexity of divide-and-conquer algorithms. Binary search: O(log2 n) comparisons. Balanced binary search tree operations: O(log2 n). Merge sort: O(n log2 n) comparisons. An algorithm that is O(log n) can handle massive inputs: if n doubles, log n only increases by 1. This is why Google can search billions of web pages in milliseconds -- indexing uses logarithmic-time data structures.',
      },
    ],
    citations: [
      { source: 'Wolfram MathWorld - Logarithm', url: 'https://mathworld.wolfram.com/Logarithm.html' },
      { source: 'Wikipedia - Logarithm', url: 'https://en.wikipedia.org/wiki/Logarithm' },
      { source: 'Khan Academy - Logarithms', url: 'https://www.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:logs' },
    ],
  },
};

export default logConfig;
