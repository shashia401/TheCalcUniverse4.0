import { Building2 } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { useState } from 'react';

interface AmortRow {
  month: number;
  beginningBalance: number;
  payment: number;
  interest: number;
  principal: number;
  endingBalance: number;
}

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function formatCurrency(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getDSCRStatus(dscr: number): {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  fillClass: string;
  interpretation: string;
} {
  if (dscr >= 1.5) {
    return {
      label: 'Strong',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-700',
      borderClass: 'border-emerald-200',
      fillClass: 'fill-emerald-500',
      interpretation: 'Most lenders will approve. Excellent debt service capacity.',
    };
  }
  if (dscr >= 1.25) {
    return {
      label: 'Good',
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-700',
      borderClass: 'border-blue-200',
      fillClass: 'fill-blue-500',
      interpretation: 'Likely to be approved by most lenders. Meets standard requirements.',
    };
  }
  if (dscr >= 1.0) {
    return {
      label: 'Marginal',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
      borderClass: 'border-amber-200',
      fillClass: 'fill-amber-500',
      interpretation: 'May face stricter terms, additional collateral requirements, or higher rates.',
    };
  }
  return {
    label: 'Insufficient',
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    borderClass: 'border-red-200',
    fillClass: 'fill-red-500',
    interpretation: 'Loan payments exceed net operating income. High denial risk. Consider reducing loan amount or increasing income.',
  };
}

interface GaugeProps {
  dscr: number;
}

function DSCRGauge({ dscr }: GaugeProps) {
  // Gauge arc: 0.0 at left, 2.0+ at right. Clamp display at 2.0.
  const clampedDscr = Math.min(dscr, 2.0);
  const pct = clampedDscr / 2.0;

  // SVG arc parameters
  const cx = 100;
  const cy = 90;
  const r = 70;
  const totalAngle = Math.PI; // 180 degrees

  const sweepAngle = totalAngle * pct;
  const needleAngle = Math.PI - sweepAngle;

  const arcX = (angle: number) => cx + r * Math.cos(angle);
  const arcY = (angle: number) => cy - r * Math.sin(angle);

  // Background arc segments (zones)
  function arcPath(startPct: number, endPct: number): string {
    const a1 = Math.PI - totalAngle * startPct;
    const a2 = Math.PI - totalAngle * endPct;
    const x1 = arcX(a1);
    const y1 = arcY(a1);
    const x2 = arcX(a2);
    const y2 = arcY(a2);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  }

  // Needle
  const needleX = cx + (r - 8) * Math.cos(needleAngle);
  const needleY = cy - (r - 8) * Math.sin(needleAngle);

  return (
    <svg width={200} height={110} viewBox="0 0 200 110" className="block mx-auto" role="img" aria-label="DSCR gauge">
      {/* Zone: red 0–0.5 */}
      <path d={arcPath(0, 0.25)} fill="none" stroke="#fca5a5" strokeWidth={14} />
      {/* Zone: amber 0.5–0.625 */}
      <path d={arcPath(0.25, 0.5)} fill="none" stroke="#fcd34d" strokeWidth={14} />
      {/* Zone: blue 0.625–0.75 */}
      <path d={arcPath(0.5, 0.75)} fill="none" stroke="#93c5fd" strokeWidth={14} />
      {/* Zone: emerald 0.75–1.0 */}
      <path d={arcPath(0.75, 1.0)} fill="none" stroke="#6ee7b7" strokeWidth={14} />

      {/* Zone labels */}
      <text x={14} y={98} fontSize={7} fill="#ef4444" fontWeight="700">0</text>
      <text x={52} y={42} fontSize={7} fill="#f59e0b" fontWeight="700">1.0</text>
      <text x={95} y={20} fontSize={7} fill="#3b82f6" fontWeight="700">1.25</text>
      <text x={145} y={42} fontSize={7} fill="#10b981" fontWeight="700">1.5</text>
      <text x={182} y={98} fontSize={7} fill="#10b981" fontWeight="700">2+</text>

      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke="#334155"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={5} fill="#334155" />

      {/* DSCR value */}
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize={15} fontWeight="900" className="fill-slate-900 dark:fill-slate-100">
        {dscr.toFixed(2)}
      </text>
      <text x={cx} y={cy + 32} textAnchor="middle" fontSize={7} className="fill-slate-400 dark:fill-slate-500" fontWeight="600" letterSpacing="0.05em">
        DSCR
      </text>
    </svg>
  );
}

export default function BusinessLoanPanel({ values, results }: Props) {
  const [showAllMonths, setShowAllMonths] = useState(false);

  const amortResult = results.find((r) => r.id === '_amortization');
  const dscrResult = results.find((r) => r.id === 'dscrResult');
  const monthlyPaymentResult = results.find((r) => r.id === 'monthlyPayment');
  const totalInterestResult = results.find((r) => r.id === 'totalInterest');
  const originationFeeResult = results.find((r) => r.id === 'originationFeeResult');
  const actualCashResult = results.find((r) => r.id === 'actualCashReceived');

  let schedule: AmortRow[] = [];
  if (amortResult) {
    try {
      schedule = JSON.parse(amortResult.value) as AmortRow[];
    } catch {
      schedule = [];
    }
  }

  const monthlyNOI = parseFloat(values.monthlyNOI);
  const hasNOI = !isNaN(monthlyNOI) && monthlyNOI > 0;

  // Extract DSCR value from result text (e.g. "1.45 — Good...")
  let dscrValue = 0;
  if (dscrResult) {
    const match = dscrResult.value.match(/^([\d.]+)/);
    if (match) dscrValue = parseFloat(match[1]);
  }

  const dscrStatus = hasNOI && dscrValue > 0 ? getDSCRStatus(dscrValue) : null;

  const displayedRows = showAllMonths ? schedule : schedule.slice(0, 12);
  const totalInterestSum = schedule.reduce((s, r) => s + r.interest, 0);
  const totalPrincipalSum = schedule.reduce((s, r) => s + r.principal, 0);

  if (!results.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Building2 size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Business Loan Analysis
        </span>
      </div>

      <div className="p-6 space-y-6">

        {/* DSCR Section */}
        {hasNOI && dscrValue > 0 && dscrStatus && (
          <div className={`rounded-xl border ${dscrStatus.borderClass} ${dscrStatus.bgClass} px-5 py-5`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Debt Service Coverage Ratio (DSCR)
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-shrink-0">
                <DSCRGauge dscr={dscrValue} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-black ${dscrStatus.textClass}`}>
                    {dscrValue.toFixed(2)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${dscrStatus.borderClass} ${dscrStatus.bgClass} ${dscrStatus.textClass}`}>
                    {dscrStatus.label}
                  </span>
                </div>
                <p className={`text-sm font-medium ${dscrStatus.textClass}`}>
                  {dscrStatus.interpretation}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-white/70 border border-slate-200 px-3 py-2">
                    <p className="text-slate-500 font-semibold uppercase tracking-wide text-[10px]">Monthly NOI</p>
                    <p className="font-bold text-slate-700">${formatCurrency(monthlyNOI)}</p>
                  </div>
                  <div className="rounded-lg bg-white/70 border border-slate-200 px-3 py-2">
                    <p className="text-slate-500 font-semibold uppercase tracking-wide text-[10px]">Min. Required DSCR</p>
                    <p className="font-bold text-slate-700">1.25 (most lenders)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loan Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">Monthly Payment</p>
            <p className="text-base font-black text-blue-700">{monthlyPaymentResult?.value ?? '—'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Interest</p>
            <p className="text-base font-black text-red-500">{totalInterestResult?.value ?? '—'}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Origination Fee</p>
            <p className="text-sm font-black text-amber-700 leading-tight">
              {originationFeeResult?.value?.split('—')[0]?.trim() ?? '—'}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Cash Received</p>
            <p className="text-base font-black text-emerald-700">{actualCashResult?.value ?? '—'}</p>
          </div>
        </div>

        {/* Amortization Table */}
        {schedule.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Amortization Schedule
              </p>
              <span className="text-[10px] text-slate-500">
                {schedule.length} total payments
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Month</th>
                    <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Beginning Balance</th>
                    <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Payment</th>
                    <th scope="col" className="text-right px-3 py-2.5 font-bold text-red-400 uppercase tracking-wider text-[10px]">Interest</th>
                    <th scope="col" className="text-right px-3 py-2.5 font-bold text-blue-400 uppercase tracking-wider text-[10px]">Principal</th>
                    <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Ending Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map((row, i) => (
                    <tr
                      key={row.month}
                      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="px-4 py-2.5 font-bold text-slate-700">Mo {row.month}</td>
                      <td className="px-3 py-2.5 text-right text-slate-600">${formatCurrency(row.beginningBalance)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-700 font-semibold">${formatCurrency(row.payment)}</td>
                      <td className="px-3 py-2.5 text-right text-red-500 font-semibold">${formatCurrency(row.interest)}</td>
                      <td className="px-3 py-2.5 text-right text-blue-600 font-semibold">${formatCurrency(row.principal)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-800">
                        {row.endingBalance < 0.005 ? (
                          <span className="text-emerald-600 font-black text-[10px]">PAID OFF</span>
                        ) : (
                          `$${formatCurrency(row.endingBalance)}`
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Summary row if not showing all */}
                  {!showAllMonths && schedule.length > 12 && (
                    <tr className="bg-slate-100 border-t-2 border-slate-300">
                      <td className="px-4 py-2.5 font-black text-slate-500 uppercase text-[10px] tracking-wider" colSpan={2}>
                        All {schedule.length} Payments Total
                      </td>
                      <td className="px-3 py-2.5 text-right font-black text-slate-700">
                        ${formatCurrency(schedule.reduce((s, r) => s + r.payment, 0))}
                      </td>
                      <td className="px-3 py-2.5 text-right font-black text-red-500">
                        ${formatCurrency(totalInterestSum)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-black text-blue-600">
                        ${formatCurrency(totalPrincipalSum)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-emerald-600 text-[10px]">PAID OFF</td>
                    </tr>
                  )}

                  {/* Totals row when showing all */}
                  {showAllMonths && (
                    <tr className="bg-slate-100 border-t-2 border-slate-300">
                      <td className="px-4 py-2.5 font-black text-slate-700 uppercase text-[10px] tracking-wider" colSpan={2}>Total</td>
                      <td className="px-3 py-2.5 text-right font-black text-slate-700">
                        ${formatCurrency(schedule.reduce((s, r) => s + r.payment, 0))}
                      </td>
                      <td className="px-3 py-2.5 text-right font-black text-red-500">
                        ${formatCurrency(totalInterestSum)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-black text-blue-600">
                        ${formatCurrency(totalPrincipalSum)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-emerald-600 text-[10px]">PAID OFF</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {schedule.length > 12 && (
              <button type="button"
                onClick={() => setShowAllMonths((v) => !v)}
                className="mt-3 w-full py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
              >
                {showAllMonths
                  ? 'Show first 12 months only'
                  : `Show all ${schedule.length} months`}
              </button>
            )}
          </div>
        )}

        {/* Interest vs Principal Breakdown Note */}
        {schedule.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Payment Breakdown</p>
            <div className="flex gap-3 text-xs">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600 font-semibold">Principal</span>
                  <span className="text-blue-600 font-bold">
                    {((totalPrincipalSum / Math.max(totalPrincipalSum + totalInterestSum, 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(totalPrincipalSum / Math.max(totalPrincipalSum + totalInterestSum, 1)) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600 font-semibold">Interest</span>
                  <span className="text-red-500 font-bold">
                    {((totalInterestSum / Math.max(totalPrincipalSum + totalInterestSum, 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-red-400 rounded-full"
                    style={{ width: `${(totalInterestSum / Math.max(totalPrincipalSum + totalInterestSum, 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Of every dollar you repay, {((totalPrincipalSum / Math.max(totalPrincipalSum + totalInterestSum, 1)) * 100).toFixed(1)}% reduces your balance and {((totalInterestSum / Math.max(totalPrincipalSum + totalInterestSum, 1)) * 100).toFixed(1)}% goes to the lender as interest cost.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
