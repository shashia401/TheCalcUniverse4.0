import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/proportion-calculator/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Proportion Calculator', () => {
  it('solves for d: d = (b × c) / a', () => {
    const r = config.calculate({ a: '2', b: '3', c: '6', d: '' });
    expect(getValue(r, 'result')).toBe('9');
  });

  it('solves for c: c = (a × d) / b', () => {
    const r = config.calculate({ a: '2', b: '3', c: '', d: '9' });
    expect(getValue(r, 'result')).toBe('6');
  });

  it('solves for b: b = (a × d) / c', () => {
    const r = config.calculate({ a: '2', b: '', c: '6', d: '9' });
    expect(getValue(r, 'result')).toBe('3');
  });

  it('solves for a: a = (b × c) / d', () => {
    const r = config.calculate({ a: '', b: '3', c: '6', d: '9' });
    expect(getValue(r, 'result')).toBe('2');
  });

  it('returns empty for only two values (not enough info)', () => {
    const r = config.calculate({ a: '2', b: '3', c: '', d: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for empty input', () => {
    const r = config.calculate({ a: '', b: '', c: '', d: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid (non-numeric) input', () => {
    const r = config.calculate({ a: 'abc', b: 'def', c: '', d: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for zero values', () => {
    const r = config.calculate({ a: '0', b: '0', c: '1', d: '' });
    expect(r).toEqual([]);
  });

  it('handles d placeholder as ?', () => {
    const r = config.calculate({ a: '2', b: '3', c: '6', d: '?' });
    expect(getValue(r, 'result')).toBe('9');
  });

  it('shows fraction form in output', () => {
    const r = config.calculate({ a: '1', b: '2', c: '3', d: '' });
    expect(getValue(r, 'fraction')).toContain('1/2');
  });

  it('shows percentage equivalent', () => {
    const r = config.calculate({ a: '1', b: '2', c: '3', d: '' });
    expect(getValue(r, 'percentage')).toContain('%');
  });

  it('verifies correct proportion', () => {
    const r = config.calculate({ a: '1', b: '2', c: '3', d: '6' });
    expect(getValue(r, 'verification')).toContain('OK');
  });

  it('shows solution steps', () => {
    const r = config.calculate({ a: '2', b: '3', c: '6', d: '' });
    expect(getValue(r, 'solution')).toContain('d =');
  });

  it('solves 2/3 = 8/x → x = 12', () => {
    const r = config.calculate({ a: '2', b: '3', c: '8', d: '' });
    expect(getValue(r, 'result')).toBe('12');
  });

  it('works with decimal values', () => {
    const r = config.calculate({ a: '1.5', b: '2.5', c: '3', d: '' });
    near(parseNumber(getValue(r, 'result')), 5, 0.001);
  });
});
