// Pure future-value math shared by index.tsx and FutureValuePanel.tsx.
import { fvLumpSum, fvAnnuity } from '../../../utils/financial';

/**
 * FV of a lump sum plus level MONTHLY end-of-month deposits when interest compounds `m` times a year.
 * The nominal rate is converted to the equivalent monthly rate i = (1 + r/m)^(m/12) - 1, so monthly
 * deposits earn exactly the same effective annual rate as the lump sum for every compounding option
 * (for m = 12 this is the textbook PV(1+r/12)^n + PMT[((1+r/12)^n - 1)/(r/12)]).
 */
export function futureValue(
  presentValue: number,
  annualRate: number, // decimal
  m: number,
  monthlyContribution: number,
  years: number,
): number {
  const ratePerPeriod = annualRate / m;
  const lump = fvLumpSum(presentValue, ratePerPeriod, years * m);
  if (!(monthlyContribution > 0)) return lump;
  const monthlyRate = Math.pow(1 + ratePerPeriod, m / 12) - 1;
  return lump + fvAnnuity(monthlyContribution, monthlyRate, years * 12);
}

export const COMPOUNDING_LABELS: Record<number, string> = {
  1: 'Annual',
  2: 'Semi-Annual',
  4: 'Quarterly',
  12: 'Monthly',
  365: 'Daily',
};
