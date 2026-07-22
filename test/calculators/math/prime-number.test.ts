import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/prime-number/index';
import { getValue } from '../../helpers';

describe('Prime Number calculator', () => {
  it('identifies 2 as prime', () => {
    const r = config.calculate({ n: '2' });
    expect(getValue(r, 'isPrime')).toBe('Yes');
    expect(getValue(r, 'divisorCount')).toBe('2');
  });

  it('identifies 3 as prime', () => {
    const r = config.calculate({ n: '3' });
    expect(getValue(r, 'isPrime')).toBe('Yes');
    expect(getValue(r, 'divisorCount')).toBe('2');
  });

  it('identifies 17 as prime', () => {
    const r = config.calculate({ n: '17' });
    expect(getValue(r, 'isPrime')).toBe('Yes');
    expect(getValue(r, 'divisorCount')).toBe('2');
  });

  it('identifies 97 as prime', () => {
    const r = config.calculate({ n: '97' });
    expect(getValue(r, 'isPrime')).toBe('Yes');
    expect(getValue(r, 'divisorCount')).toBe('2');
  });

  it('identifies 4 as composite with prime factors', () => {
    const r = config.calculate({ n: '4' });
    expect(getValue(r, 'isPrime')).toBe('No');
    expect(getValue(r, 'factors')).toBe('2, 2');
    expect(getValue(r, 'divisorCount')).toBe('3'); // 1, 2, 4
  });

  it('identifies 12 as composite with correct factors', () => {
    const r = config.calculate({ n: '12' });
    expect(getValue(r, 'isPrime')).toBe('No');
    expect(getValue(r, 'factors')).toBe('2, 2, 3');
    expect(getValue(r, 'divisorCount')).toBe('6'); // 1, 2, 3, 4, 6, 12
  });

  it('identifies 100 as composite', () => {
    const r = config.calculate({ n: '100' });
    expect(getValue(r, 'isPrime')).toBe('No');
    expect(getValue(r, 'factors')).toBe('2, 2, 5, 5');
    expect(getValue(r, 'divisorCount')).toBe('9'); // 1, 2, 4, 5, 10, 20, 25, 50, 100
  });

  it('shows primality check steps for a prime', () => {
    const r = config.calculate({ n: '7' });
    const steps = getValue(r, 'primalityCheck');
    expect(steps).toContain('prime');
  });

  it('shows primality check steps for a composite', () => {
    const r = config.calculate({ n: '15' });
    const steps = getValue(r, 'primalityCheck');
    expect(steps).toContain('composite');
  });

  it('handles a large prime efficiently', () => {
    const r = config.calculate({ n: '999983' }); // a known large prime
    expect(getValue(r, 'isPrime')).toBe('Yes');
  });

  it('handles a composite number near the max', () => {
    const r = config.calculate({ n: '9999999' });
    expect(getValue(r, 'isPrime')).toBe('No');
  });

  it('returns empty for n < 2', () => {
    expect(config.calculate({ n: '1' })).toEqual([]);
    expect(config.calculate({ n: '0' })).toEqual([]);
    expect(config.calculate({ n: '-5' })).toEqual([]);
  });

  it('returns empty for invalid input', () => {
    expect(config.calculate({ n: 'abc' })).toEqual([]);
    expect(config.calculate({ n: '' })).toEqual([]);
  });

  it('returns empty for number exceeding max', () => {
    expect(config.calculate({ n: '10000001' })).toEqual([]);
  });

  it('calculates divisor count of a prime correctly', () => {
    const r = config.calculate({ n: '7919' }); // 1000th prime
    expect(getValue(r, 'isPrime')).toBe('Yes');
    expect(getValue(r, 'divisorCount')).toBe('2');
  });
});
