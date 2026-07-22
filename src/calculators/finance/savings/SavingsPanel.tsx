import { useMemo } from 'react';
import { PiggyBank } from 'lucide-react';

interface Props {
  solveFor: string;
  initialDeposit: number;
  monthlyContribution: number;
  goal: number;
  timePeriod: number;
  timeUnit: string;
  apy: number;
}

interface DataPoint {
  month: number;
  principal: number;
  interest: number;
  total: number;
  goal?: number;
}

function buildData(P: number, pmt: number, apy: number, months: number, goal?: number): DataPoint[] {
  const monthlyRate = apy / 12;
  const data: DataPoint[] = [];
  let balance = P;
  let totalContributed = P;

  data.push({ month: 0, principal: P, interest: 0, total: P, goal });

  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + monthlyRate) + pmt;
    totalContributed += pmt;
    data.push({
      month: m,
      principal: totalContributed,
      interest: Math.max(0, balance - totalContributed),
      total: balance,
      goal,
    });
  }

  return data;
}

function BarChart({ data, goal }: { data: DataPoint[]; goal?: number }) {
  const width = 520;
  const height = 200;
  const padL = 65;
  const padR = 20;
  const padT = 16;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxVal = Math.max(Math.max(...data.map((d) => d.total), goal || 0) * 1.05, 1);
  const toX = (i: number) => padL + (i / Math.max(data.length - 1, 1)) * chartW;
  const toY = (v: number) => padT + (1 - v / maxVal) * chartH;

  const principalAreaPath = [
    ...data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.principal).toFixed(1)}`),
    `L ${toX(data.length - 1).toFixed(1)} ${toY(0).toFixed(1)}`,
    `L ${toX(0).toFixed(1)} ${toY(0).toFixed(1)} Z`,
  ].join(' ');

  const interestAreaPath = [
    ...data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.total).toFixed(1)}`),
    ...data.map((_d, i) => `L ${toX(data.length - 1 - i).toFixed(1)} ${toY(data[data.length - 1 - i].principal).toFixed(1)}`),
    'Z',
  ].join(' ');

  const totalLine = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.total).toFixed(1)}`).join(' ');

  const goalY = goal ? toY(goal) : null;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const fmtY = (v: number) => {
    const val = v * maxVal;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  const labelStep = Math.max(1, Math.ceil(data.length / 8));
  const xLabels = data.filter((_, i) => i % labelStep === 0 || i === data.length - 1);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="Savings goal chart">
        <defs>
          <linearGradient id="savPrinGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="savIntGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {gridLines.map((g) => {
          const y = padT + (1 - g) * chartH;
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">{fmtY(g)}</text>
            </g>
          );
        })}

        {xLabels.map((d) => {
          const x = toX(data.indexOf(d));
          return (
            <g key={d.month}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={x} y={padT + chartH + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">Mo {d.month}</text>
            </g>
          );
        })}

        <path d={principalAreaPath} fill="url(#savPrinGrad)" />
        <path d={interestAreaPath} fill="url(#savIntGrad)" />

        {goalY !== null && (
          <g>
            <line x1={padL} y1={goalY} x2={padL + chartW} y2={goalY} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 4" />
            <text x={padL + chartW - 2} y={goalY - 4} textAnchor="end" fontSize={9} fill="#f59e0b" fontWeight="700">Goal</text>
          </g>
        )}

        <path d={totalLine} fill="none" stroke="#0ea5e9" strokeWidth={2.5} strokeLinejoin="round" />
        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      </svg>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500 opacity-70 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Principal (Your Deposits)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500 opacity-70 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Interest Earned</span>
        </div>
        {goal && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 flex-shrink-0" style={{ borderTop: '1.5px dashed #f59e0b' }} />
            <span className="text-[10px] text-slate-500">Goal</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MilestoneTable({ data }: { data: DataPoint[] }) {
  const fmtK = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const step = Math.max(1, Math.ceil(data.length / 11));
  const rows = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Month</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-blue-500 uppercase tracking-wider text-[10px]">Deposited</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-emerald-500 uppercase tracking-wider text-[10px]">Interest</th>
            <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => (
            <tr key={d.month} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <td className="px-4 py-2.5 font-bold text-slate-800">Mo {d.month}</td>
              <td className="px-3 py-2.5 text-right text-blue-600 font-semibold">{fmtK(d.principal)}</td>
              <td className="px-3 py-2.5 text-right text-emerald-600 font-semibold">{fmtK(d.interest)}</td>
              <td className="px-4 py-2.5 text-right font-black text-slate-800">{fmtK(d.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SavingsPanel({ solveFor, initialDeposit, monthlyContribution, goal, timePeriod, timeUnit, apy }: Props) {
  const months = useMemo(() => timeUnit === 'years' ? timePeriod * 12 : timePeriod, [timePeriod, timeUnit]);

  const resolvedPmt = useMemo(() => {
    if (solveFor === 'balance') return monthlyContribution;
    if (goal <= 0) return 0;
    const monthlyRate = apy / 12;
    const futureP = initialDeposit * Math.pow(1 + monthlyRate, months);
    const remaining = goal - futureP;
    if (remaining <= 0) return 0;
    return monthlyRate === 0
      ? remaining / months
      : remaining * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
  }, [solveFor, initialDeposit, monthlyContribution, goal, months, apy]);

  const data = useMemo(
    () => buildData(initialDeposit, resolvedPmt, apy, Math.round(months), solveFor === 'goal' ? goal : undefined),
    [initialDeposit, resolvedPmt, apy, months, goal, solveFor]
  );

  if (!data.length) return null;
  const final = data[data.length - 1];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <PiggyBank size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Savings Growth Trajectory</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Balance Growth Over Time</p>
          <BarChart data={data} goal={solveFor === 'goal' ? goal : undefined} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-center">
            <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Deposited</p>
            <p className="text-base font-black text-blue-700">
              {final.principal >= 1000 ? `$${(final.principal / 1000).toFixed(1)}K` : `$${final.principal.toFixed(0)}`}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-center">
            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Interest</p>
            <p className="text-base font-black text-emerald-700">
              {final.interest >= 1000 ? `$${(final.interest / 1000).toFixed(1)}K` : `$${final.interest.toFixed(0)}`}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total</p>
            <p className="text-base font-black text-slate-700">
              {final.total >= 1000 ? `$${(final.total / 1000).toFixed(1)}K` : `$${final.total.toFixed(0)}`}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Monthly Breakdown</p>
          <MilestoneTable data={data} />
        </div>
      </div>
    </div>
  );
}
