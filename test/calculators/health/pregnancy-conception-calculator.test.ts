import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/pregnancy-conception/index';
import { getValue } from '../../helpers';

describe('Conception / Fertile Window calculator', () => {
  it('calculates fertile window from LMP', () => {
    const r = config.calculate({
      method: 'lmp',
      lmpDate: '2026-01-01',
      nextPeriodDate: '',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(getValue(r, 'ovulationDate')).toContain('2026');
    expect(getValue(r, 'fertileWindow')).toContain('→');
    expect(getValue(r, 'peakFertility')).toContain('→');
  });

  it('calculates from next expected period', () => {
    const r = config.calculate({
      method: 'nextPeriod',
      lmpDate: '',
      nextPeriodDate: '2026-02-01',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(getValue(r, 'ovulationDate')).toContain('2026');
    expect(getValue(r, 'fertileWindow')).toContain('→');
  });

  it('calculates implantation window', () => {
    const r = config.calculate({
      method: 'lmp',
      lmpDate: '2026-01-15',
      nextPeriodDate: '',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(getValue(r, 'implantationWindow')).toContain('→');
  });

  it('returns estimated due date if conceived', () => {
    const r = config.calculate({
      method: 'lmp',
      lmpDate: '2026-01-15',
      nextPeriodDate: '',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(getValue(r, 'estDueDate')).toContain('2026');
  });

  it('returns empty for missing LMP date', () => {
    const r = config.calculate({
      method: 'lmp',
      lmpDate: '',
      nextPeriodDate: '',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid date', () => {
    const r = config.calculate({
      method: 'lmp',
      lmpDate: 'invalid',
      nextPeriodDate: '',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(r).toEqual([]);
  });
});
