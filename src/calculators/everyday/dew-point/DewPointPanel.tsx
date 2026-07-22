import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface ChartData {
  dewPointF: number;
  dewPointC: number;
  temperature: number;
  humidity: number;
  comfortLabel: string;
  comfortDescription: string;
}

const comfortBands = [
  { label: 'Dry & Comfortable', min: -Infinity, max: 55, color: '#22c55e', textColor: '#166534' },
  { label: 'Comfortable', min: 55, max: 60, color: '#86efac', textColor: '#166534' },
  { label: 'Slightly Humid', min: 60, max: 65, color: '#eab308', textColor: '#854d0e' },
  { label: 'Sticky (Humid)', min: 65, max: 70, color: '#f97316', textColor: '#9a3412' },
  { label: 'Uncomfortable', min: 70, max: 75, color: '#ef4444', textColor: '#7f1d1d' },
  { label: 'Miserable', min: 75, max: 80, color: '#dc2626', textColor: '#450a0a' },
  { label: 'Dangerous', min: 80, max: Infinity, color: '#7c3aed', textColor: '#4c1d95' },
];

export default function DewPointPanel({ results }: Props) {
  const dpRow = results.find(r => r.id === 'dewPoint');
  const dpFRow = results.find(r => r.id === 'dewPointF');
  const dpCRow = results.find(r => r.id === 'dewPointC');
  const humRow = results.find(r => r.id === 'humidity');
  const tempRow = results.find(r => r.id === 'temperature');
  const comfortRow = results.find(r => r.id === 'comfortLevel');
  const chartRow = results.find(r => r.id === '_chartData');

  if (!dpRow || !chartRow) return null;

  let data: ChartData = {
    dewPointF: 0, dewPointC: 0, temperature: 0, humidity: 0,
    comfortLabel: '', comfortDescription: '',
  };
  try { data = JSON.parse(chartRow.value); } catch {}

  const dpF = data.dewPointF;
  const dpC = data.dewPointC;

  const getCurrentBand = (dp: number) => {
    return comfortBands.find(b => dp >= b.min && dp < b.max) || comfortBands[0];
  };

  const currentBand = getCurrentBand(dpF);

  // SVG horizontal gauge
  const svgW = 600;
  const svgH = 200;
  const gaugeY = 50;
  const gaugeH = 36;
  const gaugeLeft = 30;
  const gaugeRight = 570;
  const gaugeW = gaugeRight - gaugeLeft;

  const dpMin = 30;
  const dpMax = 90;
  const dpRange = dpMax - dpMin;

  const dpToX = (dp: number) => {
    const ratio = (dp - dpMin) / dpRange;
    return gaugeLeft + ratio * gaugeW;
  };

  const clampedDp = Math.max(dpMin, Math.min(dpMax, dpF));
  const dpX = dpToX(clampedDp);

  // Comfort band widths in pixels
  const bandToPixels = (bandMin: number, bandMax: number) => {
    const left = Math.max(gaugeLeft, dpToX(Math.max(bandMin, dpMin)));
    const right = Math.min(gaugeRight, dpToX(Math.min(bandMax, dpMax)));
    return { x: left, w: right - left };
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Comfort Scale
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Dew Point card */}
        <div className="rounded-xl border p-5 text-center" style={{ borderColor: currentBand.color, backgroundColor: `${currentBand.color}10` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Dew Point</p>
          <p className="text-3xl font-bold font-mono mt-1" style={{ color: currentBand.color }}>
            {dpF.toFixed(1)}°F
          </p>
          <p className="text-xs font-mono text-slate-500 mt-1">
            {dpC.toFixed(1)}°C
          </p>
          <p className="text-sm font-bold mt-2" style={{ color: currentBand.color }}>
            {currentBand.label}
          </p>
        </div>

        {/* SVG Comfort Scale Gauge */}
        <div className="flex justify-center">
          <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} className="max-w-full h-auto" style={{ maxWidth: 600 }} role="img" aria-label="Dew point comfort scale gauge showing humidity comfort bands from dry to dangerous">
            {/* Color bands */}
            {comfortBands.map((band, i) => {
              const { x, w } = bandToPixels(band.min, band.max);
              if (w <= 0) return null;
              return (
                <rect
                  key={`item-${i}`}
                  x={x}
                  y={gaugeY}
                  width={w}
                  height={gaugeH}
                  fill={band.color}
                  opacity="0.6"
                  rx={i === 0 || i === comfortBands.length - 1 ? '6' : '0'}
                />
              );
            })}

            {/* Gauge border */}
            <rect x={gaugeLeft} y={gaugeY} width={gaugeW} height={gaugeH} rx="6" fill="none" stroke="#cbd5e1" strokeWidth="1" />

            {/* Tick marks and labels */}
            {[30, 40, 50, 55, 60, 65, 70, 75, 80, 90].map(t => {
              const x = dpToX(t);
              const isMajor = t === 55 || t === 60 || t === 65 || t === 70 || t === 75 || t === 80;
              const band = comfortBands.find(b => t >= b.min && t < b.max);
              return (
                <g key={t}>
                  <line x1={x} y1={gaugeY + gaugeH} x2={x} y2={gaugeY + gaugeH + (isMajor ? 10 : 5)} stroke={isMajor ? '#64748b' : '#cbd5e1'} strokeWidth="1" />
                  <text
                    x={x}
                    y={gaugeY + gaugeH + (isMajor ? 22 : 16)}
                    textAnchor="middle"
                    fill={isMajor ? (band?.color || '#64748b') : '#94a3b8'}
                    fontSize={isMajor ? '9' : '7'}
                    fontWeight={isMajor ? 'bold' : 'normal'}
                    className={isMajor ? 'text-[9px] font-mono' : 'text-[7px] font-mono'}
                  >
                    {t}°
                  </text>
                </g>
              );
            })}

            {/* Band labels above gauge */}
            {comfortBands.map((band, i) => {
              const { x, w } = bandToPixels(band.min, band.max);
              if (w < 20) return null;
              return (
                <text
                  key={`item-${i}`}
                  x={x + w / 2}
                  y={gaugeY - 6}
                  textAnchor="middle"
                  fill={band.color}
                  fontSize="7"
                  className="text-[7px] uppercase font-bold"
                >
                  {band.label}
                </text>
              );
            })}

            {/* Dew point marker */}
            {dpF >= dpMin && dpF <= dpMax && (
              <g>
                <line x1={dpX} y1={gaugeY - 18} x2={dpX} y2={gaugeY + gaugeH + 5} stroke={currentBand.color} strokeWidth="2.5" strokeDasharray="4 3" opacity="0.7" />
                <polygon points={`${dpX},${gaugeY - 18} ${dpX - 6},${gaugeY - 26} ${dpX + 6},${gaugeY - 26}`} fill={currentBand.color} />
                <text x={dpX} y={gaugeY - 30} textAnchor="middle" fill={currentBand.color} fontSize="10" fontWeight="bold" className="text-[10px] font-mono">
                  {dpF.toFixed(1)}°F
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Comfort band legend */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Human Comfort Scale</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {comfortBands.map(band => (
              <div key={band.label} className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: band.color }} />
                <span className="font-medium">{band.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Comfort description */}
        <div className="rounded-xl border-2 px-5 py-4" style={{ borderColor: currentBand.color, backgroundColor: `${currentBand.color}08` }}>
          <div className="flex items-start gap-3">
            <svg aria-hidden="true" className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: currentBand.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: currentBand.textColor }}>
                {currentBand.label}
              </p>
              <p className="text-xs text-slate-600">
                {data.comfortDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2">
          {tempRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Temperature</p>
              <p className="text-sm font-bold font-mono text-slate-700">{tempRow.value}</p>
            </div>
          )}
          {humRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Humidity</p>
              <p className="text-sm font-bold font-mono text-slate-700">{humRow.value}</p>
            </div>
          )}
          {dpFRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Dew Point (°F)</p>
              <p className="text-sm font-bold font-mono text-slate-700">{dpFRow.value}</p>
            </div>
          )}
          {dpCRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Dew Point (°C)</p>
              <p className="text-sm font-bold font-mono text-slate-700">{dpCRow.value}</p>
            </div>
          )}
          {comfortRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center col-span-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Comfort Level</p>
              <p className="text-sm font-bold font-mono text-slate-700">{comfortRow.value}</p>
            </div>
          )}
        </div>

        {/* HVAC relevance tip */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">HVAC Relevance</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            For optimal indoor comfort and health, HVAC systems should maintain an indoor dew point between <strong>45-55°F</strong>
            {' '}(approximately 30-50% relative humidity at 70°F). Dew points above 60°F indoors can promote mold growth,
            dust mite proliferation, and respiratory issues. If the outdoor dew point is very high, a properly sized air
            conditioning system with adequate dehumidification is essential. Consider a whole-house dehumidifier in humid climates.
          </p>
        </div>
      </div>
    </div>
  );
}
