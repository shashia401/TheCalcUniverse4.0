import { useMemo } from 'react';
import { DollarSign } from 'lucide-react';
import {
  FilingStatus,
  STATE_RATES_2025,
  FEDERAL_BRACKETS_2025,
  computeIncomeTax,
} from './taxData';

interface Props {
  gross: number;
  status: FilingStatus;
  stateCode: string;
  retirement401k: number;
  health: number;
  otherPreTax: number;
}

function WaterfallChart({ gross, federalTax, fica, stateTax, preTax, netPay }: {
  gross: number; federalTax: number; fica: number; stateTax: number; preTax: number; netPay: number;
}) {
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`;

  const segments = [
    { label: 'Take-Home', amount: netPay, color: '#16a34a', textColor: '#166534' },
    { label: 'Federal Tax', amount: federalTax, color: '#dc2626', textColor: '#991b1b' },
    { label: 'FICA', amount: fica, color: '#ea580c', textColor: '#9a3412' },
    { label: 'State Tax', amount: stateTax, color: '#d97706', textColor: '#92400e' },
    { label: 'Pre-Tax Deductions', amount: preTax, color: '#2563eb', textColor: '#1e3a5f' },
  ].filter(s => s.amount > 0);

  return (
    <div className="space-y-2">
      <div
        className="flex h-8 rounded-xl overflow-hidden gap-0.5"
        role="img"
        aria-label={`Where your gross income goes: ${segments.map((s) => `${s.label} ${fmt(s.amount)}`).join(', ')}`}
      >
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="h-full"
            style={{ width: `${(seg.amount / gross) * 100}%`, backgroundColor: seg.color }}
            title={`${seg.label}: ${fmt(seg.amount)}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <div>
              <p className="text-[10px] text-slate-600 leading-none">{seg.label}</p>
              <p className="text-xs font-black" style={{ color: seg.textColor }}>{fmt(seg.amount)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketTable({ taxableIncome, status }: { taxableIncome: number; status: FilingStatus }) {
  const brackets = FEDERAL_BRACKETS_2025[status];

  const rows = brackets.map((bracket) => {
    const taxable = Math.max(0, Math.min(taxableIncome, bracket.max) - bracket.min);
    const tax = taxable * bracket.rate;
    const active = taxableIncome > bracket.min;
    return { ...bracket, taxable, tax, active };
  });
  const topIdx = rows.reduce((acc, r, i) => (r.taxable > 0 ? i : acc), -1);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtD = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="Federal tax bracket breakdown table">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Bracket</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Range</th>
            <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Taxable</th>
            <th scope="col" className="text-right px-4 py-2.5 font-bold text-red-700 uppercase tracking-wider text-[10px]">Tax Owed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`item-${i}`} className={`border-b border-slate-100 last:border-0 ${i === topIdx ? 'bg-blue-50' : row.active ? 'bg-white' : 'bg-slate-50'}`}>
              <td className={`px-4 py-2.5 font-bold ${row.active ? 'text-slate-800' : 'text-slate-600'}`}>
                {(row.rate * 100).toFixed(0)}%
                {i === topIdx && (
                  <span className="ml-1.5 text-[9px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded-full">YOUR BRACKET</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-right text-slate-500">
                ${fmt(row.min)} – {row.max === Infinity ? '∞' : `$${fmt(row.max)}`}
              </td>
              <td className="px-3 py-2.5 text-right text-slate-600 font-semibold">
                {row.taxable > 0 ? `$${fmt(row.taxable)}` : '—'}
              </td>
              <td className="px-4 py-2.5 text-right font-black text-red-700">
                {row.tax > 0 ? `$${fmtD(row.tax)}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function IncomeTaxPanel({ gross, status, stateCode, retirement401k, health, otherPreTax }: Props) {
  const {
    federalTax, ficaTotal, stateTax, netPay, taxableIncome, preTax,
    ss, medicare, additionalMedicare, effectiveRate, marginalRate,
  } = useMemo(() => {
    const t = computeIncomeTax({ gross, status, stateCode, retirement401k, health, otherPreTax });
    return { ...t, preTax: t.preTaxTotal };
  }, [gross, status, stateCode, retirement401k, health, otherPreTax]);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const stateInfo = STATE_RATES_2025[stateCode];

  const paychecks = [
    { label: 'Annual', gross: gross, net: netPay },
    { label: 'Monthly', gross: gross / 12, net: netPay / 12 },
    { label: 'Semi-Monthly', gross: gross / 24, net: netPay / 24 },
    { label: 'Bi-Weekly', gross: gross / 26, net: netPay / 26 },
    { label: 'Weekly', gross: gross / 52, net: netPay / 52 },
    { label: 'Daily', gross: gross / 260, net: netPay / 260 },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <DollarSign size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">2026 Tax Breakdown · IRS Rev. Proc. 2025-32 Brackets</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Where Your Gross Income Goes</p>
          <WaterfallChart
            gross={gross}
            federalTax={federalTax}
            fica={ficaTotal}
            stateTax={stateTax}
            preTax={preTax}
            netPay={netPay}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Marginal Rate (Top Bracket)</p>
            <p className="text-xl font-black text-slate-800">{(marginalRate * 100).toFixed(0)}%</p>
            <p className="text-[10px] text-slate-600">Rate on your last dollar</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Effective Rate (Actual)</p>
            <p className="text-xl font-black text-blue-700">{effectiveRate.toFixed(2)}%</p>
            <p className="text-[10px] text-slate-600">True % of gross paid in fed tax</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">FICA Breakdown</p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-slate-200">
              <div className="px-4 py-3 text-center">
                <p className="text-[10px] text-slate-600 font-semibold">Social Security</p>
                <p className="text-sm font-black text-orange-700">${fmt(ss)}</p>
                <p className="text-[10px] text-slate-600">6.2%</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-[10px] text-slate-600 font-semibold">Medicare</p>
                <p className="text-sm font-black text-orange-700">${fmt(medicare)}</p>
                <p className="text-[10px] text-slate-600">1.45%</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-[10px] text-slate-600 font-semibold">Add'l Medicare</p>
                <p className="text-sm font-black text-orange-700">${additionalMedicare > 0 ? fmt(additionalMedicare) : '—'}</p>
                <p className="text-[10px] text-slate-600">0.9% over threshold</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">2026 Federal Tax Bracket Breakdown</p>
          <BracketTable taxableIncome={taxableIncome} status={status} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Take-Home Pay by Pay Period</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="Take-home pay by pay period table">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Period</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Gross</th>
                  <th scope="col" className="text-right px-4 py-2.5 font-bold text-emerald-700 uppercase tracking-wider text-[10px]">Take-Home</th>
                </tr>
              </thead>
              <tbody>
                {paychecks.map((p, i) => (
                  <tr key={p.label} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-2.5 font-bold text-slate-800">{p.label}</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">${fmt(p.gross)}</td>
                    <td className="px-4 py-2.5 text-right font-black text-emerald-700">${fmt(p.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {stateInfo?.noIncomeTax && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3">
            <p className="text-sm font-bold text-emerald-700">{stateInfo.name} has no state income tax.</p>
            <p className="text-xs text-emerald-700 mt-1">You keep 100% of your income from state taxes — this is a significant benefit worth thousands annually compared to high-tax states.</p>
          </div>
        )}
      </div>
    </div>
  );
}
