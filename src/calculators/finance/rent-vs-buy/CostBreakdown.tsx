// ─── Side-by-side cost breakdown ──────────────────────────────────────────────

export interface RVBData {
  breakEvenYear: number;
  yearRange: number;
  chartData: { year: number; cumulativeRentCost: number; cumulativeBuyCost: number }[];
  selectedYear: number;
  buyingCostAtHorizon: number;
  rentingCostAtHorizon: number;
  difference: number;
  cheaperOption: 'buy' | 'rent';
  homePrice: number;
  downPayment: number;
  closingCosts: number;
  loanAmount: number;
  monthlyRent: number;
  annualRentIncrease: number;
  rentersInsurance: number;
  mortgageRate: number;
  propertyTaxRate: number;
  maintenancePct: number;
  pmiRate: number;
  downPaymentPct: number;
  sellingCostsPct: number;
  homeAppreciationRate: number;
  homeValueAtHorizon: number;
  /** Cumulative components at the selected year, computed by the shared model (never re-derived here). */
  breakdown: {
    rentOnly: number;
    rentersInsurance: number;
    investmentGain: number;
    mortgagePaid: number;
    tax: number;
    insurance: number;
    maintenance: number;
    pmi: number;
    saleProceeds: number;
    upfront: number;
  };
}

export function fmtDollar(n: number, compact = false): string {
  const abs = Math.abs(n);
  if (compact) {
    if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  }
  const formatted = abs.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return `${n < 0 ? '-' : ''}$${formatted}`;
}

export function fmtDollarFull(n: number): string {
  return fmtDollar(n, false);
}

export function CostBreakdown({ data }: { data: RVBData }) {
  const { selectedYear: y, buyingCostAtHorizon, rentingCostAtHorizon, cheaperOption, breakdown: b } = data;
  const totalRentPaid = b.rentOnly;
  const totalRentersInsurance = b.rentersInsurance;
  const totalMortgagePaid = b.mortgagePaid;
  const totalTax = b.tax;
  const totalMaintenance = b.maintenance;
  const totalPmi = b.pmi;
  const saleProceeds = b.saleProceeds;
  const upfrontCosts = b.upfront;

  const total = buyingCostAtHorizon;
  const maxVal = Math.max(Math.abs(buyingCostAtHorizon), Math.abs(rentingCostAtHorizon), 1);
  const buyPct = Math.min(100, (Math.abs(buyingCostAtHorizon) / maxVal) * 100);
  const rentPct = Math.min(100, (Math.abs(rentingCostAtHorizon) / maxVal) * 100);

  const rowCls = 'flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0 text-sm';
  const labelCls = 'text-slate-600';
  const valCls = 'font-semibold text-slate-700';
  const negValCls = 'font-semibold text-emerald-700';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Renting column */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-3">
            Renting for {y} Year{y !== 1 ? 's' : ''}
          </p>
          <div className="space-y-0.5">
            <div className={rowCls}>
              <span className={labelCls}>Total rent paid</span>
              <span className={valCls}>{fmtDollarFull(totalRentPaid)}</span>
            </div>
            <div className={rowCls}>
              <span className={labelCls}>Renter's insurance</span>
              <span className={valCls}>{fmtDollarFull(totalRentersInsurance)}</span>
            </div>
            <div className={rowCls}>
              <span className={labelCls}>Growth on down payment + closing costs if invested at 7%</span>
              <span className={negValCls}>&minus;{fmtDollarFull(b.investmentGain)}</span>
            </div>
            <div className="flex justify-between items-center py-2 mt-1 border-t-2 border-blue-300">
              <span className="font-bold text-slate-700 text-sm">Net cost (rent minus invested growth)</span>
              <span className="font-black text-blue-700 text-sm">{fmtDollarFull(rentingCostAtHorizon)}</span>
            </div>
          </div>
        </div>

        {/* Buying column */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
            Buying for {y} Year{y !== 1 ? 's' : ''}
          </p>
          <div className="space-y-0.5">
            <div className={rowCls}>
              <span className={labelCls}>Down payment + closing</span>
              <span className={valCls}>{fmtDollarFull(upfrontCosts)}</span>
            </div>
            <div className={rowCls}>
              <span className={labelCls}>Mortgage payments (P&amp;I)</span>
              <span className={valCls}>{fmtDollarFull(totalMortgagePaid)}</span>
            </div>
            <div className={rowCls}>
              <span className={labelCls}>Property taxes</span>
              <span className={valCls}>{fmtDollarFull(totalTax)}</span>
            </div>
            <div className={rowCls}>
              <span className={labelCls}>Homeowner&apos;s insurance</span>
              <span className={valCls}>{fmtDollarFull(b.insurance)}</span>
            </div>
            <div className={rowCls}>
              <span className={labelCls}>Maintenance &amp; upkeep</span>
              <span className={valCls}>{fmtDollarFull(totalMaintenance)}</span>
            </div>
            {totalPmi > 0 && (
              <div className={rowCls}>
                <span className={labelCls}>PMI (until 80% LTV)</span>
                <span className={valCls}>{fmtDollarFull(totalPmi)}</span>
              </div>
            )}
            <div className={rowCls}>
              <span className={labelCls}>Sale proceeds (equity)</span>
              <span className={negValCls}>&minus;{fmtDollarFull(saleProceeds)}</span>
            </div>
            <div className="flex justify-between items-center py-2 mt-1 border-t-2 border-emerald-300">
              <span className="font-bold text-slate-700 text-sm">Net cost after sale</span>
              <span className={`font-black text-sm ${total < 0 ? 'text-emerald-700' : 'text-slate-700'}`}>
                {fmtDollarFull(total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Cost Comparison</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 w-14 shrink-0">Renting</span>
            <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${cheaperOption === 'rent' ? 'bg-blue-400' : 'bg-blue-300'}`}
                style={{ width: `${rentPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-blue-700 w-20 text-right shrink-0">
              {fmtDollar(rentingCostAtHorizon, true)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 w-14 shrink-0">Buying</span>
            <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${cheaperOption === 'buy' ? 'bg-emerald-400' : 'bg-emerald-300'}`}
                style={{ width: `${buyPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-700 w-20 text-right shrink-0">
              {fmtDollar(buyingCostAtHorizon, true)}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          {cheaperOption === 'buy'
            ? `Buying saves you ${fmtDollar(Math.abs(buyingCostAtHorizon - rentingCostAtHorizon), true)} over ${y} years.`
            : `Renting saves you ${fmtDollar(Math.abs(buyingCostAtHorizon - rentingCostAtHorizon), true)} over ${y} years.`}
        </p>
      </div>
    </div>
  );
}
