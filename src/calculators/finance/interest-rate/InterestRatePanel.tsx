import { Percent } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { parseAmount as parseVal } from '../../../utils/calcResults';
import HBarRow from '../../../components/calculator/HBarRow';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Percent size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Rate Analysis
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="space-y-1">
          <HBarRow label="Nominal Annual Rate" value={nominal} max={maxRate} display={`${(nominal * 100).toFixed(4)}%`} color="bg-blue-700" labelWidth="w-40" />
          <HBarRow label="Effective Annual Rate (EAR)" value={ear} max={maxRate} display={`${(ear * 100).toFixed(4)}%`} color="bg-emerald-700" labelWidth="w-40" />
        </div>

        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-600">Compounding Bonus</span>
            <span className="text-xs font-bold text-emerald-700">+{((ear - nominal) * 100).toFixed(4)}%</span>
          </div>
          <p className="text-[10px] text-slate-600">EAR accounts for compounding — it is the true annual rate</p>
        </div>

        {totalInterest > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">Total Interest</p>
              <p className="text-lg font-black text-emerald-700">
                ${totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">Total Growth</p>
              <p className="text-lg font-black text-blue-700">{(growth * 100).toFixed(2)}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
