import { useMemo } from 'react';
import { Briefcase } from 'lucide-react';
import { calcFederalTax, calcFICA, STANDARD_DEDUCTIONS_2025, FEDERAL_BRACKETS_2025 } from '../income-tax/taxData';

interface Props {
  amount: number;
  freq: string;
  hoursPerWeek: number;
  daysPerWeek: number;
}

function toAnnual(amount: number, freq: string, hoursPerWeek: number, daysPerWeek: number): number {
  const WEEKS = 52;
  switch (freq) {
    case 'hourly': return amount * hoursPerWeek * WEEKS;
    case 'daily': return amount * daysPerWeek * WEEKS;
    case 'weekly': return amount * WEEKS;
    case 'biweekly': return amount * 26;
    case 'semimonthly': return amount * 24;
    case 'monthly': return amount * 12;
    case 'annually': default: return amount;
  }
}

interface PayRow {
  period: string;
  count: number;
  gross: number;
  net: number;
}

function buildRows(annual: number, hoursPerWeek: number, daysPerWeek: number): PayRow[] {
  const taxableIncome = Math.max(0, annual - STANDARD_DEDUCTIONS_2025['single']);
  const { tax: federalTax } = calcFederalTax(taxableIncome, 'single');
  const { ss, medicare } = calcFICA(annual, 'single');
  const stateTax = annual * 0.045;
  const totalTax = federalTax + ss + medicare + stateTax;
  const netAnnual = annual - totalTax;

  const rows: PayRow[] = [
    { period: 'Hourly', count: hoursPerWeek * 52, gross: annual / (hoursPerWeek * 52), net: netAnnual / (hoursPerWeek * 52) },
    { period: 'Daily', count: daysPerWeek * 52, gross: annual / (daysPerWeek * 52), net: netAnnual / (daysPerWeek * 52) },
    { period: 'Weekly', count: 52, gross: annual / 52, net: netAnnual / 52 },
    { period: 'Bi-Weekly', count: 26, gross: annual / 26, net: netAnnual / 26 },
    { period: 'Semi-Monthly', count: 24, gross: annual / 24, net: netAnnual / 24 },
    { period: 'Monthly', count: 12, gross: annual / 12, net: netAnnual / 12 },
    { period: 'Annually', count: 1, gross: annual, net: netAnnual },
  ];

  return rows;
}

function TaxBreakdownBar({ annual }: { annual: number }) {
  const taxableIncome = Math.max(0, annual - STANDARD_DEDUCTIONS_2025['single']);
  const { tax: federalTax, marginalRate } = calcFederalTax(taxableIncome, 'single');
  const { ss, medicare } = calcFICA(annual, 'single');
  const stateTax = annual * 0.045;
  const totalTax = federalTax + ss + medicare + stateTax;
  const netAnnual = annual - totalTax;
  const effectiveRate = annual > 0 ? (totalTax / annual) * 100 : 0;

  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`;

  const segments = [
    { label: 'Take-Home', amount: netAnnual, color: '#22c55e' },
    { label: 'Federal', amount: federalTax, color: '#ef4444' },
    { label: 'FICA', amount: ss + medicare, color: '#f97316' },
    { label: 'State (~4.5%)', amount: stateTax, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex h-7 rounded-xl overflow-hidden gap-0.5">
        {segments.map((s) => (
          <div
            key={s.label}
            className="h-full"
            style={{ width: `${annual > 0 ? (s.amount / annual) * 100 : 0}%`, backgroundColor: s.color }}
            title={`${s.label}: ${fmt(s.amount)}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
            <div>
              <p className="text-[10px] text-slate-500">{s.label}</p>
              <p className="text-xs font-bold text-slate-700">{fmt(s.amount)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1">
        <span>Marginal Rate: <strong className="text-slate-600">{(marginalRate * 100).toFixed(0)}%</strong></span>
        <span>All-In Effective Rate: <strong className="text-slate-600">{effectiveRate.toFixed(1)}%</strong></span>
        <span className="text-[9px] italic">*Est. single filer, ~4.5% state</span>
      </div>
    </div>
  );
}

function BracketMiniTable({ annual }: { annual: number }) {
  const taxableIncome = Math.max(0, annual - STANDARD_DEDUCTIONS_2025['single']);
  const brackets = FEDERAL_BRACKETS_2025['single'];

  const rows = brackets
    .map((b) => ({
      rate: b.rate,
      taxable: Math.max(0, Math.min(taxableIncome, b.max) - b.min),
      active: taxableIncome > b.min,
    }))
    .filter((r) => r.active);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtD = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Bracket</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Income in Bracket</th>
            <th scope="col" className="text-right px-4 py-2.5 font-bold text-red-500 uppercase tracking-wider text-[10px]">Tax</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`item-${i}`} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <td className="px-4 py-2.5 font-bold text-slate-800">{(row.rate * 100).toFixed(0)}%</td>
              <td className="px-3 py-2.5 text-right text-slate-600">${fmt(row.taxable)}</td>
              <td className="px-4 py-2.5 text-right font-black text-red-600">${fmtD(row.taxable * row.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SalaryPanel({ amount, freq, hoursPerWeek, daysPerWeek }: Props) {
  const annual = useMemo(() => toAnnual(amount, freq, hoursPerWeek, daysPerWeek), [amount, freq, hoursPerWeek, daysPerWeek]);
  const rows = useMemo(() => buildRows(annual, hoursPerWeek, daysPerWeek), [annual, hoursPerWeek, daysPerWeek]);

  const fmt = (n: number, dec = 2) =>
    n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Briefcase size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Full Pay Period Grid · Gross & Estimated Net</span>
      </div>

      <div className="p-6 space-y-6">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Period</th>
                <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]"># per Year</th>
                <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Gross Pay</th>
                <th scope="col" className="text-right px-4 py-2.5 font-bold text-emerald-500 uppercase tracking-wider text-[10px]">Est. Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.period} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-4 py-2.5 font-bold text-slate-800">{row.period}</td>
                  <td className="px-3 py-2.5 text-right text-slate-500 font-semibold">{row.count.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right font-black text-slate-700">
                    ${fmt(row.gross, row.gross >= 100 ? 2 : 4)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-black text-emerald-600">
                    ~${fmt(row.net, row.net >= 100 ? 2 : 4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Where Your Annual Salary Goes</p>
          <TaxBreakdownBar annual={annual} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Federal Tax Bracket Breakdown (Single, 2025)</p>
          <BracketMiniTable annual={annual} />
        </div>
      </div>
    </div>
  );
}
