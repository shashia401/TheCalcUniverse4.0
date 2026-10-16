import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface SdData {
  values: number[];
  mean: number;
  ss: number;
  variance: number;
  stdDev: number;
  median: number;
  modes: number[];
  modeCount: number;
  cv: number | null;
  sample: boolean;
}

const COLORS = ['#1d4ed8', '#047857', '#b45309', '#6d28d9', '#be185d', '#0e7490', '#c2410c', '#4d7c0f'];
const fmt = (x: number) => (Number.isFinite(x) ? parseFloat(x.toPrecision(10)).toString() : '—');

export default function StandardDeviationPanel({ results }: Props) {
  const raw = results.find((r) => r.id === '_data');
  if (!raw) return null;
  let d: SdData;
  try {
    d = JSON.parse(raw.value) as SdData;
  } catch {
    return null;
  }
  const nums = d.values;
  const n = nums.length;
  if (n < 2) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const dataTypeLabel = d.sample ? 'Sample (n−1)' : 'Population (N)';
  const divisor = d.sample ? n - 1 : n;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Full Statistical Breakdown</span>
        <span className="ml-auto text-[10px] font-bold text-slate-600">{dataTypeLabel} · n = {n}</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Distribution chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">
            Data Distribution with Standard Deviation{n > 100 ? ' (first 100 values)' : ''}
          </p>
          <SvgBarChart
            ariaLabel={`Bar chart of ${Math.min(n, 100)} values with mean ${fmt(d.mean)} and one standard deviation (${fmt(d.stdDev)}) above and below`}
            data={nums.slice(0, 100).map((v, i) => ({ label: `#${i + 1}`, value: v, color: COLORS[i % COLORS.length] }))}
            refLines={[
              { y: d.mean, label: `Mean: ${fmt(d.mean)}`, color: '#b91c1c' },
              { y: d.mean + d.stdDev, label: `+1σ: ${fmt(d.mean + d.stdDev)}`, color: '#b45309' },
              { y: d.mean - d.stdDev, label: `−1σ: ${fmt(d.mean - d.stdDev)}`, color: '#b45309' },
            ]}
          />
        </div>

        {/* Step 1: Data sorted */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-600 uppercase">Data Set (sorted)</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {sorted.slice(0, 200).map((v, i) => (
              <span key={`item-${i}`} className="inline-block px-2 py-0.5 bg-white rounded border border-slate-200 text-xs font-mono text-slate-700">
                {fmt(v)}
              </span>
            ))}
            {n > 200 && <span className="text-xs text-slate-600 self-center">+{n - 200} more</span>}
          </div>
        </div>

        {/* Step 2: Mean */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-600 uppercase">Step 1: Calculate the Mean (x̄)</p>
          <p className="text-xs font-mono text-slate-700 mt-1 break-words">
            {n <= 20 ? `x̄ = (${nums.map(fmt).join(' + ')}) ÷ ${n} = ${fmt(d.mean)}` : `x̄ = Σx ÷ ${n} = ${fmt(d.mean)}`}
          </p>
        </div>

        {/* Step 3: Deviation table */}
        {n <= 20 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Step 2: Deviations &amp; Squared Deviations</p>
            <p className="text-[10px] text-slate-600 mt-1 mb-2">Table of (xᵢ − x̄) and (xᵢ − x̄)²</p>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Deviations and squared deviations table">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-slate-600 border-b border-slate-200">
                    <th scope="col" className="text-left py-1 pr-2">i</th>
                    <th scope="col" className="text-right px-2">xᵢ</th>
                    <th scope="col" className="text-right px-2">xᵢ − x̄</th>
                    <th scope="col" className="text-right px-2">(xᵢ − x̄)²</th>
                  </tr>
                </thead>
                <tbody>
                  {nums.map((v, i) => (
                    <tr key={`item-${i}`} className="border-b border-slate-100 text-slate-700">
                      <td className="text-slate-600 py-1 pr-2">{i + 1}</td>
                      <td className="text-right px-2">{fmt(v)}</td>
                      <td className="text-right px-2">{fmt(v - d.mean)}</td>
                      <td className="text-right px-2 font-bold text-blue-700">{fmt((v - d.mean) ** 2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-300 font-bold text-slate-800">
                    <td className="py-1 pr-2" colSpan={3}>Σ(xᵢ − x̄)²</td>
                    <td className="text-right px-2 text-blue-700">{fmt(d.ss)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Step 2: Sum of Squared Deviations</p>
            <p className="text-xs font-mono text-slate-700 mt-1">Σ(xᵢ − x̄)² = {fmt(d.ss)}</p>
            <p className="text-[10px] text-slate-600 mt-1">(Too many data points to list individually)</p>
          </div>
        )}

        {/* Step 4: Variance */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-600 uppercase">Step 3: Variance</p>
          <p className="text-xs font-mono text-slate-700 mt-1">
            {d.sample ? 's²' : 'σ²'} = {fmt(d.ss)} ÷ {d.sample ? '(n − 1)' : 'n'} = {fmt(d.ss)} ÷ {divisor} = {fmt(d.variance)}
          </p>
        </div>

        {/* Step 5: SD */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-[10px] font-bold text-blue-700 uppercase">Step 4: Standard Deviation</p>
          <p className="text-sm font-bold text-blue-700 mt-1">
            {d.sample ? 's' : 'σ'} = √({fmt(d.variance)}) = {fmt(d.stdDev)}
          </p>
        </div>

        {/* Summary statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ['Mean', fmt(d.mean)],
            ['Median', fmt(d.median)],
            ['Min / Max', `${fmt(sorted[0])} / ${fmt(sorted[n - 1])}`],
            ['CV', d.cv === null ? 'Undefined' : `${d.cv.toFixed(2)}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-600 uppercase">{label}</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5 break-words">{value}</p>
            </div>
          ))}
        </div>

        {/* Mode indicator */}
        {d.modes.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Mode{d.modes.length > 1 ? 's (multimodal)' : ''}
            </p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              {d.modes.slice(0, 3).map((v) => `${fmt(v)} (×${d.modeCount})`).join(', ')}
              {d.modes.length > 3 ? ` +${d.modes.length - 3} more` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
