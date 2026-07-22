import { useMemo } from 'react';
import { Home } from 'lucide-react';

interface Props {
  balance: number;
  annualRate: number;
  basePayment: number;
  extraMonthly: number;
  yearlyLumpSum: number;
  singleLumpSum: number;
}

interface SimResult {
  months: number;
  totalInterest: number;
  yearlyInterest: number[];
  yearlyPrincipal: number[];
}

function simulate(
  startBalance: number,
  payment: number,
  extraMo: number,
  yearlyLS: number,
  monthlyRate: number
): SimResult {
  let bal = startBalance;
  let months = 0;
  let totalInterest = 0;
  const yearlyInterest: number[] = [];
  const yearlyPrincipal: number[] = [];
  let yearInt = 0;
  let yearPrin = 0;

  while (bal > 0.005 && months < 12000) {
    const interest = bal * monthlyRate;
    totalInterest += interest;
    yearInt += interest;
    const extra = extraMo + (months > 0 && months % 12 === 0 ? yearlyLS : 0);
    const principal = Math.min(bal, payment - interest + extra);
    if (principal <= 0) { months = 99999; break; }
    yearPrin += principal;
    bal -= principal;
    months++;
    if (months % 12 === 0) {
      yearlyInterest.push(yearInt);
      yearlyPrincipal.push(yearPrin);
      yearInt = 0;
      yearPrin = 0;
    }
  }
  if (yearInt > 0) { yearlyInterest.push(yearInt); yearlyPrincipal.push(yearPrin); }
  return { months, totalInterest, yearlyInterest, yearlyPrincipal };
}

function BarCompareChart({ stdInterest, newInterest }: { stdInterest: number; newInterest: number }) {
  const maxVal = stdInterest;
  const stdPct = 100;
  const newPct = maxVal > 0 ? Math.min((newInterest / maxVal) * 100, 100) : 0;
  const saved = stdInterest - newInterest;
  const savedPct = maxVal > 0 ? (saved / maxVal) * 100 : 0;

  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-slate-600">Standard Schedule</span>
          <span className="font-black text-red-600">{fmt(stdInterest)} total interest</span>
        </div>
        <div className="h-8 rounded-lg bg-red-100 overflow-hidden flex">
          <div className="h-full bg-red-400 rounded-lg" style={{ width: `${stdPct}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-slate-600">Accelerated Schedule</span>
          <span className="font-black text-blue-700">{fmt(newInterest)} total interest</span>
        </div>
        <div className="h-8 rounded-lg bg-slate-100 overflow-hidden flex gap-0">
          <div className="h-full bg-blue-500 rounded-l-lg transition-all" style={{ width: `${newPct}%` }} />
          <div className="h-full bg-emerald-400 transition-all" style={{ width: `${savedPct}%` }} title={`Saved: ${fmt(saved)}`} />
        </div>
        <div className="flex items-center gap-4 text-[10px] text-slate-500">
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500" /><span>Interest still paid</span></div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /><span>Interest saved</span></div>
        </div>
      </div>

      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 flex items-center justify-between">
        <span className="text-sm font-bold text-emerald-700">Total Interest Saved</span>
        <span className="text-xl font-black text-emerald-700">{fmt(saved)}</span>
      </div>
    </div>
  );
}

function BalanceChart({ stdYearlyInterest, newYearlyInterest, balance, monthlyRate, basePayment, extraMonthly }: {
  stdYearlyInterest: number[];
  newYearlyInterest: number[];
  balance: number;
  monthlyRate: number;
  basePayment: number;
  extraMonthly: number;
}) {
  const width = 520;
  const height = 200;
  const padL = 60;
  const padR = 20;
  const padT = 16;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxYears = Math.max(stdYearlyInterest.length, newYearlyInterest.length);
  const stdBalances: number[] = [];
  const newBalances: number[] = [];

  let stdBal = balance;
  let newBal = balance;
  for (let y = 0; y < maxYears; y++) {
    for (let m = 0; m < 12; m++) {
      if (stdBal > 0) {
        const int = stdBal * monthlyRate;
        stdBal = Math.max(0, stdBal - (basePayment - int));
      }
      if (newBal > 0) {
        const int = newBal * monthlyRate;
        newBal = Math.max(0, newBal - (basePayment - int + extraMonthly));
      }
    }
    stdBalances.push(stdBal);
    newBalances.push(newBal);
  }

  const maxVal = balance;
  const toX = (i: number) => padL + (i / Math.max(maxYears - 1, 1)) * chartW;
  const toY = (v: number) => padT + (1 - v / maxVal) * chartH;

  const stdPath = stdBalances.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
  const newPath = newBalances.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const fmtY = (v: number) => {
    const n = v * maxVal;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const labelStep = Math.max(5, Math.ceil(maxYears / 6 / 5) * 5);
  const xLabels: number[] = [];
  for (let i = 0; i < maxYears; i += labelStep) xLabels.push(i);
  if (!xLabels.includes(maxYears - 1)) xLabels.push(maxYears - 1);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="Mortgage payoff timeline chart">
        {gridLines.map((g) => {
          const y = padT + (1 - g) * chartH;
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">{fmtY(g)}</text>
            </g>
          );
        })}
        {xLabels.map((i) => (
          <g key={`item-${i}`}>
            <line x1={toX(i)} y1={padT} x2={toX(i)} y2={padT + chartH} stroke="#e2e8f0" strokeWidth={0.5} />
            <text x={toX(i)} y={padT + chartH + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">Yr {i + 1}</text>
          </g>
        ))}
        <path d={stdPath} fill="none" stroke="#f87171" strokeWidth={2} strokeLinejoin="round" strokeDasharray="6 3" />
        <path d={newPath} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" />
        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      </svg>
      <div className="flex gap-5 mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4 flex-shrink-0" style={{ borderTop: '2px dashed #f87171' }} />
          <span className="text-[10px] text-slate-500">Standard balance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-blue-500 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Accelerated balance</span>
        </div>
      </div>
    </div>
  );
}

export default function MortgagePayoffPanel({ balance, annualRate, basePayment, extraMonthly, yearlyLumpSum, singleLumpSum }: Props) {
  const monthlyRate = annualRate / 12;
  const startBalance = singleLumpSum > 0 ? Math.max(0, balance - singleLumpSum) : balance;

  const std = useMemo(() => simulate(balance, basePayment, 0, 0, monthlyRate), [balance, basePayment, monthlyRate]);
  const acc = useMemo(() => simulate(startBalance, basePayment, extraMonthly, yearlyLumpSum, monthlyRate), [startBalance, basePayment, extraMonthly, yearlyLumpSum, monthlyRate]);

  const hasExtra = extraMonthly > 0 || yearlyLumpSum > 0 || singleLumpSum > 0;

  const payoffDate = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Home size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Mortgage Payoff Analysis</span>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Standard Payoff</p>
            <p className="text-lg font-black text-slate-700">{payoffDate(std.months)}</p>
            <p className="text-xs text-slate-500 mt-0.5">{std.months} payments · {(std.months / 12).toFixed(1)} years</p>
          </div>
          {hasExtra && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 ring-2 ring-emerald-300">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Debt-Free Date</p>
              <p className="text-lg font-black text-emerald-700">{payoffDate(acc.months)}</p>
              <p className="text-xs text-emerald-400 mt-0.5">{acc.months} payments · {(acc.months / 12).toFixed(1)} years</p>
            </div>
          )}
        </div>

        {hasExtra && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Interest Comparison</p>
            <BarCompareChart stdInterest={std.totalInterest} newInterest={acc.totalInterest} />
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Remaining Balance Over Time</p>
          <BalanceChart
            stdYearlyInterest={std.yearlyInterest}
            newYearlyInterest={acc.yearlyInterest}
            balance={balance}
            monthlyRate={monthlyRate}
            basePayment={basePayment}
            extraMonthly={extraMonthly}
          />
        </div>
      </div>
    </div>
  );
}
