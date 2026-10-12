import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { investmentFV, annualContribution, type ContributionFreq } from './investMath';

interface InvestmentPanelProps {
  startingAmount: number;
  contribution: number;
  contributionFrequency: ContributionFreq;
  years: number;
  returnRate: number;
  variance: number;
}

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const axis = (n: number) =>
  n >= 1_000_000 ? `$${+(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${+(n / 1_000).toFixed(0)}K` : `$${n.toFixed(0)}`;

function FinalBreakdownBar({ contributed, returns, total }: { contributed: number; returns: number; total: number }) {
  const contribPct = (contributed / total) * 100;
  const returnsPct = (returns / total) * 100;

  return (
    <div className="space-y-3">
      <div
        className="flex rounded-full overflow-hidden h-5"
        role="img"
        aria-label={`You contributed ${fmt(contributed)} (${contribPct.toFixed(0)}%), market returns ${fmt(returns)} (${returnsPct.toFixed(0)}%)`}
      >
        <div className="bg-blue-700" style={{ width: `${contribPct}%` }} title={`Contributed: ${fmt(contributed)}`} />
        <div className="bg-emerald-700" style={{ width: `${returnsPct}%` }} title={`Returns: ${fmt(returns)}`} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-blue-700" aria-hidden="true" />
          <span className="text-slate-600 font-semibold">You contributed</span>
          <span className="font-black text-blue-700">{fmt(contributed)}</span>
          <span className="text-slate-600">({contribPct.toFixed(0)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-700" aria-hidden="true" />
          <span className="text-slate-600 font-semibold">Market returned</span>
          <span className="font-black text-emerald-700">{fmt(returns)}</span>
          <span className="text-slate-600">({returnsPct.toFixed(0)}%)</span>
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
  const lowRate = Math.max(0, returnRate - variance);

  // Same pure function as index.ts; whole years plus the exact end year when `years` is fractional.
  const { series, final } = useMemo(() => {
    const marks: number[] = [];
    for (let y = 0; y <= Math.floor(years); y++) marks.push(y);
    if (!Number.isInteger(years)) marks.push(years);
    const at = (rate: number) => marks.map((y) => ({ x: y, y: investmentFV(startingAmount, contribution, contributionFrequency, rate, y) }));
    const total = at(returnRate);
    const contributed = marks.map((y) => ({ x: y, y: startingAmount + annualContribution(contribution, contributionFrequency) * y }));
    const last = marks.length - 1;
    const f = {
      total: total[last].y,
      optimistic: investmentFV(startingAmount, contribution, contributionFrequency, returnRate + variance, years),
      pessimistic: investmentFV(startingAmount, contribution, contributionFrequency, lowRate, years),
      contributed: contributed[last].y,
    };
    return {
      series: [
        { name: `Expected (${(returnRate * 100).toFixed(1)}%)`, color: '#0369a1', points: total },
        { name: `Optimistic (${((returnRate + variance) * 100).toFixed(1)}%)`, color: '#15803d', dashed: true, points: at(returnRate + variance) },
        { name: `Pessimistic (${(lowRate * 100).toFixed(1)}%)`, color: '#b91c1c', dashed: true, points: at(lowRate) },
        { name: 'Total contributed', color: '#1d4ed8', dashed: true, points: contributed },
      ],
      final: { ...f, returns: Math.max(0, f.total - f.contributed) },
    };
  }, [startingAmount, contribution, contributionFrequency, years, returnRate, variance, lowRate]);

  if (!(years > 0) || !(final.total > 0)) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingUp size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Investment Projection</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Growth Over Time — 3 Scenarios</p>
          <SvgLineChart
            series={series}
            height={220}
            xFormat={(n) => `Yr ${n}`}
            yFormat={axis}
            ariaLabel={`Investment growth over ${years} years: pessimistic ${fmt(final.pessimistic)}, expected ${fmt(final.total)}, optimistic ${fmt(final.optimistic)}, total contributed ${fmt(final.contributed)}`}
          />
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 px-1">
            {series.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-4 flex-shrink-0" style={{ borderTop: `2px ${s.dashed ? 'dashed' : 'solid'} ${s.color}` }} aria-hidden="true" />
                <span className="text-[10px] text-slate-600">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Your Contributions vs. Market Returns at Year {years}</p>
          <FinalBreakdownBar contributed={final.contributed} returns={final.returns} total={final.total} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-1">Pessimistic</p>
            <p className="text-sm font-black text-red-700">{fmt(final.pessimistic)}</p>
            <p className="text-[10px] text-red-700 mt-0.5">{(lowRate * 100).toFixed(1)}%/yr</p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 ring-2 ring-sky-300">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-800 mb-1">Expected</p>
            <p className="text-sm font-black text-sky-800">{fmt(final.total)}</p>
            <p className="text-[10px] text-sky-800 mt-0.5">{(returnRate * 100).toFixed(1)}%/yr</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">Optimistic</p>
            <p className="text-sm font-black text-emerald-700">{fmt(final.optimistic)}</p>
            <p className="text-[10px] text-emerald-700 mt-0.5">{((returnRate + variance) * 100).toFixed(1)}%/yr</p>
          </div>
        </div>
      </div>
    </div>
  );
}
