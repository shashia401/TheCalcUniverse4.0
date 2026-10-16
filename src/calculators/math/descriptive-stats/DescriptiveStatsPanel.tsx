import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function DescriptiveStatsPanel({ results }: Props) {
  const raw = results.find(r => r.id === '_data');
  const count = results.find(r => r.id === 'count');
  const mean = results.find(r => r.id === 'mean');
  const median = results.find(r => r.id === 'median');
  const mode = results.find(r => r.id === 'mode');
  const range = results.find(r => r.id === 'range');
  const minmax = results.find(r => r.id === 'minmax');
  const quartiles = results.find(r => r.id === 'quartiles');
  const variance = results.find(r => r.id === 'variance');

  if (!mean || !median || !raw) return null;

  let meanVal = 0;
  let medianVal = 0;
  let sd = 0;
  try {
    ({ mean: meanVal, median: medianVal, sd } = JSON.parse(raw.value) as { mean: number; median: number; sd: number });
  } catch {
    return null;
  }
  // Mean-median gap in standard deviations (Pearson's second skewness coefficient / 3): within 0.1 SD reads as symmetric.
  const gap = sd > 0 ? (meanVal - medianVal) / sd : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Summary Statistics</span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Mean (x̄)" value={mean.value} />
          <StatCard label="Median" value={median.value} />
          <StatCard label="Mode" value={mode?.value ?? '-'} />
          <StatCard label="Range" value={range?.value ?? '-'} />
          <StatCard label="Min / Max" value={minmax?.value ?? '-'} />
          <StatCard label="Q1 / Q3 / IQR" value={quartiles?.value ?? '-'} />
        </div>

        {/* Variance / Std Dev bar if available */}
        {variance && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-indigo-50 px-4 py-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Dispersion</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">{variance.value}</p>
          </div>
        )}

        {/* Skew indicator */}
        {mean && median && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Distribution Shape</p>
            <p className="text-sm text-slate-700 mt-0.5">
              {Math.abs(gap) < 0.1
                ? 'Approximately symmetric (mean within 0.1 SD of the median)'
                : gap > 0
                  ? 'Right-skewed (positive skew)'
                  : 'Left-skewed (negative skew)'}
            </p>
          </div>
        )}

        {count && (
          <p className="mt-3 text-xs text-slate-600 text-center">
            Count / Sum: {count.value}
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">{label}</p>
      <p className="text-sm font-bold text-slate-700 mt-0.5 break-all">{value}</p>
    </div>
  );
}
