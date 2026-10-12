import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { IRA_LIMITS } from '../../../utils/taxData';
import { TrendingUp, Scale } from 'lucide-react';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { iraProjection, rateOr } from './iraMath';

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const axis = (n: number) =>
  n >= 1_000_000 ? `$${+(n / 1_000_000).toFixed(1)}M` : `$${+(n / 1_000).toFixed(0)}K`;

export default function IraPanel({ values }: { values: Record<string, string>; results: CalculatorResult[] }) {
  const currentAge = parseInt(values.currentAge) || 30;
  const retirementAge = parseInt(values.retirementAge) || 65;
  const currentBalance = Math.max(0, parseFloat(values.currentBalance) || 0);
  const annualContribution = Math.max(0, parseFloat(values.annualContribution) || 0);
  const parsedReturn = parseFloat(values.expectedReturn);
  const annualReturn = isNaN(parsedReturn) ? 0.07 : parsedReturn / 100;
  const marginalRate = rateOr(values.marginalTaxRate, 0.22);
  const retireRate = rateOr(values.retirementTaxRate, 0.12);
  const years = retirementAge - currentAge;

  const maxContrib = currentAge >= 50 ? IRA_LIMITS.totalAge50Plus : IRA_LIMITS.base;
  const contrib = Math.min(annualContribution, maxContrib);

  // Same pure function as index.ts: the Traditional line includes the invested deduction, so the
  // winner shown here can never disagree with the result rows.
  const { chartData, final } = useMemo(() => {
    const input = { years, currentBalance, contribution: contrib, annualReturn, marginalRate, retireRate };
    const data = [];
    for (let y = 1; y <= years; y++) {
      const p = iraProjection(input, y);
      data.push({ year: y, age: currentAge + y, traditional: p.tradTotal, roth: p.rothBalance });
    }
    return { chartData: data, final: years > 0 ? iraProjection(input) : null };
  }, [years, currentBalance, contrib, annualReturn, marginalRate, retireRate, currentAge]);

  if (years <= 0 || !final) return null;

  const finalRoth = final.rothBalance;
  const finalTrad = final.tradTotal;
  const tie = Math.abs(finalRoth - finalTrad) < 0.5;
  const tradBetter = finalTrad > finalRoth;
  const betterAmount = Math.abs(finalRoth - finalTrad);

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
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">Roth IRA (After-Tax)</p>
            <p className="text-lg font-black text-blue-700">{fmt(finalRoth)}</p>
            <p className="text-[10px] text-blue-700 mt-0.5">100% tax-free withdrawal</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-1">Traditional (After-Tax + Invested Deduction)</p>
            <p className="text-lg font-black text-amber-800">{fmt(finalTrad)}</p>
            <p className="text-[10px] text-amber-800 mt-0.5">After {(retireRate * 100).toFixed(0)}% withdrawal tax</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">{tie ? 'Result' : tradBetter ? 'Traditional Wins By' : 'Roth Wins By'}</p>
            <p className="text-lg font-black text-emerald-700">{tie ? 'Tie' : fmt(betterAmount)}</p>
            <p className="text-[10px] text-emerald-700 mt-0.5">{tie ? 'Same rate now and in retirement' : tradBetter ? 'Lower retirement tax rate advantage' : 'Tax-free growth advantage'}</p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700 mb-1">Breakeven Retirement Tax Rate</p>
            <p className="text-lg font-black text-purple-700">{(final.breakevenRate * 100).toFixed(1)}%</p>
            <p className="text-[10px] text-purple-700 mt-0.5">If your retirement rate is below this &rarr; Traditional wins</p>
          </div>
        </div>

        {/* Growth chart */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Balance Growth Over Time</p>
          <SvgLineChart
            series={[
              { name: 'Roth IRA (tax-free)', color: '#1d4ed8', points: chartData.map((d) => ({ x: d.age, y: d.roth })) },
              { name: 'Traditional (after tax, with invested deduction)', color: '#b45309', dashed: true, points: chartData.map((d) => ({ x: d.age, y: d.traditional })) },
            ]}
            height={200}
            xFormat={(n) => `Age ${n}`}
            yFormat={axis}
            ariaLabel={`Projected balances to age ${retirementAge}: Roth ${fmt(finalRoth)}, Traditional after tax ${fmt(finalTrad)}`}
          />
          <div className="flex flex-wrap gap-4 justify-center mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-blue-700" aria-hidden="true" />
              <span className="text-[10px] text-slate-600">Roth IRA (Tax-Free)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4" style={{ borderTop: '2px dashed #b45309' }} aria-hidden="true" />
              <span className="text-[10px] text-slate-600">Traditional (After {(retireRate * 100).toFixed(0)}% Tax, deduction invested)</span>
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
          <p className="text-xs text-slate-600 mt-2">
            If your effective retirement tax rate is below <strong>{(final.breakevenRate * 100).toFixed(1)}%</strong>, Traditional
            wins. Above that, Roth wins. Estimate your retirement rate based on how much you plan to withdraw annually.
          </p>
        </div>
      </div>
    </div>
  );
}
