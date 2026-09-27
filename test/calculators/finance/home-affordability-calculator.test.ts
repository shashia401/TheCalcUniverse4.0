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

  it('front-end DTI never exceeds the front-end limit (regression: educational text previously claimed a 32.6% front-end DTI against a 28% cap, which the algorithm cannot produce)', () => {
    const r = homeAffordConfig.calculate({
      annualIncome: '175000', monthlyDebts: '800', downPayment: '120000',
      interestRate: '6.25', loanTerm: '15', propertyTax: '2.1', homeInsurance: '2200', dtiLimit: '28/36',
    });
    const frontEndDTI = parseFloat(find(r, 'frontEndDTI'));
    expect(frontEndDTI).toBeLessThanOrEqual(28.01);
  });

  it('matches the "Amanda" worked example figures (regression: front-end, not back-end, was the actual binding constraint)', () => {
    const r = homeAffordConfig.calculate({
      annualIncome: '92000', monthlyDebts: '550', downPayment: '45000',
      interestRate: '6.75', loanTerm: '30', propertyTax: '1.8', homeInsurance: '1800', dtiLimit: '28/36',
    });
    const maxHomePrice = parseFloat(find(r, 'maxHomePrice').replace(/[$,]/g, ''));
    expect(Math.abs(maxHomePrice - 286569)).toBeLessThan(500);
    expect(find(r, 'frontEndDTI')).toContain('28.0%');
  });
});
