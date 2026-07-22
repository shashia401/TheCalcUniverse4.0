import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function ROASPanel({ results }: Props) {
  const roas = results.find(r => r.id === 'roas');
  const cpa = results.find(r => r.id === 'cpa');
  const profit = results.find(r => r.id === 'profitFromAds');
  const minROAS = results.find(r => r.id === 'minROAS');

  if (!roas) return null;

  const roasVal = parseNum(roas.value);
  const minVal = minROAS ? parseNum(minROAS.value) : 0;
  const barMax = Math.max(roasVal, minVal || 1) * 1.5;

  const bar = (label: string, val: number, color: string, unit: string) => {
    const pct = barMax > 0 ? (val / barMax) * 100 : 0;
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="text-xs font-semibold text-slate-600 w-28 flex-shrink-0">{label}</span>
        <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${color} transition-all flex items-center justify-end pr-1.5 ${pct < 10 ? 'min-w-[45px]' : ''}`} style={{ width: `${Math.max(pct, 5)}%` }}>
            <span className="text-[9px] font-bold text-white">{val.toFixed(2)}{unit}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">ROAS</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Return on Ad Spend</p>
          <p className={`text-3xl font-bold ${roas.color === 'positive' ? 'text-emerald-700' : roas.color === 'negative' ? 'text-red-600' : 'text-amber-600'}`}>
            {roas.value}
          </p>
        </div>
        {minVal > 0 && bar('Break-Even', minVal, 'bg-slate-400', 'x')}
        {bar('Actual ROAS', roasVal, roasVal >= 3 ? 'bg-emerald-500' : roasVal >= 1 ? 'bg-amber-500' : 'bg-red-500', 'x')}
        {cpa && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Cost per Acquisition</span>
            <span className="text-sm font-bold text-slate-700">{cpa.value}</span>
          </div>
        )}
        {profit && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Revenue Minus Ad Spend</span>
            <span className={`text-sm font-bold ${profit.color === 'positive' ? 'text-emerald-600' : 'text-red-600'}`}>{profit.value}</span>
          </div>
        )}
        {minROAS && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">{minROAS.label}</p>
            <p className={`text-sm font-bold ${minROAS.value.includes('Profitable') ? 'text-emerald-600' : 'text-red-600'}`}>
              {minROAS.value}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
