import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.-]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function TestScorePanel({ results }: Props) {
  const needed = results.find(r => r.id === 'needed');
  const projected = results.find(r => r.id === 'projected');

  if (!needed) return null;

  const neededVal = parseNum(needed.value);
  const projectedVal = projected ? parseNum(projected.value) : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Grade Target</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Needed score bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-600">Grade Needed on Final</span>
            <span className="text-sm font-bold text-slate-700">{needed.value}</span>
          </div>
          <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                neededVal > 100 ? 'bg-red-500' :
                neededVal > 95 ? 'bg-orange-500' :
                neededVal > 80 ? 'bg-amber-500' :
                neededVal <= 0 ? 'bg-emerald-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${Math.min(neededVal, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px] text-slate-400">0%</span>
            <span className="text-[10px] text-slate-400">50%</span>
            <span className="text-[10px] text-slate-400">100%</span>
          </div>
        </div>

        {/* Projected overall grade */}
        {projected && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Projected Overall Grade</p>
            <p className="text-lg font-bold text-slate-700 mt-0.5">{projected.value}</p>
          </div>
        )}

        {/* Status */}
        {neededVal > 100 && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center">
            <p className="text-xs font-bold text-red-600">Target Not Reachable</p>
            <p className="text-[11px] text-red-500 mt-0.5">Even scoring 100% on the final will not reach this target.</p>
          </div>
        )}
        {neededVal < 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
            <p className="text-xs font-bold text-emerald-600">Already There!</p>
            <p className="text-[11px] text-emerald-500 mt-0.5">You have already achieved your desired grade.</p>
          </div>
        )}
      </div>
    </div>
  );
}
