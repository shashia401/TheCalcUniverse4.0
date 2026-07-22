import { PVData, fmtDollar, compoundingLabel } from './presentValueTypes';

export function TimeArrow({ data }: { data: PVData }) {
  const { futureValue, presentValue, discountRate, periods, compoundingFrequency: m, discountFactor } = data;
  const reciprocal = (1 / discountFactor).toFixed(4);

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
        Time Value of Money &mdash; Visual Timeline
      </p>

      <div className="relative flex items-center mb-5">
        <div className="flex flex-col items-center shrink-0">
          <div className="w-12 h-12 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center">
            <span className="text-emerald-700 font-black text-xs">TODAY</span>
          </div>
          <p className="text-xs font-bold text-emerald-700 mt-1.5">{fmtDollar(presentValue)}</p>
          <p className="text-[10px] text-slate-500">invest this</p>
        </div>

        <div className="flex-1 mx-3 flex flex-col items-center">
          <p className="text-[10px] text-slate-500 mb-1">grows at {discountRate}%/yr for {periods} yr{periods !== 1 ? 's' : ''}</p>
          <div className="relative w-full h-2 flex items-center">
            <div className="w-full h-0.5 bg-gradient-to-r from-emerald-400 to-blue-400" />
            <div className="absolute right-0 w-0 h-0" style={{
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderLeft: '8px solid #3b82f6',
            }} />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">discounted back at {discountRate}%/yr</p>
        </div>

        <div className="flex flex-col items-center shrink-0">
          <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center">
            <span className="text-blue-700 font-black text-[10px] text-center leading-tight">YR {periods}</span>
          </div>
          <p className="text-xs font-bold text-blue-700 mt-1.5">{fmtDollar(futureValue)}</p>
          <p className="text-[10px] text-slate-500">future goal</p>
        </div>
      </div>

      <div className="rounded-lg bg-slate-950 text-center px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
          Discount Factor
        </p>
        <p className="font-mono text-lg font-black text-amber-400">
          $1 today = ${reciprocal} in {periods} year{periods !== 1 ? 's' : ''}
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          (at {discountRate}% annual rate, {compoundingLabel(m).toLowerCase()} compounding)
        </p>
      </div>

      <p className="text-xs text-slate-500 mt-3 text-center">
        Compounding frequency: <strong className="text-slate-700">{compoundingLabel(m)}</strong> ({m}x per year)
        &nbsp;&mdash;&nbsp; r/m = {(discountRate / m).toFixed(4)}% per period
      </p>
    </div>
  );
}
