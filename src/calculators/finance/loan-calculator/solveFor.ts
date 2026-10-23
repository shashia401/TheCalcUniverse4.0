import type { CalculatorResult, ExplainStep } from '../../../types/calculator';
import { finiteSteps } from '../../../utils/explainGuard';

// "Solve for" modes of the loan calculator: how much can I borrow at a payment I can afford, and how long
// does a loan take to pay off at a given payment. Moved here from the retired /finance/payment-calculator/
// page (301 to this one) so its searchers keep the same two answers. The default mode (monthly payment)
// stays in index.ts.

export type SolveFor = 'loanAmount' | 'term';

/** Longest payoff the calculator will describe: 50 years of monthly payments. */
const MAX_TERM_MONTHS = 600;
/** Present value of a level monthly payment: how much a payment of M supports over n months. */
const pvOfPayments = (M: number, monthlyRate: number, n: number) =>
  monthlyRate === 0 ? M * n : (M * (1 - Math.pow(1 + monthlyRate, -n))) / monthlyRate;

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/** Whole payments for the entered term (years or months); 0 when blank/invalid. */
const termMonths = (values: Record<string, string>) => {
  const termRaw = parseFloat(values.loanTerm);
  return values.termUnit === 'months' ? Math.round(termRaw) : Math.round(termRaw * 12);
};

export function solveLoanAmount(values: Record<string, string>): CalculatorResult[] {
  const monthlyRate = parseFloat(values.interestRate) / 100 / 12;
  const M = parseFloat(values.monthlyPayment);
  const termRaw = parseFloat(values.loanTerm);
  if ([monthlyRate, M, termRaw].some(isNaN) || M <= 0 || termRaw <= 0) return [];

  const n = termMonths(values);
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
    { id: 'totalInterest', label: 'Total Interest You Will Pay', value: `$${fmt(totalInterest)}`, color: 'negative' as const },
    { id: 'totalCost', label: 'Total Amount You Will Pay', value: `$${fmt(totalPaid)}`, color: 'neutral' as const },
    { id: 'monthlyPaymentLine', label: 'Monthly Payment', value: `$${fmt(M)}`, color: 'neutral' as const },
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

export function solveLoanTerm(values: Record<string, string>): CalculatorResult[] {
  const monthlyRate = parseFloat(values.interestRate) / 100 / 12;
  const P = parseFloat(values.loanAmount);
  const M = parseFloat(values.monthlyPayment);
  if ([monthlyRate, P, M].some(isNaN) || P <= 0 || M <= 0) return [];

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
    { id: 'term', label: 'Time to Pay Off', value: durationLabel(nRounded), highlight: true, color: 'neutral' as const },
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
      color: monthlyRate === 0 ? ('positive' as const) : ('negative' as const),
    },
    { id: 'totalCost', label: 'Total Amount Paid', value: `$${fmt(totalPaid)}`, color: 'neutral' as const },
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

export const solveForResults = (solveFor: SolveFor, values: Record<string, string>) =>
  solveFor === 'loanAmount' ? solveLoanAmount(values) : solveLoanTerm(values);

export function solveForSteps(solveFor: SolveFor, values: Record<string, string>): ExplainStep[] {
  const results = solveForResults(solveFor, values);
  if (!results.length || results[0].id === 'error') return [];
  const r = parseFloat(values.interestRate) / 100 / 12;
  const termUnit = values.termUnit || 'years';
  const termRaw = parseFloat(values.loanTerm);
  const rateStep = {
    label: 'Convert the APR to a monthly rate',
    expr: `r = ${+(parseFloat(values.interestRate)).toFixed(4)}% ÷ 12 = ${(r * 100).toFixed(4)}% = ${r.toFixed(6)}`,
    note: 'Interest is charged monthly, so the APR is split into 12 parts.',
  };
  const monthsStep = (n: number) => ({
    label: 'Count the payments',
    expr: `n = ${termUnit === 'years' ? `${termRaw} years × 12 = ` : ''}${n} monthly payments`,
  });
  const zero = Math.abs(r) < 1e-10;

  if (solveFor === 'loanAmount') {
    const M = parseFloat(values.monthlyPayment);
    const n = termMonths(values);
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
  const steps: ExplainStep[] = [rateStep];
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
}
