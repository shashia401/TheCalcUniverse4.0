import type { CalculatorResult } from '../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
  label?: string;
}

/**
 * Shared converter panel for unit converters.
 * Parses the result value which has the format "X fromUnit = Y toUnit"
 * and displays a horizontal conversion bar.
 */
export default function ConverterPanel({ results, label = 'Unit Conversion' }: Props) {
  const result = results.find(r => r.id === 'result');
  const formula = results.find(r => r.id === 'formula');

  if (!result) return null;

  // Parse the result: "100 cm = 39.37 in"
  const parts = result.value.split(' = ');
  const fromPart = parts[0] || '';
  const toPart = parts[1] || '';

  const fromMatch = fromPart.match(/^([\d,.-]+)\s+(.+)$/);
  const toMatch = toPart.match(/^([\d,.-]+)\s+(.+)$/);

  const fromVal = fromMatch ? parseFloat(fromMatch[1].replace(/,/g, '')) : 0;
  const toVal = toMatch ? parseFloat(toMatch[1].replace(/,/g, '')) : 0;
  const fromUnit = fromMatch ? fromMatch[2] : '';
  const toUnit = toMatch ? toMatch[2] : '';

  const maxVal = Math.max(fromVal, toVal);
  const fromPct = maxVal > 0 ? (fromVal / maxVal) * 100 : 0;
  const toPct = maxVal > 0 ? (toVal / maxVal) * 100 : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">{label}</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Source</p>
            <p className="text-2xl font-bold text-blue-700">{fromVal.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-sm font-medium text-blue-500">{fromUnit}</span></p>
          </div>
          <div className="flex justify-center my-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Target</p>
            <p className="text-2xl font-bold text-emerald-700">{toVal.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-sm font-medium text-emerald-500">{toUnit}</span></p>
          </div>
        </div>

        {/* Conversion bar */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-500 w-16 text-right">{fromVal.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
            <div className="flex-1 h-3 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(fromPct, 3)}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 w-10">{fromUnit}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-500 w-16 text-right">{toVal.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
            <div className="flex-1 h-3 bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(toPct, 3)}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 w-10">{toUnit}</span>
          </div>
        </div>

        {formula && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] text-slate-500">{formula.value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
