import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/eth-gas-fee/index';
import { computeGasFee, feeEth, fmtEth, fmtGwei, TX_TYPES } from '../../../src/calculators/finance/eth-gas-fee/gasFee';
import { getValue } from '../../helpers';

// fee(ETH) = gas units x Gwei x 1e-9 (1 Gwei = 1e-9 ETH). Hand checks below.
describe('eth-gas-fee audit', () => {
  it('21,000 gas at 20 Gwei = 0.00042 ETH = $1.47 at $3,500 (diagram/alt text example)', () => {
    expect(feeEth(21000, 20)).toBeCloseTo(0.00042, 12);
    const r = config.calculate({ transactionType: 'standard-transfer', gasPriceGwei: '20', ethPrice: '3500' });
    expect(getValue(r, 'gasFeeEth')).toBe('0.00042 ETH');
    expect(getValue(r, 'gasFeeUsd')).toBe('$1.47');
    expect(getValue(r, 'gasFeeUsdSlow')).toBe('$1.32'); // 0.9x: 0.000378 ETH x 3500 = 1.323
    expect(getValue(r, 'gasFeeUsdFast')).toBe('$2.21'); // 1.5x: 0.00063 ETH x 3500 = 2.205
  });

  it('FAQ: at $3,500/ETH one gas unit at 20 Gwei costs $0.00007', () => {
    expect(20e-9 * 3500).toBeCloseTo(0.00007, 12);
  });

  it('Uniswap swap: 180,000 gas at 30 Gwei = 0.0054 ETH', () => {
    const f = computeGasFee('uniswap-swap', 30, 2000)!;
    expect(f.eth.std).toBeCloseTo(0.0054, 12);
    expect(f.usd.std).toBeCloseTo(10.8, 10);
  });

  it('sub-Gwei prices do not round to zero (regression: toFixed(1) showed "0.0 Gwei"; toFixed(6) lost digits)', () => {
    const r = config.calculate({ transactionType: 'standard-transfer', gasPriceGwei: '0.05', ethPrice: '3000' });
    expect(getValue(r, 'gasPriceGwei')).toBe('0.05 Gwei');
    expect(fmtGwei(0.05)).toBe('0.05 Gwei');
    // 21,000 x 0.05 Gwei = 0.00000105 ETH
    expect(getValue(r, 'gasFeeEth')).toBe('0.00000105 ETH');
    expect(fmtEth(0.00000105)).toBe('0.00000105 ETH');
  });

  it('every preset type returns results; unknown type, zero or blank prices return []', () => {
    for (const t of Object.keys(TX_TYPES)) {
      expect(config.calculate({ transactionType: t, gasPriceGwei: '20', ethPrice: '3500' }).length).toBeGreaterThan(5);
    }
    expect(config.calculate({ transactionType: 'bogus', gasPriceGwei: '20', ethPrice: '3500' })).toEqual([]);
    expect(config.calculate({ transactionType: 'standard-transfer', gasPriceGwei: '0', ethPrice: '3500' })).toEqual([]);
    expect(config.calculate({ transactionType: 'standard-transfer', gasPriceGwei: '20' })).toEqual([]);
  });

  it('the interpretation tells the user the prices are not live', () => {
    const r = config.calculate({ transactionType: 'standard-transfer', gasPriceGwei: '20', ethPrice: '3500' });
    const text = r.find((x) => x.id === 'gasFeeEth')!.interpretation!;
    expect(text).toContain('not live data');
    expect(text).not.toMatch(/\$\$/);
  });
});
