import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/password-generator/index';
import { getValue, parseNumber } from '../../helpers';

describe('Password Generator', () => {
  const defaultValues = {
    length: '16',
    includeUppercase: 'yes',
    includeLowercase: 'yes',
    includeNumbers: 'yes',
    includeSymbols: 'yes',
    avoidAmbiguous: 'no',
    mode: 'random',
  };

  it('generates a password of the correct length', () => {
    const r = config.calculate({ ...defaultValues, length: '20' });
    const password = getValue(r, 'password');
    expect(password.length).toBe(20);
    expect(getValue(r, 'length')).toBe('20');
  });

  it('includes characters from each selected type', () => {
    const r = config.calculate({
      ...defaultValues,
      includeUppercase: 'yes',
      includeLowercase: 'yes',
      includeNumbers: 'yes',
      includeSymbols: 'yes',
      length: '32',
    });
    const password = getValue(r, 'password');

    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?~]/);
  });

  it('excludes ambiguous characters when avoidAmbiguous is set', () => {
    const r = config.calculate({
      ...defaultValues,
      avoidAmbiguous: 'yes',
      length: '32',
    });
    const password = getValue(r, 'password');

    // No ambiguous characters (I, O removed from uppercase; l, o removed from lowercase; 0, 1 removed from numbers)
    expect(password).not.toMatch(/[IOlo]/);
    expect(password).not.toMatch(/[01]/);
  });

  it('calculates entropy correctly', () => {
    const r = config.calculate({ ...defaultValues, length: '10' });
    const entropyStr = getValue(r, 'entropy');
    // 4 character sets: 26 + 26 + 10 + 32 = 94. 10 * log2(94) ≈ 65.6
    const entropy = parseNumber(entropyStr);
    expect(entropy).toBeGreaterThan(60);
    expect(entropy).toBeLessThan(70);
    expect(entropyStr).toMatch(/bits/);
  });

  it('classifies strength correctly based on entropy', () => {
    // Very low charset (only numbers, short length) => Weak
    const weakR = config.calculate({
      includeUppercase: 'no',
      includeLowercase: 'no',
      includeNumbers: 'yes',
      includeSymbols: 'no',
      avoidAmbiguous: 'no',
      mode: 'random',
      length: '4',
    });
    expect(getValue(weakR, 'strength')).toBe('Weak');

    // Large charset, moderate length => Strong or Very Strong
    const strongR = config.calculate({
      ...defaultValues,
      length: '30',
    });
    const strong = getValue(strongR, 'strength');
    expect(['Strong', 'Very Strong']).toContain(strong);
  });

  it('passphrase mode generates hyphenated words with a number', () => {
    const r = config.calculate({
      ...defaultValues,
      mode: 'passphrase',
      length: '16',
    });
    const password = getValue(r, 'password');

    // Should contain hyphens
    expect(password).toContain('-');

    // Should end with a number (0-999)
    expect(password).toMatch(/[0-9]$/);

    // Should contain capitalized words
    const parts = password.split('-');
    expect(parts.length).toBeGreaterThanOrEqual(3);
    parts.forEach((part, i) => {
      if (i < parts.length - 1) {
        // The last part might include the trailing number, so check differently
        const alphaPart = part.replace(/[0-9]/g, '');
        if (alphaPart.length > 0) {
          expect(alphaPart[0]).toMatch(/[A-Z]/);
        }
      }
    });
  });

  it('returns empty results when no character sets are selected', () => {
    const r = config.calculate({
      length: '16',
      includeUppercase: 'no',
      includeLowercase: 'no',
      includeNumbers: 'no',
      includeSymbols: 'no',
      avoidAmbiguous: 'no',
      mode: 'random',
    });
    expect(r).toEqual([]);
  });

  it('formats crack time correctly', () => {
    // Low entropy -> very short crack time
    const weakR = config.calculate({
      includeUppercase: 'no',
      includeLowercase: 'no',
      includeNumbers: 'yes',
      includeSymbols: 'no',
      avoidAmbiguous: 'no',
      mode: 'random',
      length: '4',
    });
    const crackTime = getValue(weakR, 'crackTime');
    expect(crackTime).toMatch(/(seconds?|minute)/);

    // High entropy -> very long crack time
    const strongR = config.calculate({
      ...defaultValues,
      length: '40',
    });
    const strongCrackTime = getValue(strongR, 'crackTime');
    expect(strongCrackTime).toMatch(/(years?|days?)/);
  });

  it('handles minimum and maximum lengths', () => {
    // Minimum length 4
    const minR = config.calculate({ ...defaultValues, length: '3' });
    expect(getValue(minR, 'password').length).toBeGreaterThanOrEqual(4);

    // Maximum length 128
    const maxR = config.calculate({ ...defaultValues, length: '200' });
    expect(getValue(maxR, 'password').length).toBeLessThanOrEqual(128);
  });
});
