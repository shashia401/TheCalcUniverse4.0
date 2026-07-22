import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ConvertedFraction {
  numerator: number;
  denominator: number;
  originalNumerator: number;
  originalDenominator: number;
  multiplier: number;
}

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function CommonDenomPanel({ results }: Props) {
  const lcd = results.find(r => r.id === 'lcd');
  const convertedRaw = results.find(r => r.id === '_convertedFractions')?.value;
  const workRaw = results.find(r => r.id === 'work')?.value;

  let converted: ConvertedFraction[] = [];
  try {
    if (convertedRaw) converted = JSON.parse(convertedRaw);
  } catch {
    /* ignore */
  }

  const workSteps = workRaw
    ? workRaw.split(' | ').map((s) => {
        const [label, ...rest] = s.split(': ');
        return { label, detail: rest.join(': ') };
      })
    : [];

  if (!lcd || results.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Common Denominator Work</span>
      </div>

      <div className="p-5 space-y-4">
        {/* LCD result */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Least Common Denominator (LCD)</p>
          <p className="text-3xl font-bold font-mono text-emerald-700">{lcd.value}</p>
        </div>

        {/* Fraction bar chart */}
        {converted.length > 0 && (() => {
          const chartColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
          const chartData = converted.map((cf, i) => ({
            name: `${cf.originalNumerator}/${cf.originalDenominator}`,
            value: cf.numerator / cf.denominator,
            color: chartColors[i % chartColors.length],
            label: `${cf.numerator}/${cf.denominator}`,
          }));
          return (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Fraction Comparison (Common Denominator)</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v: number) => v.toFixed(2)} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    formatter={((_: unknown, __: unknown, props: { payload: { label: string } }) => [props.payload.label, 'Converted']) as any}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* Converted fractions table */}
        {converted.length > 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-3">Converted Fractions</p>
            <div className="space-y-2">
              {converted.map((cf, i) => (
                <div key={`item-${i}`} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-blue-700 font-bold min-w-[60px] text-right">
                    {cf.originalNumerator}/{cf.originalDenominator}
                  </span>
                  <svg aria-hidden="true" className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="font-mono text-emerald-700 font-bold">
                    {cf.numerator}/{cf.denominator}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-1">
                    (×{cf.multiplier})
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-blue-400 mt-2">
              Each fraction is scaled by multiplying numerator and denominator by (LCD / original denominator).
            </p>
          </div>
        )}

        {/* Step-by-step work */}
        {workSteps.length > 0 && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500 mb-3">Step-by-Step LCM Computation</p>
            <div className="space-y-2">
              {workSteps.map((ws, i) => (
                <div key={`item-${i}`} className="flex gap-2">
                  <span className="text-[10px] font-bold text-purple-500 min-w-[48px] shrink-0 mt-0.5">
                    {ws.label}:
                  </span>
                  <span className="text-xs font-mono text-purple-700 leading-relaxed">
                    {ws.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LCD formula card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">LCD Formula</p>
          <p className="text-sm font-mono text-slate-600">LCD = LCM(denominator₁, denominator₂, ..., denominatorₙ)</p>
          <p className="text-xs text-slate-500 mt-1">
            LCM(a, b) = (a × b) / GCD(a, b) &mdash; computed using the Euclidean algorithm for GCD.
          </p>
        </div>
      </div>
    </div>
  );
}
