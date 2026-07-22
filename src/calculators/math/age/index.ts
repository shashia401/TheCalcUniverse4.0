import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import AgePanel from './AgePanel';

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const ageCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'birthDate',
      label: 'Date of Birth',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
      required: true,
      helpText: 'Enter your birth date in YYYY-MM-DD format',
    },
    {
      id: 'targetDate',
      label: 'Target Date',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
      helpText: 'Defaults to today if left blank',
    },
  ],
  calculate: (values) => {
    const birthStr = values.birthDate;
    const targetStr = values.targetDate;

    if (!birthStr || !/^\d{4}-\d{2}-\d{2}$/.test(birthStr)) return [];

    const birth = new Date(birthStr + 'T00:00:00');
    if (isNaN(birth.getTime())) return [];

    const target = targetStr && /^\d{4}-\d{2}-\d{2}$/.test(targetStr)
      ? new Date(targetStr + 'T00:00:00')
      : new Date();

    if (birth > target) return [];

    // Compute exact age
    let ageYears = target.getFullYear() - birth.getFullYear();
    let ageMonths = target.getMonth() - birth.getMonth();
    let ageDays = target.getDate() - birth.getDate();

    if (ageDays < 0) {
      ageMonths -= 1;
      const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
      ageDays += prevMonth.getDate();
    }
    if (ageMonths < 0) {
      ageYears -= 1;
      ageMonths += 12;
    }

    const totalDays = Math.floor((target.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = ageYears * 12 + ageMonths;
    const totalHours = totalDays * 24;

    // Next birthday
    const nextBirthday = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBirthday <= target) {
      nextBirthday.setFullYear(target.getFullYear() + 1);
    }
    const daysUntilBirthday = Math.round((nextBirthday.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    const birthDisplay = fmtDate(birth);
    const targetDisplay = fmtDate(target);

    return [
      {
        id: 'age',
        label: 'Exact Age',
        value: `${ageYears} years ${ageMonths} months ${ageDays} days`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'totalMonths',
        label: 'Total Months',
        value: String(totalMonths),
      },
      {
        id: 'totalWeeks',
        label: 'Total Weeks',
        value: String(totalWeeks),
      },
      {
        id: 'totalDays',
        label: 'Total Days',
        value: String(totalDays),
      },
      {
        id: 'totalHours',
        label: 'Total Hours',
        value: String(totalHours),
      },
      {
        id: 'daysUntilBirthday',
        label: 'Days Until Next Birthday',
        value: String(daysUntilBirthday),
      },
      {
        id: 'birthDate',
        label: 'Birth Date',
        value: birthDisplay,
      },
      {
        id: 'targetDate',
        label: 'Target Date',
        value: targetDisplay,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(AgePanel, { values, results });
  },
  educational: {
    formula: 'Age = TargetDate − BirthDate',
    formulaDescription:
      'The age is calculated by subtracting the birth date from the target date, carefully accounting for varying month lengths and leap years. Unlike a simple day-count, calendar age tracks the number of complete years, then complete months within the remaining partial year, then remaining days — which is how we naturally express age in everyday language ("5 years, 3 months, and 12 days old").',
    variables: [
      {
        symbol: 'Age',
        name: 'Age',
        description: 'The time elapsed between birth date and target date, expressed in years, months, and days for the primary display.',
      },
    ],
    howToUse: [
      'Enter the birth date in YYYY-MM-DD format (e.g., 1990-05-15 for May 15, 1990).',
      'Optionally enter a target date in YYYY-MM-DD format, or leave blank to use today\'s date.',
      'View your exact age in years, months, and days, plus totals in months, weeks, days, and hours for a complete perspective.',
    ],
    explanation:
      'This calculator computes the exact age in years, months, and days by carefully tracking boundaries between months and correcting for month-length differences. It also shows the age expressed in total months, weeks, days, and hours — a perspective that reveals just how much time has passed. For example, a person who is 30 years old has lived approximately 10,950 days, 262,800 hours, or 15,768,000 minutes. The calculator also handles leap day birthdays (February 29) correctly: in non-leap years, February 29 is treated as March 1 for legal purposes such as driver\'s license eligibility and contract age requirements.',
    faqs: [
      {
        question: 'Why do total months, weeks, days, and hours differ from the "years/months/days" display?',
        answer: 'The "Exact Age" shows the calendar difference in whole years, months, and remaining days. Total months, weeks, days, and hours are conversions of the total elapsed time into those single units, resulting in much larger numbers that better illustrate just how much time has passed. For example, a 30-year-old has lived approximately 360 months, 1,565 weeks, 10,957 days, or 262,968 hours — numbers that put the passage of time into meaningful perspective.',
      },
      {
        question: 'How are leap years handled?',
        answer: 'The calculator uses JavaScript\'s Date object which correctly handles leap years. February 29 birthdays are handled properly — in non-leap years, the birthday is treated as March 1 for the purpose of calculating days until the next birthday. This matches the legal convention used by many jurisdictions for determining age milestones such as voting eligibility, driving age, and drinking age for people born on February 29.',
      },
      {
        question: 'What is the "Next Birthday" calculation?',
        answer: 'The next birthday is computed by taking the birth month and day and advancing to the next year (or the current year if the birthday has not yet passed). The days remaining count shows how long until the next birthday celebration. This uses the same month-length and leap-year logic as the main age calculation.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Age', url: 'https://en.wikipedia.org/wiki/Age' },
      { source: 'CDC - National Center for Health Statistics', url: 'https://www.cdc.gov/nchs/' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Age Timeline</text><line x1="20" y1="55" x2="300" y2="55" stroke="var(--svg-dddddd)" stroke-width="3"/><circle cx="30" cy="55" r="10" fill="var(--svg-3b82f6)"/><text x="30" y="59" text-anchor="middle" font-size="8" fill="var(--svg-ffffff)">B</text><text x="30" y="78" text-anchor="middle" font-size="9" fill="var(--svg-555555)" font-weight="bold">Birth</text><text x="30" y="90" text-anchor="middle" font-size="8" fill="var(--svg-888888)">1990-05-15</text><circle cx="170" cy="55" r="8" fill="var(--svg-3b82f6)" opacity="0.5"/><text x="170" y="59" text-anchor="middle" font-size="7" fill="var(--svg-ffffff)">30</text><text x="170" y="78" text-anchor="middle" font-size="9" fill="var(--svg-555555)">Age 30</text><text x="170" y="90" text-anchor="middle" font-size="8" fill="var(--svg-888888)">2020</text><circle cx="290" cy="55" r="10" fill="var(--svg-ef4444)"/><text x="290" y="59" text-anchor="middle" font-size="8" fill="var(--svg-ffffff)">N</text><text x="290" y="78" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)" font-weight="bold">Now</text><text x="290" y="90" text-anchor="middle" font-size="8" fill="var(--svg-888888)">Today</text><rect x="15" y="108" width="290" height="82" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="128" text-anchor="middle" font-size="11" fill="var(--svg-555555)" font-weight="bold">Age = TargetDate − BirthDate</text><text x="20" y="148" font-size="10" fill="var(--svg-333333)">Exact age: 34 years 11 months 12 days</text><line x1="20" y1="154" x2="300" y2="154" stroke="var(--svg-eeeeee)" stroke-width="1"/><text x="20" y="170" font-size="10" fill="var(--svg-333333)">Total days lived:</text><text x="310" y="170" text-anchor="end" font-size="10" fill="var(--svg-3b82f6)" font-weight="bold">~12,775</text><line x1="20" y1="177" x2="300" y2="177" stroke="var(--svg-eeeeee)" stroke-width="1"/><text x="20" y="188" font-size="10" fill="var(--svg-333333)">Next birthday in:</text><text x="310" y="188" text-anchor="end" font-size="10" fill="var(--svg-3b82f6)">18 days</text></svg>',
      alt: 'Age timeline from birth to present showing milestones and total days',
      caption: 'Age is calculated as the calendar difference between birth date and target date in years, months, and days.',
    },
  },
};

export default ageCalculatorConfig;
