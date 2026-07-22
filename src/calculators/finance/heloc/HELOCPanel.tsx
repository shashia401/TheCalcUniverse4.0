import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { HELOCData } from './helocTypes';
import { EquityStackedBar } from './EquityStackedBar';
import { CLTVGauge } from './CLTVGauge';
import { DrawAmountSummary } from './DrawAmountSummary';
import { RateContextCard } from './RateContextCard';
import { AmortizationNote } from './AmortizationNote';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// ─── Main Panel ─────────────────────────────────────────────────────────────────

export default function HELOCPanel({ results }: Props) {
  const data = useMemo<HELOCData | null>(() => {
    const raw = results.find((r) => r.id === '_helocData');
    if (!raw) return null;
    try {
      return JSON.parse(raw.value) as HELOCData;
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
            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          HELOC Analysis
        </span>
      </div>

      <div className="p-6 space-y-8">
        {/* Equity Stacked Bar */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Home Equity Breakdown
          </p>
          <EquityStackedBar data={data} />
        </div>

        {/* CLTV Gauge */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Loan-to-Value Position
          </p>
          <CLTVGauge data={data} />
        </div>

        {/* Draw Amount Summary */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Draw Amount &amp; Payment Summary
          </p>
          <DrawAmountSummary data={data} />
        </div>

        {/* Rate Context */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Rate Context &mdash; Why Use Your Equity?
          </p>
          <RateContextCard data={data} />
        </div>

        {/* Amortization Note */}
        {data.actualDraw > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Draw vs. Repayment Phase Payments
            </p>
            <AmortizationNote data={data} />
          </div>
        )}

        {/* Risk callout */}
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4">
          <p className="text-xs font-bold text-red-700 mb-1">Important Risk Disclosure</p>
          <p className="text-xs text-red-600 leading-relaxed">
            A HELOC is secured by your home. Failure to repay puts your home at risk of
            foreclosure. HELOCs use variable rates &mdash; if the Prime Rate rises, your payment rises
            too. Borrow only what you can service even if rates increase by 2&ndash;3%.
          </p>
        </div>
      </div>
    </div>
  );
}
