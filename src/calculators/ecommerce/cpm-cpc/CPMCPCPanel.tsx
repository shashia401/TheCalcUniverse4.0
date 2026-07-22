import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function CPMCPCPanel({ results }: Props) {
  const cpm = results.find(r => r.id === 'cpm');
  const cpc = results.find(r => r.id === 'cpc');
  const ctr = results.find(r => r.id === 'ctr');
  const spend = results.find(r => r.id === 'totalSpend');

  if (!results.length) return null;

  const cpmVal = cpm ? parseNum(cpm.value) : 0;
  const cpcVal = cpc ? parseNum(cpc.value) : 0;
  const maxVal = Math.max(cpmVal, cpcVal * 100 || 1);

  const bar = (label: string, val: number, max: number, color: string, unit: string) => {
    const pct = max > 0 ? (val / max) * 100 : 0;
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="text-xs font-semibold text-slate-600 w-24 flex-shrink-0">{label}</span>
        <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${color} transition-all flex items-center justify-end pr-1.5 ${pct < 10 ? 'min-w-[45px]' : ''}`} style={{ width: `${Math.max(pct, 5)}%` }}>
            <span className="text-[9px] font-bold text-white">${val.toFixed(2)} {unit}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Ad Metrics</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="grid grid-cols-2 gap-3">
          {cpm && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
              <p className="text-[10px] font-bold text-blue-600 uppercase">CPM</p>
              <p className="text-xl font-bold text-blue-700">{cpm.value}</p>
            </div>
          )}
          {cpc && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-center">
              <p className="text-[10px] font-bold text-purple-600 uppercase">CPC</p>
              <p className="text-xl font-bold text-purple-700">{cpc.value}</p>
            </div>
          )}
        </div>
        {ctr && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">CTR</span>
            <span className={`text-sm font-bold ${ctr.color === 'positive' ? 'text-emerald-600' : 'text-amber-600'}`}>{ctr.value}</span>
          </div>
        )}
        {spend && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Ad Spend</span>
            <span className="text-sm font-bold text-slate-700">{spend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
