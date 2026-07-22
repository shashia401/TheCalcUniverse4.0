import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function ClothingSizePanel({ results }: Props) {
  const us = results.find(r => r.id === 'us');
  const uk = results.find(r => r.id === 'uk');
  const eu = results.find(r => r.id === 'eu');
  const jp = results.find(r => r.id === 'jp');
  const intl = results.find(r => r.id === 'intl');

  if (!us || !uk || !eu || !jp) return null;

  const rows = [
    { label: 'US', value: us.value, color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { label: 'UK', value: uk.value, color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    { label: 'EU', value: eu.value, color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { label: 'JP', value: jp.value, color: 'bg-rose-50 border-rose-200 text-rose-700' },
  ];

  if (intl) {
    rows.push({ label: 'Intl', value: intl.value, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Size Conversion</span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {rows.map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border ${color} px-4 py-3 text-center`}>
              <p className="text-[10px] uppercase tracking-wide font-semibold opacity-70">{label}</p>
              <p className="text-lg font-bold mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
