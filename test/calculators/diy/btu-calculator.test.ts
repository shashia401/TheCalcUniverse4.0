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

  // Model (see btuMath.ts): cooling = area x BTU/sq ft(zone: 30/25/20/15, 20 = ENERGY STAR/ASHRAE rule of thumb)
  // x ceiling x sun x insulation x room + 600 per occupant beyond two + 4,000 for a kitchen.
  // Heating = area x BTU/sq ft(zone: 20/30/40/50) x ceiling x insulation. All values below derived by hand.
  describe('Standard Room', () => {
    it('calculates BTU for standard room in hot climate', () => {
      // 400 x 30 = 12,000; one occupant adds nothing (first two are in the base load)
      near(parseNumber(getValue(config.calculate(baseValues), 'btuRequired')), 12000);
    });

    it('computes AC tonnage correctly', () => {
      near(parseNumber(getValue(config.calculate(baseValues), 'tonsRequired')), 1.0);
    });

    it('recommends rounded-up AC size', () => {
      // exactly 1.0 ton needs no round-up; 12,001 BTU/h would need 1.5
      expect(getValue(config.calculate(baseValues), 'recommendedAC')).toContain('1.0 ton');
      expect(getValue(config.calculate({ ...baseValues, area: '401' }), 'recommendedAC')).toContain('1.5 ton');
    });

    it('calculates BTU per sq ft', () => {
      near(parseNumber(getValue(config.calculate(baseValues), 'btuPerSqFt')), 30, 0.5);
    });
  });

  describe('worked example: Phoenix master bedroom', () => {
    it('10,500 BTU/h, 0.9 tons, recommends 1.0 ton', () => {
      const r = config.calculate({
        area: '350', climateZone: '1', sunExposure: 'moderate', insulation: 'average',
        ceilingHeight: '8', roomType: 'standard', people: '2', purpose: 'cooling',
      });
      near(parseNumber(getValue(r, 'btuRequired')), 10500); // 350 x 30, two occupants are in the base
      near(parseNumber(getValue(r, 'tonsRequired')), 0.9, 0.05);
      expect(getValue(r, 'recommendedAC')).toContain('1.0 ton');
      expect(getValue(r, 'recommendedAC')).toContain('12,000');
    });
  });

  describe('worked example: Minneapolis heating', () => {
    it('600 x 50 x 1.2 x 0.9 = 32,400 BTU/h; occupants and sun are ignored for heating', () => {
      const r = config.calculate({
        area: '600', climateZone: '4', sunExposure: 'minimal', insulation: 'good',
        ceilingHeight: '9', roomType: 'standard', people: '4', purpose: 'heating',
      });
      near(parseNumber(getValue(r, 'btuRequired')), 32400);
      expect(getValue(r, 'recommendedAC')).toContain('3.0 ton');
    });
  });

  describe('Room Types', () => {
    it('kitchen adds 4,000 BTU/h of cooling', () => {
      near(parseNumber(getValue(config.calculate({ ...baseValues, roomType: 'kitchen' }), 'btuRequired')), 16000);
    });

    it('calculates lower BTU for basement', () => {
      // 12,000 x 0.85
      near(parseNumber(getValue(config.calculate({ ...baseValues, roomType: 'basement' }), 'btuRequired')), 10200);
    });

    it('includes room details string', () => {
      const details = getValue(config.calculate(baseValues), 'roomDetails');
      expect(details).toContain('Zone 1');
      expect(details).toContain('standard');
    });
  });

  describe('Climate Zones', () => {
    it('Zone 2 (Mixed) produces less cooling requirement than Zone 1', () => {
      const btu1 = parseNumber(getValue(config.calculate(baseValues), 'btuRequired'));
      const btu2 = parseNumber(getValue(config.calculate({ ...baseValues, climateZone: '2' }), 'btuRequired'));
      expect(btu2).toBeLessThan(btu1);
    });

    it('Zone 4 (Cold) has the lowest cooling requirement', () => {
      near(parseNumber(getValue(config.calculate({ ...baseValues, climateZone: '4' }), 'btuRequired')), 6000); // 400 x 15
    });

    it('heating runs the other way: colder zones need MORE capacity (was inverted)', () => {
      const h = (zone: string) => parseNumber(getValue(config.calculate({ ...baseValues, climateZone: zone, purpose: 'heating' }), 'btuRequired'));
      expect(h('1')).toBe(8000); // 400 x 20
      expect(h('2')).toBe(12000); // 400 x 30
      expect(h('3')).toBe(16000); // 400 x 40
      expect(h('4')).toBe(20000); // 400 x 50
    });
  });

  describe('Sun Exposure', () => {
    it('high sun exposure increases BTU by 10%', () => {
      near(parseNumber(getValue(config.calculate({ ...baseValues, sunExposure: 'high' }), 'btuRequired')), 13200);
    });

    it('minimal sun exposure decreases BTU by 10%', () => {
      near(parseNumber(getValue(config.calculate({ ...baseValues, sunExposure: 'minimal' }), 'btuRequired')), 10800);
    });
  });

  describe('Insulation', () => {
    it('poor insulation increases BTU requirement', () => {
      near(parseNumber(getValue(config.calculate({ ...baseValues, insulation: 'poor' }), 'btuRequired')), 14400);
    });

    it('good insulation decreases BTU requirement', () => {
      near(parseNumber(getValue(config.calculate({ ...baseValues, insulation: 'good' }), 'btuRequired')), 10800);
    });
  });

  describe('Ceiling Height', () => {
    it('tall ceiling scales with volume (9-10 ft = 1.2)', () => {
      near(parseNumber(getValue(config.calculate({ ...baseValues, ceilingHeight: '9' }), 'btuRequired')), 14400);
    });

    it('high ceiling (12 ft = 1.5, volume 12/8)', () => {
      near(parseNumber(getValue(config.calculate({ ...baseValues, ceilingHeight: '12' }), 'btuRequired')), 18000);
    });
  });

  describe('Heating vs Cooling', () => {
    it('heating has no 0.85 derate and uses its own table', () => {
      near(parseNumber(getValue(config.calculate({ ...baseValues, purpose: 'heating' }), 'btuRequired')), 8000);
    });

    it('cooling uses the cooling table', () => {
      near(parseNumber(getValue(config.calculate({ ...baseValues, purpose: 'cooling' }), 'btuRequired')), 12000);
    });
  });

  describe('People Count', () => {
    it('occupants beyond two add 600 BTU/h each (cooling)', () => {
      near(parseNumber(getValue(config.calculate({ ...baseValues, people: '4' }), 'btuRequired')), 13200); // 12,000 + 2 x 600
      near(parseNumber(getValue(config.calculate({ ...baseValues, people: '2' }), 'btuRequired')), 12000);
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
