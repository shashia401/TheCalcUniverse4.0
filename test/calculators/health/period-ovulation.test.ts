import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/period-ovulation/index';
import { getValue } from '../../helpers';

describe('Period & Ovulation calculator', () => {
  it('calculates cycle day and phase', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01', cycleLength: '28', periodLength: '5', lutealPhase: '14',
    });
    expect(getValue(r, 'cycleDay')).toContain('Day');
    expect(getValue(r, 'cycleDay')).toContain('28');
    expect(getValue(r, 'currentPhase')).toBeTruthy();
  });

  it('predicts next period', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01', cycleLength: '28', periodLength: '5',
    });
    expect(getValue(r, 'predictedPeriod')).toContain('days');
    expect(getValue(r, 'periodFrequency')).toContain('28 days');
  });

  it('returns ovulation date and fertile window', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01', cycleLength: '28', periodLength: '5', lutealPhase: '14',
    });
    expect(getValue(r, 'ovulationDate')).toBeTruthy();
    expect(getValue(r, 'fertileWindow')).toContain('→');
  });

  it('returns 3-month outlook', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01', cycleLength: '30', periodLength: '5',
    });
    expect(getValue(r, 'monthsPredictions')).toContain('–');
  });

  it('returns period frequency', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01', cycleLength: '28', periodLength: '4',
    });
    expect(getValue(r, 'periodFrequency')).toContain('periods per year');
  });

  it('returns empty for invalid LMP', () => {
    const r = config.calculate({
      lmpDate: '', cycleLength: '28', periodLength: '5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for cycle length out of range', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01', cycleLength: '5', periodLength: '5',
    });
    expect(r).toEqual([]);
  });
});
