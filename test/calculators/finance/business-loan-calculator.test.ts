import { describe, it, expect } from 'vitest';
import businessLoanConfig from '../../../src/calculators/finance/business-loan/index';

describe('Business Loan Calculator', () => {
  const find = (r: ReturnType<typeof businessLoanConfig.calculate>, id: string) => r.find(x => x.id === id)?.value ?? '';

  it('calculates monthly payment and total cost for a business loan', () => {
    const r = businessLoanConfig.calculate({ loanAmount: '250000', loanTermMonths: '60', interestRate: '8.5', originationFee: '2', monthlyNOI: '8500' });
    expect(find(r, 'monthlyPayment')).toContain('$');
    expect(find(r, 'totalInterest')).toContain('$');
  });

  it('computes DSCR when NOI is provided', () => {
    const r = businessLoanConfig.calculate({ loanAmount: '250000', loanTermMonths: '60', interestRate: '8.5', monthlyNOI: '8500' });
    expect(find(r, 'dscrResult')).toBeTruthy();
  });

  it('returns empty for missing required fields', () => {
    expect(businessLoanConfig.calculate({ loanAmount: '0', interestRate: '8.5' })).toEqual([]);
  });
});
