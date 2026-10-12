// Pure Roth-vs-Traditional math shared by index.ts and IraPanel.tsx.
//
// Model: the same annual contribution C goes into either account (monthly, end of month, growth r/12).
//  - Roth: everything comes out tax-free.
//  - Traditional: new contributions are taxed at the retirement rate on withdrawal, but the deduction
//    (marginal rate x C each year) is invested alongside, tax-free (a simplification: a real taxable side
//    account would owe tax on its growth).
//  - The existing balance is treated identically in both scenarios (it may be any Traditional/Roth mix), so
//    the comparison is purely about the new contributions. Consequently the breakeven retirement rate is
//    exactly the current marginal rate.
import { fvWithContributions } from '../../../utils/financial';

export interface IraInput {
  years: number;
  currentBalance: number;
  contribution: number; // annual, already capped at the IRS limit
  annualReturn: number; // decimal
  marginalRate: number; // decimal
  retireRate: number; // decimal
}

export function iraProjection(i: IraInput, yearsOverride?: number) {
  const years = yearsOverride ?? i.years;
  const months = years * 12;
  const mr = i.annualReturn / 12;
  const rothBalance = fvWithContributions(i.currentBalance, i.contribution / 12, mr, months);
  const balanceOnly = fvWithContributions(i.currentBalance, 0, mr, months);
  const newContribFV = rothBalance - balanceOnly;
  const tradBalance = rothBalance; // gross, before withdrawal tax
  const tradAfterTax = balanceOnly + newContribFV * (1 - i.retireRate);
  const taxSavingsInvested = fvWithContributions(0, (i.contribution * i.marginalRate) / 12, mr, months);
  const tradTotal = tradAfterTax + taxSavingsInvested;
  return {
    years,
    rothBalance,
    tradBalance,
    tradAfterTax,
    taxSavingsInvested,
    tradTotal,
    rothAdvantage: rothBalance - tradTotal,
    breakevenRate: i.marginalRate,
    totalContribs: i.currentBalance + i.contribution * years,
    rothEarnings: rothBalance - (i.currentBalance + i.contribution * years),
  };
}

/** Rate from a select value; blank is NaN-safe and an explicit "0" is kept. */
export function rateOr(raw: string | undefined, fallback: number): number {
  const v = parseFloat(raw ?? '');
  return isNaN(v) ? fallback : v / 100;
}
