import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/mtbf';
import { panelReliability } from '../../../src/calculators/engineering/mtbf/mtbfMath';
import { getValue, parseNumber, near } from '../../helpers';

const run = (v: Record<string, string>) =>
  config.calculate({ mode: 'mtbf', operatingHours: '', numberOfFailures: '', mtbf: '', missionTime: '', ...v });

// MTBF = T/r ; R(t) = exp(-t/MTBF) ; expected failures = t/MTBF. Hand-derived.
describe('mtbf audit', () => {
  it('UPS: 50000 h / 4 = 12,500 h; 1-year reliability e^(-8760/12500) = 49.62%', () => {
    const r = run({ operatingHours: '50000', numberOfFailures: '4' });
    expect(getValue(r, 'mtbf')).toBe('12,500 hours');
    expect(getValue(r, 'reliability1yr')).toBe('49.62%');
  });
  it('quick-reference table: 1-year and 5-year reliabilities', () => {
    const rel = (m: string, t: string) => parseNumber(getValue(run({ mode: 'reliability', mtbf: m, missionTime: t }), 'reliability'));
    near(rel('50000', '8760'), 83.9, 0.05);
    near(rel('100000', '8760'), 91.6, 0.05);
    near(rel('100000', '43800'), 64.5, 0.05);
    near(rel('500000', '8760'), 98.3, 0.05);
    near(rel('1000000', '8760'), 99.1, 0.05);
    near(rel('50000', '43800'), 41.6, 0.05);
    near(rel('10000', '10000'), 36.79, 0.01); // t = MTBF -> 1/e
  });
  it('data-centre example: 240000/8 = 30,000 h; one server 97.6% in a month; fleet P(>=1 failure) = 70.4%', () => {
    expect(getValue(run({ operatingHours: '240000', numberOfFailures: '8' }), 'mtbf')).toBe('30,000 hours');
    near(parseNumber(getValue(run({ mode: 'reliability', mtbf: '30000', missionTime: '730' }), 'reliability')), 97.60, 0.01);
    expect(1 - Math.exp(-(50 * 730) / 30000)).toBeCloseTo(0.7038, 3);
  });
  it('avionics: R(14 h) at 120k = 99.98833%, at 80k = 99.98250%', () => {
    expect(getValue(run({ mode: 'reliability', mtbf: '120000', missionTime: '14' }), 'reliability')).toBe('99.9883%');
    expect(getValue(run({ mode: 'reliability', mtbf: '80000', missionTime: '14' }), 'reliability')).toBe('99.9825%');
    expect(100000 / 80000 - 100000 / 120000).toBeCloseTo(0.41667, 4);
  });
  it('pumps: 175,200 fleet hours at 40,000 MTBF = 4.38; lead time 0.336; Poisson P(X<=1) = 0.9547', () => {
    expect(getValue(run({ mode: 'failures', mtbf: '40000', missionTime: '175200' }), 'expectedFailures')).toBe('4.38');
    const lam = (20 * 672) / 40000;
    expect(lam).toBeCloseTo(0.336, 3);
    expect(Math.exp(-lam) * (1 + lam)).toBeCloseTo(0.9547, 3);
  });
  it('mission time 0 gives 100% reliability, not an error', () => {
    expect(getValue(run({ mode: 'reliability', mtbf: '1000', missionTime: '0' }), 'reliability')).toBe('100.0000%');
  });
  it('panel reliability follows the mode (and 0% reliability is not hidden)', () => {
    expect(panelReliability({ mode: 'mtbf', operatingHours: '50000', numberOfFailures: '4' })).toBeCloseTo(49.62, 2);
    expect(panelReliability({ mode: 'reliability', mtbf: '1', missionTime: '1000' })).toBe(0 + Math.exp(-1000) * 100);
    expect(panelReliability({ mode: 'failures', mtbf: '1', missionTime: '1' })).toBeNull();
  });
  it('invalid input returns []', () => {
    expect(run({ operatingHours: '1000', numberOfFailures: '0' })).toEqual([]);
    expect(run({ mode: 'reliability', mtbf: '0', missionTime: '10' })).toEqual([]);
    expect(run({ mode: 'reliability', mtbf: '100', missionTime: '-1' })).toEqual([]);
  });
});
