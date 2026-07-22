import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { safeEval } from '../shared/safeEval';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function IntegralPanel({ values, results }: Props) {
  const expr = (values.expression || '').trim();
  const a = parseFloat(values.lowerBound);
  const b = parseFloat(values.upperBound);
  if (!expr || isNaN(a) || isNaN(b) || a === b) return null;

  const resultRow = results.find((r) => r.id === 'result');

  const chartData = useMemo(() => {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const steps = 120;
    const data: { x: number; y: number | null }[] = [];

    for (let i = 0; i <= steps; i++) {
      const x = parseFloat((lo + (i / steps) * (hi - lo)).toFixed(6));
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
  }, [expr, a, b]);

  const validPoints = chartData.filter((d) => d.y !== null);
  const allPositive = validPoints.length > 0 && validPoints.every((d) => d.y! >= -1e-10);
  const yDomainMin = allPositive ? 0 : 'auto' as const;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Area Under the Curve
        </span>
      </div>

      <div className="p-5 space-y-4">
        {validPoints.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              f(x) from x = {Math.min(a, b).toFixed(4)} to x = {Math.max(a, b).toFixed(4)}
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} type="number" domain={['auto', 'auto']} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} domain={[yDomainMin, 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={(_: unknown) => [typeof _ === 'number' ? _.toFixed(6) : _, 'f(x)'] as any}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                <ReferenceLine x={Math.min(a, b)} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" label={{ value: 'a', position: 'top', fontSize: 10, fill: '#ef4444' }} />
                <ReferenceLine x={Math.max(a, b)} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" label={{ value: 'b', position: 'top', fontSize: 10, fill: '#ef4444' }} />
                <Area type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2.5} fill="#3b82f6" fillOpacity={0.15} dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Result */}
        {resultRow && (
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5 text-center">
            <p className="text-sm text-slate-500 mb-1">{resultRow.label}</p>
            <p className="text-2xl font-bold text-blue-700 font-mono">{resultRow.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
