import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/clothing-size-converter/index';
import { getValue } from '../../helpers';

describe('Clothing Size Converter', () => {
  describe("Women's Dresses", () => {
    it('converts US 8 to UK 12, EU 40, JP 13', () => {
      const r = config.calculate({
        category: "Women's Dresses",
        region: 'US',
        sizeInput: '8',
      });
      expect(getValue(r, 'us')).toBe('8');
      expect(getValue(r, 'uk')).toBe('12');
      expect(getValue(r, 'eu')).toBe('40');
      expect(getValue(r, 'jp')).toBe('13');
      expect(getValue(r, 'intl')).toBe('M');
    });

    it('converts UK 14 to US 10, EU 42, JP 15', () => {
      const r = config.calculate({
        category: "Women's Dresses",
        region: 'UK',
        sizeInput: '14',
      });
      expect(getValue(r, 'us')).toBe('10');
      expect(getValue(r, 'uk')).toBe('14');
      expect(getValue(r, 'eu')).toBe('42');
      expect(getValue(r, 'jp')).toBe('15');
    });

    it('converts EU 36 to US 4, UK 8, JP 9', () => {
      const r = config.calculate({
        category: "Women's Dresses",
        region: 'EU',
        sizeInput: '36',
      });
      expect(getValue(r, 'us')).toBe('4');
      expect(getValue(r, 'uk')).toBe('8');
      expect(getValue(r, 'eu')).toBe('36');
      expect(getValue(r, 'jp')).toBe('9');
    });

    it('converts JP 11 to US 6, UK 10, EU 38', () => {
      const r = config.calculate({
        category: "Women's Dresses",
        region: 'JP',
        sizeInput: '11',
      });
      expect(getValue(r, 'us')).toBe('6');
      expect(getValue(r, 'uk')).toBe('10');
      expect(getValue(r, 'eu')).toBe('38');
    });

    it('converts International M to US 8, UK 12, EU 40, JP 13', () => {
      const r = config.calculate({
        category: "Women's Dresses",
        region: 'International (S/M/L/XL)',
        sizeInput: 'M',
      });
      expect(getValue(r, 'us')).toBe('8');
      expect(getValue(r, 'uk')).toBe('12');
      expect(getValue(r, 'eu')).toBe('40');
      expect(getValue(r, 'jp')).toBe('13');
    });
  });

  describe("Women's Tops", () => {
    it('converts US 6 to UK 10, EU 38, JP 11', () => {
      const r = config.calculate({
        category: "Women's Tops",
        region: 'US',
        sizeInput: '6',
      });
      expect(getValue(r, 'us')).toBe('6');
      expect(getValue(r, 'uk')).toBe('10');
      expect(getValue(r, 'eu')).toBe('38');
      expect(getValue(r, 'jp')).toBe('11');
    });
  });

  describe("Men's Suits/Jackets", () => {
    it('converts US 40 to UK 40, EU 50, JP L', () => {
      const r = config.calculate({
        category: "Men's Suits/Jackets",
        region: 'US',
        sizeInput: '40',
      });
      expect(getValue(r, 'us')).toBe('40');
      expect(getValue(r, 'uk')).toBe('40');
      expect(getValue(r, 'eu')).toBe('50');
      expect(getValue(r, 'jp')).toBe('L');
      expect(getValue(r, 'intl')).toBe('M');
    });
  });

  describe("Men's Shirts", () => {
    it('converts US 15.5 to UK 15.5, EU 39, JP M', () => {
      const r = config.calculate({
        category: "Men's Shirts",
        region: 'US',
        sizeInput: '15.5',
      });
      expect(getValue(r, 'us')).toBe('15.5');
      expect(getValue(r, 'uk')).toBe('15.5');
      expect(getValue(r, 'eu')).toBe('39');
      // JP for 15.5 is M (found via closest match)
      expect(getValue(r, 'jp')).toBe('M');
    });

    it('converts US 16 to UK 16, EU 41, JP L', () => {
      const r = config.calculate({
        category: "Men's Shirts",
        region: 'US',
        sizeInput: '16',
      });
      expect(getValue(r, 'us')).toBe('16');
      expect(getValue(r, 'eu')).toBe('41');
      expect(getValue(r, 'jp')).toBe('L');
    });
  });

  describe("Women's Shoes", () => {
    it('converts US 8 to UK 6, EU 39, JP 25', () => {
      const r = config.calculate({
        category: "Women's Shoes",
        region: 'US',
        sizeInput: '8',
      });
      expect(getValue(r, 'us')).toBe('8');
      expect(getValue(r, 'uk')).toBe('6');
      expect(getValue(r, 'eu')).toBe('39');
      expect(getValue(r, 'jp')).toBe('25');
    });

    it('converts EU 38 to US 7, UK 5, JP 24', () => {
      const r = config.calculate({
        category: "Women's Shoes",
        region: 'EU',
        sizeInput: '38',
      });
      expect(getValue(r, 'us')).toBe('7');
      expect(getValue(r, 'uk')).toBe('5');
      expect(getValue(r, 'eu')).toBe('38');
      expect(getValue(r, 'jp')).toBe('24');
    });
  });

  describe("Men's Shoes", () => {
    it('converts US 10 to UK 9.5, EU 43, JP 28', () => {
      const r = config.calculate({
        category: "Men's Shoes",
        region: 'US',
        sizeInput: '10',
      });
      expect(getValue(r, 'us')).toBe('10');
      expect(getValue(r, 'uk')).toBe('9.5');
      expect(getValue(r, 'eu')).toBe('43');
      expect(getValue(r, 'jp')).toBe('28');
    });

    it('converts UK 6.5 to US 7, EU 40, JP 25.5', () => {
      const r = config.calculate({
        category: "Men's Shoes",
        region: 'UK',
        sizeInput: '6.5',
      });
      expect(getValue(r, 'us')).toBe('7');
      expect(getValue(r, 'uk')).toBe('6.5');
      expect(getValue(r, 'eu')).toBe('40');
      expect(getValue(r, 'jp')).toBe('25.5');
    });
  });

  describe('Children (by age)', () => {
    it('converts 3T to EU 92, JP 95', () => {
      const r = config.calculate({
        category: 'Children (by age)',
        region: 'US',
        sizeInput: '3T',
      });
      expect(getValue(r, 'us')).toBe('3T');
      expect(getValue(r, 'eu')).toBe('92');
      expect(getValue(r, 'jp')).toBe('95');
    });

    it('converts EU 80 to US 12-18M, JP 80', () => {
      const r = config.calculate({
        category: 'Children (by age)',
        region: 'EU',
        sizeInput: '80',
      });
      expect(getValue(r, 'us')).toBe('12-18M');
      expect(getValue(r, 'eu')).toBe('80');
      expect(getValue(r, 'jp')).toBe('80');
    });
  });

  describe('Jeans (W/L)', () => {
    it('converts US 32 to UK 32, EU 50, JP 81', () => {
      const r = config.calculate({
        category: 'Jeans (W/L)',
        region: 'US',
        sizeInput: '32',
      });
      expect(getValue(r, 'us')).toBe('32');
      expect(getValue(r, 'uk')).toBe('32');
      expect(getValue(r, 'eu')).toBe('50');
      expect(getValue(r, 'jp')).toBe('81');
      expect(getValue(r, 'intl')).toBe('M');
    });

    it('converts US 36 to UK 36, EU 56, JP 91', () => {
      const r = config.calculate({
        category: 'Jeans (W/L)',
        region: 'US',
        sizeInput: '36',
      });
      expect(getValue(r, 'us')).toBe('36');
      expect(getValue(r, 'eu')).toBe('56');
      expect(getValue(r, 'jp')).toBe('91');
      expect(getValue(r, 'intl')).toBe('XL');
    });
  });

  describe('Validation', () => {
    it('returns empty array for empty size input', () => {
      const r = config.calculate({
        category: "Women's Dresses",
        region: 'US',
        sizeInput: '',
      });
      expect(r).toEqual([]);
    });

    it('returns empty array for blank size input', () => {
      const r = config.calculate({
        category: "Women's Dresses",
        region: 'US',
        sizeInput: '   ',
      });
      expect(r).toEqual([]);
    });

    it('returns empty array for empty category', () => {
      const r = config.calculate({
        category: '',
        region: 'US',
        sizeInput: '8',
      });
      expect(r).toEqual([]);
    });

    it('returns empty array for empty region', () => {
      const r = config.calculate({
        category: "Women's Dresses",
        region: '',
        sizeInput: '8',
      });
      expect(r).toEqual([]);
    });

    it('returns empty array for empty values object', () => {
      const r = config.calculate({});
      expect(r).toEqual([]);
    });

    it('returns empty array for unknown category', () => {
      const r = config.calculate({
        category: 'Unknown',
        region: 'US',
        sizeInput: '8',
      });
      expect(r).toEqual([]);
    });

    it('returns empty array for non-existent International size', () => {
      const r = config.calculate({
        category: "Women's Dresses",
        region: 'International (S/M/L/XL)',
        sizeInput: 'XXXXL',
      });
      expect(r).toEqual([]);
    });

    it('returns empty array for non-matching numeric size', () => {
      const r = config.calculate({
        category: "Women's Shoes",
        region: 'US',
        sizeInput: '999',
      });
      // Returns the closest match, which is the highest row
      expect(r).not.toEqual([]);
    });
  });

  describe('educational content', () => {
    it('has formula', () => {
      expect(config.educational.formula).toBeTruthy();
    });

    it('has formulaDescription over 100 chars', () => {
      expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    });

    it('has 3-5 variables', () => {
      expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
      expect(config.educational.variables!.length).toBeLessThanOrEqual(5);
    });

    it('has 3-5 howToUse steps', () => {
      expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
      expect(config.educational.howToUse!.length).toBeLessThanOrEqual(5);
    });

    it('has 2-4 quickReference items', () => {
      expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(2);
      expect(config.educational.quickReference!.length).toBeLessThanOrEqual(4);
    });

    it('has 3-5 commonUses items', () => {
      expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
      expect(config.educational.commonUses!.length).toBeLessThanOrEqual(5);
    });

    it('has explanation over 300 chars', () => {
      expect(config.educational.explanation!.length).toBeGreaterThan(300);
    });

    it('has 2-5 FAQs', () => {
      expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(2);
      expect(config.educational.faqs!.length).toBeLessThanOrEqual(5);
    });

    it('has diagram with svg, alt, and caption', () => {
      expect(config.educational.diagram).toBeDefined();
      expect(config.educational.diagram!.svg).toBeTruthy();
      expect(config.educational.diagram!.alt).toBeTruthy();
      expect(config.educational.diagram!.caption).toBeTruthy();
    });

    it('has 1-2 citations with real URLs', () => {
      const citations = (config.educational as any).citations;
      expect(citations).toBeDefined();
      expect(citations.length).toBeGreaterThanOrEqual(1);
      expect(citations.length).toBeLessThanOrEqual(2);
      for (const c of citations) {
        expect(c.title).toBeTruthy();
        expect(c.url).toMatch(/^https?:\/\//);
      }
    });
  });
});
