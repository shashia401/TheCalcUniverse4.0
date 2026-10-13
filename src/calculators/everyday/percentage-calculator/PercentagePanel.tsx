import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function PercentagePanel({ values, results }: Props) {
  const resultRow = results.find((r) => r.id === 'result');
  const mode = values.mode || 'of';

  if (!resultRow) return null;

  const x = parseFloat(values.x) || 0;
  const y = parseFloat(values.y) || 0;
  // Bar lengths come from the inputs (same formulas as index.ts), not from the formatted result text.
  const whatPct = y !== 0 ? (x / y) * 100 : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Percentage Visual</span>
      </div>
      <div className="p-5 space-y-4">
        {mode === 'of' && y > 0 && (
          <>
            <div
              className="h-8 bg-slate-100 rounded-full overflow-hidden flex"
              role="img"
              aria-label={`${x} percent of ${y.toLocaleString('en-US')}: ${resultRow.value}`}
            >
              <div className="h-full bg-blue-700 flex items-center justify-center text-xs font-bold text-white" style={{ width: `${Math.min(Math.max(x, 0), 100)}%` }}>
                {x > 5 ? `${x}%` : ''}
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold text-blue-700">{resultRow.value}</span>
              <span className="text-slate-600">of {y.toLocaleString('en-US')}</span>
            </div>
          </>
        )}
        {mode === 'change' && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-8 bg-slate-100 rounded overflow-hidden flex">
              <div className={`h-full w-full ${y - x >= 0 ? 'bg-emerald-700' : 'bg-red-700'} flex items-center justify-center text-xs font-bold text-white`}>
                {resultRow.value}
              </div>
            </div>
          </div>
        )}
        {(mode === 'add' || mode === 'subtract') && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-8 bg-slate-100 rounded overflow-hidden flex">
              <div className={`h-full w-full ${mode === 'add' ? 'bg-emerald-700' : 'bg-blue-700'} flex items-center justify-center text-xs font-bold text-white`}>
                {resultRow.value}
              </div>
            </div>
          </div>
        )}
        {mode === 'whatpct' && (
          <div
            className="h-8 bg-slate-100 rounded-full overflow-hidden flex"
            role="img"
            aria-label={`${x} is ${resultRow.value} of ${y}`}
          >
            <div className="h-full bg-purple-700 flex items-center justify-center text-xs font-bold text-white" style={{ width: `${Math.min(Math.max(whatPct, 0), 100)}%`, minWidth: '3rem' }}>
              {resultRow.value}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
