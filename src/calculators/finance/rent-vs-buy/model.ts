import { loanBalanceAtYear, monthlyPayment } from './utils';

/**
 * One rent-vs-buy model used by BOTH the finance and the real-estate calculators, so identical
 * inputs always give identical answers.
 *
 * Renting path : all rent + renter's insurance, minus the growth the down payment + closing costs
 *                would have earned if invested (opportunity cost).
 * Buying path  : down payment + closing costs + P&I + property tax + homeowner's insurance +
 *                maintenance + PMI, minus the net sale proceeds (sale price less selling costs less
 *                loan balance) at the end of the year considered.
 * Simplifications (documented in the calculators' text): fixed 30-year mortgage; property tax is a
 * constant % of the purchase price; no mortgage-interest deduction; the monthly cash-flow
 * difference between owning and renting is not reinvested.
 */
export interface RvbParams {
  monthlyRent: number;
  /** fractions (0.03 = 3%) */
  rentIncrease: number;
  rentersInsurance: number;
  homePrice: number;
  downPaymentPct: number;
  mortgageRate: number;
  closingCostsPct: number;
  propertyTaxRate: number;
  maintenancePct: number;
  homeInsurancePct: number;
  appreciation: number;
  sellingCostsPct: number;
  pmiRate: number;
  /** annual return the renter earns on the cash not spent on the down payment + closing costs */
  investReturn: number;
}

export interface RvbRow {
  year: number;
  homeValue: number;
  loanBalance: number;
  /** home value - loan balance (before selling costs) */
  equity: number;
  /** cumulative rent + renter's insurance actually paid */
  rentPaid: number;
  /** rentPaid minus investment gain on the down payment + closing costs */
  netRentCost: number;
  netBuyCost: number;
  // cumulative buying components
  mortgagePaid: number;
  taxPaid: number;
  insurancePaid: number;
  maintenancePaid: number;
  pmiPaid: number;
  rentOnly: number;
  rentersInsurancePaid: number;
  investmentGain: number;
  saleProceeds: number;
}

export const RVB_TERM_MONTHS = 360;
export const RVB_YEARS = 30;

/** Parse a field: blank/invalid -> default, but an explicit 0 stays 0. */
export function numOr(v: string | undefined, def: number): number {
  const n = parseFloat(v ?? '');
  return Number.isFinite(n) ? n : def;
}

export function simulateRentVsBuy(p: RvbParams): RvbRow[] {
  const downPayment = p.homePrice * p.downPaymentPct;
  const closingCosts = p.homePrice * p.closingCostsPct;
  const upfront = downPayment + closingCosts;
  const loanAmount = p.homePrice - downPayment;
  const mp = monthlyPayment(loanAmount, p.mortgageRate, RVB_TERM_MONTHS);
  const r = p.mortgageRate / 12;
  const taxPerYear = p.homePrice * p.propertyTaxRate;

  const rows: RvbRow[] = [];
  let rentOnly = 0;
  let rentersIns = 0;
  let mortgagePaid = 0;
  let taxPaid = 0;
  let insurancePaid = 0;
  let maintenancePaid = 0;
  let pmiPaid = 0;

  for (let y = 1; y <= RVB_YEARS; y++) {
    // Renting
    rentOnly += p.monthlyRent * 12 * Math.pow(1 + p.rentIncrease, y - 1);
    rentersIns += p.rentersInsurance;
    const rentPaid = rentOnly + rentersIns;
    const investmentGain = upfront * Math.pow(1 + p.investReturn, y) - upfront;

    // Buying: this year's costs
    const valueStart = p.homePrice * Math.pow(1 + p.appreciation, y - 1);
    const homeValue = p.homePrice * Math.pow(1 + p.appreciation, y);
    const monthsBefore = (y - 1) * 12;
    mortgagePaid += mp * Math.max(0, Math.min(12, RVB_TERM_MONTHS - monthsBefore));
    taxPaid += taxPerYear;
    insurancePaid += valueStart * p.homeInsurancePct;
    maintenancePaid += valueStart * p.maintenancePct;

    // PMI is charged for each month the loan balance is above 80% of the purchase price.
    if (p.downPaymentPct < 0.2 && loanAmount > 0) {
      let bal = loanBalanceAtYear(loanAmount, p.mortgageRate, RVB_TERM_MONTHS, y - 1);
      let pmiMonths = 0;
      for (let m = 0; m < 12 && bal > 0; m++) {
        if (bal / p.homePrice > 0.8) pmiMonths++;
        bal = Math.max(0, bal - (mp - bal * r));
      }
      pmiPaid += (loanAmount * p.pmiRate * pmiMonths) / 12;
    }

    const loanBalance = loanBalanceAtYear(loanAmount, p.mortgageRate, RVB_TERM_MONTHS, y);
    const saleProceeds = homeValue * (1 - p.sellingCostsPct) - loanBalance;
    const buyOutlay = upfront + mortgagePaid + taxPaid + insurancePaid + maintenancePaid + pmiPaid;

    rows.push({
      year: y,
      homeValue,
      loanBalance,
      equity: homeValue - loanBalance,
      rentPaid,
      netRentCost: rentPaid - investmentGain,
      netBuyCost: buyOutlay - saleProceeds,
      mortgagePaid,
      taxPaid,
      insurancePaid,
      maintenancePaid,
      pmiPaid,
      rentOnly,
      rentersInsurancePaid: rentersIns,
      investmentGain,
      saleProceeds,
    });
  }
  return rows;
}

/**
 * First year in which buying is cheaper than renting: 1..30, or -1 when it never is within 30 years.
 * (A year-1 result means buying is already cheaper after one year.)
 */
export function firstBuyingWinsYear(rows: RvbRow[]): number {
  const hit = rows.find((r) => r.netBuyCost < r.netRentCost);
  return hit ? hit.year : -1;
}
