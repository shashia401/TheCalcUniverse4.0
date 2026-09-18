import { useRef, useState, useEffect } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// ── D6 pip positions (viewBox 0 0 60 60) ────────────────────────────────

const PIP_PATTERNS: Record<number, [number, number][]> = {
  1: [[30, 30]],
  2: [[20, 20], [40, 40]],
  3: [[20, 20], [30, 30], [40, 40]],
  4: [[18, 18], [42, 18], [18, 42], [42, 42]],
  5: [[18, 18], [42, 18], [30, 30], [18, 42], [42, 42]],
  6: [[18, 12], [18, 30], [18, 48], [42, 12], [42, 30], [42, 48]],
};

// ── Die face colors ─────────────────────────────────────────────────────

const DIE_COLORS: Record<string, { bg: string; border: string; text: string; fill: string }> = {
  '4': { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c', fill: '#fca5a5' },
  '6': { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', fill: '#93c5fd' },
  '8': { bg: '#dcfce7', border: '#22c55e', text: '#166534', fill: '#86efac' },
  '10': { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8', fill: '#c084fc' },
  '12': { bg: '#fed7aa', border: '#f97316', text: '#9a3412', fill: '#fdba74' },
  '20': { bg: '#cffafe', border: '#06b6d4', text: '#155e75', fill: '#67e8f9' },
};

// ── Single die SVG component ────────────────────────────────────────────

function DieFace({ value, sides }: { value: number; sides: number }) {
  const colors = DIE_COLORS[String(sides)] || DIE_COLORS['6'];
  const isD6 = sides === 6;

  return (
    <svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      className="block"
      role="img"
      aria-label={'Dice face showing ' + sides + ' sides with dot pattern'}
    >
      {isD6 ? (
        <>
          {/* Die body */}
          <rect
            x="2"
            y="2"
            width="56"
            height="56"
            rx="8"
            ry="8"
            fill={colors.bg}
            stroke={colors.border}
            strokeWidth="1.5"
          />
          {/* Pips */}
          {(PIP_PATTERNS[value] || []).map(([cx, cy]) => (
            <circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r="5"
              fill={colors.border}
            />
          ))}
        </>
      ) : (
        <>
          {/* Die body */}
          <rect
            x="2"
            y="2"
            width="56"
            height="56"
            rx="10"
            ry="10"
            fill={colors.bg}
            stroke={colors.border}
            strokeWidth="1.5"
          />
          {/* Number */}
          <text
            x="30"
            y="30"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="22"
            fontWeight="bold"
            fill={colors.text}
            fontFamily="system-ui, sans-serif"
          >
            {value}
          </text>
        </>
      )}
    </svg>
  );
}

// ── Main panel component ────────────────────────────────────────────────

export default function DicePanel({ results }: Props) {
  const total = results.find(r => r.id === 'total');
  const rollsResult = results.find(r => r.id === 'rolls');
  const countResult = results.find(r => r.id === 'count');
  const modifierResult = results.find(r => r.id === 'modifier');
  const averageResult = results.find(r => r.id === 'average');
  const rollData = results.find(r => r.id === '_rollData');

  const [rollKey, setRollKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Bump roll key when results change to trigger re-animation
  useEffect(() => {
    setRollKey(k => k + 1);
  }, [rollData?.value]);

  if (!total || !rollsResult || !rollData) return null;

  let rolls: number[];
  try {
    rolls = JSON.parse(rollData.value);
  } catch {
    return null;
  }

  const sides = parseInt(countResult?.value?.match(/D(\d+)/)?.[1] || '6');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Dice Results
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* ── Dice Display ─────────────────────────────────────────────── */}
        {rolls.length > 0 && (
          <div
            ref={containerRef}
            key={rollKey}
            className="flex flex-wrap gap-2 justify-center dice-roll-container"
          >
            {rolls.map((val, i) => (
              <div key={`${val}-${i}`} className="die-face-wrapper transition-transform duration-300 hover:scale-110">
                <DieFace value={val} sides={sides} />
              </div>
            ))}
          </div>
        )}

        {/* ── Total Card ────────────────────────────────────────────────── */}
        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1">
            Total Roll
          </p>
          <p className="text-4xl sm:text-5xl font-black text-indigo-900">
            {total.value}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {countResult?.value}
            {modifierResult && modifierResult.value !== '+0' && (
              <span className="text-indigo-600 font-semibold"> {modifierResult.value}</span>
            )}
          </p>
        </div>

        {/* ── Stats Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Individual Rolls', value: rollsResult.value },
            { label: 'Dice', value: countResult?.value || '-' },
            { label: 'Modifier', value: modifierResult?.value || '+0' },
            { label: 'Average', value: averageResult?.value || '-' },
          ].map(stat => (
            <div key={stat.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{stat.label}</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5 truncate">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ── Roll animation CSS (injected) ──────────────────────────────── */}
        <style>{`
          @keyframes diceRollIn {
            0% { transform: rotate(-15deg) scale(0.8); opacity: 0.5; }
            50% { transform: rotate(5deg) scale(1.05); opacity: 1; }
            100% { transform: rotate(0deg) scale(1); opacity: 1; }
          }
          .dice-roll-container .die-face-wrapper {
            animation: diceRollIn 0.4s ease-out both;
          }
          .dice-roll-container .die-face-wrapper:nth-child(1) { animation-delay: 0.00s; }
          .dice-roll-container .die-face-wrapper:nth-child(2) { animation-delay: 0.04s; }
          .dice-roll-container .die-face-wrapper:nth-child(3) { animation-delay: 0.08s; }
          .dice-roll-container .die-face-wrapper:nth-child(4) { animation-delay: 0.12s; }
          .dice-roll-container .die-face-wrapper:nth-child(5) { animation-delay: 0.16s; }
          .dice-roll-container .die-face-wrapper:nth-child(6) { animation-delay: 0.20s; }
          .dice-roll-container .die-face-wrapper:nth-child(7) { animation-delay: 0.24s; }
          .dice-roll-container .die-face-wrapper:nth-child(8) { animation-delay: 0.28s; }
          .dice-roll-container .die-face-wrapper:nth-child(9) { animation-delay: 0.32s; }
          .dice-roll-container .die-face-wrapper:nth-child(10) { animation-delay: 0.36s; }
        `}</style>
      </div>
    </div>
  );
}
