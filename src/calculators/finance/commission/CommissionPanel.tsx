import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#14b8a6'];

export default function CommissionPanel({ results }: Props) {
  const tableRow = results.find(r => r.id === 'commTable');
  const netRow = results.find(r => r.id === 'net');

  if (!tableRow || !netRow) return null;

  // Parse the commission table from the results text
  const chartData = useMemo(() => {
    const lines = tableRow.value.split('\n').filter(l => l.includes('→'));
    const effectiveRateMatch = tableRow.value.match(/([\d.]+)%/);
    const effectiveRate = effectiveRateMatch ? parseFloat(effectiveRateMatch[1]) : 0;

    return lines.map((line, i) => {
      const match = line.match(/\$([\d,]+)\s*→\s*\$([\d,]+)/);
      if (!match) return null;
      const volume = parseFloat(match[1].replace(/,/g, ''));
      const commission = parseFloat(match[2].replace(/,/g, ''));
      return {
        label: `$${(volume / 1000).toFixed(0)}K`,
        volume,
        commission,
        rate: effectiveRate,
      };
    }).filter((d): d is NonNullable<typeof d> => d !== null);
  }, [tableRow.value]);

  if (chartData.length === 0) return null;

  const formatCurrency = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Earnings by Volume
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-4 text-center">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{netRow.label}</p>
          <p className="text-2xl font-bold text-emerald-700 font-mono">{netRow.value}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            Commission at Different Volume Levels
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={60}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
                formatter={(_: unknown) => [`$${formatCurrency(_ as number)}`, 'Commission']}
                labelFormatter={(label) => `Sale: ${label}`}
              />
              <Bar dataKey="commission" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            Hover bars to see exact commission at each volume level
          </p>
        </div>

        {/* Volume earnings table */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Volume Breakdown
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {chartData.map((d, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 px-2 py-1.5 text-center">
                <p className="text-[10px] font-bold text-slate-500">{d.label}</p>
                <p className="text-xs font-mono font-bold text-emerald-700">${formatCurrency(d.commission)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
