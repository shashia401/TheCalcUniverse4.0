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
    // Row gauge factor 26/24 = 1.083: 400 * 1.083 = 433.3 -> 433 (stitch count does not change yarn per row)
    expect(yardage).toBe(433);
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
    // Row gauge factor 22/24 = 0.9167: 400 * 0.9167 = 366.7 -> 367
    expect(yardage).toBe(367);
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
    // Corrected model (the old area / gauge division gave 120 yd for a 50x60 blanket, dimensionally wrong):
    // 3.5 x 50 x 60 x (24/4 rows per inch) / 36 = 1750 yd, x 1.2 waste = 2100 yd
    expect(yardage).toBe(2100);
  });

  it('does not double-apply the gauge factor for custom projects (regression: a non-baseline custom gauge previously got squared/discounted because gaugeFactor was multiplied on top of an area formula that already divided by the user\'s own gauge)', () => {
    const results = config.calculate({
      projectType: 'Custom',
      customWidth: '50',
      customLength: '60',
      yarnWeight: 'Bulky',
      stitchesPer4in: '10',
      rowsPer4in: '12',
      precutType: 'Jelly Roll',
      precutCount: '1',
    });
    // 3.5 x 50 x 60 x (12/4) / 36 = 875 yd, x 1.2 = 1050 yd; the gauge is applied once only
    const yardage = parseNumber(getValue(results, 'yardageNeeded'));
    expect(yardage).toBe(1050);
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
    // Jelly Roll = 40 strips of 2.5" x 42" = 4200 sq in / (36 x 44) = 2.65 yd of fabric -> "3 yards"
    const precutYardage = parseNumber(getValue(results, 'precutYardage'));
    near(precutYardage, 3);
    // fabric is not yarn: nothing is subtracted from the yarn estimate any more
    expect(results.find(r => r.id === 'remainingYardage')).toBeUndefined();
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
