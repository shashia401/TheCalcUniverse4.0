import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/devtools/qr-code-generator/index';
import { getValue } from '../../helpers';

describe('QR Code Generator', () => {
  it('generates QR code info for text content', () => {
    const r = config.calculate({ content: 'Hello World', size: '200' });
    expect(getValue(r, 'info')).toContain('QR code generated for: Hello World');
    expect(getValue(r, '_qrData')).toBeTruthy();
  });

  it('generates QR code info for URL content', () => {
    const r = config.calculate({ content: 'https://example.com', size: '200' });
    expect(getValue(r, 'info')).toContain('QR code generated for: https://example.com');
  });

  it('uses default size of 200 when size is empty', () => {
    const r = config.calculate({ content: 'test', size: '' });
    const qrData = JSON.parse(getValue(r, '_qrData'));
    expect(qrData.size).toBe(200);
  });

  it('uses custom size', () => {
    const r = config.calculate({ content: 'test', size: '300' });
    const qrData = JSON.parse(getValue(r, '_qrData'));
    expect(qrData.size).toBe(300);
  });

  it('clamps size to minimum of 100', () => {
    const r = config.calculate({ content: 'test', size: '50' });
    const qrData = JSON.parse(getValue(r, '_qrData'));
    expect(qrData.size).toBe(100);
  });

  it('clamps size to maximum of 500', () => {
    const r = config.calculate({ content: 'test', size: '1000' });
    const qrData = JSON.parse(getValue(r, '_qrData'));
    expect(qrData.size).toBe(500);
  });

  it('generates correct image URL', () => {
    const r = config.calculate({ content: 'hello', size: '200' });
    const qrData = JSON.parse(getValue(r, '_qrData'));
    expect(qrData.imageUrl).toContain('api.qrserver.com');
    expect(qrData.imageUrl).toContain('size=200x200');
    expect(qrData.imageUrl).toContain('data=hello');
  });

  it('URL-encodes content in image URL', () => {
    const r = config.calculate({ content: 'hello world', size: '200' });
    const qrData = JSON.parse(getValue(r, '_qrData'));
    expect(qrData.imageUrl).toContain('hello%20world');
  });

  it('returns empty array for empty content', () => {
    const r = config.calculate({ content: '', size: '200' });
    expect(r).toEqual([]);
  });

  it('returns empty array for whitespace-only content', () => {
    const r = config.calculate({ content: '   ', size: '200' });
    expect(r).toEqual([]);
  });

  it('truncates content preview to 40 characters in info', () => {
    const longContent = 'a'.repeat(100);
    const r = config.calculate({ content: longContent, size: '200' });
    expect(getValue(r, 'info')).toContain('...');
    expect(getValue(r, 'info').length).toBeLessThan(100);
  });

  it('handles non-numeric size gracefully', () => {
    const r = config.calculate({ content: 'test', size: 'abc' });
    const qrData = JSON.parse(getValue(r, '_qrData'));
    expect(qrData.size).toBe(200);
  });

  it('stores content in _qrData', () => {
    const r = config.calculate({ content: 'my content', size: '150' });
    const qrData = JSON.parse(getValue(r, '_qrData'));
    expect(qrData.content).toBe('my content');
    expect(qrData.size).toBe(150);
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
