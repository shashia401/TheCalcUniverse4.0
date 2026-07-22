import { useMemo } from 'react';
import type { CalculatorResult } from '../../../types/calculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

/* ------------------------------------------------------------------ */
/*  Utility: find a result row by id                                   */
/* ------------------------------------------------------------------ */
function r(results: CalculatorResult[], id: string): CalculatorResult | undefined {
  return results.find((x) => x.id === id);
}

/* ------------------------------------------------------------------ */
/*  Timeline bar                                                       */
/* ------------------------------------------------------------------ */
function TimelineBar({
  startTime,
  endTime,
  breakMinutes,
  isOvernight,
}: {
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isOvernight: boolean;
}) {
  /* Parse times to get rough proportions — we work with "hour of day" (0–23 / 24+) */
  const parseToHourOfDay = (input: string): number | null => {
    const trimmed = input.trim();
    const ampmMatch = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(trimmed);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
      const isPM = ampmMatch[3].toUpperCase() === 'PM';
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      return hours + minutes / 60;
    }

    const h24Match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
    if (h24Match) {
      const hours = parseInt(h24Match[1], 10);
      const minutes = parseInt(h24Match[2], 10);
      return hours + minutes / 60;
    }

    return null;
  };

  const startH = parseToHourOfDay(startTime);
  const endH = parseToHourOfDay(endTime);

  if (startH === null || endH === null) return null;

  /* Build timeline segments using a 24-hour scale.
     For overnight shifts the end extends past 24. */
  let adjEnd = endH;
  if (isOvernight) adjEnd = endH + 24;

  const totalDuration = adjEnd - startH;
  const breakDuration = breakMinutes / 60; // in hours
  const workDuration = totalDuration - breakDuration;

  if (totalDuration <= 0) return null;

  const pct = (hours: number) => (hours / totalDuration) * 100;

  const workPct = pct(workDuration);
  const breakPct = pct(breakDuration);

  return (
    <div className="mb-4">
      <div className="relative h-8 rounded-full bg-gradient-to-r from-blue-100 via-slate-100 to-indigo-100 border border-slate-200 overflow-hidden flex">
        {/* Work segment */}
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-l-full"
          style={{
            width: `${Math.max(workPct, 5)}%`,
            transition: 'width 0.3s ease',
          }}
        />
        {/* Break gap */}
        {breakDuration > 0 && (
          <div
            className="h-full bg-amber-200 border-x-2 border-amber-400 relative flex items-center justify-center"
            style={{
              width: `${Math.max(breakPct, 3)}%`,
              minWidth: '16px',
              transition: 'width 0.3s ease',
            }}
          >
            <span className="text-[8px] font-bold text-amber-700 leading-none absolute inset-0 flex items-center justify-center">
              {breakMinutes}m
            </span>
          </div>
        )}
        {/* Overflow work segment for overnight */}
        {isOvernight && workPct < 95 && (
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-r-full"
            style={{
              width: `${Math.max(workPct * 0.3, 5)}%`,
              transition: 'width 0.3s ease',
            }}
          />
        )}
      </div>

      {/* Time labels */}
      <div className="flex justify-between mt-1 text-[10px] font-mono font-bold text-slate-500 px-0.5">
        <span>{startTime}</span>
        {breakDuration > 0 && <span className="text-amber-600">Break</span>}
        <span>{endTime}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main TimePanel component                                          */
/* ------------------------------------------------------------------ */
export default function TimePanel({ values, results }: Props) {
  const standardRow = r(results, 'standardTime');
  const decimalRow = r(results, 'decimalTime');
  const totalMinRow = r(results, 'totalMinutes');
  const breakRow = r(results, 'breakTime');
  const grossPayRow = r(results, 'grossPay');
  const rateRow = r(results, 'hourlyRate');

  if (!standardRow) return null;

  const startTime = values.startTime ?? '';
  const endTime = values.endTime ?? '';
  const breakMins = parseInt(values.breakMinutes || '0', 10) || 0;

  /* Determine if this schedule crosses midnight */
  /* We re-parse to check overnight — avoid importing parseTime by inferring */
  const startParsed = parseTimeSimple(startTime);
  const endParsed = parseTimeSimple(endTime);
  const isOvernight =
    startParsed !== null &&
    endParsed !== null &&
    endParsed.totalMinutes < startParsed.totalMinutes;

  /* Extract HH:MM parts from the standardTime value string */
  const hoursMatch = standardRow.value.match(/(\d+)\s*hours?\s*(\d*)/);
  const displayHours = hoursMatch ? hoursMatch[1] : '0';
  const displayMinutes = hoursMatch && hoursMatch[2] !== '' ? hoursMatch[2].padStart(2, '0') : '00';
  const decimalValue = decimalRow?.value ?? '0.00';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Time Breakdown
        </span>
        {isOvernight && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
            <svg aria-hidden="true" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            Midnight Crossing
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Timeline visual */}
        <TimelineBar
          startTime={startTime}
          endTime={endTime}
          breakMinutes={breakMins}
          isOvernight={isOvernight}
        />

        {/* Big time display */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Total Time</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl font-mono font-bold text-blue-700 tracking-tight">
              {displayHours}:{displayMinutes}
            </span>
            <span className="text-lg font-mono text-slate-500">HH:MM</span>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-1.5 border border-blue-100">
            <span className="text-xs font-medium text-slate-500">Decimal:</span>
            <span className="text-sm font-mono font-bold text-indigo-600">{decimalValue}</span>
            <span className="text-[10px] text-slate-500">hrs</span>
          </div>
        </div>

        {/* Info cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* Start time */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Start</p>
            <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{startTime || '—'}</p>
          </div>

          {/* End time */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">End</p>
            <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{endTime || '—'}</p>
          </div>

          {/* Break deduction */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Break</p>
            <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">
              {breakRow?.value ?? 'None'}
            </p>
          </div>

          {/* Total minutes */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Minutes</p>
            <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">
              {totalMinRow?.value ?? '0'}
            </p>
          </div>
        </div>

        {/* Pay card */}
        {grossPayRow && rateRow && (
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">
              Earnings Summary
            </p>
            <div className="flex items-baseline justify-center gap-3">
              <span className="text-3xl font-bold text-emerald-700">{grossPayRow.value}</span>
              <span className="text-sm font-mono text-emerald-600">at {rateRow.value}</span>
            </div>
            <div className="mt-2 text-center">
              <span className="text-xs text-emerald-600">
                {decimalValue} hrs × {rateRow.value.replace('/hr', '')}/hr
              </span>
            </div>
          </div>
        )}

        {/* Hours Breakdown Chart */}
        {(() => {
          const workHrs = parseFloat(decimalValue) || 0;
          const breakHrs = breakMins / 60;
          if (workHrs <= 0) return null;
          const chartData = [
            { name: 'Work Hours', value: workHrs, color: '#3b82f6' },
            { name: 'Break', value: breakHrs, color: '#f59e0b' },
          ];
          return (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Hours Breakdown</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    formatter={((val: number) => [`${val.toFixed(2)} hrs`, undefined]) as any}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={32}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* Quick reference: common time formats */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Common Shift Lengths
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">4:00</p>
              <p className="text-slate-500">Half-day</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">8:00</p>
              <p className="text-slate-500">Standard</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">10:00</p>
              <p className="text-slate-500">Extended</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-slate-700">12:00</p>
              <p className="text-slate-500">Double</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Simple parse helper for panel (avoids duplicating full parseTime)  */
/* ------------------------------------------------------------------ */
function parseTimeSimple(input: string): { totalMinutes: number } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try 12-hour format
  const ampmMatch = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(trimmed);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const isPM = ampmMatch[3].toUpperCase() === 'PM';
    if (hours < 1 || hours > 12 || minutes > 59) return null;
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return { totalMinutes: hours * 60 + minutes };
  }

  // Try 24-hour format
  const h24Match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (h24Match) {
    const hours = parseInt(h24Match[1], 10);
    const minutes = parseInt(h24Match[2], 10);
    if (hours < 0 || hours > 23 || minutes > 59) return null;
    return { totalMinutes: hours * 60 + minutes };
  }

  return null;
}
