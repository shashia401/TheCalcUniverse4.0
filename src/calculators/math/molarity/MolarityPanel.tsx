import type { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getResult(results: CalculatorResult[], id: string): CalculatorResult | undefined {
  return results.find((r) => r.id === id);
}

function parseStepByStep(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

// ─── SVG: Volumetric Flask ─────────────────────────────────────────────────────

function VolumetricFlaskSvg({ molarity }: { molarity: string; colorClass: string }) {
  const flaskW = 140;
  const flaskH = 180;

  return (
    <svg width={flaskW} height={flaskH} viewBox={`0 0 ${flaskW} ${flaskH}`} className="w-full max-w-[140px] h-auto" role="img" aria-label="Volumetric flask diagram showing molarity concentration level">
      {/* Flask body */}
      <path
        d={`M 40,30 L 40,70 Q 40,90 20,110 L 20,160 Q 20,175 40,175 L 100,175 Q 120,175 120,160 L 120,110 Q 100,90 100,70 L 100,30 Z`}
        fill="#E0F2FE"
        stroke="#7DD3FC"
        strokeWidth="2"
      />
      {/* Flask neck */}
      <rect x="50" y="5" width="40" height="30" rx="3" fill="none" stroke="#7DD3FC" strokeWidth="2" />
      {/* Meniscus */}
      <path
        d="M 25,110 Q 70,118 115,110"
        fill="#38BDF8"
        stroke="#0284C7"
        strokeWidth="1.5"
        opacity="0.6"
      />
      {/* Liquid fill */}
      <rect x="22" y="110" width="96" height="65" rx="8" fill="#38BDF8" opacity="0.3" />
      {/* Measurement line */}
      <line x1="22" y1="110" x2="15" y2="110" stroke="#0284C7" strokeWidth="2" />
      <text x="12" y="114" fontSize="8" textAnchor="end" fill="#0284C7" fontWeight="bold">V</text>
      {/* Label on flask */}
      <text x="70" y="150" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1E293B">{molarity}</text>
      <text x="70" y="163" textAnchor="middle" fontSize="7" fill="#64748B">mol/L</text>
    </svg>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

export default function MolarityPanel({ results }: Props) {
  // Determine which mode based on which primary result exists
  const molarityResult = getResult(results, 'molarityResult');
  const massResult = getResult(results, 'massResult');
  const volumeResult = getResult(results, 'volumeResult');

  // Determine which result is the primary (highlighted) one
  const primary = molarityResult || massResult || volumeResult;
  if (!primary) return null;

  const primaryUnit = primary.unit || '';
  const primaryValue = primary.value;
  const primaryLabel = primary.label;

  const moles = getResult(results, 'moles');
  const formulaUsed = getResult(results, 'formulaUsed');
  const stepByStep = getResult(results, '_stepByStep');
  const compoundSource = getResult(results, 'compoundSource');
  const massUsed = getResult(results, 'massUsed');
  const volumeUsed = getResult(results, 'volumeUsed');
  const molarMassUsed = getResult(results, 'molarMassUsed');
  const molarityUsed = getResult(results, 'molarityUsed');

  const steps = parseStepByStep(stepByStep?.value);

  // Color mapping based on mode
  const primaryColor = primary === molarityResult
    ? { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' }
    : primary === massResult
    ? { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' }
    : { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Molarity Solution
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Primary Result Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Large Result Display */}
          <div className={`rounded-xl border-2 ${primaryColor.border} ${primaryColor.bg} p-5 flex flex-col items-center justify-center`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {primaryLabel}
            </p>
            <p className={`text-3xl font-bold font-mono ${primaryColor.text}`}>
              {primaryValue}
              <span className="text-base font-medium ml-1">{primaryUnit}</span>
            </p>
            {compoundSource && compoundSource.value && (
              <p className="mt-2 text-[10px] text-slate-500">
                {compoundSource.value}
              </p>
            )}
          </div>

          {/* Volumetric Flask Visualization */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-center">
            <VolumetricFlaskSvg molarity={primaryValue} colorClass={primaryColor.text} />
          </div>
        </div>

        {/* Formula Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Core Formula
          </p>
          <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 text-center mb-3">
            <code className="text-sm font-bold text-slate-700">M = n / V &nbsp;&nbsp; where &nbsp;&nbsp; n = m / MM</code>
          </div>
          {formulaUsed && (
            <div className="bg-white rounded-lg border border-slate-200 px-4 py-2 text-center">
              <code className="text-xs font-mono text-slate-600">{formulaUsed.value}</code>
            </div>
          )}
        </div>

        {/* Step-by-Step */}
        {steps.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Step-by-Step Calculation
            </p>
            <div className="space-y-2">
              {steps.map((step: string, i: number) => (
                <div key={`item-${i}`} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <code className="text-xs font-mono text-slate-700 bg-white rounded border border-slate-200 px-3 py-1.5 flex-1">
                    {step}
                  </code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compound Lookup Card */}
        {compoundSource && compoundSource.value && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1">
              Compound Auto-Detected
            </p>
            <p className="text-xs text-amber-800">
              {compoundSource.value} &mdash; molar mass automatically populated from the compound database.
              You can override this value by entering a custom molar mass.
            </p>
          </div>
        )}

        {/* Results Summary Table */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-200 bg-white">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Calculation Summary
            </p>
          </div>
          <div className="p-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200">
                  <th scope="col" className="text-left pb-2 font-semibold">Variable</th>
                  <th scope="col" className="text-left pb-2 font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Moles of Solute', value: moles },
                  { label: 'Molar Mass', value: molarMassUsed },
                  { label: 'Mass of Solute', value: massUsed },
                  { label: 'Volume of Solution', value: volumeUsed },
                  { label: 'Molarity', value: molarityUsed },
                ].map((row) => {
                  if (!row.value) return null;
                  return (
                    <tr key={row.label} className="border-b border-slate-100 text-slate-600">
                      <td className="py-1.5 font-medium">{row.label}</td>
                      <td className="py-1.5 font-mono">{row.value.value} {row.value.unit ?? ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
