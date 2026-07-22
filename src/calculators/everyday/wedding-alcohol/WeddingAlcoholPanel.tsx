import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function WeddingAlcoholPanel({ results }: Props) {
  const beerRow = results.find(r => r.id === 'beerTotal');
  const wineRow = results.find(r => r.id === 'wineBottles');
  const liquorRow = results.find(r => r.id === 'liquorBottles');
  const beerPct = results.find(r => r.id === 'beerPctDisplay');
  const winePct = results.find(r => r.id === 'winePctDisplay');
  const liquorPct = results.find(r => r.id === 'liquorPctDisplay');

  if (!beerRow && !wineRow && !liquorRow) return null;

  const beerVal = parseInt(beerRow?.value.replace(/,/g, '') || '0');
  const wineVal = parseInt(wineRow?.value.replace(/,/g, '') || '0');
  const liquorVal = parseInt(liquorRow?.value.replace(/,/g, '') || '0');
  const maxVal = Math.max(beerVal, wineVal, liquorVal, 1);

  const bar = (label: string, val: number, max: number, color: string, unit: string) => {
    const pct = max > 0 ? (val / max) * 100 : 0;
    return (
      <div className="flex items-center gap-2 py-1.5">
        <span className="text-[10px] font-semibold text-slate-500 w-16 flex-shrink-0">{label}</span>
        <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${color} transition-all flex items-center justify-end pr-1`} style={{ width: `${Math.max(pct, 3)}%` }}>
            <span className="text-[9px] font-bold text-white drop-shadow-sm">{val.toLocaleString()} {unit}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Drink Distribution</span>
      </div>
      <div className="p-5 space-y-1">
        {bar('Beer', beerVal, maxVal, 'bg-amber-500', 'cans')}
        {bar('Wine', wineVal, maxVal, 'bg-purple-500', 'bottles')}
        {bar('Liquor', liquorVal, maxVal, 'bg-blue-500', 'bottles')}

        {/* Distribution pie-style */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Drink Preference Split</p>
          <div className="h-5 bg-slate-200 rounded-full overflow-hidden flex">
            {beerPct && (
              <div className="h-full bg-amber-400 flex items-center justify-center text-[9px] font-bold text-white" style={{ width: `${beerPct.value}%` }}>
                {beerPct.value}
              </div>
            )}
            {winePct && (
              <div className="h-full bg-purple-400 flex items-center justify-center text-[9px] font-bold text-white" style={{ width: `${winePct.value}%` }}>
                {winePct.value}
              </div>
            )}
            {liquorPct && (
              <div className="h-full bg-blue-400 flex items-center justify-center text-[9px] font-bold text-white" style={{ width: `${liquorPct.value}%` }}>
                {liquorPct.value}
              </div>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-2 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Beer</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Wine</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Liquor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
