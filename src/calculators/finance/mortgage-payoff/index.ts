import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult, ExplainStep } from '../../../types/calculator';
import { finiteSteps } from '../../../utils/explainGuard';
import { hasAnswer, resultValue } from '../../../utils/explainResults';
import MortgagePayoffPanel from './MortgagePayoffPanel';
import { simulatePayoff, payoffDateLabel, MAX_PAYOFF_MONTHS } from './payoffSim';

const mortgagePayoffConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'originalAmount',
      label: 'Original Mortgage Amount',
      type: 'number',
      placeholder: '350,000',
      prefix: '$',
      min: 0,
      step: 1000,
      helpText: 'Optional. Only used to show how much of the original loan you have already repaid.',
    },
    {
      id: 'currentBalance',
      label: 'Current Loan Balance',
      type: 'number',
      placeholder: '280,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Your remaining mortgage balance today',
    },
    {
      id: 'interestRate',
      label: 'Interest Rate',
      type: 'number',
      placeholder: '6.75',
      unit: '%',
      min: 0,
      max: 30,
      step: 0.01,
      required: true,
    },
    {
      id: 'monthlyPayment',
      label: 'Current Monthly Payment (P&I)',
      type: 'number',
      placeholder: '2,270',
      prefix: '$',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Principal & Interest only — exclude taxes and insurance (PITI)',
    },
    {
      id: 'extraMonthly',
      label: 'Extra Monthly Payment',
      type: 'number',
      placeholder: '300',
      prefix: '$',
      min: 0,
      step: 50,
      helpText: 'Additional principal paid every month',
    },
    {
      id: 'yearlyLumpSum',
      label: 'Yearly One-Time Payment',
      type: 'number',
      placeholder: '2,000',
      prefix: '$',
      min: 0,
      step: 100,
      helpText: 'Annual lump sum (e.g., tax refund applied to principal)',
    },
    {
      id: 'singleLumpSum',
      label: 'Single One-Time Lump Sum (Today)',
      type: 'number',
      placeholder: '10,000',
      prefix: '$',
      min: 0,
      step: 500,
      helpText: 'One-time payment applied to principal right now',
    },
  ],
  calculate: (values) => {
    const balance = parseFloat(values.currentBalance);
    const annualRate = parseFloat(values.interestRate) / 100;
    const basePayment = parseFloat(values.monthlyPayment);
    const extraMonthly = parseFloat(values.extraMonthly) || 0;
    const yearlyLumpSum = parseFloat(values.yearlyLumpSum) || 0;
    const singleLumpSum = parseFloat(values.singleLumpSum) || 0;

    if ([balance, annualRate, basePayment].some(isNaN) || balance <= 0 || basePayment <= 0) {
      if (balance <= 0) return [{ id: 'alreadyPaid', label: 'Loan Status', value: 'Loan is already paid off.', highlight: true, color: 'positive' as const }];
      return [];
    }

    const monthlyRate = annualRate / 12;

    const std = simulatePayoff(balance, monthlyRate, basePayment);

    if (std.neverPaysOff) {
      return [{
        id: 'negativeAmortization',
        label: 'Warning: Payment Too Low',
        value: `Your monthly payment is too low to pay this loan off within ${MAX_PAYOFF_MONTHS / 12} years (it barely covers, or does not cover, the monthly interest). Increase the payment or check the balance and rate.`,
        highlight: true,
        color: 'negative' as const,
      }];
    }

    const newSim = simulatePayoff(balance, monthlyRate, basePayment, extraMonthly, yearlyLumpSum, singleLumpSum);

    const monthsSaved = std.months - newSim.months;
    const interestSaved = std.totalInterest - newSim.totalInterest;
    const hasExtra = extraMonthly > 0 || yearlyLumpSum > 0 || singleLumpSum > 0;

    const timeSavedLabel = (months: number) => {
      if (months <= 0) return '0 months';
      const y = Math.floor(months / 12);
      const m = months % 12;
      return [y > 0 ? `${y} yr${y !== 1 ? 's' : ''}` : '', m > 0 ? `${m} mo` : ''].filter(Boolean).join(' ');
    };

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const results: CalculatorResult[] = [
      {
        id: 'standardPayoffDate',
        label: 'Standard Payoff Date',
        value: payoffDateLabel(std.months),
        highlight: !hasExtra,
        color: 'neutral' as const,
      },
      {
        id: 'standardInterest',
        label: 'Total Interest — Standard Schedule',
        value: `$${fmt(std.totalInterest)}`,
        color: 'negative' as const,
      },
    ];

    if (hasExtra) {
      results[0].highlight = false;
      results.push(
        {
          id: 'newPayoffDate',
          label: 'New Payoff Date — Debt Free!',
          value: payoffDateLabel(newSim.months),
          highlight: true,
          color: 'positive' as const,
          interpretation: interestSaved > 0
            ? `Those extra payments clear the loan ${timeSavedLabel(monthsSaved)} early and save $${fmt(interestSaved)} in interest — prepaid principal skips all of its future interest, which is why early extra payments matter most.`
            : undefined,
        },
        {
          id: 'timeSaved',
          label: 'Time Saved',
          value: monthsSaved > 0 ? timeSavedLabel(monthsSaved) : 'Less than 1 month',
          color: monthsSaved > 0 ? 'positive' as const : 'neutral' as const,
        },
        {
          id: 'interestSaved',
          label: 'Total Interest Saved',
          value: `$${fmt(interestSaved)}`,
          color: interestSaved > 0 ? 'positive' as const : 'neutral' as const,
        },
        {
          id: 'newTotalInterest',
          label: 'Total Interest — Accelerated Schedule',
          value: `$${fmt(newSim.totalInterest)}`,
          color: 'negative' as const,
        }
      );
    }


    const original = parseFloat(values.originalAmount);
    if (Number.isFinite(original) && original >= balance && original > 0) {
      results.push({
        id: 'paidSoFar',
        label: 'Already Repaid',
        value: `${(((original - balance) / original) * 100).toFixed(1)}% of the original $${fmt(original)}`,
        color: 'neutral' as const,
      });
    }

    return results;
  },
  // Only the parts fixed by the inputs (months, interest, savings); the payoff DATE depends on today's date, so it has no step.
  explainSteps: (values) => {
    const rows = mortgagePayoffConfig.calculate(values);
    if (!hasAnswer(rows) || !resultValue(rows, 'standardInterest')) return [];
    const balance = parseFloat(values.currentBalance);
    const annualRate = parseFloat(values.interestRate);
    const basePayment = parseFloat(values.monthlyPayment);
    const extraMonthly = parseFloat(values.extraMonthly) || 0;
    const yearlyLumpSum = parseFloat(values.yearlyLumpSum) || 0;
    const singleLumpSum = parseFloat(values.singleLumpSum) || 0;
    const m = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const dur = (mo: number) => [Math.floor(mo / 12) > 0 ? `${Math.floor(mo / 12)} yr` : '', mo % 12 > 0 ? `${mo % 12} mo` : ''].filter(Boolean).join(' ') || '0 mo';
    const r = annualRate / 100 / 12;
    const std = simulatePayoff(balance, r, basePayment);
    const hasExtra = extraMonthly > 0 || yearlyLumpSum > 0 || singleLumpSum > 0;
    const interest1 = balance * r;
    const steps: ExplainStep[] = [
      { label: 'Convert the rate to a monthly rate', expr: `r = ${annualRate}% ÷ 12 = ${r.toFixed(8)}` },
      {
        label: 'Split the first payment into interest and principal',
        expr: `Interest = ${m(balance)} × ${r.toFixed(8)} = ${m(interest1)} · principal = ${m(basePayment)} − ${m(interest1)} = ${m(basePayment - interest1)}`,
        note: 'Each month the interest is charged on the balance left, so the principal share grows as the balance falls.',
      },
      {
        label: 'Repeat month by month on the standard schedule',
        expr: `Paid off after ${std.months} payments (${dur(std.months)}) · total interest = ${resultValue(rows, 'standardInterest')}`,
        note: "The payoff date itself depends on today's date, so only the length is shown.",
      },
    ];
    if (hasExtra) {
      const parts = [
        singleLumpSum > 0 ? `${m(singleLumpSum)} lump sum today (balance becomes ${m(Math.max(0, balance - singleLumpSum))})` : '',
        extraMonthly > 0 ? `${m(extraMonthly)} extra every month` : '',
        yearlyLumpSum > 0 ? `${m(yearlyLumpSum)} with payments 13, 25, 37, …` : '',
      ].filter(Boolean);
      const accel = simulatePayoff(balance, r, basePayment, extraMonthly, yearlyLumpSum, singleLumpSum);
      steps.push(
        {
          label: 'Add your extra payments to principal and run the schedule again',
          expr: `${parts.join(' + ')} → paid off after ${accel.months} payments (${dur(accel.months)}) · total interest = ${resultValue(rows, 'newTotalInterest')}`,
        },
        {
          label: 'Compare the two schedules',
          expr: `Time saved: ${std.months} − ${accel.months} = ${std.months - accel.months} months (${resultValue(rows, 'timeSaved')}) · interest saved: ${resultValue(rows, 'standardInterest')} − ${resultValue(rows, 'newTotalInterest')} = ${resultValue(rows, 'interestSaved')}`,
        },
      );
    }
    return finiteSteps(steps);
  },
  extraPanel: (values, results) => {
    const balance = parseFloat(values.currentBalance);
    const annualRate = parseFloat(values.interestRate) / 100;
    const basePayment = parseFloat(values.monthlyPayment);
    const extraMonthly = parseFloat(values.extraMonthly) || 0;
    const yearlyLumpSum = parseFloat(values.yearlyLumpSum) || 0;
    const singleLumpSum = parseFloat(values.singleLumpSum) || 0;

    if (!results.length || isNaN(balance) || isNaN(annualRate) || isNaN(basePayment) || balance <= 0) return null;

    return createElement(MortgagePayoffPanel, {
      balance,
      annualRate,
      basePayment,
      extraMonthly,
      yearlyLumpSum,
      singleLumpSum,
    });
  },
  educational: {
    formula: 'Interest Saved = Standard Total Interest − Accelerated Total Interest',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">Mortgage Payoff: Principal vs. Interest</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Extra payments today save years of interest tomorrow</text><g transform="translate(30,60)"><!-- House icon (simplified) --><polygon points="190,10 290,50 290,110 90,110 90,50" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2" stroke-linejoin="round"/><rect x="140" y="60" width="110" height="50" rx="4" fill="var(--svg-f1f5f9)" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="195" y="82" text-anchor="middle" font-size="9" fill="var(--svg-475569)">Mortgage Balance</text><text x="195" y="98" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e40af)">$280K</text></g><!-- Early years pie / bar breakdown --><g transform="translate(40,190)"><text x="100" y="10" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">Early Years (High Interest)</text><rect x="20" y="20" width="160" height="40" rx="5" fill="var(--svg-ef4444)"/><text x="100" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">~80% Interest</text><rect x="20" y="62" width="40" height="20" rx="4" fill="var(--svg-3b82f6)"/><text x="40" y="76" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">20% Principal</text><text x="220" y="10" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">Later Years (High Principal)</text><rect x="200" y="38" width="160" height="40" rx="5" fill="var(--svg-22c55e)"/><text x="280" y="62" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">~80% Principal</text><rect x="200" y="80" width="120" height="20" rx="4" fill="var(--svg-ef4444)"/><text x="260" y="94" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">20% Interest</text></g><!-- Comparison arrows --><g transform="translate(40,290)"><rect x="10" y="0" width="180" height="36" rx="8" fill="var(--svg-f1f5f9)"/><text x="100" y="14" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ef4444)">Standard: 30yr, $467K interest</text><text x="100" y="28" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">vs.</text><rect x="230" y="0" width="180" height="36" rx="8" fill="var(--svg-f0fdf4)"/><text x="320" y="14" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-16a34a)">Extra $300/mo: 21.6yr, $316K interest</text><text x="320" y="28" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Save 8.4 years &amp; $151K</text></g></svg>',
      alt: 'Mortgage payoff visual showing a house with mortgage balance, early years interest vs principal breakdown, and comparison of standard vs accelerated payoff timelines',
      caption: 'In the early years of a mortgage, most of your payment goes to interest — extra principal payments reduce total interest by years and thousands of dollars',
    },
    formulaDescription:
      'Each extra dollar of principal paid today eliminates one dollar of future principal — plus all the interest that dollar would have accrued for the remainder of the loan term. The savings compound because reducing principal early prevents interest from accumulating on that principal in every subsequent month.',
    variables: [
      { symbol: 'P&I', name: 'Principal & Interest', description: 'The portion of your payment that goes to the loan principal and interest — excluding property taxes (T) and homeowners insurance (I) in a full PITI payment. Use only the P&I amount when entering your current monthly payment.' },
      { symbol: 'Payoff Date', name: 'Debt-Free Date', description: 'The specific month and year when your final mortgage payment is made and the balance reaches zero. This is a real date, not just a number of months remaining.' },
      { symbol: 'PITI', name: 'Principal, Interest, Taxes, Insurance', description: 'The full monthly housing payment including all four components. Only the principal and interest portion is applied to the loan balance; taxes and insurance go into an escrow account.' },
    ],
    howToUse: [
      'Enter your original mortgage amount and current remaining balance to establish where you started and where you are today.',
      'Enter your interest rate and current monthly P&I (principal and interest only, not including taxes and insurance).',
      'Add extra monthly payments, annual lump sums (like a tax refund), or a single one-time payment made today.',
      'The calculator shows your new debt-free date as a real calendar month and year, total time saved, and total interest saved.',
    ],
    commonUses: [
      'Calculate how much time and interest you can save by adding extra principal payments to your monthly mortgage.',
      'Compare the impact of a one-time lump-sum payment versus recurring extra monthly payments on your payoff timeline.',
      'Determine the exact month and year you will become mortgage-free under different accelerated payment strategies.',
    ],
    explanation:
      'The early years of a mortgage are heavily front-loaded with interest — in year 1 of a 30-year mortgage at 6.75%, over 80% of each payment may go to interest and less than 20% to principal. This is because the interest is calculated on the full outstanding balance, which is largest at the beginning. Extra principal payments are uniquely powerful because they permanently eliminate future interest charges on that principal for the entire remaining term. On a new $350,000 30-year mortgage at 6.75%, a $300/month extra payment saves about $151,700 in interest and cuts about 8.4 years (101 payments) off the loan. The calculator simulates this month by month: every extra dollar you pay today potentially saves multiple dollars in future interest.',
    faqs: [
      {
        question: 'Should I make extra monthly payments or a large annual lump sum?',
        answer: 'Extra monthly payments are slightly more effective than an equivalent annual lump sum because they reduce the principal earlier in the year, preventing interest from accruing on that amount month by month. However, the difference is relatively small. The most important thing is to choose a strategy you can commit to consistently — whether that is sending a little extra each month or making a larger payment annually with your tax refund or bonus.',
      },
      {
        question: 'Do I need to tell my lender the extra payment is for principal?',
        answer: 'Yes, absolutely. You must explicitly instruct your lender to apply extra payments to the principal balance. Some servicers will automatically apply overpayments to future scheduled payments instead of reducing principal unless you specify otherwise. Confirm with your loan servicer how to designate extra payments as "principal only" and check your monthly statement to ensure it was applied correctly.',
      },
      {
        question: 'Is it better to pay off the mortgage or invest?',
        answer: 'If your mortgage rate is 6.75%, paying it off gives a guaranteed, risk-free 6.75% after-tax return. If you expect your investments to return 8% or more, investing may yield more on paper, but it comes with market risk. The mortgage payoff is guaranteed and also improves cash flow. Many financial advisors recommend a hybrid approach: max out tax-advantaged accounts like 401(k) and IRA first (capturing any employer match), then direct extra cash toward mortgage payoff.',
      },
      {
        question: 'What happens if I make one large lump-sum payment?',
        answer: 'A single lump-sum payment immediately reduces your principal balance, which means less interest accrues on every future payment from that point forward. For example, a $10,000 lump-sum payment on a $280,000 mortgage at 6.75% saves approximately $675 in interest in the first year alone and continues saving more each year until the loan is paid off. The calculator lets you model this with the "Single One-Time Lump Sum" field.',
      },
    ],
  citations: [
    { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/m/mortgage-payoff.asp' },
  ],
  },
};

export default mortgagePayoffConfig;
