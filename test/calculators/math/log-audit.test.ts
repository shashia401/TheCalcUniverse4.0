// Oracle: mpmath at 40 digits.
import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/log/index';
import { computeLog } from '../../../src/calculators/math/log/logMath';
import { getValue, getResult } from '../../helpers';

describe('log audit', () => {
  it('log2(1,000,000) = 19.93156857 (worked example)', () => {
    expect(getValue(config.calculate({ base: '2', value: '1000000' }), 'result')).toBe('19.93156857');
  });
  it('log10(3.16e-7) = -6.500312917 -> pH 6.5 (worked example)', () => {
    expect(getValue(config.calculate({ base: '10', value: '0.000000316' }), 'result')).toBe('-6.500312917');
  });
  it('log10(32) = 1.505149978, 20x = 30.1 dB', () => {
    expect(getValue(config.calculate({ base: '10', value: '32' }), 'result')).toBe('1.505149978');
  });
  it('exact exponent is only claimed when b^k === x exactly (2^60+1 is not a power of 2)', () => {
    const near = config.calculate({ base: '2', value: '1152921504606846977' });
    expect(near.find((r) => r.id === 'exponentForm')).toBeUndefined();
    expect(getValue(config.calculate({ base: '2', value: '1152921504606846976' }), 'exponentForm')).toBe('2^60 = 1152921504606846976');
    expect(getValue(config.calculate({ base: '10', value: '0.001' }), 'exponentForm')).toBe('10^-3 = 0.001');
  });
  it('tiny and huge arguments keep their value (mpmath: log10(1e-30) = -30)', () => {
    expect(getValue(config.calculate({ base: '10', value: '1e-30' }), 'result')).toBe('-30');
    expect(getValue(config.calculate({ base: '1.0000001', value: '7' }), 'result')).toBe('19459102.46');
  });
  it('domain errors are explained', () => {
    for (const [base, value] of [['1', '5'], ['0', '5'], ['-2', '8'], ['2', '0'], ['2', '-1']]) {
      expect(getResult(config.calculate({ base, value }), 'error').color).toBe('negative');
    }
    expect(computeLog('2', '').kind).toBe('incomplete');
    expect(computeLog('1e5000', '2').kind).toBe('error');
  });
  it('labels common/natural/binary logs', () => {
    const r = config.calculate({ base: '3', value: '81' });
    expect(getResult(r, 'log10').label).toMatch(/common/);
    expect(getResult(r, 'naturalLog').label).toMatch(/natural/);
    expect(getValue(r, 'result')).toBe('4');
  });
});
