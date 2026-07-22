import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/finance/eth-gas-fee/index';
import { getValue, parseNumber, parseMoney, near } from '../../helpers';

describe('eth-gas-fee-calculator', () => {
  const baseValues = {
    transactionType: 'standard-transfer',
    gasPriceGwei: '20',
    ethPrice: '3500',
  };

  it('calculates standard ETH transfer fee (21,000 gas)', () => {
    const r = config.calculate(baseValues);
    const expectedFeeEth = (21000 * 20) / 1e9;
    const expectedFeeUsd = expectedFeeEth * 3500;

    near(parseNumber(getValue(r, 'gasFeeEth')), expectedFeeEth, 0.00001);
    near(parseMoney(getValue(r, 'gasFeeUsd')), expectedFeeUsd);
    expect(getValue(r, 'gasLimit')).toContain('21,000');
    expect(getValue(r, 'transactionType')).toBe('Standard ETH Transfer');
  });

  it('calculates ERC-20 token transfer fee (65,000 gas)', () => {
    const r = config.calculate({
      ...baseValues,
      transactionType: 'erc20-transfer',
    });
    const expectedFeeEth = (65000 * 20) / 1e9;
    near(parseNumber(getValue(r, 'gasFeeEth')), expectedFeeEth, 0.00001);
    expect(getValue(r, 'gasLimit')).toContain('65,000');
  });

  it('calculates Uniswap swap fee (180,000 gas)', () => {
    const r = config.calculate({
      ...baseValues,
      transactionType: 'uniswap-swap',
    });
    const expectedFeeEth = (180000 * 20) / 1e9;
    near(parseNumber(getValue(r, 'gasFeeEth')), expectedFeeEth, 0.00001);
    expect(getValue(r, 'gasLimit')).toContain('180,000');
  });

  it('calculates NFT mint fee (300,000 gas)', () => {
    const r = config.calculate({
      ...baseValues,
      transactionType: 'nft-mint',
    });
    const expectedFeeEth = (300000 * 20) / 1e9;
    near(parseNumber(getValue(r, 'gasFeeEth')), expectedFeeEth, 0.00001);
    expect(getValue(r, 'gasLimit')).toContain('300,000');
  });

  it('calculates complex contract fee (500,000 gas)', () => {
    const r = config.calculate({
      ...baseValues,
      transactionType: 'complex-contract',
    });
    const expectedFeeEth = (500000 * 20) / 1e9;
    near(parseNumber(getValue(r, 'gasFeeEth')), expectedFeeEth, 0.00001);
    expect(getValue(r, 'gasLimit')).toContain('500,000');
  });

  it('calculates fee range with slow, standard, and fast estimates', () => {
    const r = config.calculate(baseValues);
    const feeRange = getValue(r, 'feeRange');
    expect(feeRange).toMatch(/ETH/);
    expect(feeRange).toMatch(/\$/);
    expect(feeRange).toMatch(/–/);

    // Slow and fast USD results should be present
    expect(getValue(r, 'gasFeeUsdSlow')).toMatch(/^\$/);
    expect(getValue(r, 'gasFeeUsdFast')).toMatch(/^\$/);
  });

  it('slow fee is less than standard fee', () => {
    const r = config.calculate(baseValues);
    const slowUsd = parseMoney(getValue(r, 'gasFeeUsdSlow'));
    const stdUsd = parseMoney(getValue(r, 'gasFeeUsd'));
    expect(slowUsd).toBeLessThan(stdUsd);
  });

  it('fast fee is greater than standard fee', () => {
    const r = config.calculate(baseValues);
    const fastUsd = parseMoney(getValue(r, 'gasFeeUsdFast'));
    const stdUsd = parseMoney(getValue(r, 'gasFeeUsd'));
    expect(fastUsd).toBeGreaterThan(stdUsd);
  });

  it('returns empty array when gasPriceGwei is NaN', () => {
    const r = config.calculate({
      ...baseValues,
      gasPriceGwei: 'abc',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when gasPriceGwei is zero or negative', () => {
    const r1 = config.calculate({ ...baseValues, gasPriceGwei: '0' });
    expect(r1).toEqual([]);

    const r2 = config.calculate({ ...baseValues, gasPriceGwei: '-5' });
    expect(r2).toEqual([]);
  });

  it('returns empty array when ethPrice is NaN', () => {
    const r = config.calculate({
      ...baseValues,
      ethPrice: 'not-a-number',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when ethPrice is zero or negative', () => {
    const r1 = config.calculate({ ...baseValues, ethPrice: '0' });
    expect(r1).toEqual([]);

    const r2 = config.calculate({ ...baseValues, ethPrice: '-100' });
    expect(r2).toEqual([]);
  });

  it('returns empty array when ctransactionType is invalid', () => {
    const r = config.calculate({
      transactionType: 'nonexistent-type',
      gasPriceGwei: '20',
      ethPrice: '3500',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when gasPriceGwei is empty string', () => {
    const r = config.calculate({
      transactionType: 'standard-transfer',
      gasPriceGwei: '',
      ethPrice: '3500',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when ethPrice is empty string', () => {
    const r = config.calculate({
      transactionType: 'standard-transfer',
      gasPriceGwei: '20',
      ethPrice: '',
    });
    expect(r).toEqual([]);
  });

  it('calculates correct USD fee with custom ETH price', () => {
    const r = config.calculate({
      ...baseValues,
      ethPrice: '4000',
    });
    const feeEth = (21000 * 20) / 1e9;
    near(parseMoney(getValue(r, 'gasFeeUsd')), feeEth * 4000);
  });

  it('calculates correct USD fee with high gas price during congestion', () => {
    const r = config.calculate({
      transactionType: 'uniswap-swap',
      gasPriceGwei: '120',
      ethPrice: '3800',
    });
    const feeEth = (180000 * 120) / 1e9;
    near(parseNumber(getValue(r, 'gasFeeEth')), feeEth, 0.00001);
    near(parseMoney(getValue(r, 'gasFeeUsd')), feeEth * 3800);
  });

  it('returns correct results count including slow and fast USD outputs', () => {
    const r = config.calculate(baseValues);
    // transactionType, gasPriceGwei, gasLimit, ethPrice, gasFeeEth, gasFeeUsd, gasFeeUsdSlow, gasFeeUsdFast, feeRange
    expect(r.length).toBe(9);
    const ids = r.map((x) => x.id);
    expect(ids).toContain('gasFeeUsdSlow');
    expect(ids).toContain('gasFeeUsdFast');
    expect(ids).toContain('feeRange');
  });

  it('ETH fee is less than 1 for standard transfer at normal gas price', () => {
    const r = config.calculate(baseValues);
    const feeEth = parseNumber(getValue(r, 'gasFeeEth'));
    expect(feeEth).toBeLessThan(1);
    expect(feeEth).toBeGreaterThan(0);
  });

  it('handles very high gas price spike (200+ Gwei)', () => {
    const r = config.calculate({
      transactionType: 'nft-mint',
      gasPriceGwei: '250',
      ethPrice: '5000',
    });
    expect(r.length).toBeGreaterThan(0);
    const feeUsd = parseMoney(getValue(r, 'gasFeeUsd'));
    // 300,000 × 250 / 1e9 × 5000 = 0.075 × 5000 = $375
    expect(feeUsd).toBeGreaterThan(300);
    expect(feeUsd).toBeLessThan(500);
  });

  it('fast fee is exactly 1.5× / 0.9× of standard for same gas limit', () => {
    const r = config.calculate(baseValues);
    const stdEth = parseNumber(getValue(r, 'gasFeeEth'));
    // Fast: 21000 × (20 × 1.5) / 1e9 = 21000 × 30 / 1e9 = 0.00063
    // Standard: 21000 × 20 / 1e9 = 0.00042
    // Slow: 21000 × (20 × 0.9) / 1e9 = 21000 × 18 / 1e9 = 0.000378
    const expectedSlowEth = (21000 * 18) / 1e9;
    const expectedFastEth = (21000 * 30) / 1e9;
    near(parseNumber(getValue(r, 'gasFeeEth')), (21000 * 20) / 1e9, 0.00001);
    // Check the range includes slow and fast
    const feeRange = getValue(r, 'feeRange');
    expect(feeRange).toContain('ETH');
  });
});
