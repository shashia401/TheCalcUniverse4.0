import { VAData, fmt, fmtK, calcMonthlyPI } from './vaTypes';

export function ConventionalComparison({ data }: { data: VAData }) {
  const { homePrice, interestRate, loanTerm, principalAndInterest, fundingFeeAmount, fundingFeeExempt } = data;

  const conv20Loan = homePrice * 0.8;
  const conv20PI = calcMonthlyPI(conv20Loan, interestRate, loanTerm);
  const conv20PMI = 0;
  const conv20Down = homePrice * 0.2;
  const conv20Monthly = conv20PI + conv20PMI;

  const conv5Loan = homePrice * 0.95;
  const conv5PI = calcMonthlyPI(conv5Loan, interestRate, loanTerm);
  const conv5PMI = (conv5Loan * 0.007) / 12;
  const conv5Down = homePrice * 0.05;
  const conv5Monthly = conv5PI + conv5PMI;

  const vaMonthly = principalAndInterest;

  const cols = [
    {
      label: 'VA Loan',
      downPayment: 0,
      pmiMonthly: 0,
      fundingFee: fundingFeeExempt ? 0 : fundingFeeAmount,
      piMonthly: vaMonthly,
      totalMonthly: vaMonthly,
      highlight: true,
    },
    {
      label: 'Conventional (20% down)',
      downPayment: conv20Down,
      pmiMonthly: conv20PMI,
      fundingFee: 0,
      piMonthly: conv20PI,
      totalMonthly: conv20Monthly,
      highlight: false,
    },
    {
      label: 'Conventional (5% down)',
      downPayment: conv5Down,
      pmiMonthly: conv5PMI,
      fundingFee: 0,
      piMonthly: conv5PI,
      totalMonthly: conv5Monthly,
      highlight: false,
    },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs min-w-[520px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              Item
            </th>
            {cols.map((c) => (
              <th scope="col"
                key={c.label}
                className={`text-right px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] ${
                  c.highlight ? 'text-blue-600' : 'text-slate-500'
                }`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            {
              label: 'Down Payment',
              values: cols.map((c) => fmtK(c.downPayment)),
              negativeIfNonZero: false,
            },
            {
              label: 'PMI / Month',
              values: cols.map((c) => (c.pmiMonthly > 0 ? `$${fmt(c.pmiMonthly)}` : '$0 &mdash; None')),
              highlight: true,
            },
            {
              label: 'Funding Fee (one-time)',
              values: cols.map((c) => (c.fundingFee > 0 ? `$${fmt(c.fundingFee)}` : 'None')),
            },
            {
              label: 'Monthly P&I',
              values: cols.map((c) => `$${fmt(c.piMonthly)}`),
            },
            {
              label: 'Total Monthly (P&I + PMI)',
              values: cols.map((c) => `$${fmt(c.totalMonthly)}`),
              bold: true,
            },
          ].map((row) => (
            <tr key={row.label} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td className={`px-3 py-2.5 text-slate-600 ${row.bold ? 'font-black' : 'font-medium'}`}>
                {row.label}
              </td>
              {cols.map((c, ci) => {
                const val = row.values[ci];
                const isVA = c.highlight;
                const isPMIRow = row.label.includes('PMI');
                return (
                  <td
                    key={c.label}
                    className={`px-3 py-2.5 text-right ${
                      row.bold ? 'font-black' : 'font-semibold'
                    } ${isVA && isPMIRow ? 'text-emerald-600' : isVA ? 'text-blue-700' : 'text-slate-700'}`}
                  >
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200">
        <p className="text-[10px] text-slate-500">
          PMI assumed at 0.7% annually for 5%-down conventional. Same interest rate used for all
          columns. P&amp;I only &mdash; does not include tax, insurance, or HOA.
        </p>
      </div>
    </div>
  );
}
