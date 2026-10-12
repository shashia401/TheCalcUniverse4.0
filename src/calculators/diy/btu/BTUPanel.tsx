import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';
import { btu, CLIMATE_LABELS, BTU_PER_EXTRA_PERSON, KITCHEN_BTU } from './btuMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const CEILING_LABELS: Record<string, string> = { '8': '8 ft', '9': '9-10 ft', '12': '12+ ft' };
const SUN_LABELS: Record<string, string> = { minimal: 'Minimal', moderate: 'Moderate', high: 'High' };
const INSULATION_LABELS: Record<string, string> = { poor: 'Poor', average: 'Average', good: 'Good' };
const ROOM_LABELS: Record<string, string> = { standard: 'Standard', kitchen: 'Kitchen', basement: 'Basement' };
const ROOM_TYPE_KEYS = ['standard', 'kitchen', 'basement'];

const fmtNum = (n: number) => Math.round(n).toLocaleString();
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Blue (small load) through yellow to red (large load). */
function tempColor(ratio: number): string {
  const r = clamp01(ratio);
  const red = Math.round(Math.min(r * 2, 1) * 255);
  const green = Math.round(Math.max(1 - Math.abs(r - 0.5) * 2, 0) * 200);
  const blue = Math.round(Math.max(1 - r * 2, 0) * 255);
  return `rgb(${red}, ${green}, ${blue})`;
}

export default function BTUPanel({ values, results }: Props) {
  const r = btu(values);
  if (!r || !results.length) return null;
  const heating = r.purpose === 'heating';

  // Relative to 60k BTU/h (~5 ton) for the colour scale.
  const color = tempColor(r.totalBTU / 60000);
  const maxTons = 6;
  const filledSegments = Math.min(maxTons * 2, Math.round(r.tons * 2));

  const factorRows: Array<{ label: string; detail: string; multiplier: string }> = [
    { label: 'Area', detail: `${r.area} sq ft`, multiplier: '' },
    { label: 'Climate Zone', detail: CLIMATE_LABELS[values.climateZone] || '', multiplier: `${r.perSqFt} BTU/sq ft` },
    { label: 'Ceiling Height', detail: CEILING_LABELS[values.ceilingHeight] || '', multiplier: `${r.ceilingFactor.toFixed(2)}x` },
    { label: 'Insulation', detail: INSULATION_LABELS[values.insulation] || '', multiplier: `${r.insulationFactor.toFixed(2)}x` },
  ];
  if (!heating) {
    factorRows.splice(3, 0, { label: 'Sun Exposure', detail: SUN_LABELS[values.sunExposure] || '', multiplier: `${r.sunFactor.toFixed(2)}x` });
    factorRows.push({ label: 'Room Type', detail: ROOM_LABELS[values.roomType] || '', multiplier: values.roomType === 'kitchen' ? `+${KITCHEN_BTU.toLocaleString()} BTU/h` : `${r.roomFactor.toFixed(2)}x` });
    factorRows.push({ label: 'Occupants', detail: `${r.occupants} people`, multiplier: `+${Math.max(0, r.occupants - 2) * BTU_PER_EXTRA_PERSON} BTU/h` });
  }

  const comparison = heating
    ? []
    : ROOM_TYPE_KEYS.map((key) => ({ key, label: ROOM_LABELS[key], btu: btu({ ...values, roomType: key })?.totalBTU ?? 0 }));
  const maxComparison = Math.max(...comparison.map((d) => d.btu), 1);
  const roomDetails = results.find((x) => x.id === 'roomDetails');

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border p-6 text-center shadow-md overflow-hidden relative" style={{ borderColor: color, boxShadow: `0 4px 24px ${color}22` }}>
        <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl" style={{ background: 'linear-gradient(to right, #3b82f6, #22d3ee, #facc15, #f97316, #ef4444)' }} />
        <p className="text-sm text-slate-600 mb-1">{heating ? 'Heating BTU/h Required' : 'Cooling BTU/h Required'}</p>
        <p className="text-5xl font-extrabold mb-2" style={{ color }}>{fmtNum(r.totalBTU)} BTU/h</p>
        <p className="text-lg text-slate-600">
          BTU per sq ft: <span className="font-semibold text-slate-700">{fmtNum(r.btuPerSqFt)} BTU/sq ft</span>
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">{heating ? 'Heating Capacity' : 'AC Recommendation'}</p>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <p className="text-sm text-slate-600">{heating ? 'Capacity (tons of 12,000 BTU/h)' : 'AC Size (Tons)'}</p>
            <p className="text-3xl font-bold text-slate-800">{r.tons.toFixed(1)} ton</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-600">{heating ? 'Nearest Standard Size Up' : 'Recommended AC Unit'}</p>
            <p className="text-lg font-bold text-blue-700">{r.recommendedTons.toFixed(1)} ton ({fmtNum(r.recommendedBTU)} BTU/h)</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap" role="img" aria-label={`${r.tons.toFixed(1)} tons of capacity on a ${maxTons} ton scale`}>
          {Array.from({ length: maxTons * 2 }, (_, i) => (
            <div key={`item-${i}`} className={`w-4 h-4 rounded-full transition-colors ${i < filledSegments ? 'bg-blue-700' : 'bg-slate-200'}`} />
          ))}
          <span className="text-[11px] text-slate-600 ml-2">{maxTons} tons max</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Factor Breakdown</p>
        </div>
        <div className="divide-y divide-slate-100">
          {factorRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-2.5 text-sm">
              <span className="text-slate-600">{row.label}</span>
              <div className="text-right">
                <span className="text-slate-800 font-medium">{row.detail}</span>
                {row.multiplier && <span className="text-slate-600 ml-2 text-[12px]">({row.multiplier})</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {comparison.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Cooling BTU by Room Type</p>
          {comparison.map((d) => (
            <HBarRow
              key={d.key}
              label={d.key === values.roomType ? `${d.label} (selected)` : d.label}
              value={d.btu}
              max={maxComparison}
              display={`${fmtNum(d.btu)}`}
              color={d.key === values.roomType ? 'bg-blue-700' : 'bg-slate-600'}
              labelWidth="w-36"
              height="h-5"
              className="py-1"
            />
          ))}
        </div>
      )}

      {roomDetails && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Room Details</p>
          <p className="text-xs text-slate-600">{roomDetails.value}</p>
        </div>
      )}
    </div>
  );
}
