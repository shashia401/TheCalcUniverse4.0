import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { autoLoan } from './autoLoanMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const usd = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function AutoLoanPanel({ values, results }: Props) {
  const m = autoLoan(values);
  if (!m || m.loanAmount <= 0 || !results.some((r) => r.id === 'monthlyPayment')) return null;

  const max = Math.max(m.outTheDoor, m.loanAmount, m.totalInterest, m.totalCost);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Loan Breakdown</span>
      </div>
      <div className="p-5 space-y-2">
        <HBarRow label="Out-the-Door Price" value={m.outTheDoor} max={max} display={usd(m.outTheDoor)} color="bg-blue-700" labelWidth="w-36" />
        <HBarRow label="Amount Financed" value={m.loanAmount} max={max} display={usd(m.loanAmount)} color="bg-emerald-700" labelWidth="w-36" />
        {m.totalInterest > 0 && <HBarRow label="Total Interest" value={m.totalInterest} max={max} display={usd(m.totalInterest)} color="bg-red-700" labelWidth="w-36" />}
        <HBarRow label="Total Cost" value={m.totalCost} max={max} display={usd(m.totalCost)} color="bg-slate-700" labelWidth="w-36" />
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-600">Monthly Payment</p>
          <p className="text-lg font-bold text-slate-700">${m.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>
    </div>
  );
}
