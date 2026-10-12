import { CalculatorResult } from '../../../types/calculator';
import { mpgCalc } from './mpgMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const n2 = (n: number) => n.toFixed(2);
const MAX_MPG = 60;

// Rule-of-thumb bands for a typical passenger vehicle (not a standard): -700 fills keep white text >= 4.5:1.
function band(mpg: number) {
  if (mpg >= 45) return { fill: 'bg-emerald-700', pill: 'bg-emerald-100 text-emerald-800', label: 'Excellent' };
  if (mpg >= 30) return { fill: 'bg-green-700', pill: 'bg-green-100 text-green-800', label: 'Good' };
  if (mpg >= 20) return { fill: 'bg-amber-700', pill: 'bg-amber-100 text-amber-800', label: 'Fair' };
  return { fill: 'bg-red-700', pill: 'bg-red-100 text-red-800', label: 'Poor' };
}

export default function MPGPanel({ values, results }: Props) {
  const c = mpgCalc(values);
  if (!results.length || !c || c.error) return null;

  const pct = c.mpg ? Math.min((c.mpg / MAX_MPG) * 100, 100) : 0;
  const b = c.mpg ? band(c.mpg) : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Fuel Economy</span>
      </div>
      <div className="p-5 space-y-3">
        {c.mpg !== undefined && b && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-slate-600">MPG</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.pill}`}>{b.label}</span>
            </div>
            <div className="h-4 bg-slate-100 rounded overflow-hidden">
              <div className={`h-full rounded ${b.fill} transition-all flex items-center justify-end pr-1`} style={{ width: `${Math.max(pct, 3)}%` }}>
                <span className="text-[9px] font-bold text-white">{n2(c.mpg)} MPG</span>
              </div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
              <span>0</span>
              <span>30</span>
              <span>60+</span>
            </div>
          </div>
        )}
        {c.l100km !== undefined && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">L/100km</span>
            <span className="text-sm font-bold text-slate-700">{n2(c.l100km)} L/100km</span>
          </div>
        )}
        {c.tripCost !== undefined && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-amber-900 font-semibold">Trip Cost</span>
              <span className="text-lg font-bold text-amber-900">${n2(c.tripCost)}</span>
            </div>
            {c.costPerMile !== undefined && (
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-amber-200">
                <span className="text-xs text-amber-900">Per Mile</span>
                <span className="text-sm font-bold text-amber-900">${n2(c.costPerMile)}/mile</span>
              </div>
            )}
          </div>
        )}
        {c.range !== undefined && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[10px] font-bold text-emerald-800 uppercase">Full Tank</p>
              <p className="text-base font-bold text-emerald-900">{n2(c.range)} miles</p>
            </div>
            {c.usable !== undefined && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold text-slate-600 uppercase">Practical (90% tank)</p>
                <p className="text-base font-bold text-slate-700">{n2(c.usable)} miles</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
