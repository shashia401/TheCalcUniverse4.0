// Line chart as plain SVG — the no-library replacement for the recharts
// <LineChart> that ~14 calculator panels used. One or more series, optional
// reference lines (x= or y=) and highlighted dots (e.g. "your result"). Each
// dot has a <title> for hover/focus text.

import { linearScale, niceTicks, formatTick } from '../../utils/chartScale';
import { useContainerWidth } from './useContainerWidth';

export interface LinePoint {
  x: number;
  y: number;
}
export interface LineSeries {
  name: string;
  points: LinePoint[];
  color?: string;
  dashed?: boolean;
}
export interface LineRefLine {
  x?: number;
  y?: number;
  label?: string;
  color?: string;
  dashed?: boolean;
}
export interface LineDot {
  x: number;
  y: number;
  label?: string;
  color?: string;
}
interface Props {
  series: LineSeries[];
  ariaLabel: string;
  height?: number;
  refLines?: LineRefLine[];
  dots?: LineDot[];
  xFormat?: (n: number) => string;
  yFormat?: (n: number) => string;
}

const M = { top: 16, right: 14, bottom: 24, left: 50 };
const AXIS = '#64748b';
const GRID = '#e2e8f0';
const PALETTE = ['#2563eb', '#dc2626', '#059669', '#d97706'];

export default function SvgLineChart({
  series,
  ariaLabel,
  height = 220,
  refLines = [],
  dots = [],
  xFormat = formatTick,
  yFormat = formatTick,
}: Props) {
  const [ref, width] = useContainerWidth();
  const clean = series.map((s) => ({ ...s, points: s.points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)) }));
  const all = clean.flatMap((s) => s.points);
  if (!all.length) return <div ref={ref} />;

  const xs = [...all.map((p) => p.x), ...dots.map((d) => d.x), ...refLines.flatMap((r) => (r.x !== undefined ? [r.x] : []))];
  const ys = [...all.map((p) => p.y), ...dots.map((d) => d.y), ...refLines.flatMap((r) => (r.y !== undefined ? [r.y] : []))];
  const xt = niceTicks(Math.min(...xs), Math.max(...xs), 6);
  const yt = niceTicks(Math.min(...ys), Math.max(...ys), 5);
  const innerW = Math.max(40, width - M.left - M.right);
  const innerH = height - M.top - M.bottom;
  const x = linearScale(xt[0], xt[xt.length - 1], M.left, M.left + innerW);
  const y = linearScale(yt[0], yt[yt.length - 1], M.top + innerH, M.top);

  return (
    <div ref={ref} className="w-full">
      <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible">
        {yt.map((t) => (
          <g key={`y${t}`}>
            <line x1={M.left} x2={M.left + innerW} y1={y(t)} y2={y(t)} stroke={t === 0 ? '#cbd5e1' : GRID} />
            <text x={M.left - 6} y={y(t)} fontSize="10" fill={AXIS} textAnchor="end" dominantBaseline="middle">
              {yFormat(t)}
            </text>
          </g>
        ))}
        {xt.map((t) => (
          <text key={`x${t}`} x={x(t)} y={height - 8} fontSize="10" fill={AXIS} textAnchor="middle">
            {xFormat(t)}
          </text>
        ))}
        {refLines.map((r, i) => {
          const c = r.color ?? '#94a3b8';
          const dash = r.dashed === false ? undefined : '4 3';
          return r.y !== undefined ? (
            <g key={`ry${i}`}>
              <line x1={M.left} x2={M.left + innerW} y1={y(r.y)} y2={y(r.y)} stroke={c} strokeDasharray={dash} />
              {r.label && <text x={M.left + innerW} y={y(r.y) - 4} fontSize="10" fontWeight="700" fill={c} textAnchor="end">{r.label}</text>}
            </g>
          ) : r.x !== undefined ? (
            <g key={`rx${i}`}>
              <line x1={x(r.x)} x2={x(r.x)} y1={M.top} y2={M.top + innerH} stroke={c} strokeDasharray={dash} />
              {r.label && <text x={x(r.x) + 4} y={M.top + 10} fontSize="10" fontWeight="700" fill={c}>{r.label}</text>}
            </g>
          ) : null;
        })}
        {clean.map((s, i) => (
          <polyline
            key={s.name}
            fill="none"
            stroke={s.color ?? PALETTE[i % PALETTE.length]}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={s.dashed ? '6 4' : undefined}
            points={s.points.map((p) => `${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ')}
          >
            <title>{s.name}</title>
          </polyline>
        ))}
        {dots.map((d, i) => (
          <g key={`dot${i}`}>
            <circle cx={x(d.x)} cy={y(d.y)} r="5" fill={d.color ?? '#dc2626'} stroke="#fff" strokeWidth="2">
              {d.label && <title>{d.label}</title>}
            </circle>
            {d.label && (
              <text x={x(d.x)} y={y(d.y) - 10} fontSize="10" fontWeight="700" fill={d.color ?? '#dc2626'} textAnchor="middle">
                {d.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
