import { Tag } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { parseAmount as parseVal } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function PercentOffPanel({ values, results }: Props) {
  const finalRes = results.find((r) => r.id === 'final');
  const originalRes = results.find((r) => r.id === 'price') || results.find((r) => r.id === 'price');
  const savedRes = results.find((r) => r.id === 'saved');
  const effectiveRes = results.find((r) => r.id === 'effective');
  const firstDiscRes = results.find((r) => r.id === 'firstDisc');
  const secondDiscRes = results.find((r) => r.id === 'secondDisc');
  const taxRes = results.find((r) => r.id === 'tax');

  if (!finalRes || !savedRes) return null;

  const originalPrice = parseVal(originalRes?.value || '0');
  const finalPrice = parseVal(finalRes.value);
  const saved = parseVal(savedRes.value);
  const effectivePct = effectiveRes ? parseFloat(effectiveRes.value.replace('%', '')) : 0;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

  const maxVal = Math.max(originalPrice, 1);
  const bar = (v: number) => (v / maxVal) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Tag size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Price Comparison
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="rounded-xl bg-emerald-50 border-2 border-emerald-300 px-5 py-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">You Save</p>
          <p className="text-3xl font-black text-emerald-700">{fmt(saved)}</p>
          <p className="text-sm font-bold text-emerald-500 mt-1">{effectivePct.toFixed(1)}% effective discount</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2">Original</p>
            <p className="text-xl font-black text-red-600">{fmt(originalPrice)}</p>
            <div className="mt-2 h-3 bg-red-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Discounted</p>
            <p className="text-xl font-black text-emerald-700">{fmt(finalPrice)}</p>
            <div className="mt-2 h-3 bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${bar(finalPrice)}%` }} />
            </div>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {firstDiscRes && (
            <div className="flex justify-between px-2">
              <span className="text-slate-500">After first discount</span>
              <span className="font-semibold text-slate-700">{firstDiscRes.value}</span>
            </div>
          )}
          {secondDiscRes && (
            <div className="flex justify-between px-2">
              <span className="text-slate-500">After second discount</span>
              <span className="font-semibold text-slate-700">{secondDiscRes.value}</span>
            </div>
          )}
          {taxRes && (
            <div className="flex justify-between px-2">
              <span className="text-slate-500">Sales tax</span>
              <span className="font-semibold text-red-500">{taxRes.value}</span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-2 flex justify-between px-2 font-bold">
            <span className="text-slate-600">Final price</span>
            <span className="text-emerald-700">{finalRes.value}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
