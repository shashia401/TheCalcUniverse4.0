import { Drumstick } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseVal(s: string): number {
  return parseFloat(s.replace(/[^0-9.]/g, '').replace(/,/g, '')) || 0;
}

export default function ProteinPanel({ values, results }: Props) {
  const rangeRes = results.find((r) => r.id === 'dailyProteinRange');
  const targetRes = results.find((r) => r.id === 'dailyTarget');
  const perMealRes = results.find((r) => r.id === 'perMeal');
  const mpsRes = results.find((r) => r.id === 'mpsOptimal');
  const foodRes = results.find((r) => r.id === 'foodEquivalents');

  if (!rangeRes || !targetRes) return null;

  const dailyMin = parseVal(rangeRes.value.split('–')[0] || '0');
  const dailyMax = parseVal(rangeRes.value.split('–')[1] || '0');
  const dailyTarget = parseVal(targetRes.value);

  const mealBreakdown = perMealRes ? perMealRes.value : '';
  const foodEquiv = foodRes ? foodRes.value : '';

  // Parse meal breakdown for display
  const mealParts = mealBreakdown.split('·').map((s) => s.trim()).filter(Boolean);

  const maxGauge = Math.max(dailyMax, 1);
  const currentPct = (dailyTarget / maxGauge) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Drumstick size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Daily Protein Target
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Daily Target</p>
          <div className="relative w-32 h-32 mx-auto">
            <svg viewBox="0 0 120 120" className="w-full h-full">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - Math.min(1, currentPct / 100))}`}
                strokeLinecap="round"
                transform="rotate(-90, 60, 60)"
                opacity={0.8}
              />
              <text x="60" y="55" textAnchor="middle" fontSize="20" fontWeight="900" fill="#1e293b">
                {dailyTarget}
              </text>
              <text x="60" y="72" textAnchor="middle" fontSize="8" fill="#64748b">grams</text>
            </svg>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Range: {dailyMin}–{dailyMax} g/day
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2">Per Meal Distribution</p>
          <div className="flex gap-2">
            {mealParts.map((part, i) => {
              const gMatch = part.match(/(\d+)/);
              const gVal = gMatch ? parseInt(gMatch[1]) : 0;
              const mealLabel = part.includes('5') ? '5 meals' : part.includes('4') ? '4 meals' : '3 meals';
              const pct = dailyTarget > 0 ? (gVal / dailyTarget) * 100 : 0;
              return (
                <div key={i} className="flex-1 bg-white rounded-lg px-2 py-2 text-center border border-blue-100">
                  <p className="text-base font-black text-blue-700">{gVal}g</p>
                  <p className="text-[9px] text-blue-500">× {mealLabel.replace(/[^0-9]/g, '')}</p>
                  <p className="text-[9px] text-blue-400">({pct.toFixed(0)}%)</p>
                </div>
              );
            })}
          </div>
        </div>

        {mpsRes && (
          <div className="rounded-xl bg-purple-50 border border-purple-200 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-1">Optimal for MPS</p>
            <p className="text-xs font-semibold text-purple-700">{mpsRes.value}</p>
          </div>
        )}

        {foodEquiv && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Food Equivalents</p>
            <div className="flex flex-wrap gap-2">
              {foodEquiv.split('·').map((item, i) => (
                <span key={i} className="text-[10px] bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-600">
                  {item.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
