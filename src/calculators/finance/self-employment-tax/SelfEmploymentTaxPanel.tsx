import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function getVal(results: CalculatorResult[], id: string): number {
  const r = results.find((x) => x.id === id);
  if (!r) return 0;
  const m = r.value.replace(/[$,]/g, '').match(/^([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

function getStr(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '$0.00';
}

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── SVG Pie Chart ────────────────────────────────────────────────────────────

function PieChart({ ssAmount, medicareAmount }: { ssAmount: number; medicareAmount: number }) {
  const total = ssAmount + medicareAmount;
  if (total <= 0) return null;

  // Convert to percentages of a circle (starting from top, going clockwise)
  const ssFrac = ssAmount / total;
  const ssAngle = ssFrac * 360;

  function polar(cx: number, cy: number, r: number, deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const cx = 120;
  const cy = 80;
  const radius = 60;

  const ssPath = (() => {
    if (ssFrac >= 1) return '';
    const p1 = polar(cx, cy, radius, 0);
    const p2 = polar(cx, cy, radius, ssAngle);
    const large = ssAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
  })();

  const medPath = (() => {
    if (ssFrac >= 1) return `M ${cx} ${cy} A ${radius} ${radius} 0 1 1 ${cx} ${cy - 0.01} Z`;
    const p1 = polar(cx, cy, radius, ssAngle);
    const p2 = polar(cx, cy, radius, 360);
    const large = (360 - ssAngle) > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
  })();

  return (
    <div className="flex flex-col items-center">
      <svg width="240" height="160" viewBox="0 0 240 160" role="img" aria-label="SECA tax breakdown pie chart">
        {ssFrac < 1 && <path d={ssPath} fill="#3b82f6" opacity={0.85} />}
        {ssFrac >= 1 && <circle cx={cx} cy={cy} r={radius} fill="#3b82f6" opacity={0.85} />}
        {medPath && <path d={medPath} fill="#f59e0b" opacity={0.85} />}
        <circle cx={cx} cy={cy} r={28} className="fill-white dark:fill-slate-800" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight="bold" fill="#1e293b">{total > 0 ? `${(ssFrac * 100).toFixed(0)}%` : 'N/A'}</text>
        {/* Legend */}
        <rect x={20} y={145} width={10} height={10} rx={2} fill="#3b82f6" />
        <text x={34} y={154} fontSize={10} fill="#475569">SS ({(ssFrac * 100).toFixed(0)}%)</text>
        <rect x={105} y={145} width={10} height={10} rx={2} fill="#f59e0b" />
        <text x={119} y={154} fontSize={10} fill="#475569">Medicare ({(100 - ssFrac * 100).toFixed(0)}%)</text>
      </svg>
    </div>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

export default function SelfEmploymentTaxPanel({ results }: Props) {
  const secaTax = getVal(results, 'secaTax');
  const ssAmount = getVal(results, 'socialSecurityPortion');
  const medicareAmount = getVal(results, 'medicarePortion');
  const effectiveRate = parseFloat(getStr(results, 'effectiveRate').replace('%', ''));
  const deductiblePortion = getVal(results, 'deductiblePortion');
  const qbiSavings = getVal(results, 'qbiSavings');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
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
        {/* Hero result card */}
        <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1">Your Self-Employment Tax</p>
          <p className="text-3xl font-black text-red-700">{getStr(results, 'secaTax')}</p>
          <p className="text-xs text-slate-500 mt-1">
            Effective rate: <span className="font-bold text-slate-700">{effectiveRate.toFixed(2)}%</span> of net profit
          </p>
        </div>

        {/* Pie chart */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">SS vs. Medicare Split</p>
          <PieChart ssAmount={ssAmount} medicareAmount={medicareAmount} />
        </div>

        {/* Color-coded breakdown */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Tax Breakdown</p>
          {/* SS bar */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-blue-700">Social Security Portion</span>
              <span className="text-sm font-black text-blue-700">${fmt(ssAmount)}</span>
            </div>
            <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${secaTax > 0 ? (ssAmount / secaTax) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[10px] text-blue-500 mt-1">12.4% rate · Capped at $176,100 wage base (2026)</p>
          </div>
          {/* Medicare bar */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-amber-700">Medicare Portion</span>
              <span className="text-sm font-black text-amber-700">${fmt(medicareAmount)}</span>
            </div>
            <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${secaTax > 0 ? (medicareAmount / secaTax) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[10px] text-amber-500 mt-1">2.9% rate · No wage base cap</p>
          </div>
        </div>

        {/* Savings cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Deductible Half</p>
            <p className="text-lg font-black text-emerald-700">${fmt(deductiblePortion)}</p>
            <p className="text-[10px] text-emerald-500 mt-0.5">Above-the-line deduction on Form 1040</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">QBI Savings (Est.)</p>
            <p className="text-lg font-black text-blue-700">${fmt(qbiSavings)}</p>
            <p className="text-[10px] text-blue-500 mt-0.5">20% QBI × 22% assumed marginal rate</p>
          </div>
        </div>

        {/* Formula summary */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">How It's Calculated</p>
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
