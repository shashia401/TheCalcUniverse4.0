import { Building } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { parseAmount as parseVal } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function NYMortgagePanel({ results }: Props) {
  if (!results.length) return null;

  const nyDataRes = results.find((r) => r.id === '_nyData');
  if (!nyDataRes) return null;

  let nyData: { loanAmount: number; downPct: string; hasPmi: boolean; monthlyTax: number; term: number };
  try {
    nyData = JSON.parse(nyDataRes.value);
  } catch {
    return null;
  }

  const monthlyPaymentRes = results.find((r) => r.id === 'monthlyPayment');
  const totalMonthlyRes = results.find((r) => r.id === 'totalMonthly');
  const totalInterestRes = results.find((r) => r.id === 'totalInterest');
  const totalCostRes = results.find((r) => r.id === 'totalCost');

  const basePayment = monthlyPaymentRes ? parseVal(monthlyPaymentRes.value) : 0;
  const totalMonthly = totalMonthlyRes ? parseVal(totalMonthlyRes.value) : 0;
  const monthlyPmi = nyData.hasPmi ? nyData.loanAmount * 0.005 / 12 : 0;
  const pmiComponent = nyData.hasPmi ? monthlyPmi : 0;
  const taxComponent = nyData.monthlyTax;
  const pAndI = basePayment;

  const maxBar = Math.max(totalMonthly, 1);
  const bar = (v: number) => (v / maxBar) * 100;

  const totalInterest = totalInterestRes ? parseVal(totalInterestRes.value) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Building size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Monthly Payment Breakdown
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-blue-600">Principal & Interest</span>
              <span className="text-xs font-bold text-slate-700">
                ${pAndI.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${bar(pAndI)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-600">Property Tax</span>
              <span className="text-xs font-bold text-slate-700">
                ${taxComponent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${bar(taxComponent)}%` }} />
            </div>
          </div>
          {nyData.hasPmi && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-red-600">PMI</span>
                <span className="text-xs font-bold text-slate-700">
                  ${pmiComponent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-red-500" style={{ width: `${bar(pmiComponent)}%` }} />
              </div>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Total Monthly</span>
              <span className="text-xs font-bold text-slate-800">
                ${totalMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Down Payment</p>
            <p className="text-lg font-black text-slate-700">{nyData.downPct}%</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Interest</p>
            <p className="text-lg font-black text-slate-700">
              ${totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-3">
          <p className="text-xs font-bold text-blue-700 mb-1">New York Specific</p>
          <p className="text-[11px] text-blue-600 leading-relaxed">
            NY property tax averages ~1.6% (varies by county). NY also has state income tax (4-10.9%).
            {' '}{nyData.hasPmi && 'Your down payment is under 20% — PMI applies.'}
            STAR program offers school tax relief for homeowners.
          </p>
        </div>
      </div>
    </div>
  );
}
