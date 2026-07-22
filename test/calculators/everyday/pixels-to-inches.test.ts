import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/pixels-to-inches';
import { getValue, parseNumber, near } from '../../helpers';

describe('pixels-to-inches', () => {
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
    // 1200 / 250 = 4.8 inches
    near(parseNumber(getValue(r, 'inches')), 4.8);
  });

  it('returns centimeters correctly', () => {
    const r = config.calculate({
      pixels: '300',
      dpi: '300',
      customDpi: '',
    });
    // 1 inch = 2.54 cm
    near(parseNumber(getValue(r, 'cm')), 2.54);
  });

  it('returns millimeters correctly', () => {
    const r = config.calculate({
      pixels: '300',
      dpi: '300',
      customDpi: '',
    });
    // 1 inch = 25.4 mm
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
});
