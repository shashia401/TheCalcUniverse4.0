import { fvWithContributions, requiredMonthly } from '../../../utils/financial';

/**
 * APY is the EFFECTIVE annual yield, so the monthly rate is (1 + APY)^(1/12) - 1 (not APY / 12, which would
 * overstate growth: 5% APY on 5,000 for one year must give exactly 5,250.00).
 */
export const monthlyRateFromApy = (apy: number) => Math.pow(1 + apy, 1 / 12) - 1;

/** Whole months saved: deposits are monthly, so fractional months are rounded (minimum 1). */
export const wholeMonths = (timePeriod: number, unit: string) =>
  Math.max(1, Math.round(unit === 'years' ? timePeriod * 12 : timePeriod));

export interface SavingsPoint {
  month: number;
  deposited: number;
  balance: number;
}

/** Month-by-month balance (deposits at month end). Same recurrence as the closed form used for the headline figure. */
export function savingsSchedule(initial: number, monthly: number, apy: number, months: number): SavingsPoint[] {
  const r = monthlyRateFromApy(apy);
  const out: SavingsPoint[] = [{ month: 0, deposited: initial, balance: initial }];
  let bal = initial;
  for (let m = 1; m <= months; m++) {
    bal = bal * (1 + r) + monthly;
    out.push({ month: m, deposited: initial + monthly * m, balance: bal });
  }
  return out;
}

export function finalBalance(initial: number, monthly: number, apy: number, months: number): number {
  return fvWithContributions(initial, monthly, monthlyRateFromApy(apy), months);
}

/** Monthly deposit needed to reach `goal` (0 when the initial deposit alone gets there). */
export function monthlyForGoal(initial: number, goal: number, apy: number, months: number): number {
  return requiredMonthly(goal, initial, monthlyRateFromApy(apy), months);
}
