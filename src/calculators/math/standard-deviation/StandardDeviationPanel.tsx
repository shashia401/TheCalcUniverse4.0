import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];

export default function StandardDeviationPanel({ values }: Props) {
  const raw = values.dataSet || '';
  const dataType = values.population || 'sample';
  const dataTypeLabel = dataType === 'sample' ? 'Sample (n−1)' : 'Population (N)';

  const nums = raw.split(/[,\s]+/).filter(s => s.trim() !== '').map(Number).filter(n => !isNaN(n));
  if (nums.length < 2) return null;

  const n = nums.length;
  const mean = nums.reduce((a, b) => a + b, 0) / n;
  const sorted = [...nums].sort((a, b) => a - b);
  const sumSquaredDiffs = nums.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0);
  const variance = dataType === 'sample' ? sumSquaredDiffs / (n - 1) : sumSquaredDiffs / n;
  const stdDev = Math.sqrt(variance);
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
  const min = sorted[0];
  const max = sorted[n - 1];
  const cvPct = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

  const chartData = useMemo(() =>
    nums.map((v, i) => ({ label: `#${i + 1}`, value: v })),
    [nums.join(',')]
  );
  const mode = [...nums.filter((v, i, a) => a.indexOf(v) !== i).reduce((acc, v) => {
    acc.set(v, (acc.get(v) || 0) + 1);
    return acc;
  }, new Map<number, number>())].sort((a, b) => b[1] - a[1]);

  const deviation = (x: number) => x - mean;
  const squaredDev = (x: number) => Math.pow(x - mean, 2);

  const fmt = (x: number) => parseFloat(x.toFixed(6)).toString();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Full Statistical Breakdown</span>
        <span className="ml-auto text-[10px] font-bold text-slate-500">{dataTypeLabel} · n = {n}</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Distribution chart */}
        {chartData.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Data Distribution with Standard Deviation</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={(_: unknown) => [_, 'Value'] as any}
                />
                <ReferenceLine y={mean} stroke="#ef4444" strokeWidth={2} label={{ value: `Mean: ${mean.toFixed(2)}`, position: 'insideTopRight', fontSize: 10, fill: '#ef4444', fontWeight: 'bold' }} />
                <ReferenceLine y={mean + stdDev} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: `+1σ: ${(mean + stdDev).toFixed(2)}`, position: 'insideTop', fontSize: 9, fill: '#f59e0b' }} />
                <ReferenceLine y={mean - stdDev} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: `−1σ: ${(mean - stdDev).toFixed(2)}`, position: 'insideBottom', fontSize: 9, fill: '#f59e0b' }} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={28}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Step 1: Data sorted */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Data Set (sorted)</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {sorted.map((v, i) => (
              <span key={`item-${i}`} className="inline-block px-2 py-0.5 bg-white rounded border border-slate-200 text-xs font-mono text-slate-700">
                {fmt(v)}
              </span>
            ))}
          </div>
        </div>

        {/* Step 2: Mean */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Step 1: Calculate the Mean (x̄)</p>
          <p className="text-xs font-mono text-slate-700 mt-1">
            x̄ = ({nums.map(v => fmt(v)).join(' + ')}) ÷ {n}= {fmt(mean)}
          </p>
        </div>

        {/* Step 3: Deviation table */}
        {nums.length <= 20 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Step 2: Deviations &amp; Squared Deviations</p>
            <p className="text-[10px] text-slate-500 mt-1 mb-2">Table of (xᵢ − x̄) and (xᵢ − x̄)²</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
                    <th scope="col" className="text-left py-1 pr-2">i</th>
                    <th scope="col" className="text-right px-2">xᵢ</th>
                    <th scope="col" className="text-right px-2">xᵢ − x̄</th>
                    <th scope="col" className="text-right px-2">(xᵢ − x̄)²</th>
                  </tr>
                </thead>
                <tbody>
                  {nums.map((v, i) => (
                    <tr key={`item-${i}`} className="border-b border-slate-100 text-slate-700">
                      <td className="text-slate-500 py-1 pr-2">{i + 1}</td>
                      <td className="text-right px-2">{fmt(v)}</td>
                      <td className="text-right px-2">{deviation(v) >= 0 ? ' ' : ''}{fmt(deviation(v))}</td>
                      <td className="text-right px-2 font-bold text-blue-700">{fmt(squaredDev(v))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-300 font-bold text-slate-800">
                    <td className="py-1 pr-2" colSpan={2}>Sum</td>
                    <td className="text-right px-2">{fmt(nums.reduce((a, v) => a + deviation(v), 0))}</td>
                    <td className="text-right px-2 text-blue-700">{fmt(sumSquaredDiffs)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Step 2: Sum of Squared Deviations</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              Σ(xᵢ − x̄)² = {fmt(sumSquaredDiffs)}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">(Too many data points to show individually — summary above)</p>
          </div>
        )}

        {/* Step 4: Variance */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Step 3: Variance</p>
          <p className="text-xs font-mono text-slate-700 mt-1">
            σ² = {fmt(sumSquaredDiffs)} ÷ {dataType === 'sample' ? `(n − 1)` : 'n'}
            {' '}= {fmt(sumSquaredDiffs)} ÷ {dataType === 'sample' ? (n - 1) : n} = {fmt(variance)}
          </p>
        </div>

        {/* Step 5: SD */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-[10px] font-bold text-blue-500 uppercase">Step 4: Standard Deviation</p>
          <p className="text-sm font-bold text-blue-700 mt-1">
            σ (or s) = √({fmt(variance)}) = {fmt(stdDev)}
          </p>
        </div>

        {/* Summary statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Mean</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">{fmt(mean)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Median</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">{fmt(median)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Min / Max</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">{fmt(min)} / {fmt(max)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">CV</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">{cvPct.toFixed(2)}%</p>
          </div>
        </div>

        {/* Mode indicator */}
        {mode.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Mode{mode.length > 1 ? 's (multimodal)' : ''}
            </p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              {mode.slice(0, 3).map(([v, c]) => `${fmt(v)} (×${c})`).join(', ')}
              {mode.length > 3 ? ` +${mode.length - 3} more` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
