import { GraduationCap } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { pmt } from '../../../utils/financial';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function CostBreakdownChart({ principal, capitalizedInterest, repaymentInterest }: { principal: number; capitalizedInterest: number; repaymentInterest: number }) {
  const total = principal + capitalizedInterest + repaymentInterest;
  if (total <= 0) return null;

  const cx = 90;
  const cy = 90;
  const r = 72;
  const innerR = 40;

  const slices = [
    { label: 'Original Principal', value: principal, color: '#3b82f6' },
    ...(capitalizedInterest > 0 ? [{ label: 'Capitalized Interest', value: capitalizedInterest, color: '#f97316' }] : []),
    { label: 'Repayment Interest', value: repaymentInterest, color: '#ef4444' },
  ];

  const getPath = (startAngle: number, endAngle: number) => {
    const s = startAngle * Math.PI / 180;
    const e = endAngle * Math.PI / 180;
    const x1o = cx + r * Math.cos(s), y1o = cy + r * Math.sin(s);
    const x2o = cx + r * Math.cos(e), y2o = cy + r * Math.sin(e);
    const x1i = cx + innerR * Math.cos(e), y1i = cy + innerR * Math.sin(e);
    const x2i = cx + innerR * Math.cos(s), y2i = cy + innerR * Math.sin(s);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1o} ${y1o} A ${r} ${r} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${innerR} ${innerR} 0 ${large} 0 ${x2i} ${y2i} Z`;
  };

  let currentAngle = -90;
  const paths = slices.map((slice) => {
    const angle = (slice.value / total) * 360;
    const path = getPath(currentAngle, currentAngle + angle);
    currentAngle += angle;
    return { ...slice, path };
  });

  const fmtK = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toFixed(0)}`;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 180 180" className="w-44 h-44 flex-shrink-0" role="img" aria-label="Student loan total cost breakdown donut chart">
        {paths.map((p) => (
          <path key={p.label} d={p.path} fill={p.color} opacity={0.88} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fontWeight="800" fill="#1e293b">{fmtK(total)}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize={8} fill="#94a3b8">total cost</text>
      </svg>
      <div className="flex flex-col gap-3 w-full">
        {slices.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-xs font-bold text-slate-600">{s.label}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black" style={{ color: s.color }}>
                  {s.value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-slate-500 ml-1">({((s.value / total) * 100).toFixed(0)}%)</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (s.value / total) * 100)}%`, backgroundColor: s.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TermComparison({ principal: balanceAtRepayment, annualRate }: { principal: number; annualRate: number }) {
  const terms = [10, 15, 20, 25];
  const rMonth = annualRate / 12;
  const results = terms.map((years) => {
    const n = years * 12;
    const payment = pmt(balanceAtRepayment, rMonth, n);
    const total = payment * n;
    const interest = total - balanceAtRepayment;
    return { years, pmt: payment, total, interest };
  });

  const maxInterest = Math.max(...results.map((r) => r.interest));
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`;
  const fmtM = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-2.5">
      {results.map((r) => (
        <div key={r.years}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs font-bold text-slate-600">{r.years}-Year Plan</span>
            <div className="text-right">
              <span className="text-sm font-black text-slate-700">{fmtM(r.pmt)}/mo</span>
              <span className="text-[10px] text-slate-500 ml-2">{fmt(r.interest)} interest</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${maxInterest > 0 ? (r.interest / maxInterest) * 100 : 0}%`,
                backgroundColor: r.years === 10 ? '#3b82f6' : r.years === 15 ? '#22c55e' : r.years === 20 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
        </div>
      ))}
      <p className="text-[10px] text-slate-500">Bar length = total interest paid. Shorter bar = less paid overall.</p>
    </div>
  );
}

export default function StudentLoanPanel({ values }: Props) {
  const principal = parseFloat(values.loanBalance) || 0;
  const annualRate = parseFloat(values.interestRate) / 100 || 0;
  const inSchool = values.inSchool === 'yes';
  const monthsUntilGrad = parseInt(values.monthsUntilGraduation) || 0;
  const loanType = values.loanType || 'unsubsidized';
  const gracePeriod = parseInt(values.gracePeriodMonths) || 6;
  const totalDeferMonths = inSchool ? monthsUntilGrad + gracePeriod : 0;

  const monthlyRate = annualRate / 12;
  const capitalizedInterest = inSchool && loanType === 'unsubsidized'
    ? principal * monthlyRate * totalDeferMonths
    : 0;
  const effectivePrincipal = principal + capitalizedInterest;

  const repaymentYears = parseInt(values.repaymentTerm) || 10;
  const n = repaymentYears * 12;
  const monthlyPmt = pmt(effectivePrincipal, monthlyRate, n);
  const totalPaid = monthlyPmt * n;
  const repaymentInterest = totalPaid - effectivePrincipal;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <GraduationCap size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Lifetime Cost Breakdown</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Where Your Money Goes</p>
          <CostBreakdownChart principal={principal} capitalizedInterest={capitalizedInterest} repaymentInterest={repaymentInterest} />
        </div>

        {inSchool && loanType === 'unsubsidized' && capitalizedInterest > 0 && (
          <div className="rounded-xl bg-orange-50 border border-orange-200 px-5 py-3">
            <p className="text-sm font-bold text-orange-700 mb-1">Capitalization Warning</p>
            <p className="text-xs text-orange-600">
              Your {monthsUntilGrad}-month school period + {gracePeriod}-month grace period = {totalDeferMonths} months of accruing interest.
              At repayment start, <strong>{fmt(capitalizedInterest)}</strong> is added to your principal — raising it from {fmt(principal)} to {fmt(effectivePrincipal)}.
              Paying even a portion of this interest while in school would directly reduce this figure.
            </p>
          </div>
        )}

        {inSchool && loanType === 'subsidized' && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3">
            <p className="text-sm font-bold text-emerald-700 mb-1">Subsidized Loan Benefit</p>
            <p className="text-xs text-emerald-600">
              The government covers <strong>{fmt(principal * monthlyRate * totalDeferMonths)}</strong> in interest during your {totalDeferMonths}-month
              deferment period. You start repayment owing exactly what you borrowed: {fmt(principal)}.
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Repayment Term Comparison</p>
          <TermComparison principal={effectivePrincipal} annualRate={annualRate} />
        </div>
      </div>
    </div>
  );
}
