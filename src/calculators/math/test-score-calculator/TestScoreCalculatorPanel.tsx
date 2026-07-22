import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function TestScoreCalculatorPanel({ results }: Props) {
  const percentage = results.find(r => r.id === 'percentage');
  const letterGrade = results.find(r => r.id === 'letterGrade');
  const gradeDescription = results.find(r => r.id === 'gradeDescription');
  const correctPct = results.find(r => r.id === 'correctPercentage');

  if (!percentage) return null;

  const pct = parseNum(percentage.value);

  const gradeColor = (pct: number) => {
    if (pct >= 90) return 'bg-emerald-500';
    if (pct >= 80) return 'bg-blue-500';
    if (pct >= 70) return 'bg-amber-500';
    if (pct >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const gradeBg = (pct: number) => {
    if (pct >= 90) return 'bg-emerald-100 text-emerald-700';
    if (pct >= 80) return 'bg-blue-100 text-blue-700';
    if (pct >= 70) return 'bg-amber-100 text-amber-700';
    if (pct >= 60) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const correctPctVal = correctPct ? parseNum(correctPct.value) : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Score Distribution</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Percentage bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-600">Score</span>
            <span className="text-sm font-bold text-slate-700">{percentage.value}</span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${gradeColor(pct)} transition-all`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px] text-slate-400">0%</span>
            <span className="text-[10px] text-slate-400">50%</span>
            <span className="text-[10px] text-slate-400">100%</span>
          </div>
        </div>

        {/* Letter grade badge */}
        <div className="flex items-center gap-3">
          {letterGrade && (
            <span className={`inline-flex items-center px-4 py-2 rounded-lg text-lg font-bold ${gradeBg(pct)}`}>
              {letterGrade.value}
            </span>
          )}
          {gradeDescription && (
            <span className="text-sm text-slate-500">{gradeDescription.value}</span>
          )}
        </div>

        {/* Correct vs Wrong bar */}
        {correctPctVal !== null && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-600">Correct Answers</span>
              <span className="text-xs text-slate-500">{correctPctVal.toFixed(0)}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${correctPctVal}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
