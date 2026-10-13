import type { CalculatorResult } from '../../../types/calculator';
import MiniDonut from '../../../components/calculator/MiniDonut';
import { FBA_CATEGORY_LABELS, computeFba, isFbaCategory, weightBand, type FbaCategory } from './fbaMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const money = (n: number) =>
  `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AmazonFBAPanel({ values, results }: Props) {
  if (!results.length) return null;

  const sellingPrice = parseFloat(values.sellingPrice);
  const productCost = parseFloat(values.productCost);
  const weight = parseFloat(values.weight);
  const volume = parseFloat(values.volume);
  if (!(sellingPrice > 0) || !(productCost >= 0) || !(weight > 0)) return null;
  const category: FbaCategory = isFbaCategory(values.category) ? values.category : 'general';

  const f = computeFba(sellingPrice, productCost, weight, category, Number.isFinite(volume) ? volume : 0);
  const marginColor = f.marginPct > 20 ? 'text-emerald-700' : f.marginPct > 10 ? 'text-amber-700' : 'text-red-700';
  const feePct = (f.totalFees / sellingPrice) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-100/50">
        <span className="text-xs font-bold uppercase tracking-widest text-orange-700">Amazon FBA Fee Breakdown</span>
      </div>

      <div className="p-5 space-y-4">
        <div
          className={`rounded-xl border-2 px-4 py-3 text-center ${
            f.netProfit > 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'
          }`}
        >
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-600 mb-0.5">Net Profit per Unit</div>
          <div className={`text-2xl font-black ${f.netProfit > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {money(f.netProfit)}
          </div>
          <div className="flex justify-center gap-4 mt-1">
            <span className="text-xs text-slate-600">
              Margin: <strong className={marginColor}>{f.marginPct.toFixed(1)}%</strong>
            </span>
            <span className="text-xs text-slate-600">
              ROI: <strong className="text-slate-700">{f.roiPct.toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">
            Where the selling price goes
          </p>
          <MiniDonut
            donut={{
              segments: [
                { label: 'Amazon fees', value: f.totalFees, color: '#b91c1c' },
                { label: 'Product cost', value: productCost, color: '#b45309' },
                { label: 'Profit', value: Math.max(0, f.netProfit), color: '#047857' },
              ],
              centerLabel: 'of sale',
              formatValue: money,
              caption: 'Amazon fees, product cost and profit as shares of the selling price',
            }}
          />
        </div>

        <div className={`grid gap-2 ${f.closing > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
          <div className="rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-2 text-center">
            <div className="text-[9px] uppercase tracking-wider font-bold text-red-700">Referral</div>
            <div className="text-sm font-black text-red-700">{money(f.referral)}</div>
            <div className="text-[9px] text-slate-600">{FBA_CATEGORY_LABELS[category]}</div>
          </div>
          {f.closing > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-2 text-center">
              <div className="text-[9px] uppercase tracking-wider font-bold text-red-700">Closing fee</div>
              <div className="text-sm font-black text-red-700">{money(f.closing)}</div>
              <div className="text-[9px] text-slate-600">Media</div>
            </div>
          )}
          <div className="rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-2 text-center">
            <div className="text-[9px] uppercase tracking-wider font-bold text-red-700">FBA Fee</div>
            <div className="text-sm font-black text-red-700">{money(f.fulfillment)}</div>
            <div className="text-[9px] text-slate-600">{weight.toFixed(1)} lbs (illustrative)</div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-2 text-center">
            <div className="text-[9px] uppercase tracking-wider font-bold text-red-700">Storage</div>
            <div className="text-sm font-black text-red-700">{money(f.storage)}</div>
            <div className="text-[9px] text-slate-600">1 month, illustrative</div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-slate-600 mb-0.5">
            <span>Total Amazon Fees</span>
            <span className="font-bold text-red-700">{money(f.totalFees)}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-red-600"
              style={{ width: `${Math.min(100, feePct)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">Fees as % of price: {feePct.toFixed(1)}%</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
            <div className="text-[9px] uppercase tracking-wider font-bold text-slate-600">Weight band</div>
            <div className="text-sm font-black text-slate-800">{weightBand(weight)}</div>
            <div className="text-[10px] text-slate-600">Size tier also depends on dimensions</div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center">
            <div className="text-[9px] uppercase tracking-wider font-bold text-amber-800">Q4 Storage</div>
            <div className="text-sm font-black text-amber-800">Higher rates</div>
            <div className="text-[10px] text-amber-800">Oct-Dec storage costs several times more</div>
          </div>
        </div>
      </div>
    </div>
  );
}
