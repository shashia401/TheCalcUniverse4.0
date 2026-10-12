import { TrendingUp } from 'lucide-react';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { fmtCurrency } from '../../../utils/financial';
import { computeRefi, balanceSeries } from './refinanceMath';

export default function RefinancePanel({ values }: { values: Record<string, string> }) {
  const c = computeRefi(values);

  if (!c) return null;

  // 360 iterations at most, so no memoisation needed.
  const oldSeries = balanceSeries(c.currentBalance, c.currentRate, c.oldPayment, c.currentTerm);
  const newSeries = balanceSeries(c.currentBalance, c.newRate, c.newPayment, c.newTerm);

  const axis = (v: number) => (v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingUp size={16} className="text-slate-500" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Refinance Analysis — Balance Comparison</span>
      </div>
      <div className="p-6 space-y-4">
        <SvgLineChart
          ariaLabel="Remaining loan balance by year: current loan versus refinanced loan"
          series={[
            { name: 'Current loan balance', points: oldSeries, color: '#dc2626' },
            { name: 'Refinanced balance', points: newSeries, color: '#059669' },
          ]}
          xFormat={(n) => `Yr ${n}`}
          yFormat={axis}
        />
        <div className="flex flex-wrap gap-4 justify-center text-[10px] text-slate-600">
          <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-red-600" />Current Loan Balance</span>
          <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-emerald-600" />Refinanced Balance</span>
        </div>
        {c.monthlySavings > 0 && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
            <p className="text-[11px] text-blue-800 leading-relaxed">
              After <strong>{c.breakEvenMonths} months</strong> (break-even point), you save <strong>{fmtCurrency(c.monthlySavings)}/mo</strong>.
              {c.plannedStay >= c.breakEvenMonths
                ? ` Over your planned ${c.plannedStay}mo stay, you'd save about ${fmtCurrency(c.netOverStay)} after closing costs.`
                : ` But you plan to stay only ${c.plannedStay}mo — you won't recoup the closing costs.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
