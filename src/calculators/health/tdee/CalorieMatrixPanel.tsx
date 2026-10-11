import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';

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
  const bmrResult = results.find(r => r.id === '_bmr');
  const tefResult = results.find(r => r.id === '_tef');
  const eatResult = results.find(r => r.id === '_eat');
  const neatResult = results.find(r => r.id === '_neat');
  const maintainResult = results.find(r => r.id === '_maintainCalories');
  const mildLossResult = results.find(r => r.id === '_mildLoss');
  const moderateLossResult = results.find(r => r.id === '_moderateLoss');
  const extremeLossResult = results.find(r => r.id === '_extremeLoss');
  const leanGainResult = results.find(r => r.id === '_leanGain');
  const aggressiveGainResult = results.find(r => r.id === '_aggressiveGain');
  const safeMinResult = results.find(r => r.id === 'safeMinWarning');

  if (!tdeeResult || !bmrResult) return null;

  const tdee = parseKcal(tdeeResult.value);
  const bmr = parseKcal(bmrResult.value);
  const tef = parseKcal(tefResult?.value ?? '0');
  const eat = parseKcal(eatResult?.value ?? '0');
  const neat = parseKcal(neatResult?.value ?? '0');
  const safeMin = safeMinResult ? parseKcal(safeMinResult.value) : 1200;

  // Stacked bar: each segment's width is its share of the four components, so the bar always fills
  const totalComponents = bmr + tef + eat + neat;
  const pctOfTotal = (v: number) => (totalComponents > 0 ? (v / totalComponents) * 100 : 0);

  const parts = [
    { key: 'BMR', value: bmr, bar: 'bg-violet-700', card: 'bg-violet-50 border-violet-100 text-violet-800', sub: 'Basal metabolism' },
    { key: 'TEF', value: tef, bar: 'bg-blue-700', card: 'bg-blue-50 border-blue-100 text-blue-800', sub: 'Digesting food' },
    { key: 'EAT', value: eat, bar: 'bg-emerald-700', card: 'bg-emerald-50 border-emerald-100 text-emerald-800', sub: 'Exercise' },
    { key: 'NEAT', value: neat, bar: 'bg-amber-700', card: 'bg-amber-50 border-amber-100 text-amber-800', sub: 'Non-exercise movement' },
  ];

  // Goal rows (bars use -700 backgrounds so the white value labels keep >= 4.5:1)
  const maxValForBar = (tdee + 500) * 1.1;
  const rows: { goal: string; result: CalculatorResult | undefined; color: string; calVal: number; note: string }[] = [
    { goal: 'Extreme Weight Loss (2 lb/wk)', result: extremeLossResult, color: 'bg-red-700', calVal: tdee - 1000, note: extremeLossResult?.value?.startsWith('Not recommended') ? '⚠ Below safe minimum' : '' },
    { goal: 'Weight Loss (1 lb/wk)', result: moderateLossResult, color: 'bg-amber-700', calVal: tdee - 500, note: '−500 kcal deficit' },
    { goal: 'Mild Weight Loss (0.5 lb/wk)', result: mildLossResult, color: 'bg-emerald-700', calVal: tdee - 250, note: '−250 kcal deficit' },
    { goal: 'Maintain Weight', result: maintainResult, color: 'bg-blue-700', calVal: tdee, note: 'TDEE target' },
    { goal: 'Lean Muscle Gain', result: leanGainResult, color: 'bg-emerald-700', calVal: tdee + 250, note: '+250 kcal surplus' },
    { goal: 'Aggressive Gain', result: aggressiveGainResult, color: 'bg-emerald-700', calVal: tdee + 500, note: '+500 kcal surplus' },
  ];

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
            <div
              role="img"
              aria-label={`Energy expenditure: BMR ${bmr}, TEF ${tef}, EAT ${eat}, NEAT ${neat} kcal per day`}
              className="h-7 bg-slate-100 rounded-xl overflow-hidden flex"
            >
              {parts.filter(p => p.value > 0).map(p => (
                <div
                  key={p.key}
                  className={`${p.bar} h-full flex items-center justify-center text-[10px] font-bold text-white`}
                  style={{ width: `${pctOfTotal(p.value)}%` }}
                  title={`${p.key}: ${p.value} kcal (${Math.round(pctOfTotal(p.value))}% of TDEE)`}
                >
                  {pctOfTotal(p.value) > 12 ? `${p.key} ${p.value}` : ''}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {parts.map(p => (
                <div key={p.key} className="flex items-center gap-2 text-[10px] text-slate-600">
                  <div className={`w-3 h-3 rounded ${p.bar} flex-shrink-0`} />
                  <span>{p.key} ({Math.round(pctOfTotal(p.value))}%)</span>
                </div>
              ))}
            </div>

            {/* Component details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {parts.map(p => (
                <div key={p.key} className={`rounded-lg border p-3 text-center ${p.card}`}>
                  <p className="text-[18px] font-bold">{p.value}</p>
                  <p className="text-[10px] font-semibold">{p.key} kcal</p>
                  <p className="text-[10px]">{p.sub}</p>
                </div>
              ))}
            </div>
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
        <ul aria-label="Calorie targets by goal" className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4 py-1">
          {rows.map(r => (
            <li key={r.goal} className="flex flex-col sm:flex-row sm:items-center gap-x-3">
              <div className="flex-1">
                <HBarRow
                  label={r.goal}
                  labelWidth="w-44"
                  value={r.calVal}
                  max={maxValForBar}
                  color={r.color}
                  display={r.result?.value ?? '—'}
                />
              </div>
              <span className="text-[10px] text-slate-600 sm:w-36 pb-1.5 sm:pb-0">{r.note}</span>
            </li>
          ))}
        </ul>

        {/* Safety Warning */}
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <svg aria-hidden="true" className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-xs font-bold text-red-800 mb-1">Caloric Safety Warning</p>
              <p className="text-xs text-red-800 leading-relaxed">
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
