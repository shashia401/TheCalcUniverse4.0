import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/boat-loan/index';
import { getValue, parseMoney } from '../../helpers';

describe('boat loan calculator', () => {
  it('calculates monthly payment', () => {
    const r = config.calculate({
      boatPrice: '50000',
      downPayment: '10000',
      loanTerm: '180',
      interestRate: '8',
      monthlyMaintenance: '0',
    });
    const monthly = parseMoney(getValue(r, 'monthlyPayment'));
    // $40K loan, 8%, 180mo → ~$382/mo
    expect(monthly).toBeGreaterThan(350);
    expect(monthly).toBeLessThan(400);
  });

  it('includes maintenance in true cost', () => {
    const r = config.calculate({
      boatPrice: '50000',
      downPayment: '10000',
      loanTerm: '180',
      interestRate: '8',
      monthlyMaintenance: '300',
    });
    const trueMonthly = parseMoney(getValue(r, 'trueMonthly'));
    expect(trueMonthly).toBeGreaterThan(650);
    expect(trueMonthly).toBeLessThan(700);
  });

  it('returns empty for invalid price', () => {
    const r = config.calculate({
      boatPrice: '',
      downPayment: '0',
      loanTerm: '180',
      interestRate: '8',
      monthlyMaintenance: '0',
    });
    expect(r).toEqual([]);
  });

  it('shows total interest', () => {
    const r = config.calculate({
      boatPrice: '50000',
      downPayment: '0',
      loanTerm: '120',
      interestRate: '7',
      monthlyMaintenance: '0',
    });
    const totalInterest = parseMoney(getValue(r, 'totalInterest'));
    expect(totalInterest).toBeGreaterThan(10000);
  });
});
