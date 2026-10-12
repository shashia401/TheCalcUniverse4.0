import { pmt } from '../../../utils/financial';

export interface RefiCalc {
  currentBalance: number;
  currentRate: number;
  newRate: number;
  currentTerm: number;
  newTerm: number;
  closingCosts: number;
  plannedStay: number;
  oldPayment: number;
  newPayment: number;
  /** old payment - new payment (negative when the payment rises, e.g. a shorter term) */
  monthlySavings: number;
  /** Whole months of savings needed to cover closing costs; Infinity if the payment does not fall. */
  breakEvenMonths: number;
  oldTotalInterest: number;
  newTotalInterest: number;
  /** Lifetime interest on the remaining old loan minus lifetime interest on the new loan (can be negative). */
  interestSaved: number;
  /** Payment savings over the planned stay minus closing costs. */
  netOverStay: number;
}

/** Single source of truth for the refinance maths, shared by calculate() and the panel. */
export function computeRefi(values: Record<string, string>): RefiCalc | null {
  const currentBalance = parseFloat(values.currentBalance);
  const currentRate = parseFloat(values.currentRate) / 100;
  const currentTerm = parseFloat(values.currentTerm);
  const newRate = parseFloat(values.newRate) / 100;
  const newTerm = parseFloat(values.newTerm);
  const closingCosts = parseFloat(values.closingCosts) || 0;
  const plannedStay = parseFloat(values.plannedStay) || 60;

  if ([currentBalance, currentRate, currentTerm, newRate, newTerm].some((n) => !Number.isFinite(n))) return null;
  if (currentBalance <= 0 || currentTerm < 1 || newTerm < 1 || currentRate < 0 || newRate < 0) return null;

  const oldPayment = pmt(currentBalance, currentRate / 12, currentTerm);
  const newPayment = pmt(currentBalance, newRate / 12, newTerm);
  const monthlySavings = oldPayment - newPayment;
  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : Infinity;
  const oldTotalInterest = oldPayment * currentTerm - currentBalance;
  const newTotalInterest = newPayment * newTerm - currentBalance;

  return {
    currentBalance, currentRate, newRate, currentTerm, newTerm, closingCosts, plannedStay,
    oldPayment, newPayment, monthlySavings, breakEvenMonths,
    oldTotalInterest, newTotalInterest,
    interestSaved: oldTotalInterest - newTotalInterest,
    netOverStay: monthlySavings * plannedStay - closingCosts,
  };
}

/** Balance points (x = years) at each year-end from today until the loan is repaid. */
export function balanceSeries(balance: number, annualRate: number, payment: number, termMonths: number): { x: number; y: number }[] {
  const out = [{ x: 0, y: balance }];
  const r = annualRate / 12;
  let b = balance;
  for (let m = 1; m <= termMonths; m++) {
    b = b * (1 + r) - payment;
    if (b < 0.005) b = 0; // float residue at the final payment
    if (m % 12 === 0 || m === termMonths) out.push({ x: m / 12, y: b });
  }
  return out;
}
