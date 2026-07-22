import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function FHAMIPPanel({ results }: Props) {
  if (!results || results.length === 0) return null;

  const totalMonthly = results.find(r => r.id === 'totalMonthly');
  const monthlyPI = results.find(r => r.id === 'monthlyPI');
  const monthlyMIP = results.find(r => r.id === 'monthlyMIP');
  const upfrontMIP = results.find(r => r.id === 'upfrontMIP');
  const mipDuration = results.find(r => r.id === 'mipDuration');

  if (!totalMonthly || !monthlyPI || !monthlyMIP || !upfrontMIP) return null;

  const parseVal = (s: string): number => {
    const cleaned = s.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  const monthlyMIPVal = parseVal(monthlyMIP.value);
  const upfrontMIPVal = parseVal(upfrontMIP.value);
  const totalMonthlyVal = parseVal(totalMonthly.value);
  const monthlyPIVal = parseVal(monthlyPI.value);
  const isLifeOfLoan = mipDuration?.value === 'Life of loan';

  // Total MIP over common periods
  const mip1yr = monthlyMIPVal * 12;
  const mip5yr = monthlyMIPVal * 60;
  const mip10yr = monthlyMIPVal * 120;
  const mipFullTerm = isLifeOfLoan
    ? monthlyMIPVal * 360
    : monthlyMIPVal * 132; // 11 years

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const barMax = Math.max(totalMonthlyVal, 1);

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
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Upfront MIP (1.75%)</p>
          <p className="text-lg font-black text-amber-800">{upfrontMIP.value}</p>
          <p className="text-xs text-amber-600 mt-1">
            {isLifeOfLoan
              ? `Financed into the loan — you pay interest on this amount for the full loan term.`
              : `Financed into the loan and fully paid by the time MIP drops off (11 years).`}
          </p>
        </div>

        {/* Monthly MIP bar */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Monthly MIP vs. P&amp;I</p>
          <div className="h-8 rounded-lg overflow-hidden flex border border-slate-200">
            <div
              className="bg-blue-500 h-full flex items-center justify-start px-3 transition-all"
              style={{ width: `${(monthlyPIVal / barMax) * 100}%` }}
            >
              <span className="text-[9px] text-white font-bold truncate">P&amp;I {monthlyPI.value}</span>
            </div>
            <div
              className="bg-red-400 h-full flex items-center justify-start px-3 transition-all"
              style={{ width: `${(monthlyMIPVal / barMax) * 100}%` }}
            >
              <span className="text-[9px] text-white font-bold truncate">MIP {monthlyMIP.value}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            MIP is {(monthlyMIPVal / Math.max(totalMonthlyVal, 1) * 100).toFixed(1)}% of your total monthly payment
          </p>
        </div>

        {/* MIP cost over time table */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Total MIP Cost Over Time</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
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
                  { period: 'Year 1', mip: mip1yr, cum: mip1yr },
                  { period: 'Year 5', mip: mip5yr, cum: upfrontMIPVal + mip5yr },
                  { period: 'Year 10', mip: mip10yr, cum: upfrontMIPVal + mip10yr },
                  { period: isLifeOfLoan ? 'Full Term (30yr)' : 'Full Term', mip: mipFullTerm, cum: upfrontMIPVal + mipFullTerm },
                ].map((row, i) => (
                  <tr key={`item-${i}`} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-2.5 font-bold text-slate-700">{row.period}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-red-500">${fmt(row.mip)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-amber-600">${fmt(row.cum)}</td>
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
              <span className="text-red-400 mt-0.5">•</span>
              <span><strong>Upfront MIP:</strong> 1.75% of loan, always financed into the balance. You pay interest on this.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">•</span>
              <span><strong>Annual MIP:</strong> {isLifeOfLoan ? '0.55%' : '0.50%'} of loan balance, paid monthly.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">•</span>
              <span><strong>Duration:</strong> {mipDuration?.value ?? 'Life of loan'}. {isLifeOfLoan ? 'MIP lasts the entire loan term if you put less than 10% down.' : 'MIP drops off after 11 years if you put 10% or more down.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">•</span>
              <span><strong>Refinance to remove:</strong> The only way to remove FHA MIP is to refinance into a conventional loan once you have 20% equity.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
