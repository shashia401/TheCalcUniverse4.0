import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface SleepOption {
  time: string;
  cycles: number;
  hours: number;
}

function getValue(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '';
}

export default function SleepPanel({ results }: Props) {
  const mode = results.length > 0 ? (results.find((r) => r.id === 'recommendedBedtime') ? 'wake' : 'sleep') : 'wake';
  const recommendedTime = getValue(results, mode === 'wake' ? 'recommendedBedtime' : 'recommendedWakeup');
  const optionsRaw = getValue(results, 'options');
  const cycleInfo = getValue(results, 'cycleInfo');

  if (!recommendedTime || !optionsRaw) return null;

  const options: SleepOption[] = (() => {
    try { return JSON.parse(optionsRaw); } catch { return []; }
  })();

  return (
    <div className="space-y-5">
      {/* Moon/stars aesthetic header */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 shadow-md shadow-indigo-900/40 overflow-hidden">
        <div className="px-6 py-4 border-b border-indigo-700/40 text-center">
          <div className="flex justify-center mb-2">
            <svg className="w-8 h-8 text-yellow-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
            </svg>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">
            {mode === 'wake' ? 'Bedtime Calculator' : 'Wake-up Calculator'}
          </span>
        </div>
        <div className="p-6 text-center">
          <p className="text-xs text-indigo-300 font-medium uppercase tracking-wider mb-1">
            {mode === 'wake' ? 'Go to bed at' : 'Wake up at'}
          </p>
          <p className="text-4xl sm:text-5xl font-bold tracking-tight text-yellow-300">
            {recommendedTime}
          </p>
          <p className="mt-2 text-sm text-indigo-300">
            {cycleInfo}
          </p>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/60">
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Options
          </span>
        </div>
        <div className="p-5 space-y-3">
          {options.map((opt) => {
            const isBest = opt.cycles >= 5 && opt.cycles <= 6;
            const isRecommended = opt.time === recommendedTime;

            return (
              <div
                key={opt.time}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isRecommended
                    ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 shadow-sm shadow-emerald-200/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-4 px-4 py-3">
                  {/* Time Column */}
                  <div className="flex-1">
                    <p className={`text-lg font-bold ${isRecommended ? 'text-emerald-800' : 'text-slate-700'}`}>
                      {opt.time}
                    </p>
                    <p className={`text-xs ${isRecommended ? 'text-emerald-500' : 'text-slate-500'}`}>
                      {opt.cycles} cycles &middot; {opt.hours.toFixed(1)} hours
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex-1 max-w-[200px]">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round((opt.cycles / 6) * 100)} aria-valuemin={0} aria-valuemax={100}>
                      <div
                        className={`h-full rounded-full transition-all ${
                          isRecommended ? 'bg-emerald-400' : 'bg-indigo-300'
                        }`}
                        style={{ width: `${(opt.cycles / 6) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[10px] text-slate-500">3 cycles</span>
                      <span className="text-[10px] text-slate-500">6 cycles</span>
                    </div>
                  </div>

                  {/* Badge */}
                  {isBest && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                      Best
                    </span>
                  )}
                  {isRecommended && !isBest && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sleep Cycle Education */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-start gap-3 px-5 py-4">
          <svg className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-1">
              Each sleep cycle is ~90 minutes
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              A complete sleep cycle includes light sleep (N1), stable sleep (N2), deep sleep (N3), and REM sleep (when dreaming occurs). Waking at the end of a cycle leaves you feeling refreshed. Waking mid-cycle can cause grogginess and brain fog.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
