import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function CBMPanel({ results }: Props) {
  const cbm = results.find(r => r.id === 'cbm');
  const dimWeight = results.find(r => r.id === 'dimWeight');
  const actualWeight = results.find(r => r.id === 'actualWeightDisplay');
  const chargeable = results.find(r => r.id === 'chargeableWeight');
  const weightBasis = results.find(r => r.id === 'weightBasis');
  const container = results.find(r => r.id === 'containerEstimate');

  if (!cbm) return null;

  const actualVal = actualWeight ? parseNum(actualWeight.value) : 0;
  const dimVal = dimWeight ? parseNum(dimWeight.value) : 0;
  const chargeVal = chargeable ? parseNum(chargeable.value) : 0;
  const maxWeight = Math.max(actualVal, dimVal, chargeVal);

  const bar = (label: string, val: number, color: string) => {
    const pct = maxWeight > 0 ? (val / maxWeight) * 100 : 0;
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="text-xs font-semibold text-slate-600 w-28 flex-shrink-0">{label}</span>
        <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${color} transition-all flex items-center justify-end pr-1.5 ${pct < 10 ? 'min-w-[45px]' : ''}`} style={{ width: `${Math.max(pct, 5)}%` }}>
            <span className="text-[9px] font-bold text-white">{val.toFixed(2)} kg</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">CBM & Weight</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">CBM</p>
          <p className="text-3xl font-bold text-blue-700">{cbm.value}</p>
        </div>
        {actualVal > 0 && bar('Actual Weight', actualVal, 'bg-blue-500')}
        {dimVal > 0 && bar('Dimensional Weight', dimVal, 'bg-amber-500')}
        {chargeVal > 0 && bar('Chargeable Weight', chargeVal, 'bg-red-500')}
        {weightBasis && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] text-slate-600">{weightBasis.value}</p>
          </div>
        )}
        {container && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-600">{container.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
