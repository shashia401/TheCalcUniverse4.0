import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.-]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function StudyTimePanel({ results }: Props) {
  const totalHours = results.find(r => r.id === 'totalHoursNeeded');
  const hoursPerWeek = results.find(r => r.id === 'hoursPerWeek');
  const hoursPerSession = results.find(r => r.id === 'hoursPerSession');
  const weeklyCapacity = results.find(r => r.id === 'weeklyCapacity');
  const recommendedDaily = results.find(r => r.id === 'recommendedDaily');
  const feasible = results.find(r => r.id === 'scheduleFeasible');

  if (!totalHours) return null;

  const hw = hoursPerWeek ? parseNum(hoursPerWeek.value) : 0;
  const cap = weeklyCapacity ? parseNum(weeklyCapacity.value) : 0;
  const daily = recommendedDaily ? parseNum(recommendedDaily.value) : 0;

  // Bar heights (cap determines max)
  const maxVal = Math.max(hw, cap, 0.1);
  const heightPx = 140;

  // Weekday bars
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const perSession = hoursPerSession ? parseNum(hoursPerSession.value) : 0;
  const sessionCount = results.find(r => r.id === 'hoursPerSession');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Study Schedule Overview</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Main stat cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-blue-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Total Hours Needed</p>
            <p className="text-lg font-bold text-blue-700">{totalHours.value}h</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-amber-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Hours / Week</p>
            <p className="text-lg font-bold text-amber-700">{hoursPerWeek?.value ?? '-'}h</p>
          </div>
        </div>

        {/* Capacity comparison bar */}
        {weeklyCapacity && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-600">Weekly Study Capacity</span>
              <span className="text-xs text-slate-500">{weeklyCapacity.value}h</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden relative">
              {hw > 0 && (
                <div
                  className={`h-full rounded-full transition-all ${hw <= cap ? 'bg-emerald-400' : 'bg-red-400'}`}
                  style={{ width: `${Math.min((hw / Math.max(cap, hw)) * 100, 100)}%` }}
                />
              )}
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[10px] text-slate-400">0h</span>
              <span className="text-[10px] text-slate-400">{Math.max(hw, cap).toFixed(1)}h</span>
            </div>
          </div>
        )}

        {/* Per session summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Per Session</p>
            <p className="text-sm font-bold text-slate-700">{hoursPerSession?.value ?? '-'}h</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Daily</p>
            <p className="text-sm font-bold text-slate-700">{recommendedDaily?.value ?? '-'}h</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Feasible</p>
            <p className={`text-sm font-bold mt-0.5 ${feasible?.value?.startsWith('Yes') ? 'text-emerald-600' : 'text-red-600'}`}>
              {feasible?.value?.startsWith('Yes') ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
