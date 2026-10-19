import type { ExplainStep } from '../../../types/calculator';
import { roundStr6 } from '../../../lib/format';
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

const money2 = (n: number): string =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * The worked solution shown under the calculator, built from the same MarginSolution the results use
 * (shared by margin-calculator and profit-margin). `fmtPct` formats percentages the way that page does.
 * Returns [] for anything non-finite.
 */
export function marginExplain(sol: MarginSolution, fmtPct: (n: number) => string): ExplainStep[] {
  const out = marginSteps(sol, fmtPct);
  // a runaway input can overflow the formatted percentage; show nothing rather than "Infinity"
  return out.some((s) => /NaN|Infinity/.test(s.expr)) ? [] : out;
}

function marginSteps(sol: MarginSolution, fmtPct: (n: number) => string): ExplainStep[] {
  const { cost, revenue, profit, margin, markup, solveFor } = sol;
  if (![cost, revenue, profit, margin].every(Number.isFinite) || (markup !== null && !Number.isFinite(markup))) return [];
  const $ = money2;
  const markupText = markup === null ? 'no markup (cost is zero)' : `${fmtPct(markup)} markup`;

  const profitStep: ExplainStep = {
    label: 'Subtract cost from the selling price',
    expr: `${$(revenue)} − ${$(cost)} = ${$(profit)} profit`,
  };
  const markupStep = (comparison: boolean): ExplainStep =>
    markup === null
      ? { label: 'Markup needs a non-zero cost', expr: `${$(profit)} ÷ $0.00 is undefined, so no markup is shown` }
      : {
          label: comparison ? 'For comparison, the markup on the same profit' : 'Markup: profit as a share of cost',
          expr: `${$(profit)} ÷ ${$(cost)} × 100 = ${fmtPct(markup)}`,
          note: comparison ? 'Margin divides profit by the selling price and markup divides it by cost, so the same profit gives two different percentages.' : undefined,
        };
  const marginStep: ExplainStep = {
    label: 'Margin: profit as a share of the selling price',
    expr: `${$(profit)} ÷ ${$(revenue)} × 100 = ${fmtPct(margin)}`,
  };

  if (solveFor === 'margin') return [profitStep, markupStep(true), marginStep];
  if (solveFor === 'markup') return [profitStep, marginStep, markupStep(false)];

  // revenue / cost: solved from a margin or a markup target
  const target = parseFloat(sol.solvedVia ?? '');
  const viaMargin = (sol.solvedVia ?? '').endsWith('Margin');
  if (!Number.isFinite(target)) return [];
  const mult = viaMargin ? 1 - target / 100 : 1 + target / 100;
  const multText = roundStr6(mult);
  const multStep: ExplainStep = viaMargin
    ? {
        label: 'Turn the margin into a multiplier',
        expr: `1 − ${target}/100 = ${multText}`,
        note: 'A margin is a share of the selling price, so cost makes up (1 − margin) of that price.',
      }
    : {
        label: 'Turn the markup into a multiplier',
        expr: `1 + ${target}/100 = ${multText}`,
        note: 'A markup is added on top of cost, so the selling price is cost × (1 + markup).',
      };
  const solveStep: ExplainStep =
    solveFor === 'revenue'
      ? {
          label: 'Work out the selling price',
          expr: viaMargin ? `${$(cost)} ÷ ${multText} = ${$(revenue)}` : `${$(cost)} × ${multText} = ${$(revenue)}`,
        }
      : {
          label: 'Work out the cost',
          expr: viaMargin ? `${$(revenue)} × ${multText} = ${$(cost)}` : `${$(revenue)} ÷ ${multText} = ${$(cost)}`,
        };
  return [
    multStep,
    solveStep,
    {
      label: 'Check the profit, margin and markup',
      expr: `${$(revenue)} − ${$(cost)} = ${$(profit)} profit, a ${fmtPct(margin)} margin and ${markupText}`,
    },
  ];
}
