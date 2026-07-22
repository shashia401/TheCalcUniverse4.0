import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function MagicTriangle({ highlight }: { highlight: 'W' | 'm' | 'g' }) {
  const highlightColor = '#2563eb';
  const defaultColor = '#475569';

  const topColor = highlight === 'W' ? highlightColor : defaultColor;
  const blColor = highlight === 'm' ? highlightColor : defaultColor;
  const brColor = highlight === 'g' ? highlightColor : defaultColor;

  return (
    <svg viewBox="0 0 140 120" className="w-28 h-24 sm:w-32 sm:h-28 mx-auto" role="img" aria-label="Weight formula triangle">
      <polygon points="70,5 135,110 5,110" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinejoin="round" />
      <line x1="5" y1="110" x2="135" y2="110" stroke="#cbd5e1" strokeWidth="2" />
      <text x="70" y="52" textAnchor="middle" dominantBaseline="central" fontSize="28" fontWeight="bold" fill={topColor} className="select-none">W</text>
      <line x1="70" y1="55" x2="70" y2="110" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
      <text x="38" y="86" textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="bold" fill={blColor} className="select-none">m</text>
      <text x="102" y="86" textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="bold" fill={brColor} className="select-none">g</text>
      <circle
        cx={highlight === 'W' ? 70 : highlight === 'm' ? 38 : 102}
        cy={highlight === 'W' ? 52 : 86}
        r="18"
        fill="none"
        stroke={highlightColor}
        strokeWidth="2"
        strokeDasharray="4,3"
        opacity="0.6"
      />
    </svg>
  );
}

function PlanetBar({ planet, weight, color }: { planet: string; weight: string; color: string }) {
  const maxWeight = 20000;
  const numWeight = parseFloat(weight.replace(/[^0-9.-]/g, '')) || 0;
  const pct = Math.min((numWeight / maxWeight) * 100, 100);

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-14 font-semibold text-slate-700 text-right text-xs">{planet}</span>
      <div className="flex-1 h-5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-24 font-mono text-slate-600 text-xs">{weight}</span>
    </div>
  );
}

export default function WeightPanel({ values, results }: Props) {
  const result = results.find(r => r.id === 'result');
  const weightLbf = results.find(r => r.id === 'weightLbf');
  const massKg = results.find(r => r.id === 'massKg');
  const gravityUsed = results.find(r => r.id === 'gravityUsed');
  const formula = results.find(r => r.id === 'formula');
  const steps = results.find(r => r.id === 'steps');
  const humanComparison = results.find(r => r.id === 'humanComparison');

  if (!result || !formula) return null;

  const mode = values.mode || 'calcWeight';
  const highlight = mode === 'calcWeight' ? 'W' : mode === 'calcMass' ? 'm' : 'g';

  const planetColors: Record<string, string> = {
    moon: '#94a3b8',
    mars: '#f59e0b',
    jupiter: '#ef4444',
    sun: '#f97316',
  };

  const planetResults = ['moon', 'mars', 'jupiter', 'sun']
    .map(p => ({
      key: p,
      result: results.find(r => r.id === `${p}Weight`),
      color: planetColors[p] || '#64748b',
    }))
    .filter(x => x.result);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Weight &amp; Gravity
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Magic Triangle */}
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2">
            Formula Triangle
          </p>
          <MagicTriangle highlight={highlight} />
        </div>

        {/* Large Result */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-1">{result.label}</p>
          <p className="text-3xl font-bold text-blue-700 font-mono">{result.value}</p>
        </div>

        {/* Secondary results */}
        <div className="grid grid-cols-2 gap-2">
          {weightLbf && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{weightLbf.label}</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{weightLbf.value}</p>
            </div>
          )}
          {massKg && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{massKg.label}</p>
              <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{massKg.value}</p>
            </div>
          )}
        </div>

        {/* Gravity used */}
        {gravityUsed && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{gravityUsed.label}</p>
            <p className="text-sm font-mono text-slate-700">{gravityUsed.value}</p>
          </div>
        )}

        {/* Human weight comparison */}
        {humanComparison && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">{humanComparison.label}</p>
            <p className="text-sm text-amber-800">{humanComparison.value}</p>
          </div>
        )}

        {/* Formula */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Formula Used</p>
          <p className="text-sm font-mono text-slate-700">{formula.value}</p>
        </div>

        {/* Steps */}
        {steps && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Calculation Steps</p>
            <p className="text-sm font-mono text-blue-700 whitespace-pre-wrap">{steps.value}</p>
          </div>
        )}

        {/* Planet Comparison */}
        {planetResults.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Weight Across the Solar System
            </p>
            <div className="space-y-2">
              {planetResults.map(({ key, result, color }) => (
                <PlanetBar
                  key={key}
                  planet={key.charAt(0).toUpperCase() + key.slice(1)}
                  weight={result!.value}
                  color={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
