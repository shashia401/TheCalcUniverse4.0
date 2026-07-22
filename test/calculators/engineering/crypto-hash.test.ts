import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/crypto-hash/index';
import { getValue } from '../../helpers';

describe('crypto-hash', () => {
  it('generates SHA-256 hash for "hello world"', () => {
    const r = config.calculate({ inputText: 'hello world', algorithm: 'sha-256' });
    const hash = getValue(r, 'hash');
    // SHA-256 hash of "hello world" (known test vector)
    expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    expect(getValue(r, 'algorithm')).toBe('SHA-256');
  });

  it('generates MD5 hash for "hello world"', () => {
    const r = config.calculate({ inputText: 'hello world', algorithm: 'md5' });
    const hash = getValue(r, 'hash');
    // MD5 hash of "hello world"
    expect(hash).toBe('5eb63bbbe01eeed093cb22bb8f5acdc3');
    expect(getValue(r, 'algorithm')).toBe('MD5');
  });

  it('generates SHA-1 hash for "hello world"', () => {
    const r = config.calculate({ inputText: 'hello world', algorithm: 'sha-1' });
    const hash = getValue(r, 'hash');
    // SHA-1 hash of "hello world"
    expect(hash).toBe('2aae6c35c94fcfb415dbe95f408b9ce91ee846ed');
    expect(getValue(r, 'algorithm')).toBe('SHA-1');
  });

  it('generates SHA-384 hash', () => {
    const r = config.calculate({ inputText: 'hello world', algorithm: 'sha-384' });
    const hash = getValue(r, 'hash');
    expect(hash.length).toBe(96); // 384 bits = 48 bytes = 96 hex chars
    expect(getValue(r, 'algorithm')).toBe('SHA-384');
  });

  it('generates SHA-512 hash', () => {
    const r = config.calculate({ inputText: 'hello world', algorithm: 'sha-512' });
    const hash = getValue(r, 'hash');
    expect(hash.length).toBe(128); // 512 bits = 64 bytes = 128 hex chars
    expect(getValue(r, 'algorithm')).toBe('SHA-512');
  });

  it('generates Keccak-256 (SHA3-256) hash', () => {
    const r = config.calculate({ inputText: 'hello world', algorithm: 'keccak-256' });
    const hash = getValue(r, 'hash');
    expect(getValue(r, 'algorithm')).toBe('Keccak-256');
    // SHA3-256 of "hello world" should be 64 hex chars
    expect(hash.length).toBe(64);
  });

  it('returns input length', () => {
    const r = config.calculate({ inputText: 'hello world', algorithm: 'sha-256' });
    expect(getValue(r, 'inputLength')).toContain('11');
  });

  it('returns hash length in bytes', () => {
    const r = config.calculate({ inputText: 'hello world', algorithm: 'sha-256' });
    expect(getValue(r, 'hashLength')).toContain('32');
  });

  it('returns hash size in bits', () => {
    const r = config.calculate({ inputText: 'hello world', algorithm: 'sha-256' });
    expect(getValue(r, 'hashBytes')).toContain('256');
  });

  it('returns input preview for long text', () => {
    const longText = 'a'.repeat(100);
    const r = config.calculate({ inputText: longText, algorithm: 'sha-256' });
    expect(getValue(r, 'inputPreview')).toContain('...');
    expect(getValue(r, 'inputLength')).toContain('100');
  });

  it('computes hash for empty string (valid cryptographic operation)', () => {
    const r = config.calculate({ inputText: '', algorithm: 'sha-256' });
    // SHA-256 of empty string is a well-known test vector
    expect(getValue(r, 'hash')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(getValue(r, 'algorithm')).toBe('SHA-256');
    expect(getValue(r, 'inputLength')).toContain('0');
    expect(getValue(r, 'hashBytes')).toContain('256');
  });

  it('handles unicode and emoji input correctly', () => {
    const r = config.calculate({ inputText: 'Hello 世界 🌍', algorithm: 'sha-256' });
    expect(getValue(r, 'hash').length).toBe(64);
    expect(getValue(r, 'algorithm')).toBe('SHA-256');
  });

  it('handles special characters and multiline input', () => {
    const r = config.calculate({ inputText: 'Line1\nLine2\tTab\nSpecial: !@#$%^&*()', algorithm: 'sha-256' });
    expect(getValue(r, 'hash').length).toBe(64);
    expect(getValue(r, 'inputLength')).toContain('35');
  });

  it('defaults to SHA-256 when no algorithm specified', () => {
    const r = config.calculate({ inputText: 'test', algorithm: '' });
    expect(getValue(r, 'algorithm')).toBe('SHA-256');
    expect(getValue(r, 'hash').length).toBe(64);
  });

  it('produces different hashes for different algorithms on same input', () => {
    const r256 = config.calculate({ inputText: 'test', algorithm: 'sha-256' });
    const r512 = config.calculate({ inputText: 'test', algorithm: 'sha-512' });
    expect(getValue(r256, 'hash')).not.toBe(getValue(r512, 'hash'));
  });

  it('produces different hash when input changes (avalanche)', () => {
    const r1 = config.calculate({ inputText: 'hello world', algorithm: 'sha-256' });
    const r2 = config.calculate({ inputText: 'hello worlD', algorithm: 'sha-256' });
    expect(getValue(r1, 'hash')).not.toBe(getValue(r2, 'hash'));
  });

  // ─── Educational content ───

  it('has inputMode on text input', () => {
    const textInput = config.inputs.find((i) => i.id === 'inputText');
    expect(textInput?.inputMode).toBe('text');
  });

  it('has at least 5 FAQs', () => {
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
  });

  it('has workedExamples with scenarios and insights', () => {
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
    config.educational.workedExamples!.forEach((ex) => {
      expect(ex.scenario).toBeTruthy();
      expect(ex.inputs).toBeTruthy();
      expect(ex.insight).toBeTruthy();
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
    expect(config.educational.diagram).toBeTruthy();
    expect(config.educational.diagram!.svg).toBeTruthy();
    expect(config.educational.diagram!.alt).toBeTruthy();
  });
});
