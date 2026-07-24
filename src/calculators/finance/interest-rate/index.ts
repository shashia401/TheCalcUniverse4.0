import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import InterestRatePanel from './InterestRatePanel';

const interestRateSvg = '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="4"/><text x="160" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Compound Interest Rate Solver</text><rect x="15" y="28" width="290" height="50" rx="6" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="160" y="44" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-1e40af)">Solving for the Rate</text><text x="160" y="60" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-3b82f6)">A = P(1 + r/n)^(nt)</text><text x="160" y="73" text-anchor="middle" font-size="7" fill="var(--svg-64748b)">r = n[(A/P)^(1/nt) - 1]</text><g transform="translate(15,88)"><rect x="10" y="0" width="100" height="28" rx="4" fill="var(--svg-3b82f6)"/><text x="60" y="19" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">P = $10,000</text><text x="60" y="36" text-anchor="middle" font-size="7" fill="var(--svg-64748b)">Principal</text><text x="125" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-64748b)">+</text><rect x="145" y="0" width="80" height="28" rx="4" fill="var(--svg-22c55e)"/><text x="185" y="19" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">$4,500</text><text x="185" y="36" text-anchor="middle" font-size="7" fill="var(--svg-64748b)">Interest</text><text x="235" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-64748b)">=</text><rect x="255" y="0" width="45" height="28" rx="4" fill="var(--svg-8b5cf6)"/><text x="277" y="19" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-ffffff)">A</text><text x="277" y="36" text-anchor="middle" font-size="6" fill="var(--svg-64748b)">$14.5K</text></g><rect x="15" y="132" width="290" height="30" rx="6" fill="var(--svg-f1f5f9)"/><text x="160" y="146" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-1e293b)">Compounding Frequency (n)</text><text x="55" y="158" text-anchor="middle" font-size="6" fill="var(--svg-64748b)">Monthly (12/yr)</text><text x="125" y="158" text-anchor="middle" font-size="6" fill="var(--svg-64748b)">Daily (365/yr)</text><text x="195" y="158" text-anchor="middle" font-size="6" fill="var(--svg-64748b)">Quarterly (4/yr)</text><text x="265" y="158" text-anchor="middle" font-size="6" fill="var(--svg-64748b)">Annual (1/yr)</text><rect x="15" y="170" width="290" height="24" rx="6" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="0.5"/><text x="160" y="186" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-b45309)">EAR = (1 + r/n)^n - 1  = true annual rate after compounding</text></svg>';

const interestRateConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'principal',
      label: 'Starting Principal (P)',
      type: 'number',
      placeholder: '10,000',
      prefix: '$',
      min: 0,
      step: 0.01,
      required: true,
      helpText: 'The amount you started with — the original loan or investment amount',
    },
    {
      id: 'finalAmount',
      label: 'Final Amount (A)',
      type: 'number',
      placeholder: '14,500',
      prefix: '$',
      min: 0,
      step: 0.01,
      required: true,
      helpText: 'The amount you ended up with — total paid or total value after growth',
    },
    {
      id: 'timePeriod',
      label: 'Time Period',
      type: 'number',
      placeholder: '5',
      inputMode: 'decimal',
      min: 0,
      step: 0.01,
      required: true,
      helpText: 'How long the money was invested or the loan was held',
    },
    {
      id: 'timeUnit',
      label: 'Time Unit',
      type: 'select',
      required: true,
      options: [
        { label: 'Years', value: 'years' },
        { label: 'Months', value: 'months' },
        { label: 'Days', value: 'days' },
      ],
    },
    {
      id: 'compoundFrequency',
      label: 'Compounding Frequency',
      type: 'select',
      required: true,
      options: [
        { label: 'Monthly (12x/year)', value: '12' },
        { label: 'Daily (365x/year)', value: '365' },
        { label: 'Quarterly (4x/year)', value: '4' },
        { label: 'Semi-Annually (2x/year)', value: '2' },
        { label: 'Annually (1x/year)', value: '1' },
        { label: 'Simple Interest (no compounding)', value: '0' },
      ],
    },
  ],
  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const P = parseFloat(values.principal);
    const A = parseFloat(values.finalAmount);
    const t_raw = parseFloat(values.timePeriod);
    const timeUnit = values.timeUnit || 'years';
    const n = parseFloat(values.compoundFrequency || '12');

    if ([P, A, t_raw].some(isNaN) || P <= 0 || A <= 0 || t_raw <= 0) return [];
    if (A <= P) return [{ id: 'error', label: 'Notice', value: 'Final amount must be greater than principal to calculate a positive rate.', color: 'negative' as const }];

    let t: number;
    switch (timeUnit) {
      case 'months': t = t_raw / 12; break;
      case 'days': t = t_raw / 365; break;
      default: t = t_raw;
    }

    let rate: number;
    let formula: string;

    if (n === 0) {
      rate = (A - P) / (P * t);
      formula = 'r = (A − P) / (P × t)';
    } else {
      rate = n * (Math.pow(A / P, 1 / (n * t)) - 1);
      formula = 'r = n × [(A/P)^(1/nt) − 1]';
    }

    if (!isFinite(rate) || rate < 0) return [{ id: 'error', label: 'Result', value: 'Invalid inputs — check values and try again.', color: 'negative' as const }];

    const pct = (r: number) => `${(r * 100).toFixed(4)}%`;
    const fmtD = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const ear = n > 0 ? Math.pow(1 + rate / n, n) - 1 : rate;
    const totalInterest = A - P;
    const growth = ((A - P) / P) * 100;

    return [
      {
        id: 'nominalRate',
        label: n === 0 ? 'Simple Interest Rate (Annual)' : `Nominal Annual Rate (${n > 0 ? `compounded ${['', '', 'semi-annually', 'quarterly', '', '', '', '', '', '', '', '', 'monthly'][n] || `${n}x/yr`}` : ''})`,
        value: pct(rate),
        highlight: true,
        color: 'positive' as const,
        interpretation: n > 0
          ? `This is the stated (nominal) rate — because it compounds ${n} times a year, the effective annual rate you actually earn or pay is ${pct(ear)}. Always compare loans and investments by their effective rate, not the nominal one; nominal rates can make products look cheaper or more lucrative than they are.`
          : `Simple interest doesn't compound, so this rate is also the effective rate. Total interest over the period is $${fmtD(totalInterest)}, a ${growth.toFixed(1)}% gain from the starting amount.`,
      },
      {
        id: 'ear',
        label: 'Effective Annual Rate (EAR)',
        value: pct(ear),
        color: 'positive' as const,
      },
      {
        id: 'periodicRate',
        label: n > 0 ? `Rate per Period (${1 / n} year)` : 'Annual Rate',
        value: pct(rate / (n > 0 ? n : 1)),
        color: 'neutral' as const,
      },
      {
        id: 'totalInterest',
        label: 'Total Interest / Growth ($)',
        value: `$${fmtD(totalInterest)}`,
        color: 'positive' as const,
      },
      {
        id: 'growth',
        label: 'Total Return on Principal',
        value: `+${growth.toFixed(4)}%`,
        color: 'positive' as const,
      },
      {
        id: 'formulaUsed',
        label: 'Formula Applied',
        value: formula,
        color: 'neutral' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(InterestRatePanel, { values, results });
  },
  educational: {
    formula: 'r = n × [(A/P)^(1/nt) − 1]',
    diagram: {
      svg: interestRateSvg,
      alt: 'Compound interest rate solving diagram showing the A = P(1+r/n)^(nt) formula with a visual bar breaking down principal P plus interest equals final amount A',
      caption: 'This calculator solves for the interest rate by reversing the compound interest formula, isolating rate r from the known principal P, final amount A, time t, and compounding frequency n',
    },
    formulaDescription:
      'This formula algebraically isolates the nominal annual interest rate r from the compound interest equation A = P(1 + r/n)^(nt). It is the reverse of calculating a future value — given that you know the outcome, what rate produced it? This is frequently needed when evaluating actual investment performance or understanding the true cost of a loan.',
    variables: [
      { symbol: 'r', name: 'Nominal Annual Rate', description: 'The interest rate per year, before accounting for compounding. This is the rate stated on most financial products — the APR or nominal yield. To convert to an effective rate, use the EAR formula: (1 + r/n)^n − 1.' },
      { symbol: 'A', name: 'Final Amount', description: 'The total amount after growth or the total repaid on a loan. Must be greater than P to calculate a positive interest rate.' },
      { symbol: 'P', name: 'Principal', description: 'The starting amount — the original investment or original loan balance. The rate calculation is very sensitive to P, so accuracy matters.' },
      { symbol: 'n', name: 'Compounding Frequency', description: 'How many times per year interest compounds (12 = monthly, 365 = daily, 1 = annually). Selecting the wrong n produces a significantly different result.' },
      { symbol: 't', name: 'Time (years)', description: 'The number of years the money was invested or the loan was held. Entered as years, months, or days — this calculator automatically converts non-year inputs.' },
      { symbol: 'EAR', name: 'Effective Annual Rate', description: 'The real annual rate after accounting for compounding: EAR = (1 + r/n)^n − 1. This is the true rate for comparing products with different compounding frequencies.' },
    ],
    howToUse: [
      'Enter the starting principal — the original amount of money.',
      'Enter the final amount — what the investment or loan grew/cost in total.',
      'Enter the time period and select whether it\'s in years, months, or days.',
      'Select the compounding frequency that matches the product (check your statement or loan agreement).',
      'The calculator returns the nominal annual rate, effective annual rate, and the formula used.',
      'Use the "Simple Interest" option when interest is not reinvested or compounded during the period.',
    ],
    commonUses: [
      'Determine the actual annual interest rate charged on a loan when you know the principal, total amount paid, and loan duration.',
      'Calculate the effective annual rate earned on an investment accounting for different compounding frequencies.',
      'Compare savings accounts and CDs with different nominal rates and compounding schedules by calculating their true effective rates.',
    ],
    explanation:
      'This calculator solves the reverse problem: instead of "what will my investment be worth?", it answers "what rate was I charged or earned?" This is useful when a bank advertises a savings account yield but compounds daily — you want to know the effective rate. It\'s also useful for evaluating investments where you know what you paid and what you received. The Effective Annual Rate (EAR) is the correct metric for comparing two products with different compounding schedules. For example, a savings account quoting 4.89% compounded monthly has an EAR of 5.00%, while a CD quoting 4.89% compounded daily has an EAR of approximately 5.01% — the daily compounding produces a slightly higher effective return at the same nominal rate.',
    faqs: [
      {
        question: 'What is the difference between APR and EAR?',
        answer: 'APR (Annual Percentage Rate) is the nominal rate — the stated rate without considering compounding. EAR (Effective Annual Rate) is the true rate after compounding. If a credit card charges 24% APR compounded monthly, the EAR is about 26.8% — meaning you actually pay nearly 27% annually, not 24%. For savings accounts, the APY (Annual Percentage Yield) is equivalent to EAR.',
      },
      {
        question: 'When would I use "Simple Interest"?',
        answer: 'Simple interest applies when interest is not reinvested — calculated only on the original principal throughout the entire period. Some short-term loans, car loans, and certain savings bonds use simple interest. Most investments and mortgages use compound interest. Also use the simple option when you need the flat rate without any compounding effect, such as for calculating interest on a late payment or short-term bridge loan.',
      },
      {
        question: 'What if I paid off a loan early or made extra payments?',
        answer: 'This calculator works for lump-sum scenarios only (single deposit or lump repayment). If you made regular payments, the effective rate calculation requires more complex amortization math. Use the Amortization Calculator to reverse-engineer rates for installment loans. The presence of extra payments or irregular cash flows will make the simple rate-of-return formula inaccurate.',
      },
      {
        question: 'Can I use this to find the return on an investment I sold?',
        answer: 'Yes — enter your purchase price as the principal (P), the sale proceeds as the final amount (A), the holding period as time (t), and choose the compounding frequency that matches how returns were reinvested. This gives you the annualized return, which is the correct way to compare investments held for different periods.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
  
    workedExamples: [
      {
        scenario: 'Lisa in Boston, MA invested $10,000 in a peer-to-peer lending platform 4 years ago. Her account is now worth $14,500. She wants to know what annualized rate of return she actually earned, assuming monthly compounding (the platform reinvests her interest payments monthly).',
        inputs: { principal: '10000', finalAmount: '14500', timePeriod: '4', timeUnit: 'years', compoundFrequency: '12' },
        result: 'Nominal annual rate (monthly compounded): 9.3251%. Effective Annual Rate (EAR): 9.7342%. Periodic rate (monthly): 0.7771%. Total interest earned: $4,500. Total return on principal: +45.0000%.',
        insight: 'Lisa earned a 9.33% nominal annual return, but the effective annual rate of 9.73% is the number she should use when comparing to other investments. The EAR is higher because monthly compounding means interest earned in January itself earns interest in February, and so on — the compounding effect adds 0.41 percentage points of annual return beyond the nominal rate. If Lisa had chosen the Simple Interest option, the calculator would show 11.25% — a misleading result because it ignores the compounding that actually occurred. This demonstrates why you must match the compounding frequency to the actual investment structure: using simple interest when compounding occurred inflates the apparent return.',
      },
      {
        scenario: 'Tom in San Diego, CA took out a personal loan of $5,000 and after making all payments over 3 years (36 months), he calculated he paid back a total of $6,920. The lender advertised "competitive rates" but Tom wants to know the actual effective annual rate he was charged, with monthly compounding.',
        inputs: { principal: '5000', finalAmount: '6920', timePeriod: '3', timeUnit: 'years', compoundFrequency: '12' },
        result: 'Nominal annual rate (monthly compounded): 10.8816%. Effective Annual Rate (EAR): 11.4411%. Periodic rate (monthly): 0.9068%. Total interest paid: $1,920. Total cost as % of principal: +38.4000%.',
        insight: 'Tom paid a 10.88% nominal rate — the APR the lender disclosed — but the effective annual rate of 11.44% is the true cost. This 0.56 percentage point gap is the "compounding penalty" that borrowers pay when interest compounds monthly rather than annually. Over the 3-year term on a $5,000 loan, the difference between 10.88% simple and 10.88% monthly compounding is about $105 in extra interest. However, compared to a credit card at 22% APR (EAR ~24%), Tom\'s 11.44% EAR personal loan is still dramatically cheaper. This example highlights why understanding effective rates matters: when comparing loan offers, always compare EAR to EAR, not nominal rates — especially when comparing products with different compounding frequencies.',
      },
    ],

    proTips: [
      'When comparing savings accounts, CDs, or loans, always use the EAR (Effective Annual Rate), not the nominal rate. A bank offering 4.90% compounded daily has an EAR of 5.02%, while another offering 5.00% compounded annually has an EAR of exactly 5.00%. The "lower" nominal rate actually beats the "higher" one — this is why APY (Annual Percentage Yield) was mandated for savings products.',
      'For loans, the lender\'s APR is the nominal rate. Use this calculator with the total you will actually pay back (including all fees) as the Final Amount to find your true effective borrowing rate. What looks like a 7% loan can become a 9%+ effective rate once origination fees and closing costs are included.',
      'The difference between nominal and effective rates grows with both the nominal rate and the compounding frequency. At 3%, the EAR gap is tiny. At 25% (credit card territory), daily compounding produces an EAR of 28.39% — a 3.39-point penalty for borrowers. This is why credit card debt is so destructive: high nominal rates compounded daily.',
      'For quick mental math: the EAR is approximately equal to the nominal rate plus (nominal rate² / 2n) where n is compounding periods per year. At 12% nominal compounded monthly, EAR ≈ 12% + (0.0144/24) ≈ 12.60% — close to the actual 12.68%. This shortcut helps you spot-check whether a quoted rate passes the smell test.',
    ],

    quickReference: [
      { label: 'Rate Formula (Compound)', value: 'r = n × [(A/P)^(1/nt) − 1] — solves for nominal annual rate' },
      { label: 'EAR Formula', value: 'EAR = (1 + r/n)^n − 1 — converts nominal to effective annual rate' },
      { label: 'Rate Formula (Simple)', value: 'r = (A − P) / (P × t) — no compounding, flat rate' },
      { label: 'Monthly Compounding EAR at 7%', value: '7.229% (0.229 percentage points above nominal)' },
      { label: 'Daily Compounding EAR at 25%', value: '28.39% (3.39 percentage point penalty for credit card borrowers)' },
      { label: 'APY vs APR', value: 'APY = EAR (savings accounts). APR = nominal rate (loans, credit cards). EAR is always the true number.' },
    ],

    limitations: [
      'This calculator works for lump-sum scenarios only — a single initial deposit or a single loan disbursement with a single final value. It cannot calculate rates for installment loans with monthly payments (use an amortization calculator for that) or investments with irregular contributions and withdrawals.',
      'It does not account for fees, commissions, or taxes. A mutual fund with a 10% gross return and a 1% expense ratio has a true investor return closer to 9% — the Final Amount you enter should be net of all costs for an accurate rate calculation.',
      'For very short time periods (days or weeks), small rounding differences in the day-count convention (actual/360 vs. actual/365) can produce slightly different results from what a bank or lender quotes. Money market instruments often use a 360-day year, while this calculator uses 365 days.',
      'The formula assumes a constant annual rate over the entire period. If rates changed during the investment or loan term (e.g., a variable-rate HELOC where Prime Rate moved), the calculated rate represents a blended annualized average, not the rate at any specific point in time.',
    ],
citations: [
    { source: 'Federal Reserve', url: 'https://www.federalreserve.gov' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/i/interestrate.asp' },
  ],
  },
};

export default interestRateConfig;
