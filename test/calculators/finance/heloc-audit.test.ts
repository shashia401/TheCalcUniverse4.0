import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/heloc/index';
import { pmt } from '../../../src/utils/financial';
import { getValue } from '../../helpers';

describe('heloc audit', () => {
  it('Jennifer: $550k home, $320k mortgage, 80% CLTV -> $120,000 line; $50k draw at 8.75% = $364.58/mo; equity $230k; LTV 58.2%', () => {
    const r = config.calculate({ homeValue: '550000', mortgageBalance: '320000', maxLTV: '80', helocRate: '8.75', drawAmount: '50000' });
    expect(getValue(r, 'maxCreditLine')).toBe('$120,000.00'); // 550,000 x 0.80 - 320,000
    expect(getValue(r, 'monthlyInterestPayment')).toBe('$364.58'); // 50,000 x 0.0875 / 12
    expect(getValue(r, 'totalEquityResult')).toBe('$230,000.00');
    expect(getValue(r, 'currentLTVResult')).toBe('58.2%');
    const data = JSON.parse(getValue(r, '_helocData'));
    expect(data.requiredCushion).toBe(110000);
  });

  it('David & Lisa: $720k, $395k, 90% CLTV at 9.25% -> $253,000 line, $1,950.21/mo on the full line; 80% would give $181,000', () => {
    const r = config.calculate({ homeValue: '720000', mortgageBalance: '395000', maxLTV: '90', helocRate: '9.25', drawAmount: '0' });
    expect(getValue(r, 'maxCreditLine')).toBe('$253,000.00');
    expect(getValue(r, 'monthlyInterestPayment')).toBe('$1,950.21'); // 253,000 x 0.0925 / 12 = 1950.2083
    expect(JSON.parse(getValue(r, '_helocData')).requiredCushion).toBe(72000);
    const eighty = config.calculate({ homeValue: '720000', mortgageBalance: '395000', maxLTV: '80', helocRate: '9.25' });
    expect(getValue(eighty, 'maxCreditLine')).toBe('$181,000.00');
  });

  it('pro-tip numbers: $100k at 8.75% is $729.17 interest-only and $883.71 over a 20-year repayment (not $1,050)', () => {
    expect(100000 * 0.0875 / 12).toBeCloseTo(729.17, 2);
    expect(pmt(100000, 0.0875 / 12, 240)).toBeCloseTo(883.71, 2);
    expect(50000 * 0.20 / 12).toBeCloseTo(833.33, 2); // 20% APR card on $50k
  });

  it('a draw larger than the line is capped and explained', () => {
    const r = config.calculate({ homeValue: '500000', mortgageBalance: '300000', maxLTV: '80', helocRate: '8', drawAmount: '150000' });
    expect(getValue(r, 'maxCreditLine')).toBe('$100,000.00');
    const pay = r.find((x) => x.id === 'monthlyInterestPayment')!;
    expect(pay.value).toBe('$666.67'); // 100,000 x 0.08 / 12
    expect(pay.interpretation).toContain('more than the $100,000.00 available');
  });

  it('no equity: line is $0, never negative', () => {
    const r = config.calculate({ homeValue: '400000', mortgageBalance: '350000', maxLTV: '80', helocRate: '8' });
    expect(getValue(r, 'maxCreditLine')).toBe('$0.00');
  });
});
