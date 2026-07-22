import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function ProfitMarginPanel({ results }: Props) {
  const primary = results.find(r => r.id === 'primary');
  const profit = results.find(r => r.id === 'profit');
  const margin = results.find(r => r.id === 'margin');
  const markup = results.find(r => r.id === 'markup');
  const price = results.find(r => r.id === 'price');

  if (!primary) return null;

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
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">{primary.label}</p>
          <p className="text-3xl font-bold text-emerald-700">{primary.value}</p>
        </div>
        {profit && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Gross Profit</span>
            <span className={`text-sm font-bold ${profit.color === 'positive' ? 'text-emerald-600' : 'text-red-600'}`}>{profit.value}</span>
          </div>
        )}
        {margin && markup && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
              <p className="text-[10px] font-bold text-blue-600 uppercase">Margin</p>
              <p className="text-lg font-bold text-blue-700">{margin.value}</p>
            </div>
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-center">
              <p className="text-[10px] font-bold text-purple-600 uppercase">Markup</p>
              <p className="text-lg font-bold text-purple-700">{markup.value}</p>
            </div>
          </div>
        )}
        {price && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-emerald-800 font-semibold">Selling Price</span>
              <span className="text-lg font-bold text-emerald-700">{price.value}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
