import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/yarn-yardage';
import { getValue, parseNumber, near } from '../../helpers';

describe('yarn-yardage', () => {
  it('scarf size M gives reasonable yardage range', () => {
    const r = config.calculate({
      projectType: 'Scarf',
      size: 'M',
      yarnWeight: 'Worsted',
      stitchesPer4in: '20',
      rowsPer4in: '24',
    });
    const yardage = parseNumber(getValue(r, 'yardageNeeded'));
    expect(yardage).toBeGreaterThanOrEqual(350);
    expect(yardage).toBeLessThanOrEqual(500);
    expect(getValue(r, 'baseYardage')).toContain('400');
  });

  it('returns empty when required fields are missing', () => {
    const r = config.calculate({
      projectType: 'Scarf',
      size: 'M',
      stitchesPer4in: '',
      rowsPer4in: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid gauge (zero or negative)', () => {
    const r = config.calculate({
      projectType: 'Scarf',
      size: 'M',
      stitchesPer4in: '0',
      rowsPer4in: '24',
    });
    expect(r).toEqual([]);
  });

  it('adjusts yardage for different gauge', () => {
    const rTight = config.calculate({
      projectType: 'Scarf',
      size: 'M',
      stitchesPer4in: '24',
      rowsPer4in: '28',
    });
    const rLoose = config.calculate({
      projectType: 'Scarf',
      size: 'M',
      stitchesPer4in: '16',
      rowsPer4in: '20',
    });
    const tightYardage = parseNumber(getValue(rTight, 'yardageNeeded'));
    const looseYardage = parseNumber(getValue(rLoose, 'yardageNeeded'));
    // Tighter gauge should need more yardage
    expect(tightYardage).toBeGreaterThan(looseYardage);
  });

  it('shows meters conversion', () => {
    const r = config.calculate({
      projectType: 'Scarf',
      size: 'M',
      stitchesPer4in: '20',
      rowsPer4in: '24',
    });
    const yards = parseNumber(getValue(r, 'yardageNeeded'));
    const meters = parseNumber(getValue(r, 'metersNeeded'));
    near(meters, yards * 0.9144, 1);
  });

  it('calculates custom project yardage correctly', () => {
    const r = config.calculate({
      projectType: 'Custom',
      customWidth: '60',
      customLength: '80',
      stitchesPer4in: '20',
      rowsPer4in: '24',
    });
    // Area = 60*80 = 4800 sq in
    // Stitches per sq in = (20/4) * (24/4) = 5 * 6 = 30
    // Yardage = 4800 / 30 * 1.2 = 192 yards
    const yardage = parseNumber(getValue(r, 'yardageNeeded'));
    near(yardage, 192, 1);
  });

  it('returns empty for custom project with missing dimensions', () => {
    const r = config.calculate({
      projectType: 'Custom',
      customWidth: '',
      customLength: '',
      stitchesPer4in: '20',
      rowsPer4in: '24',
    });
    expect(r).toEqual([]);
  });

  it('includes precut yardage when selected', () => {
    const r = config.calculate({
      projectType: 'Scarf',
      size: 'M',
      stitchesPer4in: '20',
      rowsPer4in: '24',
      precutType: 'Jelly Roll',
      precutCount: '2',
    });
    expect(getValue(r, 'precutYardage')).toContain('6');
    expect(getValue(r, 'remainingYardage')).toBeTruthy();
  });

  it('shows different yardage for different project sizes', () => {
    const rS = config.calculate({
      projectType: 'Blanket',
      size: 'S',
      stitchesPer4in: '20',
      rowsPer4in: '24',
    });
    const rL = config.calculate({
      projectType: 'Blanket',
      size: 'L',
      stitchesPer4in: '20',
      rowsPer4in: '24',
    });
    const sYardage = parseNumber(getValue(rS, 'yardageNeeded'));
    const lYardage = parseNumber(getValue(rL, 'yardageNeeded'));
    expect(lYardage).toBeGreaterThan(sYardage);
  });
});
