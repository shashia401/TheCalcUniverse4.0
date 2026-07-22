import { CalculatorResult } from '../../../types/calculator';

interface AnimationData {
  moves: number;
  direction: string;
  original: string;
  coefficient: string;
  exponent: number;
}

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function ScientificNotationPanel({ values, results }: Props) {
  const mode = values.mode || 'toScientific';
  const scientific = results.find(r => r.id === 'scientific')?.value || '';
  const animationData = results.find(r => r.id === '_animationData')?.value;

  if (results.length === 0) return null;

  if (mode === 'toDecimal') {
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
          <p className="text-3xl font-bold font-mono text-emerald-700">{results.find(r => r.id === 'decimal')?.value}</p>
        </div>
      </div>
    );
  }

  let anim: AnimationData | null = null;
  try {
    if (animationData) anim = JSON.parse(animationData);
  } catch { /* ignore */ }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Decimal Movement Visualization</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Decimal jump visualization */}
        {anim && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 overflow-x-auto">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-3">
              Decimal Point: Moving {anim.moves} place{anim.moves !== 1 ? 's' : ''} {anim.direction}
            </p>

            {/* Show digits with animated decimal */}
            <div className="font-mono text-center">
              {/* Original number */}
              <p className="text-sm text-slate-500 mb-2">
                Original: <span className="font-bold text-slate-700">{anim.original}</span>
              </p>

              {/* Visual decimal movement */}
              <div className="bg-white rounded-lg border border-blue-200 p-3 mb-2">
                <p className="font-mono text-lg">
                  {anim.coefficient}{' '}
                  <span className="text-blue-500 font-bold">× 10<sup className="text-sm">{anim.exponent}</sup></span>
                </p>
              </div>

              {/* Arrow indication */}
              <div className="flex justify-center items-center gap-2 text-xs text-blue-600 mb-2">
                <span>Decimal moved {anim.moves} place{anim.moves !== 1 ? 's' : ''} {anim.direction}</span>
              </div>

              <div className="bg-white rounded-lg border border-emerald-200 p-3">
                <p className="font-mono text-lg text-emerald-700 font-bold">
                  = {scientific}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Result card */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Scientific Notation</p>
          <p className="text-lg font-mono font-bold text-emerald-700">{scientific}</p>
        </div>

        {/* E Notation */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">E Notation (For Programming)</p>
          <p className="text-lg font-mono font-bold text-slate-700 text-center">{results.find(r => r.id === 'eNotation')?.value}</p>
        </div>
      </div>
    </div>
  );
}
