import { describe, it, expect } from 'vitest';
import height from '../../../src/calculators/math/height';

// Tanner's mid-parental ("target") height works in centimetres: boy = (M + F + 13 cm) / 2, girl = (M + F - 13 cm) / 2,
// likely range +/- 8.5 cm (about two standard deviations, ~95%). Source: Merck Manual "Height Potential" calculator.
// The old code added 13 INCHES, over-predicting by about 4 inches. Expected values below were recomputed in Python.
type R = { id: string; value: string }[];
const val = (r: R, id: string) => r.find((x) => x.id === id)?.value;
const run = (o: Record<string, string>) => height.calculate(o) as R;
const parents = (mFt: string, mIn: string, fFt: string, fIn: string, g: string) => ({
  motherFeet: mFt,
  motherInches: mIn,
  fatherFeet: fFt,
  fatherInches: fIn,
  childGender: g,
});

describe('height (mid-parental) audit', () => {
  it('mother 5\'4", father 5\'10": son 176.7 cm = 5\'9.6" (was 6\'1.5"), daughter 163.7 cm = 5\'4.4" (was 5\'0.5")', () => {
    const son = run(parents('5', '4', '5', '10', 'male'));
    expect(val(son, 'predictedHeight')).toBe('5\'9.6" (176.7 cm)');
    expect(val(son, 'heightRange')).toBe('5\'6.2" to 6\'0.9" (168.2-185.2 cm)');
    const daughter = run(parents('5', '4', '5', '10', 'female'));
    expect(val(daughter, 'predictedHeight')).toBe('5\'4.4" (163.7 cm)');
  });

  it('the son/daughter gap is 13 cm (5.1 in), not 26 inches', () => {
    const son = Number(val(run(parents('5', '4', '5', '10', 'male')), 'predictedCm'));
    const daughter = Number(val(run(parents('5', '4', '5', '10', 'female')), 'predictedCm'));
    expect(son - daughter).toBeCloseTo(13, 1);
  });

  it('two very tall parents (worked example): daughter 186.5 cm = 6\'1.4", range 178.0-195.0 cm', () => {
    const r = run(parents('6', '1', '6', '7', 'female'));
    expect(val(r, 'predictedHeight')).toBe('6\'1.4" (186.5 cm)');
    expect(val(r, 'heightRange')).toBe('5\'10.1" to 6\'4.8" (178.0-195.0 cm)');
  });

  it('single-father example: mother 5\'2", father 5\'9", son 172.9 cm = 5\'8.1"', () => {
    const r = run(parents('5', '2', '5', '9', 'male'));
    expect(val(r, 'predictedHeight')).toBe('5\'8.1" (172.9 cm)');
    expect(val(r, 'heightRange')).toBe('5\'4.7" to 5\'11.4" (164.4-181.4 cm)');
  });

  it('never prints 5\'12": 71.96 inches is 6\'0"', () => {
    expect(val(run(parents('5', '9.4', '5', '9.4', 'male')), 'predictedHeight')).toBe('6\'0" (182.8 cm)');
  });

  it('rejects impossible heights and junk', () => {
    expect(run(parents('5', '12', '5', '10', 'male'))).toEqual([]); // 12 inches is the next foot
    expect(run(parents('2', '0', '5', '10', 'male'))).toEqual([]); // 2 ft parent
    expect(run(parents('9', '6', '5', '10', 'male'))).toEqual([]); // 9'6" parent
    expect(run(parents('5', '-1', '5', '10', 'male'))).toEqual([]);
    expect(run(parents('5ft', '4', '5', '10', 'male'))).toEqual([]);
    expect(run(parents('5', '4', '5', '10', ''))).toEqual([]);
  });
});
