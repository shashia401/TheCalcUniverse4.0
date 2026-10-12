import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import SvgLineChart from '../../../components/charts/SvgLineChart';

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

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;
const axisUsd = (n: number) =>
  n >= 1_000_000 ? `$${+(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${+(n / 1_000).toFixed(1)}K` : `$${n.toFixed(0)}`;

function getMethodLabel(method: string): string {
  if (method === 'straight-line') return 'Straight Line';
  return 'MACRS';
}

function getResultStr(results: CalculatorResult[], id: string): string {
  const r = results.find((x) => x.id === id);
  return r ? r.value : '$0';
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

  const method = values.method || 'straight-line';
  const isMacrs = method === 'macrs';
  const assetCost = parseFloat(values.assetCost) || 0;
  const annualOrFirstYear = getResultStr(results, 'annualDepreciation');
  const totalDepStr = getResultStr(results, 'totalDepreciation');

  const badgeColor = isMacrs ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200';
  const headerColor = isMacrs ? 'text-amber-800' : 'text-blue-800';

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
          <p className={`text-2xl font-black ${isMacrs ? 'text-amber-800' : 'text-blue-800'}`}>
            {annualOrFirstYear}
          </p>
          <p className={`text-xs ${headerColor} mt-1`}>
            Total depreciation over life: {totalDepStr}
          </p>
        </div>

        {/* Bar chart */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">
            Depreciation Expense by Year
          </p>
          <SvgBarChart
            data={schedule.map((r) => ({ label: `Yr ${r.year}`, value: r.depreciationExpense }))}
            height={160}
            color={isMacrs ? '#b45309' : '#2563eb'}
            format={axisUsd}
            ariaLabel={`Depreciation expense by year (${getMethodLabel(method)}): ${schedule.map((r) => `year ${r.year} ${usd(r.depreciationExpense)}`).join(', ')}`}
          />
        </div>

        {/* Asset value decline line graph */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">
            Asset Book Value Over Time
          </p>
          <SvgLineChart
            series={[
              {
                name: 'Book value',
                color: '#2563eb',
                points: [{ x: 0, y: assetCost }, ...schedule.map((s) => ({ x: s.year, y: s.bookValue }))],
              },
            ]}
            height={180}
            xFormat={(n) => (n === 0 ? 'Start' : `Yr ${n}`)}
            yFormat={axisUsd}
            ariaLabel={`Asset book value falls from ${usd(assetCost)} to ${usd(schedule[schedule.length - 1].bookValue)} over ${schedule.length} years`}
          />
        </div>

        {/* Schedule table */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">
            Year-by-Year Depreciation Schedule
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="Year-by-year depreciation schedule table">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className="text-left px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Year</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Depreciation</th>
                  <th scope="col" className="text-right px-3 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Accumulated</th>
                  <th scope="col" className="text-right px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Book Value</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row, i) => (
                  <tr
                    key={row.year}
                    className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <td className="px-4 py-2.5 font-bold text-slate-700">Year {row.year}</td>
                    <td className={`px-3 py-2.5 text-right font-semibold ${isMacrs ? 'text-amber-800' : 'text-blue-800'}`}>
                      ${formatCurrency(row.depreciationExpense)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-600">
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
              <div className="w-2 h-2 rounded-full bg-blue-600" aria-hidden="true" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Straight Line</p>
            </div>
            <p className="text-[11px] text-slate-600">Equal annual deduction on cost minus salvage. Simple and predictable. Best for book/GAAP financial reporting.</p>
          </div>
          <div className={`rounded-xl border px-4 py-3 ${isMacrs ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-600" aria-hidden="true" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">MACRS</p>
            </div>
            <p className="text-[11px] text-slate-600">Front-loaded deductions on the full cost (salvage ignored). Half-year convention. IRS-prescribed for most tangible property.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
