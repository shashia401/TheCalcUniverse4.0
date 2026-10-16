import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import { fmtPct } from '../../../utils/finalGrade';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface GradeData {
  currentGrade: number;
  desiredGrade: number;
  examWeight: number;
  needed: number;
  status: 'secured' | 'reachable' | 'impossible';
  floor: number;
  ceiling: number;
}

export default function GradePanel({ results }: Props) {
  const neededGrade = results.find((r) => r.id === 'neededGrade');
  const status = results.find((r) => r.id === 'status');
  const rawData = results.find((r) => r.id === '_gradeData');
  if (!neededGrade || !status || !rawData) return null;

  let data: GradeData;
  try {
    data = JSON.parse(rawData.value) as GradeData;
  } catch {
    return null;
  }
  const { currentGrade, desiredGrade, examWeight, needed } = data;
  const alreadyAchieved = data.status === 'secured';
  const impossible = data.status === 'impossible';
  const easilyAchievable = data.status === 'reachable' && needed <= currentGrade;

  const currentPct = Math.min(currentGrade, 100);
  const desiredPct = Math.min(desiredGrade, 100);
  const neededPct = alreadyAchieved ? 0 : Math.min(needed, 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Final Exam Analysis</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Needed Grade Card */}
        <div className={`rounded-xl bg-gradient-to-br p-6 text-center border ${
          alreadyAchieved
            ? 'from-green-50 to-emerald-50 border-green-200'
            : impossible
              ? 'from-red-50 to-rose-50 border-red-200'
              : 'from-blue-50 to-indigo-50 border-blue-200'
        }`}>
          <p className="text-sm text-slate-600 mb-2">{neededGrade.label}</p>
          <p className={`text-4xl font-bold ${
            alreadyAchieved ? 'text-green-700' : impossible ? 'text-red-700' : 'text-blue-700'
          }`}>
            {neededGrade.value}
          </p>
          <p className={`text-sm mt-2 ${
            alreadyAchieved
              ? 'text-green-700 font-medium'
              : impossible
                ? 'text-red-700 font-medium'
                : 'text-slate-600'
          }`}>
            {status.value}
          </p>
        </div>

        {alreadyAchieved && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4">
            <p className="text-xs font-bold text-green-700 mb-1">Target secured</p>
            <p className="text-sm text-green-800">
              Even a 0% on the final leaves your overall grade at {fmtPct(data.floor)}, which is at or above your target
              of {fmtPct(desiredGrade)}. Show up and do your best, since some courses require a minimum exam score.
            </p>
          </div>
        )}

        {impossible && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-xs font-bold text-red-700 mb-1">Target May Not Be Reachable</p>
            <p className="text-sm text-red-800">
              You would need {neededGrade.value} on the final to reach a {fmtPct(desiredGrade)} overall grade. A perfect
              100% only gets you to {fmtPct(data.ceiling)}. Ask your instructor about extra credit or a curve, or
              consider a slightly lower target.
            </p>
          </div>
        )}

        {easilyAchievable && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
            <p className="text-xs font-bold text-blue-700 mb-1">Well Within Reach</p>
            <p className="text-sm text-blue-800">
              You only need {neededGrade.value} on the final, which is at or below your current grade of {fmtPct(currentGrade)}.
              Stay consistent with your current study habits and you should be fine.
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">
            Grade Progress: {fmtPct(currentGrade)} → {fmtPct(desiredGrade)}
          </p>
          <div className="relative h-5 bg-slate-100 rounded-full overflow-hidden" role="img"
            aria-label={`Current grade ${fmtPct(currentGrade)}, target ${fmtPct(desiredGrade)}${alreadyAchieved ? '' : `, needed on final ${neededGrade.value}`}`}>
            <div className="absolute h-full bg-blue-400 rounded-full" style={{ width: `${currentPct}%` }} />
            <div className="absolute top-0 w-0.5 h-full bg-slate-800 z-10" style={{ left: `${desiredPct}%` }} />
            {!alreadyAchieved && (
              <div className="absolute top-0 w-0.5 h-full border-l border-dashed border-red-600 z-10" style={{ left: `${neededPct}%` }} />
            )}
            {desiredPct > currentPct && (
              <div className="absolute h-full bg-blue-600 rounded-full opacity-40" style={{ width: `${desiredPct - currentPct}%`, left: `${currentPct}%` }} />
            )}
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>Current: {fmtPct(currentGrade)}</span>
            {!alreadyAchieved && <span>Need: {neededGrade.value}</span>}
            <span>Target: {fmtPct(desiredGrade)}</span>
          </div>
        </div>

        {/* Grade Comparison Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Grade Comparison</p>
          <SvgBarChart
            ariaLabel={`Bar chart: current grade ${fmtPct(currentGrade)}, needed on final ${alreadyAchieved ? '0%' : fmtPct(needed)}, desired ${fmtPct(desiredGrade)}`}
            data={[
              { label: 'Current', value: currentGrade, color: alreadyAchieved ? '#15803d' : impossible ? '#b91c1c' : '#1d4ed8' },
              { label: 'Need on Final', value: alreadyAchieved ? 0 : needed, color: alreadyAchieved ? '#15803d' : impossible ? '#b91c1c' : '#b45309' },
              { label: 'Desired', value: desiredGrade, color: '#6d28d9' },
            ]}
            format={(n) => `${parseFloat(n.toFixed(2))}%`}
            maxBarWidth={48}
          />
        </div>

        {/* Grade Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">How the Grade Is Computed</p>
          <div className="space-y-2 text-xs text-slate-700">
            <p>
              <span className="font-medium text-slate-800">Formula:</span> Grade Needed = (Desired − Current × (1 − Weight)) / Weight
            </p>
            <div className="bg-white rounded border border-slate-200 p-3 font-mono text-[11px] space-y-1">
              <p>
                = ({desiredGrade} − {currentGrade} × (1 − {examWeight} ÷ 100)) / ({examWeight} ÷ 100)
              </p>
              <p className="text-blue-700 font-bold">= {fmtPct(needed)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-white rounded border border-slate-200 p-2.5 text-center">
              <p className="text-[10px] text-slate-600">Current</p>
              <p className="text-sm font-bold text-slate-700">{fmtPct(currentGrade)}</p>
            </div>
            <div className="bg-white rounded border border-slate-200 p-2.5 text-center">
              <p className="text-[10px] text-slate-600">Exam Weight</p>
              <p className="text-sm font-bold text-slate-700">{fmtPct(examWeight)}</p>
            </div>
            <div className={`bg-white rounded border p-2.5 text-center ${
              alreadyAchieved ? 'border-green-200' : impossible ? 'border-red-200' : 'border-blue-200'
            }`}>
              <p className="text-[10px] text-slate-600">Need on Final</p>
              <p className={`text-sm font-bold ${
                alreadyAchieved ? 'text-green-700' : impossible ? 'text-red-700' : 'text-blue-700'
              }`}>
                {neededGrade.value}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
