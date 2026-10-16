import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface CorrData {
  r: number;
  r2: number;
  rho: number | null;
  p: number;
  n: number;
}

export default function CorrelationPanel({ results }: Props) {
  const r = results.find(x => x.id === 'r');
  const raw = results.find(x => x.id === '_data');
  const strength = results.find(x => x.id === 'strength');
  const direction = results.find(x => x.id === 'direction');
  const n = results.find(x => x.id === 'n');
  const pRow = results.find(x => x.id === 'pValue');
  const spearman = results.find(x => x.id === 'spearman');

  // No _data row means r was undefined (a constant variable): the result list already explains why.
  if (!r || !raw) return null;
  let data: CorrData;
  try {
    data = JSON.parse(raw.value) as CorrData;
  } catch {
    return null;
  }

  // Position on the -1 to +1 scale, 0 to 100%
  const pos = ((data.r + 1) / 2) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Correlation Summary</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Correlation scale bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-600">Correlation (r)</span>
            <span className="text-sm font-bold text-slate-700">{r.value}</span>
          </div>
          <div
            className="relative h-5 bg-gradient-to-r from-red-500 via-slate-200 to-emerald-500 rounded-full overflow-hidden"
            role="img"
            aria-label={`Correlation r = ${r.value} on a scale from -1 to +1`}
          >
            <div
              className="absolute top-0 w-0.5 h-full bg-slate-900 shadow-sm"
              style={{ left: `calc(${pos}% - 1px)` }}
            />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px] text-slate-600">-1</span>
            <span className="text-[10px] text-slate-600">0</span>
            <span className="text-[10px] text-slate-600">+1</span>
          </div>
        </div>

        {/* r² bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-600">r² (Coefficient of Determination)</span>
            <span className="text-xs font-bold text-slate-700">{parseFloat((data.r2 * 100).toFixed(2))}% of Y&apos;s variance explained</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden" role="img" aria-label={`r squared ${parseFloat(data.r2.toFixed(4))}`}>
            <div
              className="h-full rounded-full bg-indigo-600"
              style={{ width: `${Math.min(100, Math.max(0, data.r2 * 100))}%` }}
            />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            ['Strength', strength?.value],
            ['Direction', direction?.value],
            ['p-value', pRow?.value],
            ['Spearman ρ', spearman?.value],
            ['n', n?.value],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
              <p className="text-[10px] text-slate-600 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">{value ?? '-'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
