import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import InterestCalcPanel from './InterestCalcPanel';

const interestCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'principal',
      label: 'Principal Amount',
      type: 'number',
      placeholder: '10,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'Starting balance — the amount borrowed or invested',
    },
    {
      id: 'interestRate',
      label: 'Annual Interest Rate',
      type: 'number',
      placeholder: '5',
      unit: '%',
      min: 0,
      max: 100,
      step: 0.01,
      required: true,
      helpText: 'The yearly interest rate applied to your principal amount.',
    },
    {
      id: 'timeUnit',
      label: 'Time Period In',
      type: 'select',
      required: true,
      options: [
        { label: 'Years', value: 'years' },
        { label: 'Months', value: 'months' },
        { label: 'Days', value: 'days' },
      ],
      helpText: 'Unit of time for the investment or loan period.',
    },
    {
      id: 'timePeriod',
      label: 'Time Period',
      type: 'number',
      placeholder: '5',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Length of time your money will be borrowed or invested.',
    },
    {
      id: 'interestType',
      label: 'Interest Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Simple Interest — A = P(1 + rt)', value: 'simple' },
        { label: 'Compound Interest — A = P(1 + r/n)^(nt)', value: 'compound' },
      ],
      helpText: 'Simple: interest on principal only. Compound: interest on prior interest too.',
    },
    {
      id: 'compoundFrequency',
      label: 'Compounding Frequency',
      type: 'select',
      options: [
        { label: 'Annually (1×/year)', value: '1' },
        { label: 'Semi-Annually (2×/year)', value: '2' },
        { label: 'Quarterly (4×/year)', value: '4' },
        { label: 'Monthly (12×/year)', value: '12' },
        { label: 'Daily (365×/year)', value: '365' },
      ],
      helpText: 'Compound interest only — how often interest is applied to the balance',
    },
  ],
  calculate: (values) => {
    const P = parseFloat(values.principal);
    const annualRate = parseFloat(values.interestRate) / 100;
    const timeUnit = values.timeUnit || 'years';
    const timePeriod = parseFloat(values.timePeriod);
    const interestType = values.interestType || 'simple';
    const n = parseFloat(values.compoundFrequency || '12');

    if ([P, annualRate, timePeriod].some(isNaN) || P <= 0 || timePeriod <= 0) return [];

    let t: number;
    if (timeUnit === 'years') {
      t = timePeriod;
    } else if (timeUnit === 'months') {
      t = timePeriod / 12;
    } else {
      t = timePeriod / 365;
    }

    let totalAmount: number;
    let totalInterest: number;
    let formulaDisplay: string;

    if (interestType === 'simple') {
      totalInterest = P * annualRate * t;
      totalAmount = P + totalInterest;
      formulaDisplay = `A = ${P.toLocaleString(undefined)} × (1 + ${(annualRate * 100).toFixed(2)}% × ${t.toFixed(4)}) = $${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      totalAmount = P * Math.pow(1 + annualRate / n, n * t);
      totalInterest = totalAmount - P;
      formulaDisplay = `A = ${P.toLocaleString(undefined)} × (1 + ${(annualRate / n * 100).toFixed(4)}%)^${(n * t).toFixed(1)} = $${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const growthMultiple = totalAmount / P;
    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const results = [
      {
        id: 'totalInterest',
        label: `Total Interest ${annualRate > 0 && P > 0 ? (interestType === 'simple' ? 'Earned / Owed (Simple)' : 'Earned / Owed (Compound)') : ''}`,
        value: `$${fmt(totalInterest)}`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'principal',
        label: 'Principal',
        value: `$${fmt(P)}`,
        color: 'neutral' as const,
      },
      {
        id: 'totalAmount',
        label: 'Total Accrued (Principal + Interest)',
        value: `$${fmt(totalAmount)}`,
        color: 'neutral' as const,
      },
      {
        id: 'growthMultiple',
        label: 'Growth Multiple',
        value: `${growthMultiple.toFixed(3)}× your money`,
        color: 'positive' as const,
      },
      {
        id: 'formula',
        label: interestType === 'simple' ? 'Formula: A = P(1 + rt)' : `Formula: A = P(1 + r/n)^(nt) · n = ${n} (${['', 'Annually', 'Semi-Annually', '', 'Quarterly', '', '', '', '', '', '', '', 'Monthly'][n] || 'Daily'})`,
        value: formulaDisplay,
        color: 'neutral' as const,
      },
    ];

    if (interestType === 'compound') {
      const simpleInterest = P * annualRate * t;
      const compoundBonus = totalInterest - simpleInterest;
      if (compoundBonus > 0.01) {
        results.push({
          id: 'compoundBonus',
          label: 'Interest Earned on Interest (Compound Advantage)',
          value: `$${fmt(compoundBonus)} more than simple interest`,
          color: 'positive' as const,
        });
      }
    }

    const effectiveAnnualRate = interestType === 'simple'
      ? annualRate * 100
      : (Math.pow(1 + annualRate / n, n) - 1) * 100;

    results.push({
      id: 'effectiveRate',
      label: interestType === 'simple' ? 'Effective Annual Rate (EAR)' : 'Effective Annual Rate (EAR) — accounts for compounding',
      value: `${effectiveAnnualRate.toFixed(4)}%`,
      color: 'neutral' as const,
    });

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(InterestCalcPanel, { values, results });
  },
  educational: {
    formula: 'Simple: A = P(1 + rt) | Compound: A = P(1 + r/n)^(nt)',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/><text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">Simple vs. Compound Interest</text><text x="160" y="34" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">$10,000 invested at 7% over 30 years</text><g transform="translate(30,36)"><line x1="0" y1="100" x2="260" y2="100" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="0" y1="70" x2="260" y2="70" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="0" y1="40" x2="260" y2="40" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="0" y1="10" x2="260" y2="10" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="0" y1="100" x2="0" y2="0" stroke="var(--svg-cbd5e1)" stroke-width="0.5"/><line x1="0" y1="100" x2="260" y2="30" stroke="var(--svg-ef4444)" stroke-width="2.5" stroke-linecap="round"/><text x="265" y="28" font-size="8" fill="var(--svg-ef4444)" font-weight="bold">Simple</text><path d="M 0,100 Q 30,95 60,80 Q 100,60 140,35 Q 180,18 220,8 Q 245,3 260,2" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2.5" stroke-linecap="round"/><text x="265" y="4" font-size="8" fill="var(--svg-3b82f6)" font-weight="bold">Compound</text><text x="0" y="114" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)">0</text><text x="87" y="114" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)">10yr</text><text x="173" y="114" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)">20yr</text><text x="260" y="114" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)">30yr</text></g><rect x="30" y="160" width="260" height="30" rx="6" fill="var(--svg-f1f5f9)"/><text x="85" y="179" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)">Simple: $31,000</text><text x="200" y="179" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">Compound: $76,123</text><text x="160" y="196" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">2.5× more with compounding — the eighth wonder of the world</text></svg>',
      alt: 'Line chart comparing simple interest (red, linear) versus compound interest (blue, exponential) growth of $10,000 at 7% over 30 years',
      caption: 'Simple interest grows linearly on the principal only; compound interest earns interest on interest, creating exponential growth that accelerates over time',
    },
    formulaDescription:
      'Simple interest applies the rate only to the principal — the relationship is linear, so the total interest is exactly the same every year. Compound interest applies the rate to the growing balance, meaning you earn interest on your previously earned interest — this creates an exponential growth curve that accelerates over time.',
    variables: [
      { symbol: 'P', name: 'Principal', description: 'The original amount borrowed or invested. This is the baseline from which all interest is calculated. In simple interest, interest is always based on this original amount. In compound interest, the base grows each period.' },
      { symbol: 'r', name: 'Annual Interest Rate', description: 'The nominal interest rate as a decimal (e.g., 5% = 0.05). For compound interest, this rate is divided by the compounding frequency n to get the periodic rate applied each compounding period.' },
      { symbol: 't', name: 'Time (years)', description: 'The length of the period in years. Can be fractional when using months or days. Time is the most powerful variable in compounding — the longer the time horizon, the more dramatic the exponential growth.' },
      { symbol: 'n', name: 'Compounding Frequency', description: 'How many times per year interest is calculated and added to the balance. Common values: 1 (annual), 12 (monthly), 365 (daily). More frequent compounding results in a higher effective annual rate because interest begins earning interest sooner.' },
      { symbol: 'A', name: 'Total Accrued Amount', description: 'The final balance including both the original principal and all accumulated interest. Also called the future value. The difference between A and P is the total interest earned or owed.' },
    ],
    howToUse: [
      'Enter the principal (starting amount).',
      'Enter the annual interest rate.',
      'Select the time unit (years, months, or days) and enter the time period.',
      'Select Simple or Compound interest.',
      'For compound interest, select how often interest compounds (monthly is the most common for loans and savings accounts).',
      'Review the effective annual rate (EAR) — this is the true annual rate that accounts for compounding frequency, which you should use to compare different products.',
    ],
    commonUses: [
      'Calculate the total interest earned on a savings account or charged on a loan using either simple or compound interest formulas.',
      'Compare simple versus compound interest on the same principal to see how compounding supercharges long-term investment growth.',
      'Determine the effective annual rate to compare financial products with different compounding frequencies on an apples-to-apples basis.',
    ],
    explanation:
      'Simple interest is straightforward: you pay or earn interest only on the original principal. Car loans and some personal loans use simple interest. The total cost is predictable and linear. Compound interest is far more powerful: you earn interest on previously earned interest, causing exponential growth. Savings accounts, investments, mortgages, and credit cards all use compound interest. The more frequently interest compounds, the larger the effective annual rate — daily compounding yields more than annual compounding at the same stated rate. The compound advantage (shown as "Interest Earned on Interest" in the results) quantifies exactly how much extra you earn from compounding versus simple interest. This difference is small in year one but grows dramatically over time, reflecting Albert Einstein\'s famous characterization of compound interest as the "eighth wonder of the world."',
    faqs: [
      {
        question: 'Which is better — simple or compound interest?',
        answer: 'It depends entirely on whether you are earning or paying interest. For investing and saving: compound interest is overwhelmingly better — your money grows faster and accelerates over time. For borrowing: simple interest is better — you pay less total interest because interest never accrues on previously accumulated interest. Credit cards use daily compound interest on balances, which is why carrying a credit card balance can be so expensive — the interest compounds every single day.',
      },
      {
        question: 'What is the Rule of 72?',
        answer: 'The Rule of 72 is a mental math shortcut: divide 72 by your annual interest rate to estimate how many years it takes to double your money. At 6% return: 72 ÷ 6 = 12 years to double. At 12%: just 6 years. At 3%: 24 years. It works well for compound interest in the range of 2-30% and is a useful quick check when comparing investment scenarios without needing a calculator.',
      },
      {
        question: 'What is the Effective Annual Rate (EAR)?',
        answer: 'EAR is the true annual rate after accounting for compounding frequency. A 12% nominal rate compounded monthly has an EAR of 12.68%, not 12%. The formula is EAR = (1 + r/n)^n − 1. When comparing financial products, always compare EARs (or APYs) — two accounts with the same nominal rate but different compounding frequencies will earn different amounts. This calculator shows the EAR separately so you can make apples-to-apples comparisons.',
      },
      {
        question: 'Why does daily compounding earn more than annual?',
        answer: 'With annual compounding, interest is calculated once at year-end and added to the balance. With daily compounding, interest is calculated and added to the balance every single day, so each day the slightly larger balance earns interest on the slightly larger balance. Over a 1-year period the difference is modest — but over 20-30 years, daily compounding can add tens of thousands of dollars more than annual compounding on the same principal and rate.',
      },
    ],
  citations: [
    { source: 'Federal Reserve', url: 'https://www.federalreserve.gov' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/i/interest.asp' },
  ],
  },
};

export default interestCalculatorConfig;
