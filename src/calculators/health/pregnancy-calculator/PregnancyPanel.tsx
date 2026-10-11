import { Baby } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function PregnancyPanel({ results }: Props) {
  const dueRes = results.find((r) => r.id === 'dueDate');
  const ageRes = results.find((r) => r.id === 'gestationalAge');
  const trimesterRes = results.find((r) => r.id === 'currentTrimester');
  const conceptionRes = results.find((r) => r.id === 'conceptionDate');
  const endFirstRes = results.find((r) => r.id === 'endFirstTrimester');
  const viabilityRes = results.find((r) => r.id === 'viabilityDate');
  const fullTermRes = results.find((r) => r.id === 'fullTermDate');

  if (!dueRes || !ageRes || !trimesterRes) return null;

  // Numbers come from index.ts (_timeline) instead of being scraped out of display strings.
  let tl = { weeks: 0, pct: 0, pregnant: false, pastDue: false };
  try {
    const raw = results.find((r) => r.id === '_timeline')?.value;
    if (raw) tl = { ...tl, ...JSON.parse(raw) };
  } catch {
    /* keep defaults */
  }
  const { weeks: currentWeeks, pct: progressPct, pregnant: isPregnant, pastDue: isPostTerm } = tl;

  const trimester = trimesterRes.value;
  // -700 shades so the coloured label keeps >= 4.5:1 on its tinted card.
  const triColor = trimester.includes('1st') ? '#1d4ed8' : trimester.includes('2nd') ? '#15803d' : '#b45309';

  const milestones = [
    { label: 'Conception', week: 2, date: conceptionRes?.value || '', passed: currentWeeks >= 2 },
    { label: 'End 1st Tri', week: 13, date: endFirstRes?.value || '', passed: currentWeeks >= 13 },
    { label: 'Viability', week: 24, date: viabilityRes?.value.split(' — ')[0] || '', passed: currentWeeks >= 24 },
    { label: 'Early Term', week: 37, date: fullTermRes?.value.split(' — ')[0] || '', passed: currentWeeks >= 37 },
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
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-center">
            <p className="text-2xl font-black text-emerald-700">{currentWeeks} weeks</p>
            <p className="text-xs text-emerald-800 mt-1">{progressPct}% complete</p>
          </div>
        )}

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">40-Week Progress</p>
          <div
            role="progressbar"
            aria-label="Pregnancy progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(100, progressPct)}
            className="relative h-6 bg-slate-100 rounded-full overflow-hidden"
          >
            <div className="h-full rounded-full bg-gradient-to-r from-blue-700 via-emerald-700 to-amber-700 transition-all" style={{ width: `${Math.min(100, progressPct)}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
            <span>Week 1</span>
            <span>Week 40</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">Due Date</p>
            <p className="text-sm font-black text-blue-800">{dueRes.value}</p>
          </div>
          <div className="rounded-xl px-4 py-3 text-center border" style={{ borderColor: triColor + '40', backgroundColor: triColor + '15' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: triColor }}>Trimester</p>
            <p className="text-sm font-black text-slate-700">{trimesterRes.value}</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Key Milestones</p>
          <div className="space-y-2">
            {milestones.map((m) => (
              <div key={m.week} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${m.passed ? 'bg-emerald-700' : 'bg-slate-300'}`}>
                  {m.passed && <svg aria-hidden="true" className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${m.passed ? 'text-slate-700' : 'text-slate-600'}`}>{m.label} (Week {m.week})</p>
                  <p className="text-[10px] text-slate-600">{m.date}</p>
                </div>
                {m.week === currentWeeks && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">You are here</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {isPostTerm && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3 text-center">
            <p className="text-xs font-bold text-amber-800">{ageRes.value} — Consult your healthcare provider.</p>
          </div>
        )}

        {!isPregnant && !isPostTerm && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3 text-center">
            <p className="text-xs text-slate-600">Pregnancy has not started yet based on the LMP date entered.</p>
          </div>
        )}
      </div>
    </div>
  );
}
