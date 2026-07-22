import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function VoltageDropPanel({ results }: Props) {
  const vDrop = results.find(r => r.id === 'voltageDrop');
  const vAtLoad = results.find(r => r.id === 'voltageAtLoad');
  const wireRes = results.find(r => r.id === 'wireResistance');

  if (!vDrop || !vAtLoad) return null;

  const pctStr = vDrop.value.match(/([\d.]+)%/);
  const pct = pctStr ? parseFloat(pctStr[1]) : 0;
  const ok = pct <= 3;
  const warning = pct > 3 && pct <= 5;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Voltage Drop</span>
      </div>
      <div className="p-5 space-y-3">
        <div className={`rounded-xl border p-4 text-center ${
          ok ? 'bg-emerald-50 border-emerald-200' :
          warning ? 'bg-amber-50 border-amber-200' :
          'bg-red-50 border-red-200'
        }`}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Voltage Drop</p>
          <p className={`text-3xl font-bold ${ok ? 'text-emerald-700' : warning ? 'text-amber-700' : 'text-red-700'}`}>
            {vDrop.value}
          </p>
          <p className={`text-xs font-bold mt-1 ${ok ? 'text-emerald-600' : warning ? 'text-amber-600' : 'text-red-600'}`}>
            {ok ? 'Within recommended limit' : warning ? 'Borderline — consider larger wire' : 'Exceeds recommended limit'}
          </p>
        </div>

        {/* Gauge bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Voltage Drop %</span>
            <span className={ok ? 'text-emerald-600 font-bold' : warning ? 'text-amber-600 font-bold' : 'text-red-600 font-bold'}>
              {pct.toFixed(2)}%
            </span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
            <div className="flex h-full rounded-full overflow-hidden" style={{ width: `${Math.min((pct / 10) * 100, 100)}%` }}>
              <div className="h-full bg-emerald-500" style={{ width: `${(3 / pct) * 100}%` }} />
              <div className="h-full bg-amber-500" style={{ width: `${(2 / pct) * 100}%` }} />
              <div className="h-full bg-red-500 flex-1" />
            </div>
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
            <span>0%</span>
            <span>3% (Good)</span>
            <span>5% (Max)</span>
            <span>10%</span>
          </div>
        </div>

        <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
          <span className="text-xs text-slate-600">Voltage at Load</span>
          <span className="text-lg font-bold text-slate-700">{vAtLoad.value}</span>
        </div>
        {wireRes && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Wire Resistance</span>
            <span className="text-sm font-bold text-slate-700">{wireRes.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
