import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { CasError, evalNode, parse } from '../shared/cas';
import { plotSamples } from '../shared/plotSamples';
import { sideLimit } from './limitMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function LimitPanel({ values, results }: Props) {
  const expr = (values.expression || '').trim();
  const target = parseNumberStrict(values.approachValue);
  const valid = !!expr && Number.isFinite(target);

  const plot = useMemo(() => {
    if (!valid) return null;
    try {
      const tree = parse(expr);
      const f = (x: number) => evalNode(tree, x);
      const range = Math.max(Math.abs(target) * 0.5, 3);
      // Skip the approach point itself (it may be undefined), then draw left and right branches.
      const pts = plotSamples((x) => (Math.abs(x - target) < 1e-9 ? NaN : f(x)), target - range, target + range, 200);
      // The limit marker is recomputed from the expression (not parsed back out of the formatted result text).
      const l = sideLimit(f, target, -1);
      const r = sideLimit(f, target, 1);
      const y = l.kind === 'value' && r.kind === 'value' && Math.abs(l.value - r.value) < 1e-6 * Math.max(1, Math.abs(l.value)) ? (l.value + r.value) / 2 : null;
      return { pts, y };
    } catch (e) {
      if (e instanceof CasError) return null;
      throw e;
    }
  }, [valid, expr, target]);

  const limitRow = results.find((r) => r.id === 'limit');
  if (!valid) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Limit Visualization</span>
      </div>

      <div className="p-5 space-y-4">
        {plot && plot.pts.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">f(x) as x → {+target.toPrecision(8)}</p>
            <SvgLineChart
              height={280}
              ariaLabel={`Graph of f(x) = ${expr} near x = ${+target.toPrecision(8)}. ${limitRow ? `Limit: ${limitRow.value}.` : ''}`}
              series={[{ name: 'f(x)', color: '#2563eb', points: plot.pts }]}
              refLines={[
                { y: 0, color: '#cbd5e1', dashed: false },
                { x: target, color: '#b91c1c', label: `x = ${+target.toPrecision(6)}` },
              ]}
              dots={plot.y !== null ? [{ x: target, y: plot.y, label: `Limit ${+plot.y.toPrecision(6)}`, color: '#7c3aed' }] : []}
            />
            <p className="text-[11px] text-slate-600 text-center mt-1">
              The purple dot marks the limit value when it exists; the dashed red line marks x = {+target.toPrecision(6)}.
            </p>
          </div>
        )}

        {limitRow && (
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5 text-center">
            <p className="text-sm text-slate-600 mb-1 break-words">{limitRow.label}</p>
            <p className="text-2xl font-bold text-blue-700 break-words">{limitRow.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
