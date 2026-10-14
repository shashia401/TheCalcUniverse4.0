import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { computeLog } from './logMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function LogPanel({ values, results }: Props) {
  const resultRow = results.find(r => r.id === 'result');
  const changeRow = results.find(r => r.id === 'changeOfBase');
  const expRow = results.find(r => r.id === 'exponentForm');
  const log10Row = results.find(r => r.id === 'log10');
  const lnRow = results.find(r => r.id === 'naturalLog');
  const log2Row = results.find(r => r.id === 'log2');

  const calc = computeLog(values.base, values.value);
  if (!resultRow || calc.kind !== 'ok') return null;

  const base = calc.base.toNumber();
  const x = calc.x.toNumber();
  const result = calc.result.toNumber();

  // Log curve f(t) = ln t / ln b on (0, xMax]
  const xMax = Math.max(x + 2, 5);
  const xMin = 0.01;
  const steps = 100;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const px = xMin + (i / steps) * (xMax - xMin);
    const py = Math.log(px) / Math.log(base);
    if (Number.isFinite(py)) points.push({ x: px, y: py });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Logarithm Solution</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Result card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-2">{resultRow.label}</p>
          <p className="text-3xl font-bold text-blue-700">{resultRow.value}</p>
        </div>

        {/* Log curve */}
        {points.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Logarithmic Curve f(x) = log<sub>{values.base}</sub>(x)</p>
            <SvgLineChart
              ariaLabel={`Graph of log base ${base} of x with the point (${x}, ${resultRow.value})`}
              series={[{ name: `log_${base}(x)`, points, color: '#2563eb' }]}
              refLines={[{ x: 1, color: '#94a3b8' }]}
              dots={[{ x, y: result, label: `(${x}, ${resultRow.value})`, color: '#dc2626' }]}
            />
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Step-by-Step Calculation</p>

          {/* Exponential form */}
          {expRow && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Exponential Form</p>
              <p className="text-xs font-mono text-slate-700 mt-1">{expRow.value}</p>
            </div>
          )}

          {/* Change of base */}
          {changeRow && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[10px] font-bold text-amber-700 uppercase">Change of Base Formula</p>
              <p className="text-xs font-mono text-amber-800 mt-1">{changeRow.value}</p>
              <p className="text-[10px] text-amber-700 mt-1">
                Use this formula when your calculator only has log₁₀ or ln buttons.
              </p>
            </div>
          )}
        </div>

        {/* Common logs */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">log₁₀</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">{log10Row?.value}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">ln (base e)</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">{lnRow?.value}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">log₂</p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">{log2Row?.value}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
