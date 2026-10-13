import { CalculatorResult } from '../../../types/calculator';
import SvgBarChart from '../../../components/charts/SvgBarChart';
import { analyzeQuadratic } from './quadratic';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function FactoringPanel({ values, results }: Props) {
  const q = analyzeQuadratic(values);
  if (!q) return null;
  const { a, b, c } = q;

  const stepsRow = results.find((r) => r.id === 'steps');
  const originalRow = results.find((r) => r.id === 'original');
  const factoredRow = results.find((r) => r.id === 'factored');
  const rootsRow = results.find((r) => r.id === 'roots');

  if (!originalRow) return null;

  const stepsText = stepsRow?.value || '';
  const stepLines = stepsText.split('\n').filter(Boolean);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Step-by-Step Factoring</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Original expression */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-2">Original Expression</p>
          <p className="text-xl font-bold text-blue-700 font-mono">{originalRow.value}</p>
        </div>

        {/* Coefficients and (real) roots; roots come from the exact analysis, not from parsing the result text */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Coefficients &amp; Roots</p>
          <SvgBarChart
            data={[
              { label: 'a (x²)', value: a, color: '#2563eb' },
              { label: 'b (x)', value: b, color: '#7c3aed' },
              { label: 'c (const)', value: c, color: '#059669' },
              ...q.roots.map((r, i) => ({ label: `Root ${i + 1}`, value: r, color: i === 0 ? '#d97706' : '#dc2626' })),
            ]}
            ariaLabel={`Bar chart of the coefficients a = ${a}, b = ${b}, c = ${c}${q.roots.length ? ` and the roots ${q.rootTexts.join(' and ')}` : ' (the roots are complex, so none are plotted)'}`}
            height={160}
            maxBarWidth={48}
          />
        </div>

        {/* Factored form */}
        {factoredRow && (
          <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 text-center">
            <p className="text-sm text-slate-500 mb-2">Factored Form</p>
            <p className="text-xl font-bold text-green-700 font-mono">{factoredRow.value}</p>
          </div>
        )}

        {/* Roots */}
        {rootsRow && (
          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 p-6 text-center">
            <p className="text-sm text-slate-500 mb-2">Roots (Zeros)</p>
            <p className="text-xl font-bold text-purple-700 font-mono">{rootsRow.value}</p>
          </div>
        )}

        {/* Step-by-Step */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Step-by-Step Solution</p>

          {stepLines.map((line, idx) => {
            // stable — static computation steps, never reordered
            const isHeading = line.startsWith('Step');
            const isSubStep = line.startsWith('  ');
            const isFormula = line.includes('=') && !isSubStep;

            let className = 'rounded-lg border px-4 py-2.5 ';
            if (isHeading) {
              className += 'bg-slate-50 border-slate-200';
            } else if (isFormula) {
              className += 'bg-amber-50 border-amber-200';
            } else {
              className += 'bg-white border-slate-100';
            }

            return (
              <div key={idx} className={className}>
                {isHeading ? (
                  <>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {line.split(':')[0]}
                    </p>
                    <p className="text-xs font-mono text-slate-700 mt-1">
                      {line.split(':').slice(1).join(':').trim()}
                    </p>
                  </>
                ) : (
                  <p className={`text-xs font-mono ${isSubStep ? 'text-slate-500 ml-3' : 'text-slate-700'}`}>
                    {line.trim()}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Final check */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Quick Check</p>
          <p className="text-xs text-slate-600 mt-1">
            To verify your factoring, multiply the two factors using FOIL (First, Outer, Inner, Last).
            The result should match the original polynomial. Each root can be verified by substituting
            it back into the original expression — the result should be zero.
          </p>
        </div>
      </div>
    </div>
  );
}
