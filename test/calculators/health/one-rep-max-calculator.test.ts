import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/one-rep-max/index';
import { getValue, getResult } from '../../helpers';

describe('One Rep Max calculator', () => {
  it('calculates 1RM using Epley formula', () => {
    const r = config.calculate({
      weight: '225',
      reps: '5',
      formula: 'epley',
    });
    const rm = parseInt(getValue(r, 'oneRepMax'));
    expect(rm).toBeGreaterThan(250);
    expect(rm).toBeLessThan(300);
  });

  it('calculates 1RM using Brzycki formula', () => {
    const r = config.calculate({
      weight: '225',
      reps: '5',
      formula: 'brzycki',
    });
    const rm = parseInt(getValue(r, 'oneRepMax'));
    expect(rm).toBeGreaterThan(240);
    expect(rm).toBeLessThan(300);
  });

  it('calculates 1RM using Lombardi formula', () => {
    const r = config.calculate({
      weight: '225',
      reps: '5',
      formula: 'lombardi',
    });
    const rm = parseInt(getValue(r, 'oneRepMax'));
    expect(rm).toBeGreaterThan(250);
  });

  it('returns all three formula estimates', () => {
    const r = config.calculate({
      weight: '135',
      reps: '10',
      formula: 'epley',
    });
    expect(getValue(r, 'epleyLine')).toContain('lbs');
    expect(getValue(r, 'brzyckiLine')).toContain('lbs');
    expect(getValue(r, 'lombardiLine')).toContain('lbs');
  });

  it('returns breakdown count', () => {
    const r = config.calculate({
      weight: '185',
      reps: '3',
      formula: 'epley',
    });
    expect(getValue(r, 'breakdownCount')).toContain('100%');
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      weight: '0', reps: '0', formula: 'epley',
    });
    expect(r).toEqual([]);
  });
  // ── Audit regressions: Epley W(1+R/30), Brzycki 36W/(37-R), Lombardi W*R^0.10 recomputed by hand ──
  const run = (weight: string, reps: string, formula = 'epley', unit = 'lbs') => config.calculate({ weight, reps, formula, unit });
  const n = (s: string) => parseInt(s.replace(/,/g, ''), 10);

  it('worked example Marcus 185 x 8: Epley 234.33 -> 234, Brzycki 229.66 -> 230, Lombardi 227.76 -> 228', () => {
    const r = run('185', '8');
    expect(getValue(r, 'epleyLine')).toBe('234 lbs');
    expect(getValue(r, 'brzyckiLine')).toBe('230 lbs');
    expect(getValue(r, 'lombardiLine')).toBe('228 lbs');
    expect(getValue(r, 'oneRepMax')).toBe('234 lbs');
    // 5/3/1 training max = 90% of 234 = 211; 65/75/85% of 211 = 137/158/179
    expect(Math.round(234 * 0.9)).toBe(211);
    expect([0.65, 0.75, 0.85].map((p) => Math.round(211 * p))).toEqual([137, 158, 179]);
  });

  it('worked example Priya 315 x 3: Epley 346.5 -> 347, Brzycki 333.53 -> 334, Lombardi 351.58 -> 352', () => {
    const r = run('315', '3', 'brzycki');
    expect(getValue(r, 'epleyLine')).toBe('347 lbs');
    expect(getValue(r, 'brzyckiLine')).toBe('334 lbs');
    expect(getValue(r, 'lombardiLine')).toBe('352 lbs');
    expect(getValue(r, 'oneRepMax')).toBe('334 lbs');
    // competition ladder: opener 90% of 334 = 301
    expect(Math.round(334 * 0.9)).toBe(301);
  });

  it('185 x 12 spread used in the explanation: Epley 259, Brzycki 266.4 -> 266, Lombardi 237.19 -> 237', () => {
    const r = run('185', '12');
    expect(getValue(r, 'epleyLine')).toBe('259 lbs');
    expect(getValue(r, 'brzyckiLine')).toBe('266 lbs');
    expect(getValue(r, 'lombardiLine')).toBe('237 lbs');
  });

  it('a 1-rep set is the 1RM: every formula returns the weight lifted (Epley no longer adds 3.3%)', () => {
    const r = run('225', '1');
    expect(getValue(r, 'epleyLine')).toBe('225 lbs');
    expect(getValue(r, 'brzyckiLine')).toBe('225 lbs');
    expect(getValue(r, 'lombardiLine')).toBe('225 lbs');
    expect(getResult(r, 'oneRepMax').interpretation).toContain('A 1-rep set is your 1RM');
  });

  it('kg input is labelled kg, not lbs: 100 kg x 5 -> Epley 116.67 -> 117, Brzycki 112.5 -> 113, Lombardi 117.46 -> 117', () => {
    const r = run('100', '5', 'epley', 'kg');
    expect(getValue(r, 'oneRepMax')).toBe('117 kg');
    expect(getValue(r, 'brzyckiLine')).toBe('113 kg');
    expect(getValue(r, 'lombardiLine')).toBe('117 kg');
    expect(getValue(r, 'maxBasedOn')).toBe('100 kg × 5 reps');
  });

  it('formula ordering claimed in the text: R<=5 Lombardi highest & Brzycki lowest; R 6-9 Epley highest; R>=8 Lombardi lowest; R>10 Brzycki highest', () => {
    const at = (reps: string) => {
      const r = run('1000', reps);
      return { e: n(getValue(r, 'epleyLine')), b: n(getValue(r, 'brzyckiLine')), l: n(getValue(r, 'lombardiLine')) };
    };
    for (const reps of ['2', '3', '4', '5']) { const { e, b, l } = at(reps); expect(b).toBeLessThan(e); expect(e).toBeLessThan(l); }
    for (const reps of ['6', '7']) { const { e, b, l } = at(reps); expect(b).toBeLessThan(l); expect(l).toBeLessThan(e); }
    for (const reps of ['8', '9']) { const { e, b, l } = at(reps); expect(l).toBeLessThan(b); expect(b).toBeLessThan(e); }
    for (const reps of ['11', '12', '15']) { const { e, b, l } = at(reps); expect(l).toBeLessThan(e); expect(e).toBeLessThan(b); }
  });

  it('whole-number reps are used consistently (5.6 reps -> 6)', () => {
    expect(getValue(run('100', '5.6'), 'maxBasedOn')).toBe('100 lbs × 6 reps');
  });
});
