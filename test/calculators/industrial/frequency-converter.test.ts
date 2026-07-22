import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/frequency-converter/index';
import { getValue, near } from '../../helpers';

/**
 * Helper: extract the converted result value from a result string
 * of the form "{input} {fromLabel} = {result} {toLabel}"
 */
function parseResult(results: ReturnType<typeof config.calculate>, id: string): number {
  const str = getValue(results, id);
  const afterEq = str.split('=')[1];
  if (!afterEq) throw new Error(`No '=' in result string: "${str}"`);
  const numStr = afterEq.trim().split(' ')[0].replace(/,/g, '');
  return parseFloat(numStr);
}

describe('Frequency Converter', () => {
  // ─── Basic conversions ─────────────────────────────────────
  it('1 Hz = 1 Hz (identity)', () => {
    const r = config.calculate({ value: '1', from: 'hz', to: 'hz' });
    near(parseResult(r, 'result'), 1);
  });

  it('1 kHz = 1000 Hz', () => {
    const r = config.calculate({ value: '1', from: 'khz', to: 'hz' });
    near(parseResult(r, 'result'), 1000);
  });

  it('1000 Hz = 1 kHz', () => {
    const r = config.calculate({ value: '1000', from: 'hz', to: 'khz' });
    near(parseResult(r, 'result'), 1);
  });

  it('1 MHz = 1,000,000 Hz', () => {
    const r = config.calculate({ value: '1', from: 'mhz', to: 'hz' });
    near(parseResult(r, 'result'), 1000000);
  });

  it('1 GHz = 1000 MHz', () => {
    const r = config.calculate({ value: '1', from: 'ghz', to: 'mhz' });
    near(parseResult(r, 'result'), 1000);
  });

  it('1 THz = 1000 GHz', () => {
    const r = config.calculate({ value: '1', from: 'thz', to: 'ghz' });
    near(parseResult(r, 'result'), 1000);
  });

  // ─── RPM conversions ───────────────────────────────────────
  it('60 RPM = 1 Hz', () => {
    const r = config.calculate({ value: '60', from: 'rpm', to: 'hz' });
    near(parseResult(r, 'result'), 1);
  });

  it('1 Hz = 60 RPM', () => {
    const r = config.calculate({ value: '1', from: 'hz', to: 'rpm' });
    near(parseResult(r, 'result'), 60);
  });

  it('3600 RPM = 60 Hz (US synchronous motor)', () => {
    const r = config.calculate({ value: '3600', from: 'rpm', to: 'hz' });
    near(parseResult(r, 'result'), 60);
  });

  it('3000 RPM = 50 Hz (EU synchronous motor)', () => {
    const r = config.calculate({ value: '3000', from: 'rpm', to: 'hz' });
    near(parseResult(r, 'result'), 50);
  });

  // ─── rad/s conversions ─────────────────────────────────────
  it('1 Hz ≈ 6.283 rad/s', () => {
    const r = config.calculate({ value: '1', from: 'hz', to: 'rads' });
    near(parseResult(r, 'result'), 6.283, 0.01);
  });

  it('2π rad/s = 1 Hz', () => {
    const r = config.calculate({ value: `${2 * Math.PI}`, from: 'rads', to: 'hz' });
    near(parseResult(r, 'result'), 1, 0.01);
  });

  // ─── BPM conversions ───────────────────────────────────────
  it('60 BPM = 1 Hz', () => {
    const r = config.calculate({ value: '60', from: 'bpm', to: 'hz' });
    near(parseResult(r, 'result'), 1);
  });

  it('120 BPM = 2 Hz (typical dance music tempo)', () => {
    const r = config.calculate({ value: '120', from: 'bpm', to: 'hz' });
    near(parseResult(r, 'result'), 2);
  });

  // ─── degrees/sec conversions ───────────────────────────────
  it('360 °/s = 1 Hz', () => {
    const r = config.calculate({ value: '360', from: 'dps', to: 'hz' });
    near(parseResult(r, 'result'), 1);
  });

  // ─── Edge cases ────────────────────────────────────────────
  it('returns empty for empty value', () => {
    const r = config.calculate({ value: '', from: 'hz', to: 'khz' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN value', () => {
    const r = config.calculate({ value: 'abc', from: 'hz', to: 'khz' });
    expect(r).toEqual([]);
  });

  it('returns empty for negative value', () => {
    const r = config.calculate({ value: '-5', from: 'hz', to: 'khz' });
    expect(r).toEqual([]);
  });

  it('returns empty for undefined value', () => {
    const r = config.calculate({ from: 'hz', to: 'khz' });
    expect(r).toEqual([]);
  });

  it('shows formula in result', () => {
    const r = config.calculate({ value: '100', from: 'hz', to: 'khz' });
    expect(getValue(r, 'formula')).toBeTruthy();
  });
});
