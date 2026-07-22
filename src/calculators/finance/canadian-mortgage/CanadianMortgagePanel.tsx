import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseVal(s: string): number {
  return parseFloat(s.replace(/[$%,+\s]/g, '').replace(/,/g, '')) || 0;
}

export default function CanadianMortgagePanel({ values, results }: Props) {
  const paymentRes = results.find((r) => r.id === 'payment');
  const principalRes = results.find((r) => r.id === 'principal');
  const totalInterestRes = results.find((r) => r.id === 'totalInterest');
  const totalPaidRes = results.find((r) => r.id === 'totalPaid');
  const yearsActualRes = results.find((r) => r.id === 'yearsActual');
  const savedInterestRes = results.find((r) => r.id === 'savedInterest');
  const savedYearsRes = results.find((r) => r.id === 'savedYears');

  if (!paymentRes || !totalInterestRes || !totalPaidRes) return null;

  const principal = parseVal(principalRes?.value || '$0');
  const totalInterest = parseVal(totalInterestRes.value);
  const totalPaid = parseVal(totalPaidRes.value);
  const yearsActual = yearsActualRes ? parseFloat(yearsActualRes.value.replace(' years', '')) : 0;
  const savedInterest = savedInterestRes ? parseVal(savedInterestRes.value) : 0;
  const savedYears = savedYearsRes ? parseFloat(savedYearsRes.value.replace(' years', '')) : 0;

  const rate = parseFloat(values.rate) || 0;
  const amortYears = parseInt(values.amortization || '25', 10);

  const amortSchedule = useMemo(() => {
    if (!principal || !rate) return [];
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) return [];
    const annualRate = rate / 100;
    const effectiveAnnual = Math.pow(1 + annualRate / 2, 2) - 1;
    const mRate = Math.pow(1 + effectiveAnnual, 1 / 12) - 1;
    const n = amortYears * 12;
    const monthlyPmt = (principal * mRate * Math.pow(1 + mRate, n)) / (Math.pow(1 + mRate, n) - 1);
    if (!monthlyPmt || !isFinite(monthlyPmt)) return [];

    const data: Array<{ year: number; balance: number; paid: number; interest: number }> = [];
    let balance = principal;
    let totalInterestPaid = 0;

    for (let y = 1; y <= Math.min(amortYears, 30); y++) {
      for (let m = 0; m < 12; m++) {
        if (balance <= 0.01) break;
        const interest = balance * mRate;
        const princ = Math.min(monthlyPmt - interest, balance);
        totalInterestPaid += interest;
        balance -= princ;
      }
      if (balance < 0) balance = 0;
      data.push({
        year: y,
        balance: Math.round(balance),
        paid: Math.round(principal - balance),
        interest: Math.round(totalInterestPaid),
      });
    }
    return data;
  }, [principal, rate, amortYears]);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  // Chart dimensions
  const chartWidth = 400;
  const chartHeight = 180;
  const padL = 55;
  const padR = 10;
  const padT = 10;
  const padB = 25;
  const innerW = chartWidth - padL - padR;
  const innerH = chartHeight - padT - padB;

  const maxBalance = principal;
  const maxYear = amortSchedule.length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <BarChart3 size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Mortgage Amortization
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Principal</p>
            <p className="text-lg font-black text-blue-700">{fmt(principal)}</p>
          </div>
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Total Interest</p>
            <p className="text-lg font-black text-red-600">{fmt(totalInterest)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Cost</p>
            <p className="text-lg font-black text-slate-700">{fmt(totalPaid)}</p>
          </div>
          {yearsActual > 0 && (
            <div className="rounded-xl bg-purple-50 border border-purple-200 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-1">Actual Payoff</p>
              <p className="text-lg font-black text-purple-700">{yearsActual.toFixed(1)} yrs</p>
            </div>
          )}
        </div>

        {savedInterest > 0 && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-center">
            <p className="text-xs text-emerald-700 font-bold">
              Accelerated Bi-Weekly saves {fmt(savedInterest)} in interest and {savedYears.toFixed(0)} years
            </p>
          </div>
        )}

        {amortSchedule.length > 0 && (
          <>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Balance Over Time</p>
              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="Mortgage amortization chart">
                  {[0, 0.25, 0.5, 0.75, 1].map((g) => {
                    const y = padT + (1 - g) * innerH;
                    return (
                      <g key={g}>
                        <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
                        <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={8} fill="#94a3b8">{fmt(g * maxBalance)}</text>
                      </g>
                    );
                  })}
                  {amortSchedule.filter((d, i) => d.year % 5 === 0 || i === amortSchedule.length - 1).map((d) => {
                    const x = padL + (d.year / maxYear) * innerW;
                    return (
                      <g key={d.year}>
                        <line x1={x} y1={padT} x2={x} y2={padT + innerH} stroke="#e2e8f0" strokeWidth={0.5} />
                        <text x={x} y={padT + innerH + 14} textAnchor="middle" fontSize={8} fill="#94a3b8">Yr {d.year}</text>
                      </g>
                    );
                  })}
                  <defs>
                    <linearGradient id="mortGrad" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const points = amortSchedule.map((d) =>
                      `${padL + (d.year / maxYear) * innerW},${padT + (1 - d.balance / maxBalance) * innerH}`
                    ).join(' ');
                    const area = amortSchedule.map((d, i) =>
                      `${i === 0 ? 'M' : 'L'} ${padL + (d.year / maxYear) * innerW} ${padT + (1 - d.balance / maxBalance) * innerH}`
                    ).join(' ');
                    const bottom = `L ${padL + innerW} ${padT + innerH} L ${padL} ${padT + innerH} Z`;
                    return (
                      <>
                        <path d={`${area} ${bottom}`} fill="url(#mortGrad)" />
                        <path d={area} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Amortization Schedule (Year by Year)</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <th className="text-left px-3 py-2 font-bold text-slate-500 text-[10px]">Year</th>
                      <th className="text-right px-3 py-2 font-bold text-slate-500 text-[10px]">Balance</th>
                      <th className="text-right px-3 py-2 font-bold text-slate-500 text-[10px]">Principal Paid</th>
                      <th className="text-right px-3 py-2 font-bold text-red-400 text-[10px]">Interest Paid</th>
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
