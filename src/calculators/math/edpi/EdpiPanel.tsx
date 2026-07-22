import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const GAME_NAMES: Record<string, string> = {
  'CS:GO': 'CS:GO / CS2',
  Valorant: 'Valorant',
  Overwatch: 'Overwatch 2',
  'Apex Legends': 'Apex Legends',
  'Rainbow Six Siege': 'Rainbow Six Siege',
};

// Pro player reference settings
const PRO_SETTINGS = [
  { name: 's1mple (CS:GO)', dpi: 400, sens: 3.09, edpi: 1236 },
  { name: 'TenZ (Valorant)', dpi: 800, sens: 0.35, edpi: 280 },
  { name: 'Aceu (Apex)', dpi: 800, sens: 1.8, edpi: 1440 },
  { name: 'Shroud (Varied)', dpi: 450, sens: 2.0, edpi: 900 },
  { name: 'Hiko (Valorant)', dpi: 800, sens: 0.47, edpi: 376 },
];

export default function EdpiPanel({ values, results }: Props) {
  const edpiRow = results.find(r => r.id === 'edpi');
  const targetSensRow = results.find(r => r.id === 'targetSensitivity');
  const edpi = edpiRow ? parseInt(edpiRow.value, 10) : 0;
  const targetGame = values.targetGame || '';

  const currentGame = values.currentGame || 'CS:GO';

  // Sensitivity ring parameters
  const ringSize = 180;
  const center = ringSize / 2;
  const radius = 70;
  // Map eDPI to a position on the arc (typical range 200-3200)
  const minEdpi = 200;
  const maxEdpi = 3200;
  const clamped = Math.max(minEdpi, Math.min(maxEdpi, edpi));
  const fraction = (clamped - minEdpi) / (maxEdpi - minEdpi);
  const startAngle = -150; // degrees, left side
  const sweepAngle = 300; // total arc sweep
  const angleDeg = startAngle + fraction * sweepAngle;
  const angleRad = (angleDeg * Math.PI) / 180;
  const indicatorX = center + radius * Math.cos(angleRad);
  const indicatorY = center + radius * Math.sin(angleRad);

  // Arc path for the ring
  const arcStartRad = ((startAngle) * Math.PI) / 180;
  const arcEndRad = ((startAngle + sweepAngle) * Math.PI) / 180;
  const arcStartX = center + radius * Math.cos(arcStartRad);
  const arcStartY = center + radius * Math.sin(arcStartRad);
  const arcEndX = center + radius * Math.cos(arcEndRad);
  const arcEndY = center + radius * Math.sin(arcEndRad);
  const largeArc = sweepAngle > 180 ? 1 : 0;
  const arcPath = `M ${arcStartX} ${arcStartY} A ${radius} ${radius} 0 ${largeArc} 1 ${arcEndX} ${arcEndY}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Sensitivity Analysis &amp; Comparison</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Large eDPI Display */}
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Your Effective DPI</p>
          <p className="text-5xl font-bold font-mono text-blue-600">{edpi}</p>
          <p className="text-sm text-slate-500 mt-1">
            {values.mouseDpi} DPI &times; {values.sensitivity} sens ({GAME_NAMES[currentGame] || currentGame})
          </p>
        </div>

        {/* Virtual Sensitivity Ring */}
        <div className="flex justify-center">
          <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} role="img" aria-label="eDPI sensitivity ring gauge showing effective DPI value on a range from low to high">
            {/* Background arc */}
            <path d={arcPath} fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
            {/* Active arc */}
            <path
              d={`M ${arcStartX} ${arcStartY} A ${radius} ${radius} 0 0 1 ${indicatorX} ${indicatorY}`}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Indicator dot */}
            <circle cx={indicatorX} cy={indicatorY} r="8" fill="#3b82f6" stroke="white" strokeWidth="2" />
            <circle cx={indicatorX} cy={indicatorY} r="3" className="fill-white dark:fill-slate-800" />
            {/* Center text */}
            <text x={center} y={center + 5} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">
              eDPI
            </text>
            <text x={center} y={center + 20} textAnchor="middle" fill="#94a3b8" fontSize="10">
              {edpi}
            </text>
            {/* Range labels */}
            <text x={arcStartX - 5} y={arcStartY + 25} textAnchor="middle" fill="#94a3b8" fontSize="9">Low</text>
            <text x={arcEndX + 5} y={arcEndY + 25} textAnchor="middle" fill="#94a3b8" fontSize="9">High</text>
          </svg>
        </div>

        {/* Cross-game conversion */}
        {targetSensRow && targetGame && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-1">Converted Sensitivity</p>
            <p className="text-2xl font-bold font-mono text-green-700">{targetSensRow.value}</p>
            <p className="text-sm text-green-600 mt-1">
              in {GAME_NAMES[targetGame] || targetGame}
            </p>
            <p className="text-xs text-green-500 mt-2">
              Same eDPI ({edpi}) &mdash; same muscle memory
            </p>
          </div>
        )}

        {/* Pro Settings Comparison Table */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Pro Player Reference Settings</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  <th scope="col" className="text-left py-2 px-2 font-bold text-slate-500">Player</th>
                  <th scope="col" className="text-right py-2 px-2 font-bold text-slate-500">DPI</th>
                  <th scope="col" className="text-right py-2 px-2 font-bold text-slate-500">Sens</th>
                  <th scope="col" className="text-right py-2 px-2 font-bold text-slate-500">eDPI</th>
                </tr>
              </thead>
              <tbody>
                {PRO_SETTINGS.map((pro, i) => (
                  <tr
                    key={`item-${i}`}
                    className={`border-b border-slate-100 ${Math.abs(pro.edpi - edpi) < 100 ? 'bg-blue-50 font-bold' : ''}`}
                  >
                    <td className="py-2 px-2 text-slate-700">{pro.name}</td>
                    <td className="py-2 px-2 text-right font-mono text-slate-600">{pro.dpi}</td>
                    <td className="py-2 px-2 text-right font-mono text-slate-600">{pro.sens}</td>
                    <td className={`py-2 px-2 text-right font-mono ${Math.abs(pro.edpi - edpi) < 100 ? 'text-blue-600' : 'text-slate-600'}`}>
                      {pro.edpi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* eDPI Range Reference */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">eDPI Range Reference</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400 flex-shrink-0" />
              <span className="text-xs text-slate-600">Low (200-800) &mdash; Precise aiming, larger arm movements</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400 flex-shrink-0" />
              <span className="text-xs text-slate-600">Medium (800-1600) &mdash; Balanced, most common for pros</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-400 flex-shrink-0" />
              <span className="text-xs text-slate-600">High (1600-3200) &mdash; Fast turning, wrist aiming</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400 flex-shrink-0" />
              <span className="text-xs text-slate-600">Very High (3200+) &mdash; Very fast, can be hard to control</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
