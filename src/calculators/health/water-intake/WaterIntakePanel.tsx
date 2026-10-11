import { Droplets } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface WaterData {
  liters: number;
  oz: number;
  cups: number;
  ml: number;
  baseLiters: number;
}

export default function WaterIntakePanel({ values, results }: Props) {
  const baseRes = results.find((r) => r.id === 'baseIntake');

  // Numbers come from index.ts (_water). Scraping "2.5 liters (85.0 oz)" with a digit-stripping regex
  // glued both numbers together and showed 2.6 L for a 2.5 L target.
  let data: WaterData | null = null;
  try {
    const raw = results.find((r) => r.id === '_water')?.value;
    if (raw) data = JSON.parse(raw) as WaterData;
  } catch {
    data = null;
  }
  if (!data) return null;

  const { liters: totalLiters, cups: totalCups, ml: totalMl } = data;
  const activity = values.activityLevel || 'sedentary';
  const climate = values.climate || 'normal';

  const activityLabels: Record<string, string> = {
    sedentary: 'Sedentary',
    light: 'Lightly Active',
    moderate: 'Moderately Active',
    active: 'Very Active',
    athlete: 'Athlete',
  };

  const climateLabels: Record<string, string> = {
    normal: 'Temperate',
    hot: 'Hot/Humid',
    extreme: 'Very Hot',
    altitude: 'High Altitude',
  };

  const fillLevel = Math.min(100, (totalLiters / 4) * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Droplets size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Daily Water Target
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex items-center gap-6">
          <div className="relative w-20 h-28 flex-shrink-0">
            <svg viewBox="0 0 80 120" className="w-full h-full" role="img" aria-label={`Water glass filled to ${Math.round(fillLevel)}% of a 4 litre scale: ${totalLiters.toFixed(1)} litres per day`}>
              <path d="M15,30 Q15,15 40,5 Q65,15 65,30 L65,100 Q65,115 40,115 Q15,115 15,100 Z" fill="#e2e8f0" />
              <path
                d="M15,30 Q15,15 40,5 Q65,15 65,30 L65,100 Q65,115 40,115 Q15,115 15,100 Z"
                fill="#1d4ed8"
                opacity={0.45}
                clipPath="inset(0 0 0 0)"
                style={{ clipPath: `inset(${100 - fillLevel}% 0 0 0)` }}
              />
              <path
                d="M15,30 Q15,15 40,5 Q65,15 65,30 L65,100 Q65,115 40,115 Q15,115 15,100 Z"
                fill="none"
                stroke="#94a3b8"
                strokeWidth={1.5}
              />
              <line x1={25} y1={30} x2={55} y2={30} stroke="#94a3b8" strokeWidth={0.5} />
              <line x1={25} y1={50} x2={55} y2={50} stroke="#94a3b8" strokeWidth={0.5} />
              <line x1={25} y1={70} x2={55} y2={70} stroke="#94a3b8" strokeWidth={0.5} />
              <line x1={25} y1={90} x2={55} y2={90} stroke="#94a3b8" strokeWidth={0.5} />
              <text x={40} y={24} textAnchor="middle" fontSize={9} fill="#1e3a8a" fontWeight="bold">
                {totalLiters.toFixed(1)}L
              </text>
            </svg>
          </div>
          <div className="flex-1 space-y-2">
            <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">Total Daily Target</p>
              <p className="text-xl font-black text-blue-800">{totalLiters.toFixed(1)} L</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-200 px-3 py-2 text-center">
                <p className="text-[10px] text-slate-600">Cups</p>
                <p className="text-sm font-black text-slate-700">{totalCups}</p>
              </div>
              <div className="rounded-lg border border-slate-200 px-3 py-2 text-center">
                <p className="text-[10px] text-slate-600">mL</p>
                <p className="text-sm font-black text-slate-700">{totalMl.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Activity</p>
            <p className="text-xs font-semibold text-slate-700">{activityLabels[activity] || activity}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Climate</p>
            <p className="text-xs font-semibold text-slate-700">{climateLabels[climate] || climate}</p>
          </div>
        </div>

        {baseRes && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">Base Intake (weight-based)</p>
            <p className="text-sm font-black text-emerald-800">{baseRes.value}</p>
            <p className="text-[10px] text-emerald-800 mt-0.5">
              + adjustments for activity &amp; climate
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
