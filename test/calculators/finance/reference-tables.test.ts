// B6e: every number in the loan-term and compound-growth reference tables is pinned to an independent
// Python (fractions.Fraction, exact rational arithmetic, round-half-up) calculation.
import { describe, it, expect } from 'vitest';
import loan from '../../../src/calculators/finance/loan-calculator';
import compound from '../../../src/calculators/finance/compound-interest';
import { loanTermRows } from '../../../src/calculators/finance/loan-calculator/termComparison';
import { growthRows, futureValue } from '../../../src/calculators/finance/compound-interest/growth';
import { getValue, parseMoney } from '../../helpers';

const DOT = '·';

describe('Loan: same $25,000 loan at 6.5% APR over different terms', () => {
  const python: [string, string][] = [
    ['$25,000 at 6.5% APR, 3 years (36 payments)', `$766.23/mo ${DOT} interest $2,584 ${DOT} total $27,584`],
    ['$25,000 at 6.5% APR, 5 years (60 payments)', `$489.15/mo ${DOT} interest $4,349 ${DOT} total $29,349`],
    ['$25,000 at 6.5% APR, 7 years (84 payments)', `$371.24/mo ${DOT} interest $6,184 ${DOT} total $31,184`],
    ['$25,000 at 6.5% APR, 10 years (120 payments)', `$283.87/mo ${DOT} interest $9,064 ${DOT} total $34,064`],
  ];

  it('matches the Python reference', () => {
    expect(loanTermRows().map((r) => [r.label, r.value])).toEqual(python);
  });

  it('is published in the educational quick reference', () => {
    expect(loan.educational!.quickReference).toEqual(loanTermRows());
  });

  it('agrees with the calculator for every term', () => {
    const payments = [766.23, 489.15, 371.24, 283.87];
    [3, 5, 7, 10].forEach((years, i) => {
      const r = loan.calculate({ loanAmount: '25000', interestRate: '6.5', termUnit: 'years', loanTerm: String(years) });
      expect(parseMoney(getValue(r, 'monthlyPayment'))).toBeCloseTo(payments[i], 2);
    });
  });
});

describe('Compound interest: $10,000 lump sum, compounded monthly, at 5% / 7% / 9%', () => {
  const python: [string, string][] = [
    ['$10,000 after 5 years (compounded monthly)', `5%: $12,834 ${DOT} 7%: $14,176 ${DOT} 9%: $15,657`],
    ['$10,000 after 10 years (compounded monthly)', `5%: $16,470 ${DOT} 7%: $20,097 ${DOT} 9%: $24,514`],
    ['$10,000 after 20 years (compounded monthly)', `5%: $27,126 ${DOT} 7%: $40,387 ${DOT} 9%: $60,092`],
    ['$10,000 after 30 years (compounded monthly)', `5%: $44,677 ${DOT} 7%: $81,165 ${DOT} 9%: $147,306`],
  ];

  it('matches the Python reference', () => {
    expect(growthRows().map((r) => [r.label, r.value])).toEqual(python);
  });

  it('is published in the educational quick reference', () => {
    expect(compound.educational!.quickReference).toEqual(growthRows());
  });

  it('agrees with the calculator (7%, 20 years, standard tab)', () => {
    const r = compound.calculate({ shape: 'standard', principal: '10000', rate: '7', years: '20', compoundFrequency: '12' });
    expect(parseMoney(getValue(r, 'futureValue'))).toBeCloseTo(40387.39, 2); // Python: 40387.3884898...
  });

  it('futureValue with contributions matches Python ($500/mo, 7%, 30y, monthly)', () => {
    // Python Fraction: 500 * ((1 + 0.07/12)^360 - 1) / (0.07/12) = 609985.x
    expect(Math.round(futureValue(0, 500, 0.07, 12, 30))).toBe(609985);
  });
});
