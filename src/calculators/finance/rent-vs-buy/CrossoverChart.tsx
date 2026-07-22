// ─── Crossover SVG Chart ──────────────────────────────────────────────────────

export interface ChartPoint {
  year: number;
  cumulativeRentCost: number;
  cumulativeBuyCost: number;
}

export function CrossoverChart({
  chartData,
  breakEvenYear,
  selectedYear,
}: {
  chartData: ChartPoint[];
  breakEvenYear: number;
  selectedYear: number;
}) {
  if (!chartData.length) return null;

  const W = 560;
  const H = 280;
  const padL = 72;
  const padR = 24;
  const padT = 24;
  const padB = 44;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const allValues = chartData.flatMap((d) => [d.cumulativeRentCost, d.cumulativeBuyCost]);
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const yPad = (rawMax - rawMin) * 0.08 || 1000;
  const yMin = rawMin - yPad;
  const yMax = rawMax + yPad;
  const yRange = yMax - yMin;

  const toX = (year: number) => padL + ((year - 1) / (chartData.length - 1 || 1)) * chartW;
  const toY = (v: number) => padT + (1 - (v - yMin) / yRange) * chartH;

  const rentLine = chartData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.year).toFixed(1)} ${toY(d.cumulativeRentCost).toFixed(1)}`)
    .join(' ');
  const buyLine = chartData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.year).toFixed(1)} ${toY(d.cumulativeBuyCost).toFixed(1)}`)
    .join(' ');

  // Y-axis grid lines (5 evenly spaced)
  const gridCount = 5;
  const gridLines = Array.from({ length: gridCount }, (_, i) => {
    const frac = i / (gridCount - 1);
    const val = yMin + frac * yRange;
    const y = padT + (1 - frac) * chartH;
    return { val, y };
  });

  const fmtYAxis = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  // X-axis every 5 years
  const xLabels = [1, 5, 10, 15, 20, 25, 30].filter((y) => y <= chartData.length);

  // Zero line
  const zeroY = toY(0);
  const showZero = zeroY > padT && zeroY < padT + chartH;

  // Break-even vertical line
  const bev = breakEvenYear > 0 && breakEvenYear <= 30 ? breakEvenYear : null;
  const bevX = bev !== null ? toX(bev) : null;

  // Selected year vertical line
  const selvX = toX(Math.min(selectedYear, 30));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: '320px' }} role="img" aria-label="Rent vs buy cost comparison chart">
        <defs>
          <linearGradient id="rvbRentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="rvbBuyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map(({ val, y }) => (
          <g key={val.toFixed(0)}>
            <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
            <text x={padL - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">
              {fmtYAxis(val)}
            </text>
          </g>
        ))}

        {/* Zero line */}
        {showZero && (
          <line
            x1={padL}
            y1={zeroY}
            x2={padL + chartW}
            y2={zeroY}
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {/* X-axis labels */}
        {xLabels.map((yr) => {
          const x = toX(yr);
          return (
            <g key={yr}>
              <line x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#f1f5f9" strokeWidth={0.5} />
              <text x={x} y={padT + chartH + 14} textAnchor="middle" fontSize={9} fill="#94a3b8">
                Yr {yr}
              </text>
            </g>
          );
        })}

        {/* Break-even marker */}
        {bevX !== null && bev !== null && (
          <g>
            <line
              x1={bevX}
              y1={padT}
              x2={bevX}
              y2={padT + chartH}
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="5 3"
            />
            <text x={bevX + 4} y={padT + 10} fontSize={8} fill="#d97706" fontWeight="bold">
              Break-Even: Yr {bev}
            </text>
          </g>
        )}

        {/* Selected year marker */}
        <g>
          <line
            x1={selvX}
            y1={padT}
            x2={selvX}
            y2={padT + chartH}
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <text x={selvX + 4} y={padT + 22} fontSize={8} fill="#2563eb" fontWeight="bold">
            Your Timeline: Yr {selectedYear}
          </text>
        </g>

        {/* Rent area fill */}
        <path
          d={`${rentLine} L ${toX(30).toFixed(1)} ${(padT + chartH).toFixed(1)} L ${toX(1).toFixed(1)} ${(padT + chartH).toFixed(1)} Z`}
          fill="url(#rvbRentGrad)"
        />

        {/* Buy area fill */}
        <path
          d={`${buyLine} L ${toX(30).toFixed(1)} ${(padT + chartH).toFixed(1)} L ${toX(1).toFixed(1)} ${(padT + chartH).toFixed(1)} Z`}
          fill="url(#rvbBuyGrad)"
        />

        {/* Lines */}
        <path d={rentLine} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" />
        <path d={buyLine} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinejoin="round" />

        {/* Dots at selected year */}
        {(() => {
          const pt = chartData.find((d) => d.year === selectedYear) ?? chartData[chartData.length - 1];
          if (!pt) return null;
          return (
            <>
              <circle cx={selvX} cy={toY(pt.cumulativeRentCost)} r={4} fill="#3b82f6" />
              <circle cx={selvX} cy={toY(pt.cumulativeBuyCost)} r={4} fill="#10b981" />
            </>
          );
        })()}

        {/* Chart border */}
        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-blue-500 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Renting Net Cost</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-emerald-500 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Buying Net Cost (negative = profit)</span>
        </div>
        {bev !== null && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 flex-shrink-0" style={{ borderTop: '1.5px dashed #f59e0b' }} />
            <span className="text-[10px] text-slate-500">Break-Even Year</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-4 flex-shrink-0" style={{ borderTop: '1.5px dashed #3b82f6' }} />
          <span className="text-[10px] text-slate-500">Your Timeline</span>
        </div>
      </div>
    </div>
  );
}
