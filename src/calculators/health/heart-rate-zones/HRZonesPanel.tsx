import { useState } from 'react';
import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const ZONE_DEFS = [
  { num: 1, name: 'Zone 1 — Warm Up / Recovery', low: 0.5, high: 0.6, color: 'bg-slate-400', textColor: 'text-slate-600' },
  { num: 2, name: 'Zone 2 — Fat Burn / Aerobic Base', low: 0.6, high: 0.7, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
  { num: 3, name: 'Zone 3 — Aerobic / Cardio', low: 0.7, high: 0.8, color: 'bg-amber-500', textColor: 'text-amber-700' },
  { num: 4, name: 'Zone 4 — Anaerobic / Threshold', low: 0.8, high: 0.9, color: 'bg-orange-500', textColor: 'text-orange-700' },
  { num: 5, name: 'Zone 5 — VO2 Max / All-Out', low: 0.9, high: 1.0, color: 'bg-red-500', textColor: 'text-red-700' },
];

export default function HRZonesPanel({ results }: Props) {
  const maxHR = results.find(r => r.id === 'maxHR');
  const rhr = results.find(r => r.id === 'rhr');
  const hrr = results.find(r => r.id === 'hrr');
  const methodUsed = results.find(r => r.id === 'methodUsed');

  if (!maxHR) return null;

  const safeMax = (n: number) => isNaN(n) ? 0 : n;

  const maxHRVal = parseInt(maxHR.value);
  const rhrVal = rhr ? parseInt(rhr.value) : 65;
  const hrrVal = hrr ? parseInt(hrr.value) : (isNaN(maxHRVal) ? 0 : maxHRVal) - (isNaN(rhrVal) ? 0 : rhrVal);
  const isKarvonen = methodUsed?.value?.includes('Karvonen');

  // Calculate zone ranges
  const zones = ZONE_DEFS.map(zone => {
    let lowBpm: number;
    let highBpm: number;
    if (isKarvonen) {
      lowBpm = Math.round(zone.low * safeMax(hrrVal) + safeMax(rhrVal));
      highBpm = Math.round(zone.high * safeMax(hrrVal) + safeMax(rhrVal));
    } else {
      lowBpm = Math.round(zone.low * safeMax(maxHRVal));
      highBpm = Math.round(zone.high * safeMax(maxHRVal));
    }
    return { ...zone, lowBpm, highBpm };
  });

  const maxBpm = zones[zones.length - 1].highBpm;

  const [hoverInfo, setHoverInfo] = useState<{ name: string; lowBpm: number; highBpm: number; pctLow: number; pctHigh: number } | null>(null);

  // Zone 2 bar spans 60-70%
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            {isKarvonen ? 'Karvonen Formula' : '% Max HR Formula'}
          </p>
          <div className="font-mono text-xs text-slate-700 space-y-0.5">
            {isKarvonen ? (
              <>
                <p>THR = ((HR<sub>max</sub> − HR<sub>rest</sub>) × %Intensity) + HR<sub>rest</sub></p>
                <p className="text-slate-500">
                  = (({maxHRVal} − {rhrVal}) × %Intensity) + {rhrVal}
                </p>
                <p className="text-slate-500">
                  = ({hrrVal} × %Intensity) + {rhrVal}
                </p>
              </>
            ) : (
              <>
                <p>THR = HR<sub>max</sub> × %Intensity</p>
                <p className="text-slate-500">= {maxHRVal} × %Intensity</p>
              </>
            )}
          </div>
        </div>

        {/* Zone visualization */}
        <div className="space-y-2">
          {zones.map(zone => {
            const totalRange = maxBpm;
            const startPct = (zone.lowBpm / totalRange) * 100;
            const widthPct = ((zone.highBpm - zone.lowBpm) / totalRange) * 100;
            return (
              <div
                key={zone.num}
                className="flex items-center gap-3"
                onMouseEnter={() => setHoverInfo({ name: zone.name, lowBpm: zone.lowBpm, highBpm: zone.highBpm, pctLow: zone.low * 100, pctHigh: zone.high * 100 })}
                onMouseLeave={() => setHoverInfo(null)}
              >
                <span className="text-[10px] font-bold text-slate-500 w-5 flex-shrink-0 text-right">Z{zone.num}</span>
                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                  <div
                    className={`h-full rounded-lg ${zone.color} transition-all flex items-center justify-center`}
                    style={{ width: `${Math.max(widthPct, 5)}%`, marginLeft: `${startPct}%` }}
                  >
                    <span className="text-[10px] font-bold text-white drop-shadow-sm truncate px-1">{zone.name.split(' — ')[1]}</span>
                  </div>
                </div>
                <div className="w-24 flex-shrink-0 text-right">
                  <span className="text-xs font-bold text-slate-800 tabular-nums">{zone.lowBpm}–{zone.highBpm}</span>
                  <span className="text-[10px] text-slate-500 ml-1">bpm</span>
                </div>
              </div>
            );
          })}
        </div>

        {hoverInfo && (
          <div className="text-xs text-center text-slate-600 bg-slate-100 rounded-lg px-3 py-2">
            <span className="font-semibold">{hoverInfo.name}</span>
            <span className="text-slate-400 mx-1">—</span>
            <span className="font-bold text-slate-800">{hoverInfo.lowBpm}–{hoverInfo.highBpm} bpm</span>
            <span className="text-slate-500 ml-1">· {hoverInfo.pctLow.toFixed(0)}–{hoverInfo.pctHigh.toFixed(0)}% intensity</span>
          </div>
        )}

        {/* Zone legend */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Training Zone Guide</p>
          <div className="space-y-2">
            {zones.map(zone => (
              <div key={zone.num} className="flex items-start gap-2">
                <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${zone.color}`} />
                <div>
                  <p className="text-[11px] font-bold text-slate-700">{zone.name}</p>
                  <p className="text-[10px] text-slate-500">{zone.lowBpm}–{zone.highBpm} bpm · {(zone.low * 100).toFixed(0)}–{(zone.high * 100).toFixed(0)}% of {isKarvonen ? 'HRR' : 'Max HR'}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-[10px] text-slate-500 font-semibold">
              80/20 Rule: 80% of training in Zones 1–2, 20% in Zones 4–5
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
