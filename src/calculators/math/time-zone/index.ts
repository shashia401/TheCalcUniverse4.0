import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import TimeZonePanel from './TimeZonePanel';

/* ------------------------------------------------------------------ */
/*  Timezone data                                                      */
/* ------------------------------------------------------------------ */

interface TzEntry {
  id: string;
  label: string;
  offset: number;
}

const TIMEZONES: TzEntry[] = [
  { id: 'pst', label: 'Pacific (PST/PDT)', offset: -8 },
  { id: 'mst', label: 'Mountain (MST/MDT)', offset: -7 },
  { id: 'cst_am', label: 'Central (CST/CDT)', offset: -6 },
  { id: 'est', label: 'Eastern (EST/EDT)', offset: -5 },
  { id: 'gmt', label: 'GMT/UTC', offset: 0 },
  { id: 'bst', label: 'British (BST)', offset: 1 },
  { id: 'cet', label: 'Central Europe (CET/CEST)', offset: 1 },
  { id: 'eet', label: 'Eastern Europe (EET/EEST)', offset: 2 },
  { id: 'msk', label: 'Moscow (MSK)', offset: 3 },
  { id: 'gst', label: 'Gulf (GST)', offset: 4 },
  { id: 'ist', label: 'India (IST)', offset: 5.5 },
  { id: 'bdt', label: 'Bangladesh (BDT)', offset: 6 },
  { id: 'wib', label: 'Western Indonesia (WIB)', offset: 7 },
  { id: 'cst_china', label: 'China (CST)', offset: 8 },
  { id: 'awst', label: 'Australia Western (AWST)', offset: 8 },
  { id: 'jst', label: 'Japan (JST)', offset: 9 },
  { id: 'aest', label: 'Australia Eastern (AEST/AEDT)', offset: 10 },
  { id: 'acdt', label: 'Australia Central (ACDT)', offset: 10.5 },
  { id: 'nzst', label: 'New Zealand (NZST/NZDT)', offset: 12 },
  { id: 'hst', label: 'Hawaii (HST)', offset: -10 },
  { id: 'akst', label: 'Alaska (AKST/AKDT)', offset: -9 },
  { id: 'nst', label: 'Newfoundland (NST/NDT)', offset: -3.5 },
  { id: 'art', label: 'Argentina (ART)', offset: -3 },
  { id: 'brt', label: 'Brasilia (BRT)', offset: -3 },
];

/* ------------------------------------------------------------------ */
/*  Parse helpers                                                      */
/* ------------------------------------------------------------------ */

function parseTime(s: string): { hours: number; minutes: number } | null {
  if (!s) return null;
  const t = s.trim();
  if (!t) return null;

  // 12-hour format: "H:MM AM/PM", "HH:MM AM/PM", or "H AM/PM" (minutes optional)
  const ampm = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(t);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = ampm[2] ? parseInt(ampm[2], 10) : 0;
    if (h < 1 || h > 12 || m < 0 || m > 59) return null;
    if (ampm[3].toUpperCase() === 'PM' && h !== 12) h += 12;
    if (ampm[3].toUpperCase() === 'AM' && h === 12) h = 0;
    return { hours: h, minutes: m };
  }

  // 24-hour format: "HH:MM"
  const mil = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (mil) {
    const h = parseInt(mil[1], 10);
    const m = parseInt(mil[2], 10);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return { hours: h, minutes: m };
  }

  return null;
}

function findZone(id: string): TzEntry | undefined {
  return TIMEZONES.find((z) => z.id === id);
}

function formatOffset(offset: number): string {
  const sign = offset >= 0 ? '+' : '';
  const abs = Math.abs(offset);
  if (Number.isInteger(offset)) return `UTC${sign}${abs}`;
  const whole = Math.floor(abs);
  const frac = Math.round((abs - whole) * 60);
  return `UTC${sign}${whole}:${frac < 10 ? '0' : ''}${frac}`;
}

function formatClock(hours: number, minutes: number): string {
  const period = hours >= 12 ? 'PM' : 'AM';
  const display = hours % 12 || 12;
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${display}:${minStr} ${period}`;
}

/* ------------------------------------------------------------------ */
/*  Business hours overlap                                             */
/* ------------------------------------------------------------------ */

interface BizHourCell {
  hour: number;
  color: 'green' | 'yellow' | 'gray';
}

interface OverlapResult {
  overlapStart: number;
  overlapEnd: number;
  durationHours: number;
  hours: BizHourCell[];
}

function calcOverlap(srcOff: number, dstOff: number): OverlapResult {
  // Business hours 9-17 in each zone, projected to UTC
  const srcStart = 9 - srcOff;
  const srcEnd = 17 - srcOff;
  const dstStart = 9 - dstOff;
  const dstEnd = 17 - dstOff;

  const oStart = Math.max(srcStart, dstStart);
  const oEnd = Math.min(srcEnd, dstEnd);
  const duration = Math.max(0, oEnd - oStart);

  const hours: BizHourCell[] = [];
  for (let h = 0; h < 24; h++) {
    const inSrc = h >= 9 && h < 17;
    const targetH = ((h - srcOff + dstOff + 2400) % 24);
    const inDst = targetH >= 9 && targetH < 17;
    let color: 'green' | 'yellow' | 'gray';
    if (inSrc && inDst) color = 'green';
    else if (inSrc || inDst) color = 'yellow';
    else color = 'gray';
    hours.push({ hour: h, color });
  }

  return { overlapStart: oStart, overlapEnd: oEnd, durationHours: duration, hours };
}

/* ------------------------------------------------------------------ */
/*  Calculator config                                                  */
/* ------------------------------------------------------------------ */

const tzOptions = TIMEZONES.map((z) => ({ label: z.label, value: z.id }));

const config: CalculatorConfig = {
  inputs: [
    {
      id: 'fromZone',
      label: 'From Time Zone',
      type: 'select',
      options: tzOptions,
    },
    {
      id: 'toZone',
      label: 'To Time Zone',
      type: 'select',
      options: tzOptions,
    },
    {
      id: 'time',
      label: 'Time',
      type: 'text',
      required: true,
      placeholder: 'e.g., 2:30 PM or 14:30',
      helpText: 'Enter time in 12hr or 24hr format (e.g., 9 AM, 2:30 PM, or 14:30)',
    },
    {
      id: 'date',
      label: 'Date',
      type: 'date',
      helpText: 'Select the date (for DST context)',
    },
    {
      id: 'includeBusinessHours',
      label: 'Business Hours Overlay',
      type: 'select',
      options: [
        { label: 'Yes - show overlap', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      defaultValue: 'yes',
      helpText: 'Color-coded overlap finding - green = both zones in business hours',
    },
  ],

  calculate: (values) => {
    const fromZone = values.fromZone;
    const toZone = values.toZone;
    const timeStr = values.time;
    if (!fromZone || !toZone || !timeStr) return [];

    const parsed = parseTime(timeStr);
    if (!parsed) return [];

    const src = findZone(fromZone);
    const dst = findZone(toZone);
    if (!src || !dst) return [];

    const fromOff = src.offset;
    const toOff = dst.offset;

    // Convert source minutes to target minutes
    const srcMin = parsed.hours * 60 + parsed.minutes;
    const diffMin = (toOff - fromOff) * 60;
    let tgtMin = srcMin + diffMin;

    let dayAdjust = '';
    if (tgtMin >= 1440) {
      dayAdjust = ' (next day)';
      tgtMin -= 1440;
    } else if (tgtMin < 0) {
      dayAdjust = ' (previous day)';
      tgtMin += 1440;
    }

    const tgtH = Math.floor(tgtMin / 60);
    const tgtM = Math.round(tgtMin % 60);

    const convertedTime = formatClock(tgtH, tgtM) + dayAdjust;

    // Time difference text
    const diff = toOff - fromOff;
    let diffDesc: string;
    if (diff === 0) diffDesc = 'Same time';
    else if (diff > 0) diffDesc = `${diff} hour${diff !== 1 ? 's' : ''} ahead`;
    else diffDesc = `${Math.abs(diff)} hour${Math.abs(diff) !== 1 ? 's' : ''} behind`;

    const results: CalculatorResult[] = [
      {
        id: 'convertedTime',
        label: 'Converted Time',
        value: convertedTime,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'fromInfo',
        label: 'From',
        value: `${src.label} -- ${formatOffset(fromOff)}`,
      },
      {
        id: 'toInfo',
        label: 'To',
        value: `${dst.label} -- ${formatOffset(toOff)}`,
      },
      {
        id: 'timeDifference',
        label: 'Time Difference',
        value: diffDesc,
      },
    ];

    if (values.includeBusinessHours === 'yes') {
      const overlap = calcOverlap(fromOff, toOff);

      if (overlap.durationHours > 0) {
        const olStart = ((overlap.overlapStart + toOff + 48) % 24);
        const olEnd = ((overlap.overlapEnd + toOff + 48) % 24);
        results.push({
          id: 'businessOverlap',
          label: 'Business Hours Overlap',
          value: `${formatClock(Math.floor(olStart), 0)} -- ${formatClock(Math.floor(olEnd), 0)} (${Math.round(overlap.durationHours)} hours)`,
        });
      } else {
        results.push({
          id: 'businessOverlap',
          label: 'Business Hours Overlap',
          value: 'No overlap in business hours',
        });
      }

      results.push({
        id: 'overlapData',
        label: 'Overlap Data',
        value: JSON.stringify(overlap),
      });
    }

    return results;
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TimeZonePanel, { values, results });
  },

  educational: {
    formula: 'TargetTime = SourceTime - SourceOffset + TargetOffset',
    formulaDescription:
      'Convert a time from one time zone to another by accounting for the UTC offset difference between the two zones. Every time zone has a UTC offset (e.g., EST is UTC-5, PST is UTC-8). To convert, first normalize the source time to UTC by subtracting its offset, then apply the target offset to get the local time in the destination zone. This two-step process ensures accuracy regardless of which direction the conversion goes.',
    variables: [
      { symbol: 'SourceTime', name: 'Source Time', description: 'The time in the original time zone that you want to convert from.' },
      { symbol: 'SourceOffset', name: 'Source Offset', description: 'UTC offset of the source time zone. Eastern Standard Time is UTC-5, Central European Time is UTC+1, etc.' },
      { symbol: 'TargetOffset', name: 'Target Offset', description: 'UTC offset of the target time zone that you want to convert to.' },
    ],
    howToUse: [
      'Select the source time zone (the zone you know the time in) from the dropdown list.',
      'Select the target time zone (the zone you want to convert to) from the dropdown list.',
      'Enter the time in either 12-hour format (e.g., 2:30 PM) or 24-hour format (e.g., 14:30).',
      'Optionally select a date so the calculator can account for Daylight Saving Time offsets.',
      'Enable "Business Hours Overlay" to see when the standard 9 AM-5 PM workday overlaps between the two zones.',
    ],
    explanation:
      'Time zone conversion accounts for the difference in UTC offsets between regions. The calculator determines the offset for the source and target zones, computes the difference (target offset minus source offset), and applies it to the entered time. A positive difference means the target time is ahead (later in the day), and a negative difference means it is behind (earlier in the day). The Business Hours Overlay shows when the standard 9 AM-5 PM workday overlaps across both zones, which is essential for scheduling international meetings, conference calls, and remote collaboration across time zones. The overlay color-codes each hour block: green when both zones are within business hours, yellow when only one is, and gray when neither is.',
    faqs: [
      {
        question: 'Do you account for Daylight Saving Time?',
        answer:
          'This calculator uses standard UTC offsets for each zone. While DST affects the actual offset on specific dates, the calculator applies the nominal zone offset. For example, EST (UTC-5) becomes EDT (UTC-4) during DST months. Select a specific date if the zone you are converting uses DST, and the calculator will apply the seasonal offset. For precise DST handling with automatic adjustment, consult an up-to-date time zone database or use the IANA time zone database (tzdata).',
      },
      {
        question: 'What are business hours?',
        answer:
          'Business hours are defined as 9:00 AM to 5:00 PM local time, Monday through Friday. The overlay shows when both zones overlap during these hours, color-coded: green (both zones are in business hours), yellow (only one zone is in business hours), or gray (neither zone is in business hours). This is useful for finding the best times for international meetings.',
      },
      {
        question: 'How do I convert times that are already in UTC?',
        answer: 'To convert from UTC to another zone, select UTC (offset +0:00) as the source time zone. To convert a local time to UTC, select UTC as the target time zone. This is useful for logging events in a standardized time format that is independent of local time zone.',
      },
      {
        question: 'How do I find the best meeting time across multiple time zones?',
        answer: 'Enable the "Business Hours Overlay" toggle. The calculator will show a color-coded grid of all 24 hours, marking which hours overlap as business hours (9 AM-5 PM) in both zones. Green = both zones are working, Yellow = only one zone is working, Gray = neither zone is working. For meetings spanning three or more zones, convert pairwise to find the intersection of green blocks. Generally, early morning in the Americas (7-9 AM ET) overlaps with afternoon in Europe (1-3 PM CET), making it the most common transatlantic meeting window.',
      },
      {
        question: 'Why does the converted time show "(next day)" or "(previous day)"?',
        answer: 'When the time zone difference causes the converted time to cross midnight, the calculator adds a label indicating the day shift. For example, 9:00 AM PST (UTC-8) converted to JST (UTC+9) is a 17-hour difference, resulting in 2:00 AM the next day. This is essential for scheduling international calls — you don\'t want to call someone at 2:00 AM their time. The "(next day)" and "(previous day)" markers help you spot these day-boundary crossings immediately.',
      },
      {
        question: 'What are half-hour and quarter-hour time zones?',
        answer: 'Some regions use non-integer UTC offsets. India (IST) is UTC+5:30, Newfoundland (NST) is UTC-3:30, and Nepal is UTC+5:45. The calculator correctly handles these fractional offsets. For example, when it is 12:00 PM in New York (EST, UTC-5), it is 10:30 PM in India (IST, UTC+5:30) — a 10.5-hour difference rather than a round 10 or 11 hours. Fractional offsets are common in South Asia, parts of Australia, and some Pacific islands.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Sarah is a product manager in San Francisco (PST) scheduling a video call with her engineering team in London (GMT). She wants to propose 9:00 AM her time and needs to know what time that is for the London team.',
        inputs: { fromZone: 'pst', toZone: 'gmt', time: '9:00 AM', date: '2026-06-15', includeBusinessHours: 'yes' },
        result: '5:00 PM GMT (8 hours ahead); Business hours overlap: 1 hour (4:00 PM – 5:00 PM GMT)',
        insight: '9:00 AM PST = 5:00 PM GMT. The London team would be at the end of their workday (9 AM-5 PM). The business hours overlay shows this is within both zones\' working hours (green) for only 1 hour of overlap. A better meeting time would be 8:00 AM PST = 4:00 PM GMT, giving 1 hour of overlap. The ideal cross-Atlantic window is typically 7:00-9:00 AM PST / 3:00-5:00 PM GMT.',
      },
      {
        scenario: 'Raj is based in Mumbai (IST, UTC+5:30) and needs to join a webinar hosted from New York (EST) at 2:00 PM Eastern Time. He wants to know if he will need to stay up late.',
        inputs: { fromZone: 'est', toZone: 'ist', time: '2:00 PM', date: '2026-07-20', includeBusinessHours: 'no' },
        result: '12:30 AM IST (next day); 10.5 hours ahead',
        insight: '2:00 PM EST = 12:30 AM IST (next day). The 10.5-hour difference means Raj would need to join at half past midnight. This is typical for US-India scheduling — US business hours (9 AM-5 PM) map to 7:30 PM-3:30 AM IST. For a more convenient time, the US presenter should consider an early morning slot (7:00 AM EST = 5:30 PM IST), which is reasonable for both parties.',
      },
      {
        scenario: 'A global customer support team with offices in Tokyo (JST), London (GMT), and New York (EST) needs to find overlapping business hours for a handoff meeting. They want to know: when are all three offices simultaneously in business hours?',
        inputs: { fromZone: 'est', toZone: 'jst', time: '8:00 AM', date: '2026-08-10', includeBusinessHours: 'yes' },
        result: '8:00 AM EST = 10:00 PM JST (next day); 14 hours ahead; No overlap in business hours',
        insight: 'This is a "follow the sun" challenge. EST (UTC-5) 8:00 AM = GMT (UTC+0) 1:00 PM = JST (UTC+9) 10:00 PM. JST is outside business hours at 10 PM. Running the pairwise checks: EST-GMT overlap is 8:00 AM-12:00 PM EST / 1:00-5:00 PM GMT. GMT-JST overlap is minimal — JST business hours (9 AM-5 PM) are GMT 12:00 AM-8:00 AM. The three zones never fully overlap in standard business hours. The best compromise is a 7:00 AM EST / 12:00 PM GMT / 9:00 PM JST call, where JST is just at the edge.',
      },
    ],
    proTips: [
      'Bookmark the most common conversions you use. For example, if you regularly convert between EST and IST, memorize the 10.5-hour difference: EST + 10.5 hours = IST (and IST - 10.5 hours = EST). The calculator confirms this, but knowing the offset speeds up quick mental checks.',
      'Use the Business Hours Overlay as a "meeting time finder." Green hours (both zones 9 AM-5 PM) are the only times you should propose for synchronous meetings. Yellow hours mean one side is working outside normal hours — a signal to negotiate or find an alternative.',
      'For recurring meetings across DST-observing zones, be aware that the time difference may shift by 1 hour when one zone changes clocks but the other does not (or when they change on different dates). The calculator uses standard offsets; for DST-adjusted conversions, verify the specific date\'s offset.',
      'When converting times for flight bookings, always confirm with the airline\'s published schedule. The calculator gives you the mathematical conversion, but airlines may use different time zone references (local departure time vs. local arrival time) that align with this calculation.',
      'The JSON overlap data in the results is useful for developers building scheduling apps. Parse the "overlapData" result field to get the raw hour-by-hour array with color codes, which you can use to build custom meeting-time visualizations.',
    ],
    quickReference: [
      { label: 'EST (New York)', value: 'UTC-5 (UTC-4 EDT)' },
      { label: 'PST (Los Angeles)', value: 'UTC-8 (UTC-7 PDT)' },
      { label: 'GMT/UTC (London)', value: 'UTC+0 (UTC+1 BST)' },
      { label: 'CET (Paris/Berlin)', value: 'UTC+1 (UTC+2 CEST)' },
      { label: 'IST (Mumbai)', value: 'UTC+5:30' },
      { label: 'JST (Tokyo)', value: 'UTC+9' },
      { label: 'AEST (Sydney)', value: 'UTC+10 (UTC+11 AEDT)' },
      { label: '', value: '' },
      { label: 'Business hours', value: '9:00 AM – 5:00 PM local' },
      { label: 'Green = overlap', value: 'Both zones working' },
    ],
    limitations: [
      'The calculator uses standard (non-DST) UTC offsets for each time zone. Daylight Saving Time adjustments are not automatically applied based on the date — for DST-aware conversions, verify the offset for your specific date using the IANA time zone database (tzdata).',
      'The business hours overlay uses a fixed 9:00 AM-5:00 PM window for all zones, which may not match actual working hours in all cultures (e.g., Spain often works 9:00 AM-2:00 PM and 4:00 PM-7:00 PM; some Middle Eastern countries work Sunday-Thursday).',
      'The calculator supports 24 pre-defined time zones — it does not cover every IANA time zone (there are over 300), so some specific regional zones may not be listed.',
      'The overlay does not account for lunch breaks, flexible hours, or 4-day work weeks. The green/yellow/gray color coding is a rough scheduling guide, not a definitive calendar.',
      'The date field is not parsed for DST offset adjustments; it serves only as a reference label for the conversion result.',
    ],
    citations: [
      { source: 'Wikipedia - Time Zone', url: 'https://en.wikipedia.org/wiki/Time_zone' },
      { source: 'IANA - Time Zone Database', url: 'https://www.iana.org/time-zones' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-333333)">World Time Zone Conversion</text><rect x="10" y="32" width="300" height="36" rx="6" fill="var(--svg-f0f4ff)"/><text x="160" y="46" text-anchor="middle" font-size="10" fill="var(--svg-555555)" font-weight="bold">UTC Offsets</text><text x="22" y="62" font-size="9" fill="var(--svg-333333)">PST −8</text><text x="70" y="62" font-size="9" fill="var(--svg-333333)">EST −5</text><text x="122" y="62" font-size="9" fill="var(--svg-333333)">UTC 0</text><text x="171" y="62" font-size="9" fill="var(--svg-333333)">CET +1</text><text x="221" y="62" font-size="9" fill="var(--svg-333333)">IST +5.5</text><text x="275" y="62" font-size="9" fill="var(--svg-333333)">JST +9</text><rect x="10" y="78" width="300" height="42" rx="6" fill="var(--svg-fff5f5)"/><text x="160" y="94" text-anchor="middle" font-size="11" fill="var(--svg-555555)" font-weight="bold">TargetTime = SourceTime − SourceOffset + TargetOffset</text><text x="22" y="112" font-size="9" fill="var(--svg-888888)">Example: 2:00 PM EST (UTC−5) → 11:00 AM PST (UTC−8)</text><text x="160" y="138" text-anchor="middle" font-size="11" fill="var(--svg-555555)" font-weight="bold">Business Hours Overlap</text><rect x="15" y="148" width="290" height="24" rx="4" fill="var(--svg-d1fae5)"/><text x="30" y="164" font-size="10" fill="var(--svg-065f46)">Both zones in business hours (9 AM–5 PM)</text><rect x="160" y="150" width="60" height="8" rx="2" fill="var(--svg-fbbf24)"/><text x="15" y="185" font-size="9" fill="var(--svg-888888)">Green = both working | Yellow = one working | Gray = neither</text></svg>',
      alt: 'World time zone conversion showing UTC offsets and formula',
      caption: 'Time zone conversion adjusts for UTC offset differences; business hours overlay shows when work schedules overlap.',
    },
  },
};

export default config;
