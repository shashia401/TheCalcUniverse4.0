import { TrendingUp } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { computeInterest } from './interestMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const usd = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function InterestCalcPanel({ values, results }: Props) {
  if (!results.length || results[0].id === 'error') return null;

  // Same pure function as index.ts, so no formatted result strings are re-parsed.
  const principal = parseFloat(values.principal);
  if (!(principal > 0)) return null;
  const calc = computeInterest({
    principal,
    annualRate: parseFloat(values.interestRate) / 100,
    timeUnit: values.timeUnit || 'years',
    timePeriod: parseFloat(values.timePeriod),
    interestType: values.interestType || 'simple',
    n: parseFloat(values.compoundFrequency || '12'),
  });
  if (!calc.finite) return null;

  const { totalAmount: total, totalInterest: interest, growthMultiple: growth } = calc;
  const hasCompoundBonus = results.some((r) => r.id === 'compoundBonus');
  const maxBar = Math.max(total, 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingUp size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Principal vs. Interest
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="space-y-1">
          <HBarRow label="Principal" value={principal} max={maxBar} display={usd(principal)} color="bg-blue-700" labelWidth="w-28" />
          <HBarRow label="Total Interest" value={Math.max(0, interest)} max={maxBar} display={usd(interest)} color="bg-emerald-700" labelWidth="w-28" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Total Accrued</p>
            <p className="text-lg font-black text-slate-700">{usd(total)}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">Growth Multiple</p>
            <p className="text-lg font-black text-blue-700">{growth.toFixed(2)}x</p>
          </div>
        </div>

        {hasCompoundBonus && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3">
            <p className="text-xs font-bold text-emerald-700 mb-1">Compound Advantage</p>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              You earned interest on previously earned interest — something simple interest cannot do.
            </p>
          </div>
        )}

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
          <p className="text-xs font-bold text-slate-600 mb-1">Breakdown</p>
          <div className="flex justify-between text-[11px] text-slate-600">
            <span>Principal: {((principal / total) * 100).toFixed(1)}%</span>
            <span>Interest: {((interest / total) * 100).toFixed(1)}%</span>
            <span>Total: {usd(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
