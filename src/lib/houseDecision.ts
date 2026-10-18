// "Can I afford this house?" — one set of inputs, four linked answers. Pure functions only, so the
// server renders the same numbers the browser recomputes, and every figure comes from the audited
// pieces the individual calculators already use:
//   affordability  -> src/utils/affordability.ts   (28/36 qualifying ratios, PITI, PMI)
//   DTI bands      -> realestate/dti-ratio/dtiMath  (Fannie Mae / HUD thresholds)
//   cash to close  -> realestate/closing-costs/closingMath
//   rent vs buy    -> finance/rent-vs-buy/model     (month-by-month simulation)
import { solveAffordability } from '../utils/affordability';
import { backEndBand, frontEndBand, type Band } from '../calculators/realestate/dti-ratio/dtiMath';
import { closingCosts } from '../calculators/realestate/closing-costs/closingMath';
import { firstBuyingWinsYear, simulateRentVsBuy, type RvbParams } from '../calculators/finance/rent-vs-buy/model';

export interface HouseInputs {
  income: number; // gross household income per year
  debts: number; // other monthly debt payments (car, student loans, cards)
  savings: number; // cash available for down payment, closing costs and reserves
  price: number; // the house being considered
  downPct: number; // percent of price
  rate: number; // mortgage rate, percent
  years: number; // mortgage term
  taxPct: number; // property tax, percent of price per year
  insurance: number; // homeowner's insurance, $ per year
  hoa: number; // HOA dues, $ per month
  rent: number; // current rent, $ per month
  stay: number; // years you expect to stay
}

export const HOUSE_DEFAULTS: HouseInputs = {
  income: 100000,
  debts: 500,
  savings: 120000,
  price: 400000,
  downPct: 20,
  rate: 6.75,
  years: 30,
  taxPct: 1.1,
  insurance: 1500,
  hoa: 0,
  rent: 2200,
  stay: 7,
};

/** Assumptions the page states out loud (and the calculators behind it use). */
export const HOUSE_ASSUMPTIONS = {
  frontLimit: 28, // % of gross monthly income for housing
  backLimit: 36, // % for housing + other debts
  pmiPct: 0.8, // % of the loan per year, only below 20% down
  reserveMonths: 3, // months of housing payments kept as cash after closing
  rentIncreasePct: 3,
  rentersInsurance: 200,
  appreciationPct: 3,
  maintenancePct: 1.5,
  sellingCostsPct: 6,
  investReturnPct: 7,
  rvbClosingPct: 3,
} as const;

export type Verdict = 'comfortable' | 'tight' | 'over';

export interface HouseDecision {
  valid: boolean;
  inputs: HouseInputs;
  // 1. affordability
  maxPrice: number | null; // highest price the 28/36 limits allow with this down payment in dollars
  downPayment: number;
  loan: number;
  principalAndInterest: number;
  propertyTax: number; // per month
  insurance: number; // per month
  hoa: number;
  pmi: number; // per month
  housing: number; // total monthly housing payment
  // 2. DTI
  frontEnd: number; // percent
  backEnd: number; // percent
  frontBand: Band;
  backBand: Band;
  // 3. cash
  closing: number;
  reserves: number;
  cashNeeded: number;
  cashLeft: number; // savings minus cashNeeded (negative = shortfall)
  // 4. rent vs buy
  breakEvenYear: number | null; // first year buying beats renting, null = not within 30 years
  netBuyCost: number; // after `stay` years
  netRentCost: number;
  stayYears: number;
  rentVsBuy: 'buy' | 'rent';
  // verdict
  verdict: Verdict;
  reasons: string[];
}

const annuityFactor = (annualRatePct: number, years: number) => {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  return r === 0 ? 1 / n : (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
};

const finite = (n: number) => Number.isFinite(n);

export function validateHouse(i: HouseInputs): boolean {
  return (
    [i.income, i.debts, i.savings, i.price, i.downPct, i.rate, i.years, i.taxPct, i.insurance, i.hoa, i.rent, i.stay].every(finite) &&
    i.income > 0 && i.price > 0 && i.rent > 0 &&
    i.downPct >= 0 && i.downPct < 100 &&
    i.rate >= 0 && i.rate <= 30 &&
    i.years >= 5 && i.years <= 40 &&
    i.debts >= 0 && i.savings >= 0 && i.taxPct >= 0 && i.insurance >= 0 && i.hoa >= 0 &&
    i.stay >= 1
  );
}

export const fmtMoney = (n: number): string =>
  `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;

export function evaluateHouse(i: HouseInputs): HouseDecision {
  const A = HOUSE_ASSUMPTIONS;
  const downPayment = (i.price * i.downPct) / 100;
  const loan = i.price - downPayment;
  const k = annuityFactor(i.rate, i.years);
  const principalAndInterest = loan * k;
  const propertyTax = (i.price * i.taxPct) / 100 / 12;
  const insurance = i.insurance / 12;
  const pmi = i.downPct < 20 ? (loan * A.pmiPct) / 100 / 12 : 0;
  const housing = principalAndInterest + propertyTax + insurance + i.hoa + pmi;
  const monthlyIncome = i.income / 12;
  const frontEnd = (housing / monthlyIncome) * 100;
  const backEnd = ((housing + i.debts) / monthlyIncome) * 100;

  // The most the same lenders' limits would allow, holding the down payment (in dollars) fixed.
  // HOA is a fixed monthly cost like insurance, so it rides along in the insurance figure.
  const solved = solveAffordability({
    annualIncome: i.income,
    monthlyDebts: i.debts,
    downPayment,
    annualRate: i.rate / 100,
    years: i.years,
    propertyTaxRate: i.taxPct / 100,
    insuranceAnnual: i.insurance + i.hoa * 12,
    frontPct: A.frontLimit / 100,
    backPct: A.backLimit / 100,
    pmiRate: A.pmiPct / 100,
  });
  const maxPrice = solved ? solved.maxHomePrice : null;

  const closing = closingCosts(i.price, i.downPct, i.rate / 100).totalBuyer;
  const reserves = housing * A.reserveMonths;
  const cashNeeded = downPayment + closing + reserves;
  const cashLeft = i.savings - cashNeeded;

  const stayYears = Math.min(30, Math.max(1, Math.round(i.stay)));
  const params: RvbParams = {
    monthlyRent: i.rent,
    rentIncrease: A.rentIncreasePct / 100,
    rentersInsurance: A.rentersInsurance,
    homePrice: i.price,
    downPaymentPct: i.downPct / 100,
    mortgageRate: i.rate / 100,
    closingCostsPct: A.rvbClosingPct / 100,
    propertyTaxRate: i.taxPct / 100,
    maintenancePct: A.maintenancePct / 100,
    homeInsurancePct: i.insurance / i.price,
    appreciation: A.appreciationPct / 100,
    sellingCostsPct: A.sellingCostsPct / 100,
    pmiRate: A.pmiPct / 100,
    investReturn: A.investReturnPct / 100,
  };
  const rows = simulateRentVsBuy(params);
  const at = rows[stayYears - 1];
  const be = firstBuyingWinsYear(rows);

  const reasons: string[] = [];
  const over = maxPrice === null || i.price > maxPrice || backEnd > 43;
  if (maxPrice === null) reasons.push('Your debts and insurance leave no room for a housing payment under the 28/36 limits.');
  else if (i.price > maxPrice) reasons.push(`The price is above the ${fmtMoney(maxPrice)} the 28/36 limits allow with this down payment.`);
  if (backEnd > 43) reasons.push(`Debt-to-income is ${backEnd.toFixed(1)}%, above the 43% most lenders treat as the ceiling.`);
  const tight =
    !over &&
    ((maxPrice !== null && i.price > 0.9 * maxPrice) || backEnd > A.backLimit || frontEnd > A.frontLimit || cashLeft < 0);
  if (!over && maxPrice !== null && i.price > 0.9 * maxPrice) reasons.push('The price is within 10% of your maximum, so there is little room for a rate or income change.');
  if (!over && backEnd > A.backLimit) reasons.push(`Debt-to-income is ${backEnd.toFixed(1)}%, above the traditional ${A.backLimit}% guideline.`);
  if (!over && frontEnd > A.frontLimit) reasons.push(`Housing is ${frontEnd.toFixed(1)}% of income, above the traditional ${A.frontLimit}% guideline.`);
  if (cashLeft < 0) reasons.push(`Down payment, closing costs and ${A.reserveMonths} months of reserves total ${fmtMoney(cashNeeded)}; you are ${fmtMoney(-cashLeft)} short.`);

  const verdict: Verdict = over ? 'over' : tight ? 'tight' : 'comfortable';
  if (verdict === 'comfortable') reasons.push('Housing, total debt and cash on hand all sit inside the standard guidelines.');

  return {
    valid: validateHouse(i),
    inputs: i,
    maxPrice,
    downPayment,
    loan,
    principalAndInterest,
    propertyTax,
    insurance,
    hoa: i.hoa,
    pmi,
    housing,
    frontEnd,
    backEnd,
    frontBand: frontEndBand(frontEnd),
    backBand: backEndBand(backEnd),
    closing,
    reserves,
    cashNeeded,
    cashLeft,
    breakEvenYear: be > 0 ? be : null,
    netBuyCost: at.netBuyCost,
    netRentCost: at.netRentCost,
    stayYears,
    rentVsBuy: at.netBuyCost < at.netRentCost ? 'buy' : 'rent',
    verdict,
    reasons,
  };
}

// ---- shareable link: every input in the query string -------------------------------------------

const KEYS: Record<keyof HouseInputs, string> = {
  income: 'income', debts: 'debts', savings: 'savings', price: 'price', downPct: 'down', rate: 'rate',
  years: 'term', taxPct: 'tax', insurance: 'ins', hoa: 'hoa', rent: 'rent', stay: 'stay',
};

/** Only keys this tool owns are read; values are capped at 12 characters and must be plain numbers. */
export function inputsFromQuery(search: string): HouseInputs {
  const params = new URLSearchParams(search);
  const out: HouseInputs = { ...HOUSE_DEFAULTS };
  for (const field of Object.keys(KEYS) as (keyof HouseInputs)[]) {
    const raw = params.get(KEYS[field]);
    if (raw === null || raw.length > 12) continue;
    const n = Number(raw.replace(/,/g, ''));
    if (raw.trim() !== '' && Number.isFinite(n)) out[field] = n;
  }
  return out;
}

export function queryFromInputs(i: HouseInputs): string {
  const params = new URLSearchParams();
  for (const field of Object.keys(KEYS) as (keyof HouseInputs)[]) params.set(KEYS[field], String(i[field]));
  return params.toString();
}
