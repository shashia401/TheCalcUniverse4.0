import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import PercentagePanel from './PercentagePanel';

const percentageCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Calculation Type',
      type: 'select',
      required: true,
      helpText: 'Choose the type of percentage calculation',
      options: [
        { label: 'What is X% of Y?', value: 'of' },
        { label: 'X is what % of Y?', value: 'whatpct' },
        { label: 'Percentage Change (X to Y)', value: 'change' },
        { label: 'Add X% to Y', value: 'add' },
        { label: 'Subtract X% from Y', value: 'subtract' },
      ],
    },
    {
      id: 'x',
      label: 'First Value',
      type: 'number',
      placeholder: '15',
      step: 0.01,
      required: true,
      helpText: 'First value for the percentage calculation',
    },
    {
      id: 'y',
      label: 'Second Value',
      type: 'number',
      placeholder: '200',
      step: 0.01,
      required: true,
      helpText: 'Second value for the percentage calculation',
    },
  ],
  explainSteps: (values) => {
    const mode = values.mode || 'of';
    const x = parseFloat(values.x);
    const y = parseFloat(values.y);

    if (isNaN(x) || isNaN(y)) return [];

    const fmt = (n: number) => {
      if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
      return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 });
    };

    if (mode === 'of') {
      const dec = x / 100;
      const result = (x / 100) * y;
      return [
        { label: 'Turn the percent into a decimal', expr: `${fmt(x)}% = ${fmt(x)} ÷ 100 = ${fmt(dec)}` },
        { label: 'Multiply by the base value', expr: `${fmt(dec)} × ${fmt(y)} = ${fmt(result)}`, note: `${fmt(x)}% of ${fmt(y)} is ${fmt(result)}.` },
        { label: 'What is left over', expr: `${fmt(y)} − ${fmt(result)} = ${fmt(y - result)}` },
      ];
    }

    if (mode === 'whatpct') {
      if (y === 0) return [];
      const ratio = x / y;
      const result = (x / y) * 100;
      return [
        { label: 'Write it as a ratio', expr: `${fmt(x)} ÷ ${fmt(y)} = ${fmt(ratio)}` },
        { label: 'Multiply by 100 to get a percent', expr: `${fmt(ratio)} × 100 = ${fmt(result)}%`, note: `${fmt(x)} is ${fmt(result)}% of ${fmt(y)}.` },
      ];
    }

    if (mode === 'change') {
      if (x === 0) return [];
      const diff = y - x;
      const change = ((y - x) / Math.abs(x)) * 100;
      return [
        { label: 'Find the absolute change', expr: `${fmt(y)} − ${fmt(x)} = ${fmt(diff)}` },
        { label: 'Divide by the original value', expr: `${fmt(diff)} ÷ |${fmt(x)}| = ${fmt(diff / Math.abs(x))}`, note: 'Percentage change always divides by the starting value, not the new one.' },
        { label: 'Multiply by 100', expr: `= ${change >= 0 ? '+' : ''}${fmt(change)}%` },
      ];
    }

    if (mode === 'add') {
      const result = y * (1 + x / 100);
      const added = result - y;
      return [
        { label: 'Find the amount to add', expr: `${fmt(x)}% of ${fmt(y)} = ${fmt(added)}` },
        { label: 'Add it to the base value', expr: `${fmt(y)} + ${fmt(added)} = ${fmt(result)}` },
      ];
    }

    if (mode === 'subtract') {
      const result = y * (1 - x / 100);
      const removed = y - result;
      return [
        { label: 'Find the amount to remove', expr: `${fmt(x)}% of ${fmt(y)} = ${fmt(removed)}` },
        { label: 'Subtract it from the base value', expr: `${fmt(y)} − ${fmt(removed)} = ${fmt(result)}` },
      ];
    }

    return [];
  },
  calculate: (values) => {
    const mode = values.mode || 'of';
    const x = parseFloat(values.x);
    const y = parseFloat(values.y);

    if (isNaN(x) || isNaN(y)) return [];

    const fmt = (n: number) => {
      if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
      return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 });
    };

    if (mode === 'of') {
      const result = (x / 100) * y;
      return [
        { id: 'result', label: `${fmt(x)}% of ${fmt(y)}`, value: fmt(result), highlight: true, color: 'positive' as const },
        { id: 'remainder', label: 'Remaining amount', value: fmt(y - result), color: 'neutral' as const },
      ];
    }

    if (mode === 'whatpct') {
      if (y === 0) return [];
      const result = (x / y) * 100;
      return [
        { id: 'result', label: `${fmt(x)} is what % of ${fmt(y)}`, value: `${fmt(result)}%`, highlight: true, color: 'positive' as const },
      ];
    }

    if (mode === 'change') {
      if (x === 0) return [];
      const change = ((y - x) / Math.abs(x)) * 100;
      return [
        { id: 'result', label: `% Change from ${fmt(x)} to ${fmt(y)}`, value: `${change >= 0 ? '+' : ''}${fmt(change)}%`, highlight: true, color: change >= 0 ? 'positive' as const : 'negative' as const },
        { id: 'absolute', label: 'Absolute Change', value: `${y - x >= 0 ? '+' : ''}${fmt(y - x)}`, color: 'neutral' as const },
      ];
    }

    if (mode === 'add') {
      const result = y * (1 + x / 100);
      const added = result - y;
      return [
        { id: 'result', label: `${fmt(y)} + ${fmt(x)}%`, value: fmt(result), highlight: true, color: 'positive' as const },
        { id: 'added', label: 'Amount Added', value: `+${fmt(added)}`, color: 'positive' as const },
      ];
    }

    if (mode === 'subtract') {
      const result = y * (1 - x / 100);
      const removed = y - result;
      return [
        { id: 'result', label: `${fmt(y)} − ${fmt(x)}%`, value: fmt(result), highlight: true, color: 'neutral' as const },
        { id: 'removed', label: 'Amount Removed', value: `-${fmt(removed)}`, color: 'negative' as const },
      ];
    }

    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PercentagePanel, { values, results });
  },
  educational: {
    formula: 'X% of Y = (X ÷ 100) × Y | % Change = (New − Old) ÷ |Old| × 100',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="100" width="320" height="80" fill="var(--svg-e5e7eb)" rx="8"/><rect x="60" y="100" width="128" height="80" fill="var(--svg-3b82f6)" rx="8"/><text x="220" y="148" text-anchor="middle" font-size="16" fill="var(--svg-333333)">40% of 250 = 100</text><line x1="188" y1="90" x2="188" y2="100" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="188" y="82" text-anchor="middle" font-size="12" fill="var(--svg-3b82f6)">40%</text><text x="60" y="230" font-size="12" fill="var(--svg-666666)">0%</text><text x="370" y="230" text-anchor="end" font-size="12" fill="var(--svg-666666)">100%</text></svg>',
      alt: 'Horizontal bar with 40% shaded showing percentage of a whole',
      caption: 'Percentage as a part of a whole — X% of Y equals (X/100) x Y',
    },
    formulaDescription:
      'Percentage calculations are among the most common and practical mathematical operations used in everyday life. The basic formula converts a percentage to a decimal by dividing by 100, then multiplies by the base value. Percentage change measures relative growth or decline by computing the absolute difference divided by the original value. Adding a percentage increases a value by a proportional amount, while subtracting decreases it accordingly. Understanding these five modes covers virtually all common percentage scenarios from shopping discounts to investment returns.',
    variables: [
      { symbol: 'X', name: 'Percentage or First Value', description: 'The percentage amount or the starting value depending on the calculation type.' },
      { symbol: 'Y', name: 'Base Value or Second Value', description: 'The number you are taking the percentage of, or the ending value in a change calculation.' },
      { symbol: 'Mode', name: 'Calculation Type', description: 'Determines which formula is applied: percent-of, what-percent, percent-change, add-percent, or subtract-percent.' },
    ],
    commonUses: [
      'Calculating a tip amount, sales tax, or discount by finding what a given percentage is of a total',
      'Determining percentage change between two values for investment returns, price changes, or grade improvements',
      'Figuring out what percentage one number is of another for budget breakdowns or survey results',
      'Adding or subtracting a percentage from a number for scenarios like markup, discount, or tax-inclusive pricing',
    ],
    howToUse: [
      'Select the type of percentage calculation you need from five common modes.',
      'Enter values X and Y based on your specific question.',
      'The result displays instantly with clear labeling for each mode.',
      'Use "What is X% of Y" for discounts or portions. Use "% Change" for comparing two values over time.',
    ],
    explanation:
      'This calculator handles five of the most common percentage questions: finding a percentage of a number, determining what percent one number is of another, calculating percentage change between two values, adding a percentage to a number (like tax or tip), and subtracting a percentage from a number (like a discount). The word "percent" comes from the Latin "per centum" meaning "by the hundred," and the percent sign (%) is believed to have evolved from the Italian "per cento" shorthand used by merchants in the 15th century. Percentage change is one of the most misunderstood calculations — it always divides by the original value, not the new one. This confusion leads to the classic "50% off then 50% off" mistake: a 50% discount followed by another 50% discount is 75% off total, not 100% off. Percentages are used everywhere in daily life: sales tax rates, restaurant tips, investment returns, loan interest rates, grade scoring, statistical reports, and nutrition labels. Understanding the difference between a relative change (percentage change) and an absolute change (percentage points) is crucial for correctly interpreting news about inflation, unemployment rates, and economic growth. For example, if an investment grows from $1,000 to $1,200, that is a 20% increase or a gain of $200. Understanding whether a report is using relative percentage change or absolute percentage points completely changes how you interpret economic or financial data.',
    workedExamples: [
      { scenario: 'Sarah sees a jacket priced at $85 with a 30% off tag. She wants to know the final price.', inputs: { mode: 'subtract', x: '30', y: '85' }, result: 'Final price: $59.50 (saved $25.50).', insight: 'The calculator subtracts 30% from $85, showing a final price of $59.50 with $25.50 saved. Sarah can confirm this is a good deal compared to the original price.' },
      { scenario: 'Mike invested $2,000 in a stock that is now worth $2,600. He wants to know his return as a percentage.', inputs: { mode: 'change', x: '2000', y: '2600' }, result: '+30% change (absolute gain of +$600).', insight: 'The percentage change from $2,000 to $2,600 is +30%. Mike can compare this return against the S&P 500 average of ~10% per year to evaluate his performance.' },
      { scenario: 'A restaurant bill shows a subtotal of $65. The local sales tax is 8.75%. Emma wants to know the total including tax.', inputs: { mode: 'add', x: '8.75', y: '65' }, result: 'Total: $70.69 (tax added: $5.69).', insight: 'Adding 8.75% to $65 gives $70.69 total including $5.69 in tax. Emma should budget at least $71 for this meal including tax, plus any additional tip.' },
    ],
    proTips: [
      'To quickly estimate a 15% tip: find 10% (move decimal one place left), then add half of that amount. For a $48 bill: 10% is $4.80, half is $2.40, so ~$7.20 tip.',
      'When comparing percentage changes, always note the base value. A 50% increase on $10 is only $5, while a 10% increase on $1,000 is $100. The absolute change matters more than the percentage for large-base comparisons.',
      'For stacked discounts (e.g., "50% off, plus an extra 20% off"), the discounts multiply, they do not add. 50% off then 20% off equals 60% off total, not 70% off. Use our Percent Off Calculator for precise stacked discount calculations.',
      'In finance, always check whether a change is reported in "percentage points" or "percent." An interest rate moving from 4% to 5% is a 1 percentage point increase but a 25% relative increase in the rate itself.',
      'Sales tax rates vary significantly by location in the US: from 0% (Alaska, Delaware, Montana, New Hampshire, Oregon) to over 9% (Louisiana, Tennessee, Arkansas). Always check your local combined state and city tax rate.',
    ],
    limitations: [
      'Pure percentage calculations assume linear relationships, but real-world applications often involve compounding (like compound interest), tiered tax brackets, or progressive discount structures.',
      'When calculating percentage changes, results are undefined when the original value is zero.',
      'For financial calculations involving compound growth, use a dedicated compound interest calculator.',
      'For tax calculations, this tool provides simple percentage math and does not account for marginal tax brackets, deductions, or credits.',
    ],
    quickReference: [
      { label: 'X% of Y formula', value: '(X ÷ 100) × Y' },
      { label: '% Change formula', value: '(New − Old) ÷ |Old| × 100' },
      { label: 'Add X% to Y', value: 'Y × (1 + X ÷ 100)' },
      { label: 'Subtract X% from Y', value: 'Y × (1 − X ÷ 100)' },
      { label: '1% of $100', value: '$1.00' },
      { label: '10% of $50', value: '$5.00' },
    ],
    faqs: [
      {
        question: 'What is the difference between percentage and percentage points?',
        answer: 'If a rate goes from 10% to 15%, that is a 5 percentage point increase, but a 50% increase in the rate itself. These are frequently confused in media reporting. For example, if the unemployment rate rises from 4% to 6%, that is a 2 percentage point increase but a 50% relative increase in the number of unemployed people.',
      },
      {
        question: 'How do I calculate a discount?',
        answer: 'Use "Subtract X% from Y" — enter the discount percentage as X and the original price as Y. For example, for a 25% discount on a $100 item, enter 25 as X and 100 as Y. The result will show $75 as the final price with $25 removed.',
      },
      {
        question: 'How do percentage-based sales tax calculations work?',
        answer: 'Use "Add X% to Y" to calculate total price including tax. For example, if an item costs $50 and your local sales tax is 8%, enter 8 as X (percentage) and 50 as Y (base value). The result shows $54.00 as the total including $4.00 in tax.',
      },
      {
        question: 'What does a 0% percentage change mean?',
        answer: 'A 0% change means the new value is identical to the old value. No increase or decrease occurred. This is useful for comparison shopping, investment tracking, or verifying that values have remained stable over time.',
      },
      {
        question: 'How do I reverse-calculate a percentage?',
        answer: 'If you know the final price and the discount percentage, you can find the original price. For example, if an item costs $68 after a 20% discount, the original price was $68 divided by 0.80 (100% minus 20%), which equals $85. Use the "X is what percent of Y" mode to verify your reverse calculations.',
      },
    ],
  
    citations: [
      { source: 'NIST - Math Reference', url: 'https://www.nist.gov/pml/owm/metric-si/unit-conversion' },
      { source: 'Khan Academy', url: 'https://www.khanacademy.org/math/pre-algebra/pre-algebra-ratios-rates' },
    ],
  },
};

export default percentageCalculatorConfig;
