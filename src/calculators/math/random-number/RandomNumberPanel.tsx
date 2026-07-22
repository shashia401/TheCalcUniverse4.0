import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function RandomNumberPanel({ results }: Props) {
  const numberList = results.find(r => r.id === 'numberList');
  const sum = results.find(r => r.id === 'sum');
  const avg = results.find(r => r.id === 'average');
  const minVal = results.find(r => r.id === 'minValue');
  const maxVal = results.find(r => r.id === 'maxValue');

  if (!numberList) return null;

  const numbers = numberList.value.split(', ');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Generated Results</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Number Grid */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6">
          <p className="text-sm text-slate-500 mb-3 text-center">Generated Values ({numbers.length})</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {numbers.map((num, i) => (
              <span key={`${num}-${i}`} className="inline-block px-3 py-1.5 bg-white rounded-lg border border-blue-200 text-sm font-mono font-bold text-blue-700 shadow-sm">
                {num}
              </span>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Summary Statistics</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Sum', value: sum?.value },
              { label: 'Average', value: avg?.value },
              { label: 'Minimum', value: minVal?.value },
              { label: 'Maximum', value: maxVal?.value },
            ].map(stat => stat.value ? (
              <div key={stat.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{stat.label}</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{stat.value}</p>
              </div>
            ) : null)}
          </div>
        </div>

        {/* Source note */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Randomness Source</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Generated using <span className="font-mono font-bold text-slate-700">crypto.getRandomValues()</span> —
            cryptographically secure pseudo-random numbers suitable for most applications including security-sensitive use cases.
          </p>
        </div>
      </div>
    </div>
  );
}
