import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function UUIDPanel({ results }: Props) {
  const idsRow = results.find(r => r.id === 'ids');
  const countRow = results.find(r => r.id === 'count');

  if (!idsRow) return null;

  const ids = idsRow.value.split(', ');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Generated IDs</span>
      </div>
      <div className="p-5 space-y-3">
        {/* Count badge */}
        {countRow && (
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-3 py-1">
              <span className="text-[9px] font-bold text-blue-500 uppercase">Generated</span>
              <span className="text-sm font-bold text-blue-700">{countRow.value}</span>
            </span>
          </div>
        )}

        {/* UUID list */}
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {ids.map((id, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50 transition-colors group">
              <span className="text-[10px] font-bold text-slate-400 w-6 flex-shrink-0">#{i + 1}</span>
              <code className="text-xs font-mono text-slate-700 flex-1 break-all">{id}</code>
              <span className="text-[9px] text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0">Click to copy</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
