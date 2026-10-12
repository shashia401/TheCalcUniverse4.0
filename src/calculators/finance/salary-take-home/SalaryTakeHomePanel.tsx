import { Briefcase } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { computeTakeHome } from './takeHomeMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const fmtD = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function SalaryTakeHomePanel({ values, results }: Props) {
  if (!results.length) return null;
  const t = computeTakeHome(values);
  if (!t) return null;

  // Same engine as index.ts, so the bar can never disagree with the headline numbers.
  const { calc: c, preTaxAmount } = t;
  const gross = c.grossAnnual;
  const segments = [
    { label: 'Federal Tax', short: 'Federal', amount: c.fed.totalTax, bg: 'bg-red-700' },
    { label: 'FICA', short: 'FICA', amount: c.fica, bg: 'bg-amber-800' },
    { label: 'State Tax', short: 'State', amount: c.stateTax, bg: 'bg-violet-700' },
    { label: 'Pre-Tax Deductions', short: 'Deduct', amount: preTaxAmount, bg: 'bg-cyan-800' },
    { label: 'Take-Home Pay', short: 'Take-Home', amount: c.netAnnual, bg: 'bg-emerald-700' },
  ].filter((s) => s.amount > 0);
  const pct = (v: number) => (v / gross) * 100;
  const effRate = (c.totalTax / gross) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Briefcase size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Salary Breakdown</span>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">How Your Salary Is Split</p>
          <div
            className="h-11 bg-slate-100 rounded-full overflow-hidden flex"
            role="img"
            aria-label={`Share of ${fmtD(gross)} gross salary: ${segments.map((s) => `${s.label} ${pct(s.amount).toFixed(0)}%`).join(', ')}`}
          >
            {segments.map((s) => (
              <div
                key={s.label}
                className={`h-full flex items-center justify-center text-[8px] font-bold text-white ${s.bg}`}
                style={{ width: `${pct(s.amount)}%`, minWidth: '4px' }}
                title={`${s.label}: ${fmtD(s.amount)}`}
              >
                {pct(s.amount) > 8 && s.short}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${s.bg}`} />
              <span className="text-slate-600">{s.label}: {fmtD(s.amount)}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-600">Effective Tax Rate</span>
            <span className="text-sm font-black text-slate-700">{effRate.toFixed(1)}%</span>
          </div>
          <p className="text-[10px] text-slate-600">
            Total income: {fmtD(gross)} &middot; Total taxes: {fmtD(c.totalTax)} &middot; Net: {fmtD(c.netAnnual)}
          </p>
        </div>
      </div>
    </div>
  );
}
