import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function ExponentPanel({ values, results }: Props) {
  const resultRow = results.find(r => r.id === 'result');
  const expandedRow = results.find(r => r.id === 'expandedForm');
  const fractionRow = results.find(r => r.id === 'fractionForm');
  const sciRow = results.find(r => r.id === 'sciNotation');
  const inverseRow = results.find(r => r.id === 'inverse');

  if (!resultRow) return null;

  const base = parseFloat(values.base);
  const exp = parseFloat(values.exponent);
  const isIntExp = Number.isInteger(exp);
  const result = Math.pow(base, exp);

  // Generate curve points for the function
  const curveData = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    if (base <= 0 || isNaN(base)) return points;
    const xMin = exp > 0 ? Math.min(0, exp - 2) : Math.min(exp - 2, -2);
    const xMax = exp > 0 ? Math.max(exp + 2, 2) : Math.max(0, exp + 2);
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = Math.pow(base, x);
      if (isFinite(y)) points.push({ x: parseFloat(x.toFixed(4)), y: parseFloat(y.toFixed(4)) });
    }
    return points;
  }, [base, exp]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Step-by-Step Solution</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Result */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-2">Result</p>
          <p className="text-3xl font-bold text-blue-700">
            {base}<sup className="text-lg">{exp < 0 ? `(${exp})` : exp}</sup> = {resultRow.value}
          </p>
        </div>

        {/* Function curve */}
        {curveData.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Exponential Curve f(x) = {base}<sup>x</sup></p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={curveData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} type="number" domain={['auto', 'auto']} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} type="number" domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={(_: unknown) => [parseFloat((_ as number).toFixed(6)), 'f(x)']}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1} />
                <ReferenceDot x={exp} y={result} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} label={{ value: `(${exp}, ${resultRow.value})`, position: 'top', fontSize: 10, fill: '#ef4444', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Step-by-Step Solution</p>

          {/* Power definition */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Power Definition</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              {base}<sup>{isIntExp && exp >= 0 ? exp : `(${exp})`}</sup>
              {isIntExp && exp >= 0 ? ` = ${base} raised to the ${exp}th power` : ''}
              {isIntExp && exp < 0 ? ` = 1 divided by ${base} raised to the ${Math.abs(exp)}th power` : ''}
              {!isIntExp ? ` = ${base} raised to the ${exp} power` : ''}
            </p>
          </div>

          {/* Expanded form */}
          {expandedRow && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Expanded Form</p>
              <p className="text-xs font-mono text-slate-700 mt-1 whitespace-pre-wrap break-all">
                {expandedRow.value}
              </p>
            </div>
          )}

          {/* Fraction conversion */}
          {fractionRow && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[10px] font-bold text-amber-600 uppercase">Negative Exponent — Fraction Conversion</p>
              <p className="text-xs font-mono text-amber-800 mt-1">{fractionRow.value}</p>
            </div>
          )}

          {/* Scientific notation */}
          {sciRow && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Scientific Notation</p>
              <p className="text-xs font-mono text-slate-700 mt-1">{sciRow.value}</p>
            </div>
          )}

          {/* Inverse / root */}
          {inverseRow && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-[10px] font-bold text-blue-500 uppercase">Inverse Root</p>
              <p className="text-sm font-mono text-blue-700 mt-1">{inverseRow.value}</p>
            </div>
          )}
        </div>

        {/* Law of exponents reference */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Exponent Rules</p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">bᵐ × bⁿ</p>
              <p className="text-slate-500">= b<sup>m+n</sup></p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">bᵐ ÷ bⁿ</p>
              <p className="text-slate-500">= b<sup>m−n</sup></p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">(bᵐ)ⁿ</p>
              <p className="text-slate-500">= b<sup>mn</sup></p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">b<sup>−n</sup></p>
              <p className="text-slate-500">= 1/bⁿ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
