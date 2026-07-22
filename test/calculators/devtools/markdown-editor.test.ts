import { describe, it, expect } from 'vitest';
import markdownConfig from '../../../src/calculators/devtools/markdown-editor/index';
import { getValue } from '../../helpers';

describe('Markdown Editor & Preview', () => {
  it('renders headings correctly (h1-h6)', () => {
    const results = markdownConfig.calculate({
      markdown: '# Heading 1\n## Heading 2\n### Heading 3',
      outputFormat: 'HTML Source',
    });
    const html = getValue(results, 'html');
    expect(html).toContain('<h1>Heading 1</h1>');
    expect(html).toContain('<h2>Heading 2</h2>');
    expect(html).toContain('<h3>Heading 3</h3>');
  });

  it('renders bold and italic text', () => {
    const results = markdownConfig.calculate({
      markdown: '**bold** and *italic*',
      outputFormat: 'HTML Source',
    });
    const html = getValue(results, 'html');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  it('renders links', () => {
    const results = markdownConfig.calculate({
      markdown: '[Click here](https://example.com)',
      outputFormat: 'HTML Source',
    });
    const html = getValue(results, 'html');
    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain('Click here');
  });

  it('renders code blocks and inline code', () => {
    const results = markdownConfig.calculate({
      markdown: '```\ncode block\n```\n and `inline code`',
      outputFormat: 'HTML Source',
    });
    const html = getValue(results, 'html');
    expect(html).toContain('<pre><code>');
    expect(html).toContain('<code>inline code</code>');
  });

  it('renders unordered lists', () => {
    const results = markdownConfig.calculate({
      markdown: '- Item 1\n- Item 2\n- Item 3',
      outputFormat: 'HTML Source',
    });
    const html = getValue(results, 'html');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Item 1</li>');
    expect(html).toContain('<li>Item 3</li>');
  });

  it('renders ordered lists', () => {
    const results = markdownConfig.calculate({
      markdown: '1. First\n2. Second\n3. Third',
      outputFormat: 'HTML Source',
    });
    const html = getValue(results, 'html');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>First</li>');
    expect(html).toContain('<li>Third</li>');
  });

  it('renders blockquotes', () => {
    const results = markdownConfig.calculate({
      markdown: '> This is a quote',
      outputFormat: 'HTML Source',
    });
    const html = getValue(results, 'html');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('This is a quote');
  });

  it('renders horizontal rules', () => {
    const results = markdownConfig.calculate({
      markdown: 'Text\n\n---\n\nMore text',
      outputFormat: 'HTML Source',
    });
    const html = getValue(results, 'html');
    expect(html).toContain('<hr');
  });

  it('reports line count', () => {
    const results = markdownConfig.calculate({
      markdown: '# Hello\n\nWorld\n\n---\n\nDone.',
      outputFormat: 'Preview',
    });
    const lineCount = parseInt(getValue(results, 'lineCount').replace(/,/g, ''), 10);
    expect(lineCount).toBe(7);
  });

  it('includes hidden markdown data for the panel', () => {
    const results = markdownConfig.calculate({
      markdown: '# Hello World',
      outputFormat: 'Preview',
    });
    const rawData = getValue(results, '_markdownData');
    const parsed = JSON.parse(rawData);
    expect(parsed.html).toContain('<h1>');
    expect(parsed.markdown).toBe('# Hello World');
  });

  it('returns empty for empty markdown', () => {
    const results = markdownConfig.calculate({ markdown: '', outputFormat: 'Preview' });
    expect(results).toEqual([]);
  });

  it('returns empty for whitespace-only markdown', () => {
    const results = markdownConfig.calculate({ markdown: '   ', outputFormat: 'Preview' });
    expect(results).toEqual([]);
  });

  it('returns only lineCount and markdownData in Preview mode', () => {
    const results = markdownConfig.calculate({
      markdown: '# Test',
      outputFormat: 'Preview',
    });
    const ids = results.map((r) => r.id);
    expect(ids).not.toContain('html');
    expect(ids).toContain('lineCount');
    expect(ids).toContain('_markdownData');
  });

  it('includes html result in HTML Source mode', () => {
    const results = markdownConfig.calculate({
      markdown: '# Test',
      outputFormat: 'HTML Source',
    });
    const ids = results.map((r) => r.id);
    expect(ids).toContain('html');
    expect(ids).toContain('lineCount');
    expect(ids).toContain('_markdownData');
  });

  it('has educational content with formula and explanation', () => {
    const edu = markdownConfig.educational;
    expect(edu.formula).toBeTruthy();
    expect(edu.formulaDescription).toBeTruthy();
    expect(edu.formulaDescription!.length).toBeGreaterThan(100);
    expect(edu.explanation).toBeTruthy();
    expect(edu.explanation!.length).toBeGreaterThan(300);
  });

  it('has educational variables (4-5 items)', () => {
    const vars = markdownConfig.educational.variables;
    expect(vars).toBeTruthy();
    expect(vars!.length).toBeGreaterThanOrEqual(4);
    expect(vars!.length).toBeLessThanOrEqual(5);
  });

  it('has howToUse steps (4-5 items)', () => {
    const howTo = markdownConfig.educational.howToUse;
    expect(howTo).toBeTruthy();
    expect(howTo!.length).toBeGreaterThanOrEqual(4);
    expect(howTo!.length).toBeLessThanOrEqual(5);
  });

  it('has FAQs', () => {
    const faqs = markdownConfig.educational.faqs;
    expect(faqs).toBeTruthy();
    expect(faqs!.length).toBeGreaterThanOrEqual(2);
    expect(faqs!.length).toBeLessThanOrEqual(5);
    faqs!.forEach((faq) => {
      expect(faq.question).toBeTruthy();
      expect(faq.answer).toBeTruthy();
    });
  });

  it('has citations', () => {
    const citations = markdownConfig.educational.citations;
    expect(citations).toBeTruthy();
    expect(citations!.length).toBeGreaterThanOrEqual(1);
    citations!.forEach((c) => {
      expect(c.source).toBeTruthy();
      expect(c.url).toMatch(/^https?:\/\//);
    });
  });

  it('has a diagram with SVG', () => {
    const diagram = markdownConfig.educational.diagram;
    expect(diagram).toBeTruthy();
    expect(diagram!.svg).toContain('<svg');
    expect(diagram!.alt).toBeTruthy();
  });
});
