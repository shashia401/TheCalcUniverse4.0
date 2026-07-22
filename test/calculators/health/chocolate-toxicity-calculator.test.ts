import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/chocolate-toxicity/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Chocolate Toxicity Calculator', () => {
  it('calculates milk chocolate toxicity correctly', () => {
    const r = config.calculate({
      dogWeight: '20',
      weightUnit: 'lbs',
      chocolateType: 'Milk',
      amountEaten: '100',
      amountUnit: 'g',
    });
    // theobromine: 100 * 2.4 = 240mg
    // caffeine: 100 * 0.2 = 20mg
    // total: 260mg
    // weightKg: 20/2.205 = 9.07
    near(parseNumber(getValue(r, 'theobromineMg')), 240, 0.1);
    near(parseNumber(getValue(r, 'caffeineMg')), 20, 0.1);
    near(parseNumber(getValue(r, 'totalMethylxanthines')), 260, 0.1);
  });

  it('calculates mgPerKg correctly for milk chocolate', () => {
    const r = config.calculate({
      dogWeight: '20',
      weightUnit: 'lbs',
      chocolateType: 'Milk',
      amountEaten: '100',
      amountUnit: 'g',
    });
    // total = 260mg, weightKg = 20/2.205 = 9.07
    // mgPerKg = 260 / 9.07 = 28.66
    const expectedMgPerKg = 260 / (20 / 2.205);
    near(parseNumber(getValue(r, 'mgPerKg')), expectedMgPerKg, 0.1);
  });

  it('shows green severity for safe amount (white chocolate, small amount)', () => {
    const r = config.calculate({
      dogWeight: '80',
      weightUnit: 'lbs',
      chocolateType: 'White',
      amountEaten: '10',
      amountUnit: 'g',
    });
    expect(getValue(r, 'severityColor')).toBe('green');
    expect(getValue(r, 'severity')).toContain('LOW RISK');
  });

  it('shows yellow for mild toxicity (milk chocolate, moderate amount)', () => {
    const r = config.calculate({
      dogWeight: '25',
      weightUnit: 'lbs',
      chocolateType: 'Milk',
      amountEaten: '150',
      amountUnit: 'g',
    });
    expect(getValue(r, 'severityColor')).toBe('yellow');
    expect(getValue(r, 'severity')).toContain('MILD');
  });

  it('shows red for serious toxicity (dark chocolate, moderate amount)', () => {
    const r = config.calculate({
      dogWeight: '10',
      weightUnit: 'lbs',
      chocolateType: 'Dark',
      amountEaten: '100',
      amountUnit: 'g',
    });
    expect(getValue(r, 'severityColor')).toBe('red');
  });

  it('shows red emergency for baking chocolate', () => {
    const r = config.calculate({
      dogWeight: '15',
      weightUnit: 'lbs',
      chocolateType: 'Baking Chocolate',
      amountEaten: '50',
      amountUnit: 'g',
    });
    expect(getValue(r, 'severityColor')).toBe('red');
    expect(getValue(r, 'severity')).toContain('EMERGENCY');
  });

  it('handles kilograms and ounces units correctly', () => {
    const r = config.calculate({
      dogWeight: '10',
      weightUnit: 'kg',
      chocolateType: 'Milk',
      amountEaten: '3.5',
      amountUnit: 'oz',
    });
    near(parseNumber(getValue(r, 'dogWeightKg')), 10, 0.1);
    near(parseNumber(getValue(r, 'dogWeightLbs')), 22.05, 0.1);
    // 3.5 oz = 99.22 g
    // theobromine: 99.22 * 2.4 = 238.13
    expect(parseNumber(getValue(r, 'theobromineMg'))).toBeGreaterThan(0);
  });

  it('includes ASPCA poison control number', () => {
    const r = config.calculate({
      dogWeight: '20',
      weightUnit: 'lbs',
      chocolateType: 'Milk',
      amountEaten: '50',
      amountUnit: 'g',
    });
    expect(getValue(r, 'vetPhone')).toContain('888');
  });

  it('calculates vomiting and seizure thresholds', () => {
    const r = config.calculate({
      dogWeight: '22',
      weightUnit: 'lbs',
      chocolateType: 'Dark',
      amountEaten: '30',
      amountUnit: 'g',
    });
    const weightKg = 22 / 2.205;
    near(parseNumber(getValue(r, 'vomitingThreshold')), 20 * weightKg, 0.1);
    near(parseNumber(getValue(r, 'seizureThreshold')), 60 * weightKg, 0.1);
  });

  it('returns empty for missing or zero values', () => {
    const r = config.calculate({
      dogWeight: '',
      weightUnit: 'lbs',
      chocolateType: 'Milk',
      amountEaten: '50',
      amountUnit: 'g',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for zero weight', () => {
    const r = config.calculate({
      dogWeight: '0',
      weightUnit: 'lbs',
      chocolateType: 'Milk',
      amountEaten: '50',
      amountUnit: 'g',
    });
    expect(r).toEqual([]);
  });

  it('handles cocoa powder correctly', () => {
    const r = config.calculate({
      dogWeight: '50',
      weightUnit: 'lbs',
      chocolateType: 'Cocoa Powder',
      amountEaten: '25',
      amountUnit: 'g',
    });
    // theobromine: 25 * 8.5 = 212.5mg
    // caffeine: 25 * 0.3 = 7.5mg
    near(parseNumber(getValue(r, 'theobromineMg')), 212.5, 0.1);
    near(parseNumber(getValue(r, 'caffeineMg')), 7.5, 0.1);
  });
});
