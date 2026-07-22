import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/devtools/color-converter/index';
import { getValue } from '../../helpers';

describe('Color Converter (devtools)', () => {
  describe('HEX → RGB/HSL', () => {
    it('converts #FF5733 to RGB and HSL', () => {
      const r = config.calculate({ mode: 'HEX → RGB/HSL', hexInput: '#FF5733' });
      expect(getValue(r, 'hex')).toBe('#FF5733');
      expect(getValue(r, 'rgb')).toBe('rgb(255, 87, 51)');
      const hsl = getValue(r, 'hsl');
      expect(hsl).toMatch(/^hsl\(/);
      expect(hsl).toContain('100%');
      expect(hsl).toContain('60%');
    });

    it('accepts hex without # prefix', () => {
      const r = config.calculate({ mode: 'HEX → RGB/HSL', hexInput: 'FF5733' });
      expect(getValue(r, 'hex')).toBe('#FF5733');
      expect(getValue(r, 'rgb')).toBe('rgb(255, 87, 51)');
    });

    it('handles black (#000000)', () => {
      const r = config.calculate({ mode: 'HEX → RGB/HSL', hexInput: '#000000' });
      expect(getValue(r, 'hex')).toBe('#000000');
      expect(getValue(r, 'rgb')).toBe('rgb(0, 0, 0)');
    });

    it('handles white (#FFFFFF)', () => {
      const r = config.calculate({ mode: 'HEX → RGB/HSL', hexInput: '#FFFFFF' });
      expect(getValue(r, 'rgb')).toBe('rgb(255, 255, 255)');
      expect(getValue(r, 'hsl')).toContain('100%');
    });

    it('returns empty array for empty hex input', () => {
      const r = config.calculate({ mode: 'HEX → RGB/HSL', hexInput: '' });
      expect(r).toEqual([]);
    });

    it('returns empty array for invalid hex characters', () => {
      const r = config.calculate({ mode: 'HEX → RGB/HSL', hexInput: '#GGGGGG' });
      expect(r).toEqual([]);
    });

    it('returns empty array for short hex string', () => {
      const r = config.calculate({ mode: 'HEX → RGB/HSL', hexInput: '#FFF' });
      expect(r).toEqual([]);
    });
  });

  describe('RGB → HEX/HSL', () => {
    it('converts RGB(255, 87, 51) to HEX and HSL', () => {
      const r = config.calculate({ mode: 'RGB → HEX/HSL', r: '255', g: '87', b: '51' });
      expect(getValue(r, 'hex')).toBe('#FF5733');
      expect(getValue(r, 'rgb')).toBe('rgb(255, 87, 51)');
    });

    it('converts RGB(0, 128, 255) correctly', () => {
      const r = config.calculate({ mode: 'RGB → HEX/HSL', r: '0', g: '128', b: '255' });
      expect(getValue(r, 'hex')).toBe('#0080FF');
    });

    it('handles pure colors (red, green, blue)', () => {
      let r = config.calculate({ mode: 'RGB → HEX/HSL', r: '255', g: '0', b: '0' });
      expect(getValue(r, 'hex')).toBe('#FF0000');

      r = config.calculate({ mode: 'RGB → HEX/HSL', r: '0', g: '255', b: '0' });
      expect(getValue(r, 'hex')).toBe('#00FF00');

      r = config.calculate({ mode: 'RGB → HEX/HSL', r: '0', g: '0', b: '255' });
      expect(getValue(r, 'hex')).toBe('#0000FF');
    });

    it('returns empty array for missing RGB values', () => {
      const r = config.calculate({ mode: 'RGB → HEX/HSL', r: '', g: '87', b: '51' });
      expect(r).toEqual([]);
    });

    it('returns empty array for RGB out of range', () => {
      const r1 = config.calculate({ mode: 'RGB → HEX/HSL', r: '300', g: '0', b: '0' });
      expect(r1).toEqual([]);

      const r2 = config.calculate({ mode: 'RGB → HEX/HSL', r: '-5', g: '100', b: '100' });
      expect(r2).toEqual([]);
    });

    it('returns empty array for non-numeric RGB', () => {
      const r = config.calculate({ mode: 'RGB → HEX/HSL', r: 'abc', g: '100', b: '100' });
      expect(r).toEqual([]);
    });
  });

  describe('HSL → HEX/RGB', () => {
    it('converts HSL(0, 100%, 50%) to #FF0000 (pure red)', () => {
      const r = config.calculate({ mode: 'HSL → HEX/RGB', h: '0', s: '100', l: '50' });
      expect(getValue(r, 'hex')).toBe('#FF0000');
      expect(getValue(r, 'rgb')).toBe('rgb(255, 0, 0)');
    });

    it('converts HSL(120, 100%, 50%) to #00FF00 (pure green)', () => {
      const r = config.calculate({ mode: 'HSL → HEX/RGB', h: '120', s: '100', l: '50' });
      expect(getValue(r, 'hex')).toBe('#00FF00');
    });

    it('converts HSL(240, 100%, 50%) to #0000FF (pure blue)', () => {
      const r = config.calculate({ mode: 'HSL → HEX/RGB', h: '240', s: '100', l: '50' });
      expect(getValue(r, 'hex')).toBe('#0000FF');
    });

    it('converts HSL(60, 100%, 50%) to #FFFF00 (yellow)', () => {
      const r = config.calculate({ mode: 'HSL → HEX/RGB', h: '60', s: '100', l: '50' });
      expect(getValue(r, 'hex')).toBe('#FFFF00');
    });

    it('handles zero saturation (grayscale)', () => {
      const r = config.calculate({ mode: 'HSL → HEX/RGB', h: '0', s: '0', l: '50' });
      const rgb = getValue(r, 'rgb');
      expect(rgb).toMatch(/rgb\((\d+),\s*\1,\s*\1\)/);
    });

    it('returns empty array for missing HSL values', () => {
      const r = config.calculate({ mode: 'HSL → HEX/RGB', h: '', s: '100', l: '50' });
      expect(r).toEqual([]);
    });

    it('returns empty array for HSL out of range', () => {
      const r1 = config.calculate({ mode: 'HSL → HEX/RGB', h: '400', s: '100', l: '50' });
      expect(r1).toEqual([]);

      const r2 = config.calculate({ mode: 'HSL → HEX/RGB', h: '200', s: '150', l: '50' });
      expect(r2).toEqual([]);
    });

    it('returns empty array for non-numeric HSL', () => {
      const r = config.calculate({ mode: 'HSL → HEX/RGB', h: 'abc', s: '100', l: '50' });
      expect(r).toEqual([]);
    });
  });

  describe('Mode validation', () => {
    it('returns empty array for empty mode', () => {
      const r = config.calculate({ mode: '', hexInput: '#FF0000' });
      expect(r).toEqual([]);
    });

    it('returns empty array for empty values object', () => {
      const r = config.calculate({});
      expect(r).toEqual([]);
    });

    it('returns empty array for invalid mode', () => {
      const r = config.calculate({ mode: 'INVALID' });
      expect(r).toEqual([]);
    });
  });

  describe('ShowWhen logic', () => {
    it('shows hexInput only when mode is HEX → RGB/HSL', () => {
      const hexField = config.inputs.find((i) => i.id === 'hexInput')!;
      expect(hexField.showWhen!({ mode: 'HEX → RGB/HSL' })).toBe(true);
      expect(hexField.showWhen!({ mode: 'RGB → HEX/HSL' })).toBe(false);
      expect(hexField.showWhen!({ mode: 'HSL → HEX/RGB' })).toBe(false);
    });

    it('shows RGB fields only when mode is RGB → HEX/HSL', () => {
      const rField = config.inputs.find((i) => i.id === 'r')!;
      expect(rField.showWhen!({ mode: 'RGB → HEX/HSL' })).toBe(true);
      expect(rField.showWhen!({ mode: 'HEX → RGB/HSL' })).toBe(false);
    });

    it('shows HSL fields only when mode is HSL → HEX/RGB', () => {
      const hField = config.inputs.find((i) => i.id === 'h')!;
      expect(hField.showWhen!({ mode: 'HSL → HEX/RGB' })).toBe(true);
      expect(hField.showWhen!({ mode: 'RGB → HEX/HSL' })).toBe(false);
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
