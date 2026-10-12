/**
 * Month-by-month mortgage payoff simulation, shared by index.ts (results) and
 * MortgagePayoffPanel.tsx (charts) so the two can never disagree.
 *
 * Conventions: interest accrues monthly on the opening balance; the optional yearly lump sum is
 * paid together with payment 13, 25, 37, ... (i.e. after each full year of payments); the single
 * lump sum is paid up-front, before the first payment.
 */

/** A payment that needs more than this many months is treated as "never pays off". */
export const MAX_PAYOFF_MONTHS = 1200;

export interface PayoffSim {
  months: number;
  totalInterest: number;
  /** Balance after each full year of payments (index 0 = end of year 1), ending with 0. */
  yearEndBalances: number[];
  /** True when the payment cannot retire the loan within MAX_PAYOFF_MONTHS. */
  neverPaysOff: boolean;
}

export function simulatePayoff(
  startBalance: number,
  monthlyRate: number,
  payment: number,
  extraMonthly = 0,
  yearlyLumpSum = 0,
  singleLumpSum = 0,
): PayoffSim {
  let bal = Math.max(0, startBalance - singleLumpSum);
  let months = 0;
  let totalInterest = 0;
  const yearEndBalances: number[] = [];

  while (bal > 0.005) {
    if (months >= MAX_PAYOFF_MONTHS) {
      return { months, totalInterest, yearEndBalances, neverPaysOff: true };
    }
    const interest = bal * monthlyRate;
    const extra = extraMonthly + (months > 0 && months % 12 === 0 ? yearlyLumpSum : 0);
    const principal = Math.min(bal, payment - interest + extra);
    if (principal <= 0) return { months, totalInterest, yearEndBalances, neverPaysOff: true };
    totalInterest += interest;
    bal -= principal;
    if (bal < 0.005) bal = 0; // sub-cent float residue is a paid-off loan
    months++;
    if (months % 12 === 0) yearEndBalances.push(bal);
  }
  if (months % 12 !== 0) yearEndBalances.push(0);
  return { months, totalInterest, yearEndBalances, neverPaysOff: false };
}

/**
 * "Month Year" label `months` payments from `from`. Anchored to the 1st of the month so that
 * e.g. 31 Jan + 1 month is February, not the 3 March that Date#setMonth overflow would give.
 */
export function payoffDateLabel(months: number, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth() + months, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
