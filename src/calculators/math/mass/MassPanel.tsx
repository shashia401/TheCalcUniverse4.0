import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function MagicTriangle({ highlight }: { highlight: 'm' | 'ρ' | 'V'; values: Record<string, string> }) {
  const highlightColor = '#2563eb';
  const defaultColor = '#475569';

  const topColor = highlight === 'm' ? highlightColor : defaultColor;
  const blColor = highlight === 'ρ' ? highlightColor : defaultColor;
  const brColor = highlight === 'V' ? highlightColor : defaultColor;

  return (
    <svg viewBox="0 0 140 120" className="w-28 h-24 sm:w-32 sm:h-28 mx-auto" role="img" aria-label="Mass formula triangle">
      <polygon points="70,5 135,110 5,110" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinejoin="round" />
      <line x1="5" y1="110" x2="135" y2="110" stroke="#cbd5e1" strokeWidth="2" />
      <text x="70" y="52" textAnchor="middle" dominantBaseline="central" fontSize="28" fontWeight="bold" fill={topColor} className="select-none">m</text>
      <line x1="70" y1="55" x2="70" y2="110" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
      <text x="38" y="86" textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="bold" fill={blColor} className="select-none">ρ</text>
      <text x="102" y="86" textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="bold" fill={brColor} className="select-none">V</text>
      <circle
        cx={highlight === 'm' ? 70 : highlight === 'ρ' ? 38 : 102}
        cy={highlight === 'm' ? 52 : 86}
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

function WeightBar({ planet, weight, color }: { planet: string; weight: string; color: string }) {
  const maxWeight = 5000; // Reference scale
  const numWeight = parseFloat(weight.replace(/[^0-9.-]/g, ''));
  const pct = isFinite(numWeight) ? Math.min((numWeight / maxWeight) * 100, 100) : 0;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-16 font-semibold text-slate-700 text-right">{planet}</span>
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

export default function MassPanel({ values, results }: Props) {
  const result = results.find(r => r.id === 'result');
  const massG = results.find(r => r.id === 'massG');
  const massLb = results.find(r => r.id === 'massLb');
  const formula = results.find(r => r.id === 'formula');
  const steps = results.find(r => r.id === 'steps');

  const planetWeights = ['Earth', 'Moon', 'Mars', 'Jupiter']
    .map(p => results.find(r => r.id === `weight${p}`))
    .filter(Boolean) as CalculatorResult[];

  if (!result || !formula) return null;

  const mode = values.mode || 'calcMass';
  const highlight = mode === 'calcMass' ? 'm' : mode === 'calcDensity' ? 'ρ' : 'V';

  const planetColors = ['#10b981', '#94a3b8', '#f59e0b', '#ef4444'];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Mass &amp; Planetary Weight
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Magic Triangle */}
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2">
            Formula Triangle
          </p>
          <MagicTriangle highlight={highlight} values={values} />
        </div>

        {/* Large Result */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-1">{result.label}</p>
          <p className="text-3xl font-bold text-blue-700 font-mono">{result.value}</p>
        </div>

        {/* Alternate Mass Units */}
        {(massG || massLb) && (
          <div className="grid grid-cols-2 gap-2">
            {massG && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{massG.label}</p>
                <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{massG.value}</p>
              </div>
            )}
            {massLb && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{massLb.label}</p>
                <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{massLb.value}</p>
              </div>
            )}
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

        {/* Planetary Weight Comparison */}
        {planetWeights.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Weight on Different Planets
            </p>
            <div className="space-y-2">
              {planetWeights.map((pw, i) => (
                <WeightBar
                  key={pw.id}
                  planet={pw.label.replace('Weight on ', '')}
                  weight={pw.value}
                  color={planetColors[i] || '#64748b'}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
