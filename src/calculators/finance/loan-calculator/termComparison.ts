import { pmt } from '../../../utils/financial';

// Same loan at different terms, side by side. Uses the calculator's own payment function (pmt) and its
// default amount/APR, so the table is a worked illustration of the default scenario, not a market quote.

export const REFERENCE_LOAN = { principal: 25000, aprPercent: 6.5 };
export const REFERENCE_TERMS_YEARS = [3, 5, 7, 10];

const money = (n: number, digits: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Quick-reference rows: monthly payment, total interest and total cost for each term. */
export function loanTermRows(
  { principal, aprPercent } = REFERENCE_LOAN,
  termsYears: number[] = REFERENCE_TERMS_YEARS,
): { label: string; value: string }[] {
  return termsYears.map((years) => {
    const months = years * 12;
    const payment = pmt(principal, aprPercent / 100 / 12, months);
    const total = payment * months;
    return {
      label: `${money(principal, 0)} at ${aprPercent}% APR, ${years} years (${months} payments)`,
      value: `${money(payment, 2)}/mo · interest ${money(total - principal, 0)} · total ${money(total, 0)}`,
    };
  });
}
