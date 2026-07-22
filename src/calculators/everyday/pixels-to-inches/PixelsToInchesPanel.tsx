import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.-]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function PixelsToInchesPanel({ results }: Props) {
  const inches = results.find(r => r.id === 'inches');
  const cm = results.find(r => r.id === 'cm');
  const mm = results.find(r => r.id === 'mm');
  const dpi = results.find(r => r.id === 'dpiUsed');
  const megapixels = results.find(r => r.id === 'megapixels');

  if (!inches || !cm) return null;

  const inchesVal = parseNum(inches.value);
  const dpiVal = dpi ? parseNum(dpi.value) : 72;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Print Dimensions</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Ruler visualization */}
        <div className="relative">
          <div className="h-10 bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200">
            {/* Scale markings */}
            {Array.from({ length: Math.min(Math.ceil(inchesVal), 20) }, (_, i) => (
              <div
                key={i}
                className="absolute top-0 w-px h-full bg-slate-300"
                style={{ left: `${(i / Math.min(Math.ceil(inchesVal), 20)) * 100}%` }}
              />
            ))}
            {/* Filled portion */}
            <div
              className="h-full rounded-lg bg-gradient-to-r from-blue-400 to-indigo-500 opacity-30"
              style={{ width: `${Math.min((inchesVal / 20) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px] text-slate-400">0"</span>
            <span className="text-[10px] text-slate-400 font-bold">{inches.value}</span>
          </div>
        </div>

        {/* Size cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-slate-200 bg-blue-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Inches</p>
            <p className="text-sm font-bold text-blue-700">{inches.value?.replace('"', '') ?? '-'}"</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-emerald-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Centimeters</p>
            <p className="text-sm font-bold text-emerald-700">{cm.value}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-amber-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Millimeters</p>
            <p className="text-sm font-bold text-amber-700">{mm?.value ?? '-'}</p>
          </div>
        </div>

        {/* DPI and MP info */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">DPI / PPI</p>
            <p className="text-sm font-bold text-slate-700">{dpi?.value ?? '-'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Megapixels</p>
            <p className="text-sm font-bold text-slate-700">{megapixels?.value ?? '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
