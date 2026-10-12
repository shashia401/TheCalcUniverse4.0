import { Landmark } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { computeFederalTax } from './taxCalcMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// -700 classes so the white label inside HBarRow keeps 4.5:1 contrast
const BRACKET_COLORS = ['bg-green-700', 'bg-lime-800', 'bg-amber-800', 'bg-orange-800', 'bg-red-700', 'bg-red-800', 'bg-red-900'];

const fmtM = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function TaxCalculatorPanel({ values, results }: Props) {
  // Same pure function as index.ts: brackets and deduction follow the chosen filing status.
  const c = computeFederalTax(values);
  if (!c || !results.length) return null;
  const { income, taxableIncome, totalTax, effectiveRate, brackets } = c;
  const marginalRate = c.marginalRate * 100;
  const withHoldingRes = results.find((r) => r.id === 'taxAfterWithholding');
  const maxAmount = Math.max(...brackets.map((b) => b.incomeInBracket), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Landmark size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Tax Bracket Breakdown</span>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-1">Total Tax</p>
            <p className="text-lg font-black text-red-700">{fmtM(totalTax)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Taxable Income</p>
            <p className="text-lg font-black text-slate-700">{fmtM(taxableIncome)}</p>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">Effective Rate</p>
            <p className="text-lg font-black text-blue-700">{effectiveRate.toFixed(2)}%</p>
          </div>
          <div className="rounded-xl bg-purple-50 border border-purple-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700 mb-1">Marginal Rate</p>
            <p className="text-lg font-black text-purple-700">{marginalRate.toFixed(0)}%</p>
          </div>
        </div>

        {brackets.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Income by Tax Bracket</p>
            {brackets.map((b) => {
              const idx = [0.1, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37].indexOf(b.rate);
              return (
                <HBarRow
                  key={b.rate}
                  label={`${(b.rate * 100).toFixed(0)}% bracket`}
                  value={b.incomeInBracket}
                  max={maxAmount}
                  display={`${fmtM(b.incomeInBracket)} → ${fmtM(b.tax)}`}
                  color={BRACKET_COLORS[idx] ?? 'bg-slate-700'}
                  labelWidth="w-24"
                />
              );
            })}
          </div>
        )}

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
          <p className="text-xs font-bold text-slate-600 mb-2">Summary</p>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            On {fmtM(income)} gross income, after the standard deduction you pay <strong className="text-red-700">{fmtM(totalTax)}</strong> in federal tax.
            Your effective rate is <strong className="text-blue-700">{effectiveRate.toFixed(2)}%</strong> but your marginal rate is <strong className="text-purple-700">{marginalRate.toFixed(0)}%</strong>.
          </p>
        </div>

        {withHoldingRes && (
          <div className={`rounded-xl px-5 py-3 text-center border ${withHoldingRes.color === 'positive' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-xs font-bold ${withHoldingRes.color === 'positive' ? 'text-emerald-800' : 'text-red-700'}`}>{withHoldingRes.label}</p>
            <p className={`text-lg font-black mt-0.5 ${withHoldingRes.color === 'positive' ? 'text-emerald-800' : 'text-red-700'}`}>{withHoldingRes.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
