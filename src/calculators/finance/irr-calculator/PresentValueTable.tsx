import { PresentValueRow } from './irrTypes';

export function PresentValueTable({ presentValues, npv }: { presentValues: PresentValueRow[]; npv: number }) {
  const fmtD = (n: number) => {
    const abs = Math.abs(n);
    const formatted = abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${n < 0 ? '-' : ''}$${formatted}`;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Year</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Cash Flow</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Discount Factor</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Present Value</th>
          </tr>
        </thead>
        <tbody>
          {presentValues.map((row, i) => (
            <tr
              key={row.year}
              className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
            >
              <td className="px-3 py-2 font-bold text-slate-700">Year {row.year}</td>
              <td className={`px-3 py-2 text-right font-semibold ${row.cashFlow < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {fmtD(row.cashFlow)}
              </td>
              <td className="px-3 py-2 text-right text-slate-500">{row.discountFactor.toFixed(4)}</td>
              <td className={`px-3 py-2 text-right font-semibold ${row.presentValue < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {fmtD(row.presentValue)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={`border-t-2 ${npv >= 0 ? 'border-emerald-400 bg-emerald-50' : 'border-red-400 bg-red-50'}`}>
            <td colSpan={3} className={`px-3 py-2.5 font-black text-sm ${npv >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              Net Present Value (NPV)
            </td>
            <td className={`px-3 py-2.5 text-right font-black text-sm ${npv >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {fmtD(npv)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
