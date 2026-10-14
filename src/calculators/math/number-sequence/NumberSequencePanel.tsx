import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import { fmtTerm, parseSequence, termsToNumbers } from './sequenceMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const COLORS = ['#2563eb', '#059669', '#b45309', '#7c3aed', '#be185d', '#0e7490', '#c2410c', '#4d7c0f'];

export default function NumberSequencePanel({ values, results }: Props) {
  const p = parseSequence(values.sequence, values.nextCount);
  if (p.kind !== 'ok' || results.length === 0) return null;
  const { type, terms, next, d, r, formula, steps } = p.analysis;
  const isKnown = type !== 'Unknown';
  const all = [...terms, ...next];
  const chartSeq = termsToNumbers(all.slice(0, 20));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Sequence Analysis</span>
      </div>

      <div className="p-5 space-y-4">
        <div className={`rounded-xl border p-6 text-center ${isKnown ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
          <p className="text-sm text-slate-600 mb-2">Sequence Type</p>
          <p className="text-3xl font-bold text-blue-700">{type}</p>
        </div>

        {isKnown ? (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Step-by-Step Analysis</p>

            {chartSeq.length > 1 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Sequence Pattern</p>
                <SvgBarChart
                  ariaLabel={`Bar chart of the first ${chartSeq.length} terms of the ${type.toLowerCase()} sequence by position`}
                  height={180}
                  data={chartSeq.map((v, i) => ({ label: `${i + 1}`, value: v, color: COLORS[i % COLORS.length] }))}
                />
                <p className="text-[10px] text-slate-600 text-center mt-1">x axis: position in the sequence</p>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold text-slate-600 uppercase">Given Sequence</p>
              <p className="text-xs font-mono text-slate-700 mt-1 break-all">{terms.map(fmtTerm).join(', ')}</p>
            </div>

            {d && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold text-slate-600 uppercase">Step 1: Find Common Difference</p>
                <p className="text-xs font-mono text-slate-700 mt-1">d = a₂ − a₁ = {fmtTerm(d)}</p>
              </div>
            )}
            {r && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold text-slate-600 uppercase">Step 1: Find Common Ratio</p>
                <p className="text-xs font-mono text-slate-700 mt-1">r = a₂ ÷ a₁ = {fmtTerm(r)}</p>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold text-slate-600 uppercase">Step 2: nth-Term Formula</p>
              <p className="text-xs font-mono text-slate-700 mt-1 break-all">{formula}</p>
              {steps.slice(1).map((s, i) => (
                <p key={`item-${i}`} className="text-[11px] text-slate-600 mt-1">{s}</p>
              ))}
            </div>

            {next.length > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-[10px] font-bold text-blue-700 uppercase">Step 3: Next Terms</p>
                <p className="text-sm font-bold text-blue-700 mt-1 break-all">{next.map(fmtTerm).join(', ')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold text-amber-700 uppercase">Unknown Pattern</p>
            <p className="text-xs text-amber-800 mt-1">
              {terms.length < 3
                ? 'Enter at least 3 terms so a pattern can be checked.'
                : 'The sequence could not be identified as arithmetic, geometric, or Fibonacci. Try adding more terms or check your values.'}
            </p>
          </div>
        )}

        {isKnown && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Extended Sequence</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {all.map((t, i) => (
                <span key={`item-${i}`} className={`inline-block px-2 py-1 rounded text-xs font-mono ${i < terms.length ? 'bg-white border border-slate-200 text-slate-700' : 'bg-blue-50 border border-blue-200 text-blue-700 font-bold'}`}>
                  {fmtTerm(t)}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-2">Original terms in white, predicted terms in blue</p>
          </div>
        )}
      </div>
    </div>
  );
}
