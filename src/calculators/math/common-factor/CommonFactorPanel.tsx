import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function CommonFactorPanel({ values, results }: Props) {
  const parsedA = parseInt(values.a, 10);
  const a = isNaN(parsedA) ? 0 : parsedA;
  const parsedB = parseInt(values.b, 10);
  const b = isNaN(parsedB) ? 0 : parsedB;

  if (!a || !b || results.length === 0) return null;

  const gcf = results.find(r => r.id === 'gcf')?.value || '';
  const commonFactors = results.find(r => r.id === 'commonFactors')?.value || '';
  const factorsA = results.find(r => r.id === 'factorsA')?.value || '';
  const factorsB = results.find(r => r.id === 'factorsB')?.value || '';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Common Factors</span>
      </div>

      <div className="p-5 space-y-4">
        {/* GCF Highlight */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Greatest Common Factor</p>
          <p className="text-4xl font-bold font-mono text-emerald-700">{gcf}</p>
        </div>

        {/* Common Factors */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2">Common Factors</p>
          <div className="flex flex-wrap gap-1.5">
            {commonFactors.split(', ').map((f, i) => (
              <span key={`item-${i}`} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-blue-100 text-blue-700">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Side-by-side factors */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Factors of {a}</p>
            <div className="flex flex-wrap gap-1">
              {factorsA.split(', ').map((f, i) => (
                <span key={`item-${i}`} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${commonFactors.split(', ').includes(f) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Factors of {b}</p>
            <div className="flex flex-wrap gap-1">
              {factorsB.split(', ').map((f, i) => (
                <span key={`item-${i}`} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${commonFactors.split(', ').includes(f) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
