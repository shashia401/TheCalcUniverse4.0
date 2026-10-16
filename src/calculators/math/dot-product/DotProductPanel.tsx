import { CalculatorResult } from '../../../types/calculator';
import VectorPlot2D from '../../../components/charts/VectorPlot2D';
import { parseNumberStrict } from '../../../utils/parseNumber';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function DotProductPanel({ values, results }: Props) {
  const dotProduct = results.find(r => r.id === 'dotProduct');
  const magnitude1 = results.find(r => r.id === 'magnitude1');
  const magnitude2 = results.find(r => r.id === 'magnitude2');
  const angleDeg = results.find(r => r.id === 'angleDeg');
  const cosTheta = results.find(r => r.id === 'cosTheta');
  const orthogonal = results.find(r => r.id === 'orthogonal');
  const projection = results.find(r => r.id === 'projection');
  const vectorProjection = results.find(r => r.id === 'vectorProjection');

  if (!dotProduct || !angleDeg) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Dot Product Results
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Dot product and angle */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold">{dotProduct.label}</p>
            <p className="text-2xl font-bold text-blue-700 font-mono break-all">{dotProduct.value}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold">{angleDeg.label}</p>
            <p className="text-2xl font-bold text-emerald-800 font-mono break-words">{angleDeg.value}</p>
          </div>
        </div>

        {/* Magnitudes, cosθ, orthogonal */}
        <div className="grid grid-cols-3 gap-2">
          {magnitude1 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{magnitude1.label}</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{magnitude1.value}</p>
            </div>
          )}
          {magnitude2 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{magnitude2.label}</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{magnitude2.value}</p>
            </div>
          )}
          {cosTheta && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{cosTheta.label}</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{cosTheta.value}</p>
            </div>
          )}
        </div>

        {/* Orthogonal and projection */}
        <div className="grid grid-cols-2 gap-2">
          {orthogonal && (
            <div className={`rounded-lg border px-3 py-2.5 text-center ${orthogonal.value === 'Yes' ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase">{orthogonal.label}</p>
              <p className={`text-sm font-mono font-bold mt-0.5 ${orthogonal.value === 'Yes' ? 'text-green-800' : 'text-slate-700'}`}>{orthogonal.value}</p>
            </div>
          )}
          {projection && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{projection.label}</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{projection.value}</p>
            </div>
          )}
        </div>

        {vectorProjection && (
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">{vectorProjection.label}</p>
            <p className="text-sm font-mono font-bold text-slate-700 mt-0.5 break-all">{vectorProjection.value}</p>
          </div>
        )}

        {/* Vector 2D plot */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Vectors a and b (2D View)</p>
          <VectorPlot2D
            vectors={[
              { name: 'a', x: parseNumberStrict(values.v1x), y: parseNumberStrict(values.v1y), color: '#2563eb' },
              { name: 'b', x: parseNumberStrict(values.v2x), y: parseNumberStrict(values.v2y), color: '#dc2626' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
