import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/yarn-yardage/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Yarn Yardage Calculator', () => {
  it('calculates yardage for a standard scarf', () => {
    const results = config.calculate({
      projectType: 'Scarf',
      size: 'M',
      customWidth: '',
      customLength: '',
      yarnWeight: 'Worsted',
      stitchesPer4in: '20',
      rowsPer4in: '24',
      precutType: '',
      precutCount: '',
    });
    const yardage = parseNumber(getValue(results, 'yardageNeeded'));
    near(yardage, 400);
    expect(getValue(results, 'metersNeeded')).toContain('366');
  });

  it('calculates yardage for a blanket', () => {
    const results = config.calculate({
      projectType: 'Blanket',
      size: 'L',
      customWidth: '',
      customLength: '',
      yarnWeight: 'Bulky',
      stitchesPer4in: '20',
      rowsPer4in: '24',
      precutType: '',
      precutCount: '',
    });
    const yardage = parseNumber(getValue(results, 'yardageNeeded'));
    near(yardage, 2400);
  });

  it('adjusts for tighter gauge (needs more yarn)', () => {
    const results = config.calculate({
      projectType: 'Scarf',
      size: 'M',
      customWidth: '',
      customLength: '',
      yarnWeight: 'Worsted',
      stitchesPer4in: '22',
      rowsPer4in: '26',
      precutType: '',
      precutCount: '',
    });
    const yardage = parseNumber(getValue(results, 'yardageNeeded'));
    // Gauge factor: (22/20) * (26/24) = 1.1 * 1.083 = 1.19
    // 400 * 1.19 ≈ 477
    expect(yardage).toBeGreaterThan(450);
    expect(yardage).toBeLessThan(500);
  });

  it('adjusts for looser gauge (needs less yarn)', () => {
    const results = config.calculate({
      projectType: 'Scarf',
      size: 'M',
      customWidth: '',
      customLength: '',
      yarnWeight: 'Worsted',
      stitchesPer4in: '18',
      rowsPer4in: '22',
      precutType: '',
      precutCount: '',
    });
    const yardage = parseNumber(getValue(results, 'yardageNeeded'));
    // Gauge factor: (18/20) * (22/24) = 0.9 * 0.917 = 0.825
    // 400 * 0.825 = 330
    expect(yardage).toBeLessThan(360);
    expect(yardage).toBeGreaterThan(300);
  });

  it('calculates custom project yardage', () => {
    const results = config.calculate({
      projectType: 'Custom',
      size: 'M',
      customWidth: '50',
      customLength: '60',
      yarnWeight: 'Worsted',
      stitchesPer4in: '20',
      rowsPer4in: '24',
      precutType: '',
      precutCount: '',
    });
    const yardage = parseNumber(getValue(results, 'yardageNeeded'));
    // 50*60 / (5*6) * 1.2 = 3000/30 * 1.2 = 120
    // Actually: stitches per inch = 5, rows per inch = 6, sq inches per st*row unit = 5*6=30
    // yardage = 3000/30 * 1.2 = 120
    expect(yardage).toBeGreaterThan(100);
    expect(yardage).toBeLessThan(150);
  });

  it('accounts for precut fabric yardage', () => {
    const results = config.calculate({
      projectType: 'Scarf',
      size: 'M',
      customWidth: '',
      customLength: '',
      yarnWeight: 'Worsted',
      stitchesPer4in: '20',
      rowsPer4in: '24',
      precutType: 'Jelly Roll',
      precutCount: '1',
    });
    // Should show precut yardage and remaining needed
    const precutYardage = parseNumber(getValue(results, 'precutYardage'));
    near(precutYardage, 3); // Jelly Roll ≈ 2.75 yards ≈ 3
    expect(results.find(r => r.id === 'remainingYardage')).toBeDefined();
  });

  it('returns empty array for invalid gauge', () => {
    const results = config.calculate({
      projectType: 'Scarf',
      size: 'M',
      customWidth: '',
      customLength: '',
      yarnWeight: 'Worsted',
      stitchesPer4in: '',
      rowsPer4in: '',
      precutType: '',
      precutCount: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array for invalid custom dimensions', () => {
    const results = config.calculate({
      projectType: 'Custom',
      size: 'M',
      customWidth: '',
      customLength: '',
      yarnWeight: 'Worsted',
      stitchesPer4in: '20',
      rowsPer4in: '24',
      precutType: '',
      precutCount: '',
    });
    expect(results).toEqual([]);
  });

  it('shows yarn weight description in results', () => {
    const results = config.calculate({
      projectType: 'Scarf',
      size: 'M',
      customWidth: '',
      customLength: '',
      yarnWeight: 'Worsted',
      stitchesPer4in: '20',
      rowsPer4in: '24',
      precutType: '',
      precutCount: '',
    });
    const weightInfo = results.find(r => r.id === 'yarnWeightInfo');
    expect(weightInfo).toBeDefined();
    expect(weightInfo!.label).toContain('Worsted');
  });
});
