import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function RoundingPanel({ values, results }: Props) {
  const data = results.find(r => r.id === '_roundingData')?.value;
  if (!data || results.length === 0) return null;

  let info: { lower: number; upper: number; direction: string; digit: number; rounded: number; divisor: number };
  try {
    info = JSON.parse(data);
  } catch {
    return null;
  }

  const original = parseFloat(results.find(r => r.id === 'original')?.value || '0');
  const rounded = parseFloat(results.find(r => r.id === 'rounded')?.value || '0');

  // SVG number line
  const svgW = 500;
  const svgH = 120;
  const range = Math.max(info.upper - info.lower, 1);
  const padding = range * 0.15;
  const minX = info.lower - padding;
  const maxX = info.upper + padding;
  const scale = (svgW - 60) / (maxX - minX);

  const xPos = (v: number) => 30 + (v - minX) * scale;
  const centerY = 60;

  const placeLabels: Record<string, string> = {
    ten: 'ten', hundred: 'hundred', thousand: 'thousand', million: 'million',
    unit: 'unit', tenth: 'tenth', hundredth: 'hundredth', thousandth: 'thousandth',
    'ten-thousandth': 'ten-thousandth',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Number Line</span>
      </div>

      <div className="p-5 space-y-4">
        {/* SVG Number Line */}
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: '140px' }} role="img" aria-label="Number line diagram showing rounding direction and midpoint">
          {/* Horizontal line */}
          <line x1={xPos(info.lower)} y1={centerY} x2={xPos(info.upper)} y2={centerY} stroke="#94a3b8" strokeWidth="2" />
          {/* Tick marks */}
          <line x1={xPos(info.lower)} y1={centerY - 8} x2={xPos(info.lower)} y2={centerY + 8} stroke="#94a3b8" strokeWidth="2" />
          <line x1={xPos(info.upper)} y1={centerY - 8} x2={xPos(info.upper)} y2={centerY + 8} stroke="#94a3b8" strokeWidth="2" />
          {/* Midpoint */}
          <line x1={xPos(info.lower + range / 2)} y1={centerY - 5} x2={xPos(info.lower + range / 2)} y2={centerY + 5} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />

          {/* Labels */}
          <text x={xPos(info.lower)} y={centerY + 25} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#3b82f6">{info.lower}</text>
          <text x={xPos(info.upper)} y={centerY + 25} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#3b82f6">{info.upper}</text>
          <text x={xPos(info.lower + range / 2)} y={centerY - 15} textAnchor="middle" fontSize="10" fill="#94a3b8">Midpoint</text>
          <text x={xPos(info.lower + range / 2)} y={centerY + 40} textAnchor="middle" fontSize="10" fill="#94a3b8">{info.lower + range / 2}</text>

          {/* Dot at original value */}
          <circle cx={xPos(original)} cy={centerY} r="6" fill="#ef4444" />
          {/* Arrow from dot to nearest bound */}
          {info.direction === 'down' ? (
            <>
              <path d={`M ${xPos(original)} ${centerY - 10} L ${xPos(info.lower)} ${centerY - 25} L ${xPos(info.lower) + 8} ${centerY - 25}`} fill="none" stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
              <text x={(xPos(original) + xPos(info.lower)) / 2} y={centerY - 32} textAnchor="middle" fontSize="10" fill="#3b82f6">Round Down</text>
            </>
          ) : (
            <>
              <path d={`M ${xPos(original)} ${centerY - 10} L ${xPos(info.upper)} ${centerY - 25} L ${xPos(info.upper) - 8} ${centerY - 25}`} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
              <text x={(xPos(original) + xPos(info.upper)) / 2} y={centerY - 32} textAnchor="middle" fontSize="10" fill="#3b82f6">Round Up</text>
            </>
          )}

          {/* Arrowhead marker */}
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="#3b82f6" />
            </marker>
          </defs>

          {/* Value label above dot */}
          <text x={xPos(original)} y={centerY - 12} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ef4444">{original}</text>
        </svg>

        {/* Explanation */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs text-blue-700">
            <strong>Rounding {original} to the nearest {placeLabels[values.place || 'unit']}:</strong>{' '}
            Since the digit is {info.digit}, which is {info.direction === 'down' ? 'less than 5' : '5 or greater'}, round {info.direction}.
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {original} is between {info.lower} and {info.upper}. It is <strong>{info.direction === 'down' ? 'below' : 'above'} the midpoint</strong> ({info.lower + range / 2}), so it rounds to <strong>{rounded}</strong>.
          </p>
        </div>

        {/* Result */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-4 text-center">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Rounded Value</p>
          <p className="text-2xl font-bold font-mono text-emerald-700">{rounded}</p>
        </div>
      </div>
    </div>
  );
}
