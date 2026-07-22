import { TrendingUp } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseVal(s: string): number {
  return parseFloat(s.replace(/[$%,+\sx]/g, '').replace(/,/g, '')) || 0;
}

export default function InterestCalcPanel({ results }: Props) {
  if (!results.length) return null;

  const principalRes = results.find((r) => r.id === 'principal');
  const interestRes = results.find((r) => r.id === 'totalInterest');
  const totalRes = results.find((r) => r.id === 'totalAmount');
  const growthRes = results.find((r) => r.id === 'growthMultiple');
  const compoundBonusRes = results.find((r) => r.id === 'compoundBonus');

  if (!principalRes || !interestRes || !totalRes) return null;

  const principal = parseVal(principalRes.value);
  const interest = parseVal(interestRes.value);
  const total = parseVal(totalRes.value);
  const growth = growthRes ? parseFloat(growthRes.value.replace('x', '')) : 0;
  const hasCompoundBonus = compoundBonusRes !== undefined;

  const maxBar = Math.max(total, 1);
  const bar = (v: number) => (v / maxBar) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <TrendingUp size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Principal vs. Interest
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-blue-600">Principal</span>
              <span className="text-xs font-bold text-slate-700">
                ${principal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${bar(principal)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-600">Total Interest</span>
              <span className="text-xs font-bold text-slate-700">
                ${interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${bar(interest)}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Accrued</p>
            <p className="text-lg font-black text-slate-700">
              ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Growth Multiple</p>
            <p className="text-lg font-black text-blue-700">{growth.toFixed(2)}x</p>
          </div>
        </div>

        {hasCompoundBonus && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3">
            <p className="text-xs font-bold text-emerald-700 mb-1">Compound Advantage</p>
            <p className="text-[11px] text-emerald-600 leading-relaxed">
              You earned interest on previously earned interest — something simple interest cannot do.
            </p>
          </div>
        )}

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
          <p className="text-xs font-bold text-slate-600 mb-1">Breakdown</p>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Principal: {((principal / total) * 100).toFixed(1)}%</span>
            <span>Interest: {((interest / total) * 100).toFixed(1)}%</span>
            <span>Total: ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
