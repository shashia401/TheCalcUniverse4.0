import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, InputField } from '../../src/types/calculator';

// Regression gate: every calculator must survive in-range edge inputs.
// For each number/percentage input we try blank, tiny, zero, negative (when the
// declared range allows it), the declared min, and the declared max (1e6 if none),
// and assert calculate() never throws and never renders NaN / Infinity / undefined.
// Values outside an input's declared min/max are blocked by CalculatorForm, so
// they are not exercised here. Internal data rows (ids starting "_") are JSON and
// may legitimately contain null.
const modules = import.meta.glob<{ default: CalculatorConfig }>(
  ['../../src/calculators/**/index.{ts,tsx}', '!../../src/calculators/registry/**'],
  { eager: false },
);

function base(input: InputField): string {
  if (input.defaultValue) return input.defaultValue;
  if (input.type === 'select') return input.options?.[0]?.value ?? '';
  if (input.type === 'date') return '2026-01-15';
  if (input.placeholder && (input.type === 'number' || input.type === 'percentage')) {
    const m = input.placeholder.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    if (m) return m[0];
  }
  if (input.placeholder) return input.placeholder;
  if (input.type === 'number' || input.type === 'percentage') return '10';
  return 'test';
}

const GARBAGE = /NaN|Infinity|∞|undefined|\[object/;
const inRange = (i: InputField, v: number) =>
  (i.min === undefined || v >= i.min) && (i.max === undefined || v <= i.max);

describe('edge inputs never produce garbage', () => {
  for (const [path, loader] of Object.entries(modules)) {
    const name = path.replace('../../src/calculators/', '').replace(/\/index\.tsx?$/, '');
    it(name, async () => {
      const cfg = (await loader()).default;
      const baseVals: Record<string, string> = {};
      for (const i of cfg.inputs) baseVals[i.id] = base(i);
      const scenarios: [string, Record<string, string>][] = [['default', baseVals]];
      for (const i of cfg.inputs) {
        if (i.type !== 'number' && i.type !== 'percentage') continue;
        const cands: [string, number | string][] = [['blank', ''], ['tiny', 0.0001], ['zero', 0], ['neg', -5]];
        if (i.min !== undefined) cands.push(['min', i.min]);
        cands.push(['max', i.max ?? 1e6]);
        for (const [tag, v] of cands) {
          if (typeof v === 'number' && !inRange(i, v)) continue;
          scenarios.push([`${i.id}=${tag}(${v})`, { ...baseVals, [i.id]: String(v) }]);
        }
      }
      const bad: string[] = [];
      for (const [tag, vals] of scenarios) {
        let out: unknown;
        try {
          out = cfg.calculate(vals);
        } catch (e) {
          bad.push(`${tag}: THROW ${(e as Error).message}`);
          continue;
        }
        if (out == null) continue;
        if (!Array.isArray(out)) {
          bad.push(`${tag}: non-array return`);
          continue;
        }
        for (const r of out as { id: string; value: unknown; unit?: unknown; interpretation?: unknown }[]) {
          if (r.id.startsWith('_')) continue;
          const text = `${r.value} ${r.unit ?? ''} ${r.interpretation ?? ''}`;
          if (typeof r.value !== 'string' || GARBAGE.test(text)) {
            bad.push(`${tag}: ${r.id} -> ${String(r.value)}`);
            break;
          }
        }
      }
      expect(bad, bad.join('\n')).toEqual([]);
    }, 20000);
  }
});
