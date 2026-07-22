import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function COGSPanel({ results }: Props) {
  const cogs = results.find(r => r.id === 'cogs');
  const goodsAvailable = results.find(r => r.id === 'goodsAvailable');
  const grossProfit = results.find(r => r.id === 'grossProfit');
  const grossMargin = results.find(r => r.id === 'grossMargin');
  const cogsPct = results.find(r => r.id === 'cogsPct');

  if (!cogs) return null;

  const cogsVal = parseNum(cogs.value);
  const goodsVal = goodsAvailable ? parseNum(goodsAvailable.value) : 0;
  const gpVal = grossProfit ? parseNum(grossProfit.value) : 0;
  const maxVal = Math.max(cogsVal, goodsVal, gpVal);

  const bar = (label: string, val: number, color: string) => {
    const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="text-xs font-semibold text-slate-600 w-32 flex-shrink-0">{label}</span>
        <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${color} transition-all flex items-center justify-end pr-1.5 ${pct < 10 ? 'min-w-[45px]' : ''}`} style={{ width: `${Math.max(pct, 5)}%` }}>
            <span className="text-[9px] font-bold text-white">${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">COGS Breakdown</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-red-600">Cost of Goods Sold</p>
          <p className="text-2xl font-bold text-red-700">{cogs.value}</p>
        </div>
        {goodsVal > 0 && bar('Goods Available', goodsVal, 'bg-blue-500')}
        {gpVal > 0 && bar('Gross Profit', gpVal, 'bg-emerald-500')}
        {grossMargin && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[10px] font-bold text-emerald-700 uppercase">Gross Margin</p>
              <p className="text-lg font-bold text-emerald-700">{grossMargin.value}</p>
            </div>
            {cogsPct && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold text-slate-600 uppercase">COGS %</p>
                <p className="text-lg font-bold text-slate-700">{cogsPct.value}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
