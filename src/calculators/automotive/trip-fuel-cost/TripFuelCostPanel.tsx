import { CalculatorResult } from '../../../types/calculator';
import { tripFuel } from './tripMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const usd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function TripFuelCostPanel({ values, results }: Props) {
  const t = tripFuel(values);
  if (!t || 'error' in t || !results.length) return null;

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
          <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Total Fuel Cost</p>
          <p className="text-3xl font-bold text-blue-800">{usd(t.totalCost)}</p>
        </div>
        <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
          <span className="text-xs text-slate-600">Cost per Person ({t.passengers})</span>
          <span className="text-sm font-bold text-emerald-700">{usd(t.costPerPerson)}</span>
        </div>
        <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
          <span className="text-xs text-slate-600">Fuel Needed</span>
          <span className="text-sm font-bold text-slate-700">
            {t.fuelAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t.metric ? 'liters' : 'gallons'}
          </span>
        </div>
        <div className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2">
          <span className="text-xs text-slate-600">{t.metric ? 'Per 100 km' : 'Per 100 Miles'}</span>
          <span className="text-sm font-bold text-slate-700">{usd(t.costPer100)}</span>
        </div>
      </div>
    </div>
  );
}
