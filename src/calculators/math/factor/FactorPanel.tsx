import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];

export default function FactorPanel({ values, results }: Props) {
  const pairsData = results.find(r => r.id === '_pairsData')?.value;
  let pairs: [number, number][] = [];
  try {
    if (pairsData) pairs = JSON.parse(pairsData);
  } catch { /* ignore */ }

  const n = parseInt(values.number) || 0;
  if (!n || results.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Factor Pairs Table</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Factor Pairs Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th scope="col" className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Factor Pair</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Multiplication</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Result</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map(([a, b], i) => (
                <tr key={`item-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-2 font-mono font-bold text-slate-700">{a}, {b}</td>
                  <td className="px-4 py-2 font-mono text-slate-600">{a} × {b}</td>
                  <td className="px-4 py-2 font-mono text-emerald-600 font-bold">= {a * b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Factor pairs bar chart */}
        {pairs.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Factor Pairs Visual</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={pairs.map(([a, b], i) => ({
                  name: `${a} × ${b}`,
                  a,
                  b,
                  index: i,
                }))}
                margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={((_: unknown, name: string) => [(_ as number).toLocaleString(), name]) as any}
                />
                <Bar dataKey="a" name="Factor 1" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={40} stackId="stack" />
                <Bar dataKey="b" name="Factor 2" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={40} stackId="stack" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-slate-400 mt-1 text-center">Each bar shows the two factors stacked; their total equals n = {n}</p>
          </div>
        )}

        {/* All factors */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">All Factors of {n}</p>
          <div className="flex flex-wrap gap-1.5">
            {pairs.flatMap(([a, b]) => a === b ? [a] : [a, b]).sort((a, b) => a - b).map((f, i) => (
              <span key={`item-${i}`} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-blue-100 text-blue-700">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Total Factors</p>
            <p className="text-lg font-bold font-mono text-slate-700">{results.find(r => r.id === 'count')?.value}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Sum of Factors</p>
            <p className="text-lg font-bold font-mono text-slate-700">{results.find(r => r.id === 'sum')?.value}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
