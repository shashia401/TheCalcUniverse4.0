import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/grade/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('grade-calculator', () => {
  it('computes needed grade on final correctly', () => {
    // Current=85%, Desired=90%, Weight=20% → need (90 - 85*0.8)/0.2 = (90-68)/0.2 = 110
    const r = config.calculate({ currentGrade: '85', desiredGrade: '90', examWeight: '20' });
    near(parseNumber(getValue(r, 'neededGrade')), 110, 0.1);
  });

  it('returns 0 needed when current exceeds desired', () => {
    const r = config.calculate({ currentGrade: '95', desiredGrade: '90', examWeight: '20' });
    near(parseNumber(getValue(r, 'neededGrade')), 0);
    expect(getValue(r, 'status')).toContain('already achieved');
  });

  it('handles standard scenario: Current 82%, Target 80%, Weight 25%', () => {
    const r = config.calculate({ currentGrade: '82', desiredGrade: '80', examWeight: '25' });
    const needed = parseNumber(getValue(r, 'neededGrade'));
    expect(needed).toBeLessThan(80); // Should need less than 80%
    expect(getValue(r, 'status')).toBeTruthy();
  });

  it('shows needed over 100 for impossible target', () => {
    // Current=50%, Desired=95%, Weight=15% → need extreme
    const r = config.calculate({ currentGrade: '50', desiredGrade: '95', examWeight: '15' });
    const needed = parseNumber(getValue(r, 'neededGrade'));
    expect(needed).toBeGreaterThan(100);
    expect(getValue(r, 'status')).toContain('impossible');
  });

  it('returns empty for missing inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
    expect(config.calculate({ currentGrade: '85' })).toHaveLength(0);
    expect(config.calculate({ currentGrade: 'abc', desiredGrade: '90', examWeight: '20' })).toHaveLength(0);
  });

  it('returns empty for negative exam weight', () => {
    const r = config.calculate({ currentGrade: '85', desiredGrade: '90', examWeight: '0' });
    expect(r).toHaveLength(0);
  });

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    expect(config.educational.diagram).toBeTruthy();
  });
});
