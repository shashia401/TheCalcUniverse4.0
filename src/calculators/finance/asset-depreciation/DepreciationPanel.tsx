import { BarChart2 } from 'lucide-react';
import { CalculatorResult } from '../../../types/calculator';

interface ScheduleRow {
  year: number;
  beginningValue: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  endingValue: number;
}

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function formatCurrency(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getMethodLabel(method: string): string {
  if (method === 'sl') return 'Straight-Line (SL)';
  if (method === 'ddb') return 'Double Declining Balance (DDB)';
  if (method === 'syd') return "Sum-of-the-Years'-Digits (SYD)";
  return method;
}

function getFormulaDisplay(method: string, usefulLife: number): { formula: string; description: string } {
  if (method === 'sl') {
    return {
      formula: '(Cost − Salvage) ÷ Useful Life',
      description: `Each year receives an equal share of the depreciable amount. With a ${usefulLife}-year life, each year gets ${(100 / usefulLife).toFixed(1)}% of the depreciable cost.`,
    };
  }
  if (method === 'ddb') {
    const rate = (2 / usefulLife * 100).toFixed(0);
    return {
      formula: `(2 ÷ ${usefulLife}) × Beginning Book Value = ${rate}% × Book Value`,
      description: `The ${rate}% rate is applied to the declining book value each year. In later years, the method automatically switches to Straight-Line to ensure full depreciation to salvage value.`,
    };
  }
  const sydSum = (usefulLife * (usefulLife + 1)) / 2;
  return {
    formula: `(Remaining Life ÷ ${sydSum}) × (Cost − Salvage)`,
    description: `SYD Sum = ${usefulLife} × (${usefulLife} + 1) ÷ 2 = ${sydSum}. Year 1 uses fraction ${usefulLife}/${sydSum}, Year 2 uses ${usefulLife - 1}/${sydSum}, and so on, tapering the deduction each year.`,
  };
}

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

  const method = values.depreciationMethod || 'sl';
  const usefulLife = parseInt(values.usefulLife, 10) || schedule.length;
  const { formula, description } = getFormulaDisplay(method, usefulLife);

  const maxDep = Math.max(...schedule.map((r) => r.depreciationExpense));
  const chartHeight = 120;
  const barWidth = Math.max(20, Math.min(48, Math.floor(480 / schedule.length) - 6));
  const gap = 6;
  const chartWidth = schedule.length * (barWidth + gap);
  const totalDepreciation = schedule.reduce((s, r) => s + r.depreciationExpense, 0);

  const barColor: Record<string, string> = {
    sl: '#3b82f6',
    ddb: '#f59e0b',
    syd: '#10b981',
  };
  const badgeColor: Record<string, string> = {
    sl: 'bg-blue-100 text-blue-700 border-blue-200',
    ddb: 'bg-amber-100 text-amber-700 border-amber-200',
    syd: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden space-y-0">

      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <BarChart2 size={16} className="text-slate-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Depreciation Schedule &amp; Analysis
        </span>
        <span className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full border ${badgeColor[method] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          {getMethodLabel(method)}
        </span>
      </div>

      <div className="p-6 space-y-6">

        {/* Formula Box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Formula — {getMethodLabel(method)}
          </p>
          <p className="text-sm font-mono font-semibold text-slate-800 mb-2">{formula}</p>
          <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
        </div>

        {/* Bar Chart */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            Depreciation Expense by Year
          </p>
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
                      fill={barColor[method] ?? '#64748b'}
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
                  </g>
                );
              })}
              {/* Baseline */}
              <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e2e8f0" strokeWidth={1} />
            </svg>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Year numbers shown below each bar. Taller bars = larger deduction.</p>
        </div>

        {/* Schedule Table */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            Full Depreciation Schedule
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs min-w-[580px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Year</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Beginning Book Value</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Depreciation Expense</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Accumulated Depreciation</th>
                  <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Ending Book Value</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row, i) => (
                  <tr
                    key={row.year}
                    className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <td className="px-4 py-2.5 font-bold text-slate-700">Year {row.year}</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">${formatCurrency(row.beginningValue)}</td>
                    <td className={`px-3 py-2.5 text-right font-semibold ${method === 'sl' ? 'text-blue-600' : method === 'ddb' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      ${formatCurrency(row.depreciationExpense)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-500">${formatCurrency(row.accumulatedDepreciation)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-800">${formatCurrency(row.endingValue)}</td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="bg-slate-100 border-t-2 border-slate-300">
                  <td className="px-4 py-2.5 font-black text-slate-700 uppercase text-[10px] tracking-wider">Total</td>
                  <td className="px-3 py-2.5 text-right text-slate-500">—</td>
                  <td className={`px-3 py-2.5 text-right font-black ${method === 'sl' ? 'text-blue-700' : method === 'ddb' ? 'text-amber-700' : 'text-emerald-700'}`}>
                    ${formatCurrency(totalDepreciation)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-500">—</td>
                  <td className="px-4 py-2.5 text-right font-black text-slate-500">
                    ${formatCurrency(schedule[schedule.length - 1]?.endingValue ?? 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Method Comparison Note */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className={`rounded-xl border px-4 py-3 ${method === 'sl' ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Straight-Line</p>
            </div>
            <p className="text-[11px] text-slate-500">Equal annual deduction. Best for book/GAAP reporting. Simple and predictable.</p>
          </div>
          <div className={`rounded-xl border px-4 py-3 ${method === 'ddb' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Double Declining</p>
            </div>
            <p className="text-[11px] text-slate-500">Heaviest front-loading. Mirrors IRS MACRS for tax planning. Best for rapidly depreciating assets.</p>
          </div>
          <div className={`rounded-xl border px-4 py-3 ${method === 'syd' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Sum-of-Years' Digits</p>
            </div>
            <p className="text-[11px] text-slate-500">Moderate acceleration. Tapers more gradually than DDB. Good middle ground for tax vs. book.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
