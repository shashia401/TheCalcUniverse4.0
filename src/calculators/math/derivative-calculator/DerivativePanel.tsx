import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { safeEval } from '../shared/safeEval';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function polyToEval(expr: string): string {
  // Insert * between a digit and x: "3x^2" → "3*x^2"
  return expr.replace(/(\d)(x)/g, '$1*$2');
}

export default function DerivativePanel({ values, results }: Props) {
  const expr = (values.expression || '').trim();
  if (!expr) return null;

  const derivativeResult = results.find((r) => r.id === 'derivative');
  const originalResult = results.find((r) => r.id === 'original');

  if (!derivativeResult || !originalResult) return null;

  const chartData = useMemo(() => {
    const xVal = values.xValue ? parseFloat(values.xValue) : 0;
    const range = Math.max(Math.abs(xVal) + 5, 5);
    const xMin = -range;
    const xMax = range;
    const steps = 80;

    const evalExpr = polyToEval(expr);
    const evalDeriv = polyToEval(derivativeResult.value);
    const data: { x: number; f: number | null; fPrime: number | null }[] = [];

    for (let i = 0; i <= steps; i++) {
      const x = parseFloat((xMin + (i / steps) * (xMax - xMin)).toFixed(4));
      let fVal: number | null = null;
      let fPrimeVal: number | null = null;
      try {
        fVal = safeEval(evalExpr, { x });
      } catch {
        /* ignore */
      }
      try {
        fPrimeVal = safeEval(evalDeriv, { x });
      } catch {
        /* ignore */
      }
      data.push({ x, f: fVal, fPrime: fPrimeVal });
    }
    return data;
  }, [expr, derivativeResult.value, values.xValue]);

  const hasValidData = chartData.some((d) => d.f !== null && d.fPrime !== null);

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
        {hasValidData && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              f(x) vs f&prime;(x)
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} type="number" domain={['auto', 'auto']} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={((_: unknown, name: string) => {
                    const label = name === 'f' ? 'f(x)' : "f'(x)";
                    return [typeof _ === 'number' ? _.toFixed(4) : _, label];
                  }) as any}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1} />
                <Line type="monotone" dataKey="f" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="f" activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="fPrime" stroke="#ef4444" strokeWidth={2} dot={false} name="fPrime" strokeDasharray="4 2" activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-2 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-blue-500 inline-block" />
                <span className="text-slate-500">f(x)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-red-500 inline-block" style={{ borderTop: '2px dashed #ef4444', height: 0 }} />
                <span className="text-slate-500">f&prime;(x) derivative</span>
              </span>
            </div>
          </div>
        )}

        {/* Result cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-bold text-blue-500 uppercase">f(x)</p>
            <p className="text-sm font-mono font-bold text-blue-700 mt-0.5 break-all">{originalResult.value}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[10px] font-bold text-red-500 uppercase">f&prime;(x)</p>
            <p className="text-sm font-mono font-bold text-red-700 mt-0.5 break-all">{derivativeResult.value}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
