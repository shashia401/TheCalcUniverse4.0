import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import TimePanel from './TimePanel';

/* ------------------------------------------------------------------ */
/*  Parse helpers                                                      */
/* ------------------------------------------------------------------ */

interface ParsedTime {
  hours: number;
  minutes: number;
  isPM: boolean | null; // null for 24-hour format
}

/**
 * Parse a time string into hours, minutes, and AM/PM indicator.
 * Supports "h:mm AM/PM", "h AM/PM", and "HH:MM" (24-hour) formats.
 */
function parseTime(input: string): ParsedTime | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try 12-hour format: "h:mm AM/PM" or "h AM/PM"
  const ampmMatch = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(trimmed);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const isPM = ampmMatch[3].toUpperCase() === 'PM';

    if (hours < 1 || hours > 12) return null;
    if (minutes < 0 || minutes > 59) return null;

    // Convert 12-hour to 24-hour
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    return { hours, minutes, isPM };
  }

  // Try 24-hour format: "HH:MM"
  const h24Match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (h24Match) {
    const hours = parseInt(h24Match[1], 10);
    const minutes = parseInt(h24Match[2], 10);

    if (hours < 0 || hours > 23) return null;
    if (minutes < 0 || minutes > 59) return null;

    return { hours, minutes, isPM: null };
  }

  return null;
}

/** Convert parsed time to total minutes from midnight. */
function timeToMinutes(time: ParsedTime): number {
  return time.hours * 60 + time.minutes;
}

/** Calculate minutes between start and end, accounting for overnight. */
function timeDiffMinutes(startMinutes: number, endMinutes: number): number {
  if (endMinutes < startMinutes) {
    return endMinutes + 24 * 60 - startMinutes;
  }
  return endMinutes - startMinutes;
}

/* ------------------------------------------------------------------ */
/*  Time calculator config                                            */
/* ------------------------------------------------------------------ */

const timeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'startTime',
      label: 'Start Time',
      type: 'text',
      placeholder: '9:00 AM',
      required: true,
      helpText: 'Use format like 9:00 AM or 14:30',
    },
    {
      id: 'endTime',
      label: 'End Time',
      type: 'text',
      placeholder: '5:00 PM',
      required: true,
      helpText:
        'Use format like 5:00 PM or 22:00. Automatically handles overnight (e.g., 10 PM to 6 AM)',
    },
    {
      id: 'breakMinutes',
      label: 'Break Deduction (minutes)',
      type: 'number',
      placeholder: '30',
      inputMode: 'decimal',
      min: 0,
      helpText: 'Unpaid break time in minutes',
    },
    {
      id: 'hourlyRate',
      label: 'Hourly Rate ($)',
      type: 'number',
      placeholder: '25.00',
      inputMode: 'decimal',
      min: 0,
      step: 0.01,
    },
  ],

  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const startInput = (values.startTime ?? '').trim();
    const endInput = (values.endTime ?? '').trim();
    const breakInput = values.breakMinutes ?? '';
    const rateInput = values.hourlyRate ?? '';

    const startParsed = parseTime(startInput);
    const endParsed = parseTime(endInput);

    if (!startParsed || !endParsed) return [];

    const startMinutes = timeToMinutes(startParsed);
    const endMinutes = timeToMinutes(endParsed);

    const diffMinutes = timeDiffMinutes(startMinutes, endMinutes);
    const breakMins = parseInt(breakInput, 10) || 0;
    let workingMinutes = diffMinutes - breakMins;
    if (workingMinutes <= 0) workingMinutes = 0;

    const standardHours = Math.floor(workingMinutes / 60);
    const standardMinutes = workingMinutes % 60;
    const decimalHours = new Decimal(workingMinutes).div(60);
    const rate = parseFloat(rateInput) || 0;
    const grossPay = rate > 0 ? Number(decimalHours.times(rate).toFixed(2)) : 0;

    const results = [];

    results.push({
      id: 'standardTime',
      label: 'Total Time (HH:MM)',
      value:
        workingMinutes > 0
          ? `${standardHours} hours ${standardMinutes} minutes`
          : '0 hours 0 minutes',
      highlight: true,
      color: 'positive' as const,
    });

    results.push({
      id: 'decimalTime',
      label: 'Decimal Hours',
      value: decimalHours.toFixed(2),
    });

    results.push({
      id: 'totalMinutes',
      label: 'Total Minutes',
      value: String(workingMinutes),
    });

    results.push({
      id: 'breakTime',
      label: 'Break Deduction',
      value: breakMins > 0 ? `${breakMins} minutes` : 'None',
    });

    results.push({
      id: 'startLabel',
      label: 'Start Time',
      value: startInput,
    });

    results.push({
      id: 'endLabel',
      label: 'End Time',
      value: endInput,
    });

    if (rate > 0) {
      results.push({
        id: 'grossPay',
        label: 'Gross Pay',
        value: `$${grossPay.toFixed(2)}`,
        color: 'neutral' as const,
      });

      results.push({
        id: 'hourlyRate',
        label: 'Hourly Rate',
        value: `$${rate.toFixed(2)}/hr`,
      });
    }

    return results;
  },

  educational: {
    formula:
      'Total Time = EndTime − StartTime − Break | Gross Pay = Decimal Hours × Hourly Rate',
    formulaDescription:
      'Calculate the exact time difference between two clock times, deduct unpaid break duration, and optionally compute gross pay based on your hourly rate. The total time is computed in hours and minutes (HH:MM) for timesheet readability and also converted to decimal hours (e.g., 8.5) for payroll multiplication. Gross pay is decimal hours multiplied by the hourly rate.',
    variables: [
      {
        symbol: 'T',
        name: 'Total Time',
        description:
          'The time elapsed between the start and end times, minus any unpaid break time. Displayed in both HH:MM and decimal formats.',
      },
      {
        symbol: 'GP',
        name: 'Gross Pay',
        description:
          'Total earnings before taxes and deductions. Calculated as decimal hours × hourly rate. Only shown when an hourly rate is provided.',
      },
    ],
    howToUse: [
      'Enter start and end times in 12-hour format with AM/PM (e.g., 9:00 AM, 5:30 PM) or 24-hour format (e.g., 09:00, 17:30).',
      'Optionally enter your unpaid break duration in minutes (e.g., 30 for a 30-minute lunch break).',
      'Optionally enter your hourly rate to calculate gross pay.',
      'View total time in both HH:MM format (for timesheets) and decimal hours format (for payroll systems).',
    ],
    explanation:
      'Time calculators are used daily by shift workers, freelancers, contractors, and payroll processors to track hours worked and compute earnings. The tool automatically handles overnight shifts (e.g., starting at 10 PM and ending at 6 AM the next morning = 8 hours) and deducts unpaid break time. Decimal hours (e.g., 8.5 hours) are standard in payroll systems because they simplify wage calculation — just multiply by the hourly rate. HH:MM format (e.g., 8:30) is common on paper timesheets and for human readability. Converting between the two is straightforward: divide the minutes by 60 (e.g., 30 minutes ÷ 60 = 0.5 hours). The calculator performs this conversion automatically.',
    faqs: [
      {
        question: 'Does it handle overnight shifts?',
        answer:
          'Yes. If your end time is earlier than your start time, the calculator automatically detects that the shift crosses midnight. For example, a shift from 10:00 PM to 6:00 AM is correctly calculated as 8 hours. This works with break deductions too — a 10 PM to 6 AM shift with a 30-minute break gives 7.5 hours of paid time.',
      },
      {
        question:
          'Decimal hours vs HH:MM — what is the difference?',
        answer:
          'Decimal hours express time as a fraction of an hour. For example, 8 hours and 30 minutes = 8.5 hours (because 30/60 = 0.5). HH:MM format keeps hours and minutes separate (8:30). Payroll systems prefer decimal format because multiplying 8.5 hours by a $20 hourly rate ($170) is simpler than converting 8:30. Timesheet systems often use HH:MM because it is easier for employees to read and verify.',
      },
      {
        question: 'How is break time deducted?',
        answer:
          'Enter your unpaid break duration in minutes. The total number of minutes is subtracted from the raw time difference before converting to hours. For example, an 8-hour shift with a 30-minute break results in 7.5 paid hours (7:30 in HH:MM). If you take multiple breaks, add them together and enter the total.',
      },
      {
        question: 'Can I use this for calculating overtime?',
        answer: 'This basic calculator handles a single shift at a single rate. It shows the total hours worked and gross pay at the standard rate. For overtime calculations (e.g., 40+ hours per week at 1.5x rate), use the dedicated Time Card calculator which supports multiple daily entries, configurable overtime thresholds, and weekly totals.',
      },
      {
        question: 'What time formats are accepted?',
        answer: 'Both 12-hour format (e.g., 9:00 AM, 2:30 PM, 11:59 PM) and 24-hour/military format (e.g., 09:00, 14:30, 23:59) are supported. The calculator automatically detects which format you are using. Hours and minutes are required; seconds are optional and will be ignored if provided.',
      },
    ],
 


    
    workedExamples: [
      {
        scenario: 'Carlos works as a barista at a cafe in Austin, Texas. His shift today runs from 7:00 AM to 3:30 PM with an unpaid 30-minute lunch break. His hourly wage is $18.50. He wants to verify his hours and expected pay for the day.',
        inputs: { startTime: '7:00 AM', endTime: '3:30 PM', breakMinutes: '30', hourlyRate: '18.50' },
        result: '8 hours 0 minutes (8.00 decimal hours); Gross pay: $148.00',
        insight: 'Carlos worked 8 hours exactly (7 AM to 3:30 PM = 8.5 hours minus 30 minutes break). His gross pay for the day is $148.00 (8.0 hours x $18.50). The decimal hour format (8.00) is what payroll systems use, while the HH:MM format (8 hours 0 minutes) is what his timesheet shows.',
      },
      {
        scenario: 'Maria is a night security guard in downtown Chicago. She works from 10:00 PM to 6:00 AM with a 45-minute unpaid break at 2:00 AM. She needs to track her hours for the weekly payroll submission.',
        inputs: { startTime: '10:00 PM', endTime: '6:00 AM', breakMinutes: '45', hourlyRate: '22.00' },
        result: '7 hours 15 minutes (7.25 decimal hours); Gross pay: $159.50',
        insight: 'Maria\'s shift crosses midnight, which the calculator handles automatically. Total elapsed time is 8 hours minus 45 minutes break = 7.25 hours (or 7 hours 15 minutes in HH:MM). Her gross pay is $159.50 (7.25 hours x $22.00). The overnight detection works because 6:00 AM is numerically less than 10:00 PM, signaling a midnight crossing.',
      },
      {
        scenario: 'David is a freelance graphic designer billing a client for a project. He started at 9:15 AM and finished at 4:45 PM. He took no breaks. His billable rate is $75 per hour.',
        inputs: { startTime: '9:15 AM', endTime: '4:45 PM', breakMinutes: '0', hourlyRate: '75' },
        result: '7 hours 30 minutes (7.50 decimal hours); Gross pay: $562.50',
        insight: 'David worked exactly 7.5 hours (9:15 AM to 4:45 PM = 7 hours 30 minutes). At $75/hr, the invoice amount is $562.50. The decimal hours display (7.50) is what he should put on the invoice, making it easy for the client to verify: 7.5 hours x $75/hr = $562.50. Using this calculator before sending invoices prevents billing disputes.',
      },
    ],

    proTips: [
      'For the fastest input, use 24-hour format (e.g., 14:30 instead of 2:30 PM). It avoids AM/PM ambiguity and is the format most scheduling and payroll software uses. The calculator accepts both formats equally.',
      'If you take multiple breaks during a shift (e.g., a 15-minute coffee break and a 30-minute lunch), add them up and enter the total. For example, 15 + 30 = 45 minutes in the break field. The calculator deducts break time before computing pay.',
      'The decimal hours output is the key number for payroll. For example, 7 hours 45 minutes = 7.75 in decimal. Multiply this by your hourly rate to get your gross pay. Most payroll software and accounting spreadsheets expect decimal hours, not HH:MM.',
      'When calculating pay for a 40+ hour workweek with overtime, use the Time Card calculator instead. This single-shift calculator uses only the standard rate. Overtime requires tracking hours across multiple days at different rates.',
      'For shifts that start and end in different time zones (e.g., a flight crew crossing zones), first convert both times to the same zone using the Time Zone calculator, then use this calculator for the duration.',
    ],

    quickReference: [
      { label: '15 minutes', value: '0.25 decimal hours' },
      { label: '30 minutes', value: '0.50 decimal hours' },
      { label: '45 minutes', value: '0.75 decimal hours' },
      { label: '1 hour', value: '1.00 decimal hours' },
      { label: '8 hours', value: 'Standard full-time shift' },
      { label: '', value: '' },
      { label: '12-hour format', value: 'e.g., 9:00 AM, 2:30 PM' },
      { label: '24-hour format', value: 'e.g., 09:00, 14:30' },
      { label: 'Overnight detection', value: 'Automatic (end < start)' },
    ],

    limitations: [
      'This calculator handles single shifts at a single pay rate. It does not account for overtime premiums (1.5x or 2x rates), shift differentials (night/weekend premium pay), or multiple shifts in a day. For weekly time tracking with overtime, use the Time Card calculator.',
      'Break deductions assume the break is a single continuous period — if breaks are split, add the durations and enter the total. Paid breaks should be entered as 0 minutes.',
      'The calculator uses browser time parsing and may not handle historical date boundaries or leap seconds. For critical payroll calculations, always verify results against your employer\'s official timekeeping system.',
      'The calculator operates on clock times only and does not factor in calendar dates — use the Time Duration calculator for date-spanning calculations (e.g., multi-day projects spanning weeks or months).',
    ],
citations: [


        { source: 'Wikipedia - Time', url: 'https://en.wikipedia.org/wiki/Time' },


        { source: 'NIST - Time and Frequency Division', url: 'https://www.nist.gov/time-frequency' },


      ],


    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">Work Shift Time Calculation</text><text x="15" y="44" font-size="11" fill="var(--svg-555555)">Start: 9:00 AM</text><text x="305" y="44" text-anchor="end" font-size="11" fill="var(--svg-555555)">End: 5:00 PM</text><line x1="15" y1="52" x2="305" y2="52" stroke="var(--svg-dddddd)" stroke-width="2"/><rect x="15" y="55" width="290" height="22" rx="4" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="160" y="71" text-anchor="middle" font-size="11" fill="var(--svg-ffffff)" font-weight="bold">8 Hours Total (9 AM – 5 PM)</text><rect x="120" y="58" width="80" height="16" rx="3" fill="var(--svg-ef4444)"/><text x="160" y="70" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">30 min Break</text><text x="15" y="100" font-size="11" fill="var(--svg-333333)" font-weight="bold">Deducting the break:</text><rect x="15" y="110" width="290" height="22" rx="4" fill="var(--svg-3b82f6)" opacity="0.4"/><text x="160" y="126" text-anchor="middle" font-size="11" fill="var(--svg-333333)" font-weight="bold">7.5 Paid Hours (7:30 in HH:MM)</text><text x="160" y="155" text-anchor="middle" font-size="10" fill="var(--svg-555555)">Total = End − Start − Break</text><text x="160" y="173" text-anchor="middle" font-size="10" fill="var(--svg-555555)">Gross Pay = Decimal Hours × Rate</text><text x="160" y="195" text-anchor="middle" font-size="9" fill="var(--svg-888888)">Overnight shifts (e.g., 10 PM–6 AM) are handled automatically</text></svg>',
      alt: 'Work shift timeline showing start time, end time, break deduction, and paid hours',
      caption: 'Total work time is calculated as end time minus start time minus break, shown in both HH:MM and decimal formats.',
    },

   },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TimePanel, { values, results });  },
};

export default timeConfig;
