import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/devtools/json-formatter/index';
import { getValue } from '../../helpers';

describe('JSON Formatter & Validator', () => {
  it('formats valid JSON with 2-space indent', () => {
    const r = config.calculate({ jsonInput: '{"a":1,"b":2}', indentSize: '2' });
    expect(getValue(r, 'status')).toBe('Valid JSON');
    expect(getValue(r, 'formatted')).toBe('{\n  "a": 1,\n  "b": 2\n}');
    expect(getValue(r, 'charCount')).toBe('13');
    expect(getValue(r, 'lineCount')).toBe('4');
  });

  it('formats valid JSON with 4-space indent', () => {
    const r = config.calculate({ jsonInput: '{"a":1}', indentSize: '4' });
    expect(getValue(r, 'formatted')).toBe('{\n    "a": 1\n}');
  });

  it('formats valid JSON with tab indent', () => {
    const r = config.calculate({ jsonInput: '{"a":1}', indentSize: 'tab' });
    expect(getValue(r, 'formatted')).toBe('{\n\t"a": 1\n}');
  });

  it('handles nested JSON objects', () => {
    const r = config.calculate({ jsonInput: '{"a":{"b":{"c":1}}}', indentSize: '2' });
    expect(getValue(r, 'status')).toBe('Valid JSON');
    expect(getValue(r, 'lineCount')).toBe('7');
  });

  it('handles JSON arrays', () => {
    const r = config.calculate({ jsonInput: '[1,2,3]', indentSize: '2' });
    expect(getValue(r, 'status')).toBe('Valid JSON');
    expect(getValue(r, 'formatted')).toBe('[\n  1,\n  2,\n  3\n]');
  });

  it('returns empty array for empty input', () => {
    const r = config.calculate({ jsonInput: '', indentSize: '2' });
    expect(r).toEqual([]);
  });

  it('returns empty array for whitespace-only input', () => {
    const r = config.calculate({ jsonInput: '   ', indentSize: '2' });
    expect(r).toEqual([]);
  });

  it('returns error message for invalid JSON', () => {
    const r = config.calculate({ jsonInput: '{invalid}', indentSize: '2' });
    expect(getValue(r, 'status')).toContain('Invalid JSON');
  });

  it('returns error message for JSON with trailing comma', () => {
    const r = config.calculate({ jsonInput: '{"a":1,}', indentSize: '2' });
    expect(getValue(r, 'status')).toContain('Invalid JSON');
  });

  it('returns error message for single-quoted JSON', () => {
    const r = config.calculate({ jsonInput: "{'a':1}", indentSize: '2' });
    expect(getValue(r, 'status')).toContain('Invalid JSON');
  });

  it('handles very large JSON', () => {
    const large = { data: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` })) };
    const r = config.calculate({ jsonInput: JSON.stringify(large), indentSize: '2' });
    expect(getValue(r, 'status')).toBe('Valid JSON');
    expect(parseInt(getValue(r, 'lineCount'), 10)).toBeGreaterThan(100);
  });

  it('handles JSON with special characters and unicode', () => {
    const r = config.calculate({ jsonInput: '{"msg":"hello ñ ñ ñ world"}', indentSize: '2' });
    expect(getValue(r, 'status')).toBe('Valid JSON');
    expect(getValue(r, 'formatted')).toContain('ñ');
  });

  it('returns error for truncated JSON', () => {
    const r = config.calculate({ jsonInput: '{"a":1,"b"', indentSize: '2' });
    expect(getValue(r, 'status')).toContain('Invalid JSON');
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
