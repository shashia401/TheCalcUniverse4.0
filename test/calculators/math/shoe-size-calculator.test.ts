import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/shoe-size/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('shoe-size calculator', () => {
  it('US Men 9 converts to all sizes', () => {
    const r = config.calculate({ size: '9', fromRegion: 'us_m', gender: 'M' });
    expect(getValue(r, 'usSize')).toBe('9');
    expect(getValue(r, 'ukSize')).toBe('8');
    expect(getValue(r, 'euSize')).toBe('42.5');
    expect(getValue(r, 'jpSize')).toBe('27.5');
  });

  it('US Women 7 converts to all sizes', () => {
    const r = config.calculate({ size: '7', fromRegion: 'us_w', gender: 'F' });
    expect(getValue(r, 'usSize')).toBe('7');
    expect(getValue(r, 'ukSize')).toBe('5');
    expect(getValue(r, 'euSize')).toBe('38');
    expect(getValue(r, 'jpSize')).toBe('24');
  });

  it('UK 8 converts to all sizes', () => {
    const r = config.calculate({ size: '8', fromRegion: 'uk', gender: 'M' });
    expect(getValue(r, 'usSize')).toBe('8.5');
    expect(getValue(r, 'ukSize')).toBe('8');
    expect(getValue(r, 'euSize')).toBe('42');
    expect(getValue(r, 'jpSize')).toBe('27');
  });

  it('EU 42 converts to all sizes', () => {
    const r = config.calculate({ size: '42', fromRegion: 'eu', gender: 'M' });
    expect(getValue(r, 'euSize')).toBe('42');
    // EU 42 is between 41 (US 8) and 42.5 (US 9) — nearest is 42 which maps to US 8.5
    expect(getValue(r, 'usSize')).toBe('8.5');
    expect(getValue(r, 'ukSize')).toBe('8');
    expect(getValue(r, 'jpSize')).toBe('27');
  });

  it('JP 27 cm converts to all sizes', () => {
    const r = config.calculate({ size: '27', fromRegion: 'jp', gender: 'M' });
    expect(getValue(r, 'jpSize')).toBe('27');
    expect(getValue(r, 'usSize')).toBe('8.5');
    expect(getValue(r, 'ukSize')).toBe('8');
    expect(getValue(r, 'euSize')).toBe('42');
  });

  it('missing size returns empty array', () => {
    const r = config.calculate({ size: '', fromRegion: 'us_m', gender: 'M' });
    expect(r).toEqual([]);
  });

  it('zero or negative size returns empty array', () => {
    const r1 = config.calculate({ size: '0', fromRegion: 'us_m', gender: 'M' });
    expect(r1).toEqual([]);

    const r2 = config.calculate({ size: '-1', fromRegion: 'us_m', gender: 'M' });
    expect(r2).toEqual([]);
  });

  it('interpolation between US sizes works', () => {
    // US 9.25 should interpolate between 9 and 9.5
    const r = config.calculate({ size: '9.25', fromRegion: 'us_m', gender: 'M' });
    const us = parseFloat(getValue(r, 'usSize'));
    const uk = parseFloat(getValue(r, 'ukSize'));
    const eu = parseFloat(getValue(r, 'euSize'));
    const jp = parseFloat(getValue(r, 'jpSize'));
    // Should be between US 9 and US 9.5 values
    near(us, 9.25);
    near(uk, 8.25, 0.05);
    near(eu, 42.75, 0.05);
    near(jp, 27.75, 0.05);
  });

  it('men vs women difference is reflected', () => {
    const rMen = config.calculate({ size: '9', fromRegion: 'us_m', gender: 'M' });
    const rWomen = config.calculate({ size: '9', fromRegion: 'us_w', gender: 'F' });
    expect(getValue(rMen, 'usSize')).toBe('9');
    expect(getValue(rWomen, 'usSize')).toBe('9');
    // Men's 9 and Women's 9 have different UK/EU/JP conversions
    expect(getValue(rMen, 'euSize')).not.toBe(getValue(rWomen, 'euSize'));
    expect(getValue(rMen, 'jpSize')).not.toBe(getValue(rWomen, 'jpSize'));
  });

  it('includes brand disclaimer text', () => {
    const r = config.calculate({ size: '9', fromRegion: 'us_m', gender: 'M' });
    const note = getValue(r, 'conversionNote');
    expect(note).toContain('Sizes may vary');
  });

  it('foot length is reported in cm', () => {
    const r = config.calculate({ size: '10', fromRegion: 'us_m', gender: 'M' });
    const footLength = getValue(r, 'footLength');
    expect(footLength).toContain('cm');
  });

  it('US Women 10 converts correctly', () => {
    const r = config.calculate({ size: '10', fromRegion: 'us_w', gender: 'F' });
    expect(getValue(r, 'usSize')).toBe('10');
    expect(getValue(r, 'ukSize')).toBe('8');
    expect(getValue(r, 'euSize')).toBe('42');
    expect(getValue(r, 'jpSize')).toBe('27');
  });

  it('extraPanel returns element when results exist', () => {
    const r = config.calculate({ size: '9', fromRegion: 'us_m', gender: 'M' });
    const panel = config.extraPanel({ size: '9', fromRegion: 'us_m', gender: 'M' }, r);
    expect(panel).not.toBeNull();
  });

  it('extraPanel returns null when results empty', () => {
    const r = config.calculate({ size: '', fromRegion: 'us_m', gender: 'M' });
    const panel = config.extraPanel({ size: '', fromRegion: 'us_m', gender: 'M' }, r);
    expect(panel).toBeNull();
  });
});
