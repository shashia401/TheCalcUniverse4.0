import { useMemo } from 'react';
import { CreditCard } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Card {
  name: string;
  balance: number;
  rate: number;
  min: number;
}

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface MonthlyState {
  month: number;
  balances: number[];
  totalBalance: number;
}

function simulateFull(cards: Card[], extraPayment: number, strategy: 'snowball' | 'avalanche'): { timeline: MonthlyState[]; perCardPayoff: Array<{ name: string; month: number; interestPaid: number; color: string }> } {
  const order = strategy === 'snowball'
    ? [...cards].sort((a, b) => a.balance - b.balance)
    : [...cards].sort((a, b) => b.rate - a.rate);

  const balances = order.map((c) => c.balance);
  const interestPaid = order.map(() => 0);
  const perCardPayoff: Array<{ name: string; month: number; interestPaid: number; color: string }> = [];
  const timeline: MonthlyState[] = [];
  const colors = ['#3b82f6', '#f59e0b', '#22c55e', '#f97316', '#8b5cf6'];

  timeline.push({ month: 0, balances: [...balances], totalBalance: balances.reduce((s, b) => s + b, 0) });

  const maxMonths = 600;
  let month = 0;

  while (balances.some((b) => b > 0.01) && month < maxMonths) {
    month++;
    let extra = extraPayment + order.reduce((freed, _, i) => balances[i] <= 0 ? freed + order[i].min : freed, 0);

    const interest = balances.map((b, i) => b > 0 ? b * (order[i].rate / 100 / 12) : 0);
    interest.forEach((int, i) => {
      balances[i] = Math.max(0, balances[i] + int);
      interestPaid[i] += int;
    });

    const minPayments = order.map((c, i) => balances[i] > 0 ? c.min : 0);
    balances.forEach((_, i) => {
      balances[i] = Math.max(0, balances[i] - minPayments[i]);
    });

    for (let i = 0; i < balances.length; i++) {
      if (balances[i] <= 0.01) continue;
      const pay = Math.min(extra, balances[i]);
      balances[i] -= pay;
      extra -= pay;
      if (balances[i] < 0.01) balances[i] = 0;
      break;
    }

    balances.forEach((b, i) => {
      if (b < 0.01 && b > 0) balances[i] = 0;
    });

    order.forEach((card, i) => {
      if (balances[i] <= 0 && !perCardPayoff.find((p) => p.name === card.name)) {
        perCardPayoff.push({ name: card.name, month, interestPaid: interestPaid[i], color: colors[i % colors.length] });
      }
    });

    if (month % 3 === 0 || !balances.some((b) => b > 0.01)) {
      timeline.push({
        month,
        balances: [...balances],
        totalBalance: balances.reduce((s, b) => s + b, 0),
      });
    }
  }

  return { timeline, perCardPayoff };
}

function TimelineChart({ snowballTimeline, avalancheTimeline }: { snowballTimeline: MonthlyState[]; avalancheTimeline: MonthlyState[] }) {
  const allMonths = Math.max(
    snowballTimeline[snowballTimeline.length - 1]?.month || 0,
    avalancheTimeline[avalancheTimeline.length - 1]?.month || 0,
  );

  const maxBalance = snowballTimeline[0]?.totalBalance || 0;

  if (allMonths === 0 || maxBalance === 0) return null;

  const width = 520;
  const height = 200;
  const padL = 65;
  const padR = 20;
  const padT = 16;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const toX = (month: number) => padL + (month / allMonths) * chartW;
  const toY = (v: number) => padT + (1 - v / maxBalance) * chartH;

  const makeLinePath = (timeline: MonthlyState[]) =>
    timeline.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.month).toFixed(1)} ${toY(d.totalBalance).toFixed(1)}`).join(' ');

  const snowLine = makeLinePath(snowballTimeline);
  const avalLine = makeLinePath(avalancheTimeline);

  const fmtY = (v: number) =>
    v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v.toFixed(0)}`;

  const labelStep = Math.max(6, Math.ceil(allMonths / 8 / 6) * 6);
  const xLabels = Array.from({ length: Math.ceil(allMonths / labelStep) + 1 }, (_, i) => i * labelStep).filter((m) => m <= allMonths);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="Debt payoff timeline chart">
        {[0, 0.25, 0.5, 0.75, 1].map((g) => {
          const y = padT + (1 - g) * chartH;
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">{fmtY(g * maxBalance)}</text>
            </g>
          );
        })}
        {xLabels.map((m) => {
          const x = toX(m);
          const yr = Math.floor(m / 12);
          return (
            <g key={m}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={x} y={padT + chartH + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">Yr {yr}</text>
            </g>
          );
        })}
        <path d={snowLine} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" />
        <path d={avalLine} fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinejoin="round" strokeDasharray="6 3" />
        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      </svg>
      <div className="flex gap-5 mt-2 px-1">
        <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-blue-500" /><span className="text-[10px] text-slate-500">Snowball</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4" style={{ borderTop: '2px dashed #22c55e' }} /><span className="text-[10px] text-slate-500">Avalanche</span></div>
      </div>
    </div>
  );
}

const CARD_COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#f97316', '#ef4444'];

export default function DebtPayoffPanel({ values, results }: Props) {
  const extraPayment = parseFloat(values.extraPayment) || 0;
  const cards = useMemo(() =>
    [1, 2, 3].map((n) => ({
      name: values[`card${n}name`] || `Card ${n}`,
      balance: parseFloat(values[`card${n}balance`]) || 0,
      rate: parseFloat(values[`card${n}rate`]) || 0,
      min: parseFloat(values[`card${n}min`]) || 0,
    })).filter((c) => c.balance > 0 && c.rate > 0),
    [values]
  );

  const snowballSim = useMemo(() => simulateFull(cards, extraPayment, 'snowball'), [cards, extraPayment]);
  const avalancheSim = useMemo(() => simulateFull(cards, extraPayment, 'avalanche'), [cards, extraPayment]);

  const snowballMonths = snowballSim.timeline[snowballSim.timeline.length - 1]?.month || 0;
  const avalancheMonths = avalancheSim.timeline[avalancheSim.timeline.length - 1]?.month || 0;

  const snowballInterest = results.find((r) => r.id === 'snowballInterest')?.value || '';
  const avalancheInterest = results.find((r) => r.id === 'avalancheInterest')?.value || '';
  const saved = results.find((r) => r.id === 'interestSaved')?.value || '';

  const avalancheBetter = avalancheMonths <= snowballMonths;

  const fmtD = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const months2Str = (m: number) => {
    const yr = Math.floor(m / 12);
    const mo = m % 12;
    return yr > 0 ? `${yr}y ${mo}m` : `${m}mo`;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <CreditCard size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Snowball vs. Avalanche Strategy</span>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Snowball</p>
            <p className="text-xs text-slate-500 mb-3">Smallest balance first</p>
            <p className="text-2xl font-black text-blue-700">{months2Str(snowballMonths)}</p>
            <p className="text-xs text-blue-600 mt-1">Interest: <strong>{snowballInterest}</strong></p>
            <div className="mt-3 space-y-1">
              {snowballSim.perCardPayoff.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CARD_COLORS[i] }} />
                  <span className="text-[10px] text-slate-600">{p.name}: paid off month {p.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-xl border-2 p-4 ${avalancheBetter ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: avalancheBetter ? '#16a34a' : '#64748b' }}>Avalanche</p>
              {avalancheBetter && <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full">Saves Most</span>}
            </div>
            <p className="text-xs text-slate-500 mb-3">Highest rate first</p>
            <p className={`text-2xl font-black ${avalancheBetter ? 'text-emerald-700' : 'text-slate-700'}`}>{months2Str(avalancheMonths)}</p>
            <p className={`text-xs mt-1 ${avalancheBetter ? 'text-emerald-600' : 'text-slate-600'}`}>Interest: <strong>{avalancheInterest}</strong></p>
            <div className="mt-3 space-y-1">
              {avalancheSim.perCardPayoff.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CARD_COLORS[i] }} />
                  <span className="text-[10px] text-slate-600">{p.name}: paid off month {p.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {saved && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3 text-center">
            <p className="text-xs text-slate-500">{saved}</p>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Total Debt Payoff Timeline</p>
          <TimelineChart snowballTimeline={snowballSim.timeline} avalancheTimeline={avalancheSim.timeline} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Your Debts</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Card</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Balance</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-red-400 uppercase tracking-wider text-[10px]">APR</th>
                  <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Min Payment</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c, i) => (
                  <tr key={c.name} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CARD_COLORS[i] }} />
                        <span className="font-bold text-slate-700">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-600">{fmtD(c.balance)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-red-500">{c.rate.toFixed(2)}%</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-600">{fmtD(c.min)}/mo</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td className="px-4 py-2.5 font-black text-slate-700">Total</td>
                  <td className="px-3 py-2.5 text-right font-black text-slate-800">{fmtD(cards.reduce((s, c) => s + c.balance, 0))}</td>
                  <td className="px-3 py-2.5 text-right text-slate-500 text-[10px]">—</td>
                  <td className="px-4 py-2.5 text-right font-black text-slate-800">{fmtD(cards.reduce((s, c) => s + c.min, 0))}/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-3">
          <p className="text-sm font-bold text-blue-700 mb-1">Extra {fmtD(extraPayment)}/mo = Your Secret Weapon</p>
          <p className="text-xs text-blue-600">
            Even a small extra payment dramatically reduces total interest. The "rollover" effect — where a paid-off card's minimum becomes extra payment on the next — accelerates payoff exponentially.
            Increase your extra payment by just ${extraPayment > 0 ? fmtD(extraPayment * 0.5) : '$50'}/mo to see a significant impact.
          </p>
        </div>
      </div>
    </div>
  );
}
