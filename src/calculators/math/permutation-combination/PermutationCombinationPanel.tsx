import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import { computePermComb, countsForChart } from './permCombMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const BAR_COLORS = ['#93c5fd', '#6ee7b7', '#fcd34d', '#c4b5fd', '#f9a8d4', '#67e8f9', '#fdba74', '#bef264', '#a5b4fc', '#5eead4'];
const CHART_MAX_N = 20; // keep the bars readable

export default function PermutationCombinationPanel({ values, results }: Props) {
  const p = computePermComb(values.n, values.r, values.orderMatters, values.repetition);
  if (p.kind !== 'ok' || results.length === 0) return null;
  const { n, r, isPerm, repetition, formula, applied, cells } = p.result;

  const chartData = n <= CHART_MAX_N
    ? countsForChart(n, isPerm, repetition).map((v, i) => ({
        label: `${i}`,
        value: v,
        color: i === r ? '#6d28d9' : BAR_COLORS[i % BAR_COLORS.length],
      }))
    : [];
  const kind = isPerm ? (repetition ? 'n^r' : 'nPr') : (repetition ? 'C(n+r−1, r)' : 'nCr');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Formula &amp; Step-by-Step</span>
      </div>

      <div className="p-5 space-y-4">
        <div className={`rounded-xl border p-4 text-center ${isPerm ? 'border-blue-200 bg-blue-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Type</p>
          <p className={`text-lg font-bold ${isPerm ? 'text-blue-700' : 'text-emerald-700'}`}>
            {isPerm ? 'Permutation — Order Matters' : 'Combination — Order Does Not Matter'}
            {repetition ? ' (repetition allowed)' : ''}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            {isPerm
              ? 'Each different ordering counts as a unique arrangement.'
              : 'Different orderings of the same selection count as the same.'}
          </p>
        </div>

        {chartData.length > 2 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">
              {kind} for n = {n}
            </p>
            <SvgBarChart
              ariaLabel={`Bar chart of ${kind} for n = ${n} and r from 0 to ${n}; the selected r = ${r} is highlighted`}
              height={220}
              maxBarWidth={28}
              data={chartData}
              format={(v) => (v > 1e15 ? v.toExponential(4) : v.toLocaleString('en-US'))}
            />
            <p className="text-[10px] text-slate-600 text-center mt-1">
              x axis: r (items chosen). The purple bar (r = {r}) is the current selection.
            </p>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center">
          <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Formula</p>
          <p className="text-lg font-mono font-bold text-slate-700 break-all">{formula}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono text-slate-700 whitespace-pre-wrap break-all">
          <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Step-by-Step</p>
          <p>{applied}</p>
        </div>

        {cells.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {cells.map((c) => (
              <div key={c.label} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-600 uppercase">{c.label}</p>
                <p className="text-sm font-mono font-bold text-slate-700 mt-0.5 break-all">{c.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">Quick Comparison</p>
          <p className="text-xs text-amber-900 leading-relaxed">
            <strong>Permutations</strong> count arrangements where order matters (like passwords or race results).
            <br />
            <strong>Combinations</strong> count selections where order does not matter (like lottery tickets or committee members).
            <br />
            The combination formula divides by <strong>r!</strong> to remove duplicate orderings.
          </p>
        </div>
        
      </div>
    </div>
  );
}
