import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { findResult } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const DEGREE: Record<string, number> = { linear: 1, quadratic: 2, cubic: 3, quartic: 4 };
const TONE: Record<string, string> = {
  'two-real': 'bg-emerald-50 border-emerald-200',
  repeated: 'bg-amber-50 border-amber-200',
  complex: 'bg-red-50 border-red-200',
};

export default function EquationSolverPanel({ values, results }: Props) {
  const equationType = values.equationType || 'linear';
  const degree = DEGREE[equationType] ?? 1;
  const kind = findResult(results, '_kind')?.value ?? '';
  const coeffs = useMemo(() => ['a', 'b', 'c', 'd', 'e'].slice(0, degree + 1).map((k) => parseNumberStrict(values[k])), [values, degree]);

  // Real roots come from the calculator (hidden row), not from re-deriving them here.
  const realRoots: number[] = useMemo(() => {
    try {
      return JSON.parse(findResult(results, '_realRoots')?.value ?? '[]') as number[];
    } catch {
      return [];
    }
  }, [results]);

  const plot = useMemo(() => {
    if (coeffs.some((c) => !Number.isFinite(c)) || coeffs[0] === 0) return null;
    const horner = (x: number) => coeffs.reduce((acc, c) => acc * x + c, 0);
    const centre = degree >= 2 ? -coeffs[1] / (degree * coeffs[0]) : realRoots[0] ?? 0;
    const span = Math.max(4, ...realRoots.map((r) => Math.abs(r - centre) * 1.4));
    const pts = Array.from({ length: 121 }, (_, i) => {
      const x = centre - span + (2 * span * i) / 120;
      return { x, y: horner(x) };
    }).filter((p) => Number.isFinite(p.y));
    // Clip so a steep cubic/quartic tail does not flatten the region around the roots.
    const yBound = Math.max(10, ...realRoots.map((r) => Math.abs(horner(r + 0.25 * span))), Math.abs(horner(centre)) * 2);
    return { pts: pts.filter((p) => Math.abs(p.y) <= 4 * yBound), horner, centre };
  }, [coeffs, degree, realRoots]);

  if (!results || results.length === 0) return null;

  const equationResult = findResult(results, 'equation');
  const discriminantResult = findResult(results, 'discriminant');
  const exactResult = findResult(results, 'exactForm');
  const natureResult = findResult(results, 'nature');
  const rootRows = results.filter((r) => /^root\d+$/.test(r.id));
  const tone = TONE[kind] ?? 'bg-emerald-50 border-emerald-200';
  const toneText = kind === 'repeated' ? 'text-amber-800' : kind === 'complex' ? 'text-red-800' : 'text-emerald-800';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500" aria-hidden="true">
          <path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Equation Visualization</span>
      </div>

      <div className="p-6 space-y-6">
        {equationResult && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Equation</p>
            <p className="text-lg font-bold text-slate-800 font-mono break-words">{equationResult.value}</p>
          </div>
        )}

        {plot && plot.pts.length > 1 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Graph of y = P(x)</p>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <SvgLineChart
                height={260}
                ariaLabel={`Graph of the ${equationType} polynomial ${equationResult?.value ?? ''}; red dots mark the real roots where the curve crosses the x-axis`}
                series={[{ name: 'P(x)', color: '#2563eb', points: plot.pts }]}
                refLines={[{ y: 0, color: '#94a3b8', dashed: false }]}
                dots={[
                  ...realRoots.map((r) => ({ x: r, y: 0, label: `x = ${+r.toPrecision(5)}`, color: '#dc2626' })),
                  ...(equationType === 'quadratic' ? [{ x: plot.centre, y: plot.horner(plot.centre), label: 'Vertex', color: '#7c3aed' }] : []),
                ]}
              />
            </div>
          </div>
        )}

        {discriminantResult && (
          <div className={`rounded-xl border px-5 py-4 ${tone}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Discriminant (&Delta; = b&sup2; &minus; 4ac)</p>
            <p className={`text-2xl font-black font-mono break-all ${toneText}`}>{discriminantResult.value}</p>
            <p className={`text-xs mt-1 ${toneText}`}>{natureResult?.value || ''}</p>
          </div>
        )}

        {rootRows.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rootRows.map((r) => (
              <div key={r.id} className={`rounded-lg border px-4 py-3 ${r.label.includes('complex') ? TONE.complex : tone}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{r.label}</p>
                <p className="text-lg font-bold text-slate-800 font-mono break-words">{r.value}</p>
              </div>
            ))}
          </div>
        )}

        {exactResult && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{exactResult.label}</p>
            <p className="text-sm font-bold text-slate-800 font-mono break-words">{exactResult.value}</p>
          </div>
        )}

        {!discriminantResult && natureResult && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Nature</p>
            <p className="text-sm font-bold text-emerald-800">{natureResult.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
