import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { DownloadCsvButton } from '../../../utils/downloadCsv';

interface RetirementPanelProps {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  annualReturn: number;
  inflationRate: number;
}

interface DataPoint {
  age: number;
  contributed: number;
  growth: number;
  total: number;
  realTotal: number;
}

function buildProjection(
  currentAge: number,
  retirementAge: number,
  currentSavings: number,
  monthlyContribution: number,
  annualReturn: number,
  inflationRate: number
): DataPoint[] {
  const points: DataPoint[] = [];
  const monthlyRate = annualReturn / 12;
  let balance = currentSavings;
  let totalContributed = currentSavings;

  for (let age = currentAge; age <= retirementAge; age++) {
    const yearsFromNow = age - currentAge;
    const realBalance = balance / Math.pow(1 + inflationRate, yearsFromNow);
    points.push({
      age,
      contributed: Math.max(0, totalContributed),
      growth: Math.max(0, balance - totalContributed),
      total: balance,
      realTotal: realBalance,
    });

    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      totalContributed += monthlyContribution;
    }
  }

  return points;
}

function StackedAreaChart({ data, annualReturn }: { data: DataPoint[]; annualReturn: number }) {
  if (!data.length) return null;

  const width = 520;
  const height = 220;
  const padL = 60;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxVal = Math.max(Math.max(...data.map((d) => d.total)), 1);
  const minAge = data[0].age;
  const maxAge = data[data.length - 1].age;

  const toX = (age: number) => padL + ((age - minAge) / Math.max(maxAge - minAge, 1)) * chartW;
  const toY = (val: number) => padT + (1 - val / maxVal) * chartH;

  const contributedPath = data.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${toX(d.age).toFixed(1)} ${toY(d.contributed).toFixed(1)}`
  ).join(' ');

  const totalPath = data.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${toX(d.age).toFixed(1)} ${toY(d.total).toFixed(1)}`
  ).join(' ');

  const realPath = data.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${toX(d.age).toFixed(1)} ${toY(d.realTotal).toFixed(1)}`
  ).join(' ');

  const totalAreaPath = [
    ...data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.age).toFixed(1)} ${toY(d.total).toFixed(1)}`),
    `L ${toX(maxAge).toFixed(1)} ${toY(0).toFixed(1)}`,
    `L ${toX(minAge).toFixed(1)} ${toY(0).toFixed(1)}`,
    'Z',
  ].join(' ');

  const contributedAreaPath = [
    ...data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.age).toFixed(1)} ${toY(d.contributed).toFixed(1)}`),
    `L ${toX(maxAge).toFixed(1)} ${toY(0).toFixed(1)}`,
    `L ${toX(minAge).toFixed(1)} ${toY(0).toFixed(1)}`,
    'Z',
  ].join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const fmtY = (v: number) => {
    const n = v * maxVal;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const ageStep = Math.max(5, Math.ceil((maxAge - minAge) / 6 / 5) * 5);
  const xLabels: number[] = [];
  for (let a = Math.ceil(minAge / 5) * 5; a <= maxAge; a += ageStep) xLabels.push(a);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="Retirement portfolio growth chart">
        <defs>
          <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="contributedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {gridLines.map((g) => {
          const y = padT + (1 - g) * chartH;
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={0.5} />
              <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} className="fill-slate-400 dark:fill-slate-500">{fmtY(g)}</text>
            </g>
          );
        })}

        {xLabels.map((age) => {
          const x = toX(age);
          return (
            <g key={age}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={0.5} />
              <text x={x} y={padT + chartH + 12} textAnchor="middle" fontSize={9} className="fill-slate-400 dark:fill-slate-500">Age {age}</text>
            </g>
          );
        })}

        <path d={totalAreaPath} fill="url(#growthGrad)" />
        <path d={contributedAreaPath} fill="url(#contributedGrad)" />

        <path d={totalPath} fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinejoin="round" />
        <path d={contributedPath} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" strokeDasharray="4 2" />
        <path d={realPath} fill="none" stroke="#f97316" strokeWidth={1.5} strokeLinejoin="round" strokeDasharray="6 3" />

        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={0.5} />
      </svg>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-emerald-500 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Portfolio Value ({(annualReturn * 100).toFixed(1)}% return)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-blue-500 flex-shrink-0" style={{ borderTop: '2px dashed #3b82f6', background: 'none' }} />
          <span className="text-[10px] text-slate-500">Total Contributed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 flex-shrink-0" style={{ borderTop: '1.5px dashed #f97316' }} />
          <span className="text-[10px] text-slate-500">Inflation-Adjusted Value</span>
        </div>
      </div>
    </div>
  );
}

function MilestoneTable({ data }: { data: DataPoint[] }) {
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const milestones = data.filter((_d, i) => i % 5 === 0 || i === data.length - 1);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Age</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-blue-500 uppercase tracking-wider text-[10px]">Contributed</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-emerald-500 uppercase tracking-wider text-[10px]">Growth</th>
            <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Total</th>
          </tr>
        </thead>
        <tbody>
          {milestones.map((d, i) => (
            <tr key={d.age} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <td className="px-4 py-2.5 font-bold text-slate-800">Age {d.age}</td>
              <td className="px-3 py-2.5 text-right text-blue-600 font-semibold">{fmt(d.contributed)}</td>
              <td className="px-3 py-2.5 text-right text-emerald-600 font-semibold">{fmt(d.growth)}</td>
              <td className="px-4 py-2.5 text-right font-black text-slate-800">{fmt(d.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RetirementPanel({
  currentAge,
  retirementAge,
  currentSavings,
  monthlyContribution,
  annualReturn,
  inflationRate,
}: RetirementPanelProps) {
  const data = useMemo(() =>
    buildProjection(currentAge, retirementAge, currentSavings, monthlyContribution, annualReturn, inflationRate),
    [currentAge, retirementAge, currentSavings, monthlyContribution, annualReturn, inflationRate]
  );

  const pessimistic = useMemo(() =>
    buildProjection(currentAge, retirementAge, currentSavings, monthlyContribution, Math.max(0, annualReturn - 0.02), inflationRate),
    [currentAge, retirementAge, currentSavings, monthlyContribution, annualReturn, inflationRate]
  );

  const optimistic = useMemo(() =>
    buildProjection(currentAge, retirementAge, currentSavings, monthlyContribution, annualReturn + 0.02, inflationRate),
    [currentAge, retirementAge, currentSavings, monthlyContribution, annualReturn, inflationRate]
  );

  if (!data.length) return null;

  const finalData = data[data.length - 1];
  const pessimisticFinal = pessimistic[pessimistic.length - 1];
  const optimisticFinal = optimistic[optimistic.length - 1];

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingUp size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Retirement Projection</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Portfolio Growth Over Time</p>
          <StackedAreaChart data={data} annualReturn={annualReturn} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Return Scenarios at Age {retirementAge}</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Pessimistic</p>
              <p className="text-sm font-black text-red-700">{fmt(pessimisticFinal.total)}</p>
              <p className="text-[10px] text-red-400 mt-0.5">{((annualReturn - 0.02) * 100).toFixed(1)}% return</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 ring-2 ring-blue-300">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Expected</p>
              <p className="text-sm font-black text-blue-700">{fmt(finalData.total)}</p>
              <p className="text-[10px] text-blue-400 mt-0.5">{(annualReturn * 100).toFixed(1)}% return</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Optimistic</p>
              <p className="text-sm font-black text-emerald-700">{fmt(optimisticFinal.total)}</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">{((annualReturn + 0.02) * 100).toFixed(1)}% return</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Year-by-Year Milestones</p>
            <DownloadCsvButton
              filename="retirement-projection.csv"
              headers={['Age', 'Contributed', 'Growth', 'Total', 'Inflation-Adjusted Total']}
              rows={data.map((d) => [
                d.age,
                d.contributed.toFixed(2),
                d.growth.toFixed(2),
                d.total.toFixed(2),
                d.realTotal.toFixed(2),
              ])}
            />
          </div>
          <MilestoneTable data={data} />
        </div>
      </div>
    </div>
  );
}
