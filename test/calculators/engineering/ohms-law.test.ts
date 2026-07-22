import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/ohms-law/index';
import { getValue, parseNumber, near } from '../../helpers';

describe("Ohm's Law Calculator", () => {
  it('solves for voltage given current and resistance', () => {
    const results = config.calculate({
      solveFor: 'voltage',
      voltage: '',
      current: '2',
      resistance: '60',
    });
    const v = parseNumber(getValue(results, 'voltage'));
    near(v, 120); // V = 2 * 60 = 120
    const p = parseNumber(getValue(results, 'power'));
    near(p, 240); // P = 120 * 2 = 240
    expect(getValue(results, 'formula')).toContain('V = I × R');
  });

  it('solves for current given voltage and resistance', () => {
    const results = config.calculate({
      solveFor: 'current',
      voltage: '120',
      current: '',
      resistance: '60',
    });
    const i = parseNumber(getValue(results, 'current'));
    near(i, 2); // I = 120 / 60 = 2
  });

  it('solves for resistance given voltage and current', () => {
    const results = config.calculate({
      solveFor: 'resistance',
      voltage: '120',
      current: '2',
      resistance: '',
    });
    const r = parseNumber(getValue(results, 'resistance'));
    near(r, 60); // R = 120 / 2 = 60
  });

  it('solves for power given voltage and current', () => {
    const results = config.calculate({
      solveFor: 'power',
      voltage: '120',
      current: '2',
      resistance: '',
    });
    const p = parseNumber(getValue(results, 'power'));
    near(p, 240); // P = 120 * 2 = 240
  });

  it('returns empty when solving current with zero resistance', () => {
    const results = config.calculate({
      solveFor: 'current',
      voltage: '120',
      current: '',
      resistance: '0',
    });
    expect(results).toEqual([]);
  });

  it('returns empty when solving resistance with zero current', () => {
    const results = config.calculate({
      solveFor: 'resistance',
      voltage: '120',
      current: '0',
      resistance: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for missing inputs', () => {
    const results = config.calculate({
      solveFor: 'voltage',
      voltage: '',
      current: '',
      resistance: '',
    });
    expect(results).toEqual([]);
  });
});
