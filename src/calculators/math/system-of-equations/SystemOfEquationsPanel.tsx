import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function SystemOfEquationsPanel({ values, results }: Props) {
  const a1 = parseFloat(values.a1);
  const b1 = parseFloat(values.b1);
  const c1 = parseFloat(values.c1);
  const a2 = parseFloat(values.a2);
  const b2 = parseFloat(values.b2);
  const c2 = parseFloat(values.c2);

  if ([a1, b1, c1, a2, b2, c2].some(isNaN)) return null;

  const xResult = results.find((r) => r.id === 'x');
  const yResult = results.find((r) => r.id === 'y');
  const detResult = results.find((r) => r.id === 'determinant');

  const D = a1 * b2 - a2 * b1;
  const hasUniqueSolution = D !== 0 && xResult && yResult && !isNaN(parseFloat(xResult.value));

  const solutionX = hasUniqueSolution ? parseFloat(xResult.value) : 0;
  const solutionY = hasUniqueSolution ? parseFloat(yResult.value) : 0;

  const chartData = useMemo(() => {
    // Determine a good range for x that shows the intersection
    let centerX = 0;
    let range = 5;
    if (hasUniqueSolution) {
      centerX = solutionX;
      range = Math.max(Math.abs(solutionX) + 3, Math.abs(solutionY / (b1 !== 0 ? a1 : a2)) + 3, 3);
    }

    const xMin = centerX - range;
    const xMax = centerX + range;
    const steps = 60;
    const data: { x: number; y1: number | null; y2: number | null }[] = [];

    for (let i = 0; i <= steps; i++) {
      const x = parseFloat((xMin + (i / steps) * (xMax - xMin)).toFixed(4));

      // Line 1: a1*x + b1*y = c1 → y = (c1 - a1*x) / b1
      let y1: number | null = null;
      if (b1 !== 0) {
        y1 = parseFloat(((c1 - a1 * x) / b1).toFixed(6));
      }

      // Line 2: a2*x + b2*y = c2 → y = (c2 - a2*x) / b2
      let y2: number | null = null;
      if (b2 !== 0) {
        y2 = parseFloat(((c2 - a2 * x) / b2).toFixed(6));
      }

      data.push({ x, y1, y2 });
    }
    return data;
  }, [a1, b1, c1, a2, b2, c2, hasUniqueSolution, solutionX, solutionY]);

  const hasLine1 = chartData.some((d) => d.y1 !== null);
  const hasLine2 = chartData.some((d) => d.y2 !== null);
  const showChart = hasLine1 || hasLine2;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          System of Equations Graph
        </span>
      </div>

      <div className="p-5 space-y-4">
        {showChart && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Linear System — Two Lines
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} type="number" domain={['auto', 'auto']} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1} />

                {hasLine1 && (
                  <Line type="linear" dataKey="y1" stroke="#3b82f6" strokeWidth={2.5} dot={false} name={`Line 1: ${a1}x + ${b1}y = ${c1}`} activeDot={{ r: 4 }} connectNulls />
                )}
                {hasLine2 && (
                  <Line type="linear" dataKey="y2" stroke="#f59e0b" strokeWidth={2.5} dot={false} name={`Line 2: ${a2}x + ${b2}y = ${c2}`} activeDot={{ r: 4 }} connectNulls />
                )}

                {/* Intersection point */}
                {hasUniqueSolution && (
                  <ReferenceDot x={solutionX} y={solutionY} r={6} fill="#8b5cf6" stroke="#fff" strokeWidth={2} label={{ value: `(${solutionX.toFixed(4)}, ${solutionY.toFixed(4)})`, position: 'top', fontSize: 10, fill: '#8b5cf6', fontWeight: 'bold' }} />
                )}
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-2 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-blue-500 inline-block" />
                <span className="text-slate-500">{a1}x + {b1}y = {c1}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-amber-500 inline-block" />
                <span className="text-slate-500">{a2}x + {b2}y = {c2}</span>
              </span>
            </div>
          </div>
        )}

        {/* Determinant and result */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {detResult && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{detResult.label}</p>
              <p className="text-lg font-mono font-bold text-slate-700 mt-0.5">{detResult.value}</p>
            </div>
          )}
          {hasUniqueSolution && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold text-purple-500 uppercase">Solution</p>
              <p className="text-lg font-mono font-bold text-purple-700 mt-0.5">
                ({xResult!.value}, {yResult!.value})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
