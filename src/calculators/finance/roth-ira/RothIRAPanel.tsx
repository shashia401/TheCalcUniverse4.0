import { PiggyBank } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
  limits: { base: number; catchup: number; taxYear: number };
}

function DonutChart({ contributions, earnings }: { contributions: number; earnings: number }) {
  const total = contributions + earnings;
  if (total <= 0) return null;

  const cx = 90;
  const cy = 90;
  const r = 72;
  const innerR = 40;

  const slices = [
    { label: 'Your Contributions', value: contributions, color: '#3b82f6' },
    { label: 'Tax-Free Growth', value: earnings, color: '#22c55e' },
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
  const paths = slices.map((s) => {
    const angle = (s.value / total) * 360;
    const path = getPath(currentAngle, currentAngle + angle);
    currentAngle += angle;
    return { ...s, path };
  });

  const fmtM = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1000).toFixed(0)}K`;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 180 180" className="w-44 h-44 flex-shrink-0" role="img" aria-label="Roth IRA contribution breakdown donut chart">
        {paths.map((p) => (
          <path key={p.label} d={p.path} fill={p.color} opacity={0.88} />
        ))}
        <text x={cx} y={cy - 7} textAnchor="middle" fontSize={11} fontWeight="800" fill="#1e293b">{fmtM(total)}</text>
        <text x={cx} y={cy + 7} textAnchor="middle" fontSize={8} fill="#94a3b8">tax-free</text>
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

function GrowthTimeline({ currentAge, retirementAge, currentBalance, contribution, annualReturn }: {
  currentAge: number; retirementAge: number; currentBalance: number; contribution: number; annualReturn: number;
}) {
  const years = retirementAge - currentAge;
  const checkpoints = [0, Math.round(years * 0.25), Math.round(years * 0.5), Math.round(years * 0.75), years];
  const data = checkpoints.map((yr) => {
    let bal = currentBalance;
    let contribs = 0;
    for (let y = 0; y < yr; y++) {
      bal = bal * (1 + annualReturn) + contribution;
      contribs += contribution;
    }
    return { year: yr, age: currentAge + yr, balance: bal, contributions: currentBalance + contribs, earnings: bal - currentBalance - contribs };
  });

  const maxBal = data[data.length - 1].balance;
  const fmtM = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toFixed(0)}`;

  return (
    <div className="space-y-3">
      {data.filter((_, i) => i > 0).map((d) => (
        <div key={d.year}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs font-bold text-slate-600">Age {d.age} (+{d.year}yr)</span>
            <div className="text-right">
              <span className="text-sm font-black text-emerald-700">{fmtM(d.balance)}</span>
              <span className="text-[10px] text-slate-500 ml-2">{fmtM(d.earnings)} growth</span>
            </div>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex">
            <div className="h-full bg-blue-400" style={{ width: `${maxBal > 0 ? (d.contributions / maxBal) * 100 : 0}%` }} />
            <div className="h-full bg-emerald-400" style={{ width: `${maxBal > 0 ? (d.earnings / maxBal) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
      <div className="flex gap-4 pt-1">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-400" /><span className="text-[10px] text-slate-500">Contributions</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-400" /><span className="text-[10px] text-slate-500">Tax-Free Growth</span></div>
      </div>
    </div>
  );
}

function TaxComparisonCard({ taxFreeTotal, retirementTaxRate, contributions }: {
  taxFreeTotal: number; retirementTaxRate: number; contributions: number;
}) {
  const earnings = taxFreeTotal - contributions;
  const traditionalTaxOnEarnings = earnings * retirementTaxRate;
  const traditionalTaxOnAll = taxFreeTotal * retirementTaxRate;
  const rothTax = 0;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Traditional IRA / Taxable</p>
        <p className="text-lg font-black text-red-600">{fmt(traditionalTaxOnEarnings)}</p>
        <p className="text-[10px] text-slate-500 mt-1">taxes owed on earnings at {(retirementTaxRate * 100).toFixed(0)}% retirement rate</p>
        <p className="text-[10px] text-red-400 mt-1">(Up to {fmt(traditionalTaxOnAll)} if all taxed)</p>
      </div>
      <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4">
        <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Roth IRA</p>
        <p className="text-lg font-black text-emerald-700">{fmt(rothTax)}</p>
        <p className="text-[10px] text-emerald-600 mt-1">taxes owed — qualified withdrawals are 100% tax-free</p>
        <p className="text-[10px] text-emerald-500 mt-1">You keep {fmt(taxFreeTotal)} all for yourself</p>
      </div>
    </div>
  );
}

export default function RothIRAPanel({ values, limits }: Props) {
  const currentAge = parseInt(values.currentAge) || 30;
  const retirementAge = parseInt(values.retirementAge) || 65;
  const currentBalance = parseFloat(values.currentBalance) || 0;
  const annualContribution = parseFloat(values.annualContribution) || 0;
  const annualReturn = parseFloat(values.annualReturn) / 100 || 0.07;
  const retirementTaxRate = parseFloat(values.expectedRetirementTaxRate) / 100 || 0.12;

  const isCatchup = currentAge >= 50;
  const maxContrib = isCatchup ? limits.base + limits.catchup : limits.base;
  const contribution = Math.min(annualContribution, maxContrib);
  const years = retirementAge - currentAge;

  let balance = currentBalance;
  let totalContributions = 0;
  for (let y = 0; y < years; y++) {
    balance = balance * (1 + annualReturn) + contribution;
    totalContributions += contribution;
  }

  const totalContribsIncludingStart = currentBalance + totalContributions;
  const earnings = balance - totalContribsIncludingStart;

  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

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
              <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">{limits.taxYear} IRS Contribution Limits</p>
              <p className="text-sm text-emerald-700 mt-0.5">Under 50: <strong>${limits.base.toLocaleString()}/yr</strong> &nbsp;|&nbsp; Age 50+: <strong>${(limits.base + limits.catchup).toLocaleString()}/yr</strong></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-500">Your contribution</p>
              <p className="text-lg font-black text-emerald-700">${contribution.toLocaleString()}/yr</p>
              {annualContribution > maxContrib && (
                <p className="text-[10px] text-red-500 font-bold">Exceeds limit — capped</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Balance Breakdown at Retirement</p>
          <DonutChart contributions={totalContribsIncludingStart} earnings={Math.max(0, earnings)} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Tax Advantage: Roth vs. Traditional at Withdrawal</p>
          <TaxComparisonCard taxFreeTotal={balance} retirementTaxRate={retirementTaxRate} contributions={totalContribsIncludingStart} />
          <p className="text-xs text-slate-500 mt-2">
            If your {(retirementTaxRate * 100).toFixed(0)}% retirement tax rate estimate is correct, the Roth saves you{' '}
            <strong className="text-emerald-700">{fmt(earnings * retirementTaxRate)}</strong> in taxes on earnings alone vs. a traditional IRA.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Balance Growth Over Time</p>
          <GrowthTimeline
            currentAge={currentAge} retirementAge={retirementAge}
            currentBalance={currentBalance} contribution={contribution} annualReturn={annualReturn}
          />
        </div>
      </div>
    </div>
  );
}
