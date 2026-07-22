import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function LogPanel({ values, results }: Props) {
  const resultRow = results.find(r => r.id === 'result');
  const changeRow = results.find(r => r.id === 'changeOfBase');
  const expRow = results.find(r => r.id === 'exponentForm');
  const log10Row = results.find(r => r.id === 'log10');
  const lnRow = results.find(r => r.id === 'naturalLog');
  const log2Row = results.find(r => r.id === 'log2');

  if (!resultRow) return null;

  const base = parseFloat(values.base);
  const x = parseFloat(values.value);
  const result = parseFloat(resultRow.value);

  // Generate log curve
  const curveData = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    if (isNaN(base) || isNaN(x) || base <= 0 || base === 1) return points;
    const xMax = Math.max(x + 2, 5);
    const xMin = 0.01;
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const px = xMin + (i / steps) * (xMax - xMin);
      const py = Math.log(px) / Math.log(base);
      if (isFinite(py)) points.push({ x: parseFloat(px.toFixed(4)), y: parseFloat(py.toFixed(4)) });
    }
    return points;
  }, [base, x]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Logarithm Solution</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Result card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-2">{resultRow.label}</p>
          <p className="text-3xl font-bold text-blue-700">{resultRow.value}</p>
        </div>

        {/* Log curve */}
        {curveData.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Logarithmic Curve f(x) = log<sub>{base}</sub>(x)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={curveData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} type="number" domain={['auto', 'auto']} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} type="number" domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={(_: unknown) => [parseFloat((_ as number).toFixed(6)), 'log(x)']}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                <ReferenceLine x={1} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 2" />
                <ReferenceDot x={x} y={result} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} label={{ value: `(${x}, ${resultRow.value})`, position: 'top', fontSize: 10, fill: '#ef4444', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Step-by-Step Calculation</p>

          {/* Exponential form */}
          {expRow && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Exponential Form</p>
              <p className="text-xs font-mono text-slate-700 mt-1">{expRow.value}</p>
            </div>
          )}

          {/* Change of base */}
          {changeRow && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[10px] font-bold text-amber-600 uppercase">Change of Base Formula</p>
              <p className="text-xs font-mono text-amber-800 mt-1">{changeRow.value}</p>
              <p className="text-[10px] text-amber-600 mt-1">
                Use this formula when your calculator only has log₁₀ or ln buttons.
              </p>
            </div>
          )}
        </div>

        {/* Common logs */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">log₁₀</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">{log10Row?.value}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">ln (base e)</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">{lnRow?.value}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">log₂</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">{log2Row?.value}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
