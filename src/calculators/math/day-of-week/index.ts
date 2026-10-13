import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import DayOfWeekPanel from './DayOfWeekPanel';
import { isLeapYear } from '../../../utils/dates';
import { parseIntegerStrict } from '../../../utils/rational';

/* ------------------------------------------------------------------ */
/*  Zeller's Congruence                                                */
/* ------------------------------------------------------------------ */

/**
 * Day of the week by Zeller's Congruence for the (proleptic) Gregorian calendar.
 * Returns 0=Saturday, 1=Sunday, 2=Monday, ..., 6=Friday.
 *   h = (q + floor(13(m+1)/5) + K + floor(K/4) + floor(J/4) - 2J) mod 7
 * with q the day, m the month (March = 3 ... February = 14, January and February counting as months 13 and 14 of
 * the previous year), K = year mod 100 and J = floor(year / 100). Pure integer arithmetic: no Date object, so there is
 * no 1900 + yy mapping for years 0-99 and no time-zone dependence.
 */
function zellersCongruence(q: number, m: number, y: number): number {
  if (m < 3) {
    m += 12;
    y -= 1;
  }
  const K = y % 100;
  const J = Math.floor(y / 100);
  const h = (q + Math.floor((13 * (m + 1)) / 5) + K + Math.floor(K / 4) + Math.floor(J / 4) - 2 * J) % 7;
  return ((h % 7) + 7) % 7; // JavaScript's % can be negative
}

const DAY_NAMES = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const daysInMonth = (year: number, month: number): number =>
  month === 2 ? (isLeapYear(year) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;

/** Last year the calculator accepts (4-digit years; matches the other date tools). */
export const MAX_YEAR = 9999;

/* ------------------------------------------------------------------ */
/*  Day of Week calculator config                                      */
/* ------------------------------------------------------------------ */

const dayOfWeekConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'month',
      label: 'Month',
      type: 'number',
      placeholder: '3',
      min: 1,
      max: 12,
      step: 1,
      inputMode: 'numeric',
      required: true,
      helpText: 'Enter month as a number (1 = January, 12 = December)',
    },
    {
      id: 'day',
      label: 'Day',
      type: 'number',
      placeholder: '15',
      min: 1,
      max: 31,
      step: 1,
      inputMode: 'numeric',
      required: true,
      helpText: 'Enter the day of the month',
    },
    {
      id: 'year',
      label: 'Year',
      type: 'number',
      placeholder: '2024',
      min: 1,
      max: MAX_YEAR,
      step: 1,
      inputMode: 'numeric',
      required: true,
      helpText: 'Enter a year from 1 to 9999 (proleptic Gregorian calendar)',
    },
  ],

  calculate: (values): CalculatorResult[] => {
    const m = parseIntegerStrict(values.month, 3);
    const d = parseIntegerStrict(values.day, 3);
    const y = parseIntegerStrict(values.year, 6);
    if (m === null || d === null || y === null) return [];

    const month = Number(m);
    const day = Number(d);
    const year = Number(y);
    if (month < 1 || month > 12 || year < 1 || year > MAX_YEAR) return [];
    // A date that does not exist (Feb 30, Apr 31, Feb 29 in a common year) has no weekday
    if (day < 1 || day > daysInMonth(year, month)) return [];

    const dowIndex = zellersCongruence(day, month, year);
    const dayName = DAY_NAMES[dowIndex];
    const formattedDate = `${dayName}, ${MONTH_NAMES[month - 1]} ${day}, ${year}`;

    // Compute Zeller's variables for display
    let zellerMonth = month;
    let zellerYear = year;
    if (month < 3) {
      zellerMonth = month + 12;
      zellerYear = year - 1;
    }
    const K = zellerYear % 100;
    const J = Math.floor(zellerYear / 100);
    const q = day;
    const mm = zellerMonth;

    const term1 = Math.floor((13 * (mm + 1)) / 5);
    const term2 = K;
    const term3 = Math.floor(K / 4);
    const term4 = Math.floor(J / 4);
    const term5 = 2 * J;

    const rawH = q + term1 + term2 + term3 + term4 - term5;

    const rows: CalculatorResult[] = [
      { id: 'dayOfWeek', label: 'Day of the Week', value: dayName, highlight: true, color: 'positive' },
      { id: 'formattedDate', label: 'Date', value: formattedDate },
      { id: 'month', label: 'Month', value: String(month) },
      { id: 'day', label: 'Day', value: String(day) },
      { id: 'year', label: 'Year', value: String(year) },
      { id: 'zellersFormula', label: "Zeller's Congruence", value: 'h = (q + ⌊13(m+1)/5⌋ + K + ⌊K/4⌋ + ⌊J/4⌋ − 2J) mod 7' },
      { id: 'zellersResult', label: 'Zeller Result (h)', value: `${dowIndex} → ${dayName}` },
      {
        id: 'zellersBreakdown',
        label: 'Formula Breakdown',
        value: `q=${q}, m=${mm}, K=${K}, J=${J} → h = (${q} + ${term1} + ${term2} + ${term3} + ${term4} − ${term5}) mod 7 = ${rawH} mod 7 = ${dowIndex}`,
      },
      { id: 'firstDayOfMonth', label: 'First Day of Month', value: DAY_NAMES[zellersCongruence(1, month, year)] },
      { id: 'daysInMonth', label: 'Days in Month', value: String(daysInMonth(year, month)) },
    ];

    // Before the Gregorian reform (15 October 1582) the Julian calendar was in use in Catholic Europe, and later elsewhere
    if (year < 1582 || (year === 1582 && (month < 10 || (month === 10 && day < 15)))) {
      rows.push({
        id: 'calendarNote',
        label: 'Calendar note',
        value:
          'This date is before the Gregorian calendar was introduced (15 October 1582). The weekday shown extends the Gregorian rules backwards (the proleptic Gregorian calendar of ISO 8601); a date recorded in the Julian calendar at the time falls on a different weekday.',
      });
    }
    return rows;
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DayOfWeekPanel, { values, results });
  },

  educational: {
    formula: 'h = (q + ⌊13(m+1)/5⌋ + K + ⌊K/4⌋ + ⌊J/4⌋ − 2J) mod 7',
    formulaDescription:
      "Zeller's Congruence is a mathematical formula that calculates the day of the week for any given date in the Gregorian calendar. It was developed by German mathematician Christian Zeller in the 1880s. The formula uses modular arithmetic and encodes month lengths, leap year rules, and century adjustments into a single expression. The floor function (⌊⌋) represents integer division (rounding down), which is essential for handling the irregular lengths of months and leap year patterns. The modulo 7 operation produces a result in the range 0-6 that maps directly to days of the week.",
    variables: [
      {
        symbol: 'h',
        name: 'Day of Week Index',
        description: 'The calculated day of the week result (0=Saturday, 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday).',
      },
      {
        symbol: 'q',
        name: 'Day of Month',
        description: 'The day of the month (1-31). For example, December 25 uses q = 25.',
      },
      {
        symbol: 'm',
        name: 'Adjusted Month',
        description: 'Adjusted month number: March=3, April=4, ..., December=12, January=13, February=14 of the previous year.',
      },
      {
        symbol: 'K',
        name: 'Year of the Century',
        description: 'The last two digits of the year (year mod 100). For 2024, K = 24.',
      },
      {
        symbol: 'J',
        name: 'Century',
        description: 'The zero-based century (year divided by 100, rounded down). For 2024, J = 20.',
      },
    ],
    howToUse: [
      'Enter the month as a number (1-12), the day of the month (1-31), and the year as a positive integer.',
      'Click calculate to find the day of the week for that date, like "Wednesday" or "Friday."',
      'View the full day name, formatted date, and the complete Zeller\'s Congruence calculation broken down step by step.',
      'See the month calendar grid highlighting the position of the target date within the month.',
      'Check the "Days in Month" and "First Day of Month" for additional calendar context.',
    ],
    explanation:
      "Zeller's Congruence is a mathematical formula devised by Christian Zeller in 1883 that computes the day of the week for any Gregorian calendar date. It cleverly encodes month lengths, leap year rules, and century adjustments into a single modular arithmetic expression. The reason January and February are treated as months 13 and 14 of the previous year is that this shift places the leap day (February 29) at the end of the calculation cycle, greatly simplifying how the formula handles leap years. Without this adjustment, the formula would need an extra conditional term. The floor functions (represented by ⌊⌋) handle integer division, truncating fractional remainders. When working through the formula manually, each term represents a different calendar correction: the month term accounts for varying month lengths, the year terms account for leap years, and the century term accounts for the Gregorian calendar's century rule (years divisible by 100 are not leap years unless also divisible by 400).",
    faqs: [
      {
        question: 'Why are January and February treated differently in Zeller\'s Congruence?',
        answer: "In Zeller's Congruence, January and February are counted as months 13 and 14 of the previous year. This shift places the leap day (February 29) at the very end of the calculation cycle rather than near the beginning. Because the formula's month term ⌊13(m+1)/5⌋ encodes month lengths, having the irregular February at the end simplifies the arithmetic significantly. Without this adjustment, the formula would need additional conditional logic for leap years.",
      },
      {
        question: 'Does Zeller\'s Congruence work for dates before the Gregorian calendar?',
        answer: 'Zeller\'s Congruence works for any valid date in the Gregorian calendar, which was introduced in 1582 by Pope Gregory XIII. For dates before 1582 (Julian calendar dates), the formula may not produce accurate results. Additionally, different countries adopted the Gregorian calendar at different times — Britain and its colonies adopted it in 1752, Russia in 1918, and Greece in 1923 — so historical dates may be ambiguous.',
      },
      {
        question: 'What do the results h=0 through h=6 mean?',
        answer: 'The result h is a number from 0 to 6 that maps to the day of the week: 0=Saturday, 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday. Note that the cycle starts on Saturday rather than Monday or Sunday because of the historical convention Zeller used. The calculator automatically converts this number to the familiar day name.',
      },
      {
        question: 'How is Zeller\'s Congruence different from the Doomsday algorithm?',
        answer: 'Zeller\'s Congruence is a direct formula that computes the day of the week from the date components using modular arithmetic and floor functions. The Doomsday algorithm, developed by John Conway, uses a different approach based on memorizing certain "anchor" dates (like 4/4, 6/6, 8/8, etc. that always fall on the same day of the week in a given year). Zeller\'s is easier to program into a calculator, while Doomsday is more practical for mental calculation.',
      },
      {
        question: 'Can this calculator handle dates in the Julian calendar?',
        answer: 'This implementation uses Zeller\'s Congruence for the Gregorian calendar (the calendar system used by most of the world today). For Julian calendar dates, a slightly modified version of the formula exists, but it produces different results for the same date. To verify historical dates, check which calendar system was in use in the relevant country at that time.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Determination of the Day of the Week', url: 'https://en.wikipedia.org/wiki/Determination_of_the_day_of_the_week' },
      { source: 'Wikipedia - Doomsday Rule', url: 'https://en.wikipedia.org/wiki/Doomsday_rule' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Zeller\'s Congruence</text><rect x="10" y="30" width="300" height="68" rx="6" fill="var(--svg-eff6ff)" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="160" y="48" text-anchor="middle" font-size="11" fill="var(--svg-3b82f6)" font-weight="bold">h = (q + ⌊13(m+1)/5⌋ + K + ⌊K/4⌋ + ⌊J/4⌋ − 2J) mod 7</text><text x="20" y="66" font-size="9" fill="var(--svg-555555)">h = day index (0=Sat...6=Fri)</text><text x="20" y="80" font-size="9" fill="var(--svg-555555)">q = day of month | m = adj. month (3–14) | K = year%100 | J = century</text><text x="160" y="105" text-anchor="middle" font-size="11" fill="var(--svg-555555)" font-weight="bold">Example: Dec 25, 2024</text><rect x="15" y="115" width="290" height="38" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="20" y="132" font-size="9" fill="var(--svg-333333)">q=25, m=12, K=24, J=20</text><text x="20" y="147" font-size="9" fill="var(--svg-555555)">h = (25+33+24+6+5−40) mod 7 = 53 mod 7 = 4</text><rect x="95" y="158" width="130" height="22" rx="4" fill="var(--svg-3b82f6)"/><text x="160" y="174" text-anchor="middle" font-size="11" fill="var(--svg-ffffff)" font-weight="bold">h=4 → Wednesday</text><text x="160" y="195" text-anchor="middle" font-size="9" fill="var(--svg-888888)">January and February are months 13, 14 of the previous year</text></svg>',
      alt: 'Zeller Congruence formula showing how to calculate day of week',
      caption: 'Zeller\'s Congruence computes the day of the week for any Gregorian calendar date using modular arithmetic.',
    },
  },
};

export default dayOfWeekConfig;
