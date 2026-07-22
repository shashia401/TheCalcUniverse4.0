import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export default function LawOfSinesPanel({ results }: Props) {
  const sideA = results.find(r => r.id === 'sideA');
  const sideB = results.find(r => r.id === 'sideB');
  const sideC = results.find(r => r.id === 'sideC');
  const angleA = results.find(r => r.id === 'angleA');
  const angleB = results.find(r => r.id === 'angleB');
  const angleC = results.find(r => r.id === 'angleC');
  const ratio = results.find(r => r.id === 'ratio');
  const circumradius = results.find(r => r.id === 'circumradius');

  if (!sideA || !sideB || !sideC || !angleA || !angleB || !angleC) return null;

  const chartData = useMemo(() => [
    { name: 'Side a', value: parseFloat(sideA.value) || 0 },
    { name: 'Side b', value: parseFloat(sideB.value) || 0 },
    { name: 'Side c', value: parseFloat(sideC.value) || 0 },
  ], [sideA.value, sideB.value, sideC.value]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Triangle Solution
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Side lengths bar chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Side Lengths</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                formatter={(_: unknown) => [parseFloat((_ as number).toFixed(4)), 'Length']}
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={60}>
                {chartData.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Side-angle info cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
            <p className="text-[10px] font-bold text-blue-500 uppercase">a / sin A</p>
            <p className="text-sm font-mono font-bold text-blue-700">{sideA.value}</p>
            <p className="text-[10px] text-blue-400">∠A = {angleA.value}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-bold text-emerald-500 uppercase">b / sin B</p>
            <p className="text-sm font-mono font-bold text-emerald-700">{sideB.value}</p>
            <p className="text-[10px] text-emerald-400">∠B = {angleB.value}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
            <p className="text-[10px] font-bold text-amber-500 uppercase">c / sin C</p>
            <p className="text-sm font-mono font-bold text-amber-700">{sideC.value}</p>
            <p className="text-[10px] text-amber-400">∠C = {angleC.value}</p>
          </div>
        </div>

        {/* Ratio and circumradius */}
        <div className="grid grid-cols-2 gap-2">
          {ratio && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-center">
              <p className="text-[10px] font-bold text-purple-500 uppercase">Ratio a/sin(A)</p>
              <p className="text-sm font-mono font-bold text-purple-700">{ratio.value}</p>
            </div>
          )}
          {circumradius && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-center">
              <p className="text-[10px] font-bold text-purple-500 uppercase">Circumradius R</p>
              <p className="text-sm font-mono font-bold text-purple-700">{circumradius.value}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
