// Hand-rolled SVG band gauge — the "where you fall" visual (calculator.net's best
// idea). A horizontal colored scale with a live marker at the user's value, so
// "am I okay?" is answered at a glance. No chart library; theme-aware chrome.

import type { CalcGauge } from '../../types/calculator';

interface Props {
  gauge: CalcGauge;
}

const W = 640;
const H = 104;
const PAD = 12;
const BAR_Y = 46;
const BAR_H = 22;
const PLOT_W = W - PAD * 2;

export default function MiniGauge({ gauge }: Props) {
  const { value, min, max, valueLabel, bands, caption } = gauge;
  if (max <= min || bands.length === 0) return null;

  const xOf = (v: number) => PAD + (PLOT_W * (Math.min(max, Math.max(min, v)) - min)) / (max - min);
  const markerX = xOf(value);

  // Segment boundaries: from `min` up through each band's `to`
  let prev = min;
  const segments = bands.map((b) => {
    const seg = { x1: xOf(prev), x2: xOf(b.to), color: b.color, label: b.label, mid: 0, w: 0 };
    seg.mid = (seg.x1 + seg.x2) / 2;
    seg.w = seg.x2 - seg.x1;
    prev = b.to;
    return seg;
  });

  // Boundary tick values (start + each band top), de-duplicated
  const ticks = [min, ...bands.map((b) => b.to)];

  // Keep the marker label inside the viewport
  const labelX = Math.min(W - PAD - 70, Math.max(PAD + 70, markerX));

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={valueLabel ?? caption ?? 'Result scale'}>
        {/* marker label + downward pointer */}
        {valueLabel && (
          <text x={labelX} y={18} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--surface-text)">
            {valueLabel}
          </text>
        )}
        <path
          d={`M${markerX - 6},26 L${markerX + 6},26 L${markerX},38 Z`}
          fill="var(--surface-text)"
        />
        <line x1={markerX} y1={26} x2={markerX} y2={BAR_Y + BAR_H} stroke="var(--surface-text)" strokeWidth="2" />

        {/* colored band segments */}
        {segments.map((s, i) => (
          <rect
            key={i}
            x={s.x1}
            y={BAR_Y}
            width={Math.max(0, s.w)}
            height={BAR_H}
            fill={s.color}
            rx={i === 0 || i === segments.length - 1 ? 6 : 0}
          />
        ))}

        {/* band labels (only where the segment is wide enough) */}
        {segments.map((s, i) => (
          s.w > 52 ? (
            <text key={`l${i}`} x={s.mid} y={BAR_Y + BAR_H + 15} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--surface-text-secondary)">
              {s.label}
            </text>
          ) : null
        ))}

        {/* boundary tick numbers */}
        {ticks.map((t, i) => (
          <text
            key={`t${i}`}
            x={xOf(t)}
            y={BAR_Y - 6}
            textAnchor={i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle'}
            fontSize="10"
            fill="var(--surface-text-muted)"
          >
            {t}
          </text>
        ))}
      </svg>
      {caption && <figcaption className="mt-1 text-xs text-[var(--surface-text-muted)]">{caption}</figcaption>}
    </figure>
  );
}
