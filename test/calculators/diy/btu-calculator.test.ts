import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/diy/btu/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('BTU Calculator', () => {
  const baseValues = {
    area: '400',
    climateZone: '1',
    sunExposure: 'moderate',
    insulation: 'average',
    ceilingHeight: '8',
    roomType: 'standard',
    people: '1',
    purpose: 'cooling',
  };

  describe('Standard Room', () => {
    it('calculates BTU for standard room in hot climate', () => {
      // 400 × 30 × 1.0 × 1.0 × 1.0 × 1.0 + (1 × 600) = 12,600 BTU/h
      const r = config.calculate(baseValues);
      near(parseNumber(getValue(r, 'btuRequired')), 12600);
    });

    it('computes AC tonnage correctly', () => {
      // 12,600 / 12,000 = 1.05 tons, formatted to "1.1 ton" (1 decimal)
      const r = config.calculate(baseValues);
      near(parseNumber(getValue(r, 'tonsRequired')), 1.1);
    });

    it('recommends rounded-up AC size', () => {
      // ceil(1.05 × 2) / 2 = 1.5 tons
      const r = config.calculate(baseValues);
      const recVal = getValue(r, 'recommendedAC');
      expect(recVal).toContain('1.5 ton');
    });

    it('calculates BTU per sq ft', () => {
      // 12,600 / 400 = 31.5, rounded to 32 BTU/sq ft
      const r = config.calculate(baseValues);
      near(parseNumber(getValue(r, 'btuPerSqFt')), 32, 1);
    });
  });

  describe('Room Types', () => {
    it('calculates higher BTU for kitchen', () => {
      // Kitchen factor = 1.15 → 400 × 30 × 1.15 + 600 = 14,400
      const r = config.calculate({ ...baseValues, roomType: 'kitchen' });
      near(parseNumber(getValue(r, 'btuRequired')), 14400);
    });

    it('calculates lower BTU for basement', () => {
      // Basement factor = 0.85 → 400 × 30 × 0.85 + 600 = 10,800
      const r = config.calculate({ ...baseValues, roomType: 'basement' });
      near(parseNumber(getValue(r, 'btuRequired')), 10800);
    });

    it('includes room details string', () => {
      const r = config.calculate(baseValues);
      const details = getValue(r, 'roomDetails');
      expect(details).toContain('Zone 1');
      expect(details).toContain('standard');
    });
  });

  describe('Climate Zones', () => {
    it('Zone 2 (Mixed) produces less BTU requirement than Zone 1', () => {
      const r1 = config.calculate(baseValues);
      const r2 = config.calculate({ ...baseValues, climateZone: '2' });
      const btu1 = parseNumber(getValue(r1, 'btuRequired'));
      const btu2 = parseNumber(getValue(r2, 'btuRequired'));
      expect(btu2).toBeLessThan(btu1);
    });

    it('Zone 4 (Cold) produces lowest BTU requirement', () => {
      const r = config.calculate({ ...baseValues, climateZone: '4' });
      // 400 × 15 × 1.0 × 1.0 × 1.0 × 1.0 + 600 = 6,600
      near(parseNumber(getValue(r, 'btuRequired')), 6600);
    });
  });

  describe('Sun Exposure', () => {
    it('high sun exposure increases BTU', () => {
      const r = config.calculate({ ...baseValues, sunExposure: 'high' });
      // 400 × 30 × 1.0 × 1.15 × 1.0 × 1.0 + 600 = 14,400
      near(parseNumber(getValue(r, 'btuRequired')), 14400);
    });

    it('minimal sun exposure decreases BTU', () => {
      const r = config.calculate({ ...baseValues, sunExposure: 'minimal' });
      // 400 × 30 × 1.0 × 0.9 × 1.0 × 1.0 + 600 = 11,400
      near(parseNumber(getValue(r, 'btuRequired')), 11400);
    });
  });

  describe('Insulation', () => {
    it('poor insulation increases BTU requirement', () => {
      const r = config.calculate({ ...baseValues, insulation: 'poor' });
      // 400 × 30 × 1.0 × 1.0 × 1.2 × 1.0 + 600 = 15,000
      near(parseNumber(getValue(r, 'btuRequired')), 15000);
    });

    it('good insulation decreases BTU requirement', () => {
      const r = config.calculate({ ...baseValues, insulation: 'good' });
      // 400 × 30 × 1.0 × 1.0 × 0.9 × 1.0 + 600 = 11,400
      near(parseNumber(getValue(r, 'btuRequired')), 11400);
    });
  });

  describe('Ceiling Height', () => {
    it('tall ceiling increases BTU', () => {
      const r = config.calculate({ ...baseValues, ceilingHeight: '9' });
      near(parseNumber(getValue(r, 'btuRequired')), 13800); // 400×30×1.1 + 600
    });

    it('high ceiling further increases BTU', () => {
      const r = config.calculate({ ...baseValues, ceilingHeight: '12' });
      near(parseNumber(getValue(r, 'btuRequired')), 15600); // 400×30×1.25 + 600
    });
  });

  describe('Heating vs Cooling', () => {
    it('heating applies 0.85 multiplier', () => {
      const r = config.calculate({ ...baseValues, purpose: 'heating' });
      // (12000 + 600) × 0.85 = 10,710
      near(parseNumber(getValue(r, 'btuRequired')), 10710);
    });

    it('cooling uses 1.0 multiplier', () => {
      const r = config.calculate({ ...baseValues, purpose: 'cooling' });
      near(parseNumber(getValue(r, 'btuRequired')), 12600);
    });
  });

  describe('People Count', () => {
    it('additional people add 600 BTU/h each', () => {
      const r = config.calculate({ ...baseValues, people: '4' });
      // 12000 + (4 × 600) = 14,400
      near(parseNumber(getValue(r, 'btuRequired')), 14400);
    });
  });

  describe('Validation', () => {
    it('returns empty when area is missing', () => {
      const r = config.calculate({ ...baseValues, area: '' });
      expect(r).toEqual([]);
    });

    it('returns empty when area is zero', () => {
      const r = config.calculate({ ...baseValues, area: '0' });
      expect(r).toEqual([]);
    });

    it('returns empty when climate zone is missing', () => {
      const r = config.calculate({ ...baseValues, climateZone: '' });
      expect(r).toEqual([]);
    });

    it('returns empty when sun exposure is missing', () => {
      const r = config.calculate({ ...baseValues, sunExposure: '' });
      expect(r).toEqual([]);
    });
  });

  describe('Educational content', () => {
    it('has formula defined', () => {
      expect(config.educational.formula).toBeTruthy();
    });

    it('has variables defined', () => {
      expect(config.educational.variables?.length).toBeGreaterThanOrEqual(4);
    });

    it('has how-to-use instructions', () => {
      expect(config.educational.howToUse?.length).toBeGreaterThanOrEqual(3);
    });

    it('has explanation', () => {
      expect(config.educational.explanation).toBeTruthy();
      expect(config.educational.explanation.length).toBeGreaterThan(500);
    });

    it('has 5+ FAQs', () => {
      expect(config.educational.faqs?.length).toBeGreaterThanOrEqual(5);
    });

    it('has worked examples', () => {
      expect(config.educational.workedExamples?.length).toBeGreaterThanOrEqual(2);
    });

    it('has pro tips', () => {
      expect(config.educational.proTips?.length).toBeGreaterThanOrEqual(4);
    });

    it('has limitations', () => {
      expect(config.educational.limitations?.length).toBeGreaterThanOrEqual(3);
    });

    it('has quick reference', () => {
      expect(config.educational.quickReference?.length).toBeGreaterThanOrEqual(5);
    });
  });
});
