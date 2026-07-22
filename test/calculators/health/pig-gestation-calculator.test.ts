import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/pig-gestation';

describe('Pig Gestation', () => {
  it('calculates 114-day farrowing date with 3-3-3 rule', () => {
    const r = config.calculate({ breedingDate: '2025-03-01', breedType: 'commercial', parity: 'gilt' });
    expect(r.find(x => x.id === 'gestation')?.value).toContain('114');
    expect(r.find(x => x.id === 'gestation')?.value).toContain('3 months');
  });

  it('computes pregnancy progress percentage', () => {
    const r = config.calculate({ breedingDate: '2025-01-01', breedType: 'commercial', parity: 'matureSow' });
    expect(r.find(x => x.id === 'progress')).toBeDefined();
  });

  it('shows early and late farrowing windows', () => {
    const r = config.calculate({ breedingDate: '2025-06-15', breedType: 'commercial', parity: 'youngSow' });
    expect(r.find(x => x.id === 'earlyWindow')).toBeDefined();
    expect(r.find(x => x.id === 'lateWindow')).toBeDefined();
  });

  it('returns empty for missing breeding date', () => {
    expect(config.calculate({ breedingDate: '', breedType: 'commercial', parity: 'gilt' })).toEqual([]);
  });

  it('heritage breeds may have 115-day gestation', () => {
    const r = config.calculate({ breedingDate: '2025-03-01', breedType: 'large', parity: 'matureSow' });
    expect(r.find(x => x.id === 'gestation')?.value).toContain('115');
  });

  it('has educational content with 5+ FAQs', () => {
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(2);
  });
});
