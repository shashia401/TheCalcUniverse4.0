import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';

interface MultiplesData {
  a: number;
  b: number;
  multiplesA: number[];
  multiplesB: number[];
}

interface FactorEntry {
  number: number;
  factors: { factor: number; exponent: number }[];
}

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function LCMPanel({ results }: Props) {
  const multiplesData = results.find(r => r.id === '_multiplesData')?.value;
  const primeData = results.find(r => r.id === '_primeData')?.value;
  const lcm = results.find(r => r.id === 'result')?.value || '';

  let data: MultiplesData | null = null;
  let factors: FactorEntry[] = [];
  try {
    if (multiplesData) data = JSON.parse(multiplesData);
    if (primeData) factors = JSON.parse(primeData);
  } catch { /* ignore */ }

  if (!data || results.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">LCM — Two Methods</span>
      </div>

      <div className="p-5 space-y-4">
        {/* LCM Result */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Least Common Multiple</p>
          <p className="text-3xl font-bold font-mono text-emerald-700">{lcm}</p>
        </div>

        {/* Multiples comparison bar chart */}
        {data && data.multiplesA && data.multiplesB && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Multiples Comparison</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={Array.from({ length: Math.max(data.multiplesA.length, data.multiplesB.length) }, (_, i) => ({
                  n: i + 1,
                  [`m${data.a}`]: data.multiplesA[i] || 0,
                  [`m${data.b}`]: data.multiplesB[i] || 0,
                  isLCM: data.multiplesA[i] === parseInt(lcm) || data.multiplesB[i] === parseInt(lcm),
                }))}
                margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="n" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} label={{ value: 'n (multiplier)', position: 'insideBottomRight', offset: -4, fontSize: 9, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey={`m${data.a}`} name={`× ${data.a}`} fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={24} />
                <Bar dataKey={`m${data.b}`} name={`× ${data.b}`} fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-slate-400 mt-1 text-center">Bars show multiples of {data.a} and {data.b}. The first common value is the LCM: {lcm}</p>
          </div>
        )}

        {/* Method 1: List of Multiples */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2">Method 1 — List of Multiples</p>
          <div className="space-y-2">
            <div>
              <p className="text-xs font-bold text-blue-600 mb-1">Multiples of {data.a}:</p>
              <div className="flex flex-wrap gap-1">
                {data.multiplesA.map((m: number, i: number) => (
                  <span key={`item-${i}`} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${m === parseInt(lcm) ? 'bg-emerald-200 text-emerald-800 ring-2 ring-emerald-400' : 'bg-white text-blue-600'}`}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 mb-1">Multiples of {data.b}:</p>
              <div className="flex flex-wrap gap-1">
                {data.multiplesB.map((m: number, i: number) => (
                  <span key={`item-${i}`} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${m === parseInt(lcm) ? 'bg-emerald-200 text-emerald-800 ring-2 ring-emerald-400' : 'bg-white text-blue-600'}`}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-blue-500 mt-1">The first common multiple is the LCM: <strong>{lcm}</strong></p>
          </div>
        </div>

        {/* Method 2: Prime Factorization */}
        {factors.length > 0 && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500 mb-2">Method 2 — Prime Factorization</p>
            <div className="space-y-1">
              {factors.map((f, i: number) => (
                <p key={`item-${i}`} className="text-sm font-mono text-purple-700">
                  {f.number} = {f.factors.map((pf) => `${pf.factor}^${pf.exponent}`).join(' × ')}
                </p>
              ))}
              <p className="text-xs text-purple-500 mt-1">Take the highest exponent of each prime factor across all numbers.</p>
            </div>
          </div>
        )}

        {/* Formula card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">LCM Formula</p>
          <p className="text-sm font-mono text-slate-600">LCM(a, b) = (a × b) / GCD(a, b)</p>
          <p className="text-xs text-slate-500 mt-1">
            LCM({data.a}, {data.b}) = ({data.a} × {data.b}) / {results.find(r => r.id === 'gcdValue')?.value || '—'} = {lcm || '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
