import { CalculatorResult } from '../../../types/calculator';
import TriangleSolution, { readTriangle } from '../shared/TriangleSolution';
import { type AngleUnit, fmtNum8 } from '../shared/triangle';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function LawOfCosinesPanel({ values, results }: Props) {
  const t = readTriangle(results);
  if (!t) return null;
  const unit: AngleUnit = values.angleUnit === 'rad' ? 'rad' : 'deg';

  // Law of cosines check for side c: c² = a² + b² − 2ab·cos C (a right angle makes the last term vanish).
  const cosRaw = Math.cos((t.C * Math.PI) / 180);
  const cosC = Math.abs(cosRaw) < 1e-15 ? 0 : cosRaw; // cos(90°) is exactly 0
  const lhs = t.c * t.c;
  const rhs = t.a * t.a + t.b * t.b - 2 * t.a * t.b * cosC;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Triangle Solution</span>
      </div>

      <div className="p-5 space-y-4">
        <TriangleSolution t={t} unit={unit} />

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Law of Cosines Check</p>
          <div className="text-xs font-mono text-slate-700 space-y-1">
            <p>c² = {fmtNum8(lhs)}</p>
            <p>a² + b² − 2ab·cos C = {fmtNum8(t.a * t.a)} + {fmtNum8(t.b * t.b)} − {fmtNum8(2 * t.a * t.b * cosC)} = {fmtNum8(rhs)}</p>
            <p className="text-slate-600">Difference: {Math.abs(lhs - rhs) < 1e-9 * Math.max(1, lhs) ? '0 (equal)' : fmtNum8(Math.abs(lhs - rhs))}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
