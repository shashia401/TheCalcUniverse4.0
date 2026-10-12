import { FICA } from '../../../utils/taxData';
import { FICA_2025 } from '../income-tax/taxData';

export const SS_RATE = 0.124; // 12.4% (employee + employer halves)
export const MEDICARE_RATE = 0.029; // 2.9%
export const SE_MULTIPLIER = 0.9235; // 92.35% of net profit is subject to SE tax
/** SE tax is only due once net earnings from self-employment reach $400 (IRS Schedule SE). */
export const SE_MIN_EARNINGS = 400;
/** Assumed bracket for the illustrative QBI saving (not user-selectable). */
export const QBI_ASSUMED_RATE = 0.22;

export type SeFilingStatus = 'single' | 'mfj' | 'hoh' | 'mfs';

export interface SeTaxInput {
  netProfit: number;
  w2Income: number;
  qbi: boolean;
  status: SeFilingStatus;
}

export function parseSeInput(values: Record<string, string>): SeTaxInput {
  const status = (['single', 'mfj', 'hoh', 'mfs'] as const).find((s) => s === values.filingStatus) ?? 'single';
  return {
    netProfit: parseFloat(values.netProfit),
    w2Income: parseFloat(values.w2Income) || 0,
    qbi: values.qbiDeduction === 'yes',
    status,
  };
}

/** All figures behind the result rows and the panel (single source of truth). */
export function computeSeTax(i: SeTaxInput) {
  const seEarnings = i.netProfit * SE_MULTIPLIER;
  const owes = seEarnings >= SE_MIN_EARNINGS;

  // W-2 wages already used part of the Social Security wage base.
  const remainingSSBase = Math.max(0, FICA.socialSecurityWageBase - i.w2Income);
  const socialSecurityPortion = owes ? Math.min(seEarnings, remainingSSBase) * SS_RATE : 0;
  const medicarePortion = owes ? seEarnings * MEDICARE_RATE : 0;
  const secaTax = socialSecurityPortion + medicarePortion;

  // Additional Medicare Tax (Form 8959): 0.9% on SE earnings above the filing-status threshold, which W-2 Medicare
  // wages use up first. Not part of SECA and not deductible.
  const threshold = FICA_2025.additionalMedicareThreshold[i.status];
  const additionalMedicare = owes
    ? Math.max(0, seEarnings - Math.max(0, threshold - i.w2Income)) * FICA.additionalMedicareRate
    : 0;

  const deductiblePortion = secaTax / 2;
  // QBI = net profit less the deductible half of SE tax; deduction is 20% of that (before the taxable-income limit).
  const qbiDeduction = i.qbi ? Math.max(0, i.netProfit - deductiblePortion) * 0.2 : 0;
  const qbiSavings = qbiDeduction * QBI_ASSUMED_RATE;

  return {
    seEarnings,
    owes,
    remainingSSBase,
    socialSecurityPortion,
    medicarePortion,
    secaTax,
    additionalMedicare,
    threshold,
    deductiblePortion,
    qbiDeduction,
    qbiSavings,
    effectiveRate: i.netProfit > 0 ? (secaTax / i.netProfit) * 100 : 0,
    totalIncome: i.netProfit + i.w2Income,
  };
}
