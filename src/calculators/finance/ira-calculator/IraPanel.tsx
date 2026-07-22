import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { fvWithContributions } from '../../../utils/financial';
import { IRA_LIMITS } from '../../../utils/taxData';
import { TrendingUp, Scale } from 'lucide-react';

const TAX_YEAR = 2026;

export default function IraPanel({ values }: { values: Record<string, string>; results: CalculatorResult[] }) {
  const currentAge = parseInt(values.currentAge) || 30;
  const retirementAge = parseInt(values.retirementAge) || 65;
  const currentBalance = parseFloat(values.currentBalance) || 0;
  const annualContribution = parseFloat(values.annualContribution) || 0;
  const annualReturn = parseFloat(values.expectedReturn) / 100 || 0.07;
  const marginalRate = parseFloat(values.marginalTaxRate) / 100 || 0.22;
  const retireRate = parseFloat(values.retirementTaxRate) / 100 || 0.12;
  const years = retirementAge - currentAge;
  if (years <= 0) return null;

  const maxContrib = currentAge >= 50 ? IRA_LIMITS.totalAge50Plus : IRA_LIMITS.base;
  const contrib = Math.min(annualContribution, maxContrib);

  const chartData = useMemo(() => {
    const data: Array<{ year: number; age: number; traditional: number; roth: number }> = [];
    for (let y = 1; y <= years; y++) {
      const months = y * 12;
      const monthlyRate = annualReturn / 12;
      const bal = fvWithContributions(currentBalance, contrib / 12, monthlyRate, months);
      const tradAfterTax = bal * (1 - retireRate);
      const rothAfterTax = bal; // Roth withdrawals are tax-free
      data.push({ year: y, age: currentAge + y, traditional: tradAfterTax, roth: rothAfterTax });
    }
    return data;
  }, [currentBalance, contrib, annualReturn, years, retireRate, currentAge]);

  const last = chartData[chartData.length - 1];
  if (!last) return null;

  const finalRoth = last.roth;
  const finalTrad = last.traditional;
  const tradBetter = finalTrad > finalRoth;
  const betterAmount = Math.abs(finalRoth - finalTrad);

  const breakevenRate = (() => {
    if (finalRoth <= 0) return 0;
    let lo = 0, hi = 0.5;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      const tradAtMid = finalRoth * (1 - mid);
      if (tradAtMid > finalTrad) lo = mid;
      else hi = mid;
    }
    return lo;
  })();

  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  // Chart dimensions
  const maxVal = Math.max(last.traditional, last.roth);
  const width = 520;
  const height = 200;
  const padL = 55;
  const padR = 20;
  const padT = 20;
  const padB = 36;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const toX = (i: number) => padL + (i / (chartData.length - 1)) * chartW;
  const toY = (v: number) => padT + (1 - v / maxVal) * chartH;

  const pathRoth = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.roth).toFixed(1)}`).join(' ');
  const pathTrad = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.traditional).toFixed(1)}`).join(' ');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Scale size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Traditional IRA vs. Roth IRA &mdash; Side-by-Side</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Roth IRA (After-Tax)</p>
            <p className="text-lg font-black text-blue-700">{fmt(finalRoth)}</p>
            <p className="text-[10px] text-blue-500 mt-0.5">100% tax-free withdrawal</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Traditional IRA (After-Tax)</p>
            <p className="text-lg font-black text-amber-700">{fmt(finalTrad)}</p>
            <p className="text-[10px] text-amber-500 mt-0.5">After {(retireRate * 100).toFixed(0)}% withdrawal tax</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">{tradBetter ? 'Traditional Wins By' : 'Roth Wins By'}</p>
            <p className="text-lg font-black text-emerald-700">{fmt(betterAmount)}</p>
            <p className="text-[10px] text-emerald-500 mt-0.5">{tradBetter ? 'Lower retirement tax rate advantage' : 'Tax-free growth advantage'}</p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-1">Breakeven Retirement Tax Rate</p>
            <p className="text-lg font-black text-purple-700">{(breakevenRate * 100).toFixed(1)}%</p>
            <p className="text-[10px] text-purple-500 mt-0.5">If your retirement rate is below this &rarr; Traditional wins</p>
          </div>
        </div>

        {/* Growth chart */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Balance Growth Over Time</p>
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="IRA balance growth comparison chart">
              {[0, 0.25, 0.5, 0.75, 1].map((g) => {
                const y = padT + (1 - g) * chartH;
                return (
                  <g key={g}>
                    <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
                    <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">
                      {maxVal * g >= 1_000_000 ? `$${(maxVal * g / 1_000_000).toFixed(1)}M` : `$${(maxVal * g / 1_000).toFixed(0)}K`}
                    </text>
                  </g>
                );
              })}
              {/* Year labels */}
              {chartData.filter((_, i) => i % Math.max(1, Math.floor(chartData.length / 5)) === 0 || i === chartData.length - 1).map((d) => (
                <text key={d.year} x={toX(chartData.indexOf(d))} y={height - 6} textAnchor="middle" fontSize={8} fill="#94a3b8">
                  {d.age ? `Age ${d.age}` : `Yr ${d.year}`}
                </text>
              ))}
              <path d={pathRoth} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" />
              <path d={pathTrad} fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeLinejoin="round" strokeDasharray="4 3" />
              <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
            </svg>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-blue-500" />
              <span className="text-[10px] text-slate-500">Roth IRA (Tax-Free)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-amber-500" />
              <span className="text-[10px] text-slate-500">Traditional IRA (After {(retireRate * 100).toFixed(0)}% Tax)</span>
            </div>
          </div>
        </div>

        {/* Decision insight */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Decision Insight</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Your current marginal tax rate is <strong>{(marginalRate * 100).toFixed(0)}%</strong> and you estimate{' '}
            <strong>{(retireRate * 100).toFixed(0)}%</strong> in retirement.
            {marginalRate > retireRate ? (
              <> Since you are in a <strong className="text-emerald-700">higher bracket now than in retirement</strong>,
              a Traditional IRA likely makes sense &mdash; deduct contributions at {(marginalRate * 100).toFixed(0)}% now, pay{' '}
              {(retireRate * 100).toFixed(0)}% later.</>
            ) : marginalRate < retireRate ? (
              <> Since you are in a <strong className="text-blue-700">lower bracket now than in retirement</strong>,
              a Roth IRA likely makes sense &mdash; pay {(marginalRate * 100).toFixed(0)}% now, withdraw tax-free at{' '}
              {(retireRate * 100).toFixed(0)}%.</>
            ) : (
              <> Your tax rate is expected to stay the same &mdash; either choice works mathematically.
              Roth provides more <strong className="text-blue-700">tax-free flexibility</strong> in retirement.</>
            )}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            If your effective retirement tax rate is below <strong>{(breakevenRate * 100).toFixed(1)}%</strong>, Traditional
            wins. Above that, Roth wins. Estimate your retirement rate based on how much you plan to withdraw annually.
          </p>
        </div>
      </div>
    </div>
  );
}
