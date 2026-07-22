import { CalculatorResult } from '../../../types/calculator';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function RecipeScalerPanel({ results }: Props) {
  const scaleRow = results.find(r => r.id === 'scaleFactor');
  const ingredients = results.filter(r => r.id.endsWith('-scaled'));

  if (!scaleRow || !ingredients.length) return null;
  const factor = parseFloat(scaleRow.value) || 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Scaled Ingredients</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-center">
          <p className="text-[10px] font-bold text-blue-500 uppercase">Scale Factor</p>
          <p className="text-2xl font-bold font-mono text-blue-700">{scaleRow.value}</p>
        </div>

        <div className="space-y-2">
          {ingredients.map((ing, i) => {
            const pct = factor >= 1 ? 100 : Math.max(factor * 100, 10);
            return (
              <div key={`item-${i}`} className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-500 w-28 flex-shrink-0 truncate">{ing.label}</span>
                <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded flex items-center justify-end pr-1.5"
                    style={{ width: `${pct}%` }}
                  >
                    <span className="text-[9px] font-bold text-white drop-shadow-sm">{ing.value}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
