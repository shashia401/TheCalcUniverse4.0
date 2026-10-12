// Pure simple/compound interest math shared by index.ts and InterestCalcPanel.tsx.

export interface InterestInput {
  principal: number;
  annualRate: number; // decimal
  timeUnit: string; // 'years' | 'months' | 'days'
  timePeriod: number;
  interestType: string; // 'simple' | 'compound'
  n: number; // compounding periods per year
}

/** Time in years: months/12, days/365 (actual/365). */
export function toYears(timeUnit: string, timePeriod: number): number {
  return timeUnit === 'months' ? timePeriod / 12 : timeUnit === 'days' ? timePeriod / 365 : timePeriod;
}

/** Results above this are not meaningful dollar amounts (and risk overflowing to Infinity). */
export const MAX_AMOUNT = 1e15;

export function computeInterest(i: InterestInput) {
  const t = toYears(i.timeUnit, i.timePeriod);
  const simpleInterest = i.principal * i.annualRate * t;
  const compound = i.interestType !== 'simple';
  const totalAmount = compound ? i.principal * Math.pow(1 + i.annualRate / i.n, i.n * t) : i.principal + simpleInterest;
  const totalInterest = totalAmount - i.principal;
  const effectiveAnnualRate = compound ? (Math.pow(1 + i.annualRate / i.n, i.n) - 1) * 100 : i.annualRate * 100;
  return {
    t,
    compound,
    simpleInterest,
    totalAmount,
    totalInterest,
    effectiveAnnualRate,
    growthMultiple: totalAmount / i.principal,
    finite: Number.isFinite(totalAmount) && totalAmount <= MAX_AMOUNT,
  };
}
