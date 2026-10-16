import type { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

/** The numbers the calculator already worked out (hidden "_parts" result): the panel never re-parses the inputs. */
interface Parts {
  startMinutes: number;
  endMinutes: number;
  breakMinutes: number;
  workingMinutes: number;
  overnight: boolean;
  decimalHours: number;
}

function r(results: CalculatorResult[], id: string): CalculatorResult | undefined {
  return results.find((x) => x.id === id);
}

/* ------------------------------------------------------------------ */
/*  Timeline bar: work and break shown in proportion to the shift      */
/* ------------------------------------------------------------------ */
function TimelineBar({ startTime, endTime, parts }: { startTime: string; endTime: string; parts: Parts }) {
  const total = parts.workingMinutes + parts.breakMinutes;
  if (total <= 0) return null;
  const workPct = (parts.workingMinutes / total) * 100;
  const breakPct = (parts.breakMinutes / total) * 100;

  return (
    <div className="mb-4">
      <div
        role="img"
        aria-label={`Shift from ${startTime} to ${endTime}: ${parts.workingMinutes} minutes of work${parts.breakMinutes > 0 ? ` and a ${parts.breakMinutes} minute break` : ''}`}
        className="relative h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex"
      >
        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${workPct}%` }} />
        {parts.breakMinutes > 0 && (
          <div
            className="h-full bg-amber-200 border-l-2 border-amber-400"
            style={{ width: `${breakPct}%` }}
            title={`${parts.breakMinutes} minute break`}
          />
        )}
      </div>

      {/* Time labels */}
      <div className="flex justify-between mt-1 text-[10px] font-mono font-bold text-slate-500 px-0.5">
        <span>{startTime}</span>
        {parts.breakMinutes > 0 && <span className="text-amber-700">Break: {parts.breakMinutes} min</span>}
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
  const partsRow = r(results, '_parts');

  if (!standardRow || !partsRow) return null;

  let parts: Parts;
  try {
    parts = JSON.parse(partsRow.value);
  } catch {
    return null;
  }

  const startTime = values.startTime ?? '';
  const endTime = values.endTime ?? '';
  const displayHours = String(Math.floor(parts.workingMinutes / 60));
  const displayMinutes = String(parts.workingMinutes % 60).padStart(2, '0');
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
        {parts.overnight && (
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
        <TimelineBar startTime={startTime} endTime={endTime} parts={parts} />

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
            <span className="text-sm font-mono font-bold text-indigo-700">{decimalValue}</span>
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2">
              Earnings Summary
            </p>
            <div className="flex items-baseline justify-center gap-3">
              <span className="text-3xl font-bold text-emerald-700">{grossPayRow.value}</span>
              <span className="text-sm font-mono text-emerald-700">at {rateRow.value}</span>
            </div>
            <div className="mt-2 text-center">
              <span className="text-xs text-emerald-700">
                {decimalValue} hrs × {rateRow.value.replace('/hr', '')}/hr
              </span>
            </div>
          </div>
        )}

        {/* Hours Breakdown Chart (shared SVG chart, no charting library) */}
        {parts.decimalHours > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Hours Breakdown</p>
            <SvgBarChart
              height={160}
              maxBarWidth={64}
              ariaLabel={`Hours breakdown: ${parts.decimalHours.toFixed(2)} hours of work and ${(parts.breakMinutes / 60).toFixed(2)} hours of break`}
              data={[
                { label: 'Work hours', value: parts.decimalHours, color: '#2563eb' },
                { label: 'Break', value: parts.breakMinutes / 60, color: '#b45309' },
              ]}
            />
          </div>
        )}

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
