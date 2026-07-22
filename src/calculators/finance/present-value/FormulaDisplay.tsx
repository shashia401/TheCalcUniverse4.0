import { PVData, fmtDollar, compoundingLabel } from './presentValueTypes';

export function FormulaDisplay({ data }: { data: PVData }) {
  const { futureValue, presentValue, discountRate, compoundingFrequency: m, periods, effectiveAnnualRate } = data;
  const rPerPeriod = discountRate / 100 / m;
  const totalPeriods = periods * m;

  const fmtRate = (r: number) => (r * 100).toFixed(4) + '%';

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-5">
      <div className="text-center mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
          Present Value Formula
        </p>
        <div className="inline-block bg-slate-950 rounded-xl px-6 py-4">
          <p className="font-mono text-xl text-emerald-400 tracking-wide select-all">
            PV = FV / (1 + r/m)^(n&times;m)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
          <p className="font-mono text-[10px] font-bold text-emerald-600 uppercase mb-0.5">PV</p>
          <p className="text-xs text-slate-600">Present Value</p>
          <p className="text-base font-black text-emerald-700">{fmtDollar(presentValue)}</p>
        </div>
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2.5">
          <p className="font-mono text-[10px] font-bold text-blue-600 uppercase mb-0.5">FV</p>
          <p className="text-xs text-slate-600">Future Value</p>
          <p className="text-base font-black text-blue-700">{fmtDollar(futureValue)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
          <p className="font-mono text-[10px] font-bold text-slate-500 uppercase mb-0.5">r</p>
          <p className="text-xs text-slate-600">Discount Rate</p>
          <p className="text-base font-black text-slate-700">{discountRate}%/yr</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
          <p className="font-mono text-[10px] font-bold text-slate-500 uppercase mb-0.5">m</p>
          <p className="text-xs text-slate-600">Compounding</p>
          <p className="text-base font-black text-slate-700">{compoundingLabel(m)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
          <p className="font-mono text-[10px] font-bold text-slate-500 uppercase mb-0.5">n</p>
          <p className="text-xs text-slate-600">Periods</p>
          <p className="text-base font-black text-slate-700">{periods} year{periods !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
          <p className="font-mono text-[10px] font-bold text-amber-600 uppercase mb-0.5">n&times;m</p>
          <p className="text-xs text-slate-600">Total Periods</p>
          <p className="text-base font-black text-amber-700">{totalPeriods.toFixed(0)}</p>
        </div>
      </div>

      <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
          Substituted Calculation
        </p>
        <p className="font-mono text-sm text-slate-700 break-all">
          PV = {fmtDollar(futureValue)} / (1 + {fmtRate(rPerPeriod)})^{totalPeriods.toFixed(0)}
          {' '}= <span className="font-black text-emerald-700">{fmtDollar(presentValue)}</span>
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Effective annual rate with {compoundingLabel(m).toLowerCase()} compounding:{' '}
          <span className="font-semibold text-slate-700">{(effectiveAnnualRate * 100).toFixed(4)}%</span>
        </p>
      </div>
    </div>
  );
}
