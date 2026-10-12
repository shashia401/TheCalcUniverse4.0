import Decimal from 'decimal.js';
import { calcFederalTax, calcFICA, STANDARD_DEDUCTIONS_2025, FEDERAL_BRACKETS_2025 } from '../income-tax/taxData';

export const WEEKS_PER_YEAR = 52;

/** Pay periods per year for the fixed-schedule frequencies. */
const PERIODS: Record<string, number> = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12, annually: 1 };

/** Annualise a pay amount. Hourly and daily use the user's weekly hours / days over 52 weeks. */
export function annualFromRate(amount: number, freq: string, hoursPerWeek: number, daysPerWeek: number): number {
  const perYear = freq === 'hourly' ? hoursPerWeek * WEEKS_PER_YEAR : freq === 'daily' ? daysPerWeek * WEEKS_PER_YEAR : (PERIODS[freq] ?? 1);
  return new Decimal(amount).times(perYear).toNumber();
}

/**
 * Take-home estimate for a single filer: 2026 federal brackets with the standard deduction, plus employee FICA
 * (including the 0.9% additional Medicare above $200,000). State and local tax and pre-tax deductions are NOT included.
 */
export function estimateTakeHome(annual: number) {
  const taxableIncome = Math.max(0, annual - STANDARD_DEDUCTIONS_2025.single);
  const { tax: federalTax, marginalRate } = calcFederalTax(taxableIncome, 'single');
  const { ss, medicare, additionalMedicare } = calcFICA(annual, 'single');
  const fica = ss + medicare + additionalMedicare;
  const totalTax = federalTax + fica;
  return {
    taxableIncome,
    federalTax,
    marginalRate,
    fica,
    totalTax,
    net: annual - totalTax,
    effectiveRate: annual > 0 ? (totalTax / annual) * 100 : 0,
    brackets: FEDERAL_BRACKETS_2025.single,
  };
}
