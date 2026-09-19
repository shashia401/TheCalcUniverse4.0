import { CalculatorResult } from '../../../types/calculator';
import { getResultValue as getValue } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function TipPanel({ results }: Props) {
  const totalAmount = getValue(results, 'totalAmount');
  const tipAmount = getValue(results, 'tipAmount');
  const totalPerPerson = getValue(results, 'totalPerPerson');
  const tipPerPerson = getValue(results, 'tipPerPerson');
  const effectiveTipPercent = getValue(results, 'effectiveTipPercent');
  const splitInfo = getValue(results, 'splitInfo');
  const roundingApplied = getValue(results, 'roundingApplied');

  if (!totalAmount || !tipAmount) return null;

  const hasSplit = totalPerPerson.length > 0;
  const hasRounding = roundingApplied.length > 0;

  return (
    <div className="space-y-5">
      {/* Large Total Display */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-md shadow-emerald-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-emerald-100">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            You Pay
          </span>
        </div>
        <div className="p-8 text-center">
          <p className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-emerald-700">
            {totalAmount}
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-sm text-emerald-600">
            <span>Tip: {tipAmount}</span>
            {hasSplit && (
              <>
                <span className="text-emerald-300">&middot;</span>
                <span>Each: {totalPerPerson}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bill Breakdown Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/60">
          <svg
            className="w-4 h-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Bill Breakdown
          </span>
        </div>
        <div className="p-5 space-y-3">
          {/* Bill line */}
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Subtotal</span>
            <span className="text-sm font-medium text-slate-700">
              {(() => {
                const total = parseFloat(totalAmount.replace(/[$,]/g, ''));
                const tip = parseFloat(tipAmount.replace(/[$,]/g, ''));
                const sub = total - tip;
                const subStr = sub % 1 === 0 ? `$${sub.toFixed(0)}` : `$${sub.toFixed(2)}`;
                return subStr;
              })()}
            </span>
          </div>
          {/* Tip line */}
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Tip {effectiveTipPercent ? `(${effectiveTipPercent})` : ''}</span>
            <span className="text-sm font-medium text-emerald-600">{tipAmount}</span>
          </div>
          {/* Total line */}
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-bold text-slate-700">Total</span>
            <span className="text-lg font-bold text-emerald-700">{totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Per-Person Section */}
      {hasSplit && (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-md shadow-indigo-200/60 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-3 border-b border-indigo-100">
            <svg
              className="w-4 h-4 text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              Per Person
            </span>
            <span className="text-[10px] text-indigo-400 ml-auto font-medium">
              {splitInfo}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-0 divide-x divide-indigo-100">
            <div className="p-5 text-center">
              <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide mb-1">
                Each Pays
              </p>
              <p className="text-3xl font-black text-indigo-700">
                {totalPerPerson}
              </p>
            </div>
            <div className="p-5 text-center">
              <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide mb-1">
                Tip Each
              </p>
              <p className="text-3xl font-black text-indigo-700">
                {tipPerPerson}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rounding Applied */}
      {hasRounding && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm overflow-hidden">
          <div className="flex items-start gap-3 px-5 py-4">
            <svg
              className="w-5 h-5 text-amber-500 mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">
                Rounding Applied
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                {roundingApplied}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Satisfaction Guaranteed Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-slate-500 italic">
          Satisfaction guaranteed &mdash; calculated with precision
        </p>
      </div>
    </div>
  );
}
