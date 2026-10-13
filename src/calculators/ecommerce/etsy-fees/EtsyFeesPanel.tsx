import { CalculatorResult } from '../../../types/calculator';
import MiniDonut from '../../../components/calculator/MiniDonut';
import { computeEtsy } from './etsyMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const money = (n: number) =>
  `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function EtsyFeesPanel({ values, results }: Props) {
  if (!results.length) return null;
  const itemPrice = parseFloat(values.itemPrice);
  const f = computeEtsy(
    itemPrice,
    parseFloat(values.shippingCharged) || 0,
    parseFloat(values.materialCost) || 0,
    parseFloat(values.shippingCost) || 0,
    values.offsiteAds,
  );
  if (!f || !(itemPrice > 0)) return null;
  const cost = f.totalSale - f.netProfit - f.totalFees; // materials + your postage
  const showOffsite = values.offsiteAds !== 'no';

  const rows = [
    { id: 'listingFee', label: 'Listing Fee', value: f.listingFee },
    { id: 'transactionFee', label: 'Transaction Fee (6.5% of item)', value: f.transactionFee },
    { id: 'paymentFee', label: 'Payment Processing (3% + $0.25)', value: f.paymentFee },
    ...(showOffsite ? [{ id: 'offsiteAdsFee', label: 'Offsite Ads Fee', value: f.offsiteAdsFee }] : []),
    { id: 'shippingFee', label: 'Transaction Fee on Shipping (6.5%)', value: f.shippingFee },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Revenue Breakdown</span>
        </div>
        <div className="p-6">
          <MiniDonut
            donut={{
              segments: [
                { label: 'Etsy fees', value: f.totalFees, color: '#b91c1c' },
                { label: 'Your costs', value: cost, color: '#c2410c' },
                { label: 'Your profit', value: Math.max(0, f.netProfit), color: '#047857' },
              ],
              centerLabel: 'total sale',
              formatValue: money,
              caption: `Etsy fees, your costs and your profit as shares of the ${money(f.totalSale)} total sale`,
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-emerald-700 to-green-800 shadow-lg p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Take Home Per Item</p>
        <p className="text-4xl font-black mt-2">{money(f.netProfit)}</p>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-emerald-400/30">
          <div>
            <p className="text-[10px] text-emerald-100">Total Sale</p>
            <p className="text-sm font-bold">{money(f.totalSale)}</p>
          </div>
          <div>
            <p className="text-[10px] text-emerald-100">Profit Margin</p>
            <p className="text-sm font-bold">{f.marginPct.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-emerald-100">Total Fees</p>
            <p className="text-sm font-bold">{money(f.totalFees)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Fee Breakdown</span>
        </div>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Fee breakdown table">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-6 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Fee Type</th>
                <th scope="col" className="text-right px-6 py-3 font-bold text-red-700 uppercase tracking-wider text-[10px]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-6 py-3 font-medium text-slate-700">{row.label}</td>
                  <td className="px-6 py-3 text-right font-bold text-red-700">{money(row.value)}</td>
                </tr>
              ))}
              <tr className="bg-red-50 border-t-2 border-red-200">
                <td className="px-6 py-3 font-bold text-slate-700">Total Fees</td>
                <td className="px-6 py-3 text-right font-black text-red-700">{money(f.totalFees)}</td>
              </tr>
              <tr className="bg-emerald-50">
                <td className="px-6 py-3 font-bold text-slate-700">Net Profit</td>
                <td className={`px-6 py-3 text-right font-black ${f.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{money(f.netProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {showOffsite && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Offsite Ads Impact</p>
          <p className="text-lg font-black text-amber-900 mt-1">{money(f.offsiteAdsFee)}</p>
          <p className="text-[11px] text-amber-800 mt-0.5">
            Charged only when the order comes through an Etsy Offsite Ad. This sale is modelled as one of them.
          </p>
        </div>
      )}
    </div>
  );
}
