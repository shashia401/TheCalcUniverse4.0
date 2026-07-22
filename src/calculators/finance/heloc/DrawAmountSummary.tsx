import { HELOCData, fmt } from './helocTypes';

export function DrawAmountSummary({ data }: { data: HELOCData }) {
  const { drawAmount, maxBorrowable, actualDraw, monthlyInterestOnDraw, monthlyInterestOnMax, helocRate } = data;

  if (!drawAmount || drawAmount <= 0) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-5 text-center">
        <p className="text-sm font-semibold text-slate-500 mb-1">
          Enter a draw amount above to see your specific payment
        </p>
        <p className="text-xs text-slate-500">
          At the full line of{' '}
          <strong className="text-slate-600">${fmt(maxBorrowable)}</strong>, your monthly
          interest-only payment would be{' '}
          <strong className="text-slate-700">${fmt(monthlyInterestOnMax)}</strong>.
        </p>
      </div>
    );
  }

  const drawPct = maxBorrowable > 0 ? (actualDraw / maxBorrowable) * 100 : 0;
  const annualCost = monthlyInterestOnDraw * 12;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-slate-200">
          <div className="px-4 py-4 text-center">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">
              Your Draw
            </p>
            <p className="text-xl font-black text-blue-600">${fmt(actualDraw)}</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">
              Available Line
            </p>
            <p className="text-xl font-black text-slate-700">${fmt(maxBorrowable)}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span>Drawn: {drawPct.toFixed(1)}% of available</span>
          <span>Remaining: ${fmt(maxBorrowable - actualDraw)}</span>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.min(drawPct, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-center">
          <p className="text-[10px] text-slate-500 font-semibold mb-1">Monthly Interest</p>
          <p className="text-base font-black text-amber-600">${fmt(monthlyInterestOnDraw)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-center">
          <p className="text-[10px] text-slate-500 font-semibold mb-1">Annual Interest</p>
          <p className="text-base font-black text-red-500">${fmt(annualCost)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-center">
          <p className="text-[10px] text-slate-500 font-semibold mb-1">HELOC Rate</p>
          <p className="text-base font-black text-slate-700">{helocRate.toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
}
