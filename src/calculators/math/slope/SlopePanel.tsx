import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function SlopePanel({ values, results }: Props) {
  const x1 = parseFloat(values.x1);
  const y1 = parseFloat(values.y1);
  const x2 = parseFloat(values.x2);
  const y2 = parseFloat(values.y2);
  if ([x1, y1, x2, y2].some(isNaN)) return null;

  const slopeRow = results.find(r => r.id === 'slope');
  const siRow = results.find(r => r.id === 'slopeIntercept');
  const psRow = results.find(r => r.id === 'pointSlope');
  const sfRow = results.find(r => r.id === 'standardForm');
  const distRow = results.find(r => r.id === 'distance');
  const yiRow = results.find(r => r.id === 'yIntercept');
  const dirRow = results.find(r => r.id === 'direction');

  const dx = x2 - x1;
  const dy = y2 - y1;
  const m = dx !== 0 ? dy / dx : Infinity;
  const isVertical = dx === 0;

  // SVG plot
  const padding = 40;
  const svgW = 480;
  const svgH = 440;

  // Determine view range
  const allX = [x1, x2, 0];
  const allY = [y1, y2, 0];
  let minX = Math.min(...allX);
  let maxX = Math.max(...allX);
  let minY = Math.min(...allY);
  let maxY = Math.max(...allY);

  // Extend range to include y-intercept if visible
  if (!isVertical) {
    const b = y1 - m * x1;
    if (b >= minY && b <= maxY) {
      // y-intercept already in range
    }
    // Also extend to show some of the line beyond points
    const rangeX = maxX - minX || 2;
    const rangeY = maxY - minY || 2;
    const extendX = rangeX * 0.5;
    const extendY = rangeY * 0.5;
    minX -= extendX;
    maxX += extendX;
    minY -= extendY;
    maxY += extendY;
  } else {
    // For vertical line, show ± around x
    const range = maxX - minX || 2;
    minX -= range * 0.5;
    maxX += range * 0.5;
    minY -= range * 2;
    maxY += range * 2;
  }

  // Ensure axes are visible
  if (minX > -2) minX = Math.min(minX, -1);
  if (maxX < 2) maxX = Math.max(maxX, 1);
  if (minY > -2) minY = Math.min(minY, -1);
  if (maxY < 2) maxY = Math.max(maxY, 1);

  // Map function
  const xScale = (svgW - padding * 2) / (maxX - minX);
  const yScale = (svgH - padding * 2) / (maxY - minY);
  const scale = Math.min(xScale, yScale);

  const cx = (v: number) => padding + (v - minX) * scale;
  const cy = (v: number) => (svgH - padding) - (v - minY) * scale;

  // Grid lines (rounded intervals)
  const xStep = Math.pow(10, Math.floor(Math.log10((maxX - minX) / 6)));
  const yStep = Math.pow(10, Math.floor(Math.log10((maxY - minY) / 6)));
  const xGridMin = Math.ceil(minX / xStep) * xStep;
  const xGridMax = Math.floor(maxX / xStep) * xStep;
  const yGridMin = Math.ceil(minY / yStep) * yStep;
  const yGridMax = Math.floor(maxY / yStep) * yStep;

  // Line points for SVG polyline
  const linePoints: string[] = [];
  if (!isVertical) {
    const xStart = Math.min(minX, maxX);
    const xEnd = Math.max(minX, maxX);
    for (let x = xStart; x <= xEnd; x += (xEnd - xStart) / 100) {
      const y = m * x + (y1 - m * x1);
      linePoints.push(`${cx(x).toFixed(1)},${cy(y).toFixed(1)}`);
    }
  } else {
    linePoints.push(`${cx(x1).toFixed(1)},${cy(minY).toFixed(1)}`);
    linePoints.push(`${cx(x1).toFixed(1)},${cy(maxY).toFixed(1)}`);
  }

  // Recharts chart data
  const rechartsData = useMemo(() => {
    if (isVertical) {
      return [
        { x: x1, y: minY },
        { x: x1, y: maxY },
      ];
    }
    const bb = y1 - m * x1;
    const xStart = Math.min(minX, maxX);
    const xEnd = Math.max(minX, maxX);
    const steps = 60;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = parseFloat((xStart + (i / steps) * (xEnd - xStart)).toFixed(4));
      const pointY = parseFloat((bb + m * x).toFixed(4));
      points.push({ x, y: pointY });
    }
    return points;
  }, [x1, y1, x2, y2, isVertical, m, minX, maxX, minY, maxY]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Line Graph &amp; Equations</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Slope card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-1">Slope</p>
          <p className="text-3xl font-bold text-blue-700">{slopeRow?.value}</p>
          <p className="text-xs text-slate-500 mt-1">{dirRow?.value}</p>
        </div>

        {/* SVG Plot */}
        <div className="flex justify-center">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-lg h-auto" role="img" aria-label="Slope graph showing line on coordinate plane">
            {/* Grid lines */}
            {Array.from({ length: Math.floor((xGridMax - xGridMin) / xStep) + 1 }, (_, i) => {
              const x = xGridMin + i * xStep;
              const svgX = cx(x);
              return (
                <g key={`gx-${i}`}>
                  <line x1={svgX} y1={padding} x2={svgX} y2={svgH - padding} stroke="#f1f5f9" strokeWidth="1.5" />
                  <text x={svgX} y={svgH - padding + 14} textAnchor="middle" className="text-[14px]" fill="#94a3b8">{x}</text>
                </g>
              );
            })}
            {Array.from({ length: Math.floor((yGridMax - yGridMin) / yStep) + 1 }, (_, i) => {
              const y = yGridMin + i * yStep;
              const svgY = cy(y);
              return (
                <g key={`gy-${i}`}>
                  <line x1={padding} y1={svgY} x2={svgW - padding} y2={svgY} stroke="#f1f5f9" strokeWidth="1.5" />
                  <text x={padding - 8} y={svgY + 3} textAnchor="end" className="text-[14px]" fill="#94a3b8">{y}</text>
                </g>
              );
            })}

            {/* Axes */}
            {minX <= 0 && maxX >= 0 && (
              <line x1={cx(0)} y1={padding} x2={cx(0)} y2={svgH - padding} stroke="#cbd5e1" strokeWidth="2" />
            )}
            {minY <= 0 && maxY >= 0 && (
              <line x1={padding} y1={cy(0)} x2={svgW - padding} y2={cy(0)} stroke="#cbd5e1" strokeWidth="2" />
            )}

            {/* Line */}
            <polyline points={linePoints.join(' ')} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* Points */}
            {[
              { x: x1, y: y1, label: `(${x1}, ${y1})` },
              { x: x2, y: y2, label: `(${x2}, ${y2})` },
            ].map((p, i) => (
              <g key={`pt-${i}`}>
                <circle cx={cx(p.x)} cy={cy(p.y)} r="7" fill="#ef4444" stroke="white" strokeWidth="3" />
                <text x={cx(p.x)} y={cy(p.y) - 10} textAnchor="middle" className="text-[14px]" fill="#ef4444" fontWeight="bold">
                  {p.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Recharts line chart */}
        {rechartsData.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Interactive Line Plot
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={rechartsData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} type="number" domain={['auto', 'auto']} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={(_: unknown) => [typeof _ === 'number' ? _.toFixed(4) : _, 'y'] as any}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1} />
                <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <ReferenceDot x={x1} y={y1} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} label={{ value: `(${x1}, ${y1})`, position: 'bottom', fontSize: 9, fill: '#ef4444' }} />
                <ReferenceDot x={x2} y={y2} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} label={{ value: `(${x2}, ${y2})`, position: 'top', fontSize: 9, fill: '#ef4444' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Equation forms */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Slope-Intercept</p>
            <p className="text-xs font-mono text-slate-700 mt-1">{siRow?.value}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Point-Slope</p>
            <p className="text-xs font-mono text-slate-700 mt-1">{psRow?.value}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Standard Form</p>
            <p className="text-xs font-mono text-slate-700 mt-1">{sfRow?.value}</p>
          </div>
        </div>

        {/* Extra info */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Y-Intercept</p>
            <p className="text-xs font-bold text-slate-700 mt-1">{yiRow?.value}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Distance</p>
            <p className="text-xs font-bold text-slate-700 mt-1">{distRow?.value}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
