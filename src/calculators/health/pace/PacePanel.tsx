import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface SplitPoint {
  label: string;
  distance: number;
}

export default function PacePanel({ results }: Props) {
  const paceResult = results.find(r => r.id === 'pace');
  const timeResult = results.find(r => r.id === 'totalTime');
  const distResult = results.find(r => r.id === 'distance');

  if (!paceResult || !timeResult || !distResult) return null;

  // Parse pace as seconds per unit
  const paceStr = paceResult.value;
  const paceMatch = paceStr.match(/(\d+):(\d+)/);
  if (!paceMatch) return null;
  const paceSec = parseInt(paceMatch[1]) * 60 + parseInt(paceMatch[2]);

  // Parse total time as seconds
  const timeStr = timeResult.value;

  // Parse distance
  const distStr = distResult.value;
  const distMatch = distStr.match(/^([\d.]+)/);
  if (!distMatch) return null;
  const totalDist = parseFloat(distMatch[1]);

  const isMiles = paceStr.includes('/mi');
  const unit = isMiles ? 'mi' : 'km';

  // Generate all splits
  const splitPoints: SplitPoint[] = [];
  if (totalDist >= 1 && totalDist <= 50) {
    const step = totalDist <= 5 ? 1 : totalDist <= 10 ? 1 : totalDist <= 21.1 ? 2 : totalDist <= 30 ? 5 : 5;
    for (let d = step; d <= Math.ceil(totalDist); d += step) {
      splitPoints.push({ label: `${d} ${unit}`, distance: d });
    }
  }

  const fmtTime = (sec: number): string => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.round(sec % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Wristband style — key splits only
  const keySplits = splitPoints.filter(sp => {
    if (totalDist <= 5) return true;
    if (totalDist <= 10) return sp.distance % 1 === 0;
    if (totalDist <= 21.1) return sp.distance % 2 === 0;
    if (totalDist <= 42.2) return sp.distance % 5 === 0 || sp.distance === 13.1;
    return sp.distance % 10 === 0;
  });

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
        <div className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4 text-white">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Race Plan</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">{distStr}</p>
              <p className="text-[11px] opacity-80">Distance</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{timeStr}</p>
              <p className="text-[11px] opacity-80">Goal Time</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{paceStr}</p>
              <p className="text-[11px] opacity-80">Pace</p>
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
            {keySplits.map((sp, i) => {
              const sec = sp.distance * paceSec;
              return (
                <div key={`item-${i}`} className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <span className="text-xs font-semibold text-slate-700">{sp.label}</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{fmtTime(sec)}</span>
                </div>
              );
            })}
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
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{distStr} · {paceStr}</p>
                </div>
                <div className="space-y-1">
                  {keySplits.map((sp, i) => {
                    const sec = sp.distance * paceSec;
                    return (
                      <div key={`item-${i}`} className="flex justify-between items-center px-3 py-1.5 bg-white rounded border border-slate-100">
                        <span className="text-xs font-bold text-slate-600">{sp.label}</span>
                        <span className="text-xs font-bold text-slate-800 tabular-nums">{fmtTime(sec)}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between items-center px-3 py-1.5 bg-blue-500 rounded">
                    <span className="text-xs font-bold text-white">Finish</span>
                    <span className="text-xs font-bold text-white tabular-nums">{timeStr}</span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 text-center mt-3">Screenshot this for race day</p>
              </div>
            </div>
          </details>
        )}

        {/* Race strategy tips */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Pacing Tips</p>
          <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Aim for <strong>even or slightly negative splits</strong> — running the second half at the same pace or slightly faster than the first.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span><strong>Halfway check:</strong> At halfway, you should have used slightly less than 50% of your planned total time.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Your pace per mile/km should vary by no more than <strong>5–10 seconds</strong> in the first 80% of the race.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
