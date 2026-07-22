import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/torque-converter/index';
import { getValue, parseNumber } from '../../helpers';

describe('torque-converter', () => {
  it('converts N·m to lbf·ft', () => {
    const r = config.calculate({
      value: '100',
      from: 'nm',
      to: 'lbfft',
    });
    expect(r).toHaveLength(2);
    // 100 N·m ÷ 1.35582 = 73.76 lbf·ft
    const result = getValue(r, 'result');
    expect(result).toContain('lbf·ft');
    expect(result).toContain('73.756');
  });

  it('converts lbf·ft to N·m', () => {
    const r = config.calculate({
      value: '100',
      from: 'lbfft',
      to: 'nm',
    });
    expect(r).toHaveLength(2);
    const result = getValue(r, 'result');
    expect(result).toContain('N·m');
    expect(result).toContain('135');
  });

  it('converts kgf·cm to N·m', () => {
    const r = config.calculate({
      value: '10',
      from: 'kgfcm',
      to: 'nm',
    });
    expect(r).toHaveLength(2);
    const result = getValue(r, 'result');
    expect(result).toContain('0');
  });

  it('converts kN·m to N·m', () => {
    const r = config.calculate({
      value: '1',
      from: 'knm',
      to: 'nm',
    });
    expect(r).toHaveLength(2);
    const result = getValue(r, 'result');
    expect(result).toContain('1,000');
  });

  it('converts lbf·in to N·m', () => {
    const r = config.calculate({
      value: '12',
      from: 'lbfin',
      to: 'nm',
    });
    expect(r).toHaveLength(2);
    const result = getValue(r, 'result');
    expect(result).toContain('1.355');
  });

  it('converts kip·ft to N·m', () => {
    const r = config.calculate({
      value: '1',
      from: 'kipft',
      to: 'nm',
    });
    expect(r).toHaveLength(2);
    const result = getValue(r, 'result');
    expect(result).toContain('1,355');
  });

  it('converts ozf·in to N·m (small torque)', () => {
    const r = config.calculate({
      value: '16',
      from: 'ozfin',
      to: 'nm',
    });
    expect(r).toHaveLength(2);
  });

  it('returns empty for empty value', () => {
    const r = config.calculate({});
    expect(r).toHaveLength(0);
  });

  it('returns empty for empty value string', () => {
    const r = config.calculate({ value: '', from: 'lbfft', to: 'nm' });
    expect(r).toHaveLength(0);
  });

  it('returns empty for NaN value', () => {
    const r = config.calculate({ value: 'abc', from: 'lbfft', to: 'nm' });
    expect(r).toHaveLength(0);
  });

  it('converts to same unit (identity)', () => {
    const r = config.calculate({
      value: '50',
      from: 'nm',
      to: 'nm',
    });
    expect(r).toHaveLength(2);
    const result = getValue(r, 'result');
    expect(result).toContain('50');
  });

  it('converts negative torque values', () => {
    const r = config.calculate({
      value: '-10',
      from: 'nm',
      to: 'lbfft',
    });
    expect(r).toHaveLength(2);
  });

  it('handles large torque values', () => {
    const r = config.calculate({
      value: '1000000',
      from: 'nm',
      to: 'knm',
    });
    expect(r).toHaveLength(2);
    const result = getValue(r, 'result');
    expect(result).toContain('1,000');
  });

  it('converts dyn·cm to N·m', () => {
    const r = config.calculate({
      value: '10000000',
      from: 'dyncm',
      to: 'nm',
    });
    expect(r).toHaveLength(2);
  });
});
