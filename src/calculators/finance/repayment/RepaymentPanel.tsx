import { useState, useMemo } from 'react';
import { TrendingDown, Download } from 'lucide-react';
import { downloadCsv } from '../../../utils/downloadCsv';

interface MonthlyRow {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
  year: number;
}

interface Props {
  loanAmount: number;
  annualRate: number;
  years: number;
  monthlyPayment: number;
  totalInterest: number;
  extraPayment: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildSchedule(
  principal: number,
  monthlyRate: number,
  monthlyPayment: number,
  maxMonths: number,
  extraPayment: number
): MonthlyRow[] {
  const rows: MonthlyRow[] = [];
  let balance = principal;
  const totalPmt = monthlyPayment + extraPayment;

  for (let i = 1; i <= maxMonths + 600; i++) {
    if (balance <= 0.005) break;
    const interest = balance * monthlyRate;
    const principalPaid = Math.min(totalPmt - interest, balance + interest);
    if (principalPaid <= 0) break;
    balance = Math.max(0, balance + interest - totalPmt);
    rows.push({
      month: i,
      payment: totalPmt,
      interest,
      principal: principalPaid,
      balance,
      year: Math.ceil(i / 12),
    });
  }

  return rows;
}

function handleDownloadCSV(rows: MonthlyRow[], loanAmount: number) {
  const totals = rows.reduce(
    (acc, r) => ({ payment: acc.payment + r.payment, interest: acc.interest + r.interest, principal: acc.principal + r.principal }),
    { payment: 0, interest: 0, principal: 0 }
  );
  downloadCsv(
    `amortization-schedule-$${loanAmount.toFixed(0)}.csv`,
    ['Payment #', 'Payment Amount', 'Interest Paid', 'Principal Paid', 'Remaining Balance'],
    rows.map((r) => [r.month, r.payment.toFixed(2), r.interest.toFixed(2), r.principal.toFixed(2), r.balance.toFixed(2)]),
    ['TOTAL', '', totals.interest.toFixed(2), totals.principal.toFixed(2), '']
  );
}

export default function RepaymentPanel({ loanAmount, annualRate, years, monthlyPayment, totalInterest, extraPayment }: Props) {
  const [view, setView] = useState<'annual' | 'monthly'>('annual');
  const [showAll, setShowAll] = useState(false);

  const monthlyRate = annualRate / 12;
  const maxMonths = Math.round(years * 12);

  const schedule = useMemo(
    () => buildSchedule(loanAmount, monthlyRate, monthlyPayment, maxMonths, extraPayment),
    [loanAmount, monthlyRate, monthlyPayment, maxMonths, extraPayment]
  );

  const yearly = useMemo(() => {
    const map = new Map<number, MonthlyRow[]>();
    for (const r of schedule) {
      if (!map.has(r.year)) map.set(r.year, []);
      map.get(r.year)!.push(r);
    }
    return Array.from(map.entries()).map(([year, rows]) => ({
      year,
      startBalance: rows[0].balance + rows[0].principal,
      interest: rows.reduce((s, r) => s + r.interest, 0),
      principal: rows.reduce((s, r) => s + r.principal, 0),
      endBalance: rows[rows.length - 1].balance,
      dateRange: `${MONTH_NAMES[(((year - 1) * 12) % 12)]} ${new Date().getFullYear() + year - 1} – ${MONTH_NAMES[((year * 12 - 1) % 12)]} ${new Date().getFullYear() + year - 1}`,
    }));
  }, [schedule]);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtInt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  if (schedule.length === 0) return null;

  const displayedYearly = showAll ? yearly : yearly.slice(0, 10);
  const displayedMonthly = showAll ? schedule : schedule.slice(0, 24);
  const usingExtra = extraPayment > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden print:shadow-none">
      <div className="flex items-center justify-between gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <TrendingDown size={16} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
            {usingExtra ? 'Amortization Schedule (With Extra Payment)' : 'Amortization Schedule'}
          </span>
        </div>
        <button type="button"
          onClick={() => handleDownloadCSV(schedule, loanAmount)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <Download size={12} />
          Download CSV
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary comparison cards */}
        {usingExtra && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Std. Monthly</p>
              <p className="text-lg font-black text-blue-700">${fmt(monthlyPayment)}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">With Extra</p>
              <p className="text-lg font-black text-emerald-700">${fmt(monthlyPayment + extraPayment)}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Std. Interest</p>
              <p className="text-lg font-black text-amber-700">${fmtInt(totalInterest)}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">New Interest</p>
              <p className="text-lg font-black text-emerald-700">
                ${fmtInt(schedule.reduce((s, r) => s + r.interest, 0))}
              </p>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
            <button type="button"
              onClick={() => { setView('annual'); setShowAll(false); }}
              className={`px-4 py-1.5 transition-colors ${
                view === 'annual' ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              Annual
            </button>
            <button type="button"
              onClick={() => { setView('monthly'); setShowAll(false); }}
              className={`px-4 py-1.5 transition-colors border-l border-slate-200 ${
                view === 'monthly' ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              Monthly
            </button>
          </div>
          <span className="text-[10px] text-slate-500">
            {view === 'annual' ? `${yearly.length} years` : `${schedule.length} payments`}
          </span>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          {view === 'annual' ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Year</th>
                  <th scope="col" className="text-left px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] hidden sm:table-cell">Period</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-orange-500 uppercase tracking-wider text-[10px]">Interest</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-blue-500 uppercase tracking-wider text-[10px]">Principal</th>
                  <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Balance</th>
                </tr>
              </thead>
              <tbody>
                {displayedYearly.map((row, i) => (
                  <tr
                    key={row.year}
                    className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    <td className="px-4 py-2.5 font-bold text-slate-800">{row.year}</td>
                    <td className="px-3 py-2.5 text-slate-500 hidden sm:table-cell">{row.dateRange}</td>
                    <td className="px-3 py-2.5 text-right text-orange-600 font-semibold">${fmt(row.interest)}</td>
                    <td className="px-3 py-2.5 text-right text-blue-600 font-semibold">${fmt(row.principal)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-700">
                      {row.endBalance < 1 ? '—' : `$${fmt(row.endBalance)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">#</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-orange-500 uppercase tracking-wider text-[10px]">Interest</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-blue-500 uppercase tracking-wider text-[10px]">Principal</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-emerald-500 uppercase tracking-wider text-[10px]">Payment</th>
                  <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Balance</th>
                </tr>
              </thead>
              <tbody>
                {displayedMonthly.map((row, i) => (
                  <tr
                    key={row.month}
                    className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    <td className="px-4 py-2 font-semibold text-slate-500">{row.month}</td>
                    <td className="px-3 py-2 text-right text-orange-600 font-semibold">${fmt(row.interest)}</td>
                    <td className="px-3 py-2 text-right text-blue-600 font-semibold">${fmt(row.principal)}</td>
                    <td className="px-3 py-2 text-right text-emerald-600 font-semibold">${fmt(row.payment)}</td>
                    <td className="px-4 py-2 text-right font-bold text-slate-700">
                      {row.balance < 1 ? '—' : `$${fmt(row.balance)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Show more/less toggle */}
        {((view === 'annual' && yearly.length > 10) || (view === 'monthly' && schedule.length > 24)) && (
          <button type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-3 w-full py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
          >
            {showAll
              ? 'Show less'
              : view === 'annual'
              ? `Show all ${yearly.length} years`
              : `Show all ${schedule.length} payments`}
          </button>
        )}

        {/* Payment #1 vs Payment #N comparison */}
        {schedule.length > 1 && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">How Each Payment Is Split</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[0, Math.min(schedule.length - 1, 48)].map((idx, arrIdx) => {
                const row = schedule[0]; // first payment is always same
                const targetRow = schedule[idx];
                if (!targetRow) return null;
                const interestPct = (targetRow.interest / targetRow.payment) * 100;
                const principalPct = (targetRow.principal / targetRow.payment) * 100;
                // stable — two-element array [0, N], arrIdx is always 0 or 1
                return (
                  <div key={arrIdx} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      {idx === 0 ? 'Payment #1' : `Payment #${idx + 1}`} — {idx === 0 ? `Month ${row.month}` : `Month ${targetRow.month}`}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-4 rounded-full bg-slate-100 overflow-hidden flex">
                          <div
                            className="bg-orange-400 transition-all"
                            style={{ width: `${interestPct}%` }}
                          />
                          <div
                            className="bg-blue-500 transition-all"
                            style={{ width: `${principalPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-sm bg-orange-400" />
                            <span className="text-[10px] text-slate-500">Interest ${fmt(targetRow.interest)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-sm bg-blue-500" />
                            <span className="text-[10px] text-slate-500">Principal ${fmt(targetRow.principal)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-black text-slate-700">${fmt(targetRow.payment)}</span>
                        <p className="text-[9px] text-slate-500">total</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Balance chart */}
        {yearly.length > 1 && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Balance Over Time</p>
            <BalanceChart rows={yearly} />
          </div>
        )}
      </div>
    </div>
  );
}

function BalanceChart({ rows }: { rows: { year: number; startBalance: number; endBalance: number }[] }) {
  const maxBalance = rows[0]?.startBalance ?? 0;
  if (maxBalance === 0) return null;

  const width = 520;
  const height = 160;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const years = rows.length;

  const linePath = rows.map((r, i) => {
    const x = padL + (i / (years - 1 || 1)) * chartW;
    const y = padT + (1 - r.startBalance / maxBalance) * chartH;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  const areaPath = linePath + ` L ${(padL + chartW).toFixed(1)} ${(padT + chartH).toFixed(1)} L ${padL.toFixed(1)} ${(padT + chartH).toFixed(1)} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const fmtY = (v: number) => {
    const n = v * maxBalance;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const xLabels: number[] = [0];
  const step = years <= 15 ? 5 : 10;
  for (let y = step; y <= years; y += step) xLabels.push(y);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px', maxWidth: '100%' }} role="img" aria-label="Loan repayment chart">
        {gridLines.map((g) => {
          const y = padT + (1 - g) * chartH;
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">{fmtY(g)}</text>
            </g>
          );
        })}
        {xLabels.map((yr) => {
          const x = padL + (yr / (years || 1)) * chartW;
          return (
            <g key={yr}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={x} y={padT + chartH + 10} textAnchor="middle" fontSize={9} fill="#94a3b8">{yr}</text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#repayGrad)" />
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" />
        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
        <defs>
          <linearGradient id="repayGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <text x={padL + chartW / 2} y={height - 2} textAnchor="middle" fontSize={9} fill="#94a3b8">Year</text>
      </svg>
    </div>
  );
}
