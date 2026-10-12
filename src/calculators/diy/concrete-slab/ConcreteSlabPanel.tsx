import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { concreteOrder, slabCuFt, BAG_60_CU_FT, BAG_80_CU_FT } from '../shared/concreteMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function ConcreteSlabPanel({ values, results }: Props) {
  const length = parseFloat(values.length);
  const width = parseFloat(values.width);
  const depth = parseFloat(values.depth || '4');
  const waste = parseFloat(values.wastePct || '10');
  if (!results.length || !(length > 0) || !(width > 0) || !(depth > 0)) return null;

  const o = concreteOrder(slabCuFt(length, width, depth), waste);
  // Compare everything in cubic feet of concrete: the order, and what the bags would actually yield.
  const max = Math.max(o.totalCuFt, o.bags60 * BAG_60_CU_FT, o.bags80 * BAG_80_CU_FT);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Concrete Volume</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Cubic Yards Needed</p>
          <p className="text-3xl font-bold text-emerald-800">{o.totalCuYd.toFixed(2)} cu yd</p>
        </div>
        <HBarRow label="Cubic Feet" value={o.totalCuFt} max={max} display={`${o.totalCuFt.toFixed(2)} ft³`} color="bg-blue-700" labelWidth="w-28" />
        <HBarRow label="60-lb Bags" value={o.bags60 * BAG_60_CU_FT} max={max} display={`${o.bags60} bags`} color="bg-amber-700" labelWidth="w-28" />
        <HBarRow label="80-lb Bags" value={o.bags80 * BAG_80_CU_FT} max={max} display={`${o.bags80} bags`} color="bg-orange-700" labelWidth="w-28" />
      </div>
    </div>
  );
}
