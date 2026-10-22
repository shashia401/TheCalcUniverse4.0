import { describe, it, expect, vi, afterEach } from 'vitest';
import type { CalculatorConfig, ExplainStep } from '../../../src/types/calculator';
import aspectRatio from '../../../src/calculators/everyday/aspect-ratio';
import bettingOdds from '../../../src/calculators/everyday/betting-odds';
import bpmTapper from '../../../src/calculators/everyday/bpm-tapper';
import depthOfField from '../../../src/calculators/everyday/depth-of-field';
import gestation from '../../../src/calculators/everyday/gestation-period';
import marsTime from '../../../src/calculators/everyday/mars-time';
import moonPhase from '../../../src/calculators/everyday/moon-phase';
import numerology from '../../../src/calculators/everyday/numerology';
import oven from '../../../src/calculators/everyday/oven-temperature-converter';
import pixels from '../../../src/calculators/everyday/pixels-to-inches';
import reading from '../../../src/calculators/everyday/reading-time-calculator';
import recipe from '../../../src/calculators/everyday/recipe-scaler';
import schengen from '../../../src/calculators/everyday/schengen-visa';
import study from '../../../src/calculators/everyday/study-time-calculator';
import wedding from '../../../src/calculators/everyday/wedding-alcohol';
import workingDays from '../../../src/calculators/everyday/working-days';
import wpm from '../../../src/calculators/everyday/wpm-typing-test';
import yarn from '../../../src/calculators/everyday/yarn-yardage';
import wordCount from '../../../src/calculators/everyday/word-count';
import { buildDemoValues } from '../../helpers';

// Every expected number and string below was computed independently in Python (plain float maths, a hand port of the
// Meeus moon series and the Mars24 formula, a DP longest-common-subsequence, datetime for calendars), not by running
// the calculators.

type V = Record<string, string>;
const steps = (c: CalculatorConfig, v: V): ExplainStep[] => c.explainSteps!(v);
const exprs = (c: CalculatorConfig, v: V) => steps(c, v).map((s) => s.expr);

afterEach(() => vi.useRealTimers());

describe('explainSteps (everyday batch) - demo values, empty input and runaway input', () => {
  const all: [string, CalculatorConfig][] = [
    ['aspect-ratio', aspectRatio],
    ['betting-odds', bettingOdds],
    ['bpm-tapper', bpmTapper],
    ['depth-of-field', depthOfField],
    ['gestation-period', gestation],
    ['mars-time', marsTime],
    ['moon-phase', moonPhase],
    ['numerology', numerology],
    ['oven-temperature-converter', oven],
    ['pixels-to-inches', pixels],
    ['reading-time-calculator', reading],
    ['recipe-scaler', recipe],
    ['schengen-visa', schengen],
    ['study-time-calculator', study],
    ['wedding-alcohol', wedding],
    ['working-days', workingDays],
    ['wpm-typing-test', wpm],
    ['yarn-yardage', yarn],
    ['word-count', wordCount],
  ];
  // The generic demo values are not a valid input for free-text date fields; the calculator itself returns nothing then.
  const demoNotValid = new Set(['mars-time', 'working-days']);
  for (const [name, c] of all) {
    it(`${name}: has explainSteps, demo values give clean steps, {} gives []`, () => {
      expect(typeof c.explainSteps).toBe('function');
      const v = buildDemoValues(c.inputs);
      const s = steps(c, v);
      if (demoNotValid.has(name)) {
        expect(c.calculate(v)).toEqual([]);
        expect(s).toEqual([]);
      } else {
        expect(s.length).toBeGreaterThanOrEqual(2);
      }
      for (const st of s) expect(`${st.label} ${st.expr} ${st.note ?? ''}`).not.toMatch(/NaN|Infinity|undefined/);
      expect(steps(c, {})).toEqual([]);
    });
  }
});

describe('aspect-ratio', () => {
  it('1920 x 1080', () => {
    expect(exprs(aspectRatio, { mode: 'calculate-ratio', width: '1920', height: '1080' })).toEqual([
      'GCD(1,920, 1,080) = 120',
      '1,920 ÷ 120 = 16 and 1,080 ÷ 120 = 9, so the ratio is 16:9',
    ]);
  });
  it('1366 x 768 is near, not exactly, 16:9', () => {
    const s = steps(aspectRatio, { mode: 'calculate-ratio', width: '1366', height: '768' });
    expect(s[0].expr).toBe('GCD(1,366, 768) = 2');
    expect(s[1].expr).toBe('1,366 ÷ 2 = 683 and 768 ÷ 2 = 384, so the ratio is 683:384');
    expect(s[1].note).toBe('Closest common preset: 16:9 — Widescreen HD (within 2%, not exact).');
  });
  it('find the missing height / width', () => {
    const base = { mode: 'find-missing', ratioA: '16', ratioB: '9', knownDimension: 'width', knownValue: '1000' };
    const s = steps(aspectRatio, base);
    expect(s.map((x) => x.expr)).toEqual(['ratio 16:9, known width = 1,000 px', 'height = 1,000 × 9 ÷ 16 = 562.5 px']);
    expect(s[1].note).toMatch(/Not a whole number/);
    expect(exprs(aspectRatio, { ...base, knownDimension: 'height', knownValue: '1080' })[1]).toBe('width = 1,080 × 16 ÷ 9 = 1,920 px');
    expect(exprs(aspectRatio, { mode: 'find-missing', ratioA: '1.85', ratioB: '1', knownDimension: 'width', knownValue: '1850' })[1]).toBe('height = 1,850 × 1 ÷ 1.85 = 1,000 px');
  });
  it('invalid input', () => {
    expect(steps(aspectRatio, { mode: 'calculate-ratio', width: '0', height: '1080' })).toEqual([]);
    expect(steps(aspectRatio, { mode: 'calculate-ratio', width: '1920', height: '-5' })).toEqual([]);
    expect(steps(aspectRatio, { mode: 'find-missing', ratioA: '0', ratioB: '9', knownDimension: 'width', knownValue: '10' })).toEqual([]);
    expect(steps(aspectRatio, { mode: 'find-missing', ratioA: '16', ratioB: '9', knownDimension: 'width', knownValue: '' })).toEqual([]);
  });
});

describe('betting-odds', () => {
  it('American +200, $100', () => {
    expect(exprs(bettingOdds, { oddsFormat: 'American', americanOdds: '+200', stake: '100' })).toEqual([
      '+200 → 200 ÷ 100 + 1 = 3.000',
      '1 ÷ 3.000 = 33.33%',
      '$100.00 × 3.000 = $300.00; profit = $300.00 − $100.00 = $200.00',
    ]);
  });
  it('American -150, $50 (decimal odds are shown rounded)', () => {
    const s = steps(bettingOdds, { oddsFormat: 'American', americanOdds: '-150', stake: '50' });
    expect(s.map((x) => x.expr)).toEqual([
      '-150 → 100 ÷ 150 + 1 = 1.667',
      '1 ÷ 1.667 = 60.00%',
      '$50.00 × 1.667 = $83.33; profit = $83.33 − $50.00 = $33.33',
    ]);
    expect(s[0].note).toMatch(/full precision/);
  });
  it('fractional 7/2 and decimal 2.5', () => {
    expect(exprs(bettingOdds, { oddsFormat: 'Fractional', fractionalOdds: '7/2', stake: '10' })).toEqual([
      '7/2 → 7 ÷ 2 + 1 = 4.500',
      '1 ÷ 4.500 = 22.22%',
      '$10.00 × 4.500 = $45.00; profit = $45.00 − $10.00 = $35.00',
    ]);
    expect(exprs(bettingOdds, { oddsFormat: 'Decimal', decimalOdds: '2.5', stake: '20' })).toEqual([
      '2.5 is already decimal odds (shown as 2.500)',
      '1 ÷ 2.500 = 40.00%',
      '$20.00 × 2.500 = $50.00; profit = $50.00 − $20.00 = $30.00',
    ]);
  });
  it('two-way market -110 / -110 adds the overround and margin-free steps; blank stake means $100', () => {
    expect(exprs(bettingOdds, { oddsFormat: 'American', americanOdds: '-110', otherOdds: '-110' })).toEqual([
      '-110 → 100 ÷ 110 + 1 = 1.909',
      '1 ÷ 1.909 = 52.38%',
      '$100.00 × 1.909 = $190.91; profit = $190.91 − $100.00 = $90.91',
      '52.38% + 52.38% = 104.76%, so the overround is 4.76%',
      '52.38% ÷ 104.76% = 50.00%',
    ]);
  });
  it('invalid input', () => {
    expect(steps(bettingOdds, { oddsFormat: 'American', americanOdds: '50' })).toEqual([]);
    expect(steps(bettingOdds, { oddsFormat: 'American', americanOdds: '' })).toEqual([]);
    expect(steps(bettingOdds, { oddsFormat: 'American', americanOdds: '+200', stake: '-5' })).toEqual([]);
    expect(steps(bettingOdds, { oddsFormat: 'Decimal', decimalOdds: '0.5' })).toEqual([]);
    expect(steps(bettingOdds, { oddsFormat: 'Fractional', fractionalOdds: 'abc' })).toEqual([]);
  });
});

describe('bpm-tapper', () => {
  it('BPM to delay', () => {
    expect(exprs(bpmTapper, { mode: 'bpm-to-ms', bpm: '120', noteValue: 'eighth' })).toEqual([
      '60,000 ms ÷ 120 BPM = 500 ms',
      '500 ms × 0.5 = 250.00 ms',
      '1000 ÷ 250.00 ms = 4.00 Hz',
    ]);
    expect(exprs(bpmTapper, { mode: 'bpm-to-ms', bpm: '100', noteValue: 'quarter-triplet' })).toEqual([
      '60,000 ms ÷ 100 BPM = 600 ms',
      '600 ms × 0.6667 = 400.00 ms',
      '1000 ÷ 400.00 ms = 2.50 Hz',
    ]);
  });
  it('delay to BPM', () => {
    expect(exprs(bpmTapper, { mode: 'ms-to-bpm', targetMs: '250', noteValue: 'eighth' })).toEqual([
      '60,000 ms ÷ 250 ms = 240 BPM',
      '240 × 0.5 = 120.00 BPM',
      '1000 ÷ 250 ms = 4.00 Hz',
    ]);
  });
  it('invalid input', () => {
    expect(steps(bpmTapper, { mode: 'bpm-to-ms', bpm: '0' })).toEqual([]);
    expect(steps(bpmTapper, { mode: 'bpm-to-ms', bpm: '' })).toEqual([]);
    expect(steps(bpmTapper, { mode: 'ms-to-bpm', targetMs: '0' })).toEqual([]);
    expect(steps(bpmTapper, { mode: 'ms-to-bpm', targetMs: 'x' })).toEqual([]);
  });
});

describe('depth-of-field', () => {
  const base = { sensorSize: 'Full Frame (35mm)', focalLength: '50', aperture: '2.8', subjectDistance: '10', distanceUnit: 'feet' };
  it('50 mm f/2.8 at 10 ft, full frame', () => {
    expect(exprs(depthOfField, base)).toEqual([
      'Full Frame (35mm): c = 0.029 mm',
      'H = f² ÷ (N × c) + f = 50² ÷ (2.8 × 0.029) + 50 = 30,838.2 mm = 101.18 ft',
      '10 ft × 304.8 = 3,048 mm',
      's × (H − f) ÷ (H + s − 2f) = 3,048 × (30,838.2 − 50) ÷ (30,838.2 + 3,048 − 2 × 50) = 2,777.5 mm = 9.11 ft',
      's × (H − f) ÷ (H − s) = 3,048 × (30,838.2 − 50) ÷ (30,838.2 − 3,048) = 3,376.8 mm = 11.08 ft',
      'far − near = 3,376.8 − 2,777.5 = 599.3 mm = 1.97 ft',
    ]);
  });
  it('subject beyond the hyperfocal distance has an infinite far limit', () => {
    const s = steps(depthOfField, { ...base, focalLength: '24', aperture: '8', subjectDistance: '100', distanceUnit: 'meters' });
    expect(s.map((x) => x.expr)).toEqual([
      'Full Frame (35mm): c = 0.029 mm',
      'H = f² ÷ (N × c) + f = 24² ÷ (8 × 0.029) + 24 = 2,506.8 mm = 2.51 m',
      '100 m × 1000 = 100,000 mm',
      's × (H − f) ÷ (H + s − 2f) = 100,000 × (2,506.8 − 24) ÷ (2,506.8 + 100,000 − 2 × 24) = 2,423.2 mm = 2.42 m',
      's = 100,000 mm is at or beyond H = 2,506.8 mm, so the far limit is infinity',
    ]);
  });
  it('invalid input', () => {
    expect(steps(depthOfField, { ...base, subjectDistance: '0.04', distanceUnit: 'meters' })).toEqual([]); // closer than the focal length
    expect(steps(depthOfField, { ...base, focalLength: '0' })).toEqual([]);
    expect(steps(depthOfField, { ...base, aperture: '' })).toEqual([]);
    expect(steps(depthOfField, { ...base, sensorSize: 'nonsense' })).toEqual([]);
  });
});

describe('gestation-period', () => {
  it('human from a breeding date uses the 266-day figure', () => {
    const s = steps(gestation, { animal: 'Human', breedingDate: '2026-01-10' });
    expect(s.map((x) => x.expr)).toEqual([
      'Human: 280 days (Mammal)',
      '280 ÷ 7 = 40.0 weeks, 280 ÷ 30.44 = 9.2 months',
      '2026-01-10 + 266 days = October 3, 2026',
    ]);
    expect(s[2].note).toMatch(/266 days rather than the 280/);
  });
  it('dog without a date, cat with a date', () => {
    expect(exprs(gestation, { animal: 'Dog' })).toEqual(['Dog: 63 days (Mammal)', '63 ÷ 7 = 9.0 weeks, 63 ÷ 30.44 = 2.1 months']);
    expect(exprs(gestation, { animal: 'Cat', breedingDate: '2026-03-01' })[2]).toBe('2026-03-01 + 65 days = May 5, 2026');
  });
  it('does not depend on today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2020-01-01T00:00:00'));
    const a = exprs(gestation, { animal: 'Cat', breedingDate: '2026-03-01' });
    vi.setSystemTime(new Date('2030-06-01T00:00:00'));
    expect(exprs(gestation, { animal: 'Cat', breedingDate: '2026-03-01' })).toEqual(a);
  });
  it('invalid input', () => {
    expect(steps(gestation, { animal: 'Dog', breedingDate: '2026-02-31' })).toEqual([]);
    expect(steps(gestation, { animal: 'Unicorn' })).toEqual([]);
    expect(steps(gestation, { animal: '' })).toEqual([]);
  });
});

describe('mars-time', () => {
  it('Earth to Mars (Mars24: MSD 54169.8023 at 2026-05-20 12:00 UTC)', () => {
    const s = steps(marsTime, { mode: 'earthToMars', earthDate: '2026-05-20T12:00:00', marsLongitude: '137.4' });
    expect(s.map((x) => x.expr)).toEqual([
      'JD(UTC) = 20,593.5 days since 1970-01-01 + 2440587.5 = 2,461,181',
      'JD(TT) = 2,461,181 + (37 + 32.184) ÷ 86,400 = 2,461,181.000801',
      'MSD = (JD(TT) − 2451549.5) ÷ 1.0274912517 + 44796 − 0.0009626 = 54169.8023',
      '24 × fractional part of MSD (0.802255) = 19.2541 h = 19:15:14',
      '19.2541 h + 137.4° ÷ 15 = 28.4141 h, wrapped into 0–24 h = 04:24:50',
    ]);
  });
  it('sols to Earth time', () => {
    const s = steps(marsTime, { mode: 'solToEarth', sols: '100' });
    expect(s.map((x) => x.expr)).toEqual([
      '100 sols × 88,775.244 s = 8,877,524.4 s',
      '8,877,524.4 s ÷ 86,400 = 102.7491 days',
      '102.7491 days = 102d 17h 58m',
    ]);
    expect(s[0].note).toBe('1 sol = 24h 39m 35.244s (88,775.244 seconds)');
  });
  it('mission sol 3000 for Curiosity', () => {
    const s = steps(marsTime, { mode: 'missionTime', missionSols: '3000', rover: 'curiosity' });
    expect(s.map((x) => x.expr)).toEqual([
      'Curiosity (MSL) — Gale Crater landed 2012-08-06T05:17:57Z',
      '3,000 sols × 88,775.244 s = 266,325,732 s = 3,082.4738 Earth days',
      'landing + 3,082.4738 days = 2021-01-13',
    ]);
    expect(s[2].note).toBe('3,082 whole Earth days since landing.');
  });
  it('invalid input', () => {
    expect(steps(marsTime, { mode: 'earthToMars', earthDate: '', marsLongitude: '137.4' })).toEqual([]);
    expect(steps(marsTime, { mode: 'earthToMars', earthDate: 'not a date', marsLongitude: '137.4' })).toEqual([]);
    expect(steps(marsTime, { mode: 'earthToMars', earthDate: '2026-05-20T12:00:00', marsLongitude: '' })).toEqual([]);
    expect(steps(marsTime, { mode: 'solToEarth', sols: '-5' })).toEqual([]);
    expect(steps(marsTime, { mode: 'missionTime', missionSols: '-1', rover: 'curiosity' })).toEqual([]);
  });
});

describe('moon-phase', () => {
  it('2024-01-25 is a full moon (elongation 177.2 deg at noon UTC)', () => {
    expect(exprs(moonPhase, { dateOfBirth: '2024-01-25' })).toEqual([
      '2024-01-25 12:00 UTC',
      'Moon ecliptic longitude − Sun ecliptic longitude = 177.2°',
      '177.2° ÷ 360 = 0.4923 of the cycle; × 29.530588861 days = 14.5 days old',
      '(1 − cos 177.2°) ÷ 2 = 99.9%',
      '0.4923 of the cycle → Full Moon',
      'next elongation of 180° after this date: Thursday, January 25, 2024, 0 days later',
    ]);
  });
  it('2000-01-06 is a new moon', () => {
    const e = exprs(moonPhase, { dateOfBirth: '2000-01-06' });
    expect(e[1]).toBe('Moon ecliptic longitude − Sun ecliptic longitude = 357.2°');
    expect(e[2]).toBe('357.2° ÷ 360 = 0.9921 of the cycle; × 29.530588861 days = 29.3 days old');
    expect(e[3]).toBe('(1 − cos 357.2°) ÷ 2 = 0.1%');
    expect(e[4]).toBe('0.9921 of the cycle → New Moon');
    expect(e[5]).toBe('next elongation of 180° after this date: Friday, January 21, 2000, 15 days later');
  });
  it('invalid input', () => {
    expect(steps(moonPhase, { dateOfBirth: '' })).toEqual([]);
    expect(steps(moonPhase, { dateOfBirth: '2026-02-31' })).toEqual([]);
  });
});

describe('numerology', () => {
  it('1990-01-01 reduces to 3', () => {
    expect(exprs(numerology, { birthMonth: '1', birthDay: '1', birthYear: '1990' })).toEqual([
      'January = 1: 1 (already a single digit)',
      '1: 1 (already a single digit)',
      '1990: 1 + 9 + 9 + 0 = 19, 1 + 9 = 10, 1 + 0 = 1',
      '1 + 1 + 1 = 3 → Life Path 3',
    ]);
  });
  it('master numbers 11 are kept at every stage (29 Nov 1985 -> 9)', () => {
    expect(exprs(numerology, { birthMonth: '11', birthDay: '29', birthYear: '1985' })).toEqual([
      'November = 11: 11 (master number, kept)',
      '29: 2 + 9 = 11 (master number, kept)',
      '1985: 1 + 9 + 8 + 5 = 23, 2 + 3 = 5',
      '11 + 11 + 5 = 27, then 2 + 7 = 9 → Life Path 9',
    ]);
  });
  it('a master Life Path (3 + 6 + 2 = 11)', () => {
    const s = steps(numerology, { birthMonth: '3', birthDay: '6', birthYear: '2000' });
    expect(s[3].expr).toBe('3 + 6 + 2 = 11 → Life Path 11 (Master Number 11)');
  });
  it('invalid input', () => {
    expect(steps(numerology, { birthMonth: '2', birthDay: '30', birthYear: '2000' })).toEqual([]);
    expect(steps(numerology, { birthMonth: '2', birthDay: '10', birthYear: '' })).toEqual([]);
    expect(steps(numerology, { birthMonth: '', birthDay: '10', birthYear: '2000' })).toEqual([]);
  });
});

describe('oven-temperature-converter', () => {
  it('350 F', () => {
    const s = steps(oven, { temperature: '350', fromUnit: '°F' });
    expect(s.map((x) => x.expr)).toEqual([
      '(350°F − 32) × 5 ÷ 9 = 176.67°C ≈ 177°C',
      '177°C is nearest to 180°C / 350°F in the table → Gas Mark 4',
    ]);
    expect(s[1].note).toBe('Exact table match.');
  });
  it('180 C, 500 F, and a temperature above the gas mark scale', () => {
    expect(exprs(oven, { temperature: '180', fromUnit: '°C' })).toEqual([
      '180°C × 9 ÷ 5 + 32 = 356°F ≈ 356°F',
      '180°C is nearest to 180°C / 350°F in the table → Gas Mark 4',
    ]);
    expect(exprs(oven, { temperature: '500', fromUnit: '°F' })[0]).toBe('(500°F − 32) × 5 ÷ 9 = 260°C ≈ 260°C');
    const hot = steps(oven, { temperature: '600', fromUnit: '°F' });
    expect(hot[0].expr).toBe('(600°F − 32) × 5 ÷ 9 = 315.56°C ≈ 316°C');
    expect(hot[1].expr).toBe('316°C → Outside the gas mark range');
    expect(hot[1].note).toBe('Gas marks run from 1/4 (110°C) to 10 (260°C).');
  });
  it('gas mark 4 (table), 1/4 (table) and 3.5 (interpolated)', () => {
    expect(exprs(oven, { temperature: '4', fromUnit: 'Gas Mark' })).toEqual(['Gas Mark 4 = 350°F / 180°C', 'Moderate / Medium']);
    expect(exprs(oven, { temperature: '1/4', fromUnit: 'Gas Mark' })).toEqual(['Gas Mark 1/4 = 225°F / 110°C', 'Very Slow / Cool']);
    expect(exprs(oven, { temperature: '3.5', fromUnit: 'Gas Mark' })).toEqual([
      'Gas Mark 3 = 325°F / 170°C and Gas Mark 4 = 350°F / 180°C',
      't = (3.5 − 3) ÷ (4 − 3) = 0.5; 325 + t × (350 − 325) = 338°F, 170 + t × (180 − 170) = 175°C',
      'Moderately Slow / Warm',
    ]);
  });
  it('invalid input', () => {
    expect(steps(oven, { temperature: '', fromUnit: '°F' })).toEqual([]);
    expect(steps(oven, { temperature: 'abc', fromUnit: '°F' })).toEqual([]);
    expect(steps(oven, { temperature: '11', fromUnit: 'Gas Mark' })).toEqual([]);
    expect(steps(oven, { temperature: '0', fromUnit: 'Gas Mark' })).toEqual([]);
  });
});

describe('pixels-to-inches', () => {
  it('1920 x 1080 at 300 DPI', () => {
    expect(exprs(pixels, { pixels: '1920', pixelsB: '1080', dpi: '300', outputUnits: 'all' })).toEqual([
      '1,920 px ÷ 300 DPI = 6.40"',
      '6.40" × 2.54 = 16.26 cm; × 25.4 = 162.56 mm',
      '1,080 px ÷ 300 DPI = 3.60" (9.14 cm)',
      '1,920 × 1,080 ÷ 1,000,000 = 2.07 MP',
    ]);
  });
  it('one side only assumes a square image; imperial output skips the metric step', () => {
    const s = steps(pixels, { pixels: '1920', dpi: '300', outputUnits: 'imperial' });
    expect(s.map((x) => x.expr)).toEqual(['1,920 px ÷ 300 DPI = 6.40"', '1,920 × 1,920 ÷ 1,000,000 = 3.69 MP']);
    expect(s[1].note).toMatch(/square/);
  });
  it('custom DPI, metric output', () => {
    expect(exprs(pixels, { pixels: '1000', dpi: 'custom', customDpi: '250', outputUnits: 'metric' }).slice(0, 2)).toEqual([
      '1,000 px ÷ 250 DPI = 4.00"',
      '4.00" × 2.54 = 10.16 cm; × 25.4 = 101.60 mm',
    ]);
  });
  it('invalid input', () => {
    expect(steps(pixels, { pixels: '0', dpi: '300' })).toEqual([]);
    expect(steps(pixels, { pixels: '1920', dpi: 'custom', customDpi: '' })).toEqual([]);
    expect(steps(pixels, { pixels: '', dpi: '300' })).toEqual([]);
  });
});

describe('reading-time-calculator', () => {
  it('general content at 238 wpm', () => {
    expect(exprs(reading, { wordCount: '1000', readingSpeed: '238', includePauses: 'none', contentType: 'general' })).toEqual([
      '1,000 words ÷ 238 wpm = 4.2 min',
      '4.2 min = 4 minutes',
    ]);
  });
  it('technical and academic multipliers', () => {
    expect(exprs(reading, { wordCount: '1000', readingSpeed: '238', includePauses: 'none', contentType: 'technical' })).toEqual([
      '1,000 words ÷ 238 wpm = 4.2 min',
      '4.2 min × 1.3 = 5.46 min',
      '5.46 min = 5 minutes',
    ]);
    expect(exprs(reading, { wordCount: '10000', readingSpeed: '250', includePauses: 'none', contentType: 'academic' })).toEqual([
      '10,000 words ÷ 250 wpm = 40 min',
      '40 min × 1.5 = 60 min',
      '60 min = 1 hour',
    ]);
  });
  it('breaks', () => {
    const v = { wordCount: '20000', readingSpeed: '200', contentType: 'general' };
    expect(exprs(reading, { ...v, includePauses: 'full' })).toEqual([
      '20,000 words ÷ 200 wpm = 100 min',
      '100 min + 15 min (1 x 15-min break) = 115 min',
      '115 min = 1 hour 55 minutes',
    ]);
    expect(exprs(reading, { ...v, includePauses: 'short' })[1]).toBe('100 min + 15 min (3 x 5-min breaks) = 115 min');
  });
  it('invalid input', () => {
    expect(steps(reading, { wordCount: '0', readingSpeed: '200' })).toEqual([]);
    expect(steps(reading, { wordCount: 'abc', readingSpeed: '200' })).toEqual([]);
    expect(steps(reading, { wordCount: '', readingSpeed: '200' })).toEqual([]);
  });
});

describe('recipe-scaler', () => {
  it('4 -> 6 servings with a mixed-number quantity', () => {
    const s = steps(recipe, {
      originalServings: '4', desiredServings: '6',
      ingredient1Name: 'Flour', ingredient1Qty: '2 1/2', ingredient1Unit: 'cups',
      ingredient2Name: 'Rice', ingredient2Qty: '250', ingredient2Unit: 'g',
    });
    expect(s.map((x) => x.expr)).toEqual([
      '6 desired servings ÷ 4 original servings = 1.5x',
      '2.5 cups × 6 ÷ 4 = 3.75 cups',
      '250 g × 6 ÷ 4 = 375 g',
    ]);
    expect(s[1].label).toBe('Scale Flour');
    expect(s[1].note).toBe('About 3 3/4 cups in measuring-spoon or cup terms.');
  });
  it('scaling down', () => {
    expect(exprs(recipe, { originalServings: '8', desiredServings: '2', ingredient1Name: 'Butter', ingredient1Qty: '1/2', ingredient1Unit: 'cups' })).toEqual([
      '2 desired servings ÷ 8 original servings = 0.25x',
      '0.5 cups × 2 ÷ 8 = 0.13 cups',
    ]);
  });
  it('invalid input', () => {
    expect(steps(recipe, { originalServings: '4', desiredServings: '6' })).toEqual([]); // no ingredient
    expect(steps(recipe, { originalServings: '4', desiredServings: '6', ingredient1Name: 'X', ingredient1Qty: 'abc', ingredient1Unit: 'g' })).toEqual([]);
    expect(steps(recipe, { originalServings: '0', desiredServings: '6', ingredient1Name: 'X', ingredient1Qty: '1', ingredient1Unit: 'g' })).toEqual([]);
  });
});

describe('schengen-visa', () => {
  const t = (a: string, b: string) => ({ trip1Start: a, trip1End: b });
  it('two trips, no overlap', () => {
    expect(exprs(schengen, { checkDate: '2026-06-30', ...t('2026-03-01', '2026-03-31'), trip2Start: '2026-05-01', trip2End: '2026-05-20' })).toEqual([
      '2026-06-30 − 179 days = 2026-01-02, so the window is 2026-01-02 to 2026-06-30',
      'Trip 1 (2026-03-01 to 2026-03-31): 31 days · Trip 2 (2026-05-01 to 2026-05-20): 20 days',
      '31 + 20 = 51 days',
      '90 − 51 = 39 days',
    ]);
  });
  it('overlapping trips count each day once', () => {
    const e = exprs(schengen, { checkDate: '2026-06-30', ...t('2026-03-01', '2026-03-31'), trip2Start: '2026-03-20', trip2End: '2026-04-10' });
    expect(e[2]).toBe('31 + 22 = 53, minus 12 overlapping = 41 days');
    expect(e[3]).toBe('90 − 41 = 49 days');
  });
  it('over the limit', () => {
    const e = exprs(schengen, { checkDate: '2026-06-30', ...t('2026-01-05', '2026-06-30') });
    expect(e[1]).toBe('Trip 1 (2026-01-05 to 2026-06-30): 177 days');
    expect(e[2]).toBe('177 days');
    expect(e[3]).toBe('177 − 90 = 87 days over');
  });
  it('never depends on today: needs a check date and gives the same steps whatever the clock says', () => {
    const v = { checkDate: '2026-06-30', ...t('2026-03-01', '2026-03-31') };
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2020-01-01T00:00:00'));
    const a = exprs(schengen, v);
    vi.setSystemTime(new Date('2031-09-09T00:00:00'));
    expect(exprs(schengen, v)).toEqual(a);
    expect(steps(schengen, t('2026-03-01', '2026-03-31'))).toEqual([]); // no check date
  });
  it('invalid input', () => {
    expect(steps(schengen, { checkDate: '2026-02-31', ...t('2026-03-01', '2026-03-31') })).toEqual([]);
    expect(steps(schengen, { checkDate: '2026-06-30' })).toEqual([]);
    expect(steps(schengen, { checkDate: '2026-06-30', ...t('2026-03-31', '2026-03-01') })).toEqual([]);
  });
});

describe('study-time-calculator', () => {
  it('200 pages at 30 pages/hour, medium', () => {
    const s = steps(study, { totalPages: '200', pagesPerHour: '30', sessionsPerWeek: '5', sessionLength: '60', daysUntilExam: '14', difficulty: 'Medium' });
    expect(s.map((x) => x.expr)).toEqual([
      '200 pages ÷ 30 pages/hour = 6.67 h',
      '6.67 h × 1 (Medium) = 6.67 h',
      '14 days ÷ 7 = 2.0 weeks',
      '6.67 h ÷ 2.0 weeks = 3.33 h',
      '3.33 h ÷ 5 sessions = 0.67 h per session; ÷ 7 days = 0.48 h per day',
      '5 sessions × 60 min ÷ 60 = 5.00 h per week; needed 3.33 h → Yes',
    ]);
    expect(s[1].note).toBe('Multipliers (Easy x0.8, Medium x1, Hard x1.5) are rules of thumb, not measured values.');
  });
  it('an infeasible plan', () => {
    expect(exprs(study, { totalPages: '1000', pagesPerHour: '20', sessionsPerWeek: '3', sessionLength: '60', daysUntilExam: '7', difficulty: 'Hard' })).toEqual([
      '1000 pages ÷ 20 pages/hour = 50.00 h',
      '50.00 h × 1.5 (Hard) = 75.00 h',
      '7 days ÷ 7 = 1.0 weeks',
      '75.00 h ÷ 1.0 weeks = 75.00 h',
      '75.00 h ÷ 3 sessions = 25.00 h per session; ÷ 7 days = 10.71 h per day',
      '3 sessions × 60 min ÷ 60 = 3.00 h per week; needed 75.00 h → No — more time or sessions needed',
    ]);
  });
  it('invalid input', () => {
    const ok = { totalPages: '200', pagesPerHour: '30', sessionsPerWeek: '5', sessionLength: '60', daysUntilExam: '14' };
    expect(steps(study, { ...ok, totalPages: '0' })).toEqual([]);
    expect(steps(study, { ...ok, sessionLength: '' })).toEqual([]);
    expect(steps(study, { ...ok, daysUntilExam: '-3' })).toEqual([]);
  });
});

describe('wedding-alcohol', () => {
  const base = { guests: '100', drinkersPct: '80', duration: '4', beerPct: '40', winePct: '30', liquorPct: '30' };
  it('100 guests, 80% drinking, 4 hours', () => {
    expect(exprs(wedding, base)).toEqual([
      '100 guests × 80% = 80 (shown rounded up as 80)',
      '80 × 40% × 4 h × 1.5 beers/h = 192 → 192',
      '80 × 30% × 4 h × 1 glass/h = 96 glasses; ÷ 5 per bottle = 19.2 → 20',
      '80 × 30% × 4 h × 0.75 cocktails/h = 72 cocktails; ÷ 17 per bottle = 4.24 → 5',
    ]);
  });
  it('carries the split warning', () => {
    expect(steps(wedding, { ...base, beerPct: '50' })[0].note).toMatch(/add up to 110%/);
  });
  it('invalid input', () => {
    expect(steps(wedding, { ...base, guests: '0' })).toEqual([]);
    expect(steps(wedding, { ...base, guests: '' })).toEqual([]);
    expect(steps(wedding, { ...base, drinkersPct: '150' })).toEqual([]);
    expect(steps(wedding, { ...base, duration: '0' })).toEqual([]);
  });
});

describe('working-days', () => {
  it('both end dates counted, no holidays', () => {
    expect(exprs(workingDays, { startDate: '2026-03-02', endDate: '2026-03-13', includeStart: 'both', holidays: 'no' })).toEqual([
      '2026-03-02 to 2026-03-13 (both end dates counted) → 2026-03-02 to 2026-03-13 = 12 calendar days',
      '12 − 2 weekend days = 10 weekdays',
      '10 weekdays = 10 working days',
    ]);
  });
  it('start excluded by default', () => {
    expect(exprs(workingDays, { startDate: '2026-03-02', endDate: '2026-03-13', holidays: 'no' })).toEqual([
      '2026-03-02 to 2026-03-13 (start excluded, end included) → 2026-03-03 to 2026-03-13 = 11 calendar days',
      '11 − 2 weekend days = 9 weekdays',
      '9 weekdays = 9 working days',
    ]);
  });
  it('removes a weekday federal holiday (Christmas 2026 is a Friday)', () => {
    const s = steps(workingDays, { startDate: '2026-12-21', endDate: '2026-12-31', includeStart: 'both', holidays: 'yes' });
    expect(s.map((x) => x.expr)).toEqual([
      '2026-12-21 to 2026-12-31 (both end dates counted) → 2026-12-21 to 2026-12-31 = 11 calendar days',
      '11 − 2 weekend days = 9 weekdays',
      '9 − 1 = 8 working days',
    ]);
    expect(s[2].note).toMatch(/2026-12-25 Christmas Day/);
  });
  it('a range with nothing to count', () => {
    const e = exprs(workingDays, { startDate: '2026-03-02', endDate: '2026-03-02', includeStart: 'neither', holidays: 'no' });
    expect(e[0]).toBe('2026-03-02 to 2026-03-02 (both end dates excluded) → no days are counted');
    expect(e[2]).toBe('0 weekdays = 0 working days');
  });
  it('does not depend on today', () => {
    const v = { startDate: '2026-03-02', endDate: '2026-03-13', holidays: 'yes' };
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2020-01-01T00:00:00'));
    const a = exprs(workingDays, v);
    vi.setSystemTime(new Date('2031-09-09T00:00:00'));
    expect(exprs(workingDays, v)).toEqual(a);
  });
  it('invalid input', () => {
    expect(steps(workingDays, { startDate: '2026-03-13', endDate: '2026-03-02' })).toEqual([]);
    expect(steps(workingDays, { startDate: 'soon', endDate: '2026-03-02' })).toEqual([]);
    expect(steps(workingDays, { startDate: '2026-03-02', endDate: '' })).toEqual([]);
  });
});

describe('wpm-typing-test', () => {
  it('one wrong letter pair in 18 typed characters, 30 seconds', () => {
    expect(exprs(wpm, { sourceText: 'the quick brown fox', typedText: 'the quik brown fax', timerMinutes: '0.5' })).toEqual([
      '18 characters',
      '18 ÷ 5 ÷ 0.5 min = 7.2 wpm',
      '17 of 18 match the source, so 1 error',
      '17 ÷ 18 × 100 = 94.4%',
      '17 ÷ 5 ÷ 0.5 min = 6.8 wpm',
    ]);
  });
  it('invalid input', () => {
    expect(steps(wpm, { sourceText: 'abc', typedText: '', timerMinutes: '1' })).toEqual([]);
    expect(steps(wpm, { sourceText: '  ', typedText: 'abc', timerMinutes: '1' })).toEqual([]);
    expect(steps(wpm, { sourceText: 'abc', typedText: 'abc', timerMinutes: '0' })).toEqual([]);
    expect(steps(wpm, { mode: 'practice', sourceText: 'abc', typedText: 'abc', timerMinutes: '1' })).toEqual([]);
  });
});

describe('yarn-yardage', () => {
  const g = { stitchesPer4in: '20', rowsPer4in: '24', yarnWeight: 'Worsted' };
  it('preset scarf', () => {
    expect(exprs(yarn, { ...g, projectType: 'Scarf', size: 'M' })).toEqual(['400 yards', '400 × (24 ÷ 24) = 400 yards', '400 yards × 0.9144 = 366 meters']);
  });
  it('sweater with a tighter row gauge', () => {
    const s = steps(yarn, { ...g, rowsPer4in: '28', projectType: 'Sweater', size: 'L' });
    expect(s[0].label).toBe('Base yardage for a Sweater, size L');
    expect(s.map((x) => x.expr)).toEqual(['1,200 yards', '1,200 × (28 ÷ 24) = 1,400 yards', '1,400 yards × 0.9144 = 1,280 meters']);
  });
  it('custom piece 60 x 80 in', () => {
    expect(exprs(yarn, { ...g, projectType: 'Custom', customWidth: '60', customLength: '80' })).toEqual([
      '3.5 × 60 in × 80 in × (24 ÷ 4 rows per inch) ÷ 36 = 2,800 yards',
      '2,800 yards × 1.2 = 3,360 yards',
      '3,360 yards × 0.9144 = 3,072 meters',
    ]);
  });
  it('a gauge outside the usual range for the yarn weight is carried as a note', () => {
    expect(steps(yarn, { ...g, projectType: 'Scarf', size: 'M', yarnWeight: 'Lace/Fingering' })[1].note).toMatch(/27-40/);
  });
  it('invalid input', () => {
    expect(steps(yarn, { ...g, projectType: 'Scarf', size: 'M', stitchesPer4in: '0' })).toEqual([]);
    expect(steps(yarn, { ...g, projectType: 'Scarf', size: 'M', rowsPer4in: '' })).toEqual([]);
    expect(steps(yarn, { ...g, projectType: 'Custom', customWidth: '', customLength: '80' })).toEqual([]);
  });
});

describe('word-count', () => {
  it('a nine-word sentence', () => {
    expect(exprs(wordCount, { text: 'The quick brown fox jumps over the lazy dog.', wordsPerMinute: '238' })).toEqual([
      '9 whitespace-separated words',
      '9 words ÷ 238 wpm × 60 = 2.3 s = 2 sec',
      '9 words ÷ 150 wpm × 60 = 3.6 s = 4 sec',
      '36 characters without spaces ÷ 9 words = 4.0 characters',
    ]);
  });
  it('238 words at 238 wpm is exactly a minute to read', () => {
    const e = exprs(wordCount, { text: 'word '.repeat(238), wordsPerMinute: '238' });
    expect(e[1]).toBe('238 words ÷ 238 wpm × 60 = 60 s = 1 min 0 sec');
    expect(e[2]).toBe('238 words ÷ 150 wpm × 60 = 95.2 s = 1 min 35 sec');
    expect(e[3]).toBe('952 characters without spaces ÷ 238 words = 4.0 characters');
  });
  it('one word is singular', () => {
    expect(exprs(wordCount, { text: 'hello', wordsPerMinute: '238' })[0]).toBe('1 whitespace-separated word');
  });
  it('invalid input', () => {
    expect(steps(wordCount, { text: '', wordsPerMinute: '238' })).toEqual([]);
    expect(steps(wordCount, { text: '   ', wordsPerMinute: '238' })).toEqual([]);
    expect(steps(wordCount, { text: 'hello', wordsPerMinute: '0' })).toEqual([]);
  });
});
