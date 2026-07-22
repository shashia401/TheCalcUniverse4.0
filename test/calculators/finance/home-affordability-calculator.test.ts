import { describe, it, expect } from 'vitest';
import homeAffordConfig from '../../../src/calculators/finance/home-affordability/index';

describe('Home Affordability Calculator', () => {
  const find = (r: ReturnType<typeof homeAffordConfig.calculate>, id: string) => r.find(x => x.id === id)?.value ?? '';

  it('calculates max home price based on income and debts', () => {
    const r = homeAffordConfig.calculate({ annualIncome: '100000', monthlyDebts: '500', downPayment: '60000', interestRate: '6.75', loanTerm: '30' });
    expect(find(r, 'maxHomePrice')).toContain('$');
    expect(find(r, 'maxLoanAmount')).toContain('$');
    expect(find(r, 'frontEndDTI')).toContain('%');
    expect(find(r, 'backEndDTI')).toContain('%');
  });

  it('returns empty for zero income', () => {
    expect(homeAffordConfig.calculate({ annualIncome: '0', interestRate: '6.75' })).toEqual([]);
  });

  it('returns empty when missing required fields', () => {
    expect(homeAffordConfig.calculate({ annualIncome: '100000' })).toEqual([]);
  });
});
