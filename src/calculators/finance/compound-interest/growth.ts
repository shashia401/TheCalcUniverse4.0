// Future value of a lump sum plus level monthly deposits at a given compounding frequency.
// Shared by calculate() and the educational growth table so they cannot drift apart.

/** rate is a decimal (0.07), n compounding periods per year, years may be fractional. */
export function futureValue(principal: number, monthly: number, rate: number, n: number, years: number): number {
  // Monthly deposits earn the monthly rate equivalent to the chosen compounding frequency
  const mr = Math.pow(1 + rate / n, n / 12) - 1;
  const months = years * 12;
  const futureP = principal * Math.pow(1 + rate / n, n * years);
  const futurePMT = mr === 0 ? monthly * months : monthly * ((Math.pow(1 + mr, months) - 1) / mr);
  return futureP + futurePMT;
}

/** The calculator's default scenario: $10,000 lump sum, monthly compounding. Rates are illustrative, not forecasts. */
export const REFERENCE_GROWTH = { principal: 10000, compoundsPerYear: 12, ratesPercent: [5, 7, 9], years: [5, 10, 20, 30] };

const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

/** Quick-reference rows: balance after each milestone year at each rate. */
export function growthRows({ principal, compoundsPerYear, ratesPercent, years } = REFERENCE_GROWTH): { label: string; value: string }[] {
  return years.map((y) => ({
    label: `${money(principal)} after ${y} years (compounded monthly)`,
    value: ratesPercent
      .map((r) => `${r}%: ${money(futureValue(principal, 0, r / 100, compoundsPerYear, y))}`)
      .join(' · '),
  }));
}
