import { Home } from 'lucide-react';

interface Props {
  monthlyIncome: number;
  maxRent: number;
  monthlyDebts: number;
}

function PieChart({ rent, debts, remaining, total }: { rent: number; debts: number; remaining: number; total: number }) {
  const cx = 90;
  const cy = 90;
  const r = 72;
  const innerR = 40;

  const denom = Math.max(total, rent + debts, 1);
  const slices = [
    { value: rent, color: '#3b82f6', label: 'Rent' },
    { value: debts, color: '#f97316', label: 'Debts' },
    { value: Math.max(0, remaining), color: '#22c55e', label: 'Remaining' },
  ].filter((s) => s.value > 0);

  const getPath = (startAngle: number, endAngle: number) => {
    const s = startAngle * Math.PI / 180;
    const e = endAngle * Math.PI / 180;
    const x1o = cx + r * Math.cos(s);
    const y1o = cy + r * Math.sin(s);
    const x2o = cx + r * Math.cos(e);
    const y2o = cy + r * Math.sin(e);
    const x1i = cx + innerR * Math.cos(e);
    const y1i = cy + innerR * Math.sin(e);
    const x2i = cx + innerR * Math.cos(s);
    const y2i = cy + innerR * Math.sin(s);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1o} ${y1o} A ${r} ${r} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${innerR} ${innerR} 0 ${large} 0 ${x2i} ${y2i} Z`;
  };

  let currentAngle = -90;
  const paths = slices.map((slice) => {
    const angle = (slice.value / denom) * 360;
    const path = getPath(currentAngle, currentAngle + angle);
    currentAngle += angle;
    return { ...slice, path };
  });

  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 180 180" className="w-48 h-48 flex-shrink-0" role="img" aria-label="Rent affordability breakdown donut chart">
        {paths.map((p) => (
          <path key={p.label} d={p.path} fill={p.color} opacity={0.88} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fontWeight="800" fill="#1e293b">{fmt(total)}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize={8} fill="#94a3b8">per month</text>
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

function RentScenarios({ monthlyIncome, monthlyDebts }: { monthlyIncome: number; monthlyDebts: number }) {
  const scenarios = [
    { label: 'Conservative (25%)', pct: 0.25, color: '#22c55e' },
    { label: 'Standard 30% Rule', pct: 0.30, color: '#3b82f6' },
    { label: '40x Rule (~30%)', pct: null, color: '#f59e0b' },
    { label: 'Aggressive (35%)', pct: 0.35, color: '#f97316' },
  ];

  const fmtD = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const maxRent = Math.max(...scenarios.map((s) =>
    s.pct ? monthlyIncome * s.pct : (monthlyIncome * 12) / 40
  ));

  return (
    <div className="space-y-2.5">
      {scenarios.map((s) => {
        const rent = s.pct ? monthlyIncome * s.pct : (monthlyIncome * 12) / 40;
        const barPct = maxRent > 0 ? (rent / maxRent) * 100 : 0;
        const remaining = monthlyIncome - rent - monthlyDebts;
        return (
          <div key={s.label}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs font-bold text-slate-600">{s.label}</span>
              <div className="text-right">
                <span className="text-sm font-black" style={{ color: s.color }}>{fmtD(rent)}/mo</span>
                <span className="text-[10px] text-slate-500 ml-2">
                  {remaining > 0 ? `${fmtD(remaining)} left` : 'Over budget'}
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: s.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RentAffordabilityPanel({ monthlyIncome, maxRent, monthlyDebts }: Props) {
  const remaining = monthlyIncome - maxRent - monthlyDebts;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Home size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Monthly Budget Breakdown</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Income Allocation</p>
          <PieChart rent={maxRent} debts={monthlyDebts} remaining={remaining} total={monthlyIncome} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Max Rent by Rule</p>
          <RentScenarios monthlyIncome={monthlyIncome} monthlyDebts={monthlyDebts} />
        </div>

        {remaining < monthlyIncome * 0.35 && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3">
            <p className="text-sm font-bold text-amber-700 mb-1">Tight Budget Warning</p>
            <p className="text-xs text-amber-600">
              After rent and debts, you have <strong>${Math.max(0, remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</strong> left for
              food, transportation, savings, and emergencies. Consider reducing debts before increasing rent budget.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
