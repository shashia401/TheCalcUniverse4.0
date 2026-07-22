import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function MagicTriangle({ highlight }: { highlight: 'm' | 'ρ' | 'V' }) {
  const topLabel = 'm';
  const bottomLeft = 'ρ';
  const bottomRight = 'V';

  const highlightColor = '#2563eb';
  const defaultColor = '#475569';

  const topColor = highlight === topLabel ? highlightColor : defaultColor;
  const blColor = highlight === bottomLeft ? highlightColor : defaultColor;
  const brColor = highlight === bottomRight ? highlightColor : defaultColor;

  return (
    <svg viewBox="0 0 140 120" className="w-28 h-24 sm:w-32 sm:h-28 mx-auto" role="img" aria-label="Density formula triangle">
      {/* Outer triangle */}
      <polygon
        points="70,5 135,110 5,110"
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Horizontal divider */}
      <line x1="5" y1="110" x2="135" y2="110" stroke="#cbd5e1" strokeWidth="2" />
      {/* Top section: m */}
      <text
        x="70"
        y="52"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="28"
        fontWeight="bold"
        fill={topColor}
        className="select-none"
      >
        {topLabel}
      </text>
      {/* Vertical divider */}
      <line x1="70" y1="55" x2="70" y2="110" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
      {/* Bottom left: ρ */}
      <text
        x="38"
        y="86"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="22"
        fontWeight="bold"
        fill={blColor}
        className="select-none"
      >
        {bottomLeft}
      </text>
      {/* Bottom right: V */}
      <text
        x="102"
        y="86"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="22"
        fontWeight="bold"
        fill={brColor}
        className="select-none"
      >
        {bottomRight}
      </text>
      {/* Highlight indicator */}
      {(highlight === 'ρ' || highlight === 'V' || highlight === 'm') && (
        <circle
          cx={
            highlight === 'm' ? 70 :
            highlight === 'ρ' ? 38 :
            102
          }
          cy={
            highlight === 'm' ? 52 :
            highlight === 'ρ' || highlight === 'V' ? 86 : 86
          }
          r="18"
          fill="none"
          stroke={highlightColor}
          strokeWidth="2"
          strokeDasharray="4,3"
          opacity="0.6"
        />
      )}
    </svg>
  );
}

export default function DensityPanel({ values, results }: Props) {
  const result = results.find(r => r.id === 'result');
  const densityGcm3 = results.find(r => r.id === 'densityGcm3');
  const densityLbsft3 = results.find(r => r.id === 'densityLbsft3');
  const massG = results.find(r => r.id === 'massG');
  const massLb = results.find(r => r.id === 'massLb');
  const volumeL = results.find(r => r.id === 'volumeL');
  const volumeMl = results.find(r => r.id === 'volumeMl');
  const volumeFt3 = results.find(r => r.id === 'volumeFt3');
  const formula = results.find(r => r.id === 'formula');
  const steps = results.find(r => r.id === 'steps');

  if (!result || !formula) return null;

  const mode = values.mode || 'calcDensity';
  const highlight = mode === 'calcDensity' ? 'ρ' : mode === 'calcMass' ? 'm' : 'V';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Density Formula &amp; Results
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

        {/* Alternate Units */}
        {mode === 'calcDensity' && (densityGcm3 || densityLbsft3) && (
          <div className="grid grid-cols-2 gap-2">
            {densityGcm3 && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{densityGcm3.label}</p>
                <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{densityGcm3.value}</p>
              </div>
            )}
            {densityLbsft3 && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{densityLbsft3.label}</p>
                <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{densityLbsft3.value}</p>
              </div>
            )}
          </div>
        )}

        {/* Alternate mass units */}
        {mode === 'calcMass' && (massG || massLb) && (
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

        {/* Alternate volume units */}
        {mode === 'calcVolume' && (volumeL || volumeMl || volumeFt3) && (
          <div className="grid grid-cols-3 gap-2">
            {volumeL && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{volumeL.label}</p>
                <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{volumeL.value}</p>
              </div>
            )}
            {volumeMl && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{volumeMl.label}</p>
                <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{volumeMl.value}</p>
              </div>
            )}
            {volumeFt3 && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{volumeFt3.label}</p>
                <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{volumeFt3.value}</p>
              </div>
            )}
          </div>
        )}

        {/* Formula */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Formula Used</p>
          <p className="text-sm font-mono text-slate-700">{formula.value}</p>
        </div>

        {/* Step-by-step */}
        {steps && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Calculation Steps</p>
            <p className="text-sm font-mono text-blue-700 whitespace-pre-wrap">{steps.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
