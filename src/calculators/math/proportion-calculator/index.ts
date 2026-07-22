import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import ProportionPanel from './ProportionPanel';

/**
 * Solve a proportion a/b = c/d for the missing value.
 * Given any three values, the fourth is computed via cross-multiplication.
 */
function solveMissing(
  a: number | null,
  b: number | null,
  c: number | null,
  d: number | null,
): { missing: string; value: number; label: string } | null {
  // Exactly one value is missing (null)
  const known = [a, b, c, d].filter((x) => x !== null).length;
  if (known !== 3) return null;

  if (a === null) {
    // a = (b * c) / d
    const val = (b! * c!) / d!;
    return { missing: 'a', value: val, label: `a = (${b} × ${c}) / ${d} = ${val}` };
  }
  if (b === null) {
    // b = (a * d) / c
    const val = (a! * d!) / c!;
    return { missing: 'b', value: val, label: `b = (${a} × ${d}) / ${c} = ${val}` };
  }
  if (c === null) {
    // c = (a * d) / b
    const val = (a! * d!) / b!;
    return { missing: 'c', value: val, label: `c = (${a} × ${d}) / ${b} = ${val}` };
  }
  // d === null
  // d = (b * c) / a
  const val = (b! * c!) / a!;
  return { missing: 'd', value: val, label: `d = (${b} × ${c}) / ${a} = ${val}` };
}

const proportionConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'a',
      label: 'a (numerator 1)',
      type: 'number',
      placeholder: '1',
      step: 0.01,
      required: true,
      helpText: 'First numerator in proportion a/b = c/d',
    },
    {
      id: 'b',
      label: 'b (denominator 1)',
      type: 'number',
      placeholder: '2',
      step: 0.01,
      required: true,
      helpText: 'First denominator in proportion a/b = c/d',
    },
    {
      id: 'c',
      label: 'c (numerator 2)',
      type: 'number',
      placeholder: '3',
      step: 0.01,
      required: true,
      helpText: 'Second numerator in proportion a/b = c/d. Leave empty or ? to solve for c.',
    },
    {
      id: 'd',
      label: 'd (denominator 2)',
      type: 'number',
      placeholder: '?',
      step: 0.01,
      required: true,
      helpText: 'Second denominator in proportion a/b = c/d. Leave empty or ? to solve for d.',
    },
  ],

  calculate: (values) => {
    // Parse each input; treat empty or "?" as null (missing)
    const parseOpt = (v: string | undefined): number | null => {
      const s = (v ?? '').trim();
      if (!s || s === '?') return null;
      const n = parseFloat(s);
      return isNaN(n) ? null : n;
    };

    const a = parseOpt(values.a);
    const b = parseOpt(values.b);
    const c = parseOpt(values.c);
    const d = parseOpt(values.d);

    // Need three known values (solve) or four (verification), all positive
    const knowns = [a, b, c, d].filter((x) => x !== null) as number[];
    const allFour = knowns.length === 4;
    if (knowns.length < 3) return [];
    if (knowns.some((x) => x <= 0)) return [];

    const fmt = (n: number) => parseFloat(n.toFixed(8)).toString();

    if (allFour) {
      const leftVal = a! / b!;
      const rightVal = c! / d!;
      const match = Math.abs(leftVal - rightVal) < 0.0001;
      const leftFrac = `${fmt(a!)}/${fmt(b!)}`;
      const rightFrac = `${fmt(c!)}/${fmt(d!)}`;
      return [
        {
          id: 'verification',
          label: 'Verification',
          value: match
            ? `${leftFrac} = ${rightFrac}  (${fmt(leftVal)} = ${fmt(rightVal)})  OK`
            : `${leftFrac} ≠ ${rightFrac}  (${fmt(leftVal)} ≠ ${fmt(rightVal)})  Check inputs`,
          highlight: true,
          color: 'neutral' as const,
        },
      ];
    }

    const solved = solveMissing(a, b, c, d);
    if (!solved) return [];

    const missingVar = solved.missing;
    const missingVal = solved.value;
    const allVals: Record<string, number> = { a: a ?? missingVal, b: b ?? missingVal, c: c ?? missingVal, d: d ?? missingVal };

    // Build fraction and percentage for the solved proportion
    const fractionA = allVals.a;
    const fractionB = allVals.b;
    const fractionC = allVals.c;
    const fractionD = allVals.d;

    // verification: left = a/b, right = c/d
    const leftVal = fractionA / fractionB;
    const rightVal = fractionC / fractionD;
    const match = Math.abs(leftVal - rightVal) < 0.0001;
    const leftFrac = `${fmt(fractionA)}/${fmt(fractionB)}`;
    const rightFrac = `${fmt(fractionC)}/${fmt(fractionD)}`;
    const leftPct = ((fractionA / fractionB) * 100);
    const rightPct = ((fractionC / fractionD) * 100);

    return [
      {
        id: 'result',
        label: `${missingVar.toUpperCase()} (Missing Value)`,
        value: fmt(missingVal),
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'fraction',
        label: 'Proportion (Fraction)',
        value: `${leftFrac} = ${rightFrac}`,
        color: 'neutral' as const,
      },
      {
        id: 'percentage',
        label: 'Percentage Equivalent',
        value: `${fmt(leftPct)}% = ${fmt(rightPct)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'verification',
        label: 'Verification',
        value: match
          ? `${leftFrac} = ${rightFrac}  (${fmt(leftVal)} = ${fmt(rightVal)})  OK`
          : `${leftFrac} ≠ ${rightFrac}  (${fmt(leftVal)} ≠ ${fmt(rightVal)})  Check inputs`,
        highlight: true,
        color: match ? ('positive' as const) : ('negative' as const),
      },
      {
        id: 'solution',
        label: 'Solution Steps',
        value: solved.label,
        color: 'neutral' as const,
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ProportionPanel, { values, results });
  },

  educational: {
    formula: 'a / b = c / d   →   a × d = b × c',
    diagram: {
      svg: '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="200" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-1e293b)">Solving Proportions</text><text x="200" y="52" text-anchor="middle" font-size="13" fill="var(--svg-64748b)">a / b = c / d  —  Cross-Multiply: a × d = b × c</text><rect x="50" y="80" width="80" height="32" rx="4" fill="var(--svg-3b82f6)" fill-opacity=".2" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="90" y="100" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-3b82f6)">a</text><rect x="50" y="122" width="80" height="32" rx="4" fill="var(--svg-22c55e)" fill-opacity=".2" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="90" y="142" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-22c55e)">b</text><text x="165" y="115" text-anchor="middle" font-size="22" font-weight="bold" fill="var(--svg-1e293b)">=</text><rect x="215" y="80" width="80" height="32" rx="4" fill="var(--svg-3b82f6)" fill-opacity=".2" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="255" y="100" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-3b82f6)">c</text><rect x="215" y="122" width="80" height="32" rx="4" fill="var(--svg-22c55e)" fill-opacity=".2" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="255" y="142" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-22c55e)">d</text><line x1="58" y1="84" x2="286" y2="115" stroke="var(--svg-ef4444)" stroke-width="1.5" stroke-dasharray="4,3"/><line x1="58" y1="148" x2="286" y2="117" stroke="var(--svg-ef4444)" stroke-width="1.5" stroke-dasharray="4,3"/><text x="200" y="195" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-ef4444)">Cross-Multiply: a × d = b × c</text><text x="200" y="218" text-anchor="middle" font-size="12" fill="var(--svg-64748b)">If three values are known, solve for the fourth</text><text x="200" y="240" text-anchor="middle" font-size="12" fill="var(--svg-64748b)">Missing value = (cross product) ÷ remaining value</text><text x="200" y="265" text-anchor="middle" font-size="11" fill="var(--svg-94a3b8)">Used in scaling, recipes, maps, unit conversion, and finance</text></svg>',
      alt: 'Two fraction bars a/b and c/d with an equals sign between them and red dashed lines showing cross-multiplication a×d = b×c',
      caption: 'A proportion states two ratios are equal. Cross-multiplication transforms a/b = c/d into a×d = b×c, allowing you to solve for any missing value.',
    },
    formulaDescription:
      'A proportion is an equation that states two ratios are equal (a/b = c/d). Cross-multiplication (a × d = b × c) transforms the proportion into a simple algebraic equation. Given any three values, the fourth can be found by dividing the cross product by the remaining known value. Proportions are fundamental in scaling, unit conversion, recipe adjustments, map reading, and financial analysis.',
    variables: [
      { symbol: 'a', name: 'First Numerator', description: 'The top number of the first ratio. Represents the part relative to denominator b (e.g., 2 cups of flour for every 3 servings).' },
      { symbol: 'b', name: 'First Denominator', description: 'The bottom number of the first ratio. Represents the unit or reference quantity being compared against.' },
      { symbol: 'c', name: 'Second Numerator', description: 'The top number of the second ratio, corresponding to the unknown or target proportion.' },
      { symbol: 'd', name: 'Second Denominator', description: 'The bottom number of the second ratio. This is the value most commonly solved for, hence the default placeholder "?".' },
    ],
    howToUse: [
      'Enter any three of the four values (a, b, c, d) in the proportion a/b = c/d. Leave the missing value empty or enter "?" — the calculator solves for the missing value automatically.',
      'All provided values must be positive numbers. The calculator validates the proportion by cross-multiplying and verifying both sides are equal within a small tolerance.',
      'Review the fraction form (a/b = c/d) to see the complete proportion, and check the percentage equivalent to understand the ratio in percentage format.',
      'Check the verification result — it confirms whether a/b equals c/d within a small tolerance of 0.01%, giving you confidence in the solution.',
      'Use the solution steps panel to see the cross-multiplication formula and understand exactly how the missing value was computed from the three known values.',
      'If you enter all four values, the calculator verifies whether the proportion holds rather than solving for a missing value.',
    ],
    explanation:
      'A proportion is a mathematical statement that two ratios are equal, written as a/b = c/d. This simple equation is one of the most powerful tools in mathematics because it allows you to solve for an unknown quantity when you know the relationship between three known quantities. The fundamental principle behind solving proportions is cross-multiplication: multiply the numerator of each ratio by the denominator of the other ratio. This gives a × d = b × c, which is a simple linear equation. If you know any three of the four values, you can solve for the fourth by dividing the cross product by the remaining known value. For example, to solve for d: d = (b × c) / a. Proportions appear everywhere in daily life and professional work. In cooking, recipes use proportions to scale ingredients: if a recipe calls for 2 cups of flour for 4 servings (2/4), you can find the flour needed for 6 servings by solving 2/4 = x/6, giving x = 3 cups. In cartography, map scales are proportions: a 1:100,000 scale means 1 unit on the map equals 100,000 units in reality. In finance, ratios like price-to-earnings (P/E) and debt-to-income (DTI) are compared using proportions. The percentage sign itself (%) is a proportion per hundred: 15% means 15/100. Understanding proportions unlocks the ability to work with percentages, fractions, scaling, and rates seamlessly.',
    faqs: [
      {
        question: 'What happens if I enter all four values?',
        answer: 'If all four values are provided, the calculator verifies whether a/b equals c/d within a small tolerance. If the proportion holds, you will see a confirmation message. If not, the calculator flags the discrepancy so you can adjust the inputs.',
      },
      {
        question: 'Can I use zero or negative numbers?',
        answer: 'No. All values in a proportion must be positive numbers. Zero would make the fraction undefined (division by zero), and negative values would invert the meaning of the ratio in most real-world applications like scaling, recipes, and measurement conversion.',
      },
      {
        question: 'What is the difference between a ratio and a proportion?',
        answer: 'A ratio is a comparison of two quantities (a:b or a/b). A proportion is an equation stating that two ratios are equal (a/b = c/d). Think of ratios as individual relationships, and proportions as statements that two relationships are equivalent.',
      },
      {
        question: 'How accurate is the calculator for decimal inputs?',
        answer: 'The calculator uses JavaScript double-precision floating point and rounds results to 8 decimal places. Verification uses a tolerance of 0.01% to account for floating-point rounding. For most practical purposes (cooking measurements, construction, finance), this precision is more than sufficient.',
      },
      {
        question: 'How is a proportion different from a percentage?',
        answer: 'A percentage is actually a specific type of proportion where the denominator is always 100. The word "percent" literally means "per hundred." Any proportion a/b = c/d can be converted to a percentage by setting d = 100 and solving for c: c = (a x 100) / b. This is why the proportion method is so powerful for percentage problems — "what is 15% of 80" becomes the proportion 15/100 = x/80, and "36 is what percent of 80" becomes 36/80 = x/100. Understanding proportions makes percentages intuitive rather than a collection of memorized formulas.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Ratio', url: 'https://en.wikipedia.org/wiki/Ratio' },
      { source: 'Wikipedia - Cross-multiplication', url: 'https://en.wikipedia.org/wiki/Cross-multiplication' },
      { source: 'Khan Academy - Introduction to Ratios', url: 'https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-ratios-prop-topic/intro-to-ratios/v/ratios-intro' },
    ],
  },
};

export default proportionConfig;
