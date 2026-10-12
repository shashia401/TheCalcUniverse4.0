import { pmt } from '../../../utils/financial';

/** Upfront MIP: 1.75% of the base loan (HUD Handbook 4000.1; ML 2023-05 left it unchanged). */
export const UFMIP_RATE = 0.0175;
/**
 * Base-loan threshold between the low and high annual-MIP rows in HUD Mortgagee Letter 2023-05
 * (effective 3/20/2023). HUD's published tables still quote $726,200; some lenders treat it as
 * "the national conforming limit" and use the newer figure, which only matters for base loans
 * between $726,200 and $832,750.
 */
export const MIP_BASE_LOAN_THRESHOLD = 726200;
/** 2026 FHA one-unit forward mortgage limits (HUD Mortgagee Letter 2025-23): low-cost-area floor and high-cost ceiling. */
export const FHA_LIMIT_FLOOR_2026 = 541287;
export const FHA_LIMIT_CEILING_2026 = 1249125;

/** Annual MIP rate (fraction) per HUD ML 2023-05. `ltv` is base loan / price (UFMIP excluded). */
export function annualMipRate(baseLoan: number, ltv: number, termYears: number): number {
  const overLimit = baseLoan > MIP_BASE_LOAN_THRESHOLD;
  if (termYears > 15) {
    if (overLimit) return ltv > 0.95 ? 0.0075 : 0.007;
    return ltv > 0.95 ? 0.0055 : 0.005;
  }
  if (!overLimit) return ltv > 0.9 ? 0.004 : 0.0015;
  return ltv > 0.9 ? 0.0065 : ltv > 0.78 ? 0.004 : 0.0015;
}

export interface FhaLoan {
  homePrice: number;
  downPct: number; // percent
  downPayment: number;
  baseLoan: number;
  upfrontMIP: number;
  totalLoan: number;
  years: number;
  annualRate: number; // fraction
  numPayments: number;
  monthlyPI: number;
  annualMipRate: number;
  /** Year-1 monthly MIP. */
  monthlyMIP: number;
  totalMonthly: number;
  lifeOfLoan: boolean;
  /** Months MIP is charged: whole term when LTV > 90%, otherwise 11 years (or the term if shorter). */
  mipMonths: number;
}

export function parseFha(values: Record<string, string>): FhaLoan | null {
  const homePrice = parseFloat(values.homePrice);
  const downPct = parseFloat(values.downPaymentPct || '3.5');
  const annualRate = parseFloat(values.interestRate) / 100;
  const years = parseFloat(values.loanTerm || '30');
  if (![homePrice, downPct, annualRate, years].every(Number.isFinite) || homePrice <= 0 || years <= 0) return null;

  const downFrac = downPct / 100;
  const downPayment = homePrice * downFrac;
  const baseLoan = homePrice - downPayment;
  if (baseLoan <= 0) return null;
  const upfrontMIP = baseLoan * UFMIP_RATE;
  const totalLoan = baseLoan + upfrontMIP;
  const numPayments = Math.round(years * 12);
  const monthlyPI = pmt(totalLoan, annualRate / 12, numPayments);

  const ltv = Math.round((1 - downFrac) * 1e6) / 1e6;
  const rate = annualMipRate(baseLoan, ltv, years);
  const monthlyMIP = (baseLoan * rate) / 12;
  const lifeOfLoan = ltv > 0.9;
  return {
    homePrice, downPct, downPayment, baseLoan, upfrontMIP, totalLoan, years, annualRate, numPayments, monthlyPI,
    annualMipRate: rate, monthlyMIP, totalMonthly: monthlyPI + monthlyMIP, lifeOfLoan,
    mipMonths: lifeOfLoan ? numPayments : Math.min(132, numPayments),
  };
}

/**
 * Cumulative annual MIP paid in the first `months` months. HUD recalculates the premium each year on the
 * scheduled base-loan balance, so it falls as the loan amortises (year 1 uses the full base loan).
 */
export function cumulativeMip(m: FhaLoan, months: number): number {
  const r = m.annualRate / 12;
  const baseShare = m.baseLoan / m.totalLoan; // base loan is a constant share of the total-loan schedule
  let bal = m.totalLoan;
  let total = 0;
  for (let k = 0; k < Math.min(months, m.mipMonths); k++) {
    if (k % 12 === 0) total += (bal * baseShare * m.annualMipRate) / 12 * Math.min(12, Math.min(months, m.mipMonths) - k);
    bal = bal * (1 + r) - m.monthlyPI;
  }
  return total;
}
