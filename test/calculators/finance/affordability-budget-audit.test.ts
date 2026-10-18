import { describe, it, expect } from 'vitest';
import houseAffordability from '../../../src/calculators/finance/house-affordability';
import homeAffordability from '../../../src/calculators/finance/home-affordability';
import budget from '../../../src/calculators/finance/budget-calculator';

type Out = { id: string; value: string }[];
const val = (r: unknown, id: string) => (r as Out).find((x) => x.id === id)?.value;

// Oracle: independent fixed-point solve in Python. Max price P satisfies
//   PI(P - down) + P*tax/12 + ins/12 = min(income/12 * front, income/12 * back - debts)
// with PI the 30-year annuity payment at 6.75%.
const base = { annualIncome: '100000', monthlyDebts: '500', interestRate: '6.75', loanTerm: '30', propertyTax: '1.1', homeInsurance: '1500' };

describe('house-affordability / home-affordability audit', () => {
  it('36% back-end limit, $60k down, no PMI: $350,887 home, $1,886.69 P&I, $2,333.33 housing', () => {
    const r = houseAffordability.calculate({ ...base, downPayment: '60000', dtiLimit: '36', pmiRate: '' });
    expect(val(r, 'maxHomePrice')).toBe('$350,887');
    expect(val(r, 'maxLoan')).toBe('$290,887');
    expect(val(r, 'maxHousingPayment')).toBe('$2,333.33/mo');
    expect(val(r, 'maxPI')).toBe('$1,886.69/mo');
    expect(val(r, 'backEndDTI')).toBe('34.0%');
  });

  it('43% limit with 0.8% PMI on a $20k down payment: $322,380 home', () => {
    const r = houseAffordability.calculate({ ...base, downPayment: '20000', dtiLimit: '43', pmiRate: '0.8' });
    expect(val(r, 'maxHomePrice')).toBe('$322,380');
    expect(val(r, 'maxLoan')).toBe('$302,380');
    expect(val(r, 'maxPI')).toBe('$1,961.23/mo');
  });

  it('home-affordability (28/36) agrees with house-affordability at the same inputs', () => {
    const r = homeAffordability.calculate({ ...base, downPayment: '60000', pmiRate: '', dtiLimit: '28/36' });
    expect(val(r, 'maxHomePrice')).toBe('$350,887');
    expect(val(r, 'estimatedMonthlyPayment')).toBe('$1,886.69');
    expect(val(r, 'frontEndDTI')).toMatch(/^28\.0%/);
  });
});

describe('budget-calculator audit: 50/30/20 buckets add up', () => {
  it('$5,000 income: needs 2,600 + wants 750 + savings 750 = 4,100 spent, 900 left', () => {
    const r = budget.calculate({
      monthlyIncome: '5000',
      rent: '1500', utilities: '200', groceries: '500', autoGas: '150', insurance: '150', childcare: '0', otherNeeds: '100',
      diningOut: '200', entertainment: '150', subscriptions: '50', shopping: '200', travel: '100', otherWants: '50',
      emergencyFund: '300', retirement401k: '250', investmentBrokerage: '100', extraDebtPayoff: '100', otherSavings: '0',
    });
    expect(val(r, 'needsResult')).toBe('$2,600.00');
    expect(val(r, 'wantsResult')).toBe('$750.00');
    expect(val(r, 'savingsResult')).toBe('$750.00');
    expect(val(r, 'totalSpendingResult')).toBe('$4,100.00');
    expect(val(r, 'leftover')).toBe('$900.00');
  });
});
