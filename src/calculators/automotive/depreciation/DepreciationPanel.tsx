import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function DepreciationPanel({ results }: Props) {
  const totalDep = results.find(r => r.id === 'totalDepreciation');
  const futureValue = results.find(r => r.id === 'futureValue');
  const annualDep = results.find(r => r.id === 'annualDepreciation');
  const monthlyDep = results.find(r => r.id === 'monthlyDepreciation');

  if (!totalDep || !futureValue) return null;

  const totalVal = parseNum(totalDep.value);
  const futureVal = parseNum(futureValue.value);
  const annualVal = annualDep ? parseNum(annualDep.value) : 0;
  const maxVal = Math.max(totalVal, futureVal, annualVal);

  const bar = (label: string, val: number, color: string) => {
    const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="text-xs font-semibold text-slate-600 w-36 flex-shrink-0">{label}</span>
        <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${color} transition-all flex items-center justify-end pr-1.5 ${pct < 12 ? 'min-w-[50px]' : ''}`} style={{ width: `${Math.max(pct, 5)}%` }}>
            <span className="text-[10px] font-bold text-white drop-shadow-sm">${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
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
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Depreciation Summary</span>
      </div>
      <div className="p-5 space-y-2">
        {bar('Future Value', futureVal, 'bg-emerald-500')}
        {bar('Total Depreciation', totalVal, 'bg-red-500')}
        {annualVal > 0 && bar('Annual Depreciation', annualVal, 'bg-amber-500')}
        {monthlyDep && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">{monthlyDep.label}</p>
            <p className="text-lg font-bold text-slate-700">{monthlyDep.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
