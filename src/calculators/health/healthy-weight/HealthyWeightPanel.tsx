import { Weight } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { parseAmount as parseVal } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function HealthyWeightPanel({ values, results }: Props) {
  const rangeRes = results.find((r) => r.id === 'healthyWeightRange');
  const bmiRes = results.find((r) => r.id === 'bmi');
  const whtrRes = results.find((r) => r.id === 'whtr');
  const targetRes = results.find((r) => r.id === 'adjustedTarget');
  const devineRes = results.find((r) => r.id === 'devineIdeal');

  if (!rangeRes || !bmiRes) return null;

  const bmi = parseVal(bmiRes.value);
  const unit = values.unit || 'imperial';
  const weight = parseFloat(values.weight) || 0;

  // Parse weight from the healthy range string
  const rangeStr = rangeRes.value;
  const rangeParts = rangeStr.split('–').map((s) => s.trim());
  const firstWeight = rangeParts[0] ? parseFloat(rangeParts[0].replace(/[^0-9.]/g, '')) : 0;
  const secondWeight = rangeParts[1] ? parseFloat(rangeParts[1].replace(/[^0-9.]/g, '')) : 0;

  // BMI scale positions
  const bmiMin = 14;
  const bmiMax = 35;
  const bmiRange = bmiMax - bmiMin;
  const bmiPos = ((bmi - bmiMin) / bmiRange) * 100;
  const bmiHealthyStart = ((18.5 - bmiMin) / bmiRange) * 100;
  const bmiHealthyEnd = ((24.9 - bmiMin) / bmiRange) * 100;

  const bmiCategory = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
  const bmiColor = bmiCategory === 'Normal' ? '#22c55e' : bmiCategory === 'Underweight' ? '#f59e0b' : '#ef4444';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Weight size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Weight Assessment
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">BMI Scale</p>
          <div className="relative h-8 bg-slate-100 rounded-full overflow-hidden mx-2">
            <div className="absolute inset-0 flex">
              <div className="h-full bg-amber-300 opacity-50" style={{ width: `${bmiHealthyStart}%` }} />
              <div className="h-full bg-emerald-400 opacity-50" style={{ width: `${bmiHealthyEnd - bmiHealthyStart}%` }} />
              <div className="h-full bg-red-400 opacity-50" style={{ width: `${100 - bmiHealthyEnd}%` }} />
            </div>
            <div
              className="absolute top-0 h-8 w-1 bg-slate-900 transition-all"
              style={{ left: `calc(${Math.min(100, Math.max(0, bmiPos))}% - 2px)` }}
            />
            <div
              className="absolute -top-5 text-xs font-black"
              style={{ left: `calc(${Math.min(100, Math.max(0, bmiPos))}% - 12px)`, color: bmiColor }}
            >
              ▼
            </div>
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-1 px-2">
            <span>14</span>
            <span>18.5</span>
            <span>24.9</span>
            <span>35+</span>
          </div>
        </div>

        <div className={`rounded-xl px-5 py-4 text-center border-2 ${bmiCategory === 'Normal' ? 'bg-emerald-50 border-emerald-300' : bmiCategory === 'Underweight' ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-300'}`}>
          <p className="text-3xl font-black" style={{ color: bmiColor }}>{bmi.toFixed(1)}</p>
          <p className="text-xs font-bold mt-1" style={{ color: bmiColor }}>BMI — {bmiCategory}</p>
        </div>

        {firstWeight > 0 && secondWeight > 0 && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Healthy Weight Range</p>
            <p className="text-sm font-black text-emerald-700">{rangeRes.value}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {targetRes && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Frame-Adjusted</p>
              <p className="text-sm font-black text-blue-700">{targetRes.value}</p>
            </div>
          )}
          {devineRes && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-1">Devine Ideal</p>
              <p className="text-sm font-black text-purple-700">{devineRes.value}</p>
            </div>
          )}
        </div>

        {whtrRes && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
            <p className="text-xs font-bold text-slate-600 mb-1">Waist-to-Height Ratio</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">{whtrRes.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
