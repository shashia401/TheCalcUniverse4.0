import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];

export default function AveragePanel({ results }: Props) {
  if (results.length === 0) return null;

  const dataStr = results.find(r => r.id === 'dataStr')?.value || '';
  const data = dataStr.split(', ').map(Number).filter(n => !isNaN(n));
  const mean = results.find(r => r.id === 'mean');
  const median = results.find(r => r.id === 'median');

  const chartData = useMemo(() =>
    data.map((v, i) => ({ label: `#${i + 1}`, value: v })),
    [data.join(',')]
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Summary Statistics</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Data chips */}
        {data.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Parsed Data</p>
            <div className="flex flex-wrap gap-1.5">
              {data.map((v, i) => (
                <span key={`item-${i}`} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white text-slate-700 border border-slate-200">
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bar chart */}
        {chartData.length > 1 && mean && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Data Distribution</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={(_: unknown) => [_, 'Value'] as any}
                />
                <ReferenceLine y={parseFloat(mean.value)} stroke="#ef4444" strokeDasharray="5 3" label={{ value: `Mean: ${mean.value}`, position: 'insideTopRight', fontSize: 10, fill: '#ef4444', fontWeight: 'bold' }} />
                {median && (
                  <ReferenceLine y={parseFloat(median.value)} stroke="#3b82f6" strokeDasharray="5 3" label={{ value: `Median: ${median.value}`, position: 'insideBottomRight', fontSize: 10, fill: '#3b82f6', fontWeight: 'bold' }} />
                )}
                <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={32}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-4 text-center">
            <p className="text-[10px] font-bold text-emerald-500 uppercase">Mean</p>
            <p className="text-lg font-bold font-mono text-emerald-700">{results.find(r => r.id === 'mean')?.value}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
            <p className="text-[10px] font-bold text-blue-500 uppercase">Median</p>
            <p className="text-lg font-bold font-mono text-blue-700">{results.find(r => r.id === 'median')?.value}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Count</p>
            <p className="text-lg font-bold font-mono text-slate-700">{results.find(r => r.id === 'count')?.value}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Sum</p>
            <p className="text-lg font-bold font-mono text-slate-700">{results.find(r => r.id === 'sum')?.value}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Minimum</p>
            <p className="text-lg font-bold font-mono text-slate-700">{results.find(r => r.id === 'min')?.value}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Maximum</p>
            <p className="text-lg font-bold font-mono text-slate-700">{results.find(r => r.id === 'max')?.value}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
