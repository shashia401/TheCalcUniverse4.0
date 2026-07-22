import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/devtools/code-diff/index';

describe('Code Diff Checker', () => {
  it('detects added lines', () => {
    const r = config.calculate({
      leftText: 'line1\nline2\nline3',
      rightText: 'line1\nline2\nline3\nline4',
    });
    expect(r.find((x) => x.id === 'additions')?.value).toBe('1');
    expect(r.find((x) => x.id === 'deletions')?.value).toBe('0');
    expect(r.find((x) => x.id === 'totalChanges')?.value).toBe('1');
  });

  it('detects removed lines', () => {
    const r = config.calculate({
      leftText: 'line1\nline2\nline3',
      rightText: 'line1\nline3',
    });
    expect(r.find((x) => x.id === 'additions')?.value).toBe('0');
    expect(r.find((x) => x.id === 'deletions')?.value).toBe('1');
    expect(r.find((x) => x.id === 'totalChanges')?.value).toBe('1');
  });

  it('detects both additions and deletions', () => {
    const r = config.calculate({
      leftText: 'apple\nbanana\ncherry',
      rightText: 'apple\nblueberry\ncherry\ndate',
    });
    expect(r.find((x) => x.id === 'additions')?.value).toBe('2');
    expect(r.find((x) => x.id === 'deletions')?.value).toBe('1');
    expect(r.find((x) => x.id === 'totalChanges')?.value).toBe('3');
  });

  it('returns identical lines as no changes', () => {
    const r = config.calculate({
      leftText: 'hello\nworld',
      rightText: 'hello\nworld',
    });
    expect(r.find((x) => x.id === 'additions')?.value).toBe('0');
    expect(r.find((x) => x.id === 'deletions')?.value).toBe('0');
    expect(r.find((x) => x.id === 'totalChanges')?.value).toBe('0');
  });

  it('includes _diffData with correct structure', () => {
    const r = config.calculate({
      leftText: 'a\nb',
      rightText: 'a\nc',
    });
    const diffData = r.find((x) => x.id === '_diffData')?.value;
    expect(diffData).toBeTruthy();
    const parsed = JSON.parse(diffData!);
    expect(parsed).toHaveProperty('leftLines');
    expect(parsed).toHaveProperty('rightLines');
    expect(Array.isArray(parsed.leftLines)).toBe(true);
    expect(Array.isArray(parsed.rightLines)).toBe(true);
  });

  it('returns empty state for both empty inputs', () => {
    const r = config.calculate({ leftText: '', rightText: '' });
    expect(r).toEqual([{ id: '_empty', label: '', value: '' }]);
  });

  it('returns empty state for missing inputs', () => {
    const r = config.calculate({});
    expect(r).toEqual([{ id: '_empty', label: '', value: '' }]);
  });

  it('handles single line diff', () => {
    const r = config.calculate({
      leftText: 'hello',
      rightText: 'world',
    });
    expect(r.find((x) => x.id === 'additions')?.value).toBe('1');
    expect(r.find((x) => x.id === 'deletions')?.value).toBe('1');
  });

  it('handles empty left text', () => {
    const r = config.calculate({
      leftText: '',
      rightText: 'new line',
    });
    expect(r.find((x) => x.id === 'additions')?.value).toBe('1');
    expect(r.find((x) => x.id === 'deletions')?.value).toBe('0');
  });

  it('handles empty right text', () => {
    const r = config.calculate({
      leftText: 'old line',
      rightText: '',
    });
    expect(r.find((x) => x.id === 'additions')?.value).toBe('0');
    expect(r.find((x) => x.id === 'deletions')?.value).toBe('1');
  });

  it('handles lines with special characters', () => {
    const r = config.calculate({
      leftText: 'normal line',
      rightText: 'line with <tags> & "quotes"',
    });
    expect(r.find((x) => x.id === 'additions')?.value).toBe('1');
    expect(r.find((x) => x.id === 'deletions')?.value).toBe('1');
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
