import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { cross3, type V3 } from '../../../utils/vector';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const COMPONENT_COLORS = ['#2563eb', '#059669', '#7c3aed'];

export default function CrossProductPanel({ values, results }: Props) {
  const crossProduct = results.find(r => r.id === 'crossProduct');
  const magnitude = results.find(r => r.id === 'magnitude');
  const unitVector = results.find(r => r.id === 'unitVector');
  const verification = results.find(r => r.id === 'verification');
  const area = results.find(r => r.id === 'area');

  if (!crossProduct || !magnitude || !area) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Cross Product Results
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Cross product vector */}
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-1">{crossProduct.label}</p>
          <p className="text-2xl font-bold text-purple-700 font-mono">{crossProduct.value}</p>
        </div>

        {/* Magnitude and area */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">{magnitude.label}</p>
            <p className="text-xl font-bold text-slate-700 font-mono mt-0.5">{magnitude.value}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold text-green-800 uppercase">{area.label}</p>
            <p className="text-xl font-bold text-green-700 font-mono mt-0.5">{area.value}</p>
          </div>
        </div>

        {/* Unit vector */}
        {unitVector && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{unitVector.label}</p>
            <p className="text-sm font-mono text-slate-700 break-all">{unitVector.value}</p>
          </div>
        )}

        {/* Verification */}
        {verification && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold text-amber-800 uppercase mb-1">{verification.label}</p>
            <p className="text-sm font-mono text-amber-700 break-all">{verification.value}</p>
            <p className="text-[10px] text-amber-800 mt-1">Values should be near zero if cross product is correct (orthogonal to both inputs)</p>
          </div>
        )}

        {/* Component bar chart */}
        {(() => {
          const a: V3 = [parseNumberStrict(values.v1x), parseNumberStrict(values.v1y), parseNumberStrict(values.v1z)];
          const b: V3 = [parseNumberStrict(values.v2x), parseNumberStrict(values.v2y), parseNumberStrict(values.v2z)];
          if ([...a, ...b].some((x) => !Number.isFinite(x))) return null;
          const c = cross3(a, b);
          const data = ([['a', a], ['b', b], ['a × b', c]] as [string, V3][]).flatMap(([name, v]) =>
            v.map((value, i) => ({ label: `${name} ${'xyz'[i]}`, value, color: COMPONENT_COLORS[i] })),
          );
          return (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Vector Components</p>
              <SvgBarChart data={data} height={200} ariaLabel="Bar chart of the x, y and z components of vector a, vector b and the cross product a × b" />
              <p className="mt-2 text-xs text-slate-600">
                <span className="font-semibold" style={{ color: COMPONENT_COLORS[0] }}>Blue = x</span>,{' '}
                <span className="font-semibold" style={{ color: '#047857' }}>green = y</span>,{' '}
                <span className="font-semibold" style={{ color: COMPONENT_COLORS[2] }}>purple = z</span>
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
