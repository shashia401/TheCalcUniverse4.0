import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/student-loan/index';
import { computeStudentLoan } from '../../../src/calculators/finance/student-loan/studentLoanMath';
import { getValue, near, parseMoney } from '../../helpers';

// Independent month-by-month check of a level-payment loan: balance after n payments must be ~0.
function payoffBalance(principal: number, annualRate: number, payment: number, n: number) {
  let bal = principal;
  for (let m = 0; m < n; m++) bal = bal * (1 + annualRate / 12) - payment;
  return bal;
}

describe('student-loan audit', () => {
  it('level payment amortizes to zero month by month (35,000 @ 6.52% / 10 years)', () => {
    const c = computeStudentLoan({ loanBalance: '35000', interestRate: '6.52', repaymentTerm: '10' })!;
    near(payoffBalance(35000, 0.0652, c.monthlyPayment, 120), 0, 1e-6);
  });

  it('worked example Emily: 6 months grace on 35,000 @ 6.53% -> 1,142.75 capitalized, payment 410.95', () => {
    // 35,000 x 0.0653 / 12 x 6 = 1,142.75 ; 36,142.75 over 120 months at 6.53%
    const r = config.calculate({ loanBalance: '35000', interestRate: '6.53', repaymentTerm: '10', inSchool: 'yes', monthsUntilGraduation: '0', loanType: 'unsubsidized', gracePeriodMonths: '6' });
    expect(getValue(r, 'capitalizedInterest')).toBe('$1,143');
    near(parseMoney(getValue(r, 'monthlyPayment').replace('/mo', '')), 410.95, 0.01);
    near(parseMoney(getValue(r, 'effectivePrincipal')), 36143, 1);
  });

  it('worked example Marcus: 60,000 @ 8.08%: 730.50/mo, total 87,660.52', () => {
    const r = config.calculate({ loanBalance: '60000', interestRate: '8.08', repaymentTerm: '10', inSchool: 'no' });
    near(parseMoney(getValue(r, 'monthlyPayment').replace('/mo', '')), 730.5, 0.01);
    const c = computeStudentLoan({ loanBalance: '60000', interestRate: '8.08', repaymentTerm: '10' })!;
    near(c.totalPaid, 87660.52, 0.01);
  });

  it('worked example Jennifer: subsidized 27,000 @ 5.5%, 24 + 6 months -> 3,712.50 subsidy, 293.02/mo; unsubsidized 333.31/mo', () => {
    const sub = computeStudentLoan({ loanBalance: '27000', interestRate: '5.5', repaymentTerm: '10', inSchool: 'yes', monthsUntilGraduation: '24', loanType: 'subsidized', gracePeriodMonths: '6' })!;
    near(sub.subsidy, 3712.5, 1e-9);
    near(sub.monthlyPayment, 293.02, 0.01);
    expect(sub.capitalizedInterest).toBe(0);
    const un = computeStudentLoan({ loanBalance: '27000', interestRate: '5.5', repaymentTerm: '10', inSchool: 'yes', monthsUntilGraduation: '24', loanType: 'unsubsidized', gracePeriodMonths: '6' })!;
    near(un.effectivePrincipal, 30712.5, 1e-9);
    near(un.monthlyPayment, 333.31, 0.01);
    near((un.monthlyPayment - sub.monthlyPayment) * 120, 4834.85, 0.5);
  });

  it('explanation/variables arithmetic: 35,000 @ 6.53% accrues 2,285.50/yr and 7,999.25 over 42 months', () => {
    const c = computeStudentLoan({ loanBalance: '35000', interestRate: '6.53', repaymentTerm: '10', inSchool: 'yes', monthsUntilGraduation: '36', loanType: 'unsubsidized', gracePeriodMonths: '6' })!;
    near(c.capitalizedInterest, 7999.25, 0.01);
    near(35000 * 0.0653, 2285.5, 1e-9);
  });

  it('FAQ: 50,000 @ 7% costs 69,665 over 10 years and 93,036 over 20 years', () => {
    near(computeStudentLoan({ loanBalance: '50000', interestRate: '7', repaymentTerm: '10' })!.totalPaid, 69665.09, 0.01);
    near(computeStudentLoan({ loanBalance: '50000', interestRate: '7', repaymentTerm: '20' })!.totalPaid, 93035.87, 0.01);
  });

  it('"No grace period" is honored (regression: the panel treated 0 as 6 months)', () => {
    const c = computeStudentLoan({ loanBalance: '10000', interestRate: '6', repaymentTerm: '10', inSchool: 'yes', monthsUntilGraduation: '12', loanType: 'unsubsidized', gracePeriodMonths: '0' })!;
    expect(c.gracePeriod).toBe(0);
    near(c.capitalizedInterest, 600, 1e-9); // 10,000 x 6% x 12/12
  });

  it('zero-interest loan splits the balance evenly', () => {
    const c = computeStudentLoan({ loanBalance: '12000', interestRate: '0', repaymentTerm: '10' })!;
    near(c.monthlyPayment, 100, 1e-9);
  });
});
