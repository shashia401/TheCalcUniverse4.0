import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/bra-size';
import { getValue } from '../../helpers';

describe('bra-size calculator', () => {
  it('underbustSnug 30, bust 33 → 30C', () => {
    const r = config.calculate({
      unit: 'in',
      underbustSnug: '30',
      bustStanding: '33',
    });
    expect(getValue(r, 'size')).toBe('30C');
    expect(getValue(r, 'bandSize')).toBe('30');
    expect(getValue(r, 'cupSize')).toBe('C');
  });

  it('underbustSnug 34, bust 36 → 34B', () => {
    const r = config.calculate({
      unit: 'in',
      underbustSnug: '34',
      bustStanding: '36',
    });
    expect(getValue(r, 'size')).toBe('34B');
    expect(getValue(r, 'bandSize')).toBe('34');
    expect(getValue(r, 'cupSize')).toBe('B');
  });

  it('missing underbustSnug returns empty', () => {
    const r = config.calculate({
      unit: 'in',
      underbustSnug: '',
      bustStanding: '33',
    });
    expect(r).toEqual([]);
  });

  it('missing bust returns empty', () => {
    const r = config.calculate({
      unit: 'in',
      underbustSnug: '30',
      bustStanding: '',
    });
    expect(r).toEqual([]);
  });

  it('sister sizes are generated', () => {
    const r = config.calculate({
      unit: 'in',
      underbustSnug: '30',
      bustStanding: '33',
    });
    const sisterRaw = getValue(r, 'sisterSizes');
    const sisters = JSON.parse(sisterRaw);
    expect(sisters.sisterDown).toBeDefined();
    expect(sisters.sisterUp).toBeDefined();
    // 30C: sister down = 28D, sister up = 32B
    expect(sisters.sisterDown.size).toBe('28D');
    expect(sisters.sisterUp.size).toBe('32B');
  });

  it('very small difference gives AA cup', () => {
    const r = config.calculate({
      unit: 'in',
      underbustSnug: '31',
      bustStanding: '30.5',
    });
    expect(getValue(r, 'cupSize')).toBe('AA');
    expect(getValue(r, 'size')).toBe('32AA');
  });

  it('result is highlighted and colored positive', () => {
    const r = config.calculate({
      unit: 'in',
      underbustSnug: '30',
      bustStanding: '33',
    });
    const sizeResult = r.find((x) => x.id === 'size');
    expect(sizeResult?.highlight).toBe(true);
    expect(sizeResult?.color).toBe('positive');
  });

  it('all three bust measurements are averaged when provided', () => {
    const r1 = config.calculate({
      unit: 'in',
      underbustSnug: '30',
      bustStanding: '33',
    });
    const r2 = config.calculate({
      unit: 'in',
      underbustSnug: '30',
      bustStanding: '33',
      bustLeaning: '35',
      bustLying: '34',
    });
    // Average = (33 + 35 + 34) / 3 = 34
    // diff = 34 - 30 = 4 → D cup
    expect(getValue(r2, 'cupSize')).toBe('D');
    // Without leaning/lying, bust is just 33, diff = 3 → C cup
    expect(getValue(r1, 'cupSize')).toBe('C');
  });

  it('band rounds to nearest even', () => {
    const r = config.calculate({
      unit: 'in',
      underbustSnug: '31.5',
      bustStanding: '34.5',
    });
    // 31.5 / 2 = 15.75 → round = 16 → 16 * 2 = 32
    expect(getValue(r, 'bandSize')).toBe('32');
  });
});
