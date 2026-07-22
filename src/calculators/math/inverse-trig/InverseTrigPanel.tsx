import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, ReferenceDot,
} from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function InverseTrigPanel({ values, results }: Props) {
  const degrees = results.find(r => r.id === 'degrees');
  const radians = results.find(r => r.id === 'radians');
  const principalValue = results.find(r => r.id === 'principalValue');
  const domainCheck = results.find(r => r.id === 'domainCheck');
  const domainError = results.find(r => r.id === 'domainError');

  if (domainError) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Domain Error</span>
        </div>
        <div className="p-5">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{domainError.value}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!degrees || !radians || !principalValue) return null;

  const funcName = values.function || 'arcsin';
  const inputVal = parseFloat(values.value);
  if (isNaN(inputVal)) return null;

  // Generate curve data for the selected trig function
  const curveData = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    let domainStart: number, domainEnd: number;
    let fn: (v: number) => number;

    if (funcName === 'arcsin' || funcName === 'arccos') {
      domainStart = -1;
      domainEnd = 1;
      fn = funcName === 'arcsin' ? Math.asin : Math.acos;
    } else {
      domainStart = -4;
      domainEnd = 4;
      fn = Math.atan;
    }

    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const x = domainStart + (i / steps) * (domainEnd - domainStart);
      const y = fn(x);
      if (isFinite(y)) {
        points.push({
          x: parseFloat(x.toFixed(4)),
          y: parseFloat(y.toFixed(4)),
        });
      }
    }
    return points;
  }, [funcName]);

  const degVal = parseFloat(degrees.value);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          {funcName.toUpperCase()} — Inverse Trig
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Result card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-1">
            {funcName}({values.value})
          </p>
          <p className="text-3xl font-bold text-blue-700 font-mono">
            {degrees.value}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {radians.value} rad
          </p>
        </div>

        {/* Function curve chart */}
        {curveData.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              f(x) = {funcName}(x)
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={curveData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="x"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  type="number"
                  domain={['auto', 'auto']}
                  label={{ value: 'x', position: 'insideBottomRight', offset: -6, fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  type="number"
                  domain={['auto', 'auto']}
                  label={{ value: 'y', position: 'insideTopLeft', offset: -2, fontSize: 10, fill: '#94a3b8', angle: -90 }}
                />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={(_: unknown) => [parseFloat((_ as number).toFixed(4)), `${funcName}(x)`]}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1} />
                <ReferenceDot
                  x={inputVal}
                  y={degVal * (Math.PI / 180)}
                  r={6}
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth={2}
                  label={{
                    value: `(${inputVal}, ${parseFloat(degrees.value)})`,
                    position: 'top',
                    fontSize: 10,
                    fill: '#ef4444',
                    fontWeight: 'bold',
                  }}
                />
                <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Principal Value</p>
            <p className="text-sm font-mono font-bold text-slate-700">{principalValue.value}</p>
          </div>
          {domainCheck && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Domain</p>
              <p className="text-xs font-mono text-slate-700">{domainCheck.value}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
