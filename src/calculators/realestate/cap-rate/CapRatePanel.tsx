import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function CapRatePanel({ results }: Props) {
  const capRate = results.find(r => r.id === 'capRate');
  const noi = results.find(r => r.id === 'noi');
  const effectiveIncome = results.find(r => r.id === 'effectiveIncome');
  const totalExpenses = results.find(r => r.id === 'totalExpenses');
  const expenseRatio = results.find(r => r.id === 'expenseRatio');
  const grm = results.find(r => r.id === 'grm');
  const breakEven = results.find(r => r.id === 'breakEvenOccupancy');
  const formula = results.find(r => r.id === 'formula');

  if (!capRate) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Investment Metrics</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Cap Rate prominently */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
          <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wider">{capRate.label}</p>
          <p className="text-3xl font-bold text-blue-700">{capRate.value}</p>
        </div>

        {/* NOI / Expense bars */}
        <div className="space-y-2">
          {noi && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Net Operating Income</p>
              <p className="text-lg font-bold text-emerald-700">{noi.value}</p>
            </div>
          )}
          {totalExpenses && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-[9px] font-bold text-red-700 uppercase tracking-wider">Operating Expenses</p>
              <p className="text-lg font-bold text-red-700">{totalExpenses.value}</p>
            </div>
          )}
        </div>

        {/* Quick metrics grid */}
        <div className="grid grid-cols-2 gap-2">
          {effectiveIncome && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[9px] font-bold text-slate-500">Effective Income</p>
              <p className="text-xs font-bold text-slate-700">{effectiveIncome.value}</p>
            </div>
          )}
          {expenseRatio && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[9px] font-bold text-slate-500">Expense Ratio</p>
              <p className="text-xs font-bold text-slate-700">{expenseRatio.value}</p>
            </div>
          )}
          {grm && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[9px] font-bold text-slate-500">GRM</p>
              <p className="text-xs font-bold text-slate-700">{grm.value}</p>
            </div>
          )}
          {breakEven && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[9px] font-bold text-slate-500">Break-Even</p>
              <p className="text-xs font-bold text-slate-700">{breakEven.value}</p>
            </div>
          )}
        </div>

        {/* Formula */}
        {formula && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] text-slate-500">{formula.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
