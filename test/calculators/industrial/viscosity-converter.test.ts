import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/viscosity-converter/index';
import { getValue, getResult } from '../../helpers';

describe('Viscosity Converter', () => {
  it('converts Pa·s to cP (same type)', () => {
    const r = config.calculate({
      value: '1',
      from: 'pas',
      to: 'cp',
    });
    const result = getResult(r, 'result');
    expect(result.value).toContain('1,000');
  });

  it('converts cP to Pa·s', () => {
    const r = config.calculate({
      value: '1000',
      from: 'cp',
      to: 'pas',
    });
    const result = getResult(r, 'result');
    expect(result.value).toContain('1');
  });

  it('returns empty for empty value', () => {
    const r = config.calculate({
      value: '',
      from: 'pas',
      to: 'cp',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN value', () => {
    const r = config.calculate({
      value: 'abc',
      from: 'pas',
      to: 'cp',
    });
    expect(r).toEqual([]);
  });

  it('converts St to cSt', () => {
    const r = config.calculate({
      value: '1',
      from: 'st',
      to: 'cst',
    });
    const result = getResult(r, 'result');
    expect(result.value).toContain('100');
  });

  it('converts dynamic to kinematic with density', () => {
    const r = config.calculate({
      value: '1000',
      from: 'cp',
      to: 'cst',
      density: '1000',
    });
    const result = getResult(r, 'result');
    // 1000 cP = 1 Pa·s, with density 1000 kg/m³, 1 Pa·s / 1000 = 0.001 m²/s = 1000 cSt
    expect(result.value).toContain('1000');
  });

  it('returns empty for cross-type conversion without density', () => {
    const r = config.calculate({
      value: '1000',
      from: 'cp',
      to: 'cst',
    });
    expect(r).toEqual([]);
  });

  it('has extra panel', () => {
    expect(typeof config.extraPanel).toBe('function');
  });
});
