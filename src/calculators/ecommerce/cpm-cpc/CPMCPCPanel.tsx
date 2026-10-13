import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// Displays the already-computed result rows; no math is repeated here.
export default function CPMCPCPanel({ results }: Props) {
  const find = (id: string) => results.find((r) => r.id === id);
  const cpm = find('cpm');
  const cpc = find('cpc');
  const ctr = find('ctr');
  const spend = find('totalSpend');
  const budget = find('requiredBudget');

  if (!results.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Ad Metrics</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="grid grid-cols-2 gap-3">
          {budget && (
            <div className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
              <p className="text-[10px] font-bold text-emerald-700 uppercase">{budget.label}</p>
              <p className="text-xl font-bold text-emerald-800">{budget.value}</p>
            </div>
          )}
          {cpm && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
              <p className="text-[10px] font-bold text-blue-700 uppercase">CPM</p>
              <p className="text-xl font-bold text-blue-800">{cpm.value}</p>
            </div>
          )}
          {cpc && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-center">
              <p className="text-[10px] font-bold text-purple-700 uppercase">CPC</p>
              <p className="text-xl font-bold text-purple-800">{cpc.value}</p>
            </div>
          )}
        </div>
        {ctr && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">CTR</span>
            <span className="text-sm font-bold text-slate-700">{ctr.value}</span>
          </div>
        )}
        {spend && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Ad Spend</span>
            <span className="text-sm font-bold text-slate-700">{spend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
