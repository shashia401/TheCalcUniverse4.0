import { VAData, fmt } from './vaTypes';

export function DownPaymentImpactTable({ data }: { data: VAData }) {
  const { homePrice, downPaymentPct, vaUseType } = data;

  const scenarios = [
    { label: '0%', pct: 0 },
    { label: '5%', pct: 5 },
    { label: '10%', pct: 10 },
  ];

  function getFeeRate(dpPct: number): number {
    if (dpPct < 5) return vaUseType === 'first' ? 0.0215 : 0.033;
    if (dpPct < 10) return 0.015;
    return 0.0125;
  }

  const selectedBand = downPaymentPct < 5 ? 0 : downPaymentPct < 10 ? 5 : 10;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {['Down Payment', 'Fee Rate', 'Funding Fee $', 'Total Loan'].map((h) => (
              <th scope="col"
                key={h}
                className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-center first:text-left"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scenarios.map((sc) => {
            const feeRate = getFeeRate(sc.pct);
            const dpDollars = homePrice * (sc.pct / 100);
            const base = homePrice - dpDollars;
            const feeAmt = base * feeRate;
            const totalLoan = base + feeAmt;
            const isSelected = sc.pct === selectedBand;

            return (
              <tr
                key={sc.label}
                className={`border-b border-slate-100 last:border-0 ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <td className={`px-3 py-2.5 font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                  {sc.label} {isSelected && <span className="text-[9px] ml-1 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-black">CURRENT</span>}
                </td>
                <td className={`px-3 py-2.5 text-center font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                  {(feeRate * 100).toFixed(2)}%
                </td>
                <td className={`px-3 py-2.5 text-center font-semibold ${isSelected ? 'text-blue-700' : 'text-amber-600'}`}>
                  ${fmt(feeAmt)}
                </td>
                <td className={`px-3 py-2.5 text-center font-bold ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                  ${fmt(totalLoan)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
        <p className="text-[10px] text-slate-500">
          Based on {vaUseType === 'first' ? 'first-time' : 'subsequent'} VA loan use. Funding fee
          rolled into loan for total loan calculation.
        </p>
      </div>
    </div>
  );
}
