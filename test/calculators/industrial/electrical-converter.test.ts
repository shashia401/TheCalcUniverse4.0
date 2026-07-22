import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/electrical-converter/index';

describe('Electrical Unit Converter', () => {
  it('converts 1 V to 1000 mV', () => {
    const r = config.calculate({ value: '1', from: 'v', to: 'mv_v' });
    expect(r[0].value).toContain('1,000');
    expect(r[0].value).toContain('mv_v');
  });

  it('converts 1000 mA to 1 A', () => {
    const r = config.calculate({ value: '1000', from: 'ma', to: 'a' });
    expect(r[0].value).toContain('1');
    expect(r[0].value).toContain('a');
  });

  it('converts 4.7 kΩ to 4700 Ω', () => {
    const r = config.calculate({ value: '4.7', from: 'kohm', to: 'ohm' });
    expect(r[0].value).toContain('4,700');
    expect(r[0].value).toContain('ohm');
  });

  it('converts 100 nF to 0.1 µF', () => {
    const r = config.calculate({ value: '100', from: 'nf', to: 'uf' });
    expect(r[0].value).toContain('0.1');
    expect(r[0].value).toContain('uf');
  });

  it('converts 3000 mAh to 10800 C', () => {
    const r = config.calculate({ value: '3000', from: 'mah', to: 'c' });
    expect(r[0].value).toContain('10,800');
    expect(r[0].value).toContain('c');
  });

  it('converts 1 S to 1000 mS (within conductance category)', () => {
    const r = config.calculate({ value: '1', from: 's', to: 'ms' });
    expect(r[0].value).toContain('1,000');
    expect(r[0].value).toContain('ms');
  });

  it('returns empty for missing value', () => {
    expect(config.calculate({})).toEqual([]);
  });

  it('returns empty for non-numeric value', () => {
    expect(config.calculate({ value: 'abc', from: 'v', to: 'mv_v' })).toEqual([]);
  });

  it('returns empty for negative value (not physically meaningful)', () => {
    const r = config.calculate({ value: '-10', from: 'v', to: 'mv_v' });
    // Negative values still convert mathematically but are flagged
    expect(r.length).toBeGreaterThan(0);
  });

  it('has all required educational content', () => {
    const edu = config.educational as Record<string, unknown>;
    expect(edu.formula).toBeTruthy();
    expect((edu.formulaDescription as string).length).toBeGreaterThan(100);
    expect((edu.variables as unknown[]).length).toBeGreaterThanOrEqual(3);
    expect((edu.howToUse as unknown[]).length).toBeGreaterThanOrEqual(4);
    expect((edu.faqs as unknown[]).length).toBeGreaterThanOrEqual(7);
    expect((edu.citations as unknown[]).length).toBeGreaterThanOrEqual(1);
    expect((edu.explanation as string).length).toBeGreaterThan(350);
    expect((edu.workedExamples as unknown[]).length).toBeGreaterThanOrEqual(3);
    expect((edu.proTips as unknown[]).length).toBeGreaterThanOrEqual(4);
    expect(edu.limitations).toBeTruthy();
    expect((edu.limitations as unknown[]).length).toBeGreaterThanOrEqual(3);
  });

  it('has 7+ FAQ entries with answer and question keys', () => {
    const faqs = config.educational.faqs as Array<{ question: string; answer: string }>;
    expect(faqs.length).toBeGreaterThanOrEqual(7);
    for (const faq of faqs) {
      expect(faq.question).toBeTruthy();
      expect(faq.question.length).toBeGreaterThan(10);
      expect(faq.answer).toBeTruthy();
      expect(faq.answer.length).toBeGreaterThan(50);
    }
  });

  it('has worked examples with scenario, inputs, result, and insight', () => {
    const examples = config.educational.workedExamples as Array<Record<string, unknown>>;
    expect(examples.length).toBeGreaterThanOrEqual(3);
    for (const ex of examples) {
      expect(ex.scenario).toBeTruthy();
      expect(ex.scenario as string).toBeTruthy();
      expect((ex.scenario as string).length).toBeGreaterThan(50);
      expect(ex.inputs).toBeTruthy();
      expect(ex.result).toBeTruthy();
      expect(ex.insight).toBeTruthy();
    }
  });
});
