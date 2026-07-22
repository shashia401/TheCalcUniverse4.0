import { CalculatorResult } from '../../../types/calculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function GradePanel({ results }: Props) {
  const neededGrade = results.find((r) => r.id === 'neededGrade');
  const status = results.find((r) => r.id === 'status');
  const currentGrade = results.find((r) => r.id === 'currentGrade');
  const desiredGrade = results.find((r) => r.id === 'desiredGrade');
  const examWeight = results.find((r) => r.id === 'examWeight');

  if (!neededGrade || !status) return null;

  const neededVal = parseFloat(neededGrade.value.replace('%', ''));
  const currentVal = currentGrade ? parseFloat(currentGrade.value) : 0;
  const desiredVal = desiredGrade ? parseFloat(desiredGrade.value) : 0;

  const alreadyAchieved = neededVal <= 0;
  const impossible = neededVal > 100;
  const easilyAchievable = !alreadyAchieved && !impossible && neededVal <= currentVal;

  // Progress bar: current → desired
  const currentPct = Math.min(currentVal, 100);
  const desiredPct = Math.min(desiredVal, 100);
  const neededPct = alreadyAchieved ? 0 : Math.min(neededVal, 100);

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
          <p className="text-sm text-slate-500 mb-2">{neededGrade.label}</p>
          <p className={`text-4xl font-bold ${
            alreadyAchieved
              ? 'text-green-600'
              : impossible
                ? 'text-red-600'
                : 'text-blue-700'
          }`}>
            {neededGrade.value}
          </p>
          <p className={`text-sm mt-2 ${
            alreadyAchieved
              ? 'text-green-600 font-medium'
              : impossible
                ? 'text-red-600 font-medium'
                : 'text-slate-500'
          }`}>
            {status?.value}
          </p>
        </div>

        {/* Already Achieved Card */}
        {alreadyAchieved && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4">
            <p className="text-xs font-bold text-green-600 mb-1">Congratulations!</p>
            <p className="text-sm text-green-700">
              Your current grade of {currentGrade?.value} is already at or above your target of{' '}
              {desiredGrade?.value}. You can relax — just show up for the final and do your best!
            </p>
          </div>
        )}

        {/* Impossible Warning */}
        {impossible && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-xs font-bold text-red-600 mb-1">Target May Not Be Reachable</p>
            <p className="text-sm text-red-700">
              You would need a {neededGrade.value} on the final to reach a {desiredGrade?.value} overall
              grade. Consider asking your instructor about extra credit opportunities or curve adjustments.
              Even a slightly lower target grade could make a significant difference.
            </p>
          </div>
        )}

        {/* Easily Achievable */}
        {easilyAchievable && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
            <p className="text-xs font-bold text-blue-600 mb-1">Well Within Reach</p>
            <p className="text-sm text-blue-700">
              You only need a {neededGrade.value} on the final, which is below your current grade of{' '}
              {currentGrade?.value}. Stay consistent with your current study habits and you should be
              fine.
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
            Grade Progress: {currentGrade?.value} → {desiredGrade?.value}
          </p>
          <div className="relative h-5 bg-slate-100 rounded-full overflow-hidden">
            {/* Current grade */}
            <div
              className="absolute h-full bg-blue-400 rounded-full transition-all"
              style={{ width: `${Math.min(currentPct, 100)}%` }}
            />
            {/* Desired grade marker */}
            <div
              className="absolute top-0 w-0.5 h-full bg-slate-800 z-10"
              style={{ left: `${Math.min(desiredPct, 100)}%` }}
            />
            {/* Needed grade (if not already achieved) */}
            {!alreadyAchieved && (
              <div
                className="absolute top-0 w-0.5 h-full border-l border-dashed border-red-500 z-10"
                style={{ left: `${Math.min(neededPct, 100)}%` }}
              />
            )}
            {/* Desired grade fill */}
            {desiredPct > currentPct && (
              <div
                className="absolute h-full bg-blue-600 rounded-full transition-all opacity-40"
                style={{
                  width: `${desiredPct - currentPct}%`,
                  left: `${currentPct}%`,
                }}
              />
            )}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>Current: {currentGrade?.value}</span>
            {!alreadyAchieved && <span>Need: {neededGrade.value}</span>}
            <span>Target: {desiredGrade?.value}</span>
          </div>
        </div>

        {/* Grade Comparison Bar Chart */}
        {currentGrade && desiredGrade && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Grade Comparison
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  { name: 'Current', value: currentVal },
                  { name: 'Need on Final', value: alreadyAchieved ? 0 : neededVal },
                  { name: 'Desired', value: desiredVal },
                ]}
                margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={(_: unknown) => [typeof _ === 'number' ? `${_.toFixed(1)}%` : _, 'Grade'] as any}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={48}>
                  <Cell fill={alreadyAchieved ? '#22c55e' : impossible ? '#ef4444' : '#3b82f6'} />
                  <Cell fill={alreadyAchieved ? '#22c55e' : neededVal > 100 ? '#ef4444' : '#f59e0b'} />
                  <Cell fill="#8b5cf6" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Grade Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            How the Grade Is Computed
          </p>

          <div className="space-y-2 text-xs text-slate-600">
            <p>
              <span className="font-medium text-slate-700">Formula:</span> Grade Needed = (Desired Current
              × (1 − Weight)) / Weight
            </p>
            <div className="bg-white rounded border border-slate-200 p-3 font-mono text-[11px] space-y-1">
              <p>
                = ({(desiredGrade?.value ?? '').replace('%', '')} − {(currentGrade?.value ?? '').replace('%', '')} × (1{' '}
                − {(examWeight?.value ?? '').replace('%', '')} ÷ 100)) / ({(examWeight?.value ?? '').replace('%', '')} ÷ 100)
              </p>
              <p className="text-blue-600 font-bold">
                = {neededGrade.value}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-white rounded border border-slate-200 p-2.5 text-center">
              <p className="text-[10px] text-slate-500">Current</p>
              <p className="text-sm font-bold text-slate-700">{currentGrade?.value}</p>
            </div>
            <div className="bg-white rounded border border-slate-200 p-2.5 text-center">
              <p className="text-[10px] text-slate-500">Exam Weight</p>
              <p className="text-sm font-bold text-slate-700">{examWeight?.value}</p>
            </div>
            <div className={`bg-white rounded border p-2.5 text-center ${
              alreadyAchieved
                ? 'border-green-200'
                : impossible
                  ? 'border-red-200'
                  : 'border-blue-200'
            }`}>
              <p className="text-[10px] text-slate-500">Need on Final</p>
              <p className={`text-sm font-bold ${
                alreadyAchieved
                  ? 'text-green-600'
                  : impossible
                    ? 'text-red-600'
                    : 'text-blue-700'
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
