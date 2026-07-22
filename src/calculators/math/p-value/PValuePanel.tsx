import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function PValuePanel({ values, results }: Props) {
  if (results.length === 0) return null;

  const pValue = results.find(r => r.id === 'pValue')?.value || '';
  const significant = results.find(r => r.id === 'significant')?.value === 'Yes';
  const conclusion = results.find(r => r.id === 'conclusion')?.value || '';
  const alpha = results.find(r => r.id === 'alpha')?.value || '';
  const testStat = results.find(r => r.id === 'testStatistic')?.value || '';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Hypothesis Test Results</span>
      </div>

      <div className="p-5 space-y-4">
        {/* p-value display */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">p-value</p>
          <p className="text-3xl font-bold font-mono text-emerald-700">{pValue}</p>
          <p className="text-xs text-emerald-500 mt-1">
            {values.testType === 'z' ? 'Z' : 'T'}-statistic = {testStat} &nbsp;|&nbsp; α = {alpha}
          </p>
        </div>

        {/* Conclusion */}
        <div className={`rounded-xl border-2 p-5 ${
          significant
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-amber-200 bg-amber-50'
        }`}>
          <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${
            significant ? 'text-emerald-500' : 'text-amber-500'
          }`}>
            {significant ? '✓ Statistically Significant' : '○ Not Statistically Significant'}
          </p>
          <p className={`text-sm font-medium ${
            significant ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            {conclusion}
          </p>
        </div>

        {/* Decision guide */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Decision Rule</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white rounded-lg border border-slate-200 p-3 text-center">
              <p className="text-slate-500 mb-1">If p &lt; α</p>
              <p className="font-bold text-emerald-600">Reject H₀</p>
              <p className="text-slate-500">Statistically significant</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3 text-center">
              <p className="text-slate-500 mb-1">If p ≥ α</p>
              <p className="font-bold text-amber-600">Fail to Reject H₀</p>
              <p className="text-slate-500">Not statistically significant</p>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-center">
          <div className="p-2 bg-white rounded border border-slate-200">
            <p className="text-slate-500">Test Direction</p>
            <p className="font-bold text-slate-700">{values.tails === 'one' ? 'One-tailed' : 'Two-tailed'}</p>
          </div>
          <div className="p-2 bg-white rounded border border-slate-200">
            <p className="text-slate-500">Test Type</p>
            <p className="font-bold text-slate-700">{values.testType === 'z' ? 'Z-test' : 'T-test'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
