import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// Helper: SVG arc for a circle
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function getMoonSvgMoonPaths(phase: number, size: number) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  // Determine the terminator x position
  const termX = Math.cos(2 * Math.PI * phase) * r;
  const isWaxing = phase < 0.5;

  // For full moon (phase ~0.5):
  if (phase >= 0.49 && phase <= 0.51) {
    return {
      darkFill: '#1e293b',
      lightFill: '#fbbf24',
      darkPath: '',
      lightPath: describeArc(cx, cy, r, 0, 360),
      isFull: true,
    };
  }

  // For new moon (phase near 0 or 1):
  if (phase < 0.03 || phase > 0.97) {
    return {
      darkFill: '#1e293b',
      lightFill: '#fbbf24',
      darkPath: describeArc(cx, cy, r, 0, 360),
      lightPath: '',
      isFull: false,
    };
  }

  // Intersection of terminator vertical line with circle
  const lineX = cx + termX;
  const dx = lineX - cx;
  const yOffset = Math.sqrt(Math.max(0, r * r - dx * dx));
  const topY = cy - yOffset;
  const botY = cy + yOffset;

  // The illuminated crescent/portion
  // For waxing: right side is lit
  // For waning: left side is lit

  let lightPath: string;
  let darkPath: string;

  if (isWaxing) {
    // Lit portion on the right side (from terminator top, around right edge to terminator bottom)
    // The outer arc along the right side of the circle
    lightPath = [
      `M ${lineX} ${topY}`,
      `A ${r} ${r} 0 0 1 ${lineX} ${botY}`,
      'Z',
    ].join(' ');

    // Dark portion on the left side
    darkPath = [
      `M ${lineX} ${topY}`,
      `A ${r} ${r} 0 0 0 ${lineX} ${botY}`,
      'Z',
    ].join(' ');
  } else {
    // Lit portion on the left side
    lightPath = [
      `M ${lineX} ${topY}`,
      `A ${r} ${r} 0 0 0 ${lineX} ${botY}`,
      'Z',
    ].join(' ');

    // Dark portion on the right side
    darkPath = [
      `M ${lineX} ${topY}`,
      `A ${r} ${r} 0 0 1 ${lineX} ${botY}`,
      'Z',
    ].join(' ');
  }

  return {
    darkFill: '#1e293b',
    lightFill: '#fbbf24',
    darkPath,
    lightPath,
    isFull: false,
  };
}

export default function MoonPhasePanel({ values, results }: Props) {
  const phaseNameRow = results.find(r => r.id === 'moonPhase');
  const illumRow = results.find(r => r.id === 'illumination');
  const emojiRow = results.find(r => r.id === 'phaseEmoji');
  const nextFullRow = results.find(r => r.id === 'nextFullMoon');
  const daysUntilRow = results.find(r => r.id === 'daysUntilNextFull');
  const zodiacRow = results.find(r => r.id === 'zodiacSign');

  const phaseName = phaseNameRow?.value || '';
  const illumination = illumRow ? parseFloat(illumRow.value) : 0;
  const emoji = emojiRow?.value || '';
  const daysUntil = daysUntilRow ? parseInt(daysUntilRow.value) : 0;

  // Compute moon phase fraction for SVG rendering
  const dateStr = values.dateOfBirth;
  let phaseFraction = 0;
  if (dateStr) {
    const parts = dateStr.split('-');
    const date = parts.length === 3 ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])) : new Date(dateStr);
    const knownNewMoon = new Date(2000, 0, 6);
    if (!isNaN(date.getTime())) {
      const diffMs = date.getTime() - knownNewMoon.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays >= 0) {
        phaseFraction = ((diffDays % 29.53058867) / 29.53058867 + 1) % 1;
      }
    }
  }

  const moonSize = 200;
  const { darkFill, lightFill, darkPath, lightPath, isFull } = getMoonSvgMoonPaths(phaseFraction, moonSize);

  // Stars background
  const stars = Array.from({ length: 30 }, () => ({
    cx: Math.random() * moonSize,
    cy: Math.random() * moonSize,
    r: Math.random() * 1.2 + 0.3,
    opacity: Math.random() * 0.5 + 0.3,
  }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Birth Moon &amp; Phase Details</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Moon SVG Rendering */}
        <div className="flex justify-center">
          <div className="relative">
            <svg width={moonSize} height={moonSize} viewBox={`0 0 ${moonSize} ${moonSize}`} role="img" aria-label={`Moon phase visualization showing ${phaseName}`}>
              {/* Background glow */}
              <defs>
                <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx={moonSize / 2} cy={moonSize / 2} r={moonSize * 0.55} fill="url(#moonGlow)" />

              {/* Stars */}
              {stars.map((s, i) => (
                <circle key={`item-${i}`} cx={s.cx} cy={s.cy} r={s.r} className="fill-white" opacity={s.opacity} />
              ))}

              {/* Moon base (dark) */}
              <circle cx={moonSize / 2} cy={moonSize / 2} r={moonSize / 2 - 8} fill="#0f172a" stroke="#334155" strokeWidth="1" />

              {/* Dark portion */}
              {darkPath && (
                <path d={darkPath} fill={darkFill} />
              )}

              {/* Light portion */}
              {lightPath && (
                <path d={lightPath} fill={lightFill} opacity={0.9} />
              )}

              {/* Inner glow on lit side */}
              {lightPath && !isFull && (
                <path d={lightPath} fill="#fde68a" opacity={0.3} />
              )}

              {/* Full moon */}
              {isFull && (
                <>
                  <circle cx={moonSize / 2} cy={moonSize / 2} r={moonSize / 2 - 8} fill="#fbbf24" opacity={0.9} />
                  {/* Moon surface details */}
                  <circle cx={moonSize * 0.4} cy={moonSize * 0.35} r="4" fill="#d97706" opacity={0.3} />
                  <circle cx={moonSize * 0.55} cy={moonSize * 0.45} r="6" fill="#d97706" opacity={0.2} />
                  <circle cx={moonSize * 0.45} cy={moonSize * 0.6} r="3" fill="#d97706" opacity={0.25} />
                  <circle cx={moonSize * 0.38} cy={moonSize * 0.5} r="5" fill="#d97706" opacity={0.15} />
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Phase Name & Details */}
        <div className="text-center">
          <p className="text-3xl">{emoji}</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{phaseName}</p>
          <p className="text-sm text-slate-500">{illumination.toFixed(1)}% Illuminated</p>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-2 gap-3">
          {nextFullRow && (
            <div className="col-span-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2.5">
              <p className="text-[10px] font-bold text-indigo-400 uppercase">Next Full Moon</p>
              <p className="text-sm font-mono font-bold text-indigo-700">{nextFullRow.value}</p>
              {daysUntilRow && (
                <p className="text-xs text-indigo-500 mt-0.5">{daysUntil} days away</p>
              )}
            </div>
          )}

          {zodiacRow && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-[10px] font-bold text-amber-400 uppercase">Zodiac Sign</p>
              <p className="text-sm font-bold text-amber-700">{zodiacRow.value}</p>
            </div>
          )}

          {illumRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Cycle Progress</p>
              <p className="text-sm font-mono font-bold text-slate-700">
                {phaseFraction < 0.5 ? 'Waxing' : 'Waning'}
              </p>
            </div>
          )}
        </div>

        {/* Phase Progress Bar */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Lunar Cycle Progress</p>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${(phaseFraction * 100).toFixed(1)}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-4 bg-amber-600 rounded-full shadow-sm"
              style={{
                left: `calc(${(phaseFraction * 100).toFixed(1)}% - 4px)`,
                transition: 'left 0.3s',
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>New</span>
            <span>First Quarter</span>
            <span>Full</span>
            <span>Last Quarter</span>
            <span>New</span>
          </div>
        </div>

        {/* Share Area */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Share This Result</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-600 truncate">
              {values.dateOfBirth ? `Born under a ${phaseName} (${illumination.toFixed(1)}% illuminated)` : ''}
            </div>
            <button type="button"
              onClick={() => {
                const text = values.dateOfBirth
                  ? `Born on ${new Date(values.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} under a ${phaseName} (${illumination.toFixed(1)}% illuminated). Next full moon: ${nextFullRow?.value}.`
                  : '';
                navigator.clipboard.writeText(text).catch(() => {});
              }}
              className="px-3 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
