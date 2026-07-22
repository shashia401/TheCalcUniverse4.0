import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { safeEval } from '../shared/safeEval';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

/** Convert a Taylor polynomial string to a safeEval-compatible expression */
function approxToEval(poly: string): string {
  // Replace middle-dot multiplication with asterisk
  return poly.replace(/·/g, '*');
}

export default function TaylorSeriesPanel({ values, results }: Props) {
  const approximation = results.find((r) => r.id === 'approximation');
  const terms = results.find((r) => r.id === 'terms');
  const numberOfTerms = results.find((r) => r.id === 'numberOfTerms');
  const evaluation = results.find((r) => r.id === 'evaluation');

  if (!approximation || !terms) return null;

  const expr = (values.expression || '').trim();
  const center = values.center !== undefined && values.center !== ''
    ? parseFloat(values.center)
    : 0;
  const xVal = values.xValue !== undefined && values.xValue !== ''
    ? parseFloat(values.xValue)
    : undefined;

  // Generate chart data comparing original function vs Taylor approximation
  const chartData = useMemo(() => {
    if (!expr) return [];

    const range = Math.max(Math.abs(center) + 3, 3);
    const xMin = center - range;
    const xMax = center + range;
    const steps = 80;
    const data: { x: number; original: number | null; approx: number | null }[] = [];

    const approxExpr = approxToEval(approximation.value);

    for (let i = 0; i <= steps; i++) {
      const x = parseFloat((xMin + (i / steps) * (xMax - xMin)).toFixed(4));
      let original: number | null = null;
      let approx: number | null = null;

      try {
        original = safeEval(expr, { x });
        if (!isFinite(original)) original = null;
      } catch {
        // Ignore evaluation errors
      }

      try {
        approx = safeEval(approxExpr, { x });
        if (!isFinite(approx)) approx = null;
      } catch {
        // Ignore evaluation errors
      }

      data.push({ x, original, approx });
    }
    return data;
  }, [expr, center, approximation.value]);

  const hasValidChart = chartData.length > 0 && chartData.some((d) => d.original !== null && d.approx !== null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Taylor Series Results
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Approximation */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-1">{approximation.label}</p>
          <p className="text-lg font-bold text-blue-700 font-mono whitespace-pre-wrap break-all">{approximation.value}</p>
        </div>

        {/* Chart: Original vs Approximation */}
        {hasValidChart && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Original Function vs Taylor Approximation (center = {center})
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} type="number" domain={['auto', 'auto']} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={((_: unknown, name: string) => {
                    const label = name === 'original' ? 'f(x)' : 'Approximation';
                    return [typeof _ === 'number' ? _.toFixed(6) : _, label];
                  }) as any}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                <ReferenceLine x={center} stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 2" label={{ value: `Center (${center})`, position: 'top', fontSize: 9, fill: '#8b5cf6' }} />
                <Line type="monotone" dataKey="original" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="original" activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="approx" stroke="#ef4444" strokeWidth={2} dot={false} name="approx" strokeDasharray="4 2" activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-2 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-blue-500 inline-block" />
                <span className="text-slate-500">f(x) original</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-red-500 inline-block" style={{ borderTop: '2px dashed #ef4444', height: 0 }} />
                <span className="text-slate-500">Taylor P<sub>n</sub>(x)</span>
              </span>
            </div>
          </div>
        )}

        {/* Evaluation */}
        {evaluation && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center">
            <p className="text-sm text-slate-500 mb-1">{evaluation.label}</p>
            <p className="text-xl font-bold text-green-700 font-mono">{evaluation.value}</p>
          </div>
        )}

        {/* Terms */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{terms.label}</p>
          <p className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-all">{terms.value}</p>
        </div>

        {/* Term count */}
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
