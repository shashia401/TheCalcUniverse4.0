import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];

export default function MeanMedianModePanel({ results }: Props) {
  const sortedRow = results.find(r => r.id === 'sortedData');
  const meanRow = results.find(r => r.id === 'mean');
  const medianRow = results.find(r => r.id === 'median');
  const medianDetail = results.find(r => r.id === 'medianDetail');
  const dataCount = results.find(r => r.id === 'dataCount');
  const rangeRow = results.find(r => r.id === 'range');
  const modeRow = results.find(r => r.id === 'mode');
  const sumRow = results.find(r => r.id === 'sum');

  if (!sortedRow || !medianRow || !dataCount) return null;

  const sortedValues = sortedRow.value.split(', ').map(Number);
  const count = parseInt(dataCount.value);
  const isEven = count % 2 === 0;
  const mid = Math.floor(count / 2);

  const chartData = useMemo(() =>
    sortedValues.map((v, i) => ({ label: `${i + 1}`, value: v })),
    [sortedValues.join(',')]
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Sorted Data &amp; Median Calculation</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Bar chart */}
        {chartData.length > 1 && meanRow && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Data Distribution</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} label={{ value: 'Position (sorted)', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={(_: unknown) => [_, 'Value'] as any}
                />
                <ReferenceLine y={parseFloat(meanRow.value)} stroke="#ef4444" strokeDasharray="5 3" label={{ value: `Mean: ${meanRow.value}`, position: 'insideTopRight', fontSize: 10, fill: '#ef4444', fontWeight: 'bold' }} />
                <ReferenceLine y={parseFloat(medianRow.value)} stroke="#3b82f6" strokeDasharray="5 3" label={{ value: `Median: ${medianRow.value}`, position: 'insideBottomRight', fontSize: 10, fill: '#3b82f6', fontWeight: 'bold' }} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={32}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Sorted data visualization */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Sorted Data ({count} values)
          </p>
          <div className="flex flex-wrap gap-1">
            {sortedValues.map((val, i) => {
              const isMiddle = isEven
                ? (i === mid - 1 || i === mid)
                : i === mid;
              return (
                <span
                  key={`item-${i}`}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                    isMiddle
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {val}
                </span>
              );
            })}
          </div>
        </div>

        {/* Median bracket for even datasets */}
        {isEven && medianDetail && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2">
              Median Calculation (Even Dataset)
            </p>
            <div className="flex items-center justify-center gap-3 text-sm font-mono">
              <span className="px-3 py-1.5 bg-white rounded border border-blue-300 font-bold text-blue-700">
                {sortedValues[mid - 1]}
              </span>
              <span className="text-blue-400 text-lg">+</span>
              <span className="px-3 py-1.5 bg-white rounded border border-blue-300 font-bold text-blue-700">
                {sortedValues[mid]}
              </span>
              <span className="text-blue-400 text-lg">/ 2 =</span>
              <span className="px-3 py-1.5 bg-blue-600 text-white rounded font-bold">
                {medianRow.value}
              </span>
            </div>
            <p className="text-xs text-blue-600 text-center mt-2">
              With an even number of values, take the average of the two middle numbers
            </p>
          </div>
        )}

        {/* Odd dataset median highlight */}
        {!isEven && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">
              Median (Odd Dataset)
            </p>
            <p className="text-sm font-mono font-bold text-emerald-700">
              The middle value at position {mid + 1} of {count}: <span className="text-lg">{medianRow.value}</span>
            </p>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {meanRow && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-emerald-600 uppercase">Mean</p>
              <p className="text-sm font-bold font-mono text-emerald-700">{meanRow.value}</p>
            </div>
          )}
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-blue-600 uppercase">Median</p>
            <p className="text-sm font-bold font-mono text-blue-700">{medianRow.value}</p>
          </div>
          {modeRow && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-purple-600 uppercase">Mode</p>
              <p className="text-sm font-bold font-mono text-purple-700 truncate" title={modeRow.value}>{modeRow.value}</p>
            </div>
          )}
          {rangeRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Range</p>
              <p className="text-sm font-bold font-mono text-slate-700">{rangeRow.value}</p>
            </div>
          )}
          {sumRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Sum</p>
              <p className="text-sm font-bold font-mono text-slate-700">{sumRow.value}</p>
            </div>
          )}
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Count</p>
            <p className="text-sm font-bold font-mono text-slate-700">{count}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
