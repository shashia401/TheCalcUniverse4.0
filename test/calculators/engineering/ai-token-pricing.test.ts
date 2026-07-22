import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/ai-token-pricing/index';
import { getValue, parseNumber, parseMoney, near } from '../../helpers';

describe('ai-token-pricing', () => {
  const baseValues = {
    model: 'gpt-4o',
    promptTokensPerRequest: '500',
    completionTokensPerRequest: '150',
    dailyActiveUsers: '',
    requestsPerUser: '',
  };

  it('calculates cost per request for GPT-4o', () => {
    const r = config.calculate(baseValues);
    const inputTokens = 500;
    const outputTokens = 150;
    const expectedInputCost = (inputTokens / 1_000_000) * 2.50;
    const expectedOutputCost = (outputTokens / 1_000_000) * 10.00;
    const expectedTotal = expectedInputCost + expectedOutputCost;

    near(parseMoney(getValue(r, 'inputCost')), expectedInputCost);
    near(parseMoney(getValue(r, 'outputCost')), expectedOutputCost);
    near(parseMoney(getValue(r, 'costPerRequest')), expectedTotal);
  });

  it('calculates with GPT-4o-mini', () => {
    const r = config.calculate({ ...baseValues, model: 'gpt-4o-mini' });
    const expected = (500 / 1_000_000) * 0.15 + (150 / 1_000_000) * 0.60;
    near(parseMoney(getValue(r, 'costPerRequest')), expected);
    expect(getValue(r, 'modelName')).toBe('GPT-4o-mini');
  });

  it('calculates annual and monthly costs with DAU', () => {
    const r = config.calculate({
      ...baseValues,
      dailyActiveUsers: '10000',
      requestsPerUser: '5',
    });

    const costPerReq = (500 / 1_000_000) * 2.50 + (150 / 1_000_000) * 10.00;
    const expectedMonthly = costPerReq * 10000 * 5 * 30;
    const expectedAnnual = expectedMonthly * 12;

    // Monthly cost should be ~$4,125
    expect(parseMoney(getValue(r, 'monthlyCost'))).toBeGreaterThan(4000);
    expect(parseMoney(getValue(r, 'monthlyCost'))).toBeLessThan(4300);
    expect(parseMoney(getValue(r, 'annualCost'))).toBeGreaterThan(48000);
    expect(parseMoney(getValue(r, 'annualCost'))).toBeLessThan(52000);
  });

  it('calculates cost per user correctly', () => {
    const r = config.calculate({
      ...baseValues,
      dailyActiveUsers: '5000',
      requestsPerUser: '3',
    });
    const costPerReq = (500 / 1_000_000) * 2.50 + (150 / 1_000_000) * 10.00;
    const expectedMonthly = costPerReq * 5000 * 3 * 30;
    const expectedPerUser = expectedMonthly / 5000;
    near(parseMoney(getValue(r, 'costPerUser')), expectedPerUser);
  });

  it('handles Gemini 3.1 Flash pricing', () => {
    const r = config.calculate({ ...baseValues, model: 'gemini-3-flash' });
    const expected = (500 / 1_000_000) * 0.15 + (150 / 1_000_000) * 0.60;
    near(parseMoney(getValue(r, 'costPerRequest')), expected);
    expect(getValue(r, 'modelName')).toBe('Gemini 3.1 Flash');
  });

  it('shows Claude Sonnet 4.6 pricing', () => {
    const r = config.calculate({ ...baseValues, model: 'claude-sonnet-4' });
    expect(getValue(r, 'modelName')).toBe('Claude Sonnet 4.6');
    expect(getValue(r, 'inputPrice')).toBe('$3.00');
    expect(getValue(r, 'outputPrice')).toBe('$15.00');
  });

  it('returns empty for missing prompt tokens', () => {
    const r = config.calculate({
      ...baseValues,
      promptTokensPerRequest: '',
      completionTokensPerRequest: '150',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing completion tokens', () => {
    const r = config.calculate({
      ...baseValues,
      promptTokensPerRequest: '500',
      completionTokensPerRequest: '',
    });
    expect(r).toEqual([]);
  });

  it('returns zero monthly cost when DAU is not provided', () => {
    const r = config.calculate(baseValues);
    expect(parseMoney(getValue(r, 'monthlyCost'))).toBeCloseTo(0);
    expect(parseMoney(getValue(r, 'annualCost'))).toBeCloseTo(0);
  });

  it('calculates total monthly tokens', () => {
    const r = config.calculate(baseValues);
    const totalTokens = (500 + 150) * 30;
    expect(parseNumber(getValue(r, 'totalMonthlyTokens'))).toBe(totalTokens);
  });

  // ─── Educational content ───

  it('has inputMode on number inputs', () => {
    const promptInput = config.inputs.find((i) => i.id === 'promptTokensPerRequest');
    const completionInput = config.inputs.find((i) => i.id === 'completionTokensPerRequest');
    const dauInput = config.inputs.find((i) => i.id === 'dailyActiveUsers');
    const rpuInput = config.inputs.find((i) => i.id === 'requestsPerUser');
    expect(promptInput?.inputMode).toBe('numeric');
    expect(completionInput?.inputMode).toBe('numeric');
    expect(dauInput?.inputMode).toBe('numeric');
    expect(rpuInput?.inputMode).toBe('numeric');
  });

  it('has at least 5 FAQs', () => {
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
  });

  it('has workedExamples with scenarios and insights', () => {
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
    config.educational.workedExamples!.forEach((ex) => {
      expect(ex.scenario).toBeTruthy();
      expect(ex.inputs).toBeTruthy();
      expect(ex.insight.length).toBeGreaterThan(100);
    });
  });

  it('has proTips', () => {
    expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(4);
    config.educational.proTips!.forEach((tip) => {
      expect(tip.length).toBeGreaterThan(50);
    });
  });

  it('has limitations with real content', () => {
    expect(config.educational.limitations).toBeTruthy();
    expect(config.educational.limitations.length).toBeGreaterThan(0);
    expect(config.educational.limitations.every((l: string) => l.length > 20)).toBe(true);
  });

  it('has quickReference', () => {
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(4);
  });

  it('has all required educational sections', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.explanation!.length).toBeGreaterThan(300);
  });
});
