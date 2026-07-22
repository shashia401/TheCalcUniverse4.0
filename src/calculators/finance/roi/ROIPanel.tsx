import { TrendingUp } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseVal(s: string): number {
  return parseFloat(s.replace(/[$%,+\s-]/g, '').replace(/,/g, '')) || 0;
}

export default function ROIPanel({ values, results }: Props) {
  if (!results.length) return null;

  const roiRes = results.find((r) => r.id === 'roi');
  const profitRes = results.find((r) => r.id === 'netProfit');
  const multRes = results.find((r) => r.id === 'multiplier');
  const annualizedRes = results.find((r) => r.id === 'annualizedRoi');

  if (!roiRes || !profitRes || !multRes) return null;

  const invested = parseFloat(values.amountInvested) || 0;
  const returned = parseFloat(values.amountReturned) || 0;
  const roi = parseVal(roiRes.value) / 100;
  const netProfit = parseVal(profitRes.value);
  const multiplier = multRes ? parseFloat(multRes.value.replace('x', '')) : 0;
  const annualized = annualizedRes ? parseVal(annualizedRes.value) / 100 : 0;

  const isPositive = roi >= 0;
  const maxBar = Math.max(invested, returned, 1);
  const bar = (v: number) => (v / maxBar) * 100;

  const fmtD = (n: number) =>
    Math.abs(n).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingUp size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Investment Performance
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-red-600">Amount Invested</span>
              <span className="text-xs font-bold text-slate-700">{fmtD(invested)}</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-red-400" style={{ width: `${bar(invested)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-600">Amount Returned</span>
              <span className="text-xs font-bold text-slate-700">{fmtD(returned)}</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${bar(returned)}%` }} />
            </div>
          </div>
        </div>

        <div className={`rounded-xl px-5 py-4 border text-center ${
          isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm font-black ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
            {isPositive ? '+' : ''}{(roi * 100).toFixed(2)}% ROI
          </p>
          <p className={`text-xs mt-1 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPositive ? `Profit: ` : `Loss: `}{fmtD(netProfit)} &middot; {multiplier.toFixed(2)}x multiplier
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Multiplier</p>
            <p className="text-lg font-black text-slate-700">{multiplier.toFixed(2)}x</p>
          </div>
          {annualizedRes && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Annualized</p>
              <p className="text-lg font-black text-blue-700">{(annualized * 100).toFixed(2)}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
