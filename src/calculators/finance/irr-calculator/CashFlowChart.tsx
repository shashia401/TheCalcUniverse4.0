import { fmtCurrency } from './irrTypes';

export function CashFlowChart({ cashFlows, paybackPeriod }: { cashFlows: number[]; paybackPeriod: number | null }) {
  if (!cashFlows.length) return null;

  const width = 520;
  const height = 220;
  const padL = 70;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxAbs = Math.max(...cashFlows.map((cf) => Math.abs(cf)), 1);
  const midY = padT + chartH / 2;

  const barW = Math.max(2, (chartW / cashFlows.length) * 0.6);
  const gap = chartW / cashFlows.length;

  const barX = (i: number) => padL + i * gap + gap / 2 - barW / 2;

  const cumulatives: number[] = [];
  let running = 0;
  for (const cf of cashFlows) {
    running += cf;
    cumulatives.push(running);
  }

  const cumulMax = Math.max(...cumulatives.map(Math.abs), 1);
  const toLineY = (v: number) => midY - (v / cumulMax) * (chartH / 2);

  const linePath = cumulatives
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${(barX(i) + barW / 2).toFixed(1)} ${toLineY(c).toFixed(1)}`)
    .join(' ');

  let paybackX: number | null = null;
  if (paybackPeriod !== null && paybackPeriod >= 0 && paybackPeriod <= cashFlows.length - 1) {
    paybackX = padL + paybackPeriod * gap + gap / 2;
  }

  const fmtY = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '300px' }} role="img" aria-label="Internal rate of return cash flow bar chart">
        {[-1, -0.5, 0, 0.5, 1].map((g) => {
          const y = midY - g * (chartH / 2);
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke={g === 0 ? '#94a3b8' : '#e2e8f0'} strokeWidth={g === 0 ? 1 : 0.5} />
              <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">
                {g === 0 ? '$0' : fmtY(g * cumulMax)}
              </text>
            </g>
          );
        })}

        {cashFlows.map((cf, i) => {
          const isNeg = cf < 0;
          const barH = (Math.abs(cf) / maxAbs) * (chartH / 2);
          const barY = isNeg ? midY : midY - barH;
          const fillColor = isNeg ? '#ef4444' : '#10b981';

          return (
            <g key={`item-${i}`}>
              <rect
                x={barX(i)}
                y={barY}
                width={barW}
                height={barH}
                fill={fillColor}
                rx={2}
                opacity={0.85}
              />
              <text
                x={barX(i) + barW / 2}
                y={padT + chartH + 13}
                textAnchor="middle"
                fontSize={8}
                fill="#94a3b8"
              >
                Yr {i}
              </text>
              <text
                x={barX(i) + barW / 2}
                y={isNeg ? barY + barH + 10 : barY - 4}
                textAnchor="middle"
                fontSize={7}
                fill={isNeg ? '#ef4444' : '#10b981'}
              >
                {fmtCurrency(cf, true)}
              </text>
            </g>
          );
        })}

        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />

        {paybackX !== null && (
          <g>
            <line x1={paybackX} y1={padT} x2={paybackX} y2={padT + chartH} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={paybackX + 4} y={padT + 10} fontSize={8} fill="#d97706" fontWeight="600">Payback</text>
          </g>
        )}

        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      </svg>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500 opacity-85 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Positive Cash Flow</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500 opacity-85 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Negative Cash Flow</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-blue-500 flex-shrink-0" />
          <span className="text-[10px] text-slate-500">Cumulative Cash Flow</span>
        </div>
        {paybackX !== null && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 flex-shrink-0" style={{ borderTop: '1.5px dashed #f59e0b' }} />
            <span className="text-[10px] text-slate-500">Payback Period</span>
          </div>
        )}
      </div>
    </div>
  );
}
