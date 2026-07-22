import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/mars-time';

describe('Mars Time', () => {
  it('converts Earth UTC to Mars LMST', () => {
    const r = config.calculate({ mode: 'earthToMars', earthDate: '2026-05-20T12:00:00', marsLongitude: '137.4' });
    expect(r.find(x => x.id === 'lmst')).toBeDefined();
    expect(r.find(x => x.id === 'msd')).toBeDefined();
  });

  it('converts sols to Earth time', () => {
    const r = config.calculate({ mode: 'solToEarth', sols: '100' });
    expect(r.find(x => x.id === 'earthTime')?.value).toContain('d');
  });

  it('computes mission elapsed time for Curiosity', () => {
    const r = config.calculate({ mode: 'missionTime', missionSols: '1000', rover: 'curiosity' });
    expect(r.find(x => x.id === 'earthDate')).toBeDefined();
    expect(r.find(x => x.id === 'rover')?.value).toContain('Curiosity');
  });

  it('returns empty for missing date in earthToMars mode', () => {
    const r = config.calculate({ mode: 'earthToMars', earthDate: '', marsLongitude: '137.4' });
    expect(r).toEqual([]);
  });

  it('returns empty for negative sols', () => {
    const r = config.calculate({ mode: 'solToEarth', sols: '-1' });
    expect(r).toEqual([]);
  });

  it('has educational content with 5+ FAQs', () => {
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(2);
  });
});
