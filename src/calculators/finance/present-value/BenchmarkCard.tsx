import { PVData, fmtDollar, fmtDollarCompact, computePV } from './presentValueTypes';

const BENCHMARKS = [
  { label: 'S&P 500 avg — inflation-adjusted (7%)', rate: 7 },
  { label: '10-year Treasury (~4.5%)', rate: 4.5 },
  { label: 'High-yield savings (~5%)', rate: 5 },
];

export function BenchmarkCard({ data }: { data: PVData }) {
  const { futureValue, periods, discountRate } = data;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Real-World Benchmark Comparison
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          To have {fmtDollarCompact(futureValue)} in {periods} year{periods !== 1 ? 's' : ''}, you need to invest this much today:
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {BENCHMARKS.map(({ label, rate }) => {
          const pv = computePV(futureValue, rate, periods, 1);
          const isCurrentRate = Math.abs(rate - discountRate) < 0.001;
          return (
            <div
              key={rate}
              className={`flex items-center justify-between px-4 py-3 ${
                isCurrentRate ? 'bg-blue-50' : ''
              }`}
            >
              <div>
                <p className={`text-sm font-semibold ${isCurrentRate ? 'text-blue-700' : 'text-slate-700'}`}>
                  {label}
                  {isCurrentRate && (
                    <span className="ml-2 text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                      Your Rate
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-slate-500">{rate}% annual compounding</p>
              </div>
              <p className={`text-base font-black ${isCurrentRate ? 'text-blue-700' : 'text-slate-700'}`}>
                {fmtDollar(pv)}
              </p>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
        <p className="text-[10px] text-slate-500">
          All benchmarks use annual compounding. The higher the rate, the less you need to invest today because your
          money grows faster.
        </p>
      </div>
    </div>
  );
}
