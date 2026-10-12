import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import HBarRow from '../../../components/calculator/HBarRow';
import { tvmFV } from './tvmMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

interface Scenario {
  n: number;
  rate: number;
  pv: number;
  pmt: number;
  fv: number;
  due: boolean;
}

const fmtShort = (n: number) => {
  const v = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  return v >= 1_000_000 ? `${sign}$${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${sign}$${(v / 1_000).toFixed(0)}K` : `${sign}$${v.toFixed(0)}`;
};

/** At most ~120 sampled periods: balance after k periods of the solved scenario, and the cash put in. */
function growthSeries(sc: Scenario) {
  const total = Math.round(sc.n);
  const step = Math.max(1, Math.ceil(total / 120));
  const pts: { k: number; balance: number; invested: number }[] = [];
  for (let k = 0; k <= total; k += step) pts.push({ k, balance: tvmFV(sc.pv, sc.pmt, sc.rate, k, sc.due), invested: -(sc.pv + sc.pmt * k) });
  if (pts[pts.length - 1].k !== total) pts.push({ k: total, balance: tvmFV(sc.pv, sc.pmt, sc.rate, total, sc.due), invested: -(sc.pv + sc.pmt * total) });
  return pts;
}

export default function TVMPanel({ values, results }: Props) {
  const scenarioStr = results.find((r) => r.id === '_tvm')?.value;
  // Hooks run before any early return (they used to come after it, which breaks when results flip to an error).
  const sc = useMemo<Scenario | null>(() => {
    try {
      const o = scenarioStr ? (JSON.parse(scenarioStr) as Scenario) : null;
      return o && [o.n, o.rate, o.pv, o.pmt, o.fv].every(Number.isFinite) ? o : null;
    } catch {
      return null;
    }
  }, [scenarioStr]);
  const series = useMemo(() => (sc && sc.n >= 1 ? growthSeries(sc) : []), [sc]);

  if (!sc || series.length < 2) return null;
  const solveFor = values.solveFor || 'FV';
  const solvedResult = results.find((r) => r.id === 'result');
  const final = series[series.length - 1];
  // Share of the final balance that is growth (positive only when you are the saver/investor).
  const growth = final.balance - final.invested;
  const pctInterest = final.balance > 0 && growth > 0 ? ((growth / final.balance) * 100).toFixed(1) : null;
  const totalPayments = sc.pmt * sc.n;
  const maxMag = Math.max(Math.abs(sc.pv), Math.abs(sc.fv), Math.abs(totalPayments), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">TVM Growth Projection</span>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">
            Balance Over {Math.round(sc.n)} Period{Math.round(sc.n) !== 1 ? 's' : ''}{solveFor === 'N' ? ' (solved result)' : ''}
          </p>
          <SvgLineChart
            ariaLabel="TVM balance and cash put in by period"
            series={[
              { name: 'Cash put in', color: '#1d4ed8', points: series.map((d) => ({ x: d.k, y: d.invested })) },
              { name: 'Balance', color: '#047857', points: series.map((d) => ({ x: d.k, y: d.balance })) },
            ]}
            xFormat={(n) => `P${n}`}
            yFormat={fmtShort}
          />
          <div className="flex gap-5 mt-2 text-[10px] text-slate-600">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-blue-700" />Cash put in (-PV - PMT x periods)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-emerald-700" />Balance (FV formula)</span>
          </div>
        </div>

        {pctInterest && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3">
            <p className="text-sm text-slate-700">
              Over {Math.round(sc.n)} period{Math.round(sc.n) !== 1 ? 's' : ''}, <strong className="text-emerald-800">{pctInterest}% of the final balance</strong> comes from returns, not the money put in.
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">Variable Magnitudes</p>
          <HBarRow label="PV" value={Math.abs(sc.pv)} max={maxMag} display={fmtShort(sc.pv)} color="bg-blue-700" labelWidth="w-24" />
          <HBarRow label="FV" value={Math.abs(sc.fv)} max={maxMag} display={fmtShort(sc.fv)} color="bg-emerald-700" labelWidth="w-24" />
          <HBarRow label="PMT x n" value={Math.abs(totalPayments)} max={maxMag} display={fmtShort(totalPayments)} color="bg-amber-800" labelWidth="w-24" />
          <p className="text-[10px] text-slate-600 mt-1">Rate per period: {(sc.rate * 100).toFixed(4)}% · {sc.due ? 'Annuity due' : 'Ordinary annuity'}</p>
        </div>

        {solvedResult && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-800 mb-1">Solved Variable</p>
            <p className="text-sm font-bold text-sky-900">{solvedResult.label}: {solvedResult.value}</p>
            <p className="text-xs text-sky-800 mt-1">
              {sc.due ? 'Annuity Due' : 'Ordinary Annuity'} &middot; {solveFor === 'RATE' ? 'Newton-Raphson iteration' : 'TVM formula'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
