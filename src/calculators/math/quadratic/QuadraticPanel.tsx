import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function QuadraticPanel({ values, results }: Props) {
  const a = parseFloat(values.a);
  const b = parseFloat(values.b);
  const c = parseFloat(values.c);
  if ([a, b, c].some(isNaN) || a === 0) return null;

  const equationRow = results.find(r => r.id === 'equation');
  const vertexRow = results.find(r => r.id === 'vertex');
  const axisRow = results.find(r => r.id === 'axis');
  const x1Row = results.find(r => r.id === 'x1');
  const x2Row = results.find(r => r.id === 'x2');
  const xRow = results.find(r => r.id === 'x');
  const c1Row = results.find(r => r.id === 'complex1');
  const c2Row = results.find(r => r.id === 'complex2');

  if (!equationRow) return null;

  const discriminant = b * b - 4 * a * c;
  const fmt = (n: number) => parseFloat(n.toFixed(6)).toString();
  const hasRealRoots = discriminant >= 0;

  // Generate parabola points
  const vertexX = -b / (2 * a);
  const vertexY = a * vertexX * vertexX + b * vertexX + c;
  const parabolaData = useMemo(() => {
    const range = Math.max(Math.abs(discriminant > 0 ? (-b + Math.sqrt(discriminant)) / (2 * a) : vertexX + 2), Math.abs(vertexX) + 2, 3);
    const xMin = vertexX - range - 1;
    const xMax = vertexX + range + 1;
    const points: { x: number; y: number }[] = [];
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const px = xMin + (i / steps) * (xMax - xMin);
      const py = a * px * px + b * px + c;
      points.push({ x: parseFloat(px.toFixed(4)), y: parseFloat(py.toFixed(4)) });
    }
    return points;
  }, [a, b, c, discriminant, vertexX]);

  const root1 = hasRealRoots && discriminant > 0 ? (-b + Math.sqrt(discriminant)) / (2 * a) : null;
  const root2 = hasRealRoots && discriminant > 0 ? (-b - Math.sqrt(discriminant)) / (2 * a) : null;
  const repeatedRoot = hasRealRoots && discriminant === 0 ? vertexX : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Step-by-Step Solution</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Equation card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-2">Equation</p>
          <p className="text-xl font-bold text-blue-700 font-mono">{equationRow.value}</p>
        </div>

        {/* Dynamic parabola chart */}
        {parabolaData.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Parabola f(x) = ax² + bx + c</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={parabolaData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} type="number" domain={['auto', 'auto']} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} type="number" domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={(_: unknown) => [parseFloat((_ as number).toFixed(6)), 'f(x)']}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1} />
                {/* Roots */}
                {root1 !== null && <ReferenceDot x={root1} y={0} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} label={{ value: `x₁=${fmt(root1)}`, position: 'bottom', fontSize: 9, fill: '#ef4444' }} />}
                {root2 !== null && <ReferenceDot x={root2} y={0} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} label={{ value: `x₂=${fmt(root2)}`, position: 'bottom', fontSize: 9, fill: '#ef4444' }} />}
                {repeatedRoot !== null && <ReferenceDot x={repeatedRoot} y={0} r={5} fill="#f59e0b" stroke="#fff" strokeWidth={2} label={{ value: `x=${fmt(repeatedRoot)}`, position: 'bottom', fontSize: 9, fill: '#f59e0b' }} />}
                {/* Vertex */}
                <ReferenceDot x={vertexX} y={vertexY} r={5} fill="#8b5cf6" stroke="#fff" strokeWidth={2} label={{ value: `Vertex (${fmt(vertexX)}, ${fmt(vertexY)})`, position: 'top', fontSize: 9, fill: '#8b5cf6' }} />
                {/* Axis of symmetry */}
                <ReferenceLine x={vertexX} stroke="#22c55e" strokeDasharray="4 2" label={{ value: 'Axis', position: 'insideTopRight', fontSize: 9, fill: '#22c55e' }} />
                <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Step-by-Step Solution</p>

          {/* Step 1: Identify coefficients */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Step 1: Identify Coefficients</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              a = {fmt(a)}, b = {fmt(b)}, c = {fmt(c)}
            </p>
          </div>

          {/* Step 2: Discriminant */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Step 2: Calculate the Discriminant</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              Δ = b² − 4ac = {fmt(b)}² − 4({fmt(a)})({fmt(c)})
            </p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              Δ = {fmt(b * b)} − {fmt(4 * a * c)} = {fmt(discriminant)}
            </p>
          </div>

          {/* Step 3: Discriminant meaning */}
          <div className={`rounded-lg border px-4 py-3 ${
            discriminant > 0 ? 'border-blue-200 bg-blue-50' :
            discriminant === 0 ? 'border-amber-200 bg-amber-50' :
            'border-orange-200 bg-orange-50'
          }`}>
            <p className="text-[10px] font-bold uppercase">Step 3: Interpret the Discriminant</p>
            <p className="text-xs mt-1">
              Δ = {fmt(discriminant)}
              {' — '}
              {discriminant > 0
                ? <span className="text-green-700 font-bold">The discriminant is POSITIVE, so there are two distinct real roots. The parabola crosses the x-axis at two points.</span>
                : discriminant === 0
                  ? <span className="text-amber-700 font-bold">The discriminant is ZERO, so there is exactly one repeated real root. The parabola touches the x-axis at one point (tangent).</span>
                  : <span className="text-red-700 font-bold">The discriminant is NEGATIVE, so there are no real roots — only complex roots. The parabola does not cross the x-axis.</span>
              }
            </p>
          </div>

          {/* Step 4: Quadratic formula */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Step 4: Apply the Quadratic Formula</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              x = (−b ± √Δ) / (2a)
            </p>
            <p className="text-xs font-mono text-slate-600 mt-1">
              {hasRealRoots
                ? `x = (${fmt(-b)} ± √${fmt(discriminant)}) / (2 × ${fmt(a)})`
                : `x = (${fmt(-b)} ± i√${fmt(-discriminant)}) / (2 × ${fmt(a)})`}
            </p>
          </div>

          {/* Step 5: Roots */}
          {(x1Row && x2Row) ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-[10px] font-bold text-green-600 uppercase">Step 5: Real Roots</p>
              <p className="text-xs font-mono text-green-800 mt-1">
                x₁ = (−{fmt(b)} + √{fmt(discriminant)}) / {fmt(2 * a)} = {x1Row.value}
              </p>
              <p className="text-xs font-mono text-green-800 mt-1">
                x₂ = (−{fmt(b)} − √{fmt(discriminant)}) / {fmt(2 * a)} = {x2Row.value}
              </p>
            </div>
          ) : xRow ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[10px] font-bold text-amber-600 uppercase">Step 5: Repeated Root</p>
              <p className="text-xs font-mono text-amber-800 mt-1">
                x = −{fmt(b)} / {fmt(2 * a)} = {xRow.value}
              </p>
            </div>
          ) : (c1Row && c2Row) ? (
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
              <p className="text-[10px] font-bold text-orange-600 uppercase">Step 5: Complex Roots</p>
              <p className="text-xs font-mono text-orange-800 mt-1">
                x₁ = {c1Row.value}
              </p>
              <p className="text-xs font-mono text-orange-800 mt-1">
                x₂ = {c2Row.value}
              </p>
              <p className="text-[10px] text-orange-600 mt-1">
                Note: i = √(−1), the imaginary unit
              </p>
            </div>
          ) : null}

          {/* Vertex & Axis */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Vertex</p>
              <p className="text-xs font-bold text-slate-700 mt-1">{vertexRow?.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {a > 0 ? 'Minimum point (opens upward)' : 'Maximum point (opens downward)'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Axis of Symmetry</p>
              <p className="text-xs font-bold text-slate-700 mt-1">{axisRow?.value}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
