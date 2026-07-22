import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/tip-splitter/index';
import { getValue, parseMoney } from '../../helpers';

describe('Tip Calculator / Bill Splitter', () => {
  it('calculates tip and per-person split with pre-tax option', () => {
    const r = config.calculate({
      billAmount: '100',
      tipPercent: '20',
      numPeople: '2',
      taxAmount: '8',
    });
    const perPerson = parseMoney(getValue(r, 'perPersonTotal'));
    expect(perPerson).toBeGreaterThan(50);
    expect(perPerson).toBeLessThan(60);
    expect(getValue(r, 'tipAmount')).toBeTruthy();
    expect(getValue(r, 'totalBill')).toBeTruthy();
  });

  it('splits evenly among 4 people', () => {
    const r = config.calculate({
      billAmount: '200',
      tipPercent: '18',
      numPeople: '4',
      taxAmount: '0',
    });
    expect(getValue(r, 'perPersonTotal')).toContain('$');
    const tip = parseMoney(getValue(r, 'tipAmount'));
    expect(tip).toBeGreaterThan(0);
  });

  it('works with default tip percentage', () => {
    const r = config.calculate({
      billAmount: '50',
      tipPercent: '18',
      numPeople: '1',
      taxAmount: '',
    });
    expect(getValue(r, 'perPersonTotal')).toBeTruthy();
  });

  it('returns empty for invalid bill amount', () => {
    const r1 = config.calculate({
      billAmount: '',
      tipPercent: '18',
      numPeople: '2',
      taxAmount: '',
    });
    expect(r1).toEqual([]);
    const r2 = config.calculate({
      billAmount: '-5',
      tipPercent: '18',
      numPeople: '2',
      taxAmount: '',
    });
    expect(r2).toEqual([]);
  });

  it('handles single person (no split)', () => {
    const r = config.calculate({
      billAmount: '75',
      tipPercent: '15',
      numPeople: '1',
      taxAmount: '6',
    });
    const total = parseMoney(getValue(r, 'totalBill'));
    expect(total).toBeGreaterThan(75);
  });

  it('shows tip per person when splitting', () => {
    const r = config.calculate({
      billAmount: '150',
      tipPercent: '20',
      numPeople: '3',
      taxAmount: '12',
    });
    const tipPerPerson = parseMoney(getValue(r, 'perPersonTip'));
    expect(tipPerPerson).toBeGreaterThan(0);
  });
});
