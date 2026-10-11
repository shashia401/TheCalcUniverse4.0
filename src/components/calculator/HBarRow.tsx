// One labelled horizontal bar ("Lease cost ▇▇▇▇ $12,340"). Replaces the
// near-identical local `bar()` helpers that were copied into 7 panels
// (depreciation, auto-loan, lease-vs-buy, concrete-slab, tdee, bmr, trip-fuel).
// `color` must be a -700 (or darker) Tailwind bg class so white 10px text keeps
// ≥ 4.5:1 contrast.

import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: number;
  max: number;
  display: ReactNode;
  color: string;
  labelWidth?: string;
  height?: string;
  className?: string;
  onHover?: (hovering: boolean) => void;
}

export default function HBarRow({
  label,
  value,
  max,
  display,
  color,
  labelWidth = 'w-32',
  height = 'h-6',
  className = 'py-1.5',
  onHover,
}: Props) {
  const pct = max > 0 && Number.isFinite(value) ? (value / max) * 100 : 0;
  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      onMouseEnter={onHover && (() => onHover(true))}
      onMouseLeave={onHover && (() => onHover(false))}
    >
      <span className={`text-xs font-semibold text-slate-600 ${labelWidth} flex-shrink-0`}>{label}</span>
      <div className={`flex-1 ${height} bg-slate-100 rounded overflow-hidden`}>
        <div
          className={`h-full rounded ${color} flex items-center justify-end pr-1.5 ${pct < 12 ? 'min-w-[50px]' : ''}`}
          style={{ width: `${Math.max(pct, 5)}%` }}
        >
          <span className="text-[10px] font-bold text-white drop-shadow-sm">{display}</span>
        </div>
      </div>
    </div>
  );
}
