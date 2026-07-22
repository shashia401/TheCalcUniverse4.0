import { describe, it, expect } from 'vitest';
import cronGeneratorConfig from '../../../src/calculators/devtools/cron-generator/index';
import { getValue } from '../../helpers';

describe('Cron Expression Generator', () => {
  it('generates correct expression for "Every minute" preset', () => {
    const results = cronGeneratorConfig.calculate({ preset: 'Every minute' });
    const expr = getValue(results, 'expression');
    expect(expr).toBe('* * * * *');
  });

  it('generates correct expression for "Every 5 minutes" preset', () => {
    const results = cronGeneratorConfig.calculate({ preset: 'Every 5 minutes' });
    const expr = getValue(results, 'expression');
    expect(expr).toBe('*/5 * * * *');
  });

  it('generates correct expression for "Every hour" preset', () => {
    const results = cronGeneratorConfig.calculate({ preset: 'Every hour' });
    const expr = getValue(results, 'expression');
    expect(expr).toBe('0 * * * *');
  });

  it('generates correct expression for "Daily at midnight" preset', () => {
    const results = cronGeneratorConfig.calculate({ preset: 'Daily at midnight' });
    const expr = getValue(results, 'expression');
    expect(expr).toBe('0 0 * * *');
  });

  it('generates correct expression for "Weekly on Sunday" preset', () => {
    const results = cronGeneratorConfig.calculate({ preset: 'Weekly on Sunday' });
    const expr = getValue(results, 'expression');
    expect(expr).toBe('0 0 * * 0');
  });

  it('generates correct expression for "Monthly on 1st" preset', () => {
    const results = cronGeneratorConfig.calculate({ preset: 'Monthly on 1st' });
    const expr = getValue(results, 'expression');
    expect(expr).toBe('0 0 1 * *');
  });

  it('generates custom expression with minute and hour only', () => {
    const results = cronGeneratorConfig.calculate({
      preset: 'Custom',
      minute: '30',
      hour: '9',
      dayOfMonth: '',
      month: '',
      dayOfWeek: '',
    });
    const expr = getValue(results, 'expression');
    expect(expr).toBe('30 9 * * *');
  });

  it('generates custom expression with all fields', () => {
    const results = cronGeneratorConfig.calculate({
      preset: 'Custom',
      minute: '0',
      hour: '6',
      dayOfMonth: '15',
      month: '6',
      dayOfWeek: '*',
    });
    const expr = getValue(results, 'expression');
    expect(expr).toBe('0 6 15 6 *');
  });

  it('provides human-readable description for presets', () => {
    const results = cronGeneratorConfig.calculate({ preset: 'Daily at midnight' });
    const desc = getValue(results, 'description');
    expect(desc).toBe('Daily at midnight');
  });

  it('provides human-readable description for custom', () => {
    const results = cronGeneratorConfig.calculate({
      preset: 'Custom',
      minute: '30',
      hour: '14',
      dayOfMonth: '',
      month: '',
      dayOfWeek: '',
    });
    const desc = getValue(results, 'description');
    expect(desc.toLowerCase()).toContain('14:30');
  });

  it('provides next run description', () => {
    const results = cronGeneratorConfig.calculate({ preset: 'Every minute' });
    const next = getValue(results, 'nextRun');
    expect(next).toBe('Every minute of every hour');
  });

  it('returns empty for missing custom fields', () => {
    const results = cronGeneratorConfig.calculate({
      preset: 'Custom',
      minute: '',
      hour: '',
      dayOfMonth: '',
      month: '',
      dayOfWeek: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for invalid custom minute (NaN)', () => {
    const results = cronGeneratorConfig.calculate({
      preset: 'Custom',
      minute: 'abc',
      hour: '5',
      dayOfMonth: '',
      month: '',
      dayOfWeek: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for minute out of range', () => {
    const results = cronGeneratorConfig.calculate({
      preset: 'Custom',
      minute: '60',
      hour: '5',
      dayOfMonth: '',
      month: '',
      dayOfWeek: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for hour out of range', () => {
    const results = cronGeneratorConfig.calculate({
      preset: 'Custom',
      minute: '30',
      hour: '24',
      dayOfMonth: '',
      month: '',
      dayOfWeek: '',
    });
    expect(results).toEqual([]);
  });

  it('handles missing preset gracefully', () => {
    const results = cronGeneratorConfig.calculate({});
    // Defaults to 'Every minute'
    const expr = getValue(results, 'expression');
    expect(expr).toBe('* * * * *');
  });

  it('includes all required result IDs', () => {
    const results = cronGeneratorConfig.calculate({ preset: 'Every hour' });
    const ids = results.map((r) => r.id);
    expect(ids).toContain('expression');
    expect(ids).toContain('description');
    expect(ids).toContain('nextRun');
  });

  it('has educational content with formula and explanation', () => {
    const edu = cronGeneratorConfig.educational;
    expect(edu.formula).toBeTruthy();
    expect(edu.formulaDescription).toBeTruthy();
    expect(edu.formulaDescription!.length).toBeGreaterThan(100);
    expect(edu.explanation).toBeTruthy();
    expect(edu.explanation!.length).toBeGreaterThan(300);
  });

  it('has educational variables (5 items)', () => {
    const vars = cronGeneratorConfig.educational.variables;
    expect(vars).toBeTruthy();
    expect(vars!.length).toBe(5);
  });

  it('has howToUse steps', () => {
    const howTo = cronGeneratorConfig.educational.howToUse;
    expect(howTo).toBeTruthy();
    expect(howTo!.length).toBeGreaterThanOrEqual(3);
    expect(howTo!.length).toBeLessThanOrEqual(5);
  });

  it('has FAQs (4 items)', () => {
    const faqs = cronGeneratorConfig.educational.faqs;
    expect(faqs).toBeTruthy();
    expect(faqs!.length).toBeGreaterThanOrEqual(4);
    expect(faqs!.length).toBeLessThanOrEqual(5);
    faqs!.forEach((faq) => {
      expect(faq.question).toBeTruthy();
      expect(faq.answer).toBeTruthy();
    });
  });

  it('has citations to Wikipedia and man pages', () => {
    const citations = cronGeneratorConfig.educational.citations;
    expect(citations).toBeTruthy();
    expect(citations!.length).toBeGreaterThanOrEqual(1);
    const urls = citations!.map((c) => c.url);
    expect(urls.some((u) => u.includes('wikipedia'))).toBe(true);
  });

  it('has a diagram with SVG', () => {
    const diagram = cronGeneratorConfig.educational.diagram;
    expect(diagram).toBeTruthy();
    expect(diagram!.svg).toContain('<svg');
    expect(diagram!.alt).toBeTruthy();
  });

  it('has quickReference items', () => {
    const qr = cronGeneratorConfig.educational.quickReference;
    expect(qr).toBeTruthy();
    expect(qr!.length).toBeGreaterThanOrEqual(2);
    expect(qr!.length).toBeLessThanOrEqual(4);
    qr!.forEach((item) => {
      expect(item.label).toBeTruthy();
      expect(item.value).toBeTruthy();
    });
  });

  it('has commonUses items', () => {
    const cu = cronGeneratorConfig.educational.commonUses;
    expect(cu).toBeTruthy();
    expect(cu!.length).toBeGreaterThanOrEqual(3);
    expect(cu!.length).toBeLessThanOrEqual(5);
  });
});
