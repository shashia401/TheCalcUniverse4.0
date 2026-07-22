import { Baby } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function PregnancyPanel({ values, results }: Props) {
  const dueRes = results.find((r) => r.id === 'dueDate');
  const ageRes = results.find((r) => r.id === 'gestationalAge');
  const trimesterRes = results.find((r) => r.id === 'currentTrimester');
  const progressRes = results.find((r) => r.id === 'progressSummary');
  const conceptionRes = results.find((r) => r.id === 'conceptionDate');
  const endFirstRes = results.find((r) => r.id === 'endFirstTrimester');
  const viabilityRes = results.find((r) => r.id === 'viabilityDate');
  const fullTermRes = results.find((r) => r.id === 'fullTermDate');

  if (!dueRes || !ageRes || !trimesterRes || !progressRes) return null;

  const progressStr = progressRes.value;
  const daysToGo = progressStr.match(/(\d+)/);
  const daysRemaining = daysToGo ? parseInt(daysToGo[1]) : 0;
  const progressPctMatch = progressRes.label.match(/(\d+)%/);
  const progressPct = progressPctMatch ? parseInt(progressPctMatch[1]) : 0;

  const isPregnant = ageRes.color === 'positive';
  const isPostTerm = trimesterRes.value.includes('Post-term');

  const weeksMatch = ageRes.value.match(/(\d+)/);
  const currentWeeks = weeksMatch ? parseInt(weeksMatch[1]) : 0;

  const trimester = trimesterRes.value;
  const triColor = trimester.includes('1st') ? '#3b82f6' : trimester.includes('2nd') ? '#22c55e' : '#f59e0b';

  const milestones = [
    { label: 'Conception', week: 2, date: conceptionRes?.value || '', passed: currentWeeks >= 2 },
    { label: 'End 1st Tri', week: 13, date: endFirstRes?.value || '', passed: currentWeeks >= 13 },
    { label: 'Viability', week: 24, date: viabilityRes?.value || '', passed: currentWeeks >= 24 },
    { label: 'Full Term', week: 37, date: fullTermRes?.value || '', passed: currentWeeks >= 37 },
    { label: 'Due Date', week: 40, date: dueRes?.value || '', passed: currentWeeks >= 40 },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Baby size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Pregnancy Timeline
        </span>
      </div>

      <div className="p-6 space-y-5">
        {isPregnant && (
          <div className="round-xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-center">
            <p className="text-2xl font-black text-emerald-700">{currentWeeks} weeks</p>
            <p className="text-xs text-emerald-600 mt-1">{progressPct}% complete</p>
          </div>
        )}

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">40-Week Progress</p>
          <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400 transition-all" style={{ width: `${Math.min(100, progressPct)}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
            <span>Week 1</span>
            <span>Week 40</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Due Date</p>
            <p className="text-sm font-black text-blue-700">{dueRes.value}</p>
          </div>
          <div className="rounded-xl px-4 py-3 text-center border" style={{ borderColor: triColor + '40', backgroundColor: triColor + '15' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: triColor }}>Trimester</p>
            <p className="text-sm font-black text-slate-700">{trimesterRes.value}</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Key Milestones</p>
          <div className="space-y-2">
            {milestones.map((m) => (
              <div key={m.week} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${m.passed ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  {m.passed && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${m.passed ? 'text-slate-700' : 'text-slate-400'}`}>{m.label} (Week {m.week})</p>
                  <p className={`text-[10px] ${m.passed ? 'text-slate-500' : 'text-slate-300'}`}>{m.date}</p>
                </div>
                {m.week === currentWeeks && (
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">You are here</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {isPostTerm && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3 text-center">
            <p className="text-xs font-bold text-amber-700">{ageRes.value} — Consult your healthcare provider.</p>
          </div>
        )}

        {!isPregnant && !isPostTerm && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3 text-center">
            <p className="text-xs text-slate-500">Pregnancy has not started yet based on the LMP date entered.</p>
          </div>
        )}
      </div>
    </div>
  );
}
