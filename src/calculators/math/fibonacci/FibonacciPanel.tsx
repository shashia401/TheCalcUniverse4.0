import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];

export default function FibonacciPanel({ results }: Props) {
  const nthTerm = results.find(r => r.id === 'nthTerm');
  const seqRow = results.find(r => r.id === 'sequence');
  const sumRow = results.find(r => r.id === 'sum');
  const binetRow = results.find(r => r.id === 'binetApproximation');

  if (!seqRow || !nthTerm) return null;

  const seq = seqRow.value.split(', ').map(Number);

  const chartData = useMemo(() =>
    seq.map((v, i) => ({ label: `${i + 1}`, value: v })),
    [seq.join(',')]
  );

  const maxVal = Math.max(...seq);
  const yTicks = maxVal > 10
    ? [0, Math.round(maxVal / 4), Math.round(maxVal / 2), Math.round((3 * maxVal) / 4), maxVal]
    : undefined;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Fibonacci Sequence Growth</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Result card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-1">{nthTerm.label}</p>
          <p className="text-3xl font-bold text-blue-700 font-mono">{nthTerm.value}</p>
        </div>

        {/* Bar chart */}
        {chartData.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Sequence Growth</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  label={{ value: 'n', position: 'insideBottomRight', offset: -8, fontSize: 10, fill: '#94a3b8' }}
                  interval={Math.max(1, Math.floor(chartData.length / 15))}
                />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} ticks={yTicks} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={(_: unknown) => [(_ as any).toLocaleString(), 'F(n)'] as any}
                  labelFormatter={(l) => `n = ${l}`}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={chartData.length > 50 ? 8 : 24}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-emerald-600 uppercase">Max Value</p>
            <p className="text-sm font-bold font-mono text-emerald-700">{nthTerm.value}</p>
          </div>
          {sumRow && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-blue-600 uppercase">Sum of Terms</p>
              <p className="text-sm font-bold font-mono text-blue-700">{parseInt(sumRow.value).toLocaleString()}</p>
            </div>
          )}
          {binetRow && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-purple-600 uppercase">Binet's Approx</p>
              <p className="text-sm font-bold font-mono text-purple-700">{binetRow.value}</p>
            </div>
          )}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-amber-600 uppercase">Terms</p>
            <p className="text-sm font-bold font-mono text-amber-700">{seq.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
