import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function MacroPointPanel({ results }: Props) {
  const pointsResult = results.find(r => r.id === 'macroPoints');
  const calPointsResult = results.find(r => r.id === 'caloriePoints');
  const satFatPointsResult = results.find(r => r.id === 'satFatPoints');
  const sugarPointsResult = results.find(r => r.id === 'sugarPoints');
  const proteinCreditResult = results.find(r => r.id === 'proteinCredit');

  if (!pointsResult || !calPointsResult || !satFatPointsResult || !sugarPointsResult || !proteinCreditResult) return null;

  const points = parseFloat(pointsResult.value);
  const calPoints = parseFloat(calPointsResult.value);
  const satFatPoints = parseFloat(satFatPointsResult.value);
  const sugarPoints = parseFloat(sugarPointsResult.value);
  const proteinCredit = Math.abs(parseFloat(proteinCreditResult.value.replace('−', '-')));
  const totalGross = calPoints + satFatPoints + sugarPoints;
  const maxVal = Math.max(totalGross, 15);
  const net = totalGross - proteinCredit;

  // -700 backgrounds keep the white value labels at >= 4.5:1.
  const macroItems = [
    { key: 'calories', label: 'Calories', value: calPoints, color: 'bg-blue-700', detail: 'kcal × 0.0305', display: `+${calPoints.toFixed(1)}` },
    { key: 'satFat', label: 'Saturated fat', value: satFatPoints, color: 'bg-red-700', detail: 'g × 0.275', display: `+${satFatPoints.toFixed(1)}` },
    { key: 'sugar', label: 'Sugar', value: sugarPoints, color: 'bg-orange-700', detail: 'g × 0.12', display: `+${sugarPoints.toFixed(1)}` },
    { key: 'protein', label: 'Protein credit', value: proteinCredit, color: 'bg-emerald-700', detail: 'g × 0.098, subtracted', display: `−${proteinCredit.toFixed(1)}` },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Point Breakdown</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Score display */}
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Macro Points Score</p>
          <p className="text-4xl font-bold text-blue-700">{points.toFixed(1)}</p>
          <p className="text-xs text-slate-600 mt-1">points per serving</p>
        </div>

        {/* Component breakdown */}
        <div role="group" aria-label="Points contributed by calories, saturated fat, sugar and the protein credit">
          {macroItems.map(item => (
            <HBarRow
              key={item.key}
              label={item.label}
              labelWidth="w-28"
              value={item.value}
              max={maxVal}
              color={item.color}
              display={item.display}
            />
          ))}
          <p className="text-[10px] text-slate-600 mt-1">
            Calories {macroItems[0].detail} · saturated fat {macroItems[1].detail} · sugar {macroItems[2].detail} · protein {macroItems[3].detail}
          </p>
        </div>

        {/* Net calculation */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
          <p className="text-xs font-bold text-slate-600">Net Calculation</p>
          <p className="text-xs text-slate-600 mt-1">
            {calPoints.toFixed(1)} (calories) + {satFatPoints.toFixed(1)} (sat fat) + {sugarPoints.toFixed(1)} (sugar) − {proteinCredit.toFixed(1)} (protein)
            <span className="font-bold text-slate-700"> = {points.toFixed(1)} points</span>
          </p>
          <p className="text-[10px] text-slate-600 mt-1">
            Parts are rounded to 0.1, so they may differ from the total by 0.1.{net < 0 ? ' Scores below zero are shown as 0.' : ''}
          </p>
        </div>

        {/* Example foods reference (typical products, scored with this formula) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Reference: Typical Food Scores</p>
          <div className="space-y-1.5 text-[11px] text-slate-600">
            <div className="flex justify-between"><span>Apple (medium, 95 kcal)</span><span className="font-bold text-slate-700">~5 pts</span></div>
            <div className="flex justify-between"><span>Grilled chicken breast (6 oz)</span><span className="font-bold text-slate-700">~4 pts</span></div>
            <div className="flex justify-between"><span>Avocado (half)</span><span className="font-bold text-slate-700">~5 pts</span></div>
            <div className="flex justify-between"><span>Whole wheat bread (2 slices)</span><span className="font-bold text-slate-700">~4–5 pts</span></div>
            <div className="flex justify-between"><span>Cheeseburger (fast food)</span><span className="font-bold text-slate-700">~10–18 pts</span></div>
            <div className="flex justify-between"><span>Chocolate bar (standard)</span><span className="font-bold text-slate-700">~10–14 pts</span></div>
          </div>
        </div>

        {/* Trademark disclaimer */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">Trademark Notice</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            This calculator is <strong>not affiliated with, endorsed by, or connected to WW International, Inc.</strong>
            "Weight Watchers" and "SmartPoints" are registered trademarks of WW International, Inc. The scoring
            formula used here employs a publicly known macronutrient-weighting approach that is structurally
            similar to popular point-based systems. We do not represent this as identical to any branded or
            proprietary scoring system.
          </p>
        </div>
      </div>
    </div>
  );
}
