import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/devtools/string-case-converter/index';

describe('String Case Converter', () => {
  it('converts to camelCase', () => {
    const r = config.calculate({ input: 'hello world example' });
    expect(r.find((x) => x.id === 'camelCase')?.value).toBe('helloWorldExample');
  });

  it('converts to PascalCase', () => {
    const r = config.calculate({ input: 'hello world example' });
    expect(r.find((x) => x.id === 'PascalCase')?.value).toBe('HelloWorldExample');
  });

  it('converts to snake_case', () => {
    const r = config.calculate({ input: 'hello world example' });
    expect(r.find((x) => x.id === 'snake_case')?.value).toBe('hello_world_example');
  });

  it('converts to kebab-case', () => {
    const r = config.calculate({ input: 'hello world example' });
    expect(r.find((x) => x.id === 'kebab-case')?.value).toBe('hello-world-example');
  });

  it('converts to UPPER CASE', () => {
    const r = config.calculate({ input: 'hello world' });
    expect(r.find((x) => x.id === 'UPPER CASE')?.value).toBe('HELLO WORLD');
  });

  it('converts to lower case', () => {
    const r = config.calculate({ input: 'HELLO WORLD' });
    expect(r.find((x) => x.id === 'lower case')?.value).toBe('hello world');
  });

  it('converts to Title Case', () => {
    const r = config.calculate({ input: 'hello world example' });
    expect(r.find((x) => x.id === 'Title Case')?.value).toBe('Hello World Example');
  });

  it('converts to Start Case', () => {
    const r = config.calculate({ input: 'hello-world_example' });
    expect(r.find((x) => x.id === 'Start Case')?.value).toBe('Hello-World_Example');
  });

  it('converts to dot.case', () => {
    const r = config.calculate({ input: 'hello world example' });
    expect(r.find((x) => x.id === 'dot.case')?.value).toBe('hello.world.example');
  });

  it('returns all 9 results', () => {
    const r = config.calculate({ input: 'test' });
    expect(r).toHaveLength(9);
    const ids = r.map((x) => x.id);
    expect(ids).toContain('camelCase');
    expect(ids).toContain('PascalCase');
    expect(ids).toContain('snake_case');
    expect(ids).toContain('kebab-case');
    expect(ids).toContain('UPPER CASE');
    expect(ids).toContain('lower case');
    expect(ids).toContain('Title Case');
    expect(ids).toContain('Start Case');
    expect(ids).toContain('dot.case');
  });

  it('returns empty for empty input', () => {
    const r = config.calculate({ input: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for whitespace-only input', () => {
    const r = config.calculate({ input: '   ' });
    expect(r).toEqual([]);
  });

  it('returns empty for missing input', () => {
    const r = config.calculate({});
    expect(r).toEqual([]);
  });

  it('handles single word input', () => {
    const r = config.calculate({ input: 'test' });
    expect(r.find((x) => x.id === 'camelCase')?.value).toBe('test');
    expect(r.find((x) => x.id === 'PascalCase')?.value).toBe('Test');
    expect(r.find((x) => x.id === 'UPPER CASE')?.value).toBe('TEST');
  });

  it('handles input with numbers', () => {
    const r = config.calculate({ input: 'hello2 world' });
    expect(r.find((x) => x.id === 'camelCase')?.value).toBe('hello2World');
  });

  it('handles input with special characters', () => {
    const r = config.calculate({ input: 'hello-world_test' });
    expect(r.find((x) => x.id === 'camelCase')?.value).toBe('helloWorldTest');
    expect(r.find((x) => x.id === 'snake_case')?.value).toBe('hello_world_test');
  });

  it('converts camelCase input correctly', () => {
    const r = config.calculate({ input: 'helloWorld' });
    expect(r.find((x) => x.id === 'snake_case')?.value).toBe('helloworld');
    expect(r.find((x) => x.id === 'UPPER CASE')?.value).toBe('HELLOWORLD');
  });

  it('has inputMode on text input', () => {
    const textInput = config.inputs.find((i) => i.id === 'input');
    expect(textInput?.inputMode).toBe('text');
  });

  it('has at least 5 FAQs', () => {
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
  });

  it('has workedExamples with scenarios and insights', () => {
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
    config.educational.workedExamples!.forEach((ex) => {
      expect(ex.scenario).toBeTruthy();
      expect(ex.inputs).toBeTruthy();
      expect(ex.insight.length).toBeGreaterThan(100);
    });
  });

  it('has proTips', () => {
    expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(4);
    config.educational.proTips!.forEach((tip) => {
      expect(tip.length).toBeGreaterThan(50);
    });
  });

  it('has limitations with real content', () => {
    expect(config.educational.limitations).toBeTruthy();
    expect(config.educational.limitations.length).toBeGreaterThan(0);
    expect(config.educational.limitations.every((l: string) => l.length > 20)).toBe(true);
  });

  it('has all required educational sections', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    expect(config.educational.explanation!.length).toBeGreaterThan(300);
    expect(config.educational.diagram).toBeTruthy();
    expect(config.educational.diagram!.svg).toBeTruthy();
    expect(config.educational.diagram!.alt).toBeTruthy();
  });
});
