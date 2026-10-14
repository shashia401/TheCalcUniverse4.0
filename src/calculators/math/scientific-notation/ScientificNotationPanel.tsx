import { CalculatorResult } from '../../../types/calculator';
import { toDecimal, toScientific } from './sciNotationMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function ScientificNotationPanel({ values, results }: Props) {
  const mode = values.mode || 'toScientific';
  if (results.length === 0) return null;

  if (mode === 'toDecimal') {
    const d = toDecimal(values.coefficient, values.exponent);
    if (!d) return null;
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Scientific → Decimal</span>
        </div>
        <div className="p-5 text-center">
          <p className="text-sm font-mono text-slate-600 mb-2">{values.coefficient} × 10<sup>{values.exponent}</sup></p>
          <p className="text-3xl font-bold font-mono text-emerald-700 break-all">{d.plain ?? d.eNotation}</p>
          {!d.alreadyNormal && <p className="text-xs text-slate-600 mt-2">Normalized: {d.normalized}</p>}
        </div>
      </div>
    );
  }

  const r = toScientific(values.decimal);
  if (!r) return null;
  const plural = r.moves !== 1 ? 's' : '';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Decimal Movement Visualization</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 overflow-x-auto" tabIndex={0} role="region" aria-label="Decimal point movement visualization">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-3">
            {r.direction === 'none' ? 'Decimal point: no movement needed' : `Decimal Point: Moving ${r.moves} place${plural} ${r.direction}`}
          </p>

          <div className="font-mono text-center">
            <p className="text-sm text-slate-600 mb-2">
              Original: <span className="font-bold text-slate-700 break-all">{r.original}</span>
            </p>
            <div className="bg-white rounded-lg border border-blue-200 p-3 mb-2">
              <p className="font-mono text-lg">
                {r.coefficient}{' '}
                <span className="text-blue-700 font-bold">× 10<sup className="text-sm">{r.exponent}</sup></span>
              </p>
            </div>
            {r.direction !== 'none' && (
              <div className="flex justify-center items-center gap-2 text-xs text-blue-700 mb-2">
                <span>Decimal moved {r.moves} place{plural} {r.direction}</span>
              </div>
            )}
            <div className="bg-white rounded-lg border border-emerald-200 p-3">
              <p className="font-mono text-lg text-emerald-700 font-bold break-all">= {r.sci}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">Scientific Notation</p>
          <p className="text-lg font-mono font-bold text-emerald-700 break-all">{r.sci}</p>
          <p className="text-xs text-emerald-800 mt-1">{r.sigFigs} significant figure{r.sigFigs !== 1 ? 's' : ''}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">E Notation (For Programming)</p>
          <p className="text-lg font-mono font-bold text-slate-700 text-center break-all">{r.eNotation}</p>
        </div>
      </div>
    </div>
  );
}
