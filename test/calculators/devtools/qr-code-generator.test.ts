import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/devtools/qr-code-generator/index';

const get = (r: { id: string; value: string }[], id: string) => r.find((x) => x.id === id)?.value;

describe('QR Code Generator (client-side encoder)', () => {
  it('reports version, module count and bytes used (no third-party URL)', () => {
    const r = config.calculate({ content: 'https://example.com/', size: '200', errorCorrection: 'M' });
    expect(get(r, 'info')).toBe('QR code generated for: https://example.com/');
    // 20 bytes at level M -> version 2 (capacity 26), 25 x 25 modules
    expect(get(r, 'version')).toBe('Version 2 (25 × 25 modules)');
    expect(get(r, 'capacity')).toBe('20 of 26 bytes at level M');
    expect(JSON.stringify(r)).not.toMatch(/qrserver|https:\/\/api\./);
  });
  it('error-correction level changes the version it needs (L holds more than H)', () => {
    const text = 'x'.repeat(30);
    expect(get(config.calculate({ content: text, errorCorrection: 'L' }), 'version')).toMatch(/^Version 2 /); // L capacity v2 = 32
    expect(get(config.calculate({ content: text, errorCorrection: 'H' }), 'version')).toMatch(/^Version 4 /); // H capacity v3 = 24, v4 = 34
  });
  it('trims, ignores unknown levels (falls back to M)', () => {
    expect(get(config.calculate({ content: '  hi  ', errorCorrection: 'Z' }), 'capacity')).toBe('2 of 14 bytes at level M');
  });
  it('blank content returns []', () => {
    expect(config.calculate({ content: '' })).toEqual([]);
    expect(config.calculate({ content: '   ' })).toEqual([]);
  });
  it('over-long content gives an explanatory error, not a broken image', () => {
    const r = config.calculate({ content: 'a'.repeat(3000), errorCorrection: 'L' });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
    expect(r[0].value).toMatch(/maximum 2953 bytes/);
  });
  it('counts UTF-8 bytes, not characters', () => {
    expect(get(config.calculate({ content: '日本語', errorCorrection: 'L' }), 'capacity')).toBe('9 of 17 bytes at level L');
  });
  it('worked examples use real input ids and produce a symbol', () => {
    for (const w of config.educational.workedExamples!) {
      expect(Object.keys(w.inputs).sort()).toEqual(['content', 'errorCorrection', 'size']);
      expect(get(config.calculate(w.inputs), 'version')).toMatch(/^Version \d+/);
    }
    expect(get(config.calculate(config.educational.workedExamples![1].inputs), 'version')).toMatch(/^Version 5 /);
  });
  it('panel is built from the inputs', () => {
    const vals = { content: 'hello', size: '200', errorCorrection: 'Q' };
    expect(config.extraPanel!(vals, config.calculate(vals))).not.toBeNull();
  });
});
