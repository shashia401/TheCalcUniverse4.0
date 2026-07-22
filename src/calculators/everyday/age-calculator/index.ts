import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import AgeCalculatorPanel from './AgeCalculatorPanel';

const ageCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'birthDate',
      label: 'Date of Birth',
      type: 'text',
      placeholder: 'YYYY-MM-DD (e.g., 1990-03-15)',
      required: true,
      inputMode: 'numeric',
      helpText: 'Enter your birth date in YYYY-MM-DD format. For best results, use the exact date from your birth certificate or official ID document.',
    },
    {
      id: 'toDate',
      label: 'Calculate Age As Of',
      type: 'text',
      placeholder: 'YYYY-MM-DD (leave blank for today)',
      inputMode: 'numeric',
      helpText: 'Leave blank to calculate your current age as of today. Enter a specific date to compute your age on that date — useful for retirement eligibility, school enrollment cutoffs, or milestone planning.',
    },
  ],
  explainSteps: (values) => {
    const birthStr = values.birthDate;
    const toStr = values.toDate;

    if (!birthStr || !/^\d{4}-\d{2}-\d{2}$/.test(birthStr)) return [];

    const birth = new Date(birthStr + 'T00:00:00');
    if (isNaN(birth.getTime())) return [];

    const hasToDate = !!(toStr && /^\d{4}-\d{2}-\d{2}$/.test(toStr));
    const to = hasToDate ? new Date(toStr + 'T00:00:00') : new Date();

    if (birth > to) return [];

    let years = to.getFullYear() - birth.getFullYear();
    let months = to.getMonth() - birth.getMonth();
    let days = to.getDate() - birth.getDate();
    const rawYears = years;
    const borrowDays = days < 0;
    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(to.getFullYear(), to.getMonth(), 0);
      days += prevMonth.getDate();
    }
    const borrowMonths = months < 0;
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const totalDays = Math.floor((to.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    const toLabel = hasToDate ? toStr : 'today';

    const steps: { label: string; expr: string; note?: string }[] = [
      {
        label: 'Set the start and end dates',
        expr: `from ${birthStr} to ${toLabel}`,
      },
      {
        label: 'Subtract years, months and days separately',
        expr: `years ${to.getFullYear()} − ${birth.getFullYear()} = ${rawYears} · months ${to.getMonth() + 1} − ${birth.getMonth() + 1} · days ${to.getDate()} − ${birth.getDate()}`,
      },
    ];

    if (borrowDays || borrowMonths) {
      const adj: string[] = [];
      if (borrowDays) adj.push('days were negative, so borrow a month worth of days');
      if (borrowMonths) adj.push('months were negative, so borrow 1 year (+12 months)');
      steps.push({
        label: 'Fix any negative parts by borrowing',
        expr: `${years} years, ${months} months, ${days} days`,
        note: adj.join('; '),
      });
    }

    steps.push({
      label: 'Your exact age',
      expr: `${years} years, ${months} months, ${days} days`,
    });
    steps.push({
      label: 'Total days lived',
      expr: `⌊(${toLabel} − ${birthStr}) ÷ 1 day⌋ = ${totalDays.toLocaleString(undefined)} days`,
    });

    return steps;
  },
  calculate: (values) => {
    const birthStr = values.birthDate;
    const toStr = values.toDate;

    if (!birthStr || !/^\d{4}-\d{2}-\d{2}$/.test(birthStr)) return [];

    const birth = new Date(birthStr + 'T00:00:00');
    if (isNaN(birth.getTime())) return [];

    const to = toStr && /^\d{4}-\d{2}-\d{2}$/.test(toStr)
      ? new Date(toStr + 'T00:00:00')
      : new Date();

    if (birth > to) return [];

    let years = to.getFullYear() - birth.getFullYear();
    let months = to.getMonth() - birth.getMonth();
    let days = to.getDate() - birth.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(to.getFullYear(), to.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const totalDays = Math.floor((to.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = years * 12 + months;
    const totalHours = totalDays * 24;

    const birthMonth = birth.getMonth();
    const birthDay = birth.getDate();
    const isLeapBirthday = birthMonth === 1 && birthDay === 29;
    const targetYear = to.getFullYear();
    const isLeapYear = (targetYear % 4 === 0 && targetYear % 100 !== 0) || (targetYear % 400 === 0);
    const nextBirthdayMonth = isLeapBirthday && !isLeapYear ? 2 : birthMonth;
    const nextBirthdayDay = isLeapBirthday && !isLeapYear ? 1 : birthDay;
    const nextBirthday = new Date(targetYear, nextBirthdayMonth, nextBirthdayDay);
    if (nextBirthday <= to) nextBirthday.setFullYear(to.getFullYear() + 1);
    const daysUntilBirthday = Math.round((nextBirthday.getTime() - to.getTime()) / (1000 * 60 * 60 * 24));

    // Zodiac sign calculation
    const zodiacSigns = [
      { name: 'Capricorn', endMonth: 0, endDay: 19 },
      { name: 'Aquarius', endMonth: 1, endDay: 18 },
      { name: 'Pisces', endMonth: 2, endDay: 20 },
      { name: 'Aries', endMonth: 3, endDay: 19 },
      { name: 'Taurus', endMonth: 4, endDay: 20 },
      { name: 'Gemini', endMonth: 5, endDay: 20 },
      { name: 'Cancer', endMonth: 6, endDay: 22 },
      { name: 'Leo', endMonth: 7, endDay: 22 },
      { name: 'Virgo', endMonth: 8, endDay: 22 },
      { name: 'Libra', endMonth: 9, endDay: 22 },
      { name: 'Scorpio', endMonth: 10, endDay: 21 },
      { name: 'Sagittarius', endMonth: 11, endDay: 21 },
      { name: 'Capricorn', endMonth: 12, endDay: 19 },
    ];
    let zodiac = 'Capricorn';
    for (const z of zodiacSigns) {
      if (birthMonth < z.endMonth || (birthMonth === z.endMonth && birthDay <= z.endDay)) {
        zodiac = z.name;
        break;
      }
    }

    // Chinese zodiac
    const chineseZodiacAnimals = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
    const chineseZodiacIdx = ((birth.getFullYear() - 4) % 12 + 12) % 12;
    const chineseZodiac = chineseZodiacAnimals[chineseZodiacIdx];

    // Day of week born
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const birthWeekday = weekdays[birth.getDay()];

    // Life milestones
    const day10k = new Date(birth.getTime() + 10000 * 24 * 60 * 60 * 1000);
    const day20k = new Date(birth.getTime() + 20000 * 24 * 60 * 60 * 1000);
    const day30k = new Date(birth.getTime() + 30000 * 24 * 60 * 60 * 1000);
    const fmtMilestone = (d: Date) => d.toISOString().slice(0, 10);
    const daysTo10k = Math.max(0, Math.round((day10k.getTime() - to.getTime()) / (1000 * 60 * 60 * 24)));
    const daysTo20k = Math.max(0, Math.round((day20k.getTime() - to.getTime()) / (1000 * 60 * 60 * 24)));

    // Next major birthday (decade milestone)
    let nextDecadeBirthday = Math.ceil((years + 1) / 10) * 10;
    if (nextDecadeBirthday === years) nextDecadeBirthday = years + 10;
    const decadeBday = new Date(birth.getFullYear() + nextDecadeBirthday, birthMonth, birthDay);
    if (isLeapBirthday && !((birth.getFullYear() + nextDecadeBirthday) % 4 === 0 && ((birth.getFullYear() + nextDecadeBirthday) % 100 !== 0 || (birth.getFullYear() + nextDecadeBirthday) % 400 === 0))) {
      decadeBday.setMonth(2);
      decadeBday.setDate(1);
    }
    const yearsToDecade = decadeBday.getFullYear() - to.getFullYear();

    return [
      {
        id: 'exactAge',
        label: 'Exact Age',
        value: `${years} years, ${months} months, ${days} days`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'totalDays',
        label: 'Total Days Lived',
        value: totalDays.toLocaleString(undefined),
        color: 'neutral',
      },
      {
        id: 'totalWeeks',
        label: 'Total Weeks Lived',
        value: totalWeeks.toLocaleString(undefined),
        color: 'neutral',
      },
      {
        id: 'totalMonths',
        label: 'Total Months Lived',
        value: totalMonths.toLocaleString(undefined),
        color: 'neutral',
      },
      {
        id: 'totalHours',
        label: 'Approximate Hours Lived',
        value: totalHours.toLocaleString(undefined),
        color: 'neutral',
      },
      {
        id: 'nextBirthday',
        label: 'Next Birthday In',
        value: `${daysUntilBirthday} days`,
        color: 'positive',
      },
      {
        id: 'zodiacSign',
        label: 'Zodiac Sign',
        value: zodiac,
        color: 'neutral',
      },
      {
        id: 'chineseZodiac',
        label: 'Chinese Zodiac',
        value: chineseZodiac,
        color: 'neutral',
      },
      {
        id: 'birthWeekday',
        label: 'Born On',
        value: birthWeekday,
        color: 'neutral',
      },
      {
        id: 'day10k',
        label: '10,000-Day Milestone',
        value: daysTo10k === 0 ? `${fmtMilestone(day10k)} (reached!)` : `${fmtMilestone(day10k)} (in ${daysTo10k.toLocaleString()} days)`,
        color: 'neutral',
      },
      {
        id: 'nextDecade',
        label: `Next Decade Birthday (${nextDecadeBirthday})`,
        value: `In ~${yearsToDecade} year${yearsToDecade !== 1 ? 's' : ''}`,
        color: 'positive',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(AgeCalculatorPanel, { values, results });
  },
  educational: {
    formula: 'Age = Reference Date − Birth Date (accounting for leap years and month lengths)',
    formulaDescription:
      'Exact chronological age calculation subtracts the birth date from the reference date, handling the varying number of days in each month (28-31) and leap years (February 29 occurs in years divisible by 4 but not by 100, unless also divisible by 400). The years-months-days breakdown uses component-wise comparison with borrowing: if the target day is smaller than the birth day, one month is borrowed from the months component and converted to the number of days in the previous month. Similarly, if the target month is smaller, one year is borrowed and converted to 12 months. Total days derive from the millisecond difference between midnight UTC on both dates, avoiding timezone complications entirely.',
    diagram: {
      svg: '<svg viewBox="0 0 420 160" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="210" y="20" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Your Age in Different Units</text>' +
        '<line x1="30" y1="60" x2="390" y2="60" stroke="var(--svg-cbd5e1)" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="30" cy="60" r="6" fill="var(--svg-3b82f6)"/><text x="30" y="85" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">Birth</text>' +
        '<circle cx="210" cy="60" r="6" fill="var(--svg-f59e0b)"/><text x="210" y="85" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">Today</text>' +
        '<circle cx="390" cy="60" r="6" fill="var(--svg-e2e8f0)"/><text x="390" y="85" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">Future</text>' +
        '<text x="120" y="50" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">years</text>' +
        '<text x="300" y="50" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">years</text>' +
        '<rect x="40" y="105" width="30" height="20" rx="4" fill="var(--svg-3b82f6)"/><text x="55" y="119" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Y</text>' +
        '<rect x="75" y="105" width="30" height="20" rx="4" fill="var(--svg-22c55e)"/><text x="90" y="119" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">M</text>' +
        '<rect x="110" y="105" width="30" height="20" rx="4" fill="var(--svg-f59e0b)"/><text x="125" y="119" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">D</text>' +
        '<text x="160" y="119" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)">Years / Months / Days</text>' +
        '</svg>',
      alt: 'Timeline showing birth to today with age displayed in years, months, and days',
      caption: 'Your age can be expressed in years, months, and days — or even total hours, weeks, and milestone dates',
    },
    variables: [
      { symbol: 'Birth Date', name: 'Date of Birth', description: 'The exact date you were born, as recorded on your birth certificate or official identification. Day, month, and year are all needed for precise age calculation.' },
      { symbol: 'Reference Date', name: 'Target / As-Of Date', description: 'The date on which to calculate your age. Defaults to today\'s date. Use a specific date for legal forms, insurance applications, or retirement eligibility checks.' },
      { symbol: 'Years', name: 'Component Years', description: 'The difference in year numbers, adjusted for whether the birthday has occurred yet in the reference year. Borrows 1 year if the reference month + day is before the birth month + day.' },
      { symbol: 'Total Days', name: 'Days Lived', description: 'The exact number of 24-hour periods between birth and reference date. Used as the basis for all other unit conversions (weeks, months, hours).' },
    ],
    howToUse: [
      'Enter your birth date in YYYY-MM-DD format (e.g., 1990-03-15). Use the exact date from your birth certificate for the most precise result.',
      'Leave the "As Of" date blank to calculate your current age as of today, or enter a specific date for a future/past age calculation.',
      'View your exact age broken down into years, months, and days — the format required by most legal documents, medical forms, and insurance applications.',
      'See your age expressed in total days, weeks, months, and hours for perspective — a 30-year-old has lived roughly 10,957 days or 262,968 hours.',
      'Check your 10,000-day milestone date, zodiac sign, Chinese zodiac animal, and the weekday you were born for interesting personal trivia.',
      'Use the countdown to your next birthday and next decade milestone for planning celebrations, checking age-based eligibility, or tracking retirement dates.',
    ],
    explanation:
      'An age calculator determines your exact chronological age — the time elapsed between your birth date and a reference date — expressed in years, months, and days. Chronological age is distinct from biological age (how old your body actually is based on cellular markers) and psychological age (how old you feel). The concept of tracking chronological age dates to ancient Rome, where birth registrations were maintained for taxation and military service eligibility under Emperor Augustus. Today, exact age calculation matters for: legal age of majority (18 in most countries), Social Security retirement eligibility (62-70 in the US), Medicare enrollment at 65, school enrollment cutoffs (usually September 1 in the US), age-based driver licensing tiers, alcohol purchase age verification, and prescription drug dosing that varies by age. This calculator implements precise date arithmetic accounting for the Gregorian calendar\'s irregular month lengths (28-31 days) and leap year rules (divisible by 4, except century years not divisible by 400). The calculator also provides interesting perspective metrics: a 30-year-old has lived about 11,000 days, a 50-year-old has experienced roughly 18,250 sunrises, and a centenarian has witnessed approximately 36,500 days of human history. The 10,000-day milestone (reached around age 27 years and 4 months) is celebrated in some cultures as a coming-of-age marker. Knowing your total weeks lived (roughly 52 per year) provides a different temporal perspective — a typical 80-year lifespan contains only about 4,000 weeks.',
    workedExamples: [
      {
        scenario: 'Maria from Barcelona was born on March 15, 1990 and needs to confirm her exact age for a US visa application. The consular form asks for "age in years, months, and days" as of the application date, June 10, 2026.',
        inputs: { birthDate: '1990-03-15', toDate: '2026-06-10' },
        result: '36 years, 2 months, 26 days (13,237 total days).',
        insight: 'Maria is 36 years, 2 months, and 26 days old on her visa application date. For US immigration forms, age must be exact — even one day can affect eligibility categories. The visa officer will cross-check this against her passport birth date. Her total lived days are 13,237, meaning she has already passed her 10,000-day milestone (which occurred around August 11, 2017, when she was 27). Her next decade milestone is her 40th birthday on March 15, 2030 — roughly 3 years and 9 months away. She was born on a Thursday.',
      },
      {
        scenario: 'James, a steelworker from Pittsburgh born August 1, 1963, needs to confirm his exact age on August 1, 2028 — when he turns 65 and becomes eligible for full Social Security retirement benefits.',
        inputs: { birthDate: '1963-08-01', toDate: '2028-08-01' },
        result: 'Exactly 65 years, 0 months, 0 days (23,740 total days).',
        insight: 'James turns exactly 65 on August 1, 2028 — his full retirement age (FRA) for Social Security purposes. If born in 1963, his FRA is 67 for full benefits, but he can claim reduced benefits starting at 62. At exactly 65, James becomes Medicare-eligible. The Social Security Administration uses the "day before birthday" rule for some purposes — meaning his first retirement check arrives the month after he turns 65. James has lived 23,740 days as of his 65th birthday. His total hours lived is approximately 569,760. He was born on a Thursday (August 1, 1963). His Chinese zodiac is the Rabbit. James should also check his private pension and 401(k) required minimum distribution dates; under current SECURE 2.0 rules, RMDs begin at age 73 — his RMD start date would be April 1 following the year he turns 73.',
      },
      {
        scenario: 'Leah, born on February 29, 2000 (a leap year baby in Sydney, Australia), wants to know how many actual February 29 birthdays she has celebrated by May 17, 2026. She is also curious when her 10,000-day milestone falls.',
        inputs: { birthDate: '2000-02-29', toDate: '2026-05-17' },
        result: '26 years, 2 months, 18 days (9,573 total days). 7 true Feb 29 birthdays celebrated.',
        insight: 'Leah has celebrated only 7 "true" birthdays on February 29 in her 26 years of life. In non-leap years, most leaplings celebrate on February 28 or March 1. Her total lived days: 9,573 — she will reach her 10,000-day milestone on July 14, 2027, at age 27. Her next decade birthday (30th) will occur in 2030, which is not a leap year, so she will celebrate on March 1. Her Chinese zodiac is the Dragon (2000 is a Dragon year) and she was born on a Tuesday. Leap year birthdays occur for only about 0.07% of the world\'s population — approximately 5 million people globally, sometimes called "leaplings" or "leap day babies." In most jurisdictions, a leapling legally turns 18 on March 1 in non-leap years for purposes of voting, drinking age, and contract signing. For astrological purposes, February 29 falls under Pisces regardless.',
      },
    ],
    proTips: [
      'For quick mental age math: subtract birth year from current year, then subtract 1 if your birthday hasn\'t occurred yet this year. This gives years only — months and days require the full calculation.',
      'Milestone ages in days provide fascinating perspective: 10,000 days arrives around age 27 years + 4 months, 20,000 days at ~54.8 years, and 30,000 days at ~82.1 years. Track these "day milestones" as alternative birthday markers — 10,000-day celebrations are a tradition in some East Asian cultures.',
      'When filling out official forms, check whether they require "age at last birthday" (common for census data and surveys) or "age at nearest birthday" (less common but used for some insurance rate calculations). The difference can affect eligibility cutoffs for Medicare, driver licensing tiers, and school enrollment.',
      'Age in weeks is the standard measurement for infant development tracking during the first 6-12 months of life, as pediatric developmental milestones (rolling over, sitting, crawling, walking) follow week-based timelines rather than month-based ones. The CDC milestone checklist uses age in weeks up to 12 months.',
      'For legal age determination in US courts, the common-law "birthday rule" holds that you reach age N at 12:00:01 AM on your Nth birthday regardless of the time of day you were born. This means someone born at 11:59 PM on January 15 legally turns 21 at the first moment of January 15, 21 years later — not 11:59 PM.',
      'Life expectancy context: as of 2025, the average US lifespan is about 77.5 years (~28,300 days). A 40-year-old has lived roughly 14,600 days (~52% of average lifespan). A newborn today has about a 1-in-3 chance of living to 100, meaning ~36,500 days. Use these benchmarks to give perspective on life stage planning.',
    ],
    limitations: [
      'When not to use: For precise legal age determination where the time of birth matters (e.g., some countries define legal age at the exact time of birth, not just the date). For forensic age estimation of unknown individuals (teeth/bone age), use forensic odontology or radiographic bone age assessment instead — chronological age from birthday does not equal biological maturity which varies by individual.',
      'Age calculation depends on the Gregorian calendar system and does not account for historical calendar transitions (e.g., the switch from the Julian calendar in 1582, which varied by country — Great Britain adopted the Gregorian calendar in September 1752, skipping 11 days). For dates before 1582, calendar discrepancies can produce inaccuracies of 10-13 days.',
      'Time zone differences are not considered — the calculator uses the local date only, not the exact time of birth. For someone born in Tokyo at 3:00 AM JST on January 15, the date in New York is still January 14. In rare edge cases where the exact hour matters for legal purposes (citizenship by birth, inheritance cutoff dates), consult a legal professional.',
      'The calculator assumes midnight-to-midnight day boundaries. For preterm infants, the corrected gestational age (weeks since conception, not birth) is used for developmental milestone tracking until age 2. This calculator gives chronological age from birth date, which may differ from corrected age by several weeks for premature babies.',
      'Different legal systems define "one year" differently for specific purposes. For example, the US Supreme Court ruled in 1993 that for statute-of-limitations purposes, a "year" runs from the anniversary date to the day before the next anniversary (not to the anniversary itself). Always check the specific legal definition for your jurisdiction.',
    ],
    quickReference: [
      { label: '1 year (non-leap)', value: '365 days' },
      { label: '1 year (leap year)', value: '366 days' },
      { label: '1 year in weeks', value: '52.14 weeks (52 weeks + 1 day)' },
      { label: '1 year in hours', value: '8,760 hours (8,784 in leap)' },
      { label: '10,000 days milestone', value: '~27 years, 4 months, 15 days' },
      { label: '20,000 days milestone', value: '~54 years, 9 months' },
      { label: 'Average US lifespan', value: '~28,300 days (~77.5 years)' },
      { label: 'Age 18 (legal majority)', value: '6,570 days (minimum)' },
      { label: 'Age 65 (Medicare)', value: '23,741 days (minimum)' },
      { label: 'Centenarian (100 years)', value: '36,524 days (25 leap days)' },
    ],
    commonUses: [
      'Legal age verification — confirming exact age for driver licensing, voting registration, alcohol purchase eligibility, firearm purchase background checks, and contract signing capability under the law.',
      'Social Security and retirement planning — determining the exact date you reach full retirement age (FRA), which ranges from 65 to 67 depending on birth year, and calculating early vs. delayed claiming strategies.',
      'Medical and insurance forms — providing age in years, months, and days for medical history intake, life insurance underwriting, prescription dosage calculations, and pediatric development tracking.',
      'School enrollment eligibility — determining whether a child meets the kindergarten cutoff date (typically September 1 in the US), first grade entry requirements, and age-based grade placement across different school districts.',
      'Immigration and visa applications — providing exact chronological age for visa category eligibility, citizenship-by-birth applications, family reunification petitions, and age-out protection under the Child Status Protection Act (CSPA).',
      'Milestone celebration planning — tracking 10,000-day anniversaries, decade birthdays (30, 40, 50), silver/golden/platinum birthdays, and half-birthdays for personal and family celebrations.',
    ],
    faqs: [
      {
        question: 'How is the exact age in years, months, and days calculated?',
        answer: 'The calculator compares your birth date and reference date component by component. First, subtract the years. Then subtract the months. If the reference day is smaller than the birth day, borrow 1 month and add the number of days in the previous month. If the reference month is smaller than the birth month (after any day borrowing), borrow 1 year and add 12 months. This produces an exact "X years, Y months, Z days" breakdown. For example: born January 31, reference March 1. Years: 0. Months: March (3) minus January (1) = 2. Days: 1 minus 31 = -30. Borrow 1 month (months becomes 1, add 28 days from February): days = 1 + 28 - 31 = -2. Still negative! Borrow 1 more month: months becomes 0, add 31 days from January: days = 1 + 31 - 31 = 1. Final: 0 years, 0 months, 1 day. This is correct — January 31 to March 1 is indeed 1 month and minus 2 days, which normalizes to 1 day when months are zero.',
      },
      {
        question: 'What happens if I was born on February 29 in a leap year?',
        answer: 'Leaplings (people born on February 29) experience their true birthday only in leap years, which occur every 4 years except century years not divisible by 400. In non-leap years, the calculator treats March 1 as the birthday reference. For example, if you were born February 29, 2000, you would be 26 on March 1, 2026. Legally, most US states and international jurisdictions recognize March 1 as the official birthday in non-leap years for age-of-majority purposes. This means a leapling can legally vote, drink (at 21), and sign contracts on March 1 of the appropriate year. Some countries like New Zealand and Taiwan officially recognize February 28 instead. About 5 million people worldwide are leaplings, including celebrities like Tony Robbins (1960) and Ja Rule (1976). The next leap years after 2024 are 2028, 2032, and 2036. The year 2100 will NOT be a leap year (century rule exception), so a leapling born in 2032 who would normally expect a birthday in 2100 will have to wait until 2104.',
      },
      {
        question: 'Why does my age show differently on some websites or calculators?',
        answer: 'Different age calculators handle month boundaries and leap years with varying levels of precision. The most common discrepancy comes from how they handle day borrowing: some use a simple 30-day month average, while others account for the actual number of days in each month (28/29/30/31). Another source of variation is whether calculators count the birthday itself as adding a year. For example, if today is your birthday, some calculators show your new age while others still show last year\'s age until the exact time matches — this is the "inclusive count" vs. "completed years" distinction. Our calculator uses completed years, months, and days, meaning you must have fully reached each unit boundary. A third difference: some calculators round months to 4.35 weeks (365/12/7), introducing small errors that compound over decades. Our precise date arithmetic accounts for the exact calendar structure for any date range between 1900-2100.',
      },
      {
        question: 'What is the 10,000-day milestone and why does it matter?',
        answer: 'Your 10,000th day alive occurs at approximately age 27 years and 4 months (27.4 years). In several East Asian cultures, particularly Korea and Japan, the 10,000-day (man-ireum in Korean) celebration marks a significant coming-of-age milestone — 10,000 days represents roughly a third of the traditional ideal lifespan of 30,000 days. The concept is similar to the Western "quarter-life crisis" marker at 25, but with a more mathematically grounded basis. The 20,000-day milestone arrives at ~54.8 years (near typical retirement age) and 30,000 days at ~82.1 years. Notable 10,000-day equivalents: if you were born on September 11, 2001, your 10,000th day was approximately January 30, 2029. Someone born on iPhone launch day (June 29, 2007) reaches 10,000 days around November 13, 2034. These milestones are increasingly used in personal development and life planning as concrete, measurable markers of life stages.',
      },
      {
        question: 'How does age affect Social Security and Medicare eligibility?',
        answer: 'For Social Security retirement benefits, your Full Retirement Age (FRA) depends on your birth year: born 1943-1954 = FRA 66; born 1955-1959 = FRA 66 + 2 months per year (e.g., 1955 = 66+2 months); born 1960+ = FRA 67. You can claim as early as age 62 (permanently reduced by 25-30%) or delay to age 70 (earning 8% delayed retirement credits per year past FRA). The exact date matters: your first check arrives the month AFTER you reach the eligibility age, and claiming at 62 means you must be 62 for the entire month. For Medicare: eligibility begins the first day of the month you turn 65 (or the previous month if your birthday is the 1st). Your Initial Enrollment Period is the 7-month window starting 3 months before your 65th birthday month. Missing this window triggers lifetime penalties: Part B premiums increase 10% for each full 12-month period of delay. For exact claiming dates, always use a precise age calculator rather than mental math — being off by one month can cost thousands in lifetime benefits.',
      },
      {
        question: 'What is the difference between chronological age, biological age, and corrected age?',
        answer: 'Chronological age (what this calculator measures) is simply the time elapsed since your birth date — it is objective and verifiable from your birth certificate. Biological age estimates how old your body actually is based on biomarkers like DNA methylation patterns (epigenetic clock), telomere length, blood markers, and physiological function. A 50-year-old who exercises, eats well, and manages stress might have a biological age of 40, while a sedentary 40-year-old smoker could have a biological age of 55. Corrected (or adjusted) gestational age applies only to preterm infants born before 37 weeks gestation: if a baby was born at 32 weeks (8 weeks premature) and is now 20 weeks old chronologically, their corrected age is 12 weeks for developmental milestone tracking. Pediatricians use corrected age until about age 2, at which point most preterm children have caught up developmentally. This calculator provides chronological age only — biological age and corrected gestational age require different measurement tools.',
      },
      {
        question: 'How do different countries and legal systems define when someone reaches a specific age?',
        answer: 'Age calculation rules vary significantly by jurisdiction. In the United States, under common law, a person reaches an age at 12:00:01 AM on their birthday regardless of birth time — the "birthday rule." In South Korea, the traditional system counted you as age 1 at birth and added a year on January 1st regardless of your actual birthday, meaning a baby born December 31 was age 2 the next day. Korea switched to international age counting in June 2023. In Japan, the age of majority was lowered from 20 to 18 in April 2022, but drinking and smoking remain at age 20. In Iran and Saudi Arabia, the lunar Hijri calendar is used for some legal purposes, with Hijri years being ~354 days (about 11 days shorter than Gregorian years), meaning age milestones are reached roughly 3% earlier. Some European countries (Germany, Austria) calculate age based on the exact time of birth for certain legal purposes like criminal responsibility and witness competency. For international legal matters, always consult an attorney familiar with the specific jurisdiction.',
      },
    ],
    citations: [
      { source: 'NIST - Time and Calendar', url: 'https://www.nist.gov/pml/time-and-frequency-division' },
      { source: 'Social Security Administration - Retirement Age', url: 'https://www.ssa.gov/benefits/retirement/planner/agereduction.html' },
      { source: 'CDC - Developmental Milestones', url: 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html' },
      { source: 'timeanddate.com - Age Calculator', url: 'https://www.timeanddate.com/date/age-calculator.html' },
    ],
  },
};

export default ageCalculatorConfig;
