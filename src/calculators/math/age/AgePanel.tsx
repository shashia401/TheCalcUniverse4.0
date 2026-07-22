import type { CalculatorResult } from '../../../types/calculator';
import { CalendarDays, Clock, PartyPopper, Sparkles } from 'lucide-react';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getValue(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '';
}

export default function AgePanel({ results }: Props) {
  const age = getValue(results, 'age');
  const totalMonths = getValue(results, 'totalMonths');
  const totalWeeks = getValue(results, 'totalWeeks');
  const totalDays = getValue(results, 'totalDays');
  const totalHours = getValue(results, 'totalHours');
  const daysUntilBirthday = getValue(results, 'daysUntilBirthday');
  const birthDate = getValue(results, 'birthDate');
  const targetDate = getValue(results, 'targetDate');

  if (!age) return null;

  return (
    <div className="space-y-6">
      {/* Age Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CalendarDays size={18} className="text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Age Snapshot</span>
        </div>
        <div className="p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
            {birthDate} &mdash; {targetDate}
          </p>
          <p className="text-4xl font-black text-indigo-700 mt-2 leading-tight">{age}</p>
        </div>
      </div>

      {/* Fun Facts Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <Sparkles size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Fun Facts</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y sm:divide-y-0 divide-slate-100">
          <div className="p-5 text-center">
            <p className="text-2xl font-black text-indigo-600">{totalMonths}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Total Months</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-2xl font-black text-emerald-600">{totalWeeks}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Total Weeks</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-2xl font-black text-amber-600">{totalDays.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Total Days</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-2xl font-black text-rose-600">{(parseInt(totalHours, 10) || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Total Hours</p>
          </div>
        </div>
      </div>

      {/* Birthday Countdown */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-pink-50 to-rose-50">
          <PartyPopper size={16} className="text-pink-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-pink-600">Next Birthday Countdown</span>
        </div>
        <div className="p-6 text-center">
          <p className="text-5xl font-black text-pink-600">{daysUntilBirthday}</p>
          <p className="text-sm text-slate-500 mt-1 font-medium">days until your next birthday</p>
        </div>
      </div>

      {/* Educational Fun Facts */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <Clock size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">What These Numbers Mean</span>
        </div>
        <div className="p-6 space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            <strong className="text-indigo-700">Total Months ({totalMonths}):</strong> The total number of months elapsed from birth to the target date. This is 12 times the number of full years, plus any remaining months.
          </p>
          <p>
            <strong className="text-emerald-700">Total Weeks ({totalWeeks}):</strong> The total days divided by 7. Each week represents a full 7-day cycle.
          </p>
          <p>
            <strong className="text-amber-700">Total Days ({parseInt(totalDays).toLocaleString()}):</strong> The exact number of 24-hour periods between the two dates. This is the most precise measure of total time elapsed.
          </p>
          <p>
            <strong className="text-rose-700">Total Hours ({parseInt(totalHours).toLocaleString()}):</strong> Each day contains 24 hours. Multiply the total days by 24 to get the number of hours you have been alive.
          </p>
        </div>
      </div>
    </div>
  );
}
