import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { alcoholPlan } from './weddingMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function WeddingAlcoholPanel({ values, results }: Props) {
  // Same pure function index.ts uses; the panel never parses result strings (the old split bar read "40% of alcohol" as a width).
  const p = alcoholPlan(values);
  if (!p || !results.length) return null;
  const beer = Math.max(0, Math.ceil(p.beer - 1e-9));
  const wine = Math.max(0, Math.ceil(p.wineBottles - 1e-9));
  const liquor = Math.max(0, Math.ceil(p.liquorBottles - 1e-9));
  const max = Math.max(beer, wine, liquor, 1);
  const total = p.splitTotal > 0 ? p.splitTotal : 1;
  const segs = [
    { label: 'Beer', pct: p.beerPct, color: 'bg-amber-700' },
    { label: 'Wine', pct: p.winePct, color: 'bg-purple-700' },
    { label: 'Cocktails', pct: p.liquorPct, color: 'bg-blue-700' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Drink Distribution</span>
      </div>
      <div className="p-5 space-y-1">
        <HBarRow label="Beer" value={beer} max={max} display={`${beer.toLocaleString('en-US')} cans`} color="bg-amber-700" labelWidth="w-16" height="h-5" />
        <HBarRow label="Wine" value={wine} max={max} display={`${wine.toLocaleString('en-US')} bottles`} color="bg-purple-700" labelWidth="w-16" height="h-5" />
        <HBarRow label="Liquor" value={liquor} max={max} display={`${liquor.toLocaleString('en-US')} bottles`} color="bg-blue-700" labelWidth="w-16" height="h-5" />

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Drink Preference Split</p>
          <div className="h-5 bg-slate-200 rounded-full overflow-hidden flex" role="img" aria-label={segs.map((s) => `${s.label} ${s.pct}%`).join(', ')}>
            {segs.map((s) => (
              <div key={s.label} className={`h-full ${s.color} flex items-center justify-center text-[10px] font-bold text-white`} style={{ width: `${(s.pct / total) * 100}%` }}>
                {s.pct >= 10 ? `${s.pct}%` : ''}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4 mt-2 text-[10px] text-slate-700">
            {segs.map((s) => (
              <span key={s.label} className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${s.color} inline-block`} /> {s.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
