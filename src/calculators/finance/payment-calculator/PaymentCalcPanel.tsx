import { CreditCard } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseVal(s: string): number {
  return parseFloat(s.replace(/[$%,+\s-]/g, '').replace(/,/g, '')) || 0;
}

export default function PaymentCalcPanel({ values, results }: Props) {
  if (!results.length) return null;

  const solveFor = values.solveFor || 'payment';

  // For payment mode: show principal vs interest breakdown
  if (solveFor === 'payment') {
    const paymentRes = results.find((r) => r.id === 'payment');
    const interestRes = results.find((r) => r.id === 'totalInterest');
    const totalRes = results.find((r) => r.id === 'totalCost');

    if (!paymentRes || !interestRes) return null;

    const monthlyPayment = parseVal(paymentRes.value);
    const totalInterest = parseVal(interestRes.value);
    const totalCost = totalRes ? parseVal(totalRes.value) : 0;
    const principal = totalCost - totalInterest;
    const interestPct = results.find((r) => r.id === 'interestPct');

    const maxBar = Math.max(totalCost, 1);
    const bar = (v: number) => (v / maxBar) * 100;

    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <CreditCard size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Loan Cost Breakdown
          </span>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-blue-600">Principal</span>
                <span className="text-xs font-bold text-slate-700">
                  ${principal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${bar(principal)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-red-600">Total Interest</span>
                <span className="text-xs font-bold text-slate-700">
                  ${totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-red-500" style={{ width: `${bar(totalInterest)}%` }} />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Monthly Payment</p>
            <p className="text-lg font-black text-slate-700">
              ${monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // For loanAmount mode: show current vs +$50 extra
  if (solveFor === 'loanAmount') {
    const loanRes = results.find((r) => r.id === 'loanAmount');
    if (!loanRes) return null;
    const loanAmount = parseVal(loanRes.value);

    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <CreditCard size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Borrowing Power
          </span>
        </div>
        <div className="p-6 space-y-5">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">You Can Borrow</p>
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
          <CreditCard size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Payoff Timeline
          </span>
        </div>
        <div className="p-6 space-y-5">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Time to Pay Off</p>
            <p className="text-xl font-black text-blue-700">{termRes.value}</p>
          </div>
          {totalInterest > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Interest</p>
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
