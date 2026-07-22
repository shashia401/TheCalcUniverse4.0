import type { CalculatorResult } from '../../../types/calculator';
import { ArrowRight, Clock, Globe, Sun } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface TzEntry {
  id: string;
  label: string;
  offset: number;
}

interface BizHourCell {
  hour: number;
  color: 'green' | 'yellow' | 'gray';
}

interface OverlapData {
  overlapStart: number;
  overlapEnd: number;
  durationHours: number;
  hours: BizHourCell[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const WORLD_CLOCK: TzEntry[] = [
  { id: 'london', label: 'London', offset: 0 },
  { id: 'ny', label: 'New York', offset: -5 },
  { id: 'la', label: 'Los Angeles', offset: -8 },
  { id: 'tokyo', label: 'Tokyo', offset: 9 },
  { id: 'sydney', label: 'Sydney', offset: 10 },
  { id: 'dubai', label: 'Dubai', offset: 4 },
  { id: 'singapore', label: 'Singapore', offset: 8 },
  { id: 'berlin', label: 'Berlin', offset: 1 },
];

function getVal(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '';
}

function formatClock(hours: number, minutes: number): string {
  const period = hours >= 12 ? 'PM' : 'AM';
  const display = hours % 12 || 12;
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${display}:${minStr} ${period}`;
}

function computeTargetTime(srcH: number, srcM: number, srcOff: number, dstOff: number): { hours: number; minutes: number; dayLabel: string } {
  const srcMin = srcH * 60 + srcM;
  const diff = (dstOff - srcOff) * 60;
  let tgtMin = srcMin + diff;

  let dayLabel = '';
  if (tgtMin >= 1440) {
    dayLabel = '+1';
    tgtMin -= 1440;
  } else if (tgtMin < 0) {
    dayLabel = '-1';
    tgtMin += 1440;
  }

  return { hours: Math.floor(tgtMin / 60), minutes: Math.round(tgtMin % 60), dayLabel };
}

/* ------------------------------------------------------------------ */
/*  Overlap grid                                                       */
/* ------------------------------------------------------------------ */

function OverlapGrid({ data }: { data: OverlapData }) {
  const rows: React.ReactNode[] = [];
  for (let row = 0; row < 4; row++) {
    const cells: React.ReactNode[] = [];
    for (let col = 0; col < 6; col++) {
      const idx = row * 6 + col;
      if (idx >= data.hours.length) break;
      const cell = data.hours[idx];
      const isBizSrc = cell.hour >= 9 && cell.hour < 17;
      let bg = '';
      if (cell.color === 'green') bg = 'bg-emerald-400';
      else if (cell.color === 'yellow') bg = 'bg-amber-300';
      else bg = 'bg-slate-200';
      const hourStr = cell.hour.toString().padStart(2, '0');
      cells.push(
        <div
          key={cell.hour}
          className={`${bg} flex items-center justify-center rounded text-[9px] font-semibold leading-none`}
          style={isBizSrc ? { color: '#1e3a5f' } : { color: '#64748b' }}
          title={`${hourStr}:00 - ${isBizSrc ? 'Business' : 'Non-business'} (${cell.color})`}
        >
          {hourStr}
        </div>,
      );
    }
    rows.push(
      <div key={row} className="grid grid-cols-6 gap-1">
        {cells}
      </div>,
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 text-center">
        24-Hour Business Hours Grid (source zone)
      </div>
      {rows}
      <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-2 justify-center">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-emerald-400" /> Both
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-amber-300" /> One
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-slate-200" /> Neither
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  World clock                                                         */
/* ------------------------------------------------------------------ */

function WorldClockList({ srcH, srcM, off }: { srcH: number; srcM: number; off: number }) {
  const items: React.ReactNode[] = [];
  for (let i = 0; i < WORLD_CLOCK.length; i++) {
    const wc = WORLD_CLOCK[i];
    const tgt = computeTargetTime(srcH, srcM, off, wc.offset);
    const timeStr = formatClock(tgt.hours, tgt.minutes) + (tgt.dayLabel ? ` (${tgt.dayLabel})` : '');
    items.push(
      <div
        key={wc.id}
        className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-100"
      >
        <span className="text-xs font-semibold text-slate-700">{wc.label}</span>
        <span className="text-xs font-mono font-bold text-slate-900">{timeStr}</span>
      </div>,
    );
  }
  return <div className="space-y-1.5">{items}</div>;
}

/* ------------------------------------------------------------------ */
/*  Main panel                                                         */
/* ------------------------------------------------------------------ */

export default function TimeZonePanel({ values, results }: Props) {
  const convertedTime = getVal(results, 'convertedTime');
  const fromInfo = getVal(results, 'fromInfo');
  const toInfo = getVal(results, 'toInfo');
  const diffText = getVal(results, 'timeDifference');
  const bizOverlap = getVal(results, 'businessOverlap');
  const overlapRaw = getVal(results, 'overlapData');

  if (!convertedTime || !fromInfo) return null;

  const fromLabel = fromInfo.split(' -- ')[0] || fromInfo;
  const toLabel = toInfo.split(' -- ')[0] || toInfo;

  let overlapData: OverlapData | null = null;
  if (overlapRaw) {
    try {
      overlapData = JSON.parse(overlapRaw);
    } catch {
      overlapData = null;
    }
  }

  // Parse source time from user-entered value
  let srcOffset = -5; // default EST
  let srcH = 14; // default 2 PM
  let srcM = 0;
  const utcMatch = fromInfo.match(/UTC([+-]\d+(?::\d+)?)/);
  if (utcMatch) {
    const val = parseFloat(utcMatch[1]);
    if (!isNaN(val)) srcOffset = val;
  }
  // Use actual user-entered source time for world clock
  if (values?.time) {
    const t = values.time.trim();
    const ampm = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t);
    if (ampm) {
      let h = parseInt(ampm[1], 10);
      const m = parseInt(ampm[2], 10);
      if (h >= 1 && h <= 12 && m >= 0 && m <= 59) {
        if (ampm[3].toUpperCase() === 'PM' && h !== 12) h += 12;
        if (ampm[3].toUpperCase() === 'AM' && h === 12) h = 0;
        srcH = h;
        srcM = m;
      }
    } else {
      const mil = /^(\d{1,2}):(\d{2})$/.exec(t);
      if (mil) {
        const h = parseInt(mil[1], 10);
        const m = parseInt(mil[2], 10);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          srcH = h;
          srcM = m;
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Time Comparison Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <Clock size={18} className="text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Time Converter</span>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center gap-3 sm:gap-6">
            {/* Source Time */}
            <div className="text-center flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 truncate">
                {fromLabel}
              </p>
              <div className="inline-flex items-center justify-center h-16 sm:h-20 px-4 rounded-xl bg-slate-100 border border-slate-200">
                <span className="text-base sm:text-lg font-black text-indigo-600 whitespace-nowrap">
                  {getVal(results, 'convertedTime').replace(/\s*\(.*?\)\s*$/, '')}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center flex-shrink-0">
              <div className="flex flex-col items-center gap-0.5">
                <ArrowRight size={28} strokeWidth={2.5} className="text-indigo-400" />
                <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap">
                  {diffText}
                </span>
              </div>
            </div>

            {/* Target Time */}
            <div className="text-center flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 truncate">
                {toLabel}
              </p>
              <div className="inline-flex items-center justify-center h-16 sm:h-20 px-4 rounded-xl bg-indigo-50 border-2 border-indigo-200 shadow-sm shadow-indigo-200/50">
                <span className="text-base sm:text-lg font-black text-indigo-700 whitespace-nowrap">
                  {convertedTime}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Hours Overlay */}
      {overlapData && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
            <Sun size={16} className="text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Business Hours Overlap</span>
          </div>
          <div className="p-5">
            <div className="text-center mb-4">
              <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200">
                {bizOverlap}
              </span>
            </div>
            <OverlapGrid data={overlapData} />
          </div>
        </div>
      )}

      {/* World Clock Reference */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-gray-50">
          <Globe size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">World Clock Reference</span>
        </div>
        <div className="p-5">
          <WorldClockList srcH={srcH} srcM={srcM} off={srcOffset} />
        </div>
      </div>
    </div>
  );
}
