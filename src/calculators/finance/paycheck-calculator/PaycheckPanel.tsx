import { Banknote } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import MiniDonut from '../../../components/calculator/MiniDonut';
import { computePaycheck, PAY_FREQUENCIES } from './paycheckMath';

export default function PaycheckPanel({ values }: { values: Record<string, string>; results: CalculatorResult[] }) {
  const c = computePaycheck(values);
  if (!c) return null;

  const freqInfo = PAY_FREQUENCIES[c.freq];
  const per = (n: number) => n / c.periods;
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
  const deductions = c.retirement + c.benefits;

  const segments = [
    { label: 'Net Pay (Take Home)', value: per(c.netAnnual), color: '#059669' },
    { label: 'Federal Income Tax', value: per(c.fed.totalTax), color: '#2563eb' },
    { label: 'FICA (SS + Medicare)', value: per(c.fica), color: '#d97706' },
    { label: 'State Income Tax', value: per(c.stateTax), color: '#dc2626' },
    ...(deductions > 0 ? [{ label: 'Pre-Tax Deductions', value: per(deductions), color: '#7c3aed' }] : []),
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Banknote size={16} className="text-slate-500" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Paycheck Breakdown &mdash; {freqInfo.label}</span>
      </div>
      <div className="p-6 space-y-6">
        <MiniDonut
          donut={{
            segments,
            centerLabel: `gross / ${c.freq}`,
            formatValue: fmt,
            caption: `Where each ${c.freq} gross paycheck goes`,
          }}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">Net Pay / {c.freq}</p>
            <p className="text-lg font-black text-emerald-700">{fmt(per(c.netAnnual))}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">Federal / {c.freq}</p>
            <p className="text-lg font-black text-blue-700">{fmt(per(c.fed.totalTax))}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">FICA / {c.freq}</p>
            <p className="text-lg font-black text-amber-700">{fmt(per(c.fica))}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-1">State / {c.freq}</p>
            <p className="text-lg font-black text-red-700">{fmt(per(c.stateTax))}</p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Annual Summary</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-[11px]">
            <div><span className="text-slate-600">Gross:</span> <strong className="text-slate-800">{fmt(c.grossAnnual)}</strong></div>
            <div><span className="text-slate-600">Federal:</span> <strong className="text-blue-700">{fmt(c.fed.totalTax)}</strong></div>
            <div><span className="text-slate-600">FICA:</span> <strong className="text-amber-700">{fmt(c.fica)}</strong></div>
            <div><span className="text-slate-600">State:</span> <strong className="text-red-700">{fmt(c.stateTax)}</strong></div>
            <div><span className="text-slate-600">Net:</span> <strong className="text-emerald-700">{fmt(c.netAnnual)}</strong></div>
          </div>
          <p className="text-[10px] text-slate-600 mt-1">
            Marg. rate: <strong>{(c.fed.marginalRate * 100).toFixed(0)}%</strong> &middot;
            Fed. effective: <strong>{((c.fed.totalTax / c.grossAnnual) * 100).toFixed(1)}%</strong> &middot;
            All-in effective: <strong>{((c.totalTax / c.grossAnnual) * 100).toFixed(1)}%</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
