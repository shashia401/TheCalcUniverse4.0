import { CalculatorResult } from '../../../types/calculator';
import { workingDaysInfo } from './workingDaysMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function WorkingDaysPanel({ values, results }: Props) {
  // Same pure function index.ts uses; the panel never parses result strings.
  const w = workingDaysInfo(values);
  if (!w || !results.length) return null;
  const total = w.calendarDays;
  const parts = [
    { label: 'Working', n: w.workingDays, bar: 'bg-emerald-700', text: 'text-emerald-800', box: 'border-emerald-200 bg-emerald-50' },
    { label: 'Weekends', n: w.weekendDays, bar: 'bg-amber-700', text: 'text-amber-800', box: 'border-amber-200 bg-amber-50' },
    { label: 'Holidays', n: w.holidayDays, bar: 'bg-red-700', text: 'text-red-800', box: 'border-red-200 bg-red-50' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Day Breakdown</span>
      </div>
      <div className="p-5 space-y-3">
        {total > 0 && (
          <div className="h-8 bg-slate-200 rounded-full overflow-hidden flex" role="img" aria-label={parts.map((p) => `${p.n} ${p.label.toLowerCase()}`).join(', ')}>
            {parts.filter((p) => p.n > 0).map((p) => (
              <div key={p.label} className={`h-full ${p.bar} flex items-center justify-center text-[10px] font-bold text-white`} style={{ width: `${(p.n / total) * 100}%` }}>
                {(p.n / total) * 100 >= 6 ? p.n : ''}
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {parts.map((p) => (
            <div key={p.label} className={`rounded-lg border px-3 py-2 text-center ${p.box}`}>
              <p className={`text-[10px] font-bold uppercase ${p.text}`}>{p.label}</p>
              <p className={`text-lg font-bold font-mono ${p.text}`}>{p.n.toLocaleString('en-US')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
