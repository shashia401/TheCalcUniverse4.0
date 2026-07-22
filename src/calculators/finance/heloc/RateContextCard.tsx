import { HELOCData, fmt } from './helocTypes';

export function RateContextCard({ data }: { data: HELOCData }) {
  const { helocRate, actualDraw } = data;

  const creditCardRate = 24;
  const personalLoanRate = 12;

  const base = 10_000;
  const helocMonthly = base * (helocRate / 100 / 12);
  const ccMonthly = base * (creditCardRate / 100 / 12);
  const plMonthly = base * (personalLoanRate / 100 / 12);

  const ccSavings = ccMonthly - helocMonthly;
  const plSavings = plMonthly - helocMonthly;

  const comparisons = [
    {
      label: 'Credit Card Average',
      rate: creditCardRate,
      savings: ccSavings,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
    {
      label: 'Personal Loan Average',
      rate: personalLoanRate,
      savings: plSavings,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">
          Your HELOC Rate
        </p>
        <p className="text-3xl font-black text-blue-700">{helocRate.toFixed(2)}%</p>
        <p className="text-xs text-blue-500 mt-1">Variable rate tied to Prime Rate</p>
      </div>

      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        Why use your equity? Savings per $10,000 borrowed:
      </p>

      {comparisons.map((c) => (
        <div key={c.label} className={`rounded-xl border ${c.border} ${c.bg} px-4 py-3`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-700">{c.label}</span>
            <span className={`text-sm font-black ${c.color}`}>{c.rate}%</span>
          </div>
          <p className="text-xs text-slate-600">
            You save{' '}
            <strong className="text-emerald-700">${fmt(c.savings)}/month</strong> per $10,000 vs.{' '}
            {c.label.toLowerCase()}.
            {actualDraw > 0 && (
              <span className="block mt-0.5 text-slate-500">
                On your ${fmt(actualDraw)} draw: save{' '}
                <strong className="text-emerald-600">
                  ${fmt((c.savings * actualDraw) / base)}/month
                </strong>{' '}
                vs. this alternative.
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
