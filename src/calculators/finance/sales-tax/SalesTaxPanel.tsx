import { Receipt } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseVal(s: string): number {
  return parseFloat(s.replace(/[$%,+\s]/g, '').replace(/,/g, '')) || 0;
}

export default function SalesTaxPanel({ values, results }: Props) {
  const grossRes = results.find((r) => r.id === 'grossPrice');
  const netRes = results.find((r) => r.id === 'netPrice');
  const taxRes = results.find((r) => r.id === 'taxAmount');
  const rateRes = results.find((r) => r.id === 'rateUsed');
  const effRes = results.find((r) => r.id === 'effectiveRate');
  const mode = values.mode || 'add';

  if (!grossRes || !netRes || !taxRes) return null;

  const netPrice = parseVal(netRes.value);
  const taxAmount = parseVal(taxRes.value);
  const grossPrice = parseVal(grossRes.value);
  const rateVal = rateRes ? rateRes.value : '';

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const total = netPrice + taxAmount;
  const netPct = total > 0 ? (netPrice / total) * 100 : 0;
  const taxPct = total > 0 ? (taxAmount / total) * 100 : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Receipt size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          {mode === 'add' ? 'Add Tax' : 'Extract Tax'} — Breakdown
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="h-16 bg-slate-100 rounded-xl overflow-hidden flex">
          <div className="bg-emerald-500 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${netPct}%` }}>
            {netPct > 15 ? `Pre-Tax ${netPct.toFixed(0)}%` : ''}
          </div>
          <div className="bg-red-400 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${taxPct}%` }}>
            {taxPct > 10 ? `Tax ${taxPct.toFixed(0)}%` : ''}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
            <div>
              <p className="text-xs font-bold text-emerald-700">Pre-Tax Amount</p>
              <p className="text-[10px] text-emerald-500">The revenue you keep</p>
            </div>
            <span className="text-lg font-black text-emerald-700">{fmt(netPrice)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-red-50 rounded-xl border border-red-200">
            <div>
              <p className="text-xs font-bold text-red-600">Tax Amount</p>
              <p className="text-[10px] text-red-400">To remit to tax authority</p>
            </div>
            <span className="text-lg font-black text-red-600">{fmt(taxAmount)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-xl border border-blue-200">
            <div>
              <p className="text-xs font-bold text-blue-700">Total (with Tax)</p>
              <p className="text-[10px] text-blue-500">Amount collected</p>
            </div>
            <span className="text-lg font-black text-blue-700">{fmt(grossPrice)}</span>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Tax Rate</span>
            <span className="font-semibold text-slate-700">{rateVal}</span>
          </div>
          {effRes && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Tax as % of Total</span>
              <span className="font-semibold text-slate-700">{effRes.value}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
