import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function NthRootPanel({ values, results }: Props) {
  const parsedN = parseInt(values.index);
  const n = isNaN(parsedN) ? 0 : parsedN;
  const parsedX = parseFloat(values.radicand);
  const x = isNaN(parsedX) ? 0 : parsedX;
  if (!n || results.length === 0) return null;

  const result = results.find(r => r.id === 'result')?.value || '';
  const radical = n === 2 ? '√' : '∛';

  const resultVal = parseFloat(result);
  const rootData = useMemo(() => {
    if (!n || isNaN(x)) return [];
    const points: { x: number; y: number }[] = [];
    const xMax = Math.max(x + 2, 5);
    const step = xMax / 80;
    for (let t = step; t <= xMax; t += step) {
      const py = Math.pow(t, 1 / n);
      if (isFinite(py)) points.push({ x: parseFloat(t.toFixed(4)), y: parseFloat(py.toFixed(4)) });
    }
    return points;
  }, [n, x]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Root Calculation</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Root function graph */}
        {rootData.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">f(t) = t<sup>1/{n}</sup></p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={rootData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} type="number" domain={['auto', 'auto']} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} type="number" domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} formatter={(_: unknown) => [(_ as number).toFixed(4), 'f(t)']} />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1} />
                {!isNaN(resultVal) && <ReferenceDot x={x} y={resultVal} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} label={{ value: `(${x}, ${result})`, position: 'top', fontSize: 9, fill: '#ef4444', fontWeight: 'bold' }} />}
                <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Result card */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Result</p>
          <p className="text-3xl font-bold font-mono text-emerald-700">
            {radical}<span className="text-lg">{n > 2 ? <sup>{n}</sup> : ''}</span>
            {x} = {result}
          </p>
        </div>

        {/* Fractional Exponent Form */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2">Fractional Exponent Form</p>
          <p className="text-lg font-mono font-bold text-blue-700 text-center">
            {x}^(1/{n}) = {result}
          </p>
        </div>

        {/* Verification */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Verification</p>
          <p className="text-sm font-mono text-slate-600 text-center">
            {result}^{n} = {Math.pow(parseFloat(result), n).toFixed(6)}
            {Math.abs(Math.pow(parseFloat(result), n) - x) < 0.001 ? ' ✓' : ''}
          </p>
        </div>

        {/* Formula reference */}
        <div className="grid grid-cols-2 gap-2 text-xs text-center">
          <div className="p-2 bg-white rounded border border-slate-200">
            <p className="text-slate-500 mb-1">Radical Form</p>
            <p className="font-mono font-bold text-slate-700">{radical}<sup>{n > 2 ? n : ''}</sup>{x}</p>
          </div>
          <div className="p-2 bg-white rounded border border-slate-200">
            <p className="text-slate-500 mb-1">Exponent Form</p>
            <p className="font-mono font-bold text-slate-700">{x}<sup>1/{n}</sup></p>
          </div>
        </div>
      </div>
    </div>
  );
}
