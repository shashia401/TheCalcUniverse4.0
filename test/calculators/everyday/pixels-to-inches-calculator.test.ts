import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/pixels-to-inches';
import { getValue, parseNumber, near } from '../../helpers';

describe('pixels-to-inches-calculator', () => {
  it('300 pixels at 300 DPI = 1 inch', () => {
    const r = config.calculate({
      pixels: '300',
      dpi: '300',
      customDpi: '',
    });
    near(parseNumber(getValue(r, 'inches')), 1);
  });

  it('1920 pixels at 96 DPI = 20 inches', () => {
    const r = config.calculate({
      pixels: '1920',
      dpi: '96',
      customDpi: '',
    });
    near(parseNumber(getValue(r, 'inches')), 20);
  });

  it('1080 pixels at 72 DPI = 15 inches', () => {
    const r = config.calculate({
      pixels: '1080',
      dpi: '72',
      customDpi: '',
    });
    near(parseNumber(getValue(r, 'inches')), 15);
  });

  it('calculates with custom DPI value', () => {
    const r = config.calculate({
      pixels: '1200',
      dpi: 'custom',
      customDpi: '250',
    });
    near(parseNumber(getValue(r, 'inches')), 4.8);
  });

  it('returns centimeters correctly', () => {
    const r = config.calculate({
      pixels: '300',
      dpi: '300',
      customDpi: '',
    });
    near(parseNumber(getValue(r, 'cm')), 2.54);
  });

  it('returns millimeters correctly', () => {
    const r = config.calculate({
      pixels: '300',
      dpi: '300',
      customDpi: '',
    });
    near(parseNumber(getValue(r, 'mm')), 25.4);
  });

  it('returns empty array when pixels is empty', () => {
    const r = config.calculate({
      pixels: '',
      dpi: '300',
      customDpi: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when custom DPI is empty in custom mode', () => {
    const r = config.calculate({
      pixels: '300',
      dpi: 'custom',
      customDpi: '',
    });
    expect(r).toEqual([]);
  });

  it('returns megapixels as a non-negative value', () => {
    const r = config.calculate({
      pixels: '3000',
      dpi: '300',
      customDpi: '',
    });
    const mp = parseNumber(getValue(r, 'megapixels'));
    expect(mp).toBeGreaterThan(0);
  });

  it('returns all expected result ids', () => {
    const r = config.calculate({
      pixels: '300',
      dpi: '300',
      customDpi: '',
    });
    const ids = r.map((x: { id: string }) => x.id);
    expect(ids).toContain('inches');
    expect(ids).toContain('cm');
    expect(ids).toContain('mm');
    expect(ids).toContain('dpiUsed');
    expect(ids).toContain('megapixels');
  });
});
