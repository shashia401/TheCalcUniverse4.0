import { TrendingUp } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { computeRoi } from './roiMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const fmtD = (n: number) =>
  Math.abs(n).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function ROIPanel({ values, results }: Props) {
  if (!results.length) return null;

  const invested = parseFloat(values.amountInvested);
  const returned = parseFloat(values.amountReturned);
  if (!(invested > 0) || !Number.isFinite(returned)) return null;
  const years = parseFloat(values.years) || 0;
  const { totalRoiPct, netProfit, multiplier, annualizedPct } = computeRoi(invested, returned, years);
  const hasAnnualized = results.some((r) => r.id === 'annualizedRoi');

  const isPositive = totalRoiPct >= 0;
  const maxBar = Math.max(invested, returned, 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingUp size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Investment Performance
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <HBarRow label="Amount Invested" value={invested} max={maxBar} display={fmtD(invested)} color="bg-red-700" />
          <HBarRow label="Amount Returned" value={returned} max={maxBar} display={fmtD(returned)} color="bg-emerald-700" />
        </div>

        <div className={`rounded-xl px-5 py-4 border text-center ${
          isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm font-black ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
            {isPositive ? '+' : '-'}{Math.abs(totalRoiPct).toFixed(2)}% ROI
          </p>
          <p className={`text-xs mt-1 ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
            {isPositive ? 'Profit: ' : 'Loss: '}{fmtD(netProfit)} &middot; {multiplier.toFixed(2)}x multiplier
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Multiplier</p>
            <p className="text-lg font-black text-slate-700">{multiplier.toFixed(2)}x</p>
          </div>
          {hasAnnualized && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">Annualized</p>
              <p className="text-lg font-black text-blue-700">
                {annualizedPct >= 0 ? '+' : '-'}{Math.abs(annualizedPct).toFixed(2)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
