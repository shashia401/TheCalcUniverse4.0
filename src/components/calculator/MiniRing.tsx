// Single-value progress ring (e.g. 3 of 8 slices) as plain SVG — no chart
// library. Starts at 12 o'clock and fills clockwise.

interface Props {
  value: number;
  total: number;
  color: string;
  size?: number;
  label?: string;
}

const R = 36.5;        // centerline radius in a 100-unit viewBox
const STROKE = 17;     // ring thickness
const C = 2 * Math.PI * R;

export default function MiniRing({ value, total, color, size = 100, label }: Props) {
  if (!(total > 0)) return null;
  const frac = Math.min(Math.max(value, 0), total) / total;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={label ?? `${Math.round(frac * 100)}% filled`}
    >
      <circle cx="50" cy="50" r={R} fill="none" stroke="#e2e8f0" strokeWidth={STROKE} />
      <circle
        cx="50"
        cy="50"
        r={R}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeDasharray={`${frac * C} ${C}`}
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
}
