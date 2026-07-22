import { useMemo } from 'react';
import { TrendingDown } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  balance: number;
  apr: number;
  payoffMode: string;
  monthlyPayment: number;
  targetMonths: number;
  results: CalculatorResult[];
}

interface BalancePoint {
  month: number;
  balance: number;
  label: string;
}

function buildTimeline(balance: number, apr: number, pmt: number): BalancePoint[] {
  const monthlyRate = apr / 12;
  const data: BalancePoint[] = [];
  let remaining = balance;
  let month = 0;
  data.push({ month: 0, balance: remaining, label: 'Start' });

  while (remaining > 0.005 && month < 1200) {
    month++;
    const interest = remaining * monthlyRate;
    remaining = Math.max(0, remaining + interest - pmt);
    if (month % 6 === 0 || remaining <= 0.005) {
      const date = new Date();
      date.setMonth(date.getMonth() + month);
      data.push({ month, balance: remaining, label: remaining <= 0.005 ? 'Paid!' : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) });
    }
  }

  return data;
}

const fmtK = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toFixed(0)}`;

export default function CreditCardPanel({ balance, apr, payoffMode, monthlyPayment, targetMonths, results }: Props) {
  const pmt = useMemo(() => {
    if (payoffMode === 'fixed') return monthlyPayment;
    const monthlyRate = apr / 12;
    if (monthlyRate === 0) return balance / targetMonths;
    return (balance * (monthlyRate * Math.pow(1 + monthlyRate, targetMonths))) / (Math.pow(1 + monthlyRate, targetMonths) - 1);
  }, [payoffMode, monthlyPayment, targetMonths, balance, apr]);

  const timeline = useMemo(() => buildTimeline(balance, apr, pmt), [balance, apr, pmt]);
  const totalInterest = results.find((r) => r.id === 'totalInterest')?.value || '';
  const payoffDate = results.find((r) => r.id === 'payoffDate')?.value || '';

  if (timeline.length < 2) return null;

  const width = 520;
  const height = 180;
  const padL = 55;
  const padR = 20;
  const padT = 16;
  const padB = 36;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxVal = balance;
  const toX = (i: number) => padL + (i / (timeline.length - 1)) * chartW;
  const toY = (v: number) => padT + (1 - v / maxVal) * chartH;

  const areaPath = [
    ...timeline.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.balance).toFixed(1)}`),
    `L ${toX(timeline.length - 1).toFixed(1)} ${toY(0).toFixed(1)}`,
    `L ${toX(0).toFixed(1)} ${toY(0).toFixed(1)} Z`,
  ].join(' ');

  const linePath = timeline.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.balance).toFixed(1)}`).join(' ');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingDown size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Payoff Timeline</span>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Payoff Date</p>
            <p className="text-lg font-black text-emerald-700 mt-1">{payoffDate}</p>
          </div>
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Total Interest</p>
            <p className="text-lg font-black text-red-600 mt-1">{totalInterest}</p>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="Credit card payoff timeline chart">
            <defs>
              <linearGradient id="ccGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((g) => {
              const y = padT + (1 - g) * chartH;
              return (
                <g key={g}>
                  <line x1={padL} y1={y} x2={padL + chartW} y2={y} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={0.5} />
                  <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} className="fill-slate-400 dark:fill-slate-500">{fmtK(g * maxVal)}</text>
                </g>
              );
            })}
            {timeline.filter((_, i) => i > 0 && i < timeline.length - 1 && timeline[i].month % 12 === 0).map((d) => {
              const x = toX(timeline.indexOf(d));
              return (
                <g key={d.month}>
                  <line x1={x} y1={padT} x2={x} y2={padT + chartH} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={0.5} />
                  <text x={x} y={padT + chartH + 10} textAnchor="middle" fontSize={8} className="fill-slate-400 dark:fill-slate-500">{Math.floor(d.month / 12)}yr</text>
                </g>
              );
            })}
            <path d={areaPath} fill="url(#ccGrad)" />
            <path d={linePath} fill="none" stroke="#0ea5e9" strokeWidth={2.5} strokeLinejoin="round" />
            <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={0.5} />
          </svg>
        </div>
      </div>
    </div>
  );
}
