import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { CrossoverChart } from './CrossoverChart';
import { CostBreakdown, fmtDollar } from './CostBreakdown';
import { BreakEvenContext } from './BreakEvenContext';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface RVBData {
  breakEvenYear: number;
  yearRange: number;
  chartData: { year: number; cumulativeRentCost: number; cumulativeBuyCost: number }[];
  selectedYear: number;
  buyingCostAtHorizon: number;
  rentingCostAtHorizon: number;
  difference: number;
  cheaperOption: 'buy' | 'rent';
  homePrice: number;
  downPayment: number;
  closingCosts: number;
  loanAmount: number;
  monthlyRent: number;
  annualRentIncrease: number;
  rentersInsurance: number;
  mortgageRate: number;
  propertyTaxRate: number;
  maintenancePct: number;
  pmiRate: number;
  downPaymentPct: number;
  sellingCostsPct: number;
  homeAppreciationRate: number;
  homeValueAtHorizon: number;
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function RentVsBuyPanel({ results }: Props) {
  const data = useMemo<RVBData | null>(() => {
    const raw = results.find((r) => r.id === '_rvbData');
    if (!raw) return null;
    try {
      return JSON.parse(raw.value) as RVBData;
    } catch {
      return null;
    }
  }, [results]);

  if (!data) return null;

  const {
    breakEvenYear,
    chartData,
    selectedYear,
    difference,
    cheaperOption,
  } = data;

  const breakEvenDisplay =
    breakEvenYear === -1
      ? 'No break-even within 30 years'
      : breakEvenYear <= 1
      ? 'Buying is cheaper from year 1'
      : `Year ${breakEvenYear}`;

  const isEverBuyingCheaper = breakEvenYear !== -1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-slate-500"
          aria-hidden="true"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Rent vs. Buy Analysis
        </span>
      </div>

      <div className="p-6 space-y-8">
        {/* 1. Hero verdict banner */}
        <div
          className={`rounded-xl border px-6 py-5 ${
            cheaperOption === 'buy'
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                  cheaperOption === 'buy' ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                After {selectedYear} Year{selectedYear !== 1 ? 's' : ''}
              </p>
              <p
                className={`text-2xl font-black ${
                  cheaperOption === 'buy' ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                {cheaperOption === 'buy' ? 'Buying' : 'Renting'} saves you{' '}
                {fmtDollar(difference)}
              </p>
            </div>
            <div
              className={`rounded-lg border px-4 py-2.5 text-center shrink-0 ${
                isEverBuyingCheaper
                  ? 'border-emerald-300 bg-white'
                  : 'border-amber-300 bg-white'
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Break-Even
              </p>
              <p
                className={`text-lg font-black mt-0.5 ${
                  isEverBuyingCheaper ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {breakEvenDisplay}
              </p>
              {isEverBuyingCheaper && breakEvenYear > 1 && (
                <p className="text-[10px] text-slate-500 mt-0.5">buying becomes cheaper</p>
              )}
            </div>
          </div>
        </div>

        {/* 2. Crossover chart */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            30-Year Net Cost Comparison
          </p>
          <CrossoverChart
            chartData={chartData}
            breakEvenYear={breakEvenYear}
            selectedYear={selectedYear}
          />
        </div>

        {/* 3. Side-by-side cost breakdown */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Cost Breakdown at Year {selectedYear}
          </p>
          <CostBreakdown data={data} />
        </div>

        {/* 4. Break-even context */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Understanding the Break-Even Point
          </p>
          <BreakEvenContext breakEvenYear={breakEvenYear} />
        </div>
      </div>
    </div>
  );
}
