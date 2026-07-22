import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function RegexTesterPanel({ results }: Props) {
  const matchRow = results.find(r => r.id === 'isMatch');
  const countRow = results.find(r => r.id === 'matchCount');
  const matchesRow = results.find(r => r.id === 'matches');

  if (!matchRow) return null;

  const isMatch = matchRow.value === 'Yes';
  const count = parseInt(countRow?.value || '0');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Match Results</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Status */}
        <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: isMatch ? '#bbf7d0' : '#fecaca', backgroundColor: isMatch ? '#f0fdf4' : '#fef2f2' }}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${isMatch ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-700'}`}>
            {isMatch ? count : 0}
          </div>
          <div>
            <p className={`text-sm font-bold ${isMatch ? 'text-emerald-700' : 'text-red-700'}`}>
              {isMatch ? `${count} match${count !== 1 ? 'es' : ''} found` : 'No match'}
            </p>
            <p className="text-xs text-slate-500">{matchRow.value}</p>
          </div>
        </div>

        {/* Match count bar */}
        {count > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Matches</p>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min((count / 20) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
              <span>0</span>
              <span>10</span>
              <span>20+</span>
            </div>
          </div>
        )}

        {/* First 10 matches */}
        {matchesRow && matchesRow.value !== '(none)' && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">First 10 Matches</p>
            <div className="flex flex-wrap gap-1">
              {matchesRow.value.split(', ').map((m, i) => (
                <span key={`item-${i}`} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">
                  &ldquo;{m}&rdquo;
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
