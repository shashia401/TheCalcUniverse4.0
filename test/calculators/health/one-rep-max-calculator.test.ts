import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/one-rep-max/index';
import { getValue } from '../../helpers';

describe('One Rep Max calculator', () => {
  it('calculates 1RM using Epley formula', () => {
    const r = config.calculate({
      weight: '225',
      reps: '5',
      formula: 'epley',
    });
    const rm = parseInt(getValue(r, 'oneRepMax'));
    expect(rm).toBeGreaterThan(250);
    expect(rm).toBeLessThan(300);
  });

  it('calculates 1RM using Brzycki formula', () => {
    const r = config.calculate({
      weight: '225',
      reps: '5',
      formula: 'brzycki',
    });
    const rm = parseInt(getValue(r, 'oneRepMax'));
    expect(rm).toBeGreaterThan(240);
    expect(rm).toBeLessThan(300);
  });

  it('calculates 1RM using Lombardi formula', () => {
    const r = config.calculate({
      weight: '225',
      reps: '5',
      formula: 'lombardi',
    });
    const rm = parseInt(getValue(r, 'oneRepMax'));
    expect(rm).toBeGreaterThan(250);
  });

  it('returns all three formula estimates', () => {
    const r = config.calculate({
      weight: '135',
      reps: '10',
      formula: 'epley',
    });
    expect(getValue(r, 'epleyLine')).toContain('lbs');
    expect(getValue(r, 'brzyckiLine')).toContain('lbs');
    expect(getValue(r, 'lombardiLine')).toContain('lbs');
  });

  it('returns breakdown count', () => {
    const r = config.calculate({
      weight: '185',
      reps: '3',
      formula: 'epley',
    });
    expect(getValue(r, 'breakdownCount')).toContain('100%');
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      weight: '0', reps: '0', formula: 'epley',
    });
    expect(r).toEqual([]);
  });
});
