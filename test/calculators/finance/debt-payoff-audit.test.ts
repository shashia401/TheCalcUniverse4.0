import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/debt-payoff/index';
import { parseCards, simulatePayoff, orderCards } from '../../../src/calculators/finance/debt-payoff/payoffSim';
import { getValue } from '../../helpers';

// Independent reference: Python month-by-month simulation (interest, minimums, pooled extra + rolled minimums).
const mike = {
  extraPayment: '150',
  card1name: 'Card A', card1balance: '8000', card1rate: '24', card1min: '200',
  card2name: 'Card B', card2balance: '3000', card2rate: '18', card2min: '75',
};
const sarah = {
  extraPayment: '200',
  card1name: 'Chase', card1balance: '4500', card1rate: '22.99', card1min: '85',
  card2name: 'Citi', card2balance: '2100', card2rate: '19.99', card2min: '45',
  card3name: 'CapOne', card3balance: '850', card3rate: '28.99', card3min: '25',
};

describe('debt-payoff audit', () => {
  it('Mike worked example: snowball 37 mo / $4,417, avalanche 36 mo / $4,022, saves $395', () => {
    const r = config.calculate(mike);
    expect(getValue(r, 'snowballTime')).toBe('3yr 1mo');
    expect(getValue(r, 'avalancheTime')).toBe('3yr 0mo');
    expect(getValue(r, 'snowballInterest')).toBe('$4,417');
    expect(getValue(r, 'avalancheInterest')).toBe('$4,022');
    expect(getValue(r, 'interestSaved')).toBe('$395 saved with Avalanche');
  });

  it('Mike: Card B (snowball first) clears in month 15; Card A clears in month 31 under avalanche', () => {
    const cards = parseCards(mike);
    const s = simulatePayoff(cards, 150, 'snowball');
    expect(s.perCard[0]).toMatchObject({ name: 'Card B', month: 15 });
    const a = simulatePayoff(cards, 150, 'avalanche');
    expect(a.perCard[0]).toMatchObject({ name: 'Card A', month: 31 });
  });

  it('Sarah: panel/index share one simulation (27 months, $2,118.57 vs $2,026.84)', () => {
    const cards = parseCards(sarah);
    const s = simulatePayoff(cards, 200, 'snowball');
    const a = simulatePayoff(cards, 200, 'avalanche');
    expect(s.months).toBe(27);
    expect(a.months).toBe(27);
    expect(s.totalInterest).toBeCloseTo(2118.57, 1);
    expect(a.totalInterest).toBeCloseTo(2026.84, 1);
    // the timeline the Panel charts starts at the total debt and ends at zero
    expect(s.timeline[0]).toBeCloseTo(7450, 6);
    expect(s.timeline[s.timeline.length - 1]).toBe(0);
    expect(s.timeline).toHaveLength(28);
  });

  it('ties: avalanche breaks equal APRs by smaller balance, snowball breaks equal balances by higher APR', () => {
    const tie = [
      { name: 'big', balance: 5000, rate: 20, min: 100 },
      { name: 'small', balance: 1000, rate: 20, min: 25 },
    ];
    expect(orderCards(tie, 'avalanche').map((c) => c.name)).toEqual(['small', 'big']);
    const eq = [
      { name: 'low', balance: 2000, rate: 10, min: 50 },
      { name: 'high', balance: 2000, rate: 25, min: 50 },
    ];
    expect(orderCards(eq, 'snowball').map((c) => c.name)).toEqual(['high', 'low']);
  });

  it('a 0% APR card counts as debt (regression: it was silently dropped from the totals); blank APR does not', () => {
    const r = config.calculate({ ...mike, card2rate: '0' });
    expect(getValue(r, 'totalDebt')).toBe('$11,000');
    const blank = config.calculate({ ...mike, card2rate: '' });
    expect(getValue(blank, 'totalDebt')).toBe('$8,000');
  });

  it('payments that never outrun interest are reported, not hidden', () => {
    // $10,000 at 30% accrues $250/mo; a $100 minimum with no extra never clears it
    const r = config.calculate({ extraPayment: '0', card1balance: '10000', card1rate: '30', card1min: '100' });
    expect(getValue(r, 'snowballTime')).toContain('50+ years');
    expect(getValue(r, 'interestSaved')).toContain('N/A');
  });

  it('identical-cost strategies report "Both strategies cost the same" (single card)', () => {
    const r = config.calculate({ extraPayment: '100', card1balance: '3000', card1rate: '20', card1min: '75' });
    expect(getValue(r, 'interestSaved')).toBe('Both strategies cost the same');
  });
});
