import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface ChartPoint {
  year: number;
  homeValue: number;
  equity: number;
  sunkRentCost: number;
  netBuyCost: number;
}

function fmtCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function getResultValue(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '';
}

function parseNum(s: string): number {
  if (!s) return 0;
  const m = s.replace(/[$,]/g, '').match(/^([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

// ─── SVG Line Chart: Equity Growth vs Sunk Rent Costs ─────────────────────────

function EquityChart({
  chartData,
  breakEvenYear,
  selectedYears,
}: {
  chartData: ChartPoint[];
  breakEvenYear: number | null;
  selectedYears: number;
}) {
  if (!chartData.length) return null;

  const W = 560;
  const H = 280;
  const padL = 72;
  const padR = 24;
  const padT = 24;
  const padB = 44;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const allValues = chartData.flatMap((d) => [d.homeValue, d.equity, d.sunkRentCost]);
  const rawMax = Math.max(...allValues);
  const rawMin = 0;
  const yPad = rawMax * 0.05 || 1000;
  const yMax = rawMax + yPad;

  const toX = (year: number) => padL + (year / (chartData.length - 1 || 1)) * chartW;
  const toY = (v: number) => padT + (1 - (v - rawMin) / (yMax - rawMin)) * chartH;

  const homeValueLine = chartData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.year).toFixed(1)} ${toY(d.homeValue).toFixed(1)}`)
    .join(' ');

  const equityLine = chartData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.year).toFixed(1)} ${toY(d.equity).toFixed(1)}`)
    .join(' ');

  const rentLine = chartData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.year).toFixed(1)} ${toY(d.sunkRentCost).toFixed(1)}`)
    .join(' ');

  const gridCount = 5;
  const gridLines = Array.from({ length: gridCount }, (_, i) => {
    const frac = i / (gridCount - 1);
    const val = rawMin + frac * yMax;
    return { val, y: padT + (1 - frac) * chartH };
  });

  const fmtYAxis = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  const xLabels = [1, 5, 10, 15, 20, 25, 30].filter((y) => y <= chartData.length);

  // Tipping point (break-even year)
  const showBev = breakEvenYear !== null && breakEvenYear >= 1 && breakEvenYear <= 30;
  const bevX = showBev ? toX(breakEvenYear!) : null;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: '320px' }} role="img" aria-label="Equity versus rent cost chart showing home value, equity, and sunk rent costs over 30 years">
        <defs>
          <linearGradient id="rvEqHome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="rvEqEquity" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="rvEqRent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map(({ val, y }) => (
          <g key={val.toFixed(0)}>
            <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
            <text x={padL - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">
              {fmtYAxis(val)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map((yr) => {
          const x = toX(yr);
          return (
            <g key={yr}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#f1f5f9" strokeWidth={0.5} />
              <text x={x} y={padT + chartH + 14} textAnchor="middle" fontSize={9} fill="#94a3b8">
                Yr {yr}
              </text>
            </g>
          );
        })}

        {/* Home value area */}
        <path
          d={`${homeValueLine} L ${toX(30).toFixed(1)} ${(padT + chartH).toFixed(1)} L ${toX(1).toFixed(1)} ${(padT + chartH).toFixed(1)} Z`}
          fill="url(#rvEqHome)"
        />

        {/* Equity area */}
        <path
          d={`${equityLine} L ${toX(30).toFixed(1)} ${(padT + chartH).toFixed(1)} L ${toX(1).toFixed(1)} ${(padT + chartH).toFixed(1)} Z`}
          fill="url(#rvEqEquity)"
        />

        {/* Rent cost area */}
        <path
          d={`${rentLine} L ${toX(30).toFixed(1)} ${(padT + chartH).toFixed(1)} L ${toX(1).toFixed(1)} ${(padT + chartH).toFixed(1)} Z`}
          fill="url(#rvEqRent)"
        />

        {/* Lines */}
        <path d={homeValueLine} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />
        <path d={equityLine} fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinejoin="round" />
        <path d={rentLine} fill="none" stroke="#ef4444" strokeWidth={2} strokeLinejoin="round" strokeDasharray="4 3" />

        {/* Tipping point marker */}
        {bevX !== null && breakEvenYear !== null && (
          <g>
            <line
              x1={bevX}
              y1={padT}
              x2={bevX}
              y2={padT + chartH}
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="5 3"
            />
            <text x={bevX + 4} y={padT + 10} fontSize={8} fill="#d97706" fontWeight="bold">
              Tipping Pt: Yr {breakEvenYear}
            </text>
          </g>
        )}

        {/* Dots at selected year */}
        {(() => {
          const pt = chartData.find((d) => d.year === selectedYears) ?? chartData[chartData.length - 1];
          if (!pt) return null;
          const selX = toX(pt.year);
          return (
            <>
              <circle cx={selX} cy={toY(pt.homeValue)} r={3.5} fill="#3b82f6" />
              <circle cx={selX} cy={toY(pt.equity)} r={3.5} fill="#22c55e" />
              <circle cx={selX} cy={toY(pt.sunkRentCost)} r={3.5} fill="#ef4444" />
            </>
          );
        })()}

        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-blue-500 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Home Value</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-emerald-500 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Equity (Buying benefit)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 flex-shrink-0" style={{ borderTop: '2px dashed #ef4444' }} />
          <span className="text-[10px] text-slate-500">Sunk Rent Costs</span>
        </div>
        {showBev && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 flex-shrink-0" style={{ borderTop: '1.5px dashed #f59e0b' }} />
            <span className="text-[10px] text-slate-500">Tipping Point</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

export default function RentVsBuyPanel({ values, results }: Props) {
  const { chartData, breakEvenYear, selectedYears, buyCost, rentCost, buyWins, homeEquityVal, futureHomeValueVal } = useMemo(() => {
    const homePrice = parseNum(values.homePrice);
    const downPct = parseNum(values.downPaymentPct) / 100;
    const annualRate = parseNum(values.interestRate) / 100;
    const propertyTaxPct = (parseNum(values.propertyTaxPct) || 1.2) / 100;
    const maintenancePct = (parseNum(values.maintenancePct) || 1.5) / 100;
    const appreciation = parseNum(values.homeAppreciation) / 100;
    const monthlyRent = parseNum(values.monthlyRent);
    const rentIncrease = (parseNum(values.rentIncrease) || 3) / 100;
    const rentersInsuranceAnnual = parseNum(values.rentersInsurance) || 200;
    const years = parseNum(values.years) || 7;
    const closingCostsPct = (parseNum(values.closingCostsPct) || 3) / 100;

    if ([homePrice, downPct, annualRate, monthlyRent, years, appreciation].some(isNaN)) {
      return { chartData: [] as ChartPoint[], breakEvenYear: null, selectedYears: 0, buyCost: 0, rentCost: 0, buyWins: false, homeEquityVal: 0, futureHomeValueVal: 0 };
    }
    if (homePrice <= 0 || years <= 0) {
      return { chartData: [] as ChartPoint[], breakEvenYear: null, selectedYears: 0, buyCost: 0, rentCost: 0, buyWins: false, homeEquityVal: 0, futureHomeValueVal: 0 };
    }

    const downPayment = homePrice * downPct;
    const principal = homePrice - downPayment;
    const closingCosts = homePrice * closingCostsPct;
    const monthlyRate = annualRate / 12;
    const numPayments30 = 30 * 12;

    let monthlyMortgage: number;
    if (monthlyRate === 0) {
      monthlyMortgage = principal / numPayments30;
    } else {
      monthlyMortgage =
        (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments30))) /
        (Math.pow(1 + monthlyRate, numPayments30) - 1);
    }

    const propertyTaxMonthly = (homePrice * propertyTaxPct) / 12;
    const maintenanceMonthly = (homePrice * maintenancePct) / 12;
    const homeInsuranceMonthly = (homePrice * 0.005) / 12;

    // Generate 30-year chart data
    const data: ChartPoint[] = [];
    let runningBuyCost = downPayment + closingCosts;
    let remainingBalance = principal;
    let runningRentCost = 0;
    let currentRent = monthlyRent;
    let foundBreakEven: number | null = null;

    for (let yr = 1; yr <= 30; yr++) {
      for (let m = 0; m < 12; m++) {
        const interest = remainingBalance * monthlyRate;
        const principalPaid = monthlyMortgage - interest;
        remainingBalance = Math.max(remainingBalance - principalPaid, 0);
        runningBuyCost += monthlyMortgage + propertyTaxMonthly + maintenanceMonthly + homeInsuranceMonthly;
      }
      runningRentCost += currentRent * 12 + rentersInsuranceAnnual;
      currentRent *= (1 + rentIncrease);

      const fv = homePrice * Math.pow(1 + appreciation, yr);
      const equity = fv - remainingBalance;
      const netBuy = runningBuyCost - equity;

      data.push({
        year: yr,
        homeValue: fv,
        equity: Math.max(0, equity),
        sunkRentCost: runningRentCost,
        netBuyCost: netBuy,
      });

      if (foundBreakEven === null && netBuy <= runningRentCost) {
        foundBreakEven = yr;
      }
    }

    // Get values for selected year
    const selectedPt = data.find((d) => d.year === years);
    const futureHomeValueVal = selectedPt ? selectedPt.homeValue : 0;
    const homeEquityVal = selectedPt ? selectedPt.equity : 0;
    const buyCost = selectedPt ? selectedPt.netBuyCost : 0;
    const rentCost = selectedPt ? selectedPt.sunkRentCost : 0;
    const buyWins = buyCost < rentCost;

    return {
      chartData: data,
      breakEvenYear: foundBreakEven,
      selectedYears: years,
      buyCost,
      rentCost,
      buyWins,
      homeEquityVal,
      futureHomeValueVal,
    };
  }, [values.homePrice, values.downPaymentPct, values.interestRate, values.propertyTaxPct, values.maintenancePct, values.homeAppreciation, values.monthlyRent, values.rentIncrease, values.rentersInsurance, values.years, values.closingCostsPct]);

  if (!chartData.length) return null;

  const difference = Math.abs(rentCost - buyCost);

  // Derive monthly breakdown from results
  const totalMonthlyBuyStr = getResultValue(results, 'totalMonthlyBuy');
  const closingCostsLineStr = getResultValue(results, 'closingCostsLine');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-500" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Equity vs. Rent: 30-Year Projection
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* 1. Hero result */}
        <div className={`rounded-xl border px-6 py-5 ${buyWins ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${buyWins ? 'text-emerald-600' : 'text-amber-600'}`}>
                After {selectedYears} Year{selectedYears !== 1 ? 's' : ''}
              </p>
              <p className={`text-2xl font-black ${buyWins ? 'text-emerald-800' : 'text-amber-800'}`}>
                {buyWins ? 'Buying saves you' : 'Renting saves you'} {fmtCompact(difference)}
              </p>
            </div>
            <div className="rounded-lg border bg-white px-4 py-2.5 text-center shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Home Equity</p>
              <p className="text-lg font-black text-emerald-700 mt-0.5">{fmtCompact(homeEquityVal)}</p>
            </div>
          </div>
        </div>

        {/* 2. SVG Line Chart */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Home Value, Equity &amp; Sunk Rent Costs Over 30 Years
          </p>
          <EquityChart
            chartData={chartData}
            breakEvenYear={breakEvenYear}
            selectedYears={selectedYears}
          />
        </div>

        {/* 3. Color-coded buy vs rent comparison cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
              Buying Cost ({selectedYears} yrs)
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Net cost to buy</span>
                <span className="font-bold text-emerald-700">{fmtCompact(buyCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Home equity</span>
                <span className="font-bold text-emerald-700">+{fmtCompact(homeEquityVal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Future home value</span>
                <span className="font-bold text-blue-600">{fmtCompact(futureHomeValueVal)}</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-3">
              Renting Cost ({selectedYears} yrs)
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Net cost to rent</span>
                <span className="font-bold text-blue-700">{fmtCompact(rentCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Difference</span>
                <span className={`font-bold ${buyWins ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {fmtCompact(difference)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Result</span>
                <span className={`font-bold ${buyWins ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {buyWins ? 'Buying wins' : 'Renting wins'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Month-by-month breakdown summary */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Monthly Cost Breakdown
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Monthly Buy</p>
              <p className="text-lg font-black text-emerald-700">{totalMonthlyBuyStr || 'N/A'}</p>
              <p className="text-[10px] text-slate-500">P&amp;I + taxes + insurance + maintenance</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Upfront Closing Costs</p>
              <p className="text-lg font-black text-blue-700">{closingCostsLineStr || 'N/A'}</p>
              <p className="text-[10px] text-slate-500">One-time cost at purchase</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">TIP</p>
              <p className="text-lg font-black text-amber-700">
                {breakEvenYear !== null && breakEvenYear >= 1 && breakEvenYear <= 30
                  ? `Stay > ${breakEvenYear} yr${breakEvenYear !== 1 ? 's' : ''}`
                  : 'No break-even'}
              </p>
              <p className="text-[10px] text-slate-500">
                {breakEvenYear !== null && breakEvenYear >= 1 && breakEvenYear <= 30
                  ? 'After this point buying is cheaper'
                  : 'Renting stays cheaper long-term'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
