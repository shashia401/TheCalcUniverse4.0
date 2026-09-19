import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/matrix/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Matrix calculator', () => {
  it('calculates determinant of 2x2 [[1,2],[3,4]] = -2', () => {
    const r = config.calculate({ size: '2', operation: 'determinant', matrixA: '1 2\n3 4' });
    near(parseNumber(getValue(r, 'determinant')), -2);
  });

  it('calculates determinant of 3x3 identity matrix = 1', () => {
    const r = config.calculate({ size: '3', operation: 'determinant', matrixA: '1 0 0\n0 1 0\n0 0 1' });
    near(parseNumber(getValue(r, 'determinant')), 1);
  });

  it('shows matrix size', () => {
    const r = config.calculate({ size: '2', operation: 'determinant', matrixA: '1 2\n3 4' });
    expect(getValue(r, 'matrixSize')).toBe('2×2');
  });

  it('includes matrix data for panel', () => {
    const r = config.calculate({ size: '2', operation: 'determinant', matrixA: '1 2\n3 4' });
    expect(getValue(r, '_matrixData')).toContain('1');
  });

  it('returns empty for NaN entries', () => {
    const r = config.calculate({ size: '2', operation: 'determinant', matrixA: 'abc 2\n3 4' });
    expect(r).toEqual([]);
  });

  it('returns empty for mismatched row count', () => {
    const r = config.calculate({ size: '3', operation: 'determinant', matrixA: '1 2\n3 4' });
    expect(r).toEqual([]);
  });

  it('handles zero determinant (singular matrix)', () => {
    const r = config.calculate({ size: '2', operation: 'determinant', matrixA: '1 2\n2 4' });
    near(parseNumber(getValue(r, 'determinant')), 0);
  });

  it('returns empty for invalid input', () => {
    const r = config.calculate({ size: '', operation: 'determinant', matrixA: '1 2\n3 4' });
    expect(r).toEqual([]);
  });
});
