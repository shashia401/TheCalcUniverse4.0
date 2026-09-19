import { HELOCData, fmt } from './helocTypes';
import { pmt } from '../../../utils/financial';

export function AmortizationNote({ data }: { data: HELOCData }) {
  const { actualDraw, helocRate } = data;

  if (actualDraw <= 0) return null;

  const repayMonthlyRate = helocRate / 100 / 12;
  const repayN = 20 * 12;
  const repayPayment = pmt(actualDraw, repayMonthlyRate, repayN);

  const interestOnlyPayment = actualDraw * (helocRate / 100 / 12);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          HELOC Phases &mdash; Draw vs. Repayment
        </p>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-3 text-center">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1">
              Draw Period (Yrs 1&ndash;10)
            </p>
            <p className="text-lg font-black text-blue-700">${fmt(interestOnlyPayment)}/mo</p>
            <p className="text-[10px] text-blue-400 mt-0.5">Interest-only</p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-3 text-center">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">
              Repayment Phase (Yrs 11&ndash;30)
            </p>
            <p className="text-lg font-black text-amber-700">${fmt(repayPayment)}/mo</p>
            <p className="text-[10px] text-amber-500 mt-0.5">20-yr fully amortizing</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          After the 10-year draw period, your HELOC balance of{' '}
          <strong className="text-slate-700">${fmt(actualDraw)}</strong> converts to a 20-year
          repayment loan. Your payment jumps from{' '}
          <strong className="text-slate-700">${fmt(interestOnlyPayment)}/mo</strong> (interest
          only) to{' '}
          <strong className="text-amber-700">${fmt(repayPayment)}/mo</strong> (fully amortizing).
          Plan ahead for this payment increase.
        </p>
      </div>
    </div>
  );
}
