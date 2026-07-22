import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { LineChart, Line } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];

export default function SeriesPanel({ results }: Props) {
  const sum = results.find(r => r.id === 'sum');
  const terms = results.find(r => r.id === 'terms');
  const termCount = results.find(r => r.id === 'termCount');
  const lastTerm = results.find(r => r.id === 'lastTerm');

  if (!sum || !terms) return null;

  const termValues = terms.value.split(', ').map(Number).filter(n => !isNaN(n));
  const cumulative = useMemo(() => {
    let running = 0;
    return termValues.map((v, i) => {
      running += v;
      return { term: i + 1, value: v, cumulative: running };
    });
  }, [terms.value]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Series Sum Results
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Sum */}
        <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-1">{sum.label}</p>
          <p className="text-3xl font-bold text-emerald-700 font-mono">{sum.value}</p>
        </div>

        {/* Term values bar chart */}
        {cumulative.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Term Values</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={cumulative} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="term" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} label={{ value: 'Term', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={(_: unknown) => [parseFloat((_ as number).toFixed(6)), 'Value']}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={24}>
                  {cumulative.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Cumulative sum line chart */}
        {cumulative.length > 2 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Cumulative Sum</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={cumulative} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <XAxis dataKey="term" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} label={{ value: 'Term', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={(_: unknown) => [parseFloat((_ as number).toFixed(6)), 'Cumulative Sum']}
                />
                <ReferenceLine y={parseFloat(sum.value)} stroke="#10b981" strokeDasharray="4 2" label={{ value: `Total: ${sum.value}`, position: 'insideTopRight', fontSize: 10, fill: '#10b981', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Terms */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{terms.label}</p>
          <p className="text-sm font-mono text-slate-700 whitespace-pre-wrap break-all">{terms.value}</p>
        </div>

        {/* Term count and last term */}
        <div className="grid grid-cols-2 gap-2">
          {termCount && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{termCount.label}</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{termCount.value}</p>
            </div>
          )}
          {lastTerm && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{lastTerm.label}</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{lastTerm.value}</p>
            </div>
          )}
        </div>

        {/* Expression info */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Expression Reference
          </p>
          <div className="grid grid-cols-1 gap-2 text-[11px]">
            <div className="p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">Use n as the variable</p>
              <p className="text-slate-500">e.g., 1/n, 2^n, n^2, 1/(n+1)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
