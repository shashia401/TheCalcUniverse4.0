import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import LongDivisionPanel from './LongDivisionPanel';

function longDivision(dividend: number, divisor: number): {
  quotient: number;
  remainder: number;
  steps: { digit: number; product: number; subtraction: number; result: number; broughtDown: number }[];
  decimalResult: string;
} {
  const isDecimal = dividend % 1 !== 0 || divisor % 1 !== 0;
  if (isDecimal) {
    const quotient = dividend / divisor;
    return {
      quotient: Math.floor(quotient),
      remainder: 0,
      steps: [],
      decimalResult: quotient.toFixed(6),
    };
  }

  const dividendStr = Math.abs(dividend).toString();
  const absDivisor = Math.abs(divisor);
  const sign = (dividend < 0) !== (divisor < 0) ? -1 : 1;

  let current = 0;
  const steps: { digit: number; product: number; subtraction: number; result: number; broughtDown: number }[] = [];

  for (let i = 0; i < dividendStr.length; i++) {
    const digit = parseInt(dividendStr[i]);
    current = current * 10 + digit;
    const product = Math.floor(current / absDivisor) * absDivisor;
    const subtraction = current - product;
    steps.push({
      digit,
      product,
      subtraction,
      result: Math.floor(current / absDivisor),
      broughtDown: current,
    });
    current = subtraction;
  }

  const quotient = Math.floor(Math.abs(dividend) / absDivisor) * sign;
  const remainder = Math.abs(dividend) % absDivisor;

  // Decimal continuation
  let decimalPart = '';
  let rem = remainder;
  let precision = 0;
  while (rem > 0 && precision < 6) {
    rem *= 10;
    const d = Math.floor(rem / absDivisor);
    decimalPart += d.toString();
    rem = rem % absDivisor;
    precision++;
  }
  const decimalResult = decimalPart ? `${Math.abs(quotient)}.${decimalPart}` : Math.abs(quotient).toString();

  return { quotient, remainder, steps, decimalResult };
}

const longDivisionConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'dividend',
      label: 'Dividend',
      type: 'number',
      placeholder: '4876',
      step: 1,
      helpText: 'The number being divided',
    },
    {
      id: 'divisor',
      label: 'Divisor',
      type: 'number',
      placeholder: '12',
      min: 1,
      step: 1,
      helpText: 'The number doing the dividing',
    },
  ],
  calculate: (values) => {
    const dividend = parseInt(values.dividend);
    const divisor = parseInt(values.divisor);

    if (isNaN(dividend) || isNaN(divisor) || divisor === 0) return [];

    const result = longDivision(Math.abs(dividend), Math.abs(divisor));
    const sign = (dividend < 0) !== (divisor < 0) ? -1 : 1;

    return [
      ...(result.steps.length > 0 ? [
        { id: 'quotient', label: 'Quotient', value: (result.quotient * sign).toString(), highlight: true, color: 'positive' as const },
        { id: 'remainder', label: 'Remainder', value: result.remainder.toString() },
        { id: 'decimalResult', label: 'Decimal Result', value: (parseFloat(result.decimalResult) * sign).toString() },
        { id: '_divisionData', label: 'Division Steps', value: JSON.stringify({
          dividend: Math.abs(dividend),
          divisor: Math.abs(divisor),
          steps: result.steps,
          quotient: Math.abs(result.quotient),
          remainder: result.remainder,
          decimalResult: result.decimalResult,
        }) },
      ] : [
        { id: 'quotient', label: 'Quotient', value: (parseFloat(result.decimalResult) * sign).toString(), highlight: true, color: 'positive' as const },
        { id: 'decimalResult', label: 'Decimal Result', value: (parseFloat(result.decimalResult) * sign).toString() },
      ]),
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(LongDivisionPanel, { values, results });
  },
  educational: {
    formula: 'Dividend ÷ Divisor = Quotient + Remainder / Divisor',
    formulaDescription:
      'Long division breaks a division problem into a sequence of smaller, manageable steps using the standard algorithm taught in elementary arithmetic. The process follows a repeating four-step cycle: divide the current partial dividend by the divisor to get a quotient digit, multiply that quotient digit by the divisor, subtract the product from the partial dividend, and bring down the next digit. This cycle repeats until all digits of the dividend have been processed.',
    variables: [
      { symbol: 'Dividend', name: 'Dividend', description: 'The number being divided, placed inside the division bracket. It represents the total amount to be split into equal parts.' },
      { symbol: 'Divisor', name: 'Divisor', description: 'The number doing the dividing, placed outside the bracket. It represents the size of each group or the number of groups.' },
      { symbol: 'Quotient', name: 'Quotient', description: 'The whole-number result of the division, written above the bracket. Each digit is determined sequentially through the division algorithm.' },
      { symbol: 'Remainder', name: 'Remainder', description: 'The amount left over after dividing completely. Always less than the divisor. Can be continued as a decimal for fractional results.' },
    ],
    howToUse: [
      'Enter the dividend (the number being divided) in the first field.',
      'Enter the divisor (the number doing the dividing) in the second field.',
      'View the quotient (whole number result) and remainder (amount left over).',
      'The traditional long division tableau shows each step of the process: how each digit is brought down, multiplied, and subtracted.',
      'To get a decimal result, the calculator will continue the division by adding decimal places to the dividend.',
    ],
    explanation:
      'Long division is a standard arithmetic algorithm for dividing multi-digit numbers. It follows a repeating pattern: divide the current partial dividend by the divisor to get the next quotient digit, multiply that quotient digit by the divisor, subtract the product from the partial dividend, and bring down the next digit. This cycle continues until all digits have been processed. The algorithm is the foundation for understanding division as repeated subtraction and is essential for more advanced topics like polynomial division in algebra. Despite being taught in elementary school, long division remains useful in everyday life for splitting bills, calculating unit prices, and understanding proportions. The step-by-step tableau makes the process transparent, showing exactly how each digit contributes to the final quotient.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" fill="var(--svg-374151)" font-size="12" font-weight="bold">Long Division Layout</text><text x="160" y="38" text-anchor="middle" fill="var(--svg-374151)" font-size="10">4876 &amp;divide; 12</text><text x="140" y="98" text-anchor="end" fill="var(--svg-3b82f6)" font-size="16" font-weight="bold">4</text><text x="155" y="98" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="16" font-weight="bold">0</text><text x="172" y="98" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="16" font-weight="bold">6</text><text x="192" y="98" text-anchor="start" fill="var(--svg-3b82f6)" font-size="16" font-weight="bold">.</text><text x="210" y="98" text-anchor="middle" fill="var(--svg-9ca3af)" font-size="16" font-weight="bold">3</text><text x="228" y="98" text-anchor="middle" fill="var(--svg-9ca3af)" font-size="16" font-weight="bold">3</text><text x="246" y="98" text-anchor="middle" fill="var(--svg-9ca3af)" font-size="16" font-weight="bold">3</text><line x1="100" y1="108" x2="260" y2="108" stroke="var(--svg-374151)" stroke-width="2"/><text x="75" y="130" text-anchor="end" fill="var(--svg-ef4444)" font-size="18" font-weight="bold">12</text><text x="95" y="130" text-anchor="end" fill="var(--svg-374151)" font-size="18">)</text><text x="115" y="130" text-anchor="start" fill="var(--svg-374151)" font-size="18">4</text><text x="137" y="130" text-anchor="middle" fill="var(--svg-374151)" font-size="18">8</text><text x="159" y="130" text-anchor="middle" fill="var(--svg-374151)" font-size="18">7</text><text x="181" y="130" text-anchor="middle" fill="var(--svg-374151)" font-size="18">6</text><text x="203" y="130" text-anchor="start" fill="var(--svg-374151)" font-size="18">.</text><text x="222" y="130" text-anchor="middle" fill="var(--svg-9ca3af)" font-size="18">0</text><line x1="95" y1="135" x2="190" y2="135" stroke="var(--svg-374151)" stroke-width="1"/><text x="115" y="153" text-anchor="start" fill="var(--svg-6b7280)" font-size="10">Step 1: 48 &amp;divide; 12 = 4</text><text x="115" y="168" text-anchor="start" fill="var(--svg-6b7280)" font-size="10">Step 2: 4 &amp;times; 12 = 48</text><text x="115" y="183" text-anchor="start" fill="var(--svg-6b7280)" font-size="10">Step 3: Subtract, bring down next digit</text><text x="115" y="198" text-anchor="start" fill="var(--svg-6b7280)" font-size="10">Repeat until all digits processed</text></svg>',
      alt: 'Traditional long division bracket showing the dividend inside, divisor outside, and quotient above',
      caption: 'Long division uses a bracket layout. The divisor goes outside, the dividend inside, and the quotient builds above.',
    },
    faqs: [
      {
        question: 'What does the long division tableau show?',
        answer: 'The traditional bracket notation (also called the "division bracket" or "tableau") shows the divisor outside to the left, the dividend inside, and the quotient being built above. Each row below the dividend shows a subtraction step: multiply the current quotient digit by the divisor, write the product under the current working digits, subtract to find the remainder, and bring down the next digit. This visual representation makes the algorithm transparent and educational.',
      },
      {
        question: 'What happens when the division doesn\'t end evenly?',
        answer: 'When the division does not come out even, the remainder is the amount left over after the last subtraction. You can continue the division by adding a decimal point and zeros to the dividend, producing a decimal result. The calculator can continue to up to 6 decimal places. For example, 10 ÷ 3 = 3 R1, or as a decimal 3.333333... where the 3 repeats infinitely.',
      },
      {
        question: 'What is the difference between integer division and decimal division?',
        answer: 'Integer division stops at the whole number and reports the remainder (e.g., 7 ÷ 3 = 2 R1). Decimal division continues past the decimal point to produce a fractional result (e.g., 7 ÷ 3 = 2.333333...). This calculator supports both modes: the primary result shows the quotient and remainder, while additional decimal precision is available by continuing the algorithm past the decimal point.',
      },
      {
        question: 'How many decimal places should I use in my answer?',
        answer: 'It depends on the context. For financial calculations, 2 decimal places (cents) are standard. For scientific work, 3-6 significant figures are typical. For pure math problems, the exact fraction (quotient R remainder) is often preferred. This calculator shows up to 6 decimal places by default, which covers most practical needs.',
      },
      {
        question: 'Can long division handle very large numbers?',
        answer: 'Yes, the algorithm works for any size numbers. The step-by-step process is the same whether you are dividing 25 ÷ 5 or 12,345,678 ÷ 123. Each step processes one digit at a time, so the difficulty scales linearly with the number of digits in the dividend, not exponentially. Computer-based long division can handle numbers with hundreds of digits.',
      },
    ],
    commonUses: [
      'Calculating unit prices when shopping (e.g., $12 for 48 oz → $0.25/oz)',
      'Splitting bills evenly among groups of people',
      'Converting between units (e.g., inches to feet by dividing by 12)',
      'Calculating fuel efficiency (miles ÷ gallons = MPG)',
    ],
    quickReference: [
      { label: 'Dividend', value: 'Number being divided (inside bracket)' },
      { label: 'Divisor', value: 'Number dividing by (outside bracket)' },
      { label: 'Quotient', value: 'Whole-number result (above bracket)' },
      { label: 'Remainder', value: 'Amount left over (R notation)' },
      { label: 'Divide, Multiply, Subtract, Bring Down', value: 'The 4-step cycle of long division' },
    ],
    citations: [
      { source: 'Wikipedia - Long Division', url: 'https://en.wikipedia.org/wiki/Long_division' },
      { source: 'Wolfram MathWorld - Division', url: 'https://mathworld.wolfram.com/Division.html' },
    ],
  },
};

export default longDivisionConfig;
