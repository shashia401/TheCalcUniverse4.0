import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import AgeCalculatorPanel from './AgeCalculatorPanel';
import { computeAge, chineseAnimal, zodiacSign } from './ageMath';
import { toIsoDate } from '../../../utils/dates';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
    const a = computeAge(values);
    if (!a) return [];
    const birthStr = toIsoDate(a.birth);
    const toLabel = a.hasToDate ? toIsoDate(a.to) : 'today';

    const steps: { label: string; expr: string; note?: string }[] = [
      {
        label: 'Set the start and end dates',
        expr: `from ${birthStr} to ${toLabel}`,
      },
      {
        label: 'Subtract years, months and days separately',
        expr: `years ${a.to.getFullYear()} − ${a.birth.getFullYear()} = ${a.rawYears} · months ${a.to.getMonth() + 1} − ${a.birth.getMonth() + 1} · days ${a.to.getDate()} − ${a.birth.getDate()}`,
      },
    ];

    if (a.borrowDays || a.borrowMonths) {
      const adj: string[] = [];
      if (a.borrowDays) adj.push('days were negative, so borrow a month worth of days');
      if (a.borrowMonths) adj.push('months were negative, so borrow 1 year (+12 months)');
      steps.push({
        label: 'Fix any negative parts by borrowing',
        expr: `${a.years} years, ${a.months} months, ${a.days} days`,
        note: adj.join('; '),
      });
    }

    steps.push({
      label: 'Your exact age',
      expr: `${a.years} years, ${a.months} months, ${a.days} days`,
    });
    steps.push({
      label: 'Total days lived',
      expr: `(${toLabel} − ${birthStr}) in whole calendar days = ${a.totalDays.toLocaleString('en-US')} days`,
    });

    return steps;
  },
  calculate: (values) => {
    const a = computeAge(values);
    if (!a) return [];
    const { birth, years, months, days, totalDays } = a;
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = years * 12 + months;
    const totalHours = totalDays * 24;

    const zodiac = zodiacSign(birth.getMonth(), birth.getDate());
    const chineseZodiac = chineseAnimal(birth.getFullYear());
    const birthWeekday = WEEKDAYS[birth.getDay()];

    const d10 = toIsoDate(a.day10k);
    const dec = a.decadeIn;
    const decadeParts = [
      dec.years > 0 ? `${dec.years} year${dec.years !== 1 ? 's' : ''}` : '',
      dec.months > 0 ? `${dec.months} month${dec.months !== 1 ? 's' : ''}` : '',
      dec.years === 0 && dec.months === 0 ? `${dec.days} day${dec.days !== 1 ? 's' : ''}` : '',
    ].filter(Boolean);

    // Lunar New Year falls between 21 Jan and 20 Feb, so a Jan 1 - Feb 20 birth may belong to the previous animal.
    const earlyYear = birth.getMonth() === 0 || (birth.getMonth() === 1 && birth.getDate() <= 20);

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
        value: totalDays.toLocaleString('en-US'),
        color: 'neutral',
      },
      {
        id: 'totalWeeks',
        label: 'Total Weeks Lived',
        value: totalWeeks.toLocaleString('en-US'),
        color: 'neutral',
      },
      {
        id: 'totalMonths',
        label: 'Total Months Lived',
        value: totalMonths.toLocaleString('en-US'),
        color: 'neutral',
      },
      {
        id: 'totalHours',
        label: 'Approximate Hours Lived',
        value: totalHours.toLocaleString('en-US'),
        color: 'neutral',
      },
      {
        id: 'nextBirthday',
        label: 'Next Birthday In',
        value: `${a.daysUntilBirthday} days`,
        color: 'positive',
        interpretation: a.isBirthdayToday
          ? 'Today is your birthday - the next one is a year away.'
          : `Your next birthday is ${toIsoDate(a.nextBirthday)}, when you turn ${years + 1}.`,
      },
      {
        id: 'zodiacSign',
        label: 'Zodiac Sign (Western, for fun)',
        value: zodiac,
        color: 'neutral',
      },
      {
        id: 'chineseZodiac',
        label: 'Chinese Zodiac (by calendar year)',
        value: chineseZodiac,
        color: 'neutral',
        interpretation: earlyYear
          ? `Born in January/February: the Chinese year starts at Lunar New Year (21 Jan - 20 Feb). If you were born before it, your animal is the previous one (${chineseAnimal(birth.getFullYear() - 1)}).`
          : 'Based on the calendar year of birth; entertainment only.',
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
        value: a.daysTo10k === 0 ? `${d10} (reached!)` : `${d10} (in ${a.daysTo10k.toLocaleString('en-US')} days)`,
        color: 'neutral',
      },
      {
        id: 'nextDecade',
        label: `Next Decade Birthday (${a.nextDecadeAge})`,
        value: `In ${decadeParts.join(', ')}`,
        color: 'positive',
        interpretation: `Your ${a.nextDecadeAge}th birthday is ${toIsoDate(a.decadeDate)}.`,
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
      'Exact chronological age calculation subtracts the birth date from the reference date, handling the varying number of days in each month (28-31) and leap years (February 29 occurs in years divisible by 4 but not by 100, unless also divisible by 400). The years-months-days breakdown uses component-wise comparison with borrowing: if the target day is smaller than the birth day, one month is borrowed from the months component and converted to the number of days in the previous month. Similarly, if the target month is smaller, one year is borrowed and converted to 12 months. Total days are the difference of the two calendar dates counted as whole days, so daylight-saving changes and your time zone cannot add or remove a day. A 29 February birthday is treated as 1 March in non-leap years.',
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
      'An age calculator determines your exact chronological age — the time elapsed between your birth date and a reference date — expressed in years, months, and days. Chronological age is distinct from biological age (how old your body actually is based on cellular markers) and psychological age (how old you feel). Exact age calculation matters for: legal age of majority (18 in most countries), Social Security retirement eligibility (62-70 in the US), Medicare enrollment at 65, school enrollment cutoffs (usually September 1 in the US), age-based driver licensing tiers, alcohol purchase age verification, and prescription drug dosing that varies by age. This calculator implements precise date arithmetic accounting for the Gregorian calendar\'s irregular month lengths (28-31 days) and leap year rules (divisible by 4, except century years not divisible by 400). The calculator also provides interesting perspective metrics: a 30-year-old has lived about 11,000 days, a 50-year-old has experienced roughly 18,250 sunrises, and a centenarian has witnessed approximately 36,500 days of human history. The 10,000-day milestone arrives at about age 27 years and 4 months and makes a fun alternative "birthday". Knowing your total weeks lived (roughly 52 per year) provides a different temporal perspective — a typical 80-year lifespan contains only about 4,000 weeks.',
    workedExamples: [
      {
        scenario: 'Maria from Barcelona was born on March 15, 1990 and needs to confirm her exact age for a US visa application. The consular form asks for "age in years, months, and days" as of the application date, June 10, 2026.',
        inputs: { birthDate: '1990-03-15', toDate: '2026-06-10' },
        result: '36 years, 2 months, 26 days (13,236 total days).',
        insight: 'Maria is 36 years, 2 months, and 26 days old on her application date. Forms that ask for age to the day are checked against the passport birth date, so use the exact date. Her total lived days are 13,236, meaning she has already passed her 10,000-day milestone (31 July 2017, when she was 27). Her 40th birthday is on March 15, 2030 — 3 years and 9 months after the application date. She was born on a Thursday.',
      },
      {
        scenario: 'James, a steelworker from Pittsburgh born August 1, 1963, wants to confirm his exact age on August 1, 2028 — the day he turns 65 and becomes Medicare-eligible.',
        inputs: { birthDate: '1963-08-01', toDate: '2028-08-01' },
        result: 'Exactly 65 years, 0 months, 0 days (23,742 total days).',
        insight: 'James turns exactly 65 on August 1, 2028, which is when he becomes eligible for Medicare. For anyone born in 1960 or later the Social Security full retirement age is 67, not 65, though reduced benefits can start at 62. James has lived 23,742 days (about 569,808 hours) by his 65th birthday. He was born on a Thursday, and his Chinese zodiac animal by calendar year is the Rabbit.',
      },
      {
        scenario: 'Leah, born on February 29, 2000 (a leap year baby in Sydney, Australia), wants to know how many actual February 29 birthdays she has celebrated by May 17, 2026. She is also curious when her 10,000-day milestone falls.',
        inputs: { birthDate: '2000-02-29', toDate: '2026-05-17' },
        result: '26 years, 2 months, 18 days (9,574 total days). 6 true Feb 29 birthdays celebrated (2004-2024).',
        insight: 'Leah has had only 6 "true" birthdays on February 29 (2004, 2008, 2012, 2016, 2020, 2024) in her 26 years of life. In non-leap years this calculator treats March 1 as her birthday; some places use February 28 instead. Her total lived days: 9,574 — she reaches her 10,000-day milestone on July 17, 2027, at age 27. Her 30th birthday falls in 2030, which is not a leap year, so it is counted as March 1. Her Chinese zodiac animal by calendar year is the Dragon and she was born on a Tuesday. About 1 person in 1,461 is born on February 29 (roughly 5 million people), sometimes called "leaplings". Which day counts as a leapling\'s legal birthday varies by jurisdiction. For Western astrology, February 29 falls under Pisces.',
      },
    ],
    proTips: [
      'For quick mental age math: subtract birth year from current year, then subtract 1 if your birthday hasn\'t occurred yet this year. This gives years only — months and days require the full calculation.',
      'Milestone ages in days provide fascinating perspective: 10,000 days arrives around age 27 years + 4 months, 20,000 days at ~54.8 years, and 30,000 days at ~82.1 years. Track these "day milestones" as fun alternative birthdays.',
      'When filling out official forms, check whether they require "age at last birthday" (common for census data and surveys) or "age at nearest birthday" (less common but used for some insurance rate calculations). The difference can affect eligibility cutoffs for Medicare, driver licensing tiers, and school enrollment.',
      'Age in weeks is handy for tracking the first months of a baby\'s life, although the CDC developmental milestone checklists are organised by age in months (2, 4, 6, 9, 12, 15, 18, 24, 30 months).',
      'Legal systems differ on exactly when you "reach" an age: some treat you as reaching age N at the start of your Nth birthday, others on the day before it. For anything with a legal cut-off, check the rule that applies to you.',
      'Life expectancy context: US life expectancy at birth was 79.0 years in 2024 (NCHS Data Brief 548), about 28,900 days. A 40-year-old has lived roughly 14,600 days (about half of that). Use these benchmarks only as rough perspective, not as a prediction for any individual.',
    ],
    limitations: [
      'When not to use: For precise legal age determination where the time of birth matters (e.g., some countries define legal age at the exact time of birth, not just the date). For forensic age estimation of unknown individuals (teeth/bone age), use forensic odontology or radiographic bone age assessment instead — chronological age from birthday does not equal biological maturity which varies by individual.',
      'Age calculation depends on the Gregorian calendar system and does not account for historical calendar transitions (e.g., the switch from the Julian calendar in 1582, which varied by country — Great Britain adopted the Gregorian calendar in September 1752, skipping 11 days). For dates before 1582, calendar discrepancies can produce inaccuracies of 10-13 days.',
      'Time zone differences are not considered — the calculator uses the local date only, not the exact time of birth. For someone born in Tokyo at 3:00 AM JST on January 15, the date in New York is still January 14. In rare edge cases where the exact hour matters for legal purposes (citizenship by birth, inheritance cutoff dates), consult a legal professional.',
      'The calculator assumes midnight-to-midnight day boundaries. For preterm infants, the corrected gestational age (weeks since conception, not birth) is used for developmental milestone tracking until age 2. This calculator gives chronological age from birth date, which may differ from corrected age by several weeks for premature babies.',
      'The 10,000-day date counts whole calendar days from the birth date; it does not depend on the time of birth. Different legal systems define "one year" and "reaching an age" differently for specific purposes, so check the definition in your jurisdiction.',
      'The Chinese zodiac animal is looked up from the calendar year of birth. The Chinese year starts at Lunar New Year (between 21 January and 20 February), so people born in January or February before that date belong to the previous animal; the result row warns you in that case. Zodiac signs and animals are cultural entertainment, not science.',
    ],
    quickReference: [
      { label: '1 year (non-leap)', value: '365 days' },
      { label: '1 year (leap year)', value: '366 days' },
      { label: '1 year in weeks', value: '52.14 weeks (52 weeks + 1 day)' },
      { label: '1 year in hours', value: '8,760 hours (8,784 in leap)' },
      { label: '10,000 days milestone', value: '~27 years, 4 months' },
      { label: '20,000 days milestone', value: '~54 years, 9 months' },
      { label: 'US life expectancy at birth (2024)', value: '79.0 years (~28,900 days)' },
      { label: 'Age 18 (legal majority)', value: '6,574-6,575 days' },
      { label: 'Age 65 (Medicare)', value: '23,741-23,742 days' },
      { label: 'Centenarian (100 years)', value: '36,524-36,525 days (24-25 leap days)' },
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
        answer: 'The calculator compares your birth date and reference date component by component. First, subtract the years. Then subtract the months. If the reference day is smaller than the birth day, borrow 1 month and add the number of days in the previous month. If the reference month is smaller than the birth month (after any day borrowing), borrow 1 year and add 12 months. This produces an exact "X years, Y months, Z days" breakdown. When the birth day is later than the length of the previous month, borrowing still leaves a negative day count, so the birthday is clamped to the last day of that month and the real days are counted from there. For example: born January 31, 1990, reference March 1, 2024. Borrowing gives 34 years, 1 month and -1 days, which is invalid. The birthday is clamped to February 29, 2024 (the last day of February), and March 1 is 1 day later: 34 years, 1 month, 1 day.',
      },
      {
        question: 'What happens if I was born on February 29 in a leap year?',
        answer: 'Leaplings (people born on February 29) experience their true birthday only in leap years, which occur every 4 years except century years not divisible by 400. In non-leap years, the calculator treats March 1 as the birthday reference. For example, if you were born February 29, 2000, you turn 26 on March 1, 2026. Which day a leapling legally "turns" a year older in non-leap years differs between jurisdictions (28 February or 1 March), so check the rule for the purpose you need. About 5 million people worldwide are leaplings (roughly 1 in 1,461). The next leap years after 2024 are 2028, 2032, and 2036. The year 2100 will NOT be a leap year (century rule exception), so there is no 29 February between 2096 and 2104.',
      },
      {
        question: 'Why does my age show differently on some websites or calculators?',
        answer: 'Different age calculators handle month boundaries and leap years with varying levels of precision. The most common discrepancy comes from how they handle day borrowing: some use a simple 30-day month average, while others account for the actual number of days in each month (28/29/30/31). Another source of variation is whether calculators count the birthday itself as adding a year. For example, if today is your birthday, some calculators show your new age while others still show last year\'s age until the exact time matches — this is the "inclusive count" vs. "completed years" distinction. Our calculator uses completed years, months, and days, meaning you must have fully reached each unit boundary. A third difference: some calculators round months to 4.35 weeks (365/12/7), introducing small errors that compound over decades. Our date arithmetic uses the exact Gregorian calendar structure (actual month lengths and leap years).',
      },
      {
        question: 'What is the 10,000-day milestone and why does it matter?',
        answer: 'Your 10,000th day alive occurs at approximately age 27 years and 4 months (27.4 years). Counting from day 0 (your birth date), the 10,000th day is the date 10,000 calendar days later. It is a popular "alternative birthday" to celebrate. The 20,000-day milestone arrives at ~54.8 years and 30,000 days at ~82.1 years. Examples: someone born on September 11, 2001 reaches 10,000 days on January 27, 2029, and someone born on June 29, 2007 reaches it on November 14, 2034.',
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
        answer: 'Age calculation rules vary significantly by jurisdiction. In the United States, under common law, a person reaches an age at 12:00:01 AM on their birthday regardless of birth time — the "birthday rule." In South Korea, the traditional system counted you as age 1 at birth and added a year on January 1st regardless of your actual birthday, meaning a baby born December 31 was age 2 the next day. Korea switched to international age counting in June 2023. In Japan, the age of majority was lowered from 20 to 18 in April 2022, but drinking and smoking remain at age 20. In Iran and Saudi Arabia, the lunar Hijri calendar is used for some legal purposes, with Hijri years being ~354 days (about 11 days shorter than Gregorian years), meaning age milestones are reached roughly 3% earlier. For international legal matters, always consult an attorney familiar with the specific jurisdiction.',
      },
    ],
    citations: [
      { source: 'NIST - Time and Calendar', url: 'https://www.nist.gov/pml/time-and-frequency-division' },
      { source: 'Social Security Administration - Retirement Age', url: 'https://www.ssa.gov/benefits/retirement/planner/agereduction.html' },
      { source: 'CDC - Developmental Milestones', url: 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html' },
      { source: 'NCHS Data Brief 548 - Mortality in the United States, 2024', url: 'https://www.cdc.gov/nchs/products/databriefs/db548.htm' },
      { source: 'timeanddate.com - Age Calculator', url: 'https://www.timeanddate.com/date/age-calculator.html' },
    ],
  },
};

export default ageCalculatorConfig;
