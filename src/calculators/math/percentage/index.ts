import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import PercentagePanel from './PercentagePanel';

const percentageConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'What would you like to calculate?',
      type: 'select',
      required: true,
      defaultValue: 'percentOf',
      options: [
        { label: 'What is X% of Y?', value: 'percentOf' },
        { label: 'X is what percent of Y?', value: 'whatPercent' },
        { label: 'What is the % change from X to Y?', value: 'pctChange' },
        { label: 'Add X% to Y', value: 'addPct' },
        { label: 'Subtract X% from Y', value: 'subPct' },
      ],
    },
    {
      id: 'x',
      label: 'X',
      type: 'number',
      defaultValue: '20',
      placeholder: '20',
      step: 0.01,
      required: true,
      helpText: 'The percentage value or first number',
    },
    {
      id: 'y',
      label: 'Y',
      type: 'number',
      defaultValue: '200',
      placeholder: '200',
      step: 0.01,
      required: true,
      helpText: 'The base value or second number',
    },
  ],
  explainSteps: (values) => {
    const mode = values.mode || 'percentOf';
    const x = parseFloat(values.x);
    const y = parseFloat(values.y);
    if ([x, y].some(isNaN)) return [];
    const g = (n: number) => (Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/\.?0+$/, ''));

    if (mode === 'percentOf') {
      return [
        { label: 'Turn the percent into a decimal', expr: `${g(x)}% = ${g(x)} ÷ 100 = ${g(x / 100)}`, note: '"Percent" means "per hundred", so divide by 100.' },
        { label: 'Multiply by the whole', expr: `${g(x / 100)} × ${g(y)} = ${g((x / 100) * y)}` },
      ];
    }
    if (mode === 'whatPercent') {
      if (y === 0) return [];
      return [
        { label: 'Make a fraction: part over whole', expr: `${g(x)} ÷ ${g(y)} = ${g(x / y)}` },
        { label: 'Convert the fraction to a percent', expr: `${g(x / y)} × 100 = ${g((x / y) * 100)}%`, note: 'Multiplying by 100 turns a decimal into a percent.' },
      ];
    }
    if (mode === 'pctChange') {
      if (x === 0) return [];
      const diff = y - x;
      return [
        { label: 'Find the change', expr: `${g(y)} − ${g(x)} = ${g(diff)}` },
        { label: 'Divide by the original value', expr: `${g(diff)} ÷ ${g(x)} = ${g(diff / x)}` },
        { label: 'Convert to a percent', expr: `${g(diff / x)} × 100 = ${g((diff / x) * 100)}%`, note: diff >= 0 ? 'A positive result is an increase.' : 'A negative result is a decrease.' },
      ];
    }
    if (mode === 'addPct') {
      return [
        { label: 'Find the amount to add', expr: `${g(x)}% of ${g(y)} = ${g((x / 100) * y)}` },
        { label: 'Add it to the original', expr: `${g(y)} + ${g((x / 100) * y)} = ${g(y * (1 + x / 100))}` },
      ];
    }
    // subPct
    return [
      { label: 'Find the amount to subtract', expr: `${g(x)}% of ${g(y)} = ${g((x / 100) * y)}` },
      { label: 'Subtract it from the original', expr: `${g(y)} − ${g((x / 100) * y)} = ${g(Math.max(0, y * (1 - x / 100)))}` },
    ];
  },
  calculate: (values) => {
    const mode = values.mode || 'percentOf';
    const x = parseFloat(values.x);
    const y = parseFloat(values.y);

    if ([x, y].some(isNaN)) return [];
    if (y === 0) {
      if (mode === 'whatPercent') {
        return [{ id: 'error', label: 'Cannot divide by zero', value: 'Undefined', color: 'negative' as const }];
      }
      return [];
    }

    // NOTE: .toFixed() always uses '.' as the decimal separator (locale-blind).
    // This is acceptable here because the result values are interpolated into string
    // labels (e.g., "$${fmt(y)}") and displayed in a UI that expects '.' decimals.
    // For locale-aware formatting, replace with n.toLocaleString(undefined, { ... }).
    const fmt = (n: number) => {
      if (Number.isInteger(n)) return n.toString();
      return n.toFixed(2).replace(/\.?0+$/, '');
    };

    let results: Array<{ id: string; label: string; value: string; highlight?: boolean; color: 'positive' | 'negative' | 'neutral' }> = [];

    if (mode === 'percentOf') {
      // "What is X% of Y?"
      const result = (x / 100) * y;
      results = [
        { id: 'result', label: `What is ${fmt(x)}% of ${fmt(y)}?`, value: fmt(result), highlight: true, color: 'positive' },
        { id: 'formula', label: 'Calculation', value: `${fmt(x)} ÷ 100 × ${fmt(y)} = ${fmt(result)}`, color: 'neutral' },
        { id: 'decimal', label: 'Decimal Equivalent', value: `${fmt(x / 100)}`, color: 'neutral' },
        { id: 'example', label: 'Real-World Example', value: `If calculating a tip: ${fmt(x)}% of a $${fmt(y)} bill is $${fmt(result)}`, color: 'neutral' },
      ];
    } else if (mode === 'whatPercent') {
      // "X is what % of Y?"
      const pct = (x / y) * 100;
      results = [
        { id: 'result', label: `${fmt(x)} is what % of ${fmt(y)}?`, value: `${fmt(pct)}%`, highlight: true, color: 'positive' },
        { id: 'formula', label: 'Calculation', value: `${fmt(x)} ÷ ${fmt(y)} × 100 = ${fmt(pct)}%`, color: 'neutral' },
        { id: 'decimal', label: 'Decimal Ratio', value: `${fmt(x / y)}`, color: 'neutral' },
        { id: 'example', label: 'Real-World Example', value: `If you scored ${fmt(x)} out of ${fmt(y)}: your grade is ${fmt(pct)}%`, color: 'neutral' },
      ];
    } else if (mode === 'pctChange') {
      // "What is the % change from X to Y?"
      if (x === 0) {
        return [
          { id: 'error', label: 'Cannot calculate percent change from zero', value: 'Undefined', color: 'negative' as const },
          { id: 'explanation', label: 'Why?', value: 'Percent change divides by the original value (X). When X = 0, division by zero is mathematically undefined.', color: 'neutral' as const },
        ];
      }
      const change = ((y - x) / x) * 100;
      const absChange = Math.abs(change);
      const direction = change >= 0 ? 'increase' : 'decrease';
      results = [
        { id: 'result', label: `% Change from ${fmt(x)} to ${fmt(y)}`, value: `${fmt(absChange)}% ${direction}`, highlight: true, color: change >= 0 ? 'positive' : 'negative' },
        { id: 'formula', label: 'Calculation', value: `(${fmt(y)} − ${fmt(x)}) ÷ ${fmt(x)} × 100 = ${fmt(absChange)}% ${direction}`, color: 'neutral' },
        { id: 'difference', label: 'Absolute Difference', value: fmt(Math.abs(y - x)), color: 'neutral' },
        { id: 'example', label: 'Real-World Example', value: change >= 0 ? `Price increased from $${fmt(x)} to $${fmt(y)} — a ${fmt(absChange)}% markup` : `Price dropped from $${fmt(x)} to $${fmt(y)} — a ${fmt(absChange)}% discount`, color: 'neutral' },
      ];
    } else if (mode === 'addPct') {
      // "Add X% to Y"
      const result = y * (1 + x / 100);
      results = [
        { id: 'result', label: `${fmt(y)} + ${fmt(x)}% = ?`, value: fmt(result), highlight: true, color: 'positive' },
        { id: 'formula', label: 'Calculation', value: `${fmt(y)} × (1 + ${fmt(x)} ÷ 100) = ${fmt(y)} × ${fmt(1 + x / 100)} = ${fmt(result)}`, color: 'neutral' },
        { id: 'increaseAmount', label: 'Increase Amount', value: fmt(result - y), color: 'neutral' },
        { id: 'example', label: 'Real-World Example', value: `$${fmt(y)} with ${fmt(x)}% tax added = $${fmt(result)} total`, color: 'neutral' },
      ];
    } else if (mode === 'subPct') {
      // "Subtract X% from Y"
      const result = y * (1 - x / 100);
      results = [
        { id: 'result', label: `${fmt(y)} − ${fmt(x)}% = ?`, value: fmt(Math.max(0, result)), highlight: true, color: 'positive' },
        { id: 'formula', label: 'Calculation', value: `${fmt(y)} × (1 − ${fmt(x)} ÷ 100) = ${fmt(y)} × ${fmt(1 - x / 100)} = ${fmt(Math.max(0, result))}`, color: 'neutral' },
        { id: 'decreaseAmount', label: 'Discount Amount', value: fmt(y - result), color: 'neutral' },
        { id: 'example', label: 'Real-World Example', value: `$${fmt(y)} with ${fmt(x)}% off = $${fmt(Math.max(0, result))} (save $${fmt(y - result)})`, color: 'neutral' },
      ];
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PercentagePanel, { values, results });
  },
  educational: {
    formula: '% = (Part ÷ Whole) × 100 | % Change = ((New − Old) ÷ Old) × 100',
    formulaDescription:
      'A percentage expresses a number as a fraction of 100. The "% of" formula multiplies the base by the percentage divided by 100. Percent change compares the difference between two values relative to the original.',
    diagram: {
      svg: '<svg viewBox="0 0 380 300" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<rect x="10" y="10" width="36" height="36" rx="3" fill="var(--svg-3b82f6)" opacity="0.9"/><rect x="48" y="10" width="36" height="36" rx="3" fill="var(--svg-3b82f6)" opacity="0.9"/><rect x="86" y="10" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="124" y="10" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="162" y="10" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/>' +
        '<rect x="200" y="10" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="238" y="10" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="276" y="10" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="314" y="10" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="352" y="10" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/>' +
        '<rect x="10" y="48" width="36" height="36" rx="3" fill="var(--svg-3b82f6)" opacity="0.9"/><rect x="48" y="48" width="36" height="36" rx="3" fill="var(--svg-3b82f6)" opacity="0.9"/><rect x="86" y="48" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="124" y="48" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="162" y="48" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/>' +
        '<rect x="200" y="48" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="238" y="48" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="276" y="48" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="314" y="48" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="352" y="48" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/>' +
        '<rect x="10" y="86" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="48" y="86" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="86" y="86" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="124" y="86" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="162" y="86" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/>' +
        '<rect x="200" y="86" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="238" y="86" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="276" y="86" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="314" y="86" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="352" y="86" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/>' +
        '<rect x="10" y="124" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="48" y="124" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="86" y="124" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="124" y="124" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="162" y="124" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/>' +
        '<rect x="200" y="124" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="238" y="124" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="276" y="124" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="314" y="124" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="352" y="124" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/>' +
        '<rect x="10" y="162" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="48" y="162" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="86" y="162" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="124" y="162" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="162" y="162" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/>' +
        '<rect x="200" y="162" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="238" y="162" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="276" y="162" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="314" y="162" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="352" y="162" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/>' +
        '<rect x="10" y="200" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="48" y="200" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="86" y="200" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="124" y="200" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="162" y="200" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/>' +
        '<rect x="200" y="200" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="238" y="200" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="276" y="200" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="314" y="200" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="352" y="200" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/>' +
        '<rect x="10" y="238" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="48" y="238" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="86" y="238" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="124" y="238" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="162" y="238" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/>' +
        '<rect x="200" y="238" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="238" y="238" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="276" y="238" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="314" y="238" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/><rect x="352" y="238" width="36" height="36" rx="3" fill="var(--svg-e2e8f0)"/>' +
        '<text x="190" y="296" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">20 out of 100 squares = 20%</text>' +
        '</svg>',
      alt: 'Ten-by-ten grid with 20 filled squares showing 20 out of 100 equals 20 percent',
      caption: 'A 10×10 grid visually demonstrates that 20% means 20 out of every 100 units',
    },
    variables: [
      { symbol: '%', name: 'Percentage', description: 'A proportion expressed per hundred. 20% = 20 out of every 100. Percentages are always relative to a base, so context matters.' },
      { symbol: 'Base', name: 'Base Value', description: 'The value that represents 100% — the whole or reference amount. Identifying the base correctly is the most common source of percentage errors.' },
      { symbol: 'Change', name: 'Percent Change', description: '(New − Old) ÷ Old × 100%. Positive = increase, negative = decrease. The base is always the OLD value, not the new value.' },
      { symbol: 'Decimal Equivalent', name: 'Decimal Form', description: 'The percentage divided by 100. For example, 20% = 0.20. Useful for multiplication in formulas.' },
    ],
    howToUse: [
      'Select the type of percentage calculation from the dropdown: "What is X% of Y?", "X is what % of Y?", "% change from X to Y", "Add X% to Y", or "Subtract X% from Y".',
      'Enter your two numbers (X and Y). X is typically the percentage or first value; Y is the base or second value.',
      'Read the result with the step-by-step calculation shown below. Each mode shows a different formula.',
      'Check the real-world example to see how this applies in daily life — tips, grades, discounts, taxes, and price changes.',
      'The decimal equivalent is shown for each calculation, which is useful for understanding the underlying ratio.',
    ],
    explanation:
      'Percentages are one of the most common mathematical operations in daily life — used for tips, taxes, discounts, interest rates, grades, and statistics. The key insight is that a percentage is always relative: 20% of $50 ($10) is very different from 20% of $500 ($100). Always identify what the "whole" (100%) is before calculating. For percent change, the original value is always the denominator, which is why a 50% increase requires a 33% decrease to return to the original. A common real-world pitfall: stores advertise "50% off" on already-reduced items, but the second discount applies to the already-reduced price, not the original. Similarly, a "10% increase" followed by a "10% decrease" does not return to the starting value because the decrease applies to a larger base. This asymmetry between percentage increases and decreases is one of the most important and misunderstood concepts in personal finance.',
    faqs: [
      {
        question: "What's the difference between percentage and percentage points?",
        answer: 'Percentage points measure the arithmetic difference between two percentages. If a rate increases from 5% to 7%, that is a 2 percentage point increase, but a 40% increase (2/5 = 0.4). This distinction is critical in finance, polling, and economic reporting.',
      },
      {
        question: 'How do I calculate a percentage without a calculator?',
        answer: '10% is easy — just divide by 10. Then multiply: 20% = 2 × 10%, 5% = half of 10%, 1% = divide by 100. Combine these: 15% = 10% + 5%. This mental math works for most common percentages.',
      },
      {
        question: 'Why does percent change not reverse symmetrically?',
        answer: 'A 25% increase followed by a 25% decrease does NOT return to the original. This is because the second percentage is applied to a different base. Example: 100 → +25% = 125 → −25% = 93.75. To reverse a 25% increase, you need a 20% decrease (25/125 = 0.2).',
      },
      {
        question: 'How do I calculate a percentage of a number?',
        answer: 'Multiply the number by the percentage divided by 100. For example, to find 15% of 200: 200 × (15 ÷ 100) = 200 × 0.15 = 30. For quick mental math, remember that "percent" literally means "per hundred" — you are taking that many parts out of 100.',
      },
      {
        question: 'What is the difference between a percentage increase and a markup?',
        answer: 'A percentage increase (or decrease) expresses the change relative to the original value: (New − Old) ÷ Old × 100. A markup is typically expressed as a percentage of cost, while margin is a percentage of price. If an item costs $50 and sells for $100, the markup is 100% ($50 profit ÷ $50 cost), but the margin is 50% ($50 profit ÷ $100 price). These are frequently confused in business.',
      },
    ],
    quickReference: [
      { label: '10% of 200', value: '20' },
      { label: '25% of 80', value: '20' },
      { label: '50 is what % of 200?', value: '25%' },
      { label: '50% of 100', value: '50' },
      { label: '100 increased by 25%', value: '125' },
      { label: '100 decreased by 25%', value: '75' },
      { label: 'Change from 50 to 75', value: '50% increase' },
      { label: 'Change from 75 to 50', value: '33.3% decrease' },
      { label: 'Decimal: 35%', value: '0.35' },
      { label: 'Fraction: 25%', value: '1/4' },
    ],
    commonUses: [
      'Shopping — calculate discounts, sale prices, and compare "percentage off" deals across different price points to find the best value',
      'Dining — compute tips as a percentage of the bill total, whether 15%, 18%, 20%, or a custom percentage',
      'Finance — track investment returns as percentage gains or losses, compare interest rates on loans and savings accounts',
      'Academics — convert test scores to letter grades by calculating the percentage of correct answers out of total questions',
      'Business — compute profit margins, tax rates, sales tax amounts, commission structures, and year-over-year growth rates',
    ],
    citations: [
      { source: 'Wikipedia - Percentage', url: 'https://en.wikipedia.org/wiki/Percentage' },
      { source: 'Wolfram MathWorld - Percent', url: 'https://mathworld.wolfram.com/Percent.html' },
    ],
  },
};

export default percentageConfig;
