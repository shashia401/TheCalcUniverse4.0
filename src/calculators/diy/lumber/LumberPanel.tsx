import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function LumberPanel({ results }: Props) {
  const totalBdFt = results.find(r => r.id === 'totalBdFt');
  const perBoard = results.find(r => r.id === 'perBoard');
  const linearFt = results.find(r => r.id === 'linearFt');
  const totalCost = results.find(r => r.id === 'totalCost');

  if (!totalBdFt) return null;

  const bdftVal = parseNum(totalBdFt.value);
  const perVal = perBoard ? parseNum(perBoard.value) : 0;
  const linVal = linearFt ? parseNum(linearFt.value) : 0;
  const maxVal = Math.max(bdftVal, linVal);

  const bar = (label: string, val: number, max: number, color: string, unit: string) => {
    const pct = max > 0 ? (val / max) * 100 : 0;
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="text-xs font-semibold text-slate-600 w-28 flex-shrink-0">{label}</span>
        <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${color} transition-all flex items-center justify-end pr-1.5 ${pct < 10 ? 'min-w-[45px]' : ''}`} style={{ width: `${Math.max(pct, 5)}%` }}>
            <span className="text-[9px] font-bold text-white">{val.toFixed(1)} {unit}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Lumber Quantity</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Total Board Feet</p>
          <p className="text-3xl font-bold text-amber-700">{totalBdFt.value}</p>
        </div>
        {perVal > 0 && bar('Per Board', perVal, maxVal, 'bg-blue-500', 'bd ft')}
        {linVal > 0 && bar('Linear Feet', linVal, maxVal, 'bg-emerald-500', 'ft')}
        {totalCost && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Estimated Cost</span>
              <span className="text-lg font-bold text-slate-700">{totalCost.value}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
