import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { computeCogs } from './cogsMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const money = (n: number) =>
  `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function COGSPanel({ values, results }: Props) {
  const cogsRow = results.find((r) => r.id === 'cogs');
  if (!cogsRow) return null;

  const begin = parseFloat(values.beginningInventory);
  const purchases = parseFloat(values.purchases);
  const ending = parseFloat(values.endingInventory);
  if (![begin, purchases, ending].every(Number.isFinite)) return null;
  const revenue = parseFloat(values.revenue);
  const f = computeCogs(begin, purchases, ending, revenue);
  const hasRevenue = f.grossProfit !== undefined;
  const maxBar = Math.max(f.goodsAvailable, f.cogs, hasRevenue ? revenue : 0, 1);

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
          <p className="text-xs font-bold uppercase tracking-wider text-red-700">Cost of Goods Sold</p>
          <p className="text-2xl font-bold text-red-700">{cogsRow.value}</p>
        </div>
        <HBarRow label="Goods Available" value={f.goodsAvailable} max={maxBar} display={money(f.goodsAvailable)} color="bg-blue-700" />
        <HBarRow label="COGS" value={f.cogs} max={maxBar} display={money(f.cogs)} color="bg-red-700" />
        {hasRevenue && (
          <>
            <HBarRow label="Revenue" value={revenue} max={maxBar} display={money(revenue)} color="bg-slate-700" />
            <HBarRow label="Gross Profit" value={Math.max(0, f.grossProfit!)} max={maxBar} display={money(f.grossProfit!)} color="bg-emerald-700" />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className={`rounded-xl border p-3 ${f.grossProfit! >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                <p className={`text-[10px] font-bold uppercase ${f.grossProfit! >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Gross Margin</p>
                <p className={`text-lg font-bold ${f.grossProfit! >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{f.grossMarginPct!.toFixed(2)}%</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold text-slate-600 uppercase">COGS %</p>
                <p className="text-lg font-bold text-slate-700">{f.cogsPct!.toFixed(2)}%</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
