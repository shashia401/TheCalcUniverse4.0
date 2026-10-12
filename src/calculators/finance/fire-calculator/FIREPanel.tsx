import { useMemo } from 'react';
import type { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import MiniRing from '../../../components/calculator/MiniRing';
import { parseFireInputs, computeFire, COAST_RETIREMENT_AGE, FAT_FIRE_MULTIPLIER } from './fireMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getResultValue(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '';
}

const fmtMoney = (v: number) => {
  if (v >= 1_000_000) return `$${+(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${+(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-slate-600 mb-0.5">
        <span>Progress to target</span>
        <span>{clamped.toFixed(0)}%</span>
      </div>
      <div
        className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress toward your FIRE target"
      >
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function FIREAgeCard({ fireAge, fireType }: { fireAge: string; fireType: string }) {
  const ageNum = parseFloat(fireAge);
  const color =
    !isNaN(ageNum) && ageNum < 40
      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
      : !isNaN(ageNum) && ageNum < 50
      ? 'bg-amber-50 border-amber-300 text-amber-800'
      : 'bg-slate-50 border-slate-300 text-slate-700';

  return (
    <div className={`rounded-xl border-2 px-4 py-3 text-center ${color}`}>
      <div className="text-[10px] uppercase tracking-widest font-bold mb-0.5">{fireType} Target Age</div>
      <div className="text-2xl font-black">{fireAge}</div>
    </div>
  );
}

export default function FIREPanel({ values, results }: Props) {
  const inputs = useMemo(() => parseFireInputs(values), [values]);
  const fire = useMemo(() => (inputs ? computeFire(inputs) : null), [inputs]);
  if (!inputs || !fire || !results.length) return null;

  const fireType = inputs.fireType;
  const fireNumberStr = getResultValue(results, 'fireNumber');
  const fireAgeStr = getResultValue(results, 'fireAge');
  const yearsToFireStr = getResultValue(results, 'yearsToFire');
  const monthlySavingsStr = getResultValue(results, 'monthlySavings');

  const fireTypeLabel =
    fireType === 'standard' ? 'Standard' : fireType === 'lean' ? 'Lean' : fireType === 'fat' ? 'Fat' : 'Coast';

  const pctToFire = fire.target > 0 ? (inputs.netWorth / fire.target) * 100 : 0;
  const projection = fire.balances.map((y, x) => ({ x, y }));
  const targetLabel = fireType === 'coast' ? 'Coast number' : 'FIRE number';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-emerald-100/50">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
          {fireTypeLabel} FIRE Path
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* FIRE Age Card & Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FIREAgeCard fireAge={fireAgeStr} fireType={fireTypeLabel} />

          <div className="rounded-xl border border-slate-200 px-3 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-600 mb-0.5">Target Nest Egg</div>
            <div className="text-lg font-black text-slate-800">{fireNumberStr}</div>
          </div>

          <div className="rounded-xl border border-slate-200 px-3 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-600 mb-0.5">Years to Go</div>
            <div className="text-lg font-black text-slate-800">{yearsToFireStr}</div>
          </div>

          <div className="rounded-xl border border-slate-200 px-3 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-600 mb-0.5">Monthly Savings</div>
            <div className="text-lg font-black text-slate-800">{monthlySavingsStr}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar pct={pctToFire} />

        {/* Timeline Chart */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">
            Net Worth Growth to {fireType === 'coast' ? 'Coast Number' : 'FIRE'}
          </p>
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2">
            {fire.achievable ? (
              <SvgLineChart
                series={[{ name: 'Net worth', color: '#047857', points: projection }]}
                refLines={[{ y: fire.target, label: `${targetLabel} ${fmtMoney(fire.target)}`, color: '#b45309' }]}
                height={180}
                xFormat={(n) => `Yr ${n}`}
                yFormat={fmtMoney}
                ariaLabel={`Projected net worth over ${fire.balances.length - 1} years reaching ${fmtMoney(fire.target)}`}
              />
            ) : (
              <p className="text-xs text-slate-600 px-2 py-6 text-center">
                At these savings and returns your net worth does not reach {fmtMoney(fire.target)} within 100 years. Increase savings, cut expenses, or raise the expected return.
              </p>
            )}
          </div>
        </div>

        {/* Bottom Row: Ring + Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col items-center">
            <MiniRing
              value={fire.savingsRate}
              total={100}
              color={fire.savingsRate >= 50 ? '#047857' : fire.savingsRate >= 20 ? '#b45309' : '#b91c1c'}
              size={100}
              label={`Savings rate ${fire.savingsRate.toFixed(0)} percent`}
            />
            <span className="text-sm font-black text-slate-800 mt-1">{fire.savingsRate.toFixed(0)}%</span>
            <span className="text-[10px] text-slate-600">Savings Rate</span>
          </div>

          <div className="flex flex-col justify-center gap-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-700 flex-shrink-0" aria-hidden="true" />
              <span>Net worth growth towards the target</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-amber-700 flex-shrink-0" aria-hidden="true" />
              <span>{targetLabel} (dashed line)</span>
            </div>
          </div>
        </div>

        {/* FIRE Type Info */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5">
          <p className="text-xs text-blue-800">
            <strong>{fireTypeLabel} FIRE:</strong>{' '}
            {fireType === 'lean'
              ? `Targets a minimalist lifestyle. FIRE number = annual expenses ÷ ${inputs.withdrawalPct}% withdrawal rate.`
              : fireType === 'fat'
              ? `Targets a luxury retirement. FIRE number = ${FAT_FIRE_MULTIPLIER}x annual expenses ÷ ${inputs.withdrawalPct}% withdrawal rate.`
              : fireType === 'coast'
              ? `The amount invested today that grows to your FIRE number by age ${COAST_RETIREMENT_AGE} with no more contributions.`
              : `Standard FIRE: FIRE number = annual expenses ÷ ${inputs.withdrawalPct}% withdrawal rate.`}
          </p>
        </div>
      </div>
    </div>
  );
}
