import { CalculatorResult } from '../../../types/calculator';

interface ScheduleRow {
  year: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  bookValue: number;
}

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function formatCurrency(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getMethodLabel(method: string): string {
  if (method === 'straight-line') return 'Straight Line';
  return 'MACRS (200% DB)';
}

function getResultValue(results: CalculatorResult[], id: string): number {
  const r = results.find((x) => x.id === id);
  if (!r) return 0;
  const m = r.value.replace(/[$,]/g, '').match(/^([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

function getResultStr(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '$0';
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────

function DepreciationBarChart({ schedule, isMacrs }: { schedule: ScheduleRow[]; isMacrs: boolean }) {
  if (!schedule.length) return null;

  const maxDep = Math.max(...schedule.map((r) => r.depreciationExpense));
  const chartHeight = 120;
  const barWidth = Math.max(20, Math.min(48, Math.floor(480 / schedule.length) - 6));
  const gap = 6;
  const chartWidth = schedule.length * (barWidth + gap);
  const barColor = isMacrs ? '#f59e0b' : '#3b82f6';

  return (
    <div className="overflow-x-auto">
      <svg
        width={Math.max(chartWidth + 8, 300)}
        height={chartHeight + 36}
        className="block"
        role="img"
        aria-label="Depreciation expense bar chart"
      >
        {schedule.map((row, i) => {
          const barH = maxDep > 0 ? (row.depreciationExpense / maxDep) * chartHeight : 0;
          const x = i * (barWidth + gap);
          const y = chartHeight - barH;
          return (
            <g key={row.year}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                fill={barColor}
                rx={3}
                opacity={0.85}
              />
              <text
                x={x + barWidth / 2}
                y={chartHeight + 14}
                textAnchor="middle"
                fontSize={9}
                fill="#94a3b8"
                fontWeight="600"
              >
                {row.year}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={8}
                fill="#64748b"
                fontWeight="bold"
              >
                ${Math.round(row.depreciationExpense).toLocaleString()}
              </text>
            </g>
          );
        })}
        <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e2e8f0" strokeWidth={1} />
      </svg>
      <p className="text-[10px] text-slate-500 mt-1">Year numbers below bars. Dollar amounts above each bar.</p>
    </div>
  );
}

// ─── SVG Line Graph: Asset Value Decline ──────────────────────────────────────

function AssetValueLine({ schedule, assetCost }: { schedule: ScheduleRow[]; assetCost: number }) {
  if (!schedule.length) return null;

  const W = 460;
  const H = 160;
  const padL = 60;
  const padR = 20;
  const padT = 20;
  const padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const points = [
    { year: 0, value: assetCost },
    ...schedule.map((s) => ({ year: s.year, value: s.bookValue })),
  ];

  const maxVal = assetCost;
  const minVal = Math.min(...points.map((p) => p.value));
  const yPad = (maxVal - minVal) * 0.08 || 100;
  const yMin = Math.max(0, minVal - yPad);
  const yMax = maxVal + yPad;
  const yRange = yMax - yMin;

  const toX = (year: number) => padL + (year / (schedule.length || 1)) * chartW;
  const toY = (v: number) => padT + (1 - (v - yMin) / yRange) * chartH;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.year).toFixed(1)} ${toY(p.value).toFixed(1)}`)
    .join(' ');

  // Y-axis grid lines
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount }, (_, i) => {
    const frac = i / (gridCount - 1);
    const val = yMin + frac * yRange;
    return { val, y: padT + (1 - frac) * chartH };
  });

  const fmtY = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Asset value decline line chart">
        <defs>
          <linearGradient id="declineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map(({ val, y }) => (
          <g key={val.toFixed(0)}>
            <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
            <text x={padL - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">
              {fmtY(val)}
            </text>
          </g>
        ))}

        {/* Line fill */}
        <path
          d={`${linePath} L ${toX(schedule.length)} ${toY(yMin).toFixed(1)} L ${toX(0)} ${toY(yMin).toFixed(1)} Z`}
          fill="url(#declineGrad)"
        />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" />

        {/* Dots */}
        {points.map((p) => (
          <circle key={p.year} cx={toX(p.year)} cy={toY(p.value)} r={3} fill="#3b82f6" />
        ))}

        {/* X-axis labels */}
        {schedule.filter((_, i) => i % Math.max(1, Math.floor(schedule.length / 5)) === 0).map((s) => (
          <text key={s.year} x={toX(s.year)} y={padT + chartH + 14} textAnchor="middle" fontSize={9} fill="#94a3b8">
            Yr {s.year}
          </text>
        ))}
        <text x={toX(0)} y={padT + chartH + 14} textAnchor="middle" fontSize={9} fill="#94a3b8">Start</text>

        <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      </svg>
    </div>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

export default function DepreciationPanel({ values, results }: Props) {
  const scheduleResult = results.find((r) => r.id === '_schedule');
  if (!scheduleResult) return null;

  let schedule: ScheduleRow[] = [];
  try {
    schedule = JSON.parse(scheduleResult.value) as ScheduleRow[];
  } catch {
    return null;
  }

  if (!schedule.length) return null;

  const method = values.method || 'straight-line';
  const isMacrs = method === 'macrs';
  const dpRecalc = getResultValue(results, 'depreciableBasis');
  const actualCostVal = dpRecalc + (parseFloat(values.salvageValue) || 0);
  const annualOrFirstYear = getResultStr(results, 'annualDepreciation');
  const totalDepStr = getResultStr(results, 'totalDepreciation');

  const badgeColor = isMacrs ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200';
  const headerColor = isMacrs ? 'text-amber-600' : 'text-blue-600';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-500" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Depreciation Schedule
        </span>
        <span className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full border ${badgeColor}`}>
          {getMethodLabel(method)}
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Annual deduction hero card */}
        <div className={`rounded-xl border px-5 py-4 ${isMacrs ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
          <p className={`text-xs font-bold uppercase tracking-widest ${headerColor} mb-1`}>
            {isMacrs ? 'Year 1 Depreciation (Half-Year Convention)' : 'Annual Depreciation (Straight Line)'}
          </p>
          <p className={`text-2xl font-black ${isMacrs ? 'text-amber-700' : 'text-blue-700'}`}>
            {annualOrFirstYear}
          </p>
          <p className={`text-xs ${isMacrs ? 'text-amber-500' : 'text-blue-500'} mt-1`}>
            Total depreciation over life: {totalDepStr}
          </p>
        </div>

        {/* Bar chart */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            Depreciation Expense by Year
          </p>
          <DepreciationBarChart schedule={schedule} isMacrs={isMacrs} />
        </div>

        {/* Asset value decline line graph */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            Asset Book Value Over Time
          </p>
          <AssetValueLine schedule={schedule} assetCost={actualCostVal} />
        </div>

        {/* Schedule table */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            Year-by-Year Depreciation Schedule
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Year</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Depreciation</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Accumulated</th>
                  <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Book Value</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row, i) => (
                  <tr
                    key={row.year}
                    className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <td className="px-4 py-2.5 font-bold text-slate-700">Year {row.year}</td>
                    <td className={`px-3 py-2.5 text-right font-semibold ${isMacrs ? 'text-amber-600' : 'text-blue-600'}`}>
                      ${formatCurrency(row.depreciationExpense)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-500">
                      ${formatCurrency(row.accumulatedDepreciation)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-800">
                      ${formatCurrency(row.bookValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Method comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={`rounded-xl border px-4 py-3 ${!isMacrs ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Straight Line</p>
            </div>
            <p className="text-[11px] text-slate-500">Equal annual deduction. Simple and predictable. Best for book/GAAP financial reporting.</p>
          </div>
          <div className={`rounded-xl border px-4 py-3 ${isMacrs ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">MACRS (200% DB)</p>
            </div>
            <p className="text-[11px] text-slate-500">Front-loaded deductions. Half-year convention. IRS-prescribed for most tangible property.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
