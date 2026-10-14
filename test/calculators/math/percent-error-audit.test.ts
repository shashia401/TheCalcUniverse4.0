// Oracle: python fractions.Fraction exact arithmetic.
import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/percent-error/index';
import { computePercentError } from '../../../src/calculators/math/percent-error/percentErrorMath';
import { getResult, getValue } from '../../helpers';

const run = (accepted: string, experimental: string) => config.calculate({ accepted, experimental });

describe('percent error audit', () => {
  it('worked examples: copper density, sensor, house price', () => {
    let r = run('8.96', '8.65'); // 0.31/8.96 = 3.4598214...%
    expect(getValue(r, 'percentError')).toBe('3.4598%');
    expect(getValue(r, 'accuracy')).toBe('96.5402%');
    expect(getValue(r, 'signedError')).toBe('3.4598% underestimate');
    r = run('100', '98.2'); // 1.8 exactly
    expect(getValue(r, 'percentError')).toBe('1.8%');
    expect(getValue(r, 'accuracy')).toBe('98.2%');
    r = run('355000', '342000'); // 13000/355000 = 3.6619718...%
    expect(getValue(r, 'percentError')).toBe('3.662%');
    expect(getValue(r, 'accuracy')).toBe('96.338%');
  });
  it('negative accepted value uses |accepted| as the base (-50 -> -25 is +50%, an overestimate)', () => {
    const r = run('-50', '-25');
    expect(getValue(r, 'percentError')).toBe('50%');
    expect(getValue(r, 'signedError')).toBe('50% overestimate');
  });
  it('accuracy is floored at 0 for errors above 100%', () => {
    const r = run('100', '1000');
    expect(getValue(r, 'percentError')).toBe('900%');
    expect(getValue(r, 'accuracy')).toBe('0%');
  });
  it('tiny differences are exact: 0.001 vs 0.0012 is 20%', () => {
    expect(getValue(run('0.001', '0.0012'), 'percentError')).toBe('20%');
  });
  it('exact match', () => {
    const r = run('42', '42');
    expect(getValue(r, 'percentError')).toBe('0%');
    expect(getValue(r, 'signedError')).toBe('0% (exact match)');
  });
  it('colour follows the displayed value (4.99996% shows 5 -> neutral, not positive)', () => {
    expect(getResult(run('100000', '104999.96'), 'percentError').color).toBe('neutral');
    expect(getResult(run('100', '104'), 'percentError').color).toBe('positive');
    expect(getResult(run('100', '120'), 'percentError').color).toBe('negative');
  });
  it('large magnitudes print in plain notation, no 1e+21', () => {
    expect(getValue(run('1e25', '1.1e25'), 'absoluteError')).toBe('1000000000000000000000000');
  });
  it('zero accepted value explains itself; garbage is incomplete', () => {
    expect(computePercentError('0', '5').kind).toBe('error');
    expect(computePercentError('abc', '5').kind).toBe('incomplete');
    expect(computePercentError('1e500', '5').kind).toBe('error');
  });
});
