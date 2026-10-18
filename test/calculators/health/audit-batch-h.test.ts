import { describe, it, expect, vi, afterEach } from 'vitest';
import pregnancy from '../../../src/calculators/health/pregnancy-calculator';
import waterIntake from '../../../src/calculators/health/water-intake';
import macro from '../../../src/calculators/health/macro';
import pregnancyConception from '../../../src/calculators/health/pregnancy-conception';
import carbohydrate from '../../../src/calculators/health/carbohydrate';
import healthyWeight from '../../../src/calculators/health/healthy-weight';
import protein from '../../../src/calculators/health/protein';
import fatIntake from '../../../src/calculators/health/fat-intake';
import bodyType from '../../../src/calculators/health/body-type';
import macroPoint from '../../../src/calculators/health/macro-point';
import overweight from '../../../src/calculators/health/overweight';
import chocolateToxicity from '../../../src/calculators/health/chocolate-toxicity';
import probability from '../../../src/calculators/math/probability';
import trigonometry from '../../../src/calculators/math/trigonometry-calculator';

// Audit batch H. Every expected value below was computed independently in Python (python -I scratch scripts)
// from the published definitions, never copied from the calculators' own output:
// Naegele's rule / LMP+280 d / ovulation = cycle-14 d / IVF transfer+261 (d5) or +263 (d3) date arithmetic,
// Mifflin-St Jeor + Katch-McArdle at 4/4/9 kcal per g, NASEM water AI (3.7 / 2.7 L), BMI 18.5-24.9 height^2,
// Devine, Ashwell WHtR, SmartPoints-style coefficients, Merck Veterinary Manual methylxanthine table and dose bands,
// exact trig values and Kolmogorov probability rules.
type R = { id: string; value: string }[];
const val = (r: unknown, id: string) => (r as R).find((x) => x.id === id)?.value;
const mockToday = (iso: string) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${iso}T12:00:00`));
};
afterEach(() => vi.useRealTimers());

describe('audit H: pregnancy-calculator (Naegele)', () => {
  it('LMP 2026-03-01, 28-day cycle: due Sunday December 6, 2026 (LMP+280 d); conception LMP+14; end of T1 LMP+91', () => {
    const r = pregnancy.calculate({ lmpDate: '2026-03-01', cycleLength: '28' });
    expect(val(r, 'dueDate')).toBe('Sunday, December 6, 2026');
    expect(val(r, 'conceptionDate')).toBe('March 15, 2026');
    expect(val(r, 'endFirstTrimester')).toBe('May 31, 2026');
  });
  it('35-day cycle shifts everything by +7 d: due Oct 29, 2026; conception Feb 5; 24 w Jul 9; 37 w Oct 8', () => {
    const r = pregnancy.calculate({ lmpDate: '2026-01-15', cycleLength: '35' });
    expect(val(r, 'dueDate')).toBe('Thursday, October 29, 2026');
    expect(val(r, 'conceptionDate')).toBe('February 5, 2026');
    expect(val(r, 'endFirstTrimester')).toBe('April 23, 2026');
    expect(val(r, 'viabilityDate')).toContain('July 9, 2026');
    expect(val(r, 'fullTermDate')).toContain('October 8, 2026');
  });
  it('LMP 2026-06-01 due Monday March 8, 2027', () => {
    expect(val(pregnancy.calculate({ lmpDate: '2026-06-01' }), 'dueDate')).toBe('Monday, March 8, 2027');
  });
  it('gestational age and trimester by completed weeks (ACOG): day 84 = 12w0d T1; day 98 = 14w0d T2; day 196 = 28w0d T3', () => {
    mockToday('2026-05-24'); // 2026-03-01 + 84 d
    let r = pregnancy.calculate({ lmpDate: '2026-03-01' });
    expect(val(r, 'gestationalAge')).toBe('12 weeks pregnant');
    expect(val(r, 'currentTrimester')).toBe('1st Trimester (Weeks 1-13)');
    mockToday('2026-06-07'); // +98
    r = pregnancy.calculate({ lmpDate: '2026-03-01' });
    expect(val(r, 'gestationalAge')).toBe('14 weeks pregnant');
    expect(val(r, 'currentTrimester')).toBe('2nd Trimester (Weeks 14-27)');
    mockToday('2026-09-13'); // +196
    r = pregnancy.calculate({ lmpDate: '2026-03-01' });
    expect(val(r, 'gestationalAge')).toBe('28 weeks pregnant');
    expect(val(r, 'currentTrimester')).toBe('3rd Trimester (Weeks 28-40)');
    expect(val(r, 'progressSummary')).toBe('84 days to go');
  });
  it('rejects blank, calendar-invalid and implausibly old LMPs', () => {
    expect(pregnancy.calculate({ lmpDate: '' })).toEqual([]);
    expect(pregnancy.calculate({ lmpDate: '2026-02-31' })).toEqual([]);
    mockToday('2027-06-01');
    expect(pregnancy.calculate({ lmpDate: '2026-03-01' })).toEqual([]);
  });
});

describe('audit H: water-intake (0.5 oz/lb rule of thumb + add-ons)', () => {
  it('170 lb sedentary temperate: 85 oz = 2.5 L (85 x 0.0295735 = 2.5137), 11 cups, 2514 mL', () => {
    const r = waterIntake.calculate({ weight: '170', unit: 'lbs', activityLevel: 'sedentary', climate: 'normal' });
    expect(val(r, 'liters')).toBe('2.5 liters (85.0 oz)');
    expect(val(r, 'cups')).toBe('11 cups/day');
    expect(val(r, 'ml')).toBe('2514 mL/day');
    expect(val(r, 'baseIntake')).toBe('2.5 liters');
  });
  it('70 kg moderate + hot: 70/0.45359237 x 0.5 + 16 + 16 = 109.16 oz = 3.23 L, 14 cups, 3228 mL', () => {
    const r = waterIntake.calculate({ weight: '70', unit: 'kg', activityLevel: 'moderate', climate: 'hot' });
    expect(val(r, 'liters')).toBe('3.2 liters (109.2 oz)');
    expect(val(r, 'cups')).toBe('14 cups/day');
    expect(val(r, 'ml')).toBe('3228 mL/day');
    expect(val(r, 'baseIntake')).toBe('2.3 liters');
  });
  it('80 kg athlete + desert: 144.18 oz = 4.26 L; blank / non-positive weight gives no result', () => {
    const r = waterIntake.calculate({ weight: '80', unit: 'kg', activityLevel: 'athlete', climate: 'extreme' });
    expect(val(r, 'ml')).toBe('4264 mL/day');
    expect(waterIntake.calculate({ weight: '', unit: 'kg' })).toEqual([]);
    expect(waterIntake.calculate({ weight: '-5', unit: 'kg' })).toEqual([]);
  });
});

describe('audit H: macro (Mifflin-St Jeor / Katch-McArdle, 4/4/9 kcal per g)', () => {
  it('David 28 y male 180 lb 5\'10" x1.55 mild loss high-protein: BMR 1,793, TDEE 2,779, 2,529 kcal, P/C 221 g, F 84 g', () => {
    const r = macro.calculate({ unit: 'imperial', sex: 'male', age: '28', weight: '180', heightFt: '5', heightIn: '10', activityLevel: '1.55', goal: 'mildLoss', diet: 'highProtein', bodyFatPct: '' });
    expect(val(r, 'dailyCalories')).toBe('2,529 kcal/day');
    expect(val(r, 'bmrValue')).toBe('Mifflin-St Jeor: 1,793 kcal');
    expect(val(r, 'tdeeForMacros')).toBe('2,779 kcal');
    expect(val(r, 'proteinGrams')).toBe('221 g · 884 kcal');
    expect(val(r, 'carbGrams')).toBe('221 g · 884 kcal');
    expect(val(r, 'fatGrams')).toBe('84 g · 756 kcal');
    expect(val(r, 'proteinRange')).toBe('131–180 g'); // 81.65 kg x 1.6 / x 2.2
    expect(val(r, 'fatRange')).toBe('56–98 g · 504–882 kcal'); // 20-35 % of 2,529 kcal / 9
    expect(val(r, 'carbRange')).toBe('284-411 g'); // 45-65 % of 2,528.7 kcal / 4 = 284.5-410.9
    expect(val(r, 'calorieAdjustment')).toBe('-250 kcal');
  });
  it('Lina 35 y female 165 cm 70 kg sedentary maintain Mediterranean: BMR 1,395, TDEE 1,674, P 84 g, C 188 g, F 65 g', () => {
    const r = macro.calculate({ unit: 'metric', sex: 'female', age: '35', weight: '70', heightCm: '165', activityLevel: '1.2', goal: 'maintain', diet: 'mediterranean' });
    expect(val(r, 'bmrValue')).toBe('Mifflin-St Jeor: 1,395 kcal');
    expect(val(r, 'dailyCalories')).toBe('1,674 kcal/day');
    expect(val(r, 'proteinGrams')).toBe('84 g · 336 kcal');
    expect(val(r, 'carbGrams')).toBe('188 g · 752 kcal');
    expect(val(r, 'fatGrams')).toBe('65 g · 585 kcal');
    expect(val(r, 'calorieAdjustment')).toBe('+0 kcal');
  });
  it('male 80 kg 180 cm 30 y x1.55 standard: BMR 1,780, TDEE 2,759 -> P 138 g, C 345 g, F 92 g; Katch-McArdle at 20 % BF = 370+21.6x64 = 1,752', () => {
    const base = { unit: 'metric', sex: 'male', age: '30', weight: '80', heightCm: '180', activityLevel: '1.55', goal: 'maintain', diet: 'standard' };
    const r = macro.calculate(base);
    expect(val(r, 'tdeeForMacros')).toBe('2,759 kcal');
    expect(val(r, 'proteinGrams')).toBe('138 g · 552 kcal');
    expect(val(r, 'carbGrams')).toBe('345 g · 1380 kcal');
    expect(val(r, 'fatGrams')).toBe('92 g · 828 kcal');
    const k = macro.calculate({ ...base, bodyFatPct: '20' });
    expect(val(k, 'bmrValue')).toBe('Katch-McArdle: 1,752 kcal');
    expect(val(k, 'tdeeForMacros')).toBe('2,716 kcal');
  });
  it('deficit never goes below the safety floor: 50 kg 155 cm 40 y female x1.2 (TDEE 1,329) -1 lb/wk is held at 1,200 kcal', () => {
    const r = macro.calculate({ unit: 'metric', sex: 'female', age: '40', weight: '50', heightCm: '155', activityLevel: '1.2', goal: 'moderateLoss', diet: 'standard' });
    expect(val(r, 'dailyCalories')).toBe('1,200 kcal/day');
    expect(String(val(r, 'calorieAdjustment'))).toContain('-129 kcal');
    expect(String(val(r, 'calorieAdjustment'))).toContain('safety minimum');
  });
  it('blank weight gives no result', () => {
    expect(macro.calculate({ unit: 'metric', sex: 'male', age: '30', weight: '', heightCm: '180', activityLevel: '1.55', goal: 'maintain', diet: 'standard' })).toEqual([]);
  });
});

describe('audit H: pregnancy-conception (LMP / IVF / due-date arithmetic)', () => {
  it('LMP 2026-01-01, 28-day cycle: ovulation Jan 15, fertile Jan 10-15, peak Jan 13-15, implantation Jan 21-27, due Oct 8', () => {
    mockToday('2025-12-01');
    const r = pregnancyConception.calculate({ method: 'lmp', lmpDate: '2026-01-01', cycleLength: '28' });
    expect(val(r, 'ovulationDate')).toBe('Thursday, January 15, 2026');
    expect(val(r, 'fertileWindow')).toBe('Saturday, January 10, 2026 → Thursday, January 15, 2026');
    expect(val(r, 'peakFertility')).toBe('Tuesday, January 13, 2026 → Thursday, January 15, 2026');
    expect(val(r, 'implantationWindow')).toBe('Wednesday, January 21, 2026 → Tuesday, January 27, 2026');
    expect(val(r, 'estDueDate')).toBe('Thursday, October 8, 2026');
  });
  it('35-day cycle: ovulation = LMP + 21 d = Jan 22; due = ovulation + 266 d = Oct 15', () => {
    mockToday('2025-12-01');
    const r = pregnancyConception.calculate({ method: 'lmp', lmpDate: '2026-01-01', cycleLength: '35' });
    expect(val(r, 'ovulationDate')).toBe('Thursday, January 22, 2026');
    expect(val(r, 'estDueDate')).toBe('Thursday, October 15, 2026');
  });
  it('next period 2026-02-01 -> ovulation 14 d earlier = Jan 18', () => {
    mockToday('2025-12-01');
    expect(val(pregnancyConception.calculate({ method: 'nextPeriod', nextPeriodDate: '2026-02-01' }), 'ovulationDate')).toBe('Sunday, January 18, 2026');
  });
  it('IVF day-5 transfer 2026-03-15: due Dec 1, 2026 (+261 d), retrieval Mar 10, test Mar 24; day-3: due Dec 3 (+263 d), retrieval Mar 12', () => {
    mockToday('2026-03-15');
    const r5 = pregnancyConception.calculate({ method: 'ivf', ivfDate: '2026-03-15', embryoType: 'day5' });
    expect(val(r5, 'ivfDueDate')).toBe('Tuesday, December 1, 2026');
    expect(val(r5, 'ivfRetrieval')).toBe('Tuesday, March 10, 2026');
    expect(val(r5, 'ivfPregnancyTest')).toBe('Tuesday, March 24, 2026');
    expect(val(r5, 'ivfWeeksProgress')).toBe('2 weeks 5 days (gestational age)'); // 14 + 5 d on transfer day
    const r3 = pregnancyConception.calculate({ method: 'ivf', ivfDate: '2026-03-15', embryoType: 'day3' });
    expect(val(r3, 'ivfDueDate')).toBe('Thursday, December 3, 2026');
    expect(val(r3, 'ivfRetrieval')).toBe('Thursday, March 12, 2026');
    expect(val(r3, 'ivfWeeksProgress')).toBe('2 weeks 3 days (gestational age)');
  });
  it('target due date 2026-09-01: conception = due - 266 d = Dec 9, 2025; LMP Nov 25; window opens Dec 4', () => {
    mockToday('2025-06-01');
    const r = pregnancyConception.calculate({ method: 'dueDate', targetDueDate: '2026-09-01' });
    expect(val(r, 'conceptionDate')).toBe('Tuesday, December 9, 2025');
    expect(val(r, 'lmpEstimated')).toBe('Tuesday, November 25, 2025');
    expect(val(r, 'fertileWindow')).toBe('Thursday, December 4, 2025 → Tuesday, December 9, 2025');
  });
  it('invalid inputs give no result', () => {
    expect(pregnancyConception.calculate({ method: 'lmp', lmpDate: '2026-02-30' })).toEqual([]);
    expect(pregnancyConception.calculate({ method: 'ivf', ivfDate: '' })).toEqual([]);
    expect(pregnancyConception.calculate({ method: 'lmp', lmpDate: '2026-01-01', cycleLength: '60' })).toEqual([]);
  });
});

describe('audit H: carbohydrate (g/kg x kg, 4 kcal/g)', () => {
  it('70 kg endurance 7-12 g/kg: 490-840 g (1,960-3,360 kcal), average 665 g', () => {
    const r = carbohydrate.calculate({ unit: 'metric', weight: '70', goal: 'endurance' });
    expect(val(r, 'dailyCarbRange')).toBe('490–840 g/day (1,960–3,360 kcal)');
    expect(val(r, 'dailyAvg')).toBe('665 g/day · 2,660 kcal');
  });
  it('70 kg moderate 5-7 g/kg: 350-490 g, avg 420 g = 9 cups rice / 28 slices bread / 16 bananas / 10 cups pasta', () => {
    const r = carbohydrate.calculate({ unit: 'metric', weight: '70', goal: 'moderate' });
    expect(val(r, 'dailyCarbRange')).toBe('350–490 g/day (1,400–1,960 kcal)');
    expect(val(r, 'dailyAvg')).toBe('420 g/day · 1,680 kcal');
    expect(val(r, 'foodEquivalents')).toBe('9 cups rice · 28 slices bread · 16 bananas · 10 cups pasta');
  });
  it('imperial 180.8 lb (82.0 kg) fat loss 2-4 g/kg: 164-328 g; ketosis 70 kg 0.5-1 g/kg: 35-70 g', () => {
    expect(val(carbohydrate.calculate({ unit: 'imperial', weight: '180.78', goal: 'fatLoss' }), 'dailyCarbRange')).toBe('164–328 g/day (656–1,312 kcal)');
    expect(val(carbohydrate.calculate({ unit: 'metric', weight: '70', goal: 'ketosis' }), 'dailyCarbRange')).toBe('35–70 g/day (140–280 kcal)');
  });
  it('body fat given: g/kg applies to lean mass (80 kg, 20 % -> 64 kg x 4-6 = 256-384 g); loading 8 g/kg x 80 = 640 g starting 3 days before the event', () => {
    const r = carbohydrate.calculate({ unit: 'metric', weight: '80', goal: 'muscle', bodyFatPct: '20', eventDate: '2026-06-20' });
    expect(val(r, 'dailyCarbRange')).toBe('256–384 g/day (1,024–1,536 kcal)');
    expect(String(val(r, 'glycogenLoading'))).toContain('Wednesday, June 17');
    expect(String(val(r, 'glycogenLoading'))).toContain('640 g/day (2,560 kcal)');
  });
  it('blank weight gives no result', () => {
    expect(carbohydrate.calculate({ unit: 'metric', weight: '', goal: 'moderate' })).toEqual([]);
  });
});

describe('audit H: healthy-weight (BMI 18.5-24.9, Devine, Ashwell WHtR)', () => {
  const base = { unit: 'metric', sex: 'male', age: '30', weight: '70', waist: '85', heightCm: '175', frameSize: 'medium' };
  it('175 cm: BMI 18.5-24.9 -> 56.66-76.26 kg; medium target 66.46 kg; Devine male 70.46 kg, female 65.96 kg', () => {
    const r = healthyWeight.calculate(base);
    expect(val(r, 'healthyWeightRange')).toBe('56.7 kg – 76.3 kg');
    expect(val(r, 'adjustedTarget')).toBe('66.5 kg');
    expect(val(r, 'devineIdeal')).toBe('70.5 kg');
    expect(val(r, 'bmi')).toBe('22.9'); // 70 / 1.75^2 = 22.857
    expect(val(r, 'whtr')).toBe('0.49 — Healthy — low health risk'); // 85/175 = 0.4857
    expect(val(healthyWeight.calculate({ ...base, sex: 'female' }), 'devineIdeal')).toBe('66.0 kg');
  });
  it('frame shifts the target within the range by 45 / 55 % (65.48 / 67.44 kg)', () => {
    expect(val(healthyWeight.calculate({ ...base, frameSize: 'small' }), 'adjustedTarget')).toBe('65.5 kg');
    expect(val(healthyWeight.calculate({ ...base, frameSize: 'large' }), 'adjustedTarget')).toBe('67.4 kg');
  });
  it('imperial display in lbs: 124.9-168.1 lb for 175 cm', () => {
    const r = healthyWeight.calculate({ unit: 'imperial', sex: 'male', age: '30', weight: '154', waist: '33.5', heightFt: '5', heightIn: '9' });
    // 5'9" = 175.26 cm -> 18.5-24.9 x 1.7526^2 = 56.83-76.48 kg = 125-169 lb
    expect(val(r, 'healthyWeightRange')).toBe('125 lbs – 169 lbs');
  });
  it('WHtR bands (Ashwell): 0.50 increased, 0.60 high; BMI 25.0 is Overweight', () => {
    expect(String(val(healthyWeight.calculate({ ...base, waist: '87.5' }), 'whtr'))).toContain('Increased health risk');
    expect(String(val(healthyWeight.calculate({ ...base, waist: '105' }), 'whtr'))).toContain('High health risk');
    expect(String(healthyWeight.calculate({ ...base, weight: '76.6' }).find((x) => x.id === 'bmi')?.label)).toContain('Overweight');
  });
  it('blank height gives no result', () => {
    expect(healthyWeight.calculate({ ...base, heightCm: '' })).toEqual([]);
  });
});

describe('audit H: protein (RDA 0.8 g/kg floor; 1.6-2.2 g/kg active; 0.4 g/kg per meal)', () => {
  it('70 kg cut, 3-4 d/wk: 112-154 g; target position 0.3+0.3x0.4 = 0.42 of range -> 1.852 g/kg = 130 g; meals 43/33/26 g (130/4 = 32.5 rounds up)', () => {
    const r = protein.calculate({ unit: 'metric', weight: '70', goal: 'cut', trainingFrequency: 'moderate' });
    expect(val(r, 'dailyProteinRange')).toBe('112–154 g/day · 520 kcal');
    expect(val(r, 'dailyTarget')).toBe('130 g/day · 520 kcal · 1.85 g/kg');
    expect(val(r, 'perMeal')).toBe('26 g × 5 meals · 33 g × 4 meals · 43 g × 3 meals');
    expect(val(r, 'mpsOptimal')).toBe('5 meals/day at ~28 g per meal (max 0.4 g/kg/meal)');
    expect(val(r, 'weightPct')).toContain('26%'); // 520 / 2000
  });
  it('70 kg maintain, no training: 56-84 g (0.8 g/kg is the RDA floor); target 0.92 g/kg = 64 g', () => {
    const r = protein.calculate({ unit: 'metric', weight: '70', goal: 'maintain', trainingFrequency: 'none' });
    expect(val(r, 'dailyProteinRange')).toBe('56–84 g/day · 256 kcal');
    expect(val(r, 'dailyTarget')).toBe('64 g/day · 256 kcal · 0.92 g/kg');
  });
  it('180 lb (81.65 kg) bulk, 5-6 d/wk: 131-180 g; target 1.90 g/kg = 155 g', () => {
    const r = protein.calculate({ unit: 'imperial', weight: '180', goal: 'bulk', trainingFrequency: 'heavy' });
    expect(val(r, 'dailyProteinRange')).toBe('131–180 g/day · 620 kcal');
    expect(val(r, 'dailyTarget')).toBe('155 g/day · 620 kcal · 1.90 g/kg');
  });
  it('blank or absurd weight gives no result; wording no longer says the body "uses only" a per-meal amount', () => {
    expect(protein.calculate({ unit: 'metric', weight: '', goal: 'cut' })).toEqual([]);
    expect(protein.calculate({ unit: 'metric', weight: '1', goal: 'cut' })).toEqual([]);
    const r = protein.calculate({ unit: 'metric', weight: '70', goal: 'cut' });
    const text = (r.find((x) => x.id === 'dailyProteinRange') as { interpretation?: string }).interpretation ?? '';
    expect(text).not.toContain('uses only');
    expect(text).toContain('still counts toward your daily total');
  });
});

describe('audit H: fat-intake (IOM AMDR 20-35 %, AHA saturated <= 6 %, 9 kcal/g)', () => {
  it('2,200 kcal maintenance 25-35 %: 61-86 g, target 73 g; sat <= 15 g; mono 24-37 g; poly 12-24 g; n-3 1-3 g', () => {
    const r = fatIntake.calculate({ unit: 'metric', weight: '70', goal: 'maintain', calories: '2200' });
    expect(val(r, 'totalFatRange')).toBe('61 – 86 g/day (25–35% of calories)');
    expect(val(r, 'totalFatTarget')).toBe('73 g/day');
    expect(val(r, 'saturatedFat')).toBe('≤ 15 g/day');
    expect(val(r, 'monounsaturatedFat')).toBe('24 – 37 g/day');
    expect(val(r, 'polyunsaturatedFat')).toBe('12 – 24 g/day');
    expect(val(r, 'omega3')).toBe('1 – 3 g/day');
    expect(val(r, 'fatCalories')).toBe('657 kcal/day (30% of 2,200 kcal)');
  });
  it('weight loss 20-25 %: 49-61 g (target 55 g = 22.5 %); keto 65-80 %: 159-196 g; heart 25-30 %: 61-73 g (27.5 %)', () => {
    const loss = fatIntake.calculate({ unit: 'metric', weight: '70', goal: 'loss', calories: '2200' });
    expect(val(loss, 'totalFatRange')).toBe('49 – 61 g/day (20–25% of calories)');
    expect(val(loss, 'totalFatTarget')).toBe('55 g/day');
    expect(val(loss, 'fatCalories')).toBe('495 kcal/day (22.5% of 2,200 kcal)'); // was shown as "23%"
    expect(val(fatIntake.calculate({ unit: 'metric', weight: '70', goal: 'keto', calories: '2200' }), 'totalFatRange')).toBe('159 – 196 g/day (65–80% of calories)');
    const heart = fatIntake.calculate({ unit: 'metric', weight: '70', goal: 'heart', calories: '2200' });
    expect(val(heart, 'totalFatRange')).toBe('61 – 73 g/day (25–30% of calories)');
    expect(val(heart, 'fatCalories')).toBe('603 kcal/day (27.5% of 2,200 kcal)'); // was shown as "28%"
  });
  it('blank calories gives no result', () => {
    expect(fatIntake.calculate({ unit: 'metric', weight: '70', goal: 'maintain', calories: '' })).toEqual([]);
  });
  // New: body weight was required but never used. It now gives fat per kg, computed from the displayed grams.
  it('fat per kg: 70 kg, 2,200 kcal maintenance 61/86/73 g -> 0.87 - 1.23 g/kg, target 1.04 g/kg (grams / kg)', () => {
    const r = fatIntake.calculate({ unit: 'metric', weight: '70', goal: 'maintain', calories: '2200' });
    expect(val(r, 'fatPerKg')).toBe('0.87 – 1.23 g/kg/day (target 1.04 g/kg at 70 kg)');
  });
  it('fat per kg converts pounds exactly: 154 lb = 69.85 kg (1 lb = 0.45359237 kg); 154 lb with 2,200 kcal keto 159/196/177 g -> 2.28 - 2.81, target 2.53', () => {
    const r = fatIntake.calculate({ unit: 'imperial', weight: '154', goal: 'keto', calories: '2200' });
    expect(val(r, 'fatPerKg')).toBe('2.28 – 2.81 g/kg/day (target 2.53 g/kg at 69.9 kg)');
  });
  it('weight changes only the per-kg row, never the gram totals', () => {
    const a = fatIntake.calculate({ unit: 'metric', weight: '50', goal: 'maintain', calories: '2200' });
    const b = fatIntake.calculate({ unit: 'metric', weight: '120', goal: 'maintain', calories: '2200' });
    expect(a.filter((x) => x.id !== 'fatPerKg')).toEqual(b.filter((x) => x.id !== 'fatPerKg'));
    expect(val(a, 'fatPerKg')).not.toBe(val(b, 'fatPerKg'));
  });
  it('help text no longer presents the goal percentages as published guidelines and says what weight is for', () => {
    const help = (id: string) => (fatIntake.inputs.find((i) => i.id === id)?.helpText ?? '');
    expect(help('weight')).toContain('Used only to show your fat target per kilogram');
    expect(help('goal')).toContain('conventional planning ranges');
  });
});

describe('audit H: body-type (ratio shapes; WHO 2008 WHR 0.85 F / 0.90 M)', () => {
  it('36-27-39 in: hourglass, WHR 27/39 = 0.69, waist/bust 0.75, low risk', () => {
    const r = bodyType.calculate({ unit: 'imperial', bust: '36', waist: '27', hip: '39' });
    expect(val(r, 'bodyShape')).toBe('Hourglass');
    expect(val(r, 'waistHipRatio')).toBe('0.69');
    expect(val(r, 'waistBustRatio')).toBe('0.75');
    expect(String(val(r, 'whrHealthRisk'))).toContain('Standard risk range');
  });
  it('38-38-39 in: apple, WHR 38/39 = 0.97, waist/bust 1.00, elevated for both sexes', () => {
    const r = bodyType.calculate({ unit: 'imperial', bust: '38', waist: '38', hip: '39' });
    expect(val(r, 'bodyShape')).toBe('Apple (Round)');
    expect(val(r, 'waistHipRatio')).toBe('0.97');
    expect(val(r, 'waistBustRatio')).toBe('1.00');
    expect(String(val(r, 'whrHealthRisk'))).toContain('Elevated health risk — WHR ≥ 0.90');
  });
  it('82-72-100 cm: pear (hip/waist 1.39, bust/waist 1.14), WHR 0.72, waist/bust 0.88', () => {
    const r = bodyType.calculate({ unit: 'metric', bust: '82', waist: '72', hip: '100' });
    expect(val(r, 'bodyShape')).toBe('Pear (Triangle)');
    expect(val(r, 'waistHipRatio')).toBe('0.72');
    expect(val(r, 'waistBustRatio')).toBe('0.88');
  });
  it('WHO thresholds: WHR 0.85 is elevated only if female; 0.90 elevated for both; 38 in waist with 39 in hip after a 3 in loss gives 0.897 (< 0.90)', () => {
    expect(String(val(bodyType.calculate({ unit: 'metric', bust: '90', waist: '85', hip: '100' }), 'whrHealthRisk'))).toContain('if female');
    expect(val(bodyType.calculate({ unit: 'imperial', bust: '38', waist: '35', hip: '39' }), 'waistHipRatio')).toBe('0.90'); // 0.8974 displays as 0.90 but is below the cut-off
    expect(String(val(bodyType.calculate({ unit: 'imperial', bust: '38', waist: '35', hip: '39' }), 'whrHealthRisk'))).toContain('if female');
  });
  // Changed: the waist input said "narrowest part of your natural waistline"; the WHO WHR thresholds assume the WHO 2008 site.
  it('waist input follows the WHO 2008 protocol: midpoint between last palpable rib and iliac crest, not the narrowest point', () => {
    const waist = bodyType.inputs.find((i) => i.id === 'waist')!;
    expect(waist.label).toContain('midway between lowest rib and hip bone');
    expect(waist.helpText).toContain('midpoint between the lower margin of the last palpable rib and the top of the hip bone (iliac crest)');
    expect(waist.helpText).not.toContain('narrowest part of your natural waistline');
    expect(bodyType.inputs.find((i) => i.id === 'hip')!.helpText).toContain('widest part of the buttocks');
  });
  it('inverted triangle needs bust > hip by 5 in (12.7 cm); blank gives nothing', () => {
    expect(val(bodyType.calculate({ unit: 'imperial', bust: '42', waist: '30', hip: '33' }), 'bodyShape')).toBe('Inverted Triangle');
    expect(bodyType.calculate({ unit: 'imperial', bust: '', waist: '30', hip: '35' })).toEqual([]);
  });
});

describe('audit H: macro-point (SmartPoints-style: cal x0.0305 + satfat x0.275 + sugar x0.12 - protein x0.098)', () => {
  const mp = (calories: string, satFat: string, sugar: string, protein: string) => macroPoint.calculate({ calories, satFat, sugar, protein });
  it('worked examples by hand: salad 9.084 -> 9.1, sandwich 16.236 -> 16.2, turkey 3.579 -> 3.6, beef 7.462 -> 7.5', () => {
    expect(val(mp('350', '3', '6', '32'), 'macroPoints')).toBe('9.1 points');
    expect(val(mp('530', '5', '12', '28'), 'macroPoints')).toBe('16.2 points');
    expect(val(mp('170', '2', '0', '22'), 'macroPoints')).toBe('3.6 points');
    expect(val(mp('240', '8', '0', '21'), 'macroPoints')).toBe('7.5 points');
  });
  it('apple 5.1285 -> 5.1 (2.9 cal + 2.3 sugar - 0.05 protein); crackers 6.773 -> 6.8; default 350/5/12/25 = 11.04 -> 11.0 High', () => {
    const a = mp('95', '0', '19', '0.5');
    expect(val(a, 'macroPoints')).toBe('5.1 points');
    expect(val(a, 'caloriePoints')).toContain('2.9 pts');
    expect(val(a, 'sugarPoints')).toContain('2.3 pts');
    expect(val(mp('200', '3', '2', '4'), 'macroPoints')).toBe('6.8 points');
    const d = mp('350', '5', '12', '25');
    expect(val(d, 'macroPoints')).toBe('11.0 points');
    expect(val(d, 'pointsCategory')).toBe('High Points');
  });
  it('score is floored at zero (0 kcal, 50 g protein = -4.9 -> 0); categories; negative or blank input rejected', () => {
    const z = mp('0', '0', '0', '50');
    expect(val(z, 'macroPoints')).toBe('0.0 points');
    expect(val(z, 'pointsCategory')).toBe('Zero-Point');
    expect(val(mp('100', '0', '0', '0'), 'pointsCategory')).toBe('Moderate Points'); // 3.05
    expect(mp('-1', '0', '0', '0')).toEqual([]);
    expect(mp('', '0', '0', '0')).toEqual([]);
  });
});

describe('audit H: overweight (WHO BMI classes, Ashwell WHtR, NCEP ATP III waist)', () => {
  it('200 lb 5\'10" male, 38 in waist: BMI 28.7 Overweight, WHtR 0.54 Increased risk, waist 38.0 in is below 40 in', () => {
    const r = overweight.calculate({ unit: 'imperial', sex: 'male', age: '40', weight: '200', heightFt: '5', heightIn: '10', waist: '38' });
    expect(val(r, 'bmiScore')).toBe('28.7 — Overweight');
    expect(val(r, 'whtr')).toBe('0.54 — Increased risk');
    expect(String(val(r, 'waistStatus'))).toContain('At or below the 40 in');
    expect(String(val(r, 'combinedRisk'))).toContain('Elevated risk');
  });
  it('metric 95 kg 180 cm female, 100 cm waist: BMI 29.3, WHtR 0.56, 12.0 cm above the 88 cm threshold', () => {
    const r = overweight.calculate({ unit: 'metric', sex: 'female', age: '40', weight: '95', heightCm: '180', waist: '100' });
    expect(val(r, 'bmiScore')).toBe('29.3 — Overweight');
    expect(val(r, 'whtr')).toBe('0.56 — Increased risk');
    expect(String(val(r, 'waistStatus'))).toContain('12.0 cm above the 88 cm');
  });
  it('class boundaries on displayed BMI: 18.5 Normal, 25.0 Overweight, 30.0 Obese I, 35.0 Obese II, 40.0 Obese III; underweight narrative', () => {
    const at = (w: string) => val(overweight.calculate({ unit: 'metric', sex: 'male', age: '30', weight: w, heightCm: '100', waist: '40' }), 'bmiScore');
    expect(at('18.5')).toBe('18.5 — Normal Weight');
    expect(at('18.4')).toBe('18.4 — Underweight');
    expect(at('25')).toBe('25.0 — Overweight');
    expect(at('30')).toBe('30.0 — Obese (Class I)');
    expect(at('35')).toBe('35.0 — Obese (Class II)');
    expect(at('40')).toBe('40.0 — Obese (Class III — Severe)');
    expect(String(val(overweight.calculate({ unit: 'metric', sex: 'male', age: '30', weight: '50', heightCm: '175', waist: '70' }), 'combinedRisk'))).toContain('Underweight');
  });
  it('muscular case: BMI 30.1 but waist 34 in / 70 in = 0.49 healthy -> moderate risk narrative; blank weight gives nothing', () => {
    const r = overweight.calculate({ unit: 'imperial', sex: 'male', age: '30', weight: '210', heightFt: '5', heightIn: '10', waist: '34' });
    expect(val(r, 'bmiScore')).toBe('30.1 — Obese (Class I)');
    expect(val(r, 'whtr')).toBe('0.49 — Healthy range');
    expect(String(val(r, 'combinedRisk'))).toContain('Moderate risk');
    expect(overweight.calculate({ unit: 'metric', sex: 'male', age: '30', weight: '', heightCm: '175', waist: '80' })).toEqual([]);
  });
});

describe('audit H: chocolate-toxicity (Merck Veterinary Manual; 20 / 40-50 / 60 mg/kg bands)', () => {
  // Merck totals (mg/g): white 0.04, milk 2.3, semisweet/dark 5.3-5.6, baking 15.5, cocoa powder 28.5.
  // The calculator deliberately sits 11-17 % above Merck for milk (2.6) and dark (6.2): conservative for safety.
  const run = (dogWeight: string, weightUnit: string, chocolateType: string, amountEaten: string, amountUnit: string) =>
    chocolateToxicity.calculate({ dogWeight, weightUnit, chocolateType, amountEaten, amountUnit });
  it('baking 15.5 and cocoa powder 28.5 mg/g match Merck exactly: 10 kg dog, 100 g baking = 155 mg/kg; 5 kg, 100 g cocoa = 570 mg/kg', () => {
    const b = run('10', 'kg', 'Baking Chocolate', '100', 'g');
    expect(val(b, 'mgPerKg')).toBe('155.0 mg/kg');
    expect(val(b, 'theobromineMg')).toBe('1,400.0 mg');
    expect(val(b, 'caffeineMg')).toBe('150.0 mg');
    expect(String(val(b, 'severity'))).toContain('EMERGENCY');
    expect(val(run('5', 'kg', 'Cocoa Powder', '100', 'g'), 'mgPerKg')).toBe('570.0 mg/kg');
  });
  it('band edges: 20 kg dog, milk 100 g = 13 mg/kg LOW; 10 kg, dark 100 g = 62 mg/kg EMERGENCY; exactly 20, 40 and 60 mg/kg step up', () => {
    expect(String(val(run('20', 'kg', 'Milk', '100', 'g'), 'severity'))).toContain('LOW RISK');
    expect(val(run('20', 'kg', 'Milk', '100', 'g'), 'mgPerKg')).toBe('13.0 mg/kg');
    expect(String(val(run('10', 'kg', 'Dark', '100', 'g'), 'severity'))).toContain('EMERGENCY');
    // baking 15.5 mg/g: 20 mg/kg x 10 kg = 200 mg = 12.903.. g; use 1 kg dog + 20/40/60 g-equivalents via cocoa (28.5 mg/g)
    const sev = (g: string) => String(val(run('1', 'kg', 'Baking Chocolate', g, 'g'), 'severity'));
    expect(sev('1.2903')).toContain('LOW RISK'); // 19.99 mg/kg
    expect(sev('1.2904')).toContain('MILD'); // 20.00 mg/kg
    expect(sev('2.58')).toContain('MILD'); // 39.99
    expect(sev('2.5807')).toContain('SERIOUS'); // 40.0
    expect(sev('3.8709')).toContain('SERIOUS'); // 59.99
    expect(sev('3.871')).toContain('EMERGENCY'); // 60.0
  });
  it('unit conversions: 10 lb dog + 1 oz dark chocolate = 38.75 mg/kg (explanation says "about 39"); 25 lb dog + 3 oz milk = 19.5 mg/kg; 25 lb + 0.5 oz baking = 19.4 mg/kg', () => {
    const a = run('10', 'lbs', 'Dark', '1', 'oz');
    expect(val(a, 'mgPerKg')).toBe('38.75 mg/kg');
    expect(String(val(a, 'severity'))).toContain('MILD');
    expect(val(run('25', 'lbs', 'Milk', '3', 'oz'), 'mgPerKg')).toBe('19.5 mg/kg');
    expect(val(run('25', 'lbs', 'Baking Chocolate', '0.5', 'oz'), 'mgPerKg')).toBe('19.37 mg/kg');
    expect(val(run('25', 'lbs', 'Milk', '3', 'oz'), 'dogWeightKg')).toBe('11.34 kg');
  });
  it('threshold rows are 20 and 60 mg/kg x body weight: 10 kg -> 200 mg and 600 mg; poison-control number present', () => {
    const r = run('10', 'kg', 'White', '10', 'g');
    expect(val(r, 'vomitingThreshold')).toBe('200.0 mg');
    expect(val(r, 'seizureThreshold')).toBe('600.0 mg');
    expect(val(r, 'vetPhone')).toBe('(888) 426-4435');
    expect(String(val(r, 'severity'))).toContain('LOW RISK');
  });
  it('blank, zero or negative inputs give no result', () => {
    expect(run('', 'kg', 'Milk', '10', 'g')).toEqual([]);
    expect(run('10', 'kg', 'Milk', '0', 'g')).toEqual([]);
    expect(run('-4', 'kg', 'Milk', '10', 'g')).toEqual([]);
  });
});

describe('audit H: probability (Kolmogorov rules, exact decimals)', () => {
  it('independent 0.35 / 0.50: A and B 0.175, A or B 0.675, P(A|B) = P(A)', () => {
    const r = probability.calculate({ pa: '0.35', pb: '0.50', type: 'Independent' });
    expect(val(r, 'pAndB')).toBe('0.175');
    expect(val(r, 'pOrB')).toBe('0.675');
    expect(val(r, 'pNotA')).toBe('0.65');
    expect(val(r, 'pNotB')).toBe('0.5');
    expect(val(r, 'pAGivenB')).toBe('0.35');
    expect(val(r, 'pBGivenA')).toBe('0.5');
    expect(val(r, 'paPct')).toBe('35.0%');
  });
  it('sensors 0.90 / 0.85: both 0.765, at least one 0.985, both miss (1-0.9)(1-0.85) = 0.015', () => {
    const r = probability.calculate({ pa: '0.90', pb: '0.85', type: 'Independent' });
    expect(val(r, 'pAndB')).toBe('0.765');
    expect(val(r, 'pOrB')).toBe('0.985');
    expect(Number(val(r, 'pNotA')) * Number(val(r, 'pNotB'))).toBeCloseTo(0.015, 12);
  });
  it('0.1 + 0.2 has no float drift: independent union 0.28, exclusive union exactly 0.3', () => {
    expect(val(probability.calculate({ pa: '0.1', pb: '0.2', type: 'Independent' }), 'pOrB')).toBe('0.28');
    expect(val(probability.calculate({ pa: '0.1', pb: '0.2', type: 'Mutually Exclusive' }), 'pOrB')).toBe('0.3');
  });
  it('mutually exclusive 0.15 / 0.25: A and B = 0, A or B = 0.4, P(A|B) = 0; sum > 1 is impossible; boundary sum = 1 is allowed', () => {
    const r = probability.calculate({ pa: '0.15', pb: '0.25', type: 'Mutually Exclusive' });
    expect(val(r, 'pAndB')).toBe('0');
    expect(val(r, 'pOrB')).toBe('0.4');
    expect(val(r, 'pAGivenB')).toBe('0');
    const bad = probability.calculate({ pa: '0.6', pb: '0.5', type: 'Mutually Exclusive' });
    expect(bad).toHaveLength(1);
    expect(bad[0].id).toBe('warning');
    expect(val(probability.calculate({ pa: '0.6', pb: '0.4', type: 'Mutually Exclusive' }), 'pOrB')).toBe('1');
  });
  it('edges: P(B)=0 makes P(A|B) undefined; P=1 events; out-of-range or blank inputs give no result', () => {
    expect(String(val(probability.calculate({ pa: '0.5', pb: '0', type: 'Independent' }), 'pAGivenB'))).toContain('Undefined');
    expect(val(probability.calculate({ pa: '1', pb: '1', type: 'Independent' }), 'pOrB')).toBe('1');
    expect(probability.calculate({ pa: '1.2', pb: '0.5', type: 'Independent' })).toEqual([]);
    expect(probability.calculate({ pa: '-0.1', pb: '0.5', type: 'Independent' })).toEqual([]);
    expect(probability.calculate({ pa: '', pb: '0.5', type: 'Independent' })).toEqual([]);
  });
});

describe('audit H: trigonometry-calculator (exact special angles)', () => {
  const t = (angle: string, angleUnit = 'deg') => trigonometry.calculate({ mode: 'angle-to-trig', angle, angleUnit });
  it('30 deg: sin 1/2, cos sqrt3/2 = 0.8660254, tan sqrt3/3 = 0.57735027, csc 2, sec 1.15470054, cot sqrt3 = 1.732050811', () => {
    const r = t('30');
    expect(val(r, 'sin')).toBe('0.5');
    expect(val(r, 'cos')).toBe('0.8660254');
    expect(val(r, 'tan')).toBe('0.57735027');
    expect(val(r, 'csc')).toBe('2');
    expect(val(r, 'sec')).toBe('1.15470054');
    expect(val(r, 'cot')).toBe('1.73205081');
    expect(val(r, 'exactValues')).toBe('sin = 1/2, cos = √3/2, tan = √3/3');
    expect(val(r, 'quadrant')).toBe('Quadrant I');
  });
  it('45 deg: tan exactly 1; 120 deg: Quadrant II, sin 0.8660254, cos -0.5, tan -1.73205081, reference 60 deg', () => {
    expect(val(t('45'), 'tan')).toBe('1');
    const r = t('120');
    expect(val(r, 'quadrant')).toBe('Quadrant II');
    expect(val(r, 'sin')).toBe('0.8660254');
    expect(val(r, 'cos')).toBe('-0.5');
    expect(val(r, 'tan')).toBe('-1.73205081');
    expect(val(r, 'referenceAngle')).toBe('60°');
  });
  it('225 / 330 / 750 / -45 deg reduce correctly (coterminal 225 / 330 / 30 / 315)', () => {
    expect(val(t('225'), 'sin')).toBe('-0.70710678');
    expect(val(t('225'), 'tan')).toBe('1');
    expect(val(t('330'), 'cos')).toBe('0.8660254');
    expect(val(t('330'), 'sin')).toBe('-0.5');
    expect(val(t('750'), 'normalizedAngle')).toBe('30°');
    expect(val(t('750'), 'sin')).toBe('0.5');
    expect(val(t('-45'), 'normalizedAngle')).toBe('315°');
    expect(val(t('-45'), 'cos')).toBe('0.70710678');
  });
  it('axis angles: tan(90) and sec(90) undefined, sin(90)=1, cot(90)=0; csc(0) and cot(0) undefined; tan(180)=0, cos(180)=-1', () => {
    const r90 = t('90');
    expect(val(r90, 'sin')).toBe('1');
    expect(val(r90, 'cos')).toBe('0');
    expect(String(val(r90, 'tan'))).toContain('Undefined');
    expect(String(val(r90, 'sec'))).toContain('Undefined');
    expect(val(r90, 'cot')).toBe('0');
    const r0 = t('0');
    expect(String(val(r0, 'csc'))).toContain('Undefined');
    expect(String(val(r0, 'cot'))).toContain('Undefined');
    expect(val(r0, 'sec')).toBe('1');
    expect(val(t('180'), 'tan')).toBe('0');
    expect(val(t('180'), 'cos')).toBe('-1');
  });
  it('radians input: pi/6 = 0.5235987756 rad is 30 deg (sin 0.5); pi rad has cos -1', () => {
    expect(val(t('0.5235987755982988', 'rad'), 'sin')).toBe('0.5');
    expect(val(t(String(Math.PI), 'rad'), 'cos')).toBe('-1');
  });
  const inv = (func: string, trigValue: string) => trigonometry.calculate({ mode: 'trig-to-angle', angleUnit: 'deg', function: func, trigValue });
  it('inverse principal values: asin(0.5)=30, acos(-0.5)=120, atan(1)=45, acsc(2)=30, asec(2)=60, atan(-1)=-45', () => {
    expect(val(inv('sin', '0.5'), 'principalAngle')).toBe('30°');
    expect(val(inv('cos', '-0.5'), 'principalAngle')).toBe('120°');
    expect(val(inv('tan', '1'), 'principalAngle')).toBe('45°');
    expect(val(inv('csc', '2'), 'principalAngle')).toBe('30°');
    expect(val(inv('sec', '2'), 'principalAngle')).toBe('60°');
    expect(val(inv('tan', '-1'), 'principalAngle')).toBe('-45°');
    expect(val(inv('cos', '-0.5'), 'referenceAngle')).toBe('60°');
  });
  it('all angles in one turn: sin = 0.5 -> 30 or 150; cos = 0.5 -> 60 or 300; tan = 1 -> 45 or 225', () => {
    expect(val(inv('sin', '0.5'), 'allAngles')).toContain('30° or 150°');
    expect(val(inv('cos', '0.5'), 'allAngles')).toContain('60° or 300°');
    expect(val(inv('tan', '1'), 'allAngles')).toContain('45° or 225°');
  });
  it('domain errors: sin 2, cos -1.5, csc 0.5, sec 0; blank gives nothing; cot(0) = 90 deg', () => {
    expect(inv('sin', '2')[0].id).toBe('error');
    expect(inv('cos', '-1.5')[0].id).toBe('error');
    expect(inv('csc', '0.5')[0].id).toBe('error');
    expect(inv('sec', '0')[0].id).toBe('error');
    expect(inv('sin', '')).toEqual([]);
    expect(val(inv('cot', '0'), 'principalAngle')).toBe('90°');
  });
});

describe('audit H follow-up: source notes only claim what was verified', () => {
  it('frame-size FAQ quotes the MedlinePlus wrist chart, not the old unsourced cut-offs or the finger test', () => {
    const faq = (healthyWeight.educational.faqs ?? []).find((f) => f.question === 'How do I determine my frame size?')!.answer;
    expect(faq).toContain('MedlinePlus');
    expect(faq).toContain('Women over 5 ft 5 in: small under 6.25 in, medium 6.25 to 6.5 in, large over 6.5 in');
    expect(faq).not.toContain('6.75');
    expect(faq).not.toContain('overlap');
  });
  it('protein: Morton 2018 break point 1.62 g/kg/day (95% CI 1.03 to 2.20); endurance 1.4-1.8 is a planning range inside ISSN 1.4-2.0', () => {
    const text = JSON.stringify(protein.educational);
    expect(text).toContain('1.62 g/kg/day, 95% confidence interval 1.03 to 2.20');
    expect(text).toContain('planning range chosen for this calculator');
    expect(text).toContain('1.4–2.0 g/kg that the ISSN position stand gives');
    expect(text).not.toContain('evidence-based range');
  });
  it('carbohydrate: g/kg goal ranges are called planning ranges, not guideline values', () => {
    const text = JSON.stringify(carbohydrate.educational);
    expect(text).toContain('conventional planning ranges chosen for this calculator');
    expect(text).not.toContain('sports-nutrition guidelines cite 8–12');
    expect(text).not.toContain('need 7–12 g/kg');
  });
  it('water: activity and climate add-ons are called rules of thumb; the 24+ oz running claim is gone', () => {
    const text = JSON.stringify(waterIntake.educational);
    expect(text).toContain('rules of thumb chosen for this calculator, not published values');
    expect(text).not.toContain('24+ oz');
  });
});
