import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface PackageDisplay {
  amount: number;
  cost: number;
  rate: number;
  isBest: boolean;
}

function buildPackages(currencyType: string): PackageDisplay[] {
  let packages: { amount: number; cost: number }[];

  if (currencyType === 'Roblox Premium') {
    packages = [
      { amount: 440, cost: 4.99 },
      { amount: 880, cost: 9.99 },
      { amount: 1870, cost: 19.99 },
      { amount: 4950, cost: 49.99 },
      { amount: 11000, cost: 99.99 },
    ];
  } else if (currencyType === 'V-Bucks') {
    packages = [
      { amount: 1000, cost: 8.99 },
      { amount: 2800, cost: 22.99 },
      { amount: 5000, cost: 36.99 },
      { amount: 13500, cost: 79.99 },
    ];
  } else {
    packages = [
      { amount: 400, cost: 4.99 },
      { amount: 800, cost: 9.99 },
      { amount: 1700, cost: 19.99 },
      { amount: 4500, cost: 49.99 },
      { amount: 10000, cost: 99.99 },
    ];
  }

  const bestRate = Math.min(...packages.map(p => p.cost / p.amount));
  return packages.map(p => ({
    amount: p.amount,
    cost: p.cost,
    rate: p.cost / p.amount,
    isBest: Math.abs(p.cost / p.amount - bestRate) < 0.0001,
  }));
}

function getCurrencyIcon(currencyType: string): string {
  if (currencyType === 'V-Bucks') return 'V';
  if (currencyType === 'Roblox Premium') return 'RP';
  return 'R$';
}

function getCurrencyColor(currencyType: string): string {
  if (currencyType === 'V-Bucks') return '#06b6d4';
  if (currencyType === 'Roblox Premium') return '#f59e0b';
  return '#ef4444';
}

export default function RobuxConverterPanel({ values, results }: Props) {
  const usdRow = results.find(r => r.id === 'usdValue');
  const rateRow = results.find(r => r.id === 'effectiveRate');
  const bestRow = results.find(r => r.id === 'bestPackage');
  const bonusRow = results.find(r => r.id === 'bonusPercent');

  const currencyType = values.currencyType || 'Robux';
  const amount = parseInt(values.virtualCurrency) || 0;
  const packages = buildPackages(currencyType);
  const maxRate = Math.max(...packages.map(p => p.rate));
  const minRate = Math.min(...packages.map(p => p.rate));
  const icon = getCurrencyIcon(currencyType);
  const color = getCurrencyColor(currencyType);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Currency Conversion &amp; Value Analysis</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Main Result Card */}
        {usdRow && (
          <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-3">
              <span className="text-2xl font-bold" style={{ color }}>{icon}</span>
            </div>
            <p className="text-3xl font-bold font-mono text-blue-700">{usdRow.value}</p>
            <p className="text-lg text-blue-500 font-medium mt-1">
              = {amount.toLocaleString()} {(values.currencyType === 'V-Bucks' ? 'V-Bucks' : values.currencyType === 'Roblox Premium' ? 'Robux (Premium)' : 'Robux')}
            </p>
            {rateRow && (
              <p className="text-sm text-blue-400 mt-2">Rate: {rateRow.value} per unit</p>
            )}
          </div>
        )}

        {/* If your kid bought this... */}
        {usdRow && amount > 0 && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-1">Parent Perspective</p>
            <p className="text-sm text-orange-700">
              If your child bought {amount.toLocaleString()} {(values.currencyType === 'V-Bucks' ? 'V-Bucks' : 'Robux')}, they spent <strong>{usdRow.value}</strong> in total.
              {bonusRow && values.currencyType === 'Roblox Premium' && (
                <span className="block mt-1 text-orange-600">With Premium, they received bonus currency for the same price.</span>
              )}
            </p>
          </div>
        )}

        {/* Package Comparison Bars */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Package Comparison</p>
          <div className="space-y-2">
            {packages.map((pkg, i) => {
              const rateFraction = maxRate > minRate ? (pkg.rate - minRate) / (maxRate - minRate) : 0;
              const barWidth = 100 - rateFraction * 90; // best = widest bar
              return (
                <div
                  key={`item-${i}`}
                  className={`rounded-lg border p-3 ${pkg.isBest ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-bold ${pkg.isBest ? 'text-green-700' : 'text-slate-700'}`}>
                      {pkg.amount.toLocaleString()} units
                      {pkg.isBest && <span className="ml-2 text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded">Best Value</span>}
                    </span>
                    <span className={`text-sm font-mono font-bold ${pkg.isBest ? 'text-green-700' : 'text-slate-600'}`}>
                      ${pkg.cost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pkg.isBest ? 'bg-green-400' : 'bg-blue-400'}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 w-16 text-right">
                      ${pkg.rate.toFixed(6)}/u
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        {bonusRow && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-2">
              <svg aria-hidden="true" className="w-4 h-4 text-slate-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs font-bold text-slate-500">{bonusRow.label}:</p>
                <p className="text-sm text-slate-700">{bonusRow.value}</p>
                {bestRow && (
                  <p className="text-xs text-slate-500 mt-1">
                    {bestRow.label}: {bestRow.value}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
