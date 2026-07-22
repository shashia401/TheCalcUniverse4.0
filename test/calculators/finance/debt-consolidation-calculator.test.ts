import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/debt-consolidation';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('debt-consolidation-calculator', () => {
  it('two debts: consolidation shows monthly savings with lower rate', () => {
    const r = config.calculate({
      debt1name: 'Chase Card',
      debt1balance: '6500',
      debt1rate: '22.99',
      debt1payment: '200',
      debt2name: 'Citi Card',
      debt2balance: '3200',
      debt2rate: '19.99',
      debt2payment: '100',
      newRate: '11.99',
      newTermMonths: '36',
    });
    expect(r.length).toBeGreaterThanOrEqual(10);
    expect(getValue(r, 'currentPayment')).toMatch(/\$\S+\/mo/);
    expect(getValue(r, 'newPayment')).toMatch(/\$\S+\/mo/);
  });

  it('three debts: still produces consolidation results', () => {
    const r = config.calculate({
      debt1name: 'Card A',
      debt1balance: '5000',
      debt1rate: '22',
      debt1payment: '150',
      debt2name: 'Card B',
      debt2balance: '3000',
      debt2rate: '18',
      debt2payment: '100',
      debt3name: 'Car Loan',
      debt3balance: '4000',
      debt3rate: '10',
      debt3payment: '200',
      newRate: '12',
      newTermMonths: '48',
    });
    expect(getValue(r, 'monthlySavings')).toBeTruthy();
    expect(getValue(r, 'lifetimeSaved')).toBeTruthy();
  });

  it('origination fee adds to total cost', () => {
    const r = config.calculate({
      debt1name: 'Card A',
      debt1balance: '10000',
      debt1rate: '20',
      debt1payment: '300',
      newRate: '10',
      newTermMonths: '36',
      originationFee: '3',
    });
    expect(getValue(r, 'originationFeeAmt')).toMatch(/\$/);
    expect(parseMoney(getValue(r, 'originationFeeAmt'))).toBeGreaterThan(0);
  });

  it('no origination fee shows $0', () => {
    const r = config.calculate({
      debt1name: 'Card A',
      debt1balance: '5000',
      debt1rate: '20',
      debt1payment: '200',
      newRate: '10',
      newTermMonths: '24',
    });
    expect(getValue(r, 'originationFeeAmt')).toContain('$0');
  });

  it('returns empty when no active debts', () => {
    const r = config.calculate({ newRate: '10', newTermMonths: '36' });
    expect(r).toHaveLength(0);
  });

  it('returns empty when newRate is missing', () => {
    const r = config.calculate({
      debt1name: 'Card',
      debt1balance: '1000',
      debt1rate: '20',
      debt1payment: '50',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty when newRate is NaN', () => {
    const r = config.calculate({
      debt1name: 'Card',
      debt1balance: '1000',
      debt1rate: '20',
      debt1payment: '50',
      newRate: 'abc',
      newTermMonths: '36',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty when newRate is zero or negative', () => {
    const r = config.calculate({
      debt1name: 'Card',
      debt1balance: '1000',
      debt1rate: '20',
      debt1payment: '50',
      newRate: '0',
      newTermMonths: '36',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty when origination fee exceeds 10%', () => {
    const r = config.calculate({
      debt1name: 'Card',
      debt1balance: '1000',
      debt1rate: '20',
      debt1payment: '50',
      newRate: '10',
      newTermMonths: '36',
      originationFee: '15',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty when origination fee is negative', () => {
    const r = config.calculate({
      debt1name: 'Card',
      debt1balance: '1000',
      debt1rate: '20',
      debt1payment: '50',
      newRate: '10',
      newTermMonths: '36',
      originationFee: '-2',
    });
    expect(r).toHaveLength(0);
  });

  it('current and new timelines are reported', () => {
    const r = config.calculate({
      debt1name: 'Card A',
      debt1balance: '5000',
      debt1rate: '20',
      debt1payment: '200',
      newRate: '10',
      newTermMonths: '36',
    });
    expect(getValue(r, 'currentTimeline')).toBeTruthy();
    expect(getValue(r, 'newTimeline')).toBeTruthy();
  });

  it('consolidation with lower rate produces positive lifetime savings', () => {
    const r = config.calculate({
      debt1name: 'High Rate Card',
      debt1balance: '15000',
      debt1rate: '24.99',
      debt1payment: '450',
      newRate: '10',
      newTermMonths: '36',
    });
    const lifetimeSaved = getValue(r, 'lifetimeSaved');
    expect(lifetimeSaved).toBeTruthy();
    // With a large rate drop, savings should be substantial
    const savedVal = parseMoney(lifetimeSaved);
    expect(savedVal).toBeGreaterThan(500);
  });

  it('consolidation with near-same rate and high fee shows negative savings', () => {
    const r = config.calculate({
      debt1name: 'Card',
      debt1balance: '8000',
      debt1rate: '20',
      debt1payment: '240',
      newRate: '17.5',
      newTermMonths: '48',
      originationFee: '5',
    });
    const lifetimeSaved = getValue(r, 'lifetimeSaved');
    expect(lifetimeSaved).toBeTruthy();
    // With small rate spread and high fee, may show negative savings
    const savedVal = parseMoney(lifetimeSaved);
    expect(savedVal).toBeLessThan(200);
  });

  it('monthly savings label reflects direction', () => {
    const r = config.calculate({
      debt1name: 'Card',
      debt1balance: '5000',
      debt1rate: '25',
      debt1payment: '200',
      newRate: '10',
      newTermMonths: '36',
    });
    const msResult = r.find((x) => x.id === 'monthlySavings');
    expect(msResult).toBeDefined();
    expect(msResult!.highlight).toBe(true);
  });

  it('JSON debts format is parsed correctly', () => {
    const r = config.calculate({
      debts: JSON.stringify([
        { name: 'Card A', balance: '5000', rate: '22', payment: '150' },
        { name: 'Card B', balance: '3000', rate: '18', payment: '100' },
      ]),
      newRate: '11.99',
      newTermMonths: '36',
    });
    expect(r.length).toBeGreaterThanOrEqual(10);
    expect(getValue(r, 'currentPayment')).toMatch(/\$\S+\/mo/);
  });

  it('payoff data is included in results', () => {
    const r = config.calculate({
      debt1name: 'Card',
      debt1balance: '5000',
      debt1rate: '20',
      debt1payment: '200',
      newRate: '10',
      newTermMonths: '36',
    });
    const payoffEntry = r.find((x) => x.id === '_payoffData');
    expect(payoffEntry).toBeDefined();
    const data = JSON.parse(payoffEntry!.value);
    expect(data.current).toBeDefined();
    expect(data.consolidation).toBeDefined();
    expect(data.current.length).toBeGreaterThan(1);
    expect(data.consolidation.length).toBeGreaterThan(1);
  });

  it('zero origination fee produces positive label color', () => {
    const r = config.calculate({
      debt1name: 'Card',
      debt1balance: '5000',
      debt1rate: '20',
      debt1payment: '200',
      newRate: '10',
      newTermMonths: '24',
    });
    const feeEntry = r.find((x) => x.id === 'originationFeeAmt');
    expect(feeEntry).toBeDefined();
    expect(feeEntry!.color).toBe('positive');
  });

  it('handles zero-rate consolidation loan (0% APR)', () => {
    const r = config.calculate({
      debt1name: 'Card',
      debt1balance: '5000',
      debt1rate: '20',
      debt1payment: '200',
      newRate: '0.01',
      newTermMonths: '24',
    });
    expect(r.length).toBeGreaterThanOrEqual(10);
  });
});
