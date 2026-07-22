import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function CronPanel({ results }: Props) {
  const expression = results.find(r => r.id === 'expression');
  const description = results.find(r => r.id === 'description');
  const nextRun = results.find(r => r.id === 'nextRun');

  if (!expression) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Cron Schedule</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Cron expression */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
          <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Expression</p>
          <p className="text-xl font-bold font-mono text-blue-700 tracking-wider">{expression.value}</p>
        </div>

        {/* Human-readable */}
        <div className="space-y-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm font-semibold text-emerald-800">{description?.value || ''}</p>
          </div>
          {nextRun && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Schedule</p>
              <p className="text-sm text-slate-700">{nextRun.value}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
