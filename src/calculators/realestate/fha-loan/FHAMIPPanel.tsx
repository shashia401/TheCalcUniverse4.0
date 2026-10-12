import { CalculatorResult } from '../../../types/calculator';
import { parseFha, cumulativeMip } from './fhaMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function FHAMIPPanel({ values, results }: Props) {
  const m = parseFha(values);
  if (!results || results.length === 0 || !m) return null;

  const { monthlyMIP, monthlyPI, upfrontMIP, totalMonthly, lifeOfLoan, annualMipRate } = m;
  const termYears = m.years;

  // Annual MIP is recalculated each year on the scheduled balance, so cumulative totals are below monthlyMIP x months.
  const mip1yr = cumulativeMip(m, 12);
  const mip5yr = cumulativeMip(m, 60);
  const mip10yr = cumulativeMip(m, 120);
  const mipFullTerm = cumulativeMip(m, m.mipMonths);

  const fmt2 = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const barMax = Math.max(totalMonthly, 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">MIP Cost Breakdown</span>
      </div>

      <div className="p-6 space-y-5">

        {/* Upfront MIP highlight */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-1">Upfront MIP (1.75%)</p>
          <p className="text-lg font-black text-amber-800">${fmt2(upfrontMIP)}</p>
          <p className="text-xs text-amber-800 mt-1">
            {lifeOfLoan
              ? `Modeled as financed into the loan — you pay interest on this amount for the full loan term.`
              : `Modeled as financed into the loan and fully paid by the time MIP drops off (11 years).`}
          </p>
        </div>

        {/* Monthly MIP bar */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Monthly MIP vs. P&amp;I</p>
          <div className="h-8 rounded-lg overflow-hidden flex border border-slate-200">
            <div
              className="bg-blue-700 h-full flex items-center justify-start px-3 transition-all"
              style={{ width: `${(monthlyPI / barMax) * 100}%` }}
            >
              <span className="text-[9px] text-white font-bold truncate">P&amp;I ${fmt2(monthlyPI)}</span>
            </div>
            <div
              className="bg-red-700 h-full flex items-center justify-start px-3 transition-all"
              style={{ width: `${(monthlyMIP / barMax) * 100}%` }}
            >
              <span className="text-[9px] text-white font-bold truncate">MIP ${fmt2(monthlyMIP)}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            MIP is {(monthlyMIP / Math.max(totalMonthly, 1) * 100).toFixed(1)}% of your total monthly payment
          </p>
        </div>

        {/* MIP cost over time table */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Total MIP Cost Over Time</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="Total MIP cost over time table">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Period</th>
                  <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Total MIP</th>
                  <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { period: 'Year 1', mip: mip1yr, cum: upfrontMIP + mip1yr },
                  { period: 'Year 5', mip: mip5yr, cum: upfrontMIP + mip5yr },
                  { period: 'Year 10', mip: mip10yr, cum: upfrontMIP + mip10yr },
                  { period: lifeOfLoan ? `Full Term (${termYears}yr)` : 'Years 1–11 (MIP ends)', mip: mipFullTerm, cum: upfrontMIP + mipFullTerm },
                ].map((row, i) => (
                  <tr key={`item-${i}`} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-2.5 font-bold text-slate-700">{row.period}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-red-700">${fmt(row.mip)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-amber-800">${fmt(row.cum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key MIP rules callout */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">MIP Rules</p>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-red-700 mt-0.5">•</span>
              <span><strong>Upfront MIP:</strong> 1.75% of the base loan, usually financed into the balance (as modeled here), so you pay interest on it.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-700 mt-0.5">•</span>
              <span><strong>Annual MIP:</strong> {(annualMipRate * 100).toFixed(2)}% of the base loan a year at your down payment and term, paid monthly and recalculated each year on the scheduled balance.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-700 mt-0.5">•</span>
              <span><strong>Duration:</strong> {lifeOfLoan ? 'Life of loan' : '11 years'}. {lifeOfLoan ? 'MIP lasts the entire loan term if you put less than 10% down.' : 'MIP drops off after 11 years if you put 10% or more down.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-700 mt-0.5">•</span>
              <span><strong>Refinance to remove:</strong> The only way to remove FHA MIP is to refinance into a conventional loan once you have 20% equity.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
