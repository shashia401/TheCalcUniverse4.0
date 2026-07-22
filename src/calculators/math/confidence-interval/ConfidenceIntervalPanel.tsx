import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function ConfidenceIntervalPanel({ results }: Props) {
  const lower = results.find(r => r.id === 'lowerBound');
  const upper = results.find(r => r.id === 'upperBound');
  const moe = results.find(r => r.id === 'marginOfError');
  const cv = results.find(r => r.id === 'criticalValue');
  const se = results.find(r => r.id === 'standardError');
  const ci = results.find(r => r.id === 'confidenceInterval');
  const formula = results.find(r => r.id === 'formula');

  if (!lower || !upper || !moe || !ci) return null;

  const l = parseFloat(lower.value);
  const u = parseFloat(upper.value);
  const range = u - l || 1;
  const mean = l + range / 2;

  // SVG bar for CI visualization
  const svgW = 400;
  const svgH = 60;
  const padL = 10;
  const padR = 10;
  const barY = 22;
  const barH = 16;

  const scale = (v: number) => padL + ((v - (l - range * 0.2)) / (range * 1.4)) * (svgW - padL - padR);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Confidence Interval Visualization</span>
      </div>

      <div className="p-5 space-y-4">
        {/* CI Result */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">Confidence Interval</p>
          <p className="text-xl font-bold text-blue-700 font-mono">{ci.value}</p>
        </div>

        {/* SVG interval bar */}
        <div className="flex justify-center">
          <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} className="max-w-full h-auto" style={{ maxWidth: 450 }} role="img" aria-label="Confidence interval bar chart showing mean, lower bound, upper bound, and margin of error">
            {/* CI bar */}
            <rect x={scale(l)} y={barY} width={scale(u) - scale(l)} height={barH} fill="rgba(59,130,246,0.2)" stroke="#3b82f6" strokeWidth="2" rx="3" />
            {/* Mean point */}
            <line x1={scale(mean)} y1={barY - 4} x2={scale(mean)} y2={barY + barH + 4} stroke="#8b5cf6" strokeWidth="2" />
            <text x={scale(mean)} y={barY - 6} textAnchor="middle" fill="#8b5cf6" fontSize="10" fontWeight="bold" className="text-[10px]">
              x̄
            </text>
            {/* Lower bound label */}
            <text x={scale(l)} y={barY + barH + 16} textAnchor="middle" fill="#64748b" fontSize="10" className="text-[10px]">{lower.value}</text>
            {/* Upper bound label */}
            <text x={scale(u)} y={barY + barH + 16} textAnchor="middle" fill="#64748b" fontSize="10" className="text-[10px]">{upper.value}</text>
            {/* MOE arrows */}
            <line x1={scale(mean)} y1={barY + barH + 6} x2={scale(l)} y2={barY + barH + 6} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 2" />
            <line x1={scale(mean)} y1={barY + barH + 6} x2={scale(u)} y2={barY + barH + 6} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 2" />
            <text x={scale(mean + (l - mean) / 2)} y={barY + barH + 14} textAnchor="middle" fill="#ef4444" fontSize="8" className="text-[8px]">MOE</text>
            <text x={scale(mean + (u - mean) / 2)} y={barY + barH + 14} textAnchor="middle" fill="#ef4444" fontSize="8" className="text-[8px]">MOE</text>
          </svg>
        </div>

        {/* Key components */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Lower</p>
            <p className="text-sm font-bold font-mono text-slate-700">{lower.value}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-blue-500 uppercase">Margin of Error</p>
            <p className="text-sm font-bold font-mono text-blue-700">{moe.value}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Upper</p>
            <p className="text-sm font-bold font-mono text-slate-700">{upper.value}</p>
          </div>
        </div>

        {/* Component breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {cv && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Critical Z</p>
              <p className="text-xs font-mono font-bold text-slate-700">{cv.value}</p>
            </div>
          )}
          {se && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Std Error</p>
              <p className="text-sm font-mono font-bold text-slate-700">{se.value}</p>
            </div>
          )}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">MOE = Z × SE</p>
            <p className="text-sm font-mono font-bold text-slate-700">{moe.value}</p>
          </div>
        </div>

        {/* Formula */}
        {formula && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Formula Application</p>
            <p className="text-xs font-mono text-blue-700 break-all">{formula.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
