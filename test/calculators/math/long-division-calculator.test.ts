import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/long-division/index';

describe('Long Division Calculator', () => {
  it('calculates division with quotient and remainder', () => {
    const r = config.calculate({ dividend: '4876', divisor: '12' });
    const quotient = r.find((x) => x.id === 'quotient');
    const remainder = r.find((x) => x.id === 'remainder');
    expect(quotient).toBeTruthy();
    expect(remainder).toBeTruthy();
    expect(quotient!.value).toBe('406');
    expect(remainder!.value).toBe('4');
  });

  it('shows decimal result', () => {
    const r = config.calculate({ dividend: '4876', divisor: '12' });
    const decimal = r.find((x) => x.id === 'decimalResult');
    expect(decimal).toBeTruthy();
    expect(decimal!.value).toContain('.');
  });

  it('handles exact division with no remainder', () => {
    const r = config.calculate({ dividend: '100', divisor: '5' });
    const quotient = r.find((x) => x.id === 'quotient');
    const remainder = r.find((x) => x.id === 'remainder');
    expect(quotient!.value).toBe('20');
    expect(remainder!.value).toBe('0');
  });

  it('handles dividend smaller than divisor', () => {
    const r = config.calculate({ dividend: '5', divisor: '12' });
    const quotient = r.find((x) => x.id === 'quotient');
    const remainder = r.find((x) => x.id === 'remainder');
    expect(quotient!.value).toBe('0');
    expect(remainder!.value).toBe('5');
  });

  it('handles negative dividend', () => {
    const r = config.calculate({ dividend: '-100', divisor: '5' });
    const quotient = r.find((x) => x.id === 'quotient');
    expect(quotient!.value).toBe('-20');
  });

  it('handles negative divisor', () => {
    const r = config.calculate({ dividend: '100', divisor: '-5' });
    const quotient = r.find((x) => x.id === 'quotient');
    // Negative/negative = positive
    // Wait, this is 100 / -5, should be negative
    expect(quotient!.value).toBe('-20');
  });

  it('returns empty array for division by zero', () => {
    const r = config.calculate({ dividend: '100', divisor: '0' });
    expect(r).toEqual([]);
  });

  it('returns empty array for missing dividend', () => {
    const r = config.calculate({ dividend: '', divisor: '5' });
    expect(r).toEqual([]);
  });

  it('returns empty array for missing divisor', () => {
    const r = config.calculate({ dividend: '100', divisor: '' });
    expect(r).toEqual([]);
  });

  it('returns empty array for NaN dividend', () => {
    const r = config.calculate({ dividend: 'abc', divisor: '5' });
    expect(r).toEqual([]);
  });

  it('handles large numbers', () => {
    const r = config.calculate({ dividend: '1000000', divisor: '7' });
    const quotient = r.find((x) => x.id === 'quotient');
    expect(quotient).toBeTruthy();
    expect(parseInt(quotient!.value)).toBeGreaterThan(100000);
  });

  it('includes division steps data', () => {
    const r = config.calculate({ dividend: '48', divisor: '12' });
    const stepsData = r.find((x) => x.id === 'divisionData');
    expect(stepsData).toBeTruthy();
    const parsed = JSON.parse(stepsData!.value);
    expect(parsed.dividend).toBe(48);
    expect(parsed.divisor).toBe(12);
    expect(parsed.quotient).toBe(4);
    expect(parsed.steps).toBeInstanceOf(Array);
    expect(parsed.steps.length).toBeGreaterThan(0);
  });

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(50);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.explanation!.length).toBeGreaterThan(300);
    expect(config.educational.diagram).toBeTruthy();
    expect(config.educational.diagram!.svg).toBeTruthy();
    expect(config.educational.diagram!.alt).toBeTruthy();
  });
});
