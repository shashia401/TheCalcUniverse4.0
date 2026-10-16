import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface MmmData {
  sorted: number[];
  mean: number;
  median: number;
}

const COLORS = ['#1d4ed8', '#047857', '#b45309', '#6d28d9', '#be185d', '#0e7490', '#c2410c', '#4d7c0f'];
const MAX_CHIPS = 200;

export default function MeanMedianModePanel({ results }: Props) {
  const raw = results.find((r) => r.id === '_data');
  if (!raw) return null;
  let data: MmmData;
  try {
    data = JSON.parse(raw.value) as MmmData;
  } catch {
    return null;
  }
  const get = (id: string) => results.find((r) => r.id === id)?.value;
  const medianRow = get('median');
  const meanRow = get('mean');
  const modeRow = get('mode');
  const rangeRow = get('range');
  const sumRow = get('sum');
  const sorted = data.sorted;
  const count = sorted.length;
  if (count === 0) return null;
  const isEven = count % 2 === 0;
  const mid = Math.floor(count / 2);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Sorted Data &amp; Median Calculation</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Bar chart */}
        {count > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">
              Data Distribution (sorted){count > 100 ? ', first 100 values' : ''}
            </p>
            <SvgBarChart
              ariaLabel={`Bar chart of ${Math.min(count, 100)} sorted values with mean ${meanRow} and median ${medianRow}`}
              data={sorted.slice(0, 100).map((v, i) => ({ label: `${i + 1}`, value: v, color: COLORS[i % COLORS.length] }))}
              refLines={[
                { y: data.mean, label: `Mean: ${meanRow}`, color: '#b91c1c' },
                { y: data.median, label: `Median: ${medianRow}`, color: '#1d4ed8' },
              ]}
            />
          </div>
        )}

        {/* Sorted data visualization */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">
            Sorted Data ({count} values)
          </p>
          <div className="flex flex-wrap gap-1">
            {sorted.slice(0, MAX_CHIPS).map((val, i) => {
              const isMiddle = isEven ? i === mid - 1 || i === mid : i === mid;
              return (
                <span
                  key={`item-${i}`}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                    isMiddle ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {val}
                </span>
              );
            })}
            {count > MAX_CHIPS && <span className="text-xs text-slate-600 self-center">+{count - MAX_CHIPS} more</span>}
          </div>
        </div>

        {/* Median bracket for even datasets */}
        {isEven && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-2">
              Median Calculation (Even Dataset)
            </p>
            <div className="flex items-center justify-center gap-3 text-sm font-mono flex-wrap">
              <span className="px-3 py-1.5 bg-white rounded border border-blue-300 font-bold text-blue-700">{sorted[mid - 1]}</span>
              <span className="text-blue-700 text-lg">+</span>
              <span className="px-3 py-1.5 bg-white rounded border border-blue-300 font-bold text-blue-700">{sorted[mid]}</span>
              <span className="text-blue-700 text-lg">/ 2 =</span>
              <span className="px-3 py-1.5 bg-blue-700 text-white rounded font-bold">{medianRow}</span>
            </div>
            <p className="text-xs text-blue-700 text-center mt-2">
              With an even number of values, take the average of the two middle numbers
            </p>
          </div>
        )}

        {/* Odd dataset median highlight */}
        {!isEven && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2">Median (Odd Dataset)</p>
            <p className="text-sm font-mono font-bold text-emerald-700">
              The middle value at position {mid + 1} of {count}: <span className="text-lg">{medianRow}</span>
            </p>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-emerald-700 uppercase">Mean</p>
            <p className="text-sm font-bold font-mono text-emerald-700">{meanRow}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-blue-700 uppercase">Median</p>
            <p className="text-sm font-bold font-mono text-blue-700">{medianRow}</p>
          </div>
          {modeRow && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-purple-700 uppercase">Mode</p>
              <p className="text-sm font-bold font-mono text-purple-700 truncate" title={modeRow}>{modeRow}</p>
            </div>
          )}
          {rangeRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-600 uppercase">Range</p>
              <p className="text-sm font-bold font-mono text-slate-700">{rangeRow}</p>
            </div>
          )}
          {sumRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-600 uppercase">Sum</p>
              <p className="text-sm font-bold font-mono text-slate-700 break-all">{sumRow}</p>
            </div>
          )}
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Count</p>
            <p className="text-sm font-bold font-mono text-slate-700">{count}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
