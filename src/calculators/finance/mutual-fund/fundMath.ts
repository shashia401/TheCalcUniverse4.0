import { fvWithContributions } from '../../../utils/financial';

/**
 * Projected balance after `months` of monthly compounding at (annualReturn - expenseRatio),
 * with the monthly contribution added at the END of each month (ordinary annuity).
 * A fee larger than the return gives a genuinely negative net rate (the fund shrinks); the
 * previous "clamp to zero growth" understated the fee's damage.
 */
export function fundBalance(
  initial: number,
  monthly: number,
  annualReturn: number,
  expenseRatio: number,
  months: number,
): number {
  return fvWithContributions(initial, monthly, (annualReturn - expenseRatio) / 12, months);
}

export interface FundPoint {
  /** Years elapsed (may be fractional for the final point). */
  year: number;
  withFee: number;
  withoutFee: number;
}

/** Year-by-year series from year 0 to `years` (a fractional final year gets its own point). */
export function fundSeries(
  initial: number,
  monthly: number,
  annualReturn: number,
  expenseRatio: number,
  years: number,
): FundPoint[] {
  const points: FundPoint[] = [];
  const at = (y: number): FundPoint => ({
    year: y,
    withFee: fundBalance(initial, monthly, annualReturn, expenseRatio, y * 12),
    withoutFee: fundBalance(initial, monthly, annualReturn, 0, y * 12),
  });
  for (let y = 0; y < years; y++) points.push(at(y));
  points.push(at(years));
  return points;
}
