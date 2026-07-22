import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/probability/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Probability Calculator', () => {
  // ── Independent events ─────────────────────────────────────────────
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

    it('P(B|A) = P(B) for independent events', () => {
      const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Independent' });
      near(parseNumber(getValue(r, 'pBGivenA')), 0.3);
    });
  });

  // ── Mutually exclusive events ─────────────────────────────────────
  describe('Mutually exclusive events', () => {
    it('P(A∩B) = 0', () => {
      const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Mutually Exclusive' });
      near(parseNumber(getValue(r, 'pAndB')), 0);
    });

    it('P(A∪B) = P(A) + P(B)', () => {
      const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Mutually Exclusive' });
      near(parseNumber(getValue(r, 'pOrB')), 0.8);
    });

    it('P(A|B) = 0 for mutually exclusive', () => {
      const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Mutually Exclusive' });
      near(parseNumber(getValue(r, 'pAGivenB')), 0);
    });

    it('P(B|A) = 0 for mutually exclusive', () => {
      const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Mutually Exclusive' });
      near(parseNumber(getValue(r, 'pBGivenA')), 0);
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────
  it('caps union at 1 for mutually exclusive events exceeding 100%', () => {
    const r = config.calculate({ pa: '0.7', pb: '0.6', type: 'Mutually Exclusive' });
    near(parseNumber(getValue(r, 'pOrB')), 1);
    const warning = r.find(x => x.id === 'warning');
    expect(warning).toBeTruthy();
  });

  it('handles zero probability event A', () => {
    const r = config.calculate({ pa: '0', pb: '0.5', type: 'Independent' });
    near(parseNumber(getValue(r, 'pAndB')), 0);
    near(parseNumber(getValue(r, 'pOrB')), 0.5);
  });

  it('handles both events certain (P=1)', () => {
    const r = config.calculate({ pa: '1', pb: '1', type: 'Independent' });
    near(parseNumber(getValue(r, 'pAndB')), 1);
    near(parseNumber(getValue(r, 'pOrB')), 1);
    near(parseNumber(getValue(r, 'pNotA')), 0);
  });

  // ── Validation ────────────────────────────────────────────────────
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

  // ── Output format ──────────────────────────────────────────────────
  it('shows probability as percentage', () => {
    const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Independent' });
    expect(getValue(r, 'paPct')).toContain('%');
  });

  it('includes all required result fields', () => {
    const r = config.calculate({ pa: '0.5', pb: '0.3', type: 'Independent' });
    expect(getValue(r, 'pa')).toBeTruthy();
    expect(getValue(r, 'pb')).toBeTruthy();
    expect(getValue(r, 'pAndB')).toBeTruthy();
    expect(getValue(r, 'pOrB')).toBeTruthy();
    expect(getValue(r, 'pNotA')).toBeTruthy();
    expect(getValue(r, 'pNotB')).toBeTruthy();
    expect(getValue(r, 'pAGivenB')).toBeTruthy();
    expect(getValue(r, 'pBGivenA')).toBeTruthy();
    expect(getValue(r, 'eventType')).toBe('Independent');
  });

  // ── Educational content ───────────────────────────────────────────
  it('includes educational content fields', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.explanation).toBeTruthy();
    expect(config.educational.workedExamples).toBeTruthy();
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.faqs).toBeTruthy();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.proTips).toBeTruthy();
    expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.quickReference).toBeTruthy();
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(5);
  });

  it('has limitations with real content', () => {
    expect(config.educational.limitations.length).toBeGreaterThan(0);
    expect(config.educational.limitations.every((l: string) => l.length > 20)).toBe(true);
  });

  it('all number inputs have inputMode defined', () => {
    for (const input of config.inputs) {
      if (input.type === 'number') {
        expect(input.inputMode).toBeDefined();
      }
    }
  });

  it('has commonUses with real applications', () => {
    expect(config.educational.commonUses).toBeTruthy();
    expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(4);
  });
});
