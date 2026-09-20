import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, InputField } from '../../src/types/calculator';

// Exercises every calculator's showWhen / explainSteps / gauge / chart / donut /
// extraPanel with realistic input values. These are only ever invoked by the
// React form (showWhen) or the "Living Answer" panels (the rest) — Playwright
// E2E covers the rendered behavior, but vitest's coverage scope is index.ts(x),
// so this sweep exercises the underlying pure functions directly. A throw here
// is a real bug: the docs promise "return null/[] when inputs are incomplete",
// not a crash.
const modules = import.meta.glob<{ default: CalculatorConfig }>(
  ['../../src/calculators/**/index.{ts,tsx}', '!../../src/calculators/registry/**'],
  { eager: false }
);

const TEST_TIMEOUT = 15000;

function sampleValue(input: InputField): string {
  if (input.defaultValue) return input.defaultValue;
  if (input.type === 'select') {
    return input.options?.[0]?.value ?? '';
  }
  if (input.type === 'date') return '2026-01-15';
  if (input.placeholder) {
    // Strip thousands separators/units so numeric placeholders parse cleanly,
    // e.g. "6,500" -> "6500", "5'10\"" left as-is for text fields.
    if (input.type === 'number' || input.type === 'percentage') {
      const cleaned = input.placeholder.replace(/,/g, '');
      const match = cleaned.match(/-?\d+(\.\d+)?/);
      if (match) return match[0];
    }
    return input.placeholder;
  }
  if (input.type === 'number' || input.type === 'percentage') return '10';
  return 'test';
}

describe('calculator function coverage sweep', () => {
  for (const [path, loader] of Object.entries(modules)) {
    const name = path.replace('../../src/calculators/', '');

    it(`${name}: showWhen / explainSteps / gauge / chart / donut / extraPanel do not throw`, async () => {
      const mod = await loader();
      const config = mod.default;
      expect(config).toBeTruthy();

      const values: Record<string, string> = {};
      for (const input of config.inputs) {
        values[input.id] = sampleValue(input);
      }

      for (const input of config.inputs) {
        if (input.showWhen) {
          expect(() => input.showWhen!(values)).not.toThrow();
        }
      }

      const results = config.calculate(values);
      expect(Array.isArray(results)).toBe(true);

      if (config.explainSteps) expect(() => config.explainSteps!(values)).not.toThrow();
      if (config.gauge) expect(() => config.gauge!(values)).not.toThrow();
      if (config.chart) expect(() => config.chart!(values)).not.toThrow();
      if (config.donut) expect(() => config.donut!(values)).not.toThrow();
      if (config.extraPanel) expect(() => config.extraPanel!(values, results)).not.toThrow();
    }, TEST_TIMEOUT);

    // Branch coverage: a single happy-path input set only ever walks one side
    // of every guard/ternary (e.g. "incomplete inputs -> []", positive vs.
    // negative result coloring, one branch per <select> option). These extra
    // passes are deliberately loose on assertions — they exist to exercise the
    // other side of those branches, not to pin exact values.
    it(`${name}: incomplete/edge input variants do not throw`, async () => {
      const mod = await loader();
      const config = mod.default;

      const happyPath: Record<string, string> = {};
      for (const input of config.inputs) happyPath[input.id] = sampleValue(input);

      const runAll = (values: Record<string, string>) => {
        expect(() => config.calculate(values)).not.toThrow();
        const results = config.calculate(values);
        for (const input of config.inputs) {
          if (input.showWhen) expect(() => input.showWhen!(values)).not.toThrow();
        }
        if (config.explainSteps) expect(() => config.explainSteps!(values)).not.toThrow();
        if (config.gauge) expect(() => config.gauge!(values)).not.toThrow();
        if (config.chart) expect(() => config.chart!(values)).not.toThrow();
        if (config.donut) expect(() => config.donut!(values)).not.toThrow();
        if (config.extraPanel) expect(() => config.extraPanel!(values, results)).not.toThrow();
      };

      // All inputs empty — hits "incomplete input" early-return guards.
      const empty: Record<string, string> = {};
      for (const input of config.inputs) empty[input.id] = '';
      runAll(empty);

      // Numeric inputs at their boundary (min, or 0) — flips sign-dependent
      // ternaries (surplus/deficit, over/under target, positive/negative).
      const boundary: Record<string, string> = { ...happyPath };
      for (const input of config.inputs) {
        if (input.type === 'number' || input.type === 'percentage') {
          boundary[input.id] = String(input.min ?? 0);
        }
      }
      runAll(boundary);

      // Every combination of <select> options — calculators like unit/base
      // converters branch on TWO or more selects at once (fromBase x toBase,
      // mode x operation), so varying only one at a time while holding the
      // others at their first option misses branches that depend on the
      // combination. Bounded so a calculator with many selects doesn't blow
      // up combinatorially; those fall back to one-at-a-time coverage.
      const selectInputs = config.inputs.filter((i) => i.type === 'select' && i.options?.length);
      const comboCount = selectInputs.reduce((n, i) => n * (i.options!.length || 1), 1);
      if (selectInputs.length > 0 && comboCount <= 200) {
        let combos: Record<string, string>[] = [{}];
        for (const input of selectInputs) {
          const next: Record<string, string>[] = [];
          for (const combo of combos) {
            for (const option of input.options!) {
              next.push({ ...combo, [input.id]: option.value });
            }
          }
          combos = next;
        }
        for (const combo of combos) {
          runAll({ ...happyPath, ...combo });
        }
      } else {
        for (const input of selectInputs) {
          for (const option of input.options!) {
            runAll({ ...happyPath, [input.id]: option.value });
          }
        }
      }
    }, TEST_TIMEOUT);
  }
});
