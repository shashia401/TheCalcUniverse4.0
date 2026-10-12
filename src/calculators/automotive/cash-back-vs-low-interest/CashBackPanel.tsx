import { TrendingDown } from 'lucide-react';
import type { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import { compareOffers } from './cashBackMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CashBackPanel({ values, results }: Props) {
  const c = compareOffers(values);
  if (!results || results.length === 0 || !c) return null;

  const { monthlyA, monthlyB, interestA, interestB, totalPaidA, totalPaidB, aWins, tie } = c;
  const winner = results[0];
  const aStyle = aWins && !tie;
  const bStyle = !aWins && !tie;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingDown size={16} className="text-slate-500" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Cash Back vs. Low Rate — Full Comparison
        </span>
      </div>

      <div className="p-6 space-y-6">
        <div className={`rounded-xl border-2 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${tie ? 'border-slate-300 bg-slate-50' : aWins ? 'border-emerald-400 bg-emerald-50' : 'border-blue-400 bg-blue-50'}`}>
          <div>
            {!tie && (
              <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-1 text-white ${aWins ? 'bg-emerald-700' : 'bg-blue-700'}`}>
                Winner
              </span>
            )}
            <p className={`text-lg font-black ${tie ? 'text-slate-800' : aWins ? 'text-emerald-800' : 'text-blue-800'}`}>{winner.label}</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-black ${tie ? 'text-slate-700' : aWins ? 'text-emerald-800' : 'text-blue-800'}`}>{winner.value}</p>
            {!tie && <p className="text-xs text-slate-600 mt-0.5">vs. the other option</p>}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="Side-by-side comparison table of cash back versus low interest options">
          <table className="w-full text-sm min-w-[360px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Metric</th>
                <th scope="col" className={`text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest ${aStyle ? 'text-emerald-800' : 'text-slate-600'}`}>
                  Option A (Cash Back)
                  {aStyle && <span className="ml-1 inline-block bg-emerald-700 text-white text-[9px] px-1.5 py-0.5 rounded font-black">WINNER</span>}
                </th>
                <th scope="col" className={`text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest ${bStyle ? 'text-blue-800' : 'text-slate-600'}`}>
                  Option B (Low Rate)
                  {bStyle && <span className="ml-1 inline-block bg-blue-700 text-white text-[9px] px-1.5 py-0.5 rounded font-black">WINNER</span>}
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Monthly Payment', a: monthlyA, b: monthlyB, cls: 'font-bold' },
                { label: 'Total Interest', a: interestA, b: interestB, cls: 'font-semibold' },
                { label: 'Total Out-of-Pocket', a: totalPaidA, b: totalPaidB, cls: 'font-black text-base' },
              ].map((row) => (
                <tr key={row.label} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-700">{row.label}</td>
                  <td className={`px-4 py-3 text-right ${row.cls} ${aStyle ? 'text-emerald-800 bg-emerald-50' : 'text-slate-700'}`}>${fmt(row.a)}</td>
                  <td className={`px-4 py-3 text-right ${row.cls} ${bStyle ? 'text-blue-800 bg-blue-50' : 'text-slate-700'}`}>${fmt(row.b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Total out-of-pocket over the loan</p>
          <SvgBarChart
            ariaLabel={`Total out-of-pocket: Option A cash back $${Math.round(totalPaidA).toLocaleString()}, Option B low rate $${Math.round(totalPaidB).toLocaleString()}`}
            data={[
              { label: 'A: Cash back', value: totalPaidA, color: aStyle ? '#047857' : '#475569' },
              { label: 'B: Low rate', value: totalPaidB, color: bStyle ? '#1d4ed8' : '#475569' },
            ]}
            format={(n) => `$${Math.round(n).toLocaleString()}`}
            maxBarWidth={80}
            height={200}
          />
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4">
          <p className="text-xs font-bold text-slate-700 mb-1">Why 0% is not always the winner</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            The cash rebate lowers your loan principal immediately — before any interest accrues. A
            large rebate at a moderate rate can cost less than a small rebate at 0%, especially on
            shorter loan terms. The longer the term, the more the low rate has to work with —
            which is when promotional financing tends to win.
          </p>
        </div>
      </div>
    </div>
  );
}
