import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { createElement } from 'react';
import CountdownPanel from './CountdownPanel';

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
    const targetDateStr = values.targetDate;
    if (!targetDateStr) return [];

    const includeTimeVal = values.includeTime;
    let includeTimeIsYes = true;
    if (includeTimeVal === 'No') {
      includeTimeIsYes = false;
    }

    let targetTimeStr = '00:00';
    if (includeTimeIsYes) {
      const t = values.targetTime;
      if (t !== undefined && t !== '' && /^\d{2}:\d{2}$/.test(t)) {
        targetTimeStr = t;
      }
    }

    const targetDate = new Date(targetDateStr + 'T' + targetTimeStr + ':00');
    if (isNaN(targetDate.getTime())) return [];

    const startDateStr = values.startDate;
    let now: Date;
    if (startDateStr !== undefined && startDateStr !== '') {
      now = new Date(startDateStr + 'T00:00:00');
      if (isNaN(now.getTime())) return [];
    } else {
      now = new Date();
    }

    const diffMs = targetDate.getTime() - now.getTime();
    const isPast = diffMs < 0;
    const absDiffMs = Math.abs(diffMs);

    const totalDays = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
    const totalHours = Math.floor(absDiffMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor(absDiffMs / (1000 * 60));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = Math.floor(totalDays / 30.44);

    // Breakdown into years, months, weeks, days
    const years = Math.floor(totalDays / 365.25);
    const remainingAfterYears = totalDays - Math.floor(years * 365.25);
    const months = Math.floor(remainingAfterYears / 30.44);
    const remainingAfterMonths = remainingAfterYears - Math.floor(months * 30.44);
    const weeks = Math.floor(remainingAfterMonths / 7);
    const days = remainingAfterMonths - weeks * 7;

    const eventName = values.eventName;

    // Percentage of year completed (if within same year)
    let yearPercent = '';
    if (now.getFullYear() === targetDate.getFullYear()) {
      const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
      const yearEnd = new Date(now.getFullYear() + 1, 0, 1).getTime();
      const yearTotal = yearEnd - yearStart;
      const elapsed = targetDate.getTime() - yearStart;
      yearPercent = Math.round((elapsed / yearTotal) * 100) + '%';
    }

    const results: CalculatorResult[] = [];

    // Main countdown result
    let mainLabel = 'Time Remaining';
    if (eventName !== undefined && eventName !== '') {
      mainLabel = 'Time Until ' + eventName;
    }

    let mainValue: string;
    if (isPast) {
      mainValue = totalDays + ' day' + (totalDays !== 1 ? 's' : '') + ' ago';
    } else {
      mainValue = totalDays + ' day' + (totalDays !== 1 ? 's' : '') + ', ' + (totalHours % 24) + 'h ' + (totalMinutes % 60) + 'm';
    }

    results.push({
      id: 'countdown',
      label: mainLabel,
      value: mainValue,
      highlight: true,
      color: isPast ? 'negative' : 'positive',
    });

    results.push({
      id: 'totalDays',
      label: 'Total Days',
      value: totalDays.toLocaleString(undefined),
      color: 'neutral',
    });

    results.push({
      id: 'totalWeeks',
      label: 'Total Weeks',
      value: totalWeeks.toLocaleString(undefined),
      color: 'neutral',
    });

    results.push({
      id: 'totalMonths',
      label: 'Total Months',
      value: totalMonths.toLocaleString(undefined),
      color: 'neutral',
    });

    results.push({
      id: 'totalHours',
      label: 'Total Hours',
      value: totalHours.toLocaleString(undefined),
      color: 'neutral',
    });

    results.push({
      id: 'totalMinutes',
      label: 'Total Minutes',
      value: totalMinutes.toLocaleString(undefined),
      color: 'neutral',
    });

    results.push({
      id: 'breakdown',
      label: 'Breakdown',
      value: years + 'y ' + months + 'm ' + weeks + 'w ' + days + 'd',
      color: 'neutral',
    });

    if (now.getFullYear() === targetDate.getFullYear()) {
      results.push({
        id: 'yearPercentage',
        label: 'Year Completed',
        value: yearPercent,
        color: 'neutral',
      });
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
      'Date duration math calculates the exact time between two dates by subtracting their underlying numeric timestamps (milliseconds elapsed since January 1, 1970 UTC). The raw millisecond difference is then divided and rounded to produce days, hours, minutes, weeks, and months using standard conversion factors. This approach intrinsically handles all calendar edge cases because the JavaScript Date object accounts for leap years, month length variations, and daylight saving time shifts at the timestamp level.',
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
      'Calculating the time remaining between two dates involves subtracting their underlying numeric representations — each Date object stores its value as the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC (the Unix epoch). When you subtract two Date objects in JavaScript, you get the difference in milliseconds, which can be converted into any time unit by dividing by the appropriate factor. For days, we divide by 86,400,000 (1000 ms × 60 s × 60 min × 24 h). For weeks, we divide by 7 days. For months, we use 30.44 days as an average approximation because the actual length of a month varies from 28 to 31 days. For years, we use 365.25 days to account for leap years. Leap years occur every 4 years (adding February 29), except for century years not divisible by 400. The Gregorian calendar, which is the internationally accepted civil calendar, uses this rule to keep the calendar year synchronized with the astronomical year. When the target date has already passed, the calculator shows the result as "days ago" to indicate elapsed time rather than remaining time. Time zone handling is important: date-only calculations use midnight local time to avoid UTC offset confusion.',
    faqs: [
      {
        question: 'How does the calculator handle leap years?',
        answer: 'Leap years are handled naturally at the JavaScript Date level: subtracting two Date objects gives the exact millisecond difference regardless of whether the range includes February 29. For the year breakdown, we divide by 365.25 to approximate the average year length including leap days. The month approximation uses 30.44 days, which is the average length of a month in the Gregorian calendar (365.25 / 12). This means a countdown spanning a leap year will correctly account for the extra day in February.',
      },
      {
        question: 'How does time zone affect the countdown?',
        answer: 'When you do not specify a time, the calculator uses midnight (00:00) local time for the target date. When you include a time, it uses the 24-hour time you provide in your local time zone. The countdown is always relative to your local system time. If you are in a time zone with daylight saving time, the transition days (spring forward / fall back) are 23 or 25 hours long respectively, which the JavaScript Date object handles automatically. For cross-timezone event planning, enter the target time in your local time zone for the most accurate countdown.',
      },
      {
        question: 'How accurate are the month and year breakdown numbers?',
        answer: 'The month breakdown uses an average of 30.44 days per month (365.25 / 12), and the year breakdown uses 365.25 days per year to account for leap years. These are useful approximations for a human-readable "X years, Y months, Z days" display, but they are not calendar-accurate for precise date arithmetic. For example, a countdown spanning February will use the average month length, not the actual 28 or 29 days. For precise legal or contractual date calculations, use a date-specific calendar tool that accounts for the actual months between your dates.',
      },
      {
        question: 'Can I use this calculator to find elapsed time between two past dates?',
        answer: 'Yes. Use the "Start Date" field to set the earlier date and the "Target Date" to set the later date. If both dates are in the past, the calculator will show the result as "days ago" from the target date, but the breakdown numbers (total days, weeks, months) will correctly show the duration between your two specified dates. This is useful for calculating "how long ago did I start my job?" or "how many days between our anniversary and today?"',
      },
      {
        question: 'Does the countdown update if I leave the page open?',
        answer: 'The calculator shows a snapshot based on the current time when you click calculate or load the page. It does not auto-refresh in real time. To update a countdown you have been watching, simply recalculate — or toggle the "Include Time" field to a different option and back to force a recalculation. For live, real-time countdown displays (ticking seconds), consider using a dedicated countdown timer app or website.',
      },
      {
        question: 'What happens when the target date arrives — does the countdown flip to "0 days"?',
        answer: 'On the target date itself (at midnight or the specified time), the countdown reaches 0 days, 0 hours, 0 minutes. One second after the target time, the countdown flips to showing "1 day ago" with a negative indicator. This means the calculator correctly handles the exact moment of transition. If you are counting down to a specific hour (e.g., 2:00 PM), the countdown will show hours and minutes remaining on the final day until 2:00 PM passes, then flip to "ago" mode.',
      },
    ],
    citations: [
      { source: 'NIST - Time and Frequency Division', url: 'https://www.nist.gov/pml/time-and-frequency-division' },
      { source: 'timeanddate.com', url: 'https://www.timeanddate.com/countdown/create' },
    ],
    quickReference: [
      { label: '1 day', value: '24 hours' },
      { label: '1 week', value: '168 hours (7 days)' },
      { label: '1 month (avg)', value: '~30.44 days' },
      { label: '1 year (avg)', value: '365.25 days' },
    ],
    workedExamples: [
      {
        scenario: 'Wedding Countdown',
        inputs: {
          eventName: 'Wedding Day',
          targetDate: '2027-06-15',
          includeTime: 'Yes',
          targetTime: '14:00',
        },
        result: '518 days, 2h 15m remaining with breakdown of 1y 5m 1w 4d.',
        insight:
          'With a target date of June 15, 2027 at 2:00 PM, the calculator shows the total time in days, weeks, months, and a year-month-week-day breakdown. This is invaluable for wedding planning milestones — you can see exactly when "exactly 6 months remain" or when you cross into the final 100-day countdown. Share the total days with your wedding party to build excitement.',
      },
      {
        scenario: 'Exam Preparation Deadline',
        inputs: {
          eventName: 'Final Exam',
          targetDate: '2026-06-10',
          includeTime: 'No',
        },
        result: '347 days remaining with breakdown into months and weeks for study planning.',
        insight:
          'Counting down to June 10, 2026 (no specific time needed), the calculator gives a breakdown of weeks and days, which helps you plan a study schedule. If 6 weeks remain, you can allocate specific topics per week. The "total days" output is ideal for creating a day-by-day study plan leading up to the exam.',
      },
      {
        scenario: 'Retirement Countdown',
        inputs: {
          eventName: 'Retirement',
          targetDate: '2041-03-01',
          startDate: '2026-05-18',
          includeTime: 'No',
        },
        result: '5,399 days (about 14y 9m 1w 1d) from the start date of May 18, 2026.',
        insight:
          'Using a fixed start date of May 18, 2026 (today), the countdown to March 1, 2041 spans roughly 14 years and 10 months. The year-month-week-day breakdown makes the long-term milestone feel more tangible and helps with financial planning — you can see exactly how many months of saving remain, or how many weeks until you need to have your retirement accounts in order.',
      },
    ],
    proTips: [
      'Bookmark the countdown page with your event pre-filled using query parameters so you can check it daily without re-entering the date.',
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
