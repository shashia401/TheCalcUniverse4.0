import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function MarginCalculatorPanel({ results }: Props) {
  const solved = results.find(r => r.id === 'solvedValue');
  const gp = results.find(r => r.id === 'grossProfit');
  const costR = results.find(r => r.id === 'costResult');
  const revenueR = results.find(r => r.id === 'revenueResult');
  const marginR = results.find(r => r.id === 'marginResult');
  const markupR = results.find(r => r.id === 'markupResult');

  if (!solved) return null;

  const costVal = costR ? parseNum(costR.value) : 0;
  const revVal = revenueR ? parseNum(revenueR.value) : 0;
  const gpVal = gp ? parseNum(gp.value) : 0;
  const maxVal = Math.max(costVal, revVal, gpVal);

  const bar = (label: string, val: number, color: string) => {
    const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="text-xs font-semibold text-slate-600 w-28 flex-shrink-0">{label}</span>
        <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${color} transition-all flex items-center justify-end pr-1.5 ${pct < 10 ? 'min-w-[45px]' : ''}`} style={{ width: `${Math.max(pct, 5)}%` }}>
            <span className="text-[9px] font-bold text-white">${val.toFixed(2)}</span>
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
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Margin vs Markup</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">{solved.label}</p>
          <p className="text-2xl font-bold text-emerald-700">{solved.value}</p>
        </div>
        {costVal > 0 && bar('Cost', costVal, 'bg-red-500')}
        {gpVal > 0 && bar('Gross Profit', gpVal, 'bg-emerald-500')}
        {revVal > 0 && bar('Revenue', revVal, 'bg-blue-500')}
        {marginR && markupR && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
              <p className="text-[10px] font-bold text-blue-600 uppercase">Margin</p>
              <p className="text-lg font-bold text-blue-700">{marginR.value}</p>
            </div>
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-center">
              <p className="text-[10px] font-bold text-purple-600 uppercase">Markup</p>
              <p className="text-lg font-bold text-purple-700">{markupR.value}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
