import { CalculatorResult } from '../../../types/calculator';
import { formatQty, scaleRecipe } from './recipeMath';

interface Props {
  values: Record<string, string>;
  results: CalculatorResult[];
}

export default function RecipeScalerPanel({ values, results }: Props) {
  const scaleRow = results.find((r) => r.id === 'scaleFactor');
  // Same pure function index.ts uses; the panel never parses result strings.
  const r = scaleRecipe(values);
  if (!scaleRow || !r || !r.ingredients.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <svg aria-hidden="true" className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Scaled Ingredients</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-center">
          <p className="text-[10px] font-bold text-blue-700 uppercase">Scale Factor</p>
          <p className="text-2xl font-bold font-mono text-blue-800">{scaleRow.value}</p>
          <p className="text-[10px] text-blue-700">{r.original} servings to {r.desired} servings</p>
        </div>

        <table className="w-full text-sm">
          <caption className="sr-only">Original and scaled ingredient quantities</caption>
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-slate-600">
              <th scope="col" className="py-1 font-semibold">Ingredient</th>
              <th scope="col" className="py-1 font-semibold text-right">Original</th>
              <th scope="col" className="py-1 font-semibold text-right">Scaled</th>
            </tr>
          </thead>
          <tbody>
            {r.ingredients.map((ing) => (
              <tr key={ing.id} className="border-t border-slate-100">
                <td className="py-1.5 text-slate-700">{ing.name || 'Ingredient'}</td>
                <td className="py-1.5 text-right font-mono text-slate-600">{formatQty(ing.original)}{ing.unit ? ` ${ing.unit}` : ''}</td>
                <td className="py-1.5 text-right font-mono font-bold text-emerald-800">{formatQty(ing.scaled)}{ing.unit ? ` ${ing.unit}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
