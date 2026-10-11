import { CalculatorResult } from '../../../types/calculator';
import { parseIsoDate } from '../../../utils/dates';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface Cycle {
  periodStart: Date;
  periodEnd: Date;
  ovulation: Date;
  fertileStart: Date;
  fertileEnd: Date;
  cycleNum: number;
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function PeriodOvulationPanel({ results }: Props) {
  // The three cycles come from index.ts (_cycles), anchored to the cycle that contains today,
  // so the calendar always agrees with the results above it.
  const raw = results.find((r) => r.id === '_cycles')?.value;
  if (!raw) return null;

  let cycles: Cycle[];
  try {
    const parsed = JSON.parse(raw) as Record<string, string>[];
    cycles = parsed.map((c, i) => ({
      periodStart: parseIsoDate(c.periodStart)!,
      periodEnd: parseIsoDate(c.periodEnd)!,
      ovulation: parseIsoDate(c.ovulation)!,
      fertileStart: parseIsoDate(c.fertileStart)!,
      fertileEnd: parseIsoDate(c.fertileEnd)!,
      cycleNum: i + 1,
    }));
  } catch {
    return null;
  }
  if (!cycles.length || cycles.some((c) => !c.periodStart || !c.periodEnd || !c.ovulation)) return null;

  const addDays = (d: Date, n: number): Date => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build the day list from the first period start to the last period end
  const calendarStart = cycles[0].periodStart;
  const calendarEnd = cycles[cycles.length - 1].periodEnd;
  const days: Date[] = [];
  for (let d = new Date(calendarStart); d <= calendarEnd; d = addDays(d, 1)) days.push(new Date(d));

  // Group by month
  const months: { month: number; year: number; days: Date[] }[] = [];
  for (const day of days) {
    const last = months[months.length - 1];
    if (!last || last.month !== day.getMonth() || last.year !== day.getFullYear()) {
      months.push({ month: day.getMonth(), year: day.getFullYear(), days: [] });
    }
    months[months.length - 1].days.push(day);
  }

  const getDay = (day: Date) => {
    const t = day.getTime();
    const isToday = t === today.getTime();
    const isPast = t < today.getTime();
    let phase: 'period' | 'fertile' | 'ovulation' | 'none' = 'none';
    let cycleNum = 0;
    for (const c of cycles) {
      if (t >= c.periodStart.getTime() && t <= c.periodEnd.getTime()) { phase = 'period'; cycleNum = c.cycleNum; break; }
      if (t === c.ovulation.getTime()) { phase = 'ovulation'; cycleNum = c.cycleNum; break; }
      if (t >= c.fertileStart.getTime() && t <= c.fertileEnd.getTime()) { phase = 'fertile'; cycleNum = c.cycleNum; break; }
    }
    // Text colours are -700/-800 on a light tint (>= 4.5:1); past days are marked by position, not by fading.
    const style = {
      ovulation: { bg: 'bg-emerald-100', text: 'text-emerald-800 font-bold', label: 'Ov', desc: 'Ovulation day (egg released, about 12–24 hours of viability)' },
      period: { bg: 'bg-red-100', text: 'text-red-700 font-bold', label: 'P', desc: 'Period day' },
      fertile: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'F', desc: 'Fertile window (highest chance of conception)' },
      none: { bg: 'bg-white', text: isPast && !isToday ? 'text-slate-500' : 'text-slate-700', label: '', desc: 'Non-fertile day' },
    }[phase];
    const title = `${day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}: ${style.desc}${cycleNum ? ` (cycle ${cycleNum})` : ''}${isToday ? ' — today' : ''}`;
    return { ...style, isToday, title };
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden relative">
      {/* Privacy Badge */}
      <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 border-b border-emerald-100">
        <svg aria-hidden="true" className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-xs font-semibold text-emerald-800">
          100% Private: Your data is processed on your device and never sent to our servers.
        </span>
      </div>

      <div className="p-5 space-y-6">
        {/* Cycle Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
            <span className="font-semibold text-red-700">Period</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-200" />
            <span className="font-semibold text-emerald-700">Fertile Window</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
            <span className="font-semibold text-emerald-800">Ovulation Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border-2 border-blue-600" />
            <span className="font-semibold text-blue-700">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-white border border-slate-300" />
            <span>P: Period &middot; F: Fertile &middot; Ov: Ovulation</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-6">
          {months.map((m) => {
            const pad: null[] = new Array(m.days[0].getDay()).fill(null);
            return (
              <div key={`${m.month}-${m.year}`}>
                <p className="text-sm font-bold text-slate-700 mb-2">{monthNames[m.month]} {m.year}</p>
                <div className="grid grid-cols-7 gap-1">
                  {dayNames.map((d) => (
                    <div key={d} className="text-[10px] font-bold text-slate-600 text-center py-1">{d}</div>
                  ))}
                  {pad.map((_, i) => (
                    <div key={`pad-${i}`} className="h-8" />
                  ))}
                  {m.days.map((day) => {
                    const info = getDay(day);
                    return (
                      <div
                        key={day.getTime()}
                        title={info.title}
                        aria-label={info.title}
                        role="img"
                        className={`h-8 flex flex-col items-center justify-center rounded-lg text-xs ${info.bg} ${info.text} ${info.isToday ? 'ring-2 ring-blue-600' : ''}`}
                      >
                        <span>{day.getDate()}</span>
                        {info.label && <span className="text-[9px] leading-none font-bold">{info.label}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cycle Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {cycles.map((c, i) => (
            <div
              key={`item-${i}`}
              className={`rounded-xl border p-4 ${i === 0 ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">
                {i === 0 ? 'Current Cycle' : `Cycle ${i + 1}`}
              </p>
              <div className="space-y-1 text-[11px] text-slate-600">
                <p><strong>Period:</strong> {c.periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {c.periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                <p><strong>Ovulation:</strong> {c.ovulation.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                <p><strong>Fertile:</strong> {c.fertileStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {c.fertileEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
