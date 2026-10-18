// "Should I refinance?" — one set of inputs, four linked answers (payment, break-even, cost over your stay,
// lifetime interest). Pure functions only, so the server renders the same numbers the browser recomputes
// and unit tests can pin them to independent values. The payment is the standard annuity from
// src/utils/financial.ts (the same one the refinance calculator uses).
//
// Both loans are always compared over the SAME horizon (your stay), and separately to payoff, because a
// longer new term lowers the payment while raising lifetime interest.
import { pmt } from '../utils/financial';

export interface RefinanceInputs {
  balance: number; // current loan balance, $
  currentRate: number; // % APR
  yearsLeft: number; // remaining term of the current loan, years (may be fractional)
  newRate: number; // % APR
  newYears: number; // term of the new loan, years
  closingCosts: number; // total cost to refinance, $, paid in cash (not added to the loan)
  cashOut: number; // $ taken out at closing, added to the new loan (0 for none)
  stay: number; // years you expect to keep the home
}

export const REFINANCE_DEFAULTS: RefinanceInputs = {
  balance: 250000,
  currentRate: 7.5,
  yearsLeft: 25,
  newRate: 6,
  newYears: 25,
  closingCosts: 6000,
  cashOut: 0,
  stay: 7,
};

/** Assumptions the page states out loud. */
export const REFINANCE_ASSUMPTIONS = {
  breakEvenShare: 75, // % of your stay that break-even may use before the verdict drops to "tight"
  lifetimeTolerance: 1, // $ — lifetime interest within this of the current loan counts as "not higher"
  minSaving: 0.005, // $ per month — below this the payment is treated as not falling
  maxYears: 40,
} as const;

export type RefinanceVerdict = 'comfortable' | 'tight' | 'over';

export interface RefinanceDecision {
  valid: boolean;
  inputs: RefinanceInputs;
  // whole-month figures actually used
  monthsLeft: number;
  newMonths: number;
  stayMonths: number;
  newBalance: number; // balance + cash-out
  // 1. payment
  currentPayment: number;
  newPayment: number;
  monthlySaving: number; // current - new (negative when the payment rises)
  // 2. break-even
  breakEvenMonth: number | null; // ceil(closing / saving); null when the payment does not fall
  // 3. over the stay horizon (months = stayMonths)
  currentInterestStay: number;
  newInterestStay: number;
  currentBalanceEnd: number; // still owed at the end of the stay (0 if repaid)
  newBalanceEnd: number;
  currentPaymentsStay: number;
  newPaymentsStay: number;
  netCostStay: number; // staying: payments + balance owed at the end
  netCostRefi: number; // refinancing: closing + payments + balance owed at the end - cash out
  netAdvantage: number; // netCostStay - netCostRefi (positive = refinancing is cheaper over the stay)
  // 4. to payoff
  currentLifetimeInterest: number; // interest still to pay on the current loan
  newLifetimeInterest: number; // interest on the new loan
  lifetimeDiff: number; // new - current (positive = refinancing costs more interest overall)
  verdict: RefinanceVerdict;
  reasons: string[];
}

const finite = (n: number) => Number.isFinite(n);

export const fmtMoney = (n: number): string =>
  `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;

export const fmtMonths = (m: number): string => {
  if (m < 24) return `${m} ${m === 1 ? 'month' : 'months'}`;
  const y = m / 12;
  return `${m} months (${Number.isInteger(y) ? y : y.toFixed(1)} years)`;
};

export function validateRefinance(i: RefinanceInputs): boolean {
  const max = REFINANCE_ASSUMPTIONS.maxYears;
  return (
    [i.balance, i.currentRate, i.yearsLeft, i.newRate, i.newYears, i.closingCosts, i.cashOut, i.stay].every(finite) &&
    i.balance > 0 &&
    i.currentRate >= 0 && i.currentRate <= 30 &&
    i.newRate >= 0 && i.newRate <= 30 &&
    i.yearsLeft >= 1 / 12 && i.yearsLeft <= max &&
    i.newYears >= 1 / 12 && i.newYears <= max &&
    i.closingCosts >= 0 && i.cashOut >= 0 &&
    i.stay >= 0.5 && i.stay <= 50
  );
}

/** Balance after `k` of `n` payments on a loan of `b0` (0 once fully repaid). */
function balanceAfter(b0: number, annualRatePct: number, n: number, payment: number, k: number): number {
  if (k >= n) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return Math.max(0, b0 - payment * k);
  const g = Math.pow(1 + r, k);
  return Math.max(0, b0 * g - (payment * (g - 1)) / r);
}

export function evaluateRefinance(i: RefinanceInputs): RefinanceDecision {
  const A = REFINANCE_ASSUMPTIONS;
  const monthsLeft = Math.max(1, Math.round(i.yearsLeft * 12));
  const newMonths = Math.max(1, Math.round(i.newYears * 12));
  const stayMonths = Math.max(1, Math.round(i.stay * 12));
  const newBalance = i.balance + i.cashOut;

  const currentPayment = pmt(i.balance, i.currentRate / 100 / 12, monthsLeft);
  const newPayment = pmt(newBalance, i.newRate / 100 / 12, newMonths);
  const monthlySaving = currentPayment - newPayment;
  const falls = monthlySaving > A.minSaving;
  const breakEvenMonth = falls ? Math.ceil(i.closingCosts / monthlySaving) : null;

  // Everything below is measured over the same number of months for both loans.
  const kCur = Math.min(stayMonths, monthsLeft);
  const kNew = Math.min(stayMonths, newMonths);
  const currentBalanceEnd = balanceAfter(i.balance, i.currentRate, monthsLeft, currentPayment, stayMonths);
  const newBalanceEnd = balanceAfter(newBalance, i.newRate, newMonths, newPayment, stayMonths);
  const currentPaymentsStay = currentPayment * kCur;
  const newPaymentsStay = newPayment * kNew;
  const currentInterestStay = currentPaymentsStay - (i.balance - currentBalanceEnd);
  const newInterestStay = newPaymentsStay - (newBalance - newBalanceEnd);
  const netCostStay = currentPaymentsStay + currentBalanceEnd;
  const netCostRefi = i.closingCosts + newPaymentsStay + newBalanceEnd - i.cashOut;
  const netAdvantage = netCostStay - netCostRefi;

  const currentLifetimeInterest = currentPayment * monthsLeft - i.balance;
  const newLifetimeInterest = newPayment * newMonths - newBalance;
  const lifetimeDiff = newLifetimeInterest - currentLifetimeInterest;

  const saves = netAdvantage > 0.5;
  const lifetimeHigher = lifetimeDiff >= A.lifetimeTolerance;
  const beLate = breakEvenMonth !== null && breakEvenMonth > (A.breakEvenShare / 100) * stayMonths;
  const verdict: RefinanceVerdict = !saves ? 'over' : lifetimeHigher || beLate ? 'tight' : 'comfortable';

  const reasons: string[] = [];
  if (!saves) {
    reasons.push(`Over your ${fmtMonths(stayMonths)} stay, refinancing costs ${fmtMoney(-netAdvantage)} more than keeping your loan, once closing costs are counted.`);
    if (breakEvenMonth !== null && breakEvenMonth > stayMonths) reasons.push(`The lower payment takes ${fmtMonths(breakEvenMonth)} to repay the closing costs, longer than you plan to stay.`);
    if (!falls && i.cashOut === 0) reasons.push('The monthly payment does not fall, so there is no saving to repay the closing costs.');
  } else {
    reasons.push(`Over your ${fmtMonths(stayMonths)} stay, refinancing costs ${fmtMoney(netAdvantage)} less than keeping your loan, closing costs included.`);
    if (breakEvenMonth !== null && breakEvenMonth > stayMonths) {
      reasons.push(`The payment saving alone takes ${fmtMonths(breakEvenMonth)} to repay the closing costs, longer than your stay; the gain comes from paying principal down faster, so it is thin.`);
    } else if (beLate) {
      reasons.push(`Break-even takes ${fmtMonths(breakEvenMonth as number)}, more than ${A.breakEvenShare}% of your stay, so a slightly earlier move erases the gain.`);
    } else if (breakEvenMonth !== null) {
      reasons.push(`The closing costs are repaid by the lower payment in ${fmtMonths(breakEvenMonth)}.`);
    } else if (i.cashOut === 0) {
      reasons.push(`The payment rises by ${fmtMoney(-monthlySaving)} a month; the case rests on paying the loan off sooner and saving interest.`);
    }
    if (lifetimeHigher) reasons.push(`Taken to the end of both loans, you would pay ${fmtMoney(lifetimeDiff)} more interest. A longer term or extra borrowing lowers today's payment but costs more over the life of the loan.`);
  }
  if (i.cashOut > 0) reasons.push(`Cash-out of ${fmtMoney(i.cashOut)} is added to the new loan, so the payment is not comparable like for like; the verdict rests on net cost and lifetime interest.`);
  if (verdict === 'comfortable') reasons.push('Net cost over your stay is lower, break-even comes early, and total interest to payoff is not higher.');

  return {
    valid: validateRefinance(i),
    inputs: i,
    monthsLeft, newMonths, stayMonths, newBalance,
    currentPayment, newPayment, monthlySaving, breakEvenMonth,
    currentInterestStay, newInterestStay, currentBalanceEnd, newBalanceEnd,
    currentPaymentsStay, newPaymentsStay, netCostStay, netCostRefi, netAdvantage,
    currentLifetimeInterest, newLifetimeInterest, lifetimeDiff,
    verdict, reasons,
  };
}

// ---- shareable link: every input in the query string -------------------------------------------

const KEYS: Record<keyof RefinanceInputs, string> = {
  balance: 'bal', currentRate: 'rate', yearsLeft: 'left', newRate: 'nrate', newYears: 'nterm',
  closingCosts: 'cost', cashOut: 'cash', stay: 'stay',
};

/** Only keys this tool owns are read; values are capped at 12 characters and must be plain numbers. */
export function inputsFromQuery(search: string): RefinanceInputs {
  const params = new URLSearchParams(search);
  const out: RefinanceInputs = { ...REFINANCE_DEFAULTS };
  for (const field of Object.keys(KEYS) as (keyof RefinanceInputs)[]) {
    const raw = params.get(KEYS[field]);
    if (raw === null || raw.length > 12) continue;
    const n = Number(raw.replace(/,/g, ''));
    if (raw.trim() !== '' && Number.isFinite(n)) out[field] = n;
  }
  return out;
}

export function queryFromInputs(i: RefinanceInputs): string {
  const params = new URLSearchParams();
  for (const field of Object.keys(KEYS) as (keyof RefinanceInputs)[]) params.set(KEYS[field], String(i[field]));
  return params.toString();
}
