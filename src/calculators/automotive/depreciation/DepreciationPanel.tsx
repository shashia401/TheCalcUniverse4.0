import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { depreciation } from './depreciationMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const usd = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function DepreciationPanel({ values, results }: Props) {
  const d = depreciation(values);
  if (!d || !results.length) return null;
  const max = Math.max(d.valueNow, d.totalDepreciation, d.futureValue, d.annual);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Depreciation Summary</span>
      </div>
      <div className="p-5 space-y-2">
        {d.age > 0 && <HBarRow label="Value Today" value={d.valueNow} max={max} display={usd(d.valueNow)} color="bg-blue-700" labelWidth="w-36" />}
        <HBarRow label="Future Value" value={d.futureValue} max={max} display={usd(d.futureValue)} color="bg-emerald-700" labelWidth="w-36" />
        <HBarRow label="Total Depreciation" value={d.totalDepreciation} max={max} display={usd(d.totalDepreciation)} color="bg-red-700" labelWidth="w-36" />
        {d.annual > 0 && <HBarRow label="Annual Depreciation" value={d.annual} max={max} display={usd(d.annual)} color="bg-amber-700" labelWidth="w-36" />}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-600">Monthly Depreciation Cost</p>
          <p className="text-lg font-bold text-slate-700">{usd(d.monthly)}/month</p>
        </div>
      </div>
    </div>
  );
}
