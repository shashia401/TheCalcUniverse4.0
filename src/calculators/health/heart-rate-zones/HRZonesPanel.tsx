import { CalculatorResult } from '../../../types/calculator';
import HBarRow from '../../../components/calculator/HBarRow';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// Zone metadata for display only. The bpm ranges come from the calculator's own
// zone1..zone5 results so this panel can never disagree with index.ts.
const ZONE_DEFS = [
  { num: 1, name: 'Zone 1 — Warm Up / Recovery', low: 0.5, high: 0.6, color: 'bg-slate-600' },
  { num: 2, name: 'Zone 2 — Fat Burn / Aerobic Base', low: 0.6, high: 0.7, color: 'bg-emerald-700' },
  { num: 3, name: 'Zone 3 — Aerobic / Cardio', low: 0.7, high: 0.8, color: 'bg-amber-700' },
  { num: 4, name: 'Zone 4 — Anaerobic / Threshold', low: 0.8, high: 0.9, color: 'bg-orange-700' },
  { num: 5, name: 'Zone 5 — VO2 Max / All-Out', low: 0.9, high: 1.0, color: 'bg-red-700' },
];

export default function HRZonesPanel({ results }: Props) {
  const maxHR = results.find((r) => r.id === 'maxHR');
  const rhr = results.find((r) => r.id === 'rhr');
  const hrr = results.find((r) => r.id === 'hrr');
  const methodUsed = results.find((r) => r.id === 'methodUsed');

  if (!maxHR) return null;

  const maxHRVal = parseFloat(maxHR.value);
  // No rhr result means the calculator assumed a 60 bpm resting rate.
  const rhrVal = rhr ? parseFloat(rhr.value) : 60;
  const hrrVal = hrr ? parseFloat(hrr.value) : maxHRVal - rhrVal;
  const isKarvonen = !!methodUsed?.value?.includes('Karvonen');

  const zones = ZONE_DEFS.map((zone) => {
    const m = results.find((r) => r.id === `zone${zone.num}`)?.value.match(/^(\d+)–(\d+) bpm/);
    return { ...zone, lowBpm: m ? Number(m[1]) : 0, highBpm: m ? Number(m[2]) : 0 };
  });
  const maxBpm = zones[zones.length - 1].highBpm;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Heart Rate Zones Visual</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Formula display */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">
            {isKarvonen ? 'Karvonen Formula' : '% Max HR Formula'}
          </p>
          <div className="font-mono text-xs text-slate-700 space-y-0.5">
            {isKarvonen ? (
              <>
                <p>THR = ((HR<sub>max</sub> − HR<sub>rest</sub>) × %Intensity) + HR<sub>rest</sub></p>
                <p className="text-slate-600">
                  = (({maxHRVal} − {rhrVal}) × %Intensity) + {rhrVal}
                </p>
                <p className="text-slate-600">
                  = ({hrrVal} × %Intensity) + {rhrVal}
                </p>
              </>
            ) : (
              <>
                <p>THR = HR<sub>max</sub> × %Intensity</p>
                <p className="text-slate-600">= {maxHRVal} × %Intensity</p>
              </>
            )}
          </div>
        </div>

        {/* Zone visualization: each bar runs to the top of its zone; the label shows the full range */}
        <div role="group" aria-label="Heart rate zones, bar length is the top of each zone in beats per minute">
          {zones.map((zone) => (
            <HBarRow
              key={zone.num}
              label={`Z${zone.num}`}
              labelWidth="w-6"
              height="h-8"
              className="py-1"
              value={zone.highBpm}
              max={maxBpm}
              color={zone.color}
              display={`${zone.lowBpm}–${zone.highBpm} bpm`}
            />
          ))}
        </div>

        {/* Zone legend */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Training Zone Guide</p>
          <div className="space-y-2">
            {zones.map((zone) => (
              <div key={zone.num} className="flex items-start gap-2">
                <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${zone.color}`} />
                <div>
                  <p className="text-[11px] font-bold text-slate-700">{zone.name}</p>
                  <p className="text-[10px] text-slate-600">{zone.lowBpm}–{zone.highBpm} bpm · {(zone.low * 100).toFixed(0)}–{(zone.high * 100).toFixed(0)}% of {isKarvonen ? 'HRR' : 'Max HR'}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-[10px] text-slate-600 font-semibold">
              80/20 Rule: 80% of training in Zones 1–2, 20% in Zones 4–5
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
