import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { buildSchedule, pmt } from '../../../utils/financial';
import SvgLineChart from '../../../components/charts/SvgLineChart';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface TexasData {
  loanAmount: number;
  term: number;
  rate: number;
  monthlyPI: number;
  totalMonthly: number;
  totalInterest: number;
  totalCost: number;
}

const fmt = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtK = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`);

export default function TexasMortgagePanel({ results }: Props) {
  const dataStr = results.find((r) => r.id === '_texasData')?.value;
  const taxNoteRes = results.find((r) => r.id === 'propertyTaxAfter');

  // The calculator publishes its own numbers (_texasData), so nothing is re-derived or parsed from formatted strings.
  const data = useMemo<TexasData | null>(() => {
    try {
      return dataStr ? (JSON.parse(dataStr) as TexasData) : null;
    } catch {
      return null;
    }
  }, [dataStr]);

  const yearly = useMemo(() => {
    if (!data) return [];
    const n = data.term * 12;
    const payment = data.rate > 0 ? pmt(data.loanAmount, data.rate / 12, n) : data.loanAmount / n;
    const rows = buildSchedule(data.loanAmount, data.rate / 12, payment, 0, n);
    const out = [{ year: 0, balance: data.loanAmount, paid: 0, interest: 0 }];
    let interest = 0;
    for (const r of rows) {
      interest += r.interest;
      if (r.month % 12 === 0 || r.month === rows.length) {
        out.push({ year: r.month / 12, balance: r.balance, paid: data.loanAmount - r.balance, interest });
      }
    }
    return out;
  }, [data]);

  if (!data) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <BarChart3 size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Loan Breakdown</span>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">Monthly P&amp;I</p>
            <p className="text-lg font-black text-blue-700">{fmt(data.monthlyPI)}</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-1">Monthly w/ Tax, PMI &amp; Ins.</p>
            <p className="text-lg font-black text-amber-800">{fmt(data.totalMonthly)}</p>
          </div>
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-1">Total Interest</p>
            <p className="text-lg font-black text-red-700">{fmt(data.totalInterest)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Total Cost</p>
            <p className="text-lg font-black text-slate-700">{fmt(data.totalCost)}</p>
          </div>
        </div>

        {taxNoteRes && (
          <div className="rounded-xl bg-orange-50 border border-orange-200 px-5 py-3 text-center">
            <p className="text-xs text-orange-800 font-bold">Texas Property Taxes (estimate): <span className="font-black">{taxNoteRes.value}</span></p>
            <p className="text-[10px] text-orange-800 mt-0.5">This adds significantly to your true monthly cost</p>
          </div>
        )}

        {yearly.length > 1 && (
          <>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Loan Balance Over Time</p>
              <SvgLineChart
                ariaLabel="Remaining loan balance by year"
                series={[{ name: 'Loan balance', color: '#1d4ed8', points: yearly.map((d) => ({ x: d.year, y: d.balance })) }]}
                xFormat={(n) => `Yr ${n}`}
                yFormat={fmtK}
                height={180}
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Year by Year</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-36 overflow-y-auto" tabIndex={0} role="region" aria-label="Year by year loan balance table">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <th scope="col" className="text-left px-3 py-2 font-bold text-slate-600 text-[10px]">Year</th>
                      <th scope="col" className="text-right px-3 py-2 font-bold text-slate-600 text-[10px]">Balance</th>
                      <th scope="col" className="text-right px-3 py-2 font-bold text-emerald-800 text-[10px]">Paid</th>
                      <th scope="col" className="text-right px-3 py-2 font-bold text-red-700 text-[10px]">Interest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearly.slice(1).filter((_, i, a) => i % 2 === 0 || i === a.length - 1).map((d) => (
                      <tr key={d.year} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-1.5 font-semibold text-slate-600">{d.year}</td>
                        <td className="px-3 py-1.5 text-right font-semibold text-slate-700">{fmt(d.balance)}</td>
                        <td className="px-3 py-1.5 text-right font-semibold text-emerald-800">{fmt(d.paid)}</td>
                        <td className="px-3 py-1.5 text-right font-semibold text-red-700">{fmt(d.interest)}</td>
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
