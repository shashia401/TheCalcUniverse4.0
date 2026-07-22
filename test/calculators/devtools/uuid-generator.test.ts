import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/devtools/uuid-generator/index';
import { getValue } from '../../helpers';

describe('UUID v4 & ULID Generator', () => {
  it('generates UUID v4 by default with count 5', () => {
    const r = config.calculate({ format: 'uuid', count: '5' });
    expect(getValue(r, 'count')).toBe('5');
    const ids = getValue(r, 'ids').split(', ');
    expect(ids).toHaveLength(5);
    for (const id of ids) {
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    }
  });

  it('generates ULIDs', () => {
    const r = config.calculate({ format: 'ulid', count: '3' });
    expect(getValue(r, 'count')).toBe('3');
    const ids = getValue(r, 'ids').split(', ');
    expect(ids).toHaveLength(3);
    for (const id of ids) {
      expect(id).toMatch(/^[0-9A-Z]{26}$/);
    }
  });

  it('generates both UUID and ULID when format is both', () => {
    const r = config.calculate({ format: 'both', count: '2' });
    expect(getValue(r, 'count')).toBe('4');
    const ids = getValue(r, 'ids').split(', ');
    expect(ids).toHaveLength(4);
    expect(ids[0]).toMatch(/^[0-9a-f-]+$/);
    expect(ids[1]).toMatch(/^[0-9A-Z]{26}$/);
  });

  it('uses default count of 5 when count is empty', () => {
    const r = config.calculate({ format: 'uuid', count: '' });
    expect(getValue(r, 'count')).toBe('5');
  });

  it('generates 1 UUID', () => {
    const r = config.calculate({ format: 'uuid', count: '1' });
    expect(getValue(r, 'count')).toBe('1');
  });

  it('clamps count to maximum of 50', () => {
    const r = config.calculate({ format: 'uuid', count: '100' });
    expect(getValue(r, 'count')).toBe('50');
  });

  it('returns empty array for count of 0', () => {
    const r = config.calculate({ format: 'uuid', count: '0' });
    expect(r).toEqual([]);
  });

  it('returns empty array for negative count', () => {
    const r = config.calculate({ format: 'uuid', count: '-5' });
    expect(r).toEqual([]);
  });

  it('returns empty array for non-numeric count', () => {
    const r = config.calculate({ format: 'uuid', count: 'abc' });
    expect(r).toEqual([]);
  });

  it('defaults to uuid when format is empty', () => {
    const r = config.calculate({ format: '', count: '5' });
    expect(getValue(r, 'count')).toBe('5');
    const ids = getValue(r, 'ids').split(', ');
    expect(ids).toHaveLength(5);
    for (const id of ids) {
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    }
  });

  it('generates globally unique-looking UUIDs', () => {
    const r = config.calculate({ format: 'uuid', count: '10' });
    const ids = getValue(r, 'ids').split(', ');
    const unique = new Set(ids);
    expect(unique.size).toBe(10);
  });

  it('generates ULIDs with timestamp prefix', () => {
    const r = config.calculate({ format: 'ulid', count: '2' });
    const ids = getValue(r, 'ids').split(', ');
    // ULIDs should start with same characters for timestamps generated close together
    expect(ids[0].substring(0, 2)).toBeTruthy();
    expect(ids[1].substring(0, 2)).toBeTruthy();
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
