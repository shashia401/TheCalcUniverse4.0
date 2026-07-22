import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import WorkingDaysPanel from './WorkingDaysPanel';

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
      helpText: 'Choose whether to exclude federal holidays',
      options: [
        { label: 'Exclude federal holidays', value: 'yes' },
        { label: 'Include all days (no holiday exclusion)', value: 'no' },
      ],
    },
  ],
  calculate: (values) => {
    const startStr = values.startDate;
    const endStr = values.endDate;
    const countMethod = values.includeStart || 'end';
    const excludeHolidays = (values.holidays || 'yes') === 'yes';

    if (!startStr || !endStr) return [];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startStr) || !/^\d{4}-\d{2}-\d{2}$/.test(endStr)) return [];

    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    if (start > end) return [];

    const usHolidays = new Set([
      '01-01', '06-19', '07-04', '11-11', '12-25',
    ]);

    const isHoliday = (d: Date): boolean => {
      if (!excludeHolidays) return false;
      const mmdd = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return usHolidays.has(mmdd);
    };

    let totalDays = 0;
    let workingDays = 0;
    let weekendDays = 0;
    let holidayDays = 0;

    const current = new Date(start);
    const adjustedStart = countMethod === 'neither' || countMethod === 'end'
      ? (() => { const c = new Date(start); c.setDate(c.getDate() + 1); return c; })()
      : start;
    const adjustedEnd = countMethod === 'neither'
      ? (() => { const c = new Date(end); c.setDate(c.getDate() - 1); return c; })()
      : end;

    current.setTime(adjustedStart.getTime());

    while (current <= adjustedEnd) {
      totalDays++;
      const dow = current.getDay();
      if (dow === 0 || dow === 6) {
        weekendDays++;
      } else if (isHoliday(current)) {
        holidayDays++;
      } else {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    const calendarDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return [
      {
        id: 'workingDays',
        label: 'Working Days',
        value: workingDays.toLocaleString(undefined),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'calendarDays',
        label: 'Total Calendar Days',
        value: calendarDays.toLocaleString(undefined),
        color: 'neutral',
      },
      {
        id: 'weekends',
        label: 'Weekend Days (Sat/Sun)',
        value: weekendDays.toLocaleString(undefined),
        color: 'neutral',
      },
      {
        id: 'holidays',
        label: 'Public Holidays',
        value: excludeHolidays ? holidayDays.toLocaleString(undefined) : 'Not counted',
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(WorkingDaysPanel, { values, results });
  },
  educational: {
    formula: 'Working Days = Calendar Days − Weekend Days − Public Holidays',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="50" width="320" height="40" fill="var(--svg-3b82f6)" rx="4"/><text x="220" y="75" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Calendar Days: 30</text><rect x="60" y="110" width="180" height="60" fill="var(--svg-22c55e)" rx="8"/><text x="150" y="148" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Working Days: 22</text><rect x="240" y="110" width="140" height="60" fill="var(--svg-ef4444)" rx="8"/><text x="310" y="148" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Weekends: 8</text><rect x="60" y="190" width="100" height="60" fill="var(--svg-f59e0b)" rx="8"/><text x="110" y="228" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Holidays: 2</text><line x1="60" y1="260" x2="380" y2="260" stroke="var(--svg-666666)" stroke-width="1"/><text x="220" y="290" text-anchor="middle" font-size="14" fill="var(--svg-333333)">Net Working Days: 20</text></svg>',
      alt: 'Calendar days broken into working days, weekends, and holidays',
      caption: 'Working days calculation excludes weekends and public holidays',
    },
    formulaDescription:
      'Working days are calculated by subtracting weekends (Saturday and Sunday) and optionally public holidays from the total calendar days between two dates. The calculation iterates through each day in the date range, counting weekdays and skipping weekends. When the holiday option is enabled, specific fixed-date US federal holidays are also excluded from the working day total. This gives you the net number of business-relevant days for planning or compliance purposes.',
    variables: [
      { symbol: 'Calendar Days', name: 'Total Calendar Days', description: 'The total number of days between the start date and end date, including or excluding boundaries based on the selected count method.' },
      { symbol: 'Working Days', name: 'Business/Working Days', description: 'Monday through Friday days that are neither weekends nor public holidays. This represents the net count of business-relevant days in the date range.' },
      { symbol: 'Weekend Days', name: 'Saturday and Sunday Days', description: 'Days falling on Saturday (day 6) or Sunday (day 0) within the date range. These are always excluded from the working day count.' },
      { symbol: 'Public Holidays', name: 'US Federal Holidays', description: 'Fixed-date US federal holidays: New Year\'s Day (Jan 1), Independence Day (Jul 4), Veterans Day (Nov 11), Christmas Day (Dec 25), and Juneteenth (Jun 19). Floating holidays are not included.' },
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
      'Working day calculations are essential for project planning, deadline estimation, contract milestones, and payroll. This calculator counts Monday through Friday as working days and excludes Saturdays and Sundays. The holiday exclusion covers major fixed-date US federal holidays (New Year\'s Day, Independence Day, Veterans Day, Christmas). Floating holidays like Thanksgiving and Labor Day (which depend on the day of the week) are not included in this calculator. For business contexts, knowing the exact number of working days between two dates helps with setting realistic delivery dates, scheduling team capacity, and calculating service-level agreement compliance. For example, a standard 5-business-day turnaround means a project starting on Thursday would be due by Wednesday of the following week, assuming no holidays. In HR contexts, working day counts are used to calculate accrued paid time off, determine probation periods, and measure absenteeism. Many service contracts use "business days" rather than calendar days to exclude weekends from delivery timelines. Freelancers and consultants also use working day calculations to estimate project timelines and set client expectations about turnaround times. Knowing that there are typically 21-23 working days in a month helps with capacity planning and realistic scheduling across teams and departments.',
    faqs: [
      {
        question: 'Why is my business deadline different from my project management tool?',
        answer: 'Different tools handle holidays, weekends, and boundary dates (start/end inclusion) differently. Some tools count the start date as day one, while others start counting from the following day. This calculator lets you control whether to include or exclude the start and end dates, giving you consistent results regardless of which convention your other tools use.',
      },
      {
        question: 'Does this include all US holidays?',
        answer: 'This calculator includes fixed-date federal holidays (New Year\'s Day, Independence Day, Veterans Day, Christmas Day, Juneteenth). Floating holidays like Thanksgiving (4th Thursday in November), Memorial Day (last Monday in May), Labor Day (1st Monday in September), Martin Luther King Jr. Day (3rd Monday in January), and Presidents Day (3rd Monday in February) are not included due to their year-dependent dates. For complete holiday accounting, consult an official holiday calendar for your specific year.',
      },
      {
        question: 'How many working days are in a typical year?',
        answer: 'A standard year has approximately 260 working days (52 weeks x 5 weekdays) minus approximately 10 federal holidays, resulting in roughly 250 working days per year. This varies slightly depending on the year and which holidays fall on weekends (when holiday observances may shift to Friday or Monday, affecting the count).',
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
