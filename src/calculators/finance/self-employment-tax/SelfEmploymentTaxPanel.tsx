import { CalculatorResult } from '../../../types/calculator';
import { FICA } from '../../../utils/taxData';
import MiniDonut from '../../../components/calculator/MiniDonut';
import { computeSeTax, parseSeInput } from './seTaxMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SelfEmploymentTaxPanel({ values, results }: Props) {
  const input = parseSeInput(values);
  if (!results.length || !(input.netProfit > 0)) return null;
  // Same pure function as index.ts, so the panel never re-parses formatted result strings.
  const c = computeSeTax(input);
  const { secaTax, socialSecurityPortion: ssAmount, medicarePortion: medicareAmount, deductiblePortion, qbiSavings, additionalMedicare } = c;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-500" aria-hidden="true">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Self-Employment Tax Analysis
        </span>
      </div>

      <div className="p-6 space-y-6">
        <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-red-700 mb-1">Your Self-Employment Tax</p>
          <p className="text-3xl font-black text-red-700">${fmt(secaTax)}</p>
          <p className="text-xs text-slate-600 mt-1">
            Effective rate: <span className="font-bold text-slate-700">{c.effectiveRate.toFixed(2)}%</span> of net profit
          </p>
        </div>

        {secaTax > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">SS vs. Medicare Split</p>
            <MiniDonut
              donut={{
                segments: [
                  { label: 'Social Security (12.4%)', value: ssAmount, color: '#1d4ed8' },
                  { label: 'Medicare (2.9%)', value: medicareAmount, color: '#b45309' },
                ],
                centerLabel: 'SECA tax',
                formatValue: (n) => `$${Math.round(n).toLocaleString()}`,
                caption: 'Social Security and Medicare shares of self-employment tax',
              }}
            />
          </div>
        )}

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Tax Breakdown</p>
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-blue-800">Social Security Portion</span>
              <span className="text-sm font-black text-blue-800">${fmt(ssAmount)}</span>
            </div>
            <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-700 rounded-full" style={{ width: `${secaTax > 0 ? (ssAmount / secaTax) * 100 : 0}%` }} />
            </div>
            <p className="text-[10px] text-blue-800 mt-1">12.4% rate · Capped at ${FICA.socialSecurityWageBase.toLocaleString()} wage base (2026)</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-amber-800">Medicare Portion</span>
              <span className="text-sm font-black text-amber-800">${fmt(medicareAmount)}</span>
            </div>
            <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-700 rounded-full" style={{ width: `${secaTax > 0 ? (medicareAmount / secaTax) * 100 : 0}%` }} />
            </div>
            <p className="text-[10px] text-amber-800 mt-1">2.9% rate · No wage base cap</p>
          </div>
          {additionalMedicare > 0 && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-red-700">Additional Medicare Tax (0.9%)</span>
                <span className="text-sm font-black text-red-700">${fmt(additionalMedicare)}</span>
              </div>
              <p className="text-[10px] text-red-700 mt-1">On earnings above ${c.threshold.toLocaleString()} for your filing status; separate from SECA tax</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">Deductible Half</p>
            <p className="text-lg font-black text-emerald-800">${fmt(deductiblePortion)}</p>
            <p className="text-[10px] text-emerald-800 mt-0.5">Above-the-line deduction on Form 1040</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-800">QBI Savings (Est.)</p>
            <p className="text-lg font-black text-blue-800">${fmt(qbiSavings)}</p>
            <p className="text-[10px] text-blue-800 mt-0.5">20% of QBI × 22% assumed marginal rate</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">How It&apos;s Calculated</p>
          <div className="text-xs text-slate-600 space-y-0.5 font-mono">
            <p>SE Earnings = Net Profit × 92.35%</p>
            <p>Social Security = min(SE Earnings, Remaining Wage Base) × 12.4%</p>
            <p>Medicare = SE Earnings × 2.9%</p>
            <p>Total SECA Tax = SS Portion + Medicare Portion</p>
          </div>
        </div>
      </div>
    </div>
  );
}
