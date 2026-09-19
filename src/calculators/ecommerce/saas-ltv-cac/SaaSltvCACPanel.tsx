import type { CalculatorResult } from '../../../types/calculator';
import { getResultValue as getValue } from '../../../utils/calcResults';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function GaugeChart({ ratio }: { ratio: number }) {
  const width = 200;
  const height = 120;
  const cx = width / 2;
  const cy = 100;
  const r = 80;
  const strokeW = 18;

  const clamped = Math.min(6, Math.max(0, ratio));
  const pct = clamped / 6; // 6:1 as max

  const startAngle = -Math.PI * 0.75;
  const endAngle = Math.PI * 0.75;
  const totalArc = endAngle - startAngle;

  const needleAngle = startAngle + pct * totalArc;
  const needleLen = r - strokeW - 4;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy + needleLen * Math.sin(needleAngle);

  const arcPath = (start: number, end: number) => {
    const sAngle = startAngle + start * totalArc;
    const eAngle = startAngle + end * totalArc;
    const large = eAngle - sAngle > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(sAngle);
    const y1 = cy + r * Math.sin(sAngle);
    const x2 = cx + r * Math.cos(eAngle);
    const y2 = cy + r * Math.sin(eAngle);
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };

  const redArc = arcPath(0, 1 / 6); // 0:1 to 1:1
  const yellowArc = arcPath(1 / 6, 3 / 6); // 1:1 to 3:1
  const greenArc = arcPath(3 / 6, 1); // 3:1 to 6:1

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: '140px' }} role="img" aria-label={`LTV to CAC ratio gauge showing ${ratio.toFixed(2)} to 1 with poor, ok, and great zones`}>
      <path d={redArc} fill="none" stroke="#ef4444" strokeWidth={strokeW} strokeLinecap="round" />
      <path d={yellowArc} fill="none" stroke="#f59e0b" strokeWidth={strokeW} strokeLinecap="round" />
      <path d={greenArc} fill="none" stroke="#10b981" strokeWidth={strokeW} strokeLinecap="round" />

      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke="#1e293b"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={4} fill="#1e293b" />

      <text x={cx} y={cy + 28} textAnchor="middle" fontSize={20} fontWeight="bold" fill="#1e293b">
        {ratio.toFixed(2)}:1
      </text>

      <text x={cx - 65} y={height - 4} textAnchor="middle" fontSize={7} fill="#ef4444">
        Poor
      </text>
      <text x={cx} y={height - 4} textAnchor="middle" fontSize={7} fill="#f59e0b">
        OK
      </text>
      <text x={cx + 65} y={height - 4} textAnchor="middle" fontSize={7} fill="#10b981">
        Great
      </text>
    </svg>
  );
}

function ResultCard({ label, value, color }: { label: string; value: string; color?: string }) {
  const textColor =
    color === 'positive'
      ? 'text-emerald-600'
      : color === 'negative'
      ? 'text-red-600'
      : 'text-slate-600';
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
        {label}
      </div>
      <div className={`text-base font-bold ${textColor}`}>{value}</div>
    </div>
  );
}

export default function SaaSltvCACPanel({ results }: Props) {
  if (!results.length) return null;

  const ltvStr = getValue(results, 'ltv');
  const cacStr = getValue(results, 'cac');
  const ratioStr = getValue(results, 'ltvCacRatio');
  const paybackStr = getValue(results, 'paybackMonths');
  const lifetimeStr = getValue(results, 'avgLifetimeMonths');
  const magicStr = getValue(results, 'magicNumber');
  const arpuStr = getValue(results, 'arpu');
  const churnStr = getValue(results, 'churnRate');

  const ratio = parseFloat(ratioStr) || 0;
  const paybackMonths = parseFloat(paybackStr) || 0;
  const magicNumber = parseFloat(magicStr) || 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-100/50">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
          SaaS Unit Economics
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Gauge + Golden Standard Badge */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1">
            <GaugeChart ratio={ratio} />
          </div>
          <div className="flex-shrink-0">
            <div
              className={`rounded-lg px-3 py-2 text-center border-2 ${
                ratio >= 3
                  ? 'bg-emerald-50 border-emerald-400'
                  : ratio >= 1
                  ? 'bg-amber-50 border-amber-400'
                  : 'bg-red-50 border-red-400'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">
                SaaS Standard
              </div>
              <div className="text-lg font-black text-slate-800">3:1</div>
              <div className="text-[10px] text-slate-500">Golden Ratio</div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <ResultCard label="LTV" value={ltvStr} color="positive" />
          <ResultCard label="CAC" value={cacStr} color="negative" />
          <ResultCard label="Payback" value={paybackStr} />
          <ResultCard label="Lifetime" value={lifetimeStr} />
        </div>

        {/* Revenue / Magic Number Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <ResultCard label="ARPU (Monthly)" value={arpuStr} />
          <ResultCard label="Churn Rate" value={churnStr} />
          <ResultCard label="Magic Number" value={magicStr} />
          <ResultCard label="Avg Lifetime" value={lifetimeStr} />
        </div>

        {/* Payback Timeline */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
            CAC Payback Timeline
          </p>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (paybackMonths / 24) * 100)}%`,
                background:
                  paybackMonths <= 12
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : paybackMonths <= 24
                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                    : 'linear-gradient(90deg, #ef4444, #f87171)',
              }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-slate-600"
              style={{ left: '50%' }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
            <span>0 mo</span>
            <span>12 mo (target)</span>
            <span>24 mo</span>
          </div>
        </div>

        {/* Magic Number Context */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5">
          <p className="text-xs text-slate-600">
            <strong>SaaS Magic Number: {magicStr}</strong> —
            {magicNumber >= 1
              ? ' World-class efficiency: every dollar spent on marketing generates $1+ in new revenue.'
              : magicNumber >= 0.5
              ? ' Good efficiency: you recover $0.50-$1.00 per marketing dollar. Room for optimization.'
              : ' Needs improvement: each marketing dollar generates less than $0.50 in revenue. Review channel mix.'}
          </p>
        </div>
      </div>
    </div>
  );
}
