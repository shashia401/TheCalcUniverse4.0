import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { paint } from './paintMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const sq = (n: number) => `${n.toFixed(0)} sq ft`;

export default function PaintCoveragePanel({ values, results }: Props) {
  const p = paint(values);
  if (!p || !results.length) return null;
  const max = Math.max(p.wallArea, p.paintableArea);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Paint Coverage</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Paint Needed</p>
          <p className="text-3xl font-bold text-blue-800">{p.gallonsWithWaste.toFixed(1)} gallons</p>
        </div>
        <HBarRow label="Total Wall Area" value={p.wallArea} max={max} display={sq(p.wallArea)} color="bg-slate-700" labelWidth="w-32" height="h-5" className="py-1" />
        <HBarRow label="Paintable Area" value={p.paintableArea} max={max} display={sq(p.paintableArea)} color="bg-blue-700" labelWidth="w-32" height="h-5" className="py-1" />
        <div className="mt-2 rounded-lg border border-slate-200 px-3 py-2 flex justify-between">
          <span className="text-xs text-slate-600">Buy</span>
          <span className="text-sm font-bold text-slate-700">{p.containers} gallon(s)</span>
        </div>
      </div>
    </div>
  );
}
