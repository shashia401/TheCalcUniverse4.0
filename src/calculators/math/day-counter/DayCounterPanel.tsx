import type { CalculatorResult } from '../../../types/calculator';
import { CalendarDays, Clock, TrendingUp, Sparkles } from 'lucide-react';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getValue(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '';
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DayCounterPanel({ results }: Props) {
  const totalDays = parseInt(getValue(results, 'totalDays'), 10) || 0;
  const formattedBreakdown = getValue(results, 'formattedBreakdown');
  const totalWeeks = parseInt(getValue(results, 'totalWeeks'), 10) || 0;
  const totalHours = parseInt(getValue(results, 'totalHours'), 10) || 0;
  const totalMinutes = parseInt(getValue(results, 'totalMinutes'), 10) || 0;
  const businessDaysCount = getValue(results, 'businessDaysCount');
  const startDateDisplay = getValue(results, 'startDateDisplay');
  const endDateDisplay = getValue(results, 'endDateDisplay');
  const includeEndNote = getValue(results, 'includeEndNote');
  const businessMode = getValue(results, 'businessMode');
  const isBusiness = businessMode === 'Business Days Only';

  if (!totalDays && totalDays !== 0) return null;

  // Parse start/end dates for SVG display
  const startParts = startDateDisplay ? startDateDisplay.split('-') : [];
  const endParts = endDateDisplay ? endDateDisplay.split('-') : [];
  const startLabel = startParts.length === 3
    ? `${MONTH_NAMES[parseInt(startParts[1], 10) - 1] || ''} ${parseInt(startParts[2], 10)}, ${startParts[0]}`
    : startDateDisplay;
  const endLabel = endParts.length === 3
    ? `${MONTH_NAMES[parseInt(endParts[1], 10) - 1] || ''} ${parseInt(endParts[2], 10)}, ${endParts[0]}`
    : endDateDisplay;

  // Progress bar: assume 365 days = 100%
  const progressPct = Math.min((totalDays / 365) * 100, 100);

  return (
    <div className="space-y-6">
      {/* SVG Calendar Visual */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CalendarDays size={18} className="text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Date Range</span>
        </div>
        <div className="p-6">
          <svg viewBox="0 0 340 100" className="w-full max-w-lg mx-auto" role="img" aria-label="Date range timeline showing start and end dates with duration">
            {/* Calendar header bar */}
            <rect x="30" y="5" width="280" height="24" rx="5" fill="#6366f1" />
            <text x="170" y="21" textAnchor="middle" fontSize="10" className="fill-white" fontWeight="bold">
              {startLabel} &mdash; {endLabel}
            </text>

            {/* Start date box */}
            <rect x="30" y="38" width="110" height="28" rx="4" fill="#eef2ff" stroke="#6366f1" strokeWidth="1.5" />
            <text x="85" y="56" textAnchor="middle" fontSize="9" fill="#6366f1" fontWeight="bold">
              {startLabel}
            </text>

            {/* Arrow */}
            <text x="170" y="57" textAnchor="middle" fontSize="16" fill="#94a3b8" fontWeight="bold">
              &rarr;
            </text>

            {/* End date box */}
            <rect x="200" y="38" width="110" height="28" rx="4" fill="#eef2ff" stroke="#6366f1" strokeWidth="1.5" />
            <text x="255" y="56" textAnchor="middle" fontSize="9" fill="#6366f1" fontWeight="bold">
              {endLabel}
            </text>

            {/* Days bar */}
            <rect x="30" y="78" width="280" height="14" rx="7" fill="#e2e8f0" />
            <rect x="30" y="78" width={Math.max(20, (280 * progressPct) / 100)} height="14" rx="7" fill="#6366f1" />
            <text x="170" y="89" textAnchor="middle" fontSize="8" className={progressPct > 50 ? 'fill-white' : 'fill-slate-600'} fontWeight="bold">
              {totalDays} {totalDays === 1 ? 'day' : 'days'}
            </text>
          </svg>
        </div>
      </div>

      {/* Large Day Count Display */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-blue-50">
          <TrendingUp size={16} className="text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Day Count</span>
        </div>
        <div className="p-6 text-center">
          <p className="text-6xl font-black text-indigo-700 leading-tight">
            {totalDays.toLocaleString()}
          </p>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            {totalDays === 1 ? 'day' : 'days'} from {startLabel} to {endLabel}
          </p>
          {includeEndNote === 'Yes (+1 day)' && (
            <p className="text-xs text-amber-600 mt-1 font-medium">
              End date included in count
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <Clock size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Progress (based on 1 year)</span>
        </div>
        <div className="p-5">
          <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            {totalDays.toLocaleString()} days = {progressPct.toFixed(1)}% of a year
          </p>
        </div>
      </div>

      {/* Time Unit Breakdowns */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <Sparkles size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Time Unit Breakdown</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y sm:divide-y-0 divide-slate-100">
          <div className="p-5 text-center">
            <p className="text-lg font-black text-indigo-600">{formattedBreakdown}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Years : Months : Days</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-2xl font-black text-emerald-600">{totalWeeks.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Total Weeks</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-2xl font-black text-amber-600">{totalHours.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Total Hours</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-2xl font-black text-rose-600">{totalMinutes.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Total Minutes</p>
          </div>
        </div>
      </div>

      {/* Business Days Note */}
      {isBusiness && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-md shadow-amber-100/40 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-amber-200 bg-amber-100/50">
            <CalendarDays size={16} className="text-amber-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">Business Days Only</span>
          </div>
          <div className="p-5 flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-black text-amber-700">{businessDaysCount}</p>
              <p className="text-xs text-amber-600 mt-1 font-medium">Business Days</p>
            </div>
            <p className="text-xs text-amber-700/70 leading-relaxed max-w-xs">
              Only Monday through Friday are counted. Weekends are excluded from the total.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
