import { useMemo } from 'react';
import { TrendingUp, ExternalLink } from 'lucide-react';

interface Props {
  annualCostNow: number;
  yearsUntilCollege: number;
  collegeYears: number;
  tuitionInflation: number;
  growthRate: number;
  currentSavings: number;
  monthlyContribution: number;
  institutionLabel: string;
}

export default function CollegeCostPanel({
  annualCostNow,
  yearsUntilCollege,
  collegeYears,
  tuitionInflation,
  growthRate,
  currentSavings,
  monthlyContribution,
  institutionLabel,
}: Props) {
  const data = useMemo(() => {
    const monthlyRate = growthRate / 12;
    // Year-by-year cost projections
    const costProjections: number[] = [];
    for (let y = 0; y < collegeYears; y++) {
      costProjections.push(annualCostNow * Math.pow(1 + tuitionInflation, yearsUntilCollege + y));
    }

    // Savings growth from now to college start (year by year)
    const savingsGrowth: { year: number; savings: number }[] = [];
    for (let y = 0; y <= yearsUntilCollege; y++) {
      const m = y * 12;
      let savings: number;
      if (monthlyRate === 0) {
        savings = currentSavings + monthlyContribution * m;
      } else {
        savings =
          currentSavings * Math.pow(1 + monthlyRate, m) +
          monthlyContribution * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate);
      }
      savingsGrowth.push({ year: yearsUntilCollege - y, savings });
    }

    return { costProjections, savingsGrowth };
  }, [annualCostNow, yearsUntilCollege, collegeYears, tuitionInflation, growthRate, currentSavings, monthlyContribution]);

  const totalProjected = data.costProjections.reduce((s, c) => s + c, 0);
  const finalSavings = data.savingsGrowth[data.savingsGrowth.length - 1]?.savings ?? 0;
  const gap = Math.max(0, totalProjected - finalSavings);
  const pctFunded = totalProjected > 0 ? Math.min(100, (finalSavings / totalProjected) * 100) : 0;

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtLarge = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const ageStart = 18;
  const collegeAgeStart = ageStart;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingUp size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">College Cost Projection</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Source citation */}
        <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-200 p-3">
          <ExternalLink size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-blue-700 leading-relaxed">
            Cost data source:{' '}
            <a
              href="https://research.collegeboard.org/trends/college-pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline hover:text-blue-900"
            >
              College Board, "Trends in College Pricing 2024"
            </a>
            . Average published tuition &amp; fees for {institutionLabel}: ${fmt(annualCostNow)}/year.
            Actual net prices vary by institution and financial aid.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Projected Cost</p>
            <p className="text-lg font-black text-slate-800">{fmtLarge(totalProjected)}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Projected Savings</p>
            <p className="text-lg font-black text-emerald-700">{fmtLarge(finalSavings)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Coverage</p>
            <p className="text-lg font-black text-slate-800">{pctFunded.toFixed(0)}%</p>
          </div>
          <div className={`rounded-xl border px-4 py-3 ${gap > 0 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${gap > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {gap > 0 ? 'Funding Gap' : 'Fully Funded!'}
            </p>
            <p className={`text-lg font-black ${gap > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {gap > 0 ? fmtLarge(gap) : '✓'}
            </p>
          </div>
        </div>

        {/* Savings growth chart */}
        {data.savingsGrowth.length > 1 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Savings Growth Until College (Age {Math.max(0, collegeAgeStart - yearsUntilCollege)} → Age {collegeAgeStart})
            </p>
            <div className="w-full overflow-x-auto">
              <SavingsChart data={data.savingsGrowth} totalProjected={totalProjected} />
            </div>
          </div>
        )}

        {/* Cost breakdown by year */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Projected Annual Costs in College
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Year</th>
                  <th scope="col" className="text-left px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Age</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Estimated Cost</th>
                  <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {data.costProjections.map((cost, i) => (
                  <tr key={`item-${i}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-slate-800">Year {i + 1}</td>
                    <td className="px-3 py-2.5 text-slate-600">Age {collegeAgeStart + i}</td>
                    <td className="px-3 py-2.5 text-right text-red-600 font-semibold">{fmtLarge(cost)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-700">
                      {totalProjected > 0 ? ((cost / totalProjected) * 100).toFixed(0) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td className="px-4 py-2.5 font-bold text-slate-800" colSpan={2}>Total</td>
                  <td className="px-3 py-2.5 text-right font-black text-red-600">{fmtLarge(totalProjected)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-800">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Key insight */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-700 mb-1">
            {gap > 0
              ? `You are on track to cover ${pctFunded.toFixed(0)}% of projected costs.`
              : 'You are on track to fully cover projected costs.'}
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {institutionLabel} currently costs <strong>{fmtLarge(annualCostNow)}/year</strong>.
            With {tuitionInflation * 100}% annual inflation, a {collegeYears}-year degree starting
            in {yearsUntilCollege} years is projected at <strong>{fmtLarge(totalProjected)}</strong>.
            Review annually and adjust contributions as the child gets closer to college age.
          </p>
        </div>
      </div>
    </div>
  );
}

function SavingsChart({
  data,
  totalProjected,
}: {
  data: { year: number; savings: number }[];
  totalProjected: number;
}) {
  const maxVal = Math.max(totalProjected, ...data.map((d) => d.savings));

  const width = 520;
  const height = 180;
  const padL = 55;
  const padR = 20;
  const padT = 16;
  const padB = 36;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const toX = (i: number) => padL + (i / (data.length - 1 || 1)) * chartW;
  const toY = (v: number) => padT + (1 - v / maxVal) * chartH;

  const savingsPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.savings).toFixed(1)}`).join(' ');

  const areaPath = savingsPath
    + ` L ${toX(data.length - 1).toFixed(1)} ${toY(0).toFixed(1)}`
    + ` L ${toX(0).toFixed(1)} ${toY(0).toFixed(1)} Z`;

  const costLineX = toX(data.length - 1);

  const fmtY = (v: number) => {
    const n = v * maxVal;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px', maxWidth: '100%' }} role="img" aria-label="College cost savings projection chart">
      <defs>
        <linearGradient id="collegeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((g) => {
        const y = padT + (1 - g) * chartH;
        return (
          <g key={g}>
            <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
            <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">{fmtY(g)}</text>
          </g>
        );
      })}

      {/* Cost target line */}
      <line x1={costLineX} y1={padT} x2={costLineX} y2={padT + chartH} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 3" />

      <path d={areaPath} fill="url(#collegeGrad)" />
      <path d={savingsPath} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" />

      {/* Total project cost label */}
      <text x={costLineX + 4} y={padT + 12} fontSize={9} fill="#ef4444" fontWeight="bold">
        Total Cost: ${(totalProjected / 1000).toFixed(0)}K
      </text>

      <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      <text x={padL + chartW / 2} y={height - 2} textAnchor="middle" fontSize={9} fill="#94a3b8">
        Years Until College
      </text>

      {/* X-axis labels */}
      {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0 || i === data.length - 1).map((d) => {
        const x = toX(data.indexOf(d));
        return (
          <text key={d.year} x={x} y={padT + chartH + 14} textAnchor="middle" fontSize={9} fill="#94a3b8">
            {d.year === 0 ? 'Now' : `-${d.year}yr`}
          </text>
        );
      })}
    </svg>
  );
}
