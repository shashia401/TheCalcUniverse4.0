import { createElement } from 'react';
import { CalculatorConfig, ExplainStep } from '../../../types/calculator';
import WorkingDaysPanel from './WorkingDaysPanel';
import { workingDaysInfo } from './workingDaysMath';
import { finiteSteps } from '../../../utils/explainGuard';
import { resultValue } from '../../../utils/explainResults';

const workingDaysConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'startDate',
      label: 'Start Date',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
      required: true,
      helpText: 'Enter date in YYYY-MM-DD format',
    },
    {
      id: 'endDate',
      label: 'End Date',
      type: 'text',
      placeholder: 'YYYY-MM-DD',
      required: true,
      helpText: 'Enter end date in YYYY-MM-DD format',
    },
    {
      id: 'includeStart',
      label: 'Count Method',
      type: 'select',
      helpText: 'Whether to include or exclude start/end dates',
      options: [
        { label: 'Exclude start date, include end date', value: 'end' },
        { label: 'Include both start and end dates', value: 'both' },
        { label: 'Exclude both start and end dates', value: 'neither' },
      ],
    },
    {
      id: 'holidays',
      label: 'US Public Holidays',
      type: 'select',
      helpText: 'Exclude the 11 US federal holidays, using their observed weekday when a holiday falls on a weekend (Saturday is observed on Friday, Sunday on Monday). Weekends are always Saturday and Sunday.',
      options: [
        { label: 'Exclude US federal holidays (observed dates)', value: 'yes' },
        { label: 'Include all days (no holiday exclusion)', value: 'no' },
      ],
    },
  ],
  calculate: (values) => {
    const w = workingDaysInfo(values);
    if (!w) return [];
    const n = (x: number) => x.toLocaleString('en-US');
    const rangeNote =
      w.method === 'both' ? 'Both the start and end dates are counted.' : w.method === 'end' ? 'The start date is not counted; the end date is.' : 'Neither the start nor the end date is counted.';

    return [
      {
        id: 'workingDays',
        label: 'Working Days',
        value: n(w.workingDays),
        highlight: true,
        color: 'positive',
        interpretation: `${rangeNote} Working day = Monday-Friday${w.excludeHolidays ? ' that is not a US federal holiday' : ''}.`,
      },
      { id: 'calendarDays', label: 'Calendar Days Counted', value: n(w.calendarDays), color: 'neutral' },
      { id: 'weekends', label: 'Weekend Days (Sat/Sun)', value: n(w.weekendDays), color: 'neutral' },
      {
        id: 'holidays',
        label: 'Public Holidays',
        value: w.excludeHolidays ? n(w.holidayDays) : 'Not counted',
        color: 'neutral',
        interpretation: w.excludeHolidays && w.holidays.length > 0
          ? `Weekday holidays in the range: ${w.holidays.slice(0, 8).map((h) => `${new Date(h.day * 86400000).toISOString().slice(0, 10)} ${h.name}`).join('; ')}${w.holidays.length > 8 ? '; …' : ''}.`
          : undefined,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(WorkingDaysPanel, { values, results });
  },
  explainSteps: (values) => {
    const w = workingDaysInfo(values);
    if (!w) return [];
    const results = workingDaysConfig.calculate(values);
    const val = (id: string) => resultValue(results, id) ?? '';
    const iso = (day: number) => new Date(day * 86400000).toISOString().slice(0, 10);
    const method = w.method === 'both' ? 'both end dates counted' : w.method === 'end' ? 'start excluded, end included' : 'both end dates excluded';
    const weekdays = w.calendarDays - w.weekendDays;
    const steps: ExplainStep[] = [
      {
        label: 'Choose the days to count',
        expr: w.countedFirst <= w.countedLast
          ? `${iso(w.start)} to ${iso(w.end)} (${method}) → ${iso(w.countedFirst)} to ${iso(w.countedLast)} = ${val('calendarDays')} calendar days`
          : `${iso(w.start)} to ${iso(w.end)} (${method}) → no days are counted`,
      },
      { label: 'Remove Saturdays and Sundays', expr: `${w.calendarDays} − ${w.weekendDays} weekend days = ${weekdays} weekdays` },
    ];
    steps.push(
      w.excludeHolidays
        ? {
            label: 'Remove US federal holidays that fall on weekdays',
            expr: `${weekdays} − ${w.holidayDays} = ${val('workingDays')} working days`,
            note: results.find((r) => r.id === 'holidays')?.interpretation ?? 'No weekday holidays in the range.',
          }
        : {
            label: 'Holidays are not excluded',
            expr: `${weekdays} weekdays = ${val('workingDays')} working days`,
            note: 'Choose "Exclude US federal holidays" to remove them.',
          },
    );
    return finiteSteps(steps);
  },
  educational: {
    formula: 'Working Days = Calendar Days − Weekend Days − Public Holidays',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="50" width="320" height="40" fill="var(--svg-3b82f6)" rx="4"/><text x="220" y="75" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Calendar Days: 30</text><rect x="60" y="110" width="180" height="60" fill="var(--svg-22c55e)" rx="8"/><text x="150" y="148" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Working Days: 22</text><rect x="240" y="110" width="140" height="60" fill="var(--svg-ef4444)" rx="8"/><text x="310" y="148" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Weekends: 8</text><rect x="60" y="190" width="100" height="60" fill="var(--svg-f59e0b)" rx="8"/><text x="110" y="228" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Holidays: 2</text><line x1="60" y1="260" x2="380" y2="260" stroke="var(--svg-666666)" stroke-width="1"/><text x="220" y="290" text-anchor="middle" font-size="14" fill="var(--svg-333333)">Net Working Days: 20</text></svg>',
      alt: 'Calendar days broken into working days, weekends, and holidays',
      caption: 'Working days calculation excludes weekends and public holidays',
    },
    formulaDescription:
      'Working days are calculated by subtracting weekends (Saturday and Sunday) and optionally public holidays from the total calendar days between two dates. The calculation iterates through each day in the date range, counting weekdays and skipping weekends. When the holiday option is enabled, the 11 US federal holidays are also excluded on their observed weekday (a Saturday holiday is observed on Friday, a Sunday holiday on Monday). This gives you the net number of business-relevant days for planning or compliance purposes.',
    variables: [
      { symbol: 'Calendar Days', name: 'Total Calendar Days', description: 'The total number of days between the start date and end date, including or excluding boundaries based on the selected count method.' },
      { symbol: 'Working Days', name: 'Business/Working Days', description: 'Monday through Friday days that are neither weekends nor public holidays. This represents the net count of business-relevant days in the date range.' },
      { symbol: 'Weekend Days', name: 'Saturday and Sunday Days', description: 'Days falling on Saturday (day 6) or Sunday (day 0) within the date range. These are always excluded from the working day count.' },
      { symbol: 'Public Holidays', name: 'US Federal Holidays', description: 'The 11 US federal holidays (5 U.S.C. 6103): New Year\'s Day, Martin Luther King Jr. Day (3rd Monday of January), Washington\'s Birthday (3rd Monday of February), Memorial Day (last Monday of May), Juneteenth (June 19, since 2021), Independence Day (July 4), Labor Day (1st Monday of September), Columbus Day (2nd Monday of October), Veterans Day (November 11), Thanksgiving (4th Thursday of November) and Christmas Day. A holiday on a Saturday is observed on Friday, on a Sunday on Monday.' },
      { symbol: 'Count Method', name: 'Date Boundary Inclusion', description: 'Controls whether the start and end dates are counted. Options: exclude start/include end, include both, or exclude both. Different conventions apply across contracts, rental periods, and notice periods.' },
    ],
    commonUses: [
      'Calculating the number of business days between two dates for project deadline estimation or SLA compliance',
      'Determining working days for contract terms, notice periods, rental agreements, or legal deadlines',
      'Planning leave or vacation around weekends and public holidays to maximize time off',
      'Estimating team capacity by counting the exact working days available in a sprint or project window',
    ],
    howToUse: [
      'Enter a start date and end date in YYYY-MM-DD format using the date pickers.',
      'Select whether to include or exclude the start and end dates themselves from the count.',
      'Choose whether to exclude US federal public holidays from the working day total (these add to the weekend exclusions).',
      'The result shows working days, calendar days, weekend days, and identified holidays in the date range.',
      'Use this information for project planning, contract terms, leave calculations, or deadline estimation.',
    ],
    explanation:
      'Working day calculations are essential for project planning, deadline estimation, contract milestones, and payroll. This calculator counts Monday through Friday as working days and excludes Saturdays and Sundays. The holiday exclusion covers the 11 US federal holidays, including the floating ones such as Thanksgiving and Labor Day, with the observed weekday used when a holiday falls on a weekend. State holidays, bank holidays outside the US, company closures and half days are not included. For business contexts, knowing the exact number of working days between two dates helps with setting realistic delivery dates, scheduling team capacity, and calculating service-level agreement compliance. For example, a standard 5-business-day turnaround means a project starting on Thursday would be due by Wednesday of the following week, assuming no holidays. In HR contexts, working day counts are used to calculate accrued paid time off, determine probation periods, and measure absenteeism. Many service contracts use "business days" rather than calendar days to exclude weekends from delivery timelines. Freelancers and consultants also use working day calculations to estimate project timelines and set client expectations about turnaround times. Knowing that there are typically 21-23 working days in a month helps with capacity planning and realistic scheduling across teams and departments.',
    faqs: [
      {
        question: 'Why is my business deadline different from my project management tool?',
        answer: 'Different tools handle holidays, weekends, and boundary dates (start/end inclusion) differently. Some tools count the start date as day one, while others start counting from the following day. This calculator lets you control whether to include or exclude the start and end dates, giving you consistent results regardless of which convention your other tools use.',
      },
      {
        question: 'Does this include all US holidays?',
        answer: 'It includes the 11 US federal holidays (New Year\'s Day, Martin Luther King Jr. Day, Washington\'s Birthday, Memorial Day, Juneteenth, Independence Day, Labor Day, Columbus Day, Veterans Day, Thanksgiving and Christmas), and when one falls on a Saturday or Sunday it removes the observed Friday or Monday instead. It does not include state or local holidays, religious observances, or company-specific days off, and other countries have different holidays.',
      },
      {
        question: 'How many working days are in a typical year?',
        answer: 'A year has 260 or 261 weekdays (52 weeks of 5 weekdays, plus 1 or 2 extra weekdays). Subtracting the 11 US federal holidays gives roughly 249-251 working days. For example 2026 has 261 weekdays and all 11 federal holidays (including Independence Day observed on Friday 3 July) fall on weekdays, so 250 working days.',
      },
      {
        question: 'What is the difference between working days and business days?',
        answer: 'Working days and business days are generally used interchangeably, both meaning Monday through Friday excluding holidays. However, some industries define business days differently: stock markets trade Monday through Friday excluding market holidays, banks may consider same-day cutoff times, and some logistics companies operate six days a week including Saturdays. This calculator uses the standard Monday-Friday definition.',
      },
      {
        question: 'How many working days are in a typical month?',
        answer: 'A typical month has 20-23 working days depending on the month length and whether holidays fall within it. February typically has the fewest working days (20 in a non-leap year), while months with 31 days that start on a Monday can have up to 23 working days. This calculator helps you determine the exact count for your specific date range rather than relying on estimates.',
      },
      {
        question: 'What is the difference between including and excluding the start and end dates?',
        answer: 'When you include the start and end dates, both are counted toward the total. When you exclude them, the count starts from the day after the start date and ends the day before the end date. For example, counting from Monday to Friday inclusive gives 5 days, while exclusive gives 4 days. This distinction matters for contract terms, rental periods, and notice periods where the start date convention varies.',
      },
    ],
  
    citations: [
      { source: 'NIST - Time and Calendar', url: 'https://www.nist.gov/pml/time-and-frequency-division' },
      { source: 'timeanddate.com', url: 'https://www.timeanddate.com/date/workdays.html' },
    ],
  },
};

export default workingDaysConfig;
