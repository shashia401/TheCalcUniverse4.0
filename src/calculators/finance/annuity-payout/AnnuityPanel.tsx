import { useMemo } from 'react';
import { TrendingDown } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  solveFor: string;
  principal: number;
  annualReturn: number;
  frequency: string;
  payoutAmount: number;
  desiredYears: number;
  results: CalculatorResult[];
}

interface BalancePoint {
  period: number;
  balance: number;
  interest: number;
  payout: number;
}

function buildDepletionData(principal: number, pmt: number, rPeriod: number, totalPeriods: number): BalancePoint[] {
  const data: BalancePoint[] = [];
  let balance = principal;
  data.push({ period: 0, balance, interest: 0, payout: 0 });

  for (let i = 1; i <= Math.ceil(totalPeriods); i++) {
    const interest = balance * rPeriod;
    const payout = Math.min(pmt, balance + interest);
    balance = Math.max(0, balance + interest - payout);
    data.push({ period: i, balance, interest, payout });
    if (balance <= 0) break;
  }

  return data;
}

function DepletionChart({ data, frequency }: { data: BalancePoint[]; frequency: string }) {
  if (data.length < 2) return null;

  const width = 520;
  const height = 200;
  const padL = 65;
  const padR = 20;
  const padT = 16;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxVal = data[0].balance;
  const toX = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => padT + (1 - v / maxVal) * chartH;

  const areaPath = [
    ...data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.balance).toFixed(1)}`),
    `L ${toX(data.length - 1).toFixed(1)} ${toY(0).toFixed(1)}`,
    `L ${toX(0).toFixed(1)} ${toY(0).toFixed(1)} Z`,
  ].join(' ');

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.balance).toFixed(1)}`).join(' ');

  const periodsPerYear = frequency === 'monthly' ? 12 : 1;
  const labelEvery = Math.max(1, Math.floor(data.length / 7 / periodsPerYear)) * periodsPerYear;
  const xLabels = data.filter((_, i) => i % labelEvery === 0 || i === data.length - 1);

  const fmtY = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`;

  const fmtX = (p: number) => {
    const yr = Math.floor(p / periodsPerYear);
    return `Yr ${yr}`;
  };

  const midIdx = Math.floor(data.length / 2);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="Annuity balance depletion chart">
        <defs>
          <linearGradient id="annuityGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((g) => {
          const y = padT + (1 - g) * chartH;
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={0.5} />
              <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} className="fill-slate-400 dark:fill-slate-500">{fmtY(g * maxVal)}</text>
            </g>
          );
        })}

        {xLabels.map((d) => {
          const x = toX(data.indexOf(d));
          return (
            <g key={d.period}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={0.5} />
              <text x={x} y={padT + chartH + 12} textAnchor="middle" fontSize={9} className="fill-slate-400 dark:fill-slate-500">{fmtX(d.period)}</text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#annuityGrad)" />
        <path d={linePath} fill="none" stroke="#0ea5e9" strokeWidth={2.5} strokeLinejoin="round" />

        {midIdx > 0 && midIdx < data.length && (
          <text x={toX(midIdx)} y={toY(data[midIdx].balance) - 8} textAnchor="middle" fontSize={9} className="fill-slate-500 dark:fill-slate-400" fontWeight="600">
            {fmtY(data[midIdx].balance)}
          </text>
        )}

        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={0.5} />
      </svg>
    </div>
  );
}

function PeriodTable({ data, frequency }: { data: BalancePoint[]; frequency: string }) {
  const periodsPerYear = frequency === 'monthly' ? 12 : 1;
  const yearlyData: Array<{ year: number; startBalance: number; interest: number; payout: number; endBalance: number }> = [];

  for (let y = 0; y * periodsPerYear < data.length - 1; y++) {
    const startIdx = y * periodsPerYear;
    const endIdx = Math.min((y + 1) * periodsPerYear, data.length - 1);
    const yearSlice = data.slice(startIdx + 1, endIdx + 1);
    yearlyData.push({
      year: y + 1,
      startBalance: data[startIdx].balance,
      interest: yearSlice.reduce((s, d) => s + d.interest, 0),
      payout: yearSlice.reduce((s, d) => s + d.payout, 0),
      endBalance: data[endIdx].balance,
    });
    if (data[endIdx].balance <= 0) break;
  }

  const fmtK = (n: number) =>
    n >= 10_000 ? `$${(n / 1_000).toFixed(1)}K` : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const step = Math.max(1, Math.ceil(yearlyData.length / 10));
  const rows = yearlyData.filter((_, i) => i % step === 0 || i === yearlyData.length - 1);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Year</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Start Balance</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-emerald-500 uppercase tracking-wider text-[10px]">Interest</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-blue-500 uppercase tracking-wider text-[10px]">Payout</th>
            <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">End Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => (
            <tr key={d.year} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <td className="px-4 py-2.5 font-bold text-slate-800">Year {d.year}</td>
              <td className="px-3 py-2.5 text-right text-slate-600">{fmtK(d.startBalance)}</td>
              <td className="px-3 py-2.5 text-right text-emerald-600 font-semibold">{fmtK(d.interest)}</td>
              <td className="px-3 py-2.5 text-right text-blue-600 font-semibold">{fmtK(d.payout)}</td>
              <td className="px-4 py-2.5 text-right font-black" style={{ color: d.endBalance < d.startBalance * 0.5 ? '#ef4444' : '#1e293b' }}>
                {fmtK(d.endBalance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AnnuityPanel({ solveFor, principal, annualReturn, frequency, payoutAmount, desiredYears }: Props) {
  const periodsPerYear = frequency === 'monthly' ? 12 : 1;
  const rPeriod = annualReturn / periodsPerYear;

  const resolvedPmt = useMemo(() => {
    if (solveFor === 'payout' && desiredYears > 0) {
      const n = desiredYears * periodsPerYear;
      return rPeriod === 0 ? principal / n : (principal * rPeriod) / (1 - Math.pow(1 + rPeriod, -n));
    }
    return payoutAmount;
  }, [solveFor, principal, rPeriod, desiredYears, periodsPerYear, payoutAmount]);

  const totalPeriods = useMemo(() => {
    if (solveFor === 'payout') return desiredYears * periodsPerYear;
    if (rPeriod === 0) return principal / resolvedPmt;
    if (resolvedPmt <= principal * rPeriod) return 600;
    return Math.log(resolvedPmt / (resolvedPmt - principal * rPeriod)) / Math.log(1 + rPeriod);
  }, [solveFor, desiredYears, periodsPerYear, rPeriod, principal, resolvedPmt]);

  const data = useMemo(
    () => buildDepletionData(principal, resolvedPmt, rPeriod, totalPeriods),
    [principal, resolvedPmt, rPeriod, totalPeriods]
  );

  if (!data.length) return null;

  const freqLabel = frequency === 'monthly' ? '/mo' : '/yr';
  const fmtD = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingDown size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Annuity Depletion Chart</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Balance Over Time</p>
          <p className="text-xs text-slate-500 mb-3">
            ${fmtD(resolvedPmt)}{freqLabel} withdrawal at {(annualReturn * 100).toFixed(2)}% annual return
          </p>
          <DepletionChart data={data} frequency={frequency} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Year-by-Year Summary</p>
          <PeriodTable data={data} frequency={frequency} />
        </div>
      </div>
    </div>
  );
}
