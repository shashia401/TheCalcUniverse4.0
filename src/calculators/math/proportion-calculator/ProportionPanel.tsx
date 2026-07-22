import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function ProportionPanel({ results }: Props) {
  const result = results.find(r => r.id === 'result');
  const fraction = results.find(r => r.id === 'fraction');
  const percentage = results.find(r => r.id === 'percentage');
  const verification = results.find(r => r.id === 'verification');
  const solution = results.find(r => r.id === 'solution');

  if (!result || !fraction || !percentage || !verification) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Proportion Solution</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Missing value — hero result */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">{result.label}</p>
          <p className="text-3xl font-bold text-blue-700 font-mono">{result.value}</p>
        </div>

        {/* Fraction and Percentage side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">As Fractions</p>
            <p className="text-sm font-mono font-bold text-slate-700">{fraction.value}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">As Percentages</p>
            <p className="text-sm font-mono font-bold text-slate-700">{percentage.value}</p>
          </div>
        </div>

        {/* Verification */}
        <div className={`rounded-xl border p-4 ${verification.value.endsWith('  OK') ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500">Verification</p>
          <p className={`text-sm font-mono font-bold ${verification.value.endsWith('  OK') ? 'text-emerald-700' : 'text-red-700'}`}>
            {verification.value}
          </p>
        </div>

        {/* Solution steps */}
        {solution && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500 mb-1">Solution Steps</p>
            <p className="text-sm font-mono text-purple-700">{solution.value}</p>
          </div>
        )}

        {/* Cross-multiplication reminder */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Cross-Multiplication Formula</p>
          <p className="text-xs text-slate-700 leading-relaxed font-mono">
            a / b = c / d &rarr; a &times; d = b &times; c
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Enter any three of the four values. The calculator solves for the missing value automatically using cross-multiplication.
          </p>
        </div>
      </div>
    </div>
  );
}
