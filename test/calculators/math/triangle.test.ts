import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/triangle/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Triangle Calculator', () => {
  it('solves SSS: 3-4-5 triangle', () => {
    const r = config.calculate({ mode: 'sss', sideA: '3', sideB: '4', sideC: '5' });
    near(parseFloat(getValue(r, 'angleA').replace('°', '')), 36.87, 0.1);
    near(parseFloat(getValue(r, 'angleB').replace('°', '')), 53.13, 0.1);
    near(parseFloat(getValue(r, 'angleC').replace('°', '')), 90, 0.1);
  });

  it('solves SAS: two sides and included angle', () => {
    const r = config.calculate({ mode: 'sas', sasSideB: '5', sasAngleA: '60', sasSideC: '7' });
    // Side a should be ~6.24 via law of cosines
    expect(getValue(r, 'sideALabel')).toBeTruthy();
    const sideA = parseFloat(getValue(r, 'sideALabel'));
    expect(sideA).toBeGreaterThan(0);
  });

  it('solves ASA: two angles and included side', () => {
    const r = config.calculate({ mode: 'asa', asaAngleA: '45', asaSideC: '10', asaAngleB: '60' });
    // Angle C should be 75 degrees
    near(parseFloat(getValue(r, 'angleC').replace('°', '')), 75, 0.1);
  });

  it('classifies equilateral triangle', () => {
    const r = config.calculate({ mode: 'sss', sideA: '5', sideB: '5', sideC: '5' });
    expect(getValue(r, 'triangleType')).toContain('Equilateral');
  });

  it('classifies right triangle', () => {
    const r = config.calculate({ mode: 'sss', sideA: '3', sideB: '4', sideC: '5' });
    expect(getValue(r, 'triangleType')).toContain('Right');
  });

  it('returns area and perimeter', () => {
    const r = config.calculate({ mode: 'sss', sideA: '3', sideB: '4', sideC: '5' });
    near(parseFloat(getValue(r, 'area')), 6);
    near(parseFloat(getValue(r, 'perimeter')), 12);
  });

  it('returns empty for invalid triangle (violates triangle inequality)', () => {
    const r = config.calculate({ mode: 'sss', sideA: '1', sideB: '1', sideC: '10' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN inputs', () => {
    const r = config.calculate({ mode: 'sss', sideA: 'abc', sideB: '4', sideC: '5' });
    expect(r).toEqual([]);
  });
});
