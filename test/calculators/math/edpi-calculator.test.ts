import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/edpi/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('eDPI calculator', () => {
  it('calculates eDPI as DPI × sensitivity', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '2.0', currentGame: 'CS:GO' });
    const edpi = parseNumber(getValue(r, 'edpi'));
    expect(edpi).toBe(1600);
  });

  it('returns integer eDPI', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '2.5', currentGame: 'CS:GO' });
    const edpi = parseNumber(getValue(r, 'edpi'));
    expect(edpi).toBe(2000);
  });

  it('shows mouse DPI and sensitivity in results', () => {
    const r = config.calculate({ mouseDpi: '400', sensitivity: '3.0', currentGame: 'CS:GO' });
    expect(parseNumber(getValue(r, 'mouseDpi'))).toBe(400);
    expect(parseNumber(getValue(r, 'sensitivity'))).toBe(3.0);
  });

  it('computes 360° sensitivity in deg/cm', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '2.0', currentGame: 'CS:GO' });
    const degPerCm = parseNumber(getValue(r, 'currentSensitivity360'));
    const expected = 360 / ((360 * 2.54) / (800 * 2.0 * 0.022));
    near(degPerCm, expected, 0.05);
  });

  it('converts sensitivity between games', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '2.5', currentGame: 'CS:GO', targetGame: 'Valorant' });
    const targetSens = parseNumber(getValue(r, 'targetSensitivity'));
    // Valorant multiplier = 0.314, CS:GO = 1.0
    // target = (2.5 * 1.0) / 0.314 ≈ 7.96
    near(targetSens, 2.5 / 0.314, 0.01);
  });

  it('shows target game name when converting', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '2.0', currentGame: 'CS:GO', targetGame: 'Valorant' });
    expect(getValue(r, 'targetGameName')).toBe('Valorant');
  });

  it('skips conversion when converting to the same game', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '2.5', currentGame: 'CS:GO', targetGame: 'CS:GO' });
    const found = r.find(row => row.id === 'targetSensitivity');
    expect(found).toBeUndefined();
  });

  it('returns empty array for invalid DPI', () => {
    const r = config.calculate({ mouseDpi: '', sensitivity: '2.0', currentGame: 'CS:GO' });
    expect(r).toEqual([]);
  });

  it('returns empty array for invalid sensitivity', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '', currentGame: 'CS:GO' });
    expect(r).toEqual([]);
  });

  it('returns empty array for zero DPI', () => {
    const r = config.calculate({ mouseDpi: '0', sensitivity: '2.0', currentGame: 'CS:GO' });
    expect(r).toEqual([]);
  });

  it('returns empty array for zero sensitivity', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '0', currentGame: 'CS:GO' });
    expect(r).toEqual([]);
  });

  it('does not include conversion results when no target game', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '2.0', currentGame: 'CS:GO' });
    const found = r.find(row => row.id === 'targetSensitivity');
    expect(found).toBeUndefined();
  });

  it('uses game multiplier 1.0 for CS:GO', () => {
    const r = config.calculate({ mouseDpi: '400', sensitivity: '3.0', currentGame: 'CS:GO' });
    expect(parseNumber(getValue(r, 'edpi'))).toBe(1200);
  });

  it('highlights the eDPI result', () => {
    const r = config.calculate({ mouseDpi: '800', sensitivity: '1.5', currentGame: 'CS:GO' });
    const edpiRow = r.find(row => row.id === 'edpi');
    expect(edpiRow?.highlight).toBe(true);
  });
});
