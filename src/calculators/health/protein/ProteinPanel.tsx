import { Drumstick } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import MiniRing from '../../../components/calculator/MiniRing';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface ProteinData {
  min: number;
  max: number;
  target: number;
  meals: { n: number; g: number }[];
}

export default function ProteinPanel({ results }: Props) {
  const mpsRes = results.find((r) => r.id === 'mpsOptimal');
  const foodRes = results.find((r) => r.id === 'foodEquivalents');

  // Numbers come from index.ts (_protein). Parsing the display strings used to glue "170 g/day · 680 kcal ·
  // 1.80 g/kg" into the number 1706801.8 and to label "35 g × 4 meals" as 5 meals (it contains a "5").
  let data: ProteinData | null = null;
  try {
    const raw = results.find((r) => r.id === '_protein')?.value;
    if (raw) data = JSON.parse(raw) as ProteinData;
  } catch {
    data = null;
  }
  if (!data) return null;

  const { min: dailyMin, max: dailyMax, target: dailyTarget, meals } = data;
  const foodEquiv = foodRes ? foodRes.value : '';

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
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Daily Target</p>
          <div className="relative w-32 h-32 mx-auto">
            <MiniRing
              value={dailyTarget}
              total={Math.max(dailyMax, 1)}
              color="#1d4ed8"
              size={128}
              label={`Daily protein target ${dailyTarget} grams, within a range of ${dailyMin} to ${dailyMax} grams`}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-slate-800 tabular-nums">{dailyTarget.toLocaleString()}</span>
              <span className="text-[10px] text-slate-600">grams</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Range: {dailyMin.toLocaleString()}–{dailyMax.toLocaleString()} g/day
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-2">Per Meal Distribution</p>
          <div className="flex gap-2">
            {meals.map((m) => (
              <div key={m.n} className="flex-1 bg-white rounded-lg px-2 py-2 text-center border border-blue-100">
                <p className="text-base font-black text-blue-700">{m.g}g</p>
                <p className="text-[10px] text-blue-800">× {m.n} meals</p>
                <p className="text-[10px] text-blue-800">({dailyTarget > 0 ? ((m.g / dailyTarget) * 100).toFixed(0) : 0}% of target)</p>
              </div>
            ))}
          </div>
        </div>

        {mpsRes && (
          <div className="rounded-xl bg-purple-50 border border-purple-200 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700 mb-1">Optimal for MPS</p>
            <p className="text-xs font-semibold text-purple-800">{mpsRes.value}</p>
          </div>
        )}

        {foodEquiv && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Food Equivalents</p>
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
