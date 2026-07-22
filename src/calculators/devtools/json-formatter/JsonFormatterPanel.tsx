import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function JsonFormatterPanel({ results }: Props) {
  const statusRow = results.find(r => r.id === 'status');
  const charRow = results.find(r => r.id === 'charCount');
  const lineRow = results.find(r => r.id === 'lineCount');

  if (!statusRow) return null;

  const isValid = statusRow.value.startsWith('Valid');
  const chars = parseInt(charRow?.value || '0');
  const lines = parseInt(lineRow?.value || '0');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">JSON Status</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Status indicator */}
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${isValid ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <div>
            <p className={`text-sm font-bold ${isValid ? 'text-emerald-700' : 'text-red-700'}`}>
              {statusRow.value}
            </p>
            {!isValid && (
              <p className="text-xs text-red-500 mt-0.5">Fix the syntax and try again</p>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase">Characters</p>
            <p className="text-2xl font-bold font-mono text-slate-700">{chars.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase">Lines</p>
            <p className="text-2xl font-bold font-mono text-slate-700">{lines.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
