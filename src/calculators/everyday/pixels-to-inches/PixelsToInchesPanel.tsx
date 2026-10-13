import { CalculatorResult } from '../../../types/calculator';
import { pixelInfo } from './pixelsMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function PixelsToInchesPanel({ values, results }: Props) {
  // Same pure function index.ts uses; the panel never parses result strings (it also used to vanish in single-unit modes).
  const p = pixelInfo(values);
  if (!p || !results.length) return null;
  const f2 = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const rulerMax = 20;
  const ticks = Math.min(Math.ceil(p.inches), rulerMax);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Print Dimensions</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="relative">
          <div
            className="h-10 bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200"
            role="img"
            aria-label={`Ruler: ${f2(p.inches)} inches of a ${rulerMax} inch scale`}
          >
            {Array.from({ length: ticks }, (_, i) => (
              <div key={i} className="absolute top-0 w-px h-full bg-slate-300" style={{ left: `${(i / ticks) * 100}%` }} />
            ))}
            <div className="h-full rounded-lg bg-gradient-to-r from-blue-700 to-indigo-700 opacity-40" style={{ width: `${Math.min((p.inches / rulerMax) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px] text-slate-600">0&quot;</span>
            <span className="text-[10px] text-slate-600 font-bold">{f2(p.inches)}&quot;{p.inches > rulerMax ? ` (beyond the ${rulerMax}" scale)` : ''}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-slate-200 bg-blue-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">Inches</p>
            <p className="text-sm font-bold text-blue-700">{f2(p.inches)}&quot;</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-emerald-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">Centimeters</p>
            <p className="text-sm font-bold text-emerald-700">{f2(p.cm)} cm</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-amber-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">Millimeters</p>
            <p className="text-sm font-bold text-amber-700">{f2(p.mm)} mm</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">DPI / PPI</p>
            <p className="text-sm font-bold text-slate-700">{p.dpi.toLocaleString('en-US')}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">{p.squareAssumed ? 'Megapixels (square)' : 'Megapixels'}</p>
            <p className="text-sm font-bold text-slate-700">{f2(p.megapixels)} MP</p>
          </div>
        </div>
      </div>
    </div>
  );
}
