import { CalculatorResult } from '../../../types/calculator';
import TriangleSolution, { readTriangle } from '../shared/TriangleSolution';
import type { AngleUnit } from '../shared/triangle';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function LawOfSinesPanel({ values, results }: Props) {
  const t = readTriangle(results);
  const t2 = readTriangle(results, '_triangle2');
  if (!t) return null;
  const unit: AngleUnit = values.angleUnit === 'rad' ? 'rad' : 'deg';
  const ratio = results.find((r) => r.id === 'ratio');
  const circumradius = results.find((r) => r.id === 'circumradius');
  const count = results.find((r) => r.id === 'triangleCount');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Triangle Solution</span>
      </div>

      <div className="p-5 space-y-4">
        {t2 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="note">
            <strong>{count?.value}</strong>: the given side-side-angle data fits two different triangles. Both are shown below.
          </div>
        )}

        {t2 && <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Triangle 1</p>}
        <TriangleSolution t={t} unit={unit} sideNote={['a / sin A', 'b / sin B', 'c / sin C']} />

        {t2 && (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Triangle 2</p>
            <TriangleSolution t={t2} unit={unit} sideNote={['a / sin A', 'b / sin B', 'c / sin C']} />
          </>
        )}

        <div className="grid grid-cols-2 gap-2">
          {ratio && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-center">
              <p className="text-[10px] font-bold text-purple-800 uppercase">Ratio a/sin(A)</p>
              <p className="text-sm font-mono font-bold text-purple-800 break-all">{ratio.value}</p>
            </div>
          )}
          {circumradius && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-center">
              <p className="text-[10px] font-bold text-purple-800 uppercase">Circumradius R</p>
              <p className="text-sm font-mono font-bold text-purple-800 break-all">{circumradius.value}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
