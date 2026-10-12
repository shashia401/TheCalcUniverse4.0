import { FICA } from '../../../utils/taxData';

/** PIA bend points for workers first eligible (turning 62) in 2026 - SSA.gov "Primary Insurance Amount". */
export const BEND_POINTS = { year: 2026, first: 1286, second: 7749 } as const;

/** SSA maximum monthly benefit for a worker retiring at full retirement age in 2026 (2026 COLA fact sheet). */
export const MAX_BENEFIT_AT_FRA = 4152;

/** Full retirement age in years (fractional for the 1938-1942 and 1955-1959 cohorts). */
export function getFRA(birthYear: number): number {
  if (birthYear <= 1937) return 65;
  if (birthYear <= 1942) return 65 + ((birthYear - 1937) * 2) / 12;
  if (birthYear <= 1954) return 66;
  if (birthYear <= 1959) return 66 + ((birthYear - 1954) * 2) / 12;
  return 67;
}

/** "66 and 2 months" style label. */
export function fraLabel(fra: number): string {
  const years = Math.floor(fra + 1e-9);
  const months = Math.round((fra - years) * 12);
  return months === 0 ? `${years}` : `${years} and ${months} month${months === 1 ? '' : 's'}`;
}

/** Delayed retirement credit per YEAR by birth year (SSA "Delayed Retirement Credits"): 8% for 1943 and later. */
export function delayedCreditPerYear(birthYear: number): number {
  if (birthYear >= 1943) return 0.08;
  if (birthYear >= 1941) return 0.075;
  if (birthYear >= 1939) return 0.07;
  if (birthYear >= 1937) return 0.065;
  if (birthYear >= 1935) return 0.06;
  if (birthYear >= 1933) return 0.055;
  if (birthYear >= 1931) return 0.05;
  return 0.045;
}

/**
 * Estimated PIA in today's dollars. Simplification: the current earned income (capped at the 2026 Social Security
 * taxable maximum) stands in for every one of the 35 highest-earning years, so AIME = capped income / 12.
 * PIA = 90% / 32% / 15% of AIME around the bend points, truncated down to the next lower 10 cents (SSA rule).
 */
export function estimatePIA(annualIncome: number): number {
  const aime = Math.max(0, Math.min(annualIncome, FICA.socialSecurityWageBase)) / 12;
  const { first, second } = BEND_POINTS;
  const pia = 0.9 * Math.min(aime, first) + 0.32 * Math.max(0, Math.min(aime, second) - first) + 0.15 * Math.max(0, aime - second);
  return Math.min(MAX_BENEFIT_AT_FRA, Math.floor(pia * 10 + 1e-9) / 10);
}

/**
 * Monthly benefit when claiming at `claimAge` (62-70): early claiming loses 5/9 of 1% per month for the first 36
 * months and 5/12 of 1% beyond; delayed credits add (yearly credit / 12) per month past FRA, up to age 70.
 * Rounded down to the next lower dollar.
 */
export function monthlyBenefit(pia: number, claimAge: number, fra: number, birthYear: number): number {
  const monthsFromFra = Math.round((claimAge - fra) * 12);
  let factor: number;
  if (monthsFromFra >= 0) {
    const credited = Math.min(monthsFromFra, Math.round((70 - fra) * 12));
    factor = 1 + (credited * delayedCreditPerYear(birthYear)) / 12;
  } else {
    const early = -monthsFromFra;
    factor = 1 - (Math.min(early, 36) * 5) / 9 / 100 - (Math.max(0, early - 36) * 5) / 12 / 100;
  }
  return Math.floor(pia * factor + 1e-9);
}
