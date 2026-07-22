import { CalculatorResult } from '../../../types/calculator';
import { ShapeValues } from './ShapeRenderers';

// ─── Formula Application ─────────────────────────────────────────────────────

export function FormulaApplied({ shape, vals, results }: { shape: string; vals: ShapeValues; results: CalculatorResult[] }) {
  const volume = results.find(r => r.id === 'volume');
  const surface = results.find(r => r.id === 'surface');

  if (!volume || !surface) return null;

  const items: { formula: string; sub: string; result: string }[] = [];

  switch (shape) {
    case 'sphere': {
      const r = vals.r || 0;
      items.push({ formula: 'V = ⁴⁄₃πr³', sub: `= ⁴⁄₃ × π × ${r}³`, result: `= ${volume.value}` });
      items.push({ formula: 'SA = 4πr²', sub: `= 4 × π × ${r}²`, result: `= ${surface.value}` });
      break;
    }
    case 'cube': {
      const s = vals.s || 0;
      items.push({ formula: 'V = s³', sub: `= ${s}³`, result: `= ${volume.value}` });
      items.push({ formula: 'SA = 6s²', sub: `= 6 × ${s}²`, result: `= ${surface.value}` });
      break;
    }
    case 'box': {
      const { l, w, h } = vals;
      items.push({ formula: 'V = lwh', sub: `= ${l} × ${w} × ${h}`, result: `= ${volume.value}` });
      items.push({ formula: 'SA = 2(lw+lh+wh)', sub: `= 2(${l}×${w} + ${l}×${h} + ${w}×${h})`, result: `= ${surface.value}` });
      break;
    }
    case 'cylinder': {
      const r = vals.r || 0, h = vals.h || 0;
      items.push({ formula: 'V = πr²h', sub: `= π × ${r}² × ${h}`, result: `= ${volume.value}` });
      items.push({ formula: 'SA = 2πr(r+h)', sub: `= 2π × ${r} × (${r}+${h})`, result: `= ${surface.value}` });
      break;
    }
    case 'cone': {
      const r = vals.r || 0, h = vals.h || 0;
      items.push({ formula: 'V = ⅓πr²h', sub: `= ⅓ × π × ${r}² × ${h}`, result: `= ${volume.value}` });
      items.push({ formula: 'SA = πr(r+l)', sub: `= π × ${r} × (${r} + √(${r}²+${h}²))`, result: `= ${surface.value}` });
      break;
    }
    case 'pyramid': {
      const b = vals.r || 0, h = vals.h || 0;
      items.push({ formula: 'V = ⅓b²h', sub: `= ⅓ × ${b}² × ${h}`, result: `= ${volume.value}` });
      items.push({ formula: 'SA = b² + 2bl', sub: `= ${b}² + 2×${b}×√(h²+(b/2)²)`, result: `= ${surface.value}` });
      break;
    }
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-2">Formula Applied</p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={`item-${i}`} className="bg-white rounded-lg border border-blue-200 p-2.5">
            <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-xs font-mono">
              <span className="font-bold text-slate-700">{item.formula}</span>
              <span className="text-right font-bold text-emerald-600">{item.result}</span>
              <span className="text-slate-500 col-span-2 text-[11px]">{item.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
