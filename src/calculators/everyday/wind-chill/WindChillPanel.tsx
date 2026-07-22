import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface ChartData {
  windChillF: number;
  windChillC: number;
  temperatureF: number;
  temperatureC: number;
  windSpeedMph: number;
  originalTemp: number;
  originalUnit: string;
  frostbite: string;
}

const frostbiteZones = [
  { label: 'Low Risk', min: -18, max: Infinity, color: '#22c55e', textColor: '#166534' },
  { label: '30 min risk', min: -27, max: -18, color: '#eab308', textColor: '#854d0e' },
  { label: '10 min risk', min: -39, max: -27, color: '#f97316', textColor: '#9a3412' },
  { label: '5 min risk', min: -60, max: -39, color: '#ef4444', textColor: '#991b1b' },
  { label: '< 2 min risk', min: -Infinity, max: -60, color: '#7c3aed', textColor: '#4c1d95' },
];

export default function WindChillPanel({ results }: Props) {
  const wcRow = results.find(r => r.id === 'windChill');
  const wcFRow = results.find(r => r.id === 'windChillF');
  const wcCRow = results.find(r => r.id === 'windChillC');
  const wsRow = results.find(r => r.id === 'windSpeedDisplay');
  const frostbiteRow = results.find(r => r.id === 'frostbiteRisk');
  const chartRow = results.find(r => r.id === '_chartData');

  if (!wcRow || !chartRow) return null;

  let data: ChartData = { windChillF: 0, windChillC: 0, temperatureF: 0, temperatureC: 0, windSpeedMph: 0, originalTemp: 0, originalUnit: 'F', frostbite: 'Low risk' };
  try { data = JSON.parse(chartRow.value); } catch {}

  const wcF = data.windChillF;
  const wcC = data.windChillC;
  const speedMph = data.windSpeedMph;

  // SVG thermometer
  const svgW = 280;
  const svgH = 500;
  const bulbCX = 140;
  const bulbR = 50;
  const tubeLeft = 125;
  const tubeRight = 155;
  const tubeTop = 20;
  const tubeBottom = 370;
  const tubeH = tubeBottom - tubeTop;

  // Temperature range: -80°F to 60°F
  const tempMin = -80;
  const tempMax = 60;
  const tempRange = tempMax - tempMin;

  // Map temperature to y position on tube
  const tempToY = (t: number) => {
    const ratio = (t - tempMin) / tempRange;
    return tubeBottom - ratio * tubeH;
  };

  // Get frostbite zone color for a given temp
  const getTempColor = (t: number) => {
    const zone = frostbiteZones.find(z => t > z.min && t <= z.max);
    return zone ? zone.color : '#6b7280';
  };

  const wcY = tempToY(wcF);
  const wcYclamped = Math.max(tubeTop + 5, Math.min(tubeBottom - 5, wcY));
  const fillH = tubeBottom - Math.max(tubeTop, Math.min(tubeBottom, wcY));

  // Wind speed gauge arc
  const gaugeCX = 140;
  const gaugeCY = 450;
  const gaugeR = 80;
  const maxSpeed = 60;

  const speedAngle = (speed: number) => {
    const ratio = Math.min(speed / maxSpeed, 1);
    return Math.PI * 0.7 + ratio * Math.PI * 0.6; // arc from ~125° to ~55°
  };

  const polarToCart = (cx: number, cy: number, r: number, angle: number) => {
    return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
  };

  const getSpeedColor = (s: number) => {
    if (s < 15) return '#22c55e';
    if (s < 30) return '#eab308';
    if (s < 45) return '#f97316';
    return '#ef4444';
  };

  // Generate arc path for gauge
  const arcPath = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCart(gaugeCX, gaugeCY, radius, startAngle);
    const end = polarToCart(gaugeCX, gaugeCY, radius, endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M${start.x.toFixed(1)},${start.y.toFixed(1)} A${radius},${radius} 0 ${largeArc} 1 ${end.x.toFixed(1)},${end.y.toFixed(1)}`;
  };

  const arcStart = Math.PI * 0.7;
  const arcEnd = Math.PI * 0.3;
  const speedAng = speedAngle(speedMph);
  const needleEnd = polarToCart(gaugeCX, gaugeCY, gaugeR - 12, speedAng);

  // Frostbite zone legend items
  const legendItems = frostbiteZones.slice().reverse();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Wind Chill & Frostbite Risk
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Wind Chill value */}
        <div className={`rounded-xl border p-5 text-center ${wcF <= -18 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Wind Chill</p>
          <p className={`text-3xl font-bold font-mono mt-1 ${wcF <= -18 ? 'text-red-600' : 'text-green-700'}`}>
            {wcF.toFixed(1)}°F
          </p>
          <p className="text-xs font-mono text-slate-500 mt-1">
            {wcC.toFixed(1)}°C
          </p>
        </div>

        {/* SVG Thermometer + Wind Gauge */}
        <div className="flex justify-center">
          <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} className="max-w-full h-auto" style={{ maxWidth: 350 }} role="img" aria-label="Wind chill thermometer gauge showing temperature with frostbite risk zones and wind speed gauge">
            {/* Thermometer tube */}
            <rect x={tubeLeft} y={tubeTop} width={tubeRight - tubeLeft} height={tubeH} rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />

            {/* Temperature fill */}
            <rect x={tubeLeft + 1} y={wcYclamped} width={tubeRight - tubeLeft - 2} height={fillH} rx="6" fill={getTempColor(wcF)} opacity="0.8" />

            {/* Bulb */}
            <circle cx={bulbCX} cy={tubeBottom + bulbR - 5} r={bulbR} fill={getTempColor(wcF)} opacity="0.8" />
            <circle cx={bulbCX} cy={tubeBottom + bulbR - 5} r={bulbR} fill="none" stroke="#cbd5e1" strokeWidth="1" />

            {/* Temperature scale */}
            {[-80, -60, -40, -18, 0, 20, 40, 60].map(t => {
              const y = tempToY(t);
              const isFrostbite = t <= -18;
              return (
                <g key={t}>
                  <line x1={tubeRight + 4} y1={y} x2={tubeRight + 12} y2={y} stroke={isFrostbite ? '#ef4444' : '#94a3b8'} strokeWidth="1" />
                  <text x={tubeRight + 14} y={y + 3.5} fill={isFrostbite ? '#ef4444' : '#64748b'} fontSize="8" className="text-[8px] font-mono">{t}°</text>
                </g>
              );
            })}

            {/* Wind Chill marker */}
            <line x1={tubeLeft - 10} y1={wcYclamped} x2={tubeLeft} y2={wcYclamped} stroke="#3b82f6" strokeWidth="2.5" />
            <circle cx={tubeLeft - 5} cy={wcYclamped} r="3" fill="#3b82f6" />

            {/* Wind speed gauge arc background */}
            {[0.25, 0.5, 0.75, 1].map(p => {
              const frac = p;
              const angle = Math.PI * 0.7 + frac * Math.PI * 0.6;
              const pt = polarToCart(gaugeCX, gaugeCY, gaugeR - 4, angle);
              return (
                <line key={p} x1={gaugeCX} y1={gaugeCY} x2={pt.x} y2={pt.y} stroke="#e2e8f0" strokeWidth="1" />
              );
            })}
            <path d={arcPath(arcStart, arcEnd, gaugeR - 4)} fill="none" stroke="#e2e8f0" strokeWidth="1" />

            {/* Wind speed gauge arc (colored) */}
            <path d={arcPath(arcStart, speedAng, gaugeR - 4)} fill="none" stroke={getSpeedColor(speedMph)} strokeWidth="3" strokeLinecap="round" />

            {/* Needle */}
            <line x1={gaugeCX} y1={gaugeCY} x2={needleEnd.x} y2={needleEnd.y} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
            <circle cx={gaugeCX} cy={gaugeCY} r="5" fill="#1e293b" />

            {/* Wind speed label */}
            <text x={gaugeCX} y={gaugeCY + 18} textAnchor="middle" fill="#475569" fontSize="11" fontWeight="bold" className="text-[11px] font-mono">
              {speedMph.toFixed(0)} mph
            </text>

            {/* Gauge title */}
            <text x={gaugeCX} y={gaugeCY - gaugeR + 6} textAnchor="middle" fill="#64748b" fontSize="8" className="text-[8px] uppercase tracking-wider">
              Wind Speed
            </text>

            {/* Safe / Danger labels */}
            <text x={polarToCart(gaugeCX, gaugeCY, gaugeR + 16, Math.PI * 0.85).x} y={polarToCart(gaugeCX, gaugeCY, gaugeR + 16, Math.PI * 0.85).y + 4} textAnchor="middle" fill="#64748b" fontSize="7" className="text-[7px uppercase]">Low</text>
            <text x={polarToCart(gaugeCX, gaugeCY, gaugeR + 16, Math.PI * 0.35).x} y={polarToCart(gaugeCX, gaugeCY, gaugeR + 16, Math.PI * 0.35).y + 4} textAnchor="middle" fill="#64748b" fontSize="7" className="text-[7px] uppercase">High</text>
          </svg>
        </div>

        {/* Frostbite zone legend */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Frostbite Risk Scale</p>
          <div className="space-y-1.5">
            {legendItems.map(zone => (
              <div key={zone.label} className="flex items-center gap-2 text-xs text-slate-600">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: zone.color }}
                />
                <span>
                  {zone.min === -Infinity ? `Below ${zone.max}°F: ` : zone.max === Infinity ? `Above ${zone.min}°F: ` : `${zone.min}°F to ${zone.max}°F: `}
                  <span className="font-medium">{zone.label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Safety warning box */}
        {wcF <= -18 && (
          <div className="rounded-xl border-2 border-red-300 bg-red-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <svg aria-hidden="true" className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-bold text-red-800 mb-1">Frostbite Warning</p>
                <p className="text-xs text-red-700">
                  {frostbiteRow?.value || ''}. Protect exposed skin by wearing gloves, a hat, scarf, and a face mask.
                  Limit time outdoors and watch for numbness, tingling, or pale skin — early signs of frostbite.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Two column info */}
        <div className="grid grid-cols-2 gap-2">
          {wsRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Wind Speed</p>
              <p className="text-sm font-bold font-mono text-slate-700">{wsRow.value}</p>
            </div>
          )}
          {wcFRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">°F Wind Chill</p>
              <p className="text-sm font-bold font-mono text-slate-700">{wcFRow.value}</p>
            </div>
          )}
          {wcCRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">°C Wind Chill</p>
              <p className="text-sm font-bold font-mono text-slate-700">{wcCRow.value}</p>
            </div>
          )}
          {frostbiteRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Frostbite Risk</p>
              <p className="text-sm font-bold font-mono text-slate-700">{frostbiteRow.value}</p>
            </div>
          )}
        </div>

        {/* Cold weather safety tips */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Cold Weather Safety</p>
          <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
            <li>Dress in layers — base layer (moisture-wicking), middle layer (insulation), outer layer (wind/water protection)</li>
            <li>Cover all exposed skin — heat loss is greatest from the head, neck, and hands</li>
            <li>Stay dry — wet clothing dramatically increases heat loss</li>
            <li>Limit strenuous activity in extreme cold to reduce stress on the heart</li>
            <li>Never ignore shivering — it is the first sign your body is losing heat</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
