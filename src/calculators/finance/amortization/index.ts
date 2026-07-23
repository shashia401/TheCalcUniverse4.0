import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import AmortizationComparePanel from './AmortizationComparePanel';

const amortSvg = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto">
  <rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/>
  <text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)" font-family="system-ui,sans-serif">How Loan Payments Are Split</text>
  <text x="80" y="40" text-anchor="middle" font-size="10" fill="var(--svg-475569)" font-weight="bold" font-family="system-ui,sans-serif">Early Payment</text>
  <text x="240" y="40" text-anchor="middle" font-size="10" fill="var(--svg-475569)" font-weight="bold" font-family="system-ui,sans-serif">Late Payment</text>
  <rect x="20" y="50" width="120" height="36" rx="6" fill="var(--svg-ef4444)"/>
  <rect x="20" y="50" width="24" height="36" rx="6" fill="var(--svg-3b82f6)"/>
  <text x="80" y="73" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold" font-family="system-ui,sans-serif">80% Interest</text>
  <rect x="180" y="50" width="120" height="36" rx="6" fill="var(--svg-3b82f6)"/>
  <rect x="180" y="50" width="24" height="36" rx="6" fill="var(--svg-ef4444)"/>
  <text x="240" y="73" text-anchor="middle" font-size="10" fill="var(--svg-ffffff)" font-weight="bold" font-family="system-ui,sans-serif">80% Principal</text>
  <rect x="40" y="100" width="12" height="12" rx="2" fill="var(--svg-ef4444)"/>
  <text x="58" y="110" font-size="10" fill="var(--svg-475569)" font-family="system-ui,sans-serif">Interest (paid to lender)</text>
  <rect x="180" y="100" width="12" height="12" rx="2" fill="var(--svg-3b82f6)"/>
  <text x="198" y="110" font-size="10" fill="var(--svg-475569)" font-family="system-ui,sans-serif">Principal (reduces debt)</text>
  <text x="160" y="140" text-anchor="middle" font-size="9" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">Early payments = mostly interest,</text>
  <text x="160" y="153" text-anchor="middle" font-size="9" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">late payments = mostly principal.</text>
  <text x="160" y="175" text-anchor="middle" font-size="9" fill="var(--svg-1e293b)" font-family="system-ui,sans-serif">M = P × r(1+r)^n / [(1+r)^n - 1]</text>
  <text x="160" y="192" text-anchor="middle" font-size="8" fill="var(--svg-ef4444)" font-weight="bold" font-family="system-ui,sans-serif">Extra principal payments save future interest</text>
</svg>`;

const amortizationConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'loanAmount',
      label: 'Loan Amount',
      type: 'number',
      placeholder: '250,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Total amount you plan to borrow, excluding interest and fees.',
    },
    {
      id: 'interestRate',
      label: 'Annual Interest Rate',
      type: 'number',
      placeholder: '6.5',
      unit: '%',
      min: 0,
      max: 50,
      step: 0.01,
      required: true,
      helpText: 'Yearly interest rate charged by your lender on the loan balance.',
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
      helpText: 'Choose whether to enter the loan term in years or months.',
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'number',
      placeholder: '30',
      min: 1,
      step: 1,
      required: true,
      helpText: 'Duration of the loan in the unit selected above.',
    },
    {
      id: 'extraMonthly',
      label: 'Extra Monthly Payment',
      type: 'number',
      placeholder: '200',
      prefix: '$',
      min: 0,
      step: 50,
      helpText: 'Additional amount paid toward principal each month',
    },
    {
      id: 'extraAnnual',
      label: 'Extra Annual Payment (Lump Sum)',
      type: 'number',
      placeholder: '1,000',
      prefix: '$',
      min: 0,
      step: 100,
      helpText: 'One-time extra payment made every year (e.g., tax refund)',
    },
  ],
  explainSteps: (values) => {
    const P = parseFloat(values.loanAmount);
    const annualRate = parseFloat(values.interestRate) / 100;
    const termUnit = values.termUnit || 'years';
    const termRaw = parseFloat(values.loanTerm);

    if ([P, annualRate, termRaw].some(isNaN) || P <= 0 || termRaw <= 0) return [];

    const totalMonths = termUnit === 'years' ? Math.round(termRaw * 12) : Math.round(termRaw);
    const monthlyRate = annualRate / 12;

    let basePayment: number;
    if (monthlyRate === 0) {
      basePayment = P / totalMonths;
    } else {
      basePayment = (P * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }
    const totalInterestStandard = basePayment * totalMonths - P;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (monthlyRate === 0) {
      return [
        {
          label: 'Count the payments',
          expr: `n = ${termUnit === 'years' ? `${termRaw} × 12 = ` : ''}${totalMonths} months`,
        },
        {
          label: 'No interest — divide the balance evenly',
          expr: `$${fmt(P)} ÷ ${totalMonths} = $${fmt(basePayment)}/mo`,
        },
      ];
    }

    const growth = Math.pow(1 + monthlyRate, totalMonths);
    return [
      {
        label: 'Convert the annual rate to a monthly rate',
        expr: `r = ${(annualRate * 100).toFixed(2)}% ÷ 12 = ${(monthlyRate * 100).toFixed(4)}%`,
        note: 'Interest is charged monthly on the outstanding balance.',
      },
      {
        label: 'Count the payments',
        expr: `n = ${termUnit === 'years' ? `${termRaw} years × 12 = ` : ''}${totalMonths} monthly payments`,
      },
      {
        label: 'Grow $1 across the whole term',
        expr: `(1 + ${monthlyRate.toFixed(6)})^${totalMonths} = ${growth.toFixed(4)}`,
      },
      {
        label: 'Required monthly payment',
        expr: `$${fmt(P)} × (${monthlyRate.toFixed(6)} × ${growth.toFixed(4)}) ÷ (${growth.toFixed(4)} − 1) = $${fmt(basePayment)}`,
      },
      {
        label: 'Total interest over the standard schedule',
        expr: `$${fmt(basePayment)} × ${totalMonths} − $${fmt(P)} = $${fmt(totalInterestStandard)}`,
      },
    ];
  },
  calculate: (values) => {
    const P = parseFloat(values.loanAmount);
    const annualRate = parseFloat(values.interestRate) / 100;
    const termUnit = values.termUnit || 'years';
    const termRaw = parseFloat(values.loanTerm);
    const extraMonthly = parseFloat(values.extraMonthly) || 0;
    const extraAnnual = parseFloat(values.extraAnnual) || 0;

    if ([P, annualRate, termRaw].some(isNaN) || P <= 0 || termRaw <= 0) return [];

    const totalMonths = termUnit === 'years' ? Math.round(termRaw * 12) : Math.round(termRaw);
    const monthlyRate = annualRate / 12;

    let basePayment: number;
    if (monthlyRate === 0) {
      basePayment = P / totalMonths;
    } else {
      basePayment = (P * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    const totalInterestStandard = basePayment * totalMonths - P;

    let balance = P;
    let newMonths = 0;
    let totalInterestNew = 0;

    while (balance > 0 && newMonths < totalMonths * 2) {
      const interest = balance * monthlyRate;
      totalInterestNew += interest;
      const extra = extraMonthly + (newMonths > 0 && newMonths % 12 === 0 ? extraAnnual : 0);
      const principal = Math.min(balance, basePayment - interest + extra);
      balance -= principal;
      newMonths++;
    }

    const hasExtra = extraMonthly > 0 || extraAnnual > 0;
    const interestSaved = totalInterestStandard - totalInterestNew;
    const monthsSaved = totalMonths - newMonths;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const timeSavedLabel = (months: number) => {
      if (months <= 0) return '0 months';
      const y = Math.floor(Math.abs(months) / 12);
      const m = Math.abs(months) % 12;
      const parts = [];
      if (y > 0) parts.push(`${y} year${y !== 1 ? 's' : ''}`);
      if (m > 0) parts.push(`${m} month${m !== 1 ? 's' : ''}`);
      return parts.join(' and ');
    };

    const newTermYears = Math.floor(newMonths / 12);
    const newTermMonths = newMonths % 12;

    const results: CalculatorResult[] = [
      {
        id: 'basePayment',
        label: 'Required Monthly Payment',
        value: `$${fmt(basePayment)}`,
        highlight: true,
        color: 'neutral' as const,
        interpretation: `The payment stays level, but its split doesn't: early on most goes to interest, and only near the end does most go to principal. Over the full schedule you'll pay $${fmt(totalInterestStandard)} in interest — extra payments applied to principal in the early years cut that the most.`,
      },
      {
        id: 'totalInterestStandard',
        label: 'Total Interest — Standard Schedule',
        value: `$${fmt(totalInterestStandard)}`,
        color: 'negative' as const,
      },
      {
        id: 'totalCostStandard',
        label: 'Total Cost — Standard Schedule',
        value: `$${fmt(basePayment * totalMonths)}`,
        color: 'neutral' as const,
      },
    ];

    if (hasExtra) {
      results.push(
        {
          id: 'timeSaved',
          label: 'Time Saved with Extra Payments',
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
          id: 'newTerm',
          label: 'New Payoff Term with Extra Payments',
          value: newTermYears > 0
            ? `${newTermYears} yr${newTermYears !== 1 ? 's' : ''} ${newTermMonths > 0 ? `${newTermMonths} mo` : ''}`
            : `${newMonths} months`,
          color: 'positive' as const,
        },
        {
          id: 'newTotalInterest',
          label: 'Total Interest — With Extra Payments',
          value: `$${fmt(totalInterestNew)}`,
          color: 'positive' as const,
        }
      );
    }

    return results;
  },
  extraPanel: (values, results) => {
    const P = parseFloat(values.loanAmount);
    const annualRate = parseFloat(values.interestRate) / 100;
    const termUnit = values.termUnit || 'years';
    const termRaw = parseFloat(values.loanTerm);
    const extraMonthly = parseFloat(values.extraMonthly) || 0;
    const extraAnnual = parseFloat(values.extraAnnual) || 0;

    if (!results.length || isNaN(P) || isNaN(annualRate) || isNaN(termRaw) || P <= 0) return null;

    const totalMonths = termUnit === 'years' ? Math.round(termRaw * 12) : Math.round(termRaw);

    return createElement(AmortizationComparePanel, {
      loanAmount: P,
      annualRate,
      totalMonths,
      extraMonthly,
      extraAnnual,
    });
  },
  educational: {
    formula: 'M = P × [r(1+r)^n] / [(1+r)^n − 1]',
    formulaDescription:
      'The standard amortization formula calculates your fixed monthly payment by dividing the outstanding balance into equal installments over the loan term. Each payment covers the interest accrued since the last payment and reduces the principal balance. Extra payments reduce the principal directly, which shrinks future interest charges and shortens the loan term.',
    diagram: {
      svg: amortSvg,
      alt: 'Two bars comparing early loan payment (mostly interest in red) vs late payment (mostly principal in blue)',
      caption: 'Extra principal payments directly reduce the balance that future interest accrues on — saving thousands over the loan term',
    },
    variables: [
      { symbol: 'M', name: 'Monthly Payment', description: 'The required fixed payment per month that fully amortizes the loan over the remaining term, covering both principal and interest in each installment.' },
      { symbol: 'P', name: 'Principal', description: 'The remaining loan balance that must be repaid. As you make payments, this balance decreases slowly at first because early payments are mostly interest.' },
      { symbol: 'r', name: 'Monthly Rate', description: 'Annual interest rate divided by 12. Even a small change in the rate significantly affects the monthly payment and total interest over the life of the loan.' },
      { symbol: 'n', name: 'Remaining Payments', description: 'Total number of monthly payments left on the loan. A 30-year mortgage has 360 payments; a 15-year mortgage has 180 payments.' },
    ],
    howToUse: [
      'Enter the loan amount, interest rate, and loan term in years or months.',
      'Add extra monthly payments or extra annual lump-sum payments to see the impact on total interest and payoff timeline.',
      'The comparison table below shows both the standard amortization schedule and your accelerated payoff schedule side by side.',
      'Every dollar of extra principal payment saves approximately that dollar plus all the compounded interest it would have generated for the remainder of the loan term.',
    ],
    commonUses: [
      'See exactly how each loan payment is split between principal and interest over the full life of a mortgage or auto loan.',
      'Compare how extra monthly payments or lump-sum contributions reduce your total interest and shorten your loan term.',
      'Plan a debt payoff strategy by understanding when equity builds fastest during the amortization schedule.',
    ],
    explanation:
      'In the early years of a loan, the vast majority of each payment goes toward interest — almost none reduces the balance. This phenomenon, called front-loaded interest, is the reason extra payments are so powerful. By attacking principal directly in the early years, you prevent future interest from ever accruing on that principal. For a 30-year $250,000 mortgage at 6.5%, the first year of payments results in over $16,000 in interest but less than $3,500 in principal reduction. Paying just $200 extra per month can cut over 5 years off the loan and save tens of thousands in interest. The amortization table below shows exactly how each payment is split month by month.',
    faqs: [
      {
        question: 'What is the difference between extra monthly vs. extra annual payments?',
        answer: 'Extra monthly payments reduce your balance consistently throughout the year, which is usually more effective because each payment immediately reduces the principal that accrues interest in subsequent months. Extra annual lump-sum payments (like a tax refund or bonus) still save significantly but are applied once per year. Combining both approaches is the most effective strategy for maximizing interest savings.',
      },
      {
        question: 'Do extra payments always go to principal?',
        answer: 'They should, but you must specify this to your lender. Some lenders automatically apply extra payments to future scheduled payments rather than principal unless explicitly instructed otherwise. Always mark extra payments as "apply to principal" on your payment form, and confirm with your loan servicer that they are being applied correctly. This is especially important for mortgage servicers.',
      },
      {
        question: 'Is it better to make extra payments or invest the difference?',
        answer: 'It depends on your loan rate versus expected investment returns. If your mortgage is at 7% and investments return 7%, the math is roughly equal on a pre-tax basis. However, paying down debt offers a guaranteed, risk-free return equal to your interest rate, while investments carry market risk. Most financial advisors suggest prioritizing debt repayment when the interest rate is above 6-7%, and focusing on investments when the rate is below 4-5%.',
      },
      {
        question: 'What is the difference between simple interest and amortized interest?',
        answer: 'Simple interest accrues daily based on the current balance, so paying early reduces interest for that month. Amortized interest is calculated monthly based on a fixed schedule set at the beginning of the loan. Most mortgages use simple interest, meaning the date you make your payment within the month affects how much interest accrues. Paying biweekly instead of monthly can reduce total interest because you effectively make one extra payment per year.',
      },
    ],
  citations: [
    { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/a/amortization.asp' },
  ],
  },
};

export default amortizationConfig;
