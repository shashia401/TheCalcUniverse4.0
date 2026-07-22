import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/character-token';
import { getValue, parseNumber, near } from '../../helpers';

describe('Character-to-Token Converter', () => {
  it('estimates tokens for a short English sentence', () => {
    const r = config.calculate({
      inputText: 'Hello, world! How are you today?',
      tokenizerType: 'openai',
    });
    const tokens = parseNumber(getValue(r, 'estimatedTokens'));
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(20); // should be around 8-12
  });

  it('calculates character count correctly', () => {
    const r = config.calculate({
      inputText: 'Hello world',
      tokenizerType: 'general',
    });
    const chars = parseNumber(getValue(r, 'characterCount'));
    expect(chars).toBe(11);
  });

  it('calculates word count correctly', () => {
    const r = config.calculate({
      inputText: 'The quick brown fox jumps over the lazy dog',
      tokenizerType: 'claude',
    });
    const words = parseNumber(getValue(r, 'wordCount'));
    expect(words).toBe(9);
  });

  it('returns empty array for empty input', () => {
    const r = config.calculate({
      inputText: '',
      tokenizerType: 'openai',
    });
    expect(r).toEqual([]);
  });

  it('supports Claude tokenizer', () => {
    const r = config.calculate({
      inputText: 'Test sentence for token counting',
      tokenizerType: 'claude',
    });
    const tokens = parseNumber(getValue(r, 'estimatedTokens'));
    expect(tokens).toBeGreaterThan(0);
  });

  it('supports Llama 3 tokenizer', () => {
    const r = config.calculate({
      inputText: 'Test sentence for token counting',
      tokenizerType: 'llama3',
    });
    const tokens = parseNumber(getValue(r, 'estimatedTokens'));
    expect(tokens).toBeGreaterThan(0);
  });

  it('shows API cost estimate', () => {
    const r = config.calculate({
      inputText: 'A'.repeat(1000),
      tokenizerType: 'openai',
    });
    const cost = getValue(r, 'estimatedCost');
    expect(cost).toBeTruthy();
    expect(cost).toContain('$');
  });

  it('shows reading time estimate', () => {
    const r = config.calculate({
      inputText: 'This is a test of the token counting system',
      tokenizerType: 'general',
    });
    const readTime = getValue(r, 'estimatedReadTime');
    expect(readTime).toBeTruthy();
  });
});
