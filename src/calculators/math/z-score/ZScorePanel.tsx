import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface ChartData {
  z: number;
  probability: number;
}

function normalPDF(x: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

// Standard normal CDF (Abramowitz & Stegun approximation)
function cdf(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1 + sign * y);
}

export default function ZScorePanel({ results }: Props) {
  const zRow = results.find(r => r.id === 'zscore');
  const probRow = results.find(r => r.id === 'probability');
  const pctRow = results.find(r => r.id === 'percentile');
  const aboveRow = results.find(r => r.id === 'aboveProb');
  const formulaRow = results.find(r => r.id === 'formula');
  const chartRow = results.find(r => r.id === '_chartData');

  if (!zRow || !chartRow) return null;

  let chartData: ChartData = { z: 0, probability: 0.5 };
  try { chartData = JSON.parse(chartRow.value); } catch {}

  const z = chartData.z;

  const [hoverInfo, setHoverInfo] = useState<{z: number; prob: number; x: number} | null>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * svgW;
    const clampedX = Math.max(padL, Math.min(padL + plotW, svgX));
    const zVal = xMin + ((clampedX - padL) / plotW) * xRange;
    setHoverInfo({ z: zVal, prob: cdf(zVal), x: clampedX });
  };

  const handleMouseLeave = () => setHoverInfo(null);

  // SVG bell curve
  const svgW = 400;
  const svgH = 200;
  const padL = 10;
  const padR = 10;
  const padT = 16;
  const padB = 25;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  // X range: -4 to 4 (standard deviations)
  const xMin = -4;
  const xMax = 4;
  const xRange = xMax - xMin;

  const xScale = (x: number) => padL + ((x - xMin) / xRange) * plotW;
  const yScale = (y: number) => padT + plotH - (y / normalPDF(0)) * plotH * 0.9;

  // Generate curve points
  const points: { x: number; y: number }[] = [];
  const numPts = 120;
  for (let i = 0; i <= numPts; i++) {
    const x = xMin + (i / numPts) * xRange;
    const y = normalPDF(x);
    points.push({ x: xScale(x), y: yScale(y) });
  }

  // Shaded area path (left of Z)
  const shadePts: { x: number; y: number }[] = [];
  const shadeStart = Math.max(xMin, Math.min(z, xMax));
  const shadeEnd = Math.min(xMax, Math.max(z, xMin));
  const shadeNum = 30;
  for (let i = 0; i <= shadeNum; i++) {
    const t = i / shadeNum;
    const x = shadeStart + t * (shadeEnd - shadeStart);
    const y = normalPDF(x);
    shadePts.push({ x: xScale(x), y: yScale(y) });
  }

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const shadePathD = shadePts.length > 1
    ? `M${shadePts[0].x.toFixed(1)},${shadePts[0].y.toFixed(1)}` +
      shadePts.slice(1).map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
      `L${shadePts[shadePts.length - 1].x.toFixed(1)},${yScale(0)} Z`
    : '';

  // Clamp Z for display within range
  const displayZ = Math.max(xMin + 0.5, Math.min(xMax - 0.5, z));

  // X-axis labels
  const xTicks = [-3, -2, -1, 0, 1, 2, 3];
  const displayZLabel = Math.round(z * 100) / 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Standard Normal Distribution
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Z-score card */}
        <div className={`rounded-xl border p-5 text-center ${z >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Z-Score</p>
          <p className={`text-3xl font-bold font-mono mt-1 ${z >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
            {z >= 0 && !zRow.value.startsWith('+') ? '+' : ''}{zRow.value}
          </p>
          {formulaRow && <p className="text-xs font-mono text-slate-500 mt-1">{formulaRow.value}</p>}
        </div>

        {/* SVG Bell Curve */}
        <div className="flex justify-center">
          <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} className="max-w-full h-auto" style={{ cursor: 'crosshair', maxWidth: 450 }} role="img" aria-label="Z-score bell curve distribution chart"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}>
            {/* Shaded area */}
            {shadePathD && (
              <path d={shadePathD} fill="rgba(59,130,246,0.15)" />
            )}
            {/* Curved tail fill (the other side) */}
            {/* Bell curve */}
            <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Baseline */}
            <line x1={xScale(xMin)} y1={yScale(0)} x2={xScale(xMax)} y2={yScale(0)} stroke="#cbd5e1" strokeWidth="1" />
            {/* Z-score vertical line */}
            <line x1={xScale(displayZ)} y1={yScale(0)} x2={xScale(displayZ)} y2={yScale(normalPDF(displayZ))} stroke="#ef4444" strokeWidth="2" strokeDasharray="5 3" />
            {/* Z-score label */}
            <text x={xScale(displayZ)} y={yScale(0) + 16} textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold" className="text-[11px]">
              Z={displayZLabel}
            </text>
            {/* X-axis ticks */}
            {xTicks.map(t => (
              <g key={t}>
                <line x1={xScale(t)} y1={yScale(0)} x2={xScale(t)} y2={yScale(0) + 4} stroke="#94a3b8" strokeWidth="1" />
                <text x={xScale(t)} y={yScale(0) + 15} textAnchor="middle" fill="#64748b" fontSize="8" className="text-[8px]">{t}</text>
              </g>
            ))}
            {/* Center label */}
            <text x={xScale(0)} y={yScale(0) - 8} textAnchor="middle" fill="#64748b" fontSize="9" className="text-[9px]">μ</text>
            {/* Percentile / probability on chart */}
            {z > xMin && z < xMax && (
              <text x={Math.min(xScale(displayZ) - 20, xScale(xMax) - 60)} y={yScale(normalPDF(displayZ)) - 8} textAnchor="end" fill="#3b82f6" fontSize="9" className="text-[9px]">
                {pctRow?.value}
              </text>
            )}

            {/* Hover guideline */}
            {hoverInfo && (
              <g>
                <line x1={hoverInfo.x} y1={yScale(0)} x2={hoverInfo.x} y2={padT} stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1={hoverInfo.x - 4} y1={yScale(normalPDF(hoverInfo.z))} x2={hoverInfo.x + 4} y2={yScale(normalPDF(hoverInfo.z))} stroke="#6366f1" strokeWidth="2" />
                <rect x={hoverInfo.x - 4} y={Math.max(yScale(normalPDF(hoverInfo.z)) - 52, 2)} width={8} height={52} rx={4} fill="#6366f1" />
                <rect x={hoverInfo.x - 38} y={Math.max(yScale(normalPDF(hoverInfo.z)) - 50, 4)} width={76} height={36} rx={4} fill="white" stroke="#6366f1" strokeWidth="1" />
                <text x={hoverInfo.x} y={Math.max(yScale(normalPDF(hoverInfo.z)) - 34, 18)} textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold" className="text-[10px]">
                  Z = {hoverInfo.z.toFixed(2)}
                </text>
                <text x={hoverInfo.x} y={Math.max(yScale(normalPDF(hoverInfo.z)) - 18, 32)} textAnchor="middle" fill="#6366f1" fontSize="10" fontWeight="bold" className="text-[10px]">
                  P = {(hoverInfo.prob * 100).toFixed(1)}%
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          {probRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">P(Z ≤ z)</p>
              <p className="text-sm font-bold font-mono text-slate-700">{probRow.value}</p>
            </div>
          )}
          {pctRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Percentile</p>
              <p className="text-sm font-bold font-mono text-slate-700">{pctRow.value}</p>
            </div>
          )}
          {aboveRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Above</p>
              <p className="text-sm font-bold font-mono text-slate-700">{aboveRow.value}</p>
            </div>
          )}
        </div>

        {/* Empirical rule */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Empirical Rule (68-95-99.7)</p>
          <div className="space-y-1 text-xs text-slate-600">
            <p>±1σ: ~68% of data falls within 1 standard deviation</p>
            <p>±2σ: ~95% of data falls within 2 standard deviations</p>
            <p>±3σ: ~99.7% of data falls within 3 standard deviations</p>
          </div>
        </div>
      </div>
    </div>
  );
}
