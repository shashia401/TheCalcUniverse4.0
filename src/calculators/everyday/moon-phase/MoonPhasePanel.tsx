import { CalculatorResult } from '../../../types/calculator';
import { moonInfo } from './moonMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// Deterministic star field (Math.random() in render changed on every re-render and differed between server and client).
const STARS = Array.from({ length: 30 }, (_, i) => {
  const a = Math.sin(i * 12.9898 + 1) * 43758.5453;
  const b = Math.sin(i * 78.233 + 2) * 12543.1357;
  const c = Math.sin(i * 39.425 + 3) * 9371.7311;
  const frac = (x: number) => x - Math.floor(x);
  return { x: frac(a), y: frac(b), r: frac(c) * 1.2 + 0.3, o: frac(a * 3.1) * 0.5 + 0.3 };
});

/** Lit part of the disc as one SVG path: the lit limb (half circle) closed by the terminator (half ellipse, rx = r*|cos e|). */
function litPath(elong: number, cx: number, cy: number, r: number): string {
  const e = (elong * Math.PI) / 180;
  const rx = Math.abs(Math.cos(e)) * r;
  const waxing = elong < 180;
  const crescent = Math.cos(e) > 0;
  const top = `${cx} ${cy - r}`;
  const bottom = `${cx} ${cy + r}`;
  // limb: right half (clockwise) when waxing, left half (counter-clockwise) when waning
  const limb = waxing ? `A ${r} ${r} 0 0 1 ${bottom}` : `A ${r} ${r} 0 0 0 ${bottom}`;
  // terminator bulges toward the lit side for a crescent, away from it for a gibbous moon
  const bulgesRight = waxing === crescent;
  const term = `A ${rx} ${r} 0 0 ${bulgesRight ? 0 : 1} ${top}`;
  return `M ${top} ${limb} ${term} Z`;
}

export default function MoonPhasePanel({ values, results }: Props) {
  const m = moonInfo(values);
  const nextFullRow = results.find((r) => r.id === 'nextFullMoon');
  const zodiacRow = results.find((r) => r.id === 'zodiacSign');
  if (!m) return null;

  const moonSize = 200;
  const c = moonSize / 2;
  const r = moonSize / 2 - 8;
  const fullOrNew = m.elongation > 179.5 && m.elongation < 180.5;
  const isNew = m.elongation < 0.5 || m.elongation > 359.5;
  const phaseName = m.phase.name;
  const illum = m.illumination.toFixed(1);
  const pct = (m.fraction * 100).toFixed(1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Moon &amp; Phase Details</span>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex justify-center">
          <svg width={moonSize} height={moonSize} viewBox={`0 0 ${moonSize} ${moonSize}`} role="img" aria-label={`Moon phase: ${phaseName}, ${illum}% illuminated, ${m.waxing ? 'waxing' : 'waning'}`}>
            <rect width={moonSize} height={moonSize} rx="12" fill="#0b1220" />
            {STARS.map((s, i) => (
              <circle key={i} cx={s.x * moonSize} cy={s.y * moonSize} r={s.r} fill="#ffffff" opacity={s.o} />
            ))}
            <circle cx={c} cy={c} r={r} fill="#1e293b" stroke="#475569" strokeWidth="1" />
            {fullOrNew ? (
              <circle cx={c} cy={c} r={r} fill="#fbbf24" opacity={0.95} />
            ) : (
              !isNew && <path d={litPath(m.elongation, c, c, r)} fill="#fbbf24" opacity={0.95} />
            )}
          </svg>
        </div>

        <div className="text-center">
          <p className="text-3xl" aria-hidden="true">{m.phase.emoji}</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{phaseName}</p>
          <p className="text-sm text-slate-600">{illum}% illuminated, {m.ageDays.toFixed(1)} days into the cycle</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {nextFullRow && (
            <div className="col-span-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2.5">
              <p className="text-[10px] font-bold text-indigo-700 uppercase">Next Full Moon</p>
              <p className="text-sm font-mono font-bold text-indigo-800">{nextFullRow.value}</p>
              <p className="text-xs text-indigo-700 mt-0.5">{m.daysUntilFull} days away</p>
            </div>
          )}
          {zodiacRow && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-[10px] font-bold text-amber-700 uppercase">Zodiac Sign</p>
              <p className="text-sm font-bold text-amber-800">{zodiacRow.value}</p>
            </div>
          )}
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Cycle</p>
            <p className="text-sm font-mono font-bold text-slate-700">{m.waxing ? 'Waxing' : 'Waning'}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">Lunar Cycle Progress</p>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden relative" role="img" aria-label={`${pct} percent through the lunar cycle`}>
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>New</span>
            <span>First Quarter</span>
            <span>Full</span>
            <span>Last Quarter</span>
            <span>New</span>
          </div>
        </div>
      </div>
    </div>
  );
}
