import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function LeaseVsBuyPanel({ results }: Props) {
  const rec = results.find(r => r.id === 'recommendation');
  const totalLease = results.find(r => r.id === 'totalLease');
  const totalBuy = results.find(r => r.id === 'totalBuy');
  const residual = results.find(r => r.id === 'residualValue');

  if (!rec || !totalLease || !totalBuy) return null;

  const leaseVal = parseNum(totalLease.value);
  const buyVal = parseNum(totalBuy.value);
  const maxVal = Math.max(leaseVal, buyVal);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Lease vs Buy</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className={`rounded-xl border p-4 text-center ${leaseVal <= buyVal ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lease</p>
            <p className="text-xl font-bold text-slate-700">{totalLease.value}</p>
          </div>
          <div className={`rounded-xl border p-4 text-center ${buyVal <= leaseVal ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Buy</p>
            <p className="text-xl font-bold text-slate-700">{totalBuy.value}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {bar('Lease Cost', leaseVal, maxVal, 'bg-blue-500')}
          {bar('Net Buy Cost', buyVal, maxVal, 'bg-purple-500')}
        </div>

        {residual && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs text-slate-500">Estimated Vehicle Value After Term</p>
            <p className="text-lg font-bold text-emerald-700">{residual.value}</p>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-600">{rec.value}</p>
        </div>
      </div>
    </div>
  );
}

function bar(label: string, val: number, max: number, color: string) {
  const pct = max > 0 ? (val / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-xs font-semibold text-slate-600 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
        <div className={`h-full rounded ${color} transition-all flex items-center justify-end pr-1.5 ${pct < 12 ? 'min-w-[45px]' : ''}`} style={{ width: `${Math.max(pct, 5)}%` }}>
          <span className="text-[10px] font-bold text-white drop-shadow-sm">${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
      </div>
    </div>
  );
}
