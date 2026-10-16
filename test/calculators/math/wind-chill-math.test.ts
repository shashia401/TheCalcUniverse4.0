import { describe, it, expect } from 'vitest';
import { FROSTBITE_ZONES, frostbiteZone, isFrostbiteDanger, kmhToMph, windChillF } from '../../../src/calculators/math/wind-chill/windChillMath';

// Environment Canada bands, matched on the wind chill rounded to a whole °C (JavaScript rounds .5 toward +infinity).
describe('wind chill math', () => {
  it('band edges: the last value of each band and the first of the next', () => {
    const key = (c: number) => frostbiteZone(c).key;
    expect(key(0)).toBe('low');
    expect(key(-9.4)).toBe('low'); // rounds to -9
    expect(key(-9.6)).toBe('moderate'); // rounds to -10
    expect(key(-27.4)).toBe('moderate'); // -27
    expect(key(-27.6)).toBe('high'); // -28
    expect(key(-39.4)).toBe('high'); // -39
    expect(key(-39.6)).toBe('veryHigh'); // -40
    expect(key(-47.4)).toBe('veryHigh'); // -47
    expect(key(-47.6)).toBe('severe'); // -48
    expect(key(-54.4)).toBe('severe'); // -54
    expect(key(-54.6)).toBe('extreme'); // -55
    expect(key(-80)).toBe('extreme');
  });

  it('zones tile the whole range with no gaps: every whole °C from -90 to +20 matches exactly one band', () => {
    for (let c = -90; c <= 20; c++) {
      const hits = FROSTBITE_ZONES.filter((z) => c >= z.minC && c <= z.maxC);
      expect(hits, `${c} °C`).toHaveLength(1);
      expect(frostbiteZone(c).key).toBe(hits[0].key);
    }
  });

  it('frostbite danger starts at the High band (-28 °C, about -18°F)', () => {
    expect(isFrostbiteDanger(-27.4)).toBe(false);
    expect(isFrostbiteDanger(-27.6)).toBe(true);
    expect(isFrostbiteDanger((-19 - 32) * (5 / 9))).toBe(true); // the NWS -19°F example
  });

  it('NWS formula: 20°F at 25 mph = 2.646°F; 0°F at 15 mph = -19.398°F (Python)', () => {
    expect(windChillF(20, 25)).toBeCloseTo(2.646116, 5);
    expect(windChillF(0, 15)).toBeCloseTo(-19.397954, 5);
  });

  it('outside its range the wind chill is the air temperature (>50°F, or wind of 3 mph or less)', () => {
    expect(windChillF(51, 20)).toBe(51);
    expect(windChillF(30, 3)).toBe(30);
    expect(windChillF(30, 0)).toBe(30);
    expect(windChillF(50, 3.01)).toBeLessThan(50);
  });

  it('1 mph = 1.609344 km/h exactly (the old code used 1.60934)', () => {
    expect(kmhToMph(1.609344)).toBeCloseTo(1, 12);
    expect(kmhToMph(24.14016)).toBeCloseTo(15, 9);
  });
});
