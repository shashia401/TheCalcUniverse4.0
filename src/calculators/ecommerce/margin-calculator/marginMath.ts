/**
 * Margin / markup math shared by index.ts and MarginCalculatorPanel.tsx
 * (the panel must never re-parse formatted result strings).
 *
 * margin % = (revenue - cost) / revenue x 100      (profit as a share of the selling price)
 * markup % = (revenue - cost) / cost x 100          (profit as a share of cost)
 */
export type SolveFor = 'margin' | 'markup' | 'revenue' | 'cost';

export interface MarginSolution {
  solveFor: SolveFor;
  cost: number;
  revenue: number;
  profit: number;
  /** Margin in percent. */
  margin: number;
  /** Markup in percent; null when cost is 0 (markup is undefined). */
  markup: number | null;
  /** For revenue/cost modes: how the target was supplied ("44.4% Margin"). */
  solvedVia?: string;
}

const pct = (cost: number, revenue: number) => ({
  margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
  markup: cost > 0 ? ((revenue - cost) / cost) * 100 : null,
});

/** Solve the selected unknown. Returns null for incomplete / impossible inputs. */
export function solveMargin(values: Record<string, string>): MarginSolution | null {
  const solveFor = (values.solveFor || 'margin') as SolveFor;
  const costIn = parseFloat(values.costInput);
  const revIn = parseFloat(values.revenueInput);
  const marginIn = parseFloat(values.marginInput);
  const markupIn = parseFloat(values.markupInput);
  const ok = Number.isFinite;

  if (solveFor === 'margin' || solveFor === 'markup') {
    if (!ok(costIn) || !ok(revIn) || costIn < 0 || revIn <= 0) return null;
    return { solveFor, cost: costIn, revenue: revIn, profit: revIn - costIn, ...pct(costIn, revIn) };
  }

  // Margin is preferred when both targets are filled in; it must be below 100%.
  const useMargin = ok(marginIn) && marginIn >= 0 && marginIn < 100;
  const useMarkup = ok(markupIn) && markupIn >= 0;
  if (!useMargin && !useMarkup) return null;

  if (solveFor === 'revenue') {
    if (!ok(costIn) || costIn <= 0) return null;
    const revenue = useMargin ? costIn / (1 - marginIn / 100) : costIn * (1 + markupIn / 100);
    return {
      solveFor,
      cost: costIn,
      revenue,
      profit: revenue - costIn,
      ...pct(costIn, revenue),
      solvedVia: useMargin ? `${marginIn}% Margin` : `${markupIn}% Markup`,
    };
  }

  if (solveFor === 'cost') {
    if (!ok(revIn) || revIn <= 0) return null;
    const cost = useMargin ? revIn * (1 - marginIn / 100) : revIn / (1 + markupIn / 100);
    return {
      solveFor,
      cost,
      revenue: revIn,
      profit: revIn - cost,
      ...pct(cost, revIn),
      solvedVia: useMargin ? `${marginIn}% Margin` : `${markupIn}% Markup`,
    };
  }
  return null;
}

/** Markup that gives the same profit as a given margin, and vice versa (both in percent). */
export const marginFromMarkup = (markupPct: number) => (markupPct / (100 + markupPct)) * 100;
export const markupFromMargin = (marginPct: number) => (marginPct / (100 - marginPct)) * 100;
