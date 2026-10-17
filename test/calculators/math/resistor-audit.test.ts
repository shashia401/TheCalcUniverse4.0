import { describe, it, expect } from 'vitest';
import resistor from '../../../src/calculators/math/resistor';

// Colour code per IEC 60062. Expected values worked out by hand.
type R = { id: string; value: string }[];
const val = (r: R, id: string) => r.find((x) => x.id === id)?.value;
const run = (o: Record<string, string>) => resistor.calculate(o) as R;
const bands = (r: R) => JSON.parse(val(r, '_colorBands') ?? '[]') as string[];

const forward4 = (b1: string, b2: string, multiplier: string, tolerance: string) =>
  run({ mode: 'forward', bands: '4', band1: b1, band2: b2, multiplier, tolerance });

describe('resistor audit: forward (colours -> ohms)', () => {
  it('exact decimal arithmetic: Orange-Orange-Gold is 3.3 ohm (33 x 0.1 was 3.3000000000000003)', () => {
    const r = forward4('Orange', 'Orange', 'Gold', 'Gold (±5%)');
    expect(val(r, 'resistance')).toBe('3.30 Ω');
    expect(val(r, 'ohmicValue')).toBe('3.3 Ω');
  });

  it('Yellow-Violet-Red-Gold = 4,700 ohm +/-5%', () => {
    const r = forward4('Yellow', 'Violet', 'Red', 'Gold (±5%)');
    expect(val(r, 'resistance')).toBe('4.70 kΩ');
    expect(val(r, 'ohmicValue')).toBe('4700 Ω');
    expect(val(r, 'tolerance')).toBe('±5%');
  });

  it('precision tolerances exist: Green = +/-0.5%, so 10 k becomes 9.95-10.05 k', () => {
    const r = run({
      mode: 'forward', bands: '5', band1: 'Brown', band2: 'Black', band3: 'Black', multiplier: 'Red', tolerance: 'Green (±0.5%)',
    });
    expect(val(r, 'resistance')).toBe('10.00 kΩ');
    expect(val(r, 'tolerance')).toBe('±0.5%');
    expect(val(r, 'minResistance')).toBe('9.95 kΩ');
    expect(val(r, 'maxResistance')).toBe('10.05 kΩ');
    for (const [colour, pct] of [['Blue (±0.25%)', '±0.25%'], ['Violet (±0.1%)', '±0.1%'], ['Gray (±0.05%)', '±0.05%']] as const) {
      const p = run({ mode: 'forward', bands: '5', band1: 'Brown', band2: 'Black', band3: 'Black', multiplier: 'Red', tolerance: colour });
      expect(val(p, 'tolerance')).toBe(pct);
    }
  });

  it('Gray and White multipliers (x100M, x1G) and the Black (250 ppm) temperature coefficient are available', () => {
    expect(val(forward4('Brown', 'Black', 'Gray', 'Gold (±5%)'), 'ohmicValue')).toBe('1000000000 Ω');
    const six = run({
      mode: 'forward', bands: '6', band1: 'Brown', band2: 'Black', band3: 'Black', multiplier: 'Brown', tolerance: 'Brown (±1%)', tempCo: 'Black (250)',
    });
    expect(val(six, 'tempCoef')).toBe('250 ppm/K');
  });

  it('missing bands give nothing', () => {
    expect(run({ mode: 'forward', bands: '4', band1: 'Brown', band2: 'Black', tolerance: 'Gold (±5%)' })).toEqual([]);
  });
});

describe('resistor audit: reverse (ohms -> colours)', () => {
  it('4-band now has all four bands, tolerance last: 4,700 ohm = Yellow-Violet-Red-Silver (E12 is +/-10%)', () => {
    const r = run({ mode: 'reverse', targetOhms: '4700', reverseBands: '4' });
    expect(bands(r)).toEqual(['Yellow', 'Violet', 'Red', 'Silver']);
    expect(val(r, 'tolerance')).toBe('±10%');
  });

  it('5-band: 6,800 ohm = Blue-Gray-Black-Brown-Gold (E24 is +/-5%), 10 k = Brown-Black-Black-Red-Gold', () => {
    expect(bands(run({ mode: 'reverse', targetOhms: '6800', reverseBands: '5' }))).toEqual(['Blue', 'Gray', 'Black', 'Brown', 'Gold']);
    expect(bands(run({ mode: 'reverse', targetOhms: '10000', reverseBands: '5' }))).toEqual(['Brown', 'Black', 'Black', 'Red', 'Gold']);
  });

  it('sub-ohm and very large values use Silver / Gold / Blue multipliers', () => {
    expect(bands(run({ mode: 'reverse', targetOhms: '0.1', reverseBands: '4' }))).toEqual(['Brown', 'Black', 'Silver', 'Silver']);
    expect(bands(run({ mode: 'reverse', targetOhms: '1', reverseBands: '4' }))).toEqual(['Brown', 'Black', 'Gold', 'Silver']);
    expect(bands(run({ mode: 'reverse', targetOhms: '1000000', reverseBands: '4' }))).toEqual(['Brown', 'Black', 'Green', 'Silver']);
  });

  it('nearest standard value is chosen by ratio: 2,000 ohm is nearer 2.2 k than 1.8 k', () => {
    const r = run({ mode: 'reverse', targetOhms: '2000', reverseBands: '4' });
    expect(val(r, 'closestStandard')).toBe('E12 series: 22 (2.20 kΩ)');
    expect(val(r, 'standardOffset')).toBe('2.20 kΩ is 10.0% above your value');
  });

  it('a value that is already standard reports no offset', () => {
    expect(val(run({ mode: 'reverse', targetOhms: '4700', reverseBands: '4' }), 'standardOffset')).toBeUndefined();
  });

  it('values no colour code can express get a message, not blank bands', () => {
    for (const [ohms, count] of [['0.01', '4'], ['0.5', '5'], ['1e12', '4']] as const) {
      const r = run({ mode: 'reverse', targetOhms: ohms, reverseBands: count });
      expect(r.map((x) => x.id)).toEqual(['error']);
    }
  });

  it('rejects junk', () => {
    expect(run({ mode: 'reverse', targetOhms: '4.7k', reverseBands: '4' })).toEqual([]);
    expect(run({ mode: 'reverse', targetOhms: '4700 ohm', reverseBands: '4' })).toEqual([]);
    expect(run({ mode: 'reverse', targetOhms: '-5', reverseBands: '4' })).toEqual([]);
    expect(run({ mode: 'reverse', targetOhms: '0', reverseBands: '4' })).toEqual([]);
  });
});
