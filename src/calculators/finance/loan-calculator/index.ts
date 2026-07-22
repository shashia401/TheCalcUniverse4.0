import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import AmortizationPanel from '../../../components/calculator/AmortizationPanel';

const loanCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'loanAmount',
      label: 'Loan Amount',
      type: 'number',
      defaultValue: '25000',
      placeholder: '25,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'Principal amount borrowed',
      slider: { min: 1000, max: 100000, step: 500 },
    },
    {
      id: 'interestRate',
      label: 'Annual Interest Rate (APR)',
      type: 'number',
      defaultValue: '6.5',
      placeholder: '7.5',
      unit: '%',
      min: 0,
      max: 50,
      step: 0.01,
      required: true,
      slider: { min: 0, max: 20, step: 0.1 },
    },
    {
      id: 'termUnit',
      label: 'Loan Term In',
      type: 'select',
      required: true,
      defaultValue: 'years',
      options: [
        { label: 'Years', value: 'years' },
        { label: 'Months', value: 'months' },
      ],
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'number',
      defaultValue: '5',
      placeholder: '5',
      min: 1,
      step: 1,
      required: true,
      helpText: 'Personal loans are often 24–60 months. Enter years or months using the toggle above.',
      slider: { min: 1, max: 30, step: 1 },
    },
  ],
  explainSteps: (values) => {
    const principal = parseFloat(values.loanAmount);
    const annualRate = parseFloat(values.interestRate) / 100;
    const termUnit = values.termUnit || 'years';
    const termRaw = parseFloat(values.loanTerm);
    if ([principal, annualRate, termRaw].some(isNaN) || principal <= 0 || termRaw <= 0) return [];

    const months = termUnit === 'years' ? Math.ceil(termRaw * 12) : Math.ceil(termRaw);
    const monthlyRate = annualRate / 12;
    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (monthlyRate === 0) {
      const payment = principal / months;
      return [
        {
          label: 'Count the payments',
          expr: `n = ${termUnit === 'years' ? `${termRaw} years × 12 = ` : ''}${months} months`,
        },
        {
          label: 'No interest — just divide the principal evenly',
          expr: `M = $${fmt(principal)} ÷ ${months} = $${fmt(payment)}/month`,
        },
      ];
    }

    const growth = Math.pow(1 + monthlyRate, months);
    const payment = (principal * (monthlyRate * growth)) / (growth - 1);
    const totalPaid = payment * months;

    return [
      {
        label: 'Convert the annual rate to a monthly rate',
        expr: `r = ${(annualRate * 100).toFixed(2)}% ÷ 12 = ${(monthlyRate * 100).toFixed(4)}% = ${monthlyRate.toFixed(6)}`,
        note: 'Lenders charge interest each month, so the APR is split into 12 parts.',
      },
      {
        label: 'Count the payments',
        expr: `n = ${termUnit === 'years' ? `${termRaw} years × 12 = ` : ''}${months} monthly payments`,
      },
      {
        label: 'Grow $1 for n months of compounding',
        expr: `(1 + r)ⁿ = (1 + ${monthlyRate.toFixed(6)})^${months} = ${growth.toFixed(4)}`,
        note: 'This factor captures how much unpaid balance would grow over the full term.',
      },
      {
        label: 'Apply the amortization formula',
        expr: `M = $${fmt(principal)} × (${monthlyRate.toFixed(6)} × ${growth.toFixed(4)}) ÷ (${growth.toFixed(4)} − 1) = $${fmt(payment)}`,
        note: 'The payment that exactly pays interest AND retires the balance by the last month.',
      },
      {
        label: 'Total cost over the life of the loan',
        expr: `$${fmt(payment)} × ${months} = $${fmt(totalPaid)}  (interest: $${fmt(totalPaid - principal)})`,
      },
    ];
  },
  chart: (values) => {
    const principal = parseFloat(values.loanAmount);
    const annualRate = parseFloat(values.interestRate) / 100;
    const termUnit = values.termUnit || 'years';
    const termRaw = parseFloat(values.loanTerm);
    if ([principal, annualRate, termRaw].some(isNaN) || principal <= 0 || termRaw <= 0) return null;

    const months = termUnit === 'years' ? Math.ceil(termRaw * 12) : Math.ceil(termRaw);
    const monthlyRate = annualRate / 12;
    const payment =
      monthlyRate === 0
        ? principal / months
        : (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
          (Math.pow(1 + monthlyRate, months) - 1);

    // Walk the amortization schedule, accumulating principal repaid vs interest paid.
    // Sample by year for long loans, by month for short ones, so the curve reads well.
    const byMonth = months <= 36;
    const points: { x: number; values: number[] }[] = [{ x: 0, values: [0, 0] }];
    let balance = principal;
    let cumPrincipal = 0;
    let cumInterest = 0;
    for (let m = 1; m <= months; m++) {
      const interest = balance * monthlyRate;
      const principalPaid = Math.min(payment - interest, balance);
      cumInterest += interest;
      cumPrincipal += principalPaid;
      balance -= principalPaid;
      const boundary = byMonth || m % 12 === 0 || m === months;
      if (boundary) {
        points.push({
          x: byMonth ? m : Math.round(m / 12),
          values: [cumPrincipal, cumInterest],
        });
      }
    }

    return {
      points,
      seriesLabels: ['Principal', 'Interest'],
      seriesColors: ['var(--brand-default)', '#e11d48'],
      xAxisLabel: byMonth ? 'mo' : 'yr',
      formatValue: (n: number) => `$${Math.round(n).toLocaleString()}`,
      caption: 'Cumulative principal repaid vs interest paid over the life of the loan. Hover to read any point.',
    };
  },
  // Living Answer donut — the user's actual principal vs total interest.
  donut: (values) => {
    const principal = parseFloat(values.loanAmount);
    const annualRate = parseFloat(values.interestRate) / 100;
    const termUnit = values.termUnit || 'years';
    const termRaw = parseFloat(values.loanTerm);
    if ([principal, annualRate, termRaw].some(isNaN) || principal <= 0 || termRaw <= 0) return null;

    const months = termUnit === 'years' ? Math.ceil(termRaw * 12) : Math.ceil(termRaw);
    const monthlyRate = annualRate / 12;
    const payment =
      monthlyRate === 0
        ? principal / months
        : (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
          (Math.pow(1 + monthlyRate, months) - 1);
    const totalInterest = payment * months - principal;

    return {
      segments: [
        { label: 'Principal', value: principal, color: 'var(--brand-default)' },
        { label: 'Interest', value: totalInterest, color: '#e11d48' },
      ],
      centerLabel: 'total cost',
      formatValue: (n: number) => `$${Math.round(n).toLocaleString()}`,
      caption: 'Your loan: how the total cost splits between what you borrowed and what it costs to borrow it.',
    };
  },
  // Living Answer gauge — how heavy the interest is as a share of total cost.
  gauge: (values) => {
    const principal = parseFloat(values.loanAmount);
    const annualRate = parseFloat(values.interestRate) / 100;
    const termUnit = values.termUnit || 'years';
    const termRaw = parseFloat(values.loanTerm);
    if ([principal, annualRate, termRaw].some(isNaN) || principal <= 0 || termRaw <= 0) return null;
    const months = termUnit === 'years' ? Math.ceil(termRaw * 12) : Math.ceil(termRaw);
    const monthlyRate = annualRate / 12;
    const payment = monthlyRate === 0
      ? principal / months
      : (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPaid = payment * months;
    const ratio = totalPaid > 0 ? ((totalPaid - principal) / totalPaid) * 100 : 0;
    const band = ratio < 15 ? 'Low' : ratio < 30 ? 'Moderate' : 'High';
    return {
      value: ratio,
      min: 0,
      max: 60,
      valueLabel: `Interest is ${ratio.toFixed(0)}% of total cost — ${band}`,
      bands: [
        { to: 15, label: 'Low', color: '#22c55e' },
        { to: 30, label: 'Moderate', color: '#f59e0b' },
        { to: 60, label: 'High', color: '#ef4444' },
      ],
      caption: 'The share of your payments that goes to interest rather than paying down what you borrowed. Lower is cheaper.',
    };
  },
  calculate: (values) => {
    const principal = parseFloat(values.loanAmount);
    const annualRate = parseFloat(values.interestRate) / 100;
    const termUnit = values.termUnit || 'years';
    const termRaw = parseFloat(values.loanTerm);

    if ([principal, annualRate, termRaw].some(isNaN) || principal <= 0 || termRaw <= 0) return [];

    // Math.ceil on fractional months -- prevents understating the term for microloans or
    // partial-month inputs (e.g., 1.1 years = 14 months with ceil vs 13 with round).
    const months = termUnit === 'years' ? Math.ceil(termRaw * 12) : Math.ceil(termRaw);
    const years = months / 12;
    const monthlyRate = annualRate / 12;

    let monthlyPayment: number;
    if (monthlyRate === 0) {
      monthlyPayment = principal / months;
    } else {
      monthlyPayment =
        (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
        (Math.pow(1 + monthlyRate, months) - 1);
    }

    const totalPaid = monthlyPayment * months;
    const totalInterest = totalPaid - principal;
    const interestRatio = (totalInterest / totalPaid) * 100;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      {
        id: 'monthlyPayment',
        label: 'Monthly Payment',
        value: `$${fmt(monthlyPayment)}`,
        highlight: true,
        color: 'neutral' as const,
        interpretation: `Over ${months} payments you'll pay $${fmt(totalInterest)} in interest — ${interestRatio.toFixed(0)}% of the $${fmt(totalPaid)} total. ${interestRatio > 30 ? 'A shorter term or lower rate would cut this sharply.' : 'That is a relatively efficient cost of borrowing.'}`,
      },
      {
        id: 'totalInterest',
        label: 'Total Interest Paid',
        value: `$${fmt(totalInterest)}`,
        color: 'negative' as const,
      },
      {
        id: 'totalCost',
        label: 'Total Cost of Loan (Principal + Interest)',
        value: `$${fmt(totalPaid)}`,
        color: 'neutral' as const,
      },
      {
        id: 'interestRatio',
        label: 'Interest as % of Total Cost',
        value: `${interestRatio.toFixed(1)}%`,
        color: interestRatio > 30 ? 'negative' : 'neutral' as const,
      },
      {
        id: 'termMonths',
        label: 'Loan Term',
        value: termUnit === 'years'
          ? `${termRaw} year${termRaw !== 1 ? 's' : ''} (${months} payments)`
          : `${months} month${months !== 1 ? 's' : ''} (${years.toFixed(1)} years)`,
        color: 'neutral' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    const principal = parseFloat(values.loanAmount);
    const annualRate = parseFloat(values.interestRate) / 100;
    const termUnit = values.termUnit || 'years';
    const termRaw = parseFloat(values.loanTerm);

    if (!results.length || isNaN(principal) || isNaN(annualRate) || isNaN(termRaw) || principal <= 0) return null;

    // Math.ceil on fractional months -- prevents understating the term for microloans or
    // partial-month inputs (e.g., 1.1 years = 14 months with ceil vs 13 with round).
    const months = termUnit === 'years' ? Math.ceil(termRaw * 12) : Math.ceil(termRaw);
    const years = months / 12;
    const monthlyRate = annualRate / 12;

    let monthlyPayment: number;
    if (monthlyRate === 0) {
      monthlyPayment = principal / months;
    } else {
      monthlyPayment =
        (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
        (Math.pow(1 + monthlyRate, months) - 1);
    }

    const totalInterest = monthlyPayment * months - principal;

    return createElement(AmortizationPanel, {
      loanAmount: principal,
      annualRate,
      years,
      monthlyPayment,
      totalInterest,
    });
  },
  educational: {
    formula: 'M = P × [r(1+r)^n] / [(1+r)^n − 1]',
    formulaDescription:
      'Monthly payment is calculated using the standard loan amortization formula — the same math used for auto loans, personal loans, and mortgages. This formula ensures each payment is exactly the same amount throughout the life of the loan, with the proportion allocated to interest decreasing over time as the principal balance shrinks.',
    diagram: {
      svg: '<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif"><path d="M 150,50 A 100,100 0 1,1 91,231 Z" fill="var(--svg-3b82f6)"/><path d="M 91,231 A 100,100 0 0,1 150,50 Z" fill="var(--svg-ef4444)"/><text x="150" y="148" font-size="14" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">Total Cost</text><text x="150" y="163" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">of Loan</text><text x="201" y="164" font-size="13" fill="var(--svg-ffffff)" text-anchor="middle" font-weight="600">Principal</text><text x="201" y="179" font-size="12" fill="var(--svg-ffffff)" text-anchor="middle">~60%</text><text x="99" y="132" font-size="13" fill="var(--svg-ffffff)" text-anchor="middle" font-weight="600">Interest</text><text x="99" y="147" font-size="12" fill="var(--svg-ffffff)" text-anchor="middle">~40%</text></svg>',
      alt: 'Pie chart showing typical loan cost breakdown with approximately 60% principal in blue and 40% interest in red',
      caption: 'Typical loan total cost breakdown — principal vs. interest over the full term',
    },
    variables: [
      { symbol: 'M', name: 'Monthly Payment', description: 'The fixed amount paid each month toward both principal and interest. This amount stays constant for the entire loan term, but the split between principal and interest changes with each payment.' },
      { symbol: 'Principal & Term', name: 'Loan Amount & Duration', description: 'The principal (P) is the total borrowed; the term (n) is the duration in months. A 5-year $20,000 loan has P=$20,000 and n=60. Together these determine the payment amount and total interest cost.' },
      { symbol: 'r', name: 'Monthly Rate', description: 'The annual interest rate divided by 12. This periodic rate is applied to the outstanding balance each month to calculate the interest portion of the payment.' },
    ],
    howToUse: [
      'Enter the loan amount, annual interest rate (APR), and choose between years or months for the term.',
      'Enter the term duration and review your monthly payment, total interest, and total cost.',
      'Scroll down to view the full amortization schedule showing each payment split month by month.',
    ],
    commonUses: [
      'Compare monthly payments across different loan terms to find the best balance between affordable payments and total interest cost.',
      'Calculate the true total cost of a loan including all principal and interest payments over the full amortization period.',
      'Experiment with extra payments to see how much interest you can save and how early you can become debt-free.',
    ],
    explanation:
      'Every loan payment is split between interest and principal repayment. Early in the loan term, most of each payment goes toward interest because the outstanding balance is largest. Over time, as the principal shrinks, less interest accrues and more of each payment goes toward reducing the balance. This is called amortization. The amortization schedule below shows exactly how each payment is allocated month by month and year by year. Use it to understand the true cost of your loan, see how much interest you will pay over the full term, and experiment with extra payments to see how much you could save by paying off the loan early.',
    faqs: [
      {
        question: 'What is the difference between interest rate and APR?',
        answer: 'The interest rate is the base cost of borrowing the principal amount. APR (Annual Percentage Rate) includes fees like origination charges, points, and certain closing costs, so it better represents the true annual cost of the loan. When comparing loan offers from different lenders, always compare APRs rather than just interest rates, as two loans with the same rate but different fees can have meaningfully different total costs.',
      },
      {
        question: 'Should I choose a shorter or longer loan term?',
        answer: 'Shorter terms have higher monthly payments but dramatically lower total interest because the principal is paid down faster and less time passes for interest to accrue. Longer terms have lower monthly payments but you pay far more in interest overall. For example, a $20,000 personal loan at 8% for 3 years costs about $2,560 in interest, while the same loan over 5 years costs about $4,300. Choose the shortest term you can comfortably afford.',
      },
      {
        question: 'How does an extra payment affect my loan?',
        answer: 'Extra payments go directly to principal reduction, shortening your loan term and reducing total interest. Even $50 extra per month on a 5-year $20,000 loan at 8% can save over $300 in interest and pay the loan off several months early. Use the Extra Payment feature available in the amortization schedule section below to model different scenarios.',
      },
      {
        question: 'What is a typical personal loan interest rate?',
        answer: 'Personal loan rates range from 6-36% depending on your credit score, income, and the lender. Borrowers with excellent credit (760+) may qualify for rates as low as 6-12%. Those with average credit typically see rates of 15-25%. Borrowers with challenged credit may face rates above 30%. It is always wise to compare offers from at least three lenders before committing.',
      },
      {
        question: 'What is amortization and why does it matter?',
        answer: 'Amortization is the process of spreading out a loan into fixed payments over time. Early payments are mostly interest because the outstanding balance is largest. Over time, as principal shrinks, more of each payment goes toward the balance. A 30-year mortgage at 6.5% means the first year\'s payments are about 80% interest and 20% principal. Understanding amortization shows why extra payments early in the loan term save the most money.',
      },
    ],
  citations: [
    { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/l/loan.asp' },
  ],
  },
};

export default loanCalculatorConfig;
