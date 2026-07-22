import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function PercentErrorPanel({ values }: Props) {
  const accepted = parseFloat(values.accepted);
  const experimental = parseFloat(values.experimental);
  if (isNaN(accepted) || isNaN(experimental) || accepted === 0) return null;

  const absoluteError = Math.abs(accepted - experimental);
  const percentError = (absoluteError / Math.abs(accepted)) * 100;
  const signedError = ((experimental - accepted) / Math.abs(accepted)) * 100;
  const accuracy = Math.max(0, 100 - percentError);
  const direction = signedError >= 0 ? 'overestimate' : 'underestimate';
  const fmt = (n: number) => n.toFixed(4).replace(/\.?0+$/, '');
  const pct = (n: number) => n.toFixed(2).replace(/\.?0+$/, '');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Step-by-Step Solution</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Result Card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-2">Percent Error</p>
          <p className="text-3xl font-bold text-blue-700">{pct(percentError)}%</p>
        </div>

        {/* Step-by-step */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Step-by-Step Calculation</p>

          {/* Step 1: Formula */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Formula</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              δ = |vA − vE| ÷ |vA| × 100%
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              vA = {fmt(accepted)} (accepted), vE = {fmt(experimental)} (experimental)
            </p>
          </div>

          {/* Step 2: Absolute Error */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Step 1: Calculate Absolute Error</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              |{fmt(accepted)} − {fmt(experimental)}| = {fmt(absoluteError)}
            </p>
          </div>

          {/* Step 3: Percent Error */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Step 2: Calculate Percent Error</p>
            <p className="text-xs font-mono text-slate-700 mt-1">
              ({fmt(absoluteError)} ÷ |{fmt(accepted)}|) × 100% = {pct(percentError)}%
            </p>
          </div>

          {/* Step 4: Signed Error */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold text-amber-500 uppercase">Signed Error (Direction)</p>
            <p className="text-xs font-mono text-amber-800 mt-1">
              ({fmt(experimental)} − {fmt(accepted)}) ÷ |{fmt(accepted)}| × 100% = {pct(Math.abs(signedError))}% {direction}
            </p>
          </div>

          {/* Step 5: Accuracy */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[10px] font-bold text-blue-500 uppercase">Experimental Accuracy</p>
            <p className="text-sm font-bold text-blue-700 mt-1">
              {pct(accuracy)}% accurate
            </p>
          </div>
        </div>

        {/* Interpretation */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Interpretation</p>
          <p className="text-xs text-slate-700 leading-relaxed">
            {percentError < 1
              ? 'Excellent accuracy — the experimental value is very close to the accepted value. Your measurement technique is highly reliable.'
              : percentError < 5
                ? 'Good accuracy — the experimental value is within an acceptable range. Suitable for most lab and field applications.'
                : percentError < 10
                  ? 'Moderate error — review your measurement procedure. Consider recalibrating instruments or checking for systematic bias.'
                  : percentError < 20
                    ? 'Significant error — there may be a procedural issue. Check for calculation errors, instrument drift, or impure reagents.'
                    : 'Large error — the measurement deviates substantially from the accepted value. Review the entire experimental setup for fundamental issues.'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            The {direction === 'overestimate' ? 'positive' : 'negative'} signed error suggests{' '}
            {direction === 'overestimate'
              ? 'your measurement was higher than the true value (systematic overestimation).'
              : 'your measurement was lower than the true value (systematic underestimation).'}
          </p>
        </div>

        {/* Quick Reference */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Percent Error Benchmarks</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-emerald-700">&lt; 1%</p>
              <p className="text-slate-500">Excellent</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-blue-700">&lt; 5%</p>
              <p className="text-slate-500">Good</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-amber-700">&lt; 10%</p>
              <p className="text-slate-500">Acceptable</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="font-bold text-red-700">&gt; 15%</p>
              <p className="text-slate-500">Needs Review</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
