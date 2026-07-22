import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function fmtDollar(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getResultValue(results: CalculatorResult[], id: string): number {
  const r = results.find((x) => x.id === id);
  if (!r) return 0;
  const m = r.value.replace(/[$,]/g, '').match(/^([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

function getResultStr(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '$0';
}

// ─── SVG Profit Gauge ─────────────────────────────────────────────────────────

function ProfitGauge({ roi }: { roi: number }) {
  const cx = 100;
  const cy = 100;
  const r = 72;
  const strokeW = 14;
  const startAngle = 180;
  const endAngle = 0;
  const totalAngle = 180;

  const normalizedRoi = Math.min(Math.max(roi, 0), 50);
  const fraction = normalizedRoi / 50;
  const angle = startAngle - fraction * totalAngle;

  function polar(cx: number, cy: number, rad: number, deg: number) {
    const rads = (deg * Math.PI) / 180;
    return { x: cx + rad * Math.cos(rads), y: cy - rad * Math.sin(rads) };
  }

  const arcSweep = fraction * totalAngle;
  const p1 = polar(cx, cy, r, startAngle);
  const p2 = polar(cx, cy, r, startAngle - arcSweep);
  const largeArc = arcSweep > 180 ? 1 : 0;
  const arcPath = `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 0 ${p2.x} ${p2.y}`;

  const needleEnd = polar(cx, cy, r - 10, angle);
  const needleStart = polar(cx, cy, 12, angle + 180);

  const color = roi >= 20 ? '#22c55e' : roi >= 10 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="130" viewBox="0 0 200 130" role="img" aria-label="ROI gauge chart">
        {/* Background arc */}
        <path
          d={`M ${polar(cx, cy, r, startAngle).x} ${polar(cx, cy, r, startAngle).y} A ${r} ${r} 0 1 0 ${polar(cx, cy, r, endAngle).x} ${polar(cx, cy, r, endAngle).y}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* Active arc */}
        {roi > 0 && (
          <path
            d={arcPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        )}
        {/* Needle */}
        <line x1={needleStart.x} y1={needleStart.y} x2={needleEnd.x} y2={needleEnd.y} stroke="#1e293b" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill="#1e293b" />
        {/* Labels */}
        <text x={cx} y={cy + 32} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#1e293b">{roi.toFixed(1)}% ROI</text>
        <text x={15} y={118} fontSize={8} fill="#94a3b8">0%</text>
        <text x={185} y={118} fontSize={8} fill="#94a3b8" textAnchor="end">50%</text>
      </svg>
    </div>
  );
}

// ─── SVG Budget Bar ───────────────────────────────────────────────────────────

function BudgetBreakdownBar({
  mao,
  repairCosts,
  holdingCosts,
  profit,
  arv,
}: {
  mao: number;
  repairCosts: number;
  holdingCosts: number;
  profit: number;
  arv: number;
}) {
  const segments = [
    { label: 'Purchase (MAO)', value: mao, color: '#3b82f6' },
    { label: 'Repairs', value: repairCosts, color: '#f59e0b' },
    { label: 'Holding Costs', value: holdingCosts, color: '#ef4444' },
    { label: 'Profit', value: Math.max(0, profit), color: '#22c55e' },
  ].filter((s) => s.value > 0);

  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex h-8 rounded-xl overflow-hidden gap-0.5">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="h-full transition-all"
            style={{ width: `${(seg.value / arv) * 100}%`, backgroundColor: seg.color }}
            title={`${seg.label}: $${fmtDollar(seg.value)}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <div>
              <p className="text-[10px] text-slate-500 leading-none">{seg.label}</p>
              <p className="text-xs font-black text-slate-700">${fmtDollar(seg.value)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 70% Rule Formula SVG ─────────────────────────────────────────────────────

function SeventyRuleFormula({ arv, repairCosts, seventyRule }: { arv: number; repairCosts: number; seventyRule: number }) {
  const W = 520;
  const H = 120;

  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="70% Rule formula">
        <rect x={10} y={8} width={W - 20} height={40} rx={8} fill="#eff6ff" stroke="#bfdbfe" strokeWidth={1} />
        <text x={20} y={22} fontSize={11} fontWeight="bold" fill="#1e40af">70% Rule Formula:</text>
        <text x={20} y={40} fontSize={12} fontFamily="monospace" fontWeight="bold" fill="#1d4ed8">
          Max Offer = ARV × 0.70 − Repair Costs
        </text>

        <text x={20} y={72} fontSize={11} fill="#475569">= ${fmtDollar(arv)} × 0.70 − ${fmtDollar(repairCosts)}</text>
        <text x={20} y={90} fontSize={11} fontFamily="monospace" fontWeight="bold" fill="#059669">
          = ${fmtDollar(seventyRule)}
        </text>

        <text x={W - 20} y={110} textAnchor="end" fontSize={9} fill="#94a3b8">
          If MAO &lt; 70% Rule → Conservative deal
        </text>
      </svg>
    </div>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

export default function ArvFlippingPanel({ values, results }: Props) {
  const arv = getResultValue(results, 'arv');
  const mao = getResultValue(results, 'mao');
  const repairVal = parseFloat(values.repairCosts) || 0;
  const holdingVal = parseFloat(values.holdingCosts) || 0;
  const seventyRule = getResultValue(results, 'seventyPercentRule');
  const roi = parseFloat(getResultStr(results, 'roiPercent').replace('%', ''));
  const profit = getResultValue(results, 'estimatedProfit');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-500" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Flip Analysis &amp; 70% Rule
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* 70% Rule Formula SVG */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">The 70% Rule</p>
          <SeventyRuleFormula arv={arv} repairCosts={repairVal} seventyRule={seventyRule} />
        </div>

        {/* Profit / ROI gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ProfitGauge roi={roi} />
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Estimated Profit</p>
            <p className={`text-3xl font-black ${profit > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ${fmtDollar(profit)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {roi >= 20 ? 'Strong deal — above 20% ROI target.' : roi >= 10 ? 'Moderate return — consider if volume justifies it.' : 'Thin margins — proceed with caution.'}
            </p>
          </div>
        </div>

        {/* Budget breakdown bar */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            Budget Breakdown (% of ARV)
          </p>
          <BudgetBreakdownBar
            mao={mao}
            repairCosts={repairVal}
            holdingCosts={holdingVal}
            profit={profit}
            arv={arv}
          />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">MAO</p>
            <p className="text-sm font-black text-blue-600">{getResultStr(results, 'mao')}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Costs</p>
            <p className="text-sm font-black text-red-600">{getResultStr(results, 'totalCosts')}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">70% Rule</p>
            <p className="text-sm font-black text-amber-600">{getResultStr(results, 'seventyPercentRule')}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">ROI</p>
            <p className="text-sm font-black text-emerald-600">{getResultStr(results, 'roiPercent')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
