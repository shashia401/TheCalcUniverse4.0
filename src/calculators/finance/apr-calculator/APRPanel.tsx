import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface APRData {
  loanAmount: number;
  nominalRate: number;
  upfrontFees: number;
  netCashReceived: number;
  monthlyPayment: number;
  totalNominalInterest: number;
  totalCostWithFees: number;
  aprAnnual: number;
  aprDifference: number;
  termMonths: number;
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Rate Comparison Cards ──────────────────────────────────────────────────────

function RateComparisonCards({ data }: { data: APRData }) {
  const { nominalRate, aprAnnual, aprDifference, upfrontFees } = data;
  const bps = Math.round(aprDifference * 100);
  const hasFeeDifference = upfrontFees > 0;
  const aprColor = hasFeeDifference ? 'text-red-600' : 'text-blue-600';
  const aprBg = hasFeeDifference ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';

  return (
    <div className="flex items-stretch gap-0">
      {/* Nominal Rate Card */}
      <div className="flex-1 bg-blue-50 border border-blue-200 rounded-l-xl px-5 py-5 flex flex-col items-center justify-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">
          Nominal Rate
        </p>
        <p className="text-4xl font-black text-blue-600">{nominalRate.toFixed(3)}%</p>
        <p className="text-[11px] text-blue-400 mt-1">As quoted by lender</p>
      </div>

      {/* Divider */}
      <div className="flex flex-col items-center justify-center px-3 bg-white border-y border-slate-200 z-10">
        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">vs</div>
        {hasFeeDifference && bps > 0 && (
          <div className="flex flex-col items-center">
            <div className="text-red-500 text-base">&#8593;</div>
            <span className="text-[10px] font-black text-red-500 whitespace-nowrap">
              +{bps} bps
            </span>
          </div>
        )}
        {!hasFeeDifference && (
          <div className="text-emerald-500 text-[10px] font-bold text-center whitespace-nowrap">
            Equal
          </div>
        )}
      </div>

      {/* APR Card */}
      <div className={`flex-1 border rounded-r-xl px-5 py-5 flex flex-col items-center justify-center ${aprBg}`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${hasFeeDifference ? 'text-red-400' : 'text-blue-400'}`}>
          True APR
        </p>
        <p className={`text-4xl font-black ${aprColor}`}>{aprAnnual.toFixed(3)}%</p>
        <p className={`text-[11px] mt-1 ${hasFeeDifference ? 'text-red-400' : 'text-blue-400'}`}>
          {hasFeeDifference ? 'Includes fee impact' : 'No fees — equals rate'}
        </p>
      </div>
    </div>
  );
}

// ─── Cost Waterfall Table ───────────────────────────────────────────────────────

function CostWaterfallTable({ data }: { data: APRData }) {
  const { loanAmount, upfrontFees, netCashReceived, monthlyPayment, totalCostWithFees, termMonths } = data;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          <tr className="border-b border-slate-100">
            <td className="px-4 py-3 text-slate-600 font-medium">Loan Amount</td>
            <td className="px-4 py-3 text-right font-bold text-slate-800">${fmt(loanAmount)}</td>
          </tr>
          <tr className={`border-b border-slate-100 ${upfrontFees > 0 ? 'bg-red-50/40' : ''}`}>
            <td className="px-4 py-3 text-slate-600 font-medium pl-7">− Upfront Fees</td>
            <td className={`px-4 py-3 text-right font-bold ${upfrontFees > 0 ? 'text-red-500' : 'text-slate-500'}`}>
              {upfrontFees > 0 ? `−$${fmt(upfrontFees)}` : '$0.00'}
            </td>
          </tr>
          <tr className="border-b-2 border-slate-300 bg-slate-50">
            <td className="px-4 py-3 text-slate-700 font-black pl-7">= Net Cash Received</td>
            <td className="px-4 py-3 text-right font-black text-slate-800">${fmt(netCashReceived)}</td>
          </tr>

          <tr className="border-b border-slate-100 border-t-2 border-t-slate-200">
            <td className="px-4 py-3 text-slate-600 font-medium">
              Monthly Payment &times; {termMonths} months
            </td>
            <td className="px-4 py-3 text-right font-bold text-slate-800">${fmt(monthlyPayment * termMonths)}</td>
          </tr>
          <tr className={`border-b border-slate-100 ${upfrontFees > 0 ? 'bg-red-50/40' : ''}`}>
            <td className="px-4 py-3 text-slate-600 font-medium pl-7">+ Upfront Fees</td>
            <td className={`px-4 py-3 text-right font-bold ${upfrontFees > 0 ? 'text-red-500' : 'text-slate-500'}`}>
              {upfrontFees > 0 ? `+$${fmt(upfrontFees)}` : '$0.00'}
            </td>
          </tr>
          <tr className="bg-slate-50">
            <td className="px-4 py-3 text-slate-700 font-black pl-7">= Total True Cost</td>
            <td className="px-4 py-3 text-right font-black text-slate-800">${fmt(totalCostWithFees)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Fee Impact Stacked Bar ─────────────────────────────────────────────────────

function FeeImpactBar({ data }: { data: APRData }) {
  const { totalNominalInterest, upfrontFees, totalCostWithFees } = data;

  if (upfrontFees <= 0) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <span className="text-emerald-600 font-black text-sm">&#10003;</span>
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-700">No fees — APR equals your interest rate</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            With zero upfront fees, the APR is identical to the nominal rate.
          </p>
        </div>
      </div>
    );
  }

  const interestPct = totalCostWithFees > 0 ? (totalNominalInterest / totalCostWithFees) * 100 : 0;
  const feePct = totalCostWithFees > 0 ? (upfrontFees / totalCostWithFees) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex h-8 rounded-lg overflow-hidden">
        <div
          className="bg-blue-500 flex items-center justify-center"
          style={{ width: `${interestPct}%` }}
        >
          {interestPct > 12 && (
            <span className="text-[10px] font-bold text-white truncate px-1">
              Interest {interestPct.toFixed(1)}%
            </span>
          )}
        </div>
        <div
          className="bg-red-400 flex items-center justify-center"
          style={{ width: `${feePct}%` }}
        >
          {feePct > 6 && (
            <span className="text-[10px] font-bold text-white truncate px-1">
              Fees {feePct.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500 flex-shrink-0" />
          <span className="text-[11px] text-slate-600">
            Nominal Interest: ${fmt(totalNominalInterest)} ({interestPct.toFixed(1)}%)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-400 flex-shrink-0" />
          <span className="text-[11px] text-slate-600">
            Fees: ${fmt(upfrontFees)} ({feePct.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Break-Even Callout ─────────────────────────────────────────────────────────

function BreakEvenCallout({ data }: { data: APRData }) {
  const { upfrontFees, loanAmount, termMonths } = data;

  if (upfrontFees <= 0) return null;

  // Actually compute: payment at 0.5% higher rate on same principal
  const rHigher = 0.005 / 12; // 0.5% / 12 additional monthly
  const monthlyRateDelta = rHigher;
  // Rough monthly savings: the difference in payment at rate+0.5% vs rate
  // We use: deltaPayment ≈ loanAmount * deltaMonthlyRate (very approximate)
  const approxMonthlySavings = loanAmount * monthlyRateDelta;
  const breakEvenMonths =
    approxMonthlySavings > 0 ? Math.ceil(upfrontFees / approxMonthlySavings) : null;

  // Sanity check
  if (!breakEvenMonths || breakEvenMonths > termMonths * 2) return null;

  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4">
      <p className="text-sm font-bold text-amber-800 mb-1">Break-Even on Fees (Educational Estimate)</p>
      <p className="text-xs text-amber-700 leading-relaxed">
        At a rate roughly 0.50% higher but with no fees, you would pay approximately{' '}
        <strong>${fmt(approxMonthlySavings)}/month more</strong> in interest. Your upfront fees of{' '}
        <strong>${fmt(upfrontFees)}</strong> would pay for themselves in approximately{' '}
        <strong>{breakEvenMonths} months</strong>. If you plan to keep this loan longer than that,
        the lower rate with fees is advantageous.
      </p>
    </div>
  );
}

// ─── Key Insight Box ────────────────────────────────────────────────────────────

function KeyInsightBox({ data }: { data: APRData }) {
  const { nominalRate, aprAnnual, aprDifference, totalCostWithFees } = data;

  let bgClass = 'bg-emerald-50 border-emerald-200';
  let textClass = 'text-emerald-800';
  let subTextClass = 'text-emerald-700';

  if (aprDifference > 1) {
    bgClass = 'bg-red-50 border-red-200';
    textClass = 'text-red-800';
    subTextClass = 'text-red-700';
  } else if (aprDifference > 0.25) {
    bgClass = 'bg-amber-50 border-amber-200';
    textClass = 'text-amber-800';
    subTextClass = 'text-amber-700';
  }

  return (
    <div className={`rounded-xl border px-5 py-4 ${bgClass}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${textClass} opacity-70`}>
        Key Insight
      </p>
      <p className={`text-sm font-semibold leading-relaxed ${subTextClass}`}>
        Your lender is quoting{' '}
        <strong>{nominalRate.toFixed(3)}%</strong> but your actual borrowing cost is{' '}
        <strong>{aprAnnual.toFixed(3)}% APR</strong>
        {aprDifference > 0.001
          ? ` — a difference of ${aprDifference.toFixed(3)} percentage points`
          : ' — no difference, as there are no fees'}
        . Over the life of the loan, you will pay{' '}
        <strong>${fmt(totalCostWithFees)}</strong> in total (interest + fees).
      </p>
    </div>
  );
}

// ─── Main Panel ─────────────────────────────────────────────────────────────────

export default function APRPanel({ results }: Props) {
  const data = useMemo<APRData | null>(() => {
    const raw = results.find((r) => r.id === '_aprData');
    if (!raw) return null;
    try {
      return JSON.parse(raw.value) as APRData;
    } catch {
      return null;
    }
  }, [results]);

  if (!data) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg
          className="w-4 h-4 text-slate-500"
          aria-hidden="true"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          APR Analysis
        </span>
      </div>

      <div className="p-6 space-y-8">
        {/* Rate Comparison */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Nominal Rate vs. True APR
          </p>
          <RateComparisonCards data={data} />
        </div>

        {/* Cost Waterfall */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Cost Waterfall
          </p>
          <CostWaterfallTable data={data} />
        </div>

        {/* Fee Impact Visualization */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Cost Composition: Interest vs. Fees
          </p>
          <FeeImpactBar data={data} />
        </div>

        {/* Break-Even */}
        <BreakEvenCallout data={data} />

        {/* Key Insight */}
        <div>
          <KeyInsightBox data={data} />
        </div>
      </div>
    </div>
  );
}
