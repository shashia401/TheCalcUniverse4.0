import { describe, it, expect } from 'vitest';
import bmi from '../../../src/calculators/health/bmi';
import bmr from '../../../src/calculators/health/bmr';
import tdee from '../../../src/calculators/health/tdee';
import bodyFat from '../../../src/calculators/health/body-fat';
import armyBodyFat from '../../../src/calculators/health/army-body-fat';
import bsa from '../../../src/calculators/health/bsa';
import leanBodyMass from '../../../src/calculators/health/lean-body-mass';
import idealWeight from '../../../src/calculators/health/ideal-weight';
import oneRepMax from '../../../src/calculators/health/one-rep-max';
import heartRateZones from '../../../src/calculators/health/heart-rate-zones';
import gfr from '../../../src/calculators/health/gfr';
import bac from '../../../src/calculators/health/bac';
import dueDate from '../../../src/calculators/health/due-date';
import periodOvulation from '../../../src/calculators/health/period-ovulation';
import dogCatPregnancy from '../../../src/calculators/health/dog-cat-pregnancy';
import pigGestation from '../../../src/calculators/health/pig-gestation';
import dogCatAge from '../../../src/calculators/health/dog-cat-age';
import caloriesBurned from '../../../src/calculators/health/calories-burned';
import pace from '../../../src/calculators/health/pace';
import bloodType from '../../../src/calculators/health/blood-type';
import pregnancyGain from '../../../src/calculators/health/pregnancy-gain';
import calorieCalculator from '../../../src/calculators/health/calorie-calculator';

// Reference values worked out independently from the published formulas (Python / by hand):
// Mifflin-St Jeor, revised Harris-Benedict, Katch-McArdle, US Navy (inch form), Mosteller/DuBois/Haycock, Boer/James/Hume,
// Devine/Robinson/Miller/Hamwi, Epley/Brzycki/Lombardi, Karvonen, 2021 CKD-EPI, Widmark, Naegele, IOM 2009, MET x kg x h.
type R = { id: string; value: string }[];
const val = (r: R, id: string) => r.find((x) => x.id === id)?.value;

describe('health audit: body measures', () => {
  it('BMI = kg / m^2', () => {
    expect(val(bmi.calculate({ unit: 'metric', sex: 'male', weight: '70', heightCm: '175' }) as R, 'bmiScore')).toBe('22.9');
    expect(val(bmi.calculate({ unit: 'imperial', sex: 'male', weight: '170', heightFt: '5', heightIn: '10' }) as R, 'bmiScore')).toBe('24.4');
  });

  it('BMR: Mifflin 1,780, revised Harris-Benedict 1,854 (m) / 1,384 (f), Katch-McArdle 1,752', () => {
    const base = { unit: 'metric', age: '30', bodyFatPct: '20' };
    const m = bmr.calculate({ ...base, formula: 'mifflin', sex: 'male', weight: '80', heightCm: '180' }) as R;
    expect(val(m, 'primaryBMR')).toContain('1,780');
    expect(val(m, 'harrisLine')).toContain('1,854');
    expect(val(m, 'katchLine')).toContain('1,752');
    const f = bmr.calculate({ ...base, formula: 'harris', sex: 'female', weight: '60', heightCm: '165', bodyFatPct: '25' }) as R;
    expect(val(f, 'primaryBMR')).toContain('1,384');
    expect(val(f, 'katchLine')).toContain('1,342');
  });

  it('TDEE = BMR x 1.55 = 2,759', () => {
    expect(val(tdee.calculate({ unit: 'metric', sex: 'male', age: '30', weight: '80', heightCm: '180', activityLevel: '1.55' }) as R, 'tdee')).toContain('2,759');
    expect(val(calorieCalculator.calculate({ unit: 'metric', gender: 'male', age: '30', weight: '80', heightCm: '180', activityLevel: '1.55', dailyIntake: '2500' }) as R, 'calorieDifference')).toContain('259');
  });

  it('Navy body fat (inch formula): 19.9% man, 29.2% woman; Army tape test 17.5% / 27.3% with the right AR 600-9 limits', () => {
    expect(val(bodyFat.calculate({ unit: 'metric', sex: 'male', age: '30', weight: '80', heightCm: '180', neck: '38', abdomen: '90', waist: '90', hip: '100' }) as R, 'bodyFatPct')).toBe('19.9%');
    expect(val(bodyFat.calculate({ unit: 'metric', sex: 'female', age: '30', weight: '60', heightCm: '165', neck: '32', abdomen: '80', waist: '75', hip: '98' }) as R, 'bodyFatPct')).toBe('29.2%');
    const a = armyBodyFat.calculate({ sex: 'male', age: '25', heightInches: '70', weight: '180', neck: '15', waist: '34', hip: '38' }) as R;
    expect(val(a, 'bodyFatArmy')).toBe('17.5%');
    expect(val(a, 'maxAllowedBf')).toBe('22%');
    const w = armyBodyFat.calculate({ sex: 'female', age: '25', heightInches: '65', weight: '140', neck: '13', waist: '29', hip: '38' }) as R;
    expect(val(w, 'bodyFatArmy')).toBe('27.3%');
    expect(val(w, 'maxAllowedBf')).toBe('32%');
  });

  it('BSA 70 kg / 175 cm: Mosteller 1.84, DuBois 1.85, Haycock 1.85', () => {
    const r = bsa.calculate({ unit: 'metric', weight: '70', heightCm: '175' }) as R;
    expect(val(r, 'bsaMosteller')).toContain('1.84');
    expect(val(r, 'bsaDubois')).toContain('1.85');
    expect(val(r, 'bsaHaycock')).toContain('1.85');
  });

  it('lean body mass: Boer 61.4, James 62.7, Hume 57.8 kg (man); Boer 44.9, James 44.6, Hume 43.4 (woman)', () => {
    const m = leanBodyMass.calculate({ unit: 'metric', sex: 'male', weight: '80', heightCm: '180' }) as R;
    expect([val(m, 'boer'), val(m, 'james'), val(m, 'hume')]).toEqual(['61.4 kg', '62.7 kg', '57.8 kg']);
    const f = leanBodyMass.calculate({ unit: 'metric', sex: 'female', weight: '60', heightCm: '165' }) as R;
    expect([val(f, 'boer'), val(f, 'james'), val(f, 'hume')]).toEqual(['44.9 kg', '44.6 kg', '43.4 kg']);
  });

  it('ideal weight at 5\'10" male: Devine 161, Robinson 157, Miller 155, Hamwi 166 lb', () => {
    const r = idealWeight.calculate({ unit: 'imperial', sex: 'male', heightFt: '5', heightIn: '10', weight: '170' }) as R;
    expect([val(r, 'devine'), val(r, 'robinson'), val(r, 'miller'), val(r, 'hamwi')]).toEqual(['161 lbs', '157 lbs', '155 lbs', '166 lbs']);
  });
});

describe('health audit: training and clinical', () => {
  it('1RM for 100 kg x 5: Epley 117, Brzycki 113, Lombardi 117', () => {
    const r = oneRepMax.calculate({ unit: 'kg', weight: '100', reps: '5', formula: 'epley' }) as R;
    expect([val(r, 'epleyLine'), val(r, 'brzyckiLine'), val(r, 'lombardiLine')]).toEqual(['117 kg', '113 kg', '117 kg']);
  });

  it('Karvonen zones at 40 with resting 60: zone 1 = 120-132 bpm; % max zone 1 = 90-108', () => {
    const k = heartRateZones.calculate({ age: '40', restingHR: '60', method: 'karvonen' }) as R;
    expect(val(k, 'maxHR')).toBe('180 bpm');
    expect(val(k, 'zone1')).toContain('120–132 bpm');
    expect(val(k, 'zone5')).toContain('168–180 bpm');
    const p = heartRateZones.calculate({ age: '40', restingHR: '60', method: 'maxpct' }) as R;
    expect(val(p, 'zone1')).toContain('90–108 bpm');
  });

  it('2021 CKD-EPI: woman 50 with 1.0 mg/dL = 68.6; man 60 with 106 umol/L = 69.3', () => {
    expect(val(gfr.calculate({ sex: 'female', age: '50', creatinine: '1.0', creatinineUnit: 'mgdl' }) as R, 'egfr')).toContain('68.6');
    expect(val(gfr.calculate({ sex: 'male', age: '60', creatinine: '106', creatinineUnit: 'umol' }) as R, 'egfr')).toContain('69.3');
  });

  it('Widmark: 180 lb man, 4 drinks (56 g), 2 h = 0.101 raw, 0.071 now', () => {
    const r = bac.calculate({ sex: 'male', weight: '180', drinks: '4', hours: '2' }) as R;
    expect(val(r, 'rawBac')).toContain('0.101');
    expect(val(r, 'bac')).toContain('0.071');
  });

  it('MET x kg x hours: 9.8 MET x 70 kg x 0.5 h = 343 kcal; walking 154 lb for an hour = 244', () => {
    expect(val(caloriesBurned.calculate({ unit: 'metric', weight: '70', activity: 'run_6mph', duration: '30' }) as R, 'caloriesBurned')).toBe('343 kcal');
    expect(val(caloriesBurned.calculate({ unit: 'imperial', weight: '154', activity: 'walk_mod', duration: '60' }) as R, 'caloriesBurned')).toBe('244 kcal');
  });

  it('pace: 10 km in 50 min = 5:00/km; a 4:00 marathon = 9:09/mi', () => {
    expect(val(pace.calculate({ distanceUnit: 'km', distance: '10', hours: '0', minutes: '50', seconds: '0', calcMode: 'pace' }) as R, 'pace')).toBe('5:00 /km');
    expect(val(pace.calculate({ distanceUnit: 'miles', distance: 'marathon', hours: '4', minutes: '0', seconds: '0', calcMode: 'pace' }) as R, 'pace')).toBe('9:09 /mi');
  });
});

describe('health audit: pregnancy, cycles and pets', () => {
  const D = (method: string, date: string, cycleLength = '28') => dueDate.calculate({ method, date, cycleLength }) as R;

  it('due date: LMP + 280 days (Naegele), +4 for a 32-day cycle, conception + 266, IVF transfer day 5 + 261, day 3 + 263', () => {
    expect(val(D('lmp', '2026-01-10'), 'dueDate')).toBe('Saturday, October 17, 2026');
    expect(val(D('lmp', '2026-01-10', '32'), 'dueDate')).toBe('Wednesday, October 21, 2026');
    expect(val(D('conception', '2026-01-24'), 'dueDate')).toBe('Saturday, October 17, 2026');
    expect(val(D('ivf', '2026-01-24'), 'dueDate')).toBe('Monday, October 12, 2026');
    expect(val(D('ivf3', '2026-01-24'), 'dueDate')).toBe('Wednesday, October 14, 2026');
  });

  it('"N days to go" is not repeated or negative any more', () => {
    const progress = val(D('lmp', '2099-01-10'), 'progress')!; // not started yet
    expect(progress).not.toMatch(/-\d/);
    expect(progress).not.toMatch(/days remain/);
  });

  it('ovulation = next period - luteal phase (14 d for a 28-day cycle, 20th day for 32 days / 12 d luteal)', () => {
    const r = periodOvulation.calculate({ lmpDate: '2026-01-10', cycleLength: '28', periodLength: '5', lutealPhase: '14' }) as R;
    expect(val(r, 'ovulationDate')).toContain('Saturday, October 31, 2026');
    expect(val(r, 'predictedPeriod')).toContain('Saturday, November 14, 2026');
    const l = periodOvulation.calculate({ lmpDate: '2026-01-10', cycleLength: '32', periodLength: '5', lutealPhase: '12' }) as R;
    expect(val(l, 'ovulationDate')).toContain('Tuesday, October 13, 2026');
  });

  it('pet gestation: dog 63 d, cat 65 d, pig 114 d (3-3-3)', () => {
    expect(val(dogCatPregnancy.calculate({ species: 'dog', breedingDate: '2026-03-01' }) as R, 'dueDate')).toBe('May 3, 2026');
    expect(val(dogCatPregnancy.calculate({ species: 'cat', breedingDate: '2026-03-01' }) as R, 'dueDate')).toBe('May 5, 2026');
    expect(val(pigGestation.calculate({ breedingDate: '2026-03-01', breedType: 'commercial', parity: 'gilt' }) as R, 'dueDate')).toBe('June 23, 2026');
  });

  it('pet ages: AVMA 15 / 9 / +5 (dog) or +4 (cat); epigenetic 16 ln(3) + 31 = 48.6', () => {
    const d = dogCatAge.calculate({ species: 'dog', dogSize: 'medium', petAgeYears: '3' }) as R;
    expect(val(d, 'traditionalAge')).toBe('29 human years');
    expect(val(d, 'epigeneticAge')).toBe('48.6 human years');
    expect(val(dogCatAge.calculate({ species: 'cat', dogSize: 'small', petAgeYears: '3' }) as R, 'catHumanAge')).toBe('28 human years');
  });

  it('blood type genetics: A+ x B- gives AB 56.3%, O 6.3%, Rh+ 75%; AB x O gives only A or B', () => {
    const r = bloodType.calculate({ parent1Blood: 'A', parent1Rh: '+', parent2Blood: 'B', parent2Rh: '-' }) as R;
    expect([val(r, 'aboAB'), val(r, 'aboO'), val(r, 'rhPositive')]).toEqual(['56.3%', '6.3%', '75.0%']);
    const s = bloodType.calculate({ parent1Blood: 'AB', parent1Rh: '+', parent2Blood: 'O', parent2Rh: '+' }) as R;
    expect([val(s, 'aboA'), val(s, 'aboB'), val(s, 'aboO')]).toEqual(['50.0%', '50.0%', undefined]);
  });

  it('IOM 2009 pregnancy weight gain, normal BMI: 11.3-15.9 kg in total', () => {
    const r = pregnancyGain.calculate({ unit: 'metric', prepregnancyWeight: '60', currentWeight: '66', heightCm: '165', currentWeek: '20' }) as R;
    expect(val(r, 'totalRange')).toContain('11.3');
    expect(val(r, 'totalRange')).toContain('15.9');
    expect(val(r, 'bmiCategory')).toContain('Normal');
  });
});
