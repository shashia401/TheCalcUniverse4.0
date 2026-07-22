import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/wpm-typing-test/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('WPM Typing Test Calculator', () => {
  it('exact match = 100% accuracy', () => {
    const results = config.calculate({
      mode: 'calculate-wpm',
      sourceText: 'The quick brown fox jumps',
      typedText: 'The quick brown fox jumps',
    });

    const accuracy = parseNumber(getValue(results, 'accuracy'));
    near(accuracy, 100);

    const grossWpm = parseNumber(getValue(results, 'grossWpm'));
    // 25 chars / 5 = 5 wpm
    near(grossWpm, 5);

    const netWpm = parseNumber(getValue(results, 'netWpm'));
    near(netWpm, 5); // 5 * 100/100 = 5

    const errors = parseNumber(getValue(results, 'errorCount'));
    near(errors, 0);
  });

  it('50% accuracy on half-wrong text', () => {
    const results = config.calculate({
      mode: 'calculate-wpm',
      sourceText: 'abcdefghij',
      typedText: 'abcde12345',
    });

    // first 5 chars match (abcde), last 5 don't (12345 vs fghij)
    // totalChars = 10, correctChars = 5
    // accuracy = 5/10 * 100 = 50%
    const accuracy = parseNumber(getValue(results, 'accuracy'));
    near(accuracy, 50);

    const errors = parseNumber(getValue(results, 'errorCount'));
    near(errors, 5);
  });

  it('returns empty array when sourceText is empty', () => {
    const results = config.calculate({
      mode: 'calculate-wpm',
      sourceText: '',
      typedText: 'something',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array when typedText is empty', () => {
    const results = config.calculate({
      mode: 'calculate-wpm',
      sourceText: 'something',
      typedText: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array when both texts are empty', () => {
    const results = config.calculate({
      mode: 'calculate-wpm',
      sourceText: '',
      typedText: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array for practice mode', () => {
    const results = config.calculate({
      mode: 'practice',
      timerMinutes: '1',
    });
    expect(results).toEqual([]);
  });

  it('handles text longer than source (extra chars are errors)', () => {
    const results = config.calculate({
      mode: 'calculate-wpm',
      sourceText: 'abc',
      typedText: 'abcdef',
    });

    // correctChars = 3 (a, b, c match at positions 0,1,2)
    // totalChars = 6
    // accuracy = 3/6 * 100 = 50%
    const accuracy = parseNumber(getValue(results, 'accuracy'));
    near(accuracy, 50);

    const grossWpm = parseNumber(getValue(results, 'grossWpm'));
    near(grossWpm, 1.2); // 6/5 = 1.2
  });

  it('calculates WPM from realistic typing test', () => {
    const source = 'the quick brown fox jumps over the lazy dog';
    const typed = 'the quikc brown fox jumps over the lazy dog'; // 1 error: "quikc" instead of "quick"

    const results = config.calculate({
      mode: 'calculate-wpm',
      sourceText: source,
      typedText: typed,
    });

    // source has 43 chars, typed has 43 chars
    // "the quick" vs "the quikc" - positions 4-5 are flipped
    // Let's count: t(0)=t, h(1)=h, e(2)=e, space(3)=space, q(4)=q, u(5)=u, i(6)=i,
    //   c(7)=k ≠ k(7)=c, so position 7 is wrong: c != k
    //   position 8: k != c (shifted disagreement)
    //   Actually: "quick" has 5 chars, "quikc" has 5 chars with different order
    //   Position 4: q=q, 5: u=u, 6: i=i, 7: c≠k, 8: k≠c -> 2 errors
    //   Rest matches: " brown fox jumps over the lazy dog" (31 chars)
    //   totalChars = 43, correctChars = 43 - 2 = 41
    //   accuracy = 41/43 * 100 ≈ 95.35%
    //   gross = 43/5 = 8.6
    //   net = 8.6 * 0.9535 ≈ 8.2

    const accuracy = parseNumber(getValue(results, 'accuracy'));
    expect(accuracy).toBeGreaterThan(90);
    expect(accuracy).toBeLessThan(100);

    const grossWpm = parseNumber(getValue(results, 'grossWpm'));
    near(grossWpm, 8.6, 0.01);

    const netWpm = parseNumber(getValue(results, 'netWpm'));
    expect(netWpm).toBeGreaterThan(0);
    expect(netWpm).toBeLessThan(grossWpm);
  });
});
