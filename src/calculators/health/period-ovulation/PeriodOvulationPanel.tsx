import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function PeriodOvulationPanel({ values }: Props) {
  const lmpStr = values.lmpDate?.trim();
  const cycleLength = parseInt(values.cycleLength) || 28;
  const periodLength = parseInt(values.periodLength) || 5;
  const lutealPhase = parseInt(values.lutealPhase) || 14;

  if (!lmpStr) return null;
  const lmp = new Date(lmpStr + 'T00:00:00');
  if (isNaN(lmp.getTime())) return null;

  const addDays = (d: Date, n: number): Date => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate 3 months of predictions
  const cycles: { periodStart: Date; periodEnd: Date; ovulation: Date; fertileStart: Date; fertileEnd: Date; cycleNum: number }[] = [];
  for (let m = 0; m < 3; m++) {
    const periodStart = addDays(lmp, m * cycleLength);
    const periodEnd = addDays(periodStart, periodLength - 1);
    const ovulation = addDays(periodStart, cycleLength - lutealPhase);
    const fertileStart = addDays(ovulation, -5);
    const fertileEnd = ovulation;
    cycles.push({ periodStart, periodEnd, ovulation, fertileStart, fertileEnd, cycleNum: m + 1 });
  }

  // Build calendar month grid (starting from 1st cycle period start, going 3 months forward)
  const calendarStart = cycles[0].periodStart;
  const calendarEnd = cycles[2].periodEnd;
  const days: Date[] = [];
  let d = new Date(calendarStart);
  while (d <= calendarEnd) {
    days.push(new Date(d));
    d = addDays(d, 1);
  }

  // Group by month
  const months: { month: number; year: number; days: Date[] }[] = [];
  let currentMonth: number | null = null;
  let currentYear: number | null = null;
  for (const day of days) {
    if (day.getMonth() !== currentMonth || day.getFullYear() !== currentYear) {
      currentMonth = day.getMonth();
      currentYear = day.getFullYear();
      months.push({ month: currentMonth, year: currentYear, days: [] });
    }
    months[months.length - 1].days.push(day);
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  interface DayInfo {
    day: Date;
    cycleNum: number;
    phase: 'period' | 'fertile' | 'ovulation' | 'none';
    label: string;
    isToday: boolean;
  }

  const [hoverDay, setHoverDay] = useState<DayInfo | null>(null);

  const getDayInfo = (day: Date): DayInfo => {
    const dayTime = day.getTime();
    const isToday = dayTime === today.getTime();

    for (const c of cycles) {
      if (dayTime >= c.periodStart.getTime() && dayTime <= c.periodEnd.getTime()) {
        return { day, cycleNum: c.cycleNum, phase: 'period', label: 'Period', isToday };
      }
      if (dayTime === c.ovulation.getTime()) {
        return { day, cycleNum: c.cycleNum, phase: 'ovulation', label: 'Ovulation Day', isToday };
      }
      if (dayTime >= c.fertileStart.getTime() && dayTime <= c.fertileEnd.getTime()) {
        return { day, cycleNum: c.cycleNum, phase: 'fertile', label: 'Fertile Window', isToday };
      }
    }
    return { day, cycleNum: 0, phase: 'none', label: '', isToday };
  };

  const getDayClass = (day: Date) => {
    const dayTime = day.getTime();
    const isToday = dayTime === today.getTime();
    const isPast = dayTime < today.getTime();

    // Check if period day
    let isPeriod = false;
    let isFertile = false;
    let isOvulation = false;

    for (const c of cycles) {
      if (dayTime >= c.periodStart.getTime() && dayTime <= c.periodEnd.getTime()) {
        isPeriod = true;
      }
      if (dayTime >= c.fertileStart.getTime() && dayTime <= c.fertileEnd.getTime()) {
        isFertile = true;
      }
      if (dayTime === c.ovulation.getTime()) {
        isOvulation = true;
      }
    }

    let bg = 'bg-white';
    let text = 'text-slate-700';
    let ring = '';
    let label = '';

    if (isToday) ring = 'ring-2 ring-blue-400';
    if (isOvulation) {
      bg = 'bg-emerald-100';
      text = 'text-emerald-800 font-bold';
      label = 'Ov';
    } else if (isPeriod) {
      bg = 'bg-red-100';
      text = 'text-red-700 font-bold';
      label = 'P';
    } else if (isFertile) {
      bg = 'bg-emerald-50';
      text = 'text-emerald-700';
      label = 'F';
    }

    if (isPast && !isToday) {
      text += ' opacity-50';
    }

    return { bg, text, ring, label };
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden relative">
      {/* Privacy Badge */}
      <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 border-b border-emerald-100">
        <svg aria-hidden="true" className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-xs font-semibold text-emerald-800">
          100% Private: Your data is processed on your device and never sent to our servers.
        </span>
      </div>

      <div className="p-5 space-y-6">
        {/* Cycle Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
            <span className="font-semibold text-red-600">Period</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-200" />
            <span className="font-semibold text-emerald-600">Fertile Window</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
            <span className="font-semibold text-emerald-700">Ovulation Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border-2 border-blue-400" />
            <span className="font-semibold text-blue-600">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-white border border-slate-300" />
            <span>P: Period &middot; F: Fertile &middot; Ov: Ovulation</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-6">
          {months.map((m) => {
            // Pad first week
            const firstDay = m.days[0];
            const padStart = firstDay.getDay();
            const pad: null[] = new Array(padStart).fill(null);

            return (
              <div key={`${m.month}-${m.year}`}>
                <p className="text-sm font-bold text-slate-700 mb-2">{monthNames[m.month]} {m.year}</p>
                <div className="grid grid-cols-7 gap-1">
                  {/* Day headers */}
                  {dayNames.map((d) => (
                    <div key={d} className="text-[10px] font-bold text-slate-500 text-center py-1">{d}</div>
                  ))}
                  {/* Padding days */}
                  {pad.map((_, i) => (
                    <div key={`pad-${i}`} className="h-8" />
                  ))}
                  {/* Day cells */}
                  {m.days.map((day) => {
                    const classes = getDayClass(day);
                    const info = getDayInfo(day);
                    const isHovered = hoverDay?.day.getTime() === day.getTime();
                    return (
                      <div
                        key={day.toISOString()}
                        onMouseEnter={() => setHoverDay(info)}
                        onMouseLeave={() => setHoverDay(null)}
                        className={`h-8 flex flex-col items-center justify-center rounded-lg text-xs cursor-pointer ${classes.bg} ${classes.text} ${classes.ring} ${isHovered ? 'ring-2 ring-indigo-300 z-10' : ''}`}
                      >
                        <span>{day.getDate()}</span>
                        {classes.label && (
                          <span className="text-[8px] leading-none font-bold">{classes.label}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hover tooltip */}
        {hoverDay && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 flex items-center gap-3">
            <svg className="w-8 h-8 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-xs font-bold text-indigo-800">
                {hoverDay.day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-[11px] text-indigo-600">
                {hoverDay.phase === 'period' && 'Period day — bleeding phase of the menstrual cycle'}
                {hoverDay.phase === 'fertile' && 'Fertile window — highest chance of conception with unprotected intercourse'}
                {hoverDay.phase === 'ovulation' && 'Ovulation day — egg released from ovary, ~12–24 hour viability'}
                {hoverDay.phase === 'none' && 'Non-fertile phase of the cycle'}
                {hoverDay.cycleNum > 0 && ` — Cycle ${hoverDay.cycleNum}`}
                {hoverDay.isToday && ' (Today)'}
              </p>
            </div>
          </div>
        )}

        {/* Cycle Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {cycles.map((c, i) => (
            <div
              key={`item-${i}`}
              className={`rounded-xl border p-4 ${
                i === 0 ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
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
