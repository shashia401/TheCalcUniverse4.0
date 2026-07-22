import { describe, it, expect } from 'vitest';
import htmlMinifierConfig from '../../../src/calculators/devtools/html-minifier/index';
import { getValue, parseNumber } from '../../helpers';

describe('HTML/CSS/JS Minifier', () => {
  it('minifies HTML by removing comments and whitespace', () => {
    const results = htmlMinifierConfig.calculate({
      codeType: 'HTML',
      code: '<!-- comment -->\n<html>\n  <body>\n    <p>Hello</p>\n  </body>\n</html>',
    });
    const minified = getValue(results, 'minified');
    expect(minified).not.toContain('<!--');
    expect(minified).not.toContain('\n');
    expect(minified).toContain('<p>Hello</p>');
    expect(minified).toMatch(/^<html>/);
  });

  it('minifies CSS by removing comments and whitespace', () => {
    const results = htmlMinifierConfig.calculate({
      codeType: 'CSS',
      code: '/* Header */\n.header {\n  color: red;\n  font-size: 14px;\n}',
    });
    const minified = getValue(results, 'minified');
    expect(minified).not.toContain('/*');
    expect(minified).not.toContain('\n');
    expect(minified).toContain('.header');
    expect(minified).toContain('color:red');
  });

  it('minifies JavaScript by removing comments', () => {
    const results = htmlMinifierConfig.calculate({
      codeType: 'JavaScript',
      code: '// greet function\nfunction greet(name) {\n  /* return greeting */\n  return "Hello, " + name;\n}',
    });
    const minified = getValue(results, 'minified');
    expect(minified).not.toContain('//');
    expect(minified).not.toContain('/*');
    expect(minified).toContain('function');
    expect(minified).toContain('return');
  });

  it('reports original and minified sizes', () => {
    const input = '<html>\n  <body>\n    <p>Test</p>\n  </body>\n</html>';
    const results = htmlMinifierConfig.calculate({
      codeType: 'HTML',
      code: input,
    });
    const originalSizeStr = getValue(results, 'originalSize');
    const minifiedSizeStr = getValue(results, 'minifiedSize');
    const originalSize = parseInt(originalSizeStr.replace(/,/g, ''), 10);
    const minifiedSize = parseInt(minifiedSizeStr.replace(/,/g, ''), 10);
    expect(originalSize).toBe(input.length);
    expect(minifiedSize).toBeLessThan(originalSize);
    expect(minifiedSize).toBeGreaterThan(0);
  });

  it('calculates savings percentage', () => {
    const input = '  <div>  </div>  ';
    const results = htmlMinifierConfig.calculate({
      codeType: 'HTML',
      code: input,
    });
    const savingsStr = getValue(results, 'savingsPercent');
    expect(savingsStr).toMatch(/%$/);
    const savings = parseFloat(savingsStr);
    expect(savings).toBeGreaterThan(0);
  });

  it('returns empty for empty code', () => {
    const results = htmlMinifierConfig.calculate({ codeType: 'HTML', code: '' });
    expect(results).toEqual([]);
  });

  it('returns empty for whitespace-only code', () => {
    const results = htmlMinifierConfig.calculate({ codeType: 'HTML', code: '   ' });
    expect(results).toEqual([]);
  });

  it('handles minimal HTML without whitespace', () => {
    const results = htmlMinifierConfig.calculate({
      codeType: 'HTML',
      code: '<p>Hello</p>',
    });
    const minified = getValue(results, 'minified');
    expect(minified).toBe('<p>Hello</p>');
  });

  it('handles CSS with multiple rules', () => {
    const results = htmlMinifierConfig.calculate({
      codeType: 'CSS',
      code: 'body { margin: 0; padding: 0; }\nh1 { color: blue; }',
    });
    const minified = getValue(results, 'minified');
    expect(minified).toContain('body');
    expect(minified).toContain('h1');
    expect(minified).toContain('margin:0');
  });

  it('handles JavaScript with functions and variables', () => {
    const results = htmlMinifierConfig.calculate({
      codeType: 'JavaScript',
      code: 'let x = 1;\nlet y = 2;\nconst sum = x + y;',
    });
    const minified = getValue(results, 'minified');
    expect(minified).toContain('let');
    expect(minified).toContain('const');
  });

  it('shows 0% savings for already-minified input', () => {
    const results = htmlMinifierConfig.calculate({
      codeType: 'CSS',
      code: 'body{margin:0;padding:0}',
    });
    const savingsStr = getValue(results, 'savingsPercent');
    const savings = parseFloat(savingsStr);
    expect(savings).toBeGreaterThanOrEqual(0);
  });

  it('includes all required result IDs', () => {
    const results = htmlMinifierConfig.calculate({
      codeType: 'HTML',
      code: '<p>Hello</p>',
    });
    const ids = results.map((r) => r.id);
    expect(ids).toContain('minified');
    expect(ids).toContain('originalSize');
    expect(ids).toContain('minifiedSize');
    expect(ids).toContain('savingsPercent');
  });

  it('has educational content with formula and explanation', () => {
    const edu = htmlMinifierConfig.educational;
    expect(edu.formula).toBeTruthy();
    expect(edu.formulaDescription).toBeTruthy();
    expect(edu.formulaDescription!.length).toBeGreaterThan(100);
    expect(edu.explanation).toBeTruthy();
    expect(edu.explanation!.length).toBeGreaterThan(300);
  });

  it('has educational variables (4 items)', () => {
    const vars = htmlMinifierConfig.educational.variables;
    expect(vars).toBeTruthy();
    expect(vars!.length).toBeGreaterThanOrEqual(3);
    expect(vars!.length).toBeLessThanOrEqual(5);
  });

  it('has howToUse steps (5 items)', () => {
    const howTo = htmlMinifierConfig.educational.howToUse;
    expect(howTo).toBeTruthy();
    expect(howTo!.length).toBe(5);
  });

  it('has FAQs', () => {
    const faqs = htmlMinifierConfig.educational.faqs;
    expect(faqs).toBeTruthy();
    expect(faqs!.length).toBeGreaterThanOrEqual(2);
    expect(faqs!.length).toBeLessThanOrEqual(5);
    faqs!.forEach((faq) => {
      expect(faq.question).toBeTruthy();
      expect(faq.answer).toBeTruthy();
    });
  });

  it('has citations to MDN and web.dev', () => {
    const citations = htmlMinifierConfig.educational.citations;
    expect(citations).toBeTruthy();
    expect(citations!.length).toBeGreaterThanOrEqual(1);
    const urls = citations!.map((c) => c.url);
    expect(urls.some((u) => u.includes('mozilla'))).toBe(true);
    expect(urls.some((u) => u.includes('web.dev'))).toBe(true);
  });

  it('has a diagram with SVG', () => {
    const diagram = htmlMinifierConfig.educational.diagram;
    expect(diagram).toBeTruthy();
    expect(diagram!.svg).toContain('<svg');
    expect(diagram!.alt).toBeTruthy();
  });

  it('has 5-7 FAQs', () => {
    const faqs = htmlMinifierConfig.educational.faqs;
    expect(faqs).toBeTruthy();
    expect(faqs!.length).toBeGreaterThanOrEqual(5);
    expect(faqs!.length).toBeLessThanOrEqual(7);
  });

  it('has 4-6 proTips', () => {
    const tips = htmlMinifierConfig.educational.proTips;
    expect(tips).toBeTruthy();
    expect(tips!.length).toBeGreaterThanOrEqual(4);
    expect(tips!.length).toBeLessThanOrEqual(6);
  });

  it('has limitations with real content', () => {
    const limit = htmlMinifierConfig.educational.limitations;
    expect(limit).toBeTruthy();
    expect(limit.length).toBeGreaterThan(0);
    expect(limit.every((l: string) => l.length > 20)).toBe(true);
  });

  it('has 2 worked examples with scenario, inputs, and insight', () => {
    const examples = htmlMinifierConfig.educational.workedExamples;
    expect(examples).toBeDefined();
    expect(examples!.length).toBeGreaterThanOrEqual(2);
    for (const ex of examples!) {
      expect(ex.scenario).toBeTruthy();
      expect(ex.inputs).toBeTruthy();
      expect(ex.insight).toBeTruthy();
      expect(ex.insight!.length).toBeGreaterThan(100);
    }
  });

  it('has 3-6 quickReference items', () => {
    const qr = htmlMinifierConfig.educational.quickReference;
    expect(qr).toBeTruthy();
    expect(qr!.length).toBeGreaterThanOrEqual(3);
    expect(qr!.length).toBeLessThanOrEqual(6);
  });
});
