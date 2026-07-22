import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// Color name to hex mapping for band rendering
const BAND_COLORS: Record<string, string> = {
  Black: '#000000',
  Brown: '#8B4513',
  Red: '#DC143C',
  Orange: '#FF8C00',
  Yellow: '#FFD700',
  Green: '#228B22',
  Blue: '#0000CD',
  Violet: '#8B008B',
  Gray: '#808080',
  White: '#FFFFFF',
  Gold: '#DAA520',
  Silver: '#C0C0C0',
  None: '#E8E8E8',
};

function getBandColor(colorName: string): string {
  return BAND_COLORS[colorName] || '#CCCCCC';
}

export default function ResistorPanel({ values, results }: Props) {
  const mode = values.mode || 'forward';
  const colorSequenceRow = results.find((r) => r.id === 'colorSequence' || r.id === 'colorBands');
  const resistanceRow = results.find((r) => r.id === 'resistance' || r.id === 'resistorValue');
  const toleranceRow = results.find((r) => r.id === 'tolerance');
  const minRes = results.find((r) => r.id === 'minResistance');
  const maxRes = results.find((r) => r.id === 'maxResistance');
  const tempCoef = results.find((r) => r.id === 'tempCoef');
  const closestStandard = results.find((r) => r.id === 'closestStandard');
  const bandCountRow = results.find((r) => r.id === 'bandCount');

  if (!colorSequenceRow || !resistanceRow) return null;

  let bandColors: string[];
  try {
    bandColors = JSON.parse(colorSequenceRow.value);
  } catch {
    bandColors = [];
  }

  if (!bandColors.length) return null;

  const isForward = mode === 'forward';

  // SVG resistor dimensions
  const svgW = 320;
  const svgH = 120;
  const bodyX = 60;
  const bodyW = 200;
  const bodyY = 35;
  const bodyH = 50;
  const bandH = 50;
  const bandY = bodyY;

  // Calculate band positions
  const nBands = bandColors.length;
  const totalGap = bodyW - 12 * 2; // leave 12px padding on each side
  const bandW = Math.min(16, totalGap / nBands - 4);
  const spacing = (totalGap - bandW * nBands) / (nBands + 1);
  const bandStartX = bodyX + 12 + spacing;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Resistor Color Code {isForward ? 'Decoder' : 'Finder'}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Resistor Body SVG */}
        <div className="flex justify-center bg-slate-50 rounded-xl border border-slate-200 p-3">
          <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} role="img" aria-label="Resistor color band diagram">
            {/* Left lead */}
            <rect x={0} y={bodyY + bodyH / 2 - 3} width={bodyX} height={6} fill="#C0C0C0" rx={1} />
            {/* Right lead */}
            <rect x={bodyX + bodyW} y={bodyY + bodyH / 2 - 3} width={bodyX} height={6} fill="#C0C0C0" rx={1} />
            {/* Resistor body */}
            <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx={8} ry={8} fill="#E8D5B7" stroke="#C4A882" strokeWidth={1} />
            {/* Left end cap */}
            <rect x={bodyX} y={bodyY} width={8} height={bodyH} rx={3} ry={3} fill="#D4C4A8" />
            {/* Right end cap */}
            <rect x={bodyX + bodyW - 8} y={bodyY} width={8} height={bodyH} rx={3} ry={3} fill="#D4C4A8" />
            {/* Band rectangles */}
            {bandColors.map((color, i) => {
              const bx = bandStartX + i * (bandW + spacing);
              return (
                <g key={`band-${i}`}>
                  <rect
                    x={bx}
                    y={bandY}
                    width={bandW}
                    height={bandH}
                    fill={getBandColor(color)}
                    rx={1}
                  />
                  <text
                    x={bx + bandW / 2}
                    y={bandY + bandH + 16}
                    textAnchor="middle"
                    fill="#475569"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {color}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Value Card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-1">{resistanceRow.label}</p>
          <p className="text-3xl font-bold text-blue-700">{resistanceRow.value}</p>
        </div>

        {/* Tolerance + TempCo */}
        <div className="grid grid-cols-2 gap-3">
          {toleranceRow && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {toleranceRow.label}
              </p>
              <p className="text-lg font-bold text-slate-700 mt-1">{toleranceRow.value}</p>
            </div>
          )}
          {tempCoef && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {tempCoef.label}
              </p>
              <p className="text-lg font-bold text-slate-700 mt-1">{tempCoef.value}</p>
            </div>
          )}
          {!tempCoef && bandCountRow && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {bandCountRow.label}
              </p>
              <p className="text-lg font-bold text-slate-700 mt-1">{bandCountRow.value}</p>
            </div>
          )}
        </div>

        {/* Value Range (forward mode) */}
        {minRes && maxRes && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Value Range (based on tolerance)
            </p>
            <div className="flex items-center justify-between text-sm">
              <div className="text-center flex-1">
                <p className="text-slate-500 text-[10px] uppercase tracking-wide font-bold">Min</p>
                <p className="font-bold text-emerald-600">{minRes.value}</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-slate-500 text-[10px] uppercase tracking-wide font-bold">Nominal</p>
                <p className="font-bold text-blue-600">{resistanceRow.value}</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-slate-500 text-[10px] uppercase tracking-wide font-bold">Max</p>
                <p className="font-bold text-red-600">{maxRes.value}</p>
              </div>
            </div>
            {/* Range bar */}
            <div className="relative mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-emerald-400 via-blue-400 to-red-400 rounded-full"
                style={{ left: '0%', right: '0%' }}
              />
            </div>
          </div>
        )}

        {/* E-series reference (reverse mode) */}
        {closestStandard && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">
              Standard Value Reference
            </p>
            <p className="text-sm font-medium text-amber-800">{closestStandard.value}</p>
          </div>
        )}

        {/* Band Legend */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Band Legend
          </p>
          <div className="flex flex-wrap gap-2">
            {bandColors.map((color, i) => (
              <div key={`legend-${i}`} className="flex items-center gap-1.5 text-xs">
                <span
                  className="inline-block w-3 h-3 rounded border border-slate-300"
                  style={{ backgroundColor: getBandColor(color) }}
                />
                <span className="text-slate-600">
                  Band {i + 1}: <strong>{color}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* E-series note */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            E-series Reference
          </p>
          <p className="text-[11px] text-slate-500">
            Standard resistor values follow the E-series (E12, E24). E12 has 12 values per decade
            (10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82). E24 has 24 values for higher precision.
          </p>
        </div>
      </div>
    </div>
  );
}
