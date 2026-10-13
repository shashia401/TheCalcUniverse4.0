import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function FuelEconomyPanel({ results }: Props) {
  const result = results.find(r => r.id === 'result');
  const formula = results.find(r => r.id === 'formula');
  const baseEq = results.find(r => r.id === 'baseEquivalent');

  if (!result) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Fuel Economy</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Result</p>
          <p className="text-2xl font-bold text-blue-700">{result.value}</p>
        </div>
        {formula && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] text-slate-500">{formula.value}</p>
          </div>
        )}
        {baseEq && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center">
            <p className="text-[9px] font-bold text-amber-600 uppercase">Base Equivalent</p>
            <p className="text-sm font-bold text-amber-700">{baseEq.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
