import { useMemo } from 'react';
import { Home } from 'lucide-react';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { simulatePayoff, payoffDateLabel } from './payoffSim';

interface Props {
  balance: number;
  annualRate: number;
  basePayment: number;
  extraMonthly: number;
  yearlyLumpSum: number;
  singleLumpSum: number;
}

const fmtK = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`);

function BarCompareChart({ stdInterest, newInterest }: { stdInterest: number; newInterest: number }) {
  const maxVal = stdInterest;
  const newPct = maxVal > 0 ? Math.min((newInterest / maxVal) * 100, 100) : 0;
  const saved = stdInterest - newInterest;
  const savedPct = maxVal > 0 ? (saved / maxVal) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-slate-600">Standard Schedule</span>
          <span className="font-black text-red-700">{fmtK(stdInterest)} total interest</span>
        </div>
        <div className="h-8 rounded-lg bg-red-100 overflow-hidden flex">
          <div className="h-full bg-red-400 rounded-lg" style={{ width: '100%' }} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-slate-600">Accelerated Schedule</span>
          <span className="font-black text-blue-700">{fmtK(newInterest)} total interest</span>
        </div>
        <div className="h-8 rounded-lg bg-slate-100 overflow-hidden flex gap-0">
          <div className="h-full bg-blue-500 rounded-l-lg" style={{ width: `${newPct}%` }} />
          <div className="h-full bg-emerald-400" style={{ width: `${savedPct}%` }} title={`Saved: ${fmtK(saved)}`} />
        </div>
        <div className="flex items-center gap-4 text-[10px] text-slate-600">
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500" /><span>Interest still paid</span></div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /><span>Interest saved</span></div>
        </div>
      </div>

      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 flex items-center justify-between">
        <span className="text-sm font-bold text-emerald-700">Total Interest Saved</span>
        <span className="text-xl font-black text-emerald-700">{fmtK(saved)}</span>
      </div>
    </div>
  );
}

export default function MortgagePayoffPanel({ balance, annualRate, basePayment, extraMonthly, yearlyLumpSum, singleLumpSum }: Props) {
  const monthlyRate = annualRate / 12;

  const std = useMemo(() => simulatePayoff(balance, monthlyRate, basePayment), [balance, basePayment, monthlyRate]);
  const acc = useMemo(
    () => simulatePayoff(balance, monthlyRate, basePayment, extraMonthly, yearlyLumpSum, singleLumpSum),
    [balance, monthlyRate, basePayment, extraMonthly, yearlyLumpSum, singleLumpSum],
  );

  const hasExtra = extraMonthly > 0 || yearlyLumpSum > 0 || singleLumpSum > 0;

  // Year 0 = today (after the up-front lump sum for the accelerated line), then each year-end balance.
  const stdSeries = useMemo(
    () => [{ x: 0, y: balance }, ...std.yearEndBalances.map((b, i) => ({ x: i + 1, y: b }))],
    [balance, std],
  );
  const accSeries = useMemo(
    () => [{ x: 0, y: Math.max(0, balance - singleLumpSum) }, ...acc.yearEndBalances.map((b, i) => ({ x: i + 1, y: b }))],
    [balance, singleLumpSum, acc],
  );

  if (std.neverPaysOff) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Home size={16} className="text-slate-500" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Mortgage Payoff Analysis</span>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Standard Payoff</p>
            <p className="text-lg font-black text-slate-700">{payoffDateLabel(std.months)}</p>
            <p className="text-xs text-slate-600 mt-0.5">{std.months} payments · {(std.months / 12).toFixed(1)} years</p>
          </div>
          {hasExtra && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 ring-2 ring-emerald-300">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">Debt-Free Date</p>
              <p className="text-lg font-black text-emerald-700">{payoffDateLabel(acc.months)}</p>
              <p className="text-xs text-emerald-700 mt-0.5">{acc.months} payments · {(acc.months / 12).toFixed(1)} years</p>
            </div>
          )}
        </div>

        {hasExtra && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Interest Comparison</p>
            <BarCompareChart stdInterest={std.totalInterest} newInterest={acc.totalInterest} />
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Remaining Balance Over Time</p>
          <SvgLineChart
            ariaLabel="Remaining mortgage balance by year, standard schedule versus accelerated schedule"
            series={[
              { name: 'Standard balance', points: stdSeries, color: '#dc2626', dashed: true },
              ...(hasExtra ? [{ name: 'Accelerated balance', points: accSeries, color: '#2563eb' }] : []),
            ]}
            xFormat={(n) => `Yr ${n}`}
            yFormat={fmtK}
          />
          <div className="flex gap-5 mt-2 px-1 text-[10px] text-slate-600">
            <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-red-600" />Standard balance</span>
            {hasExtra && <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-blue-600" />Accelerated balance</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
