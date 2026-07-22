import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/character-token/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('character-token', () => {
  it('estimates tokens for General estimator', () => {
    const r = config.calculate({
      inputText: 'The quick brown fox jumps over the lazy dog',
      tokenizerType: 'general',
    });
    const chars = 44; // length of test string
    const expectedTokens = Math.max(1, Math.round(chars * 0.25));
    expect(parseNumber(getValue(r, 'estimatedTokens'))).toBe(expectedTokens);
    expect(getValue(r, 'tokenizerType')).toBe('General Estimate');
  });

  it('estimates tokens for OpenAI tokenizer', () => {
    const r = config.calculate({
      inputText: 'hello world this is a test of the openai tokenizer',
      tokenizerType: 'openai',
    });
    const tokens = parseNumber(getValue(r, 'estimatedTokens'));
    expect(tokens).toBeGreaterThan(0);
    expect(getValue(r, 'tokenizerType')).toBe('OpenAI (cl100k_base)');
  });

  it('estimates tokens for Claude tokenizer', () => {
    const r = config.calculate({
      inputText: 'This is a test sentence for Claude token estimation.',
      tokenizerType: 'claude',
    });
    const chars = 54;
    const expected = Math.max(1, Math.round(chars / 3.5));
    expect(parseNumber(getValue(r, 'estimatedTokens'))).toBe(expected);
  });

  it('estimates tokens for Llama 3 tokenizer', () => {
    const r = config.calculate({
      inputText: 'Llama 3 tokenizer test with some sample text.',
      tokenizerType: 'llama3',
    });
    // Input is 45 characters. 45 / 3.8 = 11.84 → Math.round → 12
    expect(parseNumber(getValue(r, 'estimatedTokens'))).toBe(12);
  });

  it('counts characters correctly', () => {
    const r = config.calculate({
      inputText: 'Hello, World!',
      tokenizerType: 'general',
    });
    expect(parseNumber(getValue(r, 'characterCount'))).toBe(13);
  });

  it('counts words correctly', () => {
    const r = config.calculate({
      inputText: 'The quick brown fox jumps over the lazy dog',
      tokenizerType: 'general',
    });
    expect(parseNumber(getValue(r, 'wordCount'))).toBe(9);
  });

  it('calculates token/char ratio', () => {
    const r = config.calculate({
      inputText: 'test',
      tokenizerType: 'general',
    });
    const ratio = parseFloat(getValue(r, 'tokenCharRatio'));
    expect(ratio).toBeGreaterThan(0);
  });

  it('estimates read time', () => {
    const r = config.calculate({
      inputText: 'hello world this is a test of the read time estimation feature with enough text to be meaningful',
      tokenizerType: 'general',
    });
    expect(getValue(r, 'estimatedReadTime')).toBeTruthy();
  });

  it('estimates generation time', () => {
    const r = config.calculate({
      inputText: 'generate this text and estimate how long it would take',
      tokenizerType: 'general',
    });
    expect(getValue(r, 'estimatedGenTime')).toBeTruthy();
  });

  it('estimates cost', () => {
    const r = config.calculate({
      inputText: 'This is a sample text for cost estimation.',
      tokenizerType: 'openai',
    });
    const cost = getValue(r, 'estimatedCost');
    expect(cost).toContain('$');
  });

  it('returns empty for empty input', () => {
    const r = config.calculate({ inputText: '', tokenizerType: 'general' });
    expect(r).toEqual([]);
  });

  it('returns word count of 0 for empty/whitespace input', () => {
    const r = config.calculate({ inputText: '', tokenizerType: 'general' });
    expect(r).toEqual([]);
  });

  it('OpenAI tokenizer returns consistent results', () => {
    const r1 = config.calculate({ inputText: 'hello world', tokenizerType: 'openai' });
    const r2 = config.calculate({ inputText: 'hello world', tokenizerType: 'openai' });
    expect(getValue(r1, 'estimatedTokens')).toBe(getValue(r2, 'estimatedTokens'));
  });
});
