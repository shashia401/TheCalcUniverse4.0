import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { lumber } from './lumberMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function LumberPanel({ values, results }: Props) {
  const l = lumber(values);
  if (!l || !results.length) return null;
  const totalCost = results.find((r) => r.id === 'totalCost');
  const max = Math.max(l.totalBdFt, l.actualBdFt);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Lumber Quantity</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Total Board Feet (nominal)</p>
          <p className="text-3xl font-bold text-amber-800">{l.totalBdFt.toFixed(2)} bd ft</p>
        </div>
        <HBarRow label="Nominal" value={l.totalBdFt} max={max} display={`${l.totalBdFt.toFixed(1)} bd ft`} color="bg-blue-700" labelWidth="w-28" height="h-5" className="py-1" />
        <HBarRow label="Actual (S4S)" value={l.actualBdFt} max={max} display={`${l.actualBdFt.toFixed(1)} bd ft`} color="bg-emerald-700" labelWidth="w-28" height="h-5" className="py-1" />
        <p className="text-xs text-slate-600">
          {l.quantity} board{l.quantity === 1 ? '' : 's'} x {l.length} ft = {l.linearFt.toFixed(0)} linear ft; {l.perBoard.toFixed(2)} bd ft each.
        </p>
        {totalCost && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Estimated Cost</span>
              <span className="text-lg font-bold text-slate-700">{totalCost.value}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
