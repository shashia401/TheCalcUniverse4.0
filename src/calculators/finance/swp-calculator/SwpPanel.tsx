import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';

function SwpPanel({ values, results }: { values: Record<string, string>; results: CalculatorResult[] }) {
  const chartDataStr = results.find((r) => r.id === 'withdrawalChart')?.value || '[]';
  const chartData = useMemo(() => {
    try {
      const parsed = JSON.parse(chartDataStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [chartDataStr]);

  if (chartData.length === 0) return null;

  const corpus = parseFloat(values.corpus) || 0;
  const maxVal = Math.max(corpus, ...chartData.map((d: { value: number }) => d.value));
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
    .map((d: { value: number }, i: number) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(Math.max(0, d.value)).toFixed(1)}`)
    .join(' ');

  const last = chartData[chartData.length - 1];
  const isDepleted = last.value <= 0;
  const monthsLasted = results.find((r) => r.id === 'monthsLasted')?.value || '';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Corpus Depletion Over Time</span>
      </div>
      <div className="p-6 space-y-4">
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full"
            style={{ minWidth: '280px' }}
            role="img"
            aria-label="SWP corpus depletion chart"
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
              <linearGradient id="swpArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isDepleted ? '#ef4444' : '#3b82f6'} stopOpacity={0.18} />
                <stop offset="100%" stopColor={isDepleted ? '#ef4444' : '#3b82f6'} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <path
              d={`${pathLine} L ${toX(chartData.length - 1)} ${padT + chartH} L ${padL} ${padT + chartH} Z`}
              fill="url(#swpArea)"
            />
            <path
              d={pathLine}
              fill="none"
              stroke={isDepleted ? '#ef4444' : '#3b82f6'}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
            {isDepleted && (
              <text x={padL + chartW / 2} y={padT + chartH / 2} textAnchor="middle" fontSize={13} fill="#ef4444" fontWeight="bold">
                Corpus Depleted
              </text>
            )}
          </svg>
        </div>
        {monthsLasted && (
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Corpus Longevity</p>
            <p className={`text-sm font-black ${isDepleted ? 'text-red-600' : 'text-emerald-600'}`}>
              {monthsLasted}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SwpPanel;
