import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';

interface InvestmentPanelProps {
  startingAmount: number;
  contribution: number;
  contributionFrequency: 'weekly' | 'monthly' | 'annually';
  years: number;
  returnRate: number;
  variance: number;
}

interface DataPoint {
  year: number;
  contributed: number;
  returns: number;
  total: number;
  optimistic: number;
  pessimistic: number;
}

function buildProjection(
  P: number,
  monthlyContrib: number,
  years: number,
  returnRate: number,
  variance: number,
  totalContributedByYear: (y: number) => number
): DataPoint[] {
  const points: DataPoint[] = [];

  for (let y = 0; y <= years; y++) {
    const months = y * 12;
    const mr = returnRate / 12;
    const mrO = (returnRate + variance) / 12;
    const mrP = Math.max(0, returnRate - variance) / 12;

    const fv = (rate: number) => {
      const futureP = P * Math.pow(1 + rate, months);
      const futurePMT = rate === 0
        ? monthlyContrib * months
        : monthlyContrib * ((Math.pow(1 + rate, months) - 1) / rate);
      return futureP + futurePMT;
    };

    const total = fv(mr);
    const contributed = totalContributedByYear(y);
    points.push({
      year: y,
      contributed,
      returns: Math.max(0, total - contributed),
      total,
      optimistic: fv(mrO),
      pessimistic: fv(mrP),
    });
  }
  return points;
}

function BarChart({ data, returnRate, variance }: { data: DataPoint[]; returnRate: number; variance: number }) {
  if (!data.length) return null;

  const width = 520;
  const height = 220;
  const padL = 60;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxVal = Math.max(...data.map((d) => d.optimistic));
  const toY = (v: number) => maxVal > 0 ? padT + (1 - v / maxVal) * chartH : padT + chartH;
  const toX = (yr: number) => padL + (yr / Math.max(data.length - 1, 1)) * chartW;

  const expectedPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.total).toFixed(1)}`).join(' ');
  const optimisticPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.optimistic).toFixed(1)}`).join(' ');
  const pessimisticPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.pessimistic).toFixed(1)}`).join(' ');
  const contributedPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.contributed).toFixed(1)}`).join(' ');

  const bandPath = [
    ...data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.optimistic).toFixed(1)}`),
    ...data.map((_d, i) => `L ${toX(data.length - 1 - i).toFixed(1)} ${toY(data[data.length - 1 - i].pessimistic).toFixed(1)}`),
    'Z',
  ].join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const fmtY = (v: number) => {
    const n = v * maxVal;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const yearStep = Math.max(1, Math.ceil(data.length / 8));
  const xLabels = data.filter((_, i) => i % yearStep === 0 || i === data.length - 1);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="Investment growth chart">
        <defs>
          <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
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

        {xLabels.map((d, i) => {
          const x = toX(data.indexOf(d));
          return (
            <g key={`item-${i}`}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={x} y={padT + chartH + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">Yr {d.year}</text>
            </g>
          );
        })}

        <path d={bandPath} fill="url(#bandGrad)" />
        <path d={optimisticPath} fill="none" stroke="#22c55e" strokeWidth={1.5} strokeLinejoin="round" strokeDasharray="5 3" />
        <path d={pessimisticPath} fill="none" stroke="#ef4444" strokeWidth={1.5} strokeLinejoin="round" strokeDasharray="5 3" />
        <path d={contributedPath} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" strokeDasharray="4 2" />
        <path d={expectedPath} fill="none" stroke="#0ea5e9" strokeWidth={2.5} strokeLinejoin="round" />

        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      </svg>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-sky-500 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Expected ({(returnRate * 100).toFixed(1)}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 flex-shrink-0" style={{ borderTop: '1.5px dashed #22c55e' }} />
          <span className="text-[10px] text-slate-500">Optimistic (+{(variance * 100).toFixed(0)}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 flex-shrink-0" style={{ borderTop: '1.5px dashed #ef4444' }} />
          <span className="text-[10px] text-slate-500">Pessimistic (−{(variance * 100).toFixed(0)}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 flex-shrink-0" style={{ borderTop: '2px dashed #3b82f6' }} />
          <span className="text-[10px] text-slate-500">Total Contributed</span>
        </div>
      </div>
    </div>
  );
}

function FinalBreakdownBar({ contributed, returns, total }: { contributed: number; returns: number; total: number }) {
  const contribPct = (contributed / total) * 100;
  const returnsPct = (returns / total) * 100;

  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-3">
      <div className="flex rounded-full overflow-hidden h-5">
        <div className="bg-blue-500 transition-all" style={{ width: `${contribPct}%` }} title={`Contributed: ${fmt(contributed)}`} />
        <div className="bg-emerald-500 transition-all" style={{ width: `${returnsPct}%` }} title={`Returns: ${fmt(returns)}`} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <span className="text-slate-600 font-semibold">You contributed</span>
          <span className="font-black text-blue-600">{fmt(contributed)}</span>
          <span className="text-slate-500">({contribPct.toFixed(0)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span className="text-slate-600 font-semibold">Market returned</span>
          <span className="font-black text-emerald-600">{fmt(returns)}</span>
          <span className="text-slate-500">({returnsPct.toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  );
}

export default function InvestmentPanel({
  startingAmount,
  contribution,
  contributionFrequency,
  years,
  returnRate,
  variance,
}: InvestmentPanelProps) {
  const monthlyContrib = contributionFrequency === 'weekly'
    ? (contribution * 52) / 12
    : contributionFrequency === 'annually'
    ? contribution / 12
    : contribution;

  const totalContributedByYear = (y: number) => {
    const annualContrib = contributionFrequency === 'weekly'
      ? contribution * 52
      : contributionFrequency === 'monthly'
      ? contribution * 12
      : contribution;
    return startingAmount + annualContrib * y;
  };

  const data = useMemo(
    () => buildProjection(startingAmount, monthlyContrib, years, returnRate, variance, totalContributedByYear),
    [startingAmount, monthlyContrib, years, returnRate, variance]
  );

  if (!data.length) return null;

  const final = data[data.length - 1];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingUp size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Investment Projection</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Growth Over Time — 3 Scenarios</p>
          <BarChart data={data} returnRate={returnRate} variance={variance} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Your Contributions vs. Market Returns at Year {years}</p>
          <FinalBreakdownBar contributed={final.contributed} returns={final.returns} total={final.total} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Pessimistic</p>
            <p className="text-sm font-black text-red-700">
              {final.pessimistic >= 1_000_000 ? `$${(final.pessimistic / 1_000_000).toFixed(2)}M` : `$${final.pessimistic.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            </p>
            <p className="text-[10px] text-red-400 mt-0.5">{((Math.max(0, returnRate - variance)) * 100).toFixed(1)}%/yr</p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 ring-2 ring-sky-300">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600 mb-1">Expected</p>
            <p className="text-sm font-black text-sky-700">
              {final.total >= 1_000_000 ? `$${(final.total / 1_000_000).toFixed(2)}M` : `$${final.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            </p>
            <p className="text-[10px] text-sky-400 mt-0.5">{(returnRate * 100).toFixed(1)}%/yr</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Optimistic</p>
            <p className="text-sm font-black text-emerald-700">
              {final.optimistic >= 1_000_000 ? `$${(final.optimistic / 1_000_000).toFixed(2)}M` : `$${final.optimistic.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            </p>
            <p className="text-[10px] text-emerald-400 mt-0.5">{((returnRate + variance) * 100).toFixed(1)}%/yr</p>
          </div>
        </div>
      </div>
    </div>
  );
}
