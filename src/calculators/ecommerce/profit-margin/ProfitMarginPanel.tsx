import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// Displays the already-computed result rows; the maths lives in index.ts (via margin-calculator/marginMath).
export default function ProfitMarginPanel({ results }: Props) {
  const primary = results.find((r) => r.id === 'primary');
  const profit = results.find((r) => r.id === 'profit');
  const margin = results.find((r) => r.id === 'margin');
  const markup = results.find((r) => r.id === 'markup');
  const price = results.find((r) => r.id === 'price');

  if (!primary && !price) return null;
  const head = primary ?? price!;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Profit Margin</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{head.label}</p>
          <p className="text-3xl font-bold text-emerald-800">{head.value}</p>
        </div>
        {profit && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">{primary ? 'Gross Profit' : 'Profit per Unit'}</span>
            <span className={`text-sm font-bold ${profit.color === 'negative' ? 'text-red-700' : 'text-emerald-700'}`}>{profit.value}</span>
          </div>
        )}
        {margin && (
          <div className={`grid gap-3 ${markup ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
              <p className="text-[10px] font-bold text-blue-700 uppercase">Margin</p>
              <p className="text-lg font-bold text-blue-800">{margin.value}</p>
            </div>
            {markup && (
              <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-center">
                <p className="text-[10px] font-bold text-purple-700 uppercase">Markup</p>
                <p className="text-lg font-bold text-purple-800">{markup.value}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
