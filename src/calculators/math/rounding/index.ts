import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RoundingPanel from './RoundingPanel';

function roundTo(num: number, place: string): { rounded: number; raw: number } {
  let divisor: number;
  switch (place) {
    case 'ten': divisor = 10; break;
    case 'hundred': divisor = 100; break;
    case 'thousand': divisor = 1000; break;
    case 'tenth': divisor = 0.1; break;
    case 'hundredth': divisor = 0.01; break;
    case 'thousandth': divisor = 0.001; break;
    case 'ten-thousandth': divisor = 0.0001; break;
    case 'unit': divisor = 1; break;
    case 'million': divisor = 1000000; break;
    default: divisor = 1;
  }
  return { rounded: Math.round(num / divisor) * divisor, raw: num };
}

function getRoundingDescription(num: number, place: string): { lower: number; upper: number; direction: 'up' | 'down'; digit: number } {
  let divisor: number;
  switch (place) {
    case 'ten': divisor = 10; break;
    case 'hundred': divisor = 100; break;
    case 'thousand': divisor = 1000; break;
    case 'tenth': divisor = 0.1; break;
    case 'hundredth': divisor = 0.01; break;
    case 'thousandth': divisor = 0.001; break;
    case 'ten-thousandth': divisor = 0.0001; break;
    case 'unit': divisor = 1; break;
    case 'million': divisor = 1000000; break;
    default: divisor = 1;
  }
  const lower = Math.floor(num / divisor) * divisor;
  const upper = lower + divisor;
  const mid = lower + divisor / 2;
  const direction = num >= mid ? 'up' : 'down';
  const digit = Math.floor((num / divisor) % 10);
  return { lower, upper, direction, digit };
}

const roundingConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'number',
      label: 'Number to Round',
      type: 'number',
      placeholder: '74',
      step: 0.001,
      inputMode: 'decimal',
      helpText: 'The number you want to round',
    },
    {
      id: 'place',
      label: 'Round to',
      type: 'select',
      required: true,
      options: [
        { label: 'Nearest Million', value: 'million' },
        { label: 'Nearest Thousand', value: 'thousand' },
        { label: 'Nearest Hundred', value: 'hundred' },
        { label: 'Nearest Ten', value: 'ten' },
        { label: 'Nearest Unit (Whole Number)', value: 'unit' },
        { label: 'Nearest Tenth', value: 'tenth' },
        { label: 'Nearest Hundredth', value: 'hundredth' },
        { label: 'Nearest Thousandth', value: 'thousandth' },
        { label: 'Nearest Ten-Thousandth', value: 'ten-thousandth' },
      ],
    },
  ],
  calculate: (values) => {
    const num = parseFloat(values.number);
    const place = values.place || 'unit';

    if (isNaN(num)) return [];

    const { rounded } = roundTo(num, place);
    const info = getRoundingDescription(num, place);

    return [
      { id: 'original', label: 'Original Number', value: num.toString() },
      { id: 'rounded', label: 'Rounded Value', value: rounded.toString(), highlight: true, color: 'positive' },
      { id: 'direction', label: 'Rounding Direction', value: info.direction === 'up' ? 'Round Up' : 'Round Down' },
      { id: 'roundingData', label: 'Rounding Data', value: JSON.stringify({ ...info, rounded, divisor: place === 'ten' ? 10 : place === 'hundred' ? 100 : place === 'thousand' ? 1000 : place === 'tenth' ? 0.1 : place === 'hundredth' ? 0.01 : place === 'thousandth' ? 0.001 : place === 'ten-thousandth' ? 0.0001 : place === 'million' ? 1000000 : 1 }) },
      { id: '_roundingData', label: 'Rounding Data', value: JSON.stringify({ ...info, rounded, divisor: place === 'ten' ? 10 : place === 'hundred' ? 100 : place === 'thousand' ? 1000 : place === 'tenth' ? 0.1 : place === 'hundredth' ? 0.01 : place === 'thousandth' ? 0.001 : place === 'ten-thousandth' ? 0.0001 : place === 'million' ? 1000000 : 1 }) },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(RoundingPanel, { values, results });
  },
  educational: {
    formula: 'round(x) = floor(x + 0.5) at the specified place',
    formulaDescription:
      'Rounding replaces a number with a nearby value that is shorter, simpler, or more explicit. The standard rule is: look at the digit immediately to the right of the target place. If that digit is 5 or greater, round up (increase the target digit by 1). If it is 4 or less, round down (keep the target digit unchanged). For example, 74 rounded to the nearest ten: look at the ones digit (4 < 5), so round down to 70.',
    variables: [
      { symbol: 'x', name: 'Original Number', description: 'The number to be rounded. Can be any real number including integers, decimals, or negative numbers.' },
      { symbol: 'Rounding Place', name: 'Target Precision', description: 'The position to round to: million, thousand, hundred, ten, unit (whole number), tenth, hundredth, thousandth, or ten-thousandth.' },
    ],
    howToUse: [
      'Enter the number you want to round in the input field.',
      'Select a rounding target from the dropdown: nearest million, thousand, hundred, ten, unit, tenth, hundredth, thousandth, or ten-thousandth.',
      'View the rounded result along with a number line visualization that shows why the number rounds in that direction.',
      'The rounding direction (up or down) is displayed to help understand the decision process.',
    ],
    explanation:
      'Rounding is a fundamental estimation skill used daily in finance (rounding prices and taxes), statistics (reporting significant figures), engineering (tolerances), and everyday life (estimating costs). The number line visualization helps learners understand that rounding means finding which "landmark" value the original number is closest to. For example, 74 is between 70 and 80 on the number line, and since 74 is less than 75 (the exact midpoint), it rounds down to 70. If the number were 75, the convention is to round up to 80 (known as "round half up," the most common rounding method). The midpoint rule — 5 rounds up — is a convention, not a mathematical truth, but it is universally taught and used. Alternative rounding methods exist for specialized contexts: "round half to even" (bankers\' rounding) is used in accounting to eliminate systematic upward bias, and "round toward zero" (truncation) is used in integer division in programming.',
    quickReference: [
      { label: 'Nearest ten', value: 'Look at ones digit. e.g. 74 → 70' },
      { label: 'Nearest hundred', value: 'Look at tens digit. e.g. 1,250 → 1,300' },
      { label: 'Nearest tenth', value: '1 decimal place. e.g. 3.72 → 3.7' },
      { label: 'Nearest hundredth', value: '2 decimal places. e.g. 3.728 → 3.73' },
      { label: 'Nearest unit', value: 'Whole number. e.g. 3.6 → 4' },
      { label: 'Round half up (standard)', value: '5 rounds up. Most common method' },
      { label: "Bankers' rounding", value: '5 rounds to even. Reduces bias' },
      { label: 'Truncation', value: 'Always round toward zero. Used in integer division' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><defs><marker id="ab" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="var(--svg-3b82f6)"/></marker></defs><line x1="30" y1="90" x2="290" y2="90" stroke="var(--svg-374151)" stroke-width="2"/><text x="30" y="110" text-anchor="middle" fill="var(--svg-374151)" font-size="12" font-weight="bold">70</text><line x1="30" y1="85" x2="30" y2="95" stroke="var(--svg-374151)" stroke-width="2"/><text x="95" y="110" text-anchor="middle" fill="var(--svg-9ca3af)" font-size="11">71</text><line x1="95" y1="85" x2="95" y2="95" stroke="var(--svg-d1d5db)" stroke-width="1"/><text x="160" y="110" text-anchor="middle" fill="var(--svg-ef4444)" font-size="12" font-weight="bold">74</text><circle cx="160" cy="90" r="5" fill="var(--svg-ef4444)"/><text x="160" y="125" text-anchor="middle" fill="var(--svg-ef4444)" font-size="9">(your number)</text><text x="225" y="110" text-anchor="middle" fill="var(--svg-9ca3af)" font-size="11">75</text><line x1="225" y1="85" x2="225" y2="95" stroke="var(--svg-3b82f6)" stroke-width="1.5" stroke-dasharray="3"/><text x="225" y="125" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="9">midpoint</text><text x="290" y="110" text-anchor="middle" fill="var(--svg-374151)" font-size="12" font-weight="bold">80</text><line x1="290" y1="85" x2="290" y2="95" stroke="var(--svg-374151)" stroke-width="2"/><line x1="160" y1="80" x2="30" y2="75" stroke="var(--svg-3b82f6)" stroke-width="2" marker-end="url(#ab)"/><text x="70" y="65" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="11" font-weight="bold">Round Down</text><text x="70" y="55" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="9">to 70</text><text x="160" y="145" text-anchor="middle" fill="var(--svg-6b7280)" font-size="10">74 &lt; 75, so round down to 70</text><text x="160" y="162" text-anchor="middle" fill="var(--svg-6b7280)" font-size="10">If 75 or higher, round up to 80</text><rect x="40" y="175" width="240" height="18" fill="var(--svg-e5e7eb)" rx="3"/><text x="160" y="188" text-anchor="middle" fill="var(--svg-374151)" font-size="9">Rule: look at next digit; &amp;ge;5 round up, &amp;lt;5 round down</text></svg>',
      alt: 'Number line from 70 to 80 showing the number 74 and the rounding decision to round down to 70',
      caption: 'Rounding replaces a number with the nearest landmark value based on the midpoint rule.',
    },
    workedExamples: [
      {
        scenario: 'Round 1,267 to the nearest hundred for a budget estimate.',
        inputs: { number: '1267', place: 'hundred' },
        result: '1,300',
        insight: 'The hundreds digit is 2, and the tens digit is 6. Since 6 ≥ 5, we round up. The hundreds digit increases from 2 to 3: 1,267 → 1,300. All digits after the hundreds place become zero.',
      },
      {
        scenario: 'Round 3.14159 to the nearest hundredth for π approximation.',
        inputs: { number: '3.14159', place: 'hundredth' },
        result: '3.14',
        insight: 'The hundredths digit is 4, and the thousandths digit is 1. Since 1 < 5, we round down to 3.14. This is the classic two-decimal approximation of π used in basic calculations.',
      },
      {
        scenario: 'Round 74.5 to the nearest unit (whole number) to test the midpoint rule.',
        inputs: { number: '74.5', place: 'unit' },
        result: '75',
        insight: '74.5 is exactly at the midpoint between 74 and 75. The standard "round half up" rule rounds 0.5 up, so 74.5 → 75. Note that bankers\' rounding would round to 74 (nearest even number) instead.',
      },
    ],
    proTips: [
      'When rounding for financial estimates, round to two decimal places (nearest hundredth) for dollar amounts — this matches the cent precision of real currency.',
      'The number of decimal places you keep signals your measurement precision. A measurement of 3.140 m implies precision to the nearest millimeter, while 3.14 m implies precision to the nearest centimeter.',
      'When rounding a series of numbers for a total, round AFTER summing, not before. Rounding each term individually can accumulate errors. For example, 1.4 + 1.4 + 1.4 = 4.2 → rounds to 4, but rounding each gives 1+1+1 = 3.',
      'For scientific work, consider using significant figures instead of fixed decimal places. Significant figures convey both the value and the precision: 0.050 has two significant figures (the leading zeros do not count), while 0.0500 has three.',
    ],
    limitations: [
      'This calculator uses the standard "round half up" convention (0.5 rounds up). It does not implement bankers\' rounding (round half to even), stochastic rounding, or round-toward-zero (truncation). For accounting applications requiring unbiased rounding, use a specialized tool.',
      'Negative numbers follow standard rounding toward the nearest value. For example, -3.5 rounds to -4 (not -3), because -4 is the next integer in the negative direction. Some programming languages (like Python\'s round()) handle this differently, so verify your environment.',
      'The precision is limited to the ten-thousandth place (0.0001). For scientific notation values, convert to decimal form first. The maximum supported rounding place is nearest million — larger magnitudes should be expressed in scientific notation.',
    ],
    faqs: [
      {
        question: 'When do I round up vs. round down?',
        answer: 'Look at the digit immediately to the right of your rounding place. If it is 5, 6, 7, 8, or 9, round up. If it is 0, 1, 2, 3, or 4, round down. For example, rounding 74 to the nearest ten: look at the ones digit (4), which is less than 5, so round down to 70. Rounding 76: the ones digit is 6, so round up to 80.',
      },
      {
        question: 'What is rounding to the nearest tenth?',
        answer: 'Rounding to the nearest tenth keeps one decimal place. Look at the hundredths digit (second decimal place). For example, 3.72 rounded to the nearest tenth is 3.7 (the hundredths digit 2 is less than 5). If the number were 3.78, it would round to 3.8. This is useful for reporting measurements to appropriate precision.',
      },
      {
        question: 'How do I round to the nearest hundred?',
        answer: 'Look at the tens digit. If it is 5 or greater, round the hundreds digit up. For example, 1,250 rounded to the nearest hundred is 1,300 (tens digit is 5). 1,249 rounded to the nearest hundred is 1,200 (tens digit is 4). The digits after the rounding place become zeros.',
      },
      {
        question: 'What is bankers\' rounding and how is it different?',
        answer: "Bankers' rounding (also called round half to even) rounds 0.5 to the nearest even number instead of always rounding up. So 2.5 → 2, 3.5 → 4, 4.5 → 4. This eliminates the systematic upward bias of always rounding 0.5 up, which is important in financial accounting and large datasets. Our calculator uses standard round-half-up, not bankers' rounding.",
      },
      {
        question: 'Why does rounding matter in real life?',
        answer: 'Rounding makes numbers easier to understand and communicate. Financial statements round to dollars, scientific measurements to significant figures, cooking recipes to convenient fractions, and census data to thousands. But rounding errors compound: NASA\'s Mars Climate Orbiter was lost in 1999 partly due to unit conversion rounding errors — a $327 million lesson in the importance of proper rounding.',
      },
      {
        question: 'How does rounding affect negative numbers?',
        answer: 'With standard rounding, negative numbers round the same way: -3.4 rounds to -3 (up on the number line), and -3.6 rounds to -4 (down on the number line). The digit rule is the same — look at the next digit. However, some programming languages handle negative rounding differently, so check the behavior of your specific tool when working with negatives programmatically.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Rounding', url: 'https://en.wikipedia.org/wiki/Rounding' },
      { source: 'Wolfram MathWorld - Rounding', url: 'https://mathworld.wolfram.com/Rounding.html' },
    ],
  },
};

export default roundingConfig;
