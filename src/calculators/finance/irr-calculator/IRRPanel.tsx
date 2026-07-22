import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { IRRData, fmtCurrency } from './irrTypes';
import { CashFlowChart } from './CashFlowChart';
import { IRRInterpretationCard } from './IRRInterpretationCard';
import { PaybackVisual } from './PaybackVisual';
import { PresentValueTable } from './PresentValueTable';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

export default function IRRPanel({ results }: Props) {
  const data = useMemo<IRRData | null>(() => {
    const raw = results.find((r) => r.id === '_irrData');
    if (!raw) return null;
    try {
      return JSON.parse(raw.value) as IRRData;
    } catch {
      return null;
    }
  }, [results]);

  if (!data) return null;

  const { cashFlows, irr, npv, discountRate, presentValues, paybackPeriod } = data;

  const hasDiscountRate = discountRate !== null && discountRate !== undefined;
  const hasNPV = npv !== null && npv !== undefined && !isNaN(npv) && hasDiscountRate && presentValues.length > 0;
  const hasIRR = irr !== null && irr !== undefined && !isNaN(irr) && isFinite(irr);
  const hasPayback = paybackPeriod !== null && paybackPeriod !== undefined && !isNaN(paybackPeriod);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingUp size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          IRR Analysis
        </span>
      </div>

      <div className="p-6 space-y-8">
        {/* Cash Flow Timeline Chart */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Cash Flow Timeline &amp; Cumulative Balance
          </p>
          <CashFlowChart cashFlows={cashFlows} paybackPeriod={hasPayback ? paybackPeriod! : null} />
        </div>

        {/* IRR Interpretation */}
        {hasIRR ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              IRR Interpretation &amp; Benchmarks
            </p>
            <IRRInterpretationCard irr={irr!} />
          </div>
        ) : (
          <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4">
            <p className="text-sm font-bold text-red-700 mb-1">IRR Cannot Be Calculated</p>
            <p className="text-xs text-red-600">
              IRR requires at least one sign change in the cash flows (i.e., some positive and some
              negative values). Make sure your cash flows include both an outflow (the initial
              investment) and at least one positive return year.
            </p>
          </div>
        )}

        {/* Payback Period Visual */}
        {hasPayback && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Payback Period &mdash; When Does This Investment Break Even?
            </p>
            <PaybackVisual
              paybackPeriod={paybackPeriod!}
              totalYears={cashFlows.length - 1}
            />
          </div>
        )}

        {/* Present Value Table */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Present Value Breakdown
          </p>
          {hasNPV ? (
            <PresentValueTable presentValues={presentValues} npv={npv!} />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-sm font-semibold text-slate-600 mb-1">
                Enter a discount rate to see NPV and present value breakdown.
              </p>
              <p className="text-xs text-slate-500">
                The discount rate (also called cost of capital or WACC) converts future cash flows
                into today's dollars. A positive NPV means the investment earns more than your
                required return rate.
              </p>
            </div>
          )}
        </div>

        {/* Cash Flow Summary Table */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Cash Flow Summary
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className="text-left px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Year</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Cash Flow</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {cashFlows.map((cf, i) => {
                  const cumulative = cashFlows.slice(0, i + 1).reduce((s, v) => s + v, 0);
                  return (
                    <tr
                      key={`item-${i}`}
                      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="px-3 py-2 font-bold text-slate-700">
                        {i === 0 ? 'Year 0 (Investment)' : `Year ${i}`}
                      </td>
                      <td className={`px-3 py-2 text-right font-semibold ${cf < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {fmtCurrency(cf)}
                      </td>
                      <td className={`px-3 py-2 text-right font-semibold ${cumulative < 0 ? 'text-red-400' : 'text-emerald-600'}`}>
                        {fmtCurrency(cumulative)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Educational tip */}
        {hasIRR && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-3">
            <p className="text-xs font-bold text-blue-700 mb-1">Decision Rule</p>
            <p className="text-xs text-blue-600">
              If IRR &gt; your cost of capital (discount rate), the investment creates value and
              NPV will be positive. If IRR &lt; your cost of capital, you would be better off
              investing the same dollars at your required rate of return elsewhere.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
