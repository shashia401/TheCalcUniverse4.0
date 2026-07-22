import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/body-fat/index';
import { getValue, getResult, parseNumber } from '../../helpers';

describe('Body Fat calculator (U.S. Navy method)', () => {
  it('calculates body fat for a male', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      age: '30',
      weight: '180',
      heightFt: '5',
      heightIn: '10',
      heightCm: '',
      neck: '15.5',
      abdomen: '34',
      waist: '',
      hip: '',
    });
    const bf = parseFloat(getValue(r, 'bodyFatPct'));
    expect(bf).toBeGreaterThan(5);
    expect(bf).toBeLessThan(40);
  });

  it('calculates body fat for a female', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'female',
      age: '30',
      weight: '125',
      heightFt: '5',
      heightIn: '5',
      heightCm: '',
      neck: '12',
      abdomen: '',
      waist: '25',
      hip: '35',
    });
    const bf = parseFloat(getValue(r, 'bodyFatPct'));
    expect(bf).toBeGreaterThan(10);
    expect(bf).toBeLessThan(55);
  });

  it('calculates in metric units', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'male',
      age: '30',
      weight: '82',
      heightFt: '',
      heightIn: '',
      heightCm: '178',
      neck: '39',
      abdomen: '86',
      waist: '',
      hip: '',
    });
    const bf = parseFloat(getValue(r, 'bodyFatPct'));
    expect(bf).toBeGreaterThan(5);
    expect(bf).toBeLessThan(40);
  });

  it('returns fat mass and lean mass', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      age: '30',
      weight: '200',
      heightFt: '6',
      heightIn: '0',
      heightCm: '',
      neck: '16',
      abdomen: '36',
      waist: '',
      hip: '',
    });
    expect(getValue(r, 'fatMass')).toContain('lbs');
    expect(getValue(r, 'leanMass')).toContain('lbs');
  });

  it('returns empty for missing neck measurement', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      age: '30',
      weight: '180',
      heightFt: '5',
      heightIn: '10',
      heightCm: '',
      neck: '0',
      abdomen: '34',
      waist: '',
      hip: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing women waist/hip', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'female',
      age: '30',
      weight: '150',
      heightFt: '5',
      heightIn: '5',
      heightCm: '',
      neck: '13',
      abdomen: '',
      waist: '0',
      hip: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN age', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      age: 'abc',
      weight: '180',
      heightFt: '5',
      heightIn: '10',
      heightCm: '',
      neck: '15',
      abdomen: '34',
      waist: '',
      hip: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing height', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'male',
      age: '30',
      weight: '80',
      heightFt: '',
      heightIn: '',
      heightCm: '0',
      neck: '38',
      abdomen: '85',
      waist: '',
      hip: '',
    });
    expect(r).toEqual([]);
  });

  it('classifies athletic male correctly', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      age: '25',
      weight: '170',
      heightFt: '5',
      heightIn: '11',
      heightCm: '',
      neck: '16',
      abdomen: '30',
      waist: '',
      hip: '',
    });
    const bf = parseFloat(getValue(r, 'bodyFatPct'));
    expect(bf).toBeGreaterThan(6);
    expect(bf).toBeLessThan(14);
    expect(getValue(r, 'category')).toContain('Athletic');
  });

  it('classifies obese category correctly', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      age: '45',
      weight: '250',
      heightFt: '5',
      heightIn: '10',
      heightCm: '',
      neck: '16',
      abdomen: '44',
      waist: '',
      hip: '',
    });
    const bf = parseFloat(getValue(r, 'bodyFatPct'));
    expect(bf).toBeGreaterThan(25);
    expect(getValue(r, 'category')).toBe('Obese');
  });

  it('shows essential fat threshold result', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      age: '30',
      weight: '180',
      heightFt: '5',
      heightIn: '10',
      heightCm: '',
      neck: '15.5',
      abdomen: '34',
      waist: '',
      hip: '',
    });
    expect(getResult(r, 'essentialFat')).toBeDefined();
    expect(getResult(r, 'athleticRange')).toBeDefined();
  });
});
