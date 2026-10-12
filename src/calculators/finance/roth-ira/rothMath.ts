import { IRA_LIMITS } from '../../../utils/taxData';
import { fvWithContributions } from '../../../utils/financial';

export interface RothInputs {
  currentAge: number;
  retirementAge: number;
  currentBalance: number;
  annualContribution: number;
  /** Fraction, 0.07 = 7%. */
  annualReturn: number;
  /** Current marginal rate (fraction) for the Traditional comparison; NaN when not chosen. */
  marginalRate: number;
  /** Expected retirement rate (fraction). */
  retirementRate: number;
}

export function parseRothInputs(values: Record<string, string>): RothInputs {
  const retirementRate = parseFloat(values.expectedRetirementTaxRate) / 100;
  return {
    currentAge: parseInt(values.currentAge, 10),
    retirementAge: parseInt(values.retirementAge, 10),
    currentBalance: parseFloat(values.currentBalance) || 0,
    annualContribution: parseFloat(values.annualContribution) || 0,
    annualReturn: parseFloat(values.annualReturn) / 100,
    marginalRate: parseFloat(values.marginalTaxRate) / 100,
    retirementRate: Number.isFinite(retirementRate) ? retirementRate : 0.12,
  };
}

/**
 * Year-end contributions compounding annually (ordinary annuity). The IRA limit for the CURRENT age is applied to
 * every year (limits are indexed upward and the 50+ catch-up is not phased in), which is conservative.
 */
export function rothProjection(i: RothInputs) {
  const years = i.retirementAge - i.currentAge;
  const maxContrib = i.currentAge >= 50 ? IRA_LIMITS.totalAge50Plus : IRA_LIMITS.base;
  const contribution = Math.min(i.annualContribution, maxContrib);
  const balanceAfter = (n: number) => fvWithContributions(i.currentBalance, contribution, i.annualReturn, n);
  const balance = balanceAfter(years);
  const contributed = i.currentBalance + contribution * years;
  const earnings = balance - contributed;
  // Same after-tax cost in a Traditional IRA: pre-tax contribution C/(1-m), taxed at t on withdrawal.
  const traditionalAfterTax = Number.isFinite(i.marginalRate) ? (balance * (1 - i.retirementRate)) / (1 - i.marginalRate) : NaN;
  return {
    years,
    maxContrib,
    contribution,
    overLimit: i.annualContribution > maxContrib,
    balance,
    balanceAfter,
    contributed,
    earnings,
    taxOnGrowthAvoided: earnings * i.retirementRate,
    traditionalAfterTax,
  };
}
