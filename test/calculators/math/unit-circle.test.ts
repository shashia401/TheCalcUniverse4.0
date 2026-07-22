import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/unit-circle/index';
import { near } from '../../helpers';

function getTrigValues(r: Array<{ id: string; value: string }>) {
  const trig = r.find((x) => x.id === 'trig')!.value;
  const parts = trig.split(/\s*\|\s*/);
  return {
    sin: parseFloat(parts[0]),
    cos: parseFloat(parts[1]),
    tan: parts[2].trim(),
  };
}

function getReciprocalValues(r: Array<{ id: string; value: string }>) {
  const recip = r.find((x) => x.id === 'reciprocal')!.value;
  const parts = recip.split(/\s*\|\s*/);
  return {
    csc: parts[0].trim(),
    sec: parts[1].trim(),
    cot: parts[2].trim(),
  };
}

describe('Unit Circle Calculator', () => {
  // ─── Angle normalization ──────────────────────────────────

  it('0° → normalized 0°', () => {
    const r = config.calculate({ angle: '0' });
    expect(r.find((x) => x.id === 'normalizedAngle')!.value).toBe('0°');
  });

  it('360° → normalized 0°', () => {
    const r = config.calculate({ angle: '360' });
    expect(r.find((x) => x.id === 'normalizedAngle')!.value).toBe('0°');
  });

  it('450° → normalized 90°', () => {
    const r = config.calculate({ angle: '450' });
    expect(r.find((x) => x.id === 'normalizedAngle')!.value).toBe('90°');
  });

  it('720° → normalized 0°', () => {
    const r = config.calculate({ angle: '720' });
    expect(r.find((x) => x.id === 'normalizedAngle')!.value).toBe('0°');
  });

  it('-90° → normalized 270°', () => {
    const r = config.calculate({ angle: '-90' });
    expect(r.find((x) => x.id === 'normalizedAngle')!.value).toBe('270°');
  });

  it('-450° → normalized 270°', () => {
    const r = config.calculate({ angle: '-450' });
    expect(r.find((x) => x.id === 'normalizedAngle')!.value).toBe('270°');
  });

  // ─── Standard angles ──────────────────────────────────────

  it('0° → cos=1, sin=0, (1,0)', () => {
    const r = config.calculate({ angle: '0' });
    const { sin, cos } = getTrigValues(r);
    near(cos, 1);
    near(sin, 0);
    expect(r.find((x) => x.id === 'coordinates')!.value).toContain('1');
    expect(r.find((x) => x.id === 'coordinates')!.value).toContain('0');
  });

  it('90° → cos=0, sin=1, (0,1)', () => {
    const r = config.calculate({ angle: '90' });
    const { sin, cos } = getTrigValues(r);
    near(cos, 0);
    near(sin, 1);
    expect(r.find((x) => x.id === 'coordinates')!.value).toContain('0');
    expect(r.find((x) => x.id === 'coordinates')!.value).toContain('1');
  });

  it('180° → cos=-1, sin=0, (-1,0)', () => {
    const r = config.calculate({ angle: '180' });
    const { sin, cos } = getTrigValues(r);
    near(cos, -1);
    near(sin, 0);
    expect(r.find((x) => x.id === 'coordinates')!.value).toContain('-1');
    expect(r.find((x) => x.id === 'coordinates')!.value).toContain('0');
  });

  it('270° → cos=0, sin=-1, (0,-1)', () => {
    const r = config.calculate({ angle: '270' });
    const { sin, cos } = getTrigValues(r);
    near(cos, 0);
    near(sin, -1);
    expect(r.find((x) => x.id === 'coordinates')!.value).toContain('0');
    expect(r.find((x) => x.id === 'coordinates')!.value).toContain('-1');
  });

  it('30° → sin=0.5, cos=0.8660', () => {
    const r = config.calculate({ angle: '30' });
    const { sin, cos } = getTrigValues(r);
    near(sin, 0.5);
    near(cos, 0.8660254);
  });

  it('45° → sin=0.7071, cos=0.7071', () => {
    const r = config.calculate({ angle: '45' });
    const { sin, cos } = getTrigValues(r);
    near(sin, 0.70710678);
    near(cos, 0.70710678);
  });

  it('60° → sin=0.8660, cos=0.5', () => {
    const r = config.calculate({ angle: '60' });
    const { sin, cos } = getTrigValues(r);
    near(sin, 0.8660254);
    near(cos, 0.5);
  });

  // ─── Quadrant detection ───────────────────────────────────

  it('30° → Quadrant I', () => {
    const r = config.calculate({ angle: '30' });
    expect(r.find((x) => x.id === 'quadrant')!.value).toBe('I');
  });

  it('150° → Quadrant II', () => {
    const r = config.calculate({ angle: '150' });
    expect(r.find((x) => x.id === 'quadrant')!.value).toBe('II');
  });

  it('210° → Quadrant III', () => {
    const r = config.calculate({ angle: '210' });
    expect(r.find((x) => x.id === 'quadrant')!.value).toBe('III');
  });

  it('315° → Quadrant IV', () => {
    const r = config.calculate({ angle: '315' });
    expect(r.find((x) => x.id === 'quadrant')!.value).toBe('IV');
  });

  // ─── Reference angles ─────────────────────────────────────

  it('150° → reference angle 30°', () => {
    const r = config.calculate({ angle: '150' });
    expect(r.find((x) => x.id === 'referenceAngle')!.value).toContain('30');
  });

  it('210° → reference angle 30°', () => {
    const r = config.calculate({ angle: '210' });
    expect(r.find((x) => x.id === 'referenceAngle')!.value).toContain('30');
  });

  it('315° → reference angle 45°', () => {
    const r = config.calculate({ angle: '315' });
    expect(r.find((x) => x.id === 'referenceAngle')!.value).toContain('45');
  });

  it('100° → reference angle 80°', () => {
    const r = config.calculate({ angle: '100' });
    expect(r.find((x) => x.id === 'referenceAngle')!.value).toContain('80');
  });

  it('0° → reference angle 0°', () => {
    const r = config.calculate({ angle: '0' });
    expect(r.find((x) => x.id === 'referenceAngle')!.value).toContain('0');
  });

  it('90° → reference angle 90°', () => {
    const r = config.calculate({ angle: '90' });
    expect(r.find((x) => x.id === 'referenceAngle')!.value).toContain('90');
  });

  // ─── Radians ──────────────────────────────────────────────

  it('0° → radians = 0', () => {
    const r = config.calculate({ angle: '0' });
    expect(r.find((x) => x.id === 'radians')!.value).toBe('0');
  });

  it('90° → radians = π/2', () => {
    const r = config.calculate({ angle: '90' });
    expect(r.find((x) => x.id === 'radians')!.value).toBe('π/2');
  });

  it('180° → radians = π', () => {
    const r = config.calculate({ angle: '180' });
    expect(r.find((x) => x.id === 'radians')!.value).toBe('π');
  });

  it('270° → radians = 3π/2', () => {
    const r = config.calculate({ angle: '270' });
    expect(r.find((x) => x.id === 'radians')!.value).toBe('3π/2');
  });

  it('360° → normalized 0° → radians = 0', () => {
    const r = config.calculate({ angle: '360' });
    expect(r.find((x) => x.id === 'radians')!.value).toBe('0');
  });

  it('45° → radians = π/4', () => {
    const r = config.calculate({ angle: '45' });
    expect(r.find((x) => x.id === 'radians')!.value).toBe('π/4');
  });

  it('30° → radians = π/6', () => {
    const r = config.calculate({ angle: '30' });
    expect(r.find((x) => x.id === 'radians')!.value).toBe('π/6');
  });

  it('60° → radians = π/3', () => {
    const r = config.calculate({ angle: '60' });
    expect(r.find((x) => x.id === 'radians')!.value).toBe('π/3');
  });

  // ─── Reciprocal functions ─────────────────────────────────

  it('30° → csc=2, sec≈1.1547, cot≈1.7321', () => {
    const r = config.calculate({ angle: '30' });
    const { csc, sec, cot } = getReciprocalValues(r);
    near(parseFloat(csc), 2);
    near(parseFloat(sec), 1.1547005);
    near(parseFloat(cot), 1.7320508);
  });

  it('0° → csc=Undefined, sec=1, cot=Undefined', () => {
    const r = config.calculate({ angle: '0' });
    const { csc, sec, cot } = getReciprocalValues(r);
    expect(csc).toContain('Undefined');
    near(parseFloat(sec), 1);
    expect(cot).toContain('Undefined');
  });

  it('90° → csc=1, sec=Undefined, cot=0', () => {
    const r = config.calculate({ angle: '90' });
    const { csc, sec, cot } = getReciprocalValues(r);
    near(parseFloat(csc), 1);
    expect(sec).toContain('Undefined');
    near(parseFloat(cot), 0);
  });

  // ─── Tan undefined ───────────────────────────────────────

  it('90° → tan = Undefined', () => {
    const r = config.calculate({ angle: '90' });
    const { tan } = getTrigValues(r);
    expect(tan).toContain('Undefined');
  });

  it('270° → tan = Undefined', () => {
    const r = config.calculate({ angle: '270' });
    const { tan } = getTrigValues(r);
    expect(tan).toContain('Undefined');
  });

  // ─── Validation ──────────────────────────────────────────

  it('empty angle returns empty', () => {
    expect(config.calculate({ angle: '' })).toEqual([]);
  });

  it('non-numeric angle returns empty', () => {
    expect(config.calculate({ angle: 'abc' })).toEqual([]);
  });

  it('missing angle returns empty', () => {
    expect(config.calculate({})).toEqual([]);
  });

  // ─── Educational Content ─────────────────────────────────

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.explanation!.length).toBeGreaterThan(300);
  });

  it('has 1-2 citations with real URLs', () => {
    const citations = (config.educational as any).citations;
    expect(citations).toBeDefined();
    expect(citations.length).toBeGreaterThanOrEqual(1);
    expect(citations.length).toBeLessThanOrEqual(2);
    for (const c of citations) {
      expect(c.source).toBeTruthy();
      expect(c.url).toMatch(/^https?:\/\//);
    }
  });

  it('has a diagram with svg, alt, and caption', () => {
    const diagram = config.educational.diagram;
    expect(diagram).toBeDefined();
    expect(diagram!.svg).toBeTruthy();
    expect(diagram!.svg).toContain('viewBox');
    expect(diagram!.svg).toContain('max-width:100%;height:auto');
    expect(diagram!.alt).toBeTruthy();
    expect(diagram!.caption).toBeTruthy();
  });

  it('has quickReference with 2-4 entries', () => {
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.quickReference!.length).toBeLessThanOrEqual(4);
  });
});
