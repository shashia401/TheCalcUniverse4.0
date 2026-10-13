import { CalculatorResult } from '../../../types/calculator';
import { typingStats } from './wpmMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function WpmTypingPanel({ values, results }: Props) {
  // Same pure function index.ts uses; the panel never parses result strings.
  const t = typingStats(values);
  if (!t || !results.length) return null;

  // Speed scale: 0-120 WPM mapped to 0-100%
  const speedPct = Math.min((t.grossWpm / 120) * 100, 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Speed &amp; Accuracy</span>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Typing Speed</p>
          <div className="h-6 bg-slate-100 rounded-full overflow-hidden relative" role="img" aria-label={`${t.grossWpm.toFixed(1)} gross words per minute on a 0 to 120 scale`}>
            <div className="h-full bg-gradient-to-r from-red-300 via-amber-300 to-emerald-300 rounded-full w-full" />
            <div className="absolute top-0 h-full w-0.5 bg-slate-900" style={{ left: `${speedPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
            <span>0</span>
            <span>40</span>
            <span>80</span>
            <span>120+ WPM</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 text-center">
            <p className="text-[10px] font-bold text-blue-700 uppercase">Gross WPM</p>
            <p className="text-2xl font-bold font-mono text-blue-800">{t.grossWpm.toFixed(1)}</p>
            <p className="text-[10px] text-blue-700">Raw speed</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 text-center">
            <p className="text-[10px] font-bold text-emerald-700 uppercase">Net WPM</p>
            <p className="text-2xl font-bold font-mono text-emerald-800">{t.netWpm.toFixed(1)}</p>
            <p className="text-[10px] text-emerald-700">Correct characters only</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Accuracy</p>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden" role="img" aria-label={`Accuracy ${t.accuracy.toFixed(1)} percent`}>
              <div
                className={`h-full rounded-full ${t.accuracy >= 90 ? 'bg-emerald-700' : t.accuracy >= 70 ? 'bg-amber-700' : 'bg-red-700'}`}
                style={{ width: `${t.accuracy}%` }}
              />
            </div>
          </div>
          <span className="text-xl font-bold font-mono text-slate-700">{t.accuracy.toFixed(1)}%</span>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-center">
          <p className="text-[10px] font-bold text-red-700 uppercase">Errors</p>
          <p className="text-lg font-bold font-mono text-red-800">{t.errorCount.toLocaleString('en-US')}</p>
        </div>
      </div>
    </div>
  );
}
