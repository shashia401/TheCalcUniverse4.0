import { fvAnnuity, fvLumpSum } from '../../../utils/financial';

/**
 * Standard SIP maths: monthly rate i = annual rate / 12, instalments at the START of each month (annuity due),
 * lump sum compounding for the whole period.  FV = LS x (1+i)^n + P x [((1+i)^n - 1) / i] x (1+i).
 */
export function sipFutureValue(lumpsum: number, monthly: number, annualRate: number, months: number): number {
  const i = annualRate / 12;
  return fvLumpSum(lumpsum, i, months) + fvAnnuity(monthly, i, months) * (1 + i);
}

/** Year-end values, plus the final month when the horizon is not a whole number of years. */
export function sipYearly(lumpsum: number, monthly: number, annualRate: number, months: number) {
  const out: { year: number; value: number }[] = [];
  for (let m = 12; m <= months; m += 12) {
    out.push({ year: m / 12, value: Math.round(sipFutureValue(lumpsum, monthly, annualRate, m) * 100) / 100 });
  }
  if (months % 12 !== 0) {
    out.push({ year: months / 12, value: Math.round(sipFutureValue(lumpsum, monthly, annualRate, months) * 100) / 100 });
  }
  return out;
}
