import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function SchengenVisaPanel({ results }: Props) {
  const totalUsed = results.find(r => r.id === 'totalDaysUsed');
  const remaining = results.find(r => r.id === 'daysRemaining');
  const status = results.find(r => r.id === 'ruleReminder');

  if (!totalUsed || !remaining) return null;

  const used = parseInt(totalUsed.value) || 0;
  const pct = Math.min((used / 90) * 100, 100);
  const isOverstay = used > 90;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">90/180 Day Status</span>
      </div>
      <div className="p-5 space-y-4">
        {/* 90-day gauge */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">90-Day Limit</p>
          <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all flex items-center justify-end pr-2 ${
                isOverstay ? 'bg-red-500' : used > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            >
              <span className="text-[10px] font-bold text-white">{used}/90 days</span>
            </div>
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
            <span>0 days</span>
            <span>45 days</span>
            <span>90 days</span>
          </div>
        </div>

        {/* Remaining */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-lg border px-4 py-3 text-center ${
            isOverstay ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
          }`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${
              isOverstay ? 'text-red-500' : 'text-emerald-500'
            }`}>
              {isOverstay ? 'Days Over' : 'Days Used'}
            </p>
            <p className={`text-2xl font-bold font-mono ${
              isOverstay ? 'text-red-700' : 'text-emerald-700'
            }`}>
              {isOverstay ? remaining.value.match(/([\d,]+)/)?.[1] || '0' : used}
            </p>
          </div>
          <div className={`rounded-lg border px-4 py-3 text-center ${
            isOverstay ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'
          }`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${
              isOverstay ? 'text-red-500' : 'text-blue-500'
            }`}>
              {isOverstay ? 'Over Limit' : 'Remaining'}
            </p>
            <p className={`text-2xl font-bold font-mono ${
              isOverstay ? 'text-red-700' : 'text-blue-700'
            }`}>
              {isOverstay ? '!' : remaining.value.match(/([\d,]+)/)?.[1] || '0'}
            </p>
          </div>
        </div>

        {status && (
          <div className={`rounded-xl border px-4 py-3 ${
            isOverstay ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
          }`}>
            <p className={`text-xs font-semibold ${
              isOverstay ? 'text-red-700' : 'text-emerald-700'
            }`}>
              {status.value}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
