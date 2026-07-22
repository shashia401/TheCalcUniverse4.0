import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// ─── Factor lookup tables ────────────────────────────────────────────────────────

const CLIMATE_FACTORS: Record<string, number> = { '1': 30, '2': 25, '3': 20, '4': 15 };
const CEILING_FACTORS: Record<string, number> = { '8': 1.0, '9': 1.1, '12': 1.25 };
const SUN_FACTORS: Record<string, number> = { minimal: 0.9, moderate: 1.0, high: 1.15 };
const INSULATION_FACTORS: Record<string, number> = { poor: 1.2, average: 1.0, good: 0.9 };
const ROOM_FACTORS: Record<string, number> = { standard: 1.0, kitchen: 1.15, basement: 0.85 };

const CLIMATE_LABELS: Record<string, string> = {
  '1': 'Zone 1 — Hot', '2': 'Zone 2 — Mixed', '3': 'Zone 3 — Cool', '4': 'Zone 4 — Cold',
};
const CEILING_LABELS: Record<string, string> = { '8': '8 ft (1.0x)', '9': '9-10 ft (1.1x)', '12': '12+ ft (1.25x)' };
const SUN_LABELS: Record<string, string> = { minimal: 'Minimal (0.9x)', moderate: 'Moderate (1.0x)', high: 'High (1.15x)' };
const INSULATION_LABELS: Record<string, string> = { poor: 'Poor (1.2x)', average: 'Average (1.0x)', good: 'Good (0.9x)' };
const ROOM_LABELS: Record<string, string> = { standard: 'Standard (1.0x)', kitchen: 'Kitchen (1.15x)', basement: 'Basement (0.85x)' };
const ROOM_TYPE_KEYS: Array<{ key: string; label: string }> = [
  { key: 'standard', label: 'Standard' },
  { key: 'kitchen', label: 'Kitchen' },
  { key: 'basement', label: 'Basement' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function parseNum(s: string): number {
  const m = /([\d,.]+)/.exec(s.replace(/,/g, ''));
  return m ? parseFloat(m[1]) : 0;
}

function fmtNum(n: number): string {
  return Math.round(n).toLocaleString();
}

/** Clamp a value between 0 and 1 for visual indicators. */
function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/**
 * Compute a temperature color based on the BTU/temperature ratio.
 * Ratio 0 = cool blue, 0.5 = warm yellow, 1.0 = hot red.
 */
function tempColor(ratio: number): string {
  const r = clamp01(ratio);
  // Interpolate: blue (0,0,255) → cyan → yellow → red (255,0,0)
  const red = Math.round(Math.min(r * 2, 1) * 255);
  const green = Math.round(Math.max(1 - Math.abs(r - 0.5) * 2, 0) * 200);
  const blue = Math.round(Math.max(1 - r * 2, 0) * 255);
  return `rgb(${red}, ${green}, ${blue})`;
}

// ─── BTUPanel ────────────────────────────────────────────────────────────────────

export default function BTUPanel({ values, results }: Props) {
  const btuRequired = results.find((r) => r.id === 'btuRequired');
  const tonsRequired = results.find((r) => r.id === 'tonsRequired');
  const recommendedAC = results.find((r) => r.id === 'recommendedAC');
  const btuPerSqFt = results.find((r) => r.id === 'btuPerSqFt');
  const roomDetails = results.find((r) => r.id === 'roomDetails');

  if (!btuRequired || !tonsRequired || !recommendedAC || !btuPerSqFt) return null;

  const btuValue = parseNum(btuRequired.value);
  const tonsVal = parseNum(tonsRequired.value);

  // Temperature color ratio (relative to 60k BTU/h = ~5 ton max for residential)
  const tempRatio = clamp01(btuValue / 60000);
  const color = tempColor(tempRatio);

  // Factor breakdown
  const area = parseFloat(values.area || '0');
  const climateZone = values.climateZone || '';
  const ceilingHeight = values.ceilingHeight || '';
  const sunExposure = values.sunExposure || '';
  const insulation = values.insulation || '';
  const roomType = values.roomType || '';
  const people = parseInt(values.people || '1', 10);

  const cf = CLIMATE_FACTORS[climateZone] ?? 0;
  const chf = CEILING_FACTORS[ceilingHeight] ?? 0;
  const sf = SUN_FACTORS[sunExposure] ?? 0;
  const inf = INSULATION_FACTORS[insulation] ?? 0;
  const rf = ROOM_FACTORS[roomType] ?? 0;

  const factorRows: Array<{ label: string; detail: string; multiplier: string }> = [
    { label: 'Area', detail: `${area} sq ft`, multiplier: '' },
    { label: 'Climate Zone', detail: CLIMATE_LABELS[climateZone] || '', multiplier: `${cf} BTU/sq ft` },
    { label: 'Ceiling Height', detail: CEILING_LABELS[ceilingHeight] || '', multiplier: `${chf.toFixed(2)}x` },
    { label: 'Sun Exposure', detail: SUN_LABELS[sunExposure] || '', multiplier: `${sf.toFixed(2)}x` },
    { label: 'Insulation', detail: INSULATION_LABELS[insulation] || '', multiplier: `${inf.toFixed(2)}x` },
    { label: 'Room Type', detail: ROOM_LABELS[roomType] || '', multiplier: `${rf.toFixed(2)}x` },
    { label: 'Occupants', detail: `${people} people`, multiplier: `+${people * 600} BTU/h` },
  ];

  // Comparison BTU values for each room type
  const comparisonData = ROOM_TYPE_KEYS.map((rt) => {
    const rFactor = ROOM_FACTORS[rt.key] ?? 1.0;
    const base = area * cf * chf * sf * inf * rFactor;
    const total = base + people * 600;
    return { label: rt.label, btu: total, key: rt.key };
  });
  const maxComparisonBTU = Math.max(...comparisonData.map((d) => d.btu), 1);

  // Tonnage visual: show filled/empty circles for 0.5 ton increments up to 6 tons
  const maxTons = 6;
  const filledSegments = Math.round(tonsVal * 2);

  return (
    <div className="space-y-5">
      {/* ── BTU Display Card ── */}
      <div
        className="rounded-2xl border p-6 text-center shadow-md overflow-hidden relative"
        style={{ borderColor: color, boxShadow: `0 4px 24px ${color}22` }}
      >
        {/* Temperature gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
          style={{
            background: 'linear-gradient(to right, #3b82f6, #22d3ee, #facc15, #f97316, #ef4444)',
          }}
        />

        <p className="text-sm text-slate-500 mb-1">{btuRequired.label}</p>
        <p className="text-5xl font-extrabold mb-2" style={{ color }}>
          {btuRequired.value}
        </p>
        <p className="text-lg text-slate-500">
          {btuPerSqFt.label}: <span className="font-semibold text-slate-600">{btuPerSqFt.value}</span>
        </p>
      </div>

      {/* ── AC Recommendation ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
          AC Recommendation
        </p>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <p className="text-sm text-slate-500">{tonsRequired.label}</p>
            <p className="text-3xl font-bold text-slate-800">{tonsRequired.value}</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-500">{recommendedAC.label}</p>
            <p className="text-lg font-bold text-blue-700">{recommendedAC.value}</p>
          </div>
        </div>

        {/* Tonnage visual — filled/empty circles */}
        <div className="flex items-center gap-1 flex-wrap">
          {Array.from({ length: maxTons * 2 }, (_, i) => (
            <div
              key={`item-${i}`}
              className={`w-4 h-4 rounded-full transition-colors ${
                i < filledSegments ? 'bg-blue-500' : 'bg-slate-200'
              }`}
              title={`${((i + 1) * 0.5).toFixed(1)} ton`}
            />
          ))}
          <span className="text-[11px] text-slate-500 ml-2">{maxTons} tons max</span>
        </div>
      </div>

      {/* ── Factor Breakdown ── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Factor Breakdown
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {factorRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-2.5 text-sm">
              <span className="text-slate-600">{row.label}</span>
              <div className="text-right">
                <span className="text-slate-800 font-medium">{row.detail}</span>
                {row.multiplier && (
                  <span className="text-slate-500 ml-2 text-[12px]">({row.multiplier})</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Room Type Comparison Chart ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
          BTU by Room Type
        </p>
        <div className="space-y-3">
          {comparisonData.map((d) => {
            const pct = (d.btu / maxComparisonBTU) * 100;
            const isActive = d.key === roomType;
            return (
              <div key={d.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className={isActive ? 'font-bold text-slate-800' : 'text-slate-500'}>
                    {d.label} {isActive ? '(selected)' : ''}
                  </span>
                  <span className={isActive ? 'font-bold text-slate-800' : 'text-slate-500'}>
                    {fmtNum(d.btu)} BTU/h
                  </span>
                </div>
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isActive ? 'bg-blue-500' : 'bg-slate-300'
                    }`}
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Room Details ── */}
      {roomDetails && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            Room Details
          </p>
          <p className="text-xs text-slate-600">{roomDetails.value}</p>
        </div>
      )}
    </div>
  );
}
