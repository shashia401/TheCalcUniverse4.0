import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/aspect-ratio';
import { getValue, getResult, parseNumber, near } from '../../helpers';

describe('aspect-ratio', () => {
  it('1920x1080 simplifies to 16:9', () => {
    const r = config.calculate({
      mode: 'calculate-ratio',
      width: '1920',
      height: '1080',
    });
    expect(getValue(r, 'simplifiedRatio')).toBe('16:9');
  });

  it('1080x1080 simplifies to 1:1', () => {
    const r = config.calculate({
      mode: 'calculate-ratio',
      width: '1080',
      height: '1080',
    });
    expect(getValue(r, 'simplifiedRatio')).toBe('1:1');
  });

  it('1080x1920 simplifies to 9:16 (TikTok)', () => {
    const r = config.calculate({
      mode: 'calculate-ratio',
      width: '1080',
      height: '1920',
    });
    expect(getValue(r, 'simplifiedRatio')).toBe('9:16');
  });

  it('detects 16:9 preset match for 1920x1080', () => {
    const r = config.calculate({
      mode: 'calculate-ratio',
      width: '1920',
      height: '1080',
    });
    expect(getResult(r, 'presetMatch').value).toContain('16:9');
  });

  it('detects 1:1 preset match for 1080x1080', () => {
    const r = config.calculate({
      mode: 'calculate-ratio',
      width: '1080',
      height: '1080',
    });
    expect(getResult(r, 'presetMatch').value).toContain('1:1');
  });

  it('finds missing height given 16:9 ratio and width', () => {
    const r = config.calculate({
      mode: 'find-missing',
      ratioA: '16',
      ratioB: '9',
      knownDimension: 'width',
      knownValue: '1920',
    });
    // 1920 * 9 / 16 = 1080
    near(parseNumber(getValue(r, 'missingDimension')), 1080);
  });

  it('finds missing width given 16:9 ratio and height', () => {
    const r = config.calculate({
      mode: 'find-missing',
      ratioA: '16',
      ratioB: '9',
      knownDimension: 'height',
      knownValue: '1080',
    });
    // 1080 * 16 / 9 = 1920
    near(parseNumber(getValue(r, 'missingDimension')), 1920);
  });

  it('returns empty array when width is empty', () => {
    const r = config.calculate({
      mode: 'calculate-ratio',
      width: '',
      height: '1080',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when height is empty', () => {
    const r = config.calculate({
      mode: 'calculate-ratio',
      width: '1920',
      height: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when find-missing inputs are empty', () => {
    const r = config.calculate({
      mode: 'find-missing',
      ratioA: '',
      ratioB: '',
      knownDimension: 'width',
      knownValue: '',
    });
    expect(r).toEqual([]);
  });
});
