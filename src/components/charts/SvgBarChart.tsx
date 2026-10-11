// Vertical bar chart as plain SVG — the no-library replacement for the
// recharts <BarChart> that ~15 calculator panels used. Bars may be negative;
// optional horizontal reference lines (e.g. mean / median). Each bar carries a
// <title>, so hover/focus shows "label: value" without any tooltip code.

import { linearScale, niceTicks, formatTick } from '../../utils/chartScale';
import { useContainerWidth } from './useContainerWidth';

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}
export interface BarRefLine {
  y: number;
  label?: string;
  color?: string;
}
interface Props {
  data: BarDatum[];
  ariaLabel: string;
  height?: number;
  color?: string;
  refLines?: BarRefLine[];
  format?: (n: number) => string;
  maxBarWidth?: number;
}

const M = { top: 14, right: 10, bottom: 24, left: 44 };
const AXIS = '#64748b'; // slate-500, 4.8:1 on white
const GRID = '#e2e8f0';

export default function SvgBarChart({
  data,
  ariaLabel,
  height = 200,
  color = '#2563eb',
  refLines = [],
  format = formatTick,
  maxBarWidth = 32,
}: Props) {
  const [ref, width] = useContainerWidth();
  const vals = data.map((d) => d.value).filter(Number.isFinite);
  if (!vals.length) return <div ref={ref} />;

  const lo = Math.min(0, ...vals, ...refLines.map((r) => r.y));
  const hi = Math.max(0, ...vals, ...refLines.map((r) => r.y));
  const ticks = niceTicks(lo, hi, 5);
  const [d0, d1] = [ticks[0], ticks[ticks.length - 1]];
  const innerW = Math.max(40, width - M.left - M.right);
  const innerH = height - M.top - M.bottom;
  const y = linearScale(d0, d1, M.top + innerH, M.top);
  const band = innerW / data.length;
  const barW = Math.min(band * 0.72, maxBarWidth);
  // Skip x labels when they would collide (≈6.5 px per character).
  const longest = Math.max(...data.map((d) => d.label.length), 1);
  const every = Math.max(1, Math.ceil((longest * 6.5 + 6) / band));

  return (
    <div ref={ref} className="w-full">
      <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={M.left + innerW} y1={y(t)} y2={y(t)} stroke={t === 0 ? '#cbd5e1' : GRID} />
            <text x={M.left - 6} y={y(t)} fontSize="10" fill={AXIS} textAnchor="end" dominantBaseline="middle">
              {formatTick(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          if (!Number.isFinite(d.value)) return null;
          const x = M.left + band * i + (band - barW) / 2;
          const top = Math.min(y(d.value), y(0));
          return (
            <g key={`${d.label}-${i}`}>
              <rect x={x} y={top} width={barW} height={Math.abs(y(d.value) - y(0))} rx="3" fill={d.color ?? color}>
                <title>{`${d.label}: ${format(d.value)}`}</title>
              </rect>
              {i % every === 0 && (
                <text x={x + barW / 2} y={height - 8} fontSize="10" fill={AXIS} textAnchor="middle">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
        {refLines.map((r, i) => (
          <g key={`ref-${i}`}>
            <line x1={M.left} x2={M.left + innerW} y1={y(r.y)} y2={y(r.y)} stroke={r.color ?? '#dc2626'} strokeDasharray="5 3" />
            {r.label && (
              <text x={M.left + innerW} y={y(r.y) - 4} fontSize="10" fontWeight="700" fill={r.color ?? '#dc2626'} textAnchor="end">
                {r.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
