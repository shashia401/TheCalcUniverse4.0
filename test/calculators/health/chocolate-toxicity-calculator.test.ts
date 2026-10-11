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

  it('matches the FAQ claim that ~3oz of milk chocolate hits the 20mg/kg mild-toxicity threshold for a 25lb dog (regression: FAQ previously said ~1oz)', () => {
    const r = config.calculate({
      dogWeight: '25',
      weightUnit: 'lbs',
      chocolateType: 'Milk',
      amountEaten: '3',
      amountUnit: 'oz',
    });
    const mgPerKg = parseNumber(getValue(r, 'mgPerKg'));
    near(mgPerKg, 20, 1.5);
  });

  it('matches the FAQ claim that ~0.5oz of baking chocolate hits the 20mg/kg mild-toxicity threshold for a 25lb dog (regression: FAQ previously said ~0.2oz)', () => {
    const r = config.calculate({
      dogWeight: '25',
      weightUnit: 'lbs',
      chocolateType: 'Baking Chocolate',
      amountEaten: '0.5',
      amountUnit: 'oz',
    });
    const mgPerKg = parseNumber(getValue(r, 'mgPerKg'));
    near(mgPerKg, 20, 1.5);
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
    const weightKg = 22 / 2.20462; // NIST: 1 kg = 2.20462 lb
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
    // Merck Veterinary Manual: cocoa powder = 28.5 mg/g methylxanthines (807 mg/oz).
    // Split used here: theobromine 26 mg/g + caffeine 2.5 mg/g -> 25 g = 650 + 62.5 = 712.5 mg
    // (the old 8.5 + 0.3 mg/g constants under-reported cocoa powder by a factor of 3.2).
    near(parseNumber(getValue(r, 'theobromineMg')), 650, 0.1);
    near(parseNumber(getValue(r, 'caffeineMg')), 62.5, 0.1);
    near(parseNumber(getValue(r, 'totalMethylxanthines')), 712.5, 0.1);
  });

  // ── Audit regressions: Merck Veterinary Manual methylxanthine content (mg/g) and dose bands ──
  it.each([
    ['White', 0.04], ['Milk', 2.3], ['Dark', 5.5], ['Baking Chocolate', 15.5], ['Cocoa Powder', 28.5],
  ])('%s chocolate total methylxanthines per gram is within 15%% of the Merck value (%f mg/g)', (chocolateType, mgPerG) => {
    const r = config.calculate({ dogWeight: '50', weightUnit: 'kg', chocolateType, amountEaten: '100', amountUnit: 'g' });
    const perG = parseNumber(getValue(r, 'totalMethylxanthines')) / 100;
    expect(perG).toBeGreaterThanOrEqual(mgPerG * 0.95);
    expect(perG).toBeLessThanOrEqual(chocolateType === 'White' ? 0.06 : mgPerG * 1.15);
  });

  it('a 10 lb dog eating 1 oz of cocoa powder (807 mg) is 177.9 mg/kg -> emergency (previously reported as ~55 mg/kg)', () => {
    // 10 lb = 4.5359 kg ; 1 oz = 28.3495 g x 28.5 mg/g = 808 mg ; 808 / 4.5359 = 178 mg/kg
    const r = config.calculate({ dogWeight: '10', weightUnit: 'lbs', chocolateType: 'Cocoa Powder', amountEaten: '1', amountUnit: 'oz' });
    expect(parseNumber(getValue(r, 'mgPerKg'))).toBeGreaterThan(170);
    expect(getValue(r, 'severity')).toContain('EMERGENCY');
  });

  it('dose bands: 19.9 mg/kg low, 20 mild, 40 serious, 60 emergency', () => {
    // 10 kg dog on baking chocolate (15.5 mg/g): grams = target mg/kg x 10 kg / 15.5
    const sev = (mgPerKg: number) =>
      getValue(config.calculate({ dogWeight: '10', weightUnit: 'kg', chocolateType: 'Baking Chocolate', amountEaten: String((mgPerKg * 10) / 15.5), amountUnit: 'g' }), 'severity');
    expect(sev(19.9)).toContain('LOW RISK');
    expect(sev(20.01)).toContain('MILD');
    expect(sev(40.01)).toContain('SERIOUS');
    expect(sev(60.01)).toContain('EMERGENCY');
  });
});
