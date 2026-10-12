import { fvWithContributions } from '../../../utils/financial';

export interface ProjectionRow {
  year: number;
  /** Age at the START of this row. */
  startAge: number;
  /** Age at the END of this row (fractional for a part-year final row). */
  age: number;
  startBalance: number;
  contribution: number;
  growth: number;
  endBalance: number;
}

/**
 * Year-by-year balance projection using the same convention as the retirement and 401(k)
 * calculators: monthly compounding at (annual rate / 12) with each contribution made at the end of
 * its month. Years that are not whole (e.g. ages 35 to 65.5) end in a part-year row.
 */
export function buildProjection(
  currentAge: number,
  retirementAge: number,
  currentBalance: number,
  monthlyContribution: number,
  annualGrowthPct: number,
): ProjectionRow[] {
  const totalMonths = Math.round((retirementAge - currentAge) * 12);
  if (!(totalMonths >= 1)) return [];
  const monthlyRate = annualGrowthPct / 100 / 12;

  const rows: ProjectionRow[] = [];
  let balance = currentBalance;
  for (let startMonth = 0, year = 1; startMonth < totalMonths; startMonth += 12, year++) {
    const n = Math.min(12, totalMonths - startMonth);
    const endBalance = fvWithContributions(balance, monthlyContribution, monthlyRate, n);
    const contribution = monthlyContribution * n;
    rows.push({
      year,
      startAge: currentAge + startMonth / 12,
      age: currentAge + (startMonth + n) / 12,
      startBalance: balance,
      contribution,
      growth: endBalance - balance - contribution,
      endBalance,
    });
    balance = endBalance;
  }
  return rows;
}
