import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/realestate/closing-costs/index';
import { getValue, parseMoney, parseNumber, near } from '../../helpers';

describe('Closing Costs Calculator', () => {
  it('calculates buyer closing costs', () => {
    const results = config.calculate({
      homePrice: '400000',
      downPaymentPct: '20',
      loanTerm: '30',
      interestRate: '6.8',
      party: 'buyer',
    });
    // loanAmount = 400k * 0.8 = 320k
    // origination = 320k * 0.01 = 3200
    const origination = parseMoney(getValue(results, 'origination'));
    near(origination, 3200);
    // appraisal = 550
    const appraisal = parseMoney(getValue(results, 'appraisal'));
    near(appraisal, 550);
  });

  it('calculates seller closing costs', () => {
    const results = config.calculate({
      homePrice: '400000',
      downPaymentPct: '20',
      loanTerm: '30',
      interestRate: '6.8',
      party: 'seller',
    });
    // Commission: 2.5% buyer + 2.5% seller = 5% total = 20000
    const commBuyer = parseMoney(getValue(results, 'commissionBuyer'));
    near(commBuyer, 10000); // 400k * 0.025
    const commSeller = parseMoney(getValue(results, 'commissionSeller'));
    near(commSeller, 10000);
    // Transfer tax: 400k * 0.002 = 800
    const transfer = parseMoney(getValue(results, 'transferTax'));
    near(transfer, 800);
  });

  it('shows both buyer and seller costs', () => {
    const results = config.calculate({
      homePrice: '400000',
      downPaymentPct: '20',
      loanTerm: '30',
      interestRate: '6.8',
      party: 'both',
    });
    const ids = results.map((r) => r.id);
    expect(ids).toContain('totalBuyer');
    expect(ids).toContain('totalSeller');
  });

  it('calculates prepaid items for buyer', () => {
    const results = config.calculate({
      homePrice: '400000',
      downPaymentPct: '20',
      loanTerm: '30',
      interestRate: '6.8',
      party: 'buyer',
    });
    // prepaidIns = 400k * 0.005 = 2000
    const ins = parseMoney(getValue(results, 'prepaidIns'));
    near(ins, 2000);
    // escrow setup = 350
    const escrow = parseMoney(getValue(results, 'escrowSetup'));
    near(escrow, 350);
  });

  it('returns empty for missing home price', () => {
    const results = config.calculate({
      homePrice: '',
      downPaymentPct: '20',
      loanTerm: '30',
      interestRate: '6.8',
      party: 'buyer',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for zero home price', () => {
    const results = config.calculate({
      homePrice: '0',
      downPaymentPct: '20',
      loanTerm: '30',
      interestRate: '6.8',
      party: 'buyer',
    });
    expect(results).toEqual([]);
  });
});
