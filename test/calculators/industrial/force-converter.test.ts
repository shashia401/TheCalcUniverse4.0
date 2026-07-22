import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/force-converter/index';

describe('Force Converter', () => {
  it('converts newtons to pound-force', () => {
    const results = config.calculate({ value: '4.44822', from: 'n', to: 'lbf' });
    expect(results[0].value).toContain('1');
    expect(results[0].value).toContain('lbf');
  });

  it('converts pound-force to newtons', () => {
    const results = config.calculate({ value: '1', from: 'lbf', to: 'n' });
    expect(results[0].value).toContain('4.448');
  });

  it('converts kN to N', () => {
    const results = config.calculate({ value: '1', from: 'kn', to: 'n' });
    expect(results[0].value).toContain('1 kN = 1,000 N');
  });

  it('converts kgf to N', () => {
    const results = config.calculate({ value: '1', from: 'kgf', to: 'n' });
    expect(results[0].value).toContain('9.806');
  });

  it('converts kip to N', () => {
    const results = config.calculate({ value: '1', from: 'kip', to: 'n' });
    expect(results[0].value).toContain('4,448');
  });

  it('returns empty array for empty value', () => {
    const results = config.calculate({ value: '', from: 'n', to: 'lbf' });
    expect(results).toEqual([]);
  });

  it('returns empty array for NaN value', () => {
    const results = config.calculate({ value: 'abc', from: 'n', to: 'lbf' });
    expect(results).toEqual([]);
  });

  it('converts dyne to N', () => {
    const results = config.calculate({ value: '100000', from: 'dyn', to: 'n' });
    expect(results[0].value).toContain('1');
  });

  it('shows formula output as second result', () => {
    const results = config.calculate({ value: '10', from: 'n', to: 'kn' });
    expect(results[1].id).toBe('formula');
    expect(results[1].value).toContain('0.01');
  });
});
