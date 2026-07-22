import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface ChartData {
  heatIndex: number;
  temperature: number;
  humidity: number;
  dangerTier: string;
  dangerColor: string;
  recommendations: string[];
}

const dangerZones = [
  { label: 'Safe', min: -Infinity, max: 80, color: '#22c55e', textColor: '#166534' },
  { label: 'Caution', min: 80, max: 90, color: '#eab308', textColor: '#854d0e' },
  { label: 'Extreme Caution', min: 90, max: 103, color: '#f97316', textColor: '#9a3412' },
  { label: 'Danger', min: 103, max: 125, color: '#ef4444', textColor: '#7f1d1d' },
  { label: 'Extreme Danger', min: 125, max: Infinity, color: '#7c3aed', textColor: '#4c1d95' },
];

export default function HeatIndexPanel({ results }: Props) {
  const hiRow = results.find(r => r.id === 'heatIndex');
  const tempRow = results.find(r => r.id === 'temperature');
  const humRow = results.find(r => r.id === 'humidity');
  const dangerRow = results.find(r => r.id === 'dangerTier');
  const chartRow = results.find(r => r.id === '_chartData');

  if (!hiRow || !chartRow) return null;

  let data: ChartData = { heatIndex: 0, temperature: 0, humidity: 0, dangerTier: 'Safe', dangerColor: '#22c55e', recommendations: [] };
  try { data = JSON.parse(chartRow.value); } catch {}

  const hi = data.heatIndex;

  // SVG Thermometer
  const svgW = 280;
  const svgH = 480;
  const bulbCX = 140;
  const bulbR = 45;
  const tubeLeft = 125;
  const tubeRight = 155;
  const tubeTop = 20;
  const tubeBottom = 360;
  const tubeH = tubeBottom - tubeTop;

  // Temperature range: 60°F to 135°F
  const tempMin = 60;
  const tempMax = 135;
  const tempRange = tempMax - tempMin;

  const tempToY = (t: number) => {
    const ratio = (t - tempMin) / tempRange;
    return tubeBottom - ratio * tubeH;
  };

  const getZoneForTemp = (t: number) => {
    return dangerZones.find(z => t >= z.min && t < z.max) || dangerZones[0];
  };

  const hiY = tempToY(Math.min(Math.max(hi, tempMin + 1), tempMax - 1));
  const hiZone = getZoneForTemp(hi);

  // Ambient temp and humidity info
  const recommendations = data.recommendations;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 4v1m0 4v1m0 4v1M4 5a9 9 0 0118 0" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Heat Index & Danger Scale
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Heat Index card */}
        <div className="rounded-xl border p-5 text-center" style={{ borderColor: data.dangerColor, backgroundColor: `${data.dangerColor}10` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Heat Index (Feels Like)</p>
          <p className="text-3xl font-bold font-mono mt-1" style={{ color: data.dangerColor }}>
            {hi.toFixed(1)}°F
          </p>
          <p className="text-xs font-medium mt-1" style={{ color: data.dangerColor }}>
            {data.dangerTier}
          </p>
        </div>

        {/* SVG Thermometer */}
        <div className="flex justify-center">
          <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} className="max-w-full h-auto" style={{ maxWidth: 320 }} role="img" aria-label="Heat index thermometer gauge showing temperature with danger zone colors">
            {/* Thermometer tube */}
            <rect x={tubeLeft} y={tubeTop} width={tubeRight - tubeLeft} height={tubeH} rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />

            {/* Temperature fill */}
            {dangerZones.map((zone, i) => {
              const yBottom = tempToY(Math.min(zone.max, tempMax));
              const yTop = tempToY(Math.max(zone.min, tempMin));
              const h = yBottom - yTop;
              if (h <= 0) return null;
              return (
                <rect
                  key={`item-${i}`}
                  x={tubeLeft + 1}
                  y={yTop}
                  width={tubeRight - tubeLeft - 2}
                  height={h}
                  rx={i === 0 ? '0 0 6 6' : i === dangerZones.length - 1 ? '6 6 0 0' : '0'}
                  fill={zone.color}
                  opacity="0.7"
                />
              );
            })}

            {/* Bulb */}
            <circle cx={bulbCX} cy={tubeBottom + bulbR - 5} r={bulbR} fill={hiZone.color} opacity="0.7" />
            <circle cx={bulbCX} cy={tubeBottom + bulbR - 5} r={bulbR} fill="none" stroke="#cbd5e1" strokeWidth="1" />

            {/* Temperature scale */}
            {[60, 70, 80, 90, 100, 110, 120, 130].map(t => {
              const y = tempToY(t);
              const isThreshold = t === 80 || t === 90 || t === 103 || t === 125;
              return (
                <g key={t}>
                  <line x1={tubeRight + 4} y1={y} x2={tubeRight + (isThreshold ? 14 : 9)} y2={y} stroke={isThreshold ? '#ef4444' : '#94a3b8'} strokeWidth="1" />
                  <text x={tubeRight + (isThreshold ? 16 : 11)} y={y + 3.5} fill="#64748b" fontSize="7" className="text-[7px] font-mono">{t}°</text>
                </g>
              );
            })}

            {/* HI marker */}
            <line x1={tubeLeft - 10} y1={hiY} x2={tubeLeft} y2={hiY} stroke="#3b82f6" strokeWidth="2.5" />
            <circle cx={tubeLeft - 5} cy={hiY} r="3" fill="#3b82f6" />
            <text x={tubeLeft - 12} y={hiY - 6} textAnchor="end" fill="#3b82f6" fontSize="9" fontWeight="bold" className="text-[9px] font-mono">
              HI
            </text>

            {/* Zone labels on the side */}
            {dangerZones.map((zone, i) => {
              if (zone.min === -Infinity || zone.max === Infinity) return null;
              const y = (tempToY(zone.min) + tempToY(zone.max)) / 2;
              if (y < tubeTop + 10 || y > tubeBottom - 10) return null;
              return (
                <text
                  key={`item-${i}`}
                  x={tubeLeft - 14}
                  y={y + 3}
                  textAnchor="end"
                  fill={zone.color}
                  fontSize="6"
                  className="text-[6px] uppercase font-bold"
                >
                  {zone.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Danger zone legend */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">NOAA Danger Tiers</p>
          <div className="space-y-1.5">
            {dangerZones.map(zone => (
              <div key={zone.label} className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: zone.color }} />
                <span>
                  {zone.max === Infinity
                    ? `${zone.min}°F+: `
                    : zone.min === -Infinity
                      ? `< ${zone.max}°F: `
                      : `${zone.min}-${zone.max}°F: `}
                  <span className="font-medium">{zone.label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Two column info */}
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
          {dangerRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Danger Tier</p>
              <p className="text-sm font-bold font-mono text-slate-700">{dangerRow.value}</p>
            </div>
          )}
          {hiRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Heat Index</p>
              <p className="text-sm font-bold font-mono text-slate-700">{hiRow.value}</p>
            </div>
          )}
        </div>

        {/* Safety recommendations card */}
        {recommendations.length > 0 && (
          <div
            className="rounded-xl border-2 px-5 py-4"
            style={{
              borderColor: data.dangerColor,
              backgroundColor: `${data.dangerColor}08`,
            }}
          >
            <div className="flex items-start gap-3">
              <svg aria-hidden="true" className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: data.dangerColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: data.dangerColor === '#22c55e' ? '#166534' : data.dangerColor }}>
                  Safety Recommendations ({data.dangerTier})
                </p>
                <ul className="space-y-1">
                  {recommendations.map((rec, i) => (
                    <li key={`item-${i}`} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="mt-0.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: data.dangerColor }} />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Heat safety tips */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">General Heat Safety</p>
          <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
            <li>Drink plenty of water before, during, and after outdoor activity — don't wait until you're thirsty</li>
            <li>Wear lightweight, light-colored, loose-fitting clothing and a wide-brimmed hat</li>
            <li>Schedule outdoor activities for cooler parts of the day (early morning or evening)</li>
            <li>Never leave children or pets in parked cars — temperatures can rise 20°F in 10 minutes</li>
            <li>Check on elderly neighbors and those without air conditioning during heat waves</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
