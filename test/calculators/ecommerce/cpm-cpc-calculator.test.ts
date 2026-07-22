import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/ecommerce/cpm-cpc';
import { getValue, parseNumber, near } from '../../helpers';

describe('cpm-cpc', () => {
  it('calculates CPM from ad spend and impressions', () => {
    const r = config.calculate({
      mode: 'cpm-from-spend',
      adSpend: '500',
      impressions: '50000',
      clicks: '',
    });
    // CPM = 500 / 50000 * 1000 = $10.00
    near(parseNumber(getValue(r, 'cpm')), 10);
  });

  it('calculates CPC from ad spend and clicks', () => {
    const r = config.calculate({
      mode: 'cpc-from-spend',
      adSpend: '500',
      clicks: '1200',
      impressions: '',
    });
    // CPC = 500 / 1200 = $0.4167
    near(parseNumber(getValue(r, 'cpc')), 0.4167);
  });

  it('calculates CTR when both clicks and impressions are available', () => {
    const r = config.calculate({
      mode: 'cpm-from-spend',
      adSpend: '500',
      impressions: '50000',
      clicks: '1200',
    });
    // CTR = 1200 / 50000 * 100 = 2.4%
    near(parseNumber(getValue(r, 'ctr')), 2.4);
  });

  it('returns required budget in reverse budget mode', () => {
    const r = config.calculate({
      mode: 'reverse-budget',
      targetCpm: '12',
      desiredImpressions: '100000',
      adSpend: '',
      impressions: '',
      clicks: '',
    });
    // Budget = 12 * 100000 / 1000 = $1,200
    near(parseNumber(getValue(r, 'requiredBudget')), 1200);
  });

  it('returns empty array when ad spend is missing', () => {
    const r = config.calculate({
      mode: 'cpm-from-spend',
      adSpend: '',
      impressions: '50000',
      clicks: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when impressions is zero in CPM mode', () => {
    const r = config.calculate({
      mode: 'cpm-from-spend',
      adSpend: '500',
      impressions: '0',
      clicks: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when clicks is zero in CPC mode', () => {
    const r = config.calculate({
      mode: 'cpc-from-spend',
      adSpend: '500',
      clicks: '0',
      impressions: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when reverse budget inputs are missing', () => {
    const r = config.calculate({
      mode: 'reverse-budget',
      targetCpm: '',
      desiredImpressions: '',
      adSpend: '',
      impressions: '',
      clicks: '',
    });
    expect(r).toEqual([]);
  });
});
