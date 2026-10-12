export interface SwpResult {
  /** Months in which a withdrawal was paid (the last may be partial when the fund runs out). */
  monthsPaid: number;
  totalWithdrawn: number;
  ending: number;
  /** True when the corpus was exhausted before (or exactly at) the end of the requested period. */
  depleted: boolean;
  /** Year-end balances (and the final month if it is not a year end). */
  yearly: { year: number; value: number }[];
}

/**
 * Month-by-month SWP: each month the balance earns annualRate/12, then the withdrawal is paid at month end.
 * If the grown balance cannot cover a full withdrawal, the fund pays out what is left and is depleted.
 */
export function simulateSwp(corpus: number, annualRate: number, withdrawal: number, months: number): SwpResult {
  const i = annualRate / 12;
  let bal = corpus;
  let paid = 0;
  let monthsPaid = 0;
  let depleted = false;
  const yearly: SwpResult['yearly'] = [];
  for (let m = 1; m <= months; m++) {
    bal *= 1 + i;
    if (bal >= withdrawal) {
      bal -= withdrawal;
      paid += withdrawal;
    } else {
      paid += bal;
      bal = 0;
    }
    monthsPaid = m;
    if (bal < 0.005) {
      bal = 0;
      depleted = true;
    }
    if (m % 12 === 0 || depleted || m === months) yearly.push({ year: m / 12, value: Math.round(bal * 100) / 100 });
    if (depleted) break;
  }
  return { monthsPaid, totalWithdrawn: paid, ending: bal, depleted, yearly };
}

/** Closed form for months until depletion when withdrawals exceed monthly growth: -ln(1 - i*C/W) / ln(1 + i). */
export function monthsToDepletion(corpus: number, annualRate: number, withdrawal: number): number {
  const i = annualRate / 12;
  if (i === 0) return corpus / withdrawal;
  const x = 1 - (i * corpus) / withdrawal;
  return x <= 0 ? Infinity : -Math.log(x) / Math.log(1 + i);
}
