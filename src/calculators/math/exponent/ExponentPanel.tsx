import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { analyzePower, parseNumberStrict } from './exponentMath';

// y-axis labels for values that can reach 1e300: 1.2e+24 rather than "1.2e+24B"
const fmtY = (v: number) => (Math.abs(v) >= 1e6 || (v !== 0 && Math.abs(v) < 1e-3) ? v.toExponential(1) : String(+v.toPrecision(3)));

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

  const base = parseNumberStrict(values.base);
  const exp = parseNumberStrict(values.exponent);
  if (Number.isNaN(base) || Number.isNaN(exp)) return null;
  const isIntExp = Number.isInteger(exp);
  const power = analyzePower(base, exp);
  const result = power.kind === 'real' ? (power.value as number) : NaN;

  // Curve of f(x) = base^x around the chosen exponent (only for a positive base: it is real for every x)
  const curvePoints: { x: number; y: number }[] = [];
  if (base > 0) {
    const xMin = exp > 0 ? Math.min(0, exp - 2) : Math.min(exp - 2, -2);
    const xMax = exp > 0 ? Math.max(exp + 2, 2) : Math.max(0, exp + 2);
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = Math.pow(base, x);
      if (Number.isFinite(y)) curvePoints.push({ x, y });
    }
  }
  const showCurve = curvePoints.length > 1 && Number.isFinite(result);
  const expText = String(exp);

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
            {base < 0 ? `(${base})` : base}<sup className="text-lg">{exp < 0 ? `(${exp})` : exp}</sup> = {resultRow.value}
          </p>
        </div>

        {/* Function curve */}
        {showCurve && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Exponential Curve f(x) = {base}<sup>x</sup></p>
            <SvgLineChart
              series={[{ name: `f(x) = ${base}^x`, points: curvePoints, color: '#2563eb' }]}
              dots={[{ x: exp, y: result, label: `(${expText}, ${resultRow.value})`, color: '#dc2626' }]}
              refLines={[{ y: 0, color: '#cbd5e1', dashed: false }, { x: 0, color: '#cbd5e1', dashed: false }]}
              ariaLabel={`Curve of f(x) = ${base} to the power x, with the point (${expText}, ${resultRow.value}) marked`}
              height={220}
              yFormat={fmtY}
            />
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Step-by-Step Solution</p>

          {/* Power definition */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Power Definition</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              {base < 0 ? `(${base})` : base}<sup>{isIntExp && exp >= 0 ? exp : `(${exp})`}</sup>
              {isIntExp && exp > 0 ? ` = the product of ${exp} factor${exp === 1 ? '' : 's'} of ${base}` : ''}
              {isIntExp && exp === 0 ? ' = an empty product, which is 1' : ''}
              {isIntExp && exp < 0 ? ` = 1 divided by ${base} raised to the power ${Math.abs(exp)}` : ''}
              {!isIntExp ? ` = ${base} raised to the power ${exp}` : ''}
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
              <p className="text-[10px] font-bold text-amber-800 uppercase">Negative Exponent — Fraction Conversion</p>
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
              <p className="text-[10px] font-bold text-blue-700 uppercase">Inverse Root</p>
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
