import { CalculatorResult } from '../../../types/calculator';
import { roundExact, RoundMethod } from './roundingMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function RoundingPanel({ values, results }: Props) {
  const out = roundExact(values.number, values.place || 'unit', (values.method || 'half-up') as RoundMethod, values.sigFigs);
  if (out.kind !== 'ok' || results.length === 0) return null;
  const r = out.r;

  // SVG number line between the two surrounding landmarks
  const svgW = 500;
  const svgH = 130;
  const span = r.upperNum - r.lowerNum;
  const padding = span * 0.15;
  const minX = r.lowerNum - padding;
  const maxX = r.upperNum + padding;
  const scale = (svgW - 60) / (maxX - minX);
  const xPos = (v: number) => 30 + (v - minX) * scale;
  const centerY = 70;
  const mid = r.lowerNum + span / 2;
  const target = r.direction === 'down' ? r.lowerNum : r.upperNum;
  const exact = r.direction === 'exact';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Number Line</span>
      </div>

      <div className="p-5 space-y-4">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: '150px' }} role="img"
          aria-label={`Number line: ${r.original} lies between ${r.lower} and ${r.upper} and rounds to ${r.rounded}`}>
          <line x1={xPos(r.lowerNum)} y1={centerY} x2={xPos(r.upperNum)} y2={centerY} stroke="#94a3b8" strokeWidth="2" />
          <line x1={xPos(r.lowerNum)} y1={centerY - 8} x2={xPos(r.lowerNum)} y2={centerY + 8} stroke="#94a3b8" strokeWidth="2" />
          <line x1={xPos(r.upperNum)} y1={centerY - 8} x2={xPos(r.upperNum)} y2={centerY + 8} stroke="#94a3b8" strokeWidth="2" />
          <line x1={xPos(mid)} y1={centerY - 5} x2={xPos(mid)} y2={centerY + 5} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />

          <text x={xPos(r.lowerNum)} y={centerY + 26} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1d4ed8">{r.lower}</text>
          <text x={xPos(r.upperNum)} y={centerY + 26} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1d4ed8">{r.upper}</text>
          <text x={xPos(mid)} y={centerY + 44} textAnchor="middle" fontSize="10" fill="#475569">Midpoint</text>

          <circle cx={xPos(r.originalNum)} cy={centerY} r="6" fill="#dc2626" />
          <text x={xPos(r.originalNum)} y={centerY - 14} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#b91c1c">{r.original}</text>
          {!exact && (
            <>
              <path d={`M ${xPos(r.originalNum)} ${centerY - 30} L ${xPos(target)} ${centerY - 30}`} fill="none" stroke="#1d4ed8" strokeWidth="1.5" />
              <text x={(xPos(r.originalNum) + xPos(target)) / 2} y={centerY - 36} textAnchor="middle" fontSize="10" fill="#1d4ed8">
                {r.direction === 'up' ? 'Round Up' : 'Round Down'} to {r.rounded}
              </text>
            </>
          )}
        </svg>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs text-blue-900">
            <strong>Rounding {r.original} to the {r.placeLabel}:</strong> {r.explanation}
          </p>
          {!exact && (
            <p className="text-xs text-blue-800 mt-1">
              {r.original} is between {r.lower} and {r.upper}.
            </p>
          )}
        </div>

        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-4 text-center">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Rounded Value</p>
          <p className="text-2xl font-bold font-mono text-emerald-700 break-all">{r.rounded}</p>
        </div>
      </div>
    </div>
  );
}
