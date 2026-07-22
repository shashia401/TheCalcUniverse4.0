import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import DayCounterPanel from './DayCounterPanel';

function countWeekdaysInRange(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endNorm = new Date(end);
  endNorm.setHours(0, 0, 0, 0);

  while (current <= endNorm) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

const dayCounterConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'startDate',
      label: 'Start Date',
      type: 'date',
      required: true,
      helpText: 'Select the starting date',
    },
    {
      id: 'endDate',
      label: 'End Date',
      type: 'date',
      required: true,
      helpText: 'Select the ending date',
    },
    {
      id: 'includeEndDate',
      label: 'Include End Date',
      type: 'select',
      options: [
        { label: 'No', value: 'no' },
        { label: 'Yes', value: 'yes' },
      ],
    },
    {
      id: 'countBusinessDays',
      label: 'Count Business Days Only',
      type: 'select',
      options: [
        { label: 'No', value: 'no' },
        { label: 'Yes', value: 'yes' },
      ],
      helpText: 'Exclude Saturdays and Sundays from the day count',
    },
  ],

  calculate: (values) => {
    const startStr = values.startDate;
    const endStr = values.endDate;
    const includeEnd = values.includeEndDate;
    const businessDays = values.countBusinessDays;

    if (!startStr || !endStr) return [];

    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

    if (end < start) return [];

    const diffMs = end.getTime() - start.getTime();
    let totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (includeEnd === 'yes') {
      totalDays += 1;
    }

    let businessDaysCount = 0;
    if (businessDays === 'yes') {
      const countEnd = new Date(end);
      if (includeEnd === 'yes') {
        countEnd.setDate(countEnd.getDate() + 1);
      }
      businessDaysCount = countWeekdaysInRange(start, countEnd);
    }

    // Approximate years, months, days
    const years = Math.floor(totalDays / 365);
    const remainingAfterYears = totalDays % 365;
    const months = Math.floor(remainingAfterYears / 30);
    const days = remainingAfterYears % 30;

    const results: CalculatorResult[] = [];

    results.push({
      id: 'totalDays',
      label: 'Total Days',
      value: String(totalDays),
      highlight: true,
      color: 'positive',
    });

    results.push({
      id: 'formattedBreakdown',
      label: 'Duration',
      value: `${years} years, ${months} months, ${days} days`,
    });

    results.push({
      id: 'totalWeeks',
      label: 'Total Weeks',
      value: String(Math.floor(totalDays / 7)),
    });

    results.push({
      id: 'totalHours',
      label: 'Total Hours',
      value: String(totalDays * 24),
    });

    results.push({
      id: 'totalMinutes',
      label: 'Total Minutes',
      value: String(totalDays * 1440),
    });

    if (businessDays === 'yes') {
      results.push({
        id: 'businessDaysCount',
        label: 'Business Days',
        value: String(businessDaysCount),
      });
    }

    results.push({
      id: 'startDateDisplay',
      label: 'Start Date',
      value: startStr,
    });

    results.push({
      id: 'endDateDisplay',
      label: 'End Date',
      value: endStr,
    });

    results.push({
      id: 'includeEndNote',
      label: 'Include End Date',
      value: includeEnd === 'yes' ? 'Yes (+1 day)' : 'No',
    });

    results.push({
      id: 'businessMode',
      label: 'Mode',
      value: businessDays === 'yes' ? 'Business Days Only' : 'All Days',
    });

    return results;
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DayCounterPanel, { values, results });
  },

  educational: {
    formula: 'Days = EndDate − StartDate',
    formulaDescription:
      'Count the exact number of days between two dates. Optionally include the end date in the count (making it inclusive), count only business days (excluding weekends), and see the result broken down into years, months, and days for a human-readable perspective on the time span.',
    variables: [
      {
        symbol: 'Days',
        name: 'Days',
        description: 'The number of days between the start and end dates, optionally including or excluding the final day in the count.',
      },
    ],
    howToUse: [
      'Select the start and end dates using the date pickers for a visual calendar interface.',
      'Toggle "Include End Date" to include the final day in the count (useful for date ranges like vacation periods).',
      'Toggle "Count Business Days Only" to count only weekdays, excluding Saturdays and Sundays.',
      'View the total days, a breakdown into years/months/days, and alternative time units like weeks and hours.',
      'Use the business days option for project timelines and shipping estimates that exclude weekends.',
    ],
    explanation:
      'This calculator counts the number of days between two dates. It can include or exclude the end date, count only business days (Monday-Friday), and show the result in various time units. The "Include End Date" option is particularly useful when computing the total length of a stay, rental period, or event that spans from a start date to an end date inclusive. The year/month/day breakdown provides an approximate but intuitive sense of the time span, using 365 days per year and 30 days per month as a standardized approximation.',
    faqs: [
      {
        question: 'What is the difference between including and excluding the end date?',
        answer: 'Excluding the end date counts the days from the start date up to (but not including) the end date. Including the end date adds 1 to the total, counting the end date as well. For example, Monday to Wednesday is 2 days excluding (Tuesday and Wednesday are the full days between), or 3 days including (Monday, Tuesday, and Wednesday). The inclusive count is commonly used for vacation rentals, hotel stays, and event durations that span a range of dates.',
      },
      {
        question: 'How are business days calculated?',
        answer: 'Business days count only Monday through Friday, excluding Saturdays and Sundays. The calculation iterates through each day in the date range and counts only weekdays. This is useful for estimating project timelines, shipping times that exclude weekends, and work schedules. Note that this option does not account for public holidays.',
      },
      {
        question: 'Is the year/month/day breakdown exact?',
        answer: 'The breakdown uses an approximation of 365 days per year and 30 days per month for simplicity. For example, 400 days would be shown as approximately 1 year, 1 month, and 5 days. For precise accounting of months with varying lengths (January has 31 days, February has 28 or 29, etc.), use a dedicated date calculator that considers actual calendar month boundaries.',
      },
      {
        question: 'Does the calculator account for leap years?',
        answer: 'Yes. The total days calculation uses the actual calendar dates you enter, so leap years are automatically handled by the browser\'s date engine. For example, the range from January 1, 2024 (a leap year) to January 1, 2025 returns 366 days, while the same range in a non-leap year returns 365 days. The year/month/day approximate breakdown, however, uses a fixed 365-day year, so it may display slightly differently for leap-year ranges.',
      },
      {
        question: 'Can I use this calculator to find my exact age in days?',
        answer: 'Yes. Enter your birth date as the start date and today\'s date (or any other date) as the end date with "Include End Date" set to "No" to get your age in days. The total will show your age in days, weeks, and an approximate years/months/days breakdown. For a more precise age calculation that accounts for actual calendar month lengths, see the dedicated Age Calculator.',
      },
      {
        question: 'What date formats are supported?',
        answer: 'Dates are entered using your browser\'s native date picker, which uses the YYYY-MM-DD format internally. The date picker adapts to your locale settings, so you can select dates using your regional calendar format. All major browsers on desktop and mobile support this date input type.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Sarah is planning a 2-week vacation to Japan from December 20, 2025 to January 3, 2026. She needs to know the exact number of days for booking accommodations and calculating her travel budget.',
        inputs: { startDate: '2025-12-20', endDate: '2026-01-03', includeEndDate: 'yes', countBusinessDays: 'no' },
        result: '15',
        insight: 'The trip spans 15 days including both the departure and return dates. This is important for hotel bookings, which typically charge per night — 14 nights for a 15-day trip with both end dates included. The year boundary crossing is handled automatically, and the approximate breakdown shows the trip as about 0 years, 0 months, and 15 days.',
      },
      {
        scenario: 'Marcus is a project manager who needs to estimate the working days available for a software development sprint. The sprint starts Monday March 2, 2026 and ends Friday March 27, 2026.',
        inputs: { startDate: '2026-03-02', endDate: '2026-03-27', includeEndDate: 'yes', countBusinessDays: 'yes' },
        result: '26',
        insight: 'The sprint spans 20 business days (Monday through Friday). With 26 calendar days total (March 2-27 inclusive), the remaining 6 days are weekends. This confirms the sprint fits exactly into four 5-day work weeks, which is the standard sprint length for many agile teams. Marcus can now accurately estimate team capacity for the sprint.',
      },
      {
        scenario: 'Priya wants to know how many days until her wedding on October 15, 2026, counting from today (May 18, 2026), so she can plan the remaining preparations.',
        inputs: { startDate: '2026-05-18', endDate: '2026-10-15', includeEndDate: 'no', countBusinessDays: 'no' },
        result: '150',
        insight: 'There are exactly 150 days until the wedding. This breaks down to approximately 0 years, 4 months, and 27 days. Priya can use this to plan her preparation timeline — for example, vendors typically need to be booked 3-6 months out, which is roughly 90-180 days, so she is right in the critical booking window. She can also toggle business days mode to see how many working days are available for DIY projects.',
      },
    ],
    proTips: [
      'Use "Include End Date = Yes" for hotel stays, rental periods, and event durations where both the first and last day count. For example, a Friday-to-Sunday hotel stay is 2 nights but 3 days inclusive.',
      'Toggle between "All Days" and "Business Days Only" to compare total calendar days vs. working days. This is the quickest way to estimate project timelines — if a 30-day project has 22 business days, you know you have about 8 weekend days baked in.',
      'For long-range planning (90+ days), the year/month/day approximate breakdown becomes less accurate. Use total weeks (totalDays / 7) for a more practical sense of the timespan — 180 days = about 25.7 weeks, which is easier to grasp than "0 years, 5 months, 30 days."',
      'The total minutes and hours outputs are useful for precise calculations in logistics and shipping. One full day = 1,440 minutes or 86,400 seconds — the calculator handles these conversions automatically.',
    ],
    quickReference: [
      { label: '1 Week', value: '7 days' },
      { label: '1 Month (approx.)', value: '30 days' },
      { label: '1 Quarter (approx.)', value: '90 days' },
      { label: '1 Year (standard)', value: '365 days' },
      { label: '1 Leap Year', value: '366 days' },
      { label: '', value: '' },
      { label: 'Business Days / Week', value: '5 days (Mon–Fri)' },
      { label: 'Business Days / Month', value: '~22 days (varies)' },
      { label: 'Business Days / Year', value: '~260 days (varies)' },
    ],
    limitations: [
      'This calculator does not account for public holidays when counting business days — only Saturdays and Sundays are excluded. For accurate business day counts that respect specific regional holiday calendars, use a dedicated business day calculator with a holiday database.',
      'The year/month/day breakdown is an approximation (365-day year, 30-day month) and should not be used for precise age calculations or legal date computations where exact calendar month boundaries matter.',
      'The calculator handles dates from year 1 to year 275760 in most browsers, but dates before 1582 (the Gregorian calendar reform) may produce historically inaccurate results.',
      'End date inclusion logic assumes a simple +1 day adjustment — for edge cases spanning multiple years or leap seconds, verify results independently.',
    ],
    citations: [
      { source: 'Wikipedia - Day', url: 'https://en.wikipedia.org/wiki/Day' },
      { source: 'NIST - Date and Time Formats', url: 'https://www.nist.gov/pml/time-and-frequency-division/time-services' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Days Between Dates</text><rect x="15" y="32" width="290" height="100" rx="6" fill="var(--svg-f8fafc)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="30" y="52" font-size="11" fill="var(--svg-555555)">January 2024</text><text x="200" y="52" text-anchor="middle" font-size="9" fill="var(--svg-888888)" font-weight="bold">S  M  T  W  T  F  S</text><text x="81" y="70" text-anchor="middle" font-size="9" fill="var(--svg-888888)">1</text><rect x="99" y="58" width="18" height="16" rx="2" fill="var(--svg-3b82f6)"/><text x="108" y="71" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)" font-weight="bold">2</text><text x="126" y="70" text-anchor="middle" font-size="9" fill="var(--svg-333333)">3</text><text x="144" y="70" text-anchor="middle" font-size="9" fill="var(--svg-333333)">4</text><text x="162" y="70" text-anchor="middle" font-size="9" fill="var(--svg-333333)">5</text><text x="180" y="70" text-anchor="middle" font-size="9" fill="var(--svg-333333)">6</text><text x="198" y="70" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)">7</text><text x="63" y="88" text-anchor="middle" font-size="9" fill="var(--svg-333333)">7</text><text x="81" y="88" text-anchor="middle" font-size="9" fill="var(--svg-333333)">8</text><text x="99" y="88" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">9</text><text x="117" y="88" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">10</text><text x="135" y="88" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">11</text><text x="153" y="88" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">12</text><text x="171" y="88" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">13</text><text x="189" y="88" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)">14</text><text x="63" y="106" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">14</text><text x="81" y="106" text-anchor="middle" font-size="9" fill="var(--svg-3b82f6)">15</text><rect x="97" y="94" width="20" height="16" rx="2" fill="var(--svg-ef4444)" opacity="0.2" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="107" y="106" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)" font-weight="bold">16</text><text x="126" y="106" text-anchor="middle" font-size="9" fill="var(--svg-333333)">17</text><text x="144" y="106" text-anchor="middle" font-size="9" fill="var(--svg-333333)">18</text><text x="162" y="106" text-anchor="middle" font-size="9" fill="var(--svg-333333)">19</text><text x="180" y="106" text-anchor="middle" font-size="9" fill="var(--svg-333333)">20</text><text x="198" y="106" text-anchor="middle" font-size="9" fill="var(--svg-333333)">21</text><text x="95" y="61" font-size="8" fill="var(--svg-3b82f6)">S</text><text x="134" y="103" font-size="8" fill="var(--svg-ef4444)">E</text><line x1="100" y1="62" x2="134" y2="100" stroke="var(--svg-3b82f6)" stroke-width="1" stroke-dasharray="3"/><text x="160" y="147" text-anchor="middle" font-size="11" fill="var(--svg-555555)">Days = EndDate − StartDate</text><text x="160" y="168" text-anchor="middle" font-size="10" fill="var(--svg-555555)">Total: 14 days</text><text x="160" y="188" text-anchor="middle" font-size="9" fill="var(--svg-888888)">Option: Include End Date (+1) or Business Days only (Mon–Fri)</text></svg>',
      alt: 'Calendar date range showing days between start and end dates',
      caption: 'Day counter computes days between two dates, optionally including the end date or counting only business days.',
    },
  },
};

export default dayCounterConfig;
