import { useMemo } from 'react';
import { CreditCard } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { parseCards, simulatePayoff, type PayoffResult } from './payoffSim';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// Text-safe (WCAG AA on white) swatches; the order matches the input order of the cards.
const CARD_COLORS = ['#1d4ed8', '#b45309', '#15803d', '#c2410c', '#b91c1c'];

const fmtD = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const months2Str = (sim: PayoffResult) => {
  if (!sim.paidOff) return '50+ yrs';
  const yr = Math.floor(sim.months / 12);
  const mo = sim.months % 12;
  return yr > 0 ? `${yr}y ${mo}m` : `${sim.months}mo`;
};

function PerCardList({ sim, names }: { sim: PayoffResult; names: string[] }) {
  return (
    <div className="mt-3 space-y-1">
      {sim.perCard.map((p, i) => (
        <div key={`${p.name}-${i}`} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CARD_COLORS[Math.max(0, names.indexOf(p.name)) % CARD_COLORS.length] }} />
          <span className="text-[10px] text-slate-600">
            {p.name}: {p.month === null ? 'not paid off' : `paid off month ${p.month}`}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DebtPayoffPanel({ values, results }: Props) {
  const extraPayment = parseFloat(values.extraPayment) || 0;
  const cards = useMemo(() => parseCards(values), [values]);

  const snowballSim = useMemo(() => simulatePayoff(cards, extraPayment, 'snowball'), [cards, extraPayment]);
  const avalancheSim = useMemo(() => simulatePayoff(cards, extraPayment, 'avalanche'), [cards, extraPayment]);

  const saved = results.find((r) => r.id === 'interestSaved')?.value || '';
  const names = cards.map((c) => c.name);

  const bothPaid = snowballSim.paidOff && avalancheSim.paidOff;
  // Same rule as index.ts: Avalanche "saves most" only when it is cheaper by at least 50 cents.
  const avalancheBetter = bothPaid && snowballSim.totalInterest - avalancheSim.totalInterest >= 0.5;
  const interestText = (sim: PayoffResult) => (sim.paidOff ? fmtD(sim.totalInterest) : 'N/A');

  const series = [
    { name: 'Snowball', color: '#1d4ed8', points: snowballSim.timeline.map((y, x) => ({ x, y })) },
    { name: 'Avalanche', color: '#15803d', dashed: true, points: avalancheSim.timeline.map((y, x) => ({ x, y })) },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <CreditCard size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Snowball vs. Avalanche Strategy</span>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Snowball</p>
            <p className="text-xs text-slate-600 mb-3">Smallest balance first</p>
            <p className="text-2xl font-black text-blue-700">{months2Str(snowballSim)}</p>
            <p className="text-xs text-blue-700 mt-1">Interest: <strong>{interestText(snowballSim)}</strong></p>
            <PerCardList sim={snowballSim} names={names} />
          </div>

          <div className={`rounded-xl border-2 p-4 ${avalancheBetter ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <p className={`text-xs font-bold uppercase tracking-wider ${avalancheBetter ? 'text-emerald-700' : 'text-slate-600'}`}>Avalanche</p>
              {avalancheBetter && <span className="text-[10px] bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-full">Saves Most</span>}
            </div>
            <p className="text-xs text-slate-600 mb-3">Highest rate first</p>
            <p className={`text-2xl font-black ${avalancheBetter ? 'text-emerald-700' : 'text-slate-700'}`}>{months2Str(avalancheSim)}</p>
            <p className={`text-xs mt-1 ${avalancheBetter ? 'text-emerald-700' : 'text-slate-600'}`}>Interest: <strong>{interestText(avalancheSim)}</strong></p>
            <PerCardList sim={avalancheSim} names={names} />
          </div>
        </div>

        {saved && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3 text-center">
            <p className="text-xs text-slate-600">{saved}</p>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Total Debt Payoff Timeline</p>
          <SvgLineChart
            series={series}
            height={200}
            ariaLabel="Total remaining debt by month for the Snowball and Avalanche strategies"
            xFormat={(n) => `${n}mo`}
            yFormat={(n) => (n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toFixed(0)}`)}
          />
          <div className="flex gap-5 mt-2 px-1">
            <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-blue-700" aria-hidden="true" /><span className="text-[10px] text-slate-600">Snowball</span></div>
            <div className="flex items-center gap-1.5"><div className="w-4" style={{ borderTop: '2px dashed #15803d' }} aria-hidden="true" /><span className="text-[10px] text-slate-600">Avalanche</span></div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Your Debts</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="Your debts table">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Card</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Balance</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-red-700 uppercase tracking-wider text-[10px]">APR</th>
                  <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Min Payment</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c, i) => (
                  <tr key={`${c.name}-${i}`} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CARD_COLORS[i % CARD_COLORS.length] }} />
                        <span className="font-bold text-slate-700">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-600">{fmtD(c.balance)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-red-700">{c.rate.toFixed(2)}%</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-600">{fmtD(c.min)}/mo</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td className="px-4 py-2.5 font-black text-slate-700">Total</td>
                  <td className="px-3 py-2.5 text-right font-black text-slate-800">{fmtD(cards.reduce((s, c) => s + c.balance, 0))}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600 text-[10px]">—</td>
                  <td className="px-4 py-2.5 text-right font-black text-slate-800">{fmtD(cards.reduce((s, c) => s + c.min, 0))}/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-3">
          <p className="text-sm font-bold text-blue-700 mb-1">Extra {fmtD(extraPayment)}/mo = Your Secret Weapon</p>
          <p className="text-xs text-blue-700">
            Even a small extra payment dramatically reduces total interest. The "rollover" effect — where a paid-off card's minimum becomes extra payment on the next — accelerates payoff exponentially.
            Increase your extra payment by just {extraPayment > 0 ? fmtD(extraPayment * 0.5) : '$50'}/mo to see a significant impact.
          </p>
        </div>
      </div>
    </div>
  );
}
