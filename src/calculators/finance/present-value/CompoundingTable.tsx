import { PVData, fmtDollar, fmtDollarCompact, computePV, computeEffectiveRate } from './presentValueTypes';

const COMP_FREQS = [
  { label: 'Annually', m: 1 },
  { label: 'Semi-annually', m: 2 },
  { label: 'Quarterly', m: 4 },
  { label: 'Monthly', m: 12 },
  { label: 'Daily', m: 365 },
];

export function CompoundingTable({ data }: { data: PVData }) {
  const { futureValue, discountRate, periods, compoundingFrequency: selectedM } = data;

  const rows = COMP_FREQS.map(({ label, m }) => {
    const pv = computePV(futureValue, discountRate, periods, m);
    const ear = computeEffectiveRate(discountRate, m);
    return { label, m, pv, ear };
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Present Value by Compounding Frequency &mdash; Same FV, Rate &amp; Period
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Compounding
              </th>
              <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Eff. Annual Rate
              </th>
              <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                PV Required Today
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, m, pv, ear }, i) => {
              const isSelected = m === selectedM;
              return (
                <tr
                  key={m}
                  className={`border-b border-slate-100 last:border-0 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-200'
                      : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                  }`}
                >
                  <td className={`px-4 py-2.5 font-semibold ${isSelected ? 'text-emerald-700' : 'text-slate-700'}`}>
                    {label}
                    {isSelected && (
                      <span className="ml-2 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-500">
                    {(ear * 100).toFixed(4)}%
                  </td>
                  <td className={`px-4 py-2.5 text-right font-bold ${isSelected ? 'text-emerald-700' : 'text-slate-700'}`}>
                    {fmtDollar(pv)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
        <p className="text-[10px] text-slate-500">
          More frequent compounding = higher effective rate = less money needed today. All rows assume FV ={' '}
          {fmtDollarCompact(futureValue)}, {discountRate}% nominal rate, {periods} year{periods !== 1 ? 's' : ''}.
        </p>
      </div>
    </div>
  );
}
