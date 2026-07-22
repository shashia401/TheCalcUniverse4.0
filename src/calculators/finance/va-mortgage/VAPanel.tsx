import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { VAData, fmtK, fmt } from './vaTypes';
import { DonutChart } from './DonutChart';
import { FundingFeeCard } from './FundingFeeCard';
import { ConventionalComparison } from './ConventionalComparison';
import { DownPaymentImpactTable } from './DownPaymentImpactTable';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function VAPanel({ results }: Props) {
  const data = useMemo<VAData | null>(() => {
    const raw = results.find((r) => r.id === '_vaData');
    if (!raw) return null;
    try {
      return JSON.parse(raw.value) as VAData;
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
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          VA Loan Analysis
        </span>
      </div>

      <div className="p-6 space-y-8">
        {/* Monthly Payment Donut */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Monthly Payment Breakdown
          </p>
          <DonutChart data={data} />
        </div>

        {/* Funding Fee Detail */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            VA Funding Fee Detail
          </p>
          <FundingFeeCard data={data} />
        </div>

        {/* VA vs Conventional */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
            VA vs. Conventional &mdash; Same Home
          </p>
          <p className="text-[11px] text-slate-500 mb-3">
            How VA compares to conventional financing options at the same interest rate.
          </p>
          <ConventionalComparison data={data} />
        </div>

        {/* Down Payment Impact */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
            Down Payment Impact on Funding Fee
          </p>
          <p className="text-[11px] text-slate-500 mb-3">
            Funding fee rate at different down payment levels for{' '}
            {data.vaUseType === 'first' ? 'first-time' : 'subsequent'} VA loan use.
          </p>
          <DownPaymentImpactTable data={data} />
        </div>

        {/* Educational callout */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-4">
          <p className="text-xs font-bold text-blue-700 mb-1">VA Loan Key Advantage</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            VA loans have no PMI requirement. A conventional borrower with 5% down on a{' '}
            ${fmtK(data.homePrice)} home would pay approximately{' '}
            <strong>${fmt((data.homePrice * 0.95 * 0.007) / 12)}/month</strong> in PMI alone &mdash; that
            is <strong>${fmt(data.homePrice * 0.95 * 0.007 * 12)}</strong> per year
            in insurance that builds no equity. VA borrowers pay a one-time funding fee instead.
          </p>
        </div>
      </div>
    </div>
  );
}
