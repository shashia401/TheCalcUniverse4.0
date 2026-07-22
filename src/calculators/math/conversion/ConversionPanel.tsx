import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

// ─── Quick-reference tables per category ─────────────────────────────────────

interface QuickRefEntry {
  label: string;
  value: string;
}

const QUICK_REF: Record<string, QuickRefEntry[]> = {
  weight: [
    { label: '1 kg', value: '2.20462 lb' },
    { label: '1 lb', value: '0.45359237 kg' },
    { label: '1 oz', value: '28.3495 g' },
    { label: '1 ton', value: '2,000 lb' },
    { label: '1 metric ton', value: '1,000 kg' },
  ],
  length: [
    { label: '1 m', value: '3.28084 ft' },
    { label: '1 ft', value: '0.3048 m' },
    { label: '1 in', value: '2.54 cm' },
    { label: '1 km', value: '0.621371 mi' },
    { label: '1 mi', value: '1.60934 km' },
  ],
  temperature: [
    { label: '0°C', value: '32°F / 273.15 K' },
    { label: '100°C', value: '212°F / 373.15 K' },
    { label: '32°F', value: '0°C / 273.15 K' },
    { label: '-40°C', value: '-40°F' },
    { label: '0 K', value: '-273.15°C / -459.67°F' },
  ],
  volume: [
    { label: '1 L', value: '0.264172 gal' },
    { label: '1 gal', value: '3.78541 L' },
    { label: '1 cup', value: '236.588 mL' },
    { label: '1 fl oz', value: '29.5735 mL' },
    { label: '1 tbsp', value: '14.7868 mL' },
  ],
  data: [
    { label: '1 B', value: '8 b' },
    { label: '1 KB', value: '1,000 B' },
    { label: '1 MB', value: '1,000 KB' },
    { label: '1 GB', value: '1,000 MB' },
    { label: '1 TB', value: '1,000 GB' },
  ],
  speed: [
    { label: '1 m/s', value: '3.6 km/h' },
    { label: '1 km/h', value: '0.621371 mph' },
    { label: '1 mph', value: '1.60934 km/h' },
    { label: '1 knot', value: '1.15078 mph' },
  ],
  area: [
    { label: '1 m²', value: '10.7639 ft²' },
    { label: '1 ft²', value: '0.092903 m²' },
    { label: '1 acre', value: '43,560 ft² / 4,046.86 m²' },
    { label: '1 hectare', value: '2.47105 acre' },
    { label: '1 km²', value: '247.105 acre' },
  ],
  currency: [
    { label: '1 USD', value: '€0.93 EUR / £0.79 GBP' },
    { label: '1 EUR', value: '$1.08 USD' },
    { label: '1 GBP', value: '$1.27 USD' },
    { label: '1 JPY', value: '$0.0067 USD' },
    { label: '1 INR', value: '$0.012 USD' },
  ],
};

const CATEGORY_ICONS: Record<string, string> = {
  weight: 'âš–',
  length: '📏',
  temperature: '🌡',
  volume: '🧪',
  data: '💾',
  speed: '🚀',
  area: '📐',
  currency: '💰',
};

export default function ConversionPanel({ values, results }: Props) {
  const resultRow = results.find(r => r.id === 'result');
  const formulaRow = results.find(r => r.id === 'formula');
  const categoryRow = results.find(r => r.id === 'category');
  const fromRow = results.find(r => r.id === 'fromDetail');
  const toRow = results.find(r => r.id === 'toDetail');

  if (!resultRow || !formulaRow || !categoryRow) return null;

  const category = (values.category || '').trim();
  const quickRef = QUICK_REF[category] || [];
  const icon = CATEGORY_ICONS[category] || '📐';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Conversion Result
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Big result card */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-2">Result</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-700 font-mono">
            {formulaRow.value}
          </p>
        </div>

        {/* From / To breakdown with visual bar */}
        {(fromRow || toRow) && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {fromRow && (
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">From</p>
                  <p className="text-sm font-mono font-bold text-slate-700 mt-0.5">{fromRow.value}</p>
                </div>
              )}
              {toRow && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                  <p className="text-[10px] font-bold text-blue-500 uppercase">To</p>
                  <p className="text-sm font-mono font-bold text-blue-700 mt-0.5">{toRow.value}</p>
                </div>
              )}
            </div>
            {/* Visual comparison bar */}
            {(() => {
              const fromMatch = fromRow?.value?.match(/^([\d,.]+)/);
              const toMatch = toRow?.value?.match(/^([\d,.]+)/);
              const fromVal = fromMatch ? parseFloat(fromMatch[1].replace(/,/g, '')) : NaN;
              const toVal = toMatch ? parseFloat(toMatch[1].replace(/,/g, '')) : NaN;
              if (!isNaN(fromVal) && !isNaN(toVal) && fromVal > 0 && toVal > 0) {
                const maxV = Math.max(fromVal, toVal);
                return (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Comparison</p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                          <span className="font-medium truncate">{fromRow?.value}</span>
                        </div>
                        <div className="h-5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(fromVal / maxV) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                          <span className="font-medium truncate">{toRow?.value}</span>
                        </div>
                        <div className="h-5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(toVal / maxV) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Category badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <span>{icon}</span>
            <span>{categoryRow.value}</span>
          </span>
        </div>

        {/* Quick reference table */}
        {quickRef.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Common {categoryRow.value} Conversions
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickRef.map((entry) => (
                <div key={entry.label} className="flex justify-between items-center bg-white rounded-lg border border-slate-200 px-3 py-2 text-xs">
                  <span className="font-semibold text-slate-700">{entry.label}</span>
                  <span className="text-slate-500 font-mono">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formula card */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Conversion Formula</p>
          <p className="text-sm font-mono text-slate-700">
            {formulaRow.value}
          </p>
        </div>

        {/* Educational note */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">How Unit Conversion Works</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            Unit conversion works by multiplying the source value by a ratio that relates the source unit
            to the target unit. For most categories, every unit has a fixed conversion factor to a standard
            base unit (e.g., meter for length). The formula is:
            <span className="block font-mono mt-1 text-amber-700 text-[11px]">
              result = value × (factor_from ÷ factor_to)
            </span>
            Temperature is the exception — it uses offset formulas because Celsius, Fahrenheit, and Kelvin
            have different zero points.
          </p>
        </div>
      </div>
    </div>
  );
}
