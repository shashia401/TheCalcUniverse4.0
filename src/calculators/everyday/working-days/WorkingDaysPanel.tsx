import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function WorkingDaysPanel({ results }: Props) {
  const workingRow = results.find(r => r.id === 'workingDays');
  const calendarRow = results.find(r => r.id === 'calendarDays');
  const weekendRow = results.find(r => r.id === 'weekends');
  const holidayRow = results.find(r => r.id === 'holidays');

  if (!workingRow || !calendarRow) return null;

  const working = parseInt(workingRow.value.replace(/,/g, '')) || 0;
  const calendar = parseInt(calendarRow.value.replace(/,/g, '')) || 0;
  const weekends = parseInt(weekendRow?.value.replace(/,/g, '') || '0');
  const holidays = holidayRow?.value === 'Not counted' ? 0 : parseInt(holidayRow?.value.replace(/,/g, '') || '0');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Day Breakdown</span>
      </div>
      <div className="p-5 space-y-3">
        {/* Stacked bar */}
        <div className="h-8 bg-slate-200 rounded-full overflow-hidden flex">
          {working > 0 && (
            <div className="h-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${(working / calendar) * 100}%` }}>
              {working}
            </div>
          )}
          {weekends > 0 && (
            <div className="h-full bg-amber-400 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${(weekends / calendar) * 100}%` }}>
              {weekends}
            </div>
          )}
          {holidays > 0 && (
            <div className="h-full bg-red-400 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${(holidays / calendar) * 100}%` }}>
              {holidays}
            </div>
          )}
        </div>
        <div className="flex justify-center gap-4 text-[10px]">
          {working > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Working: {working}</span>}
          {weekends > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Weekends: {weekends}</span>}
          {holidays > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Holidays: {holidays}</span>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center">
            <p className="text-[9px] font-bold text-emerald-500 uppercase">Working</p>
            <p className="text-lg font-bold font-mono text-emerald-700">{working.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center">
            <p className="text-[9px] font-bold text-amber-500 uppercase">Weekends</p>
            <p className="text-lg font-bold font-mono text-amber-700">{weekends.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center">
            <p className="text-[9px] font-bold text-red-500 uppercase">Holidays</p>
            <p className="text-lg font-bold font-mono text-red-700">{holidays.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
