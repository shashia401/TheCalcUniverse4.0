import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface HoverInfo {
  level: 'safe' | 'mild' | 'serious' | 'emergency';
  y: number;
}

export default function ChocolateToxicityPanel({ results }: Props) {
  const severityRow = results.find(r => r.id === 'severity');
  const severityColorRow = results.find(r => r.id === 'severityColor');
  const mgPerKgRow = results.find(r => r.id === 'mgPerKg');
  const totalRow = results.find(r => r.id === 'totalMethylxanthines');
  const theobromineRow = results.find(r => r.id === 'theobromineMg');
  const caffeineRow = results.find(r => r.id === 'caffeineMg');
  const vetPhoneRow = results.find(r => r.id === 'vetPhone');
  const vomitingRow = results.find(r => r.id === 'vomitingThreshold');
  const seizureRow = results.find(r => r.id === 'seizureThreshold');
  const dogWeightKgRow = results.find(r => r.id === 'dogWeightKg');
  const dogWeightLbsRow = results.find(r => r.id === 'dogWeightLbs');

  const severityColor = severityColorRow?.value || 'green';
  const mgPerKg = mgPerKgRow ? parseFloat(mgPerKgRow.value) : 0;

  // Toxicity meter gauge (0-100 mg/kg range)
  const gaugeMax = 80;
  const gaugeValue = Math.min(mgPerKg, gaugeMax);
  const gaugePercent = (gaugeValue / gaugeMax) * 100;

  // SVG traffic light dimensions
  const tlSize = 100;
  const tlCenter = tlSize / 2;
  const lightRadius = 22;
  const positions = [
    { cy: tlCenter - 28, color: '#22c55e', active: severityColor === 'green', label: 'Safe', level: 'safe' as const },
    { cy: tlCenter, color: '#eab308', active: severityColor === 'yellow', label: 'Mild', level: 'mild' as const },
    { cy: tlCenter + 28, color: '#ef4444', active: severityColor === 'red', label: 'Serious', level: 'serious' as const },
  ];

  const severityData: Record<string, { title: string; desc: string; threshold: string }> = {
    safe: { title: 'Low Risk (Safe)', desc: 'Methylxanthine level is below the mild toxicity threshold. No symptoms expected. Monitor your dog for any unusual behavior.', threshold: '< 20 mg/kg' },
    mild: { title: 'Mild Toxicity', desc: 'Methylxanthine level is in the mild range. Vomiting, diarrhea, and restlessness are possible. Contact your vet for guidance.', threshold: '20–39 mg/kg' },
    serious: { title: 'Serious Toxicity', desc: 'Methylxanthine level is in the serious range. Cardiac effects, tremors, and hyperthermia are possible. Seek veterinary care immediately.', threshold: '40–59 mg/kg' },
    emergency: { title: 'Emergency — Call Vet!', desc: 'Methylxanthine level is critical. Seizures, coma, and life-threatening cardiac arrhythmias are possible. Emergency veterinary care required.', threshold: '60+ mg/kg' },
  };

  // Determine the severity level from mg/kg for hover info
  const getSeverityLevel = (val: number): HoverInfo['level'] => {
    if (val < 20) return 'safe';
    if (val < 40) return 'mild';
    if (val < 60) return 'serious';
    return 'emergency';
  };

  const [hoverTl, setHoverTl] = useState<HoverInfo | null>(null);

  const handleTlMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = tlSize / rect.width;
    const scaleY = tlSize / rect.height;
    const svgY = (e.clientY - rect.top) * scaleY;

    // Determine which level based on Y position
    let level: HoverInfo['level'];
    if (svgY < tlCenter - 14) level = 'safe';
    else if (svgY < tlCenter + 14) level = 'mild';
    else level = 'serious';

    setHoverTl({ level, y: svgY });
  };

  const handleTlMouseLeave = () => setHoverTl(null);

  // Gauge hover
  const gaugeLevels = [
    { label: 'Safe', range: '0–19 mg/kg', color: '#22c55e', min: 0, max: 19 },
    { label: 'Mild', range: '20–39 mg/kg', color: '#eab308', min: 20, max: 39 },
    { label: 'Serious', range: '40–59 mg/kg', color: '#f97316', min: 40, max: 59 },
    { label: 'Emergency', range: '60+ mg/kg', color: '#ef4444', min: 60, max: Infinity },
  ];
  const currentGaugeLevel = gaugeLevels.findIndex(g => mgPerKg >= g.min && mgPerKg <= g.max);

  const [hoverGauge, setHoverGauge] = useState<number | null>(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Toxicity Assessment Results</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Traffic Light + Severity Badge */}
        <div className="flex items-center gap-6">
          {/* SVG Traffic Light with hover */}
          <svg
            width={tlSize}
            height={tlSize}
            viewBox={`0 0 ${tlSize} ${tlSize}`}
            className="flex-shrink-0 cursor-pointer"
            role="img"
            aria-label={'Toxicity severity traffic light indicator: ' + (severityColor === 'green' ? 'low risk' : severityColor === 'yellow' ? 'mild toxicity' : 'toxic')}
            onMouseMove={handleTlMouseMove}
            onMouseLeave={handleTlMouseLeave}
          >
            {/* Housing */}
            <rect x="20" y="5" width="60" height="90" rx="12" fill="#1e293b" />
            {positions.map((p, i) => (
              <circle
                key={`item-${i}`}
                cx={tlCenter}
                cy={p.cy}
                r={lightRadius}
                fill={p.active ? p.color : '#334155'}
                stroke={hoverTl?.level === p.level ? '#6366f1' : p.active ? p.color : '#475569'}
                strokeWidth={hoverTl?.level === p.level ? '3' : '1'}
              >
                {p.active && (
                  <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />
                )}
              </circle>
            ))}

            {/* SVG tooltip on hover */}
            {hoverTl && (
              <g>
                {/* Tooltip background */}
                <rect
                  x={hoverTl.level === 'serious' ? -105 : 55}
                  y={hoverTl.level === 'safe' ? 8 : hoverTl.level === 'mild' ? 28 : 48}
                  width={98}
                  height={28}
                  rx={4}
                  fill="white"
                  stroke="#6366f1"
                  strokeWidth="1"
                />
                <text
                  x={hoverTl.level === 'serious' ? -6 : 104}
                  y={hoverTl.level === 'safe' ? 24 : hoverTl.level === 'mild' ? 44 : 64}
                  textAnchor="start"
                  fill="#1e293b"
                  fontSize="9"
                  fontWeight="bold"
                >
                  {severityData[hoverTl.level].title}
                </text>
                <text
                  x={hoverTl.level === 'serious' ? -6 : 104}
                  y={hoverTl.level === 'safe' ? 33 : hoverTl.level === 'mild' ? 53 : 73}
                  textAnchor="start"
                  fill="#6366f1"
                  fontSize="8"
                >
                  {severityData[hoverTl.level].threshold}
                </text>
              </g>
            )}
          </svg>

          {/* Severity Info */}
          <div className="flex-1">
            {/* Color-coded badge */}
            <div
              className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                severityColor === 'green'
                  ? 'bg-green-100 text-green-700'
                  : severityColor === 'yellow'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {severityColor === 'green' ? 'Low Risk' : severityColor === 'yellow' ? 'Mild Toxicity' : 'Toxic — Call Vet!'}
            </div>
            {severityRow && (
              <p className={`text-sm font-medium ${
                severityColor === 'green' ? 'text-green-700' : severityColor === 'yellow' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {severityRow.value}
              </p>
            )}
          </div>
        </div>

        {/* Toxicity Meter Gauge */}
        {mgPerKgRow && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-500">Toxicity Level (mg/kg)</span>
              <span className="text-sm font-mono font-bold text-slate-700">{mgPerKgRow.value}</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden relative">
              {/* Gradient bar background */}
              <div className="h-full w-full rounded-full" style={{
                background: 'linear-gradient(to right, #22c55e 0%, #22c55e 25%, #eab308 25%, #eab308 50%, #f97316 50%, #f97316 75%, #ef4444 75%, #ef4444 100%)',
                opacity: 0.3,
              }} />
              {/* Active indicator */}
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${gaugePercent}%`,
                  background: severityColor === 'green'
                    ? '#22c55e'
                    : severityColor === 'yellow'
                    ? '#eab308'
                    : '#ef4444',
                  opacity: 0.8,
                }}
              />
              {/* Marker dot */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 rounded-full shadow-md transition-all duration-500"
                style={{
                  left: `calc(${gaugePercent}% - 6px)`,
                  borderColor: severityColor === 'green' ? '#22c55e' : severityColor === 'yellow' ? '#eab308' : '#ef4444',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              {['Safe (0)', 'Mild (20)', 'Serious (40)', 'Emergency (60+)'].map((label, i) => (
                <span
                  key={label}
                  onMouseEnter={() => setHoverGauge(i)}
                  onMouseLeave={() => setHoverGauge(null)}
                  className={`cursor-pointer transition-colors ${hoverGauge === i ? 'text-indigo-600 font-bold' : currentGaugeLevel === i ? 'font-bold text-slate-700' : ''}`}
                >
                  {label}
                </span>
              ))}
            </div>
            {/* Gauge hover tooltip */}
            {hoverGauge !== null && (
              <div className="mt-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[10px] flex items-center gap-2">
                <svg className="w-3 h-3 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-indigo-700">
                  <strong>{gaugeLevels[hoverGauge].label}:</strong> {gaugeLevels[hoverGauge].range} — {severityData[gaugeLevels[hoverGauge].label.toLowerCase() === 'safe' ? 'safe' : gaugeLevels[hoverGauge].label.toLowerCase() === 'mild' ? 'mild' : gaugeLevels[hoverGauge].label.toLowerCase() === 'serious' ? 'serious' : 'emergency'].desc}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Key Numbers */}
        <div className="grid grid-cols-2 gap-3">
          {theobromineRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Theobromine</p>
              <p className="text-sm font-mono font-bold text-slate-700">{theobromineRow.value}</p>
            </div>
          )}
          {caffeineRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Caffeine</p>
              <p className="text-sm font-mono font-bold text-slate-700">{caffeineRow.value}</p>
            </div>
          )}
          {totalRow && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
              <p className="text-[10px] font-bold text-blue-400 uppercase">Total Methylxanthines</p>
              <p className="text-sm font-mono font-bold text-blue-700">{totalRow.value}</p>
            </div>
          )}
          {dogWeightKgRow && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Dog Weight</p>
              <p className="text-sm font-mono font-bold text-slate-700">{dogWeightKgRow.value} / {dogWeightLbsRow?.value}</p>
            </div>
          )}
        </div>

        {/* Thresholds */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Toxicity Thresholds</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400 flex-shrink-0" />
              <span className="text-xs text-slate-600">
                <strong>Mild toxicity:</strong> 20 mg/kg ({vomitingRow?.value || 'N/A'})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400 flex-shrink-0" />
              <span className="text-xs text-slate-600">
                <strong>Serious toxicity:</strong> 40 mg/kg — cardiac effects, tremors
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400 flex-shrink-0" />
              <span className="text-xs text-slate-600">
                <strong>Emergency:</strong> 60 mg/kg ({seizureRow?.value || 'N/A'}) — seizures, coma risk
              </span>
            </div>
          </div>
        </div>

        {/* Call Vet Section */}
        {vetPhoneRow && (
          <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-2">Call a Veterinarian If Concerned</p>
            <p className="text-xl font-bold font-mono text-red-700">{vetPhoneRow.value}</p>
            <p className="text-xs text-red-500 mt-1">ASPCA Animal Poison Control Center &mdash; Available 24/7</p>
            <p className="text-xs text-red-500 mt-1">(Fees may apply. Have the chocolate wrapper and your dog's weight ready.)</p>
          </div>
        )}

        {/* Symptoms */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Symptoms to Watch For</p>
          <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Vomiting / Diarrhea
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Restlessness
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Rapid Heart Rate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Muscle Tremors
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Excessive Thirst
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Seizures
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
