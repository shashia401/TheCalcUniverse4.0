import { CalculatorResult } from '../../../types/calculator';
import { FEE_MAP, forwardFee, reverseInvoice } from './paymentMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const money = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PaymentFeesPanel({ values, results }: Props) {
  const amount = parseFloat(values.invoiceAmount);
  const info = FEE_MAP[values.platform || 'stripe-domestic'];
  if (!results.length || !info || !(amount > 0)) return null;

  const isReverse = values.reverseMode === 'yes';
  const p = isReverse ? reverseInvoice(amount, info) : forwardFee(amount, info);
  const ratePct = `${(info.rate * 100).toFixed(2)}%`;
  const fixed = money(info.fixed);

  return (
    <div className="space-y-5">
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
          <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center">
                <svg width="28" aria-hidden="true" height="28" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 1 0-16 0" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-700 mt-2">Customer</span>
              <span className="text-[10px] text-slate-600">Pays {money(p.charged)}</span>
            </div>

            <svg width="40" height="24" viewBox="0 0 40 24" fill="none" aria-hidden="true">
              <path d="M4 12h28M24 4l10 8-10 8" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center">
                <svg width="28" aria-hidden="true" height="28" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M8 12h8" />
                  <path d="M10 9l2 3 2-3" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-700 mt-2">{info.label}</span>
              <span className="text-[10px] text-red-700 font-semibold">Deducts {ratePct} + {fixed}</span>
            </div>

            <svg width="40" height="24" viewBox="0 0 40 24" fill="none" aria-hidden="true">
              <path d="M4 12h28M24 4l10 8-10 8" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center">
                <svg width="28" aria-hidden="true" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
                  <rect x="3" y="8" width="18" height="12" rx="2" />
                  <path d="M3 12h18" />
                  <path d="M12 4v4" />
                  <path d="M8 4h8" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-700 mt-2">Your Bank</span>
              <span className="text-[10px] text-green-700 font-semibold">Receives {money(p.net)}</span>
            </div>
          </div>

          <div className="rounded-xl bg-red-50 border border-red-200 p-5 mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-red-700">Processing Fee</p>
            <p className="text-2xl font-black text-red-700 mt-1">{money(p.fee)}</p>
            <p className="text-[10px] text-red-700 mt-0.5">
              {ratePct} rate + {fixed} fixed fee = {p.effectivePct.toFixed(2)}% of the amount charged
            </p>
          </div>

          <div className="rounded-xl border p-5 bg-green-50 border-green-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">You Receive</p>
            <p className="text-2xl font-black mt-1 text-green-700">{money(p.net)}</p>
          </div>

          {isReverse && (
            <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-4">
              <p className="text-xs font-bold text-blue-800">
                To receive <strong>{money(amount)}</strong>, invoice your customer for:
              </p>
              <p className="text-xl font-black text-blue-800 mt-1">{money(p.charged)}</p>
              <p className="text-[10px] text-blue-800 mt-0.5">
                The extra covers the {ratePct} + {fixed} processing fee
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
