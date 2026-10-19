import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import DatePanel from './DatePanel';
import { addDays, daysBetween, isLeapYear, parseIsoDate } from '../../../utils/dates';
import { parseIntegerStrict } from '../../../utils/rational';
import type { ExplainStep } from '../../../types/calculator';
import { hasAnswer, resultValue } from '../../../utils/explainResults';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "Mar 3, 2025" (fixed English format, so server and browser agree). */
const fmtDate = (d: Date): string => `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

const daysInMonth = (y: number, m0: number): number => [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m0];

/**
 * Add whole calendar months with month-end clamping, as Excel EDATE, Python dateutil, Java plusMonths and .NET AddMonths do:
 * 31 Jan + 1 month = 28 Feb (29 in a leap year), 29 Feb 2024 + 1 year = 28 Feb 2025. (JavaScript's own setMonth would roll over to 3 Mar.)
 */
function addMonthsClamped(d: Date, months: number): { date: Date; clamped: boolean } {
  const total = d.getFullYear() * 12 + d.getMonth() + months;
  const y = Math.floor(total / 12);
  const m = total - y * 12;
  const dim = daysInMonth(y, m);
  const day = Math.min(d.getDate(), dim);
  const out = new Date(2000, 0, 1);
  out.setFullYear(y, m, day); // setFullYear keeps years 0-99 from being read as 1900-1999
  return { date: out, clamped: day !== d.getDate() };
}

const isWeekday = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6;

/**
 * n business days (Mon-Fri) after (dir = 1) or before (dir = -1) a date, in O(1) in n: 5 business days are exactly 7 calendar
 * days from any weekday, so only the n % 5 remainder is walked. A weekend start counts from the neighbouring weekday, so
 * Saturday + 1 business day is Monday. n = 0 returns the date unchanged.
 */
function shiftBusinessDays(start: Date, n: number, dir: 1 | -1): Date {
  if (n === 0) return start;
  let base = start;
  while (!isWeekday(base)) base = addDays(base, -dir); // back to the Friday before (adding) / forward to the Monday after (subtracting)
  let r = addDays(base, dir * Math.floor(n / 5) * 7);
  let rem = n % 5;
  while (rem > 0) {
    r = addDays(r, dir);
    if (isWeekday(r)) rem--;
  }
  return r;
}

const LIMITS = { years: 9999, months: 119988, weeks: 521775, days: 3652425 } as const;
const err = (value: string): CalculatorResult[] => [{ id: 'error', label: 'Error', value, color: 'negative' }];

/** Blank counts as 0; anything that is not a whole number within the limit is null. */
function parseCount(raw: string | undefined, max: number): number | null {
  if ((raw ?? '').trim() === '') return 0;
  const n = parseIntegerStrict(raw, 9);
  return n !== null && n >= 0n && n <= BigInt(max) ? Number(n) : null;
}

const dateCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'startDate',
      label: 'Start Date',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
      required: true,
      inputMode: 'text',
      helpText: 'Enter the starting date in YYYY-MM-DD format',
    },
    {
      id: 'action',
      label: 'Action',
      type: 'select',
      options: [
        { label: 'Add', value: 'add' },
        { label: 'Subtract', value: 'subtract' },
      ],
      helpText: 'Choose to add or subtract time from the start date',
    },
    {
      id: 'years',
      label: 'Years',
      type: 'number',
      placeholder: '0',
      min: 0,
      max: LIMITS.years,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Number of years to add or subtract',
    },
    {
      id: 'months',
      label: 'Months',
      type: 'number',
      placeholder: '0',
      min: 0,
      max: LIMITS.months,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Number of months to add or subtract',
    },
    {
      id: 'weeks',
      label: 'Weeks',
      type: 'number',
      placeholder: '0',
      min: 0,
      max: LIMITS.weeks,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Number of weeks to add or subtract (in business-day mode a week is 5 business days)',
    },
    {
      id: 'days',
      label: 'Days',
      type: 'number',
      placeholder: '0',
      min: 0,
      max: LIMITS.days,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Number of days to add or subtract',
    },
    {
      id: 'businessDays',
      label: 'Include Weekends?',
      type: 'select',
      options: [
        { label: 'All days (incl. weekends)', value: 'all' },
        { label: 'Business days only (Mon-Fri)', value: 'business' },
      ],
      helpText: 'Choose whether the weeks and days count all days or weekdays only (years and months are always calendar units)',
    },
  ],
  calculate: (values): CalculatorResult[] => {
    const start = parseIsoDate(values.startDate); // strict: rejects 2025-02-31 and 25-1-5
    if (!start) return [];

    const years = parseCount(values.years, LIMITS.years);
    const months = parseCount(values.months, LIMITS.months);
    const weeks = parseCount(values.weeks, LIMITS.weeks);
    const days = parseCount(values.days, LIMITS.days);
    if (years === null || months === null || weeks === null || days === null) {
      return err(`Enter whole numbers within range: years up to ${LIMITS.years}, months up to ${LIMITS.months}, weeks up to ${LIMITS.weeks}, days up to ${LIMITS.days}.`);
    }

    const sign = values.action === 'subtract' ? -1 : 1;
    const business = values.businessDays === 'business';

    // 1) calendar years and months (end-of-month clamped), 2) then weeks and days
    const ym = addMonthsClamped(start, sign * (years * 12 + months));
    if (ym.date.getFullYear() < 100 || ym.date.getFullYear() > 9999) {
      return err('The result falls outside the supported years 100 to 9999.');
    }
    let result = ym.date;
    const dayCount = business ? weeks * 5 + days : weeks * 7 + days;
    result = business ? shiftBusinessDays(result, dayCount, sign === 1 ? 1 : -1) : addDays(result, sign * dayCount);

    if (result.getFullYear() < 100 || result.getFullYear() > 9999) {
      return err('The result falls outside the supported years 100 to 9999.');
    }

    const elapsed = Math.abs(daysBetween(start, result));
    const rows: CalculatorResult[] = [
      { id: 'resultDate', label: 'Result Date', value: fmtDate(result), highlight: true, color: 'positive' },
      { id: 'dayOfWeek', label: 'Day of Week', value: DAY_NAMES[result.getDay()] },
      { id: 'daysAdded', label: sign === 1 ? 'Calendar Days Added' : 'Calendar Days Subtracted', value: String(elapsed) },
      { id: 'mode', label: 'Mode', value: business ? 'Business Days (Mon-Fri)' : 'All Days' },
      { id: 'startDate', label: 'Start Date', value: fmtDate(start) },
    ];
    if (ym.clamped) {
      rows.push({
        id: 'monthEndNote',
        label: 'Month-end adjustment',
        value: `${MONTH_ABBR[start.getMonth()]} ${start.getDate()} does not exist in ${MONTH_ABBR[ym.date.getMonth()]} ${ym.date.getFullYear()}, so the date was moved to its last day (${ym.date.getDate()}) before weeks and days were applied.`,
      });
    }
    return rows;
  },
  explainSteps: (values) => {
    const rows = dateCalculatorConfig.calculate(values);
    if (!hasAnswer(rows)) return [];
    const g = (id: string) => resultValue(rows, id) ?? '';
    const start = parseIsoDate(values.startDate);
    const years = parseCount(values.years, LIMITS.years);
    const months = parseCount(values.months, LIMITS.months);
    const weeks = parseCount(values.weeks, LIMITS.weeks);
    const days = parseCount(values.days, LIMITS.days);
    if (!start || years === null || months === null || weeks === null || days === null) return [];
    const sign = values.action === 'subtract' ? -1 : 1;
    const business = values.businessDays === 'business';
    const verb = sign === 1 ? 'Add' : 'Subtract';
    const op = sign === 1 ? '+' : '−';
    const unit = (n: number, u: string) => `${n} ${u}${n === 1 ? '' : 's'}`;
    const ym = addMonthsClamped(start, sign * (years * 12 + months));
    const dayCount = business ? weeks * 5 + days : weeks * 7 + days;
    const out: ExplainStep[] = [{ label: 'Start date', expr: fmtDate(start) }];
    if (years || months) {
      out.push({
        label: `${verb} the years and months on the calendar`,
        expr: `${fmtDate(start)} ${op} ${[years && unit(years, 'year'), months && unit(months, 'month')].filter(Boolean).join(' ')} = ${fmtDate(ym.date)}`,
        note: g('monthEndNote') || 'If the day does not exist in the new month it moves to that month’s last day.',
      });
    }
    if (weeks || days) {
      out.push({
        label: business ? `${verb} the business days (a week counts as 5)` : `${verb} the weeks and days (a week is 7 days)`,
        expr: `${fmtDate(ym.date)} ${op} ${unit(dayCount, business ? 'business day' : 'day')} = ${g('resultDate')}`,
      });
    }
    out.push({ label: 'Result', expr: `${g('resultDate')} (${g('dayOfWeek')})`, note: `${g('daysAdded')} calendar days ${sign === 1 ? 'after' : 'before'} the start date.` });
    return out;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DatePanel, { values, results });
  },
  educational: {
    formula: 'Result = StartDate ± (Years + Months + Weeks + Days)',
    formulaDescription:
      'Add or subtract a combination of years, months, weeks, and days from a start date using Gregorian calendar arithmetic. Years and months are applied first and clamped to the end of the month when the target day does not exist: January 31 + 1 month = February 28 (29 in a leap year) and February 29, 2024 + 1 year = February 28, 2025. Weeks and days are applied afterwards. When using business days mode, weekends (Saturday and Sunday) are skipped and only weekdays count, so the result always lands on a weekday.',
    variables: [
      {
        symbol: 'StartDate',
        name: 'Start Date',
        description: 'The base date from which to add or subtract time, in YYYY-MM-DD format.',
      },
    ],
    howToUse: [
      'Enter a start date in YYYY-MM-DD format (e.g., 2024-01-15 for January 15, 2024).',
      'Choose whether to add or subtract time from the start date using the radio buttons.',
      'Enter the number of years, months, weeks, and/or days to adjust by — any combination is supported.',
      'Select whether to count calendar days (including weekends) or business days only (Monday-Friday).',
      'Review the resulting date, along with the day of week and total days adjusted.',
    ],
    explanation:
      'This calculator lets you add or subtract years, months, weeks, and days from any date using Gregorian calendar arithmetic. Years and months are applied first. When the target day does not exist in the target month, the result is clamped to the last day of that month: adding 1 month to January 31 gives February 28 (29 in a leap year), the same convention as Excel EDATE, Python dateutil and Java plusMonths. Weeks and days are applied afterwards. Leap years are handled automatically — years divisible by 4 (except century years not divisible by 400) have a 29-day February. Business day mode is particularly useful for project planning, contract deadlines, and legal timelines where weekends don\'t count toward progress. Note that the business day mode only skips Saturdays and Sundays — it does not account for public holidays.',
    quickReference: [
      { label: '30 days from Jan 1', value: 'Jan 31 (+30 calendar days)' },
      { label: '90 days from today', value: 'Use +90 calendar days for 90-day forecasts' },
      { label: '1 month from Jan 31', value: 'Feb 28 (29 in a leap year): clamped to month end' },
      { label: '5 business days (Mon-Fri)', value: 'The same weekday one week later (skips Sat-Sun)' },
      { label: '1 year from Feb 29, 2024', value: 'Feb 28, 2025 (clamped to month end)' },
      { label: '40 weeks from date', value: 'Enter 40 in weeks field (common pregnancy term)' },
      { label: '2 weeks notice', value: '14 calendar days from resignation date' },
      { label: '60-day return window', value: '+60 calendar days from purchase date' },
    ],
    commonUses: [
      'Project management deadlines — calculating deliverable dates by adding business days while skipping weekends for accurate sprint planning and milestone tracking.',
      'Legal and contract timelines — determining filing deadlines, notice periods, and contract expiration dates where business days are specified by law or agreement.',
      'Event planning — finding dates for weddings, conferences, and reunions by counting forward or backward from known anchor dates with complex offset combinations.',
      'Medical and health tracking — estimating due dates (40 weeks from LMP), medication schedules (every 90 days), and recovery milestones after procedures.',
      'Financial planning — calculating loan maturity dates, CD maturity, bill due dates, paycheck schedules, and tax filing deadlines that fall on specific offsets from known dates.',
    ],
    workedExamples: [
      {
        scenario: 'Marcus, a project manager, starts a software development sprint on Monday, March 3, 2025. The sprint is 10 business days long. He needs to know the exact end date to schedule the sprint review meeting and notify stakeholders.',
        inputs: { startDate: '2025-03-03', action: 'add', years: '0', months: '0', weeks: '0', days: '10', businessDays: 'business' },
        result: 'Mar 17, 2025',
        insight: 'The start day is not counted, so the first business day is Tuesday 3/4: Tue 3/4 (1), Wed 3/5 (2), Thu 3/6 (3), Fri 3/7 (4), Mon 3/10 (5), Tue 3/11 (6), Wed 3/12 (7), Thu 3/13 (8), Fri 3/14 (9), Mon 3/17 (10). Ten business days after Monday, March 3 is Monday, March 17, 2025 (two calendar weeks later); the weekends of March 8-9 and 15-16 are skipped. If the sprint should instead END on Friday, March 14 (the start day counts as day 1), enter 9 business days.',
      },
      {
        scenario: 'Aisha signed a 6-month apartment lease starting January 31, 2025. The lease automatically converts to month-to-month after the initial term. She needs to know the exact end date of her initial 6-month term so she can give proper 30-day notice.',
        inputs: { startDate: '2025-01-31', action: 'add', years: '0', months: '6', weeks: '0', days: '0', businessDays: 'all' },
        result: 'Jul 31, 2025',
        insight: 'Months are added with month-end clamping: Jan 31 + 6 months lands on July 31, 2025, a month that has 31 days, so no adjustment is needed. (Adding just 1 month would give February 28, 2025, because February has no 31st.) Some leases define the term end as the day before the same date, July 30; check the lease wording, because the calculator returns the matching day of the month.',
      },
      {
        scenario: 'Dr. Rivera, an OB-GYN, needs to calculate a patient\'s estimated due date. The patient\'s last menstrual period (LMP) started on October 15, 2024. The standard Naegele\'s rule adds 280 days (40 weeks) from LMP.',
        inputs: { startDate: '2024-10-15', action: 'add', years: '0', months: '0', weeks: '40', days: '0', businessDays: 'all' },
        result: 'Jul 22, 2025',
        insight: 'Adding 280 days (40 weeks) to October 15, 2024: 40 weeks × 7 = 280 calendar days. Counting forward: Oct 15 + 16 remaining Oct days = Oct 31. Then November (30) + December (31) + January (31) + February (28 in 2025) + March (31) + April (30) + May (31) + June (30) + July (22) = July 22, 2025. The estimated due date is July 22, 2025. Note this is an estimate — only about 4% of babies are born exactly on their due date. Most arrive within ±2 weeks. The calculator\'s week input makes this calculation straightforward: just enter 40 weeks.',
      },
    ],
    proTips: [
      'Always use business days mode when calculating legal, contract, or project deadlines — "10 days" in a contract almost always means 10 business days, which is actually 14 calendar days across two full weeks including weekends.',
      'When adding months to dates near month boundaries (29th, 30th, 31st), remember the result is clamped to the last day of the target month: January 31 + 1 month = February 28, but January 31 + 2 months = March 31 (the day is restored whenever the month is long enough because months are always added to the original date). If you need a different rule, such as always the 30th, use day-based arithmetic instead of month arithmetic.',
      'For pregnancy due date calculations, add 40 weeks from the first day of the last menstrual period (LMP). This is Naegele\'s rule, the standard method used by obstetricians worldwide. The due date is an estimate — full-term delivery occurs anywhere between 37 and 42 weeks.',
      'Combine weeks and days for natural language conversions — "two and a half weeks" is 2 weeks + 3 or 4 days. Similarly, "a month and a week" is 1 month + 1 week. Breaking down complex offsets into the correct fields produces more accurate results than trying to count total days.',
      'For age calculation, subtract the birth date from today\'s date (use subtract mode with years). For precise age, subtract years first, then check if the birthday has occurred this year by comparing months and days — if not, subtract one more year.',
      'When planning around holidays, use business days mode to get a weekday result, then manually check a holiday calendar. The calculator skips weekends but does not know about federal holidays, bank holidays, or company-specific closure days.',
    ],
    limitations: [
      'This calculator performs standard Gregorian calendar arithmetic suitable for project planning, legal deadlines, and everyday date calculations. It does not account for public holidays, bank holidays, or company-specific non-working days — business day mode only skips Saturdays and Sundays.',
      'Historical dates before October 15, 1582 (the adoption of the Gregorian calendar) may not align correctly, and different countries adopted the Gregorian calendar at different times (e.g., Russia in 1918, Greece in 1923). The calculator applies the Gregorian leap-year rule itself, so leap years are handled correctly (years divisible by 4, except centuries not divisible by 400), and it supports the years 100 to 9999.',
      'Dates must lie between the years 100 and 9999. The calendar assumes a continuous Gregorian calendar even for dates before its historical adoption — this is the "proleptic Gregorian calendar" convention used in ISO 8601.',
      'When not to use this calculator: for astronomical calculations requiring Julian Date or ephemeris time, for historical research requiring Julian-to-Gregorian calendar conversion, for high-precision timekeeping requiring leap second accounting, or for legal deadlines where specific jurisdictional holiday calendars must be observed.',
    ],
    faqs: [
      {
        question: 'What is the difference between business days and calendar days?',
        answer: 'Calendar days include every day of the week (Monday through Sunday). Business days only count Monday through Friday, excluding weekends (Saturday and Sunday). When selecting "Business days only," the calculator skips weekends when counting the number of days to add or subtract. This is commonly used in legal, financial, and project management contexts where work only happens on weekdays.',
      },
      {
        question: 'What happens if the result falls on a weekend in business days mode?',
        answer: 'When using business days mode, the result will always land on a weekday (Monday through Friday) because weekends are skipped during the count. Starting from a Monday and adding 5 business days lands on the following Monday (not the Saturday 5 calendar days later). This ensures the result date is always a valid business day, which is essential for contract deadlines, court filing dates, and delivery estimates that specify "business days."',
      },
      {
        question: 'How is month-end handling (e.g., January 31 + 1 month) resolved?',
        answer: 'Adding months to dates near month boundaries follows the "last day of month" convention (as in Excel EDATE, Python dateutil and Java plusMonths), not JavaScript\'s own rollover behaviour. January 31 plus 1 month gives February 28 or 29 (the last valid day of February), not March 3. Similarly, March 31 minus 1 month gives February 28 or 29. This is the standard convention used in financial calculations and most programming date libraries, and it prevents invalid dates such as February 31 from silently rolling into March. A note under the result tells you when the date was moved.',
      },
      {
        question: 'How do I calculate someone\'s age precisely?',
        answer: 'To calculate age: enter the birth date as the start date, choose "Subtract," set the action to subtract years equal to the current year minus birth year, then check if the birthday has occurred yet this year. For example, if today is June 15, 2025 and the birth date is August 20, 1990: subtract 35 years from June 15, 2025 = June 15, 1990. Since August 20 has not yet occurred in 2025, the person is still 34. A simpler method: use years=0 but calculate the difference manually by subtracting months and days incrementally. For precise age in years-months-days, subtract the birth year from the current year, then adjust by 1 if the current month/day is before the birth month/day.',
      },
      {
        question: 'Can I calculate a date 90 days from today?',
        answer: 'Yes. Enter today\'s date in YYYY-MM-DD format as the start date, choose "Add," and enter 90 in the days field with 0 in all other fields. Leave the mode on "All days" to count calendar days including weekends. The result will show you the date exactly 90 calendar days from your start date. This is commonly used for return policies, warranty periods, visa application deadlines, and medical follow-up scheduling. For business contexts where 90 "working days" are specified, switch to business days mode — note that 90 business days is approximately 126 calendar days (about 18 weeks).',
      },
      {
        question: 'How does the calculator account for leap years?',
        answer: 'The calculator uses JavaScript\'s built-in Date object, which fully implements the Gregorian calendar\'s leap year rules: a year is a leap year if it is divisible by 4, except for century years which must be divisible by 400. So 2000 was a leap year (divisible by 400), but 1900 was not (divisible by 100 but not 400). 2024 was a leap year with February having 29 days. When you add 1 year to February 29, 2024, the result is February 28, 2025 (since 2025 is not a leap year). Adding or subtracting across February in a leap year automatically accounts for the extra day. For example, 60 days from January 1, 2024 lands on March 1 (because February has 29 days in 2024), but 60 days from January 1, 2025 lands on March 2 (because February has only 28 days in 2025).',
      },
    ],
    citations: [
      { source: 'Wikipedia - Calendar Date', url: 'https://en.wikipedia.org/wiki/Calendar_date' },
      { source: 'NIST - Time and Frequency Division', url: 'https://www.nist.gov/time-frequency' },
      { source: 'ISO 8601 - Date and Time Format', url: 'https://en.wikipedia.org/wiki/ISO_8601' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Date Arithmetic</text><rect x="10" y="30" width="300" height="105" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="30" y="52" font-size="11" fill="var(--svg-555555)">April 2024</text><text x="170" y="52" text-anchor="middle" font-size="10" fill="var(--svg-888888)" font-weight="bold">S  M  T  W  T  F  S</text><rect x="84" y="60" width="22" height="18" rx="2" fill="var(--svg-3b82f6)"/><text x="95" y="74" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)" font-weight="bold">1</text><text x="117" y="74" text-anchor="middle" font-size="9" fill="var(--svg-333333)">2</text><text x="139" y="74" text-anchor="middle" font-size="9" fill="var(--svg-333333)">3</text><text x="161" y="74" text-anchor="middle" font-size="9" fill="var(--svg-333333)">4</text><text x="183" y="74" text-anchor="middle" font-size="9" fill="var(--svg-333333)">5</text><text x="205" y="74" text-anchor="middle" font-size="9" fill="var(--svg-333333)">6</text><text x="227" y="74" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)">7</text><text x="70" y="92" text-anchor="middle" font-size="9" fill="var(--svg-333333)">7</text><text x="95" y="92" text-anchor="middle" font-size="9" fill="var(--svg-333333)">8</text><text x="117" y="92" text-anchor="middle" font-size="9" fill="var(--svg-333333)">9</text><text x="139" y="92" text-anchor="middle" font-size="9" fill="var(--svg-333333)">10</text><text x="161" y="92" text-anchor="middle" font-size="9" fill="var(--svg-333333)">11</text><text x="183" y="92" text-anchor="middle" font-size="9" fill="var(--svg-333333)">12</text><text x="205" y="92" text-anchor="middle" font-size="9" fill="var(--svg-333333)">13</text><text x="227" y="92" text-anchor="middle" font-size="9" fill="var(--svg-333333)">14</text><text x="70" y="110" text-anchor="middle" font-size="9" fill="var(--svg-333333)">14</text><text x="95" y="110" text-anchor="middle" font-size="9" fill="var(--svg-333333)">15</text><rect x="115" y="98" width="24" height="18" rx="2" fill="var(--svg-ef4444)" opacity="0.15" stroke="var(--svg-ef4444)" stroke-width="1.5" stroke-dasharray="3"/><text x="127" y="110" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)" font-weight="bold">17</text><text x="161" y="110" text-anchor="middle" font-size="9" fill="var(--svg-333333)">18</text><text x="183" y="110" text-anchor="middle" font-size="9" fill="var(--svg-333333)">19</text><text x="205" y="110" text-anchor="middle" font-size="9" fill="var(--svg-333333)">20</text><text x="227" y="110" text-anchor="middle" font-size="9" fill="var(--svg-333333)">21</text><line x1="95" y1="64" x2="127" y2="100" stroke="var(--svg-3b82f6)" stroke-width="1" stroke-dasharray="3"/><text x="55" y="67" font-size="9" fill="var(--svg-3b82f6)">Start</text><text x="255" y="103" font-size="9" fill="var(--svg-ef4444)">+16 days</text><text x="160" y="145" text-anchor="middle" font-size="11" fill="var(--svg-555555)">Result = Start Date ± (Years + Months + Weeks + Days)</text><text x="160" y="168" text-anchor="middle" font-size="10" fill="var(--svg-888888)">Business days mode skips weekends (Mon–Fri)</text><text x="160" y="188" text-anchor="middle" font-size="9" fill="var(--svg-888888)">Months: clamps to last valid day (e.g., Jan 31 + 1mo = Feb 28)</text></svg>',
      alt: 'Calendar date arithmetic showing start date and result date with days added',
      caption: 'Date arithmetic adds or subtracts years, months, weeks, and days, with intelligent month-end clamping.',
    },
  },
};

export default dateCalculatorConfig;
