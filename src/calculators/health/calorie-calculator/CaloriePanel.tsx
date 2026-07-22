import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function findResult(results: CalculatorResult[], id: string): CalculatorResult | undefined {
  return results.find((r) => r.id === id);
}

function parseCalories(val: string | undefined): number {
  if (!val) return 0;
  return parseInt(val.replace(/[^0-9]/g, '')) || 0;
}

function MacroDonutChart({ tdee }: { tdee: number }) {
  if (tdee <= 0) return null;

  // Standard macro split: 50% carbs, 20% protein, 30% fat
  const macros = [
    { label: 'Carbohydrates', pct: 50, color: '#3b82f6', grams: (tdee * 0.5) / 4 },
    { label: 'Protein', pct: 20, color: '#22c55e', grams: (tdee * 0.2) / 4 },
    { label: 'Fat', pct: 30, color: '#f59e0b', grams: (tdee * 0.3) / 9 },
  ];

  const cx = 110;
  const cy = 110;
  const r = 85;
  const ir = 55;

  const polarToCart = (angleDeg: number, radius: number) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const describeArc = (startDeg: number, endDeg: number, outerR: number, innerR: number) => {
    const startAngle = startDeg;
    const endAngle = endDeg;
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    const p1 = polarToCart(startAngle, outerR);
    const p2 = polarToCart(endAngle, outerR);
    const p3 = polarToCart(endAngle, innerR);
    const p4 = polarToCart(startAngle, innerR);

    return [
      `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
      `L ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${p4.x.toFixed(1)} ${p4.y.toFixed(1)}`,
      'Z',
    ].join(' ');
  };

  let currentAngle = 0;
  const slices = macros.map((macro) => {
    const sliceAngle = (macro.pct / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    const midAngle = currentAngle + sliceAngle / 2;
    currentAngle = endAngle;

    const labelPos = polarToCart(midAngle, (r + ir) / 2);
    const labelR = polarToCart(midAngle, r + 18);

    return {
      ...macro,
      d: describeArc(startAngle, endAngle, r, ir),
      labelX: labelPos.x,
      labelY: labelPos.y,
      pctX: labelR.x,
      pctY: labelR.y,
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 260" className="w-full max-w-[220px]" role="img" aria-label="Macronutrient distribution donut chart">
        {slices.map((slice) => (
          <g key={slice.label}>
            <path d={slice.d} fill={slice.color} opacity={0.75} stroke="white" strokeWidth={1.5} />
          </g>
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight="bold" fill="#0f172a">
          {tdee.toLocaleString()}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="#64748b">
          kcal/day
        </text>

        {slices.map((slice) => (
          <text
            key={slice.label}
            x={slice.pctX}
            y={slice.pctY}
            textAnchor="middle"
            fontSize={11}
            fontWeight="bold"
            fill={slice.color}
          >
            {slice.pct}%
          </text>
        ))}
      </svg>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-1">
        {macros.map((m) => (
          <div key={m.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: m.color, opacity: 0.75 }} />
            <span className="text-[11px] text-slate-600">
              {m.label} ({m.pct}%, ~{Math.round(m.grams)}g)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnergyBars({ bmr, tdee }: { bmr: number; tdee: number }) {
  if (bmr <= 0 || tdee <= 0) return null;

  const maxVal = Math.max(bmr, tdee);
  const items = [
    { label: 'BMR', value: bmr, color: 'bg-blue-500', desc: 'Basal metabolic rate (resting)' },
    { label: 'Activity', value: tdee - bmr, color: 'bg-amber-500', desc: 'Physical activity & TEF' },
  ];

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-16 text-right flex-shrink-0">
            <span className="text-xs font-bold text-slate-600">{item.label}</span>
          </div>
          <div className="flex-1 h-6 bg-slate-100 rounded-sm overflow-hidden relative">
            <div
              className={`absolute left-0 top-0 h-full rounded-sm ${item.color} opacity-70 transition-all duration-500`}
              style={{ width: `${(item.value / maxVal) * 100}%` }}
            />
            <span className="absolute left-2 top-0 text-[10px] text-white font-bold leading-6 drop-shadow-md">
              {item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} kcal
            </span>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
        <div className="w-16 text-right flex-shrink-0">
          <span className="text-xs font-bold text-slate-700">TDEE</span>
        </div>
        <div className="flex-1 text-xs font-bold text-slate-700">
          {tdee.toLocaleString(undefined, { maximumFractionDigits: 0 })} kcal/day
          <span className="font-normal text-slate-500 ml-2">
            BMR is {(bmr / tdee * 100).toFixed(0)}% of TDEE
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CaloriePanel({ values, results }: Props) {
  if (!results || results.length === 0) return null;

  const hasError = results.some((r) => r.id === 'error');
  if (hasError) return null;

  const bmrResult = findResult(results, 'bmr');
  const tdeeResult = findResult(results, 'tdee');
  const bmiResult = findResult(results, 'bmi');
  const deficitResult = findResult(results, 'calorieDifference');
  const weightResult = findResult(results, 'weeklyWeightChange');

  const bmr = parseCalories(bmrResult?.value);
  const tdee = parseCalories(tdeeResult?.value);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
          <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Energy &amp; Macronutrient Breakdown</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Donut chart */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Recommended Macro Distribution (based on TDEE)
          </p>
          <MacroDonutChart tdee={tdee} />
        </div>

        {/* Energy breakdown */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            BMR vs. Activity Energy
          </p>
          <EnergyBars bmr={bmr} tdee={tdee} />
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {bmrResult && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">BMR</p>
              <p className="text-sm font-bold text-blue-700">{bmr.toLocaleString()} kcal</p>
              <p className="text-[10px] text-blue-500">At complete rest</p>
            </div>
          )}
          {tdeeResult && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">TDEE</p>
              <p className="text-sm font-bold text-emerald-700">{tdee.toLocaleString()} kcal</p>
              <p className="text-[10px] text-emerald-500">Total daily burn</p>
            </div>
          )}
          {bmiResult && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">BMI</p>
              <p className="text-sm font-bold text-slate-700">{bmiResult.value}</p>
              <p className="text-[10px] text-slate-500">Body Mass Index</p>
            </div>
          )}
        </div>

        {/* Deficit/Surplus info */}
        {deficitResult && weightResult && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-3">
            <p className="text-xs text-sky-800">
              <strong className="text-sky-900">{deficitResult.value}</strong> &middot;{' '}
              Projected: <strong className="text-sky-900">{weightResult.value}</strong>
            </p>
          </div>
        )}

        {/* Activity level note */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
          <p className="text-xs text-slate-600">
            <strong>Activity Level:</strong> {(() => {
              const labels: Record<string, string> = {
                '1.2': 'Sedentary (BMR x 1.2)',
                '1.375': 'Light Exercise (BMR x 1.375)',
                '1.55': 'Moderate Exercise (BMR x 1.55)',
                '1.725': 'Active (BMR x 1.725)',
                '1.9': 'Very Active (BMR x 1.9)',
              };
              return labels[values.activityLevel || ''] || 'N/A';
            })()} &middot;{' '}
            <strong>Formula:</strong> Mifflin-St Jeor
          </p>
        </div>
      </div>
    </div>
  );
}
