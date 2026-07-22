import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/currency';
import { getValue, near, parseNumber } from '../../helpers';

describe('currency-calculator', () => {
  it('same currency conversion shows 1:1 rate and formatted amount', () => {
    const r = config.calculate({
      amount: '1000',
      fromCurrency: 'USD',
      toCurrency: 'USD',
    });
    near(parseNumber(getValue(r, 'result')), 1000);
    expect(getValue(r, 'rate')).toContain('1 USD = 1.0000');
    expect(getValue(r, 'rate')).toContain('same currency');
  });

  it('different currencies shows loading state with from/to labels', () => {
    const r = config.calculate({
      amount: '500',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
    });
    expect(getValue(r, 'loading')).toBe('Fetching live exchange rate...');
    expect(getValue(r, 'from')).toBe('500 USD');
    expect(getValue(r, 'to')).toBe('EUR');
  });

  it('accepts different currency pairs like GBP to JPY', () => {
    const r = config.calculate({
      amount: '2500',
      fromCurrency: 'GBP',
      toCurrency: 'JPY',
    });
    expect(getValue(r, 'loading')).toBe('Fetching live exchange rate...');
    expect(getValue(r, 'from')).toBe('2,500 GBP');
    expect(getValue(r, 'to')).toBe('JPY');
  });

  it('zero amount returns empty array', () => {
    const r = config.calculate({
      amount: '0',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
    });
    expect(r).toEqual([]);
  });

  it('negative amount returns empty array', () => {
    const r = config.calculate({
      amount: '-100',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
    });
    expect(r).toEqual([]);
  });

  it('empty string amount returns empty array', () => {
    const r = config.calculate({
      amount: '',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
    });
    expect(r).toEqual([]);
  });

  it('whitespace-only amount returns empty array', () => {
    const r = config.calculate({
      amount: '   ',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
    });
    expect(r).toEqual([]);
  });

  it('non-numeric string amount returns empty array', () => {
    const r = config.calculate({
      amount: 'abc',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
    });
    expect(r).toEqual([]);
  });

  it('has educational content with at least 7 FAQs', () => {
    expect(config.educational).toBeDefined();
    expect(config.educational.faqs).toBeDefined();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(7);
  });

  it('has worked examples with scenario, inputs, result, and insight', () => {
    expect(config.educational.workedExamples).toBeDefined();
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
    for (const ex of config.educational.workedExamples!) {
      expect(ex.scenario.length).toBeGreaterThan(50);
      expect(ex.inputs).toBeDefined();
      expect(Object.keys(ex.inputs).length).toBeGreaterThanOrEqual(1);
      expect(ex.result.length).toBeGreaterThan(50);
      expect(ex.insight.length).toBeGreaterThan(50);
    }
  });

  it('has at least 4 pro tips', () => {
    expect(config.educational.proTips).toBeDefined();
    expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(4);
    for (const tip of config.educational.proTips!) {
      expect(tip.length).toBeGreaterThan(50);
    }
  });

  it('has limitations with real content', () => {
    expect(config.educational.limitations).toBeDefined();
    expect(config.educational.limitations.length).toBeGreaterThan(0);
    expect(config.educational.limitations.every((l: string) => l.length > 20)).toBe(true);
  });

  it('has 3 inputs with helpText on every input', () => {
    expect(config.inputs.length).toBe(3);
    for (const input of config.inputs) {
      expect(input.helpText).toBeDefined();
      expect(input.helpText!.length).toBeGreaterThan(30);
    }
  });

  it('has variables defined with at least 3 entries', () => {
    expect(config.educational.variables).toBeDefined();
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    for (const v of config.educational.variables!) {
      expect(v.symbol).toBeDefined();
      expect(v.name).toBeDefined();
      expect(v.description.length).toBeGreaterThan(20);
    }
  });
});
