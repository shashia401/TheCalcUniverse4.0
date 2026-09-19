import type { CalculatorResult } from '../../../types/calculator';
import { ArrowRight, CalendarDays, Info, Briefcase } from 'lucide-react';
import { getResultValue as getValue } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function DatePanel({ results }: Props) {
  const resultDate = getValue(results, 'resultDate');
  const dayOfWeek = getValue(results, 'dayOfWeek');
  const daysAdded = getValue(results, 'daysAdded');
  const mode = getValue(results, 'mode');
  const startDate = getValue(results, 'startDate');

  if (!resultDate) return null;

  const isBusiness = mode === 'Business Days (Mon-Fri)';

  return (
    <div className="space-y-6">
      {/* Side-by-Side Date Display */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CalendarDays size={18} className="text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Date Comparison</span>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            {/* Start Date */}
            <div className="text-center flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Start Date</p>
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 border border-slate-200">
                <span className="text-xs sm:text-sm font-bold text-slate-600 leading-tight text-center px-1">
                  {startDate}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                {getValue(results, 'startDate') || ''}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center flex-shrink-0">
              <div className="flex items-center gap-1 text-indigo-400">
                <ArrowRight size={28} strokeWidth={2.5} />
              </div>
            </div>

            {/* Result Date */}
            <div className="text-center flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1">Result Date</p>
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-indigo-50 border-2 border-indigo-200 shadow-sm shadow-indigo-200/50">
                <span className="text-xs sm:text-sm font-bold text-indigo-700 leading-tight text-center px-1">
                  {resultDate}
                </span>
              </div>
              <p className="text-xs font-semibold text-indigo-600 mt-2">{dayOfWeek}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <Info size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Date Breakdown</span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xl font-black text-slate-700">{daysAdded}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium uppercase tracking-wide">
                {getValue(results, 'daysAdded') ? 'Days Adjusted' : 'Days'}
              </p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xl font-black text-indigo-600">{dayOfWeek}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium uppercase tracking-wide">Day of Week</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xl font-black text-emerald-600">{mode === 'All Days' ? 'All' : 'Business'}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium uppercase tracking-wide">Day Mode</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-sm font-black text-slate-700 truncate">{resultDate}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium uppercase tracking-wide">Result Date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Days Note */}
      {isBusiness && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-md shadow-amber-100/40 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-amber-200 bg-amber-100/50">
            <Briefcase size={16} className="text-amber-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">Business Days Only</span>
          </div>
          <div className="p-5">
            <p className="text-sm text-amber-800 leading-relaxed">
              Weekends (Saturday and Sunday) were excluded from the count, so the calculated result
              reflects only business days (Monday through Friday). This mode is commonly used for
              project deadlines, shipping estimates, and work scheduling.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
