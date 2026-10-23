import { describe, it, expect } from 'vitest';
import age from '../../../src/calculators/everyday/age-calculator/index';
import { computeAge } from '../../../src/calculators/everyday/age-calculator/ageMath';
import { getValue, parseNumber } from '../../helpers';

// Expected values below were derived independently with Python's datetime
// (date arithmetic and weekday), not by echoing calculator output.

describe('age-calculator audit', () => {
  it('worked example 1: 1990-03-15 -> 2026-06-10', () => {
    const r = age.calculate({ birthDate: '1990-03-15', toDate: '2026-06-10' });
    expect(getValue(r, 'exactAge')).toBe('36 years, 2 months, 26 days');
    expect(parseNumber(getValue(r, 'totalDays'))).toBe(13236); // python: (date2-date1).days
    expect(getValue(r, 'birthWeekday')).toBe('Thursday');
    expect(getValue(r, 'day10k')).toContain('2017-07-31'); // 1990-03-15 + 10000 d
    expect(getValue(r, 'nextDecade')).toBe('In 3 years, 9 months'); // 40th birthday 2030-03-15
  });

  it('worked example 2: 1963-08-01 -> 2028-08-01 is exactly 65y, 23,742 days, 569,808 h', () => {
    const r = age.calculate({ birthDate: '1963-08-01', toDate: '2028-08-01' });
    expect(getValue(r, 'exactAge')).toBe('65 years, 0 months, 0 days');
    expect(parseNumber(getValue(r, 'totalDays'))).toBe(23742);
    expect(parseNumber(getValue(r, 'totalHours'))).toBe(569808);
    expect(getValue(r, 'birthWeekday')).toBe('Thursday');
    expect(getValue(r, 'chineseZodiac')).toBe('Rabbit');
  });

  it('worked example 3: leap-day baby, 2000-02-29 -> 2026-05-17', () => {
    const r = age.calculate({ birthDate: '2000-02-29', toDate: '2026-05-17' });
    expect(getValue(r, 'exactAge')).toBe('26 years, 2 months, 18 days');
    expect(parseNumber(getValue(r, 'totalDays'))).toBe(9574);
    expect(getValue(r, 'day10k')).toContain('2027-07-17');
    expect(getValue(r, 'day10k')).toContain('in 426 days');
    expect(getValue(r, 'birthWeekday')).toBe('Tuesday');
    // 2027 is not a leap year, so the next birthday is 1 March 2027 = 288 days away
    expect(getValue(r, 'nextBirthday')).toBe('288 days');
  });

  it('leap-day birthday: the following leap year keeps 29 Feb (regression: setFullYear rolled to 1 Mar 2028)', () => {
    // Seen from 2027-06-01 the next birthday is 2028-02-29, 273 days away (python)
    const r = age.calculate({ birthDate: '2000-02-29', toDate: '2027-06-01' });
    expect(getValue(r, 'nextBirthday')).toBe('273 days');
  });

  it('rejects calendar-invalid dates instead of rolling them over (regression: 2025-02-31 became 3 March)', () => {
    expect(age.calculate({ birthDate: '2025-02-31', toDate: '2026-01-01' })).toEqual([]);
    expect(age.calculate({ birthDate: '2000-01-01', toDate: '2026-02-30' })).toEqual([]);
    expect(age.calculate({ birthDate: '2000-13-01', toDate: '' })).toEqual([]);
  });

  it('on the birthday itself the next one is a year away and the result says so', () => {
    const r = age.calculate({ birthDate: '1990-06-10', toDate: '2026-06-10' });
    expect(getValue(r, 'exactAge')).toBe('36 years, 0 months, 0 days');
    expect(getValue(r, 'nextBirthday')).toBe('365 days');
    expect(r.find((x) => x.id === 'nextBirthday')?.interpretation).toMatch(/Today is your birthday/);
  });

  it('computeAge exposes progress through the birthday-year for the panel (no string parsing)', () => {
    const a = computeAge({ birthDate: '1990-03-15', toDate: '2026-06-10' })!;
    expect(a.daysSinceBirthday).toBe(87); // 2026-03-15 -> 2026-06-10
    expect(a.birthdayYearLength).toBe(365);
    expect(a.daysUntilBirthday).toBe(278);
    expect(a.daysSinceBirthday + a.daysUntilBirthday).toBe(a.birthdayYearLength);
  });

  it('warns that January/February births may belong to the previous Chinese animal', () => {
    const r = age.calculate({ birthDate: '2000-01-15', toDate: '2025-01-01' });
    expect(getValue(r, 'chineseZodiac')).toBe('Dragon'); // by calendar year
    expect(r.find((x) => x.id === 'chineseZodiac')?.interpretation).toContain('Rabbit'); // 1999
    const mid = age.calculate({ birthDate: '2000-07-15', toDate: '2025-01-01' });
    expect(mid.find((x) => x.id === 'chineseZodiac')?.interpretation).not.toContain('Rabbit');
  });

  it('Western zodiac boundaries (inclusive end days)', () => {
    const z = (d: string) => getValue(age.calculate({ birthDate: d, toDate: '2026-01-01' }), 'zodiacSign');
    expect(z('1990-01-19')).toBe('Capricorn');
    expect(z('1990-01-20')).toBe('Aquarius');
    expect(z('1990-03-20')).toBe('Pisces');
    expect(z('1990-03-21')).toBe('Aries');
    expect(z('1990-12-21')).toBe('Sagittarius');
    expect(z('1990-12-22')).toBe('Capricorn');
  });
});

import aspect from '../../../src/calculators/everyday/aspect-ratio/index';
import { simplifyRatio } from '../../../src/calculators/everyday/aspect-ratio/aspectMath';

describe('aspect-ratio audit', () => {
  it('1366x768 reduces to 683:384 and is only "within 2%" of 16:9', () => {
    // gcd(1366,768)=2 -> 683:384 (hand check: 1366=2*683, 768=2*384, 683 is prime)
    const r = aspect.calculate({ mode: 'calculate-ratio', width: '1366', height: '768' });
    expect(getValue(r, 'simplifiedRatio')).toBe('683:384');
    expect(getValue(r, 'presetMatch')).toContain('16:9');
    expect(r.find((x) => x.id === 'simplifiedRatio')?.interpretation).toMatch(/Within 2% of 16:9/);
  });

  it('1920x1200 is 8:5 with no preset', () => {
    const r = aspect.calculate({ mode: 'calculate-ratio', width: '1920', height: '1200' });
    expect(getValue(r, 'simplifiedRatio')).toBe('8:5'); // gcd 240
    expect(getValue(r, 'gcd')).toBe('240');
    expect(r.find((x) => x.id === 'presetMatch')).toBeUndefined();
  });

  it('decimal ratios use an exact integer GCD (2.39:1 -> 239:100, 1.85:1 -> 37:20)', () => {
    expect(simplifyRatio(2.39, 1)).toEqual({ w: 239, h: 100, g: 0.01 });
    expect(simplifyRatio(1.85, 1)).toEqual({ w: 37, h: 20, g: 0.05 });
    const r = aspect.calculate({ mode: 'find-missing', ratioA: '1.85', ratioB: '1', knownDimension: 'width', knownValue: '1998' });
    expect(getValue(r, 'ratio')).toBe('37:20');
    expect(getValue(r, 'missingDimension')).toBe('1,080 px'); // 1998/1.85 = 1080
  });

  it('find-missing keeps fractional sizes visible and flags them', () => {
    const r = aspect.calculate({ mode: 'find-missing', ratioA: '16', ratioB: '9', knownDimension: 'width', knownValue: '1000' });
    expect(getValue(r, 'missingDimension')).toBe('562.5 px'); // 1000*9/16
    expect(r.find((x) => x.id === 'missingDimension')?.interpretation).toMatch(/round/i);
  });

  it('find-missing reduces a non-reduced user ratio (32:18 -> 16:9)', () => {
    const r = aspect.calculate({ mode: 'find-missing', ratioA: '32', ratioB: '18', knownDimension: 'height', knownValue: '720' });
    expect(getValue(r, 'ratio')).toBe('16:9');
    expect(getValue(r, 'missingDimension')).toBe('1,280 px'); // 720*32/18
  });

  it('orientation branches', () => {
    const o = (w: string, h: string) => getValue(aspect.calculate({ mode: 'calculate-ratio', width: w, height: h }), 'orientation');
    expect(o('100', '50')).toBe('Landscape');
    expect(o('50', '100')).toBe('Portrait');
    expect(o('50', '50')).toBe('Square');
  });
});

import betting from '../../../src/calculators/everyday/betting-odds/index';

describe('betting-odds audit', () => {
  const run = (v: Record<string, string>) => betting.calculate({ stake: '100', ...v });

  it('+150 = 2.5 = 3/2 = 40.00% (hand: 150/100+1; 1/2.5)', () => {
    const r = run({ oddsFormat: 'American', americanOdds: '+150' });
    expect(getValue(r, 'decimalOddsOut')).toBe('2.500');
    expect(getValue(r, 'fractionalOddsOut')).toBe('3/2');
    expect(getValue(r, 'impliedProbability')).toBe('40.00%');
    expect(getValue(r, 'payout')).toBe('$250.00');
    expect(getValue(r, 'profit')).toBe('$150.00');
  });

  it('-150 = 1.667 = 2/3 = 60.00%', () => {
    const r = run({ oddsFormat: 'American', americanOdds: '-150' });
    expect(getValue(r, 'decimalOddsOut')).toBe('1.667');
    expect(getValue(r, 'fractionalOddsOut')).toBe('2/3');
    expect(getValue(r, 'impliedProbability')).toBe('60.00%');
    expect(getValue(r, 'profit')).toBe('$66.67');
  });

  it('decimal 1.91 is -110 (100/0.91 = 109.9) and 91/100', () => {
    const r = run({ oddsFormat: 'Decimal', decimalOdds: '1.91' });
    expect(getValue(r, 'americanOddsOut')).toBe('-110');
    expect(getValue(r, 'fractionalOddsOut')).toBe('91/100');
  });

  it('fractional 7/2 = 4.5 = +350 = 22.22%; 10/11 -> -110 and 52.38%', () => {
    const a = run({ oddsFormat: 'Fractional', fractionalOdds: '7/2' });
    expect(getValue(a, 'americanOddsOut')).toBe('+350');
    expect(getValue(a, 'impliedProbability')).toBe('22.22%');
    const b = run({ oddsFormat: 'Fractional', fractionalOdds: '10/11' });
    expect(getValue(b, 'americanOddsOut')).toBe('-110');
    expect(getValue(b, 'impliedProbability')).toBe('52.38%');
  });

  it('even money: decimal 2.0 is +100 and 1/1', () => {
    const r = run({ oddsFormat: 'Decimal', decimalOdds: '2' });
    expect(getValue(r, 'americanOddsOut')).toBe('+100');
    expect(getValue(r, 'fractionalOddsOut')).toBe('1/1');
  });

  it('two -110 prices: overround 4.76%, fair probability 50% (FAQ numbers)', () => {
    const r = run({ oddsFormat: 'American', americanOdds: '-110', otherOdds: '-110' });
    expect(getValue(r, 'impliedProbability')).toBe('52.38%'); // 110/210
    expect(getValue(r, 'overround')).toBe('4.76%'); // 2*110/210 - 1
    expect(getValue(r, 'fairProbability')).toBe('50.00%');
  });

  it('overround works in decimal and fractional formats and flags a negative (arbitrage) margin', () => {
    const d = run({ oddsFormat: 'Decimal', decimalOdds: '2.1', otherOdds: '2.1' });
    expect(getValue(d, 'overround')).toBe('-4.76%'); // 2/2.1 - 1
    expect(d.find((x) => x.id === 'overround')?.interpretation).toMatch(/arbitrage/);
    const f = run({ oddsFormat: 'Fractional', fractionalOdds: '4/5', otherOdds: '4/5' });
    expect(getValue(f, 'overround')).toBe('11.11%'); // 2/1.8 - 1
  });

  it('no overround rows without the opposite price', () => {
    expect(run({ oddsFormat: 'American', americanOdds: '+150' }).find((x) => x.id === 'overround')).toBeUndefined();
  });

  it('rejects impossible odds: American between -100 and +100, negative fractions, zero denominator', () => {
    expect(run({ oddsFormat: 'American', americanOdds: '50' })).toEqual([]);
    expect(run({ oddsFormat: 'American', americanOdds: '-99' })).toEqual([]);
    expect(run({ oddsFormat: 'Fractional', fractionalOdds: '-1/2' })).toEqual([]);
    expect(run({ oddsFormat: 'Fractional', fractionalOdds: '1/0' })).toEqual([]);
    expect(run({ oddsFormat: 'Decimal', decimalOdds: '0.5' })).toEqual([]);
  });

  it('0/1 (decimal 1.00) has no American equivalent', () => {
    const r = run({ oddsFormat: 'Fractional', fractionalOdds: '0/1' });
    expect(getValue(r, 'americanOddsOut')).toBe('—');
    expect(getValue(r, 'impliedProbability')).toBe('100.00%');
  });
});

import bpm from '../../../src/calculators/everyday/bpm-tapper/index';

describe('bpm-tapper audit', () => {
  it('120 BPM note grid (60000/120 = 500 ms per beat)', () => {
    const r = bpm.calculate({ mode: 'bpm-to-ms', bpm: '120', noteValue: 'quarter' });
    const ms = (id: string) => getValue(r, `note-${id}`);
    expect(ms('whole')).toBe('2000.00 ms');
    expect(ms('half')).toBe('1000.00 ms');
    expect(ms('quarter')).toBe('500.00 ms');
    expect(ms('eighth')).toBe('250.00 ms');
    expect(ms('sixteenth')).toBe('125.00 ms');
    expect(ms('dotted-quarter')).toBe('750.00 ms');
    expect(ms('dotted-eighth')).toBe('375.00 ms');
    expect(ms('quarter-triplet')).toBe('333.33 ms');
    expect(getValue(r, 'delayMs')).toBe('500.00 ms');
    expect(getValue(r, 'frequencyHz')).toBe('2.00 Hz');
  });

  it('selected note drives the headline delay (dotted eighth at 90 BPM = 666.67*0.75 = 500 ms)', () => {
    const r = bpm.calculate({ mode: 'bpm-to-ms', bpm: '90', noteValue: 'dotted-eighth' });
    expect(getValue(r, 'delayMs')).toBe('500.00 ms');
  });

  it('ms to BPM inverts the note factor (round trip)', () => {
    // 375 ms is a dotted eighth -> beat = 500 ms -> 120 BPM; 250 ms eighth -> 120; 1000 ms whole -> 240
    expect(getValue(bpm.calculate({ mode: 'ms-to-bpm', targetMs: '375', noteValue: 'dotted-eighth' }), 'calculatedBpm')).toBe('120.00 BPM');
    expect(getValue(bpm.calculate({ mode: 'ms-to-bpm', targetMs: '250', noteValue: 'eighth' }), 'calculatedBpm')).toBe('120.00 BPM');
    expect(getValue(bpm.calculate({ mode: 'ms-to-bpm', targetMs: '1000', noteValue: 'whole' }), 'calculatedBpm')).toBe('240.00 BPM');
  });

  it('flags an out-of-range implied tempo', () => {
    const r = bpm.calculate({ mode: 'ms-to-bpm', targetMs: '30000', noteValue: 'quarter' }); // 2 BPM
    expect(r.find((x) => x.id === 'calculatedBpm')?.warning).toMatch(/outside/);
  });

  it('blank / zero input gives no results', () => {
    expect(bpm.calculate({ mode: 'bpm-to-ms', bpm: '' })).toEqual([]);
    expect(bpm.calculate({ mode: 'ms-to-bpm', targetMs: '0' })).toEqual([]);
  });
});

import clothing from '../../../src/calculators/everyday/clothing-size-converter/index';

describe('clothing-size-converter audit', () => {
  const c = (category: string, region: string, sizeInput: string) => clothing.calculate({ category, region, sizeInput });

  it("men's shirt collar sizes match inches x 2.54 (18 in = 45.7 cm -> EU 46; was 45)", () => {
    expect(getValue(c("Men's Shirts", 'US', '18'), 'eu')).toBe('46');
    expect(getValue(c("Men's Shirts", 'US', '15'), 'eu')).toBe('38'); // 38.1 cm
    expect(getValue(c("Men's Shirts", 'US', '16'), 'eu')).toBe('41'); // 40.6 cm
  });

  it('jeans: JP is waist cm (inches x 2.54) and EU trouser size is waist + 16', () => {
    const r28 = c('Jeans (W/L)', 'US', '28');
    expect(getValue(r28, 'jp')).toBe('71'); // 71.1 cm, was 70
    expect(getValue(r28, 'eu')).toBe('44');
    expect(getValue(c('Jeans (W/L)', 'US', '29'), 'jp')).toBe('74'); // 73.7 cm, was 73
    expect(getValue(c('Jeans (W/L)', 'US', '40'), 'eu')).toBe('56');
  });

  it('values outside the chart return a warning instead of snapping to the nearest end', () => {
    const r = c("Women's Dresses", 'US', '30');
    expect(r).toHaveLength(1);
    expect(r[0].warning).toMatch(/outside/);
    expect(c("Women's Dresses", 'US', '-2')[0].warning).toMatch(/outside/);
  });

  it('interpolates between rows and keeps letter columns populated', () => {
    const r = c("Men's Suits/Jackets", 'US', '41'); // between 40 and 42 -> EU 51, JP is a letter column
    expect(getValue(r, 'eu')).toBe('51');
    expect(getValue(r, 'jp')).not.toBe('');
    expect(getValue(c("Men's Shoes", 'US', '7.5'), 'uk')).toBe('7'); // 6.5..7.5 midpoint
  });

  it('JP letter lookup and garbage input', () => {
    expect(getValue(c("Men's Shirts", 'JP', 'XL'), 'us')).toBe('17–17.5');
    expect(c("Women's Dresses", 'US', '8abc')).toEqual([]);
    expect(c('Nope', 'US', '8')).toEqual([]);
  });

  it('women\'s tops share the dress table', () => {
    const d = c("Women's Dresses", 'US', '6');
    const t = c("Women's Tops", 'US', '6');
    expect(t.map((x) => x.value)).toEqual(d.map((x) => x.value));
  });

  it('children: height-based EU/JP', () => {
    const r = c('Children (by age)', 'US', '10');
    expect(getValue(r, 'eu')).toBe('140');
    expect(getValue(r, 'jp')).toBe('140');
    expect(r.find((x) => x.id === 'intl')).toBeUndefined();
  });
});

import countdown from '../../../src/calculators/everyday/countdown-calculator/index';
import { countdownInfo } from '../../../src/calculators/everyday/countdown-calculator/countdownMath';

describe('countdown-calculator audit', () => {
  const cd = (v: Record<string, string>) => countdown.calculate({ includeTime: 'No', ...v });

  it('worked example 1: 2026-01-01 -> 2027-06-15 14:00 = 530 d 14 h, 1y 5m 2w 0d (python/dateutil)', () => {
    const r = cd({ targetDate: '2027-06-15', startDate: '2026-01-01', includeTime: 'Yes', targetTime: '14:00', eventName: 'Wedding Day' });
    expect(getValue(r, 'countdown')).toBe('530 days, 14h 0m');
    expect(r[0].label).toBe('Time Until Wedding Day');
    expect(getValue(r, 'breakdown')).toBe('1y 5m 2w 0d');
    expect(parseNumber(getValue(r, 'totalHours'))).toBe(530 * 24 + 14);
    expect(getValue(r, 'totalMonths')).toBe('17');
  });

  it('worked example 2: 2026-01-10 -> 2026-06-10 = 151 days, 5 calendar months, 21 weeks', () => {
    const r = cd({ targetDate: '2026-06-10', startDate: '2026-01-10' });
    expect(getValue(r, 'totalDays')).toBe('151');
    expect(getValue(r, 'breakdown')).toBe('0y 5m 0w 0d');
    expect(getValue(r, 'totalWeeks')).toBe('21');
    expect(getValue(r, 'yearPercentage')).toBe('44%'); // day-of-year 160 of 365 = 43.8%
  });

  it('DST: 2026-03-01 -> 2026-03-30 is 29 days in every time zone (regression: ms/86400000 gave 28 in US zones)', () => {
    const r = cd({ targetDate: '2026-03-30', startDate: '2026-03-01' });
    expect(getValue(r, 'totalDays')).toBe('29');
    expect(parseNumber(getValue(r, 'totalHours'))).toBe(29 * 24);
  });

  it('month breakdown is calendar based (regression: Jan 1 -> Mar 1 is 2 months, not 1m 4w)', () => {
    const r = cd({ targetDate: '2026-03-01', startDate: '2026-01-01' });
    expect(getValue(r, 'breakdown')).toBe('0y 2m 0w 0d');
    expect(getValue(r, 'totalMonths')).toBe('2');
  });

  it('past target: "ago", label says Time Since, same magnitudes', () => {
    const r = cd({ targetDate: '2026-01-01', startDate: '2026-03-01', eventName: 'Kickoff' });
    expect(getValue(r, 'countdown')).toBe('59 days ago');
    expect(r[0].label).toBe('Time Since Kickoff');
    expect(getValue(r, 'breakdown')).toBe('0y 2m 0w 0d');
  });

  it('now-based countdown uses the supplied clock (hours/minutes remainder)', () => {
    const now = new Date(2026, 5, 10, 21, 30);
    const c = countdownInfo({ targetDate: '2026-06-12', includeTime: 'No' }, now)!;
    expect(c.totalDays).toBe(1); // 1 day 2 h 30 m
    expect(c.hoursPart).toBe(2);
    expect(c.minutesPart).toBe(30);
  });

  it('rejects calendar-invalid dates and bad times', () => {
    expect(cd({ targetDate: '2026-02-31' })).toEqual([]);
    expect(cd({ targetDate: '2026-06-10', startDate: '2026-13-01' })).toEqual([]);
    expect(cd({ targetDate: '2026-06-10', startDate: '2026-01-01', includeTime: 'Yes', targetTime: '25:00' })).toEqual([]);
  });

  it('year percentage is omitted across years', () => {
    expect(cd({ targetDate: '2027-01-01', startDate: '2026-06-01' }).find((x) => x.id === 'yearPercentage')).toBeUndefined();
  });
});

import dof from '../../../src/calculators/everyday/depth-of-field/index';
import { dofInfo } from '../../../src/calculators/everyday/depth-of-field/dofMath';

describe('depth-of-field audit', () => {
  // Independent python: H = f^2/(N c) + f; near = s(H-f)/(H+s-2f); far = s(H-f)/(H-s)
  const ft = (v: string) => parseFloat(v);

  it('85mm f/2.8 FF at 10 ft: H 292.21 ft, near 9.68, far 10.34, DOF 0.67 ft (worked example 1)', () => {
    const r = dof.calculate({ sensorSize: 'Full Frame (35mm)', focalLength: '85', aperture: '2.8', subjectDistance: '10', distanceUnit: 'feet' });
    expect(ft(getValue(r, 'hyperfocalDistance'))).toBeCloseTo(292.21, 1);
    expect(ft(getValue(r, 'nearLimit'))).toBeCloseTo(9.68, 2);
    expect(ft(getValue(r, 'farLimit'))).toBeCloseTo(10.34, 2);
    expect(ft(getValue(r, 'totalDOF'))).toBeCloseTo(0.67, 2);
  });

  it('f/5.6 and f/8 at the same setup give 1.34 ft and 1.92 ft', () => {
    const run = (a: string) => dof.calculate({ sensorSize: 'Full Frame (35mm)', focalLength: '85', aperture: a, subjectDistance: '10', distanceUnit: 'feet' });
    expect(ft(getValue(run('5.6'), 'totalDOF'))).toBeCloseTo(1.34, 2);
    expect(ft(getValue(run('8'), 'totalDOF'))).toBeCloseTo(1.92, 2);
  });

  it('24mm f/11 FF at 15 ft: H 6.00 ft, near 4.26 ft, far infinite (worked example 2)', () => {
    const r = dof.calculate({ sensorSize: 'Full Frame (35mm)', focalLength: '24', aperture: '11', subjectDistance: '15', distanceUnit: 'feet' });
    expect(ft(getValue(r, 'hyperfocalDistance'))).toBeCloseTo(6.0, 2);
    expect(ft(getValue(r, 'nearLimit'))).toBeCloseTo(4.26, 2);
    expect(getValue(r, 'farLimit')).toContain('Infinite');
    expect(getValue(r, 'totalDOF')).toContain('Infinite');
  });

  it('focusing exactly at H puts the near limit at ~H/2 and far at infinity', () => {
    const H = dofInfo({ sensorSize: 'Full Frame (35mm)', focalLength: '24', aperture: '11', subjectDistance: '100', distanceUnit: 'meters' })!.hyperfocal;
    const d = dofInfo({ sensorSize: 'Full Frame (35mm)', focalLength: '24', aperture: '11', subjectDistance: String(H), distanceUnit: 'meters' })!;
    expect(d.far).toBeNull();
    expect(d.near).toBeCloseTo(H / 2, 6); // algebra: H(H-f) / (2(H-f)) = H/2
  });

  it('group shot: 35mm f/5.6 at 15 ft spans 9.37-37.64 ft', () => {
    const r = dof.calculate({ sensorSize: 'Full Frame (35mm)', focalLength: '35', aperture: '5.6', subjectDistance: '15', distanceUnit: 'feet' });
    expect(ft(getValue(r, 'nearLimit'))).toBeCloseTo(9.37, 2);
    expect(ft(getValue(r, 'farLimit'))).toBeCloseTo(37.64, 2);
  });

  it('CoC follows sensor diagonal / 1500: 1/1.7" is 0.006 mm, medium format 0.037 mm', () => {
    expect(getValue(dof.calculate({ sensorSize: '1/1.7"', focalLength: '10', aperture: '4', subjectDistance: '5', distanceUnit: 'meters' }), 'cocValue')).toBe('0.006 mm');
    expect(getValue(dof.calculate({ sensorSize: 'Medium Format', focalLength: '80', aperture: '4', subjectDistance: '5', distanceUnit: 'meters' }), 'cocValue')).toBe('0.037 mm');
  });

  it('smaller sensor (smaller CoC) gives a shorter DOF at identical lens settings', () => {
    const f = (s: string) => dofInfo({ sensorSize: s, focalLength: '50', aperture: '2.8', subjectDistance: '3', distanceUnit: 'meters' })!.dof!;
    expect(f('Micro 4/3')).toBeLessThan(f('APS-C (1.5x)'));
    expect(f('APS-C (1.5x)')).toBeLessThan(f('Full Frame (35mm)'));
  });

  it('subject closer than the focal length is flagged, not computed', () => {
    const r = dof.calculate({ sensorSize: 'Full Frame (35mm)', focalLength: '200', aperture: '4', subjectDistance: '0.1', distanceUnit: 'meters' });
    expect(r).toHaveLength(1);
    expect(r[0].warning).toMatch(/focal length/);
  });

  it('meters mode reports metres and long distances in miles/km', () => {
    const r = dof.calculate({ sensorSize: 'Full Frame (35mm)', focalLength: '600', aperture: '4', subjectDistance: '20', distanceUnit: 'meters' });
    expect(getValue(r, 'nearLimit')).toMatch(/ m$/);
    expect(getValue(r, 'hyperfocalDistance')).toMatch(/km$/); // 600^2/(4*0.029)+600 mm = 3.1 km
  });
});

import gestation from '../../../src/calculators/everyday/gestation-period/index';

describe('gestation-period audit', () => {
  it('human due date counts 266 days from conception (280 is from the LMP) - python date math', () => {
    const r = gestation.calculate({ animal: 'Human', breedingDate: '2024-03-15' });
    expect(r.find((x) => x.id === 'dueDate')?.value).toBe('December 6, 2024'); // 2024-03-15 + 266 d
    expect(r.find((x) => x.id === 'gestDays')?.value).toContain('280 days');
  });

  it('dog +63 d and elephant +645 d match the worked examples', () => {
    expect(gestation.calculate({ animal: 'Dog', breedingDate: '2024-03-15' }).find((x) => x.id === 'dueDate')?.value).toBe('May 17, 2024');
    expect(gestation.calculate({ animal: 'Elephant (African)', breedingDate: '2024-06-01' }).find((x) => x.id === 'dueDate')?.value).toBe('March 8, 2026');
  });

  it('invalid calendar date is reported, not rolled over (2025-02-31)', () => {
    const r = gestation.calculate({ animal: 'Dog', breedingDate: '2025-02-31' });
    expect(r.find((x) => x.id === 'dueDate')).toBeUndefined();
    expect(r.find((x) => x.id === 'dateError')?.warning).toMatch(/calendar date/);
  });

  it('days-until-due uses calendar days (due in the past -> "ago")', () => {
    const r = gestation.calculate({ animal: 'Dog', breedingDate: '2000-01-01' });
    expect(r.find((x) => x.id === 'past')?.value).toMatch(/^Due \d+ days ago$/);
  });

  it('no breeding date -> just the period', () => {
    const r = gestation.calculate({ animal: 'Pig (Swine)' });
    expect(getValue(r, 'gestDays')).toBe('114 days (16.3 weeks / 3.7 months)');
    expect(r.find((x) => x.id === 'dueDate')).toBeUndefined();
  });
});

import heat from '../../../src/calculators/everyday/heat-index/index';
import heatMath from '../../../src/calculators/math/heat-index/index';
import { heatIndexF } from '../../../src/utils/heatIndex';

describe('heat-index audit (NWS WPC algorithm, independent python)', () => {
  const hi = (t: number, rh: number) => heatIndexF(t, rh);

  it('Steadman simple formula below the 80 F threshold (average of simple and T < 80)', () => {
    expect(hi(70, 50)).toBeCloseTo(69.0, 1); // 0.5*(70+61+2.4+4.7)
    expect(hi(75, 90)).toBeCloseTo(76.4, 1);
    expect(hi(80, 40)).toBeCloseTo(79.6, 1); // regression alone would give 79.9
  });

  it('low-humidity adjustment (RH < 13, 80-112 F)', () => {
    expect(hi(110, 10)).toBeCloseTo(104.4, 1); // raw regression 104.6, minus 0.2
    expect(hi(95, 10)).toBeLessThan(hi(95, 13.0001) - 0.5);
  });

  it('high-humidity adjustment (RH > 85, 80-87 F)', () => {
    expect(hi(80, 90)).toBeCloseTo(86.3, 1); // raw regression 85.6, plus 0.7
  });

  it('Rothfusz regression above the threshold (worked examples)', () => {
    expect(hi(98, 65)).toBeCloseTo(128.2, 1);
    expect(hi(95, 80)).toBeCloseTo(133.8, 1);
  });

  it('Celsius input: 35 C at 60 % = 95 F -> 113.1 F = 45.1 C, humidity field no longer hidden', () => {
    const r = heat.calculate({ temperature: '35', tempUnit: 'C', humidity: '60' });
    expect(getValue(r, 'heatIndex')).toBe('45.1°C');
    expect(getValue(r, 'heatIndexF')).toBe('113.1°F');
    expect(getValue(r, 'dangerTier')).toBe('Danger');
    // regression: showWhen compared the raw Celsius number with 80, hiding humidity for every real Celsius temperature
    const hum = heat.inputs.find((i) => i.id === 'humidity')!;
    expect(hum.showWhen).toBeUndefined();
  });

  it('tier is decided on the displayed value (102.96 -> 103.0 is Danger)', () => {
    // find an input whose raw value rounds up across the 103 boundary
    let found = false;
    for (let t = 85; t <= 100 && !found; t += 0.1) {
      for (let rh = 20; rh <= 90; rh += 1) {
        const raw = heatIndexF(t, rh);
        if (raw < 103 && Math.round(raw * 10) / 10 >= 103) {
          const r = heat.calculate({ temperature: String(Math.round(t * 10) / 10), tempUnit: 'F', humidity: String(rh) });
          expect(getValue(r, 'dangerTier')).toBe('Danger');
          found = true;
          break;
        }
      }
    }
    expect(found).toBe(true);
  });

  it('math/heat-index twin agrees with everyday/heat-index on identical inputs', () => {
    for (const [t, rh] of [[75, 80], [85, 70], [90, 60], [100, 40], [110, 10], [82, 90]]) {
      const a = getValue(heat.calculate({ temperature: String(t), tempUnit: 'F', humidity: String(rh) }), 'heatIndex');
      const b = getValue(heatMath.calculate({ temperature: String(t), humidity: String(rh) }), 'heatIndex');
      expect(a).toBe(b);
    }
  });

  it('warns above the 110 F chart range; rejects humidity outside 0-100', () => {
    expect(heat.calculate({ temperature: '115', tempUnit: 'F', humidity: '30' })[0].warning).toMatch(/110/);
    expect(heat.calculate({ temperature: '90', tempUnit: 'F', humidity: '101' })).toEqual([]);
  });
});

import mars from '../../../src/calculators/everyday/mars-time/index';
import { marsSolDate, parseUtc, taiMinusUtc } from '../../../src/calculators/everyday/mars-time/marsMath';

describe('mars-time audit (Mars24, Allison & McEwen 2000)', () => {
  it('MSD at 2000-01-06 00:00 UTC is 44795.9998 (Mars24 reference epoch JD_TT 2451549.5 -> 44795.99904)', () => {
    expect(marsSolDate(new Date(Date.UTC(2000, 0, 6)))).toBeCloseTo(44795.9998, 4);
  });

  it('Curiosity landing 2012-08-06 05:17:57 UTC is MSD 49269.2455 and ~15:03 local mean solar time at Gale (published landing time 15:03 LTST)', () => {
    const r = mars.calculate({ mode: 'earthToMars', earthDate: '2012-08-06T05:17:57Z', marsLongitude: '137.4' });
    expect(getValue(r, 'msd')).toBe('49269.2455');
    expect(getValue(r, 'lmst')).toBe('15:03:04');
  });

  it('worked example: noon UTC 2026-05-20 -> MSD 54169.8023, MTC 19:15:14, Gale LMST 04:24:50 (python reference)', () => {
    const r = mars.calculate({ mode: 'earthToMars', earthDate: '2026-05-20T12:00:00', marsLongitude: '137.4' });
    expect(getValue(r, 'msd')).toBe('54169.8023');
    expect(getValue(r, 'mtc')).toBe('19:15:14');
    expect(getValue(r, 'lmst')).toBe('04:24:50');
  });

  it('a date without a zone is UTC, not browser-local; offsets are honoured', () => {
    expect(parseUtc('2026-05-20T12:00:00')!.toISOString()).toBe('2026-05-20T12:00:00.000Z');
    expect(parseUtc('2026-05-20T14:00:00+02:00')!.toISOString()).toBe('2026-05-20T12:00:00.000Z');
    expect(parseUtc('2026-05-20')!.toISOString()).toBe('2026-05-20T00:00:00.000Z');
  });

  it('calendar-invalid or malformed timestamps are rejected (no 2026-02-31 rollover)', () => {
    for (const bad of ['2026-02-31T12:00:00', '2026-13-01', '2026-05-20T25:00:00', 'tomorrow', '']) expect(parseUtc(bad)).toBeNull();
    expect(mars.calculate({ mode: 'earthToMars', earthDate: '2026-02-31T12:00:00', marsLongitude: '0' })).toEqual([]);
  });

  it('TT-UTC leap-second table: 37 s since 2017, 35 s in Aug 2012, 10 s in 1972', () => {
    expect(taiMinusUtc(Date.UTC(2026, 0, 1))).toBe(37);
    expect(taiMinusUtc(Date.UTC(2012, 7, 6))).toBe(35);
    expect(taiMinusUtc(Date.UTC(1972, 0, 1))).toBe(10);
  });

  it('longitude shifts LMST by 1 h per 15 degrees (east positive)', () => {
    const at = (lon: string) => getValue(mars.calculate({ mode: 'earthToMars', earthDate: '2026-05-20T12:00:00', marsLongitude: lon }), 'lmst');
    expect(at('15')).toBe('20:15:14');
    expect(at('-15')).toBe('18:15:14');
  });

  it('sols to Earth: 1000 sols = 1027.4912 d = 1027d 11h 47m; 1 sol = 24h 39m 35s', () => {
    const r = mars.calculate({ mode: 'solToEarth', sols: '1000' });
    expect(getValue(r, 'earthTime')).toBe('1027d 11h 47m');
    expect(getValue(r, 'earthDays')).toMatch(/^1027.491[23] days$/);
    expect(getValue(mars.calculate({ mode: 'solToEarth', sols: '1' }), 'earthTime')).toBe('1d 0h 39m');
  });

  it('Perseverance Sol 1000 lands on 2023-12-13 (landing 2021-02-18 20:55 UTC + 1000 sols; python)', () => {
    const r = mars.calculate({ mode: 'missionTime', missionSols: '1000', rover: 'perseverance' });
    expect(getValue(r, 'earthDate')).toBe('2023-12-13');
    expect(getValue(r, 'landing')).toBe('2021-02-18');
    expect(getValue(mars.calculate({ mode: 'missionTime', missionSols: '0', rover: 'bogus' }), 'rover')).toContain('Curiosity');
  });
});

import moon from '../../../src/calculators/everyday/moon-phase/index';
import { elongation, nextPhaseTime, moonInfo } from '../../../src/calculators/everyday/moon-phase/moonMath';

describe('moon-phase audit (published US Naval Observatory / NASA event times)', () => {
  const near5min = (ms: number, iso: string) => expect(Math.abs(ms - Date.parse(iso))).toBeLessThan(6 * 60000);

  it('new moon 2000-01-06 18:14 UTC', () => near5min(nextPhaseTime(Date.UTC(2000, 0, 1), 0), '2000-01-06T18:14:00Z'));
  it('full moon 2024-01-25 17:54 UTC', () => near5min(nextPhaseTime(Date.UTC(2024, 0, 20), 180), '2024-01-25T17:54:00Z'));
  it('new moon 2024-04-08 18:21 UTC (total solar eclipse)', () => near5min(nextPhaseTime(Date.UTC(2024, 3, 1), 0), '2024-04-08T18:21:00Z'));
  it('full moon 2025-03-14 06:55 UTC (total lunar eclipse)', () => near5min(nextPhaseTime(Date.UTC(2025, 2, 10), 180), '2025-03-14T06:55:00Z'));
  it('first quarter 2024-01-18 03:53 UTC', () => near5min(nextPhaseTime(Date.UTC(2024, 0, 14), 90), '2024-01-18T03:53:00Z'));

  it('the full moon of 2024-01-25 is reported on that date with ~100% illumination', () => {
    const r = moon.calculate({ dateOfBirth: '2024-01-25' });
    expect(getValue(r, 'moonPhase')).toBe('Full Moon');
    expect(parseNumber(getValue(r, 'illumination'))).toBeGreaterThanOrEqual(99.9);
    expect(getValue(r, 'daysUntilNextFull')).toBe('0');
    expect(getValue(r, 'nextFullMoon')).toContain('January 25, 2024');
  });

  it('next full moon after 2024-01-26 is 2024-02-24 (full moon 2024-02-24 12:30 UTC) = 29 days', () => {
    const r = moon.calculate({ dateOfBirth: '2024-01-26' });
    expect(getValue(r, 'nextFullMoon')).toContain('February 24, 2024');
    expect(getValue(r, 'daysUntilNextFull')).toBe('29');
  });

  it('dates before 2000 work (old panel forced phase 0 for them): new moon 1999-08-11 ~11:08 UTC (total solar eclipse)', () => {
    expect(Math.abs(nextPhaseTime(Date.UTC(1999, 7, 5), 0) - Date.parse('1999-08-11T11:08:00Z'))).toBeLessThan(10 * 60000);
    expect(moonInfo({ dateOfBirth: '1999-08-11' })!.phase.name).toBe('New Moon');
  });

  it('elongation is monotonic over a lunar month and wraps once', () => {
    let wraps = 0;
    let prev = elongation(Date.UTC(2024, 0, 1));
    for (let d = 1; d <= 30; d++) {
      const e = elongation(Date.UTC(2024, 0, 1 + d));
      if (e < prev) wraps++;
      prev = e;
    }
    expect(wraps).toBe(1);
  });

  it('phase names cover the whole cycle without gaps', () => {
    const seen = new Set<string>();
    for (let d = 0; d < 60; d++) seen.add(moonInfo({ dateOfBirth: new Date(Date.UTC(2024, 0, 1 + d)).toISOString().slice(0, 10) })!.phase.name);
    for (const n of ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']) expect(seen).toContain(n);
  });

  it('invalid calendar dates are rejected', () => {
    expect(moon.calculate({ dateOfBirth: '2024-02-31' })).toEqual([]);
  });
});

import numerology from '../../../src/calculators/everyday/numerology/index';
import { lifePathInfo, reductionSteps } from '../../../src/calculators/everyday/numerology/numerologyMath';

describe('numerology audit (arithmetic is exact; content is labelled entertainment)', () => {
  const run = (birthMonth: string, birthDay: string, birthYear: string) => numerology.calculate({ birthMonth, birthDay, birthYear });

  it('reduction chains (hand): 1990 -> 19 -> 10 -> 1; 2009 -> 11 stops; 1998 -> 27 -> 9', () => {
    expect(reductionSteps(1990)).toEqual([1990, 19, 10, 1]);
    expect(reductionSteps(2009)).toEqual([2009, 11]);
    expect(reductionSteps(1998)).toEqual([1998, 27, 9]);
    expect(reductionSteps(29)).toEqual([29, 11]);
  });

  it('worked example 1: 4 July 1990 = 7 + 4 + 1 = 12 -> 3, Cancer', () => {
    const r = run('7', '4', '1990');
    expect(getValue(r, 'lifePathNumber')).toBe('3');
    expect(getValue(r, 'totalSum')).toBe('7 + 4 + 1 = 12 → 3');
    expect(getValue(r, 'zodiacSign')).toContain('Cancer (Crab) — Water sign ruled by Moon');
  });

  it('worked example 2: 2 Nov 1998 = 11 + 2 + 9 = 22 (master), Scorpio', () => {
    const r = run('11', '2', '1998');
    expect(getValue(r, 'lifePathNumber')).toBe('22 (Master Number 22)');
    expect(getValue(r, 'zodiacSign')).toContain('Scorpio (Scorpion) — Water sign ruled by Pluto');
  });

  it('master 33 from 11 + 11 + 11 (29 Nov 2009)', () => {
    expect(getValue(run('11', '29', '2009'), 'lifePathNumber')).toBe('33 (Master Number 33)');
  });

  it('a non-master total is reduced: 1 Jan 2000 = 1 + 1 + 2 = 4', () => {
    expect(lifePathInfo({ birthMonth: '1', birthDay: '1', birthYear: '2000' })).toMatchObject({ sum: 4, lifePath: 4, isMaster: false });
  });

  it('rejects days that do not exist (31 April, 30 Feb, 29 Feb 2023) but accepts 29 Feb 2024', () => {
    for (const [m, d, y] of [['4', '31', '1990'], ['2', '30', '1990'], ['2', '29', '2023']]) {
      const r = run(m, d, y);
      expect(r).toHaveLength(1);
      expect(r[0].warning).toMatch(/does not exist/);
    }
    expect(getValue(run('2', '29', '2024'), 'lifePathNumber')).toBeTruthy();
  });

  it('is labelled as entertainment, not science', () => {
    const r = run('7', '4', '1990');
    expect(r.find((x) => x.id === 'lifePathNumber')?.interpretation).toMatch(/no scientific basis/);
    expect(numerology.educational.faqs!.some((f) => /scientific/i.test(f.answer))).toBe(true);
  });

  it('zodiac boundaries come from the shared table (Aries starts 21 March, Pisces ends 20 March)', () => {
    expect(getValue(run('3', '20', '1990'), 'zodiacSign')).toContain('Pisces');
    expect(getValue(run('3', '21', '1990'), 'zodiacSign')).toContain('Aries');
    expect(getValue(run('12', '22', '1990'), 'zodiacSign')).toContain('Capricorn');
  });
});

import oven from '../../../src/calculators/everyday/oven-temperature-converter/index';
import ovenInd from '../../../src/calculators/industrial/oven-temperature-converter/index';
import { GAS_MARK_TABLE, closestGasMark } from '../../../src/utils/ovenTemp';

describe('oven-temperature-converter audit (table: Wikipedia "Gas mark")', () => {
  it('shared table matches the published values (1/2 = 250 F/120 C, 3 = 325 F/170 C, 9 = 475 F/240 C)', () => {
    const t = (m: number) => GAS_MARK_TABLE.find((r) => r.mark === m)!;
    expect([t(0.5).fahrenheit, t(0.5).celsius]).toEqual([250, 120]); // was 130 C
    expect([t(3).fahrenheit, t(3).celsius]).toEqual([325, 170]); // was 165 C
    expect([t(9).fahrenheit, t(9).celsius]).toEqual([475, 240]); // everyday said 245 C
    expect([t(10).fahrenheit, t(10).celsius]).toEqual([500, 260]);
  });

  it('twins agree on every gas mark (C and F) and on nearest-mark lookups', () => {
    for (const r of GAS_MARK_TABLE) {
      const a = oven.calculate({ temperature: String(r.mark), fromUnit: 'Gas Mark' });
      const b = ovenInd.calculate({ value: String(r.mark), from: 'gas', to: 'c' });
      expect(getValue(a, 'celsius')).toBe(`${r.celsius}°C`);
      expect(getValue(b, 'resultC')).toBe(`${r.celsius.toFixed(1)}°C`);
      expect(getValue(a, 'fahrenheit')).toBe(`${r.fahrenheit}°F`);
      expect(getValue(b, 'resultF')).toBe(`${r.fahrenheit.toFixed(1)}°F`);
    }
    for (const c of [115, 135, 160, 175, 185, 205, 225, 250]) {
      const a = getValue(oven.calculate({ temperature: String(c), fromUnit: '°C' }), 'gasMark').replace('1/4', '¼').replace('1/2', '½');
      const b = getValue(ovenInd.calculate({ value: String(c), from: 'c', to: 'gas' }), 'gasMark');
      expect(a).toBe(b);
    }
  });

  it('nearest gas mark by Celsius: 176.7 C -> 4 (180), 165 C -> 3 (170 is nearer than 150), 205 C -> 6, 215 C -> 7', () => {
    expect(closestGasMark(176.7)!.mark).toBe(4); // 350 F = 176.7 C
    expect(closestGasMark(165)!.mark).toBe(3);
    expect(closestGasMark(160)!.mark).toBe(2); // exact tie between 150 and 170: the cooler mark wins
    expect(closestGasMark(205)!.mark).toBe(6);
    expect(closestGasMark(215)!.mark).toBe(7);
  });

  it('industrial: no gaps in the oven description (135 C used to say "Above typical range"); 170 C is Gas Mark 3 (formula said 4)', () => {
    const r = ovenInd.calculate({ value: '135', from: 'c', to: 'f' });
    expect(getValue(r, 'description')).toContain('Slow');
    expect(getValue(ovenInd.calculate({ value: '170', from: 'c', to: 'gas' }), 'gasMark')).toBe('Gas Mark 3');
    expect(getValue(ovenInd.calculate({ value: '300', from: 'c', to: 'gas' }), 'gasMark')).toBe('N/A');
  });

  it('exact F/C conversions (independent): 350 F = 176.7 C, 200 C = 392 F, 450 F = 232.2 C', () => {
    expect(getValue(ovenInd.calculate({ value: '350', from: 'f', to: 'c' }), 'resultC')).toBe('176.7°C');
    expect(getValue(ovenInd.calculate({ value: '200', from: 'c', to: 'f' }), 'resultF')).toBe('392.0°F');
    expect(getValue(ovenInd.calculate({ value: '450', from: 'f', to: 'c' }), 'resultC')).toBe('232.2°C');
  });

  it('out-of-range gas marks are rejected in both twins', () => {
    expect(ovenInd.calculate({ value: '12', from: 'gas', to: 'c' })).toEqual([]);
    expect(oven.calculate({ temperature: '12', fromUnit: 'Gas Mark' })[0].warning).toBeTruthy();
    expect(oven.calculate({ temperature: '1/0', fromUnit: 'Gas Mark' })).toEqual([]);
    expect(oven.calculate({ temperature: '350abc', fromUnit: '°F' })).toEqual([]);
  });

  it('interpolates fractional marks linearly (1.5 -> 145 C / 288 F; 7.5 -> 225 C / 438 F)', () => {
    const r = oven.calculate({ temperature: '7.5', fromUnit: 'Gas Mark' });
    expect(getValue(r, 'celsius')).toBe('225°C'); // (220 + 230) / 2
    expect(getValue(r, 'fahrenheit')).toBe('438°F'); // (425 + 450) / 2 = 437.5
  });
});

import pct from '../../../src/calculators/everyday/percentage-calculator/index';

describe('percentage-calculator audit (worked examples + modes, hand-derived)', () => {
  const run = (mode: string, x: string, y: string) => pct.calculate({ mode, x, y });

  it('of: 15% of 200 = 30, remaining 170', () => {
    const r = run('of', '15', '200');
    expect(getValue(r, 'result')).toBe('30');
    expect(getValue(r, 'remainder')).toBe('170');
  });
  it('whatpct: 30 is 15% of 200; y=0 -> an explicit "Undefined" row', () => {
    expect(getValue(run('whatpct', '30', '200'), 'result')).toBe('15%');
    expect(getValue(run('whatpct', '30', '0'), 'error')).toBe('Undefined');
    expect(run('whatpct', '30', '0').find((x) => x.id === 'result')).toBeUndefined();
  });
  it('change: 2000 -> 2600 = +30% (+600); falling value is negative; base 0 -> "Undefined" row', () => {
    const r = run('change', '2000', '2600');
    expect(getValue(r, 'result')).toBe('+30%');
    expect(getValue(r, 'absolute')).toBe('+600');
    expect(getValue(run('change', '200', '150'), 'result')).toBe('-25%');
    expect(getValue(run('change', '0', '5'), 'error')).toBe('Undefined');
  });
  it('change from a negative base divides by |old|: -50 -> -25 is +50%', () => {
    expect(getValue(run('change', '-50', '-25'), 'result')).toBe('+50%');
  });
  it('worked example: 30% off $85 = $59.50, saved $25.50', () => {
    const r = run('subtract', '30', '85');
    expect(getValue(r, 'result')).toBe('59.5');
    expect(getValue(r, 'removed')).toBe('-25.5');
  });
  it('worked example: 8.75% added to $65 = 70.6875, tax 5.6875', () => {
    const r = run('add', '8.75', '65');
    expect(getValue(r, 'result')).toBe('70.6875');
    expect(getValue(r, 'added')).toBe('+5.6875');
  });
  it('FAQ: 8% on $50 -> 54, tax 4; reverse: 68 / 0.8 = 85; stacked 50%+50% = 75% off', () => {
    expect(getValue(run('add', '8', '50'), 'result')).toBe('54');
    expect(getValue(run('whatpct', '68', '85'), 'result')).toBe('80%');
    expect(getValue(run('subtract', '50', String(getValue(run('subtract', '50', '100'), 'result'))), 'result')).toBe('25');
  });
  it('large results use thousands separators in a fixed locale', () => {
    expect(getValue(run('of', '50', '4000000'), 'result')).toBe('2,000,000');
  });
});

import px from '../../../src/calculators/everyday/pixels-to-inches/index';

describe('pixels-to-inches audit', () => {
  const run = (v: Record<string, string>) => px.calculate({ dpi: '300', ...v });

  it('worked examples: 6000 px @300 = 20.00" (50.80 cm / 508.00 mm); 1200 @300 = 4"; 3600 @150 = 24"', () => {
    const a = run({ pixels: '6000' });
    expect(getValue(a, 'inches')).toBe('20.00"');
    expect(getValue(a, 'cm')).toBe('50.80 cm');
    expect(getValue(a, 'mm')).toBe('508.00 mm');
    expect(getValue(run({ pixels: '1200' }), 'cm')).toBe('10.16 cm');
    expect(getValue(run({ pixels: '3600', dpi: '150' }), 'inches')).toBe('24.00"');
  });

  it('diagram/FAQ numbers: 3000 px = 41.67" @72, 20" @150, 10" @300; 4000 px = 55.56" @72 and 13.33" @300', () => {
    expect(getValue(run({ pixels: '3000', dpi: '72' }), 'inches')).toBe('41.67"');
    expect(getValue(run({ pixels: '4000', dpi: '72' }), 'inches')).toBe('55.56"');
    expect(getValue(run({ pixels: '4000' }), 'inches')).toBe('13.33"');
  });

  it('both sides: 6000 x 4000 px = 24.00 MP and 20.00" x 13.33" at 300 DPI (regression: one side was squared, 6000 -> 36 MP)', () => {
    const r = run({ pixels: '6000', pixelsB: '4000' });
    expect(getValue(r, 'megapixels')).toBe('24.00 MP');
    expect(getValue(r, 'printSize')).toContain('20.00" × 13.33"');
    const sq = run({ pixels: '6000' });
    expect(getValue(sq, 'megapixels')).toBe('36.00 MP');
    expect(sq.find((x) => x.id === 'megapixels')!.label).toMatch(/square/);
  });

  it('quick-reference arithmetic: 4x6 -> 1200x1800 = 2.16 MP; 5x7 -> 3.15 MP; 11x14 -> 13.86 MP; 24x36 @150 -> 19.44 MP', () => {
    expect(getValue(run({ pixels: '1200', pixelsB: '1800' }), 'megapixels')).toBe('2.16 MP');
    expect(getValue(run({ pixels: '1500', pixelsB: '2100' }), 'megapixels')).toBe('3.15 MP');
    expect(getValue(run({ pixels: '3300', pixelsB: '4200' }), 'megapixels')).toBe('13.86 MP');
    expect(getValue(run({ pixels: '3600', pixelsB: '5400', dpi: '150' }), 'megapixels')).toBe('19.44 MP');
  });

  it('custom DPI and unit modes', () => {
    expect(getValue(px.calculate({ pixels: '1000', dpi: 'custom', customDpi: '250' }), 'inches')).toBe('4.00"');
    const metric = run({ pixels: '3000', outputUnits: 'metric' });
    expect(metric.find((x) => x.id === 'inches')).toBeUndefined();
    expect(getValue(metric, 'cm')).toBe('25.40 cm');
    expect(px.calculate({ pixels: '1000', dpi: 'custom', customDpi: '' })).toEqual([]);
    expect(run({ pixels: '0' })).toEqual([]);
  });
});

import reading from '../../../src/calculators/everyday/reading-time-calculator/index';
import { readingMinutesFor } from '../../../src/calculators/everyday/reading-time-calculator/readingMath';

describe('reading-time-calculator audit', () => {
  const run = (v: Record<string, string>) => reading.calculate({ readingSpeed: '200', includePauses: 'none', contentType: 'general', ...v });

  it('1000 words at 238 wpm = 4.2 min -> "4 minutes"; 6000 at 238 = 25.2 min', () => {
    expect(getValue(run({ wordCount: '1000', readingSpeed: '238' }), 'readingTime')).toBe('4 minutes');
    expect(getValue(run({ wordCount: '6000', readingSpeed: '238' }), 'readingTime')).toBe('25 minutes');
    expect(getValue(run({ wordCount: '1000', readingSpeed: '238' }), 'readingSpeed')).toBe('238 wpm');
  });

  it('multipliers from the diagram: 1000 words @200 -> 5.0 / 6.5 / 7.5 min', () => {
    expect(readingMinutesFor(1000, 200, 1.0, 'none').totalMinutes).toBeCloseTo(5.0, 6);
    expect(readingMinutesFor(1000, 200, 1.3, 'none').totalMinutes).toBeCloseTo(6.5, 6);
    expect(readingMinutesFor(1000, 200, 1.5, 'none').totalMinutes).toBeCloseTo(7.5, 6);
  });

  it('breaks: 14000 words @200 = 70 min -> light: 2 x 5 = 80 min (1 hour 20); full: 1 x 15 = 85 min (1 hour 25)', () => {
    const light = run({ wordCount: '14000', includePauses: 'short' });
    expect(getValue(light, 'readingTime')).toBe('1 hour 20 minutes');
    expect(getValue(light, 'breakDetails')).toBe('2 x 5-min breaks');
    const full = run({ wordCount: '14000', includePauses: 'full' });
    expect(getValue(full, 'readingTime')).toBe('1 hour 25 minutes');
  });

  it('no minute-rounding artefact: 59.6 minutes is "1 hour", not "60 minutes" (regression)', () => {
    // 11920 words @200 = 59.6 min -> rounds to 60 -> 1 hour
    expect(getValue(run({ wordCount: '11920' }), 'readingTime')).toBe('1 hour');
  });

  it('interpretation spells out the arithmetic', () => {
    expect(run({ wordCount: '1000', contentType: 'technical' })[0].interpretation).toContain('1,000 words ÷ 200 wpm × 1.3 = 6.5 min');
  });

  it('invalid word counts', () => {
    expect(run({ wordCount: '0' })).toEqual([]);
    expect(run({ wordCount: 'abc' })).toEqual([]);
  });
});

import wordCount from '../../../src/calculators/everyday/word-count/index';
import { analyzeText, countSyllables, formatDuration, normalizeWord } from '../../../src/calculators/everyday/word-count/wordCountMath';

describe('word-count audit (rules: whitespace tokens, code points, sentences end at . ! ? + space)', () => {
  const stats = (t: string) => analyzeText(t, 238)!;

  it('words: hyphenated, contraction, number, URL and lone dash are one word each (hand count = 7)', () => {
    expect(stats('well-known it\'s 3.14 https://a.b/c — end ok').wordCount).toBe(7);
  });

  it('characters are code points: an emoji is 1 character (UTF-16 length would say 2)', () => {
    const s = stats('a 😀');
    expect(s.charCount).toBe(3);
    expect(s.charNoSpaces).toBe(2);
  });

  it('sentences: 3.14 and 1,500 do not end a sentence; trailing fragment counts; "?!" is one terminator', () => {
    expect(stats('Pi is 3.14 today. Really?! Yes').sentences).toBe(3);
    expect(stats('Wait... what').sentences).toBe(2); // "Wait..." ends one, "what" is a trailing fragment
    expect(stats('no terminator at all').sentences).toBe(1);
  });

  it('paragraphs split on blank lines', () => {
    expect(stats('one\n\ntwo\n\n\nthree').paragraphs).toBe(3);
    expect(stats('one\ntwo').paragraphs).toBe(1);
  });

  it('keyword/unique normalisation keeps inner apostrophes and non-Latin letters (old regex stripped them: "café" -> "caf")', () => {
    expect(normalizeWord('“Don’t!”')).toBe("don't");
    expect(normalizeWord('Café,')).toBe('café');
    expect(stats('Café café CAFÉ dog').uniqueWords).toBe(2);
    expect(stats('привет мир привет').keywords[0]).toMatchObject({ word: 'привет', count: 2 });
  });

  it('time formatting never produces "N min 60 sec" (regression)', () => {
    // 119.6 s used to print "1 min 60 sec"
    expect(formatDuration(119.6)).toBe('2 min 0 sec');
    expect(formatDuration(59.4)).toBe('59 sec');
  });

  it('syllable heuristic: silent e and -le/-ed handled', () => {
    const w = (x: string) => countSyllables(x);
    expect([w('the'), w('make'), w('table'), w('walked'), w('wanted'), w('beautiful')]).toEqual([1, 1, 2, 1, 2, 3]);
  });

  it('reading time 238 wpm: 238 words = 60 s; speaking 150 wpm: 150 words = 60 s', () => {
    const t = Array(238).fill('word').join(' ');
    const r = wordCount.calculate({ text: t, wordsPerMinute: '238' });
    expect(getValue(r, 'estimatedTime')).toContain('Read: 1 min 0 sec');
    expect(getValue(r, 'estimatedTime')).toContain('Speak: 1 min 35 sec'); // 238/150 min = 95.2 s
  });

  it('Flesch-Kincaid grade (hand): 10 one-syllable words in 1 sentence = 0.39*10 + 11.8*1 - 15.59 = 0.12', () => {
    const s = stats('the cat sat on the mat and the dog ran.');
    expect(s.wordCount).toBe(10);
    expect(s.fkGrade).toBeCloseTo(0.39 * 10 + 11.8 - 15.59, 6);
  });

  it('blank text -> no results', () => {
    expect(wordCount.calculate({ text: '   \n ', wordsPerMinute: '238' })).toEqual([]);
  });
});

import wpm from '../../../src/calculators/everyday/wpm-typing-test/index';
import { commonLength } from '../../../src/calculators/everyday/wpm-typing-test/wpmMath';

describe('wpm-typing-test audit', () => {
  const run = (sourceText: string, typedText: string, timerMinutes = '1') => wpm.calculate({ sourceText, typedText, timerMinutes });

  it('one dropped letter is one error, not a shifted mess (regression: position compare marked everything after it wrong)', () => {
    const src = 'the quick brown fox jumps over the lazy dog'; // 43 chars
    const typed = 'the quik brown fox jumps over the lazy dog'; // dropped the "c": 42 chars
    const r = run(src, typed);
    expect(getValue(r, 'totalChars')).toBe('42');
    expect(getValue(r, 'correctChars')).toBe('42'); // LCS: all typed chars belong to the source
    expect(getValue(r, 'errorCount')).toBe('0');
    expect(getValue(r, 'accuracy')).toBe('100.0%');
  });

  it('an inserted letter is one error', () => {
    const r = run('hello world', 'helllo world');
    expect(getValue(r, 'errorCount')).toBe('1');
    expect(getValue(r, 'correctChars')).toBe('11');
  });

  it('gross / net WPM by hand: 300 chars in 2 minutes, 285 correct -> gross 30.0, net 28.5, accuracy 95.0%', () => {
    const src = 'a'.repeat(300);
    const typed = 'a'.repeat(285) + 'b'.repeat(15);
    const r = run(src, typed, '2');
    expect(getValue(r, 'grossWpm')).toBe('30.0 wpm'); // 300 / 5 / 2
    expect(getValue(r, 'netWpm')).toBe('28.5 wpm'); // 285 / 5 / 2
    expect(getValue(r, 'accuracy')).toBe('95.0%');
    expect(getValue(r, 'errorCount')).toBe('15');
  });

  it('commonLength is the LCS length (hand: "abcde12345" vs "abcdefghij" -> 5)', () => {
    expect(commonLength('abcdefghij', 'abcde12345')).toBe(5);
    expect(commonLength('', 'abc')).toBe(0);
    expect(commonLength('ABC', 'abc')).toBe(0); // case-sensitive
  });

  it('rejects a zero duration (used to give Infinity) and the retired practice mode', () => {
    expect(run('abc', 'abc', '0')).toEqual([]);
    expect(wpm.calculate({ mode: 'practice', sourceText: 'a', typedText: 'a' })).toEqual([]);
  });

  it('diagram text has no corrupted characters and the FAQ comparison is arithmetically true (80 x 0.75 = 60 < 65 x 0.98 = 63.7)', () => {
    expect(wpm.educational.diagram!.svg).not.toContain('�');
    expect(80 * 0.75).toBeLessThan(65 * 0.98);
    expect(wpm.educational.faqs!.some((f) => f.answer.includes('80 WPM with 75% accuracy'))).toBe(true);
  });
});

import recipe from '../../../src/calculators/everyday/recipe-scaler/index';
import { parseQty, toKitchenFraction, formatQty } from '../../../src/calculators/everyday/recipe-scaler/recipeMath';

describe('recipe-scaler audit', () => {
  it('worked example 1: 24 -> 48 servings doubles butter 1 cup, sugar 1 1/2 cups, vanilla 2 tsp', () => {
    const r = recipe.calculate({ originalServings: '24', desiredServings: '48', ingredient1Name: 'Butter', ingredient1Qty: '1', ingredient1Unit: 'cups', ingredient2Name: 'Sugar', ingredient2Qty: '1 1/2', ingredient2Unit: 'cups', ingredient3Name: 'Vanilla', ingredient3Qty: '2', ingredient3Unit: 'tsp' });
    expect(getValue(r, 'scaleFactor')).toBe('2x');
    expect(getValue(r, 'ingredient1-scaled')).toBe('2 cups');
    expect(getValue(r, 'ingredient2-scaled')).toBe('3 cups');
    expect(getValue(r, 'ingredient3-scaled')).toBe('4 tsp');
    expect(r[0].interpretation).toMatch(/do not scale in simple proportion/);
  });

  it('worked example 2: 6 -> 2 servings is 0.33x: 3 lbs -> 1 lbs, 3 tbsp -> 1 tbsp, 4 cloves -> 1.33', () => {
    const r = recipe.calculate({ originalServings: '6', desiredServings: '2', ingredient1Name: 'Chicken', ingredient1Qty: '3', ingredient1Unit: 'lbs', ingredient2Name: 'Oil', ingredient2Qty: '3', ingredient2Unit: 'tbsp', ingredient3Name: 'Garlic', ingredient3Qty: '4', ingredient3Unit: '' });
    expect(getValue(r, 'scaleFactor')).toBe('0.33x');
    expect(getValue(r, 'ingredient1-scaled')).toBe('1 lbs');
    expect(getValue(r, 'ingredient2-scaled')).toBe('1 tbsp');
    expect(getValue(r, 'ingredient3-scaled')).toBe('1.33');
  });

  it('FAQ: half of 1/3 cup = 0.17 cups = about 1/6', () => {
    const r = recipe.calculate({ originalServings: '2', desiredServings: '1', ingredient1Name: 'Milk', ingredient1Qty: '1/3', ingredient1Unit: 'cups' });
    expect(getValue(r, 'ingredient1-scaled')).toBe('0.17 cups');
  });

  it('quantity parsing is strict (regression: "1/0" parsed as 1, "2abc" as 2)', () => {
    expect(parseQty('1/0')).toBeNull();
    expect(parseQty('2abc')).toBeNull();
    expect(parseQty('0')).toBeNull();
    expect(parseQty('-2')).toBeNull();
    expect(parseQty('2 1/2')).toBe(2.5);
    expect(parseQty('1,5')).toBe(1.5);
    expect(parseQty('3/4')).toBe(0.75);
  });

  it('kitchen fractions: 1.67 cups = 1 2/3, 0.375 = 3/8, 2 = none', () => {
    expect(toKitchenFraction(1 + 2 / 3)).toBe('1 2/3');
    expect(toKitchenFraction(0.375)).toBe('3/8');
    expect(toKitchenFraction(2)).toBeNull();
    expect(formatQty(0.004)).toBe('0.004');
  });

  it('fractional factor 5/3 shows the cups hint', () => {
    const r = recipe.calculate({ originalServings: '3', desiredServings: '5', ingredient1Name: 'Flour', ingredient1Qty: '1', ingredient1Unit: 'cups' });
    expect(r.find((x) => x.id === 'ingredient1-scaled')?.interpretation).toContain('1 2/3 cups');
  });

  it('no valid ingredient -> guidance row; invalid servings -> []', () => {
    expect(getValue(recipe.calculate({ originalServings: '4', desiredServings: '8', ingredient1Name: 'x', ingredient1Qty: '1/0' }), 'noIngredients')).toMatch(/Add at least one/);
    expect(recipe.calculate({ originalServings: '0', desiredServings: '8' })).toEqual([]);
  });
});

import robux from '../../../src/calculators/everyday/robux-converter/index';
import { ROBUX_PACKAGES, ROBUX_PREMIUM_PACKAGES, VBUCK_PACKAGES, cheapestCover } from '../../../src/calculators/everyday/robux-converter/robuxMath';

describe('robux-converter audit (prices are a dated, illustrative snapshot)', () => {
  it('cheapest cover, brute-force checked offline: 5000 Robux = 4 x 400 + 2 x 1700 = $59.94; 3000 = 8 x 400 = 3200 for $39.92; 1000 = 3 x 400 for $14.97', () => {
    const c = (amt: number) => cheapestCover(ROBUX_PACKAGES, amt);
    expect(c(5000).cents).toBe(5994);
    expect(c(5000).units).toBe(5000);
    expect(c(3000)).toMatchObject({ cents: 3992, units: 3200 });
    expect(c(1000)).toMatchObject({ cents: 1497, units: 1200 });
  });

  it('worked examples: 5000 Robux, 10000 Premium, 2950 V-Bucks', () => {
    const a = robux.calculate({ virtualCurrency: '5000', currencyType: 'Robux' });
    expect(getValue(a, 'usdValue')).toBe('$59.94');
    expect(getValue(a, 'packageType')).toBe('2 × 1,700 + 4 × 400');
    expect(a[0].warning).toMatch(/Illustrative/);
    const b = robux.calculate({ virtualCurrency: '10000', currencyType: 'Roblox Premium' });
    expect(getValue(b, 'usdValue')).toBe('$99.99');
    expect(getValue(b, 'unitsReceived')).toContain('11,000');
    const v = robux.calculate({ virtualCurrency: '2950', currencyType: 'V-Bucks' });
    expect(getValue(v, 'usdValue')).toBe('$26.97');
    expect(getValue(v, 'effectiveRate')).toBe('$0.008990');
  });

  it('chosen package: 1000 Robux with the 800 pack = 2 packs $19.98 for 1600; rates: V-Bucks 13,500 = $0.0067', () => {
    const r = robux.calculate({ virtualCurrency: '1000', currencyType: 'Robux', packageType: '800' });
    expect(getValue(r, 'usdValue')).toBe('$19.98');
    expect(getValue(r, 'unitsReceived')).toContain('1,600');
    expect(89.99 / 13500).toBeCloseTo(0.006666, 5);
  });

  it('Premium table is exactly +10% units at the same prices (440/880/1870/4950/11000)', () => {
    expect(ROBUX_PREMIUM_PACKAGES.map((p) => p.amount)).toEqual([440, 880, 1870, 4950, 11000]);
    expect(ROBUX_PREMIUM_PACKAGES.map((p) => p.cost)).toEqual(ROBUX_PACKAGES.map((p) => p.cost));
  });

  it('V-Bucks 13,500 pack is $89.99 (was $79.99); educational text no longer quotes the old price', () => {
    expect(VBUCK_PACKAGES.find((p) => p.amount === 13500)!.cost).toBe(89.99);
    const text = JSON.stringify(robux.educational);
    expect(text).not.toContain('79.99');
  });

  it('invalid amounts', () => {
    expect(robux.calculate({ virtualCurrency: '0', currencyType: 'Robux' })).toEqual([]);
    expect(robux.calculate({ virtualCurrency: 'abc', currencyType: 'Robux' })).toEqual([]);
  });
});

import schengen from '../../../src/calculators/everyday/schengen-visa/index';
import { schengenInfo, dayNum } from '../../../src/calculators/everyday/schengen-visa/schengenMath';

describe('schengen-visa audit (90/180: 180 days ending on the check date, entry and exit days count)', () => {
  const run = (v: Record<string, string>) => schengen.calculate(v);
  const info = (v: Record<string, string>) => schengenInfo(v, dayNum(new Date(2026, 5, 1)))!;

  it('window boundary: a single day 179 days before the check date is inside, 180 days before is outside (python day count)', () => {
    // 2026-01-01 .. check 2026-06-29 is 179 days later -> inside; 2026-06-30 -> outside
    expect(info({ checkDate: '2026-06-29', trip1Start: '2026-01-01', trip1End: '2026-01-01' }).used).toBe(1);
    expect(info({ checkDate: '2026-06-30', trip1Start: '2026-01-01', trip1End: '2026-01-01' }).used).toBe(0);
  });

  it('entry and exit days both count; the check date itself counts when inside a trip', () => {
    expect(info({ checkDate: '2026-03-15', trip1Start: '2026-03-01', trip1End: '2026-03-10' }).used).toBe(10);
    expect(info({ checkDate: '2026-03-05', trip1Start: '2026-03-01', trip1End: '2026-03-10' }).used).toBe(5); // days after the check date are not yet used
  });

  it('exactly 90 days is allowed, 91 is an overstay', () => {
    // 2026-01-01 .. 2026-03-31 is 90 days; one more day -> 91
    expect(info({ checkDate: '2026-03-31', trip1Start: '2026-01-01', trip1End: '2026-03-31' })).toMatchObject({ used: 90, remaining: 0, overstay: false });
    expect(info({ checkDate: '2026-04-01', trip1Start: '2026-01-01', trip1End: '2026-04-01' })).toMatchObject({ used: 91, overstay: true });
  });

  it('worked example 1: 40 days used, 50 remaining on 2026-07-01', () => {
    const r = run({ checkDate: '2026-07-01', trip1Start: '2026-03-01', trip1End: '2026-03-30', trip2Start: '2026-06-01', trip2End: '2026-06-10' });
    expect(getValue(r, 'totalDaysUsed')).toBe('40 days');
    expect(getValue(r, 'daysRemaining')).toBe('50 days');
    expect(getValue(r, 'checkWindow')).toContain('January 3, 2026 – July 1, 2026');
  });

  it('worked example 2: window starts 3 Nov 2025, 105 + 20 = 125 days used, 35 over (python)', () => {
    const r = run({ checkDate: '2026-05-01', trip1Start: '2025-11-01', trip1End: '2026-02-15', trip2Start: '2026-03-01', trip2End: '2026-03-20' });
    expect(getValue(r, 'totalDaysUsed')).toBe('125 days');
    expect(getValue(r, 'daysRemaining')).toBe('35 days over');
    expect(getValue(r, 'checkWindow')).toContain('November 3, 2025');
    expect(getValue(r, 'trip1Detail')).toBe('105 days in window');
    expect(getValue(r, 'trip2Detail')).toBe('20 days in window');
  });

  it('overlapping trips count each calendar day once (regression: 20 + 21 days double-counted to 41; correct is 30)', () => {
    const i = info({ checkDate: '2026-02-01', trip1Start: '2026-01-01', trip1End: '2026-01-20', trip2Start: '2026-01-10', trip2End: '2026-01-30' });
    expect(i.used).toBe(30);
    expect(i.overlapping).toBe(true);
    const r = run({ checkDate: '2026-02-01', trip1Start: '2026-01-01', trip1End: '2026-01-20', trip2Start: '2026-01-10', trip2End: '2026-01-30' });
    expect(r.find((x) => x.id === 'overlapNote')?.warning).toMatch(/overlap/);
  });

  it('reset date after a full 90-day stay (1 Jan - 31 Mar): next allowed day is 30 Jun 2026 (181st day counting 1 Jan as day 1)', () => {
    const i = schengenInfo({ checkDate: '2026-04-01', trip1Start: '2026-01-01', trip1End: '2026-03-31' }, 0)!;
    expect(i.used).toBe(90);
    expect(i.allowedFrom).toBe(dayNum(new Date(2026, 5, 30)));
    const r = run({ checkDate: '2026-04-01', trip1Start: '2026-01-01', trip1End: '2026-03-31' });
    expect(getValue(r, 'resetInfo')).toContain('June 30, 2026');
  });

  it('longest stay from the check date counts days rolling out: 30 days used on 2026-02-01 -> a new stay can run longer than 60 days', () => {
    // trip 2026-01-01..2026-01-30 (30 days). Starting 2026-02-01: 90 - 30 = 60 days stay -> 2026-04-01; no day rolls out before day 181 (2026-06-30), so exactly 60.
    expect(info({ checkDate: '2026-02-01', trip1Start: '2026-01-01', trip1End: '2026-01-30' }).maxStay).toBe(60);
    // a 90-day block 2025-10-01..2025-12-29 checked on 2026-04-01: window starts 2025-10-04, so 87 days are used, but one day rolls out each day so a stay can run to the 90-day cap
    const i = info({ checkDate: '2026-04-01', trip1Start: '2025-10-01', trip1End: '2025-12-29' });
    expect(i.used).toBe(87); // 2025-10-04..2025-12-29
    expect(i.maxStay).toBe(90);
  });

  it('rejects calendar-invalid dates instead of rolling them over (2026-02-31) and a typed invalid check date', () => {
    expect(run({ checkDate: '2026-06-01', trip1Start: '2026-02-31', trip1End: '2026-03-05' })).toEqual([]);
    expect(run({ checkDate: '2026-02-30', trip1Start: '2026-02-01', trip1End: '2026-02-05' })).toEqual([]);
  });

  it('trips longer than 366 days are ignored with a warning; trips whose end precedes the start are ignored', () => {
    const r = run({ checkDate: '2026-06-01', trip1Start: '2024-01-01', trip1End: '2026-05-01', trip2Start: '2026-05-01', trip2End: '2026-05-05' });
    expect(getValue(r, 'totalDaysUsed')).toBe('5 days');
    expect(r.find((x) => x.id === 'ignoredTrips')?.warning).toMatch(/366/);
    expect(run({ checkDate: '2026-06-01', trip1Start: '2026-05-05', trip1End: '2026-05-01' })).toEqual([]);
  });

  it('DST-safe: a trip spanning the March clock change still counts calendar days (2026-03-25..2026-04-05 = 12)', () => {
    expect(info({ checkDate: '2026-04-10', trip1Start: '2026-03-25', trip1End: '2026-04-05' }).used).toBe(12);
  });

  it('cites the European Commission and states 29 countries', () => {
    expect(JSON.stringify(schengen.educational)).toContain('home-affairs.ec.europa.eu');
    expect(JSON.stringify(schengen.educational)).not.toContain('27 countries');
  });
});

import study from '../../../src/calculators/everyday/study-time-calculator/index';
import { studyPlan } from '../../../src/calculators/everyday/study-time-calculator/studyMath';

describe('study-time-calculator audit', () => {
  const base = { totalPages: '200', pagesPerHour: '30', sessionsPerWeek: '5', sessionLength: '60', daysUntilExam: '14', difficulty: 'Medium' };

  it('diagram example: 200 pages @30/h = 6.67 h over 2 weeks = 3.33 h/week vs capacity 5 x 1 h = 5 h; feasible', () => {
    const r = study.calculate(base);
    expect(getValue(r, 'totalHoursNeeded')).toBe('6.67');
    expect(getValue(r, 'hoursPerWeek')).toBe('3.33');
    expect(getValue(r, 'weeklyCapacity')).toBe('5.00');
    expect(getValue(r, 'scheduleFeasible')).toBe('Yes');
    expect(study.educational.diagram!.svg).toContain('3.33 h');
  });

  it('sessions needed vs available (7 sessions of 60 min needed; 10 fit in 2 weeks)', () => {
    expect(getValue(study.calculate(base), 'sessionsNeeded')).toBe('7 / 10');
    // Hard: 10 h -> 10 sessions needed vs 10 available -> still feasible
    expect(getValue(study.calculate({ ...base, difficulty: 'Hard' }), 'sessionsNeeded')).toBe('10 / 10');
    expect(getValue(study.calculate({ ...base, difficulty: 'Hard' }), 'scheduleFeasible')).toBe('Yes');
  });

  it('infeasible when weekly need exceeds capacity', () => {
    expect(getValue(study.calculate({ ...base, totalPages: '1000' }), 'scheduleFeasible')).toMatch(/^No/);
  });

  it('exact tie is feasible (10 h over 2 weeks = 5 h/week = capacity)', () => {
    const p = studyPlan({ ...base, totalPages: '300' })!;
    expect(p.hoursPerWeek).toBeCloseTo(5, 9);
    expect(p.weeklyCapacity).toBe(5);
    expect(p.feasible).toBe(true);
  });

  it('zero / negative divisors return [] instead of Infinity', () => {
    expect(study.calculate({ ...base, daysUntilExam: '0' })).toEqual([]);
    expect(study.calculate({ ...base, sessionsPerWeek: '0' })).toEqual([]);
    expect(study.calculate({ ...base, pagesPerHour: '-5' })).toEqual([]);
  });

  it('educational text no longer carries corrupted characters or unsourced retention percentages', () => {
    const text = JSON.stringify(study.educational);
    expect(text).not.toContain('�');
    expect(text).not.toMatch(/approximately 50%|80-90%|60-70%/);
    expect(text).toContain('Cepeda');
  });
});

import tip from '../../../src/calculators/everyday/tip-splitter/index';
import { allocate, splitBill } from '../../../src/calculators/everyday/tip-splitter/tipMath';

describe('tip-splitter audit (cents allocation, hand-derived)', () => {
  const run = (billAmount: string, tipPercent: string, numPeople: string, taxAmount = '') => tip.calculate({ billAmount, tipPercent, numPeople, taxAmount });

  it('worked examples: 120/20%/4/tax 9.60 -> tip 22.08, total 142.08, 35.52 each', () => {
    const r = run('120', '20', '4', '9.60');
    expect(getValue(r, 'tipAmount')).toBe('$22.08');
    expect(getValue(r, 'totalBill')).toBe('$142.08');
    expect(getValue(r, 'perPersonTotal')).toBe('$35.52');
    expect(getValue(r, 'perPersonTip')).toBe('$5.52');
  });

  it('worked example 2: 48 / 18% / 2 / tax 4 -> 7.92, 55.92, 27.96 each', () => {
    const r = run('48', '18', '2', '4');
    expect(getValue(r, 'tipAmount')).toBe('$7.92');
    expect(getValue(r, 'perPersonTotal')).toBe('$27.96');
  });

  it('worked example 3: 320 / 18% / 8 -> 57.60 tip, 377.60 total, 47.20 each', () => {
    const r = run('320', '18', '8');
    expect(getValue(r, 'tipAmount')).toBe('$57.60');
    expect(getValue(r, 'perPersonTotal')).toBe('$47.20');
    expect(r.find((x) => x.id === 'shareSplit')).toBeUndefined();
  });

  it('shares sum EXACTLY to the grand total when it does not divide: 100 + 18% = 118.00 / 3 = 39.33 r 1 cent', () => {
    const sp = splitBill({ billAmount: '100', tipPercent: '18', numPeople: '3' })!;
    expect(sp.totalCents).toBe(11800);
    expect(sp.shares).toEqual([3934, 3933, 3933]);
    expect(sp.shares.reduce((a, b) => a + b, 0)).toBe(sp.totalCents);
    const r = run('100', '18', '3');
    expect(getValue(r, 'perPersonTotal')).toBe('$39.34');
    expect(getValue(r, 'shareSplit')).toBe('1 × $39.34 + 2 × $39.33');
  });

  it('property: for many bills/party sizes, allocation always sums to the total and differs by at most 1 cent', () => {
    for (let total = 1; total < 700; total += 37) {
      for (let n = 1; n <= 13; n++) {
        const a = allocate(total, n);
        expect(a.reduce((x, y) => x + y, 0)).toBe(total);
        expect(Math.max(...a) - Math.min(...a)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('tax equal to or above the bill is rejected instead of silently tipping 0', () => {
    expect(run('50', '18', '2', '50')).toEqual([]);
    expect(run('50', '18', '2', '60')).toEqual([]);
  });

  it('tip is rounded to the cent (85.50 x 18% = 15.39); 1 person; blank people defaults to 1', () => {
    expect(getValue(run('85.50', '18', '1'), 'tipAmount')).toBe('$15.39');
    expect(getValue(tip.calculate({ billAmount: '85.50', tipPercent: '18' }), 'perPersonTotal')).toBe('$100.89');
  });
});

import wedding from '../../../src/calculators/everyday/wedding-alcohol/index';
import { alcoholPlan } from '../../../src/calculators/everyday/wedding-alcohol/weddingMath';

describe('wedding-alcohol audit (rule-of-thumb rates, arithmetic checked by hand)', () => {
  it('worked example 1: 100 guests, 80% drink, 4 h, 40/30/30 -> 80 drinkers, 192 beers, 20 wine bottles, 5 liquor bottles (72 cocktails)', () => {
    const r = wedding.calculate({ guests: '100', drinkersPct: '80', duration: '4', beerPct: '40', winePct: '30', liquorPct: '30' });
    expect(getValue(r, 'drinkingGuests')).toBe('80');
    expect(getValue(r, 'beerTotal')).toBe('192'); // 80 x .4 x 4 x 1.5
    expect(getValue(r, 'wineGlasses')).toBe('96'); // 80 x .3 x 4 x 1
    expect(getValue(r, 'wineBottles')).toBe('20'); // 96 / 5 = 19.2 -> 20
    expect(getValue(r, 'liquorDrinks')).toBe('72'); // 80 x .3 x 4 x .75
    expect(getValue(r, 'liquorBottles')).toBe('5'); // 72 / 17 = 4.24 -> 5
  });

  it('worked example 2: 50 guests, 90%, 6 h, 60/15/25 -> 243 beers, 9 wine bottles, 51 cocktails, 3 liquor bottles', () => {
    const r = wedding.calculate({ guests: '50', drinkersPct: '90', duration: '6', beerPct: '60', winePct: '15', liquorPct: '25' });
    expect(getValue(r, 'beerTotal')).toBe('243'); // 45 x .6 x 6 x 1.5
    expect(getValue(r, 'wineBottles')).toBe('9'); // 40.5 glasses / 5 = 8.1
    expect(getValue(r, 'liquorDrinks')).toBe('51'); // 50.625 -> 51
    expect(getValue(r, 'liquorBottles')).toBe('3'); // 50.625 / 17 = 2.98
  });

  it('keg arithmetic in the FAQ: half-barrel 15.5 gal x 128 oz / 12 oz = 165 beers; sixth-barrel 5.16 gal = 55', () => {
    expect(Math.floor((15.5 * 128) / 12)).toBe(165);
    expect(Math.floor((7.75 * 128) / 12)).toBe(82);
    expect(Math.floor((5.16 * 128) / 12)).toBe(55);
    expect(25.36 / 1.5).toBeGreaterThan(16.9); // 750 ml = 25.36 fl oz -> ~17 shots
  });

  it('warns when the beer/wine/cocktail split does not total 100%', () => {
    const r = wedding.calculate({ guests: '100', drinkersPct: '80', duration: '4', beerPct: '60', winePct: '30', liquorPct: '30' });
    expect(r[0].warning).toMatch(/add up to 120%/);
    expect(wedding.calculate({ guests: '100', beerPct: '40', winePct: '30', liquorPct: '30' })[0].warning).toBeUndefined();
  });

  it('dry wedding (0% drinkers) and blank guests', () => {
    expect(getValue(wedding.calculate({ guests: '100', drinkersPct: '0' }), 'beerTotal')).toBe('0');
    expect(wedding.calculate({ guests: '' })).toEqual([]);
    expect(alcoholPlan({ guests: '10', duration: '0' })).toBeNull();
  });

  it('declares its rates as rules of thumb and has no unsourced percentage uplifts', () => {
    const text = JSON.stringify(wedding.educational);
    expect(text).toMatch(/rule/i);
    expect(text).not.toMatch(/20-30%|15-25%/);
  });
});

import workingDays from '../../../src/calculators/everyday/working-days/index';
import { federalHolidays, workingDaysInfo } from '../../../src/calculators/everyday/working-days/workingDaysMath';

describe('working-days audit (expected values from an independent python implementation of 5 U.S.C. 6103)', () => {
  const run = (startDate: string, endDate: string, includeStart = 'both', holidays = 'yes') => workingDays.calculate({ startDate, endDate, includeStart, holidays });

  it('2026 has the 11 federal holidays on 1/1, 1/19, 2/16, 5/25, 6/19, 7/3 (Jul 4 is a Saturday -> observed Friday), 9/7, 10/12, 11/11, 11/26, 12/25', () => {
    const iso = (n: number) => new Date(n * 86400000).toISOString().slice(0, 10);
    const got = [...federalHolidays(2026).keys()].filter((n) => iso(n).startsWith('2026')).map(iso).sort();
    expect(got).toEqual(['2026-01-01', '2026-01-19', '2026-02-16', '2026-05-25', '2026-06-19', '2026-07-03', '2026-09-07', '2026-10-12', '2026-11-11', '2026-11-26', '2026-12-25']);
  });

  it('all of 2026: 261 weekdays - 11 holidays = 250 working days, 104 weekend days (regression: only 5 fixed-date holidays were removed)', () => {
    const r = run('2026-01-01', '2026-12-31');
    expect(getValue(r, 'workingDays')).toBe('250');
    expect(getValue(r, 'weekends')).toBe('104');
    expect(getValue(r, 'holidays')).toBe('11');
    expect(getValue(r, 'calendarDays')).toBe('365');
  });

  it('Thanksgiving 2026 (26 Nov) and Christmas are removed: 2-30 Nov, end included = 18 working days, 8 weekend, 2 holidays', () => {
    const r = run('2026-11-02', '2026-11-30', 'end');
    // 2 Nov is excluded by the method, so counting runs 3-30 Nov
    expect(getValue(r, 'workingDays')).toBe('18');
    expect(getValue(r, 'holidays')).toBe('2');
  });

  it('weekend holidays move to the observed weekday: 1 Jan 2028 is a Saturday -> Friday 31 Dec 2027 is the holiday', () => {
    const r = run('2027-12-20', '2028-01-05');
    expect(getValue(r, 'workingDays')).toBe('11');
    expect(getValue(r, 'holidays')).toBe('2'); // 24/25 Dec 2027: Dec 25 is a Saturday -> Fri Dec 24, plus Fri Dec 31
  });

  it('Jul 4 2026 on a Saturday: 29 Jun-6 Jul has 5 working days (Fri 3 Jul observed)', () => {
    const r = run('2026-06-29', '2026-07-06');
    expect(getValue(r, 'workingDays')).toBe('5');
    expect(getValue(r, 'holidays')).toBe('1');
  });

  it('count methods and the calendar-days figure follow the counted range (regression: it always showed end-start+1)', () => {
    expect(getValue(run('2026-03-02', '2026-03-06', 'both'), 'workingDays')).toBe('5');
    expect(getValue(run('2026-03-02', '2026-03-06', 'end'), 'workingDays')).toBe('4');
    const n = run('2026-03-02', '2026-03-06', 'neither');
    expect(getValue(n, 'workingDays')).toBe('3');
    expect(getValue(n, 'calendarDays')).toBe('3');
    expect(getValue(run('2026-03-02', '2026-03-02', 'neither'), 'workingDays')).toBe('0');
  });

  it('holiday exclusion off, and the DST weekend (2026-03-08/09) counts 1 weekend + 1 working day', () => {
    expect(getValue(run('2026-01-01', '2026-12-31', 'both', 'no'), 'workingDays')).toBe('261');
    expect(getValue(run('2026-01-01', '2026-12-31', 'both', 'no'), 'holidays')).toBe('Not counted');
    const w = workingDaysInfo({ startDate: '2026-03-08', endDate: '2026-03-09', includeStart: 'both' })!;
    expect([w.workingDays, w.weekendDays]).toEqual([1, 1]);
  });

  it('invalid and reversed dates return nothing (2026-02-31 used to roll over to March)', () => {
    expect(run('2026-02-31', '2026-03-05')).toEqual([]);
    expect(run('2026-03-10', '2026-03-05')).toEqual([]);
    expect(run('2026-3-1', '2026-03-05')).toEqual([]);
  });
});

import yarn from '../../../src/calculators/everyday/yarn-yardage/index';
import { PRECUT_FABRIC_YARDS, yarnPlan } from '../../../src/calculators/everyday/yarn-yardage/yarnMath';

describe('yarn-yardage audit (model: yarn per row ~ 3.5 x width; hand-derived)', () => {
  it('worked examples: scarf M at 22 rows = 367 yd / 335 m; custom 50x60 super bulky = 1,050 yd; shawl L at 36 rows = 1,350 yd / 1,234 m', () => {
    const a = yarn.calculate({ projectType: 'Scarf', size: 'M', yarnWeight: 'Worsted', stitchesPer4in: '18', rowsPer4in: '22' });
    expect(getValue(a, 'yardageNeeded')).toBe('367 yards');
    expect(getValue(a, 'metersNeeded')).toBe('335 meters');
    const b = yarn.calculate({ projectType: 'Custom', customWidth: '50', customLength: '60', yarnWeight: 'Super Bulky', stitchesPer4in: '10', rowsPer4in: '12' });
    expect(getValue(b, 'yardageNeeded')).toBe('1,050 yards');
    expect(getValue(b, 'baseYardage')).toBe('875 yards');
    expect(b[0].warning).toBeUndefined();
    const c = yarn.calculate({ projectType: 'Shawl', size: 'L', yarnWeight: 'Lace/Fingering', stitchesPer4in: '30', rowsPer4in: '36' });
    expect(getValue(c, 'yardageNeeded')).toBe('1,350 yards');
    expect(getValue(c, 'metersNeeded')).toBe('1,234 meters');
  });

  it('stitch count alone does not change the estimate (yarn per row is constant); row gauge does', () => {
    const y = (st: string, rows: string) => yarnPlan({ projectType: 'Hat', size: 'M', stitchesPer4in: st, rowsPer4in: rows })!.yards;
    expect(y('16', '24')).toBeCloseTo(y('24', '24'), 9);
    expect(y('20', '30')).toBeCloseTo(250 * 1.25, 9);
  });

  it('every preset project/size resolves, including XL for all projects', () => {
    for (const t of ['Scarf', 'Blanket', 'Sweater', 'Hat', 'Socks', 'Shawl', 'Dishcloth']) {
      for (const sz of ['S', 'M', 'L', 'XL']) {
        expect(yarn.calculate({ projectType: t, size: sz, stitchesPer4in: '20', rowsPer4in: '24' }).length).toBeGreaterThan(0);
      }
    }
  });

  it('gauge plausibility warning uses the Craft Yarn Council ranges (worsted 16-20, bulky 12-15)', () => {
    expect(yarn.calculate({ projectType: 'Scarf', size: 'M', yarnWeight: 'Worsted', stitchesPer4in: '30', rowsPer4in: '24' })[0].warning).toMatch(/16-20/);
    expect(yarn.calculate({ projectType: 'Scarf', size: 'M', yarnWeight: 'Bulky', stitchesPer4in: '14', rowsPer4in: '24' })[0].warning).toBeUndefined();
  });

  it('precut fabric equivalents by area on 44-inch fabric: jelly roll 2.65, layer cake 2.65, charm pack 0.66, fat quarter 0.25, fat eighth 0.125 yd', () => {
    expect(PRECUT_FABRIC_YARDS['Jelly Roll']).toBeCloseTo(2.652, 3);
    expect(PRECUT_FABRIC_YARDS['Layer Cake']).toBeCloseTo(2.652, 3);
    expect(PRECUT_FABRIC_YARDS['Charm Pack']).toBeCloseTo(0.663, 3);
    expect(PRECUT_FABRIC_YARDS['Fat Quarter']).toBeCloseTo(0.25, 9);
    expect(PRECUT_FABRIC_YARDS['Fat Eighth']).toBeCloseTo(0.125, 9);
  });

  it('invalid gauge or custom dimensions return nothing', () => {
    expect(yarn.calculate({ projectType: 'Scarf', size: 'M', stitchesPer4in: '0', rowsPer4in: '24' })).toEqual([]);
    expect(yarn.calculate({ projectType: 'Custom', customWidth: '0', customLength: '10', stitchesPer4in: '20', rowsPer4in: '24' })).toEqual([]);
  });
});
