// "Can I afford this car?" — one set of inputs, four linked answers. Pure functions only, so the server
// renders the same numbers the browser recomputes. The loan payment is the shared `pmt` (src/utils/financial.ts),
// the same formula the auto-loan calculator uses.
//
// The yardstick is the widely quoted 20/4/10 rule of thumb: at least 20% down, a loan of at most 4 years, and
// total transportation cost (payment + insurance + fuel and upkeep) under 10% of gross income. It is a guideline
// from personal-finance writing, NOT a lender rule. Lenders look at debt-to-income, so 43% is the ceiling here.
//
// Model (stated on the page):
//   cash down    = price x down%  (capped so cash + trade-in never exceed the price)
//   sales tax    = price x tax%   (tax and fees are paid in cash at signing, on the full price)
//   financed     = price - trade-in - cash down
//   20% test     = (cash down + trade-in) / price
import { pmt } from '../utils/financial';

export interface CarInputs {
  income: number; // gross income per year
  debts: number; // monthly payments on all existing debts, including rent or mortgage
  savings: number; // cash available at signing
  price: number; // vehicle price
  salesTaxPct: number; // sales tax + title/registration/doc fees, percent of price
  tradeIn: number; // trade-in value, $
  downPct: number; // cash down payment, percent of price (trade-in counts separately)
  rate: number; // loan APR, percent
  months: number; // loan term, 12-96
  insurance: number; // $ per month
  running: number; // fuel + maintenance, $ per month
}

/** Example scenario shown before the visitor types anything. The rate is an example, not a market rate. */
export const CAR_DEFAULTS: CarInputs = {
  income: 75000,
  debts: 1400,
  savings: 15000,
  price: 32000,
  salesTaxPct: 8,
  tradeIn: 0,
  downPct: 20,
  rate: 7,
  months: 60,
  insurance: 150,
  running: 200,
};

/** Guideline numbers the page states out loud. */
export const CAR_ASSUMPTIONS = {
  downMinPct: 20, // 20/4/10: at least 20% down
  termMaxMonths: 48, // 20/4/10: loan no longer than 4 years
  costGuidePct: 10, // 20/4/10: total transportation cost under 10% of gross income
  costCeilingPct: 15, // above this the tool calls the purchase over budget
  dtiCeilingPct: 43, // common lender ceiling for total debt-to-income
} as const;

export type Verdict = 'comfortable' | 'tight' | 'over';

export interface CarDecision {
  valid: boolean;
  inputs: CarInputs;
  // 1. payment and interest
  cashDown: number;
  taxFees: number;
  financed: number;
  payment: number;
  totalInterest: number;
  // 2. 20/4/10
  downSharePct: number; // (cash down + trade-in) / price
  monthlyCost: number; // payment + insurance + running
  costSharePct: number; // monthlyCost / gross monthly income
  paymentRoom: number; // largest payment that keeps costSharePct at the 10% guideline (can be negative)
  // 3. debt-to-income
  backEnd: number; // percent: (debts + payment) / gross monthly income
  // 4. cash and total cost
  cashNeeded: number; // cash down + sales tax and fees
  cashLeft: number; // savings - cashNeeded (negative = shortfall)
  totalCost: number; // cash paid over the loan term: cash down + tax/fees + payments + insurance + running
  // failed tests
  failedDown: boolean;
  failedTerm: boolean;
  failedCost: boolean; // above the 10% guideline
  overCost: boolean; // above the 15% ceiling
  overDti: boolean;
  short: boolean;
  verdict: Verdict;
  reasons: string[];
}

const finite = (n: number) => Number.isFinite(n);
const EPS = 1e-9;

export function validateCar(i: CarInputs): boolean {
  return (
    [i.income, i.debts, i.savings, i.price, i.salesTaxPct, i.tradeIn, i.downPct, i.rate, i.months, i.insurance, i.running].every(finite) &&
    i.income > 0 && i.price > 0 &&
    i.debts >= 0 && i.savings >= 0 && i.tradeIn >= 0 && i.insurance >= 0 && i.running >= 0 &&
    i.downPct >= 0 && i.downPct <= 100 &&
    i.salesTaxPct >= 0 && i.salesTaxPct <= 25 &&
    i.rate >= 0 && i.rate <= 30 &&
    Number.isInteger(i.months) && i.months >= 12 && i.months <= 96
  );
}

export const fmtMoney = (n: number): string =>
  `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;

export function evaluateCar(i: CarInputs): CarDecision {
  const A = CAR_ASSUMPTIONS;
  const monthlyIncome = i.income / 12;

  const cashDown = Math.min((i.price * i.downPct) / 100, Math.max(0, i.price - i.tradeIn));
  const taxFees = (i.price * i.salesTaxPct) / 100;
  const financed = Math.max(0, i.price - i.tradeIn - cashDown);
  const payment = financed > 0 ? pmt(financed, i.rate / 100 / 12, i.months) : 0;
  const totalInterest = financed > 0 ? payment * i.months - financed : 0;

  const downSharePct = ((cashDown + i.tradeIn) / i.price) * 100;
  const monthlyCost = payment + i.insurance + i.running;
  const costSharePct = (monthlyCost / monthlyIncome) * 100;
  const paymentRoom = (monthlyIncome * A.costGuidePct) / 100 - i.insurance - i.running;
  const backEnd = ((i.debts + payment) / monthlyIncome) * 100;

  const cashNeeded = cashDown + taxFees;
  const cashLeft = i.savings - cashNeeded;
  const totalCost = cashNeeded + payment * i.months + (i.insurance + i.running) * i.months;

  const failedDown = downSharePct < A.downMinPct - EPS;
  const failedTerm = financed > 0 && i.months > A.termMaxMonths; // no loan, no term to judge
  const failedCost = costSharePct > A.costGuidePct + EPS;
  const overCost = costSharePct > A.costCeilingPct + EPS;
  const overDti = backEnd > A.dtiCeilingPct + EPS;
  const short = cashLeft < 0;

  const reasons: string[] = [];
  if (short) reasons.push(`Cash needed at signing is ${fmtMoney(cashNeeded)} (down payment plus sales tax and fees); you are ${fmtMoney(-cashLeft)} short.`);
  if (overCost) {
    reasons.push(`All-in transportation cost is ${costSharePct.toFixed(1)}% of gross income (${fmtMoney(monthlyCost)} a month), above the ${A.costCeilingPct}% ceiling this tool treats as over budget.`);
  } else if (failedCost) {
    reasons.push(`All-in transportation cost is ${costSharePct.toFixed(1)}% of gross income (${fmtMoney(monthlyCost)} a month), above the ${A.costGuidePct}% guideline.`);
  }
  if (overDti) reasons.push(`Debt-to-income with the car payment is ${backEnd.toFixed(1)}%, above the ${A.dtiCeilingPct}% most lenders treat as the ceiling.`);
  if (failedDown) reasons.push(`Down payment plus trade-in is ${downSharePct.toFixed(1)}% of the price, below the ${A.downMinPct}% guideline.`);
  if (failedTerm) reasons.push(`The ${i.months}-month loan is longer than the ${A.termMaxMonths}-month (4-year) guideline.`);

  const verdict: Verdict = short || overCost || overDti ? 'over' : failedDown || failedTerm || failedCost ? 'tight' : 'comfortable';
  if (verdict === 'comfortable') reasons.push('Down payment, loan term, total transportation cost, debt-to-income and cash on hand all pass.');

  return {
    valid: validateCar(i),
    inputs: i,
    cashDown,
    taxFees,
    financed,
    payment,
    totalInterest,
    downSharePct,
    monthlyCost,
    costSharePct,
    paymentRoom,
    backEnd,
    cashNeeded,
    cashLeft,
    totalCost,
    failedDown,
    failedTerm,
    failedCost,
    overCost,
    overDti,
    short,
    verdict,
    reasons,
  };
}

// ---- shareable link: every input in the query string -------------------------------------------

const KEYS: Record<keyof CarInputs, string> = {
  income: 'income', debts: 'debts', savings: 'savings', price: 'price', salesTaxPct: 'tax', tradeIn: 'trade',
  downPct: 'down', rate: 'rate', months: 'term', insurance: 'ins', running: 'run',
};

/** Only keys this tool owns are read; values are capped at 12 characters and must be plain numbers. */
export function inputsFromQuery(search: string): CarInputs {
  const params = new URLSearchParams(search);
  const out: CarInputs = { ...CAR_DEFAULTS };
  for (const field of Object.keys(KEYS) as (keyof CarInputs)[]) {
    const raw = params.get(KEYS[field]);
    if (raw === null || raw.length > 12) continue;
    const n = Number(raw.replace(/,/g, ''));
    if (raw.trim() !== '' && Number.isFinite(n)) out[field] = n;
  }
  return out;
}

export function queryFromInputs(i: CarInputs): string {
  const params = new URLSearchParams();
  for (const field of Object.keys(KEYS) as (keyof CarInputs)[]) params.set(KEYS[field], String(i[field]));
  return params.toString();
}
