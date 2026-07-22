import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function ProbabilityPanel({ values, results }: Props) {
  const paRow = results.find(r => r.id === 'pa');
  const pbRow = results.find(r => r.id === 'pb');
  const pAndBRow = results.find(r => r.id === 'pAndB');
  const pOrBRow = results.find(r => r.id === 'pOrB');
  const pNotARow = results.find(r => r.id === 'pNotA');
  const pNotBRow = results.find(r => r.id === 'pNotB');
  const pAGivenBRow = results.find(r => r.id === 'pAGivenB');
  const eventTypeRow = results.find(r => r.id === 'eventType');

  if (!paRow || !pbRow || !pAndBRow || !pOrBRow) return null;

  const parsedPa = parseFloat(values.pa);
  const pa = isNaN(parsedPa) ? 0 : parsedPa;
  const parsedPb = parseFloat(values.pb);
  const pb = isNaN(parsedPb) ? 0 : parsedPb;
  const isMutuallyExclusive = values.type === 'Mutually Exclusive';

  const fmtPct = (n: number) => (n * 100).toFixed(1) + '%';

  // Venn diagram dimensions
  const r = 44;
  const cxLeft = isMutuallyExclusive ? 68 : 78;
  const cxRight = isMutuallyExclusive ? 132 : 122;
  const cy = 65;
  const overlapX = 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          {isMutuallyExclusive ? 'Mutually Exclusive Events' : 'Independent Events'} Analysis
        </span>
        <span className="ml-auto text-[10px] font-bold text-slate-500">
          P(A)={fmtPct(pa)} &middot; P(B)={fmtPct(pb)}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Results Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">P(A)</p>
            <p className="text-xl font-bold text-blue-700 mt-1">{paRow.value}</p>
            <p className="text-[10px] text-blue-400 mt-0.5">{fmtPct(pa)}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 p-4 text-center">
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">P(B)</p>
            <p className="text-xl font-bold text-red-700 mt-1">{pbRow.value}</p>
            <p className="text-[10px] text-red-400 mt-0.5">{fmtPct(pb)}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 p-4 text-center">
            <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">P(A &cap; B)</p>
            <p className="text-xl font-bold text-purple-700 mt-1">{pAndBRow.value}</p>
            <p className="text-[10px] text-purple-400 mt-0.5">{fmtPct(isNaN(parseFloat(pAndBRow.value)) ? 0 : parseFloat(pAndBRow.value))}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-4 text-center">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">P(A &cup; B)</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">{pOrBRow.value}</p>
            <p className="text-[10px] text-emerald-400 mt-0.5">{fmtPct(isNaN(parseFloat(pOrBRow.value)) ? 0 : parseFloat(pOrBRow.value))}</p>
          </div>
        </div>

        {/* Combined Probabilities */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">P(&not;A) &mdash; Not A</p>
            <p className="text-base font-bold text-slate-700 mt-1">{pNotARow?.value} <span className="text-xs font-normal text-slate-500">({fmtPct(1 - pa)})</span></p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">P(&not;B) &mdash; Not B</p>
            <p className="text-base font-bold text-slate-700 mt-1">{pNotBRow?.value} <span className="text-xs font-normal text-slate-500">({fmtPct(1 - pb)})</span></p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">P(A|B) &mdash; A given B</p>
            <p className="text-base font-bold text-amber-700 mt-1">{pAGivenBRow?.value} <span className="text-xs font-normal text-amber-500">({fmtPct(isNaN(parseFloat(pAGivenBRow?.value || '0')) ? 0 : parseFloat(pAGivenBRow?.value || '0'))})</span></p>
            <p className="text-[9px] text-amber-500 mt-0.5">
              {isMutuallyExclusive
                ? 'Mutually exclusive: A and B cannot co-occur'
                : 'Independent: P(A|B) = P(A)'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Relationship</p>
            <p className="text-base font-bold text-slate-700 mt-1">{eventTypeRow?.value}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">
              {isMutuallyExclusive
                ? 'Events cannot occur simultaneously'
                : 'Events do not affect each other'}
            </p>
          </div>
        </div>

        {/* Venn Diagram */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">Venn Diagram</p>
          <svg viewBox="0 0 200 130" className="w-full max-w-[220px] mx-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Probability Venn diagram showing two overlapping sets">
            {/* Circle A (blue) */}
            <circle
              cx={cxLeft}
              cy={cy}
              r={r}
              fill="rgba(59, 130, 246, 0.12)"
              stroke="rgba(59, 130, 246, 0.6)"
              strokeWidth="2"
            />
            {/* Circle B (red) */}
            <circle
              cx={cxRight}
              cy={cy}
              r={r}
              fill="rgba(239, 68, 68, 0.12)"
              stroke="rgba(239, 68, 68, 0.6)"
              strokeWidth="2"
            />
            {/* A label */}
            <text
              x={isMutuallyExclusive ? 52 : 62}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#2563EB"
              fontSize="14"
              fontWeight="bold"
              fontFamily="system-ui, sans-serif"
            >
              A
            </text>
            {/* B label */}
            <text
              x={isMutuallyExclusive ? 148 : 138}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#DC2626"
              fontSize="14"
              fontWeight="bold"
              fontFamily="system-ui, sans-serif"
            >
              B
            </text>

            {!isMutuallyExclusive && (
              <>
                {/* Overlap label */}
                <text
                  x={overlapX}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#7C3AED"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="system-ui, sans-serif"
                >
                  A&cap;B
                </text>
                {/* Overlap highlight ring */}
                <circle
                  cx={overlapX}
                  cy={cy}
                  r="14"
                  fill="none"
                  stroke="rgba(124, 58, 237, 0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />
              </>
            )}

            {isMutuallyExclusive && (
              <text
                x={100}
                y={cy + 30}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#94A3B8"
                fontSize="8"
                fontFamily="system-ui, sans-serif"
              >
                No overlap (P(A&cap;B) = 0)
              </text>
            )}

            {/* Legend */}
            <g transform="translate(10, 108)">
              <rect x="0" y="0" width="8" height="8" rx="1" fill="rgba(59, 130, 246, 0.3)" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="1" />
              <text x="12" y="7" fill="#64748B" fontSize="8" fontFamily="system-ui, sans-serif">P(A)={fmtPct(pa)}</text>
            </g>
            <g transform="translate(130, 108)">
              <rect x="0" y="0" width="8" height="8" rx="1" fill="rgba(239, 68, 68, 0.3)" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="1" />
              <text x="12" y="7" fill="#64748B" fontSize="8" fontFamily="system-ui, sans-serif">P(B)={fmtPct(pb)}</text>
            </g>
          </svg>
        </div>

        {/* Explanation based on event type */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            {isMutuallyExclusive ? 'Why Mutually Exclusive Events?' : 'Why Independent Events?'}
          </p>
          {isMutuallyExclusive ? (
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-700">Mutually exclusive</strong> events cannot happen at the same time.
                If event A occurs, event B cannot occur, and vice versa. This is why <strong>P(A &cap; B) = 0</strong>.
              </p>
              <p>
                <strong>Examples:</strong> A single card being both a heart and a spade; a coin landing both heads and tails;
                being both alive and dead according to Schr&ouml;dinger's cat (before observation).
              </p>
              <p className="text-slate-500 text-[11px]">
                Because P(A &cap; B) = 0, the addition rule simplifies to P(A &cup; B) = P(A) + P(B).
                Also, P(A|B) = 0 since A cannot occur when B has occurred.
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-700">Independent</strong> events have no influence on each other.
                The occurrence of B does not change the probability of A, so <strong>P(A|B) = P(A)</strong>.
                The joint probability is the product: <strong>P(A &cap; B) = P(A) &times; P(B)</strong>.
              </p>
              <p>
                <strong>Examples:</strong> Flipping a coin and rolling a die; drawing two cards with replacement;
                weather in two different cities on the same day (approximately).
              </p>
              <p className="text-slate-500 text-[11px]">
                The addition rule for independent events: P(A &cup; B) = P(A) + P(B) &minus; P(A)P(B).
                The overlap P(A &cap; B) is subtracted to avoid double-counting.
              </p>
            </div>
          )}
        </div>

        {/* Calculation breakdown */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Calculation Breakdown</p>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">P(A &cap; B) &mdash; Intersection</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              {isMutuallyExclusive
                ? 'Mutually exclusive: P(A∩B) = 0'
                : `P(A∩B) = P(A) × P(B) = ${paRow.value} × ${pbRow.value} = ${pAndBRow.value}`
              }
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">P(A &cup; B) &mdash; Union</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              {isMutuallyExclusive
                ? `P(A∪B) = P(A) + P(B) = ${paRow.value} + ${pbRow.value} = ${pOrBRow.value}`
                : `P(A∪B) = P(A) + P(B) − P(A∩B) = ${paRow.value} + ${pbRow.value} − ${pAndBRow.value} = ${pOrBRow.value}`
              }
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Complements</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              P(¬A) = 1 − {paRow.value} = {pNotARow?.value}
            </p>
            <p className="text-xs font-mono text-slate-700 mt-0.5">
              P(¬B) = 1 − {pbRow.value} = {pNotBRow?.value}
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold text-amber-500 uppercase">P(A|B) &mdash; Conditional</p>
            <p className="text-xs font-mono text-amber-700 mt-1">
              {isMutuallyExclusive
                ? `Mutually exclusive: P(A|B) = 0 (A and B cannot co-occur)`
                : `Independent: P(A|B) = P(A) = ${paRow.value}`
              }
            </p>
          </div>
        </div>

        {/* Summary rules */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Key Rules Summary</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white rounded border border-slate-200 p-2.5">
              <p className="font-bold text-slate-700">Addition Rule</p>
              <p className="text-slate-500 mt-0.5">P(A∪B) = P(A) + P(B) − P(A∩B)</p>
            </div>
            <div className="bg-white rounded border border-slate-200 p-2.5">
              <p className="font-bold text-slate-700">Multiplication Rule</p>
              <p className="text-slate-500 mt-0.5">P(A∩B) = P(A) × P(B) <span className="text-slate-500">(independent)</span></p>
            </div>
            <div className="bg-white rounded border border-slate-200 p-2.5">
              <p className="font-bold text-slate-700">Complement Rule</p>
              <p className="text-slate-500 mt-0.5">P(¬A) = 1 − P(A)</p>
            </div>
            <div className="bg-white rounded border border-slate-200 p-2.5">
              <p className="font-bold text-slate-700">Conditional Probability</p>
              <p className="text-slate-500 mt-0.5">P(A|B) = P(A∩B) ÷ P(B)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
