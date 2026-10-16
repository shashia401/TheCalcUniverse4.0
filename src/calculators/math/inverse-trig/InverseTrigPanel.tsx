import { useMemo } from 'react';
import { CalculatorResult } from '../../../types/calculator';
import SvgLineChart from '../../../components/charts/SvgLineChart';
import { parseNumberStrict } from '../../../utils/parseNumber';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

const FN: Record<string, { fn: (v: number) => number; lo: number; hi: number }> = {
  arcsin: { fn: Math.asin, lo: -1, hi: 1 },
  arccos: { fn: Math.acos, lo: -1, hi: 1 },
  arctan: { fn: Math.atan, lo: -4, hi: 4 },
};

export default function InverseTrigPanel({ values, results }: Props) {
  const funcName = values.function || 'arcsin';
  const inputVal = parseNumberStrict(values.value);

  // Hooks first, early returns after (the old panel called useMemo after conditional returns).
  const curve = useMemo(() => {
    const f = FN[funcName];
    if (!f) return [];
    return Array.from({ length: 81 }, (_, i) => {
      const x = f.lo + ((f.hi - f.lo) * i) / 80;
      return { x, y: f.fn(x) };
    }).filter((p) => Number.isFinite(p.y));
  }, [funcName]);

  const degrees = results.find((r) => r.id === 'degrees');
  const radians = results.find((r) => r.id === 'radians');
  const principalValue = results.find((r) => r.id === 'principalValue');
  const domainCheck = results.find((r) => r.id === 'domainCheck');
  const domainError = results.find((r) => r.id === 'domainError');
  const exact = results.find((r) => r.id === 'exactValue');
  const all = results.find((r) => r.id === 'allSolutions');
  const radFull = Number(results.find((r) => r.id === '_radians')?.value);

  if (domainError) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Domain Error</span>
        </div>
        <div className="p-5">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{domainError.value}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!degrees || !radians || !principalValue || !Number.isFinite(inputVal)) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">{funcName.toUpperCase()} — Inverse Trig</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-600 mb-1">
            {funcName}({values.value})
          </p>
          <p className="text-3xl font-bold text-blue-700 font-mono break-all">{degrees.value}</p>
          <p className="text-xs text-slate-600 mt-1">{radians.value} rad{exact ? ` (exactly ${exact.value.split(' rad')[0]})` : ''}</p>
        </div>

        {curve.length > 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">f(x) = {funcName}(x), output in radians</p>
            <SvgLineChart
              height={240}
              ariaLabel={`Graph of ${funcName}(x) with the point x = ${values.value}, ${funcName} = ${radians.value} radians (${degrees.value})`}
              series={[{ name: `${funcName}(x)`, color: '#2563eb', points: curve }]}
              refLines={[{ y: 0, color: '#cbd5e1', dashed: false }, { x: 0, color: '#cbd5e1', dashed: false }]}
              dots={Number.isFinite(radFull) ? [{ x: inputVal, y: radFull, label: `(${+inputVal.toPrecision(5)}, ${+radFull.toPrecision(5)})`, color: '#dc2626' }] : []}
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Principal Value</p>
            <p className="text-sm font-mono font-bold text-slate-700">{principalValue.value}</p>
          </div>
          {domainCheck && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Domain</p>
              <p className="text-xs font-mono text-slate-700">{domainCheck.value}</p>
            </div>
          )}
          {all && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center sm:col-span-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{all.label}</p>
              <p className="text-xs font-mono text-slate-700">{all.value}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
