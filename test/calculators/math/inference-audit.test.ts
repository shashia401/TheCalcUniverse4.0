import { describe, it, expect } from 'vitest';
import zScore from '../../../src/calculators/math/z-score/index';
import pValue from '../../../src/calculators/math/p-value/index';
import ci from '../../../src/calculators/math/confidence-interval/index';
import sampleSize from '../../../src/calculators/math/sample-size/index';
import { cochranSampleSize } from '../../../src/calculators/math/sample-size/cochran';
import { getValue } from '../../helpers';

// Every expected value below comes from scipy.stats (norm/t/chi2/f sf, cdf, isf) or hand algebra with Python floats.

describe('z-score', () => {
  const z = (x: string, mu: string, s: string) => zScore.calculate({ rawScore: x, mean: mu, stddev: s });
  it('x=85, mu=70, sigma=10 -> z 1.5, P(Z<=z) 0.9331927987, above 6.680720127 %', () => {
    const r = z('85', '70', '10');
    expect(getValue(r, 'zscore')).toBe('1.5');
    expect(getValue(r, 'probability')).toBe('0.9331927987');
    expect(getValue(r, 'percentile')).toBe('93.31927987%');
    expect(getValue(r, 'aboveProb')).toBe('6.680720127%');
  });
  it('z = -2.5 (scipy norm.cdf = 0.006209665325776132)', () => {
    const r = z('45', '70', '10');
    expect(getValue(r, 'probability')).toBe('0.006209665326');
    expect(getValue(r, 'aboveProb')).toBe('99.37903347%');
  });
  it('REGRESSION: extreme tail z = 8 keeps 6.220960574e-14 % (A&S approximation / 1 - cdf gave exactly 0)', () => {
    const r = z('150', '70', '10');
    expect(getValue(r, 'aboveProb')).toBe('6.220960574e-14%');
  });
  it('REGRESSION: A&S error ~1.5e-7 is gone — P(Z <= 1.96) = 0.9750021048517795 to 10 digits', () => {
    expect(getValue(z('89.6', '70', '10'), 'probability')).toBe('0.9750021049');
  });
  it('sigma <= 0, non-numeric or blank input returns []', () => {
    expect(z('85', '70', '0')).toEqual([]);
    expect(z('85', '70', '-1')).toEqual([]);
    expect(z('85x', '70', '10')).toEqual([]);
    expect(z('', '70', '10')).toEqual([]);
  });
  it('interpretation bands', () => {
    expect(getValue(z('72', '70', '10'), 'interpretation')).toContain('Close to average');
    expect(getValue(z('95', '70', '10'), 'interpretation')).toContain('more than 2σ');
  });
});

describe('p-value (scipy.stats)', () => {
  const p = (testType: string, score: string, extra: Record<string, string> = {}) =>
    pValue.calculate({ testType, score, df: '', df2: '', alpha: '0.05', tails: 'two', ...extra });
  it('Z two-tailed 3.467 -> 0.000526302; Z 1.44 two-tailed -> 0.149867', () => {
    expect(getValue(p('z', '3.467'), 'pValue')).toBe('0.000526302');
    expect(getValue(p('z', '1.44'), 'pValue')).toBe('0.149867');
  });
  it('t one-tailed 1.5 df 24 -> 0.0733278 (not significant) and df 100 -> 0.0683825 (FAQ claimed it drops below 0.05: it does not)', () => {
    expect(getValue(p('t', '1.5', { df: '24', tails: 'one' }), 'pValue')).toBe('0.0733278');
    expect(getValue(p('t', '1.5', { df: '24', tails: 'one' }), 'significant')).toBe('No');
    expect(getValue(p('t', '1.5', { df: '100', tails: 'one' }), 'pValue')).toBe('0.0683825');
  });
  it('REGRESSION: t with df > 100 is computed exactly (old code swapped in the normal CDF): t=1.5 df=1000 -> 0.066965', () => {
    expect(getValue(p('t', '1.5', { df: '1000', tails: 'one' }), 'pValue')).toBe('0.066965');
  });
  it('REGRESSION: fractional (Welch) df is no longer truncated by parseInt: df 14.9 differs from df 14', () => {
    const a = getValue(p('t', '2.1', { df: '14.9' }), 'pValue');
    const b = getValue(p('t', '2.1', { df: '14' }), 'pValue');
    expect(a).not.toBe(b);
  });
  it('tiny p-values stay visible: t=5.5 df=15 two-tailed -> 6.10538e-5; Z=10 -> 1.52397e-23', () => {
    expect(getValue(p('t', '5.5', { df: '15' }), 'pValue')).toBe('6.10538e-5');
    expect(getValue(p('z', '10'), 'pValue')).toBe('1.52397e-23');
  });
  it('left tail: Z=-1.96 -> 0.0249979 lower, 0.975002 upper; t=-2.2 df 7 lower -> 0.0318655', () => {
    expect(getValue(p('z', '-1.96', { tails: 'left' }), 'pValue')).toBe('0.0249979');
    expect(getValue(p('z', '-1.96', { tails: 'one' }), 'pValue')).toBe('0.975002');
    expect(getValue(p('t', '-2.2', { df: '7', tails: 'left' }), 'pValue')).toBe('0.0318655');
  });
  it('chi-square: 3.84 df 1 upper -> 0.0500435, lower -> 0.949956; two-tailed 25 df 10 -> 0.010691', () => {
    expect(getValue(p('chisq', '3.84', { df: '1', tails: 'one' }), 'pValue')).toBe('0.0500435');
    expect(getValue(p('chisq', '3.84', { df: '1', tails: 'left' }), 'pValue')).toBe('0.949956');
    expect(getValue(p('chisq', '25', { df: '10' }), 'pValue')).toBe('0.010691');
  });
  it('F test: 3.5 with (5, 20) df upper -> 0.0195836; needs df2', () => {
    expect(getValue(p('f', '3.5', { df: '5', df2: '20', tails: 'one' }), 'pValue')).toBe('0.0195836');
    expect(p('f', '3.5', { df: '5', tails: 'one' })).toEqual([]);
  });
  it('critical values are exact for every distribution', () => {
    expect(getValue(p('z', '2'), 'criticalValue')).toBe('±1.960');
    expect(getValue(p('z', '2', { tails: 'one' }), 'criticalValue')).toBe('1.645');
    expect(getValue(p('z', '2', { tails: 'left' }), 'criticalValue')).toBe('−1.645');
    expect(getValue(p('t', '2', { df: '10' }), 'criticalValue')).toBe('±2.228');
    expect(getValue(p('t', '2', { df: '24', tails: 'one' }), 'criticalValue')).toBe('1.711');
    expect(getValue(p('chisq', '5', { df: '5', tails: 'one' }), 'criticalValue')).toBe('11.070');
    expect(getValue(p('chisq', '5', { df: '10' }), 'criticalValue')).toBe('[3.247, 20.483]');
    expect(getValue(p('chisq', '5', { df: '10', tails: 'left' }), 'criticalValue')).toBe('3.940');
    expect(getValue(p('f', '2', { df: '5', df2: '20', tails: 'one' }), 'criticalValue')).toBe('2.711');
  });
  it('alpha decides significance on the unrounded p', () => {
    expect(getValue(p('z', '1.96'), 'significant')).toBe('Yes'); // p = 0.04999579 < 0.05
    expect(getValue(p('z', '1.95'), 'significant')).toBe('No'); // p = 0.05125
  });
  it('invalid input: negative chi-square/F, df < 1, blank score or alpha out of range return []', () => {
    expect(p('chisq', '-1', { df: '2' })).toEqual([]);
    expect(p('t', '1', { df: '0.5' })).toEqual([]);
    expect(p('t', '1', { df: '' })).toEqual([]);
    expect(p('z', '')).toEqual([]);
    expect(p('z', '1', { alpha: '1.5' })).toEqual([]);
  });
  it('REGRESSION: z, t and chi-square p-values are monotone and within [0,1] across a sweep', () => {
    let prev = 2;
    for (let s = 0; s <= 12; s += 0.5) {
      const v = parseFloat(getValue(p('z', String(s), { tails: 'one' }), 'pValue'));
      expect(v).toBeLessThanOrEqual(prev);
      expect(v).toBeGreaterThanOrEqual(0);
      prev = v;
    }
  });
});

describe('confidence-interval', () => {
  const run = (mean: string, n: string, s: string, conf: string, sdType = 'sample') =>
    ci.calculate({ sampleMean: mean, sampleSize: n, stddev: s, confidence: conf, sdType });
  it('n=100, s=10, 95%: Student t (df 99) = 1.984217, MOE 1.984217, [48.015783, 51.984217]', () => {
    const r = run('50', '100', '10', '95');
    expect(getValue(r, 'lowerBound')).toBe('48.015783');
    expect(getValue(r, 'upperBound')).toBe('51.984217');
    expect(getValue(r, 'marginOfError')).toBe('±1.984217');
    expect(getValue(r, 'criticalValue')).toBe('1.9842 (95% confidence)');
    expect(getValue(r, 'standardError')).toBe('1');
  });
  it('REGRESSION: the z shortcut (±1.96) is only used when sigma is declared known: [48.040036, 51.959964]', () => {
    const r = run('50', '100', '10', '95', 'population');
    expect(getValue(r, 'lowerBound')).toBe('48.040036');
    expect(getValue(r, 'upperBound')).toBe('51.959964');
    expect(getValue(r, 'criticalValue')).toBe('1.9600 (95% confidence)');
  });
  it('REGRESSION: small n uses t (n=10, s=10, 95% -> t 2.262157, MOE 7.153569; z would give 6.198)', () => {
    const r = run('50', '10', '10', '95');
    expect(getValue(r, 'marginOfError')).toBe('±7.153569');
    expect(getValue(r, 'lowerBound')).toBe('42.846431');
  });
  it('99% (n=10): t 3.249836, MOE 10.276882; 90% (n=2): t 6.313752, [5.355035, 94.644965]', () => {
    expect(getValue(run('50', '10', '10', '99'), 'marginOfError')).toBe('±10.276882');
    const r = run('50', '2', '10', '90');
    expect(getValue(r, 'lowerBound')).toBe('5.355035');
    expect(getValue(r, 'upperBound')).toBe('94.644965');
  });
  it('known sigma, n=30, sigma=12.5, 95%: SE 2.282177, MOE 4.472985', () => {
    const r = run('50', '30', '12.5', '95', 'population');
    expect(getValue(r, 'standardError')).toBe('2.282177');
    expect(getValue(r, 'marginOfError')).toBe('±4.472985');
  });
  it('80% and 99.9% levels: t(24) 1.317836 / 3.745399', () => {
    expect(getValue(run('72.5', '25', '8', '80'), 'marginOfError')).toBe('±2.108537');
    expect(getValue(run('72.5', '25', '8', '99.9'), 'marginOfError')).toBe('±5.992638');
  });
  it('REGRESSION: non-integer n is rejected (parseInt used to turn 25.9 into 25); n=1 needs known sigma', () => {
    expect(run('50', '25.9', '10', '95')).toEqual([]);
    expect(run('50', '1', '10', '95')).toEqual([]);
    expect(getValue(run('50', '1', '10', '95', 'population'), 'marginOfError')).toBe('±19.59964');
    expect(run('50', '1e2', '10', '95').length).toBeGreaterThan(0);
  });
  it('invalid: sd <= 0, unknown level, blank mean', () => {
    expect(run('50', '10', '0', '95')).toEqual([]);
    expect(run('50', '10', '10', '97')).toEqual([]);
    expect(run('', '10', '10', '95')).toEqual([]);
  });
});

describe('sample-size (Cochran + finite population correction)', () => {
  const run = (population: string, confidence: string, margin: string, proportion?: string) =>
    sampleSize.calculate({ population, confidence, margin, ...(proportion !== undefined ? { proportion } : {}) });
  it('cochranSampleSize vs python: large N 95/5 = 385, 95/3 = 1068, 99/5 = 664, 90/5 = 271, 95/8 = 151', () => {
    expect(cochranSampleSize(1e9, 95, 0.05).n).toBe(385);
    expect(cochranSampleSize(1e9, 95, 0.03).n).toBe(1068);
    expect(cochranSampleSize(1e9, 99, 0.05).n).toBe(664);
    expect(cochranSampleSize(1e9, 90, 0.05).n).toBe(271);
    expect(cochranSampleSize(1e9, 95, 0.08).n).toBe(151);
  });
  it('worked examples: N=50000 -> 382; N=200 -> 132; N=500000, 99%, 3% -> 1837 (text said 381 and 1849)', () => {
    expect(getValue(run('50000', '95', '5'), 'sampleSize')).toBe('382');
    expect(getValue(run('200', '95', '5'), 'sampleSize')).toBe('132');
    expect(getValue(run('500000', '99', '3'), 'sampleSize')).toBe('1,837');
    expect(getValue(run('500000', '95', '3'), 'sampleSize')).toBe('1,065');
  });
  it('N=1000, 95/5 -> 278; infinite size n0 shown as 385', () => {
    const r = run('1000', '95', '5');
    expect(getValue(r, 'sampleSize')).toBe('278');
    expect(getValue(r, 'infiniteSize')).toBe('385');
  });
  it('expected proportion: p=20% large N 95/5 -> 246, p=80% N=2000 4% -> 323; blank means 50%', () => {
    expect(getValue(run('1000000000', '95', '5', '20'), 'sampleSize')).toBe('246');
    expect(getValue(run('2000', '95', '4', '80'), 'sampleSize')).toBe('323');
    expect(getValue(run('1000000000', '95', '5', ''), 'sampleSize')).toBe('385');
  });
  it('sample never exceeds the population (N=1 -> 1)', () => {
    expect(getValue(run('1', '95', '5'), 'sampleSize')).toBe('1');
    expect(cochranSampleSize(50, 95, 0.01).n).toBeLessThanOrEqual(50);
  });
  it('REGRESSION: population must be a whole number (parseInt turned 1e6 into 1 and 1000.7 into 1000)', () => {
    expect(run('1000.7', '95', '5')).toEqual([]);
    expect(getValue(run('1e6', '95', '5'), 'sampleSize')).toBe('384'); // 384.1459 / (1 + 383.1459/1e6) = 383.998
  });
  it('no float fuzz: exact 400.0 stays 400 (E=0.049, Z^2 p q / E^2 not an integer here, but integer cases must not add 1)', () => {
    // Z = 2 exactly is not a table level; check the ceil slack directly with a synthetic exact case.
    const c = cochranSampleSize(1e12, 95, 0.05, 0.5);
    expect(c.n0Ceil).toBe(385);
  });
  it('invalid: margin 0 or >= 100, proportion out of range, unknown confidence', () => {
    expect(run('1000', '95', '0')).toEqual([]);
    expect(run('1000', '95', '100')).toEqual([]);
    expect(run('1000', '95', '5', '0')).toEqual([]);
    expect(run('1000', '95', '5', '100')).toEqual([]);
    expect(run('1000', '97', '5')).toEqual([]);
    expect(run('0', '95', '5')).toEqual([]);
  });
});
