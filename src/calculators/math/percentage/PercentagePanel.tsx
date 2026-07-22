import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Lightbulb } from 'lucide-react';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function PercentagePanel({ values, results }: Props) {
  const resultRow = results.find(r => r.id === 'result');
  const formulaRow = results.find(r => r.id === 'formula');
  const exampleRow = results.find(r => r.id === 'example');
  const decimalRow = results.find(r => r.id === 'decimal');
  const diffRow = results.find(r => r.id === 'difference') || results.find(r => r.id === 'increaseAmount') || results.find(r => r.id === 'decreaseAmount');

  if (!resultRow || !formulaRow) return null;

  const mode = values.mode || 'percentOf';
  const x = parseFloat(values.x || '0');
  const y = parseFloat(values.y || '0');

  // Compute percentage for visualization
  const pctForViz = useMemo(() => {
    if (mode === 'percentOf') return x; // X%
    if (mode === 'whatPercent') return (x / y) * 100;
    if (mode === 'pctChange') return (Math.abs(y - x) / x) * 100;
    if (mode === 'addPct') return x;
    if (mode === 'subPct') return x;
    return 50;
  }, [mode, x, y]);

  const clampedPct = Math.min(Math.max(pctForViz || 0, 0), 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Step-by-Step Solution</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Result Card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-2">{resultRow.label}</p>
          <p className="text-3xl font-bold text-blue-700">{resultRow.value}</p>
        </div>

        {/* Percentage donut chart — hidden when value exceeds 100% */}
        {y > 0 && mode !== 'pctChange' && clampedPct <= 100 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 text-center">Visual Breakdown</p>
            <div className="flex items-center justify-center gap-6">
              <div className="relative" style={{ width: 140, height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[
                      { name: 'Part', value: clampedPct },
                      { name: 'Remaining', value: 100 - clampedPct },
                    ]} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={62} startAngle={90} endAngle={-270} paddingAngle={0}>
                      <Cell fill="#3b82f6" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold text-blue-700">{clampedPct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" /> Part</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-slate-200 inline-block" /> Remaining</div>
              </div>
            </div>
          </div>
        )}

        {/* Step-by-step */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Step-by-Step Calculation</p>

          {/* Formula step */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Formula</p>
            <p className="text-xs font-mono text-slate-700 mt-1">{formulaRow.value}</p>
          </div>

          {/* Decimal step */}
          {decimalRow && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Step 1: Convert to Decimal</p>
              <p className="text-xs font-mono text-slate-700 mt-1">= {decimalRow.value}</p>
            </div>
          )}

          {/* Difference step */}
          {diffRow && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Step 2: Apply to Base</p>
              <p className="text-xs font-mono text-slate-700 mt-1">{diffRow.label}: {diffRow.value}</p>
            </div>
          )}

          {/* Final step */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-bold text-blue-500 uppercase">Result</p>
            <p className="text-sm font-bold text-blue-700 mt-1">{resultRow.value}</p>
          </div>
        </div>

        {/* Real World Example */}
        {exampleRow && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Lightbulb size={13} className="text-amber-600" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Real-World Application</p>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">{exampleRow.value}</p>
          </div>
        )}

        {/* Quick Reference */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Common Percentage Benchmarks</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">50%</p>
              <p className="text-slate-500">Half</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">25%</p>
              <p className="text-slate-500">Quarter</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">10%</p>
              <p className="text-slate-500">One-tenth</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">1%</p>
              <p className="text-slate-500">One-hundredth</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
