import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function evalPoly(coeffs: number[], x: number): number {
  // Horner's method
  let result = 0;
  for (const c of coeffs) result = result * x + c;
  return result;
}

export default function PolynomialPanel({ values, results }: Props) {
  const raw = values.coefficients?.trim();
  const x = parseFloat(values.x);
  if (!raw || isNaN(x)) return null;

  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const coeffs: number[] = [];
  for (const p of parts) {
    const n = parseFloat(p);
    if (isNaN(n)) return null;
    coeffs.push(n);
  }
  if (coeffs.length === 0) return null;

  const polyData = useMemo(() => {
    const degree = coeffs.length - 1;
    const range = Math.max(Math.abs(x) + 2, degree + 2, 3);
    const xMin = -range;
    const xMax = range;
    const points: { x: number; y: number }[] = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const px = xMin + (i / steps) * (xMax - xMin);
      const py = evalPoly(coeffs, px);
      points.push({ x: parseFloat(px.toFixed(4)), y: parseFloat(py.toFixed(4)) });
    }
    return points;
  }, [coeffs.join(','), x]);

  const polynomialRow = results.find((r) => r.id === 'polynomial');
  const evaluatedRow = results.find((r) => r.id === 'evaluated');
  const workRow = results.find((r) => r.id === 'work');
  const leadingRow = results.find((r) => r.id === 'leadingCoeff');

  if (!polynomialRow || !workRow) return null;

  const workLines = workRow.value.split('\n').filter(Boolean);
  const degree = coeffs.length - 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Step-by-Step Evaluation</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Polynomial card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-2">Polynomial</p>
          <p className="text-xl font-bold text-blue-700 font-mono">{polynomialRow.value}</p>
        </div>

        {/* Function graph */}
        {polyData.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Function Graph</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={polyData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} type="number" domain={['auto', 'auto']} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} type="number" domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} formatter={(_: unknown) => [parseFloat((_ as number).toFixed(4)), 'P(x)']} />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1} />
                {evaluatedRow && <ReferenceDot x={x} y={evalPoly(coeffs, x)} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} label={{ value: `(${x}, ${evaluatedRow.value})`, position: 'top', fontSize: 9, fill: '#ef4444', fontWeight: 'bold' }} />}
                <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Degree & Leading Coeff */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Degree</p>
            <p className="text-lg font-bold text-slate-700 mt-1">
              {degree}
              <span className="text-xs font-normal text-slate-500 ml-1">
                ({degree === 0 ? 'constant' : degree === 1 ? 'linear' : degree === 2 ? 'quadratic' : degree === 3 ? 'cubic' : degree === 4 ? 'quartic' : `degree ${degree}`})
            </span>
            </p>
          </div>
          {leadingRow && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Leading Coefficient</p>
              <p className="text-lg font-bold text-slate-700 mt-1">{leadingRow.value}</p>
            </div>
          )}
        </div>

        {/* Evaluated result */}
        {evaluatedRow && (
          <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 text-center">
            <p className="text-sm text-slate-500 mb-2">Evaluated Result</p>
            <p className="text-xl font-bold text-green-700 font-mono">
              {evaluatedRow.label} = {evaluatedRow.value}
            </p>
          </div>
        )}

        {/* Work steps */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Substitution Steps</p>

          {workLines.map((line, idx) => {
            // stable — static computation steps, never reordered
            let className = 'rounded-lg border px-4 py-2.5 ';
            let content: React.ReactNode;

            if (idx === 0) {
              className += 'bg-slate-50 border-slate-200';
              content = (
                <>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Step 1: Write the Polynomial</p>
                  <p className="text-xs font-mono text-slate-700 mt-1">{line}</p>
                </>
              );
            } else if (idx === workLines.length - 1) {
              // Final result
              className += 'bg-green-50 border-green-200';
              content = (
                <>
                  <p className="text-[10px] font-bold text-green-600 uppercase">
                    {workLines.length <= 3 ? 'Result' : 'Step 4: Final Result'}
                  </p>
                  <p className="text-xs font-mono text-green-800 mt-1 font-bold">{line}</p>
                </>
              );
            } else if (line.includes('×') || line.includes('=')) {
              // Substitution or intermediate result
              const stepNum = idx === 1 ? 2 : 3;
              const stepLabel = idx === 1 ? 'Substitute the Value' : 'Compute Each Term';
              className += 'bg-slate-50 border-slate-200';
              content = (
                <>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Step {stepNum}: {stepLabel}</p>
                  <p className="text-xs font-mono text-slate-700 mt-1">{line}</p>
                </>
              );
            } else {
              className += 'bg-white border-slate-100';
              content = <p className="text-xs font-mono text-slate-700">{line}</p>;
            }

            return (
              <div key={idx} className={className}>
                {content}
              </div>
            );
          })}
        </div>

        {/* Horner's Method info */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Computed Using Horner&apos;s Method</p>
          <p className="text-xs text-slate-600 mt-1">
            Horner&apos;s method (synthetic substitution) evaluates the polynomial using nested multiplication:
            P(x) = a₀ + x(a₁ + x(a₂ + ... + x(aₙ₋₁ + xaₙ)...)). This requires only {degree} multiplication{degree !== 1 ? 's' : ''} and {degree} addition{degree !== 1 ? 's' : ''},
            making it both faster and numerically more stable than computing each power of x separately.
          </p>
        </div>
      </div>
    </div>
  );
}
