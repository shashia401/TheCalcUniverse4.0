import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import TimeDurationPanel from './TimeDurationPanel';
import { parseClockTime } from '../../../utils/clockTime';
import { parseIsoDateUtc } from '../../../utils/isoDate';

/* ------------------------------------------------------------------ */
/*  Parse helpers                                                      */
/* ------------------------------------------------------------------ */

// Times are parsed by the shared parseClockTime (src/utils/clockTime.ts).

const DAY_MS = 86_400_000;

/** Weekdays (Mon-Fri) from `startDay` to `endDay` inclusive, both UTC midnights. Closed form: no per-day loop. */
function countWeekdays(startDay: number, endDay: number): number {
  const total = Math.round((endDay - startDay) / DAY_MS) + 1;
  const fullWeeks = Math.floor(total / 7);
  const startDow = new Date(startDay).getUTCDay();
  let count = fullWeeks * 5;
  for (let i = 0; i < total % 7; i++) {
    const dow = (startDow + i) % 7;
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

/* ------------------------------------------------------------------ */
/*  Time Duration calculator config                                    */
/* ------------------------------------------------------------------ */

const timeDurationConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'startDate',
      label: 'Start Date',
      type: 'date',
      required: true,
      helpText: 'Select the starting date',
    },
    {
      id: 'startTime',
      label: 'Start Time',
      type: 'text',
      placeholder: '9:00 AM',
      required: true,
      helpText: 'Use format like 9:00 AM or 14:30',
    },
    {
      id: 'endDate',
      label: 'End Date',
      type: 'date',
      required: true,
      helpText: 'Select the ending date',
    },
    {
      id: 'endTime',
      label: 'End Time',
      type: 'text',
      placeholder: '5:00 PM',
      required: true,
      helpText: 'For overnight shifts, just enter the actual end time (e.g., start 11:00 PM, end 7:00 AM next day)',
    },
    {
      id: 'businessDays',
      label: 'Business Days Only',
      type: 'select',
      options: [
        { label: 'No', value: 'no' },
        { label: 'Yes', value: 'yes' },
      ],
    },
  ],

  calculate: (values) => {
    const startDateStr = values.startDate;
    const startTimeStr = values.startTime;
    const endDateStr = values.endDate;
    const endTimeStr = values.endTime;
    const businessDaysOnly = values.businessDays;

    if (!startDateStr || !endDateStr || !startTimeStr || !endTimeStr) return [];

    // Wall-clock arithmetic in UTC: the times carry no time zone, so the answer must not depend on the visitor's
    // own DST rules (the old local-time Date gave different results on a spring-forward day depending on where
    // the browser was). Dates are validated strictly instead of letting 2025-02-31 roll over to March 3.
    const startDay = parseIsoDateUtc(startDateStr);
    const endDay = parseIsoDateUtc(endDateStr);
    if (startDay === null || endDay === null) return [];

    const startTime = parseClockTime(startTimeStr);
    const endTime = parseClockTime(endTimeStr);
    if (startTime === null || endTime === null) return [];

    const startMs = startDay + startTime * 60_000;
    const endMs = endDay + endTime * 60_000;

    if (endMs < startMs) {
      return [
        {
          id: 'error',
          label: 'End is before start',
          value: 'The end must come after the start. For an overnight shift, choose the next calendar day as the end date.',
          color: 'negative',
        },
      ];
    }

    const diffMs = endMs - startMs;
    const totalMinutes = Math.floor(diffMs / 60000);
    const totalHours = diffMs / 3600000;
    const totalSeconds = Math.floor(diffMs / 1000);

    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;

    const results: CalculatorResult[] = [];

    results.push({
      id: 'totalHours',
      label: 'Total Hours',
      value: totalHours.toFixed(2),
      highlight: true,
      color: 'positive',
    });

    results.push({
      id: 'totalMinutes',
      label: 'Total Minutes',
      value: String(totalMinutes),
    });

    results.push({
      id: 'totalSeconds',
      label: 'Total Seconds',
      value: String(totalSeconds),
    });

    results.push({
      id: 'daysHoursMinutes',
      label: 'Duration (D:H:M)',
      value: `${days}d ${hours}h ${minutes}m`,
    });

    // Numbers for the panel (ids starting with "_" are hidden), so it never has to parse "6d 2h 5m".
    results.push({
      id: '_parts',
      label: '',
      value: JSON.stringify({ days, hours, minutes, totalHours }),
    });

    results.push({
      id: 'weeksDaysHours',
      label: 'Duration (W:D:H)',
      value: `${weeks}w ${remainingDays}d ${hours}h`,
    });

    if (businessDaysOnly === 'yes') {
      const bizDays = countWeekdays(startDay, endDay);
      results.push({
        id: 'businessDays',
        label: 'Business Days (Mon-Fri)',
        value: String(bizDays),
      });
    }

    results.push({
      id: 'startDateTime',
      label: 'Start',
      value: `${startDateStr} ${startTimeStr}`,
    });

    results.push({
      id: 'endDateTime',
      label: 'End',
      value: `${endDateStr} ${endTimeStr}`,
    });

    results.push({
      id: 'businessMode',
      label: 'Mode',
      value: businessDaysOnly === 'yes' ? 'Business Days' : 'All Days',
    });

    return results;
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TimeDurationPanel, { values, results });
  },

  educational: {
    formula: 'Duration = EndDateTime − StartDateTime',
    formulaDescription:
      'Calculate the exact elapsed time between two dates and times. The duration is computed by subtracting the start date-time from the end date-time, automatically handling same-day durations, multi-day spans, and overnight shifts. Results are displayed in multiple formats for flexibility: total hours, D:H:M (days:hours:minutes), and W:D:H (weeks:days:hours).',
    variables: [
      {
        symbol: 'Duration',
        name: 'Duration',
        description: 'The elapsed time between the start and end date-time values, expressed in hours, days, or a combined weeks:days:hours format.',
      },
    ],
    howToUse: [
      'Select the start and end dates using the date pickers.',
      'Enter the start and end times in either 12-hour (9:00 AM) or 24-hour (14:30) format.',
      'Toggle "Business Days Only" to count only weekdays (Monday-Friday), excluding weekends from the total.',
      'View the duration in multiple formats: total decimal hours, D:H:M format, and W:D:H format for longer spans.',
    ],
    explanation:
      'This calculator computes the exact time difference between two dates and times, handling same-day durations, multi-day spans, and overnight shifts automatically. The business days mode excludes weekends, making it useful for project management timelines, payroll hours calculation, and scheduling applications that only operate on weekdays. Unlike the Day Counter which counts full calendar days, this calculator returns precise hours, minutes, and seconds between two specific moments in time.',
    faqs: [
      {
        question: 'Does it handle overnight shifts?',
        answer: 'Yes. Enter the actual end time and choose the next calendar day as the end date (e.g., start 11:00 PM on June 5, end 7:00 AM on June 6 = 8 hours). The end date and time together must come after the start; if they do not, the calculator tells you so instead of guessing. This makes it ideal for tracking overnight work shifts, flights that cross midnight, and server maintenance windows.',
      },
      {
        question: 'What is the difference between calendar days and business days?',
        answer: 'Calendar days count every day including weekends. Business days count only Monday through Friday, excluding Saturday and Sunday from the duration. Use business days mode for work-related calculations like project task durations that should not include non-working days. The count includes both the start and end dates, so a task from Friday to the following Monday spans 3 days of elapsed time but 2 business days (Friday and Monday).',
      },
      {
        question: 'What time formats are supported?',
        answer: 'Both 12-hour format (e.g., 9:00 AM, 2:30 PM) and 24-hour format (e.g., 09:00, 14:30) are supported. Hours and minutes are required; seconds are not supported. The calculator also exports the duration in different views: total decimal hours for payroll, D:H:M for human readability, and W:D:H for very long durations spanning multiple weeks.',
      },
      {
        question: 'How does this calculator differ from the Day Counter?',
        answer: 'The Day Counter counts full calendar days between two dates and provides business day counts, ideal for "how many days until my vacation" type questions. This Time Duration calculator goes further: it accepts both date AND time, so it computes exact elapsed hours, minutes, and seconds between two specific moments. Use this when you need precision — for example, "how many hours between 2:30 PM on Friday and 9:15 AM on Monday" rather than just "how many days between Friday and Monday."',
      },
      {
        question: 'Can I use this for calculating flight durations across time zones?',
        answer: 'This calculator works with local wall-clock times as entered. For flights crossing time zones, you should first convert both departure and arrival times to the same time zone (use the Time Zone calculator), then enter the converted times here. For example, a flight departing New York at 6:00 PM EST and arriving London at 6:00 AM GMT should be entered with both times in GMT: 11:00 PM to 6:00 AM = 7 hours duration.',
      },
      {
        question: 'How are results rounded?',
        answer: 'Total seconds are exact integers. Total minutes are floored (rounded down) from the millisecond difference. Total hours are displayed to 2 decimal places for payroll precision. The D:H:M and W:D:H formats use whole numbers for each unit — for example, 26 hours displays as "1d 2h 0m" rather than a fractional day value. Week calculations use 7-day weeks.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Alex is a project manager tracking how long a critical server migration took. The maintenance window started on Friday, June 5, 2026 at 10:00 PM and ended on Saturday, June 6, 2026 at 4:30 AM. He needs the exact duration for the post-mortem report.',
        inputs: { startDate: '2026-06-05', startTime: '10:00 PM', endDate: '2026-06-06', endTime: '4:30 AM', businessDays: 'no' },
        result: '6.50 hours (390 minutes, 0d 6h 30m)',
        insight: 'The migration took exactly 6.5 hours (390 minutes). The D:H:M display shows 0d 6h 30m, confirming the work completed within a single overnight window. This is under the planned 8-hour outage window, so the migration was successful. Alex can report this exact figure to stakeholders.',
      },
      {
        scenario: 'Priya is calculating billable hours for a consulting engagement that ran from Monday, March 9 at 9:00 AM to Friday, March 13 at 5:00 PM. She needs to exclude weekends from the billable total since the client only pays for business days.',
        inputs: { startDate: '2026-03-09', startTime: '9:00 AM', endDate: '2026-03-13', endTime: '5:00 PM', businessDays: 'yes' },
        result: '104.00 hours (4d 8h 0m); 5 business days',
        insight: 'Total elapsed time is 104 hours, with 5 business days (Monday through Friday). The duration in D:H:M format is 4d 8h 0m. If Priya bills at $150/hr, the total invoice is $15,600 for the week. The business days count (5) confirms all work happened on weekdays — no weekend billing concerns.',
      },
      {
        scenario: 'Tom is tracking his newborn baby\'s feeding schedule. The last feeding was on May 15 at 2:15 AM, and the next feeding is scheduled for May 15 at 5:45 AM. He wants to know the exact interval.',
        inputs: { startDate: '2026-05-15', startTime: '2:15 AM', endDate: '2026-05-15', endTime: '5:45 AM', businessDays: 'no' },
        result: '3.50 hours (210 minutes, 0d 3h 30m)',
        insight: 'The interval is exactly 3.5 hours (210 minutes, or 12,600 seconds). In D:H:M format: 0d 3h 30m. Newborns typically feed every 2-4 hours, so this 3.5-hour gap is within the normal range. Tom can use the calculator to track feeding intervals throughout the day and spot patterns.',
      },
    ],
    proTips: [
      'Use W:D:H format for durations longer than a week. For example, 340 hours displays as "2w 0d 4h" — much more readable than "14d 4h 0m." This is especially useful for project timelines, vacation planning, and extended service contracts.',
      'The total seconds output is the most precise measurement — use it to verify other calculations or when precision matters (e.g., scientific experiments, server uptime tracking, or athletic timing). There are exactly 86,400 seconds in a day and 3,600 in an hour.',
      'Combine with the Day Counter for a complete time analysis toolkit: use Day Counter for "how many calendar/business days between these dates," then use Time Duration for the exact hours within that span. Together they give you both the macro and micro view of any time range.',
      'The Business Days mode counts only weekdays (Mon-Fri) that fall between the start and end dates, regardless of the hour range. This is the count of distinct business dates, not the fraction of business hours — for hourly business-hours calculations, use the Time Zone calculator\'s business hours overlay.',
      'The calculator subtracts the wall-clock times exactly as entered and ignores Daylight Saving Time, so the answer is the same wherever you open it. On a spring-forward day, 1:00 AM to 4:00 AM is shown as 3 hours although only 2 hours actually elapse on the clocks; for exact elapsed time across a DST change, enter both times in UTC.',
    ],
    quickReference: [
      { label: '1 day', value: '24 hours = 1,440 min = 86,400 sec' },
      { label: '1 week', value: '168 hours = 10,080 min = 604,800 sec' },
      { label: '1 month (30 days)', value: '720 hours = 43,200 min' },
      { label: '1 year (365 days)', value: '8,760 hours = 525,600 min' },
      { label: '', value: '' },
      { label: 'D:H:M format', value: 'Days:Hours:Minutes' },
      { label: 'W:D:H format', value: 'Weeks:Days:Hours' },
      { label: 'Business days', value: 'Monday–Friday only' },
    ],
    limitations: [
      'This calculator works with local wall-clock times and does not automatically account for time zone differences or Daylight Saving Time transitions. For durations spanning time zones, convert all times to a common zone first using the Time Zone calculator.',
      'Business days counting excludes only Saturdays and Sundays — it does not exclude public holidays, which vary by country and year. For project management, combine this with a holiday-aware calendar for precise workday estimates.',
      'The business days count is based on the calendar dates spanned (distinct business dates between start and end), not the number of business hours. A task spanning 2 business days may have only a few working hours.',
      'End time must be after start time in absolute terms (the date+time combination). Overnight shifts on the same date require selecting the next day as the end date.',
      'Dates are read as proleptic Gregorian calendar dates from year 0001 to 9999; historical calendar changes (such as the 1582 Gregorian reform) are not modelled. Impossible dates such as February 31 are rejected.',
    ],
    citations: [
      { source: 'Wikipedia - Time', url: 'https://en.wikipedia.org/wiki/Time' },
      { source: 'NIST - Time and Frequency Division', url: 'https://www.nist.gov/time-frequency' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Time Duration Calculation</text><text x="15" y="48" font-size="11" fill="var(--svg-555555)">Start</text><circle cx="22" cy="55" r="8" fill="var(--svg-3b82f6)"/><text x="22" y="59" text-anchor="middle" font-size="8" fill="var(--svg-ffffff)">S</text><text x="15" y="73" font-size="10" fill="var(--svg-555555)">Jan 15</text><text x="15" y="85" font-size="10" fill="var(--svg-888888)">9:00 AM</text><line x1="35" y1="55" x2="285" y2="55" stroke="var(--svg-3b82f6)" stroke-width="3" opacity="0.5"/><text x="160" y="48" text-anchor="middle" font-size="10" fill="var(--svg-555555)">Duration</text><circle cx="298" cy="55" r="8" fill="var(--svg-ef4444)"/><text x="298" y="59" text-anchor="middle" font-size="8" fill="var(--svg-ffffff)">E</text><text x="290" y="73" font-size="10" fill="var(--svg-555555)">Jan 17</text><text x="282" y="85" font-size="10" fill="var(--svg-888888)">5:00 PM</text><rect x="15" y="100" width="290" height="85" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="118" text-anchor="middle" font-size="11" fill="var(--svg-555555)" font-weight="bold">Results Displayed</text><text x="20" y="138" font-size="10" fill="var(--svg-333333)">Total Hours</text><text x="310" y="138" text-anchor="end" font-size="10" fill="var(--svg-3b82f6)" font-weight="bold">56.00</text><line x1="20" y1="145" x2="300" y2="145" stroke="var(--svg-eeeeee)" stroke-width="1"/><text x="20" y="160" font-size="10" fill="var(--svg-333333)">Duration (D:H:M)</text><text x="310" y="160" text-anchor="end" font-size="10" fill="var(--svg-3b82f6)">2d 8h 0m</text><line x1="20" y1="167" x2="300" y2="167" stroke="var(--svg-eeeeee)" stroke-width="1"/><text x="20" y="180" font-size="10" fill="var(--svg-333333)">Business Days</text><text x="310" y="180" text-anchor="end" font-size="10" fill="var(--svg-3b82f6)">2</text></svg>',
      alt: 'Time duration timeline showing start and end date-times with computed duration',
      caption: 'Duration is the exact elapsed time between two dates and times, expressed in hours, D:H:M, or W:D:H format.',
    },
  },
};

export default timeDurationConfig;
