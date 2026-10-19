import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import PaymentCalcPanel from './PaymentCalcPanel';
import { pmt } from '../../../utils/financial';
import { finiteSteps } from '../../../utils/explainGuard';

/** Longest payoff the calculator will describe: 50 years of monthly payments. */
const MAX_TERM_MONTHS = 600;
/** Present value of a level monthly payment: how much a payment of M supports over n months. */
const pvOfPayments = (M: number, monthlyRate: number, n: number) =>
  monthlyRate === 0 ? M * n : (M * (1 - Math.pow(1 + monthlyRate, -n))) / monthlyRate;

const paymentCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'solveFor',
      label: 'What Do You Want to Calculate?',
      type: 'select',
      required: true,
      options: [
        { label: 'Calculate Monthly Payment', value: 'payment' },
        { label: 'Calculate Loan Amount (How much can I borrow?)', value: 'loanAmount' },
        { label: 'Calculate Loan Term (How long will it take?)', value: 'term' },
      ],
    },
    {
      id: 'loanAmount',
      label: 'Loan Amount',
      type: 'number',
      placeholder: '25,000',
      prefix: '$',
      min: 0,
      step: 100,
      helpText: 'Total amount borrowed — leave blank if calculating this',
    },
    {
      id: 'monthlyPayment',
      label: 'Monthly Payment',
      type: 'number',
      placeholder: '500',
      prefix: '$',
      min: 0,
      step: 10,
      helpText: 'How much you can afford to pay per month — leave blank if calculating this',
    },
    {
      id: 'interestRate',
      label: 'Annual Interest Rate (APR)',
      type: 'number',
      placeholder: '7',
      unit: '%',
      min: 0,
      max: 50,
      step: 0.01,
      required: true,
    },
    {
      id: 'termUnit',
      label: 'Loan Term In',
      type: 'select',
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
      min: 0,
      max: 600,
      step: 1,
      helpText: 'Leave blank if calculating loan term',
    },
  ],
  calculate: (values) => {
    const solveFor = values.solveFor || 'payment';
    const annualRate = parseFloat(values.interestRate) / 100;
    const monthlyRate = annualRate / 12;

    if (isNaN(annualRate)) return [];

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtInt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    if (solveFor === 'payment') {
      const P = parseFloat(values.loanAmount);
      const termRaw = parseFloat(values.loanTerm);
      const termUnit = values.termUnit || 'years';
      if ([P, termRaw].some(isNaN) || P <= 0 || termRaw <= 0) return [];

      const n = termUnit === 'years' ? Math.round(termRaw * 12) : Math.round(termRaw);
      if (n < 1) return []; // term rounds to zero payments
      if (n > MAX_TERM_MONTHS) return [];
      const M = pmt(P, monthlyRate, n);

      const totalPaid = M * n;
      const totalInterest = totalPaid - P;

      return [
        {
          id: 'payment',
          label: 'Monthly Payment',
          value: `$${fmt(M)}`,
          highlight: true,
          color: 'neutral' as const,
          interpretation: `Over the full term you'll pay $${fmt(totalInterest)} in interest on top of the $${fmt(P)} borrowed. This uses a fixed rate for the whole term — if your actual loan is variable-rate, the real payment can shift as rates change.`,
        },
        {
          id: 'totalInterest',
          label: 'Total Interest Paid',
          value: `$${fmt(totalInterest)}`,
          color: 'negative' as const,
        },
        {
          id: 'totalCost',
          label: 'Total Cost of Loan',
          value: `$${fmt(totalPaid)}`,
          color: 'neutral' as const,
        },
        {
          id: 'termInfo',
          label: 'Loan Term',
          value: `${n} payment${n !== 1 ? 's' : ''} (${(n / 12).toFixed(1)} years)`,
          color: 'neutral' as const,
        },
        {
          id: 'interestPct',
          label: 'Interest as % of Total',
          value: `${((totalInterest / totalPaid) * 100).toFixed(1)}%`,
          color: totalInterest / totalPaid > 0.25 ? 'negative' : 'neutral' as const,
        },
      ];
    }

    if (solveFor === 'loanAmount') {
      const M = parseFloat(values.monthlyPayment);
      const termRaw = parseFloat(values.loanTerm);
      const termUnit = values.termUnit || 'years';
      if ([M, termRaw].some(isNaN) || M <= 0 || termRaw <= 0) return [];

      const n = termUnit === 'years' ? Math.round(termRaw * 12) : Math.round(termRaw);
      if (n < 1 || n > MAX_TERM_MONTHS) return []; // term rounds to zero payments, or is unrealistically long
      const P = pvOfPayments(M, monthlyRate, n);

      const totalPaid = M * n;
      const totalInterest = totalPaid - P;

      return [
        {
          id: 'loanAmount',
          label: `Maximum Loan Amount at $${fmt(M)}/month`,
          value: `$${fmt(P)}`,
          highlight: true,
          color: 'positive' as const,
        },
        {
          id: 'totalInterest',
          label: 'Total Interest You Will Pay',
          value: `$${fmt(totalInterest)}`,
          color: 'negative' as const,
        },
        {
          id: 'totalCost',
          label: 'Total Amount You Will Pay',
          value: `$${fmt(totalPaid)}`,
          color: 'neutral' as const,
        },
        {
          id: 'monthlyPaymentLine',
          label: 'Monthly Payment',
          value: `$${fmt(M)}`,
          color: 'neutral' as const,
        },
        {
          id: 'increaseBy50',
          label: `If You Pay $${fmtInt(M + 50)}/month (+$50) You Can Borrow`,
          value: (() => {
            const extraP = pvOfPayments(M + 50, monthlyRate, n);
            return `$${fmt(extraP)} — $${fmt(extraP - P)} more`;
          })(),
          color: 'positive' as const,
        },
      ];
    }

    if (solveFor === 'term') {
      const P = parseFloat(values.loanAmount);
      const M = parseFloat(values.monthlyPayment);
      if ([P, M].some(isNaN) || P <= 0 || M <= 0) return [];

      const durationLabel = (n: number) => {
        const years = Math.floor(n / 12);
        const months = n % 12;
        return years > 0
          ? `${years} year${years !== 1 ? 's' : ''}${months > 0 ? ` and ${months} month${months !== 1 ? 's' : ''}` : ''}`
          : `${n} month${n !== 1 ? 's' : ''}`;
      };
      const tooLong = {
        id: 'error',
        label: 'Payment Too Low',
        value: `At $${fmt(M)}/month this loan would take more than ${MAX_TERM_MONTHS / 12} years to pay off. Increase the payment.`,
        color: 'negative' as const,
      };

      const minPayment = P * monthlyRate;
      if (monthlyRate > 0 && M <= minPayment) {
        return [
          {
            id: 'error',
            label: 'Payment Too Low',
            value: `Monthly payment must exceed $${fmt(minPayment)} to cover interest. Loan will never be paid off.`,
            color: 'negative' as const,
          },
        ];
      }

      // Exact (fractional) number of payments, then whole payments with a smaller final payment.
      const nExact = monthlyRate === 0 ? P / M : -Math.log(1 - (monthlyRate * P) / M) / Math.log(1 + monthlyRate);
      const nRounded = Math.max(1, Math.ceil(nExact - 1e-9));
      if (nRounded > MAX_TERM_MONTHS) return [tooLong];

      // Total paid = (n-1) full payments + a final payment equal to the remaining balance plus its interest.
      let totalPaid: number;
      if (monthlyRate === 0) {
        totalPaid = P;
      } else {
        const growth = Math.pow(1 + monthlyRate, nRounded - 1);
        const balanceBeforeLast = P * growth - (M * (growth - 1)) / monthlyRate;
        totalPaid = M * (nRounded - 1) + Math.min(M, balanceBeforeLast * (1 + monthlyRate));
      }
      const totalInterest = totalPaid - P;

      return [
        {
          id: 'term',
          label: 'Time to Pay Off',
          value: durationLabel(nRounded),
          highlight: true,
          color: 'neutral' as const,
        },
        {
          id: 'totalPayments',
          label: 'Total Number of Payments',
          value: `${nRounded} payment${nRounded !== 1 ? 's' : ''} (the last one may be smaller)`,
          color: 'neutral' as const,
        },
        {
          id: 'totalInterest',
          label: monthlyRate === 0 ? 'Total Interest Paid (0% rate)' : 'Total Interest Paid',
          value: `$${fmt(totalInterest)}`,
          color: monthlyRate === 0 ? 'positive' as const : 'negative' as const,
        },
        {
          id: 'totalCost',
          label: 'Total Amount Paid',
          value: `$${fmt(totalPaid)}`,
          color: 'neutral' as const,
        },
        ...(monthlyRate > 0
          ? [{
              id: 'minPayment',
              label: 'Minimum Payment to Cover Interest Only',
              value: `$${fmt(minPayment)}/month (never pays off principal)`,
              color: 'negative' as const,
            }]
          : []),
      ];
    }

    return [];
  },
  explainSteps: (values) => {
    const results = paymentCalculatorConfig.calculate(values);
    if (!results.length || results[0].id === 'error') return [];
    const solveFor = values.solveFor || 'payment';
    const annualRate = parseFloat(values.interestRate) / 100;
    const r = annualRate / 12;
    const termUnit = values.termUnit || 'years';
    const termRaw = parseFloat(values.loanTerm);
    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const rateStep = {
      label: 'Convert the APR to a monthly rate',
      expr: `r = ${+(annualRate * 100).toFixed(4)}% ÷ 12 = ${(r * 100).toFixed(4)}% = ${r.toFixed(6)}`,
      note: 'Interest is charged monthly, so the APR is split into 12 parts.',
    };
    const monthsStep = (n: number) => ({
      label: 'Count the payments',
      expr: `n = ${termUnit === 'years' ? `${termRaw} years × 12 = ` : ''}${n} monthly payments`,
    });
    const zero = Math.abs(r) < 1e-10;

    if (solveFor === 'payment') {
      const P = parseFloat(values.loanAmount);
      const n = termUnit === 'years' ? Math.round(termRaw * 12) : Math.round(termRaw);
      const M = pmt(P, r, n);
      const totalPaid = M * n;
      const total = {
        label: 'Total cost over the life of the loan',
        expr: `$${fmt(M)} × ${n} = $${fmt(totalPaid)}  (interest: $${fmt(totalPaid - P)})`,
      };
      if (zero) {
        return finiteSteps([
          rateStep,
          monthsStep(n),
          { label: 'No interest, so divide the loan evenly', expr: `M = $${fmt(P)} ÷ ${n} = $${fmt(M)}/month` },
          total,
        ]);
      }
      const growth = Math.pow(1 + r, n);
      return finiteSteps([
        rateStep,
        monthsStep(n),
        {
          label: 'Grow $1 for n months of compounding',
          expr: `(1 + r)ⁿ = (1 + ${r.toFixed(6)})^${n} = ${growth.toFixed(4)}`,
        },
        {
          label: 'Apply the amortization formula',
          expr: `M = $${fmt(P)} × (${r.toFixed(6)} × ${growth.toFixed(4)}) ÷ (${growth.toFixed(4)} − 1) = $${fmt(M)}`,
          note: 'The one payment that pays the interest and retires the balance exactly at the last month.',
        },
        total,
      ]);
    }

    if (solveFor === 'loanAmount') {
      const M = parseFloat(values.monthlyPayment);
      const n = termUnit === 'years' ? Math.round(termRaw * 12) : Math.round(termRaw);
      const P = pvOfPayments(M, r, n);
      const factor = zero ? n : (1 - Math.pow(1 + r, -n)) / r;
      return finiteSteps([
        rateStep,
        monthsStep(n),
        {
          label: 'What $1 a month for n months can repay',
          expr: zero
            ? `factor = n = ${n}`
            : `factor = (1 − (1 + ${r.toFixed(6)})^−${n}) ÷ ${r.toFixed(6)} = ${factor.toFixed(4)}`,
          note: 'This reverses the payment formula: the loan is the present value of all your payments.',
        },
        { label: 'Multiply by your payment', expr: `P = $${fmt(M)} × ${factor.toFixed(4)} = $${fmt(P)}` },
      ]);
    }

    // solveFor === 'term'
    const P = parseFloat(values.loanAmount);
    const M = parseFloat(values.monthlyPayment);
    const nExact = zero ? P / M : -Math.log(1 - (r * P) / M) / Math.log(1 + r);
    const nRounded = Math.max(1, Math.ceil(nExact - 1e-9));
    const steps: { label: string; expr: string; note?: string }[] = [rateStep];
    if (zero) {
      steps.push({ label: 'No interest, so divide the loan by the payment', expr: `n = $${fmt(P)} ÷ $${fmt(M)} = ${nExact.toFixed(2)} payments` });
    } else {
      steps.push({
        label: 'Interest charged in the first month',
        expr: `$${fmt(P)} × ${r.toFixed(6)} = $${fmt(P * r)}`,
        note: 'The payment must be larger than this or the balance never shrinks.',
      });
      steps.push({
        label: 'Solve for the number of payments',
        expr: `n = −ln(1 − ${r.toFixed(6)} × $${fmt(P)} ÷ $${fmt(M)}) ÷ ln(1 + ${r.toFixed(6)}) = ${nExact.toFixed(2)}`,
      });
    }
    steps.push({
      label: 'Round up to whole payments',
      expr: `⌈${nExact.toFixed(2)}⌉ = ${nRounded} payments = ${results[0].value}`,
      note: 'The last payment may be smaller than the others.',
    });
    return finiteSteps(steps);
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PaymentCalcPanel, { values, results });
  },
  educational: {
    formula: 'Payment: M = P·r(1+r)^n / [(1+r)^n−1] | Loan: P = M·[(1+r)^n−1] / [r(1+r)^n] | Term: n = −ln(1 − rP/M) / ln(1+r)',
    formulaDescription:
      'This calculator works in all three directions — given any two of (payment, loan amount, term), it solves for the third. All three use the same amortization math, rearranged algebraically. The monthly payment formula is the standard loan amortization formula widely used in mortgages, auto loans, and personal lending. The loan amount formula reverses it to solve for how much you qualify for. The term formula uses natural logarithms to find the exact number of payments needed.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto" font-family="system-ui,sans-serif"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="8"/><text x="160" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">Solve for Any Loan Variable</text><text x="160" y="36" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Enter any two values — the formula finds the third</text><g transform="translate(25,50)"><rect x="0" y="0" width="120" height="34" rx="6" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="60" y="14" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-1e40af)">Loan Amount</text><text x="60" y="27" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">How much you borrow</text><rect x="75" y="60" width="120" height="34" rx="6" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1.5"/><text x="135" y="74" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-92400e)">Monthly Payment</text><text x="135" y="87" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">What you pay per month</text><rect x="0" y="50" width="120" height="34" rx="6" fill="var(--svg-dcfce7)" stroke="var(--svg-22c55e)" stroke-width="1.5"/><text x="60" y="64" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-166534)">Loan Term</text><text x="60" y="77" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">Duration of loan</text></g><line x1="145" y1="84" x2="175" y2="56" stroke="var(--svg-94a3b8)" stroke-width="1.5"/><line x1="145" y1="84" x2="175" y2="90" stroke="var(--svg-94a3b8)" stroke-width="1.5"/><line x1="175" y1="50" x2="145" y2="84" stroke="var(--svg-94a3b8)" stroke-width="1.5"/><g transform="translate(15,148)"><rect x="0" y="0" width="290" height="42" rx="8" fill="var(--svg-f1f5f9)"/><text x="145" y="14" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-475569)">Mathematical Relationship</text><text x="145" y="28" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">M = P·r(1+r)ⁿ/[(1+r)ⁿ−1]</text><text x="145" y="39" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">P = max loan | M = payment | n = months | r = monthly rate</text></g></svg>',
      alt: 'Triangular diagram showing the relationship between loan amount, monthly payment, and loan term, with the amortization formula below',
      caption: 'Given any two loan variables (amount, payment, term), the standard amortization formula solves for the third',
    },
    variables: [
      { symbol: 'M', name: 'Monthly Payment', description: 'The fixed amount paid each month, covering both principal and interest portions. The payment amount is constant for the life of the loan under standard amortization.' },
      { symbol: 'Principal & Term', name: 'Amount Borrowed & Duration', description: 'The principal is the total loan amount; the term (n) is the full duration in months. A 5-year $25,000 loan has P=$25,000 and n=60. These together define the payment: larger principal or shorter term means higher payments.' },
      { symbol: 'r', name: 'Monthly Rate', description: 'The annual APR divided by 12 to get the periodic rate. Even a small change in r significantly affects the monthly payment — a 1% APR difference on a $25,000 loan changes the monthly payment by roughly $12-15.' },
    ],
    howToUse: [
      'Select what you want to calculate from the dropdown.',
      'Calculate Monthly Payment: enter loan amount, interest rate, and term.',
      'Calculate Loan Amount: enter what you can afford per month, interest rate, and term.',
      'Calculate Loan Term: enter loan amount, monthly payment, and interest rate.',
      'Leave the field you are solving for blank — the calculator fills it in.',
      'Use the "+$50/month" result in Loan Amount mode to see how much extra borrowing power a small payment increase gives you.',
    ],
    commonUses: [
      'Determine how large a loan you can afford by entering your target monthly payment, interest rate, and desired loan term — see how much house or car you can qualify for before shopping.',
      'Compare loan scenarios side by side: a $30,000 car loan at 6% for 60 months ($580/month) vs 72 months ($497/month) — lower payment but about $1,000 more in interest.',
      'Find out how long it will take to pay off a loan at your current monthly payment amount including accrued interest, plus see how adding just $50/month accelerates your payoff.',
      'See the true cost of extending your mortgage term: a $200,000 mortgage at 6.5% costs $1,264/month for 30 years ($255,000 interest) vs $1,742/month for 15 years ($113,600 interest) — save about $141,500 by choosing 15 years if you can afford the payment.',
      'Use the Calculate Loan Amount mode to reverse-engineer your borrowing power: if you can afford $600/month and qualify for 7% APR over 60 months, you can borrow approximately $30,300 — but at 72 months, ~$35,200.',
      'Credit card debt analysis: see how long it takes to pay off revolving credit card debt at minimum payments, and compare the impact of increasing your payment to a fixed amount each month.',
    ],
    explanation:
      'This is the "solve for X" loan calculator. Most people know their budget (monthly payment) and want to know how large a loan they can afford. Others know the loan amount and want to find out how long it will take to pay it off at their current payment. All three calculations use the same amortization equation, just rearranged algebraically. The minimum payment warning shows the point at which your payment only covers interest and the balance never decreases — a critical threshold to understand, especially for credit card debt where minimum payments are often set just above this level. Understanding the relationship between these three variables — loan amount, payment, and term — is the foundation of smart borrowing. A $50 increase in monthly payment on a $25,000 loan at 7% APR ($495.03 to $545) shortens the term from 60 months to 54 months and saves about $520 in total interest.',
    faqs: [
      {
        question: 'How much can I afford to borrow at $500/month?',
        answer: 'Select "Calculate Loan Amount," enter $500 as your monthly payment, your expected APR, and desired term. For example, at 7% APR over 5 years: $500/month = ~$25,250 loan. Over 3 years: ~$16,200. Over 7 years: ~$33,100. A longer term increases borrowing power but costs more in total interest.',
      },
      {
        question: 'What happens if my payment only covers the interest?',
        answer: 'If your monthly payment equals the monthly interest charge, no principal is ever paid down and the loan never ends. This is sometimes called an "interest-only" payment. The calculator shows your minimum interest-covering payment so you know the floor beneath which you would never make progress. Credit card minimum payments are often dangerously close to this threshold.',
      },
      {
        question: 'I know the loan amount and payment — how long will it take?',
        answer: 'Select "Calculate Loan Term," enter your loan amount and monthly payment. The formula n = −ln(1 − rP/M) / ln(1+r) solves for the exact number of payments using natural logarithms. This is mathematically precise and accounts for the declining balance effect where each successive payment has a larger principal portion and smaller interest portion.',
      },
      {
        question: 'How does increasing my monthly payment affect my loan term?',
        answer: 'Extra payments reduce principal faster, which reduces future interest charges, creating a virtuous cycle that shortens the loan significantly. Even small increases have an outsized effect — adding $25/month to a $500 payment on a 5-year loan can save months of payments and hundreds in interest. The earlier in the loan term you make extra payments, the greater the impact because the principal is highest at the beginning.',
      },
      {
        question: 'Should I choose a shorter or longer loan term?',
        answer: 'Shorter terms have higher monthly payments but much less total interest. Longer terms have lower payments but cost significantly more over time. For a $25,000 loan at 7%: a 3-year term costs $772/month with $2,789 total interest; a 5-year term costs $495/month with $4,700 total interest. Choose the shortest term you can comfortably afford.',
      },
      {
        question: 'What is the best strategy for paying off a car loan vs a mortgage?',
        answer: 'For car loans (typically $20K-$50K over 3-7 years at 5-9% APR): a shorter term is almost always better because cars depreciate rapidly. A $35,000 car loan at 7% over 48 months costs $838/month with $5,230 total interest vs 72 months at $597/month with $7,963 total interest — the extra 2 years costs about $2,734 more in interest. For mortgages ($150K-$500K+ over 15-30 years at 6-7% APR): a 15-year term saves dramatically on interest but requires a much higher payment. A $250,000 mortgage at 6.5% costs $2,178/month for 15 years ($142,000 total interest) vs $1,580/month for 30 years ($318,900 total interest). The 30-year term costs about $176,900 more in interest. However, the 15-year payment is about $598/month higher, so choose based on whether the cash flow or long-term savings matters more to you.',
      },
      {
        question: 'How much more can I borrow if I add $50 to my monthly payment?',
        answer: 'Adding $50/month increases your borrowing power significantly more than $50 times the loan term because the extra payment reduces the interest burden. For example, at 7% APR over 60 months: $500/month gets you ~$25,250 while $550/month gets you ~$27,800 — that is about $2,500 more borrowing power from just $50 extra per month. Over 72 months at the same rate: $500/month → ~$29,300, $550/month → ~$32,300. The calculator shows this as the "+$50/month" line in Loan Amount mode.',
      },
    ],
  citations: [
    { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/p/payment.asp' },
  ],
  },
};

export default paymentCalculatorConfig;
