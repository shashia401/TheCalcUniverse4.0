import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function RPMGauge({ rpm, maxRpm = 8000 }: { rpm: number; maxRpm?: number }) {
  const pct = Math.min(rpm / maxRpm, 1);
  const angle = 180 + pct * 180;
  const rad = (angle * Math.PI) / 180;
  const cx = 100;
  const cy = 100;
  const r = 80;
  const x = cx + r * Math.cos(rad);
  const y = cy + r * Math.sin(rad);

  const sweepFlag = 1;
  const largeArc = pct > 0.5 ? 1 : 0;
  const arcPath = pct > 0
    ? `M ${cx + r * Math.cos(Math.PI)} ${cy + r * Math.sin(Math.PI)} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${x} ${y}`
    : '';

  const color = pct < 0.6 ? '#3b82f6' : pct < 0.8 ? '#eab308' : '#ef4444';

  return (
    <svg width="100%" viewBox="0 0 200 130" className="max-w-[220px]" role="img" aria-label={'RPM gauge showing ' + rpm.toLocaleString() + ' RPM'}>
      {/* Background arc */}
      <path
        d={`M ${cx + r * Math.cos(Math.PI)} ${cy + r * Math.sin(Math.PI)} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(2 * Math.PI)} ${cy + r * Math.sin(2 * Math.PI)}`}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Value arc */}
      {pct > 0 && (
        <path d={arcPath} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
      )}
      {/* Tick marks */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const a = Math.PI + t * Math.PI;
        const innerR = r - 12;
        return (
          <line
            key={t}
            x1={cx + innerR * Math.cos(a)}
            y1={cy + innerR * Math.sin(a)}
            x2={cx + r * Math.cos(a)}
            y2={cy + r * Math.sin(a)}
            stroke="#94a3b8"
            strokeWidth="2"
          />
        );
      })}
      {/* RPM text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#1e293b" fontSize="22" fontWeight="bold" fontFamily="monospace">
        {rpm.toLocaleString()}
      </text>
      <text x={cx} y={cy + 18} textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="600">
        RPM
      </text>
    </svg>
  );
}

function DynoCurveConcept({ hp, torque, crossoverRpm = 5252 }: { hp: number; torque: number; crossoverRpm?: number }) {
  const w = 360;
  const h = 160;
  const padL = 40;
  const padR = 10;
  const padT = 10;
  const padB = 25;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const maxRpm = Math.max(8000, crossoverRpm * 1.6);

  // Simulate torque curve: peaks below crossover, then drops off
  const torqueCurve: { x: number; y: number }[] = [];
  const hpCurve: { x: number; y: number }[] = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const rpm = (i / steps) * maxRpm;
    // Approximate torque: peaks at ~60% of maxRPM, falls off
    const tPeakRpm = maxRpm * 0.4;
    const tFactor = rpm <= tPeakRpm
      ? 0.5 + 0.5 * (rpm / tPeakRpm)
      : 1 - 0.4 * ((rpm - tPeakRpm) / (maxRpm - tPeakRpm));
    const tq = Math.max(0, torque * tFactor);
    // HP = Torque * RPM / 5252
    const hpVal = (tq * rpm) / crossoverRpm;

    const xPos = padL + (rpm / maxRpm) * plotW;
    const maxVal = Math.max(hp, torque) * 1.15;
    torqueCurve.push({ x: xPos, y: padT + (1 - tq / maxVal) * plotH });
    hpCurve.push({ x: xPos, y: padT + (1 - hpVal / maxVal) * plotH });
  }

  const pathD = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const crossX = padL + (crossoverRpm / maxRpm) * plotW;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="max-w-full h-auto" style={{ maxWidth: 400 }} role="img" aria-label={'Dyno curve chart showing horsepower and torque curves crossing at ' + crossoverRpm + ' RPM'}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line key={`g${t}`} x1={padL} y1={padT + (1 - t) * plotH} x2={w - padR} y2={padT + (1 - t) * plotH} stroke="#f1f5f9" strokeWidth="1" />
      ))}
      {/* Torque curve */}
      <path d={pathD(torqueCurve)} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* HP curve */}
      <path d={pathD(hpCurve)} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Crossover at 5252 */}
      <line x1={crossX} y1={padT} x2={crossX} y2={h - padB} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 3" />
      <text x={crossX} y={h - 5} textAnchor="middle" fill="#64748b" fontSize="9" className="text-[9px]">
        {crossoverRpm} RPM
      </text>
      {/* Labels */}
      <text x={w - padR - 4} y={padT + 10} textAnchor="end" fill="#ef4444" fontSize="9" fontWeight="bold" className="text-[9px]">HP</text>
      <text x={w - padR - 4} y={padT + 22} textAnchor="end" fill="#3b82f6" fontSize="9" fontWeight="bold" className="text-[9px]">Torque</text>
    </svg>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  Hypercar: 'bg-purple-100 text-purple-800 border-purple-300',
  'Muscle Car': 'bg-red-100 text-red-800 border-red-300',
  Performance: 'bg-blue-100 text-blue-800 border-blue-300',
  'Mid-Range': 'bg-green-100 text-green-800 border-green-300',
  Economy: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Low Output': 'bg-slate-100 text-slate-600 border-slate-300',
};

export default function EngineHPPanel({ results }: Props) {
  const hpRow = results.find((r) => r.id === 'horsepower');
  const kwRow = results.find((r) => r.id === 'powerKW');
  const torqueRow = results.find((r) => r.id === 'torqueValue');
  const rpmRow = results.find((r) => r.id === 'rpmValue');
  const formulaRow = results.find((r) => r.id === 'formulaBreakdown');
  const explainRow = results.find((r) => r.id === 'magicConstant5252');
  const catRow = results.find((r) => r.id === 'powerCategory');

  if (!hpRow || !torqueRow || !rpmRow) return null;

  const hpNum = parseFloat(hpRow.value) || 0;
  const torqueStr = torqueRow.value;
  const rpmStr = rpmRow.value;
  const torqueNum = parseFloat(torqueStr) || 0;
  const rpmNum = parseFloat(rpmStr) || 0;
  const kwNum = kwRow ? parseFloat(kwRow.value) || 0 : 0;
  const cat = catRow?.value || '';
  const tierClass = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Mid-Range'];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M5 3v2m4 0h6M5 7h14M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7M9 11h6m-6 4h3" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Engine Power Analysis
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* RPM Gauge */}
        <RPMGauge rpm={rpmNum} />

        {/* HP Display */}
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 px-5 py-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Horsepower Output</p>
          <p className="text-3xl font-bold font-mono text-blue-800 mt-1">{hpRow.value}</p>
        </div>

        {/* Power Category Badge */}
        {cat && (
          <div className="flex justify-center">
            <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${tierClass}`}>
              {cat}
            </span>
          </div>
        )}

        {/* HP/kW Dual Display */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Horsepower</p>
            <p className="text-lg font-bold font-mono text-slate-800 mt-1">{hpNum.toFixed(1)} HP</p>
          </div>
          {kwNum > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Kilowatts</p>
              <p className="text-lg font-bold font-mono text-slate-800 mt-1">{kwNum.toFixed(2)} kW</p>
            </div>
          )}
        </div>

        {/* Input Values */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Torque</p>
            <p className="text-lg font-bold font-mono text-slate-800 mt-1">{torqueStr}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Engine Speed</p>
            <p className="text-lg font-bold font-mono text-slate-800 mt-1">{rpmStr}</p>
          </div>
        </div>

        {/* Formula Card */}
        {formulaRow && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Step-by-Step Formula</p>
            <p className="text-sm font-mono text-slate-700 bg-white rounded-lg border border-slate-200 px-4 py-3">
              {formulaRow.value}
            </p>
          </div>
        )}

        {/* Dyno Graph Concept */}
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Torque & HP Curves</p>
          <div className="flex justify-center">
            <DynoCurveConcept hp={hpNum} torque={torqueNum} />
          </div>
          <p className="text-[10px] text-center text-slate-500 mt-2">
            Torque (blue) and HP (red) curves cross at exactly 5,252 RPM
          </p>
        </div>

        {/* Technical Explanation */}
        {explainRow && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex items-start gap-2">
              <svg aria-hidden="true" className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
              </svg>
              <p className="text-xs text-amber-800 leading-relaxed">{explainRow.value}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
