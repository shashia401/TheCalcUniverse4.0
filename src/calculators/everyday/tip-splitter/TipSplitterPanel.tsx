import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function TipSplitterPanel({ results }: Props) {
  const perPerson = results.find(r => r.id === 'perPersonTotal');
  const tipAmount = results.find(r => r.id === 'tipAmount');
  const perPersonTip = results.find(r => r.id === 'perPersonTip');
  const totalBill = results.find(r => r.id === 'totalBill');

  if (!perPerson || !totalBill) return null;

  const totalVal = parseFloat(totalBill.value.replace(/[$,]/g, '')) || 0;
  const people = perPerson.label.match(/÷(\d+)/)?.[1] || '1';
  const perPVal = parseFloat(perPerson.value.replace(/[$,]/g, '')) || 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Split Breakdown</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Per-person highlight */}
        <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 text-center">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Each Person Pays</p>
          <p className="text-3xl font-bold font-mono text-blue-700">{perPerson.value}</p>
          <p className="text-sm text-blue-400 mt-1">Split {people} ways</p>
        </div>

        {/* Visual bars */ }
        {Array.from({ length: parseInt(people) || 1 }, (_, i) => {
          const pct = totalVal > 0 ? (perPVal / totalVal) * 100 : 0;
          return (
            <div key={`item-${i}`} className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-500 w-6 text-center">#{i + 1}</span>
              <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded flex items-center justify-end pr-1.5"
                  style={{ width: `${pct}%` }}
                >
                  <span className="text-[9px] font-bold text-white">{perPerson.value}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[9px] font-bold text-slate-500 uppercase">Total Bill</p>
            <p className="text-sm font-bold font-mono text-slate-700">{totalBill.value}</p>
          </div>
          {tipAmount && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[9px] font-bold text-slate-500 uppercase">Total Tip</p>
              <p className="text-sm font-bold font-mono text-slate-700">{tipAmount.value}</p>
            </div>
          )}
        </div>

        {perPersonTip && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-amber-500 uppercase">Tip Per Person</p>
            <p className="text-lg font-bold font-mono text-amber-700">{perPersonTip.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
