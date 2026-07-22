import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';

function SipPanel({ values, results }: { values: Record<string, string>; results: CalculatorResult[] }) {
  const chartDataStr = results.find((r) => r.id === 'wealthChart')?.value || '[]';
  const chartData = useMemo(() => {
    try {
      const parsed = JSON.parse(chartDataStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [chartDataStr]);

  if (chartData.length === 0) return null;

  const maxVal = Math.max(...chartData.map((d: { value: number }) => d.value));
  const width = 520;
  const height = 200;
  const padL = 55;
  const padR = 20;
  const padT = 16;
  const padB = 36;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const toX = (i: number) => padL + (i / (chartData.length - 1)) * chartW;
  const toY = (v: number) => padT + (1 - v / maxVal) * chartH;

  const pathLine = chartData
    .map((d: { value: number }, i: number) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.value).toFixed(1)}`)
    .join(' ');

  const areaPath = `${pathLine} L ${toX(chartData.length - 1)} ${padT + chartH} L ${padL} ${padT + chartH} Z`;

  const last = chartData[chartData.length - 1];
  const first = chartData[0];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Wealth Growth Over Time</span>
      </div>
      <div className="p-6 space-y-4">
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full"
            style={{ minWidth: '280px' }}
            role="img"
            aria-label="SIP wealth growth projection chart"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((g) => {
              const y = padT + (1 - g) * chartH;
              const val = maxVal * g;
              const label =
                val >= 1e7
                  ? `${(val / 1e7).toFixed(1)}Cr`
                  : val >= 1e5
                  ? `${(val / 1e5).toFixed(1)}L`
                  : val >= 1e3
                  ? `${(val / 1e3).toFixed(0)}K`
                  : Math.round(val).toString();
              return (
                <g key={g}>
                  <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
                  <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">
                    {label}
                  </text>
                </g>
              );
            })}
            <defs>
              <linearGradient id="sipArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#sipArea)" />
            <path d={pathLine} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" />
            <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
            {chartData.length > 0 && (
              <>
                <circle cx={toX(0)} cy={toY(first.value)} r={4} fill="#f59e0b" stroke="white" strokeWidth={2} />
                <circle cx={toX(chartData.length - 1)} cy={toY(last.value)} r={4} fill="#22c55e" stroke="white" strokeWidth={2} />
              </>
            )}
          </svg>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-amber-500" />
            <span className="text-[10px] text-slate-500">Start</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-emerald-500" />
            <span className="text-[10px] text-slate-500">Maturity</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SipPanel;
