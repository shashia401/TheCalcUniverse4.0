import { useMemo } from 'react';
import { Briefcase } from 'lucide-react';
import { TAX_YEAR } from '../../../utils/taxData';
import { annualFromRate, estimateTakeHome, WEEKS_PER_YEAR } from './salaryCalcMath';

interface Props {
  amount: number;
  freq: string;
  hoursPerWeek: number;
  daysPerWeek: number;
}

interface PayRow {
  period: string;
  count: number;
  gross: number;
  net: number;
}

function buildRows(annual: number, net: number, hoursPerWeek: number, daysPerWeek: number): PayRow[] {
  const hours = hoursPerWeek * WEEKS_PER_YEAR;
  const days = daysPerWeek * WEEKS_PER_YEAR;
  return [
    { period: 'Hourly', count: hours, gross: annual / hours, net: net / hours },
    { period: 'Daily', count: days, gross: annual / days, net: net / days },
    { period: 'Weekly', count: 52, gross: annual / 52, net: net / 52 },
    { period: 'Bi-Weekly', count: 26, gross: annual / 26, net: net / 26 },
    { period: 'Semi-Monthly', count: 24, gross: annual / 24, net: net / 24 },
    { period: 'Monthly', count: 12, gross: annual / 12, net: net / 12 },
    { period: 'Annually', count: 1, gross: annual, net },
  ];
}

const fmtK = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`);

function TaxBreakdownBar({ annual }: { annual: number }) {
  const t = estimateTakeHome(annual);
  const segments = [
    { label: 'Take-Home', amount: t.net, bg: 'bg-emerald-700' },
    { label: 'Federal', amount: t.federalTax, bg: 'bg-red-700' },
    { label: 'FICA', amount: t.fica, bg: 'bg-orange-700' },
  ];

  return (
    <div className="space-y-3">
      <div
        className="flex h-7 rounded-xl overflow-hidden gap-0.5"
        role="img"
        aria-label={`Share of annual salary: ${segments.map((s) => `${s.label} ${((s.amount / annual) * 100).toFixed(0)}%`).join(', ')}`}
      >
        {segments.map((s) => (
          <div
            key={s.label}
            className={`h-full ${s.bg}`}
            style={{ width: `${annual > 0 ? (s.amount / annual) * 100 : 0}%` }}
            title={`${s.label}: ${fmtK(s.amount)}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${s.bg}`} />
            <div>
              <p className="text-[10px] text-slate-600">{s.label}</p>
              <p className="text-xs font-bold text-slate-700">{fmtK(s.amount)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-[10px] text-slate-600 pt-1">
        <span>Marginal Rate: <strong className="text-slate-700">{(t.marginalRate * 100).toFixed(0)}%</strong></span>
        <span>Federal + FICA Effective Rate: <strong className="text-slate-700">{t.effectiveRate.toFixed(1)}%</strong></span>
        <span className="text-[9px] italic">*Est. single filer, before state tax</span>
      </div>
    </div>
  );
}

function BracketMiniTable({ annual }: { annual: number }) {
  const t = estimateTakeHome(annual);
  const rows = t.brackets
    .map((b) => ({
      rate: b.rate,
      taxable: Math.max(0, Math.min(t.taxableIncome, b.max) - b.min),
      active: t.taxableIncome > b.min,
    }))
    .filter((r) => r.active);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtD = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="Federal tax bracket breakdown table">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Bracket</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Income in Bracket</th>
            <th scope="col" className="text-right px-4 py-2.5 font-bold text-red-700 uppercase tracking-wider text-[10px]">Tax</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`item-${i}`} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <td className="px-4 py-2.5 font-bold text-slate-800">{(row.rate * 100).toFixed(0)}%</td>
              <td className="px-3 py-2.5 text-right text-slate-600">${fmt(row.taxable)}</td>
              <td className="px-4 py-2.5 text-right font-black text-red-700">${fmtD(row.taxable * row.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SalaryPanel({ amount, freq, hoursPerWeek, daysPerWeek }: Props) {
  const annual = useMemo(() => annualFromRate(amount, freq, hoursPerWeek, daysPerWeek), [amount, freq, hoursPerWeek, daysPerWeek]);
  const rows = useMemo(
    () => buildRows(annual, estimateTakeHome(annual).net, hoursPerWeek, daysPerWeek),
    [annual, hoursPerWeek, daysPerWeek],
  );

  const fmt = (n: number, dec = 2) =>
    n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Briefcase size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Full Pay Period Grid · Gross &amp; Estimated Net</span>
      </div>

      <div className="p-6 space-y-6">
        <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="Full pay period grid table">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Period</th>
                <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]"># per Year</th>
                <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-700 uppercase tracking-wider text-[10px]">Gross Pay</th>
                <th scope="col" className="text-right px-4 py-2.5 font-bold text-emerald-800 uppercase tracking-wider text-[10px]">Est. Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.period} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-4 py-2.5 font-bold text-slate-800">{row.period}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600 font-semibold">{row.count.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right font-black text-slate-700">${fmt(row.gross, row.gross >= 100 ? 2 : 4)}</td>
                  <td className="px-4 py-2.5 text-right font-black text-emerald-800">~${fmt(row.net, row.net >= 100 ? 2 : 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Where Your Annual Salary Goes</p>
          <TaxBreakdownBar annual={annual} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Federal Tax Bracket Breakdown (Single, {TAX_YEAR})</p>
          <BracketMiniTable annual={annual} />
        </div>
      </div>
    </div>
  );
}
