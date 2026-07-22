import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function PaymentFeesPanel({ values, results }: Props) {
  const fee = results.find((r) => r.id === 'fee')?.value ?? '';
  const netAmount = results.find((r) => r.id === 'netAmount')?.value ?? '';
  const feePercent = results.find((r) => r.id === 'feePercent')?.value ?? '';
  const feeFixed = results.find((r) => r.id === 'feeFixed')?.value ?? '';
  const platform = results.find((r) => r.id === 'platform')?.value ?? '';
  const reverseAmount = results.find((r) => r.id === 'reverseAmount')?.value ?? '';
  const reverseMode = values.reverseMode === 'yes';
  const invoiceAmount = values.invoiceAmount || '0';

  const isPositive = parseFloat(netAmount.replace(/[^0-9.-]/g, '')) >= 0;
  const isReverse = reverseMode;

  return (
    <div className="space-y-5">
      {/* Money Flow SVG */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <svg width="16" aria-hidden="true" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v12" />
            <path d="M9 9a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3" />
            <path d="M9 15h6" />
            <path d="M9 12h6" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Money Flow</span>
        </div>
        <div className="p-6">
          {/* Flow diagram */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Customer */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center">
                <svg width="28" aria-hidden="true" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 1 0-16 0" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-700 mt-2">Customer</span>
              <span className="text-[10px] text-slate-500">Pays ${invoiceAmount}</span>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center">
              <svg width="40" height="24" viewBox="0 0 40 24" fill="none" aria-hidden="true">
                <path d="M4 12h28M24 4l10 8-10 8" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Platform */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center">
                <svg width="28" aria-hidden="true" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M8 12h8" />
                  <path d="M10 9l2 3 2-3" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-700 mt-2">{platform}</span>
              <span className="text-[10px] text-red-500 font-semibold">Deducts {feePercent} + {feeFixed}</span>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center">
              <svg width="40" height="24" viewBox="0 0 40 24" fill="none" aria-hidden="true">
                <path d="M4 12h28M24 4l10 8-10 8" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* You / Your Bank */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center">
                <svg width="28" aria-hidden="true" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <rect x="3" y="8" width="18" height="12" rx="2" />
                  <path d="M3 12h18" />
                  <path d="M12 4v4" />
                  <path d="M8 4h8" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-700 mt-2">Your Bank</span>
              <span className="text-[10px] text-green-600 font-semibold">Receives {netAmount}</span>
            </div>
          </div>

          {/* Fee card */}
          <div className="rounded-xl bg-red-50 border border-red-200 p-5 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-600">Processing Fee</p>
                <p className="text-2xl font-black text-red-600 mt-1">{fee}</p>
                <p className="text-[10px] text-red-400 mt-0.5">
                  {feePercent} rate + {feeFixed} fixed fee
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg width="24" aria-hidden="true" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <circle cx="18" cy="18" r="2" />
                  <circle cx="6" cy="6" r="2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Net amount card */}
          <div className={`rounded-xl border p-5 ${isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">You Receive</p>
                <p className={`text-2xl font-black mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>{netAmount}</p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                <svg width="24" aria-hidden="true" height="24" viewBox="0 0 24 24" fill="none" stroke={isPositive ? '#16a34a' : '#dc2626'} strokeWidth="2">
                  <path d="M12 5v14" />
                  <path d="m19 12-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Reverse mode info */}
          {isReverse && (
            <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-start gap-3">
                <svg width="20" aria-hidden="true" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="mt-0.5 shrink-0">
                  <path d="M12 2a10 10 0 1 0 10 10h-4l4 4 4-4h-4a10 10 0 0 0-10-10z" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <div>
                  <p className="text-xs font-bold text-blue-700">
                    To receive <strong className="text-blue-800">${invoiceAmount}</strong>, invoice your customer for:
                  </p>
                  <p className="text-xl font-black text-blue-700 mt-1">{reverseAmount}</p>
                  <p className="text-[10px] text-blue-500 mt-0.5">
                    The extra covers the {feePercent} + {feeFixed} processing fee
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
