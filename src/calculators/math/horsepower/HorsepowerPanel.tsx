import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function HPGauge({ hp, maxHp = 1000 }: { hp: number; maxHp?: number }) {
  const pct = Math.min(hp / maxHp, 1);
  const angle = 180 + pct * 180; // 180 to 360 degrees
  const rad = (angle * Math.PI) / 180;
  const cx = 180;
  const cy = 180;
  const r = 144;
  const x = cx + r * Math.cos(rad);
  const y = cy + r * Math.sin(rad);

  // Arc paths
  const sweepFlag = 1;
  const largeArc = pct > 0.5 ? 1 : 0;
  const arcPath = pct > 0
    ? `M ${cx + r * Math.cos(Math.PI)} ${cy + r * Math.sin(Math.PI)} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${x} ${y}`
    : '';

  const color = pct < 0.4 ? '#22c55e' : pct < 0.7 ? '#eab308' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width="100%" viewBox="0 0 360 240" className="max-w-[400px]" role="img" aria-label={'Horsepower gauge showing ' + hp.toFixed(1) + ' HP'}>
        {/* Background arc */}
        <path
          d={`M ${cx + r * Math.cos(Math.PI)} ${cy + r * Math.sin(Math.PI)} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(2 * Math.PI)} ${cy + r * Math.sin(2 * Math.PI)}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="18"
          strokeLinecap="round"
        />
        {/* Value arc */}
        {pct > 0 && (
          <path d={arcPath} fill="none" stroke={color} strokeWidth="18" strokeLinecap="round" />
        )}
        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const a = Math.PI + t * Math.PI;
          const innerR = r - 22;
          return (
            <line
              key={t}
              x1={cx + innerR * Math.cos(a)}
              y1={cy + innerR * Math.sin(a)}
              x2={cx + r * Math.cos(a)}
              y2={cy + r * Math.sin(a)}
              stroke="#94a3b8"
              strokeWidth="4"
            />
          );
        })}
        {/* Value text */}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#1e293b" fontSize="50" fontWeight="bold" fontFamily="monospace">
          {hp.toFixed(1)}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fill="#64748b" fontSize="22" fontWeight="600">
          HP
        </text>
      </svg>
    </div>
  );
}

function Bar({ label, value, maxVal, color }: { label: string; value: number; maxVal: number; color: string }) {
  const pct = maxVal > 0 ? (value / maxVal) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="font-mono text-slate-700 font-bold">{value.toFixed(1)} HP</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

const TIER_COLORS: Record<string, string> = {
  Supercar: 'bg-purple-100 text-purple-800 border-purple-300',
  'Sports Car': 'bg-blue-100 text-blue-800 border-blue-300',
  Performance: 'bg-green-100 text-green-800 border-green-300',
  Average: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Underpowered: 'bg-orange-100 text-orange-800 border-orange-300',
  Economy: 'bg-slate-100 text-slate-600 border-slate-300',
};

export default function HorsepowerPanel({ results }: Props) {
  const hpRow = results.find((r) => r.id === 'estimatedHP');
  const crankRow = results.find((r) => r.id === 'crankHP');
  const wheelRow = results.find((r) => r.id === 'wheelHP');
  const ptWRow = results.find((r) => r.id === 'powerToWeight');
  const methodRow = results.find((r) => r.id === 'method');
  const hpETRow = results.find((r) => r.id === 'hpFromET');
  const hpSpeedRow = results.find((r) => r.id === 'hpFromSpeed');
  const catRow = results.find((r) => r.id === 'powerCategory');

  if (!hpRow || !crankRow || !wheelRow) return null;

  const hpNum = parseFloat(hpRow.value) || 0;
  const crankNum = parseFloat(crankRow.value) || 0;
  const wheelNum = parseFloat(wheelRow.value) || 0;
  const ptWNum = ptWRow ? parseFloat(ptWRow.value) || 0 : 0;
  const hpETNum = hpETRow ? parseFloat(hpETRow.value) || 0 : 0;
  const hpSpeedNum = hpSpeedRow ? parseFloat(hpSpeedRow.value) || 0 : 0;
  const cat = catRow?.value || '';
  const tierColorClass = TIER_COLORS[cat] || TIER_COLORS.Average;

  const drivetrainLoss = crankNum - wheelNum;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Horsepower Gauge
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* HP Gauge */}
        <HPGauge hp={hpNum} />

        {/* Performance Tier Badge */}
        {cat && (
          <div className="flex justify-center">
            <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${tierColorClass}`}>
              {cat}
            </span>
          </div>
        )}

        {/* Power-to-Weight Card */}
        {ptWNum > 0 && (
          <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 px-5 py-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Power-to-Weight</p>
            <p className="text-2xl font-bold font-mono text-slate-800 mt-1">{ptWNum.toFixed(1)} <span className="text-sm font-normal text-slate-500">lbs/hp</span></p>
          </div>
        )}

        {/* Crank & Wheel HP Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Crank (BHP)</p>
            <p className="text-lg font-bold font-mono text-slate-800 mt-1">{crankNum.toFixed(1)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Wheel (WHP)</p>
            <p className="text-lg font-bold font-mono text-slate-800 mt-1">{wheelNum.toFixed(1)}</p>
          </div>
        </div>

        {/* Drivetrain Loss Breakdown */}
        {drivetrainLoss > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Drivetrain Loss</p>
            <div className="flex items-center gap-3">
              <div className="h-3 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(drivetrainLoss / crankNum) * 100}%` }} />
              </div>
              <span className="text-sm font-mono font-bold text-amber-600 whitespace-nowrap">
                {drivetrainLoss.toFixed(1)} HP lost
              </span>
            </div>
          </div>
        )}

        {/* ET vs Speed Comparison Bars */}
        {hpETNum > 0 && hpSpeedNum > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">ET vs Speed Comparison</p>
            <Bar label="HP from ET" value={hpETNum} maxVal={Math.max(hpETNum, hpSpeedNum, 1)} color="#3b82f6" />
            <Bar label="HP from Speed" value={hpSpeedNum} maxVal={Math.max(hpETNum, hpSpeedNum, 1)} color="#8b5cf6" />
            <div className="text-xs text-center text-slate-500 mt-1 font-medium">
              Average: {((hpETNum + hpSpeedNum) / 2).toFixed(1)} HP
            </div>
          </div>
        )}

        {/* Method indicator */}
        {methodRow && (
          <div className="text-center">
            <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {methodRow.value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
