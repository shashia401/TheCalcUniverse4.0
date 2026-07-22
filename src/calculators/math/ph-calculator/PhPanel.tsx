import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.-]+/);
  return m ? parseFloat(m[0]) : 0;
}

const pHColors = [
  '#ef4444', '#ef4444', '#ef4444', '#f97316',
  '#eab308', '#eab308', '#84cc16',
  '#22c55e',
  '#3b82f6', '#2563eb', '#2563eb',
  '#8b5cf6', '#8b5cf6', '#a855f7', '#a855f7',
];

export default function PhPanel({ results }: Props) {
  const phValue = results.find(r => r.id === 'phValue');
  const classification = results.find(r => r.id === 'classification');
  const hColor = results.find(r => r.id === 'hColor');
  const hConc = results.find(r => r.id === 'hConcentration');

  if (!phValue) return null;

  const pH = parseNum(phValue.value);
  const clampedPH = Math.max(0, Math.min(14, pH));

  // Position of pH on the 0-14 scale (percentage)
  const pos = (clampedPH / 14) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">pH Scale</span>
      </div>
      <div className="p-5 space-y-4">
        {/* pH scale bar */}
        <div className="relative">
          <div className="h-8 rounded-full overflow-hidden flex">
            {pHColors.map((color, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: color }} />
            ))}
          </div>
          {/* Pointer */}
          <div
            className="absolute -top-1 transition-all"
            style={{ left: `calc(${pos}% - 12px)` }}
          >
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 bg-white border-2 border-slate-400 rounded-full flex items-center justify-center shadow-md">
                <div className="w-2 h-2 bg-slate-600 rounded-full" />
              </div>
            </div>
          </div>
          {/* pH value at pointer */}
          <div
            className="absolute top-8 transition-all"
            style={{ left: `calc(${pos}% - 18px)` }}
          >
            <span className="text-xs font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
              pH {phValue.value}
            </span>
          </div>
          {/* Scale labels */}
          <div className="flex justify-between mt-8">
            <span className="text-[10px] text-slate-400">0</span>
            <span className="text-[10px] text-slate-400">7</span>
            <span className="text-[10px] text-slate-400">14</span>
          </div>
        </div>

        {/* Classification badges */}
        <div className="flex items-center justify-center gap-2">
          {classification && (
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              pH < 7 ? 'bg-red-100 text-red-700' :
              pH === 7 ? 'bg-green-100 text-green-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {classification.value}
            </span>
          )}
          {hColor && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600">
              Indicator: {hColor.value}
            </span>
          )}
        </div>

        {/* [H+] concentration */}
        {hConc && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">[H⁺] Concentration</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5 break-all">{hConc.value} mol/L</p>
          </div>
        )}
      </div>
    </div>
  );
}
