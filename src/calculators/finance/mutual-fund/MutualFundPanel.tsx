import { useMemo } from 'react';
import { fmtCurrency } from '../../../utils/financial';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { fundSeries } from './fundMath';

interface Props {
  values: Record<string, string>;
}

export default function MutualFundPanel({ values }: Props) {
  const initial = parseFloat(values.initialInvestment) || 0;
  const monthly = parseFloat(values.monthlyContribution) || 0;
  const annualReturn = (parseFloat(values.expectedReturn) || 0) / 100;
  const expenseRatio = (parseFloat(values.expenseRatio) || 0) / 100;
  const years = parseFloat(values.investmentYears) || 0;

  const data = useMemo(
    () => (years > 0 ? fundSeries(initial, monthly, annualReturn, expenseRatio, years) : []),
    [initial, monthly, annualReturn, expenseRatio, years],
  );

  if (data.length === 0) return null;

  const last = data[data.length - 1];
  const feeImpactDollars = last.withoutFee - last.withFee;
  const feeImpactPct = last.withoutFee > 0 ? (feeImpactDollars / last.withoutFee) * 100 : 0;
  const feeLabel = `${(expenseRatio * 100).toFixed(2)}%`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Fee Impact Visualization</span>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">Without Fees</p>
            <p className="text-lg font-black text-emerald-700">{fmtCurrency(last.withoutFee)}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">With {feeLabel} Fee</p>
            <p className="text-lg font-black text-amber-700">{fmtCurrency(last.withFee)}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-1">Fees Cost You</p>
            <p className="text-lg font-black text-red-700">{fmtCurrency(feeImpactDollars)} ({feeImpactPct.toFixed(1)}% of final)</p>
          </div>
        </div>

        <SvgLineChart
          ariaLabel={`Mutual fund balance by year with and without a ${feeLabel} expense ratio`}
          series={[
            { name: 'Without expense ratio', points: data.map((d) => ({ x: d.year, y: d.withoutFee })), color: '#059669' },
            { name: `With ${feeLabel} fee`, points: data.map((d) => ({ x: d.year, y: d.withFee })), color: '#d97706', dashed: true },
          ]}
          xFormat={(n) => `Yr ${n}`}
          yFormat={(n) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`)}
        />

        <div className="flex flex-wrap gap-4 justify-center text-[10px] text-slate-600">
          <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-emerald-600" />Without Expense Ratio</span>
          <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-amber-600" />With {feeLabel} Fee</span>
        </div>
      </div>
    </div>
  );
}
