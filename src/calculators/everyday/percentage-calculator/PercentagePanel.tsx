import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function PercentagePanel({ values, results }: Props) {
  const resultRow = results.find(r => r.id === 'result');
  const mode = values.mode || 'of';

  if (!resultRow) return null;

  const x = parseFloat(values.x) || 0;
  const y = parseFloat(values.y) || 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Percentage Visual</span>
      </div>
      <div className="p-5 space-y-4">
        {mode === 'of' && y > 0 && (
          <>
            <div className="h-8 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white transition-all" style={{ width: `${Math.min((x / 100) * 100, 100)}%` }}>
                {x > 5 ? `${x}%` : ''}
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold text-blue-600">{resultRow.value}</span>
              <span className="text-slate-500">of {y.toLocaleString()}</span>
            </div>
          </>
        )}
        {mode === 'change' && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-8 bg-slate-100 rounded overflow-hidden flex">
              <div className={`h-full ${parseFloat(resultRow.value) >= 0 ? 'bg-emerald-400' : 'bg-red-400'} flex items-center justify-center text-xs font-bold text-white`} style={{ width: '100%' }}>
                {resultRow.value}
              </div>
            </div>
          </div>
        )}
        {(mode === 'add' || mode === 'subtract') && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-8 bg-slate-100 rounded overflow-hidden flex">
              <div className={`h-full ${mode === 'add' ? 'bg-emerald-400' : 'bg-blue-400'} flex items-center justify-center text-xs font-bold text-white transition-all`} style={{ width: '100%' }}>
                {resultRow.value}
              </div>
            </div>
          </div>
        )}
        {mode === 'whatpct' && (
          <div className="h-8 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white transition-all" style={{ width: `${Math.min(parseFloat(resultRow.value) || 0, 100)}%` }}>
              {resultRow.value}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
