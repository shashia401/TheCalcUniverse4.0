import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// ─── Types ───────────────────────────────────────────────────────────────────────

interface DayEntry {
  day: string;
  dayLabel: string;
  start: string;
  end: string;
  breakStr: string;
  hours: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function parseNum(s: string): number {
  const m = /([\d,.]+)/.exec(s.replace(/,/g, ''));
  return m ? parseFloat(m[1]) : 0;
}

function fmtHours(n: number): string {
  return n.toFixed(2);
}

// ─── Component ───────────────────────────────────────────────────────────────────

export default function TimeCardPanel({ results }: Props) {
  const totalHours = results.find((r) => r.id === 'totalHours');
  const regularHours = results.find((r) => r.id === 'regularHours');
  const overtimeHours = results.find((r) => r.id === 'overtimeHours');
  const totalPay = results.find((r) => r.id === 'totalPay');
  const regularPay = results.find((r) => r.id === 'regularPay');
  const overtimePay = results.find((r) => r.id === 'overtimePay');
  const dailyBreakdown = results.find((r) => r.id === '_dailyBreakdown');
  const weekNumber = results.find((r) => r.id === 'weekNumber');

  if (!totalHours || !regularHours || !overtimeHours) return null;

  const otHrs = parseNum(overtimeHours.value);
  const hasOvertime = otHrs > 0;
  const hasPay = !!totalPay;

  // Parse daily breakdown data
  let dailyData: DayEntry[] = [];
  if (dailyBreakdown) {
    try {
      const parsed = JSON.parse(dailyBreakdown.value);
      if (Array.isArray(parsed)) {
        dailyData = parsed;
      }
    } catch {
      // ignore parse errors
    }
  }

  const maxDayHours = dailyData.reduce((max, d) => Math.max(max, d.hours), 0);

  return (
    <div className="space-y-5">
      {/* ── Week Header ── */}
      {weekNumber && weekNumber.value && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {weekNumber.label}
          </p>
          <p className="text-lg font-semibold text-slate-800">{weekNumber.value}</p>
        </div>
      )}

      {/* ── Weekly Summary Card ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Weekly Summary
          </span>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-slate-500 mb-1">{totalHours.label}</p>
            <p className="text-5xl font-extrabold text-blue-700">{totalHours.value}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">{regularHours.label}</p>
              <p className="text-2xl font-bold text-green-700">{regularHours.value}</p>
            </div>
            <div className={`rounded-lg border p-4 text-center ${
              hasOvertime ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <p className="text-xs text-slate-500 mb-1">{overtimeHours.label}</p>
              <p className={`text-2xl font-bold ${hasOvertime ? 'text-amber-700' : 'text-slate-500'}`}>
                {overtimeHours.value}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Daily Breakdown Table ── */}
      {dailyData.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Daily Breakdown
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Day</th>
                  <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Start</th>
                  <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">End</th>
                  <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Break</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyData.map((entry, _idx) => {
                  const isWeekend = entry.day === 'sat' || entry.day === 'sun';
                  const isHigh = entry.hours > 10;
                  return (
                    <tr
                      key={entry.day}
                      className={`${
                        isWeekend ? 'bg-blue-50/50' : ''
                      } ${
                        isHigh && !isWeekend ? 'bg-amber-50' : ''
                      } transition-colors`}
                    >
                      <td className="px-4 py-2.5 font-medium text-slate-800">
                        {entry.dayLabel}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{entry.start}</td>
                      <td className="px-4 py-2.5 text-slate-600">{entry.end}</td>
                      <td className="px-4 py-2.5 text-slate-600">{entry.breakStr || '0:00'}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${
                        isHigh ? 'text-amber-700' : 'text-slate-700'
                      }`}>
                        {fmtHours(entry.hours)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-800" colSpan={4}>Total</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-700">
                    {totalHours.value}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Hours Bar Chart ── */}
      {dailyData.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
            Hours Per Day
          </p>
          <div className="space-y-2">
              {dailyData.map((entry, _idx) => {
              const pct = maxDayHours > 0 ? (entry.hours / maxDayHours) * 100 : 0;
              const isOvertimeDay = entry.hours > 10;
              return (
                <div key={entry.day} className="flex items-center gap-3">
                  <span className="w-10 text-xs font-medium text-slate-600 text-right shrink-0">
                    {entry.dayLabel.slice(0, 3)}
                  </span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOvertimeDay ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    />
                  </div>
                  <span className="w-14 text-xs font-semibold text-slate-600 text-right shrink-0">
                    {fmtHours(entry.hours)}h
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recharts Daily Hours Bar Chart ── */}
      {dailyData.length > 0 && (() => {
        const chartColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
        return (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Daily Hours (Recharts)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="dayLabel" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={((val: number) => [`${val.toFixed(2)} hrs`, 'Hours']) as any}
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {dailyData.map((entry, i) => (
                    <Cell key={i} fill={entry.hours > 10 ? '#ef4444' : entry.day === 'sat' || entry.day === 'sun' ? '#06b6d4' : chartColors[i % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {/* ── Pay Summary ── */}
      {hasPay && totalPay && regularPay && overtimePay && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Pay Summary
            </p>
          </div>
          <div className="p-5 space-y-3">
            {/* Total Pay */}
            <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 text-center">
              <p className="text-sm text-slate-500 mb-1">{totalPay.label}</p>
              <p className="text-4xl font-bold text-green-700">{totalPay.value}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">{regularPay.label}</p>
                <p className="text-lg font-bold text-slate-800">{regularPay.value}</p>
              </div>
              <div className={`rounded-lg border p-3 text-center ${
                hasOvertime ? 'bg-amber-50 border-amber-200' : 'border-slate-200'
              }`}>
                <p className="text-xs text-slate-500 mb-1">{overtimePay.label}</p>
                <p className={`text-lg font-bold ${hasOvertime ? 'text-amber-700' : 'text-slate-500'}`}>
                  {overtimePay.value}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
