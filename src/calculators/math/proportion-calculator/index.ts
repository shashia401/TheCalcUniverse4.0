import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import ProportionPanel from './ProportionPanel';
import { Frac, mulFrac } from '../../../utils/rational';
import { fmtExact as fmt, parseSlot, ratioOf, solveProportion, type Slot } from './proportionMath';

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

  calculate: (values): CalculatorResult[] => {
    const out = solveProportion({ a: parseSlot(values.a), b: parseSlot(values.b), c: parseSlot(values.c), d: parseSlot(values.d) });
    if (out.kind === 'incomplete') return [];
    if (out.kind === 'error') return [{ id: 'error', label: 'Cannot solve', value: out.message, color: 'negative' }];

    const { a, b, c, d } = out.full;
    const left = ratioOf(a, b);
    const right = ratioOf(c, d);
    const leftFrac = `${fmt(a)}/${fmt(b)}`;
    const rightFrac = `${fmt(c)}/${fmt(d)}`;
    const verification = out.equal
      ? `${leftFrac} = ${rightFrac}  (${fmt(left)} = ${fmt(right)})  OK`
      : `${leftFrac} ≠ ${rightFrac}  (${fmt(left)} ≠ ${fmt(right)})  Check inputs`;
    const verificationRow = {
      id: 'verification',
      label: 'Verification',
      value: verification,
      highlight: true,
      color: out.equal ? ('positive' as const) : ('negative' as const),
    };

    if (out.kind === 'check') return [verificationRow];

    return [
      { id: 'result', label: `${out.missing.toUpperCase()} (Missing Value)`, value: fmt(out.value), highlight: true, color: 'positive' as const },
      { id: 'fraction', label: 'Proportion (Fraction)', value: `${leftFrac} = ${rightFrac}`, color: 'neutral' as const },
      { id: 'percentage', label: 'Percentage Equivalent', value: `${fmt({ n: left.n * 100n, d: left.d })}% = ${fmt({ n: right.n * 100n, d: right.d })}%`, color: 'neutral' as const },
      verificationRow,
      { id: 'solution', label: 'Solution Steps', value: out.step, color: 'neutral' as const },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ProportionPanel, { values, results });
  },

  explainSteps: (values) => {
    const out = solveProportion({ a: parseSlot(values.a), b: parseSlot(values.b), c: parseSlot(values.c), d: parseSlot(values.d) });
    if (out.kind === 'incomplete' || out.kind === 'error') return [];
    const { a, b, c, d } = out.full;
    if (out.kind === 'solved') {
      const m = out.missing;
      const show = (k: Slot, f: Frac) => (k === m ? k : fmt(f));
      return [
        { label: 'Write the proportion', expr: `a/b = c/d  →  ${show('a', a)}/${show('b', b)} = ${show('c', c)}/${show('d', d)}` },
        { label: 'Cross-multiply', expr: `a × d = b × c  →  ${show('a', a)} × ${show('d', d)} = ${show('b', b)} × ${show('c', c)}` },
        { label: `Solve for ${m}`, expr: out.step.replace(' / ', ' ÷ '), note: 'Multiply the two numbers on the diagonal, then divide by the number opposite the unknown.' },
      ];
    }
    const ad = fmt(mulFrac(a, d));
    const bc = fmt(mulFrac(b, c));
    return [
      { label: 'Write both ratios', expr: `a/b = ${fmt(a)}/${fmt(b)}  and  c/d = ${fmt(c)}/${fmt(d)}` },
      { label: 'Cross-multiply', expr: `a × d = ${fmt(a)} × ${fmt(d)} = ${ad}  and  b × c = ${fmt(b)} × ${fmt(c)} = ${bc}` },
      { label: 'Compare the cross products', expr: `${ad} ${out.equal ? '=' : '≠'} ${bc}, so the two ratios are ${out.equal ? 'equal (a proportion)' : 'not equal'}` },
    ];
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
      'All provided values must be positive numbers. The calculator validates the proportion by cross-multiplying and checking that both sides are exactly equal.',
      'Review the fraction form (a/b = c/d) to see the complete proportion, and check the percentage equivalent to understand the ratio in percentage format.',
      'Check the verification result — it confirms exactly (by cross-multiplication) whether a/b equals c/d.',
      'Use the solution steps panel to see the cross-multiplication formula and understand exactly how the missing value was computed from the three known values.',
      'If you enter all four values, the calculator verifies whether the proportion holds rather than solving for a missing value.',
    ],
    explanation:
      'A proportion is a mathematical statement that two ratios are equal, written as a/b = c/d. This simple equation is one of the most powerful tools in mathematics because it allows you to solve for an unknown quantity when you know the relationship between three known quantities. The fundamental principle behind solving proportions is cross-multiplication: multiply the numerator of each ratio by the denominator of the other ratio. This gives a × d = b × c, which is a simple linear equation. If you know any three of the four values, you can solve for the fourth by dividing the cross product by the remaining known value. For example, to solve for d: d = (b × c) / a. Proportions appear everywhere in daily life and professional work. In cooking, recipes use proportions to scale ingredients: if a recipe calls for 2 cups of flour for 4 servings (2/4), you can find the flour needed for 6 servings by solving 2/4 = x/6, giving x = 3 cups. In cartography, map scales are proportions: a 1:100,000 scale means 1 unit on the map equals 100,000 units in reality. In finance, ratios like price-to-earnings (P/E) and debt-to-income (DTI) are compared using proportions. The percentage sign itself (%) is a proportion per hundred: 15% means 15/100. Understanding proportions unlocks the ability to work with percentages, fractions, scaling, and rates seamlessly.',
    faqs: [
      {
        question: 'What happens if I enter all four values?',
        answer: 'If all four values are provided, the calculator verifies whether a/b equals c/d exactly (a × d = b × c). If the proportion holds, you will see a confirmation message. If not, the calculator flags the discrepancy so you can adjust the inputs.',
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
        answer: 'The calculator works with exact decimal fractions (no floating point) and rounds results to 8 decimal places. Verification compares a × d with b × c exactly, so 1/3 and 0.33333/1 are correctly reported as different. For most practical purposes (cooking measurements, construction, finance), this precision is more than sufficient.',
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
