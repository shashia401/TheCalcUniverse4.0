// Pure investment-projection math shared by index.ts and InvestmentPanel.tsx.
import { fvLumpSum, fvAnnuity } from '../../../utils/financial';

export type ContributionFreq = 'weekly' | 'monthly' | 'annually';
export const PERIODS_PER_YEAR: Record<ContributionFreq, number> = { weekly: 52, monthly: 12, annually: 1 };
export const DEFAULT_VARIANCE = 0.02;

/** Blank means the +/-2% default; an explicit 0 is respected. Returns a decimal. */
export function parseVariance(raw: string | undefined): number {
  const v = parseFloat(raw ?? '');
  return isNaN(v) ? DEFAULT_VARIANCE : Math.max(0, v) / 100;
}

/** Contributions per year in dollars. */
export function annualContribution(contribution: number, freq: ContributionFreq): number {
  return contribution * PERIODS_PER_YEAR[freq];
}

/**
 * FV after `years`: the balance compounds monthly at annualRate/12, and each contribution is made at the end of its
 * own period (week, month or year), so weekly deposits really arrive weekly and an annual deposit arrives at year end.
 * The contribution period's growth factor is the matching power of the monthly factor: (1 + r/12)^(12/k) - 1.
 */
export function investmentFV(
  startingAmount: number,
  contribution: number,
  freq: ContributionFreq,
  annualRate: number, // decimal
  years: number,
): number {
  const k = PERIODS_PER_YEAR[freq];
  const monthly = annualRate / 12;
  const lump = fvLumpSum(startingAmount, monthly, 12 * years);
  const periodRate = Math.pow(1 + monthly, 12 / k) - 1;
  return lump + fvAnnuity(contribution, periodRate, k * years);
}
