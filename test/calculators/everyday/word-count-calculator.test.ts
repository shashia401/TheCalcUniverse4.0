import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/word-count/index';
import { buildDemoValues, getValue } from '../../helpers';

describe('word-count-calculator', () => {
  it('matches the worked examples\' actual stats (regression: both worked examples previously narrated word/char/sentence counts that did not match what the tokenizer produces for their own sample text)', () => {
    const examples = (config.educational as any).workedExamples as Array<{ inputs: Record<string, string> }>;
    const [ex1, ex2] = examples;

    const r1 = config.calculate(ex1.inputs);
    expect(getValue(r1, 'wordCount')).toBe('61');
    expect(getValue(r1, 'charCount')).toBe('429 with spaces / 369 without');
    expect(getValue(r1, 'structure')).toBe('5 sentences / 1 paragraphs');

    const r2 = config.calculate(ex2.inputs);
    expect(getValue(r2, 'wordCount')).toBe('178');
    expect(getValue(r2, 'charCount')).toBe('1,089 with spaces / 912 without');
    expect(getValue(r2, 'structure')).toBe('9 sentences / 1 paragraphs');
  });

  it('should export a valid calculator config', () => {
    expect(config).toBeDefined();
    expect(config.inputs).toBeDefined();
    expect(Array.isArray(config.inputs)).toBe(true);
    expect(typeof config.calculate).toBe('function');
  });

  it('should return empty array for empty/invalid inputs', () => {
    const emptyValues: Record<string, string> = {};
    config.inputs.forEach((inp: any) => { emptyValues[inp.id] = ''; });
    const result = config.calculate(emptyValues);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle valid demo values', () => {
    const demoValues = buildDemoValues(config.inputs);
    const result = config.calculate(demoValues);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});
