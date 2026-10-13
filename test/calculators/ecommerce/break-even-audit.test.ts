import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/break-even/index';
import { computeBreakEven } from '../../../src/calculators/ecommerce/break-even/breakEvenMath';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

const run = (fixedCosts: string, pricePerUnit: string, variableCostPerUnit: string) =>
  config.calculate({ fixedCosts, pricePerUnit, variableCostPerUnit });

describe('break-even audit (BE = FC / (P - VC), hand-derived)', () => {
  it('coffee shop: 8000/3.30 = 2424.2 -> 2,425 units, revenue 10,909.09', () => {
    const r = run('8000', '4.50', '1.20');
    expect(parseNumber(getValue(r, 'breakEvenUnits'))).toBe(2425);
    near(parseMoney(getValue(r, 'breakEvenRevenue')), 8000 / 3.3 * 4.5);
    near(parseMoney(getValue(r, 'breakEvenRevenue')), 10909.09);
  });
  it('SaaS: 45000/93 = 483.87 -> 484 units, revenue 47,903.23', () => {
    const r = run('45000', '99', '6');
    expect(parseNumber(getValue(r, 'breakEvenUnits'))).toBe(484);
    near(parseMoney(getValue(r, 'breakEvenRevenue')), 47903.23);
  });
  it('Etsy: 2400/24 = exactly 100 units, revenue 3,800', () => {
    const r = run('2400', '38', '14');
    expect(parseNumber(getValue(r, 'breakEvenUnits'))).toBe(100);
    near(parseMoney(getValue(r, 'breakEvenRevenue')), 3800);
  });
  it('educational what-ifs: price $5.00 -> 2,106; price $149 -> 315; $48 -> 71; VC $10 -> 86', () => {
    expect(parseNumber(getValue(run('8000', '5', '1.2'), 'breakEvenUnits'))).toBe(2106);
    expect(parseNumber(getValue(run('45000', '149', '6'), 'breakEvenUnits'))).toBe(315);
    expect(parseNumber(getValue(run('2400', '48', '14'), 'breakEvenUnits'))).toBe(71);
    expect(parseNumber(getValue(run('2400', '38', '10'), 'breakEvenUnits'))).toBe(86);
  });
  it('float noise does not bump an exact integer (0.3 / 0.1 = 3)', () => {
    expect(computeBreakEven(0.3, 0.2, 0.1)!.unitsCeil).toBe(3);
  });
  it('zero fixed costs -> zero units', () => {
    const r = run('0', '10', '4');
    expect(parseNumber(getValue(r, 'breakEvenUnits'))).toBe(0);
  });
  it('price <= variable cost gives the error row; invalid input gives []', () => {
    expect(getValue(run('100', '5', '5'), 'error')).toMatch(/must exceed/);
    expect(run('100', '', '5')).toEqual([]);
    expect(run('-1', '10', '5')).toEqual([]);
  });
});
