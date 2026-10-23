import { CreditCard } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { parseAmount as parseVal } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}


export default function SolveForPanel({ values, results }: Props) {
  if (!results.length) return null;

  const solveFor = values.solveFor;

  // For loanAmount mode: show current vs +$50 extra
  if (solveFor === 'loanAmount') {
    const loanRes = results.find((r) => r.id === 'loanAmount');
    if (!loanRes) return null;
    const loanAmount = parseVal(loanRes.value);

    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <CreditCard size={16} className="text-slate-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Borrowing Power
          </span>
        </div>
        <div className="p-6 space-y-5">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">You Can Borrow</p>
            <p className="text-xl font-black text-blue-700">
              ${loanAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // For term mode: show time to payoff info
  if (solveFor === 'term') {
    const termRes = results.find((r) => r.id === 'term');
    const totalInterestRes = results.find((r) => r.id === 'totalInterest');
    if (!termRes) return null;

    const totalInterest = totalInterestRes ? parseVal(totalInterestRes.value) : 0;

    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <CreditCard size={16} className="text-slate-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Payoff Timeline
          </span>
        </div>
        <div className="p-6 space-y-5">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">Time to Pay Off</p>
            <p className="text-xl font-black text-blue-700">{termRes.value}</p>
          </div>
          {totalInterest > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Total Interest</p>
              <p className="text-lg font-black text-slate-700">
                ${totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
