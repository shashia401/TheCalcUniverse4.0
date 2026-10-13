import { formatQty } from '../../utils/unitConvert';

interface Props {
  /** Numeric input / output of the conversion: the same numbers calculate() formatted, never parsed back from text. */
  input: number;
  result: number;
  fromUnit: string;
  toUnit: string;
  formula?: string;
  label?: string;
}

/** Shared converter panel for the industrial unit converters. */
export default function ConverterPanel({ input, result, fromUnit, toUnit, formula, label = 'Unit Conversion' }: Props) {
  const maxVal = Math.max(Math.abs(input), Math.abs(result));
  const fromPct = maxVal > 0 ? (Math.abs(input) / maxVal) * 100 : 0;
  const toPct = maxVal > 0 ? (Math.abs(result) / maxVal) * 100 : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">{label}</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4">
          <div className="text-center">
            <p className="text-xs text-slate-600 mb-1">Source</p>
            <p className="text-2xl font-bold text-blue-700">
              {formatQty(input)} <span className="text-sm font-medium text-blue-700">{fromUnit}</span>
            </p>
          </div>
          <div className="flex justify-center my-2">
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
              <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-600 mb-1">Target</p>
            <p className="text-2xl font-bold text-emerald-700">
              {formatQty(result)} <span className="text-sm font-medium text-emerald-700">{toUnit}</span>
            </p>
          </div>
        </div>

        {/* Relative magnitude of the two numbers (decorative: both values are printed above) */}
        <div className="space-y-1" aria-hidden="true">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-3 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(fromPct, 3)}%` }} />
            </div>
            <span className="text-[10px] text-slate-600 w-14 truncate">{fromUnit}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-3 bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.max(toPct, 3)}%` }} />
            </div>
            <span className="text-[10px] text-slate-600 w-14 truncate">{toUnit}</span>
          </div>
        </div>

        {formula && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-600">{formula}</p>
          </div>
        )}
      </div>
    </div>
  );
}
