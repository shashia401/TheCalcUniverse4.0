import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/depth-of-field';
import { getValue } from '../../helpers';

describe('Depth of Field Calculator', () => {
  it('calculates DOF for full-frame 50mm f/2.8 at 10 feet', () => {
    const r = config.calculate({
      sensorSize: 'Full Frame (35mm)',
      focalLength: '50',
      aperture: '2.8',
      subjectDistance: '10',
      distanceUnit: 'feet',
    });
    expect(getValue(r, 'hyperfocalDistance')).toBeTruthy();
    expect(getValue(r, 'nearLimit')).toBeTruthy();
    expect(getValue(r, 'farLimit')).toBeTruthy();
    expect(getValue(r, 'totalDOF')).toBeTruthy();
  });

  it('shows crop factor and CoC values for APS-C', () => {
    const r = config.calculate({
      sensorSize: 'APS-C (1.5x)',
      focalLength: '50',
      aperture: '4',
      subjectDistance: '15',
      distanceUnit: 'feet',
    });
    expect(getValue(r, 'cropFactor')).toContain('1.5');
    expect(getValue(r, 'cocValue')).toContain('0.019');
  });

  it('shows infinite far focus when beyond hyperfocal distance', () => {
    const r = config.calculate({
      sensorSize: 'Full Frame (35mm)',
      focalLength: '24',
      aperture: '11',
      subjectDistance: '100',
      distanceUnit: 'feet',
    });
    expect(getValue(r, 'farLimit')).toContain('Infinite');
  });

  it('returns empty for missing required fields', () => {
    const r = config.calculate({
      sensorSize: 'Full Frame (35mm)',
      focalLength: '',
      aperture: '',
      subjectDistance: '',
      distanceUnit: 'feet',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for zero focal length', () => {
    const r = config.calculate({
      sensorSize: 'Full Frame (35mm)',
      focalLength: '0',
      aperture: '2.8',
      subjectDistance: '10',
      distanceUnit: 'feet',
    });
    expect(r).toEqual([]);
  });

  it('supports meters distance unit', () => {
    const r = config.calculate({
      sensorSize: 'Full Frame (35mm)',
      focalLength: '50',
      aperture: '5.6',
      subjectDistance: '5',
      distanceUnit: 'meters',
    });
    expect(getValue(r, 'nearLimit')).toContain('m');
  });

  it('supports feet distance unit', () => {
    const r = config.calculate({
      sensorSize: 'Full Frame (35mm)',
      focalLength: '50',
      aperture: '5.6',
      subjectDistance: '15',
      distanceUnit: 'feet',
    });
    expect(getValue(r, 'nearLimit')).toContain('ft');
  });

  it('calculates DOF for Micro 4/3 sensor', () => {
    const r = config.calculate({
      sensorSize: 'Micro 4/3',
      focalLength: '25',
      aperture: '2.8',
      subjectDistance: '8',
      distanceUnit: 'feet',
    });
    expect(getValue(r, 'cropFactor')).toContain('2');
    expect(getValue(r, 'cocValue')).toContain('0.015');
  });

  it('calculates DOF for Medium Format', () => {
    const r = config.calculate({
      sensorSize: 'Medium Format',
      focalLength: '80',
      aperture: '4',
      subjectDistance: '12',
      distanceUnit: 'feet',
    });
    expect(getValue(r, 'cocValue')).toContain('0.043');
  });

  it('includes all required result IDs', () => {
    const r = config.calculate({
      sensorSize: 'Full Frame (35mm)',
      focalLength: '50',
      aperture: '2.8',
      subjectDistance: '10',
      distanceUnit: 'feet',
    });
    const ids = r.map((x) => x.id);
    expect(ids).toContain('hyperfocalDistance');
    expect(ids).toContain('nearLimit');
    expect(ids).toContain('farLimit');
    expect(ids).toContain('totalDOF');
    expect(ids).toContain('cropFactor');
    expect(ids).toContain('cocValue');
  });

  describe('educational content', () => {
    it('has formula', () => {
      expect(config.educational.formula).toBeTruthy();
    });

    it('has formulaDescription over 100 chars', () => {
      expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    });

    it('has 3-5 variables', () => {
      expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
      expect(config.educational.variables!.length).toBeLessThanOrEqual(5);
    });

    it('has 3-5 howToUse steps', () => {
      expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
      expect(config.educational.howToUse!.length).toBeLessThanOrEqual(5);
    });

    it('has 3-6 quickReference items', () => {
      expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(3);
      expect(config.educational.quickReference!.length).toBeLessThanOrEqual(6);
    });

    it('has 3-6 commonUses items', () => {
      expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
      expect(config.educational.commonUses!.length).toBeLessThanOrEqual(6);
    });

    it('has explanation over 300 chars', () => {
      expect(config.educational.explanation!.length).toBeGreaterThan(300);
    });

    it('has 5-7 FAQs', () => {
      expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
      expect(config.educational.faqs!.length).toBeLessThanOrEqual(7);
    });

    it('has 4-6 proTips', () => {
      expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(4);
      expect(config.educational.proTips!.length).toBeLessThanOrEqual(6);
    });

    it('has limitations with real content', () => {
      expect(config.educational.limitations).toBeTruthy();
      expect(config.educational.limitations.length).toBeGreaterThan(0);
      expect(config.educational.limitations.every((l: string) => l.length > 20)).toBe(true);
    });

    it('has 2 worked examples with scenario, inputs, and insight', () => {
      const examples = config.educational.workedExamples;
      expect(examples).toBeDefined();
      expect(examples!.length).toBeGreaterThanOrEqual(2);
      for (const ex of examples!) {
        expect(ex.scenario).toBeTruthy();
        expect(ex.inputs).toBeTruthy();
        expect(ex.insight).toBeTruthy();
        expect(ex.insight!.length).toBeGreaterThan(100);
      }
    });

    it('has diagram with svg, alt, and caption', () => {
      expect(config.educational.diagram).toBeDefined();
      expect(config.educational.diagram!.svg).toContain('<svg');
      expect(config.educational.diagram!.alt).toBeTruthy();
      expect(config.educational.diagram!.caption).toBeTruthy();
    });

    it('has 1-2 citations with real URLs', () => {
      const citations = config.educational.citations;
      expect(citations).toBeDefined();
      expect(citations!.length).toBeGreaterThanOrEqual(1);
      expect(citations!.length).toBeLessThanOrEqual(2);
      for (const c of citations!) {
        expect(c.url).toMatch(/^https?:\/\//);
      }
    });
  });
});
