import { BENCHMARKS } from './irrTypes';

export function IRRInterpretationCard({ irr }: { irr: number }) {
  const irrPct = irr * 100;

  let colorClass = 'text-red-600';
  let bgClass = 'bg-red-50 border-red-200';
  let label = 'Below Average';
  if (irrPct >= 20) {
    colorClass = 'text-emerald-600';
    bgClass = 'bg-emerald-50 border-emerald-200';
    label = 'Excellent';
  } else if (irrPct >= 15) {
    colorClass = 'text-emerald-600';
    bgClass = 'bg-emerald-50 border-emerald-200';
    label = 'Strong';
  } else if (irrPct >= 10) {
    colorClass = 'text-blue-600';
    bgClass = 'bg-blue-50 border-blue-200';
    label = 'Good';
  } else if (irrPct > 0) {
    colorClass = 'text-amber-600';
    bgClass = 'bg-amber-50 border-amber-200';
    label = 'Modest';
  }

  return (
    <div className={`rounded-xl border px-5 py-4 ${bgClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Your IRR</p>
          <p className={`text-4xl font-black ${colorClass}`}>{irrPct.toFixed(2)}%</p>
        </div>
        <span className={`text-sm font-bold px-3 py-1.5 rounded-full border ${bgClass} ${colorClass}`}>
          {label}
        </span>
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th scope="col" className="text-left px-3 py-2 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Benchmark</th>
              <th scope="col" className="text-right px-3 py-2 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Threshold</th>
              <th scope="col" className="text-right px-3 py-2 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Your IRR</th>
            </tr>
          </thead>
          <tbody>
            {BENCHMARKS.map((b) => {
              const beats = irr >= b.threshold;
              return (
                <tr key={b.label} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 text-slate-700 font-medium">{b.label}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{(b.threshold * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        beats
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {beats ? 'BEATS IT' : 'BELOW IT'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
