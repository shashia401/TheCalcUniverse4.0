const AMORTIZATION_EPSILON = 0.005; // Rounding tolerance for payment precision
/**
 * Shared financial math utilities.
 * Every calculator that needs compound growth, amortization, or return calculations
 * should import from here rather than duplicating formulas.
 */

/** Future value of a lump sum: FV = PV × (1 + r)^n */
export function fvLumpSum(pv: number, ratePerPeriod: number, periods: number): number {
  return pv * Math.pow(1 + ratePerPeriod, periods);
}

/** Future value of an ordinary annuity (payments at end of each period):
    FV = PMT × [((1 + r)^n − 1) / r] */
export function fvAnnuity(pmt: number, ratePerPeriod: number, periods: number): number {
  if (Math.abs(ratePerPeriod) < 1e-10) return pmt * periods;
  return pmt * ((Math.pow(1 + ratePerPeriod, periods) - 1) / ratePerPeriod);
}

/** Future value with both a lump sum and ongoing contributions:
    FV = PV(1+r)^n + PMT[((1+r)^n - 1) / r] */
export function fvWithContributions(
  pv: number,
  pmt: number,
  ratePerPeriod: number,
  periods: number
): number {
  return fvLumpSum(pv, ratePerPeriod, periods) + fvAnnuity(pmt, ratePerPeriod, periods);
}

/** Required monthly contribution to reach a target future value given starting principal:
    PMT = (FV − PV(1+r)^n) × r / ((1+r)^n − 1)
    Returns 0 if already on track (no additional savings needed). */
export function requiredMonthly(
  targetFv: number,
  pv: number,
  monthlyRate: number,
  months: number
): number {
  if (months <= 0) return 0;
  const futurePv = fvLumpSum(pv, monthlyRate, months);
  if (futurePv >= targetFv) return 0;
  const needed = targetFv - futurePv;
  if (monthlyRate === 0) return needed / months;
  return (needed * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1);
}

/** Standard amortized loan payment (PMT formula):
    PMT = P × [r(1+r)^n] / [(1+r)^n − 1] */
export function pmt(principal: number, ratePerPeriod: number, periods: number): number {
  if (Math.abs(ratePerPeriod) < 1e-10) return principal / periods;
  return (principal * (ratePerPeriod * Math.pow(1 + ratePerPeriod, periods))) /
    (Math.pow(1 + ratePerPeriod, periods) - 1);
}

/** Compound Annual Growth Rate */
export function cagr(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || years <= 0) return 0;
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

/** Arithmetic average of an array of numbers */
export function arithmeticAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/** Build a monthly amortization schedule.
    Returns array of { month, payment, interest, principal, balance }. */
export interface AmortRow {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export function buildSchedule(
  principal: number,
  monthlyRate: number,
  monthlyPayment: number,
  extraPayment = 0,
  maxMonths = 1200
): AmortRow[] {
  const rows: AmortRow[] = [];
  let balance = principal;
  const totalPmt = monthlyPayment + extraPayment;

  for (let i = 1; i <= maxMonths; i++) {
    if (balance <= AMORTIZATION_EPSILON) break;
    const interest = balance * monthlyRate;
    const principalPaid = Math.min(totalPmt - interest, balance + interest);
    if (principalPaid <= 0) break;
    balance = Math.max(0, balance + interest - totalPmt);
    rows.push({ month: i, payment: totalPmt, interest, principal: principalPaid, balance });
  }

  return rows;
}

/** Format a number as currency (large numbers use M/K shorthand). */
export function fmtCurrency(n: number, currency = 'USD'): string {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$';
  if (n >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${symbol}${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString(undefined, { style: 'currency', currency, maximumFractionDigits: 2 });
}

/** Format a number with exactly 2 decimal places, locale-formatted. */
export function fmtDollars(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
