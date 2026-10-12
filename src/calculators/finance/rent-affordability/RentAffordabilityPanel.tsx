import { Home } from 'lucide-react';
import MiniDonut from '../../../components/calculator/MiniDonut';

interface Props {
  monthlyIncome: number;
  maxRent: number;
  monthlyDebts: number;
}

const fmtD = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function RentScenarios({ monthlyIncome, monthlyDebts }: { monthlyIncome: number; monthlyDebts: number }) {
  const scenarios = [
    { label: 'Conservative (25%)', rent: monthlyIncome * 0.25, color: '#15803d' },
    { label: 'Standard 30% Rule', rent: monthlyIncome * 0.3, color: '#1d4ed8' },
    { label: '40x Rule (= 30%)', rent: (monthlyIncome * 12) / 40, color: '#b45309' },
    { label: 'Aggressive (35%)', rent: monthlyIncome * 0.35, color: '#c2410c' },
  ];
  const maxRent = Math.max(...scenarios.map((s) => s.rent));

  return (
    <div className="space-y-2.5">
      {scenarios.map((s) => {
        const barPct = maxRent > 0 ? (s.rent / maxRent) * 100 : 0;
        const remaining = monthlyIncome - s.rent - monthlyDebts;
        return (
          <div key={s.label}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs font-bold text-slate-600">{s.label}</span>
              <div className="text-right">
                <span className="text-sm font-black text-slate-900">{fmtD(s.rent)}/mo</span>
                <span className="text-[10px] text-slate-600 ml-2">
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
        <Home size={16} className="text-slate-500" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Monthly Budget Breakdown</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-4">Income Allocation</p>
          <MiniDonut
            donut={{
              segments: [
                { label: 'Rent', value: maxRent, color: '#2563eb' },
                { label: 'Debts', value: monthlyDebts, color: '#ea580c' },
                { label: 'Remaining', value: Math.max(0, remaining), color: '#16a34a' },
              ].filter((s) => s.value > 0),
              centerLabel: 'per month',
              formatValue: fmtD,
              caption: 'How gross monthly income splits between rent, existing debts and what is left',
            }}
          />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Max Rent by Rule</p>
          <RentScenarios monthlyIncome={monthlyIncome} monthlyDebts={monthlyDebts} />
        </div>

        {remaining < monthlyIncome * 0.35 && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3">
            <p className="text-sm font-bold text-amber-800 mb-1">Tight Budget Warning</p>
            <p className="text-xs text-amber-800">
              After rent and debts, you have <strong>{fmtD(Math.max(0, remaining))}/mo</strong> left for
              food, transportation, savings, and emergencies. Consider reducing debts before increasing rent budget.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
