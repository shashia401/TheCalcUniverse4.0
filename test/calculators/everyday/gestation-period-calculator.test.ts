import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/gestation-period';

describe('Gestation Period', () => {
  it('returns dog gestation (63 days)', () => {
    const r = config.calculate({ animal: 'Dog', breedingDate: '' });
    expect(r.find(x => x.id === 'gestDays')?.value).toContain('63');
  });

  it('returns elephant gestation (645 days)', () => {
    const r = config.calculate({ animal: 'Elephant (African)', breedingDate: '' });
    expect(r.find(x => x.id === 'gestDays')?.value).toContain('645');
  });

  it('calculates due date from breeding date', () => {
    const r = config.calculate({ animal: 'Dog', breedingDate: '2025-03-15' });
    expect(r.find(x => x.id === 'dueDate')).toBeDefined();
    expect(r.find(x => x.id === 'breedingDate')).toBeDefined();
  });

  it('shows opossum as shortest mammal (12-13 days)', () => {
    const r = config.calculate({ animal: 'Opossum', breedingDate: '' });
    expect(r.find(x => x.id === 'gestDays')?.value).toContain('13');
  });

  it('returns empty for missing animal', () => {
    expect(config.calculate({ animal: '', breedingDate: '' })).toEqual([]);
  });

  it('includes interesting fact for each animal', () => {
    const r = config.calculate({ animal: 'Seahorse', breedingDate: '' });
    expect(r.find(x => x.id === 'fact')?.value).toBeTruthy();
  });

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
  });
});
