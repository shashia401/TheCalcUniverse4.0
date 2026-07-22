import { Percent } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseVal(s: string): number {
  return parseFloat(s.replace(/[$%,+\s]/g, '').replace(/,/g, '')) || 0;
}

export default function InterestRatePanel({ results }: Props) {
  if (!results.length) return null;

  const nominalRes = results.find((r) => r.id === 'nominalRate');
  const earRes = results.find((r) => r.id === 'ear');
  const interestRes = results.find((r) => r.id === 'totalInterest');
  const growthRes = results.find((r) => r.id === 'growth');

  if (!nominalRes || !earRes) return null;

  const nominal = parseVal(nominalRes.value) / 100;
  const ear = parseVal(earRes.value) / 100;
  const totalInterest = interestRes ? parseVal(interestRes.value) : 0;
  const growth = growthRes ? parseVal(growthRes.value) / 100 : 0;

  const maxRate = Math.max(nominal, ear, 0.01);
  const bar = (v: number) => (v / maxRate) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Percent size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Rate Analysis
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-blue-600">Nominal Annual Rate</span>
              <span className="text-xs font-bold text-slate-700">{(nominal * 100).toFixed(4)}%</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${bar(nominal)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-600">Effective Annual Rate (EAR)</span>
              <span className="text-xs font-bold text-slate-700">{(ear * 100).toFixed(4)}%</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${bar(ear)}%` }} />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-600">Compounding Bonus</span>
            <span className="text-xs font-bold text-emerald-600">+{((ear - nominal) * 100).toFixed(4)}%</span>
          </div>
          <p className="text-[10px] text-slate-500">EAR accounts for compounding — it is the true annual rate</p>
        </div>

        {totalInterest > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Total Interest</p>
              <p className="text-lg font-black text-emerald-700">
                ${totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Total Growth</p>
              <p className="text-lg font-black text-blue-700">{(growth * 100).toFixed(2)}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
