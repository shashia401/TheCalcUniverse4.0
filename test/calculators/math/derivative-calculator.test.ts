import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/derivative-calculator/index';
import { getValue, parseNumber } from '../../helpers';

describe('Derivative Calculator', () => {
  describe('Power rule differentiation', () => {
    it('differentiates 3x^2', () => {
      const r = config.calculate({ expression: '3x^2' });
      expect(getValue(r, 'derivative')).toBe('6x');
    });

    it('differentiates 5x', () => {
      const r = config.calculate({ expression: '5x' });
      expect(getValue(r, 'derivative')).toBe('5');
    });

    it('differentiates x (treated as 1*x^1)', () => {
      const r = config.calculate({ expression: 'x' });
      expect(getValue(r, 'derivative')).toBe('1');
    });

    it('differentiates constant 7', () => {
      const r = config.calculate({ expression: '7' });
      expect(getValue(r, 'derivative')).toBe('0');
    });

    it('differentiates 4x^3', () => {
      const r = config.calculate({ expression: '4x^3' });
      expect(getValue(r, 'derivative')).toBe('12x^2');
    });

    it('differentiates -2x^3', () => {
      const r = config.calculate({ expression: '-2x^3' });
      expect(getValue(r, 'derivative')).toBe('-6x^2');
    });
  });

  describe('Polynomial differentiation', () => {
    it('differentiates 3x^2 + 2x + 1', () => {
      const r = config.calculate({ expression: '3x^2 + 2x + 1' });
      // d/dx(3x^2)=6x, d/dx(2x)=2, d/dx(1)=0
      expect(getValue(r, 'derivative')).toBe('6x+2');
    });

    it('differentiates x^3 - 4x^2 + 5x - 2', () => {
      const r = config.calculate({ expression: 'x^3 - 4x^2 + 5x - 2' });
      // d/dx(x^3)=3x^2, d/dx(-4x^2)=-8x, d/dx(5x)=5, d/dx(-2)=0
      expect(getValue(r, 'derivative')).toBe('3x^2-8x+5');
    });

    it('differentiates x^5 + x^3 + x', () => {
      const r = config.calculate({ expression: 'x^5 + x^3 + x' });
      expect(getValue(r, 'derivative')).toBe('5x^4+3x^2+1');
    });
  });

  describe('Original polynomial display', () => {
    it('shows the original polynomial', () => {
      const r = config.calculate({ expression: '3x^2 + 2x + 1' });
      expect(getValue(r, 'original')).toBe('3x^2+2x+1');
    });

    it('shows original with negative coefficients', () => {
      const r = config.calculate({ expression: 'x^3 - 4x^2 + 5x - 2' });
      expect(getValue(r, 'original')).toBe('x^3-4x^2+5x-2');
    });
  });

  describe('Step-by-step output', () => {
    it('shows steps for each term', () => {
      const r = config.calculate({ expression: '3x^2 + 2x + 1' });
      const steps = getValue(r, 'steps');
      expect(steps).toContain('power rule');
    });

    it('shows steps for a single term', () => {
      const r = config.calculate({ expression: '4x^3' });
      expect(getValue(r, 'steps')).toBeTruthy();
    });
  });

  describe('Evaluation at x value', () => {
    it('evaluates derivative at x=2 for 3x^2', () => {
      const r = config.calculate({ expression: '3x^2', xValue: '2' });
      // f'(x)=6x, f'(2)=12
      expect(getValue(r, 'evaluated')).toBe('12');
    });

    it('evaluates derivative at x=0 for 3x^2 + 2x + 1', () => {
      const r = config.calculate({ expression: '3x^2 + 2x + 1', xValue: '0' });
      // f'(x)=6x+2, f'(0)=2
      expect(getValue(r, 'evaluated')).toBe('2');
    });

    it('evaluates derivative at x=3 for x^3', () => {
      const r = config.calculate({ expression: 'x^3', xValue: '3' });
      // f'(x)=3x^2, f'(3)=27
      expect(getValue(r, 'evaluated')).toBe('27');
    });
  });

  describe('Edge cases and validation', () => {
    it('returns empty for empty expression', () => {
      expect(config.calculate({})).toEqual([]);
    });

    it('returns empty for empty string expression', () => {
      expect(config.calculate({ expression: '' })).toEqual([]);
    });

    it('differentiates expression with only spaces', () => {
      expect(config.calculate({ expression: '   ' })).toEqual([]);
    });

    it('handles expression starting with minus', () => {
      const r = config.calculate({ expression: '-x^2' });
      expect(getValue(r, 'derivative')).toBe('-2x');
    });

    it('handles expression with decimal coefficients', () => {
      const r = config.calculate({ expression: '1.5x^2' });
      expect(getValue(r, 'derivative')).toBe('3x');
    });

    it('handles x^1 as x', () => {
      const r = config.calculate({ expression: '2x^1' });
      expect(getValue(r, 'derivative')).toBe('2');
    });

    it('handles x^0 as constant', () => {
      const r = config.calculate({ expression: '5x^0' });
      expect(getValue(r, 'derivative')).toBe('0');
    });

    it('handles derivative of zero expression', () => {
      const r = config.calculate({ expression: '0' });
      expect(getValue(r, 'derivative')).toBe('0');
    });
  });
});
