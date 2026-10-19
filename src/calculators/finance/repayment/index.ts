import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RepaymentPanel from './RepaymentPanel';
import { pmt } from '../../../utils/financial';
import { finiteSteps } from '../../../utils/explainGuard';

/** Longest term modelled: 50 years of monthly payments. */
const MAX_MONTHS = 600;

const repaymentConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'loanAmount',
      label: 'Loan Amount',
      type: 'number',
      placeholder: '25,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'Total principal amount you are borrowing',
    },
    {
      id: 'interestRate',
      label: 'Annual Interest Rate (APR)',
      type: 'number',
      placeholder: '7.5',
      unit: '%',
      min: 0,
      max: 50,
      step: 0.01,
      required: true,
      helpText: 'The annual percentage rate on your loan',
    },
    {
      id: 'termUnit',
      label: 'Loan Term In',
      type: 'select',
      required: true,
      options: [
        { label: 'Years', value: 'years' },
        { label: 'Months', value: 'months' },
      ],
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'number',
      placeholder: '5',
      min: 1,
      max: 360,
      step: 1,
      required: true,
      helpText: 'Duration of the loan. Enter years or months using the toggle above.',
    },
    {
      id: 'extraPayment',
      label: 'Extra Monthly Payment (Optional)',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      min: 0,
      step: 1,
      helpText: 'Additional amount you plan to pay each month to reduce principal faster',
    },
  ],

  calculate: (values) => {
    const principal = parseFloat(values.loanAmount);
    const annualRate = parseFloat(values.interestRate) / 100;
    const termUnit = values.termUnit || 'years';
    const termRaw = parseFloat(values.loanTerm);
    const extraPayment = parseFloat(values.extraPayment) || 0;

    if ([principal, annualRate, termRaw].some(isNaN) || principal <= 0 || termRaw <= 0) return [];

    const months = termUnit === 'years' ? Math.round(termRaw * 12) : Math.round(termRaw);
    const monthlyRate = annualRate / 12;

    if (months < 1 || months > MAX_MONTHS) return [];
    const monthlyPayment = pmt(principal, monthlyRate, months);

    const totalPaid = monthlyPayment * months;
    const totalInterest = totalPaid - principal;
    const interestRatio = (totalInterest / totalPaid) * 100;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtLarge = (n: number) =>
      n >= 1_000_000
        ? `$${(n / 1_000_000).toFixed(2)}M`
        : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

    const results: Array<{ id: string; label: string; value: string; highlight?: boolean; color: 'positive' | 'negative' | 'neutral'; interpretation?: string }> = [];

    // Compute extra payment scenario
    if (extraPayment > 0) {
      let extraBalance = principal;
      let extraMonths = 0;
      let extraTotalPaid = 0; // actual cash paid; the final payment is smaller than the full amount
      const totalExtraPmt = monthlyPayment + extraPayment;

      while (extraBalance > 0.005 && extraMonths < months + 600) {
        const interest = extraBalance * monthlyRate;
        const payment = Math.min(totalExtraPmt, extraBalance + interest);
        extraBalance = extraBalance + interest - payment;
        extraTotalPaid += payment;
        extraMonths++;
      }

      const extraTotalInterest = extraTotalPaid - principal;
      const interestSaved = totalInterest - extraTotalInterest;
      const timeSaved = months - extraMonths;
      const timeSavedStr = timeSaved > 0
        ? `${Math.floor(timeSaved / 12)}yr ${timeSaved % 12}mo`
        : '—';

      results.push(
        { id: 'monthlyPayment', label: 'Monthly Payment', value: `$${fmt(monthlyPayment)}`, highlight: true, color: 'positive' as const },
        { id: 'monthlyWithExtra', label: 'Monthly Payment with Extra', value: `$${fmt(totalExtraPmt)}`, color: 'positive' as const },
        { id: 'interestSaved', label: 'Interest Saved', value: `${fmtLarge(interestSaved)}`, highlight: true, color: 'positive' as const, interpretation: `Extra payments go straight to principal, so this saving compounds — every dollar paid early stops accruing interest for the rest of the loan. Paying extra earliest in the term saves the most; the same extra dollar late in the loan barely moves the needle.` },
        { id: 'timeSaved', label: 'Time Saved', value: timeSavedStr, highlight: true, color: 'positive' as const },
        { id: 'newPayoffTime', label: 'New Payoff Time', value: `${Math.floor(extraMonths / 12)}yr ${extraMonths % 12}mo (${extraMonths} payments)`, color: 'neutral' as const },
        { id: 'totalInterest', label: 'Total Interest (Standard)', value: `${fmtLarge(totalInterest)}`, color: 'negative' as const },
        { id: 'totalInterestWithExtra', label: 'Total Interest (With Extra)', value: `${fmtLarge(extraTotalInterest)}`, color: 'positive' as const },
        { id: 'totalCost', label: 'Total Cost of Loan (Principal + Interest)', value: `${fmtLarge(totalPaid)}`, color: 'neutral' as const },
        { id: 'interestRatio', label: 'Interest as % of Total Cost', value: `${interestRatio.toFixed(1)}%`, color: interestRatio > 30 ? 'negative' as const : 'neutral' as const },
        { id: 'termMonths', label: 'Loan Term', value: termUnit === 'years' ? `${termRaw} year${termRaw !== 1 ? 's' : ''} (${months} payments)` : `${months} months`, color: 'neutral' as const },
      );
    } else {
      results.push(
        { id: 'monthlyPayment', label: 'Monthly Payment', value: `$${fmt(monthlyPayment)}`, highlight: true, color: 'positive' as const },
        { id: 'totalInterest', label: 'Total Interest Paid', value: `${fmtLarge(totalInterest)}`, color: 'negative' as const },
        { id: 'totalCost', label: 'Total Cost of Loan (Principal + Interest)', value: `${fmtLarge(totalPaid)}`, color: 'neutral' as const },
        { id: 'interestRatio', label: 'Interest as % of Total Cost', value: `${interestRatio.toFixed(1)}%`, color: interestRatio > 30 ? 'negative' as const : 'neutral' as const },
        { id: 'termMonths', label: 'Loan Term', value: termUnit === 'years' ? `${termRaw} year${termRaw !== 1 ? 's' : ''} (${months} payments)` : `${months} months`, color: 'neutral' as const },
      );
    }

    return results;
  },

  explainSteps: (values) => {
    const results = repaymentConfig.calculate(values);
    if (!results.length) return [];
    const val = (id: string) => results.find((x) => x.id === id)?.value ?? '';
    const principal = parseFloat(values.loanAmount);
    const annualRate = parseFloat(values.interestRate) / 100;
    const termUnit = values.termUnit || 'years';
    const termRaw = parseFloat(values.loanTerm);
    const extraPayment = parseFloat(values.extraPayment) || 0;
    const months = termUnit === 'years' ? Math.round(termRaw * 12) : Math.round(termRaw);
    const r = annualRate / 12;
    const M = pmt(principal, r, months);
    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const zero = Math.abs(r) < 1e-10;
    const growth = Math.pow(1 + r, months);

    const steps: { label: string; expr: string; note?: string }[] = [
      {
        label: 'Convert the APR to a monthly rate',
        expr: `r = ${+(annualRate * 100).toFixed(4)}% ÷ 12 = ${(r * 100).toFixed(4)}% = ${r.toFixed(6)}`,
      },
      {
        label: 'Count the payments',
        expr: `n = ${termUnit === 'years' ? `${termRaw} years × 12 = ` : ''}${months} monthly payments`,
      },
    ];
    if (zero) {
      steps.push({ label: 'No interest, so divide the loan evenly', expr: `M = $${fmt(principal)} ÷ ${months} = $${fmt(M)}` });
    } else {
      steps.push({
        label: 'Grow $1 for n months of compounding',
        expr: `(1 + r)ⁿ = (1 + ${r.toFixed(6)})^${months} = ${growth.toFixed(4)}`,
      });
      steps.push({
        label: 'Apply the amortization formula',
        expr: `M = $${fmt(principal)} × (${r.toFixed(6)} × ${growth.toFixed(4)}) ÷ (${growth.toFixed(4)} − 1) = $${fmt(M)}`,
        note: 'The one payment that pays the interest and retires the balance exactly at the last month.',
      });
    }
    steps.push({
      label: 'Total cost over the life of the loan',
      expr: `$${fmt(M)} × ${months} = ${val('totalCost')} total · interest ${val('totalInterest')}`,
    });
    if (extraPayment > 0) {
      steps.push({
        label: 'Add your extra payment',
        expr: `$${fmt(M)} + $${fmt(extraPayment)} = ${val('monthlyWithExtra')}/month → paid off in ${val('newPayoffTime')} · interest saved ${val('interestSaved')}`,
        note: 'The extra goes straight to principal, so the balance falls faster and later months accrue less interest.',
      });
    }
    return finiteSteps(steps);
  },
  extraPanel: (values, results) => {
    const principal = parseFloat(values.loanAmount);
    const annualRate = parseFloat(values.interestRate) / 100;
    const termUnit = values.termUnit || 'years';
    const termRaw = parseFloat(values.loanTerm);
    const extraPayment = parseFloat(values.extraPayment) || 0;

    if (!results.length || isNaN(principal) || isNaN(annualRate) || isNaN(termRaw) || principal <= 0) return null;

    const months = termUnit === 'years' ? Math.round(termRaw * 12) : Math.round(termRaw);
    const monthlyRate = annualRate / 12;

    const monthlyPayment = pmt(principal, monthlyRate, months);

    const totalInterest = monthlyPayment * months - principal;

    return createElement(RepaymentPanel, {
      loanAmount: principal,
      annualRate,
      years: months / 12,
      monthlyPayment,
      totalInterest,
      extraPayment,
    });
  },

  educational: {
    formula: 'M = P × [r(1+r)^n] / [(1+r)^n − 1]',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/><text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">Loan Amortization Over Time</text><text x="160" y="34" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Early payments are mostly interest; later ones mostly principal</text><g transform="translate(20,42)"><rect x="15" y="30" width="38" height="75" rx="3" fill="var(--svg-ef4444)"/><rect x="15" y="60" width="38" height="45" fill="var(--svg-3b82f6)"/><text x="34" y="118" text-anchor="middle" font-size="8" fill="var(--svg-94a3b8)">Yr 1</text><rect x="62" y="42" width="38" height="63" rx="3" fill="var(--svg-ef4444)"/><rect x="62" y="60" width="38" height="45" fill="var(--svg-3b82f6)"/><text x="81" y="118" text-anchor="middle" font-size="8" fill="var(--svg-94a3b8)">Yr 5</text><rect x="109" y="54" width="38" height="51" rx="3" fill="var(--svg-ef4444)"/><rect x="109" y="60" width="38" height="45" fill="var(--svg-3b82f6)"/><text x="128" y="118" text-anchor="middle" font-size="8" fill="var(--svg-94a3b8)">Yr 10</text><rect x="156" y="66" width="38" height="39" rx="3" fill="var(--svg-ef4444)"/><rect x="156" y="70" width="38" height="35" fill="var(--svg-3b82f6)"/><text x="175" y="118" text-anchor="middle" font-size="8" fill="var(--svg-94a3b8)">Yr 20</text><rect x="203" y="82" width="38" height="23" rx="3" fill="var(--svg-ef4444)"/><rect x="203" y="85" width="38" height="20" fill="var(--svg-3b82f6)"/><text x="222" y="118" text-anchor="middle" font-size="8" fill="var(--svg-94a3b8)">Yr 30</text><rect x="15" y="132" width="10" height="10" rx="2" fill="var(--svg-ef4444)"/><text x="29" y="141" font-size="9" fill="var(--svg-64748b)">Interest</text><rect x="80" y="132" width="10" height="10" rx="2" fill="var(--svg-3b82f6)"/><text x="94" y="141" font-size="9" fill="var(--svg-64748b)">Principal</text><text x="180" y="141" font-size="9" fill="var(--svg-64748b)">Payment amount stays constant</text></g><text x="160" y="192" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Extra payments go to principal — saving years of interest</text></svg>',
      alt: 'Stacked bar chart showing how each loan payment shifts from mostly interest (red) in early years to mostly principal (blue) in later years of a 30-year amortization',
      caption: 'Amortization means early payments are mostly interest; extra principal payments early on save the most interest',
    },
    formulaDescription:
      'The monthly payment is calculated using the standard loan amortization formula. Each payment is split between interest charged on the remaining balance and principal repayment, with the proportion shifting over time. Early in the loan term, payments are mostly interest. Later, they become mostly principal. This is the fundamental mechanism of amortization, and understanding it helps you see why extra payments are so effective at reducing total interest.',
    variables: [
      { symbol: 'M', name: 'Monthly Payment', description: 'The fixed amount paid each month toward principal and interest. This amount stays constant over the life of a standard amortizing loan.' },
      { symbol: 'Principal & Term', name: 'Loan Amount & Duration', description: 'The principal (P) is the total borrowed; the term (n) is the duration in months. A 5-year $25,000 loan has P=$25,000 and n=60. Together these determine the payment and total interest cost.' },
      { symbol: 'r', name: 'Monthly Rate', description: 'Annual interest rate divided by 12. Even small differences in r compound dramatically over the life of a loan.' },
    ],
    howToUse: [
      'Enter the total loan amount (principal) and the annual interest rate (APR) from your lender.',
      'Choose whether your loan term is in years or months, and optionally enter an extra monthly payment to see how much time and interest you can save.',
      'Scroll down for the full amortization schedule showing every payment month by month.',
    ],
    commonUses: [
      'Calculate the monthly payment for any loan amount, interest rate, and term to see the full amortization schedule month by month.',
      'See how extra payments reduce your total loan cost and shorten the repayment period for mortgages, auto loans, or personal loans.',
      'Understand the true cost of borrowing by viewing how much of each payment goes toward interest versus principal over time.',
    ],
    explanation:
      'Every loan payment is split between interest charged on the remaining balance and principal repayment. Early payments are mostly interest — later payments are mostly principal. This is called amortization. For example, on a $25,000 loan at 7% over 5 years, your first payment is about $146 interest and $349 principal. By the final payment, it is about $3 interest and $492 principal. Even small extra payments go directly to principal reduction, which means less interest accrues on future balances. The schedule below shows exactly how each payment is applied month by month, and the downloadable CSV lets you import the data into your own spreadsheet or financial planner. The "extra payment" feature shows you the impact of even modest additional amounts: $25 extra per month on that same loan saves about $277 in interest and shortens the term by 3 months — and the effect grows much larger on bigger, longer-term loans like mortgages.',
    faqs: [
      {
        question: 'How does an extra payment save me money?',
        answer: 'Extra payments go directly to reducing the principal balance. Since interest is calculated on the remaining balance, a lower principal means less interest accrues each month. On a $25,000 loan at 7% over 5 years, $25 extra per month saves about $277 in interest and shaves 3 months off the term; on a larger, longer-term loan like a mortgage, the same size extra payment can save thousands. The earlier you start making extra payments, the greater the impact because you reduce the principal before more interest has a chance to accrue on it.',
      },
      {
        question: 'Should I make extra payments or invest instead?',
        answer: 'If your loan APR exceeds your expected investment returns (which it almost certainly does for most consumer debt), paying down the loan is the better financial move. A guaranteed 7% return by avoiding interest is a risk-free return that is hard to match once taxes and market volatility are considered, even though the stock market\'s long-run nominal average is around 10%. The one exception is if you don\'t have an emergency fund — prioritize 3-6 months of expenses first before making extra loan payments. Another exception: if your loan has a very low rate (e.g., 3% mortgage), investing may yield higher returns.',
      },
      {
        question: 'Are there prepayment penalties on personal loans?',
        answer: 'Most personal loans do not have prepayment penalties, unlike some mortgages. However, always check your loan agreement. Some states restrict them and federal rules limit them on most residential mortgages, but terms differ by lender and loan type. When in doubt, ask your lender specifically: "Is there any penalty for paying off this loan early?" If there is a penalty, calculate whether the interest savings still exceed the penalty amount.',
      },
    ],
  citations: [
    { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/r/repayment.asp' },
  ],
  },
};

export default repaymentConfig;
