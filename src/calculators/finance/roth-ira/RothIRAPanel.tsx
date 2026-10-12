import { PiggyBank } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';
import { IRA_LIMITS, TAX_YEAR } from '../../../utils/taxData';
import MiniDonut from '../../../components/calculator/MiniDonut';
import HBarRow from '../../../components/calculator/HBarRow';
import { parseRothInputs, rothProjection } from './rothMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const fmtM = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toFixed(0)}`;
const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function RothIRAPanel({ values, results }: Props) {
  if (!results.length) return null;
  const inp = parseRothInputs(values);
  if (!Number.isFinite(inp.currentAge) || !Number.isFinite(inp.retirementAge) || !Number.isFinite(inp.annualReturn) || inp.retirementAge <= inp.currentAge) {
    return null;
  }
  // Same projection as index.ts (shared rothMath), so the panel can never disagree with the headline result.
  const p = rothProjection(inp);
  const checkpoints = [0.25, 0.5, 0.75, 1]
    .map((f) => Math.round(p.years * f))
    .filter((yr, i, a) => yr > 0 && a.indexOf(yr) === i);
  const maxBal = p.balance;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <PiggyBank size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Roth IRA — Tax-Free Growth Analysis</span>
      </div>

      <div className="p-6 space-y-6">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">{TAX_YEAR} IRS Contribution Limits</p>
              <p className="text-sm text-emerald-800 mt-0.5">Under 50: <strong>${IRA_LIMITS.base.toLocaleString()}/yr</strong> &nbsp;|&nbsp; Age 50+: <strong>${IRA_LIMITS.totalAge50Plus.toLocaleString()}/yr</strong></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-800">Your contribution</p>
              <p className="text-lg font-black text-emerald-800">${p.contribution.toLocaleString()}/yr</p>
              {p.overLimit && <p className="text-[10px] text-red-700 font-bold">Exceeds limit — capped</p>}
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-4">Balance Breakdown at Retirement</p>
          <MiniDonut
            donut={{
              segments: [
                { label: 'Your Contributions', value: p.contributed, color: '#1d4ed8' },
                { label: 'Tax-Free Growth', value: Math.max(0, p.earnings), color: '#15803d' },
              ],
              centerLabel: 'tax-free',
              formatValue: fmtM,
              caption: 'Roth IRA contributions versus tax-free growth at retirement',
            }}
          />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">After-Tax Value: Roth vs. Equal-Cost Traditional IRA</p>
          {Number.isFinite(p.traditionalAfterTax) ? (
            <>
              <HBarRow label="Roth IRA" value={p.balance} max={Math.max(p.balance, p.traditionalAfterTax)} display={fmt(p.balance)} color="bg-emerald-700" labelWidth="w-28" />
              <HBarRow label="Traditional IRA" value={p.traditionalAfterTax} max={Math.max(p.balance, p.traditionalAfterTax)} display={fmt(p.traditionalAfterTax)} color="bg-slate-700" labelWidth="w-28" />
              <p className="text-xs text-slate-600 mt-2">
                Traditional assumes you contribute the pre-tax equivalent of your Roth contribution (deducted at your {(inp.marginalRate * 100).toFixed(0)}%
                rate today) and pay {(inp.retirementRate * 100).toFixed(0)}% on every dollar withdrawn. Tax avoided on the growth alone:{' '}
                <strong className="text-emerald-800">{fmt(p.taxOnGrowthAvoided)}</strong>.
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-600">Choose your current marginal tax rate to compare against a Traditional IRA.</p>
          )}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Balance Growth Over Time</p>
          <div className="space-y-3">
            {checkpoints.map((yr) => {
              const bal = p.balanceAfter(yr);
              const contribs = inp.currentBalance + p.contribution * yr;
              return (
                <div key={yr}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs font-bold text-slate-600">Age {inp.currentAge + yr} (+{yr}yr)</span>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-800">{fmtM(bal)}</span>
                      <span className="text-[10px] text-slate-600 ml-2">{fmtM(bal - contribs)} growth</span>
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex">
                    <div className="h-full bg-blue-700" style={{ width: `${maxBal > 0 ? (contribs / maxBal) * 100 : 0}%` }} />
                    <div className="h-full bg-emerald-700" style={{ width: `${maxBal > 0 ? ((bal - contribs) / maxBal) * 100 : 0}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="flex gap-4 pt-1">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-700" /><span className="text-[10px] text-slate-600">Contributions</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-700" /><span className="text-[10px] text-slate-600">Tax-Free Growth</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
