import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function HardnessPanel({ results }: Props) {
  const resultRow = results.find(r => r.id === 'result');
  const equivalents = results.filter(r => r.id.startsWith('eq_'));

  if (!resultRow) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Hardness Scale</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Input</p>
          <p className="text-xl font-bold text-blue-700">{resultRow.value}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Approximate Equivalents</p>
          {equivalents.map(eq => (
            <div key={eq.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-xs font-semibold text-slate-600">{eq.label}</span>
              <span className="text-sm font-bold font-mono text-slate-800">{eq.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
