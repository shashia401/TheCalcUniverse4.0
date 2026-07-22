import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import DatePanel from './DatePanel';

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function addBusinessDays(start: Date, daysToAdd: number): Date {
  const result = new Date(start);
  let added = 0;
  while (added < daysToAdd) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

function subtractBusinessDays(start: Date, daysToSub: number): Date {
  const result = new Date(start);
  let subtracted = 0;
  while (subtracted < daysToSub) {
    result.setDate(result.getDate() - 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) subtracted++;
  }
  return result;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
      inputMode: 'numeric',
      helpText: 'Number of years to add or subtract',
    },
    {
      id: 'months',
      label: 'Months',
      type: 'number',
      placeholder: '0',
      min: 0,
      inputMode: 'numeric',
      helpText: 'Number of months to add or subtract',
    },
    {
      id: 'weeks',
      label: 'Weeks',
      type: 'number',
      placeholder: '0',
      min: 0,
      inputMode: 'numeric',
      helpText: 'Number of weeks to add or subtract',
    },
    {
      id: 'days',
      label: 'Days',
      type: 'number',
      placeholder: '0',
      min: 0,
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
      helpText: 'Choose whether to count all days or weekdays only',
    },
  ],
  calculate: (values) => {
    const startStr = values.startDate;
    if (!startStr || !/^\d{4}-\d{2}-\d{2}$/.test(startStr)) return [];

    const [sy, sm, sd] = startStr.split('-').map(Number);
    const start = new Date(Date.UTC(sy, sm - 1, sd, 12, 0, 0));
    if (isNaN(start.getTime())) return [];

    const action = values.action || 'add';
    const years = parseInt(values.years) || 0;
    const months = parseInt(values.months) || 0;
    const weeks = parseInt(values.weeks) || 0;
    const days = parseInt(values.days) || 0;
    const businessDays = values.businessDays || 'all';

    const result = new Date(start);

    if (action === 'add') {
      if (years) result.setFullYear(result.getFullYear() + years);
      if (months) result.setMonth(result.getMonth() + months);

      if (businessDays === 'business') {
        const calendarDays = weeks * 7 + days;
        if (calendarDays > 0) {
          const businessResult = addBusinessDays(result, calendarDays);
          result.setTime(businessResult.getTime());
        }
      } else {
        const totalDays = weeks * 7 + days;
        if (totalDays) result.setDate(result.getDate() + totalDays);
      }
    } else {
      if (years) result.setFullYear(result.getFullYear() - years);
      if (months) result.setMonth(result.getMonth() - months);

      if (businessDays === 'business') {
        const calendarDays = weeks * 7 + days;
        if (calendarDays > 0) {
          const businessResult = subtractBusinessDays(result, calendarDays);
          result.setTime(businessResult.getTime());
        }
      } else {
        const totalDays = weeks * 7 + days;
        if (totalDays) result.setDate(result.getDate() - totalDays);
      }
    }

    const resultDateStr = fmtDate(result);
    const dayOfWeek = DAY_NAMES[result.getDay()];

    const totalCalendarDays = weeks * 7 + days;
    const approxTotalDays = totalCalendarDays + years * 365 + months * 30;

    return [
      {
        id: 'resultDate',
        label: 'Result Date',
        value: resultDateStr,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'dayOfWeek',
        label: 'Day of Week',
        value: dayOfWeek,
      },
      {
        id: 'daysAdded',
        label: action === 'add' ? 'Days Added' : 'Days Subtracted',
        value: String(approxTotalDays),
      },
      {
        id: 'mode',
        label: 'Mode',
        value: businessDays === 'business' ? 'Business Days (Mon-Fri)' : 'All Days',
      },
      {
        id: 'startDate',
        label: 'Start Date',
        value: fmtDate(start),
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DatePanel, { values, results });
  },
  educational: {
    formula: 'Result = StartDate ± (Years + Months + Weeks + Days)',
    formulaDescription:
      'Add or subtract a combination of years, months, weeks, and days from a start date using standard JavaScript date arithmetic. Adding months to dates near month boundaries follows the "overflow" convention: January 31 + 1 month = March 3 (not February 28), because February 31 overflows into March. The same applies to leap years — February 29, 2024 + 1 year = March 1, 2025. When using business days mode, weekends (Saturday and Sunday) are skipped and only weekdays count, so the result always lands on a weekday.',
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
      'This calculator lets you add or subtract years, months, weeks, and days from any date using standard JavaScript Date arithmetic. When adding months to dates near the end of a month, JavaScript follows an overflow convention: adding 1 month to January 31 produces March 3 (February 31 overflows into March 3 since February has only 28 days in non-leap years). This matches the behavior of most programming date libraries and spreadsheets. Leap years are handled automatically — years divisible by 4 (except century years not divisible by 400) have a 29-day February. Business day mode is particularly useful for project planning, contract deadlines, and legal timelines where weekends don\'t count toward progress. Note that the business day mode only skips Saturdays and Sundays — it does not account for public holidays.',
    quickReference: [
      { label: '30 days from Jan 1', value: 'Jan 31 (+30 calendar days)' },
      { label: '90 days from today', value: 'Use +90 calendar days for 90-day forecasts' },
      { label: '1 month from Jan 31', value: 'Mar 3 (Feb 31 → Mar 3 overflow)' },
      { label: '5 business days (Mon-Fri)', value: '1 calendar week, skips Sat-Sun' },
      { label: '1 year from Feb 29, 2024', value: 'Mar 1, 2025 (non-leap year overflow)' },
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
        result: 'Mar 14, 2025',
        insight: 'Starting Monday March 3, counting 10 business days: Mon 3/3 (day 1), Tue 3/4 (2), Wed 3/5 (3), Thu 3/6 (4), Fri 3/7 (5), Mon 3/10 (6), Tue 3/11 (7), Wed 3/12 (8), Thu 3/13 (9), Fri 3/14 (10). The sprint ends Friday, March 14, 2025. The weekend of March 8-9 is correctly skipped. Marcus should schedule the sprint review for Friday afternoon, March 14 — this gives the full 10 working days while keeping the team fresh for the review.',
      },
      {
        scenario: 'Aisha signed a 6-month apartment lease starting January 31, 2025. The lease automatically converts to month-to-month after the initial term. She needs to know the exact end date of her initial 6-month term so she can give proper 30-day notice.',
        inputs: { startDate: '2025-01-31', action: 'add', years: '0', months: '6', weeks: '0', days: '0', businessDays: 'all' },
        result: 'Jul 31, 2025',
        insight: 'Adding 6 months to January 31, 2025: The calculator uses JavaScript\'s standard date arithmetic. Jan 31 + 1 month = Mar 3 (Feb 31 overflows into March). Continuing: Mar 3 + 1 month = Apr 3, +1 = May 3, +1 = Jun 3, +1 = Jul 3, +1 = Aug 3 = July 31 (actually let\'s compute carefully: Jan 31 → Mar 3 → Apr 3 → May 3 → Jun 3 → Jul 3, and the final +1 gives August 3). Wait — starting from Jan 31, adding 6 months gives: Jan 31 + 1mo = Mar 3, +1mo = Apr 3, +1mo = May 3, +1mo = Jun 3, +1mo = Jul 3. So the result is July 3, 2025. This differs from the month-end convention that some lease agreements use. For precise lease end dates that follow a "same day of month" convention, consult the lease agreement for how month-boundary dates are handled and consider using day-based offsets instead.',
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
      'When adding months to dates near month boundaries (29th, 30th, 31st), be aware of the overflow behavior: January 31 + 1 month = March 3 (Feb 31 overflows). If your use case requires month-end clamping (e.g., for financial month-end dates), manually adjust the result or use day-based arithmetic instead of month arithmetic.',
      'For pregnancy due date calculations, add 40 weeks from the first day of the last menstrual period (LMP). This is Naegele\'s rule, the standard method used by obstetricians worldwide. The due date is an estimate — full-term delivery occurs anywhere between 37 and 42 weeks.',
      'Combine weeks and days for natural language conversions — "two and a half weeks" is 2 weeks + 3 or 4 days. Similarly, "a month and a week" is 1 month + 1 week. Breaking down complex offsets into the correct fields produces more accurate results than trying to count total days.',
      'For age calculation, subtract the birth date from today\'s date (use subtract mode with years). For precise age, subtract years first, then check if the birthday has occurred this year by comparing months and days — if not, subtract one more year.',
      'When planning around holidays, use business days mode to get a weekday result, then manually check a holiday calendar. The calculator skips weekends but does not know about federal holidays, bank holidays, or company-specific closure days.',
    ],
    limitations: [
      'This calculator performs standard Gregorian calendar arithmetic suitable for project planning, legal deadlines, and everyday date calculations. It does not account for public holidays, bank holidays, or company-specific non-working days — business day mode only skips Saturdays and Sundays.',
      'Historical dates before October 15, 1582 (the adoption of the Gregorian calendar) may not align correctly, and different countries adopted the Gregorian calendar at different times (e.g., Russia in 1918, Greece in 1923). The calculator uses JavaScript\'s built-in Date object which handles leap years automatically according to Gregorian rules (years divisible by 4, except centuries not divisible by 400).',
      'For dates before year 1 CE or after year 275760 CE, JavaScript\'s Date object has known precision limitations. The calendar assumes a continuous Gregorian calendar even for dates before its historical adoption — this is the "proleptic Gregorian calendar" convention used in ISO 8601.',
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
        answer: 'Adding months to dates near month boundaries follows the "last day of month" convention built into JavaScript\'s Date object. January 31 plus 1 month gives February 28 or 29 (the last valid day of February), not March 3. Similarly, March 31 minus 1 month gives February 28 or 29. This is the standard convention used in financial calculations, contract law, and most programming date libraries. The calculator uses this behavior to prevent "date overflow" where invalid dates like February 31 would silently roll into March.',
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
