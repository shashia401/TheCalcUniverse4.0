import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/heat-index/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Heat Index Calculator', () => {
  it('calculates heat index for 90F at 60% humidity', () => {
    const results = config.calculate({
      temperature: '90',
      humidity: '60',
    });
    const hi = parseNumber(getValue(results, 'heatIndex'));
    // Expected ~100°F
    near(hi, 100, 2);
  });

  it('calculates heat index for 96F at 55% humidity', () => {
    const results = config.calculate({
      temperature: '96',
      humidity: '55',
    });
    const hi = parseNumber(getValue(results, 'heatIndex'));
    // Expected ~107°F for 96F at 55%
    near(hi, 112, 5);
  });

  it('returns empty for missing temperature', () => {
    const results = config.calculate({
      temperature: '',
      humidity: '60',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for missing humidity', () => {
    const results = config.calculate({
      temperature: '90',
      humidity: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for humidity over 100%', () => {
    const results = config.calculate({
      temperature: '90',
      humidity: '120',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for negative humidity', () => {
    const results = config.calculate({
      temperature: '90',
      humidity: '-10',
    });
    expect(results).toEqual([]);
  });

  it('returns danger tier label', () => {
    const results = config.calculate({
      temperature: '100',
      humidity: '65',
    });
    const tier = getValue(results, 'dangerTier');
    expect(tier).toBeTruthy();
    // Should be Danger or Extreme Danger at 100F + 65%
    expect(['Danger', 'Extreme Danger']).toContain(tier);
  });
});

describe('Heat Index educational numbers match the real formula', () => {
  const hiOf = (t: number, rh: number) =>
    parseNumber(getValue(config.calculate({ temperature: String(t), tempUnit: 'F', humidity: String(rh) }), 'heatIndex'));

  it('worked examples quote the computed heat index', () => {
    expect(hiOf(98, 65)).toBeCloseTo(128.2, 1);
    expect(hiOf(92, 70)).toBeCloseTo(112.2, 1);
    expect(hiOf(105, 15)).toBeCloseTo(101.6, 1);
    expect(hiOf(95, 80)).toBeCloseTo(133.8, 1);
    const [a, b, c] = config.educational.workedExamples!;
    expect(a.result).toContain('128.2°F');
    expect(b.result).toContain('112.2°F');
    expect(c.result).toContain('101.6°F');
    expect(c.result).toContain('133.8°F');
  });

  it('every quick-reference "T°F + RH% humidity" row equals the computed value and tier', () => {
    const tier = (hi: number) => (hi < 80 ? 'safe' : hi < 90 ? 'caution' : hi < 103 ? 'extreme caution' : hi < 125 ? 'danger' : 'extreme danger');
    for (const row of config.educational.quickReference!) {
      const m = /^(\d+)°F \+ (\d+)% humidity$/.exec(row.label)!;
      const hi = hiOf(Number(m[1]), Number(m[2]));
      expect(row.value).toBe(`${hi.toFixed(1)}°F (${tier(hi)})`);
    }
  });

  it('diagram tiers use the NWS thresholds 80/90/103/125', () => {
    const svg = config.educational.diagram!.svg;
    expect(svg).toContain('Danger: 103-124');
    expect(svg).toContain('125&deg;F or higher');
  });
});
