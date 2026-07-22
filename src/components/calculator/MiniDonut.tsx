// Hand-rolled SVG donut — the at-a-glance "your actual split" (e.g. principal vs
// interest). No chart library. Redraws from real numbers as inputs change.
// Complements MiniAreaChart (split over time); this is the split in total.

import { useId } from 'react';
import type { CalcDonut } from '../../types/calculator';

interface Props {
  donut: CalcDonut;
}

const SIZE = 168;
const R = 68;          // radius of the ring centerline
const STROKE = 26;     // ring thickness
const C = 2 * Math.PI * R;

export default function MiniDonut({ donut }: Props) {
  const titleId = useId();
  const { segments, centerLabel, formatValue, caption } = donut;
  const fmt = formatValue ?? ((n: number) => String(Math.round(n)));

  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  if (total <= 0) return null;

  // Build arc offsets around the ring
  let acc = 0;
  const arcs = segments.map((s) => {
    const frac = Math.max(0, s.value) / total;
    const arc = {
      color: s.color,
      dash: frac * C,
      offset: -acc * C, // negative → clockwise from 12 o'clock
      frac,
    };
    acc += frac;
    return arc;
  });

  return (
    <figure className="flex flex-col sm:flex-row items-center gap-5 m-0">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        role="img"
        aria-labelledby={titleId}
        className="shrink-0"
      >
        <title id={titleId}>{caption ?? 'Result breakdown'}</title>
        {/* track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--surface-bg)"
          strokeWidth={STROKE}
        />
        {/* segments — rotate so 0 starts at 12 o'clock */}
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          {arcs.map((a, i) => (
            <circle
              key={i}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={a.color}
              strokeWidth={STROKE}
              strokeDasharray={`${a.dash} ${C - a.dash}`}
              strokeDashoffset={a.offset}
            />
          ))}
        </g>
        {/* center total */}
        <text
          x={SIZE / 2}
          y={SIZE / 2 - 2}
          textAnchor="middle"
          fontSize="17"
          fontWeight="700"
          fill="var(--surface-text)"
        >
          {fmt(total)}
        </text>
        {centerLabel && (
          <text
            x={SIZE / 2}
            y={SIZE / 2 + 15}
            textAnchor="middle"
            fontSize="10"
            fill="var(--surface-text-muted)"
          >
            {centerLabel}
          </text>
        )}
      </svg>

      <figcaption className="min-w-0">
        <ul className="space-y-2 list-none p-0 m-0">
          {arcs.map((a, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="inline-block h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: a.color }} />
              <span className="text-[var(--surface-text-secondary)]">{segments[i].label}</span>
              <span className="ml-auto font-mono font-semibold text-[var(--surface-text)]">{fmt(segments[i].value)}</span>
              <span className="font-mono text-xs text-[var(--surface-text-muted)] w-10 text-right">{Math.round(a.frac * 100)}%</span>
            </li>
          ))}
        </ul>
        {caption && <p className="mt-2 text-xs text-[var(--surface-text-muted)]">{caption}</p>}
      </figcaption>
    </figure>
  );
}
