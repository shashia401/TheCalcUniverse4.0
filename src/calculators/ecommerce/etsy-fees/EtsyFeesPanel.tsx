import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function EtsyFeesPanel({ values, results }: Props) {
  const listingFee = results.find((r) => r.id === 'listingFee')?.value ?? '$0.00';
  const transactionFee = results.find((r) => r.id === 'transactionFee')?.value ?? '$0.00';
  const paymentFee = results.find((r) => r.id === 'paymentFee')?.value ?? '$0.00';
  const offsiteAdsFee = results.find((r) => r.id === 'offsiteAdsFee')?.value ?? '$0.00';
  const shippingFee = results.find((r) => r.id === 'shippingFee')?.value ?? '$0.00';
  const totalFees = results.find((r) => r.id === 'totalFees')?.value ?? '$0.00';
  const netProfit = results.find((r) => r.id === 'netProfit')?.value ?? '$0.00';
  const profitMargin = results.find((r) => r.id === 'profitMargin')?.value ?? '0%';
  const totalSale = results.find((r) => r.id === 'totalSale')?.value ?? '$0.00';

  const totalFeesNum = parseFloat(totalFees.replace(/[^0-9.-]/g, ''));
  const netProfitNum = parseFloat(netProfit.replace(/[^0-9.-]/g, ''));
  const totalSaleNum = parseFloat(totalSale.replace(/[^0-9.-]/g, ''));
  const materialCost = parseFloat(values.materialCost || '0');

  const showOffsite = values.offsiteAds !== 'no';

  // Pie chart calculations (as fractions of total sale)
  const etsyCut = totalFeesNum;
  const costs = materialCost;
  const profit = netProfitNum;
  const total = Math.max(totalSaleNum, 1);

  const etsyPct = (etsyCut / total) * 100;
  const costPct = (costs / total) * 100;
  const profitPct = (profit / total) * 100;

  // SVG pie chart segments
  const sum = etsyCut + costs + profit;
  const etsyAngle = (etsyCut / Math.max(sum, 1)) * 360;
  const costAngle = (costs / Math.max(sum, 1)) * 360;
  const profitAngle = (profit / Math.max(sum, 1)) * 360;

  // Arc path helper
  function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  let s1 = 0;
  const p1 = arcPath(60, 60, 55, s1, s1 + etsyAngle);
  s1 += etsyAngle;
  const p2 = arcPath(60, 60, 55, s1, s1 + costAngle);
  s1 += costAngle;
  const p3 = arcPath(60, 60, 55, s1, s1 + profitAngle);

  // Handle edge cases where there are no fees or costs
  const onlyProfit = etsyCut <= 0 && costs <= 0 && profit > 0;
  const onlyFees = etsyCut > 0 && costs <= 0 && profit <= 0;

  const rows = [
    { id: 'listingFee', label: 'Listing Fee', value: listingFee, color: '#ef4444' },
    { id: 'transactionFee', label: 'Transaction Fee (6.5%)', value: transactionFee, color: '#ef4444' },
    { id: 'paymentFee', label: 'Payment Processing (3% + $0.25)', value: paymentFee, color: '#ef4444' },
    ...(showOffsite ? [{ id: 'offsiteAdsFee' as const, label: `Offsite Ads Fee`, value: offsiteAdsFee, color: '#ef4444' }] : []),
    { id: 'shippingFee', label: 'Shipping Fee (6.5%)', value: shippingFee, color: '#ef4444' },
  ];

  return (
    <div className="space-y-5">
      {/* Profit Margin Pie Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <svg width="16" aria-hidden="true" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0 1 10 10" />
            <path d="M12 12 7.5 7.5" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Revenue Breakdown</span>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-8">
            {/* SVG Pie Chart */}
            <div className="shrink-0">
              <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`Revenue breakdown pie chart: Etsy fees ${totalFees}, profit margin ${profitMargin}`}>
                {sum > 0 && !onlyProfit && !onlyFees && (
                  <>
                    <path d={p1} fill="#ef4444" opacity="0.85" />
                    <path d={p2} fill="#f97316" opacity="0.85" />
                    <path d={p3} fill="#22c55e" opacity="0.85" />
                  </>
                )}
                {onlyProfit && <circle cx="60" cy="60" r="55" fill="#22c55e" opacity="0.85" />}
                {onlyFees && <circle cx="60" cy="60" r="55" fill="#ef4444" opacity="0.85" />}
                <circle cx="60" cy="60" r="20" className="fill-white dark:fill-slate-800" />
                <text x="60" y="56" textAnchor="middle" fill="#475569" fontSize="10" fontWeight="bold">{profitMargin}</text>
                <text x="60" y="68" textAnchor="middle" fill="#94a3b8" fontSize="8">Margin</text>
              </svg>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: '#ef4444' }} />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-600">Etsy's Cut (Fees)</p>
                  <p className="text-xs text-slate-800 font-bold">{totalFees} <span className="text-[10px] text-slate-500 font-normal">({etsyPct.toFixed(1)}%)</span></p>
                </div>
              </div>
              {materialCost > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: '#f97316' }} />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-600">Your Costs</p>
                    <p className="text-xs text-slate-800 font-bold">${materialCost.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">({costPct.toFixed(1)}%)</span></p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: '#22c55e' }} />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-600">Your Profit</p>
                  <p className="text-xs text-slate-800 font-bold">{netProfit} <span className="text-[10px] text-slate-500 font-normal">({profitPct.toFixed(1)}%)</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Take Home Card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 shadow-lg p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">Take Home Per Item</p>
        <p className="text-4xl font-black mt-2">{netProfit}</p>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-emerald-400/30">
          <div>
            <p className="text-[10px] text-emerald-200">Total Sale</p>
            <p className="text-sm font-bold">{totalSale}</p>
          </div>
          <div>
            <p className="text-[10px] text-emerald-200">Profit Margin</p>
            <p className="text-sm font-bold">{profitMargin}</p>
          </div>
          <div>
            <p className="text-[10px] text-emerald-200">Total Fees</p>
            <p className="text-sm font-bold text-emerald-200">{totalFees}</p>
          </div>
        </div>
      </div>

      {/* Results Breakdown Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <svg width="16" aria-hidden="true" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 3v18" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Fee Breakdown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-6 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Fee Type</th>
                <th scope="col" className="text-right px-6 py-3 font-bold text-red-500 uppercase tracking-wider text-[10px]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: row.color }} />
                      <span className="font-medium text-slate-700">{row.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-red-600">{row.value}</td>
                </tr>
              ))}
              <tr className="bg-red-50 border-t-2 border-red-200">
                <td className="px-6 py-3 font-bold text-slate-700">Total Fees</td>
                <td className="px-6 py-3 text-right font-black text-red-600">{totalFees}</td>
              </tr>
              <tr className="bg-emerald-50">
                <td className="px-6 py-3 font-bold text-slate-700">Net Profit</td>
                <td className="px-6 py-3 text-right font-black text-emerald-600">{netProfit}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Offsite Ads Impact */}
      {showOffsite && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-md shadow-amber-200/60 overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <svg width="20" aria-hidden="true" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Offsite Ads Impact</p>
                <p className="text-lg font-black text-amber-700 mt-1">{offsiteAdsFee}</p>
                <p className="text-[10px] text-amber-500 mt-0.5">
                  This sale came from Etsy Offsite Ads — {offsiteAdsFee} in additional fees was charged
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
