import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseKcal(s: string): number {
  const m = s.replace(/,/g, '').match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

export default function CalorieMatrixPanel({ results }: Props) {
  const tdeeResult = results.find(r => r.id === 'tdee');
  const bmrResult = results.find(r => r.id === 'bmr');
  const tefResult = results.find(r => r.id === 'tef');
  const eatResult = results.find(r => r.id === 'eat');
  const neatResult = results.find(r => r.id === 'neat');
  const maintainResult = results.find(r => r.id === 'maintainCalories');
  const mildLossResult = results.find(r => r.id === 'mildLoss');
  const moderateLossResult = results.find(r => r.id === 'moderateLoss');
  const extremeLossResult = results.find(r => r.id === 'extremeLoss');
  const leanGainResult = results.find(r => r.id === 'leanGain');
  const aggressiveGainResult = results.find(r => r.id === 'aggressiveGain');

  if (!tdeeResult || !bmrResult) return null;

  const tdee = parseKcal(tdeeResult.value);
  const bmr = parseKcal(bmrResult.value);
  const tef = parseKcal(tefResult?.value ?? '0');
  const eat = parseKcal(eatResult?.value ?? '0');
  const neat = parseKcal(neatResult?.value ?? '0');

  const [hoverInfo, setHoverInfo] = useState<{ type: 'segment'; label: string; detail: string; subdetail: string } | { type: 'row'; goal: string; calories: string; note: string } | null>(null);

  const maxValForBar = tdee + 500;

  // Bar segment for TDEE breakdown
  const totalComponents = bmr + tef + eat + neat;
  const pctOfTotal = (v: number) => totalComponents > 0 ? (v / totalComponents) * 100 : 0;
  const barPct = (v: number) => Math.min((v / (tdee * 1.1)) * 100, 100);

  const row = (goal: string, calories: string | undefined, color: string, calVal: number, note?: string) => {
    const cal = calories ?? '—';
    const pct = Math.min(calVal / (maxValForBar * 1.1) * 100, 100);

    let barBg = 'bg-slate-200';
    if (color === 'green') barBg = 'bg-emerald-500';
    else if (color === 'amber') barBg = 'bg-amber-500';
    else if (color === 'red') barBg = 'bg-red-400';
    else if (color === 'blue') barBg = 'bg-blue-500';

    return (
      <tr key={goal} className="border-b border-slate-100 last:border-0"
        onMouseEnter={() => setHoverInfo({ type: 'row', goal, calories: cal, note: note ?? '' })}
        onMouseLeave={() => setHoverInfo(null)}
      >
        <td className="px-4 py-3 text-xs font-semibold text-slate-700">{goal}</td>
        <td className="px-4 py-3 text-right text-xs font-bold text-slate-900 whitespace-nowrap">{cal}</td>
        <td className="px-4 py-3 w-1/2">
          <div className="h-4 bg-slate-100 rounded-sm overflow-hidden">
            <div className={`h-full rounded-sm ${barBg} transition-all`} style={{ width: `${pct}%` }} />
          </div>
        </td>
        <td className="px-3 py-3 text-[10px] text-slate-500">{note ?? ''}</td>
      </tr>
    );
  };

  const sex = results.find(r => r.id === 'safeMinWarning')?.label === 'Safe Minimum (Women)' ? 'female' : 'male';
  const safeMin = sex === 'female' ? 1200 : 1500;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* TDEE Breakdown Section */}
      <div className="border-b border-slate-100">
        <div className="flex items-center gap-2 px-6 py-4 bg-slate-50 border-b border-slate-100">
          <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">TDEE Energy Expenditure Breakdown</span>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {/* Stacked bar visualization */}
            <div className="h-7 bg-slate-100 rounded-xl overflow-hidden flex">
              {bmr > 0 && (
                <div
                  className="bg-violet-400 h-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ width: `${barPct(bmr)}%` }}
                  title={`BMR: ${bmr} kcal`}
                  onMouseEnter={() => setHoverInfo({ type: 'segment', label: 'BMR', detail: `${bmr} kcal`, subdetail: `${Math.round(pctOfTotal(bmr))}% of TDEE` })}
                  onMouseLeave={() => setHoverInfo(null)}
                >
                  {barPct(bmr) > 12 ? `BMR ${bmr}` : ''}
                </div>
              )}
              {tef > 0 && (
                <div
                  className="bg-blue-400 h-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ width: `${barPct(tef)}%` }}
                  title={`TEF: ${tef} kcal`}
                  onMouseEnter={() => setHoverInfo({ type: 'segment', label: 'TEF', detail: `${tef} kcal`, subdetail: `${Math.round(pctOfTotal(tef))}% of TDEE` })}
                  onMouseLeave={() => setHoverInfo(null)}
                >
                  {barPct(tef) > 12 ? `TEF ${tef}` : ''}
                </div>
              )}
              {eat > 0 && (
                <div
                  className="bg-emerald-400 h-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ width: `${barPct(eat)}%` }}
                  title={`EAT: ${eat} kcal`}
                  onMouseEnter={() => setHoverInfo({ type: 'segment', label: 'EAT', detail: `${eat} kcal`, subdetail: `${Math.round(pctOfTotal(eat))}% of TDEE` })}
                  onMouseLeave={() => setHoverInfo(null)}
                >
                  {barPct(eat) > 12 ? `EAT ${eat}` : ''}
                </div>
              )}
              {neat > 0 && (
                <div
                  className="bg-amber-400 h-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ width: `${barPct(neat)}%` }}
                  title={`NEAT: ${neat} kcal`}
                  onMouseEnter={() => setHoverInfo({ type: 'segment', label: 'NEAT', detail: `${neat} kcal`, subdetail: `${Math.round(pctOfTotal(neat))}% of TDEE` })}
                  onMouseLeave={() => setHoverInfo(null)}
                >
                  {barPct(neat) > 12 ? `NEAT ${neat}` : ''}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <div className="w-3 h-3 rounded bg-violet-400 flex-shrink-0" />
                <span>BMR ({Math.round(pctOfTotal(bmr))}%)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <div className="w-3 h-3 rounded bg-blue-400 flex-shrink-0" />
                <span>TEF ({Math.round(pctOfTotal(tef))}%)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <div className="w-3 h-3 rounded bg-emerald-400 flex-shrink-0" />
                <span>EAT ({Math.round(pctOfTotal(eat))}%)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <div className="w-3 h-3 rounded bg-amber-400 flex-shrink-0" />
                <span>NEAT ({Math.round(pctOfTotal(neat))}%)</span>
              </div>
            </div>

            {/* Component details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              <div className="rounded-lg bg-violet-50 border border-violet-100 p-3 text-center">
                <p className="text-[18px] font-bold text-violet-700">{bmr}</p>
                <p className="text-[10px] text-violet-500 font-semibold">BMR kcal</p>
                <p className="text-[9px] text-violet-400">Basal metabolism</p>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-center">
                <p className="text-[18px] font-bold text-blue-700">{tef}</p>
                <p className="text-[10px] text-blue-500 font-semibold">TEF kcal</p>
                <p className="text-[9px] text-blue-400">Digesting food</p>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-center">
                <p className="text-[18px] font-bold text-emerald-700">{eat}</p>
                <p className="text-[10px] text-emerald-500 font-semibold">EAT kcal</p>
                <p className="text-[9px] text-emerald-400">Exercise</p>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-center">
                <p className="text-[18px] font-bold text-amber-700">{neat}</p>
                <p className="text-[10px] text-amber-500 font-semibold">NEAT kcal</p>
                <p className="text-[9px] text-amber-400">Non-exercise movement</p>
              </div>
            </div>
            {hoverInfo?.type === 'segment' && (
              <div className="text-xs text-center text-slate-600 bg-slate-100 rounded-lg px-3 py-2">
                <span className="font-semibold">{hoverInfo.label}</span>: <span className="font-bold text-slate-800">{hoverInfo.detail}</span>
                <span className="text-slate-500 ml-1">· {hoverInfo.subdetail}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calorie Goal Matrix */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Calorie Goal Matrix</span>
      </div>

      <div className="p-5">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Goal</th>
                <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Calories</th>
                <th scope="col" className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]"></th>
                <th scope="col" className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Note</th>
              </tr>
            </thead>
            <tbody>
              {row('Extreme Weight Loss (2 lb/wk)', extremeLossResult?.value, 'red', tdee - 1000, extremeLossResult?.value?.startsWith('Not recommended') ? '⚠ Below safe minimum' : '')}
              {row('Weight Loss (1 lb/wk)', moderateLossResult?.value, 'amber', tdee - 500, '−500 kcal deficit')}
              {row('Mild Weight Loss (0.5 lb/wk)', mildLossResult?.value, 'green', tdee - 250, '−250 kcal deficit')}
              {row('Maintain Weight', maintainResult?.value, 'blue', tdee, 'TDEE target')}
              {row('Lean Muscle Gain', leanGainResult?.value, 'green', tdee + 250, '+250 kcal surplus')}
              {row('Aggressive Gain', aggressiveGainResult?.value, 'green', tdee + 500, '+500 kcal surplus')}
            </tbody>
          </table>
        </div>

        {hoverInfo?.type === 'row' && (
          <div className="text-xs text-center text-slate-600 bg-slate-100 rounded-lg px-3 py-2 mt-4">
            <span className="font-semibold">{hoverInfo.goal}</span>: <span className="font-bold text-slate-800">{hoverInfo.calories} kcal</span>
            {hoverInfo.note && <><span className="text-slate-500 ml-1">· {hoverInfo.note}</span></>}
          </div>
        )}

        {/* Safety Warning */}
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <svg aria-hidden="true" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-xs font-bold text-red-700 mb-1">Caloric Safety Warning</p>
              <p className="text-xs text-red-600 leading-relaxed">
                <strong>Never eat below {safeMin.toLocaleString()} calories per day</strong> without medical supervision.
                Extremely low calorie diets (VLCD) can cause nutrient deficiencies, gallstones, cardiac arrhythmias,
                and metabolic adaptation. The "Extreme Weight Loss" target should only be considered for short periods
                under a healthcare provider's guidance. This calculator is for informational purposes only and is not
                a substitute for professional medical advice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
