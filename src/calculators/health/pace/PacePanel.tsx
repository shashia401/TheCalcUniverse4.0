import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface SplitPoint {
  d: number; // distance in the selected unit
  dist: string; // "5 km"
  time: string; // "24:53"
}

export default function PacePanel({ results }: Props) {
  const paceResult = results.find(r => r.id === 'pace');
  const timeResult = results.find(r => r.id === 'totalTime');
  const distResult = results.find(r => r.id === 'distance');

  if (!paceResult || !timeResult || !distResult) return null;

  const paceStr = paceResult.value;
  const timeStr = timeResult.value;
  const distStr = distResult.value;

  // Splits are computed once in index.ts (never past the finish, rounded to whole seconds).
  let splitPoints: SplitPoint[] = [];
  try {
    const raw = results.find(r => r.id === '_splits')?.value;
    splitPoints = raw ? (JSON.parse(raw) as SplitPoint[]) : [];
  } catch {
    splitPoints = [];
  }

  // Wristband view: every split up to ~42 km/mi, otherwise every 10th, so it stays screenshot-sized.
  const lastSplit = splitPoints.length ? splitPoints[splitPoints.length - 1].d : 0;
  const keySplits = lastSplit <= 42.2 ? splitPoints : splitPoints.filter(sp => sp.d % 10 === 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Race Split Table & Wristband</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Summary banner */}
        <div className="rounded-xl bg-gradient-to-r from-blue-700 to-blue-800 px-5 py-4 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-100 mb-1">Race Plan</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">{distStr}</p>
              <p className="text-[11px] text-blue-100">Distance</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{timeStr}</p>
              <p className="text-[11px] text-blue-100">Goal Time</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{paceStr}</p>
              <p className="text-[11px] text-blue-100">Pace</p>
            </div>
          </div>
        </div>

        {/* Split Table */}
        <details className="group rounded-xl border border-slate-200 overflow-hidden" open>
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50">
            <span>Split Table</span>
            <svg aria-hidden="true" className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="border-t border-slate-100">
            {splitPoints.map(sp => (
              <div key={sp.d} className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <span className="text-xs font-semibold text-slate-700">{sp.dist}</span>
                <span className="text-sm font-bold text-slate-900 tabular-nums">{sp.time}</span>
              </div>
            ))}
            {/* Final time */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-blue-50 border-t border-blue-200">
              <span className="text-xs font-bold text-blue-700">Finish</span>
              <span className="text-sm font-bold text-blue-700 tabular-nums">{timeStr}</span>
            </div>
          </div>
        </details>

        {/* Wristband view */}
        {keySplits.length > 0 && (
          <details className="group rounded-xl border border-slate-200 overflow-hidden">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50">
              <span>Wristband View (screenshot this)</span>
              <svg aria-hidden="true" className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="p-4">
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="text-center mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{distStr} · {paceStr}</p>
                </div>
                <div className="space-y-1">
                  {keySplits.map(sp => (
                    <div key={sp.d} className="flex justify-between items-center px-3 py-1.5 bg-white rounded border border-slate-100">
                      <span className="text-xs font-bold text-slate-600">{sp.dist}</span>
                      <span className="text-xs font-bold text-slate-800 tabular-nums">{sp.time}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-3 py-1.5 bg-blue-700 rounded">
                    <span className="text-xs font-bold text-white">Finish</span>
                    <span className="text-xs font-bold text-white tabular-nums">{timeStr}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 text-center mt-3">Screenshot this for race day</p>
              </div>
            </div>
          </details>
        )}

        {/* Race strategy tips */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Pacing Tips</p>
          <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-blue-700 mt-0.5">•</span>
              <span>Aim for <strong>even or slightly negative splits</strong> — running the second half at the same pace or slightly faster than the first.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-700 mt-0.5">•</span>
              <span><strong>Halfway check:</strong> At halfway, you should have used slightly less than 50% of your planned total time.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-700 mt-0.5">•</span>
              <span>Try to keep each split within about <strong>5–10 seconds</strong> of your goal pace for the first 80% of the race.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
