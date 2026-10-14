import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { compensatedSum, fmtTermValue, runSeries } from './seriesMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const COLORS = ['#2563eb', '#059669', '#b45309', '#7c3aed', '#be185d', '#0e7490', '#c2410c', '#4d7c0f'];

export default function SeriesPanel({ values, results }: Props) {
  const out = runSeries(values.start, values.end, values.expression);
  if (out.kind !== 'ok' || results.length === 0) return null;
  const { run } = out;

  const shown = run.terms.slice(0, 20);
  let running: number[] = [];
  const cumulative = shown.map((_, i) => {
    running = shown.slice(0, i + 1);
    return compensatedSum(running);
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Series Sum Results</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 text-center">
          <p className="text-sm text-slate-600 mb-1">Sum of Series</p>
          <p className="text-3xl font-bold text-emerald-700 font-mono break-all">{fmtTermValue(run.sum)}</p>
        </div>

        {run.truncated && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
            Only terms n = {run.start} to {run.end} were summed (the calculator sums at most 10,000 terms); you asked for n up to {run.requestedEnd}.
          </p>
        )}

        {shown.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Term Values (first {shown.length})</p>
            <SvgBarChart
              ariaLabel={`Bar chart of the first ${shown.length} terms of the series, from n = ${run.start}`}
              height={180}
              maxBarWidth={24}
              data={shown.map((v, i) => ({ label: `${run.start + i}`, value: v, color: COLORS[i % COLORS.length] }))}
              format={fmtTermValue}
            />
            <p className="text-[10px] text-slate-600 text-center mt-1">x axis: n</p>
          </div>
        )}

        {cumulative.length > 2 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Cumulative Sum (first {cumulative.length} terms)</p>
            <SvgLineChart
              ariaLabel={`Line chart of the running total of the first ${cumulative.length} terms; the sum so far reaches ${fmtTermValue(cumulative[cumulative.length - 1])}`}
              height={180}
              series={[{ name: 'Cumulative sum', color: '#047857', points: cumulative.map((y, i) => ({ x: run.start + i, y })) }]}
              refLines={run.count <= shown.length ? [{ y: run.sum, label: `Total: ${fmtTermValue(run.sum)}`, color: '#047857' }] : []}
              xFormat={(v) => `${v}`}
            />
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">First 20 Terms</p>
          <p className="text-sm font-mono text-slate-700 whitespace-pre-wrap break-all">{shown.map(fmtTermValue).join(', ')}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Number of Terms</p>
            <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{run.count}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Last Term Value</p>
            <p className="text-sm font-mono font-bold text-slate-700 mt-0.5 break-all">{fmtTermValue(run.last)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Expression Reference</p>
          <div className="p-2 bg-white rounded border border-slate-200 text-[11px]">
            <p className="font-bold text-slate-700">Use n as the variable</p>
            <p className="text-slate-600">e.g., 1/n, 2^n, n^2, 1/(n+1), (-1)^n/(2*n+1)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
