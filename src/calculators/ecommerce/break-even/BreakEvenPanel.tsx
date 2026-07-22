import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function BreakEvenPanel({ results }: Props) {
  const units = results.find(r => r.id === 'breakEvenUnits');
  const revenue = results.find(r => r.id === 'breakEvenRevenue');
  const cm = results.find(r => r.id === 'contributionMargin');
  const fixed = results.find(r => r.id === 'fixedCostNote');

  if (!units || !revenue) return null;

  const revVal = parseNum(revenue.value);
  const cmVal = cm ? parseNum(cm.value) : 0;
  const fixedVal = fixed ? parseNum(fixed.value) : 0;
  const maxVal = Math.max(revVal, fixedVal);

  const bar = (label: string, val: number, max: number, color: string) => {
    const pct = max > 0 ? (val / max) * 100 : 0;
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
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Break-Even Analysis</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Break-Even</p>
          <p className="text-2xl font-bold text-emerald-700">{units.value}</p>
          <p className="text-xs text-emerald-500 mt-1">{revenue.value}</p>
        </div>
        {fixedVal > 0 && bar('Fixed Costs', fixedVal, maxVal, 'bg-red-500')}
        {cmVal > 0 && bar('Contribution Margin/Unit', cmVal, maxVal, 'bg-emerald-500')}
        {cm && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">{cm.label}</p>
            <p className="text-lg font-bold text-slate-700">{cm.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
