import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/ai-token-pricing';
import { MODELS, PRICES_AS_OF, requestCost } from '../../../src/calculators/engineering/ai-token-pricing/aiPricingData';
import { getResult, getValue, parseMoney, near } from '../../helpers';

const run = (v: Record<string, string>) =>
  config.calculate({ model: 'claude-sonnet-4', promptText: '', promptTokensPerRequest: '500', completionTokensPerRequest: '150', useCachePricing: 'no', cachedShare: '', dailyActiveUsers: '', requestsPerUser: '', ...v });

// Cost = prompt/1M x input + completion/1M x output. Prices read from the Anthropic and Google pricing pages on 2026-10-12.
describe('ai-token-pricing audit', () => {
  it('price table: Anthropic and Google rows match the provider pages read on the snapshot date', () => {
    expect(PRICES_AS_OF).toBe('2026-10-12');
    expect(MODELS['claude-opus-4']).toMatchObject({ inputPrice: 5, outputPrice: 25, cachedInput: 0.5, verified: true });
    expect(MODELS['claude-sonnet-4']).toMatchObject({ inputPrice: 3, outputPrice: 15, cachedInput: 0.3, verified: true });
    expect(MODELS['claude-haiku-4']).toMatchObject({ inputPrice: 1, outputPrice: 5, cachedInput: 0.1, verified: true });
    expect(MODELS['gemini-3-pro']).toMatchObject({ inputPrice: 2, outputPrice: 12, cachedInput: 0.2, verified: true });
    expect(MODELS['gemini-3-flash']).toMatchObject({ inputPrice: 0.5, outputPrice: 3, cachedInput: 0.05, verified: true });
    expect(MODELS['gpt-5'].verified).toBe(false);
  });
  it('support chatbot: $0.00375/request, $187.50/day, $5,625/month, $68,437.50/year', () => {
    const r = run({ dailyActiveUsers: '10000', requestsPerUser: '5' });
    near(parseMoney(getValue(r, 'costPerRequest')), 0.00375, 1e-9);
    expect(getValue(r, 'monthlyCost')).toBe('$5.63K'); // formatted K; exact value checked below
    near(requestCost(MODELS['claude-sonnet-4'], 500, 150, false).total * 50000 * 30, 5625, 1e-6);
    near(requestCost(MODELS['claude-sonnet-4'], 500, 150, false).total * 50000 * 365, 68437.5, 1e-6);
    expect(getValue(r, 'annualCost')).toBe('$68.44K');
    expect(getValue(r, 'costPerUser')).toBe('$0.5625');
  });
  it('cached prompt: full cache = $0.0024/request ($3,600/month); 80% cache share is in between', () => {
    const full = run({ useCachePricing: 'yes', cachedShare: '100' });
    near(parseMoney(getValue(full, 'costPerRequest')), 0.0024, 1e-9);
    const part = requestCost(MODELS['claude-sonnet-4'], 500, 150, true, 0.8);
    near(part.total, (500 / 1e6) * (3 * 0.2 + 0.3 * 0.8) + 0.00225, 1e-12);
    expect(part.total).toBeGreaterThan(0.0024);
    expect(part.total).toBeLessThan(0.00375);
  });
  it('Opus 4.7 code agent: cached 8000/2000 = $0.054/request, $108/day, $3,240/month; uncached $0.09', () => {
    const c = requestCost(MODELS['claude-opus-4'], 8000, 2000, true).total;
    const u = requestCost(MODELS['claude-opus-4'], 8000, 2000, false).total;
    near(c, 0.054, 1e-9); near(u, 0.09, 1e-9);
    near(c * 2000, 108, 1e-6); near(c * 2000 * 30, 3240, 1e-6); near(c * 2000 * 365, 39420, 1e-6); near(u * 2000 * 30, 5400, 1e-6);
  });
  it('Gemini 3 Flash classification: $0.000035/request, $105/day, $3,150/month; Opus uncached is 21x', () => {
    const g = requestCost(MODELS['gemini-3-flash'], 100, 10, true).total;
    near(g, 0.000035, 1e-12);
    near(g * 3e6 * 30, 3150, 1e-6);
    near(requestCost(MODELS['claude-opus-4'], 100, 10, false).total / g, 21.43, 0.01);
  });
  it('flags unverified rows; verified rows say so', () => {
    expect(getResult(run({ model: 'gpt-4o' }), 'priceStatus').value).toMatch(/Unverified/);
    expect(getResult(run({}), 'priceStatus').value).toMatch(/provider's pricing page/);
    expect(getValue(run({}), 'lastUpdated')).toBe('2026-10-12');
  });
  it('no usage inputs -> monthly/annual $0 and zero tokens (no invented one-request-a-day volume)', () => {
    const r = run({});
    expect(getValue(r, 'monthlyCost')).toBe('$0');
    expect(getValue(r, 'totalMonthlyTokens')).toBe('0');
  });
  it('invalid input returns []', () => {
    expect(run({ promptTokensPerRequest: '', completionTokensPerRequest: '150' })).toEqual([]);
    expect(run({ useCachePricing: 'yes', cachedShare: '150' })).toEqual([]);
    expect(run({ model: 'nope' })).toEqual([]);
  });
});
