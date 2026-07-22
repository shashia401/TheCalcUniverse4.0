import { describe, it, expect } from 'vitest';
import scientificConfig from '../../../src/calculators/math/scientific/index';

describe('Scientific Calculator', () => {
  const find = (r: ReturnType<typeof scientificConfig.calculate>, id: string) => r.find(x => x.id === id)?.value ?? '';

  it('evaluates simple arithmetic', () => {
    const r = scientificConfig.calculate({ expression: '2 + 3 * 4' });
    expect(find(r, 'expression')).toBe('2 + 3 * 4');
    expect(find(r, 'result')).toBe('14');
  });

  it('evaluates trig functions', () => {
    const r = scientificConfig.calculate({ expression: 'sin(0)' });
    expect(find(r, 'result')).toBe('0');
  });

  it('evaluates constants', () => {
    const r = scientificConfig.calculate({ expression: 'pi' });
    expect(parseFloat(find(r, 'result'))).toBeCloseTo(3.14159, 3);
  });

  it('returns empty for empty expression', () => {
    expect(scientificConfig.calculate({ expression: '' })).toEqual([]);
  });

  it('returns empty for invalid expression', () => {
    expect(scientificConfig.calculate({ expression: '1/0' })).toEqual([]);
  });
});
