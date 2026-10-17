import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/edpi/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('eDPI Calculator', () => {
  it('calculates eDPI = DPI x sensitivity for CS:GO', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '2', currentGame: 'CS:GO' });
    near(parseNumber(getValue(r, 'edpi')), 1600);
    expect(getValue(r, 'mouseDpi')).toBe('800');
    expect(getValue(r, 'sensitivity')).toBe('2');
  });

  it('calculates eDPI correctly for Valorant', () => {
    const r = config.calculate({ mouseDpi: '1600', sensitivity: '0.5', currentGame: 'Valorant' });
    near(parseNumber(getValue(r, 'edpi')), 800);
  });

  it('converts sensitivity from CS:GO to Valorant', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '2', currentGame: 'CS:GO', targetGame: 'Valorant' });
    // CS:GO mult = 1, Valorant mult = 0.314
    // targetSens = (2 * 0.314) / 1 = 0.628 (preserves the same physical cm/360 feel)
    near(parseNumber(getValue(r, 'targetSensitivity')), 2 * 0.314, 0.01);
    expect(getValue(r, 'targetGameName')).toBe('Valorant');
  });

  it('converts sensitivity from Valorant to CS:GO', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '0.5', currentGame: 'Valorant', targetGame: 'CS:GO' });
    // Valorant yaw 0.07, CS:GO yaw 0.022: targetSens = 0.5 * 0.07 / 0.022 = 1.5909
    near(parseNumber(getValue(r, 'targetSensitivity')), (0.5 * 0.07) / 0.022, 0.0001);
  });

  it('converts between other games (Overwatch to Apex)', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '5', currentGame: 'Overwatch', targetGame: 'Apex Legends' });
    // Overwatch yaw 0.0066, Apex yaw 0.022: 5 * 0.0066 / 0.022 = 1.5 (the old multiplier of 1 for both gave 5)
    near(parseNumber(getValue(r, 'targetSensitivity')), 1.5, 0.0001);
  });

  it('skips conversion when no target game is selected', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '2', currentGame: 'CS:GO', targetGame: '' });
    expect(r.find(x => x.id === 'targetSensitivity')).toBeUndefined();
    expect(r.find(x => x.id === 'targetGameName')).toBeUndefined();
  });

  it('returns empty for missing DPI', () => {
    const r = config.calculate({ mouseDpi: '', sensitivity: '2', currentGame: 'CS:GO' });
    expect(r).toEqual([]);
  });

  it('returns empty for missing sensitivity', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '', currentGame: 'CS:GO' });
    expect(r).toEqual([]);
  });

  it('returns empty for zero DPI', () => {
    const r = config.calculate({ mouseDpi: '0', sensitivity: '2', currentGame: 'CS:GO' });
    expect(r).toEqual([]);
  });

  it('returns 360 sensitivity value', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '2', currentGame: 'CS:GO' });
    const val = getValue(r, 'currentSensitivity360');
    expect(val).toContain('deg/cm');
    expect(parseNumber(val)).toBeGreaterThan(0);
  });
});
