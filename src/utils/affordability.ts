// Shared home-affordability engine (single source of truth for the
// home-affordability and house-affordability calculators).
//
// Method (front-end / back-end DTI, PITI, optional PMI):
//   housing payment H = min(front% × income, back% × income − other debts)
//   PITI = P&I + property tax + insurance (+ PMI when down payment < 20% of price)
// Property tax scales with the price, so the price is solved in closed form
// instead of assuming a fixed share of the budget goes to tax + insurance:
//   (P − D)·k + P·t + ins = H   →   P = (H − ins + D·k) / (k + t)
// k = monthly payment per $1 borrowed, t = monthly tax rate, D = down payment.
// Sources: CFPB / HUD 28-36 and 31-43 qualifying-ratio guidance.

export const DEFAULT_PROPERTY_TAX_PCT = 1.1; // US average effective rate, % of value
export const DEFAULT_INSURANCE_ANNUAL = 1500;

/** Accepts "28/36" (front/back) or a single back-end limit such as "36". */
export function parseDtiLimit(raw?: string): { front: number; back: number } {
  const [a, b] = (raw || '28/36').split('/').map((x) => parseFloat(x));
  if (!isNaN(a) && !isNaN(b) && a > 0 && b > 0) return { front: Math.min(a, b), back: b };
  const back = !isNaN(a) && a > 0 ? a : 36;
  // Pair a lone back-end limit with its customary front-end limit (28/36, 31/43, 36/+).
  const front = back <= 36 ? 28 : back <= 43 ? 31 : 36;
  return { front: Math.min(front, back), back };
}

export interface AffordabilityInput {
  annualIncome: number;
  monthlyDebts: number;
  downPayment: number;
  annualRate: number; // decimal
  years: number;
  propertyTaxRate: number; // decimal, annual, of home price
  insuranceAnnual: number;
  frontPct: number; // decimal
  backPct: number; // decimal
  pmiRate?: number; // decimal, annual, of loan; 0/undefined = PMI not modelled
}

export interface AffordabilityResult {
  maxHomePrice: number;
  loan: number;
  pi: number;
  tax: number;
  insurance: number;
  pmi: number;
  totalMonthly: number;
  housingBudget: number;
  frontEndRatio: number; // percent
  backEndRatio: number; // percent
  downPaymentPct: number; // percent, capped at 100
}

/** Returns null when the debts/insurance leave no room for any housing payment. */
export function solveAffordability(i: AffordabilityInput): AffordabilityResult | null {
  const income = i.annualIncome / 12;
  const n = i.years * 12;
  if (!(income > 0) || !(n > 0)) return null;
  const r = i.annualRate / 12;
  const k = r === 0 ? 1 / n : (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const t = i.propertyTaxRate / 12;
  const ins = i.insuranceAnnual / 12;
  const m = (i.pmiRate ?? 0) / 12;
  const D = Math.max(0, i.downPayment);

  const housing = Math.max(0, Math.min(income * i.frontPct, income * i.backPct - i.monthlyDebts));
  const budget = housing - ins;
  if (!(budget > 0) || !isFinite(k)) return null;

  const priceFor = (kk: number) => (budget + D * kk) / (kk + t);
  let price: number;
  if (budget < D * t) {
    price = budget / t; // cash purchase: only tax + insurance are payable
  } else {
    price = priceFor(k);
    if (m > 0 && D < 0.2 * price) {
      const withPmi = priceFor(k + m);
      // PMI drops away exactly at 20% down, so the price never lands between 5·D and the PMI price.
      price = D < 0.2 * withPmi ? withPmi : 5 * D;
    }
  }
  if (!isFinite(price)) return null;

  const loan = Math.max(0, price - D);
  const pi = loan * k;
  const tax = price * t;
  const pmi = D < 0.2 * price ? loan * m : 0;
  const totalMonthly = pi + tax + ins + pmi;
  return {
    maxHomePrice: price,
    loan,
    pi,
    tax,
    insurance: ins,
    pmi,
    totalMonthly,
    housingBudget: housing,
    frontEndRatio: (totalMonthly / income) * 100,
    backEndRatio: ((totalMonthly + i.monthlyDebts) / income) * 100,
    downPaymentPct: price > 0 ? Math.min(100, (D / price) * 100) : 0,
  };
}
