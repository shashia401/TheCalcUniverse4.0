import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function findResult(results: CalculatorResult[], id: string): CalculatorResult | undefined {
  return results.find((r) => r.id === id);
}

function ParabolaSVG({ a, b, c }: { a: number; b: number; c: number }) {
  if (a === 0) return null;

  const width = 480;
  const height = 300;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const cx = padL + chartW / 2;
  const cy = padT + chartH / 2;

  const vertexX = -b / (2 * a);
  const vertexY = c - (b * b) / (4 * a);

  // Determine reasonable x range, centered on vertex
  const discriminant = b * b - 4 * a * c;
  const xRange = discriminant > 0
    ? Math.max(Math.sqrt(discriminant) / Math.abs(a) * 1.5, 4)
    : 4;

  const xMin = vertexX - xRange;
  const xMax = vertexX + xRange;

  // Scale to fit in chart area
  const scaleX = chartW / (xMax - xMin);
  const scaleY = chartH / (Math.max(Math.abs(vertexY) + 2, 4) * 2);

  const toCanvasX = (x: number) => cx + (x - (xMin + xMax) / 2) * scaleX;
  const toCanvasY = (y: number) => cy - y * scaleY;

  // Generate parabola path
  const steps = 60;
  const pathPoints: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = xMin + t * (xMax - xMin);
    const y = a * x * x + b * x + c;
    const px = toCanvasX(x);
    const py = toCanvasY(y);
    pathPoints.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  const parabolaPath = pathPoints.join(' ');

  // Roots
  let root1: number | null = null;
  let root2: number | null = null;
  if (discriminant > 0) {
    root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
  } else if (discriminant === 0) {
    root1 = -b / (2 * a);
  }

  // Grid lines
  const gridX = () => {
    const lines: number[] = [];
    const step = xRange > 10 ? Math.ceil(xRange / 5) : Math.max(1, Math.ceil(1 / Math.ceil(1 / xRange)));
    const start = Math.ceil(xMin / step) * step;
    for (let x = start; x <= xMax; x += step) {
      lines.push(x);
    }
    return lines;
  };

  const gridY = () => {
    const yRange = Math.abs(vertexY) + 2;
    const lines: number[] = [];
    const step = yRange > 10 ? Math.ceil(yRange / 5) : Math.max(1, Math.ceil(1 / Math.ceil(1 / yRange)));
    const start = Math.ceil(-yRange / step) * step;
    for (let y = start; y <= yRange; y += step) {
      if (y !== 0) lines.push(y);
    }
    return lines;
  };

  // Y-axis (x = 0 in canvas coords)
  const yAxisX = toCanvasX(0);
  const isYAxisVisible = yAxisX >= padL && yAxisX <= padL + chartW;
  const xAxisY = toCanvasY(0);
  const isXAxisVisible = xAxisY >= padT && xAxisY <= padT + chartH;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px', maxHeight: '300px' }} role="img" aria-label="Parabola plot">
      {/* Grid lines */}
      {gridX().map((x) => {
        const px = toCanvasX(x);
        if (px < padL || px > padL + chartW) return null;
        return (
          <g key={`gx-${x}`}>
            <line x1={px} y1={padT} x2={px} y2={padT + chartH} stroke="#e2e8f0" strokeWidth={0.5} />
            <text x={px} y={padT + chartH + 14} textAnchor="middle" fontSize={9} fill="#94a3b8">{x}</text>
          </g>
        );
      })}
      {gridY().map((y) => {
        const py = toCanvasY(y);
        if (py < padT || py > padT + chartH) return null;
        return (
          <g key={`gy-${y}`}>
            <line x1={padL} y1={py} x2={padL + chartW} y2={py} stroke="#e2e8f0" strokeWidth={0.5} />
            <text x={padL - 4} y={py} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">{y}</text>
          </g>
        );
      })}

      {/* Axes */}
      {isXAxisVisible && (
        <line x1={padL} y1={xAxisY} x2={padL + chartW} y2={xAxisY} stroke="#94a3b8" strokeWidth={1} />
      )}
      {isYAxisVisible && (
        <line x1={yAxisX} y1={padT} x2={yAxisX} y2={padT + chartH} stroke="#94a3b8" strokeWidth={1} />
      )}

      {/* Parabola */}
      <path d={parabolaPath} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" />

      {/* Vertex */}
      <circle cx={toCanvasX(vertexX)} cy={toCanvasY(vertexY)} r={4} fill="#8b5cf6" stroke="white" strokeWidth={1.5} />
      <text x={toCanvasX(vertexX)} y={toCanvasY(vertexY) - 10} textAnchor="middle" fontSize={10} fill="#8b5cf6" fontWeight="bold">
        Vertex
      </text>

      {/* Roots */}
      {root1 !== null && (
        <g>
          <circle cx={toCanvasX(root1)} cy={xAxisY || toCanvasY(0)} r={4} fill="#ef4444" stroke="white" strokeWidth={1.5} />
          <text x={toCanvasX(root1)} y={(xAxisY || toCanvasY(0)) + 18} textAnchor="middle" fontSize={10} fill="#ef4444" fontWeight="bold">
            x = {root1.toFixed(3)}
          </text>
        </g>
      )}
      {root2 !== null && (
        <g>
          <circle cx={toCanvasX(root2)} cy={xAxisY || toCanvasY(0)} r={4} fill="#ef4444" stroke="white" strokeWidth={1.5} />
          <text x={toCanvasX(root2)} y={(xAxisY || toCanvasY(0)) + 34} textAnchor="middle" fontSize={10} fill="#ef4444" fontWeight="bold">
            x = {root2.toFixed(3)}
          </text>
        </g>
      )}
    </svg>
  );
}

export default function EquationSolverPanel({ values, results }: Props) {
  if (!results || results.length === 0) return null;

  const hasError = results.some((r) => r.id === 'error');
  if (hasError) return null;

  const equationType = values.equationType || 'linear';
  const a = parseFloat(values.a || 'NaN');
  const b = parseFloat(values.b || 'NaN');
  const c = equationType === 'quadratic' ? parseFloat(values.c || 'NaN') : 0;
  const discriminant = b * b - 4 * a * c;

  const equationResult = findResult(results, 'equation');
  const discriminantResult = findResult(results, 'discriminant');
  const root1Result = findResult(results, 'root1');
  const root2Result = findResult(results, 'root2');
  const natureResult = findResult(results, 'nature');


  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
          <path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Equation Visualization</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Equation */}
        {equationResult && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Equation</p>
            <p className="text-lg font-bold text-slate-800 font-mono">{equationResult.value}</p>
          </div>
        )}

        {/* Parabola visualization (quadratic only) */}
        {equationType === 'quadratic' && !isNaN(a) && a !== 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Graph: y = {a}x² + {b}x + {c}
            </p>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <ParabolaSVG a={a} b={b} c={c} />
            </div>
          </div>
        )}

        {/* Discriminant card */}
        {discriminantResult && (
          <div className={`rounded-xl border px-5 py-4 ${
            discriminant > 0
              ? 'bg-emerald-50 border-emerald-200'
              : discriminant === 0
              ? 'bg-amber-50 border-amber-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Discriminant (&Delta; = b&sup2; &minus; 4ac)</p>
            <p className={`text-2xl font-black font-mono ${
              discriminant > 0 ? 'text-emerald-600' : discriminant === 0 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {discriminantResult.value}
            </p>
            <p className={`text-xs mt-1 ${
              discriminant > 0 ? 'text-emerald-600' : discriminant === 0 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {natureResult?.value || ''}
            </p>
          </div>
        )}

        {/* Roots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {root1Result && (
            <div className={`rounded-lg border px-4 py-3 ${
              discriminant > 0
                ? 'bg-emerald-50 border-emerald-200'
                : discriminant === 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{root1Result.label}</p>
              <p className="text-lg font-bold text-slate-800 font-mono">{root1Result.value}</p>
            </div>
          )}
          {root2Result && (
            <div className={`rounded-lg border px-4 py-3 ${
              discriminant > 0
                ? 'bg-emerald-50 border-emerald-200'
                : discriminant === 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{root2Result.label}</p>
              <p className="text-lg font-bold text-slate-800 font-mono">{root2Result.value}</p>
            </div>
          )}
        </div>

        {/* Linear equation result */}
        {equationType === 'linear' && root1Result && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Solution</p>
            <p className="text-xl font-black text-emerald-700 font-mono">{root1Result.value}</p>
            <p className="text-xs text-emerald-600 mt-1">{natureResult?.value || 'One real root'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
