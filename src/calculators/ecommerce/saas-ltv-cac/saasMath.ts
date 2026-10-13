/** SaaS LTV / CAC math shared by index.ts and SaaSltvCACPanel.tsx (the panel must never re-parse formatted result strings). */

/** Lifetime is capped at 10 years so a ~0% churn rate does not produce an unbounded LTV. */
export const MAX_LIFETIME_MONTHS = 120;

export interface SaasFigures {
  lifetimeMonths: number;
  /** True when the 10-year cap applied (churn at or below 1/120 per month). */
  lifetimeCapped: boolean;
  /** Lifetime gross profit per customer: ARPU x lifetime x gross margin. */
  ltv: number;
  cac: number;
  /** Infinity when CAC is 0. */
  ltvCacRatio: number;
  /** Months of gross profit needed to repay CAC; Infinity at 0% margin. */
  paybackMonths: number;
  /** New monthly recurring revenue bought per $1 of spend; Infinity when spend is 0. */
  mrrPerSpend: number;
  /** ARPU x new customers x lifetime (revenue, before margin). */
  cohortRevenue: number;
}

export function computeSaas(
  arpu: number,
  monthlyChurnPct: number,
  marketingSpend: number,
  newCustomers: number,
  grossMarginPct: number,
): SaasFigures {
  const churn = monthlyChurnPct / 100;
  const raw = churn > 0 ? 1 / churn : Infinity;
  const lifetimeMonths = Math.min(MAX_LIFETIME_MONTHS, raw);
  const margin = grossMarginPct / 100;
  const ltv = arpu * lifetimeMonths * margin;
  const cac = marketingSpend / newCustomers;
  return {
    lifetimeMonths,
    lifetimeCapped: raw > MAX_LIFETIME_MONTHS,
    ltv,
    cac,
    ltvCacRatio: cac > 0 ? ltv / cac : Infinity,
    paybackMonths: margin > 0 ? cac / (arpu * margin) : Infinity,
    mrrPerSpend: marketingSpend > 0 ? (arpu * newCustomers) / marketingSpend : Infinity,
    cohortRevenue: arpu * newCustomers * lifetimeMonths,
  };
}
