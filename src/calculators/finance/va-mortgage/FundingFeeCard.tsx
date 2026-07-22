import { VAData, fmt, calcMonthlyPI } from './vaTypes';

export function FundingFeeCard({ data }: { data: VAData }) {
  const {
    fundingFeeExempt,
    fundingFeeAmount,
    fundingFeeRate,
    fundingFeePaidUpfront,
    baseLoanAmount,
    totalLoanAmount,
    principalAndInterest,
    interestRate,
    loanTerm,
  } = data;

  const piWithoutFee = calcMonthlyPI(baseLoanAmount, interestRate, loanTerm);
  const piDelta = principalAndInterest - piWithoutFee;

  if (fundingFeeExempt) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black">&#10003;</span>
          </div>
          <div>
            <p className="text-sm font-black text-emerald-800">EXEMPT &mdash; $0 Funding Fee</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Service-connected disability or DIC recipient
            </p>
          </div>
        </div>
        <p className="text-xs text-emerald-700 leading-relaxed">
          You are exempt from the VA Funding Fee. This saves you{' '}
          <strong>${fmt(baseLoanAmount * 0.0215)}</strong> compared to a first-time use with 0%
          down, or <strong>${fmt(baseLoanAmount * 0.033)}</strong> compared to subsequent use.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Funding Fee Breakdown
          </p>
        </div>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="px-4 py-3 text-slate-600 font-medium">Base Loan Amount</td>
              <td className="px-4 py-3 text-right font-bold text-slate-800">
                ${fmt(baseLoanAmount)}
              </td>
            </tr>
            <tr className="border-b border-slate-100 bg-amber-50/40">
              <td className="px-4 py-3 text-slate-600 font-medium pl-7">
                + VA Funding Fee ({(fundingFeeRate * 100).toFixed(2)}%)
              </td>
              <td className="px-4 py-3 text-right font-bold text-amber-700">
                +${fmt(fundingFeeAmount)}
              </td>
            </tr>
            <tr className="bg-slate-50">
              <td className="px-4 py-3 text-slate-700 font-black pl-7">
                = Total Loan Balance
              </td>
              <td className="px-4 py-3 text-right font-black text-slate-800">
                ${fmt(totalLoanAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {fundingFeePaidUpfront === 'upfront' ? (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-xs font-bold text-blue-700 mb-0.5">Paid at closing</p>
          <p className="text-xs text-blue-600">
            You are paying the funding fee in cash &mdash; this preserves your full loan balance at{' '}
            <strong>${fmt(baseLoanAmount)}</strong>.
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs font-bold text-amber-800 mb-0.5">Rolled into loan balance</p>
          <p className="text-xs text-amber-700">
            The funding fee is financed &mdash; your loan balance increases by{' '}
            <strong>${fmt(fundingFeeAmount)}</strong>, adding approximately{' '}
            <strong>${fmt(piDelta)}/month</strong> to your P&amp;I payment.
          </p>
        </div>
      )}
    </div>
  );
}
