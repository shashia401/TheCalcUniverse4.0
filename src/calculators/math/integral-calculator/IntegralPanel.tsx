import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { CasError, evalNode, parse } from '../shared/cas';
import { plotSamples } from '../shared/plotSamples';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function IntegralPanel({ values, results }: Props) {
  const expr = (values.expression || '').trim();
  const a = parseNumberStrict(values.lowerBound);
  const b = parseNumberStrict(values.upperBound);
  const valid = !!expr && Number.isFinite(a) && Number.isFinite(b) && a !== b;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);

  const points = useMemo(() => {
    if (!valid) return [];
    try {
      const tree = parse(expr);
      return plotSamples((x) => evalNode(tree, x), lo, hi, 120);
    } catch (e) {
      if (e instanceof CasError) return [];
      throw e;
    }
  }, [valid, expr, lo, hi]);

  const resultRow = results.find((r) => r.id === 'result');
  if (!valid) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Area Under the Curve</span>
      </div>

      <div className="p-5 space-y-4">
        {points.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              f(x) from x = {+lo.toPrecision(6)} to x = {+hi.toPrecision(6)}
            </p>
            <SvgLineChart
              height={280}
              ariaLabel={`Graph of f(x) = ${expr} between x = ${+lo.toPrecision(6)} and x = ${+hi.toPrecision(6)}; the definite integral is ${resultRow?.value ?? ''}`}
              series={[{ name: 'f(x)', color: '#2563eb', points }]}
              refLines={[
                { y: 0, color: '#cbd5e1', dashed: false },
                { x: lo, label: 'a', color: '#b91c1c' },
                { x: hi, label: 'b', color: '#b91c1c' },
              ]}
            />
          </div>
        )}

        {resultRow && (
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5 text-center">
            <p className="text-sm text-slate-600 mb-1 break-words">{resultRow.label}</p>
            <p className="text-2xl font-bold text-blue-700 font-mono break-all">{resultRow.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
