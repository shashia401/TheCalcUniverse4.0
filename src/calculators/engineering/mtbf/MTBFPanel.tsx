import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function MTBFPanel({ results }: Props) {
  const mtbf = results.find(r => r.id === 'mtbf');
  const failureRate = results.find(r => r.id === 'failureRate');
  const reliability1yr = results.find(r => r.id === 'reliability1yr');
  const reliability = results.find(r => r.id === 'reliability');
  const probFailure = results.find(r => r.id === 'probability_failure');
  const expectedFailures = results.find(r => r.id === 'expectedFailures');
  const lambda = results.find(r => r.id === 'lambda');

  if (!results.length) return null;

  const relVal = reliability1yr ? parseNum(reliability1yr.value) : reliability ? parseNum(reliability.value) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">MTBF / Reliability</span>
      </div>
      <div className="p-5 space-y-3">
        {mtbf && (
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">MTBF</p>
            <p className="text-2xl font-bold text-emerald-700">{mtbf.value}</p>
          </div>
        )}
        {relVal > 0 && (
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Reliability</span>
              <span className={relVal > 90 ? 'text-emerald-600 font-bold' : relVal > 70 ? 'text-amber-600 font-bold' : 'text-red-600 font-bold'}>
                {relVal.toFixed(2)}%
              </span>
            </div>
            <div className="h-4 bg-slate-100 rounded overflow-hidden">
              <div className={`h-full rounded transition-all ${
                relVal > 90 ? 'bg-emerald-500' : relVal > 70 ? 'bg-amber-500' : 'bg-red-500'
              }`} style={{ width: `${Math.min(relVal, 100)}%` }} />
            </div>
          </div>
        )}
        {failureRate && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Failure Rate (&lambda;)</span>
            <span className="text-sm font-bold text-slate-700">{failureRate.value}</span>
          </div>
        )}
        {lambda && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Failure Rate (&lambda;)</span>
            <span className="text-sm font-bold text-slate-700">{lambda.value}</span>
          </div>
        )}
        {probFailure && (
          <div className="flex justify-between items-center rounded-lg border border-red-100 bg-red-50 px-3 py-2">
            <span className="text-xs text-red-700">Probability of Failure</span>
            <span className="text-sm font-bold text-red-700">{probFailure.value}</span>
          </div>
        )}
        {expectedFailures && (
          <div className={`rounded-xl border px-4 py-3 ${expectedFailures.color === 'positive' ? 'bg-emerald-50 border-emerald-200' : expectedFailures.color === 'negative' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className="text-xs font-semibold">{expectedFailures.label}</p>
            <p className="text-lg font-bold text-slate-700">{expectedFailures.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
