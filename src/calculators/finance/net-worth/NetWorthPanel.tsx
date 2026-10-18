import { Wallet } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { parseAmount as parseVal } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}


export default function NetWorthPanel({ results }: Props) {
  if (!results.length) return null;

  const nwRes = results.find((r) => r.id === 'netWorth');
  const assetsRes = results.find((r) => r.id === 'totalAssets');
  const liabilitiesRes = results.find((r) => r.id === 'totalLiabilities');
  const dtaRes = results.find((r) => r.id === 'debtToAsset');

  if (!nwRes || !assetsRes || !liabilitiesRes) return null;

  const netWorth = parseVal(nwRes.value);
  const totalAssets = parseVal(assetsRes.value);
  const totalLiabilities = parseVal(liabilitiesRes.value);
  const debtToAsset = totalAssets > 0 ? (dtaRes ? parseVal(dtaRes.value) : (totalLiabilities / totalAssets) * 100) : null;

  const isPositive = netWorth >= 0;
  const fmtD = (n: number) =>
    Math.abs(n).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const maxBar = totalAssets + totalLiabilities;
  const assetBarPct = maxBar > 0 ? (totalAssets / maxBar) * 100 : 50;
  const liabilityBarPct = maxBar > 0 ? (totalLiabilities / maxBar) * 100 : 50;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Wallet size={16} className="text-slate-500" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Net Worth Overview
        </span>
      </div>

      <div className="p-6 space-y-5">
        {/* Net Worth Hero */}
        <div className={`rounded-xl px-5 py-4 border text-center ${
          isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-600">Net Worth</p>
          <p className={`text-2xl font-black ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
            {isPositive ? '' : '-'}{fmtD(netWorth)}
          </p>
          <p className={`text-xs mt-1 ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
            {isPositive ? 'You own more than you owe' : 'Liabilities exceed assets'}
          </p>
        </div>

        {/* Stacked bar: Assets vs Liabilities */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Assets vs Liabilities</p>
          <div className="h-8 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="h-full flex items-center justify-center bg-emerald-700"
              style={{ width: `${Math.min(assetBarPct, 100)}%` }}
            >
              {assetBarPct > 20 && (
                <span className="text-[9px] font-bold text-white">Assets {fmtD(totalAssets)}</span>
              )}
            </div>
            <div
              className="h-full flex items-center justify-center bg-red-700"
              style={{ width: `${Math.min(liabilityBarPct, 100)}%` }}
            >
              {liabilityBarPct > 20 && (
                <span className="text-[9px] font-bold text-white">Debts {fmtD(totalLiabilities)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">Total Assets</p>
            <p className="text-lg font-black text-emerald-700">{fmtD(totalAssets)}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-1">Total Liabilities</p>
            <p className="text-lg font-black text-red-700">{fmtD(totalLiabilities)}</p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Debt-to-Asset Ratio</span>
            <span className={`text-sm font-black ${debtToAsset === null ? 'text-slate-600' : debtToAsset > 50 ? 'text-red-700' : 'text-emerald-700'}`}>
              {debtToAsset === null ? 'N/A (no assets)' : `${debtToAsset.toFixed(1)}%`}
            </span>
          </div>
          <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${debtToAsset === null ? 'bg-slate-400' : debtToAsset > 50 ? 'bg-red-600' : 'bg-emerald-600'}`}
              style={{ width: `${debtToAsset === null ? 0 : Math.min(debtToAsset, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-600 mt-1">
            {debtToAsset === null ? 'Ratio is undefined without assets' : debtToAsset <= 20 ? 'Excellent — very low debt' : debtToAsset <= 50 ? 'Healthy — manageable debt level' : 'Elevated — consider reducing debt'}
          </p>
        </div>
      </div>
    </div>
  );
}
