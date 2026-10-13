import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { createElement } from 'react';
import CountdownPanel from './CountdownPanel';
import { countdownInfo } from './countdownMath';

const countdownCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'eventName',
      label: 'Event Name',
      type: 'text',
      placeholder: 'Birthday',
      inputMode: 'text',
      helpText: 'Name your event',
    },
    {
      id: 'targetDate',
      label: 'Target Date',
      type: 'date',
      required: true,
      helpText: 'The date you are counting down to',
    },
    {
      id: 'includeTime',
      label: 'Include Time',
      type: 'select',
      helpText: 'Optionally specify a time for the target date',
      options: [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' },
      ],
    },
    {
      id: 'targetTime',
      label: 'Target Time',
      type: 'text',
      placeholder: '12:00',
      inputMode: 'numeric',
      showWhen: (v) => v.includeTime === 'Yes',
      helpText: 'Format: HH:MM in 24-hour',
    },
    {
      id: 'startDate',
      label: 'Start Date',
      type: 'date',
      placeholder: '',
      helpText: 'Optional: start from a specific date instead of today',
    },
  ],
  calculate: (values) => {
    const c = countdownInfo(values);
    if (!c) return [];
    const n = (x: number) => x.toLocaleString('en-US');
    const eventName = values.eventName?.trim();
    const plural = (x: number) => (x !== 1 ? 's' : '');

    const mainLabel = c.isPast
      ? 'Time Since' + (eventName ? ' ' + eventName : '')
      : eventName ? 'Time Until ' + eventName : 'Time Remaining';
    const mainValue = c.isPast
      ? `${n(c.totalDays)} day${plural(c.totalDays)} ago`
      : `${n(c.totalDays)} day${plural(c.totalDays)}, ${c.hoursPart}h ${c.minutesPart}m`;

    const results: CalculatorResult[] = [
      { id: 'countdown', label: mainLabel, value: mainValue, highlight: true, color: c.isPast ? 'negative' : 'positive' },
      { id: 'totalDays', label: 'Total Days', value: n(c.totalDays), color: 'neutral' },
      { id: 'totalWeeks', label: 'Total Weeks', value: n(c.totalWeeks), color: 'neutral' },
      { id: 'totalMonths', label: 'Total Months', value: n(c.totalMonths), color: 'neutral', interpretation: 'Whole calendar months (years x 12 + months).' },
      { id: 'totalHours', label: 'Total Hours', value: n(c.totalHours), color: 'neutral' },
      { id: 'totalMinutes', label: 'Total Minutes', value: n(c.totalMinutes), color: 'neutral' },
      { id: 'breakdown', label: 'Breakdown', value: `${c.years}y ${c.months}m ${c.weeks}w ${c.days}d`, color: 'neutral', interpretation: 'Calendar years, months, weeks and days (real month lengths and leap years).' },
    ];
    if (c.yearPercent !== null) {
      results.push({ id: 'yearPercentage', label: 'Year Completed at Target Date', value: c.yearPercent + '%', color: 'neutral' });
    }
    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CountdownPanel, { values, results });
  },
  educational: {
    formula: 'Time Remaining = Target Date − Current Date',
    formulaDescription:
      'The calculator turns the target and start into local calendar dates plus a wall-clock time and subtracts them. Total days, hours and minutes come from that difference, so a daylight-saving change cannot add or drop an hour. The years, months, weeks and days breakdown uses real calendar arithmetic (actual month lengths and leap years): count whole months forward from the earlier date, then the remaining days.',
    diagram: {
      svg: '<svg viewBox="0 0 440 260" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="220" y="28" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Countdown Timeline</text>' +
        '<!-- Timeline line -->' +
        '<line x1="40" y1="80" x2="400" y2="80" stroke="var(--svg-cbd5e1)" stroke-width="3" stroke-linecap="round"/>' +
        '<!-- Today marker -->' +
        '<circle cx="40" cy="80" r="8" fill="var(--svg-3b82f6)"/><text x="40" y="105" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Today</text>' +
        '<!-- Target Date marker -->' +
        '<circle cx="400" cy="80" r="8" fill="var(--svg-f59e0b)"/><text x="400" y="105" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Target Date</text>' +
        '<!-- Segments along timeline -->' +
        '<rect x="80" y="65" width="75" height="24" rx="4" fill="var(--svg-3b82f6)"/><text x="117" y="81" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Days</text>' +
        '<rect x="175" y="65" width="75" height="24" rx="4" fill="var(--svg-22c55e)"/><text x="212" y="81" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Weeks</text>' +
        '<rect x="270" y="65" width="75" height="24" rx="4" fill="var(--svg-f59e0b)"/><text x="307" y="81" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Months</text>' +
        '<!-- Conversion reference cards -->' +
        '<rect x="30" y="140" width="95" height="40" rx="6" fill="var(--svg-eff6ff)"/><text x="77" y="157" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">1 day</text><text x="77" y="172" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">24 hours</text>' +
        '<rect x="135" y="140" width="95" height="40" rx="6" fill="var(--svg-f0fdf4)"/><text x="182" y="157" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">1 week</text><text x="182" y="172" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">168 hours</text>' +
        '<rect x="240" y="140" width="95" height="40" rx="6" fill="var(--svg-fffbeb)"/><text x="287" y="157" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-1e293b)" font-weight="600" text-anchor="middle">1 month</text><text x="287" y="172" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">~30.44 days</text>' +
        '<!-- Formula label -->' +
        '<text x="220" y="225" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-475569)" text-anchor="middle" font-style="italic">Time Remaining = Target Date − Current Date</text>' +
        '</svg>',
      alt: 'Timeline from today to target date with days, weeks, and months segments labeled along the way',
      caption: 'The countdown is the difference between your target date and today, shown in progressively larger time units',
    },
    variables: [
      { symbol: 'Target Date', name: 'Target Date', description: 'The date you are counting down to.' },
      { symbol: 'Current Date', name: 'Current Date', description: 'The starting point of the countdown — today or your specified start date.' },
      { symbol: 'Time Remaining', name: 'Time Remaining', description: 'The positive difference between the target and current dates, expressed in days, weeks, months, hours, and minutes.' },
    ],
    howToUse: [
      'Enter a name for your event so the countdown label is personalized.',
      'Pick your target date from the date picker. You can optionally include a 24-hour time.',
      'Optionally set a different start date if you want to count from a specific day instead of today.',
      'View the results showing the total countdown in days, weeks, months, hours, and minutes, plus a breakdown of years, months, weeks, and days.',
    ],
    explanation:
      'Calculating the time between two dates means subtracting one calendar date and time from another. The calculator converts both to local wall-clock minutes, so days = whole 24-hour blocks, hours and minutes are the remainder on the last day, and daylight-saving shifts are ignored (the clock reads midnight to midnight). The years, months, weeks and days breakdown is calendar based: it adds whole years and months to the earlier date (a month is however long that calendar month is: 28 to 31 days) and then counts the leftover days, with weeks = leftover days divided by 7. Leap years follow the Gregorian rule: every 4 years except century years not divisible by 400. When the target date has already passed, the calculator shows the result as days ago. Date-only calculations use midnight local time.',
    faqs: [
      {
        question: 'How does the calculator handle leap years?',
        answer: 'Leap years are handled by the calendar arithmetic: a range that contains 29 February is one day longer, and the breakdown counts real month lengths. Years follow the Gregorian rule (every 4 years, except century years not divisible by 400, so 2100 is not a leap year).',
      },
      {
        question: 'How does time zone affect the countdown?',
        answer: 'When you do not specify a time, the calculator uses midnight (00:00) local time for the target date. When you include a time, it uses the 24-hour time you provide in your local time zone, relative to your device clock. Differences are measured in wall-clock time, so the 23- or 25-hour days around a daylight-saving change still count as one day. For cross-timezone events, enter the target time in your own local time.',
      },
      {
        question: 'How accurate are the month and year breakdown numbers?',
        answer: 'They are calendar-exact. For example 18 May 2026 to 1 March 2041 is 14 years, 9 months and 11 days (1 week and 4 days), because the breakdown adds whole years and months to the start date and counts the days left over. Total Months is the whole number of calendar months, not days divided by 30.44.',
      },
      {
        question: 'Can I use this calculator to find elapsed time between two past dates?',
        answer: 'Yes. Use the "Start Date" field to set the earlier date and the "Target Date" to set the later date. If the target is before the start date, the calculator shows the result as "days ago", and the totals and breakdown give the duration between the two dates. This is useful for calculating "how long ago did I start my job?" or "how many days between our anniversary and today?"',
      },
      {
        question: 'Does the countdown update if I leave the page open?',
        answer: 'The calculator shows a snapshot based on the current time when you click calculate or load the page. It does not auto-refresh in real time. To update a countdown you have been watching, simply recalculate — or toggle the "Include Time" field to a different option and back to force a recalculation. For live, real-time countdown displays (ticking seconds), consider using a dedicated countdown timer app or website.',
      },
      {
        question: 'What happens when the target date arrives — does the countdown flip to "0 days"?',
        answer: 'At the target moment the countdown reads 0 days, 0 hours, 0 minutes. Once the target has passed the result switches to "ago" mode and counts whole days since (it shows "0 days ago" during the first 24 hours). If you are counting down to a specific hour (for example 2:00 PM), the countdown shows hours and minutes remaining on the final day.',
      },
    ],
    citations: [
      { source: 'NIST - Time and Frequency Division', url: 'https://www.nist.gov/pml/time-and-frequency-division' },
      { source: 'timeanddate.com', url: 'https://www.timeanddate.com/countdown/create' },
    ],
    quickReference: [
      { label: '1 day', value: '24 hours' },
      { label: '1 week', value: '168 hours (7 days)' },
      { label: '1 month (avg)', value: '~30.44 days (28 to 31 in practice)' },
      { label: '1 year (avg)', value: '365.25 days' },
    ],
    workedExamples: [
      {
        scenario: 'Wedding Countdown',
        inputs: {
          eventName: 'Wedding Day',
          targetDate: '2027-06-15',
          startDate: '2026-01-01',
          includeTime: 'Yes',
          targetTime: '14:00',
        },
        result: '530 days, 14h 0m remaining with breakdown of 1y 5m 2w 0d.',
        insight:
          'From 1 January 2026 to 2:00 PM on 15 June 2027 is 530 days and 14 hours: 1 year, 5 months and 14 days (2 weeks) in calendar terms. That is invaluable for wedding planning milestones, such as seeing when 100 days remain.',
      },
      {
        scenario: 'Exam Preparation Deadline',
        inputs: {
          eventName: 'Final Exam',
          targetDate: '2026-06-10',
          startDate: '2026-01-10',
          includeTime: 'No',
        },
        result: '151 days remaining with breakdown of 0y 5m 0w 0d (21 weeks).',
        insight:
          'From 10 January to 10 June 2026 is exactly 5 calendar months and 151 days (21 whole weeks). The total days output is ideal for a day-by-day study plan, and the weeks figure for a weekly topic plan.',
      },
      {
        scenario: 'Retirement Countdown',
        inputs: {
          eventName: 'Retirement',
          targetDate: '2041-03-01',
          startDate: '2026-05-18',
          includeTime: 'No',
        },
        result: '5,401 days (14y 9m 1w 4d) from the start date of May 18, 2026.',
        insight:
          'From 18 May 2026 to 1 March 2041 is 14 years, 9 months and 11 days (1 week and 4 days), or 5,401 days. The breakdown makes the long-term milestone feel more tangible for financial planning.',
      },
    ],
    proTips: [
      'Use the "Include Time" option for events with a specific start time (concerts, flights, video game launches) to get hour and minute precision, not just days.',
      'For recurring annual events like birthdays or anniversaries, enter the next occurrence date — the calculator will show when you cross the "365 days until" mark.',
      'Set a custom start date to calculate how much time elapsed between two past dates (e.g., "how many days between our wedding day and today?") — simply enter the earlier date as the start date and the later date as the target.',
      'Pair this with a calendar reminder app: note the "total weeks" number and set a repeating reminder every 4 weeks to check your progress toward a long-term goal.',
    ],
    limitations: [
      'This calculator uses approximate conversion factors for months (30.44 days) and years (365.25 days). The year-month-week-day breakdown is an approximation and should not be used for precise legal or contractual date calculations.',
      'The calculator does not account for business hours, time zones other than your local system time, or daylight saving time transitions in cross-timezone scenarios.',
      'For events spanning a daylight saving time transition, the countdown may be off by one hour on the transition day.',
    ],
    commonUses: [
      'Event planning: count down the days, hours, and minutes until a wedding, vacation, or concert.',
      'Goal tracking: measure time remaining until a deadline, exam, or personal milestone.',
      'Milestone celebrations: see how long until a birthday, anniversary, or New Year fireworks.',
    ],
  },
};

export default countdownCalculatorConfig;
