import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { studyPlan } from './studyMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function StudyTimePanel({ values, results }: Props) {
  // Same pure function index.ts uses; the panel never parses result strings.
  const p = studyPlan(values);
  if (!p || !results.length) return null;
  const max = Math.max(p.hoursPerWeek, p.weeklyCapacity, 0.1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Study Schedule Overview</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-blue-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">Total Hours Needed</p>
            <p className="text-lg font-bold text-blue-800">{p.adjustedHours.toFixed(2)}h</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-amber-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">Hours / Week</p>
            <p className="text-lg font-bold text-amber-800">{p.hoursPerWeek.toFixed(2)}h</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Hours per week</p>
          <HBarRow label="Needed" value={p.hoursPerWeek} max={max} display={`${p.hoursPerWeek.toFixed(1)}h`} color={p.feasible ? 'bg-blue-700' : 'bg-red-700'} labelWidth="w-20" height="h-5" className="py-1" />
          <HBarRow label="Capacity" value={p.weeklyCapacity} max={max} display={`${p.weeklyCapacity.toFixed(1)}h`} color="bg-emerald-700" labelWidth="w-20" height="h-5" className="py-1" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">Per Session</p>
            <p className="text-sm font-bold text-slate-700">{p.hoursPerSession.toFixed(2)}h</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">Daily</p>
            <p className="text-sm font-bold text-slate-700">{p.dailyHours.toFixed(2)}h</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">Feasible</p>
            <p className={`text-sm font-bold mt-0.5 ${p.feasible ? 'text-emerald-800' : 'text-red-800'}`}>{p.feasible ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
