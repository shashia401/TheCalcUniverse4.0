import { CalculatorResult } from '../../../types/calculator';
import { parsePositiveSafeInt } from '../../../utils/numberTheory';
import { analyzePrime } from './primeNumberMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function PrimeNumberPanel({ values, results }: Props) {
  const p = parsePositiveSafeInt(values.n);
  if (p.kind !== 'ok' || results.length === 0) return null;
  const { n, prime, factors, divisorCount } = analyzePrime(p.n);
  const verdict = n === 1 ? 'NEITHER PRIME NOR COMPOSITE' : prime ? 'PRIME' : 'COMPOSITE';
  const good = prime;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Primality Result</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex flex-col items-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${good ? 'bg-emerald-100' : 'bg-red-100'}`}>
            <span className={`text-3xl font-bold ${good ? 'text-emerald-700' : 'text-red-700'}`}>{prime ? 'P' : n === 1 ? '1' : 'C'}</span>
          </div>
          <span className={`mt-2 text-lg font-bold text-center break-all ${good ? 'text-emerald-700' : 'text-red-700'}`}>
            {n} is {verdict}
          </span>
        </div>

        {!prime && factors.length > 0 && (
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold mb-1.5">Prime Factors</p>
            <div className="flex flex-wrap gap-1.5">
              {factors.map((f, i) => (
                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
                  {f}
                  {i < factors.length - 1 && <span className="ml-1 text-indigo-700 font-normal" aria-hidden="true">&times;</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">Is Prime</p>
            <p className={`text-sm font-bold mt-0.5 ${good ? 'text-emerald-700' : 'text-red-700'}`}>{prime ? 'Yes' : 'No'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">Divisors</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">{divisorCount.toLocaleString('en-US')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
