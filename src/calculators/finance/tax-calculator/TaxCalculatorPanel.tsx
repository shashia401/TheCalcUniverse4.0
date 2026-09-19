import { useMemo } from 'react';
import { Landmark } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { parseAmount as parseVal } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const BRACKETS_LABELS: Array<{ limit: number; rate: number }> = [
  { limit: 11925, rate: 0.10 },
  { limit: 48475, rate: 0.12 },
  { limit: 103350, rate: 0.22 },
  { limit: 197300, rate: 0.24 },
  { limit: 250525, rate: 0.32 },
  { limit: 626350, rate: 0.35 },
  { limit: Infinity, rate: 0.37 },
];

const BRACKET_COLORS = ['#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b'];

export default function TaxCalculatorPanel({ values, results }: Props) {
  const taxableRes = results.find((r) => r.id === 'taxableIncome');
  const totalTaxRes = results.find((r) => r.id === 'totalTax');
  const effRateRes = results.find((r) => r.id === 'effectiveRate');
  const margRateRes = results.find((r) => r.id === 'marginalRate');
  const withHoldingRes = results.find((r) => r.id === 'taxAfterWithholding');

  if (!totalTaxRes || !taxableRes) return null;

  const income = parseFloat(values.annualIncome) || 0;
  const taxableIncome = parseVal(taxableRes.value);
  const totalTax = parseVal(totalTaxRes.value);
  const effectiveRate = effRateRes ? parseFloat(effRateRes.value.replace('%', '')) : 0;
  const marginalRate = margRateRes ? parseFloat(margRateRes.value.replace('%', '')) : 0;

  const bracketBreakdown = useMemo(() => {
    let remaining = taxableIncome;
    const data: Array<{ label: string; amount: number; rate: number; tax: number; color: string }> = [];
    let prevLimit = 0;

    for (let i = 0; i < BRACKETS_LABELS.length; i++) {
      const { limit, rate } = BRACKETS_LABELS[i];
      if (remaining <= 0) break;
      const taxable = Math.min(remaining, limit - prevLimit);
      if (taxable > 0) {
        data.push({
          label: `${(rate * 100).toFixed(0)}%`,
          amount: taxable,
          rate,
          tax: taxable * rate,
          color: BRACKET_COLORS[i],
        });
        remaining -= taxable;
      }
      prevLimit = limit;
    }
    return data;
  }, [taxableIncome]);

  const fmtM = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const maxAmount = Math.max(...bracketBreakdown.map((b) => b.amount), 1);
  const totalAmount = bracketBreakdown.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Landmark size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Tax Bracket Breakdown
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Total Tax</p>
            <p className="text-lg font-black text-red-600">{fmtM(totalTax)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Taxable Income</p>
            <p className="text-lg font-black text-slate-700">{fmtM(taxableIncome)}</p>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Effective Rate</p>
            <p className="text-lg font-black text-blue-700">{effectiveRate.toFixed(2)}%</p>
          </div>
          <div className="rounded-xl bg-purple-50 border border-purple-200 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-1">Marginal Rate</p>
            <p className="text-lg font-black text-purple-700">{marginalRate.toFixed(0)}%</p>
          </div>
        </div>

        {bracketBreakdown.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Income by Tax Bracket</p>
            <div className="space-y-2">
              {bracketBreakdown.map((b, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold" style={{ color: b.color }}>
                      Bracket {b.label}
                    </span>
                    <span className="text-slate-700 font-semibold">
                      {fmtM(b.amount)} &rarr; {fmtM(b.tax)} tax
                    </span>
                  </div>
                  <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(b.amount / totalAmount) * 100}%`, backgroundColor: b.color, opacity: 0.75 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
          <p className="text-xs font-bold text-slate-600 mb-2">Summary</p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            On {fmtM(income)} gross income, after standard deduction you pay <strong className="text-red-600">{fmtM(totalTax)}</strong> in federal tax.
            Your effective rate is <strong className="text-blue-600">{effectiveRate.toFixed(2)}%</strong> but your marginal rate is <strong className="text-purple-600">{marginalRate.toFixed(0)}%</strong>.
          </p>
        </div>

        {withHoldingRes && (
          <div className={`rounded-xl px-5 py-3 text-center border ${withHoldingRes.color === 'positive' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-xs font-bold" style={{ color: withHoldingRes.color === 'positive' ? '#16a34a' : '#dc2626' }}>{withHoldingRes.label}</p>
            <p className="text-lg font-black mt-0.5" style={{ color: withHoldingRes.color === 'positive' ? '#16a34a' : '#dc2626' }}>{withHoldingRes.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
