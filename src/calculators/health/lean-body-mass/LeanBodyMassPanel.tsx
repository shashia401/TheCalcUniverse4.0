import { GitFork } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseVal(s: string): number {
  return parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
}

const FORMULA_COLORS = ['#3b82f6', '#22c55e', '#f59e0b'];

export default function LeanBodyMassPanel({ values, results }: Props) {
  const avgRes = results.find((r) => r.id === 'avgLBM');
  const boerRes = results.find((r) => r.id === 'boer');
  const jamesRes = results.find((r) => r.id === 'james');
  const humeRes = results.find((r) => r.id === 'hume');
  const totalRes = results.find((r) => r.id === 'totalWeight');
  const fatRes = results.find((r) => r.id === 'estimatedFatMass');
  const lbmPctRes = results.find((r) => r.id === 'lbmPct');

  if (!avgRes || !totalRes || !fatRes || !lbmPctRes) return null;

  const unit = values.unit || 'imperial';
  const totalWeightKg = parseVal(totalRes.value);
  const avgLbmKg = parseVal(avgRes.value);
  const fatMassKg = totalWeightKg - avgLbmKg;
  const lbmPct = (avgLbmKg / totalWeightKg) * 100;
  const fatPct = (fatMassKg / totalWeightKg) * 100;

  const formulas = [
    { name: 'Boer', value: boerRes?.value || '', color: FORMULA_COLORS[0] },
    { name: 'James', value: jamesRes?.value || '', color: FORMULA_COLORS[1] },
    { name: 'Hume', value: humeRes?.value || '', color: FORMULA_COLORS[2] },
  ];

  const formulaKgVals = formulas.map((f) => parseVal(f.value));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <GitFork size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Body Composition
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="h-16 bg-slate-100 rounded-xl overflow-hidden flex">
          <div className="bg-emerald-500 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${lbmPct}%` }}>
            {lbmPct > 15 ? `Lean ${lbmPct.toFixed(0)}%` : ''}
          </div>
          <div className="bg-amber-400 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${fatPct}%` }}>
            {fatPct > 10 ? `Fat ${fatPct.toFixed(0)}%` : ''}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Lean Mass</p>
            <p className="text-lg font-black text-emerald-700">{avgRes.value}</p>
            <p className="text-xs text-emerald-500">{lbmPct.toFixed(1)}% of body weight</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Fat Mass</p>
            <p className="text-lg font-black text-amber-700">{fatRes.value}</p>
            <p className="text-xs text-amber-500">{fatPct.toFixed(1)}% body fat</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {formulas.map((f, i) => (
            <div key={f.name} className="rounded-xl border text-center px-2 py-3" style={{ borderColor: f.color + '40', backgroundColor: f.color + '10' }}>
              <p className="text-xs font-bold" style={{ color: f.color }}>{f.name}</p>
              <p className="text-base font-black text-slate-700">{f.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            Average LBM across 3 formulas. Boer (1984) is generally considered most accurate.
            For clinical precision, DEXA or hydrostatic weighing is superior.
          </p>
        </div>
      </div>
    </div>
  );
}
