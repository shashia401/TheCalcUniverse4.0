import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { drywall } from './drywallMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const sq = (n: number) => `${n.toFixed(0)} sq ft`;

export default function DrywallPanel({ values, results }: Props) {
  const d = drywall(values);
  if (!d || !results.length) return null;
  const max = Math.max(d.wallArea, d.ceilingArea, d.withWaste);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Drywall Estimate</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Sheets Needed</p>
          <p className="text-3xl font-bold text-blue-800">{d.sheets} sheets</p>
        </div>
        <HBarRow label="Wall Area" value={d.wallArea} max={max} display={sq(d.wallArea)} color="bg-blue-700" labelWidth="w-32" height="h-5" className="py-1" />
        {d.ceilingArea > 0 && <HBarRow label="Ceiling Area" value={d.ceilingArea} max={max} display={sq(d.ceilingArea)} color="bg-purple-700" labelWidth="w-32" height="h-5" className="py-1" />}
        <HBarRow label="Net Area (w/waste)" value={d.withWaste} max={max} display={sq(d.withWaste)} color="bg-emerald-700" labelWidth="w-32" height="h-5" className="py-1" />
      </div>
    </div>
  );
}
