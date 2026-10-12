import { CalculatorResult } from '../../../types/calculator';
import { GitCompare } from 'lucide-react';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { parseDebts } from './debtMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getVal(results: CalculatorResult[], id: string) {
  return results.find((r) => r.id === id)?.value ?? '—';
}

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function PlanCard({
  title,
  color,
  results,
  paymentId,
  interestId,
  timelineId,
  totalCostId,
  isConsolidation,
}: {
  title: string;
  color: 'orange' | 'emerald';
  results: CalculatorResult[];
  paymentId: string;
  interestId: string;
  timelineId: string;
  totalCostId: string;
  isConsolidation?: boolean;
}) {
  const borderColor = color === 'orange' ? 'border-orange-200' : 'border-emerald-200';
  const bgColor = color === 'orange' ? 'bg-orange-50' : 'bg-emerald-50';
  const textColor = color === 'orange' ? 'text-orange-700' : 'text-emerald-700';
  const labelColor = color === 'orange' ? 'text-orange-700' : 'text-emerald-700';

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4 flex-1 min-w-0`}>
      <p className={`text-xs font-bold uppercase tracking-widest ${labelColor} mb-3`}>{title}</p>

      <div className="space-y-2.5">
        <div>
          <p className="text-[10px] text-slate-500">Monthly Payment</p>
          <p className={`text-lg font-black ${textColor}`}>{getVal(results, paymentId)}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/70 rounded-lg p-2.5">
            <p className="text-[9px] text-slate-500 uppercase font-bold">Total Interest</p>
            <p className={`text-sm font-black ${textColor}`}>{getVal(results, interestId)}</p>
          </div>
          <div className="bg-white/70 rounded-lg p-2.5">
            <p className="text-[9px] text-slate-500 uppercase font-bold">Timeline</p>
            <p className={`text-sm font-black ${textColor}`}>{getVal(results, timelineId)}</p>
          </div>
        </div>
        <div className="bg-white/70 rounded-lg p-2.5">
          <p className="text-[9px] text-slate-500 uppercase font-bold">Total Cost</p>
          <p className={`text-sm font-black ${textColor}`}>{getVal(results, totalCostId)}</p>
        </div>
      </div>
    </div>
  );
}

export default function DebtConsolidationPanel({ values, results }: Props) {
  const debts = parseDebts(values.debts);

  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);

  // Parse payoff progression data for the line chart
  const series = (() => {
    try {
      const raw = JSON.parse(getVal(results, '_payoffData'));
      if (!raw || !Array.isArray(raw.current) || !Array.isArray(raw.consolidation)) return [];
      const toPoints = (a: number[]) => a.map((y, x) => ({ x, y }));
      return [
        { name: 'Current Plan', color: '#c2410c', points: toPoints(raw.current) },
        { name: 'Consolidation', color: '#15803d', points: toPoints(raw.consolidation) },
      ];
    } catch { return []; }
  })();

  const weightedAvgRate = totalBalance > 0
    ? debts.reduce((s, d) => s + (d.rate * d.balance), 0) / totalBalance
    : 0;

  const newRate = parseFloat(values.newRate) || 0;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <GitCompare size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Current Plan vs. Consolidation</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Side-by-side cards */}
        <div className="flex flex-col sm:flex-row gap-4">
          <PlanCard
            title="Current Plan"
            color="orange"
            results={results}
            paymentId="currentPayment"
            interestId="currentInterest"
            timelineId="currentTimeline"
            totalCostId="currentTotalCost"
          />
          <PlanCard
            title="Consolidation"
            color="emerald"
            results={results}
            paymentId="newPayment"
            interestId="newInterest"
            timelineId="newTimeline"
            totalCostId="newTotalCost"
            isConsolidation
          />
        </div>

        {/* Savings highlight */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
          <p className="text-sm font-bold text-slate-600">{getVal(results, 'monthlySavings')}</p>
          <p className="text-lg font-black text-blue-700">{getVal(results, 'lifetimeSaved')}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {results.find(r => r.id === 'lifetimeSaved')?.label || 'Total Lifetime Savings'}
          </p>
        </div>

        {/* Payoff Comparison Line Chart */}
        {series.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Balance Over Time</p>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <SvgLineChart
                series={series}
                height={250}
                ariaLabel="Total remaining debt balance by month: current plan versus consolidation loan"
                xFormat={(n) => `${n}`}
                yFormat={fmtCurrency}
              />
              <div className="flex flex-wrap gap-4 mt-2 text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-orange-700" aria-hidden="true" />Current Plan</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-green-700" aria-hidden="true" />Consolidation</span>
                <span className="text-slate-500">x-axis: months</span>
              </div>
            </div>
          </div>
        )}

        {/* Rate Analysis */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Rate Analysis</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <p className="text-[10px] text-slate-500 mb-1">Weighted Avg. Current Rate</p>
              <p className="text-xl font-black text-orange-700">{weightedAvgRate.toFixed(2)}%</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <p className="text-[10px] text-slate-500 mb-1">New Consolidation Rate</p>
              <p className={`text-xl font-black ${newRate < weightedAvgRate ? 'text-emerald-700' : 'text-red-700'}`}>
                {newRate.toFixed(2)}%
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {newRate < weightedAvgRate
              ? `Your consolidation rate (${newRate.toFixed(2)}%) is ${(weightedAvgRate - newRate).toFixed(2)}% lower than your weighted average — this makes consolidation mathematically favorable.`
              : `Your consolidation rate (${newRate.toFixed(2)}%) is higher than your weighted average rate (${weightedAvgRate.toFixed(2)}%). Consolidation may only be worthwhile for simplicity, not savings.`
            }
          </p>
        </div>

        {/* Origination Fee */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-800 mb-1">Origination Fee</p>
          <p className="text-sm font-black text-amber-700">{getVal(results, 'originationFeeAmt')}</p>
        </div>

        {/* Existing Debts table */}
        {debts.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Your Existing Debts</p>
            <div className="overflow-x-auto rounded-xl border border-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-default,#2563eb)]" tabIndex={0} role="region" aria-label="Existing debts table">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Debt</th>
                    <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Balance</th>
                    <th scope="col" className="text-right px-3 py-2.5 font-bold text-red-700 uppercase tracking-wider text-[10px]">Rate</th>
                    <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map((d, i) => (
                    <tr key={`item-${i}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-bold text-slate-700">{d.name}</td>
                      <td className="px-3 py-2.5 text-right text-slate-600">{fmt(d.balance)}</td>
                      <td className="px-3 py-2.5 text-right text-red-700 font-semibold">{d.rate.toFixed(2)}%</td>
                      <td className="px-3 py-2.5 text-right text-slate-600">{fmt(d.payment)}/mo</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td className="px-4 py-2.5 font-black text-slate-700">Total</td>
                    <td className="px-3 py-2.5 text-right font-black text-slate-800">{fmt(totalBalance)}</td>
                    <td className="px-3 py-2.5 text-right text-orange-700 font-black">{weightedAvgRate.toFixed(2)}% avg</td>
                    <td className="px-3 py-2.5 text-right font-black text-slate-800">{fmt(debts.reduce((s, d) => s + d.payment, 0))}/mo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
