import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

function parseNum(s: string): number {
  const m = s.replace(/,/g, '').match(/[\d.-]+/);
  return m ? parseFloat(m[0]) : 0;
}

export default function PrimeNumberPanel({ results }: Props) {
  const isPrime = results.find(r => r.id === 'isPrime');
  const factors = results.find(r => r.id === 'factors');
  const divisorCount = results.find(r => r.id === 'divisorCount');
  const n = results.find(r => r.id === 'n');

  if (!isPrime) return null;

  const prime = isPrime.value === 'Yes';
  const num = n ? parseNum(n.value) : 0;
  const factorStr = factors?.value ?? '';

  // Parse factors for display
  const factorList = factorStr ? factorStr.split(',').map(s => s.trim()).filter(s => s) : [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Primality Result</span>
      </div>
      <div className="p-5 space-y-4">
        {/* Prime / Composite indicator */}
        <div className="flex flex-col items-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            prime ? 'bg-emerald-100' : 'bg-red-100'
          }`}>
            <span className={`text-3xl font-bold ${
              prime ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {prime ? 'P' : 'C'}
            </span>
          </div>
          <span className={`mt-2 text-lg font-bold ${
            prime ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {num} is {prime ? 'PRIME' : 'COMPOSITE'}
          </span>
        </div>

        {/* Factor cards */}
        {!prime && factorList.length > 0 && (
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1.5">
              Prime Factors
            </p>
            <div className="flex flex-wrap gap-1.5">
              {factorList.map((f, i) => (
                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
                  {f}
                  {i < factorList.length - 1 && (
                    <span className="ml-1 text-indigo-300 font-normal">&times;</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Is Prime</p>
            <p className={`text-sm font-bold mt-0.5 ${prime ? 'text-emerald-600' : 'text-red-600'}`}>
              {isPrime.value}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Divisors</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">{divisorCount?.value ?? '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
