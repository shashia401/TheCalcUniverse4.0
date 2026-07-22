import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function DistancePanel({ values, results }: Props) {
  const distance = results.find(r => r.id === 'distance');
  const formula = results.find(r => r.id === 'formula');
  const steps = results.find(r => r.id === 'steps');
  const midpoint = results.find(r => r.id === 'midpoint');
  const slope = results.find(r => r.id === 'slope');

  if (!distance || !formula) return null;

  const x1 = parseFloat(values.x1 || values.x1_1 || '0');
  const y1 = parseFloat(values.y1 || values.y1_1 || '0');
  const x2 = parseFloat(values.x2 || values.x2_1 || '0');
  const y2 = parseFloat(values.y2 || values.y2_1 || '0');

  const dim = parseFloat(values.dim || '2');
  const hasCoords = ![x1, y1, x2, y2].some(isNaN) && dim >= 2;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Distance Formula &amp; Steps
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Result */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-1">{distance.label}</p>
          <p className="text-3xl font-bold text-blue-700 font-mono">{distance.value}</p>
        </div>

        {/* 2D line segment visualization */}
        {hasCoords && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Line Segment</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={[{ x: 0, y: 0 }, { x: x1, y: y1 }, { x: x2, y: y2 }].filter(p => isFinite(p.x) && isFinite(p.y))} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} type="number" domain={['auto', 'auto']} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} type="number" domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="linear" dataKey="y" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={false} isAnimationActive={false} />
                <ReferenceDot x={x1} y={y1} r={6} fill="#ef4444" stroke="#fff" strokeWidth={2} label={{ value: `(${x1}, ${y1})`, position: 'top', fontSize: 10, fill: '#ef4444', fontWeight: 'bold' }} />
                <ReferenceDot x={x2} y={y2} r={6} fill="#10b981" stroke="#fff" strokeWidth={2} label={{ value: `(${x2}, ${y2})`, position: 'top', fontSize: 10, fill: '#10b981', fontWeight: 'bold' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Formula */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Distance Formula</p>
          <p className="text-sm font-mono text-slate-700">{formula.value}</p>
        </div>

        {/* Step-by-step */}
        {steps && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Calculation Steps</p>
            <p className="text-sm font-mono text-blue-700 whitespace-pre-wrap">{steps.value}</p>
          </div>
        )}

        {/* Additional info */}
        <div className="grid grid-cols-2 gap-2">
          {midpoint && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Midpoint</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{midpoint.value}</p>
            </div>
          )}
          {slope && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Slope</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{slope.value}</p>
            </div>
          )}
        </div>

        {/* 1D/2D/3D Reference */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Dimension Reference
          </p>
          <div className="grid grid-cols-3 gap-2 text-[11px] text-center">
            <div className="p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">1D</p>
              <p className="text-slate-500 font-mono">d = |x₂−x₁|</p>
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">2D</p>
              <p className="text-slate-500 font-mono">d = √(Δx²+Δy²)</p>
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">3D</p>
              <p className="text-slate-500 font-mono">d = √(Δx²+Δy²+Δz²)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
