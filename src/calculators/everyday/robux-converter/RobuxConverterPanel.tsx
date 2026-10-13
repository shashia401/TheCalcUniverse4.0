import { CalculatorResult } from '../../../types/calculator';
import { PRICES_NOTE, findBestPackage, packagesFor } from './robuxMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function RobuxConverterPanel({ values, results }: Props) {
  const usdRow = results.find((r) => r.id === 'usdValue');
  const rateRow = results.find((r) => r.id === 'effectiveRate');
  const bonusRow = results.find((r) => r.id === 'bonusPercent');
  const mixRow = results.find((r) => r.id === 'packageType');
  const unitsRow = results.find((r) => r.id === 'unitsReceived');

  const amount = parseInt(values.virtualCurrency, 10) || 0;
  // Same price tables as index.ts (robuxMath), not a private copy.
  const { packages, display } = packagesFor(values.currencyType || 'Robux');
  const best = findBestPackage(packages);
  const rates = packages.map((p) => p.cost / p.amount);
  const maxRate = Math.max(...rates);
  const minRate = Math.min(...rates);

  if (!usdRow) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Pack Pricing &amp; Value</span>
      </div>

      <div className="p-5 space-y-5">
        <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-center">
          <p className="text-3xl font-bold font-mono text-blue-800">{usdRow.value}</p>
          <p className="text-lg text-blue-800 font-medium mt-1">for at least {amount.toLocaleString('en-US')} {display}</p>
          {mixRow && <p className="text-sm text-blue-800 mt-2">{mixRow.label}: {mixRow.value}</p>}
          {unitsRow && <p className="text-xs text-blue-800 mt-1">You receive {unitsRow.value}</p>}
          {rateRow && <p className="text-xs text-blue-800 mt-1">{rateRow.label}: {rateRow.value}</p>}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Package Comparison (price per unit)</p>
          <div className="space-y-2">
            {packages.map((pkg) => {
              const rate = pkg.cost / pkg.amount;
              const isBest = pkg === best;
              const barWidth = maxRate > minRate ? 100 - ((rate - minRate) / (maxRate - minRate)) * 90 : 100;
              return (
                <div key={pkg.amount} className={`rounded-lg border p-3 ${isBest ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-bold ${isBest ? 'text-green-800' : 'text-slate-700'}`}>
                      {pkg.amount.toLocaleString('en-US')} units
                      {isBest && <span className="ml-2 text-[10px] bg-green-200 text-green-900 px-1.5 py-0.5 rounded">Lowest $ per unit</span>}
                    </span>
                    <span className={`text-sm font-mono font-bold ${isBest ? 'text-green-800' : 'text-slate-700'}`}>${pkg.cost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${isBest ? 'bg-green-700' : 'bg-blue-700'}`} style={{ width: `${barWidth}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 w-20 text-right">${rate.toFixed(6)}/u</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {bonusRow && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-600">{bonusRow.label}: <span className="font-normal text-slate-700">{bonusRow.value}</span></p>
          </div>
        )}
        <p className="text-[11px] text-slate-600">{PRICES_NOTE}</p>
      </div>
    </div>
  );
}
