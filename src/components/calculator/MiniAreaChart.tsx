// Hand-rolled stacked-area SVG chart — no chart library (keeps the near-zero-JS
// moat). Rendered inside the calculator island; redraws whenever inputs change,
// which is the "Living Answer" moment. Theme-aware via the colors the config passes.

import { useId, useState } from 'react';
import type { CalcChart } from '../../types/calculator';

interface Props {
  chart: CalcChart;
}

const W = 640;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 34, left: 16 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

export default function MiniAreaChart({ chart }: Props) {
  const gradId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const { points, seriesLabels, seriesColors, xAxisLabel, formatValue, caption } = chart;

  if (points.length < 2) return null;

  const fmt = formatValue ?? ((n: number) => String(Math.round(n)));
  const nSeries = seriesLabels.length;

  // Max stacked total across points → y-scale
  const maxTotal = Math.max(
    ...points.map((p) => p.values.reduce((a, b) => a + b, 0)),
    1
  );

  const xAt = (i: number) => PAD.left + (PLOT_W * i) / (points.length - 1);
  const yAt = (v: number) => PAD.top + PLOT_H - (PLOT_H * v) / maxTotal;

  // Cumulative stack tops for each point: cum[i][s] = sum of series 0..s
  const cum = points.map((p) => {
    const out: number[] = [];
    let running = 0;
    for (let s = 0; s < nSeries; s++) {
      running += p.values[s] ?? 0;
      out.push(running);
    }
    return out;
  });

  // Build one filled area per series (top edge = cum[s], bottom edge = cum[s-1] or 0)
  const areaPath = (s: number) => {
    const top = points.map((_, i) => `${xAt(i)},${yAt(cum[i][s])}`);
    const bottom = points
      .map((_, i) => `${xAt(i)},${yAt(s === 0 ? 0 : cum[i][s - 1])}`)
      .reverse();
    return `M${top.join('L')}L${bottom.join('L')}Z`;
  };

  // A few x-axis ticks (first, ~middle, last)
  const tickIdx = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  const hoverPoint = hover !== null ? points[hover] : null;
  const hoverTotal = hoverPoint ? hoverPoint.values.reduce((a, b) => a + b, 0) : 0;

  return (
    <figure className="mt-1">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={caption ?? 'Breakdown chart'}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * W;
          const frac = Math.min(1, Math.max(0, (x - PAD.left) / PLOT_W));
          setHover(Math.round(frac * (points.length - 1)));
        }}
      >
        <defs>
          {seriesColors.map((c, s) => (
            <linearGradient key={s} id={`${gradId}-${s}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity="0.85" />
              <stop offset="100%" stopColor={c} stopOpacity="0.55" />
            </linearGradient>
          ))}
        </defs>

        {/* baseline */}
        <line
          x1={PAD.left}
          y1={yAt(0)}
          x2={PAD.left + PLOT_W}
          y2={yAt(0)}
          stroke="var(--border-warm)"
          strokeWidth="1"
        />

        {/* stacked areas, top series first so lower ones aren't hidden */}
        {seriesLabels.map((_, s) => (
          <path key={s} d={areaPath(s)} fill={`url(#${gradId}-${s})`} />
        ))}

        {/* x ticks */}
        {tickIdx.map((i) => (
          <text
            key={i}
            x={xAt(i)}
            y={H - 14}
            textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
            fontSize="12"
            fill="var(--surface-text-muted)"
          >
            {xAxisLabel ? `${points[i].x} ${xAxisLabel}` : points[i].x}
          </text>
        ))}

        {/* hover guide + markers */}
        {hover !== null && hoverPoint && (
          <>
            <line
              x1={xAt(hover)}
              y1={PAD.top}
              x2={xAt(hover)}
              y2={yAt(0)}
              stroke="var(--surface-text-muted)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            {cum[hover].map((v, s) => (
              <circle key={s} cx={xAt(hover)} cy={yAt(v)} r="3" fill={seriesColors[s]} stroke="var(--surface-card)" strokeWidth="1.5" />
            ))}
          </>
        )}
      </svg>

      {/* Legend + live hover readout */}
      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-4 list-none p-0 m-0">
          {seriesLabels.map((label, s) => (
            <li key={s} className="flex items-center gap-1.5 text-xs text-[var(--surface-text-secondary)]">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: seriesColors[s] }} />
              {label}
              {hoverPoint && (
                <span className="font-mono font-semibold text-[var(--surface-text)]">
                  {' '}{fmt(hoverPoint.values[s] ?? 0)}
                </span>
              )}
            </li>
          ))}
        </ul>
        {hoverPoint && (
          <span className="text-xs text-[var(--surface-text-muted)]">
            {xAxisLabel ? `${hoverPoint.x} ${xAxisLabel}` : hoverPoint.x}: <span className="font-mono font-semibold text-[var(--surface-text)]">{fmt(hoverTotal)}</span> total
          </span>
        )}
      </figcaption>
      {caption && !hoverPoint && (
        <p className="mt-1 text-xs text-[var(--surface-text-muted)]">{caption}</p>
      )}
    </figure>
  );
}
