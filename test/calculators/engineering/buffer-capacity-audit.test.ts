import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/buffer-capacity';
import { getResult, getValue, parseNumber } from '../../helpers';

const run = (pKa: string, pH: string, concentration: string) => config.calculate({ pKa, pH, concentration });
const beta = (pKa: string, pH: string, c: string) => parseNumber(getValue(run(pKa, pH, c), 'bufferCapacity'));

// Van Slyke: beta = ln10 (H + OH + C Ka H /(Ka+H)^2); at pH=pKa the buffer term is C ln10 / 4 = 0.57565 C. Hand-derived.
describe('buffer-capacity audit', () => {
  it('pH = pKa: beta = 0.0576 for C = 0.1 (ln10/4 x C)', () => {
    expect(beta('4.76', '4.76', '0.1')).toBeCloseTo((Math.LN10 / 4) * 0.1, 4);
  });
  it('pKa +/- 1 gives 33% and +/- 2 about 4% of the maximum (100/(121) x 4 ... derived: 0.1/1.21 / 0.25)', () => {
    const max = (Math.LN10 / 4) * 0.1;
    expect(beta('4.76', '5.76', '0.1') / max).toBeCloseTo(0.4 / 1.21, 1); // 0.3306 (4-sig-fig display)
    // below pKa the free H+ term (ln10 x 1.74e-4 = 4e-4) adds ~0.4 mol/L·pH-thousandths, so allow 2%
    expect(beta('4.76', '3.76', '0.1') / max).toBeCloseTo(0.4 / 1.21, 1);
    expect(beta('4.76', '6.76', '0.1') / max).toBeCloseTo(0.04 / 1.0201, 2); // 0.0392
  });
  it('beta scales linearly with concentration', () => {
    expect(beta('7.2', '7.2', '0.2') / beta('7.2', '7.2', '0.1')).toBeCloseTo(2, 2);
  });
  it('acid/base split at pH = pKa + 1 is 9.1% / 90.9%', () => {
    expect(getValue(run('4.76', '5.76', '0.1'), 'acidBaseRatio')).toBe('9.1% acid (HA) / 90.9% base (A⁻)');
  });
  it('strong-acid region: at pH 1 the H+ term (ln10 x 0.1 = 0.230) dominates, with a warning', () => {
    const r = run('4.76', '1', '0.1');
    expect(parseNumber(getValue(r, 'bufferCapacity'))).toBeCloseTo(Math.LN10 * 0.1, 3);
    expect(getResult(r, 'bufferCapacity').warning).toBeTruthy();
    expect(getResult(run('4.76', '4.76', '0.1'), 'bufferCapacity').warning).toBeUndefined();
  });
  it('effectiveness bands agree with their colour at the boundaries', () => {
    const e = (pH: string) => getResult(run('5', pH, '0.1'), 'effectiveness');
    expect(e('5.5').value).toMatch(/^Excellent/);
    expect(e('6').value).toMatch(/^Good/);
    expect(e('6').color).toBe('positive');
    expect(e('6.01').value).toMatch(/^Weak/);
    expect(e('6.01').color).toBe('negative');
    expect(e('7').value).toMatch(/^Poor/);
  });
  it('invalid input returns []', () => {
    expect(run('4.76', '4.76', '0')).toEqual([]);
    expect(run('', '4.76', '0.1')).toEqual([]);
  });
});
