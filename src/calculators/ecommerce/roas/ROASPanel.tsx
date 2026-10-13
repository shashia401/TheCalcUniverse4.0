import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { computeRoas } from './roasMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const money = (n: number) =>
  `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ROASPanel({ values, results }: Props) {
  const adSpend = parseFloat(values.adSpend);
  const revenue = parseFloat(values.revenue);
  if (!results.length || !(adSpend > 0) || !Number.isFinite(revenue)) return null;
  const f = computeRoas(adSpend, revenue, parseFloat(values.grossMargin), parseFloat(values.orders));

  const barMax = Math.max(f.roas, f.breakEvenRoas ?? 0, 1) * 1.2;
  const tone =
    f.status === null ? 'text-slate-700' : f.status === 'above' ? 'text-emerald-700' : f.status === 'at' ? 'text-amber-700' : 'text-red-700';
  const barColor =
    f.status === null ? 'bg-blue-700' : f.status === 'above' ? 'bg-emerald-700' : f.status === 'at' ? 'bg-amber-700' : 'bg-red-700';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">ROAS</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Return on Ad Spend</p>
          <p className={`text-3xl font-bold ${tone}`}>{f.roas.toFixed(2)}x</p>
        </div>
        {f.breakEvenRoas !== null && (
          <HBarRow label="Break-Even" value={f.breakEvenRoas} max={barMax} display={`${f.breakEvenRoas.toFixed(2)}x`} color="bg-slate-700" labelWidth="w-28" />
        )}
        <HBarRow label="Actual ROAS" value={f.roas} max={barMax} display={`${f.roas.toFixed(2)}x`} color={barColor} labelWidth="w-28" />
        {f.cpa !== null && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Cost per Acquisition</span>
            <span className="text-sm font-bold text-slate-700">{money(f.cpa)}</span>
          </div>
        )}
        <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
          <span className="text-xs text-slate-600">Revenue Minus Ad Spend</span>
          <span className={`text-sm font-bold ${f.revenueMinusSpend > 0 ? 'text-emerald-700' : 'text-red-700'}`}>{money(f.revenueMinusSpend)}</span>
        </div>
        {f.profitAfterAds !== null && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Gross Profit After Ad Spend</span>
            <span className={`text-sm font-bold ${f.profitAfterAds > 0 ? 'text-emerald-700' : f.profitAfterAds < 0 ? 'text-red-700' : 'text-slate-700'}`}>{money(f.profitAfterAds)}</span>
          </div>
        )}
        {f.breakEvenRoas !== null && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-600">Break-even ROAS = 1 ÷ gross margin</p>
            <p className={`text-sm font-bold ${tone}`}>
              {f.breakEvenRoas.toFixed(2)}x — {f.status === 'above' ? 'Profitable' : f.status === 'at' ? 'Break-even' : 'Unprofitable'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
