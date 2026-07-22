import { PVData } from './presentValueTypes';

export function GrowthChart({ data }: { data: PVData }) {
  const { growthTimeline, presentValue, futureValue, periods, discountRate } = data;
  if (!growthTimeline.length) return null;

  const W = 520;
  const H = 220;
  const padL = 72;
  const padR = 24;
  const padT = 24;
  const padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const xMax = periods;
  const yMin = presentValue * 0.97;
  const yMax = futureValue * 1.03;
  const yRange = Math.max(yMax - yMin, 1);

  const toX = (year: number) => padL + (year / xMax) * chartW;
  const toY = (v: number) => padT + (1 - (v - yMin) / yRange) * chartH;

  const linePath = growthTimeline
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.year).toFixed(1)} ${toY(d.value).toFixed(1)}`)
    .join(' ');

  const areaPath = [
    linePath,
    `L ${toX(xMax).toFixed(1)} ${(padT + chartH).toFixed(1)}`,
    `L ${toX(0).toFixed(1)} ${(padT + chartH).toFixed(1)}`,
    'Z',
  ].join(' ');

  const gridLines = [0, 0.333, 0.667, 1].map((f) => ({
    val: yMin + f * yRange,
    y: padT + (1 - f) * chartH,
  }));

  const fmtY = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  const xLabelCount = Math.min(periods, 6);
  const xStep = periods / xLabelCount;
  const xLabels: number[] = [];
  for (let i = 0; i <= xLabelCount; i++) {
    xLabels.push(parseFloat((i * xStep).toFixed(1)));
  }

  const midYear = periods / 2;
  const midPoint = growthTimeline.find((d) => Math.abs(d.year - midYear) < xStep * 0.6) ??
    growthTimeline[Math.floor(growthTimeline.length / 2)];

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
        How Your Present Value Grows to ${fmtY(futureValue)} Over {periods} Year{periods !== 1 ? 's' : ''}
      </p>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="Present value to future value growth chart">
          <defs>
            <linearGradient id="pvGrowthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {gridLines.map(({ val, y }) => (
            <g key={val.toFixed(0)}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={padL - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">
                {fmtY(val)}
              </text>
            </g>
          ))}

          {xLabels.map((yr) => (
            <g key={yr}>
              <line x1={toX(yr)} y1={padT} x2={toX(yr)} y2={padT + chartH} stroke="#f1f5f9" strokeWidth={0.5} />
              <text x={toX(yr)} y={padT + chartH + 14} textAnchor="middle" fontSize={9} fill="#94a3b8">
                Yr {yr}
              </text>
            </g>
          ))}

          <path d={areaPath} fill="url(#pvGrowthGrad)" />
          <path d={linePath} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinejoin="round" />

          <circle cx={toX(0)} cy={toY(presentValue)} r={5} fill="#10b981" />
          <text x={toX(0) + 7} y={toY(presentValue) - 6} fontSize={9} fill="#059669" fontWeight="bold">
            Today: {fmtY(presentValue)}
          </text>

          <circle cx={toX(periods)} cy={toY(futureValue)} r={5} fill="#3b82f6" />
          <text x={toX(periods) - 7} y={toY(futureValue) - 6} textAnchor="end" fontSize={9} fill="#2563eb" fontWeight="bold">
            Yr {periods}: {fmtY(futureValue)}
          </text>

          {periods > 2 && midPoint && (
            <g>
              <circle cx={toX(midPoint.year)} cy={toY(midPoint.value)} r={3.5} fill="#f59e0b" />
              <text
                x={toX(midPoint.year)}
                y={toY(midPoint.value) - 8}
                textAnchor="middle"
                fontSize={8}
                fill="#d97706"
                fontWeight="bold"
              >
                Midpoint: {fmtY(midPoint.value)}
              </text>
            </g>
          )}

          <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
        </svg>
      </div>
      <p className="text-xs text-slate-500 mt-2 text-center">
        At {discountRate}% per year, your money doubles approximately every{' '}
        <strong className="text-slate-600">{discountRate > 0 ? (72 / discountRate).toFixed(1) : "N/A"} years</strong> (Rule of 72).
      </p>
    </div>
  );
}
