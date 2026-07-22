import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function MPGPanel({ results }: Props) {
  const mode = results.length > 0 ? (results[0].id === 'mpg' ? 'mpg' : results[0].id === 'tripCost' ? 'tripcost' : results[0].id === 'range' ? 'range' : 'convert') : 'mpg';
  const mpg = results.find(r => r.id === 'mpg');
  const l100km = results.find(r => r.id === 'l100km');
  const tripCost = results.find(r => r.id === 'tripCost');
  const costPerMile = results.find(r => r.id === 'costPerMile');
  const range = results.find(r => r.id === 'range');
  const usable = results.find(r => r.id === 'usable');

  if (!results.length) return null;

  const mpgVal = mpg ? parseNum(mpg.value) : 0;
  const maxMPG = 60;
  const pct = mpgVal > 0 ? Math.min((mpgVal / maxMPG) * 100, 100) : 0;

  const getColor = (v: number) =>
    v >= 45 ? 'bg-emerald-500' : v >= 30 ? 'bg-green-500' : v >= 20 ? 'bg-amber-500' : 'bg-red-500';

  const getLabel = (v: number) =>
    v >= 45 ? 'Excellent' : v >= 30 ? 'Good' : v >= 20 ? 'Fair' : 'Poor';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Fuel Economy</span>
      </div>
      <div className="p-5 space-y-3">
        {mpg && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-slate-600">MPG</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getColor(mpgVal).replace('bg-', 'bg-').replace('500', '100')} ${getColor(mpgVal).replace('bg-', 'text-').replace('500', '700')}`}>
                {getLabel(mpgVal)}
              </span>
            </div>
            <div className="h-4 bg-slate-100 rounded overflow-hidden">
              <div className={`h-full rounded ${getColor(mpgVal)} transition-all flex items-center justify-end pr-1`} style={{ width: `${Math.max(pct, 3)}%` }}>
                <span className="text-[9px] font-bold text-white">{mpg.value}</span>
              </div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
              <span>0</span>
              <span>30</span>
              <span>60</span>
            </div>
          </div>
        )}
        {l100km && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">L/100km</span>
            <span className="text-sm font-bold text-slate-700">{l100km.value}</span>
          </div>
        )}
        {tripCost && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-amber-800 font-semibold">Trip Cost</span>
              <span className="text-lg font-bold text-amber-900">{tripCost.value}</span>
            </div>
            {costPerMile && (
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-amber-200">
                <span className="text-xs text-amber-700">Per Mile</span>
                <span className="text-sm font-bold text-amber-800">{costPerMile.value}</span>
              </div>
            )}
          </div>
        )}
        {range && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[10px] font-bold text-emerald-700 uppercase">Full Tank</p>
              <p className="text-base font-bold text-emerald-800">{range.value}</p>
            </div>
            {usable && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold text-slate-600 uppercase">Practical</p>
                <p className="text-base font-bold text-slate-700">{usable.value}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
