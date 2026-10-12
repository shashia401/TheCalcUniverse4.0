import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { leaseVsBuy } from './leaseVsBuyMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const usd = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function LeaseVsBuyPanel({ values, results }: Props) {
  const c = leaseVsBuy(values);
  const rec = results.find((r) => r.id === 'recommendation');
  if (!c || !rec) return null;

  const max = Math.max(c.totalLeaseCost, c.netBuyCost, 1);
  const leaseBest = !c.tie && c.leaseWins;
  const buyBest = !c.tie && !c.leaseWins;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Lease vs Buy</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className={`rounded-xl border p-4 text-center ${leaseBest ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Lease</p>
            <p className="text-xl font-bold text-slate-700">{usd(c.totalLeaseCost)}</p>
          </div>
          <div className={`rounded-xl border p-4 text-center ${buyBest ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Buy (net)</p>
            <p className="text-xl font-bold text-slate-700">{usd(c.netBuyCost)}</p>
          </div>
        </div>

        <HBarRow label="Lease Cost" value={c.totalLeaseCost} max={max} display={usd(c.totalLeaseCost)} color="bg-blue-700" labelWidth="w-28" height="h-5" className="py-1" />
        <HBarRow label="Net Buy Cost" value={Math.max(0, c.netBuyCost)} max={max} display={usd(c.netBuyCost)} color="bg-purple-700" labelWidth="w-28" height="h-5" className="py-1" />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs text-slate-600">Vehicle value after term</p>
            <p className="text-lg font-bold text-emerald-700">{usd(c.residualValue)}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs text-slate-600">Loan still owed</p>
            <p className="text-lg font-bold text-red-700">{usd(c.loanBalance)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-600">{rec.value}</p>
        </div>
      </div>
    </div>
  );
}
