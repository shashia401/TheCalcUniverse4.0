import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { CasError, derivativeOrder, evalNode, parse } from '../shared/cas';
import { plotSamples } from '../shared/plotSamples';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function DerivativePanel({ values, results }: Props) {
  const expr = (values.expression || '').trim();
  const order = Math.min(4, Math.max(1, Number(values.order) || 1));
  const xv = parseNumberStrict(values.xValue);
  const derivativeResult = results.find((r) => r.id === 'derivative');
  const originalResult = results.find((r) => r.id === 'original');

  // Evaluate the parsed expression trees (no re-parsing of the printed result strings).
  const series = useMemo(() => {
    if (!expr) return null;
    try {
      const f = parse(expr);
      const d = derivativeOrder(f, order);
      const range = Math.max(Math.abs(Number.isFinite(xv) ? xv : 0) + 5, 5);
      return {
        f: plotSamples((x) => evalNode(f, x), -range, range),
        d: plotSamples((x) => evalNode(d, x), -range, range),
      };
    } catch (e) {
      if (e instanceof CasError) return null;
      throw e;
    }
  }, [expr, order, xv]);

  if (!expr || !derivativeResult || !originalResult) return null;
  const dLabel = `f${"'".repeat(order)}(x)`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Function &amp; Derivative Graph
        </span>
      </div>

      <div className="p-5 space-y-4">
        {series && series.f.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">f(x) vs {dLabel}</p>
            <SvgLineChart
              height={280}
              ariaLabel={`Graph of f(x) = ${originalResult.value} (solid blue) and its derivative ${dLabel} = ${derivativeResult.value} (dashed red)`}
              series={[
                { name: 'f(x)', color: '#2563eb', points: series.f },
                { name: dLabel, color: '#dc2626', dashed: true, points: series.d },
              ]}
              refLines={[{ x: 0, color: '#cbd5e1', dashed: false }, { y: 0, color: '#cbd5e1', dashed: false }]}
            />
            <div className="flex items-center justify-center gap-6 mt-2 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-blue-600 inline-block" />f(x)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 inline-block" style={{ borderTop: '2px dashed #dc2626', height: 0 }} />
                {dLabel} derivative
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-bold text-blue-800 uppercase">f(x)</p>
            <p className="text-sm font-mono font-bold text-blue-800 mt-0.5 break-all">{originalResult.value}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[10px] font-bold text-red-800 uppercase">{dLabel}</p>
            <p className="text-sm font-mono font-bold text-red-800 mt-0.5 break-all">{derivativeResult.value}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
