import { Receipt } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { salesTaxFigures } from './salesTaxMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const fmt = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SalesTaxPanel({ values, results }: Props) {
  const mode = !values.mode || values.mode === 'add' ? 'add' : 'extract';
  const amount = parseFloat(values.amount);
  const rate = parseFloat(values.taxRate) / 100;
  if (!results.length || !(amount > 0) || !Number.isFinite(rate)) return null;

  // Same pure function as index.ts, so the bar and rows always match the result list.
  const { net: netPrice, tax: taxAmount, gross: grossPrice } = salesTaxFigures(mode, amount, rate);
  const netPct = grossPrice > 0 ? (netPrice / grossPrice) * 100 : 0;
  const taxPct = grossPrice > 0 ? (taxAmount / grossPrice) * 100 : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Receipt size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          {mode === 'add' ? 'Add Tax' : 'Extract Tax'} — Breakdown
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div
          className="h-16 bg-slate-100 rounded-xl overflow-hidden flex"
          role="img"
          aria-label={`Of ${fmt(grossPrice)}, ${netPct.toFixed(0)}% is the pre-tax price and ${taxPct.toFixed(1)}% is sales tax`}
        >
          <div className="bg-emerald-700 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${netPct}%` }}>
            {netPct > 15 ? `Pre-Tax ${netPct.toFixed(0)}%` : ''}
          </div>
          <div className="bg-red-700 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${taxPct}%` }}>
            {taxPct > 10 ? `Tax ${taxPct.toFixed(0)}%` : ''}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
            <div>
              <p className="text-xs font-bold text-emerald-800">Pre-Tax Amount</p>
              <p className="text-[10px] text-emerald-800">The revenue you keep</p>
            </div>
            <span className="text-lg font-black text-emerald-800">{fmt(netPrice)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-red-50 rounded-xl border border-red-200">
            <div>
              <p className="text-xs font-bold text-red-700">Tax Amount</p>
              <p className="text-[10px] text-red-700">To remit to tax authority</p>
            </div>
            <span className="text-lg font-black text-red-700">{fmt(taxAmount)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-xl border border-blue-200">
            <div>
              <p className="text-xs font-bold text-blue-800">Total (with Tax)</p>
              <p className="text-[10px] text-blue-800">Amount collected</p>
            </div>
            <span className="text-lg font-black text-blue-800">{fmt(grossPrice)}</span>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600">Tax Rate</span>
            <span className="font-semibold text-slate-700">{(rate * 100).toFixed(3)}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">Tax as % of Total</span>
            <span className="font-semibold text-slate-700">{taxPct.toFixed(3)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
