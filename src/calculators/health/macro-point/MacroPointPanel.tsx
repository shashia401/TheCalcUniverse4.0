import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

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
  const proteinCredit = parseFloat(proteinCreditResult.value.replace('−', '-'));
  const totalGross = calPoints + satFatPoints + sugarPoints;
  const maxVal = Math.max(totalGross, 15);

  const [hoverMacro, setHoverMacro] = useState<string | null>(null);

  const macroItems = [
    { key: 'calories', label: 'Calories Contribution', value: calPoints, color: 'bg-blue-400', type: 'negative' as const, detail: 'Based on calorie content relative to a reference value. Higher-calorie foods score more points.', format: (v: number) => `+${v.toFixed(1)}` },
    { key: 'satFat', label: 'Saturated Fat Penalty', value: satFatPoints, color: 'bg-red-400', type: 'negative' as const, detail: 'Saturated fat increases points due to its association with elevated LDL cholesterol and cardiovascular risk.', format: (v: number) => `+${v.toFixed(1)}` },
    { key: 'sugar', label: 'Sugar Penalty', value: sugarPoints, color: 'bg-orange-400', type: 'negative' as const, detail: 'Added sugars and high-glycemic carbohydrates increase points. Linked to insulin spikes and reduced satiety.', format: (v: number) => `+${v.toFixed(1)}` },
    { key: 'protein', label: 'Protein Credit', value: Math.abs(proteinCredit), color: 'bg-emerald-400', type: 'positive' as const, detail: 'Protein reduces total points by promoting satiety and having a higher thermic effect of food (TEF).', format: (v: number) => `−${v.toFixed(1)}` },
  ];

  const breakdownBar = (item: typeof macroItems[0]) => {
    const pct = Math.min((item.value / maxVal) * 100, 100);
    const isHovered = hoverMacro === item.key;
    return (
      <div
        key={item.key}
        className={`space-y-1 cursor-pointer transition-all ${isHovered ? 'opacity-100' : ''}`}
        onMouseEnter={() => setHoverMacro(item.key)}
        onMouseLeave={() => setHoverMacro(null)}
      >
        <div className="flex justify-between text-xs">
          <span className="font-semibold text-slate-700">{item.label}</span>
          <span className={`font-bold ${item.type === 'negative' ? 'text-red-600' : 'text-emerald-600'}`}>
            {item.format(item.value)}
          </span>
        </div>
        <div className="h-5 bg-slate-100 rounded-md overflow-hidden">
          <div className={`h-full rounded-md ${item.color} transition-all ${isHovered ? 'brightness-110' : ''}`} style={{ width: `${pct}%` }} />
        </div>
        {/* Hover tooltip inline */}
        {isHovered && (
          <div className="flex items-start gap-1.5 pt-1">
            <svg className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
              item.type === 'negative' ? 'text-slate-400' : 'text-emerald-500'
            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[10px] text-slate-500 leading-relaxed">{item.detail}</p>
          </div>
        )}
      </div>
    );
  };

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
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Macro Points Score</p>
          <p className="text-4xl font-bold text-blue-700">{points.toFixed(1)}</p>
          <p className="text-xs text-slate-500 mt-1">points per serving</p>
        </div>

        {/* Component breakdown */}
        <div className="space-y-3">
          {macroItems.map(item => breakdownBar(item))}
        </div>

        {/* Net calculation */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
          <p className="text-xs font-bold text-slate-600">Net Calculation</p>
          <p className="text-xs text-slate-500 mt-1">
            {calPoints.toFixed(1)} (calories) + {satFatPoints.toFixed(1)} (sat fat) + {sugarPoints.toFixed(1)} (sugar) − {Math.abs(proteinCredit).toFixed(1)} (protein)
            <span className="font-bold text-slate-700"> = {points.toFixed(1)} points</span>
          </p>
        </div>

        {/* Example foods reference */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Reference: Common Food Scores</p>
          <div className="space-y-1.5 text-[11px] text-slate-600">
            <div className="flex justify-between"><span>Apple (medium)</span><span className="font-bold text-slate-700">~0 pts</span></div>
            <div className="flex justify-between"><span>Grilled chicken breast (6 oz)</span><span className="font-bold text-slate-700">~2–3 pts</span></div>
            <div className="flex justify-between"><span>Avocado (half)</span><span className="font-bold text-slate-700">~4–5 pts</span></div>
            <div className="flex justify-between"><span>Whole wheat bread (2 slices)</span><span className="font-bold text-slate-700">~4 pts</span></div>
            <div className="flex justify-between"><span>Cheeseburger (fast food)</span><span className="font-bold text-slate-700">~14–18 pts</span></div>
            <div className="flex justify-between"><span>Chocolate bar (standard)</span><span className="font-bold text-slate-700">~10–14 pts</span></div>
          </div>
        </div>

        {/* Trademark disclaimer */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Trademark Notice</p>
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
