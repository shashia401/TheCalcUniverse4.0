import { Scale } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseVal(s: string): number {
  return parseFloat(s.replace(/[$%,+\s]/g, '').replace(/,/g, '')) || 0;
}

export default function MarriageTaxPanel({ results }: Props) {
  if (!results.length) return null;

  const singleRes = results.find((r) => r.id === 'unmarriedTotal');
  const marriedRes = results.find((r) => r.id === 'marriedTotal');
  const heroRes = results.find((r) => r.id === 'hero');
  const incomeRes = results.find((r) => r.id === 'jointIncome');

  if (!singleRes || !marriedRes) return null;

  const singleTax = parseVal(singleRes.value);
  const marriedTax = parseVal(marriedRes.value);
  const jointIncome = incomeRes ? parseVal(incomeRes.value) : 0;

  const diff = marriedTax - singleTax;
  const isPenalty = diff > 0;
  const isBonus = diff < 0;

  const maxVal = Math.max(singleTax, marriedTax, 1);
  const bar = (v: number) => (v / maxVal) * 100;

  const fmtD = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Scale size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Marriage Tax Comparison
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-blue-600">Two Singles (Combined)</span>
              <span className="text-xs font-bold text-slate-700">{fmtD(singleTax)}</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${bar(singleTax)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-purple-600">Married Filing Jointly</span>
              <span className="text-xs font-bold text-slate-700">{fmtD(marriedTax)}</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-purple-500" style={{ width: `${bar(marriedTax)}%` }} />
            </div>
          </div>
        </div>

        <div className={`rounded-xl px-5 py-4 border ${
          isPenalty ? 'bg-red-50 border-red-200' : isBonus ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <p className={`text-sm font-bold ${isPenalty ? 'text-red-700' : isBonus ? 'text-emerald-700' : 'text-slate-600'}`}>
            {isPenalty
              ? `Marriage Penalty: ${fmtD(Math.abs(diff))} more per year`
              : isBonus
                ? `Marriage Bonus: Save ${fmtD(Math.abs(diff))} per year`
                : 'Tax Neutral — No Difference'}
          </p>
          <p className={`text-xs mt-1 ${isPenalty ? 'text-red-600' : isBonus ? 'text-emerald-600' : 'text-slate-500'}`}>
            {jointIncome > 0 && `Combined income: ${fmtD(jointIncome)}`}
            {isPenalty
              ? ` — Filing jointly costs more. This typically happens when both partners earn similar high incomes.`
              : isBonus
                ? ` — Filing jointly saves money. Common when one partner earns significantly more.`
                : ''}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Single Effective Rate</p>
            <p className="text-lg font-black text-blue-700">
              {jointIncome > 0 ? `${((singleTax / jointIncome) * 100).toFixed(2)}%` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-1">Married Effective Rate</p>
            <p className="text-lg font-black text-purple-700">
              {jointIncome > 0 ? `${((marriedTax / jointIncome) * 100).toFixed(2)}%` : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
