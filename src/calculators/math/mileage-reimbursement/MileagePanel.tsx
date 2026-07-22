import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getValue(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '';
}

export default function MileagePanel({ results }: Props) {
  const reimbursement = getValue(results, 'reimbursement');
  const mileageAmount = getValue(results, 'mileageAmount');
  const rateUsed = getValue(results, 'rateUsed');
  const additionalAmount = getValue(results, 'additionalAmount');
  const irsNote = getValue(results, 'irsNote');
  const taxSavings = getValue(results, 'taxSavings');

  if (!reimbursement || !mileageAmount) return null;

  const hasAdditional = additionalAmount.length > 0;
  const hasTaxSavings = taxSavings.length > 0;
  const year = results.find((x) => x.id === 'year')?.value || '2026';

  return (
    <div className="space-y-5">
      {/* Large Reimbursement Amount Card */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-md shadow-emerald-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-emerald-100">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            Total Reimbursement
          </span>
        </div>
        <div className="p-8 text-center">
          <p className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-emerald-700">
            {reimbursement}
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-sm text-emerald-600">
            <span>Rate: {rateUsed}</span>
            <span className="text-emerald-300">&middot;</span>
            <span>Year: {year}</span>
          </div>
        </div>
      </div>

      {/* Mileage Breakdown Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/60">
          <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Mileage Breakdown
          </span>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Mileage Amount</span>
            <span className="text-sm font-medium text-slate-700">{mileageAmount}</span>
          </div>
          {hasAdditional && (
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Additional Expenses</span>
              <span className="text-sm font-medium text-slate-700">{additionalAmount}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-bold text-slate-700">Total</span>
            <span className="text-lg font-bold text-emerald-700">{reimbursement}</span>
          </div>
        </div>
      </div>

      {/* IRS Rate Badge */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md shadow-blue-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-3 border-b border-blue-100">
          <svg aria-hidden="true" className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
            IRS Rate — {year}
          </span>
        </div>
        <div className="p-5">
          <p className="text-xs text-blue-800 leading-relaxed">
            {irsNote}
          </p>
        </div>
      </div>

      {/* Tax Savings Tip Card */}
      {hasTaxSavings && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm overflow-hidden">
          <div className="flex items-start gap-3 px-5 py-4">
            <svg aria-hidden="true" className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">
                Tax Savings
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                {taxSavings}
              </p>
              <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                Self-employed individuals can deduct this on Schedule C as a business expense.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Record Keeping Tip */}
      <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-sm overflow-hidden">
        <div className="flex items-start gap-3 px-5 py-4">
          <svg aria-hidden="true" className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-purple-700 mb-1">
              Record Keeping Tip
            </p>
            <p className="text-xs text-purple-800 leading-relaxed">
              The IRS requires you to keep a written log of your business miles. Record the date, purpose, starting odometer, ending odometer, and destination for each trip. A mileage tracking app can make this easier.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
