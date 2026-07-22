import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function formatDollar(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `-$${formatted}` : `$${formatted}`;
}

function formatDollarShort(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return n < 0 ? `-$${formatted}` : `$${formatted}`;
}

interface WaterfallRowProps {
  label: string;
  amount: number;
  maxAmount: number;
  type: 'income' | 'reduction' | 'intermediate' | 'noi' | 'final';
  isPositive?: boolean;
}

function WaterfallRow({ label, amount, maxAmount, type, isPositive }: WaterfallRowProps) {
  const pct = maxAmount > 0 ? Math.min(Math.abs(amount) / maxAmount, 1) * 100 : 0;

  let barColor = 'bg-slate-200';
  let labelColor = 'text-slate-600';
  let valueColor = 'text-slate-700';

  if (type === 'income') {
    barColor = 'bg-emerald-500';
    labelColor = 'text-emerald-700 font-semibold';
    valueColor = 'text-emerald-700 font-bold';
  } else if (type === 'reduction') {
    barColor = 'bg-red-400';
    labelColor = 'text-red-600';
    valueColor = 'text-red-600 font-bold';
  } else if (type === 'intermediate') {
    barColor = 'bg-slate-400';
    labelColor = 'text-slate-600 font-medium';
    valueColor = 'text-slate-700 font-semibold';
  } else if (type === 'noi') {
    barColor = 'bg-blue-500';
    labelColor = 'text-blue-700 font-semibold';
    valueColor = 'text-blue-700 font-bold';
  } else if (type === 'final') {
    if (isPositive) {
      barColor = 'bg-emerald-500';
      labelColor = 'text-emerald-700 font-semibold';
      valueColor = 'text-emerald-700 font-bold';
    } else {
      barColor = 'bg-red-500';
      labelColor = 'text-red-700 font-semibold';
      valueColor = 'text-red-700 font-bold';
    }
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-44 flex-shrink-0 text-xs text-right pr-2">
        <span className={labelColor}>{label}</span>
      </div>
      <div className="flex-1 relative h-6 bg-slate-100 rounded-sm overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-sm transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-28 flex-shrink-0 text-xs text-right">
        <span className={valueColor}>{formatDollar(amount)}</span>
        {type === 'reduction' && (
          <span className="text-slate-500 text-[10px] ml-1">/mo</span>
        )}
        {(type === 'income' || type === 'intermediate' || type === 'noi' || type === 'final') && (
          <span className="text-slate-500 text-[10px] ml-1">/mo</span>
        )}
      </div>
    </div>
  );
}

function DividerRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-44 flex-shrink-0" />
      <div className="flex-1 border-t border-dashed border-slate-300" />
      <div className="w-28 flex-shrink-0 text-[10px] text-right text-slate-500 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  color: 'positive' | 'neutral' | 'negative' | undefined;
}

function MetricCard({ label, value, color }: MetricCardProps) {
  let dotClass = 'bg-slate-400';
  let valueClass = 'text-slate-700';
  let borderClass = 'border-slate-200';
  let bgClass = 'bg-white';

  if (color === 'positive') {
    dotClass = 'bg-emerald-500';
    valueClass = 'text-emerald-700';
    borderClass = 'border-emerald-200';
    bgClass = 'bg-emerald-50';
  } else if (color === 'negative') {
    dotClass = 'bg-red-500';
    valueClass = 'text-red-700';
    borderClass = 'border-red-200';
    bgClass = 'bg-red-50';
  } else if (color === 'neutral') {
    dotClass = 'bg-amber-400';
    valueClass = 'text-amber-700';
    borderClass = 'border-amber-200';
    bgClass = 'bg-amber-50';
  }

  return (
    <div className={`rounded-xl border ${borderClass} ${bgClass} px-4 py-3`}>
      <div className="flex items-center gap-1.5 mb-1">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      </div>
      <p className={`text-lg font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

export default function RentalWaterfallPanel({ values, results }: Props) {
  const [_expanded, setExpanded] = useState(false);

  if (!results || results.length === 0) return null;

  const waterfallRaw = results.find((r) => r.id === '_waterfallData');
  if (!waterfallRaw) return null;

  let data: {
    monthlyGrossRent: number; monthlyVacancyLoss: number; monthlyEffectiveRent: number;
    monthlyOpEx: number; monthlyNOI: number; monthlyMortgage: number; monthlyCashFlow: number;
    capRate: number; cashOnCash: number; dscr: number; purchasePrice: number;
    totalCashInvested: number; monthlyHOA: number;
  };
  try { data = JSON.parse(waterfallRaw.value); } catch { return null; }

  const grossRent = data.monthlyGrossRent;
  const vacancyLossValue = data.monthlyVacancyLoss;
  const effectiveGrossRent = data.monthlyEffectiveRent;
  const operatingExpenses = data.monthlyOpEx;
  const noi = data.monthlyNOI;
  const mortgagePayment = data.monthlyMortgage;
  const netCashFlow = data.monthlyCashFlow;

  const capRateResult = results.find((r) => r.id === 'capRate');
  const cashOnCashResult = results.find((r) => r.id === 'cashOnCash');
  const dscrResult = results.find((r) => r.id === 'dscr');

  const monthlyRentInput = parseFloat(values.monthlyRent) || 0;
  const purchasePrice = data.purchasePrice;
  const onePercentRatio = purchasePrice > 0 ? (monthlyRentInput / purchasePrice) * 100 : 0;
  const onePercentPasses = onePercentRatio >= 1;

  const maxWidth = grossRent;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Cash Flow Waterfall</span>
      </div>

      <div className="p-6 space-y-6">

        {/* Waterfall Chart */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            Monthly Cash Flow Breakdown
          </p>
          <p className="text-xs text-slate-500 mb-4">
            How your gross rent flows down to net cash flow after all deductions
          </p>

          <div className="space-y-0">
            {/* Row 1: Gross Rent */}
            <WaterfallRow
              label="Gross Rent"
              amount={grossRent}
              maxAmount={maxWidth}
              type="income"
            />

            {/* Divider */}
            <DividerRow label="minus vacancy" />

            {/* Row 2: Vacancy Loss */}
            <WaterfallRow
              label="Vacancy Loss"
              amount={-vacancyLossValue}
              maxAmount={maxWidth}
              type="reduction"
            />

            {/* Row 3: Effective Gross Rent */}
            <WaterfallRow
              label="Effective Gross Rent"
              amount={effectiveGrossRent}
              maxAmount={maxWidth}
              type="intermediate"
            />

            {/* Divider */}
            <DividerRow label="minus expenses" />

            {/* Row 4: Operating Expenses */}
            <WaterfallRow
              label="Operating Expenses"
              amount={-operatingExpenses}
              maxAmount={maxWidth}
              type="reduction"
            />

            {/* Row 5: NOI */}
            <WaterfallRow
              label="Net Operating Income"
              amount={noi}
              maxAmount={maxWidth}
              type="noi"
            />

            {/* Divider */}
            <DividerRow label="minus mortgage" />

            {/* Row 6: Mortgage */}
            <WaterfallRow
              label="Mortgage / Debt Service"
              amount={-mortgagePayment}
              maxAmount={maxWidth}
              type="reduction"
            />

            {/* Row 7: Net Cash Flow */}
            <WaterfallRow
              label="Net Cash Flow"
              amount={netCashFlow}
              maxAmount={maxWidth}
              type="final"
              isPositive={netCashFlow >= 0}
            />
          </div>

          {/* Cash flow callout */}
          <div className={`mt-4 rounded-xl border px-5 py-3 ${
            netCashFlow >= 0
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-red-200 bg-red-50'
          }`}>
            <p className={`text-sm font-semibold ${netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {netCashFlow >= 0
                ? `This property generates ${formatDollarShort(netCashFlow)}/month in positive cash flow after all expenses and debt service.`
                : `This property runs a ${formatDollarShort(Math.abs(netCashFlow))}/month cash flow deficit — you would need to contribute out-of-pocket each month.`
              }
            </p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Key Investment Metrics</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricCard
              label="Cap Rate"
              value={capRateResult?.value ?? '—'}
              color={capRateResult?.color}
            />
            <MetricCard
              label="Cash-on-Cash Return"
              value={cashOnCashResult?.value ?? '—'}
              color={cashOnCashResult?.color}
            />
            <MetricCard
              label="DSCR"
              value={dscrResult?.value ?? '—'}
              color={dscrResult?.color}
            />
          </div>
        </div>

        {/* 1% Rule Check */}
        {purchasePrice > 0 && monthlyRentInput > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">1% Rule Check</p>
                <p className="text-xs text-slate-500 mt-1">
                  Monthly rent should equal at least 1% of purchase price to likely generate positive cash flow.
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span>
                    {formatDollarShort(monthlyRentInput)}/mo
                    {' '}&divide;{' '}
                    {formatDollarShort(purchasePrice)}
                    {' '}= {onePercentRatio.toFixed(2)}%
                  </span>
                  <span className="text-slate-500">(need &ge; 1%)</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-black border ${
                  onePercentPasses
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    : 'bg-red-100 text-red-700 border-red-300'
                }`}>
                  {onePercentPasses ? 'PASS' : 'FAIL'}
                </span>
                <p className={`text-center text-xs font-bold mt-1 ${
                  onePercentPasses ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {onePercentRatio.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* 1% progress bar */}
            <div className="mt-3">
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    onePercentPasses ? 'bg-emerald-500' : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.min(onePercentRatio / 2, 1) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                <span>0%</span>
                <span className={onePercentPasses ? 'text-emerald-500 font-bold' : 'text-red-400 font-bold'}>
                  1% threshold
                </span>
                <span>2%+</span>
              </div>
            </div>
          </div>
        )}

        {/* Waterfall Summary Table */}
        <div>
          <button type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors"
          >
            <span>Monthly Cash Flow Summary</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                {[
                  { label: 'Gross Monthly Rent', value: grossRent, class: 'text-emerald-600' },
                  { label: '− Vacancy Loss', value: -vacancyLossValue, class: 'text-red-500' },
                  { label: '= Effective Gross Rent', value: effectiveGrossRent, class: 'text-slate-700', bold: true },
                  { label: '− Operating Expenses', value: -operatingExpenses, class: 'text-red-500' },
                  { label: '= Net Operating Income (NOI)', value: noi, class: 'text-blue-600', bold: true },
                  { label: '− Mortgage / Debt Service', value: -mortgagePayment, class: 'text-red-500' },
                  { label: '= Net Cash Flow', value: netCashFlow, class: netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600', bold: true },
                ].map((row, i) => (
                  <tr key={`item-${i}`} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} ${row.bold ? 'border-t-2 border-slate-200' : ''}`}>
                    <td className={`px-4 py-2.5 ${row.bold ? 'font-bold text-slate-700' : 'text-slate-500'}`}>
                      {row.label}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-bold ${row.class}`}>
                      {formatDollar(row.value)}/mo
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
