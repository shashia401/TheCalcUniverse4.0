import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/flow-rate';
import { getValue, parseNumber, near } from '../../helpers';

const run = (v: Record<string, string>) => config.calculate({ mode: 'velocity', pipeDiameter: '', flowRate: '', velocity: '', ...v });

// Q = A V ; 1 US gal = 231 in^3 -> 1 ft^3/s = 448.83 GPM. Hand-derived.
describe('flow-rate audit', () => {
  it('2 in pipe: 25 GPM = 2.553 ft/s; 100 GPM = 10.21 ft/s', () => {
    expect(getValue(run({ pipeDiameter: '2', flowRate: '25' }), 'velocity')).toMatch(/^2\.5531 ft\/s/);
    expect(getValue(run({ pipeDiameter: '2', flowRate: '100' }), 'velocity')).toMatch(/^10\.2125 ft\/s/);
  });
  it('100 GPM at 6 ft/s needs a 2.61 in pipe', () => {
    expect(getValue(run({ mode: 'diameter', flowRate: '100', velocity: '6' }), 'diameter')).toBe('2.6093 inches');
  });
  it('quick-reference rows (nominal ID): 1/2" at 4 ft/s 2.45 GPM; 3/4" at 6 ft/s 8.26; 1" at 6 14.69; 2" at 6 58.75; 4" at 8 313.3', () => {
    const q = (d: string, v: string) => parseNumber(getValue(run({ mode: 'flowrate', pipeDiameter: d, velocity: v }), 'flowGPM'));
    near(q('0.5', '4'), 2.448, 0.002);
    near(q('0.75', '6'), 8.262, 0.002);
    near(q('1', '6'), 14.69, 0.01);
    near(q('2', '6'), 58.75, 0.01);
    near(q('4', '8'), 313.3, 0.1);
  });
  it('unit conversion: 1 US gal = 231 in3 so 1 ft3/s = 448.83 GPM; 1 GPM = 3.78541 L/min', () => {
    near((1728 / 231) * 60, 448.83, 0.01);
    const r = run({ mode: 'flowrate', pipeDiameter: '12', velocity: '1' });
    near(parseNumber(getValue(r, 'flowLPM')) / parseNumber(getValue(r, 'flowGPM')), 3.78541, 1e-4);
  });
  it('zero flow gives zero velocity, not an error; invalid input returns []', () => {
    expect(getValue(run({ pipeDiameter: '2', flowRate: '0' }), 'velocity')).toMatch(/^0 ft\/s/);
    expect(run({ pipeDiameter: '0', flowRate: '5' })).toEqual([]);
    expect(run({ mode: 'diameter', flowRate: '5', velocity: '0' })).toEqual([]);
  });
});
