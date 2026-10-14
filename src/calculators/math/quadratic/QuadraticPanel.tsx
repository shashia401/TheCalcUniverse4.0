import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { equationText, fmtF, fmtN, solveQuadratic } from './quadraticMath';
import { fracToNumber } from '../../../utils/rational';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function QuadraticPanel({ values, results }: Props) {
  const solved = solveQuadratic(values.a, values.b, values.c);
  if (solved.kind !== 'ok' || results.length === 0) return null;
  const { q } = solved;

  const a = fracToNumber(q.a);
  const b = fracToNumber(q.b);
  const c = fracToNumber(q.c);
  const discText = fmtF(q.disc);
  const vertexX = fracToNumber(q.vertexX);
  const vertexY = fracToNumber(q.vertexY);

  // Parabola sample points around the vertex / roots
  const farRoot = q.kind === 'two-real' ? Math.max(Math.abs(q.x1!), Math.abs(q.x2!)) : Math.abs(vertexX) + 2;
  const range = Math.max(farRoot, Math.abs(vertexX) + 2, 3);
  const xMin = vertexX - range - 1;
  const xMax = vertexX + range + 1;
  const steps = 80;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const px = xMin + (i / steps) * (xMax - xMin);
    points.push({ x: px, y: a * px * px + b * px + c });
  }

  const dots = [
    ...(q.kind === 'two-real' ? [
      { x: q.x1!, y: 0, label: `x₁=${fmtN(q.x1!)}`, color: '#dc2626' },
      { x: q.x2!, y: 0, label: `x₂=${fmtN(q.x2!)}`, color: '#dc2626' },
    ] : []),
    ...(q.kind === 'repeated' ? [{ x: q.x1!, y: 0, label: `x=${fmtN(q.x1!)}`, color: '#b45309' }] : []),
    { x: vertexX, y: vertexY, label: `Vertex (${fmtN(vertexX)}, ${fmtN(vertexY)})`, color: '#6d28d9' },
  ];

  const x1Row = results.find((r) => r.id === 'x1');
  const x2Row = results.find((r) => r.id === 'x2');
  const xRow = results.find((r) => r.id === 'x');
  const c1Row = results.find((r) => r.id === 'complex1');
  const c2Row = results.find((r) => r.id === 'complex2');
  const exactRow = results.find((r) => r.id === 'exactForm');
  const sqrtDisc = q.kind === 'two-real' ? `√${discText}` : `i√${fmtF({ n: -q.disc.n, d: q.disc.d })}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Step-by-Step Solution</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-600 mb-2">Equation</p>
          <p className="text-xl font-bold text-blue-700 font-mono break-all">{equationText(q)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Parabola f(x) = ax² + bx + c</p>
          <SvgLineChart
            ariaLabel={`Graph of the parabola ${equationText(q).replace(' = 0', '')} with its vertex at (${fmtN(vertexX)}, ${fmtN(vertexY)})${q.kind === 'complex' ? ' and no x-intercepts' : ''}`}
            height={260}
            series={[{ name: 'f(x)', points, color: '#2563eb' }]}
            refLines={[
              { x: 0, color: '#94a3b8', dashed: false },
              { x: vertexX, color: '#15803d', label: 'Axis' },
            ]}
            dots={dots}
          />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Step-by-Step Solution</p>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Step 1: Identify Coefficients</p>
            <p className="text-xs font-mono text-slate-700 mt-1 break-all">a = {fmtF(q.a)}, b = {fmtF(q.b)}, c = {fmtF(q.c)}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Step 2: Calculate the Discriminant</p>
            <p className="text-xs font-mono text-slate-700 mt-1 break-all">Δ = b² − 4ac = {fmtF(q.b)}² − 4({fmtF(q.a)})({fmtF(q.c)})</p>
            <p className="text-xs font-mono text-slate-700 mt-1 break-all">Δ = {discText}</p>
          </div>

          <div className={`rounded-lg border px-4 py-3 ${q.kind === 'two-real' ? 'border-blue-200 bg-blue-50' : q.kind === 'repeated' ? 'border-amber-200 bg-amber-50' : 'border-orange-200 bg-orange-50'}`}>
            <p className="text-[10px] font-bold uppercase text-slate-700">Step 3: Interpret the Discriminant</p>
            <p className="text-xs mt-1">
              Δ = {discText}{' — '}
              {q.kind === 'two-real'
                ? <span className="text-green-800 font-bold">The discriminant is POSITIVE, so there are two distinct real roots. The parabola crosses the x-axis at two points.</span>
                : q.kind === 'repeated'
                  ? <span className="text-amber-800 font-bold">The discriminant is ZERO, so there is exactly one repeated real root. The parabola touches the x-axis at one point (tangent).</span>
                  : <span className="text-red-800 font-bold">The discriminant is NEGATIVE, so there are no real roots — only complex roots. The parabola does not cross the x-axis.</span>}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Step 4: Apply the Quadratic Formula</p>
            <p className="text-xs font-mono text-slate-700 mt-1">x = (−b ± √Δ) / (2a)</p>
            <p className="text-xs font-mono text-slate-700 mt-1 break-all">
              {q.kind === 'repeated' ? `x = −b / (2a) = ${fmtF(q.vertexX)}` : `x = (${fmtF({ n: -q.b.n, d: q.b.d })} ± ${sqrtDisc}) / (2 × ${fmtF(q.a)})`}
            </p>
          </div>

          {x1Row && x2Row ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-[10px] font-bold text-green-800 uppercase">Step 5: Real Roots</p>
              <p className="text-xs font-mono text-green-900 mt-1">x₁ = (−b + √Δ) / 2a = {x1Row.value}</p>
              <p className="text-xs font-mono text-green-900 mt-1">x₂ = (−b − √Δ) / 2a = {x2Row.value}</p>
              {exactRow && <p className="text-xs font-mono text-green-900 mt-1 break-all">{exactRow.value}</p>}
            </div>
          ) : xRow ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[10px] font-bold text-amber-800 uppercase">Step 5: Repeated Root</p>
              <p className="text-xs font-mono text-amber-900 mt-1">x = −b / 2a = {xRow.value}</p>
            </div>
          ) : c1Row && c2Row ? (
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
              <p className="text-[10px] font-bold text-orange-800 uppercase">Step 5: Complex Roots</p>
              <p className="text-xs font-mono text-orange-900 mt-1">x₁ = {c1Row.value}</p>
              <p className="text-xs font-mono text-orange-900 mt-1">x₂ = {c2Row.value}</p>
              {exactRow && <p className="text-xs font-mono text-orange-900 mt-1 break-all">{exactRow.value}</p>}
              <p className="text-[10px] text-orange-800 mt-1">Note: i = √(−1), the imaginary unit</p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-bold text-slate-600 uppercase">Vertex</p>
              <p className="text-xs font-bold text-slate-700 mt-1">({fmtF(q.vertexX)}, {fmtF(q.vertexY)})</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{a > 0 ? 'Minimum point (opens upward)' : 'Maximum point (opens downward)'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-bold text-slate-600 uppercase">Axis of Symmetry</p>
              <p className="text-xs font-bold text-slate-700 mt-1">x = {fmtF(q.vertexX)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
