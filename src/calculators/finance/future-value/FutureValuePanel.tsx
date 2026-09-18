import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function FutureValuePanel({ values, results }: Props) {
  const presentValue = parseFloat(values.presentValue) || 0;
  const annualRate = parseFloat(values.annualRate) / 100 || 0;
  const years = parseFloat(values.years) || 0;
  const compounding = parseInt(values.compounding || '12');
  const monthlyContribution = parseFloat(values.monthlyContribution) || 0;

  const pv = values.presentValue;
  const ar = values.annualRate;
  const yr = values.years;
  if ((pv === undefined || pv === null || pv === '') &&
      (ar === undefined || ar === null || ar === '') &&
      (yr === undefined || yr === null || yr === '')) return null;

  const yearlyData = useMemo(() => {
    const data: Array<{ year: number; balance: number; totalContrib: number }> = [];
    const ratePerPeriod = annualRate / compounding;
    const contribPerPeriod = monthlyContribution * (12 / compounding);
    let bal = presentValue;
    for (let y = 1; y <= Math.min(years, 40); y++) {
      for (let p = 1; p <= compounding; p++) {
        bal = bal * (1 + ratePerPeriod) + contribPerPeriod;
      }
      const contribSoFar = presentValue + monthlyContribution * 12 * y;
      data.push({ year: y, balance: bal, totalContrib: contribSoFar });
    }
    return data;
  }, [presentValue, annualRate, years, monthlyContribution, compounding]);

  const fvValue = results.find(r => r.id === 'futureValue')?.value ?? '';
  const earValue = results.find(r => r.id === 'effectiveAnnualRate')?.value ?? '';

  const ratePerPeriod = annualRate / compounding;
  const totalPeriods = years * compounding;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Formula & Growth Breakdown</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Rendered Formula */}
        <div className="rounded-xl bg-slate-800 p-5 overflow-x-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">FV Formula — With Your Numbers</p>
          <div className="text-sm font-mono text-emerald-300 leading-relaxed space-y-1 whitespace-nowrap">
            <p className="text-slate-500">FV = PV × (1 + r/m)^(n×m) + PMT × [((1 + r/m)^(n×m) − 1) / (r/m)]</p>
            <p className="mt-3 text-white">
              FV = {fmtMoney(presentValue)} × (1 + {(annualRate * 100).toFixed(1)}%/{compounding})^({years}×{compounding})
            </p>
            {monthlyContribution > 0 && (
              <p className="text-white">
                &nbsp;&nbsp;&nbsp;&nbsp;+ {fmtMoney(monthlyContribution * 12 / compounding)} × [((1 + {(annualRate * 100).toFixed(1)}%/{compounding})^({years}×{compounding}) − 1) / ({(annualRate * 100).toFixed(1)}%/{compounding})]
              </p>
            )}
            <p className="mt-3 text-white font-bold">
              = <span className="text-emerald-400">{fvValue}</span>
            </p>
          </div>
        </div>

        {/* Step-by-step calculation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Rate per Period</p>
            <p className="text-lg font-black text-slate-800">{(ratePerPeriod * 100).toFixed(4)}%</p>
            <p className="text-[10px] text-slate-500">{annualRate * 100}% ÷ {compounding}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Periods</p>
            <p className="text-lg font-black text-slate-800">{totalPeriods}</p>
            <p className="text-[10px] text-slate-500">{years} yrs × {compounding}/yr</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Effective Annual Rate</p>
            <p className="text-lg font-black text-slate-800">{earValue}</p>
            <p className="text-[10px] text-slate-500">(1 + r/m)^m − 1</p>
          </div>
        </div>

        {/* Growth Chart */}
        {yearlyData.length > 1 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Year-by-Year Growth</p>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Year</th>
                    <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Balance</th>
                    <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Contributions</th>
                    <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyData.map((row, i) => {
                    const growth = row.balance - row.totalContrib;
                    return (
                      <tr key={row.year} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <td className="px-4 py-2.5 font-bold text-slate-700">Year {row.year}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-600">{fmtMoney(row.balance)}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-blue-600">{fmtMoney(row.totalContrib)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-orange-500">{fmtMoney(Math.max(0, growth))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
