import { CalculatorResult } from '../../../types/calculator';
import { splitBill } from './tipMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function TipSplitterPanel({ values, results }: Props) {
  // Same pure function index.ts uses; the panel never parses result labels or values.
  const sp = splitBill(values);
  if (!sp || !results.length) return null;
  const usd = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const shown = sp.shares.slice(0, 12);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Split Breakdown</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 text-center">
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Each Person Pays</p>
          <p className="text-3xl font-bold font-mono text-blue-800">{usd(sp.highShare)}</p>
          <p className="text-sm text-blue-800 mt-1">Split {sp.people} ways{sp.highCount > 0 ? `; ${sp.people - sp.highCount} pay ${usd(sp.lowShare)}` : ''}</p>
        </div>

        <ul className="space-y-1" aria-label="Each person's share">
          {shown.map((cents, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-600 w-8 text-center">#{i + 1}</span>
              <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                <div className="h-full bg-blue-700 rounded flex items-center justify-end pr-1.5" style={{ width: `${(cents / sp.highShare) * 100}%` }}>
                  <span className="text-[10px] font-bold text-white">{usd(cents)}</span>
                </div>
              </div>
            </li>
          ))}
          {sp.people > shown.length && <li className="text-[11px] text-slate-600 pl-10">… and {sp.people - shown.length} more with the same split</li>}
        </ul>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Grand Total</p>
            <p className="text-sm font-bold font-mono text-slate-700">{usd(sp.totalCents)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-bold text-slate-600 uppercase">Total Tip</p>
            <p className="text-sm font-bold font-mono text-slate-700">{usd(sp.tipCents)}</p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center">
          <p className="text-[10px] font-bold text-amber-700 uppercase">Tip Per Person</p>
          <p className="text-lg font-bold font-mono text-amber-800">{usd(sp.tipShares[0])}</p>
        </div>
      </div>
    </div>
  );
}
