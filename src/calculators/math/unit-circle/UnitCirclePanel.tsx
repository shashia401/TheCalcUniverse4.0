import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.-]+/);
  return m ? parseFloat(m[0]) : 0;
}

const DEG = Math.PI / 180;
const CX = 110;
const CY = 110;
const R = 85;
const SVG_SIZE = 220;

export default function UnitCirclePanel({ results }: Props) {
  const angle = results.find(r => r.id === 'normalizedAngle');
  const coords = results.find(r => r.id === 'coordinates');
  const quadrant = results.find(r => r.id === 'quadrant');

  if (!angle) return null;

  const angleDeg = parseNum(angle.value);
  const rad = angleDeg * DEG;

  // Point on unit circle
  const px = CX + R * Math.cos(rad);
  const py = CY - R * Math.sin(rad);

  // Sine line (vertical)
  const sinEndX = CX + R * Math.cos(rad);
  const sinEndY = CY;
  const cosEndX = CX;
  const cosEndY = CY - R * Math.sin(rad);

  // Labels
  const angleLabel = `${angleDeg.toFixed(0)}°`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Unit Circle</span>
      </div>
      <div className="p-5">
        <div className="flex flex-col items-center">
          {/* SVG Unit Circle */}
          <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="w-48 h-48" xmlns="http://www.w3.org/2000/svg">
            {/* Circle */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e2e8f0" strokeWidth={1.5} />
            {/* Axes */}
            <line x1={CX - R - 10} y1={CY} x2={CX + R + 10} y2={CY} stroke="#cbd5e1" strokeWidth={1} />
            <line x1={CX} y1={CY - R - 10} x2={CX} y2={CY + R + 10} stroke="#cbd5e1" strokeWidth={1} />
            {/* Axis labels */}
            <text x={CX + R + 12} y={CY + 4} fontSize={9} fill="#94a3b8" textAnchor="start">x</text>
            <text x={CX + 4} y={CY - R - 5} fontSize={9} fill="#94a3b8" textAnchor="start">y</text>

            {/* Arc */}
            <path
              d={`M ${CX + R} ${CY} A ${R} ${R} 0 ${angleDeg > 180 ? 1 : 0} 1 ${px} ${py}`}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              strokeDasharray="3,2"
            />
            {/* Radius line */}
            <line x1={CX} y1={CY} x2={px} y2={py} stroke="#8b5cf6" strokeWidth={1.5} />
            {/* Point on circle */}
            <circle cx={px} cy={py} r={3.5} fill="#ef4444" />
            {/* Cosine line (horizontal from origin to point x) */}
            <line x1={CX} y1={py} x2={px} y2={py} stroke="#eab308" strokeWidth={1.5} strokeDasharray="3,2" />
            <text x={(CX + px) / 2} y={py + 12} fontSize={7} fill="#eab308" textAnchor="middle">cos</text>
            {/* Sine line (vertical from point x to point) */}
            <line x1={px} y1={CY} x2={px} y2={py} stroke="#22c55e" strokeWidth={1.5} strokeDasharray="3,2" />
            <text x={px + 10} y={(CY + py) / 2 + 2} fontSize={7} fill="#22c55e" textAnchor="start">sin</text>
            {/* Angle label */}
            <text x={CX + 25} y={CY - 12} fontSize={10} fill="#8b5cf6" fontWeight="bold">{angleLabel}</text>
            {/* Coordinate label */}
            <text x={px + 8} y={py - 5} fontSize={7} fill="#ef4444">{`(${((CX - R) / R * Math.cos(rad) + 1).toFixed(3)})`}</text>
          </svg>

          {/* Info cards */}
          <div className="w-full grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Angle</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">{angle.value}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Quadrant</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">{quadrant?.value ?? '-'}</p>
            </div>
          </div>

          {coords && (
            <div className="w-full mt-2 rounded-xl border border-slate-200 bg-indigo-50 px-4 py-2.5 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Coordinates (cos θ, sin θ)</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5 font-mono">{coords.value}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
