import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/freezing-point-depression';

describe('Freezing Point Depression', () => {
  it('1 molal NaCl depresses FP by ~3.7°C', () => {
    const r = config.calculate({ kf: '1.86', molality: '1', soluteMass: '', solventMass: '', molarMass: '', vanthoff: '2' });
    const dt = parseFloat(r.find(x => x.id === 'deltaTf')?.value || '0');
    expect(dt).toBeCloseTo(3.72, 1);
  });

  it('auto-calculates molality from mass inputs', () => {
    const r = config.calculate({ kf: '1.86', molality: '0', soluteMass: '58.44', solventMass: '1000', molarMass: '58.44', vanthoff: '2' });
    expect(r.length).toBeGreaterThan(0);
    expect(r.find(x => x.id === 'effectiveMolality')?.value).toContain('2');
  });

  it('sugar (i=1) depresses FP less than salt (i=2) at same molality', () => {
    const sugar = config.calculate({ kf: '1.86', molality: '1', vanthoff: '1' });
    const salt = config.calculate({ kf: '1.86', molality: '1', vanthoff: '2' });
    const dtSugar = parseFloat(sugar.find(x => x.id === 'deltaTf')?.value || '0');
    const dtSalt = parseFloat(salt.find(x => x.id === 'deltaTf')?.value || '0');
    expect(dtSalt).toBeCloseTo(dtSugar * 2, 0);
  });

  it('returns empty for missing kf', () => {
    expect(config.calculate({ kf: '', molality: '1', vanthoff: '1' })).toEqual([]);
  });

  it('has educational content with 5+ FAQs', () => {
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(2);
  });
});
