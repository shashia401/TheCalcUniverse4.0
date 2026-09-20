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
    });
  }
});
