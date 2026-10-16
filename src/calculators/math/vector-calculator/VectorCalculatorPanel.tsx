import { CalculatorResult } from '../../../types/calculator';
import VectorPlot2D from '../../../components/charts/VectorPlot2D';
import { parseNumberStrict } from '../../../utils/parseNumber';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function VectorCalculatorPanel({ values, results }: Props) {
  const sum = results.find(r => r.id === 'sum');
  const difference = results.find(r => r.id === 'difference');
  const magnitude1 = results.find(r => r.id === 'magnitude1');
  const magnitude2 = results.find(r => r.id === 'magnitude2');
  const dotProduct = results.find(r => r.id === 'dotProduct');
  const crossProduct = results.find(r => r.id === 'crossProduct');
  const angleDeg = results.find(r => r.id === 'angleDeg');

  if (!sum || !dotProduct || !angleDeg) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Vector Results
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Sum and Angle */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold">{sum.label}</p>
            <p className="text-lg font-bold text-blue-700 font-mono">{sum.value}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold">{angleDeg.label}</p>
            <p className="text-lg font-bold text-emerald-700 font-mono">{angleDeg.value}</p>
          </div>
        </div>

        {/* Difference and dot product */}
        <div className="grid grid-cols-2 gap-2">
          {difference && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{difference.label}</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{difference.value}</p>
            </div>
          )}
          {dotProduct && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{dotProduct.label}</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{dotProduct.value}</p>
            </div>
          )}
        </div>

        {/* Magnitudes and cross product */}
        <div className="grid grid-cols-3 gap-2">
          {magnitude1 && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{magnitude1.label}</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{magnitude1.value}</p>
            </div>
          )}
          {magnitude2 && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{magnitude2.label}</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{magnitude2.value}</p>
            </div>
          )}
          {crossProduct && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{crossProduct.label}</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{crossProduct.value}</p>
            </div>
          )}
        </div>

        {/* Vector 2D plot */}
        {(() => {
          const v1x = parseNumberStrict(values.v1x);
          const v1y = parseNumberStrict(values.v1y);
          const v2x = parseNumberStrict(values.v2x);
          const v2y = parseNumberStrict(values.v2y);
          return (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Vector Positions (2D Projection onto the xy-plane)</p>
              <VectorPlot2D
                vectors={[
                  { name: 'v1', x: v1x, y: v1y, color: '#2563eb' },
                  { name: 'v2', x: v2x, y: v2y, color: '#dc2626' },
                  { name: 'v1 + v2', x: v1x + v2x, y: v1y + v2y, color: '#059669', dashed: true },
                ]}
              />
            </div>
          );
        })()}
      </div>
    </div>
  );
}
