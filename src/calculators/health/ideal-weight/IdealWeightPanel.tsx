import { Scale } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { parseAmount as parseVal } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const FORMULA_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];

export default function IdealWeightPanel({ values, results }: Props) {
  const avgRes = results.find((r) => r.id === 'avgIdeal');
  const rangeRes = results.find((r) => r.id === 'rangeIdeal') || results.find((r) => r.id === 'rangeIdeal');
  const devineRes = results.find((r) => r.id === 'devine');
  const robinsonRes = results.find((r) => r.id === 'robinson');
  const millerRes = results.find((r) => r.id === 'miller');
  const hamwiRes = results.find((r) => r.id === 'hamwi');
  const bmiRangeRes = results.find((r) => r.id === 'bmiRange');
  const diffRes = results.find((r) => r.id === 'weightDiff');

  if (!avgRes || !devineRes || !robinsonRes || !millerRes || !hamwiRes) return null;

  const formulas = [
    { name: 'Devine', value: devineRes.value, color: FORMULA_COLORS[0] },
    { name: 'Robinson', value: robinsonRes.value, color: FORMULA_COLORS[1] },
    { name: 'Miller', value: millerRes.value, color: FORMULA_COLORS[2] },
    { name: 'Hamwi', value: hamwiRes.value, color: FORMULA_COLORS[3] },
  ];

  const unit = values.unit || 'imperial';
  const parseDisplay = (s: string) => parseFloat(s.replace(/[^0-9.]/g, ''));
  const values_kg = formulas.map((f) => {
    const v = parseDisplay(f.value);
    return unit === 'imperial' ? v * 0.45359237 : v;
  });
  const minVal = Math.min(...values_kg);
  const maxVal = Math.max(...values_kg);
  const range = maxVal - minVal || 1;

  const toX = (v: number) => ((v - minVal + range * 0.1) / (range * 1.2)) * 100;

  const fmt = (s: string) => s;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Scale size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Formula Comparison
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="rounded-xl bg-blue-50 border-2 border-blue-200 px-5 py-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Average Ideal Weight (4 Formulas)</p>
          <p className="text-2xl font-black text-blue-700">{avgRes.value}</p>
        </div>

        <div className="space-y-3">
          {formulas.map((f, i) => (
            <div key={f.name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold" style={{ color: f.color }}>{f.name}</span>
                <span className="font-semibold text-slate-700">{f.value}</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${toX(values_kg[i])}%`, backgroundColor: f.color, opacity: 0.7 }} />
              </div>
            </div>
          ))}
        </div>

        {bmiRangeRes && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Healthy BMI Range</p>
            <p className="text-sm font-black text-emerald-700">{bmiRangeRes.value}</p>
          </div>
        )}

        {diffRes && (
          <div className={`rounded-xl px-5 py-3 text-center border ${diffRes.color === 'positive' ? 'bg-emerald-50 border-emerald-200' : diffRes.color === 'negative' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className="text-xs font-bold text-slate-600 mb-1">Your Weight vs. Average Ideal</p>
            <p className="text-lg font-black" style={{ color: diffRes.color === 'positive' ? '#16a34a' : diffRes.color === 'negative' ? '#dc2626' : '#d97706' }}>
              {diffRes.value}
            </p>
          </div>
        )}

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Formulas were developed for clinical drug dosing, not weight goals.
            The average of all four provides the most balanced reference.
            Use the healthy BMI range as your primary target.
          </p>
        </div>
      </div>
    </div>
  );
}
