import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { mulchVolume } from '../shared/mulchMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function MulchTopsoilPanel({ values, results }: Props) {
  const length = parseFloat(values.length);
  const width = parseFloat(values.width);
  const depth = parseFloat(values.depth);
  if (!results.length || !(length > 0) || !(width > 0) || !(depth > 0)) return null;
  const v = mulchVolume(length * width, depth);
  const max = Math.max(v.orderCuFt, v.bags2 * 2);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Material Volume</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-green-800">Cubic Yards (exact)</p>
          <p className="text-3xl font-bold text-green-800">{v.rawCuYd.toFixed(2)} cu yd</p>
          <p className="text-xs text-green-800 mt-1">Suggested order with 10% buffer: {v.orderCuYd.toFixed(2)} cu yd</p>
        </div>
        <HBarRow label="Cubic Feet" value={v.rawCuFt} max={max} display={`${v.rawCuFt.toFixed(1)} ft³`} color="bg-blue-700" labelWidth="w-28" height="h-5" className="py-1" />
        <HBarRow label="With Buffer" value={v.orderCuFt} max={max} display={`${v.orderCuFt.toFixed(1)} ft³`} color="bg-emerald-700" labelWidth="w-28" height="h-5" className="py-1" />
        <HBarRow label="2 cu ft Bags" value={v.bags2 * 2} max={max} display={`${v.bags2} bags`} color="bg-amber-700" labelWidth="w-28" height="h-5" className="py-1" />
        <div className="mt-2 rounded-lg border border-slate-200 px-3 py-2 flex justify-between">
          <span className="text-xs text-slate-600">Area</span>
          <span className="text-sm font-bold text-slate-700">{(length * width).toFixed(0)} sq ft</span>
        </div>
      </div>
    </div>
  );
}
