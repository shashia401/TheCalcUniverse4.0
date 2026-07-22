import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/probability/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Probability calculator', () => {
  describe('Independent events', () => {
    it('calculates P(A∩B) = P(A) × P(B)', () => {
      const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Independent' });
      near(parseNumber(getValue(r, 'pAndB')), 0.15);
    });

    it('calculates P(A∪B) = P(A) + P(B) − P(A∩B)', () => {
      const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Independent' });
      near(parseNumber(getValue(r, 'pOrB')), 0.65);
    });

    it('calculates P(¬A) = 1 − P(A)', () => {
      const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Independent' });
      near(parseNumber(getValue(r, 'pNotA')), 0.5);
    });

    it('calculates P(¬B) = 1 − P(B)', () => {
      const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Independent' });
      near(parseNumber(getValue(r, 'pNotB')), 0.7);
    });

    it('P(A|B) = P(A) for independent events', () => {
      const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Independent' });
      near(parseNumber(getValue(r, 'pAGivenB')), 0.5);
    });
  });

  describe('Mutually exclusive events', () => {
    it('P(A∩B) = 0', () => {
      const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Mutually Exclusive' });
      near(parseNumber(getValue(r, 'pAndB')), 0);
    });

    it('P(A∪B) = P(A) + P(B)', () => {
      const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Mutually Exclusive' });
      near(parseNumber(getValue(r, 'pOrB')), 0.8);
    });

    it('P(A|B) = 0', () => {
      const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Mutually Exclusive' });
      near(parseNumber(getValue(r, 'pAGivenB')), 0);
    });
  });

  describe('Validation', () => {
    it('returns empty for values < 0', () => {
      const r = config.calculate({ pa: '-0.1', pb: '0.5', type: 'Independent' });
      expect(r).toEqual([]);
    });

    it('returns empty for values > 1', () => {
      const r = config.calculate({ pa: '1.5', pb: '0.5', type: 'Independent' });
      expect(r).toEqual([]);
    });

    it('returns empty for NaN input', () => {
      const r = config.calculate({ pa: 'abc', pb: '0.5', type: 'Independent' });
      expect(r).toEqual([]);
    });
  });

  it('shows probability as percentage', () => {
    const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Independent' });
    expect(getValue(r, 'paPct')).toContain('%');
  });

  it('includes all result fields', () => {
    const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Independent' });
    expect(getValue(r, 'pa')).toBeTruthy();
    expect(getValue(r, 'pb')).toBeTruthy();
    expect(getValue(r, 'pAndB')).toBeTruthy();
    expect(getValue(r, 'pOrB')).toBeTruthy();
    expect(getValue(r, 'pNotA')).toBeTruthy();
    expect(getValue(r, 'pNotB')).toBeTruthy();
    expect(getValue(r, 'pAGivenB')).toBeTruthy();
    expect(getValue(r, 'eventType')).toBe('Independent');
  });
});
