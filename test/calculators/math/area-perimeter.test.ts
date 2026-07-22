import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/area-perimeter/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('area-perimeter calculator', () => {
  it('calculates rectangle area, perimeter, and diagonal', () => {
    const r = config.calculate({ shape: 'rectangle', rectLength: '10', rectWidth: '5' });
    near(parseNumber(getValue(r, 'area')), 50);
    near(parseNumber(getValue(r, 'perimeter')), 30);
    near(parseNumber(getValue(r, 'diagonal')), 11.18034, 0.01);
  });

  it('calculates circle area, circumference, and diameter', () => {
    const r = config.calculate({ shape: 'circle', circleRadius: '5' });
    near(parseNumber(getValue(r, 'area')), 78.5398, 0.01);
    near(parseNumber(getValue(r, 'circumference')), 31.4159, 0.01);
    near(parseNumber(getValue(r, 'diameter')), 10);
  });

  it('calculates triangle area with dim3', () => {
    const r = config.calculate({ shape: 'triangle', triBase: '6', triHeight: '4', triSide: '5' });
    near(parseNumber(getValue(r, 'area')), 12);
  });

  it('calculates square area, perimeter, and diagonal', () => {
    const r = config.calculate({ shape: 'square', squareSide: '4' });
    near(parseNumber(getValue(r, 'area')), 16);
    near(parseNumber(getValue(r, 'perimeter')), 16);
    near(parseNumber(getValue(r, 'diagonal')), 5.65685, 0.01);
  });

  it('calculates trapezoid area and midsegment', () => {
    const r = config.calculate({ shape: 'trapezoid', trapBase1: '8', trapBase2: '5', trapHeight: '4' });
    near(parseNumber(getValue(r, 'area')), 26);
    near(parseNumber(getValue(r, 'midsegment')), 6.5);
  });

  it('calculates parallelogram area and perimeter', () => {
    const r = config.calculate({ shape: 'parallelogram', paraBase: '10', paraSide: '6', paraHeight: '4' });
    near(parseNumber(getValue(r, 'area')), 40);
    near(parseNumber(getValue(r, 'perimeter')), 32);
  });

  it('calculates hexagon area, perimeter, and apothem', () => {
    const r = config.calculate({ shape: 'hexagon', hexSide: '2' });
    near(parseNumber(getValue(r, 'area')), 10.3923, 0.01);
    near(parseNumber(getValue(r, 'perimeter')), 12);
    near(parseNumber(getValue(r, 'apothem')), 1.73205, 0.01);
  });

  it('calculates compound shape (rectangle + semicircle)', () => {
    const r = config.calculate({ shape: 'rectangle', rectLength: '10', rectWidth: '5', compound: 'rectSemi', compRadius: '2' });
    near(parseNumber(getValue(r, 'area')), 50 + (Math.PI * 4) / 2, 0.01);
    expect(getValue(r, 'compoundLabel')).toBe('Rectangle + Semicircle');
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for zero circle radius', () => {
    expect(config.calculate({ shape: 'circle', circleRadius: '0' })).toHaveLength(0);
  });

  it('returns empty for negative circle radius', () => {
    expect(config.calculate({ shape: 'circle', circleRadius: '-5' })).toHaveLength(0);
  });

  it('returns empty for missing rectangle width', () => {
    expect(config.calculate({ shape: 'rectangle', rectLength: '10' })).toHaveLength(0);
  });
});
