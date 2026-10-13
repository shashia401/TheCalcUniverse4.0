import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/conversion/index';
import { getValue } from '../../helpers';

// Reference: NIST SP 811 exact definitions, evaluated with Python Fractions
// (1 in = 0.0254 m, 1 lb = 0.45359237 kg, 1 gal = 231 in³, 1 acre = 43 560 ft²).
const conv = (category: string, fromUnit: string, toUnit: string, fromValue = '1') =>
  config.calculate({ category, fromValue, [`fromUnit_${category}`]: fromUnit, [`toUnit_${category}`]: toUnit });
const res = (r: ReturnType<typeof conv>) => getValue(r, 'result');

describe('conversion: exact factors replace hand-rounded ones (audit)', () => {
  it('length: 1 mile = 1609.344 m (old table: 1609.34), 1 inch = 2.54 cm', () => {
    expect(res(conv('length', 'mile', 'meter'))).toBe('1609.344 m');
    expect(res(conv('length', 'mile', 'kilometer'))).toBe('1.609344 km');
    expect(res(conv('length', 'inch', 'centimeter'))).toBe('2.54 cm');
    expect(res(conv('length', 'yard', 'foot'))).toBe('3 ft');
    expect(res(conv('length', 'mile', 'foot'))).toBe('5280 ft');
  });
  it('weight: 1 oz = 28.349523 g (old: 28.3495), 1 lb = 453.59237 g, 1 US ton = 2000 lb', () => {
    expect(res(conv('weight', 'ounce', 'gram'))).toBe('28.349523 g');
    expect(res(conv('weight', 'pound', 'kilogram'))).toBe('0.453592 kg');
    expect(res(conv('weight', 'ton', 'pound'))).toBe('2000 lb');
    expect(res(conv('weight', 'pound', 'ounce'))).toBe('16 oz');
    expect(res(conv('weight', 'kilogram', 'pound'))).toBe('2.204623 lb');
  });
  it('volume: gallon = 3.785412 L, 128 fl oz per gallon, 16 cups per gallon, cubic foot = 28.316847 L', () => {
    expect(res(conv('volume', 'gallon-us', 'liter'))).toBe('3.785412 L');
    expect(res(conv('volume', 'gallon-us', 'fluid-ounce'))).toBe('128 fl oz');
    expect(res(conv('volume', 'gallon-us', 'cup'))).toBe('16 cup');
    expect(res(conv('volume', 'gallon-us', 'teaspoon'))).toBe('768 tsp');
    expect(res(conv('volume', 'cubic-foot', 'liter'))).toBe('28.316847 L');
  });
  it('area: acre = 43 560 ft² = 4046.856422 m² (old: 4046.86); ft² = 0.092903 m²', () => {
    expect(res(conv('area', 'acre', 'sq-ft'))).toBe('43560 ft²');
    expect(res(conv('area', 'acre', 'sq-m'))).toBe('4046.856422 m²');
    expect(res(conv('area', 'sq-ft', 'sq-in'))).toBe('144 in²');
    expect(res(conv('area', 'hectare', 'acre'))).toBe('2.471054 ac');
  });
  it('speed: 1 knot = 1.852 km/h, 1 mph = 1.609344 km/h, 3.6 km/h per m/s', () => {
    expect(res(conv('speed', 'knot', 'kmph'))).toBe('1.852 km/h');
    expect(res(conv('speed', 'mph', 'kmph'))).toBe('1.609344 km/h');
    expect(res(conv('speed', 'mps', 'kmph'))).toBe('3.6 km/h');
    expect(res(conv('speed', 'fps', 'mph', '88'))).toBe('60 mph');
  });
  it('round trips return the starting value', () => {
    for (const [cat, a, b] of [['length', 'mile', 'meter'], ['weight', 'ton', 'gram'], ['volume', 'gallon-us', 'milliliter'], ['area', 'acre', 'sq-m']] as const) {
      const there = parseFloat(res(conv(cat, a, b, '123.456')));
      const back = conv(cat, b, a, String(there));
      expect(parseFloat(res(back))).toBeCloseTo(123.456, 3);
    }
  });
  it('tiny results keep significant digits instead of printing 0', () => {
    expect(res(conv('weight', 'milligram', 'metric-ton'))).toBe('1e-9 t');
    expect(res(conv('data', 'byte', 'petabyte'))).toBe('1e-15 PB');
  });
  it('temperature: absolute zero, boiling point and the -40 crossover', () => {
    expect(res(conv('temperature', 'kelvin', 'celsius', '0'))).toBe('-273.15 °C');
    expect(res(conv('temperature', 'celsius', 'fahrenheit', '100'))).toBe('212 °F');
    expect(res(conv('temperature', 'fahrenheit', 'celsius', '-40'))).toBe('-40 °C');
    expect(res(conv('temperature', 'kelvin', 'fahrenheit', '0'))).toBe('-459.67 °F');
  });
  it('currency results carry a "not live" note; strict parsing of the value', () => {
    expect(getValue(conv('currency', 'eur', 'usd'), 'rateNote')).toMatch(/not live/);
    expect(conv('length', 'mile', 'meter', '5abc')).toEqual([]);
    expect(conv('length', 'mile', 'meter', '')).toEqual([]);
  });
  it('the short ton is labelled as such', () => {
    const opts = config.inputs.find((i) => i.id === 'fromUnit_weight')!.options!;
    expect(opts.find((o) => o.value === 'ton')!.label).toMatch(/short/i);
  });
});
