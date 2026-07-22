import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function MagicTriangle({ highlight }: { highlight: 'S' | 'D' | 'T' }) {
  const highlightColor = '#2563eb';
  const defaultColor = '#475569';

  const topColor = highlight === 'S' ? highlightColor : defaultColor;
  const blColor = highlight === 'D' ? highlightColor : defaultColor;
  const brColor = highlight === 'T' ? highlightColor : defaultColor;

  return (
    <svg viewBox="0 0 140 120" className="w-28 h-24 sm:w-32 sm:h-28 mx-auto" role="img" aria-label="Speed formula triangle">
      <polygon points="70,5 135,110 5,110" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinejoin="round" />
      <line x1="5" y1="110" x2="135" y2="110" stroke="#cbd5e1" strokeWidth="2" />
      <text x="70" y="52" textAnchor="middle" dominantBaseline="central" fontSize="28" fontWeight="bold" fill={topColor} className="select-none">S</text>
      <line x1="70" y1="55" x2="70" y2="110" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
      <text x="38" y="86" textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="bold" fill={blColor} className="select-none">D</text>
      <text x="102" y="86" textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="bold" fill={brColor} className="select-none">T</text>
      <circle
        cx={highlight === 'S' ? 70 : highlight === 'D' ? 38 : 102}
        cy={highlight === 'S' ? 52 : 86}
        r="18"
        fill="none"
        stroke={highlightColor}
        strokeWidth="2"
        strokeDasharray="4,3"
        opacity="0.6"
      />
    </svg>
  );
}

function SpeedGauge({ value, maxSpeed = 160 }: { value: number; maxSpeed?: number }) {
  const pct = Math.min((value / maxSpeed) * 100, 100);
  const angle = -90 + (pct / 100) * 180;

  const polarToCart = (cx: number, cy: number, r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const cx = 60;
  const cy = 52;
  const r = 40;

  // Arc parameters
  const startAngle = -90;
  const endAngle = 90;
  const start = polarToCart(cx, cy, r, startAngle);
  const end = polarToCart(cx, cy, r, endAngle);
  const mid = polarToCart(cx, cy, r, angle);

  // Gauge arc (filled portion)
  const needleStart = polarToCart(cx, cy, -8, angle);
  const needleEnd = polarToCart(cx, cy, r + 4, angle);

  return (
    <svg viewBox="0 0 120 70" className="w-full h-16 sm:h-20" role="img" aria-label="Speed gauge">
      {/* Background arc */}
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Value arc */}
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${angle > 90 ? 1 : 0} 1 ${mid.x} ${mid.y}`}
        fill="none"
        stroke={value > 100 ? '#ef4444' : value > 60 ? '#f59e0b' : '#10b981'}
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Needle */}
      <line
        x1={needleStart.x}
        y1={needleStart.y}
        x2={needleEnd.x}
        y2={needleEnd.y}
        stroke="#1e293b"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r="4" fill="#1e293b" />
    </svg>
  );
}

function ComparisonCard({ label, detail, icon }: { label: string; detail: string; icon: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-500 uppercase">{label}</p>
        <p className="text-xs font-semibold text-slate-700 truncate">{detail}</p>
      </div>
    </div>
  );
}

export default function SpeedPanel({ values, results }: Props) {
  const result = results.find(r => r.id === 'result');
  const speedKmh = results.find(r => r.id === 'speedKmh');
  const speedMs = results.find(r => r.id === 'speedMs');
  const speedKnots = results.find(r => r.id === 'speedKnots');
  const formula = results.find(r => r.id === 'formula');
  const steps = results.find(r => r.id === 'steps');
  const paceMile = results.find(r => r.id === 'paceMile');
  const paceKm = results.find(r => r.id === 'paceKm');
  const distResult = results.find(r => r.id === 'distance');
  const timeResult = results.find(r => r.id === 'time');

  if (!result || !formula) return null;

  const mode = values.mode || 'calcSpeed';
  const highlight = mode === 'calcSpeed' ? 'S' : mode === 'calcDistance' ? 'D' : 'T';

  // Extract mph value for gauge
  const mphVal = parseFloat(result.value.replace(/[^0-9.-]/g, '')) || 0;

  // Generate comparisons for speed mode
  const comparisons: Array<{ label: string; detail: string; icon: string }> = [];
  if (mode === 'calcSpeed' && mphVal > 0) {
    if (mphVal <= 5) comparisons.push({ label: 'Pace', detail: 'Leisurely walk', icon: '🚶' });
    else if (mphVal <= 8) comparisons.push({ label: 'Pace', detail: 'Jogging / running', icon: '🏃' });
    else if (mphVal <= 15) comparisons.push({ label: 'Pace', detail: 'Casual cycling', icon: '🚲' });
    else if (mphVal <= 30) comparisons.push({ label: 'Speed', detail: 'City driving', icon: '🚗' });
    else if (mphVal <= 70) comparisons.push({ label: 'Speed', detail: 'Highway driving', icon: '🚗' });
    else if (mphVal <= 120) comparisons.push({ label: 'Speed', detail: 'Fast car / motorcycle', icon: '🏍️' });
    else comparisons.push({ label: 'Speed', detail: 'Race car / aircraft', icon: '✈️' });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Speed, Distance &amp; Time
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Magic Triangle */}
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2">
            Formula Triangle
          </p>
          <MagicTriangle highlight={highlight} />
        </div>

        {/* Speed Gauge (only in calcSpeed mode) */}
        {mode === 'calcSpeed' && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-1">
              Speed Gauge
            </p>
            <SpeedGauge value={mphVal} />
            <p className="text-center text-xs font-mono text-slate-500 mt-1">
              {mphVal.toFixed(1)} mph
            </p>
          </div>
        )}

        {/* Large Result */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-1">{result.label}</p>
          <p className="text-3xl font-bold text-blue-700 font-mono">{result.value}</p>
        </div>

        {/* Speed conversions (only in calcSpeed mode) */}
        {mode === 'calcSpeed' && (
          <div className="grid grid-cols-3 gap-2">
            {speedKmh && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{speedKmh.label}</p>
                <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{speedKmh.value}</p>
              </div>
            )}
            {speedMs && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{speedMs.label}</p>
                <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{speedMs.value}</p>
              </div>
            )}
            {speedKnots && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{speedKnots.label}</p>
                <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{speedKnots.value}</p>
              </div>
            )}
          </div>
        )}

        {/* Pace card */}
        {(paceMile || paceKm) && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4">
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2">
              Pace Conversion
            </p>
            <div className="grid grid-cols-2 gap-3">
              {paceMile && (
                <div className="rounded-lg bg-white border border-indigo-200 px-4 py-3 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">min/mile</p>
                  <p className="text-lg font-bold font-mono text-indigo-700">{paceMile.value}</p>
                </div>
              )}
              {paceKm && (
                <div className="rounded-lg bg-white border border-indigo-200 px-4 py-3 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">min/km</p>
                  <p className="text-lg font-bold font-mono text-indigo-700">{paceKm.value}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Distance + Time display (speed mode) */}
        {(distResult || timeResult) && (
          <div className="grid grid-cols-2 gap-2">
            {distResult && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{distResult.label}</p>
                <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{distResult.value}</p>
              </div>
            )}
            {timeResult && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{timeResult.label}</p>
                <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{timeResult.value}</p>
              </div>
            )}
          </div>
        )}

        {/* Formula */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Formula Used</p>
          <p className="text-sm font-mono text-slate-700">{formula.value}</p>
        </div>

        {/* Steps */}
        {steps && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Calculation Steps</p>
            <p className="text-sm font-mono text-blue-700 whitespace-pre-wrap">{steps.value}</p>
          </div>
        )}

        {/* Common comparisons */}
        {comparisons.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Common Comparisons
            </p>
            <div className="grid grid-cols-2 gap-2">
              {comparisons.map((c, i) => (
                <ComparisonCard key={`item-${i}`} {...c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
