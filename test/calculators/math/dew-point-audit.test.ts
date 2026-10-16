import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/dew-point/index';
import { ABSOLUTE_ZERO_C, ABSOLUTE_ZERO_F, cToF, fToC } from '../../../src/utils/temperature';
import { getValue } from '../../helpers';

// Expected dew points computed independently in Python with the same Magnus-Tetens constants (a = 17.27,
// b = 237.7); the Alduchov-Eskridge constants (17.625 / 243.04) agree with these to within 0.1°F.
const run = (temperature: string, humidity: string) => config.calculate({ temperature, humidity });

describe('dew-point audit', () => {
  it('worked example: 85°F at 70% RH -> 74.09°F (text says "approximately 74°F")', () => {
    const r = run('85', '70');
    expect(getValue(r, 'dewPointF')).toBe('74.1°F');
    expect(getValue(r, 'dewPointC')).toBe('23.4°C');
  });

  it('typical and extreme inputs', () => {
    expect(getValue(run('75', '60'), 'dewPointF')).toBe('60.2°F'); // 60.16
    expect(getValue(run('32', '50'), 'dewPointF')).toBe('15.5°F'); // 15.49
    expect(getValue(run('-20', '60'), 'dewPointF')).toBe('-29.5°F'); // -29.52
    expect(getValue(run('100', '30'), 'dewPointF')).toBe('62.9°F'); // 62.93
  });

  it('at 100% RH the dew point equals the air temperature', () => {
    expect(getValue(run('70', '100'), 'dewPointF')).toBe('70°F');
    expect(getValue(run('-10', '100'), 'dewPointF')).toBe('-10°F');
  });

  it('0% RH has no dew point: an explanation, not the made-up −88 °C the old code printed', () => {
    const r = run('68', '0');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
    expect(r[0].value).toContain('no dew point');
    expect(r.some((x) => x.id === 'dewPointC')).toBe(false);
  });

  it('a tiny but positive humidity is still computed (and is very cold)', () => {
    const r = run('68', '0.1');
    expect(getValue(r, 'dewPointC')).not.toMatch(/NaN|Infinity/);
    expect(parseFloat(getValue(r, 'dewPointC'))).toBeLessThan(-50);
  });

  it('rejects physically impossible or malformed input', () => {
    expect(run('-500', '50')).toEqual([]); // below absolute zero (−459.67°F)
    expect(run('75abc', '50')).toEqual([]);
    expect(run('75', '101')).toEqual([]);
    expect(run('75', '-1')).toEqual([]);
    expect(run('', '50')).toEqual([]);
  });

  it('comfort bands (dew point = air temperature at 100% RH keeps the boundaries unambiguous)', () => {
    const level = (t: string) => getValue(run(t, '100'), 'comfortLevel');
    expect(level('50')).toBe('Dry and comfortable');
    expect(level('57')).toBe('Comfortable');
    expect(level('62')).toBe('Slightly humid');
    expect(level('67')).toBe('Becoming sticky (humid)');
    expect(level('72')).toBe('Uncomfortable (oppressive)');
    expect(level('77')).toBe('Very uncomfortable (miserable)');
    expect(level('85')).toBe('Extremely oppressive (dangerous)');
  });

  it('the declared temperature range is realistic and humidity is bounded 0-100', () => {
    const t = config.inputs.find((i) => i.id === 'temperature')!;
    const h = config.inputs.find((i) => i.id === 'humidity')!;
    expect([t.min, t.max]).toEqual([-80, 140]);
    expect([h.min, h.max]).toEqual([0, 100]);
  });

  it('educational numbers: dew points of 45-55°F at 70°F are 41-59% RH, not "30-50%"', () => {
    const text = JSON.stringify(config.educational);
    expect(text).not.toContain('30-50% relative humidity');
    // Independent: RH = es(Td)/es(T) with the Alduchov-Eskridge saturation formula -> 40.7% and 59.0%.
    expect(text).toContain('40-60% relative humidity at 70°F');
  });
});

describe('shared temperature helpers', () => {
  it('converts both ways and round-trips', () => {
    expect(cToF(100)).toBe(212);
    expect(cToF(0)).toBe(32);
    expect(fToC(212)).toBe(100);
    expect(fToC(-40)).toBe(-40);
    expect(cToF(-40)).toBe(-40);
    for (const c of [-273.15, -40, 0, 36.6, 1000]) expect(fToC(cToF(c))).toBeCloseTo(c, 9);
  });

  it('absolute zero is −273.15 °C = −459.67 °F', () => {
    expect(ABSOLUTE_ZERO_C).toBe(-273.15);
    expect(cToF(ABSOLUTE_ZERO_C)).toBeCloseTo(ABSOLUTE_ZERO_F, 9);
  });
});
