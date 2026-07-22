import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.-]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function CorrelationPanel({ results }: Props) {
  const r = results.find(r => r.id === 'r');
  const rSquared = results.find(r => r.id === 'rSquared');
  const strength = results.find(r => r.id === 'strength');
  const direction = results.find(r => r.id === 'direction');
  const n = results.find(r => r.id === 'n');

  if (!r || !rSquared) return null;

  const rVal = parseNum(r.value);
  const r2Val = parseNum(rSquared.value);
  const absR = Math.abs(rVal);

  // Determine position on the -1 to +1 scale
  const pos = ((rVal + 1) / 2) * 100; // 0 to 100%

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Correlation Summary</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Correlation scale bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-600">Correlation (r)</span>
            <span className="text-sm font-bold text-slate-700">{r.value}</span>
          </div>
          <div className="relative h-5 bg-gradient-to-r from-red-500 via-slate-200 to-emerald-500 rounded-full overflow-hidden">
            <div
              className="absolute top-0 w-0.5 h-full bg-white shadow-sm"
              style={{ left: `calc(${pos}% - 1px)` }}
            />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px] text-slate-400">-1</span>
            <span className="text-[10px] text-slate-400">0</span>
            <span className="text-[10px] text-slate-400">+1</span>
          </div>
        </div>

        {/* r² bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-600">r² (Coefficient of Determination)</span>
            <span className="text-xs font-bold text-slate-700">{rSquared.value}</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${r2Val * 100}%` }}
            />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Strength</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">{strength?.value ?? '-'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Direction</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">{direction?.value ?? '-'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">n</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">{n?.value ?? '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
