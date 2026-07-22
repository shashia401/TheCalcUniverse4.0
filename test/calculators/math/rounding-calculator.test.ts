import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/rounding/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Rounding calculator', () => {
  it('rounds 74 to nearest ten = 70', () => {
    const r = config.calculate({ number: '74', place: 'ten' });
    near(parseNumber(getValue(r, 'rounded')), 70);
  });

  it('rounds 75 to nearest ten = 80 (midpoint rounds up)', () => {
    const r = config.calculate({ number: '75', place: 'ten' });
    near(parseNumber(getValue(r, 'rounded')), 80);
  });

  it('rounds 3.72 to nearest tenth = 3.7', () => {
    const r = config.calculate({ number: '3.72', place: 'tenth' });
    near(parseNumber(getValue(r, 'rounded')), 3.7);
  });

  it('rounds 3.78 to nearest tenth = 3.8', () => {
    const r = config.calculate({ number: '3.78', place: 'tenth' });
    near(parseNumber(getValue(r, 'rounded')), 3.8);
  });

  it('rounds 1250 to nearest hundred = 1300', () => {
    const r = config.calculate({ number: '1250', place: 'hundred' });
    near(parseNumber(getValue(r, 'rounded')), 1300);
  });

  it('rounds 1249 to nearest hundred = 1200', () => {
    const r = config.calculate({ number: '1249', place: 'hundred' });
    near(parseNumber(getValue(r, 'rounded')), 1200);
  });

  it('rounds 0.0045 to nearest thousandth = 0.005', () => {
    const r = config.calculate({ number: '0.0045', place: 'thousandth' });
    near(parseNumber(getValue(r, 'rounded')), 0.005);
  });

  it('rounds to nearest million', () => {
    const r = config.calculate({ number: '2750000', place: 'million' });
    near(parseNumber(getValue(r, 'rounded')), 3000000);
  });

  it('rounds to nearest thousand', () => {
    const r = config.calculate({ number: '8421', place: 'thousand' });
    near(parseNumber(getValue(r, 'rounded')), 8000);
  });

  it('rounds to nearest hundredth', () => {
    const r = config.calculate({ number: '3.14159', place: 'hundredth' });
    near(parseNumber(getValue(r, 'rounded')), 3.14);
  });

  it('rounds to nearest ten-thousandth', () => {
    const r = config.calculate({ number: '0.12345', place: 'ten-thousandth' });
    near(parseNumber(getValue(r, 'rounded')), 0.1235);
  });

  it('rounds negative numbers correctly', () => {
    const r = config.calculate({ number: '-74', place: 'ten' });
    near(parseNumber(getValue(r, 'rounded')), -70);
  });

  it('rounds negative decimal to tenth', () => {
    const r = config.calculate({ number: '-3.72', place: 'tenth' });
    near(parseNumber(getValue(r, 'rounded')), -3.7);
  });

  it('rounds exact integer to nearest unit = same value', () => {
    const r = config.calculate({ number: '42', place: 'unit' });
    near(parseNumber(getValue(r, 'rounded')), 42);
  });

  it('rounding direction is Round Down for 74 to nearest ten', () => {
    const r = config.calculate({ number: '74', place: 'ten' });
    expect(getValue(r, 'direction')).toContain('Down');
  });

  it('rounding direction is Round Up for 76 to nearest ten', () => {
    const r = config.calculate({ number: '76', place: 'ten' });
    expect(getValue(r, 'direction')).toContain('Up');
  });

  it('includes rounding data for panel', () => {
    const r = config.calculate({ number: '74', place: 'ten' });
    expect(getValue(r, '_roundingData')).toContain('direction');
  });

  it('returns empty array for NaN input', () => {
    const r = config.calculate({ number: 'abc', place: 'ten' });
    expect(r).toEqual([]);
  });

  it('returns empty array for empty string input', () => {
    const r = config.calculate({ number: '', place: 'ten' });
    expect(r).toEqual([]);
  });

  it('defaults to unit when place is not provided', () => {
    const r = config.calculate({ number: '42.7' });
    near(parseNumber(getValue(r, 'rounded')), 43);
  });

  it('shows original number in results', () => {
    const r = config.calculate({ number: '74', place: 'ten' });
    expect(getValue(r, 'original')).toBe('74');
  });

  it('handles large numbers to million', () => {
    const r = config.calculate({ number: '999999999', place: 'million' });
    near(parseNumber(getValue(r, 'rounded')), 1000000000);
  });

  it('handles zero correctly', () => {
    const r = config.calculate({ number: '0', place: 'ten' });
    near(parseNumber(getValue(r, 'rounded')), 0);
  });

  it('handles very small decimals', () => {
    const r = config.calculate({ number: '0.00005', place: 'ten-thousandth' });
    near(parseNumber(getValue(r, 'rounded')), 0.0001, 0.00001);
  });
});
