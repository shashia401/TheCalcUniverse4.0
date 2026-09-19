import { Home } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { parseAmount as parseVal } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function HomeAffordabilityPanel({ values, results }: Props) {
  const maxPriceRes = results.find((r) => r.id === 'maxHomePrice');
  const loanRes = results.find((r) => r.id === 'maxLoanAmount');
  const totalMonthlyRes = results.find((r) => r.id === 'totalMonthlyHousing');
  const frontRes = results.find((r) => r.id === 'frontEndDTI');
  const backRes = results.find((r) => r.id === 'backEndDTI');
  const downPctRes = results.find((r) => r.id === 'downPaymentPct');

  if (!maxPriceRes || !loanRes || !totalMonthlyRes) return null;

  const maxPrice = parseVal(maxPriceRes.value);
  const loanAmount = parseVal(loanRes.value);
  const totalMonthly = parseVal(totalMonthlyRes.value);
  const downPct = downPctRes ? parseVal(downPctRes.value) : 0;

  const annualIncome = parseFloat(values.annualIncome) || 0;
  const downPayment = parseFloat(values.downPayment) || 0;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const bar = (v: number) => maxPrice > 0 ? Math.min(100, (v / maxPrice) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Home size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Affordability Breakdown
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Maximum Home Price</p>
          <p className="text-2xl font-black text-emerald-700">{fmt(maxPrice)}</p>
          <p className="text-xs text-emerald-500 mt-1">With {fmt(downPayment)} down ({downPct.toFixed(1)}%)</p>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-slate-600">Down Payment</span>
              <span className="font-semibold text-slate-700">{fmt(downPayment)}</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${bar(downPayment)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-slate-600">Loan Amount</span>
              <span className="font-semibold text-slate-700">{fmt(loanAmount)}</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${bar(loanAmount)}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Monthly Payment</p>
            <p className="text-lg font-black text-slate-700">{fmt(totalMonthly)}/mo</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Income Ratio</p>
            <p className="text-lg font-black text-blue-700">
              {annualIncome > 0 ? `${((totalMonthly * 12) / annualIncome * 100).toFixed(0)}%` : '—'}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
          <p className="text-xs font-bold text-slate-600 mb-2">Debt-to-Income Ratios</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Front-End (Housing)</span>
              <span className="font-semibold" style={{ color: frontRes?.color === 'positive' ? '#16a34a' : '#dc2626' }}>
                {frontRes?.value || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Back-End (Total Debt)</span>
              <span className="font-semibold" style={{ color: backRes?.color === 'positive' ? '#16a34a' : '#dc2626' }}>
                {backRes?.value || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
