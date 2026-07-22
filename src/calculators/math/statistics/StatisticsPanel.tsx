import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface BoxData {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
}

export default function StatisticsPanel({ results }: Props) {
  const boxPlotRow = results.find(r => r.id === '_boxPlotData');
  const countRow = results.find(r => r.id === 'count');
  const meanRow = results.find(r => r.id === 'mean');
  const stddevRow = results.find(r => r.id === 'stddev');
  const iqrRow = results.find(r => r.id === 'iqr');
  const outlierRow = results.find(r => r.id === 'outliers');

  if (!boxPlotRow) return null;

  let data: BoxData = { min: 0, q1: 0, median: 0, q3: 0, max: 0, outliers: [] };
  try { data = JSON.parse(boxPlotRow.value); } catch { return null; }

  const { min, q1, median: q2, q3, max, outliers } = data;
  const dataRange = max - min || 1;
  const padding = dataRange * 0.1;
  const plotMin = min - padding;
  const plotMax = max + padding;
  const plotRange = plotMax - plotMin || 1;

  // SVG dimensions
  const svgW = 400;
  const svgH = 140;
  const padL = 10;
  const padR = 10;
  const plotW = svgW - padL - padR;
  const yCenter = svgH / 2;
  const boxH = 40;

  const scale = (v: number) => padL + ((v - plotMin) / plotRange) * plotW;
  const fmt = (n: number) => parseFloat(n.toPrecision(6)).toString();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0-4h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Box-and-Whisker Plot</span>
      </div>

      <div className="p-5 space-y-4">
        {/* SVG Box Plot */}
        <div className="flex justify-center">
          <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} className="max-w-full h-auto" style={{ maxWidth: 450 }} role="img" aria-label="Box plot chart showing min, Q1, median, Q3, and max">
            {/* Whisker line (min to q1) */}
            <line x1={scale(min)} y1={yCenter} x2={scale(q1)} y2={yCenter} stroke="#64748b" strokeWidth="2" />
            {/* Whisker line (q3 to max) */}
            <line x1={scale(q3)} y1={yCenter} x2={scale(max)} y2={yCenter} stroke="#64748b" strokeWidth="2" />
            {/* Whisker ends */}
            <line x1={scale(min)} y1={yCenter - 12} x2={scale(min)} y2={yCenter + 12} stroke="#64748b" strokeWidth="2" />
            <line x1={scale(max)} y1={yCenter - 12} x2={scale(max)} y2={yCenter + 12} stroke="#64748b" strokeWidth="2" />
            {/* Box (q1 to q3) */}
            <rect x={scale(q1)} y={yCenter - boxH / 2} width={scale(q3) - scale(q1)} height={boxH} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="2" rx="2" />
            {/* Median line */}
            <line x1={scale(q2)} y1={yCenter - boxH / 2} x2={scale(q2)} y2={yCenter + boxH / 2} stroke="#ef4444" strokeWidth="2.5" />
            {/* Mean diamond */}
            {meanRow && (
              <polygon
                points={`${scale(parseFloat(meanRow.value))},${yCenter - boxH / 2 - 8} ${scale(parseFloat(meanRow.value)) + 6},${yCenter - boxH / 2 - 3} ${scale(parseFloat(meanRow.value))},${yCenter - boxH / 2 + 2} ${scale(parseFloat(meanRow.value)) - 6},${yCenter - boxH / 2 - 3}`}
                fill="#8b5cf6"
              />
            )}
            {/* Outlier points */}
            {outliers.map((v, i) => (
              <circle key={`item-${i}`} cx={scale(v)} cy={yCenter} r="4" fill="#ef4444" stroke="white" strokeWidth="1.5" />
            ))}
            {/* Labels */}
            <text x={scale(min)} y={yCenter + boxH / 2 + 18} textAnchor="middle" fill="#64748b" fontSize="9" className="text-[9px]">{fmt(min)}</text>
            <text x={scale(q1)} y={yCenter + boxH / 2 + 18} textAnchor="middle" fill="#64748b" fontSize="9" className="text-[9px]">Q₁={fmt(q1)}</text>
            <text x={scale(q2)} y={yCenter - boxH / 2 - 10} textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold" className="text-[10px]">M={fmt(q2)}</text>
            <text x={scale(q3)} y={yCenter + boxH / 2 + 18} textAnchor="middle" fill="#64748b" fontSize="9" className="text-[9px]">Q₃={fmt(q3)}</text>
            <text x={scale(max)} y={yCenter + boxH / 2 + 18} textAnchor="middle" fill="#64748b" fontSize="9" className="text-[9px]">{fmt(max)}</text>
          </svg>
        </div>

        {/* Outlier warning */}
        {outliers.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">
              {outliers.length} Outlier{outliers.length > 1 ? 's' : ''} Detected
            </p>
            <p className="text-sm font-mono text-red-700 font-bold">{outlierRow?.value}</p>
            <p className="text-xs text-red-600 mt-1">
              Values outside Q1 − 1.5×IQR or Q3 + 1.5×IQR are considered statistical outliers and plotted as individual points on the box plot.
            </p>
          </div>
        )}

        {/* Summary stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Count</p>
            <p className="text-sm font-bold text-slate-700">{countRow?.value}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Mean</p>
            <p className="text-sm font-bold text-slate-700">{meanRow?.value}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Std Dev</p>
            <p className="text-sm font-bold text-slate-700">{stddevRow?.value}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">IQR</p>
            <p className="text-sm font-bold text-slate-700">{iqrRow?.value}</p>
          </div>
        </div>

        {/* Five-number summary */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Five-Number Summary
          </p>
          <div className="grid grid-cols-5 gap-2 text-xs text-center">
            <div><p className="font-bold text-slate-600">Min</p><p className="font-mono text-slate-700">{fmt(min)}</p></div>
            <div><p className="font-bold text-slate-600">Q₁</p><p className="font-mono text-slate-700">{fmt(q1)}</p></div>
            <div><p className="font-bold text-slate-600">Median</p><p className="font-mono text-slate-700">{fmt(q2)}</p></div>
            <div><p className="font-bold text-slate-600">Q₃</p><p className="font-mono text-slate-700">{fmt(q3)}</p></div>
            <div><p className="font-bold text-slate-600">Max</p><p className="font-mono text-slate-700">{fmt(max)}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
