import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];

export default function NumberSequencePanel({ values, results }: Props) {
  const typeRow = results.find(r => r.id === 'sequenceType');
  const formulaRow = results.find(r => r.id === 'nthTerm');
  const nextRow = results.find(r => r.id === 'nextTerms');
  const diffRow = results.find(r => r.id === 'commonDifference');
  const ratioRow = results.find(r => r.id === 'commonRatio');
  const fullRow = results.find(r => r.id === 'fullSequence');

  if (!typeRow || !formulaRow) return null;

  const seqType = typeRow.value;
  const isKnown = seqType !== 'Unknown';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Sequence Analysis</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Type Result */}
        <div className={`rounded-xl border p-6 text-center ${isKnown ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
          <p className="text-sm text-slate-500 mb-2">Sequence Type</p>
          <p className="text-3xl font-bold text-blue-700">{seqType}</p>
        </div>

        {isKnown ? (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Step-by-Step Analysis</p>

            {/* Sequence bar chart */}
            {(() => {
              const terms = fullRow?.value?.split(', ').map(Number).filter(n => !isNaN(n));
              if (terms && terms.length > 1) {
                const chartSeq = terms.slice(0, 20);
                return (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Sequence Pattern</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={chartSeq.map((v, i) => ({ label: `${i + 1}`, value: v }))} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} label={{ value: 'Position', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#94a3b8' }} interval={Math.max(1, Math.floor(chartSeq.length / 12))} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} />
                        <Tooltip
                          contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                          formatter={(_: unknown) => [_, 'Value'] as any}
                        />
                        <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={chartSeq.length > 15 ? 16 : 32}>
                          {chartSeq.map((_, idx) => (
                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              }
              return null;
            })()}

            {/* Original sequence */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Given Sequence</p>
              <p className="text-xs font-mono text-slate-700 mt-1">
                {values.sequence}
              </p>
            </div>

            {/* Common Difference / Ratio */}
            {diffRow && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Step 1: Find Common Difference</p>
                <p className="text-xs font-mono text-slate-700 mt-1">
                  d = a₂ − a₁ = {diffRow.value}
                </p>
              </div>
            )}

            {ratioRow && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Step 1: Find Common Ratio</p>
                <p className="text-xs font-mono text-slate-700 mt-1">
                  r = a₂ ÷ a₁ = {ratioRow.value}
                </p>
              </div>
            )}

            {/* nth-term formula */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Step 2: nth-Term Formula</p>
              <p className="text-xs font-mono text-slate-700 mt-1">
                {formulaRow.value}
              </p>
            </div>

            {/* Next terms */}
            {nextRow && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-[10px] font-bold text-blue-500 uppercase">Step 3: Next Terms</p>
                <p className="text-sm font-bold text-blue-700 mt-1">{nextRow.value}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold text-amber-600 uppercase">Unknown Pattern</p>
            <p className="text-xs text-amber-800 mt-1">
              The sequence could not be identified as arithmetic, geometric, or Fibonacci.
              Try adding more terms or check your values.
            </p>
          </div>
        )}

        {/* Full extended sequence */}
        {fullRow && isKnown && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Extended Sequence</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {fullRow.value.split(', ').map((term, i) => (
                <span key={`item-${i}`} className={`inline-block px-2 py-1 rounded text-xs font-mono ${i < values.sequence.split(',').length ? 'bg-white border border-slate-200 text-slate-700' : 'bg-blue-50 border border-blue-200 text-blue-700 font-bold'}`}>
                  {term}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Original terms in white, predicted terms in blue
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
