import { CalculatorResult } from '../../../types/calculator';
import TriangleSolution, { readTriangle } from '../shared/TriangleSolution';
import { type AngleUnit, fmtAngle } from '../shared/triangle';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function TrianglePanel({ values, results }: Props) {
  const t = readTriangle(results);
  if (!t) return null;
  const unit: AngleUnit = values.angleUnit === 'rad' ? 'rad' : 'deg';
  const typeRow = results.find((r) => r.id === 'triangleType');
  const areaRow = results.find((r) => r.id === 'area');
  const perimRow = results.find((r) => r.id === 'perimeter');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0-4h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Triangle Visualization</span>
      </div>

      <div className="p-5 space-y-4">
        {typeRow && (
          <div className="text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm font-bold">{typeRow.value}</span>
          </div>
        )}

        <TriangleSolution t={t} unit={unit} />

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Angles</p>
            <div className="space-y-0.5 text-xs font-mono text-slate-700">
              <p>A = {fmtAngle(t.A, unit)}</p>
              <p>B = {fmtAngle(t.B, unit)}</p>
              <p>C = {fmtAngle(t.C, unit)}</p>
              <p className="border-t border-slate-200 pt-0.5 mt-0.5">Sum = {fmtAngle(t.A + t.B + t.C, unit)}</p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Measures</p>
            <div className="space-y-0.5 text-xs font-mono text-slate-700">
              <p>Perimeter = {perimRow?.value}</p>
              <p>Area = {areaRow?.value}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
