import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function TripFuelCostPanel({ values, results }: Props) {
  const totalCost = results.find(r => r.id === 'totalCost');
  const perPerson = results.find(r => r.id === 'perPerson');
  const gallons = results.find(r => r.id === 'gallonsNeeded');
  const costPer100 = results.find(r => r.id === 'costPer100');

  if (!totalCost) return null;

  const totalVal = parseNum(totalCost.value);
  const perPersonVal = perPerson ? parseNum(perPerson.value) : 0;
  const maxVal = Math.max(totalVal, perPersonVal);

  const passengers = parseFloat(values?.passengers || '1') || 1;

  // Workaround for props access
  const bar = (label: string, val: number, color: string) => {
    const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="text-xs font-semibold text-slate-600 w-32 flex-shrink-0">{label}</span>
        <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
          <div className={`h-full rounded ${color} transition-all flex items-center justify-end pr-1.5 ${pct < 12 ? 'min-w-[50px]' : ''}`} style={{ width: `${Math.max(pct, 5)}%` }}>
            <span className="text-[10px] font-bold text-white drop-shadow-sm">${val.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Trip Cost Breakdown</span>
      </div>
      <div className="p-5 space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Total Fuel Cost</p>
          <p className="text-3xl font-bold text-blue-700">{totalCost.value}</p>
        </div>
        {perPerson && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Cost per Person ({passengers})</span>
            <span className="text-sm font-bold text-emerald-600">{perPerson.value}</span>
          </div>
        )}
        {gallons && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Fuel Needed</span>
            <span className="text-sm font-bold text-slate-700">{gallons.value}</span>
          </div>
        )}
        {costPer100 && (
          <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-xs text-slate-600">Per 100 Miles</span>
            <span className="text-sm font-bold text-slate-700">{costPer100.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
