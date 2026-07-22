import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';
import { safeEval } from '../shared/safeEval';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function LimitPanel({ values, results }: Props) {
  const expr = (values.expression || '').trim();
  const target = parseFloat(values.approachValue);
  if (!expr || isNaN(target)) return null;

  const limitRow = results.find((r) => r.id === 'limit');

  const chartData = useMemo(() => {
    const range = Math.max(Math.abs(target) + 3, 3);
    const xMin = target - range;
    const xMax = target + range;
    const steps = 100;
    const data: { x: number; y: number | null }[] = [];

    for (let i = 0; i <= steps; i++) {
      const x = parseFloat((xMin + (i / steps) * (xMax - xMin)).toFixed(6));
      // Skip exactly the limit point (might be undefined)
      if (Math.abs(x - target) < 1e-10) {
        data.push({ x, y: null });
        continue;
      }
      let y: number | null = null;
      try {
        y = safeEval(expr, { x });
        if (!isFinite(y)) y = null;
      } catch {
        y = null;
      }
      data.push({ x, y });
    }
    return data;
  }, [expr, target]);

  const limitVal = limitRow ? parseFloat(limitRow.value) : NaN;
  const hasLimit = !isNaN(limitVal) && isFinite(limitVal);
  const validPoints = chartData.filter((d) => d.y !== null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Limit Visualization
        </span>
      </div>

      <div className="p-5 space-y-4">
        {validPoints.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              f(x) as x &rarr; {target}
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} type="number" domain={['auto', 'auto']} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={(_: unknown) => [typeof _ === 'number' ? _.toFixed(6) : _, 'f(x)'] as any}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1} />
                {/* Vertical line at approach point */}
                <ReferenceLine x={target} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" label={{ value: `x = ${target}`, position: 'top', fontSize: 10, fill: '#ef4444' }} />
                {/* Limit point dot */}
                {hasLimit && (
                  <ReferenceDot x={target} y={limitVal} r={6} fill="#8b5cf6" stroke="#fff" strokeWidth={2} label={{ value: `Limit: ${limitRow!.value}`, position: 'bottom', fontSize: 10, fill: '#8b5cf6', fontWeight: 'bold' }} />
                )}
                <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2.5} dot={false} connectNulls={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-slate-400 text-center mt-1">
              The purple dot shows the limit value as x approaches {target}. The dashed red line marks x = {target}.
            </p>
          </div>
        )}

        {/* Limit result */}
        {limitRow && (
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5 text-center">
            <p className="text-sm text-slate-500 mb-1">{limitRow.label}</p>
            <p className="text-2xl font-bold text-blue-700">{limitRow.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
