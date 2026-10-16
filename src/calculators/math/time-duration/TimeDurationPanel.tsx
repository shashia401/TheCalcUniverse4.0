import type { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import { CalendarRange, Briefcase, Timer } from 'lucide-react';
import { getResultValue as getValue } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function TimeDurationPanel({ results }: Props) {
  const totalHours = getValue(results, 'totalHours');
  const totalMinutes = getValue(results, 'totalMinutes');
  const totalSeconds = getValue(results, 'totalSeconds');
  const daysHoursMinutes = getValue(results, 'daysHoursMinutes');
  const weeksDaysHours = getValue(results, 'weeksDaysHours');
  const businessDays = getValue(results, 'businessDays');
  const startDateTime = getValue(results, 'startDateTime');
  const endDateTime = getValue(results, 'endDateTime');
  const businessMode = getValue(results, 'businessMode');
  const isBusiness = businessMode === 'Business Days';

  if (!totalHours) return null;

  // Days / hours / minutes come straight from the calculator (no parsing of the "6d 2h 5m" display string)
  let parts = { days: 0, hours: 0, minutes: 0, totalHours: 0 };
  try { parts = { ...parts, ...JSON.parse(getValue(results, '_parts')) }; } catch { /* keep zeros */ }
  const dhDays = parts.days;
  const dhHours = parts.hours;
  const dhMinutes = parts.minutes;

  // For timeline: show a proportional visual
  const totalDisplayHours = parts.totalHours;
  const timelineRatio = Math.min(totalDisplayHours / 168, 1); // Cap at 1 week

  return (
    <div className="space-y-6">
      {/* SVG Timeline Visualization */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CalendarRange size={18} className="text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Timeline</span>
        </div>
        <div className="p-6">
          <svg viewBox="0 0 340 90" className="w-full max-w-lg mx-auto" role="img" aria-label="Time duration timeline from start to end">
            {/* Background track */}
            <rect x="30" y="32" width="280" height="16" rx="8" fill="#e2e8f0" />

            {/* Filled progress */}
            <rect x="30" y="32" width={Math.max(16, 280 * timelineRatio)} height="16" rx="8" fill="#6366f1" />

            {/* Start marker */}
            <circle cx="30" cy="40" r="10" fill="#6366f1" className="stroke-white" strokeWidth="3" />
            <text x="30" y="72" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="bold">
              Start
            </text>
            <text x="30" y="84" textAnchor="middle" fontSize="8" fill="#64748b">
              {startDateTime}
            </text>

            {/* End marker */}
            <circle cx="310" cy="40" r="10" fill="#6366f1" className="stroke-white" strokeWidth="3" />
            <text x="310" y="72" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="bold">
              End
            </text>
            <text x="310" y="84" textAnchor="middle" fontSize="8" fill="#64748b">
              {endDateTime}
            </text>

            {/* Duration label on the bar */}
            <text x="170" y="25" textAnchor="middle" fontSize="10" fill="#6366f1" fontWeight="bold">
              {daysHoursMinutes}
            </text>
          </svg>
        </div>
      </div>

      {/* Duration Bar Chart */}
      {(() => {
        const chartData = [
          { label: 'Days', value: dhDays, color: '#4f46e5' },
          { label: 'Hours', value: dhHours, color: '#059669' },
          { label: 'Minutes', value: dhMinutes, color: '#b45309' },
        ].filter((item) => item.value > 0);
        if (!chartData.length) return null;
        return (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Duration by Unit</p>
            <SvgBarChart data={chartData} ariaLabel={`Duration by unit: ${daysHoursMinutes}`} height={160} maxBarWidth={48} />
          </div>
        );
      })()}

      {/* Duration Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <Timer size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Duration Breakdown</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y sm:divide-y-0 divide-slate-100">
          <div className="p-5 text-center">
            <p className="text-2xl font-black text-indigo-600">{parseFloat(totalHours).toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Total Hours</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-2xl font-black text-emerald-600">{parseInt(totalMinutes).toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Total Minutes</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-2xl font-black text-amber-600">{parseInt(totalSeconds).toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Total Seconds</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-xl font-black text-rose-600">{weeksDaysHours}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Weeks : Days : Hours</p>
          </div>
        </div>
      </div>

      {/* D:H:M Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden p-5 text-center">
          <p className="text-3xl font-black text-indigo-600">{dhDays}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Days</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden p-5 text-center">
          <p className="text-3xl font-black text-emerald-600">{dhHours}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Hours</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden p-5 text-center">
          <p className="text-3xl font-black text-amber-700">
            {dhMinutes}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Minutes</p>
        </div>
      </div>

      {/* Business Days Section */}
      {isBusiness && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-md shadow-amber-100/40 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-amber-200 bg-amber-100/50">
            <Briefcase size={16} className="text-amber-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">Business Days Mode</span>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-black text-amber-700">{businessDays}</p>
                <p className="text-xs text-amber-600 mt-1 font-medium">Business Days (Mon-Fri)</p>
              </div>
              <div className="text-xs text-amber-800 leading-relaxed max-w-xs">
                Weekends (Saturday and Sunday) were excluded from this count. Only weekdays from the start date through the end date, both included, are counted.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
