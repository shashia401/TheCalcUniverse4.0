import { Wheat } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseVal(s: string): number {
  return parseFloat(s.replace(/[^0-9.]/g, '').replace(/,/g, '')) || 0;
}

export default function CarbohydratePanel({ values, results }: Props) {
  const rangeRes = results.find((r) => r.id === 'dailyCarbRange');
  const avgRes = results.find((r) => r.id === 'dailyAvg');
  const goalRes = results.find((r) => r.id === 'goalLabel');
  const foodRes = results.find((r) => r.id === 'foodEquivalents');
  const glycogenRes = results.find((r) => r.id === 'glycogenLoading');

  if (!rangeRes || !avgRes) return null;

  const dailyAvg = parseVal(avgRes.value);
  const dailyMin = rangeRes.value ? parseVal(rangeRes.value.split('–')[0] || '0') : 0;
  const dailyMax = rangeRes.value ? parseVal(rangeRes.value.split('–')[1] || '0') : 0;

  const foodEquiv = foodRes ? foodRes.value : '';
  const foodItems = foodEquiv.split('·').map((s) => s.trim()).filter(Boolean);

  const maxGauge = Math.max(dailyMax, 1);
  const barPct = (dailyAvg / maxGauge) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Wheat size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Carbohydrate Intake
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="rounded-xl bg-blue-50 border-2 border-blue-200 px-5 py-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Average Daily Target</p>
          <p className="text-2xl font-black text-blue-700">{dailyAvg} g</p>
          <p className="text-xs text-blue-500 mt-1">Range: {dailyMin}–{dailyMax} g/day</p>
        </div>

        <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, barPct)}%` }} />
        </div>

        {goalRes && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Goal</p>
            <p className="text-sm font-semibold text-slate-700">{goalRes.value}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {(() => {
            const calFromCarbs = dailyAvg * 4;
            const pctOf2000 = (calFromCarbs / 2000) * 100;
            return (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Calories from Carbs</p>
                  <p className="text-base font-black text-slate-700">{calFromCarbs.toLocaleString()} kcal</p>
                </div>
                <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600 mb-1">% of 2000 kcal Diet</p>
                  <p className="text-base font-black text-orange-700">{pctOf2000.toFixed(0)}%</p>
                </div>
              </>
            );
          })()}
        </div>

        {foodItems.length > 0 && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Food Equivalents</p>
            <div className="flex flex-wrap gap-2">
              {foodItems.map((item, i) => (
                <span key={i} className="text-[10px] bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-600">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {glycogenRes && (
          <div className="rounded-xl bg-purple-50 border border-purple-200 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-1">Glycogen Loading</p>
            <p className="text-xs font-semibold text-purple-700">{glycogenRes.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
