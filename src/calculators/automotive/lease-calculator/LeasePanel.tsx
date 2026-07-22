import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface LeaseBreakdown {
  adjustedCapCost: number;
  residualValue: number;
  moneyFactorUsed: number;
  aprDisplay: number;
  monthlyDepreciation: number;
  monthlyFinanceCharge: number;
  baseMonthlyPayment: number;
  monthlyTax: number;
  totalMonthlyPayment: number;
  totalLeaseCost: number;
  msrp: number;
  negotiatedPrice: number;
  leaseTerm: number;
  residualValuePct: number;
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtMF(mf: number): string {
  return mf.toFixed(5);
}

interface SegmentProps {
  color: string;
  amount: number;
  total: number;
  label: string;
}

function PaymentSegment({ color, amount, total, label }: SegmentProps) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div
      className="flex flex-col items-center justify-center text-center px-1"
      style={{ width: `${pct}%`, minWidth: pct > 0 ? '40px' : '0' }}
    >
      <div
        className={`w-full h-8 rounded-sm ${color}`}
        title={`${label}: $${fmt(amount)}`}
      />
      <span className="text-[9px] text-slate-500 mt-1 leading-tight whitespace-nowrap">
        ${fmt(amount)}
      </span>
      <span className="text-[9px] text-slate-500 leading-tight">{pct.toFixed(0)}%</span>
    </div>
  );
}

export default function LeasePanel({ values: _values, results }: Props) {
  if (!results || !results.length) return null;

  const breakdownResult = results.find((r) => r.id === '_leaseBreakdown');
  if (!breakdownResult) return null;

  let bd: LeaseBreakdown;
  try {
    bd = JSON.parse(breakdownResult.value) as LeaseBreakdown;
  } catch {
    return null;
  }

  const {
    adjustedCapCost,
    residualValue,
    moneyFactorUsed,
    aprDisplay,
    monthlyDepreciation,
    monthlyFinanceCharge,
    baseMonthlyPayment,
    monthlyTax,
    totalMonthlyPayment,
    totalLeaseCost,
    msrp,
    negotiatedPrice,
    leaseTerm,
    residualValuePct,
  } = bd;

  // Depreciation portion during lease (dollar value of car consumed)
  const depreciationDollar = msrp - residualValue;
  const rateInputType = _values.rateInputType || 'mf';

  // APR color
  let aprColorClass = 'text-emerald-600';
  let aprBgClass = 'bg-emerald-50';
  let aprBorderClass = 'border-emerald-200';
  if (aprDisplay >= 7) {
    aprColorClass = 'text-red-600';
    aprBgClass = 'bg-red-50';
    aprBorderClass = 'border-red-200';
  } else if (aprDisplay >= 4) {
    aprColorClass = 'text-amber-600';
    aprBgClass = 'bg-amber-50';
    aprBorderClass = 'border-amber-200';
  }

  const hasMonthlyTax = monthlyTax > 0.005;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Lease Payment Analysis
        </span>
      </div>

      <div className="p-6 space-y-6">

        {/* Payment Breakdown Visual */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            Monthly Payment Breakdown
          </p>
          <p className="text-xs text-slate-500 mb-4">
            How your {leaseTerm}-month lease payment is composed
          </p>

          {/* Stacked horizontal bar */}
          <div className="flex h-8 rounded-lg overflow-hidden border border-slate-200 mb-3">
            {totalMonthlyPayment > 0 && (
              <>
                <div
                  className="bg-blue-500 flex items-center justify-center transition-all"
                  style={{ width: `${(monthlyDepreciation / totalMonthlyPayment) * 100}%` }}
                  title={`Depreciation: $${fmt(monthlyDepreciation)}`}
                />
                <div
                  className="bg-amber-400 flex items-center justify-center transition-all"
                  style={{ width: `${(monthlyFinanceCharge / totalMonthlyPayment) * 100}%` }}
                  title={`Finance Charge: $${fmt(monthlyFinanceCharge)}`}
                />
                {hasMonthlyTax && (
                  <div
                    className="bg-slate-400 flex items-center justify-center transition-all"
                    style={{ width: `${(monthlyTax / totalMonthlyPayment) * 100}%` }}
                    title={`Tax: $${fmt(monthlyTax)}`}
                  />
                )}
              </>
            )}
          </div>

          {/* Segment labels below */}
          <div className="flex items-start overflow-hidden">
            {totalMonthlyPayment > 0 && (
              <>
                <PaymentSegment
                  color="bg-blue-500"
                  amount={monthlyDepreciation}
                  total={totalMonthlyPayment}
                  label="Depreciation"
                />
                <PaymentSegment
                  color="bg-amber-400"
                  amount={monthlyFinanceCharge}
                  total={totalMonthlyPayment}
                  label="Finance Charge"
                />
                {hasMonthlyTax && (
                  <PaymentSegment
                    color="bg-slate-400"
                    amount={monthlyTax}
                    total={totalMonthlyPayment}
                    label="Sales Tax"
                  />
                )}
              </>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500 flex-shrink-0" />
              <span className="text-[10px] text-slate-500">Monthly Depreciation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-amber-400 flex-shrink-0" />
              <span className="text-[10px] text-slate-500">Finance Charge (Interest)</span>
            </div>
            {hasMonthlyTax && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-slate-400 flex-shrink-0" />
                <span className="text-[10px] text-slate-500">Sales Tax</span>
              </div>
            )}
          </div>

          {/* Payment detail rows */}
          <div className="mt-4 space-y-1.5">
            {[
              { label: 'Monthly Depreciation', value: monthlyDepreciation, color: 'text-blue-700', pct: totalMonthlyPayment > 0 ? (monthlyDepreciation / totalMonthlyPayment) * 100 : 0 },
              { label: 'Monthly Finance Charge', value: monthlyFinanceCharge, color: 'text-amber-700', pct: totalMonthlyPayment > 0 ? (monthlyFinanceCharge / totalMonthlyPayment) * 100 : 0 },
              ...(hasMonthlyTax ? [{ label: 'Monthly Tax', value: monthlyTax, color: 'text-slate-600', pct: totalMonthlyPayment > 0 ? (monthlyTax / totalMonthlyPayment) * 100 : 0 }] : []),
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{row.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[10px]">{row.pct.toFixed(0)}% of payment</span>
                  <span className={`font-bold w-20 text-right ${row.color}`}>${fmt(row.value)}</span>
                </div>
              </div>
            ))}
            <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between text-xs font-black">
              <span className="text-slate-700">Total Monthly Payment</span>
              <span className="text-slate-900">${fmt(totalMonthlyPayment)}</span>
            </div>
          </div>
        </div>

        {/* Money Factor Translator — prominent card */}
        <div className={`rounded-xl border-2 ${aprBorderClass} ${aprBgClass} px-5 py-5`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">&#8644;</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Money Factor Translator
            </p>
          </div>

          {rateInputType === 'mf' ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Your Money Factor:{' '}
                <span className="font-black text-slate-800">{fmtMF(moneyFactorUsed)}</span>
                <span className="mx-2 text-slate-500">&#8644;</span>
                <span className={`font-black text-xl ${aprColorClass}`}>{aprDisplay.toFixed(2)}% APR</span>
              </p>
              <p className="text-xs text-slate-500">
                Conversion: {fmtMF(moneyFactorUsed)} &times; 2400 = {aprDisplay.toFixed(2)}%
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Your APR:{' '}
                <span className="font-black text-slate-800">{aprDisplay.toFixed(2)}%</span>
                <span className="mx-2 text-slate-500">&#8644;</span>
                Money Factor:{' '}
                <span className={`font-black text-xl ${aprColorClass}`}>{fmtMF(moneyFactorUsed)}</span>
              </p>
              <p className="text-xs text-slate-500">
                Conversion: {aprDisplay.toFixed(2)}% &divide; 2400 = {fmtMF(moneyFactorUsed)}
              </p>
            </div>
          )}

          <div className={`mt-3 rounded-lg px-3 py-2 border ${aprBorderClass} bg-white/60`}>
            <p className={`text-xs font-semibold ${aprColorClass}`}>
              {aprDisplay < 4
                ? 'Excellent rate — well below average lease financing costs.'
                : aprDisplay < 7
                ? 'Moderate rate — within typical range for standard credit tiers.'
                : 'High rate — consider checking if your credit tier qualifies for a lower money factor.'}
            </p>
          </div>

          <p className="text-[10px] text-slate-500 mt-2">
            Formula: APR = Money Factor &times; 2400 &nbsp;|&nbsp; Money Factor = APR &divide; 2400
          </p>
        </div>

        {/* Residual Value Explainer */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            Residual Value Explainer
          </p>

          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-600">MSRP: <span className="font-bold text-slate-800">${fmtShort(msrp)}</span></span>
            <span className="text-slate-600">Residual: <span className="font-bold text-blue-600">${fmtShort(residualValue)} ({residualValuePct.toFixed(1)}%)</span></span>
          </div>

          {/* Depreciation vs Residual bar */}
          <div className="relative h-8 rounded-lg overflow-hidden border border-slate-200 mb-2">
            <div
              className="absolute left-0 top-0 h-full bg-red-400 flex items-center justify-center"
              style={{ width: `${(depreciationDollar / msrp) * 100}%` }}
            >
              <span className="text-[9px] text-white font-bold px-1 truncate">
                You pay ${fmtShort(depreciationDollar)}
              </span>
            </div>
            <div
              className="absolute right-0 top-0 h-full bg-blue-400 flex items-center justify-center"
              style={{ width: `${(residualValue / msrp) * 100}%` }}
            >
              <span className="text-[9px] text-white font-bold px-1 truncate">
                ${fmtShort(residualValue)} remains
              </span>
            </div>
          </div>

          {/* Labels */}
          <div className="flex justify-between text-[10px] text-slate-500 mb-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-red-400 inline-block" />
              You pay for this portion &larr;
            </span>
            <span className="flex items-center gap-1">
              &rarr; Manufacturer/lessor keeps this
              <span className="w-2 h-2 rounded-sm bg-blue-400 inline-block" />
            </span>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5">
            <p className="text-xs text-blue-700">
              <span className="font-bold">Higher residual % = lower monthly payment.</span>
              {' '}This is why leasing the same model on a better-residual trim or at a better time of year can result in dramatically different payments — even with identical selling prices.
            </p>
          </div>
        </div>

        {/* Key Lease Metrics */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Key Lease Metrics</p>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Adjusted Cap Cost</p>
              <p className="text-base font-black text-slate-800">${fmtShort(adjustedCapCost)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">What you're actually financing</p>
            </div>
            <div className={`rounded-xl border ${aprBorderClass} ${aprBgClass} px-4 py-3`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Money Factor / APR</p>
              <p className={`text-base font-black ${aprColorClass}`}>{fmtMF(moneyFactorUsed)}</p>
              <p className={`text-[10px] mt-0.5 ${aprColorClass}`}>{aprDisplay.toFixed(2)}% equivalent APR</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Lease Cost</p>
              <p className="text-base font-black text-red-700">${fmtShort(totalLeaseCost)}</p>
              <p className="text-[10px] text-red-500 mt-0.5">All-in over {leaseTerm} months</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Residual Value</p>
              <p className="text-base font-black text-blue-700">${fmtShort(residualValue)}</p>
              <p className="text-[10px] text-blue-500 mt-0.5">{residualValuePct.toFixed(1)}% of MSRP at lease end</p>
            </div>
          </div>
        </div>

        {/* Cap Cost Comparison */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cap Cost Negotiation Savings</p>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between px-4 py-2.5 text-xs">
              <span className="text-slate-500">MSRP (Sticker)</span>
              <span className="font-bold text-slate-700">${fmtShort(msrp)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 text-xs">
              <span className="text-slate-500">Negotiated Price</span>
              <span className="font-bold text-emerald-600">${fmtShort(negotiatedPrice)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 text-xs bg-emerald-50/50">
              <span className="text-emerald-700 font-semibold">Cap Cost Savings</span>
              <span className="font-black text-emerald-700">${fmtShort(msrp - negotiatedPrice)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 text-xs">
              <span className="text-slate-500">Adjusted Cap Cost (with fees)</span>
              <span className="font-bold text-slate-700">${fmtShort(adjustedCapCost)}</span>
            </div>
          </div>
        </div>

        {/* Base payment note */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-600">
            <span className="font-bold text-slate-800">Pre-tax base payment: ${fmt(baseMonthlyPayment)}</span>
            {hasMonthlyTax && (
              <> + ${fmt(monthlyTax)} tax = <span className="font-bold">${fmt(totalMonthlyPayment)}/mo total</span></>
            )}
            {' '}over {leaseTerm} months.
            Total lease cost of ${fmtShort(totalLeaseCost)} includes all payments and drive-off amounts.
          </p>
        </div>

        {/* Lease vs Buy Quick Reference */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Lease vs. Buy Quick Reference</p>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { factor: 'Monthly Payment', lease: 'Lower (pay only depreciation + finance)', buy: 'Higher (pay full vehicle cost)' },
              { factor: 'Vehicle Ownership', lease: 'Lessor owns — you return at end', buy: 'You own — keep or sell anytime' },
              { factor: 'Mileage Limits', lease: '10K–15K mi/yr — excess fees apply', buy: 'No limits — drive as much as you want' },
              { factor: 'Maintenance', lease: 'Often covered under warranty', buy: 'Your responsibility after warranty' },
              { factor: 'Long-Term Cost', lease: 'Always paying — never an asset', buy: 'Higher upfront, cheaper long-term' },
              { factor: 'Best For', lease: 'New car every 2–3 years, lower payment', buy: 'Keeping car 5+ years, unlimited miles' },
            ].map((row) => (
              <div key={row.factor} className="grid grid-cols-3 gap-2 px-4 py-2 text-[11px]">
                <span className="font-bold text-slate-600">{row.factor}</span>
                <span className="text-blue-600">{row.lease}</span>
                <span className="text-emerald-600">{row.buy}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
