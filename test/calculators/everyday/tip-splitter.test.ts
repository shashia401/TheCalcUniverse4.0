import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/tip-splitter';
import { getValue, parseMoney, near } from '../../helpers';

describe('tip-splitter', () => {
  it('$100 bill, 18% tip, 1 person, no tax = $18 tip / $118 total', () => {
    const r = config.calculate({
      billAmount: '100',
      tipPercent: '18',
      numPeople: '1',
      taxAmount: '0',
    });
    near(parseMoney(getValue(r, 'tipAmount')), 18);
    near(parseMoney(getValue(r, 'totalBill')), 118);
    near(parseMoney(getValue(r, 'perPersonTotal')), 118);
  });

  it('$100 bill, 20% tip, split 4 ways = $30/person', () => {
    const r = config.calculate({
      billAmount: '100',
      tipPercent: '20',
      numPeople: '4',
      taxAmount: '0',
    });
    near(parseMoney(getValue(r, 'tipAmount')), 20);
    near(parseMoney(getValue(r, 'perPersonTotal')), 30); // (100 + 20) / 4
    near(parseMoney(getValue(r, 'perPersonTip')), 5); // 20 / 4
  });

  it('tip is calculated on PRE-tax bill, not post-tax', () => {
    // $108 bill includes $8 tax → pre-tax is $100. 18% of 100 = $18 tip.
    const r = config.calculate({
      billAmount: '108',
      tipPercent: '18',
      numPeople: '1',
      taxAmount: '8',
    });
    near(parseMoney(getValue(r, 'tipAmount')), 18);
    // Total = bill (108) + tip (18) = 126
    near(parseMoney(getValue(r, 'totalBill')), 126);
  });

  it('default tip percent is 18% when omitted', () => {
    const r = config.calculate({
      billAmount: '50',
      tipPercent: '',
      numPeople: '1',
      taxAmount: '0',
    });
    near(parseMoney(getValue(r, 'tipAmount')), 9); // 18% of 50
  });

  it('returns empty for invalid bill amount', () => {
    const r = config.calculate({
      billAmount: 'abc',
      tipPercent: '18',
      numPeople: '1',
      taxAmount: '0',
    });
    expect(r).toEqual([]);
  });
});
