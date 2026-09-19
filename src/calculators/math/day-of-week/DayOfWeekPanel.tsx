import type { CalculatorResult } from '../../../types/calculator';
import { CalendarDays, Calculator, BookOpen } from 'lucide-react';
import { getResultValue as getValue } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DayOfWeekPanel({ results }: Props) {
  const dayOfWeek = getValue(results, 'dayOfWeek');
  const formattedDate = getValue(results, 'formattedDate');
  const month = parseInt(getValue(results, 'month'));
  const day = parseInt(getValue(results, 'day'));
  const year = parseInt(getValue(results, 'year'));
  const zellersBreakdown = getValue(results, 'zellersBreakdown');
  const firstDayOfMonth = getValue(results, 'firstDayOfMonth');
  const daysInMonth = parseInt(getValue(results, 'daysInMonth'));

  if (!dayOfWeek) return null;

  // Build month calendar grid
  const firstDayIndex = DAY_HEADERS.indexOf(firstDayOfMonth.slice(0, 3));
  const targetDayIndex = daysInMonth > 0 ? day : -1;

  return (
    <div className="space-y-6">
      {/* SVG Calendar Page */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CalendarDays size={18} className="text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Calendar Page</span>
        </div>
        <div className="p-4">
          <svg viewBox="0 0 300 220" className="w-full max-w-sm mx-auto" role="img" aria-label="Calendar page layout showing days of the month with highlighted date">
            {/* Month/Year header */}
            <rect x="20" y="5" width="260" height="28" rx="5" fill="#6366f1" />
            <text x="150" y="24" textAnchor="middle" fontSize="11" className="fill-white" fontWeight="bold">
              {formattedDate.split(',')[0]}, {formattedDate.split(', ').slice(1).join(', ')}
            </text>

            {/* Day headers */}
            {DAY_HEADERS.map((d, i) => (
              <text
                key={d}
                x={35 + i * 34}
                y="48"
                textAnchor="middle"
                fontSize="8"
                fill="#94a3b8"
                fontWeight="bold"
              >
                {d}
              </text>
            ))}

            {/* Calendar cells - render up to 6 rows */}
            {(() => {
              const cells: React.ReactNode[] = [];
              const totalCells = firstDayIndex + daysInMonth;
              const rows = Math.ceil(totalCells / 7);

              for (let row = 0; row < rows; row++) {
                for (let col = 0; col < 7; col++) {
                  const cellIndex = row * 7 + col;
                  const dayNum = cellIndex - firstDayIndex + 1;

                  if (dayNum < 1 || dayNum > daysInMonth) {
                    // Empty cell
                    cells.push(
                      <rect
                        key={`empty-${row}-${col}`}
                        x={28 + col * 34}
                        y={55 + row * 26}
                        width="30"
                        height="22"
                        rx="3"
                        fill="transparent"
                      />
                    );
                  } else {
                    const isTarget = dayNum === targetDayIndex;
                    cells.push(
                      <g key={`day-${dayNum}`}>
                        <rect
                          x={28 + col * 34}
                          y={55 + row * 26}
                          width="30"
                          height="22"
                          rx="3"
                          fill={isTarget ? '#6366f1' : '#f1f5f9'}
                          stroke={isTarget ? '#4f46e5' : 'none'}
                          strokeWidth="1.5"
                        />
                        <text
                          x={43 + col * 34}
                          y={70 + row * 26}
                          textAnchor="middle"
                          fontSize="9"
                          className={isTarget ? 'fill-white' : 'fill-slate-600'}
                          fontWeight={isTarget ? 'bold' : 'normal'}
                        >
                          {dayNum}
                        </text>
                      </g>
                    );
                  }
                }
              }
              return cells;
            })()}
          </svg>
        </div>
      </div>

      {/* Day of Week Highlight */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden text-center p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Day of the Week</p>
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-50 border-2 border-indigo-200 shadow-sm shadow-indigo-200/50 mb-2">
          <span className="text-lg font-black text-indigo-700 text-center leading-tight px-1">
            {dayOfWeek.slice(0, 3).toUpperCase()}
          </span>
        </div>
        <p className="text-2xl font-black text-indigo-700">{dayOfWeek}</p>
        <p className="text-sm text-slate-500 mt-1">{formattedDate}</p>
      </div>

      {/* Zeller's Congruence Formula Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <Calculator size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Zeller&apos;s Congruence Formula
          </span>
        </div>
        <div className="p-5 space-y-3">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-sm font-mono text-slate-700 leading-relaxed">
              h = (q + &lfloor;13(m+1)/5&rfloor; + K + &lfloor;K/4&rfloor; + &lfloor;J/4&rfloor; &minus; 2J) mod 7
            </p>
          </div>
          <div className="text-xs text-slate-600 space-y-1 font-mono bg-indigo-50 rounded-xl p-3 border border-indigo-100">
            <p className="text-indigo-700 font-bold text-[11px]">Step-by-step for this date:</p>
            <p>{zellersBreakdown}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs font-black text-indigo-600">{day}</p>
              <p className="text-[9px] text-slate-500">q (day)</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs font-black text-emerald-600">{month < 3 ? month + 12 : month}</p>
              <p className="text-[9px] text-slate-500">m (adj. month)</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs font-black text-amber-600">{year % 100}</p>
              <p className="text-[9px] text-slate-500">K (year mod 100)</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs font-black text-rose-600">{Math.floor(year / 100)}</p>
              <p className="text-[9px] text-slate-500">J (century)</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs font-black text-purple-600">{DAY_HEADERS.indexOf(dayOfWeek.slice(0, 3))}</p>
              <p className="text-[9px] text-slate-500">h (result)</p>
            </div>
          </div>
        </div>
      </div>

      {/* This Day in History Placeholder */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-yellow-50">
          <BookOpen size={16} className="text-amber-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700">This Day in History</span>
        </div>
        <div className="p-5 text-center">
          <p className="text-sm text-slate-500 italic">
            Historical events for {formattedDate} would appear here.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            (Fun fact placeholder &mdash; connect to a history API for live data)
          </p>
        </div>
      </div>
    </div>
  );
}
