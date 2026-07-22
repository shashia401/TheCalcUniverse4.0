import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/realestate/dti-ratio/index';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('DTI Ratio Calculator', () => {
  it('calculates front-end and back-end DTI correctly', () => {
    const results = config.calculate({
      grossMonthlySalary: '7000',
      bonusOvertime: '500',
      otherIncome: '0',
      housingPayment: '1800',
      carPayment: '400',
      studentLoans: '300',
      creditCardMin: '150',
      childSupport: '0',
      otherDebt: '0',
    });
    // Total income = 7500, front-end = 1800/7500*100 = 24%
    const frontEnd = parseNumber(getValue(results, 'frontEndDTI'));
    near(frontEnd, 24, 0.1);
    // Back-end = (1800+400+300+150)/7500*100 = 35.3%
    const backEnd = parseNumber(getValue(results, 'backEndDTI'));
    near(backEnd, 35.3, 0.1);
  });

  it('calculates max housing for 28% front-end', () => {
    const results = config.calculate({
      grossMonthlySalary: '7000',
      bonusOvertime: '500',
      otherIncome: '0',
      housingPayment: '1800',
      carPayment: '400',
      studentLoans: '300',
      creditCardMin: '150',
      childSupport: '0',
      otherDebt: '0',
    });
    const maxHousing = parseNumber(getValue(results, 'maxHousingFor28'));
    near(maxHousing, 2100); // 7500 * 0.28
  });

  it('calculates remaining capacity vs 43% limit', () => {
    const results = config.calculate({
      grossMonthlySalary: '7000',
      bonusOvertime: '500',
      otherIncome: '0',
      housingPayment: '1800',
      carPayment: '400',
      studentLoans: '300',
      creditCardMin: '150',
      childSupport: '0',
      otherDebt: '0',
    });
    // Total debt = 2650, 43% limit = 7500*0.43 = 3225
    // Available = 3225 - 2650 = 575
    const headroom = getValue(results, 'debtHeadroom');
    expect(headroom).toContain('available');
    const available = parseNumber(headroom);
    near(available, 575);
  });

  it('shows over-limit when DTI exceeds 43%', () => {
    const results = config.calculate({
      grossMonthlySalary: '5000',
      bonusOvertime: '0',
      otherIncome: '0',
      housingPayment: '2000',
      carPayment: '500',
      studentLoans: '300',
      creditCardMin: '200',
      childSupport: '0',
      otherDebt: '0',
    });
    // Total debt = 3000, 43% limit = 5000*0.43 = 2150
    // Over by 850
    const headroom = getValue(results, 'debtHeadroom');
    expect(headroom).toContain('over limit');
  });

  it('returns empty for zero income', () => {
    const results = config.calculate({
      grossMonthlySalary: '0',
      bonusOvertime: '0',
      otherIncome: '0',
      housingPayment: '1800',
      carPayment: '400',
      studentLoans: '300',
      creditCardMin: '150',
      childSupport: '0',
      otherDebt: '0',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for missing income', () => {
    const results = config.calculate({
      grossMonthlySalary: '',
      bonusOvertime: '',
      otherIncome: '',
      housingPayment: '1800',
      carPayment: '400',
      studentLoans: '300',
      creditCardMin: '150',
      childSupport: '0',
      otherDebt: '0',
    });
    expect(results).toEqual([]);
  });

  it('has all required result IDs', () => {
    const results = config.calculate({
      grossMonthlySalary: '7000',
      bonusOvertime: '500',
      otherIncome: '0',
      housingPayment: '1800',
      carPayment: '400',
      studentLoans: '300',
      creditCardMin: '150',
      childSupport: '0',
      otherDebt: '0',
    });
    const ids = results.map((r) => r.id);
    expect(ids).toContain('backEndDTI');
    expect(ids).toContain('frontEndDTI');
    expect(ids).toContain('totalIncome');
    expect(ids).toContain('totalDebt');
    expect(ids).toContain('maxHousingFor28');
    expect(ids).toContain('maxDebtFor36');
    expect(ids).toContain('maxDebtFor43');
    expect(ids).toContain('debtHeadroom');
  });
});
