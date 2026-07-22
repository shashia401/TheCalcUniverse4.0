import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function CACPanel({ results }: Props) {
  const cac = results.find(r => r.id === 'cac');
  const ltvCac = results.find(r => r.id === 'ltvCac');
  const payback = results.find(r => r.id === 'payback');
  const totalSpend = results.find(r => r.id === 'totalSpend');

  if (!cac) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Customer Acquisition Cost</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">CAC</p>
          <p className="text-3xl font-bold text-blue-700">{cac.value}</p>
        </div>
        {ltvCac && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">LTV:CAC Ratio</span>
            <span className={`text-sm font-bold ${ltvCac.color === 'positive' ? 'text-emerald-600' : ltvCac.color === 'negative' ? 'text-red-600' : 'text-amber-600'}`}>
              {ltvCac.value}
            </span>
          </div>
        )}
        {payback && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Payback Period</span>
            <span className={`text-sm font-bold ${payback.color === 'positive' ? 'text-emerald-600' : payback.color === 'negative' ? 'text-red-600' : 'text-amber-600'}`}>
              {payback.value}
            </span>
          </div>
        )}
        {totalSpend && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Marketing Spend</span>
            <span className="text-sm font-bold text-slate-700">{totalSpend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
