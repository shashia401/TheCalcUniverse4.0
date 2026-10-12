import { GraduationCap } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { pmt } from '../../../utils/financial';
import MiniDonut from '../../../components/calculator/MiniDonut';
import HBarRow from '../../../components/calculator/HBarRow';
import { computeStudentLoan } from './studentLoanMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const fmt = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtM = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtK = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`);

const TERM_COLORS: Record<number, string> = { 10: 'bg-blue-700', 15: 'bg-emerald-700', 20: 'bg-amber-800', 25: 'bg-red-700' };

function TermComparison({ principal, monthlyRate }: { principal: number; monthlyRate: number }) {
  const rows = [10, 15, 20, 25].map((years) => {
    const n = years * 12;
    const payment = pmt(principal, monthlyRate, n);
    return { years, payment, interest: payment * n - principal };
  });
  const maxInterest = Math.max(...rows.map((r) => r.interest));
  return (
    <div className="space-y-1">
      {rows.map((r) => (
        <div key={r.years}>
          <p className="text-xs text-slate-600">
            <span className="font-bold">{r.years}-year fixed payment:</span> {fmtM(r.payment)}/mo
          </p>
          <HBarRow label="Interest" value={r.interest} max={maxInterest} display={fmtK(r.interest)} color={TERM_COLORS[r.years]} labelWidth="w-16" className="pb-1.5" />
        </div>
      ))}
      <p className="text-[10px] text-slate-600">Bar length = total interest paid. Shorter bar = less paid overall. Income-driven plans are not modeled.</p>
    </div>
  );
}

export default function StudentLoanPanel({ values, results }: Props) {
  const c = computeStudentLoan(values);
  if (!c || !results.length) return null;
  const { principal, capitalizedInterest, subsidy, effectivePrincipal, totalInterestRepayment, inSchool, loanType, monthsUntilGrad, gracePeriod, totalDeferMonths } = c;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <GraduationCap size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Lifetime Cost Breakdown</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-4">Where Your Money Goes</p>
          <MiniDonut
            donut={{
              segments: [
                { label: 'Original Principal', value: principal, color: '#1d4ed8' },
                ...(capitalizedInterest > 0 ? [{ label: 'Capitalized Interest', value: capitalizedInterest, color: '#c2410c' }] : []),
                { label: 'Repayment Interest', value: totalInterestRepayment, color: '#b91c1c' },
              ],
              centerLabel: 'total cost',
              formatValue: fmt,
              caption: 'Student loan total cost: principal, capitalized interest and repayment interest',
            }}
          />
        </div>

        {inSchool && loanType === 'unsubsidized' && capitalizedInterest > 0 && (
          <div className="rounded-xl bg-orange-50 border border-orange-200 px-5 py-3">
            <p className="text-sm font-bold text-orange-800 mb-1">Capitalization Warning</p>
            <p className="text-xs text-orange-800">
              Your {monthsUntilGrad}-month school period + {gracePeriod}-month grace period = {totalDeferMonths} months of accruing interest.
              At repayment start, <strong>{fmt(capitalizedInterest)}</strong> is added to your principal — raising it from {fmt(principal)} to {fmt(effectivePrincipal)}.
              Paying even a portion of this interest while in school would directly reduce this figure.
            </p>
          </div>
        )}

        {inSchool && loanType === 'subsidized' && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3">
            <p className="text-sm font-bold text-emerald-800 mb-1">Subsidized Loan Benefit</p>
            <p className="text-xs text-emerald-800">
              The government covers <strong>{fmt(subsidy)}</strong> in interest during your {totalDeferMonths}-month
              deferment period. You start repayment owing exactly what you borrowed: {fmt(principal)}.
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Repayment Term Comparison</p>
          <TermComparison principal={effectivePrincipal} monthlyRate={c.monthlyRate} />
        </div>
      </div>
    </div>
  );
}
