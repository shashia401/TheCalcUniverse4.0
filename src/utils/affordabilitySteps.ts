import type { ExplainStep } from '../types/calculator';
import type { AffordabilityInput, AffordabilityResult } from './affordability';

const money = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (x: number) => `${+(x * 100).toFixed(2)}%`;

/**
 * Worked solution for solveAffordability(): mirrors its branches (front/back limit, insurance,
 * closed-form price, PMI, all-cash and the 5x-down-payment edge) so the last step is the same price
 * the calculator shows. `fmtPrice` is the calculator's own price formatter.
 */
export function affordabilitySteps(i: AffordabilityInput, sol: AffordabilityResult, fmtPrice: (n: number) => string): ExplainStep[] {
  const income = i.annualIncome / 12;
  const n = i.years * 12;
  const r = i.annualRate / 12;
  const k = r === 0 ? 1 / n : (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const t = i.propertyTaxRate / 12;
  const ins = i.insuranceAnnual / 12;
  const m = (i.pmiRate ?? 0) / 12;
  const D = Math.max(0, i.downPayment);
  const front = income * i.frontPct;
  const back = income * i.backPct - i.monthlyDebts;
  const housing = sol.housingBudget;
  const budget = housing - ins;
  const priceFor = (kk: number) => (budget + D * kk) / (kk + t);
  const near = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
  const f8 = (x: number) => x.toFixed(8);

  const steps: ExplainStep[] = [
    {
      label: 'Turn your income into a monthly figure',
      expr: `${money(i.annualIncome)} ÷ 12 = ${money(income)}`,
    },
    {
      label: 'Apply both lender limits',
      expr: `Front-end: ${money(income)} × ${pct(i.frontPct)} = ${money(front)} · Back-end: ${money(income)} × ${pct(i.backPct)} − ${money(i.monthlyDebts)} debts = ${money(back)}`,
      note: 'Housing can use at most the front-end share of income, and housing plus your other debts can use at most the back-end share.',
    },
    {
      label: 'Take the smaller limit, then set aside insurance',
      expr: `min(${money(front)}, ${money(back)}) = ${money(housing)} housing budget · ${money(housing)} − ${money(ins)} insurance = ${money(budget)} for principal, interest and tax${m > 0 ? ' (and PMI)' : ''}`,
    },
    {
      label: 'Payment per $1 borrowed and monthly tax rate',
      expr: `k = r(1+r)ⁿ ÷ ((1+r)ⁿ − 1) = ${f8(k)} (r = ${(r * 100).toFixed(4)}%, n = ${n}) · t = ${pct(i.propertyTaxRate)} ÷ 12 = ${f8(t)}`,
    },
  ];

  let solve: string;
  if (budget < D * t) {
    solve = `P = ${money(budget)} ÷ ${f8(t)} = ${fmtPrice(sol.maxHomePrice)}`;
  } else if (near(sol.maxHomePrice, priceFor(k))) {
    solve = `P = (${money(budget)} + ${money(D)} × ${f8(k)}) ÷ (${f8(k)} + ${f8(t)}) = ${fmtPrice(sol.maxHomePrice)}`;
  } else if (m > 0 && near(sol.maxHomePrice, priceFor(k + m))) {
    solve = `P = (${money(budget)} + ${money(D)} × ${f8(k + m)}) ÷ (${f8(k + m)} + ${f8(t)}) = ${fmtPrice(sol.maxHomePrice)} (monthly PMI rate ${f8(m)} added to k)`;
  } else {
    solve = `P = 5 × ${money(D)} down payment = ${fmtPrice(sol.maxHomePrice)} (exactly 20% down, where PMI drops away)`;
  }
  steps.push({
    label: 'Solve for the maximum home price',
    expr: solve,
    note: 'Property tax grows with the price, so the price is solved directly instead of guessing a fixed share for tax.',
  });
  return steps;
}
