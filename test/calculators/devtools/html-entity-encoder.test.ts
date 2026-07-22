import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/devtools/html-entity-encoder/index';

describe('HTML Entity Encoder/Decoder', () => {
  it('encodes ampersand', () => {
    const r = config.calculate({ mode: 'encode', input: 'AT&T' });
    expect(r.find((x) => x.id === 'output')?.value).toContain('AT&amp;T');
  });

  it('encodes less-than', () => {
    const r = config.calculate({ mode: 'encode', input: 'a < b' });
    expect(r.find((x) => x.id === 'output')?.value).toContain('a &lt; b');
  });

  it('encodes greater-than', () => {
    const r = config.calculate({ mode: 'encode', input: 'a > b' });
    expect(r.find((x) => x.id === 'output')?.value).toContain('a &gt; b');
  });

  it('encodes double quotes', () => {
    const r = config.calculate({ mode: 'encode', input: 'say "hello"' });
    expect(r.find((x) => x.id === 'output')?.value).toContain('say &quot;hello&quot;');
  });

  it('encodes single quotes', () => {
    const r = config.calculate({ mode: 'encode', input: "it's" });
    expect(r.find((x) => x.id === 'output')?.value).toContain('it&#39;s');
  });

  it('encodes the full five essential characters', () => {
    const r = config.calculate({ mode: 'encode', input: '<div class="main">Tom & Jerry\'s</div>' });
    const output = r.find((x) => x.id === 'output')?.value || '';
    expect(output).toContain('&lt;');
    expect(output).toContain('&gt;');
    expect(output).toContain('&quot;');
    expect(output).toContain('&amp;');
    expect(output).toContain('&#39;');
  });

  it('decodes named entities', () => {
    const r = config.calculate({ mode: 'decode', input: 'AT&amp;T' });
    expect(r.find((x) => x.id === 'output')?.value).toBe('AT&T');
  });

  it('decodes decimal numeric entities', () => {
    const r = config.calculate({ mode: 'decode', input: '&#60;div&#62;' });
    expect(r.find((x) => x.id === 'output')?.value).toBe('<div>');
  });

  it('decodes hex numeric entities', () => {
    const r = config.calculate({ mode: 'decode', input: '&#x3C;br&#x3E;' });
    expect(r.find((x) => x.id === 'output')?.value).toBe('<br>');
  });

  it('round-trips encode then decode', () => {
    const original = '<hello> & "world"';
    const encoded = config.calculate({ mode: 'encode', input: original });
    const encodedOutput = encoded.find((x) => x.id === 'output')?.value || '';
    const decoded = config.calculate({ mode: 'decode', input: encodedOutput });
    expect(decoded.find((x) => x.id === 'output')?.value).toBe(original);
  });

  it('returns correct character counts', () => {
    const r = config.calculate({ mode: 'encode', input: '<test>' });
    expect(r.find((x) => x.id === 'originalCharCount')?.value).toBe('6');
    expect(r.find((x) => x.id === 'charCount')?.value).toBe('12');
  });

  it('returns empty for empty input', () => {
    const r = config.calculate({ mode: 'encode', input: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for missing input', () => {
    const r = config.calculate({ mode: 'encode' });
    expect(r).toEqual([]);
  });

  it('returns empty for whitespace-only input', () => {
    const r = config.calculate({ mode: 'encode', input: '   ' });
    expect(r).toEqual([]);
  });

  it('handles text with no special characters', () => {
    const r = config.calculate({ mode: 'encode', input: 'hello world' });
    expect(r.find((x) => x.id === 'output')?.value).toBe('hello world');
  });

  it('decodes multiple entity types in one string', () => {
    const r = config.calculate({
      mode: 'decode',
      input: '&amp;lt; &amp;gt; &amp;amp;',
    });
    const output = r.find((x) => x.id === 'output')?.value || '';
    // Double-encoded input decodes fully: &amp;lt; -> &lt; -> <
    // but because &amp; is decoded first (longest match), then &lt;, etc.
    expect(output).toContain('<');
    expect(output).toContain('>');
    expect(output).toContain('&');
  });

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    expect(config.educational.explanation!.length).toBeGreaterThan(300);
    expect(config.educational.diagram).toBeTruthy();
    expect(config.educational.diagram!.svg).toBeTruthy();
    expect(config.educational.diagram!.alt).toBeTruthy();
  });
});
