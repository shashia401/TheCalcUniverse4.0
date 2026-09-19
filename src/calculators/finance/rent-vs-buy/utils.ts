// ─── Mortgage amortization helpers ────────────────────────────────────────────

import { pmt } from '../../../utils/financial';

/** Calculate the monthly payment for a fixed-rate amortizing loan. */
export function monthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  return pmt(principal, annualRate / 12, termMonths);
}

/** Remaining loan balance at end of year y (after y*12 payments). */
export function loanBalanceAtYear(
  principal: number,
  annualRate: number,
  termMonths: number,
  year: number
): number {
  if (annualRate === 0) {
    return Math.max(0, principal - (principal / termMonths) * year * 12);
  }
  const r = annualRate / 12;
  const n = termMonths;
  const k = year * 12;
  if (k >= n) return 0;
  const mp = monthlyPayment(principal, annualRate, n);
  return mp * ((1 - Math.pow(1 + r, -(n - k))) / r);
}
