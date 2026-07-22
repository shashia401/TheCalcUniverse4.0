import { useMemo } from 'react';
import type { CalculatorResult } from '../../../types/calculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarRange, Briefcase, Timer } from 'lucide-react';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getValue(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '';
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

  // Parse days, hours, minutes from the D:H:M string for SVG
  const dhMatch = daysHoursMinutes.match(/(\d+)d\s+(\d+)h\s+(\d+)m/);
  const dhDays = dhMatch ? parseInt(dhMatch[1]) : 0;
  const dhHours = dhMatch ? parseInt(dhMatch[2]) : 0;

  // For timeline: show a proportional visual
  const totalDisplayHours = parseFloat(totalHours);
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
            <text x="30" y="84" textAnchor="middle" fontSize="7" fill="#94a3b8">
              {startDateTime}
            </text>

            {/* End marker */}
            <circle cx="310" cy="40" r="10" fill="#6366f1" className="stroke-white" strokeWidth="3" />
            <text x="310" y="72" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="bold">
              End
            </text>
            <text x="310" y="84" textAnchor="middle" fontSize="7" fill="#94a3b8">
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
        const d = dhDays;
        const h = dhHours;
        const m = parseInt(daysHoursMinutes.match(/(\d+)m/)?.[1] || '0', 10);
        const totalDisplay = d * 24 + h + m / 60;
        if (totalDisplay <= 0) return null;
        const chartData = [
          { name: 'Days', value: d, color: '#6366f1' },
          { name: 'Hours', value: h, color: '#10b981' },
          { name: 'Minutes', value: m, color: '#f59e0b' },
        ].filter(item => item.value > 0);
        return (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Duration by Unit</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
          <p className="text-3xl font-black text-amber-600">
            {daysHoursMinutes.match(/(\d+)m/)?.[1] || '0'}
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
              <div className="text-xs text-amber-700/70 leading-relaxed max-w-xs">
                Weekends (Saturday and Sunday) were excluded from this count. Only weekdays between the start and end dates are included.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
