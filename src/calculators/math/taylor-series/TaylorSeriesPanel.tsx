import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { CasError, evalNode, parse, taylorCoefficients } from '../shared/cas';
import { plotSamples } from '../shared/plotSamples';
import { MAX_ORDER, evalTaylor } from './taylorFormat';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function TaylorSeriesPanel({ values, results }: Props) {
  const approximation = results.find((r) => r.id === 'approximation');
  const terms = results.find((r) => r.id === 'terms');
  const numberOfTerms = results.find((r) => r.id === 'numberOfTerms');
  const evaluation = results.find((r) => r.id === 'evaluation');
  const actual = results.find((r) => r.id === 'actual');
  const error = results.find((r) => r.id === 'error');

  const expr = (values.expression || '').trim();
  const blank = (s?: string) => (s ?? '').trim() === '';
  const center = blank(values.center) ? 0 : parseNumberStrict(values.center);
  const order = blank(values.order) ? 5 : Math.min(parseNumberStrict(values.order), MAX_ORDER);

  // Plot the real function and its Taylor polynomial from the same exact coefficients the calculator used.
  const plot = useMemo(() => {
    if (!expr || !Number.isFinite(center) || !Number.isInteger(order) || order < 0) return null;
    try {
      const tree = parse(expr);
      const c = taylorCoefficients(tree, center, order);
      const range = Math.max(Math.abs(center) + 3, 3);
      return {
        original: plotSamples((x) => evalNode(tree, x), center - range, center + range),
        approx: plotSamples((x) => evalTaylor(c, center, x), center - range, center + range),
      };
    } catch (e) {
      if (e instanceof CasError) return null;
      throw e;
    }
  }, [expr, center, order]);

  if (!approximation || !terms) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Taylor Series Results</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-600 mb-1">{approximation.label}</p>
          <p className="text-lg font-bold text-blue-700 font-mono whitespace-pre-wrap break-all">{approximation.value}</p>
        </div>

        {plot && plot.original.length > 1 && plot.approx.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Original Function vs Taylor Approximation (center = {center})
            </p>
            <SvgLineChart
              height={280}
              ariaLabel={`Graph of f(x) = ${expr} (solid blue) and its degree ${order} Taylor polynomial about x = ${center} (dashed red)`}
              series={[
                { name: 'f(x)', color: '#2563eb', points: plot.original },
                { name: `Taylor P${order}(x)`, color: '#dc2626', dashed: true, points: plot.approx },
              ]}
              refLines={[
                { y: 0, color: '#cbd5e1', dashed: false },
                { x: center, color: '#7c3aed', label: `a = ${center}` },
              ]}
            />
            <div className="flex items-center justify-center gap-6 mt-2 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-blue-600 inline-block" />f(x) original
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 inline-block" style={{ borderTop: '2px dashed #dc2626', height: 0 }} />
                Taylor P<sub>n</sub>(x)
              </span>
            </div>
          </div>
        )}

        {evaluation && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center">
            <p className="text-sm text-slate-600 mb-1">{evaluation.label}</p>
            <p className="text-xl font-bold text-green-800 font-mono break-all">{evaluation.value}</p>
            {actual && error && (
              <p className="text-xs text-slate-600 mt-1">
                f = {actual.value}, error = {error.value}
              </p>
            )}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{terms.label}</p>
          <p className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-all">{terms.value}</p>
        </div>

        {numberOfTerms && (
          <div className="grid grid-cols-1 gap-2">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{numberOfTerms.label}</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{numberOfTerms.value}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
