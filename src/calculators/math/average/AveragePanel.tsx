import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface AverageData {
  values: number[];
  mean: number;
  median: number;
}

const COLORS = ['#1d4ed8', '#047857', '#b45309', '#6d28d9', '#be185d', '#0e7490', '#c2410c', '#4d7c0f'];

export default function AveragePanel({ results }: Props) {
  const raw = results.find((r) => r.id === '_data');
  if (!raw) return null;
  let data: AverageData;
  try {
    data = JSON.parse(raw.value) as AverageData;
  } catch {
    return null;
  }
  const get = (id: string) => results.find((r) => r.id === id)?.value;
  const nums = data.values.filter((v) => Number.isFinite(v));
  const MAX_CHIPS = 200;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Summary Statistics</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Data chips */}
        {nums.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Parsed Data</p>
            <div className="flex flex-wrap gap-1.5">
              {nums.slice(0, MAX_CHIPS).map((v, i) => (
                <span key={`item-${i}`} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white text-slate-700 border border-slate-200">
                  {v}
                </span>
              ))}
              {nums.length > MAX_CHIPS && (
                <span className="text-xs text-slate-600 self-center">+{nums.length - MAX_CHIPS} more</span>
              )}
            </div>
          </div>
        )}

        {/* Bar chart */}
        {nums.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">
              Data Distribution{nums.length > 100 ? ' (first 100 values)' : ''}
            </p>
            <SvgBarChart
              ariaLabel={`Bar chart of ${Math.min(nums.length, 100)} values with mean ${get('mean')} and median ${get('median')}`}
              data={nums.slice(0, 100).map((v, i) => ({ label: `#${i + 1}`, value: v, color: COLORS[i % COLORS.length] }))}
              refLines={[
                { y: data.mean, label: `Mean: ${get('mean')}`, color: '#b91c1c' },
                { y: data.median, label: `Median: ${get('median')}`, color: '#1d4ed8' },
              ]}
            />
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-4 text-center">
            <p className="text-[10px] font-bold text-emerald-700 uppercase">Mean</p>
            <p className="text-lg font-bold font-mono text-emerald-700">{get('mean')}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
            <p className="text-[10px] font-bold text-blue-700 uppercase">Median</p>
            <p className="text-lg font-bold font-mono text-blue-700">{get('median')}</p>
          </div>
          {[
            ['Count', 'count'],
            ['Sum', 'sum'],
            ['Minimum', 'min'],
            ['Maximum', 'max'],
          ].map(([label, id]) => (
            <div key={id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-[10px] font-bold text-slate-600 uppercase">{label}</p>
              <p className="text-lg font-bold font-mono text-slate-700 break-all">{get(id)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
