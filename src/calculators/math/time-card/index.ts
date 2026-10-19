import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import TimeCardPanel from './TimeCardPanel';
import Decimal from 'decimal.js';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { parseClockTime } from '../../../utils/clockTime';
import { hasAnswer, resultValue } from '../../../utils/explainResults';

// ─── Constants ──────────────────────────────────────────────────────────────────

const OVERTIME_MULTIPLIERS: Record<string, number> = {
  '1.5': 1.5,
  '2': 2,
};

const DAY_MAP: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

// ─── Time parsing ───────────────────────────────────────────────────────────────

/**
 * Shared clock-time parser, allowing a bare hour ("9" = 09:00) and "24:00" as the end of a shift that runs to
 * midnight. "25:00", "13:00 PM", "9:75", "abc" are null (they used to be counted as garbage hours or as 0).
 */
const parseTime = (t: string): number | null => parseClockTime(t, { bareHour: true, endOfDay: true });

/**
 * Parse an unpaid break to minutes, or null when malformed. "0:30" and "1:15" are hours:minutes; a bare number
 * is minutes ("30" = 30 minutes; it used to be read as 30 HOURS, which wiped out the whole day); blank = 0.
 */
function parseBreak(d: string): number | null {
  const s = d.trim();
  if (!s) return 0;
  const m = /^(\d+)(?::(\d{2}))?$/.exec(s);
  if (!m) return null;
  if (m[2] === undefined) return Number(m[1]);
  if (Number(m[2]) > 59) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function fmtHours(n: number): string {
  return n.toFixed(2);
}

// The "$" prefix is deliberate: CurrencyContext replaces it with the visitor's currency symbol.
function fmtCurrency(n: Decimal): string {
  return `$${n.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return '';
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  // reject impossible dates (Feb 31 would roll over to March 3) and format in UTC so the visitor's zone cannot shift the day
  if (d.getUTCMonth() !== Number(m[2]) - 1 || d.getUTCDate() !== Number(m[3])) return '';
  return 'Week of ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

// ─── Calculate ───────────────────────────────────────────────────────────────────

function calculate(values: Record<string, string>): CalculatorResult[] {
  const entriesRaw = (values.entries || '').trim();
  const weekStart = values.weekStart || '';
  const paySettings = values.paySettings || 'skip';
  const thresholdRaw = parseFloat(values.overtimeThreshold || '40');
  const overtimeThreshold = Number.isNaN(thresholdRaw) ? 40 : thresholdRaw;
  const regularRate = parseNumberStrict(values.regularRate);
  const overtimeMult = OVERTIME_MULTIPLIERS[values.overtimeRate || '1.5'] ?? 1.5;

  if (!entriesRaw) return [];

  // Parse each line: "Day, Start, End, Break"
  const lines = entriesRaw.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return [];

  const MINUTES_PER_DAY = 24 * 60;
  const dailyData: Array<{
    day: string;
    dayLabel: string;
    start: string;
    end: string;
    breakStr: string;
    hours: number;
  }> = [];
  const dayMinutes: number[] = [];
  const skipped: string[] = [];

  let totalMinutes = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const parts = line.split(',').map((p) => p.trim());
    const n = i + 1;
    if (parts.length < 3 || !parts[0]) {
      skipped.push(`line ${n} needs "Day, Start, End, Break"`);
      continue;
    }

    const dayLabel = parts[0];
    const startRaw = parts[1];
    const endRaw = parts[2];
    const breakRaw = parts.length > 3 ? parts[3] : '0';

    // A line that cannot be read is reported, not silently counted as 0 hours (or, for "25:00", as 25 hours).
    const startMins = parseTime(startRaw);
    const endMins = parseTime(endRaw);
    const breakMins = parseBreak(breakRaw);
    if (startMins === null || endMins === null) {
      skipped.push(`line ${n}: "${startRaw}" or "${endRaw}" is not a time`);
      continue;
    }
    if (breakMins === null) {
      skipped.push(`line ${n}: break "${breakRaw}" should be h:mm or minutes`);
      continue;
    }

    let diff = endMins - startMins;
    if (diff < 0) diff += MINUTES_PER_DAY; // crosses midnight
    if (breakMins > diff) {
      skipped.push(`line ${n}: the break is longer than the shift`);
      continue;
    }
    const workMins = diff - breakMins;
    const workHours = workMins / 60;

    totalMinutes += workMins;
    dayMinutes.push(workMins);

    // Determine day key
    const lowerDay = dayLabel.toLowerCase().slice(0, 3);
    const fullDay = DAY_MAP[lowerDay] || dayLabel;

    dailyData.push({
      day: lowerDay,
      dayLabel: fullDay,
      start: startRaw,
      end: endRaw,
      breakStr: breakRaw,
      hours: workHours,
    });
  }

  const skippedResult: CalculatorResult | null = skipped.length
    ? {
        id: 'skippedLines',
        label: `${skipped.length} line${skipped.length === 1 ? '' : 's'} not counted`,
        value: skipped.join('; '),
        color: 'negative',
      }
    : null;

  if (dailyData.length === 0) return skippedResult ? [skippedResult] : [];

  const totalHours = totalMinutes / 60;

  // Overtime. The "8 hours/day" option is daily overtime (each day's hours
  // beyond 8 are OT, e.g. California-style rules) — a fundamentally
  // different calculation from the weekly-total options (35/38/40/44/0),
  // which compare the whole week's total against a single threshold.
  // Worked in whole minutes so the hours and the pay below are exact.
  const isDailyOvertime = (values.overtimeThreshold || '40') === '8';

  let regularMinutes: number;
  let overtimeMinutes: number;

  if (isDailyOvertime) {
    regularMinutes = dayMinutes.reduce((sum, m) => sum + Math.min(m, 8 * 60), 0);
    overtimeMinutes = dayMinutes.reduce((sum, m) => sum + Math.max(0, m - 8 * 60), 0);
  } else if (overtimeThreshold <= 0) {
    // No overtime — all hours are regular
    regularMinutes = totalMinutes;
    overtimeMinutes = 0;
  } else if (totalMinutes <= overtimeThreshold * 60) {
    regularMinutes = totalMinutes;
    overtimeMinutes = 0;
  } else {
    regularMinutes = overtimeThreshold * 60;
    overtimeMinutes = totalMinutes - overtimeThreshold * 60;
  }
  const regularHours = regularMinutes / 60;
  const overtimeHours = overtimeMinutes / 60;

  // Results
  const results: CalculatorResult[] = [
    {
      id: 'totalHours',
      label: 'Total Hours',
      value: `${fmtHours(totalHours)} hours`,
      highlight: true,
      color: 'positive',
    },
    {
      id: 'regularHours',
      label: 'Regular Hours',
      value: `${fmtHours(regularHours)} hours`,
    },
    {
      id: 'overtimeHours',
      label: 'Overtime Hours',
      value: `${fmtHours(overtimeHours)} hours`,
    },
    {
      id: '_dailyBreakdown',
      label: 'Daily Breakdown',
      value: JSON.stringify(dailyData),
    },
    {
      id: 'weekNumber',
      label: 'Week Of',
      value: fmtDate(weekStart),
    },
  ];

  if (skippedResult) results.push(skippedResult);

  // Include pay results only if a valid rate was entered. Exact decimal arithmetic (minutes / 60 x rate x multiplier),
  // each pay line rounded half-up to the cent and the total being the sum of the printed lines, so the figures add up.
  // (Float maths was a cent off in about 3% of cases, e.g. 0.75 h x $10.10 = $7.575 printed as $7.57.)
  if (paySettings === 'enter' && regularRate > 0) {
    const rate = new Decimal((values.regularRate || '').trim());
    const pay = (minutes: number, mult: number): Decimal =>
      new Decimal(minutes).div(60).times(rate).times(mult).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const regularPay = pay(regularMinutes, 1);
    const overtimePay = pay(overtimeMinutes, overtimeMult);
    const totalPay = regularPay.plus(overtimePay);

    results.push({
      id: 'totalPay',
      label: 'Total Pay',
      value: fmtCurrency(totalPay),
      highlight: true,
      color: 'positive',
    });
    results.push({
      id: 'regularPay',
      label: 'Regular Pay',
      value: fmtCurrency(regularPay),
    });
    results.push({
      id: 'overtimePay',
      label: 'Overtime Pay',
      value: fmtCurrency(overtimePay),
    });
  }

  return results;
}

// ─── Config ──────────────────────────────────────────────────────────────────────

const timeCardConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'weekStart',
      type: 'date',
      label: 'Week Starting (Monday)',
      helpText: 'Select the Monday of this work week',
    },
    {
      id: 'paySettings',
      type: 'select',
      label: 'Pay Settings',
      options: [
        { label: 'Enter Hourly Rate', value: 'enter' },
        { label: 'Skip — Calculate Hours Only', value: 'skip' },
      ],
      defaultValue: 'skip',
    },
    {
      id: 'regularRate',
      type: 'number',
      step: 0.01,
      min: 0,
      inputMode: 'decimal',
      label: 'Regular Hourly Rate',
      placeholder: 'e.g., 25.00',
      showWhen: (v: Record<string, string>) => v.paySettings === 'enter',
    },
    {
      id: 'overtimeRate',
      type: 'select',
      label: 'Overtime Rate',
      options: [
        { label: '1.5x (Time and a Half)', value: '1.5' },
        { label: '2x (Double Time)', value: '2' },
      ],
      defaultValue: '1.5',
      showWhen: (v: Record<string, string>) => v.paySettings === 'enter',
    },
    {
      id: 'entries',
      type: 'text',
      label: 'Time Entries',
      required: true,
      placeholder: `Mon, 9:00, 17:00, 0:30\nTue, 8:30, 17:30, 1:00\n...`,
      helpText: 'Format each line: Day, Start, End, Break. Use 24hr or 12hr time (e.g., 9:00 AM, 17:00, 1:30 PM). Break is h:mm or just minutes (0:30 or 30). Times without AM/PM are read as 24-hour.',
    },
    {
      id: 'overtimeThreshold',
      type: 'select',
      label: 'Overtime After',
      options: [
        { label: '40 hours/week (U.S. Standard)', value: '40' },
        { label: '44 hours/week (e.g., Ontario)', value: '44' },
        { label: '38 hours/week (Australian standard week)', value: '38' },
        { label: '35 hours/week (French legal week)', value: '35' },
        { label: '8 hours/day (daily OT instead of weekly)', value: '8' },
        { label: 'None (straight time)', value: '0' },
      ],
      defaultValue: '40',
    },
  ],

  calculate,

  explainSteps: (values) => {
    const rows = timeCardConfig.calculate(values);
    if (!hasAnswer(rows) || !resultValue(rows, 'totalHours')) return [];
    const g = (id: string) => resultValue(rows, id) ?? '';
    let days: { dayLabel: string; hours: number }[];
    try {
      days = JSON.parse(g('_dailyBreakdown'));
    } catch {
      return [];
    }
    if (!Array.isArray(days) || days.length === 0) return [];
    const mins = days.map((d) => Math.round(d.hours * 60));
    const hm = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
    const total = mins.reduce((s, m) => s + m, 0);
    const thr = values.overtimeThreshold || '40';
    const rule = thr === '8' ? 'Hours over 8 in a single day are overtime' : thr === '0' ? 'No overtime rule: every hour is regular' : `Hours over ${thr} in the week are overtime`;
    const pay = g('totalPay');
    return [
      {
        label: 'Hours each day: end − start − unpaid break (a shift past midnight adds 24 hours)',
        expr: days.map((d, i) => `${d.dayLabel} ${hm(mins[i])}`).join(' + '),
        ...(g('skippedLines') ? { note: `Not counted: ${g('skippedLines')}` } : {}),
      },
      { label: 'Add the days', expr: `${total} min = ${hm(total)} = ${g('totalHours')}` },
      { label: rule, expr: `Regular ${g('regularHours')} + overtime ${g('overtimeHours')}` },
      ...(pay ? [{ label: `Pay: regular hours at the base rate plus overtime at ${values.overtimeRate || '1.5'}×`, expr: `${g('regularPay')} + ${g('overtimePay')} = ${pay}` }] : []),
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TimeCardPanel, { values, results });
  },

  educational: {
    formula: 'Daily Hours = (End - Start - Break) / 60 min | Weekly Hours = sum(Daily Hours)',
    formulaDescription:
      'Calculate total work hours for each day by subtracting the start time from the end time and removing the unpaid break duration. Sum all daily hours to get the weekly total. Hours worked beyond the overtime threshold are separated and calculated at the overtime pay rate, while regular hours are paid at the standard hourly rate.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-333333)">Time Card Hours Calculation</text><text x="20" y="40" font-size="11" font-weight="bold" fill="var(--svg-555555)">Each Day:</text><rect x="20" y="50" width="70" height="26" rx="4" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="55" y="67" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">End</text><text x="95" y="67" font-size="12" fill="var(--svg-333333)">−</text><rect x="105" y="50" width="70" height="26" rx="4" fill="var(--svg-3b82f6)" opacity="0.6"/><text x="140" y="67" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Start</text><text x="180" y="67" font-size="12" fill="var(--svg-333333)">−</text><rect x="190" y="50" width="70" height="26" rx="4" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="225" y="67" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Break</text><text x="160" y="92" text-anchor="middle" font-size="11" fill="var(--svg-3b82f6)" font-weight="bold">= Daily Hours Worked</text><line x1="20" y1="102" x2="300" y2="102" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="20" y="122" font-size="11" font-weight="bold" fill="var(--svg-555555)">Weekly Total:</text><rect x="20" y="132" width="42" height="22" rx="4" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="41" y="147" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Mon</text><text x="67" y="147" font-size="12" fill="var(--svg-333333)">+</text><rect x="75" y="132" width="42" height="22" rx="4" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="96" y="147" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Tue</text><text x="122" y="147" font-size="12" fill="var(--svg-333333)">+</text><rect x="130" y="132" width="42" height="22" rx="4" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="151" y="147" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Wed</text><text x="177" y="147" font-size="12" fill="var(--svg-333333)">+...+</text><rect x="205" y="132" width="42" height="22" rx="4" fill="var(--svg-3b82f6)" opacity="0.7"/><text x="226" y="147" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">Sun</text><text x="160" y="172" text-anchor="middle" font-size="11" fill="var(--svg-3b82f6)" font-weight="bold">= Weekly Hours</text><rect x="15" y="180" width="290" height="16" rx="4" fill="var(--svg-f0f9ff)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="192" text-anchor="middle" font-size="8" fill="var(--svg-555555)">Hours over 40 threshold → overtime at 1.5x or 2x rate</text></svg>',
      alt: 'Flow diagram showing time card calculation: End minus Start minus Break equals Daily Hours, summed across week for Weekly Hours',
      caption: 'Daily Hours = End Time - Start Time - Break Duration. Sum all daily hours to get weekly total. Hours over the threshold qualify for overtime pay.',
    },
    variables: [
      {
        symbol: 'S & E',
        name: 'Start & End Time',
        description: 'S is when work began and E is when it ended, both in 12-hour (9:00 AM) or 24-hour (09:00) format. For overnight shifts, the end time can be earlier than the start time.',
      },
      {
        symbol: 'B',
        name: 'Break Duration',
        description: 'The total unpaid break time taken during the day, as hours:minutes (e.g., 0:30 for 30 minutes, 1:00 for 1 hour) or a plain number of minutes (30).',
      },
      {
        symbol: 'OT',
        name: 'Overtime Threshold',
        description:
          'The number of hours per week after which overtime pay applies. Standard is 40 hours per week. Choose "8 hours/day" to count each day\'s hours beyond 8 as overtime instead (the weekly total is then not tested), or "None" for straight time (all hours at the regular rate).',
      },
    ],
    howToUse: [
      'Select the Monday date of the work week (optional, used for the weekly display header).',
      'Choose "Enter Hourly Rate" under Pay Settings to add gross pay with overtime.',
      'Enter time entries one per line in the text area.',
      'Format each line as: Day, Start, End, Break (e.g., Mon, 9:00, 17:00, 0:30).',
      'Set the overtime threshold (defaults to 40 hours per week). The standard work week in many countries.',
      'Review the daily breakdown, weekly total, regular hours, overtime hours, and total gross pay.',
    ],
    explanation:
      'This time card calculator helps you track weekly work hours and compute pay including overtime. Simply enter your daily start and end times with break durations for each day of the work week. The calculator handles both 12-hour and 24-hour time formats automatically. Shifts that cross midnight (e.g., starting at 10 PM and ending at 6 AM) are detected and handled correctly without any special input. Overtime is calculated based on the threshold you set — the standard is 40 hours per week in many countries. Hours up to the threshold are paid at the regular rate, and excess hours are paid at the overtime rate (1.5x or 2x, configurable). This tool is essential for hourly employees, freelancers tracking billable hours, small business owners processing payroll, and anyone who needs to ensure accurate compensation.',
    faqs: [
      {
        question: 'How does the calculator handle shifts that cross midnight?',
        answer:
          'If the end time is earlier than the start time (e.g., start at 22:00, end at 06:00), the calculator automatically assumes the shift crosses midnight and adds 24 hours to the end time before computing the duration. This correctly handles overnight shifts for security guards, healthcare workers, manufacturing plant staff, and hospitality workers who work through the night.',
      },
      {
        question: 'Can I use 12-hour time with AM/PM?',
        answer:
          'Yes. The calculator accepts both 12-hour format (e.g., 9:00 AM, 1:30 PM, 11:59 PM) and 24-hour format (e.g., 09:00, 13:30, 23:59). A time without AM/PM is read as a 24-hour time, so write 5:00 PM or 17:00 (a bare 5:00 means 5 AM). Times that are not real times of day, such as 25:00 or 13:00 PM, are not counted: the calculator lists those lines instead of guessing.',
      },
      {
        question: 'How is overtime calculated?',
        answer:
          'Overtime is calculated as total weekly hours minus the overtime threshold. For example, if you work 45 hours with a 40-hour threshold, the first 40 hours are regular time and the remaining 5 hours are overtime. Overtime is typically paid at 1.5x (time and a half) or 2x (double time) your regular hourly rate, though this is configurable. Some jurisdictions use daily overtime instead (e.g., hours beyond 8 in a single day): choose "8 hours/day" and each day\'s hours past 8 are overtime. The two methods are alternatives here, not combined.',
      },
      {
        question: 'What happens if I forget to enter a break time?',
        answer: 'Break duration is optional. If you leave it blank, the calculator assumes zero break time. You should enter your unpaid break duration as hours:minutes (e.g., 0:30 for a 30-minute lunch break, 1:00 for a 1-hour break) or as a plain number of minutes (30). The break time is subtracted from the total time between start and end to compute hours worked.',
      },
      {
        question: 'Can I save or export my time card data?',
        answer: 'The calculator displays daily and weekly totals on screen. You can export the results for your records by using your browser\'s print function (to save as PDF) or by copying the displayed values into your own spreadsheet or payroll software.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Jennifer is an administrative assistant in Denver earning $24.50 per hour. Her standard work week is Monday through Friday, 8:30 AM to 5:00 PM with a 30-minute lunch break each day. She needs to verify her weekly hours and pay before submitting her timesheet.',
        inputs: { entries: 'Mon, 8:30, 17:00, 0:30\nTue, 8:30, 17:00, 0:30\nWed, 8:30, 17:00, 0:30\nThu, 8:30, 17:00, 0:30\nFri, 8:30, 17:00, 0:30', paySettings: 'enter', regularRate: '24.50', overtimeThreshold: '40' },
        result: 'Total: 40.00 hours (40.00 regular, 0.00 overtime); Gross pay: $980.00',
        insight: 'Each day: 8.5 hours minus 30 minutes = 8.0 hours. Five days = 40 hours exactly, all at the regular rate. Jennifer\'s gross pay is $980.00 (40 hours x $24.50). No overtime is triggered because she is at exactly the 40-hour threshold. She should verify the break deduction is correctly applied — 0:30 in hours:minutes format is recognized as 30 minutes.',
      },
      {
        scenario: 'Marcus is a warehouse worker in Atlanta who picked up extra shifts this week. He worked Monday-Thursday 7:00 AM to 5:30 PM with 30-minute breaks, Friday 7:00 AM to 5:30 PM, and Saturday 8:00 AM to 12:00 PM. His regular rate is $18.00/hr with overtime at time-and-a-half after 40 hours.',
        inputs: { entries: 'Mon, 7:00, 17:30, 0:30\nTue, 7:00, 17:30, 0:30\nWed, 7:00, 17:30, 0:30\nThu, 7:00, 17:30, 0:30\nFri, 7:00, 17:30, 0:30\nSat, 8:00, 12:00, 0:00', paySettings: 'enter', regularRate: '18.00', overtimeRate: '1.5', overtimeThreshold: '40' },
        result: 'Total: 54.00 hours (40.00 regular, 14.00 overtime); Gross pay: $1,098.00',
        insight: 'Each weekday: 10.5 hours minus 30 min = 10 hours. Five weekdays = 50 hours. Saturday: 4 hours with no break. Total: 54 hours. Regular: 40 hours x $18 = $720. Overtime: 14 hours x $27 (1.5x) = $378. Total gross: $1,098. Marcus earned an extra $378 by working the extra shifts beyond 40 hours.',
      },
      {
        scenario: 'A small cafe owner in Portland needs to calculate payroll for her 3 part-time employees who work different shifts. Employee A works Mon/Wed/Fri 11 AM-3 PM, Employee B works Tue/Thu/Sat 4 PM-9 PM (with 15-min break), Employee C works Sun 8 AM-4 PM.',
        inputs: { entries: 'Mon, 11:00, 15:00, 0:00\nWed, 11:00, 15:00, 0:00\nFri, 11:00, 15:00, 0:00', paySettings: 'enter', regularRate: '16.50', overtimeThreshold: '40' },
        result: 'Total: 12.00 hours (12.00 regular, 0.00 overtime); Gross pay: $198.00',
        insight: 'Employee A works 3 shifts of 4 hours each = 12 hours total for the week. At $16.50/hr, the gross pay is $198.00. Well under 40 hours, so all hours are regular time. The cafe owner should run this separately for each employee, using the calculator once per person per week.',
      },
    ],
    proTips: [
      'Enter all 7 days even if some are 0 hours — the calculator\'s daily breakdown makes it easy to spot missing entries. Use format like "Sat, 0:00, 0:00, 0:00" or simply skip that day since empty lines are filtered.',
      'For break durations, the input format is hours:minutes (not minutes alone). Enter "0:30" for 30 minutes, "1:00" for a 1-hour lunch. The calculator also accepts just minutes if you prefer — for quick input, you can type "30" and it will be treated as 30 minutes.',
      'The overtime threshold selector includes "None (straight time)" which treats all hours as regular regardless of total. Use this when your employer pays straight time for all hours, or when you want to see the raw total hours without overtime splitting.',
      'Toggle between 1.5x and 2x overtime rates to compare pay scenarios. If you are unsure which rate applies to your situation, calculate both and discuss with your employer. Double time (2x) is common for holidays and hours beyond 12 in a single day in some jurisdictions.',
      'Copy the daily breakdown table into a spreadsheet for record-keeping. The hours column can be summed, averaged, or charted over multiple weeks to track work patterns.',
    ],
    quickReference: [
      { label: 'Standard work week', value: '40 hours (U.S. FLSA)' },
      { label: 'Overtime threshold', value: '40 hours/week (configurable)' },
      { label: 'Time entry format', value: 'Day, Start, End, Break' },
      { label: 'Break format', value: 'h:mm or minutes (0:30 or 30)' },
      { label: '', value: '' },
      { label: '1.5x Overtime', value: 'Time and a half' },
      { label: '2x Overtime', value: 'Double time' },
      { label: '12h time', value: 'e.g., 9:00 AM, 5:00 PM' },
      { label: '24h time', value: 'e.g., 09:00, 17:00' },
    ],
    limitations: [
      'Overtime is either weekly (hours over a weekly threshold) or daily (hours over 8 in a day), never both together, and there is no double-time tier. Rules such as California\'s (daily overtime after 8 hours, double time after 12, and weekly overtime after 40) therefore need to be checked by hand.',
      'Public holidays are not accounted for — holiday premium pay rates (often 2x or 2.5x) must be calculated separately. The calculator treats all days as standard workdays.',
      'Break deductions assume unpaid breaks; paid breaks should be entered as 0:00. If your breaks are compensated, do not deduct them.',
      'The calculator provides estimates only and should not replace official payroll processing systems. Labor laws vary by jurisdiction — consult your local labor board or HR department for the rules that apply to your specific situation.',
      'For multi-rate scenarios (different rates for different days or tasks), run the calculator separately for each rate and combine the results manually.',
    ],    citations: [
      { source: 'Wikipedia', title: 'Timesheet', url: 'https://en.wikipedia.org/wiki/Timesheet' },

    ],
  },
};

export default timeCardConfig;
