import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { parseAmount as parseVal } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function TexasMortgagePanel({ values, results }: Props) {
  const monthlyRes = results.find((r) => r.id === 'monthlyPayment');
  const totalMonthlyRes = results.find((r) => r.id === 'totalMonthly');
  const loanRes = results.find((r) => r.id === 'loanAmount');
  const interestRes = results.find((r) => r.id === 'totalInterest');
  const totalCostRes = results.find((r) => r.id === 'totalCost');
  const taxNoteRes = results.find((r) => r.id === 'propertyTaxNote');

  if (!monthlyRes || !interestRes || !totalCostRes) return null;

  const loanAmount = parseVal(loanRes?.value || '$0');
  const totalInterest = parseVal(interestRes.value);
  const totalCost = parseVal(totalCostRes.value);
  const monthlyPI = parseVal(monthlyRes.value);
  const totalMonthly = totalMonthlyRes ? parseVal(totalMonthlyRes.value) : monthlyPI;

  const rate = (parseFloat(values.interestRate) || 0) / 100;
  const term = parseInt(values.loanTerm || '30', 10);

  const amortSchedule = useMemo(() => {
    if (!loanAmount || !rate) return [];
    const monthlyRate = rate / 12;
    if (monthlyRate === 0) return [];
    const n = term * 12;
    const pmt = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    if (!pmt || !isFinite(pmt)) return [];

    const data: Array<{ year: number; balance: number; interest: number; paid: number }> = [];
    let balance = loanAmount;
    let totalInt = 0;

    for (let y = 1; y <= term; y++) {
      for (let m = 0; m < 12; m++) {
        if (balance <= 0.01) break;
        const intPortion = balance * monthlyRate;
        const prinPortion = pmt - intPortion;
        totalInt += intPortion;
        balance -= prinPortion;
      }
      if (balance < 0) balance = 0;
      data.push({ year: y, balance: Math.round(balance), interest: Math.round(totalInt), paid: Math.round(loanAmount - balance) });
    }
    return data;
  }, [loanAmount, rate, term]);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const chartWidth = 400;
  const chartHeight = 160;
  const padL = 55;
  const padR = 10;
  const padT = 10;
  const padB = 25;
  const innerW = chartWidth - padL - padR;
  const innerH = chartHeight - padT - padB;
  const maxVal = loanAmount;
  const maxYear = amortSchedule.length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <BarChart3 size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Loan Breakdown
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Monthly P&amp;I</p>
            <p className="text-lg font-black text-blue-700">{fmt(monthlyPI)}</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Monthly w/ Tax &amp; PMI</p>
            <p className="text-lg font-black text-amber-700">{fmt(totalMonthly)}</p>
          </div>
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Total Interest</p>
            <p className="text-lg font-black text-red-600">{fmt(totalInterest)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Cost</p>
            <p className="text-lg font-black text-slate-700">{fmt(totalCost)}</p>
          </div>
        </div>

        {taxNoteRes && (
          <div className="rounded-xl bg-orange-50 border border-orange-200 px-5 py-3 text-center">
            <p className="text-xs text-orange-700 font-bold">Texas Property Taxes: <span className="font-black">{taxNoteRes.value}</span></p>
            <p className="text-[10px] text-orange-500 mt-0.5">This adds significantly to your true monthly cost</p>
          </div>
        )}

        {amortSchedule.length > 0 && (
          <>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Loan Balance Over Time</p>
              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="Loan amortization chart">
                  {[0, 0.25, 0.5, 0.75, 1].map((g) => {
                    const y = padT + (1 - g) * innerH;
                    return (
                      <g key={g}>
                        <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
                        <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={8} fill="#94a3b8">{fmt(g * maxVal)}</text>
                      </g>
                    );
                  })}
                  {amortSchedule.filter((d) => d.year % 5 === 0).map((d) => {
                    const x = padL + (d.year / maxYear) * innerW;
                    return (
                      <g key={d.year}>
                        <line x1={x} y1={padT} x2={x} y2={padT + innerH} stroke="#e2e8f0" strokeWidth={0.5} />
                        <text x={x} y={padT + innerH + 14} textAnchor="middle" fontSize={8} fill="#94a3b8">Yr {d.year}</text>
                      </g>
                    );
                  })}
                  <defs>
                    <linearGradient id="txGrad" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const area = amortSchedule.map((d, i) =>
                      `${i === 0 ? 'M' : 'L'} ${padL + (d.year / maxYear) * innerW} ${padT + (1 - d.balance / maxVal) * innerH}`
                    ).join(' ');
                    const bottom = `L ${padL + innerW} ${padT + innerH} L ${padL} ${padT + innerH} Z`;
                    return (
                      <>
                        <path d={`${area} ${bottom}`} fill="url(#txGrad)" />
                        <path d={area} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Year by Year</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <th className="text-left px-3 py-2 font-bold text-slate-500 text-[10px]">Year</th>
                      <th className="text-right px-3 py-2 font-bold text-slate-500 text-[10px]">Balance</th>
                      <th className="text-right px-3 py-2 font-bold text-emerald-500 text-[10px]">Paid</th>
                      <th className="text-right px-3 py-2 font-bold text-red-400 text-[10px]">Interest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amortSchedule.filter((_, i) => i % 2 === 0 || i === amortSchedule.length - 1).map((d) => (
                      <tr key={d.year} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-1.5 font-semibold text-slate-600">{d.year}</td>
                        <td className="px-3 py-1.5 text-right font-semibold text-slate-700">{fmt(d.balance)}</td>
                        <td className="px-3 py-1.5 text-right font-semibold text-emerald-600">{fmt(d.paid)}</td>
                        <td className="px-3 py-1.5 text-right font-semibold text-red-500">{fmt(d.interest)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
