import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function BMRComparisonPanel({ results }: Props) {
  const mifflin = results.find(r => r.id === 'mifflinLine');
  const harris = results.find(r => r.id === 'harrisLine');
  const katch = results.find(r => r.id === 'katchLine');
  const primary = results.find(r => r.id === 'primaryBMR');

  if (!mifflin || !harris || !primary) return null;

  const parseNum = (s: string) => {
    const m = s.replace(/,/g, '').match(/(\d+)/);
    return m ? parseFloat(m[1]) : 0;
  };

  const mifflinVal = parseNum(mifflin.value);
  const harrisVal = parseNum(harris.value);
  const katchVal = katch ? parseNum(katch.value) : 0;
  const maxVal = Math.max(mifflinVal, harrisVal, katchVal || 0);

  const [hoverInfo, setHoverInfo] = useState<{ label: string; value: number } | null>(null);

  const bar = (label: string, val: number, color: string, isPrimary: boolean) => {
    const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
    const barColor = color === 'green' ? 'bg-emerald-500'
      : color === 'amber' ? 'bg-amber-500'
      : 'bg-blue-500';

    return (
      <div
        className={`flex items-center gap-3 py-2 ${isPrimary ? 'bg-blue-50/50 -mx-4 px-4 rounded-lg' : ''}`}
        onMouseEnter={() => setHoverInfo({ label, value: val })}
        onMouseLeave={() => setHoverInfo(null)}
      >
        <span className="text-xs font-semibold text-slate-600 w-32 flex-shrink-0">{label}</span>
        <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${barColor} transition-all flex items-center justify-end pr-1.5 ${pct < 15 ? 'min-w-[40px]' : ''}`} style={{ width: `${Math.max(pct, 5)}%` }}>
            <span className="text-[10px] font-bold text-white drop-shadow-sm">{val.toLocaleString()}</span>
          </div>
        </div>
        {isPrimary && (
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex-shrink-0">Selected</span>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">BMR Formula Comparison</span>
      </div>

      <div className="p-5 space-y-1">
        {bar('Mifflin-St Jeor', mifflinVal, 'green', primary.id === 'mifflinLine')}
        {bar('Harris-Benedict', harrisVal, 'amber', primary.id === 'harrisLine')}
        {katch && bar('Katch-McArdle', katchVal, 'blue', primary.id === 'katchLine')}

        {hoverInfo && (
          <div className="text-xs text-center text-slate-600 bg-slate-100 rounded-lg px-3 py-2 mt-2">
            <span className="font-semibold">{hoverInfo.label}</span>
            <span className="text-slate-400 mx-1">—</span>
            <span className="font-bold text-slate-800">{hoverInfo.value.toLocaleString()} kcal/day</span>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">What Do the Differences Mean?</p>
          <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span>
              <span><strong className="text-slate-700">Mifflin-St Jeor (1990):</strong> Most validated for the general population. Considered the most accurate for non-athletic adults.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span><strong className="text-slate-700">Harris-Benedict (revised 1984):</strong> Older formula that tends to overestimate by ~5% in most people. More accurate in older populations.</span>
            </li>
            {katch && (
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span><strong className="text-slate-700">Katch-McArdle (1996):</strong> Most accurate for lean athletes because it uses lean body mass. Requires accurate body fat %.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
