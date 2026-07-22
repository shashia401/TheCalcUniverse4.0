import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/engine-horsepower/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Engine Horsepower calculator (Torque/RPM)', () => {
  // 350 lb-ft at 5500 RPM → HP = (350 × 5500) / 5252
  it('calculates standard HP correctly (imperial)', () => {
    const r = config.calculate({ torque: '350', rpm: '5500', unitSystem: 'imperial', showExplanation: 'yes' });
    const hp = parseNumber(getValue(r, 'horsepower'));
    near(hp, (350 * 5500) / 5252, 0.1);
  });

  // 400 Nm at 6000 RPM → kW = (400 × 6000) / 9549
  it('calculates kW correctly (metric)', () => {
    const r = config.calculate({ torque: '400', rpm: '6000', unitSystem: 'metric', showExplanation: 'no' });
    const kw = parseNumber(getValue(r, 'powerKW'));
    const expectedKW = (400 * 6000) / 9549;
    near(kw, expectedKW, 0.1);
  });

  it('HP = kW × 1.341 consistency check', () => {
    const r = config.calculate({ torque: '400', rpm: '6000', unitSystem: 'metric', showExplanation: 'no' });
    const kw = parseNumber(getValue(r, 'powerKW'));
    const hp = parseNumber(getValue(r, 'horsepower'));
    near(hp, kw * 1.341, 0.1);
  });

  it('returns zero HP for zero torque', () => {
    const r = config.calculate({ torque: '0', rpm: '5500', unitSystem: 'imperial', showExplanation: 'no' });
    expect(r).toEqual([]);
  });

  it('returns zero HP for zero RPM', () => {
    const r = config.calculate({ torque: '350', rpm: '0', unitSystem: 'imperial', showExplanation: 'no' });
    expect(r).toEqual([]);
  });

  it('returns empty array for missing values', () => {
    const r = config.calculate({ torque: '', rpm: '', unitSystem: 'imperial', showExplanation: 'no' });
    expect(r).toEqual([]);
  });

  it('rejects RPM above 20000', () => {
    const r = config.calculate({ torque: '350', rpm: '25000', unitSystem: 'imperial', showExplanation: 'no' });
    expect(r).toEqual([]);
  });

  it('formula breakdown text is correct', () => {
    const r = config.calculate({ torque: '350', rpm: '5500', unitSystem: 'imperial', showExplanation: 'yes' });
    const formula = getValue(r, 'formulaBreakdown');
    expect(formula).toContain('350');
    expect(formula).toContain('5500');
    expect(formula).toContain('5252');
    expect(formula).toContain('HP');
  });

  it('shows 5252 constant explanation when showExplanation=yes', () => {
    const r = config.calculate({ torque: '350', rpm: '5500', unitSystem: 'imperial', showExplanation: 'yes' });
    const explain = r.find((x) => x.id === 'magicConstant5252');
    expect(explain).toBeTruthy();
    expect(explain!.value).toContain('5252');
  });

  it('hides explanation when showExplanation=no', () => {
    const r = config.calculate({ torque: '350', rpm: '5500', unitSystem: 'imperial', showExplanation: 'no' });
    const explain = r.find((x) => x.id === 'magicConstant5252');
    expect(explain).toBeFalsy();
  });

  it('returns power category string', () => {
    const r = config.calculate({ torque: '350', rpm: '5500', unitSystem: 'imperial', showExplanation: 'no' });
    expect(getValue(r, 'powerCategory')).toBeTruthy();
  });

  it('shows both HP and kW in imperial mode', () => {
    const r = config.calculate({ torque: '350', rpm: '5500', unitSystem: 'imperial', showExplanation: 'no' });
    expect(getValue(r, 'horsepower')).toContain('HP');
    expect(getValue(r, 'powerKW')).toContain('kW');
  });

  it('shows both kW and HP in metric mode', () => {
    const r = config.calculate({ torque: '400', rpm: '6000', unitSystem: 'metric', showExplanation: 'no' });
    expect(getValue(r, 'horsepower')).toContain('HP');
    expect(getValue(r, 'powerKW')).toContain('kW');
  });

  it('typical sports car example gives expected output', () => {
    // Mustang GT: 400 lb-ft at 6500 RPM
    const r = config.calculate({ torque: '400', rpm: '6500', unitSystem: 'imperial', showExplanation: 'no' });
    const hp = parseNumber(getValue(r, 'horsepower'));
    near(hp, (400 * 6500) / 5252, 0.1);
    expect(getValue(r, 'powerCategory')).toBe('Muscle Car');
  });

  it('high RPM race engine exceeds 20000 rpm check', () => {
    const r = config.calculate({ torque: '200', rpm: '19500', unitSystem: 'imperial', showExplanation: 'no' });
    // Should still work, just under 20000
    expect(r.length).toBeGreaterThan(0);
    const hp = parseNumber(getValue(r, 'horsepower'));
    near(hp, (200 * 19500) / 5252, 0.1);
  });
});
