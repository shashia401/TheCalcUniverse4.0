import { useState, useMemo } from 'react';
import { TrendingDown } from 'lucide-react';
import { DownloadCsvButton } from '../../../utils/downloadCsv';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface YearRow {
  year: number;
  interestStd: number;
  principalStd: number;
  balanceStd: number;
  interestNew: number;
  principalNew: number;
  balanceNew: number;
  paidOff: boolean;
}

interface MonthRow {
  month: number;
  calYear: number;
  calMonth: number;
  interestStd: number;
  principalStd: number;
  balanceStd: number;
  interestNew: number;
  principalNew: number;
  balanceNew: number;
  paidOff: boolean;
}

function buildSchedules(
  loanAmount: number,
  monthlyRate: number,
  basePayment: number,
  totalMonths: number,
  extraMonthly: number,
  extraAnnual: number
): { yearly: YearRow[]; monthly: MonthRow[]; standardInterest: number; newInterest: number; monthsSaved: number } {
  const now = new Date();
  const startYear = now.getFullYear();
  const startMonth = now.getMonth() + 1;

  let balStd = loanAmount;
  let balNew = loanAmount;
  let newPaidOff = false;
  let newPayoffMonth = totalMonths;
  let stdInterest = 0;
  let newInterest = 0;

  const monthly: MonthRow[] = [];

  for (let i = 0; i < Math.min(totalMonths + 600, 3600); i++) {
    if (balStd <= 0 && (balNew <= 0 || newPaidOff)) break;

    const intStd = balStd > 0 ? balStd * monthlyRate : 0;
    const prinStd = balStd > 0 ? Math.min(basePayment - intStd, balStd) : 0;
    stdInterest += intStd;

    const intNew = balNew > 0 && !newPaidOff ? balNew * monthlyRate : 0;
    const extra = !newPaidOff && balNew > 0
      ? extraMonthly + (i > 0 && i % 12 === 0 ? extraAnnual : 0)
      : 0;
    const prinNew = balNew > 0 && !newPaidOff
      ? Math.min(basePayment - intNew + extra, balNew)
      : 0;
    newInterest += intNew;

    const calMonth = ((startMonth - 1 + i) % 12) + 1;
    const calYear = startYear + Math.floor((startMonth - 1 + i) / 12);

    const newBal = Math.max(0, balNew - prinNew);
    if (!newPaidOff && newBal === 0 && balNew > 0) {
      newPayoffMonth = i + 1;
      newPaidOff = true;
    }

    monthly.push({
      month: i + 1,
      calYear,
      calMonth,
      interestStd: intStd,
      principalStd: prinStd,
      balanceStd: Math.max(0, balStd - prinStd),
      interestNew: intNew,
      principalNew: prinNew,
      balanceNew: newBal,
      paidOff: newPaidOff && balNew === 0,
    });

    balStd = Math.max(0, balStd - prinStd);
    balNew = newBal;
  }

  const yearly: YearRow[] = [];
  for (let yr = 0; yr < Math.ceil(monthly.length / 12); yr++) {
    const slice = monthly.slice(yr * 12, yr * 12 + 12);
    const last = slice[slice.length - 1];
    yearly.push({
      year: yr + 1,
      interestStd: slice.reduce((s, r) => s + r.interestStd, 0),
      principalStd: slice.reduce((s, r) => s + r.principalStd, 0),
      balanceStd: last.balanceStd,
      interestNew: slice.reduce((s, r) => s + r.interestNew, 0),
      principalNew: slice.reduce((s, r) => s + r.principalNew, 0),
      balanceNew: last.balanceNew,
      paidOff: last.paidOff || last.balanceNew === 0,
    });
  }

  return {
    yearly,
    monthly,
    standardInterest: stdInterest,
    newInterest,
    monthsSaved: totalMonths - newPayoffMonth,
  };
}

interface Props {
  loanAmount: number;
  annualRate: number;
  totalMonths: number;
  extraMonthly: number;
  extraAnnual: number;
}

export default function AmortizationComparePanel({ loanAmount, annualRate, totalMonths, extraMonthly, extraAnnual }: Props) {
  const [view, setView] = useState<'annual' | 'monthly'>('annual');
  const [showAll, setShowAll] = useState(false);

  const monthlyRate = annualRate / 12;
  const basePayment = monthlyRate === 0
    ? loanAmount / totalMonths
    : (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) / (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const hasExtra = extraMonthly > 0 || extraAnnual > 0;

  const { yearly, monthly, standardInterest, newInterest, monthsSaved } = useMemo(
    () => buildSchedules(loanAmount, monthlyRate, basePayment, totalMonths, extraMonthly, extraAnnual),
    [loanAmount, monthlyRate, basePayment, totalMonths, extraMonthly, extraAnnual]
  );

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtD = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const timeSaved = () => {
    if (monthsSaved <= 0) return null;
    const y = Math.floor(monthsSaved / 12);
    const m = monthsSaved % 12;
    const parts = [];
    if (y > 0) parts.push(`${y} yr${y !== 1 ? 's' : ''}`);
    if (m > 0) parts.push(`${m} mo`);
    return parts.join(' ');
  };

  const displayedYearly = showAll ? yearly : yearly.slice(0, 10);
  const displayedMonthly = showAll ? monthly : monthly.slice(0, 24);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingDown size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Amortization Schedule {hasExtra ? '— Standard vs. Extra Payments' : ''}
        </span>
      </div>

      <div className="p-6 space-y-5">
        {hasExtra && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Standard Interest</p>
              <p className="text-base font-black text-red-500">${fmt(standardInterest)}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Interest Saved</p>
              <p className="text-base font-black text-emerald-700">${fmt(standardInterest - newInterest)}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Time Saved</p>
              <p className="text-base font-black text-blue-700">{timeSaved() ?? '—'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">New Interest</p>
              <p className="text-base font-black text-slate-800">${fmt(newInterest)}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
            <button type="button"
              onClick={() => { setView('annual'); setShowAll(false); }}
              className={`px-4 py-1.5 transition-colors ${view === 'annual' ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              Annual
            </button>
            <button type="button"
              onClick={() => { setView('monthly'); setShowAll(false); }}
              className={`px-4 py-1.5 transition-colors border-l border-slate-200 ${view === 'monthly' ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              Monthly
            </button>
          </div>
          <div className="flex items-center gap-3">
            <DownloadCsvButton
              filename="amortization-comparison.csv"
              headers={
                view === 'annual'
                  ? hasExtra
                    ? ['Year', 'Interest (Standard)', 'Principal (Standard)', 'Balance (Standard)', 'Interest (Extra)', 'Principal (Extra)', 'Balance (Extra)']
                    : ['Year', 'Interest', 'Principal', 'Balance']
                  : hasExtra
                    ? ['#', 'Date', 'Interest (Standard)', 'Principal (Standard)', 'Balance (Standard)', 'Balance (Extra)']
                    : ['#', 'Date', 'Interest', 'Principal', 'Balance']
              }
              rows={
                (view === 'annual' ? yearly : monthly).map((r) => {
                  if (view === 'annual') {
                    const row = r as typeof yearly[number];
                    return hasExtra
                      ? [row.year, row.interestStd.toFixed(2), row.principalStd.toFixed(2), row.balanceStd.toFixed(2), row.interestNew.toFixed(2), row.principalNew.toFixed(2), row.balanceNew.toFixed(2)]
                      : [row.year, row.interestStd.toFixed(2), row.principalStd.toFixed(2), row.balanceStd.toFixed(2)];
                  }
                  const row = r as typeof monthly[number];
                  const dateStr = `${MONTH_NAMES[row.calMonth - 1]} ${row.calYear}`;
                  return hasExtra
                    ? [row.month, dateStr, row.interestStd.toFixed(2), row.principalStd.toFixed(2), row.balanceStd.toFixed(2), row.balanceNew.toFixed(2)]
                    : [row.month, dateStr, row.interestStd.toFixed(2), row.principalStd.toFixed(2), row.balanceStd.toFixed(2)];
                })
              }
            />
            <span className="text-[10px] text-slate-500">
              {view === 'annual' ? `${yearly.length} years` : `${totalMonths} payments`}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          {view === 'annual' ? (
            <table className="w-full text-xs min-w-[540px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Year</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-orange-500 uppercase tracking-wider text-[10px]">Interest (Std)</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Balance (Std)</th>
                  {hasExtra && <>
                    <th scope="col" className="text-right px-3 py-2.5 font-bold text-emerald-500 uppercase tracking-wider text-[10px]">Interest (Extra)</th>
                    <th scope="col" className="text-right px-4 py-2.5 font-bold text-blue-500 uppercase tracking-wider text-[10px]">Balance (Extra)</th>
                  </>}
                  {!hasExtra && <th scope="col" className="text-right px-4 py-2.5 font-bold text-blue-500 uppercase tracking-wider text-[10px]">Balance</th>}
                </tr>
              </thead>
              <tbody>
                {displayedYearly.map((row, i) => (
                  <tr key={row.year} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-2.5 font-bold text-slate-800">Yr {row.year}</td>
                    <td className="px-3 py-2.5 text-right text-orange-600 font-semibold">${fmt(row.interestStd)}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500">{row.balanceStd < 1 ? '—' : `$${fmt(row.balanceStd)}`}</td>
                    {hasExtra && <>
                      <td className="px-3 py-2.5 text-right text-emerald-600 font-semibold">{row.paidOff ? '—' : `$${fmt(row.interestNew)}`}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-blue-600">{row.balanceNew < 1 || row.paidOff ? <span className="text-emerald-600 font-black">PAID OFF</span> : `$${fmt(row.balanceNew)}`}</td>
                    </>}
                    {!hasExtra && <td className="px-4 py-2.5 text-right font-bold text-blue-600">{row.balanceStd < 1 ? '—' : `$${fmt(row.balanceStd)}`}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs min-w-[540px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">#</th>
                  <th scope="col" className="text-left px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Date</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-orange-500 uppercase tracking-wider text-[10px]">Interest</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-blue-500 uppercase tracking-wider text-[10px]">Principal</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Balance (Std)</th>
                  {hasExtra && <th scope="col" className="text-right px-4 py-2.5 font-bold text-emerald-500 uppercase tracking-wider text-[10px]">Balance (Extra)</th>}
                </tr>
              </thead>
              <tbody>
                {displayedMonthly.map((row, i) => (
                  <tr key={`item-${i}`} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-2 font-semibold text-slate-500">{row.month}</td>
                    <td className="px-3 py-2 text-slate-500">{MONTH_NAMES[row.calMonth - 1]} {row.calYear}</td>
                    <td className="px-3 py-2 text-right text-orange-600 font-semibold">${fmtD(row.interestStd)}</td>
                    <td className="px-3 py-2 text-right text-blue-600 font-semibold">${fmtD(row.principalStd)}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{row.balanceStd < 1 ? '—' : `$${fmt(row.balanceStd)}`}</td>
                    {hasExtra && (
                      <td className="px-4 py-2 text-right font-bold text-emerald-700">
                        {row.balanceNew < 1 ? <span className="text-emerald-600 font-black text-[10px]">PAID OFF</span> : `$${fmt(row.balanceNew)}`}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {((view === 'annual' && yearly.length > 10) || (view === 'monthly' && monthly.length > 24)) && (
          <button type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-3 w-full py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
          >
            {showAll
              ? 'Show less'
              : view === 'annual'
              ? `Show all ${yearly.length} years`
              : `Show all ${totalMonths} months`}
          </button>
        )}
      </div>
    </div>
  );
}
